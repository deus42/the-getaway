import { Locale } from '../../locales';
import {
  Dialogue,
  Quest,
  NPC,
  Item,
  Position,
  TileCoverProfile,
} from '../../../game/interfaces/types';
import { CoverSpotDefinition, LevelBuildingDefinition, Level0LocaleContent } from './types';
import { level0EnglishContent } from './locales/en';
import { level0UkrainianContent } from './locales/uk';
import { buildQuestsForLevel } from '../../quests/builders';

const LEVEL_RESOURCE_KEY = 'levels.slums_command_grid';
const ROAD_WIDENING_INSET_TILES = 4;

interface Level0Content {
  dialogues: Dialogue[];
  quests: Quest[];
  npcBlueprints: Array<Omit<NPC, 'id'>>;
  itemBlueprints: Array<Omit<Item, 'id'>>;
  buildingDefinitions: LevelBuildingDefinition[];
  coverSpots: {
    slums: CoverSpotDefinition[];
    downtown: CoverSpotDefinition[];
    all: CoverSpotDefinition[];
  };
  world: {
    areaName: string;
    objectives: string[];
    initialEnemyName: string;
    zoneId: string;
  };
}

const LOCALE_CONTENT: Record<Locale, Level0LocaleContent> = {
  en: level0EnglishContent,
  uk: level0UkrainianContent,
};

const clonePosition = (position: Position): Position => ({ ...position });

const cloneCoverProfile = (profile: TileCoverProfile | undefined): TileCoverProfile | undefined =>
  profile ? { ...profile } : undefined;

const cloneDialogue = (dialogue: Dialogue): Dialogue => ({
  ...dialogue,
  nodes: dialogue.nodes.map((node) => ({
    ...node,
    options: node.options.map((option) => ({
      ...option,
      skillCheck: option.skillCheck ? { ...option.skillCheck } : undefined,
      questEffect: option.questEffect ? { ...option.questEffect } : undefined,
      factionRequirement: option.factionRequirement
        ? { ...option.factionRequirement }
        : undefined,
    })),
  })),
});

const cloneNPCBlueprint = (npc: Omit<NPC, 'id'>): Omit<NPC, 'id'> => ({
  ...npc,
  position: clonePosition(npc.position),
  routine: npc.routine.map((step) => ({
    ...step,
    position: clonePosition(step.position),
  })),
});

const cloneItemBlueprint = (item: Omit<Item, 'id'>): Omit<Item, 'id'> => ({
  ...item,
});

const cloneBuildingDefinition = (building: LevelBuildingDefinition): LevelBuildingDefinition => ({
  ...building,
  district: building.district,
  signageStyle: building.signageStyle,
  propDensity: building.propDensity,
  encounterProfile: building.encounterProfile,
  factionRequirement: building.factionRequirement
    ? { ...building.factionRequirement }
    : undefined,
  footprint: {
    from: { ...building.footprint.from },
    to: { ...building.footprint.to },
  },
  door: { ...building.door },
  interior: { ...building.interior },
});

const moveDoorToPerimeter = (building: LevelBuildingDefinition): LevelBuildingDefinition => {
  const sanitized = cloneBuildingDefinition(building);
  const { from, to } = sanitized.footprint;
  const fallbackDoor = {
    x: Math.floor((from.x + to.x) / 2),
    y: to.y,
  };

  const originalDoor = sanitized.door ?? fallbackDoor;
  const interiorWidth = to.x - from.x;
  const hasHorizontalBuffer = interiorWidth >= 2;
  const minX = hasHorizontalBuffer ? from.x + 1 : from.x;
  const maxX = hasHorizontalBuffer ? to.x - 1 : to.x;

  const clampedX = Math.min(Math.max(originalDoor.x, minX), maxX);

  sanitized.door = {
    x: clampedX,
    y: to.y,
  };

  return sanitized;
};

const insetBuildingFootprint = (
  building: LevelBuildingDefinition,
  insetTiles: number
): LevelBuildingDefinition => {
  const next = cloneBuildingDefinition(building);
  const width = next.footprint.to.x - next.footprint.from.x + 1;
  const height = next.footprint.to.y - next.footprint.from.y + 1;

  // Preserve usable block size while widening roads between blocks.
  const insetX = Math.min(insetTiles, Math.max(0, Math.floor((width - 6) / 2)));
  const insetY = Math.min(insetTiles, Math.max(0, Math.floor((height - 6) / 2)));

  if (insetX <= 0 && insetY <= 0) {
    return next;
  }

  next.footprint = {
    from: {
      x: next.footprint.from.x + insetX,
      y: next.footprint.from.y + insetY,
    },
    to: {
      x: next.footprint.to.x - insetX,
      y: next.footprint.to.y - insetY,
    },
  };

  return next;
};

const cloneCoverSpot = (spot: CoverSpotDefinition): CoverSpotDefinition => ({
  position: clonePosition(spot.position),
  profile: cloneCoverProfile(spot.profile),
});

export const getLevel0Content = (locale: Locale): Level0Content => {
  const source = LOCALE_CONTENT[locale] ?? level0EnglishContent;

  const dialogues = source.dialogues.map(cloneDialogue);
  const quests = buildQuestsForLevel(locale, LEVEL_RESOURCE_KEY);
  const npcBlueprints = source.npcBlueprints.map(cloneNPCBlueprint);
  const itemBlueprints = source.itemBlueprints.map(cloneItemBlueprint);
  const buildingDefinitions = source.buildingDefinitions.map((definition) => {
    const widenedRoadLayout = insetBuildingFootprint(definition, ROAD_WIDENING_INSET_TILES);
    return moveDoorToPerimeter(widenedRoadLayout);
  });

  const slumsCover = source.coverSpots.slums.map(cloneCoverSpot);
  const downtownCover = source.coverSpots.downtown.map(cloneCoverSpot);
  const allCover = [...slumsCover, ...downtownCover].map(cloneCoverSpot);

  return {
    dialogues,
    quests,
    npcBlueprints,
    itemBlueprints,
    buildingDefinitions,
    coverSpots: {
      slums: slumsCover,
      downtown: downtownCover,
      all: allCover,
    },
    world: {
      areaName: source.world.areaName,
      objectives: [...source.world.objectives],
      initialEnemyName: source.world.initialEnemyName,
      zoneId: source.world.zoneId,
    },
  };
};

export type { Level0Content };
