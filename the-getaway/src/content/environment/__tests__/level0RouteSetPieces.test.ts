import { describe, expect, it } from '@jest/globals';
import { buildWorldResources } from '../../../game/world/worldMap';
import {
  LEVEL0_ENVIRONMENT_PROP_FRAMES,
  LEVEL0_ENVIRONMENT_SURFACE_FRAMES,
} from '../atlasFrames';
import {
  LEVEL0_GUIDED_ROUTE_BEACONS,
  LEVEL0_ROUTE_SET_PIECES,
  LEVEL0_ROUTE_SURFACE_DECALS,
  resolveLevel0RouteBeaconsForStage,
} from '../level0RouteSetPieces';

const positionKey = (position: { x: number; y: number }): string =>
  `${position.x}:${position.y}`;

describe('level0RouteSetPieces', () => {
  it('keeps rejected decorative route dressing out of the live Level 0 path', () => {
    expect(LEVEL0_ROUTE_SET_PIECES).toEqual([]);
    expect(LEVEL0_ROUTE_SURFACE_DECALS).toEqual([]);
    expect(LEVEL0_GUIDED_ROUTE_BEACONS).toEqual([]);
  });

  it('keeps any future role-bearing Level 0 props on open gameplay tiles', () => {
    const { slumsArea } = buildWorldResources({ locale: 'en' });
    const occupied = new Set<string>();

    slumsArea.buildings?.forEach((building) => occupied.add(positionKey(building.door)));
    slumsArea.entities.npcs.forEach((npc) => occupied.add(positionKey(npc.position)));
    slumsArea.entities.enemies.forEach((enemy) => occupied.add(positionKey(enemy.position)));
    slumsArea.entities.items.forEach((item) => {
      if (item.position) {
        occupied.add(positionKey(item.position));
      }
    });

    const pieceIds = new Set<string>();
    const piecePositions = new Set<string>();

    LEVEL0_ROUTE_SET_PIECES.forEach((piece) => {
      expect(pieceIds.has(piece.id)).toBe(false);
      pieceIds.add(piece.id);
      expect(piece.frameId in LEVEL0_ENVIRONMENT_PROP_FRAMES).toBe(true);

      const key = positionKey(piece.position);
      expect(piecePositions.has(key)).toBe(false);
      piecePositions.add(key);
      expect(occupied.has(key)).toBe(false);
      expect(slumsArea.tiles[piece.position.y]?.[piece.position.x]?.isWalkable).toBe(true);
    });
  });

  it('keeps any future role-bearing Level 0 route decals on walkable surfaces', () => {
    const { slumsArea } = buildWorldResources({ locale: 'en' });
    const decalIds = new Set<string>();

    LEVEL0_ROUTE_SURFACE_DECALS.forEach((decal) => {
      expect(decalIds.has(decal.id)).toBe(false);
      decalIds.add(decal.id);
      expect(decal.frameId in LEVEL0_ENVIRONMENT_SURFACE_FRAMES).toBe(true);
      expect(slumsArea.tiles[decal.position.y]?.[decal.position.x]?.isWalkable).toBe(true);
    });
  });

  it('keeps any future active route beacons sparse, stage-scoped, and walkable', () => {
    const { slumsArea } = buildWorldResources({ locale: 'en' });
    const beaconIds = new Set<string>();

    LEVEL0_GUIDED_ROUTE_BEACONS.forEach((beacon) => {
      expect(beaconIds.has(beacon.id)).toBe(false);
      beaconIds.add(beacon.id);
      expect(beacon.stages.length).toBeGreaterThan(0);
      expect(slumsArea.tiles[beacon.position.y]?.[beacon.position.x]?.isWalkable).toBe(true);
    });

    expect(resolveLevel0RouteBeaconsForStage('naila-start')).toEqual([]);
    expect(resolveLevel0RouteBeaconsForStage('brant-start')).toEqual([]);
    expect(resolveLevel0RouteBeaconsForStage('complete')).toEqual([]);
  });
});
