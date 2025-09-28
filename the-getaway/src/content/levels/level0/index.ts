import { Locale } from '../../locales';
import { Dialogue, Quest, NPC, Item, Position } from '../../../game/interfaces/types';
import { LevelBuildingDefinition, Level0LocaleContent } from './types';
import { level0EnglishContent } from './locales/en';
import { level0UkrainianContent } from './locales/uk';


interface Level0Content {
  dialogues: Dialogue[];
  quests: Quest[];
  npcBlueprints: Array<Omit<NPC, 'id'>>;
  itemBlueprints: Array<Omit<Item, 'id'>>;
  buildingDefinitions: LevelBuildingDefinition[];
  coverSpots: {
    slums: Position[];
    downtown: Position[];
    all: Position[];
  };
  world: {
    areaName: string;
    objectives: string[];
    initialEnemyName: string;
  };
}

const LOCALE_CONTENT: Record<Locale, Level0LocaleContent> = {
  en: level0EnglishContent,
  uk: level0UkrainianContent,
};

const clonePosition = (position: Position): Position => ({ ...position });

const cloneDialogue = (dialogue: Dialogue): Dialogue => ({
  ...dialogue,
  nodes: dialogue.nodes.map((node) => ({
    ...node,
    options: node.options.map((option) => ({
      ...option,
      skillCheck: option.skillCheck ? { ...option.skillCheck } : undefined,
      questEffect: option.questEffect ? { ...option.questEffect } : undefined,
    })),
  })),
});

const cloneQuest = (quest: Quest): Quest => ({
  ...quest,
  objectives: quest.objectives.map((objective) => ({
    ...objective,
  })),
  rewards: quest.rewards.map((reward) => ({
    ...reward,
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
  footprint: {
    from: clonePosition(building.footprint.from),
    to: clonePosition(building.footprint.to),
  },
  door: clonePosition(building.door),
  interior: { ...building.interior },
});

const clonePositions = (positions: Position[]): Position[] =>
  positions.map((position) => clonePosition(position));

export const getLevel0Content = (locale: Locale): Level0Content => {
  const source = LOCALE_CONTENT[locale] ?? level0EnglishContent;

  const dialogues = source.dialogues.map(cloneDialogue);
  const quests = source.quests.map(cloneQuest);
  const npcBlueprints = source.npcBlueprints.map(cloneNPCBlueprint);
  const itemBlueprints = source.itemBlueprints.map(cloneItemBlueprint);
  const buildingDefinitions = source.buildingDefinitions.map(cloneBuildingDefinition);

  const slumsCover = clonePositions(source.coverSpots.slums);
  const downtownCover = clonePositions(source.coverSpots.downtown);
  const allCover = [...slumsCover, ...downtownCover];

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
    },
  };
};

export type { Level0Content };
