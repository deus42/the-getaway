import { LEVEL0_LAYOUT_CONTRACT } from '../../../../content/levels/level0/layoutContract';
import {
  findDisconnectedRequiredAnchors,
  isPointWalkable,
  isPointWalkableWithClearance,
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
    expect(LEVEL0_LAYOUT_CONTRACT.id).toBe('level0-tokyo-greybox-v3');
    expect(LEVEL0_LAYOUT_CONTRACT.schemaVersion).toBe(2);
    expect(LEVEL0_LAYOUT_CONTRACT.projection).toEqual({
      tileWidth: 64,
      tileHeight: 32,
      orientation: 'isometric-2:1',
    });
    expect(LEVEL0_LAYOUT_CONTRACT.bounds).toEqual([
      { x: 0, y: 0 },
      { x: 84, y: 0 },
      { x: 84, y: 60 },
      { x: 0, y: 60 },
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
    const buildingAreas = LEVEL0_LAYOUT_CONTRACT.buildingFootprints.map((footprint) =>
      polygonArea(footprint.polygon)
    );
    const buildingArea = buildingAreas.reduce((sum, area) => sum + area, 0);
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
    expect(plazaAreas.length).toBeGreaterThanOrEqual(3);
    expect(roadBandWidths).toHaveLength(8);
    expect(LEVEL0_LAYOUT_CONTRACT.buildingFootprints).toHaveLength(9);
    expect(buildingArea / districtArea).toBeGreaterThanOrEqual(0.27);
    expect(Math.min(...buildingAreas)).toBeGreaterThanOrEqual(80);
    expect(Math.max(...plazaAreas)).toBeLessThanOrEqual(120);
    expect(Math.min(...roadBandWidths)).toBeGreaterThanOrEqual(3.5);
    expect(Math.max(...roadBandWidths)).toBeLessThanOrEqual(4);
    const footprintIds = LEVEL0_LAYOUT_CONTRACT.buildingFootprints.map(
      (footprint) => footprint.id
    );
    [
      'building.public_arcade_west',
      'building.safehouse_annex',
      'building.service_frontage',
    ].forEach((retiredId) => expect(footprintIds).not.toContain(retiredId));
  });

  it('keeps the outdoor safehouse compact and immediately legible from spawn', () => {
    const court = LEVEL0_LAYOUT_CONTRACT.surfaces.find(
      (surface) => surface.id === 'surface.safehouse.court'
    )!;
    const spawn = LEVEL0_LAYOUT_CONTRACT.anchors.find(
      (anchor) => anchor.id === 'safehouse.spawn'
    )!;
    const entrance = LEVEL0_LAYOUT_CONTRACT.anchors.find(
      (anchor) => anchor.id === 'entrance.safehouse'
    )!;
    const safehouse = LEVEL0_LAYOUT_CONTRACT.buildingFootprints.find(
      (footprint) => footprint.id === 'building.safehouse'
    )!;
    expect(safehouse.polygon).toEqual([
      { x: 9.5, y: 33 },
      { x: 22.5, y: 33 },
      { x: 22.5, y: 45 },
      { x: 9.5, y: 45 },
    ]);
    expect(court.polygon).toEqual([
      { x: 10, y: 45 },
      { x: 19, y: 45 },
      { x: 19, y: 51 },
      { x: 10, y: 51 },
    ]);
    expect(polygonArea(court.polygon)).toBeLessThanOrEqual(60);
    expect(Math.hypot(
      spawn.position.x - entrance.position.x,
      spawn.position.y - entrance.position.y
    )).toBeLessThanOrEqual(2);

    const boundary = LEVEL0_LAYOUT_CONTRACT.anchors.find(
      (anchor) => anchor.id === 'safehouse.boundary'
    )!;
    const ownedAnchorIds = [
      'safehouse.spawn',
      'safehouse.departure',
      'entrance.safehouse',
      'terminal.outbound_transit',
      'interaction.safehouse.wait',
      'interaction.safehouse.rest',
    ] as const;
    ownedAnchorIds.forEach((anchorId) => {
      const candidate = LEVEL0_LAYOUT_CONTRACT.anchors.find(
        (anchor) => anchor.id === anchorId
      )!;
      expect(Math.hypot(
        candidate.position.x - boundary.position.x,
        candidate.position.y - boundary.position.y
      )).toBeLessThanOrEqual(boundary.radius);
    });

    const actionApproaches = [
      { action: 'depart', position: { x: 18, y: 51 } },
      { action: 'outbound-transit', position: { x: 14, y: 46 } },
      { action: 'wait', position: { x: 18, y: 48 } },
      { action: 'rest', position: { x: 15, y: 48 } },
    ] as const;
    actionApproaches.forEach(({ position: approach }) => {
      expect(isPointWalkableWithClearance(LEVEL0_LAYOUT_CONTRACT, approach)).toBe(true);
      expect(Math.hypot(
        approach.x - boundary.position.x,
        approach.y - boundary.position.y
      )).toBeLessThanOrEqual(boundary.radius);
    });
  });

  it('authors one full-scale transit service mass beside its compact hiding plaza', () => {
    const transitServices = LEVEL0_LAYOUT_CONTRACT.buildingFootprints.find(
      (footprint) => footprint.id === 'building.transit_services'
    )!;
    const transitPlaza = LEVEL0_LAYOUT_CONTRACT.surfaces.find(
      (surface) => surface.id === 'surface.transit.plaza'
    )!;
    const hidingAnchor = LEVEL0_LAYOUT_CONTRACT.anchors.find(
      (anchor) => anchor.id === 'hide.transit_structure'
    )!;

    expect(transitServices.polygon).toEqual([
      { x: 48, y: 41.5 },
      { x: 57, y: 41.5 },
      { x: 57, y: 51 },
      { x: 48, y: 51 },
    ]);
    expect(transitPlaza.polygon).toEqual([
      { x: 44.5, y: 41.5 },
      { x: 48, y: 41.5 },
      { x: 48, y: 51 },
      { x: 44.5, y: 51 },
    ]);
    expect(hidingAnchor.position).toEqual({ x: 46.25, y: 45 });
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
