import { Dialogue, NPC, Item, Position, FactionId, FactionStanding } from '../../../game/interfaces/types';

export type BuildingSignageStyle =
  | 'slums_scrap'
  | 'slums_neon'
  | 'corp_holo'
  | 'corp_brass';

export type BuildingDistrict = 'slums' | 'downtown';

export type PropDensityTier = 'low' | 'medium' | 'high';

export interface LevelBuildingDefinition {
  id: string;
  name: string;
  footprint: { from: Position; to: Position };
  door: Position;
  interior: { width: number; height: number };
  district?: BuildingDistrict;
  signageStyle?: BuildingSignageStyle;
  propDensity?: PropDensityTier;
  encounterProfile?: string;
  factionRequirement?: {
    factionId: FactionId;
    minimumStanding?: FactionStanding;
    minimumReputation?: number;
  };
}

export interface Level0LocaleContent {
  dialogues: Dialogue[];
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
    zoneId: string;
  };
}
