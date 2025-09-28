import { Dialogue, Quest, NPC, Item, Position } from '../../../game/interfaces/types';

export interface LevelBuildingDefinition {
  id: string;
  name: string;
  footprint: { from: Position; to: Position };
  door: Position;
  interior: { width: number; height: number };
}

export interface Level0LocaleContent {
  dialogues: Dialogue[];
  quests: Quest[];
  npcBlueprints: Array<Omit<NPC, 'id'>>;
  itemBlueprints: Array<Omit<Item, 'id'>>;
  buildingDefinitions: LevelBuildingDefinition[];
  coverSpots: {
    slums: Position[];
    downtown: Position[];
  };
  world: {
    areaName: string;
    objectives: string[];
    initialEnemyName: string;
  };
}
