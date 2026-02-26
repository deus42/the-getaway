import { describe, expect, it } from '@jest/globals';
import { buildWorldResources } from '../worldMap';

describe('world map surface semantics', () => {
  it('tags roads, intersections, and sidewalks with explicit surface metadata', () => {
    const { slumsArea } = buildWorldResources({ locale: 'en' });

    const intersection = slumsArea.tiles[20]?.[24];
    expect(intersection?.surfaceKind).toBe('crosswalk');
    expect(intersection?.surfaceAxis).toBe('intersection');

    const avenue = slumsArea.tiles[10]?.[24];
    expect(avenue?.surfaceKind).toBe('road');
    expect(avenue?.surfaceAxis).toBe('avenue');

    const street = slumsArea.tiles[20]?.[10];
    expect(street?.surfaceKind).toBe('road');
    expect(street?.surfaceAxis).toBe('street');

    const sidewalk = slumsArea.tiles[10]?.[23];
    expect(sidewalk?.surfaceKind).toBe('sidewalk');
  });

  it('keeps ESB footprint tight while preserving a walkable perimeter ring', () => {
    const { slumsArea } = buildWorldResources({ locale: 'en' });
    const esb = slumsArea.buildings?.find((building) => building.id === 'block_2_2');
    expect(esb).toBeDefined();
    if (!esb) {
      return;
    }

    const width = esb.footprint.to.x - esb.footprint.from.x + 1;
    const height = esb.footprint.to.y - esb.footprint.from.y + 1;
    expect(width).toBe(15);
    expect(height).toBe(10);
    expect(esb.door.y).toBe(esb.footprint.to.y);
    expect(esb.door.x).toBeGreaterThan(esb.footprint.from.x);
    expect(esb.door.x).toBeLessThan(esb.footprint.to.x);

    const interiorSample = slumsArea.tiles[esb.footprint.from.y + 1]?.[esb.footprint.from.x + 1];
    expect(interiorSample?.isWalkable).toBe(false);

    const perimeter: Array<{ x: number; y: number }> = [];
    for (let x = esb.footprint.from.x - 1; x <= esb.footprint.to.x + 1; x += 1) {
      perimeter.push({ x, y: esb.footprint.from.y - 1 });
      perimeter.push({ x, y: esb.footprint.to.y + 1 });
    }
    for (let y = esb.footprint.from.y; y <= esb.footprint.to.y; y += 1) {
      perimeter.push({ x: esb.footprint.from.x - 1, y });
      perimeter.push({ x: esb.footprint.to.x + 1, y });
    }

    const inBounds = perimeter.filter(
      ({ x, y }) => y >= 0 && y < slumsArea.height && x >= 0 && x < slumsArea.width
    );
    const blocked = inBounds.filter(({ x, y }) => !slumsArea.tiles[y]?.[x]?.isWalkable);
    expect(blocked).toEqual([]);
  });

  it('keeps Firebrand Juno inside map bounds so her quest is discoverable', () => {
    const { slumsArea } = buildWorldResources({ locale: 'en' });
    const juno = slumsArea.entities.npcs.find(
      (npc) => npc.dialogueId === 'npc_firebrand_juno'
    );

    expect(juno).toBeDefined();
    if (!juno) {
      return;
    }

    expect(juno.position.x).toBeGreaterThanOrEqual(0);
    expect(juno.position.x).toBeLessThan(slumsArea.width);
    expect(juno.position.y).toBeGreaterThanOrEqual(0);
    expect(juno.position.y).toBeLessThan(slumsArea.height);
    expect(slumsArea.tiles[juno.position.y]?.[juno.position.x]?.isWalkable).toBe(
      true
    );
  });
});
