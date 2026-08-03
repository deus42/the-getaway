import { LEVEL0_LAYOUT_CONTRACT } from '../../../../content/levels/level0/layoutContract';
import {
  findDisconnectedRequiredAnchors,
  isPointWalkable,
  validateLevel0LayoutContract,
} from '../validator';
import { LEVEL0_DIRECT_MOVEMENT_SPEED } from '../../movement/directMovement';

const REQUIRED_ANCHOR_IDS = [
  'safehouse.boundary',
  'safehouse.spawn',
  'safehouse.departure',
  'contact.lira',
  'contact.naila',
  'contact.brant',
  'entrance.logistics.public',
  'entrance.logistics.service',
  'terminal.camera_loop',
  'terminal.cache_locker',
  'terminal.outbound_transit',
  'drone.launch',
  'hide.service_recess',
  'hide.maintenance_bay',
  'hide.transit_structure',
  'blend.delivery_activity',
  'blend.public_queue',
  'objective.medkits',
  'objective.manifest',
] as const;

describe('Level0LayoutContract', () => {
  const cloneContract = () => JSON.parse(JSON.stringify(LEVEL0_LAYOUT_CONTRACT)) as typeof LEVEL0_LAYOUT_CONTRACT;
  const polygonArea = (polygon: readonly { x: number; y: number }[]) =>
    Math.abs(
      polygon.reduce((sum, point, index) => {
        const next = polygon[(index + 1) % polygon.length]!;
        return sum + point.x * next.y - next.x * point.y;
      }, 0) / 2
    );

  it('uses the canonical 2:1 projection and a replaceable authored schema', () => {
    expect(LEVEL0_LAYOUT_CONTRACT.id).toBe('level0-tokyo-greybox-v2');
    expect(LEVEL0_LAYOUT_CONTRACT.schemaVersion).toBe(2);
    expect(LEVEL0_LAYOUT_CONTRACT.projection).toEqual({
      tileWidth: 64,
      tileHeight: 32,
      orientation: 'isometric-2:1',
    });
    expect(LEVEL0_LAYOUT_CONTRACT.bounds).not.toEqual([
      { x: 0, y: 0 },
      { x: 96, y: 0 },
      { x: 96, y: 72 },
      { x: 0, y: 72 },
    ]);
  });

  it('passes structural, geometry, stable-ID, and semantic validation', () => {
    expect(validateLevel0LayoutContract(LEVEL0_LAYOUT_CONTRACT)).toEqual([]);
  });

  it('authors exactly three interlocking traversal loops', () => {
    expect(LEVEL0_LAYOUT_CONTRACT.traversalLoops).toHaveLength(3);

    const membership = new Map<string, Set<string>>();
    LEVEL0_LAYOUT_CONTRACT.traversalLoops.forEach((loop) => {
      loop.points.forEach((point) => {
        const key = `${point.x}:${point.y}`;
        const loops = membership.get(key) ?? new Set<string>();
        loops.add(loop.id);
        membership.set(key, loops);
      });
    });

    const sharedJunctions = [...membership.values()].filter((loops) => loops.size > 1);
    expect(sharedJunctions.length).toBeGreaterThanOrEqual(2);
  });

  it('authors public-realm semantics and a bounded drone verification region', () => {
    expect(LEVEL0_LAYOUT_CONTRACT.surfaces.some((surface) => surface.kind === 'sidewalk')).toBe(true);
    expect(LEVEL0_LAYOUT_CONTRACT.surfaces.some((surface) => surface.kind === 'crossing')).toBe(true);
    expect(LEVEL0_LAYOUT_CONTRACT.droneRegions).toHaveLength(1);
    expect(LEVEL0_LAYOUT_CONTRACT.droneRegions[0]?.launchAnchorId).toBe('drone.launch');
  });

  it('authors city-scale street bands and building mass instead of a sparse board', () => {
    const districtArea = polygonArea(LEVEL0_LAYOUT_CONTRACT.bounds);
    const buildingArea = LEVEL0_LAYOUT_CONTRACT.buildingFootprints.reduce(
      (sum, footprint) => sum + polygonArea(footprint.polygon),
      0
    );
    const plazaAreas = LEVEL0_LAYOUT_CONTRACT.surfaces
      .filter((surface) => surface.kind === 'plaza')
      .map((surface) => polygonArea(surface.polygon));
    const roadBandWidths = LEVEL0_LAYOUT_CONTRACT.surfaces
      .filter((surface) => surface.kind === 'road')
      .map((surface) => {
        const xs = surface.polygon.map((point) => point.x);
        const ys = surface.polygon.map((point) => point.y);
        return Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
      });
    const rectangleBounds = LEVEL0_LAYOUT_CONTRACT.buildingFootprints.map((footprint) => {
      const xs = footprint.polygon.map((point) => point.x);
      const ys = footprint.polygon.map((point) => point.y);
      return {
        id: footprint.id,
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
      };
    });
    const attachedMass = new Set<string>();
    rectangleBounds.forEach((left, index) => {
      rectangleBounds.slice(index + 1).forEach((right) => {
        const overlapsOrTouchesX = Math.min(left.maxX, right.maxX) >= Math.max(left.minX, right.minX);
        const overlapsOrTouchesY = Math.min(left.maxY, right.maxY) >= Math.max(left.minY, right.minY);
        const touchesEdge =
          (Math.abs(left.maxX - right.minX) < 0.0001 || Math.abs(right.maxX - left.minX) < 0.0001) && overlapsOrTouchesY ||
          (Math.abs(left.maxY - right.minY) < 0.0001 || Math.abs(right.maxY - left.minY) < 0.0001) && overlapsOrTouchesX;
        if (touchesEdge) {
          attachedMass.add(left.id);
          attachedMass.add(right.id);
        }
      });
    });

    expect(plazaAreas.length).toBeGreaterThanOrEqual(3);
    expect(roadBandWidths).toHaveLength(8);
    expect(buildingArea / districtArea).toBeGreaterThanOrEqual(0.27);
    expect(Math.max(...plazaAreas)).toBeLessThanOrEqual(120);
    expect(Math.min(...roadBandWidths)).toBeGreaterThanOrEqual(3.5);
    expect(Math.max(...roadBandWidths)).toBeLessThanOrEqual(4);
    expect(attachedMass.size).toBeGreaterThanOrEqual(8);
  });

  it('keeps the outer loop within the two-to-three-minute traversal target', () => {
    const loop = LEVEL0_LAYOUT_CONTRACT.traversalLoops.find((candidate) => candidate.id === 'loop.outer')!;
    const length = loop.points.slice(1).reduce((total, end, index) => {
      const start = loop.points[index]!;
      return total + Math.hypot(end.x - start.x, end.y - start.y);
    }, 0);
    const seconds = length / LEVEL0_DIRECT_MOVEMENT_SPEED;
    expect(seconds).toBeGreaterThanOrEqual(120);
    expect(seconds).toBeLessThanOrEqual(180);
  });

  it('rejects drift in loop interlocks, entrance anchors, and occluder geometry', () => {
    const detached = cloneContract();
    detached.traversalLoops[2]!.points = [
      { x: 65, y: 42 }, { x: 71, y: 42 }, { x: 71, y: 48 }, { x: 65, y: 48 }, { x: 65, y: 42 },
    ];
    expect(validateLevel0LayoutContract(detached)).toContain('traversal loops must interlock');

    const entranceDrift = cloneContract();
    entranceDrift.anchors.find((anchor) => anchor.id === 'entrance.logistics.public')!.position.x += 1;
    expect(validateLevel0LayoutContract(entranceDrift)).toContain(
      'entrance entrance.logistics.public anchor position does not match entrance metadata'
    );

    const occluderDrift = cloneContract();
    occluderDrift.occluders[0]![0]!.x += 1;
    expect(validateLevel0LayoutContract(occluderDrift)).toContain(
      'occluder 0 does not match building footprint building.public_market'
    );
  });

  it('rejects overlapping or out-of-district rectangular building mass', () => {
    const overlap = cloneContract();
    overlap.buildingFootprints[1]!.polygon = overlap.buildingFootprints[0]!.polygon.map(
      (point) => ({ ...point })
    );
    overlap.occluders[1] = overlap.buildingFootprints[1]!.polygon.map((point) => ({ ...point }));
    expect(validateLevel0LayoutContract(overlap)).toContain(
      'building footprints building.public_market and building.civic_north overlap'
    );

    const outside = cloneContract();
    outside.buildingFootprints[0]!.polygon[0]!.x = -1;
    outside.occluders[0] = outside.buildingFootprints[0]!.polygon.map((point) => ({ ...point }));
    expect(validateLevel0LayoutContract(outside)).toContain(
      'building footprint building.public_market leaves district bounds'
    );
  });

  it('rejects overlapping custom polygon footprints', () => {
    const overlap = cloneContract();
    overlap.buildingFootprints.push({
      id: 'building.test.custom-overlap',
      function: 'test-only',
      polygon: [
        { x: 10, y: 10 },
        { x: 20, y: 10 },
        { x: 21, y: 18 },
        { x: 16, y: 24 },
        { x: 10, y: 18 },
      ],
      height: 1,
    });
    overlap.occluders.push(
      overlap.buildingFootprints[overlap.buildingFootprints.length - 1]!.polygon
    );

    expect(validateLevel0LayoutContract(overlap)).toContain(
      'building footprints building.public_market and building.test.custom-overlap overlap'
    );
  });

  it('rejects positive-area rectangle overlap when aligned edges hide vertex containment', () => {
    const overlap = cloneContract();
    overlap.buildingFootprints.push({
      id: 'building.test.shifted-overlap',
      function: 'test-only',
      polygon: [
        { x: 10.5, y: 9.5 },
        { x: 23.5, y: 9.5 },
        { x: 23.5, y: 25.5 },
        { x: 10.5, y: 25.5 },
      ],
      height: 1,
    });
    overlap.occluders.push(
      overlap.buildingFootprints[overlap.buildingFootprints.length - 1]!.polygon
    );

    expect(validateLevel0LayoutContract(overlap)).toContain(
      'building footprints building.public_market and building.test.shifted-overlap overlap'
    );
  });

  it('validates required anchors and loop corridors with the player collision clearance', () => {
    const pinchedLoop = cloneContract();
    pinchedLoop.buildingFootprints.push({
      id: 'building.test.loop-pinch',
      function: 'test-only',
      polygon: [
        { x: 7.2, y: 9 },
        { x: 8.8, y: 9 },
        { x: 8.8, y: 28 },
        { x: 7.2, y: 28 },
      ],
      height: 1,
    });
    pinchedLoop.occluders.push(
      pinchedLoop.buildingFootprints[pinchedLoop.buildingFootprints.length - 1]!.polygon
    );
    expect(validateLevel0LayoutContract(pinchedLoop)).toContain(
      'loop loop.outer crosses blocked geometry'
    );

    const pinchedAnchor = cloneContract();
    pinchedAnchor.anchors.find((anchor) => anchor.id === 'contact.lira')!.position.y = 25.6;
    expect(validateLevel0LayoutContract(pinchedAnchor)).toContain(
      'required anchor contact.lira is not on walkable geometry'
    );
  });

  it('samples loop corridors at the shared reachability resolution', () => {
    const subSamplePinch = cloneContract();
    subSamplePinch.buildingFootprints.push({
      id: 'building.test.subsample-loop-pinch',
      function: 'test-only',
      polygon: [
        { x: 7.45, y: 6.9 },
        { x: 7.55, y: 6.9 },
        { x: 7.55, y: 7.1 },
        { x: 7.45, y: 7.1 },
      ],
      height: 1,
    });
    subSamplePinch.occluders.push(
      subSamplePinch.buildingFootprints[subSamplePinch.buildingFootprints.length - 1]!.polygon
    );

    expect(validateLevel0LayoutContract(subSamplePinch)).toContain(
      'loop loop.outer crosses blocked geometry'
    );
  });

  it('contains every mandatory gameplay anchor on walkable geometry', () => {
    const anchors = new Map(
      LEVEL0_LAYOUT_CONTRACT.anchors.map((anchor) => [anchor.id, anchor])
    );

    REQUIRED_ANCHOR_IDS.forEach((id) => {
      const anchor = anchors.get(id);
      expect(anchor).toBeDefined();
      expect(isPointWalkable(LEVEL0_LAYOUT_CONTRACT, anchor!.position)).toBe(true);
    });
  });

  it('keeps every required anchor in the spawn-connected walkable component', () => {
    expect(
      findDisconnectedRequiredAnchors(
        LEVEL0_LAYOUT_CONTRACT,
        'safehouse.spawn',
        REQUIRED_ANCHOR_IDS
      )
    ).toEqual([]);
  });
});
