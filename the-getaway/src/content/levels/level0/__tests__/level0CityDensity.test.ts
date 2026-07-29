import { describe, expect, it } from '@jest/globals';
import { getCameraConfigsForZone } from '../../../cameraConfigs';
import type { Position } from '../../../../game/interfaces/types';
import { buildWorldResources } from '../../../../game/world/worldMap';
import { findPath } from '../../../../game/world/pathfinding';
import { getLevel0Content } from '..';
import { level0EnglishContent } from '../locales/en';

const MAP_TILE_COUNT = 96 * 72;
const MIN_CITY_COVERAGE = 0.45;
const MAX_CITY_COVERAGE = 0.52;
const STANDARD_BLOCK_SETBACK_TILES = 2;

const footprintTileCount = (footprint: {
  from: { x: number; y: number };
  to: { x: number; y: number };
}): number =>
  (footprint.to.x - footprint.from.x + 1) *
  (footprint.to.y - footprint.from.y + 1);

const footprintContains = (
  footprint: {
    from: { x: number; y: number };
    to: { x: number; y: number };
  },
  x: number,
  y: number
): boolean =>
  x >= footprint.from.x &&
  x <= footprint.to.x &&
  y >= footprint.from.y &&
  y <= footprint.to.y;

describe('Level 0 city density', () => {
  it.each(['en', 'uk'] as const)(
    'keeps %s building mass within the route-safe urban coverage target',
    (locale) => {
      const buildings = getLevel0Content(locale).buildingDefinitions;
      const occupiedTiles = buildings.reduce(
        (total, building) => total + footprintTileCount(building.footprint),
        0
      );
      const coverage = occupiedTiles / MAP_TILE_COUNT;

      expect(buildings).toHaveLength(9);
      expect(coverage).toBeGreaterThanOrEqual(MIN_CITY_COVERAGE);
      expect(coverage).toBeLessThanOrEqual(MAX_CITY_COVERAGE);
    }
  );

  it('uses a two-tile pedestrian setback for standard blocks', () => {
    const sourceById = new Map(
      level0EnglishContent.buildingDefinitions.map((building) => [building.id, building])
    );
    const runtimeBuildings = getLevel0Content('en').buildingDefinitions.filter(
      (building) => building.id !== 'block_1_1'
    );

    runtimeBuildings.forEach((building) => {
      const source = sourceById.get(building.id);

      expect(source).toBeDefined();
      expect(building.footprint).toEqual({
        from: {
          x: source!.footprint.from.x + STANDARD_BLOCK_SETBACK_TILES,
          y: source!.footprint.from.y + STANDARD_BLOCK_SETBACK_TILES,
        },
        to: {
          x: source!.footprint.to.x - STANDARD_BLOCK_SETBACK_TILES,
          y: source!.footprint.to.y - STANDARD_BLOCK_SETBACK_TILES,
        },
      });
      expect(building.door.y).toBe(building.footprint.to.y);
    });
  });

  it('uses the full two-tile-setback parcel for the ESB compound', () => {
    const source = level0EnglishContent.buildingDefinitions.find(
      (building) => building.id === 'block_1_1'
    );
    const runtime = getLevel0Content('en').buildingDefinitions.find(
      (building) => building.id === 'block_1_1'
    );

    expect(source).toBeDefined();
    expect(runtime).toBeDefined();
    expect(runtime!.footprint).toEqual({
      from: {
        x: source!.footprint.from.x + STANDARD_BLOCK_SETBACK_TILES,
        y: source!.footprint.from.y + STANDARD_BLOCK_SETBACK_TILES,
      },
      to: {
        x: source!.footprint.to.x - STANDARD_BLOCK_SETBACK_TILES,
        y: source!.footprint.to.y - STANDARD_BLOCK_SETBACK_TILES,
      },
    });
    expect(runtime!.door.y).toBe(runtime!.footprint.to.y);
  });

  it('keeps the authored avenue and street cores outside every footprint', () => {
    const buildings = getLevel0Content('en').buildingDefinitions;
    const avenueXs = [24, 25, 26, 60, 61, 62];
    const streetYs = [20, 21, 44, 45];

    buildings.forEach((building) => {
      avenueXs.forEach((x) => {
        for (let y = 0; y < 72; y += 1) {
          expect(footprintContains(building.footprint, x, y)).toBe(false);
        }
      });
      streetYs.forEach((y) => {
        for (let x = 0; x < 96; x += 1) {
          expect(footprintContains(building.footprint, x, y)).toBe(false);
        }
      });
    });
  });

  it('keeps every entrance and fixed surveillance anchor on the walkable street network', () => {
    const content = getLevel0Content('en');
    const area = buildWorldResources({ locale: 'en' }).slumsArea;
    const fixedCameraPositions = getCameraConfigsForZone(content.world.zoneId)
      .filter((camera) => camera.type !== 'drone')
      .map((camera) => camera.position);

    [...content.buildingDefinitions.map((building) => building.door), ...fixedCameraPositions]
      .forEach((position) => {
        expect(area.tiles[position.y]?.[position.x]?.isWalkable).toBe(true);
      });
  });

  it('keeps the complete Lira, Naila, and Brant route connected', () => {
    const area = buildWorldResources({ locale: 'en' }).slumsArea;
    const contactPosition = (dialogueId: string): Position => {
      const contact = area.entities.npcs.find((npc) => npc.dialogueId === dialogueId);
      expect(contact).toBeDefined();
      return contact!.position;
    };
    const itemPosition = (resourceKey: string): Position => {
      const item = area.entities.items.find((candidate) => candidate.resourceKey === resourceKey);
      expect(item).toBeDefined();
      return item!.position!;
    };

    const lira = contactPosition('npc_lira_vendor');
    const naila = contactPosition('npc_archivist_naila');
    const brant = contactPosition('npc_courier_brant');
    const keycard = itemPosition('items.corporate_keycard');
    const datapad = itemPosition('items.encrypted_datapad');
    const tokens = itemPosition('items.transit_tokens');
    const route = [lira, keycard, lira, naila, datapad, naila, brant, tokens, brant];

    route.slice(1).forEach((destination, index) => {
      expect(findPath(route[index]!, destination, area)).not.toHaveLength(0);
    });
  });
});
