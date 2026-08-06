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
  const cloneContract = () =>
    JSON.parse(JSON.stringify(LEVEL0_LAYOUT_CONTRACT)) as typeof LEVEL0_LAYOUT_CONTRACT;
  const polygonArea = (polygon: readonly { x: number; y: number }[]) =>
    Math.abs(
      polygon.reduce((sum, point, index) => {
        const next = polygon[(index + 1) % polygon.length]!;
        return sum + point.x * next.y - next.x * point.y;
      }, 0) / 2
    );
  const loopLength = (points: readonly { x: number; y: number }[]) =>
    points.slice(1).reduce((total, end, index) => {
      const start = points[index]!;
      return total + Math.hypot(end.x - start.x, end.y - start.y);
    }, 0);

  it('uses the approved four-block source contract and canonical 2:1 projection', () => {
    expect(LEVEL0_LAYOUT_CONTRACT.id).toBe('level0-get204-four-block-source-candidate-v1');
    expect(LEVEL0_LAYOUT_CONTRACT.schemaVersion).toBe(3);
    expect(LEVEL0_LAYOUT_CONTRACT.projection).toEqual({
      tileWidth: 64,
      tileHeight: 32,
      orientation: 'isometric-2:1',
    });
    expect(LEVEL0_LAYOUT_CONTRACT.bounds).toEqual([
      { x: 0, y: 0 },
      { x: 58, y: 0 },
      { x: 58, y: 44 },
      { x: 0, y: 44 },
    ]);
  });

  it('passes structural, geometry, stable-ID, and semantic validation', () => {
    expect(validateLevel0LayoutContract(LEVEL0_LAYOUT_CONTRACT)).toEqual([]);
  });

  it('authors exactly three interlocking traversal loops', () => {
    expect(LEVEL0_LAYOUT_CONTRACT.traversalLoops.map(({ id }) => id)).toEqual([
      'loop.public-contact',
      'loop.logistics-service',
      'loop.outer-escape',
    ]);

    const membership = new Map<string, Set<string>>();
    LEVEL0_LAYOUT_CONTRACT.traversalLoops.forEach((loop) => {
      loop.points.forEach((point) => {
        const key = `${point.x}:${point.y}`;
        const loops = membership.get(key) ?? new Set<string>();
        loops.add(loop.id);
        membership.set(key, loops);
      });
    });

    expect([...membership.values()].filter((loops) => loops.size > 1)).toHaveLength(2);
  });

  it('authors public-realm semantics and a bounded drone verification region', () => {
    expect(LEVEL0_LAYOUT_CONTRACT.surfaces.some((surface) => surface.kind === 'sidewalk')).toBe(true);
    expect(LEVEL0_LAYOUT_CONTRACT.surfaces.some((surface) => surface.kind === 'crossing')).toBe(true);
    expect(LEVEL0_LAYOUT_CONTRACT.surfaces.filter((surface) => surface.kind === 'alley')).toHaveLength(3);
    expect(LEVEL0_LAYOUT_CONTRACT.droneRegions).toHaveLength(1);
    expect(LEVEL0_LAYOUT_CONTRACT.droneRegions[0]?.launchAnchorId).toBe('drone.launch');
  });

  it('locks dense named mass across the three mission districts', () => {
    const districtArea = polygonArea(LEVEL0_LAYOUT_CONTRACT.bounds);
    const buildingArea = LEVEL0_LAYOUT_CONTRACT.buildingFootprints.reduce(
      (sum, footprint) => sum + polygonArea(footprint.polygon),
      0
    );
    const footprintIds = LEVEL0_LAYOUT_CONTRACT.buildingFootprints.map(({ id }) => id);

    expect(LEVEL0_LAYOUT_CONTRACT.zones.map(({ id }) => id)).toEqual([
      'zone.safehouse-backstreets',
      'zone.public-transit-commercial',
      'zone.logistics-civic-control',
    ]);
    expect(LEVEL0_LAYOUT_CONTRACT.buildingFootprints).toHaveLength(16);
    expect(buildingArea / districtArea).toBeGreaterThanOrEqual(0.55);
    expect(footprintIds.filter((id) => id.startsWith('cluster.safehouse.'))).toHaveLength(4);
    expect(footprintIds.filter((id) => id.startsWith('cluster.public.'))).toHaveLength(4);
    expect(footprintIds.filter((id) => id.startsWith('cluster.logistics.'))).toHaveLength(4);
    expect(footprintIds.filter((id) => id.startsWith('cluster.service.'))).toHaveLength(4);
    expect(footprintIds.some((id) => id.startsWith('building.'))).toBe(false);
  });

  it('keeps the safehouse threshold compact and its opening actions readable', () => {
    const threshold = LEVEL0_LAYOUT_CONTRACT.surfaces.find(
      (surface) => surface.id === 'walkable.safehouse-threshold'
    )!;
    const boundary = LEVEL0_LAYOUT_CONTRACT.anchors.find(
      (anchor) => anchor.id === 'safehouse.boundary'
    )!;
    const safehouse = LEVEL0_LAYOUT_CONTRACT.buildingFootprints.find(
      (footprint) => footprint.id === 'cluster.safehouse.home'
    )!;
    const entrance = LEVEL0_LAYOUT_CONTRACT.anchors.find(
      (anchor) => anchor.id === 'entrance.safehouse'
    )!;

    expect(polygonArea(threshold.polygon)).toBe(14);
    expect(safehouse.polygon).toEqual([
      { x: 2, y: 32.6 },
      { x: 12, y: 32.6 },
      { x: 12, y: 41.5 },
      { x: 2, y: 41.5 },
    ]);
    expect(entrance.position).toEqual({ x: 13, y: 36.5 });

    [
      'safehouse.spawn',
      'safehouse.departure',
      'contact.lira',
      'interaction.safehouse.wait',
      'interaction.safehouse.rest',
    ].forEach((anchorId) => {
      const anchor = LEVEL0_LAYOUT_CONTRACT.anchors.find((candidate) => candidate.id === anchorId)!;
      expect(Math.hypot(
        anchor.position.x - boundary.position.x,
        anchor.position.y - boundary.position.y
      )).toBeLessThanOrEqual(boundary.radius);
      expect(isPointWalkableWithClearance(LEVEL0_LAYOUT_CONTRACT, anchor.position)).toBe(true);
    });
  });

  it('keeps both logistics approaches and their grounded devices reachable', () => {
    const entranceIds = LEVEL0_LAYOUT_CONTRACT.entrances.map(({ id }) => id);
    expect(entranceIds).toEqual([
      'entrance.logistics.public',
      'entrance.logistics.service',
      'entrance.safehouse',
    ]);
    expect(LEVEL0_LAYOUT_CONTRACT.entrances.slice(0, 2).every(
      ({ buildingId }) => buildingId === 'cluster.logistics.threshold'
    )).toBe(true);

    [
      'entrance.logistics.public',
      'entrance.logistics.service',
      'terminal.camera_loop',
      'terminal.cache_locker',
      'hide.service_recess',
      'hide.maintenance_bay',
    ].forEach((anchorId) => {
      const anchor = LEVEL0_LAYOUT_CONTRACT.anchors.find((candidate) => candidate.id === anchorId)!;
      expect(isPointWalkableWithClearance(LEVEL0_LAYOUT_CONTRACT, anchor.position)).toBe(true);
    });
  });

  it('keeps the outer loop within the two-to-three-minute traversal target', () => {
    const loop = LEVEL0_LAYOUT_CONTRACT.traversalLoops.find(
      (candidate) => candidate.id === 'loop.outer-escape'
    )!;
    const seconds = loopLength(loop.points) / LEVEL0_DIRECT_MOVEMENT_SPEED;
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
    const firstFootprintId = occluderDrift.buildingFootprints[0]!.id;
    occluderDrift.occluders[0]![0]!.x += 1;
    expect(validateLevel0LayoutContract(occluderDrift)).toContain(
      `occluder 0 does not match building footprint ${firstFootprintId}`
    );
  });

  it('rejects overlapping or out-of-district rectangular building mass', () => {
    const overlap = cloneContract();
    const firstId = overlap.buildingFootprints[0]!.id;
    const secondId = overlap.buildingFootprints[1]!.id;
    overlap.buildingFootprints[1]!.polygon = overlap.buildingFootprints[0]!.polygon.map(
      (point) => ({ ...point })
    );
    overlap.occluders[1] = overlap.buildingFootprints[1]!.polygon.map((point) => ({ ...point }));
    expect(validateLevel0LayoutContract(overlap)).toContain(
      `building footprints ${firstId} and ${secondId} overlap`
    );

    const outside = cloneContract();
    const outsideId = outside.buildingFootprints[0]!.id;
    outside.buildingFootprints[0]!.polygon[0]!.x = -1;
    outside.occluders[0] = outside.buildingFootprints[0]!.polygon.map((point) => ({ ...point }));
    expect(validateLevel0LayoutContract(outside)).toContain(
      `building footprint ${outsideId} leaves district bounds`
    );
  });

  it('rejects overlapping custom polygon footprints', () => {
    const overlap = cloneContract();
    overlap.buildingFootprints.push({
      id: 'building.test.custom-overlap',
      function: 'test-only',
      polygon: [
        { x: 3, y: 34 },
        { x: 5, y: 34 },
        { x: 6, y: 36 },
        { x: 4, y: 38 },
        { x: 3, y: 36 },
      ],
      height: 1,
    });
    overlap.occluders.push(
      overlap.buildingFootprints[overlap.buildingFootprints.length - 1]!.polygon
    );

    expect(validateLevel0LayoutContract(overlap)).toContain(
      'building footprints cluster.safehouse.home and building.test.custom-overlap overlap'
    );
  });

  it('rejects positive-area rectangle overlap when aligned edges hide vertex containment', () => {
    const overlap = cloneContract();
    overlap.buildingFootprints.push({
      id: 'building.test.shifted-overlap',
      function: 'test-only',
      polygon: [
        { x: 1.5, y: 34 },
        { x: 12.5, y: 34 },
        { x: 12.5, y: 35 },
        { x: 1.5, y: 35 },
      ],
      height: 1,
    });
    overlap.occluders.push(
      overlap.buildingFootprints[overlap.buildingFootprints.length - 1]!.polygon
    );

    expect(validateLevel0LayoutContract(overlap)).toContain(
      'building footprints cluster.safehouse.home and building.test.shifted-overlap overlap'
    );
  });

  it('validates required anchors and loop corridors with player collision clearance', () => {
    const pinchedLoop = cloneContract();
    pinchedLoop.buildingFootprints.push({
      id: 'building.test.loop-pinch',
      function: 'test-only',
      polygon: [
        { x: 15.2, y: 25 },
        { x: 15.8, y: 25 },
        { x: 15.8, y: 26 },
        { x: 15.2, y: 26 },
      ],
      height: 1,
    });
    pinchedLoop.occluders.push(
      pinchedLoop.buildingFootprints[pinchedLoop.buildingFootprints.length - 1]!.polygon
    );
    expect(validateLevel0LayoutContract(pinchedLoop)).toContain(
      'loop loop.public-contact crosses blocked geometry'
    );

    const pinchedAnchor = cloneContract();
    pinchedAnchor.anchors.find((anchor) => anchor.id === 'contact.lira')!.position = {
      x: 10,
      y: 29,
    };
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
        { x: 15.45, y: 25.45 },
        { x: 15.55, y: 25.45 },
        { x: 15.55, y: 25.55 },
        { x: 15.45, y: 25.55 },
      ],
      height: 1,
    });
    subSamplePinch.occluders.push(
      subSamplePinch.buildingFootprints[subSamplePinch.buildingFootprints.length - 1]!.polygon
    );

    expect(validateLevel0LayoutContract(subSamplePinch)).toContain(
      'loop loop.public-contact crosses blocked geometry'
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
