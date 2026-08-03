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
  it('uses the canonical 2:1 projection and a replaceable authored schema', () => {
    expect(LEVEL0_LAYOUT_CONTRACT.id).toBe('level0-tokyo-greybox-v1');
    expect(LEVEL0_LAYOUT_CONTRACT.schemaVersion).toBe(1);
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
