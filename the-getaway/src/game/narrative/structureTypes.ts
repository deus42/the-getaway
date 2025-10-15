export type ResourceKey<Domain extends string> = `${Domain}.${string}`;

export type LevelResourceKey = ResourceKey<'levels'>;
export type MissionResourceKey = ResourceKey<'missions'>;
export type QuestResourceKey = ResourceKey<'quests'>;
export type NPCResourceKey = ResourceKey<'npcs'>;

export type MissionKind = 'primary' | 'side';

export interface LevelDefinition {
  id: string;
  resourceKey: LevelResourceKey;
  order: number;
  zoneKey: string;
  missionKeys: MissionResourceKey[];
  defaultMissionKey?: MissionResourceKey;
  relatedNpcKeys?: NPCResourceKey[];
}

export interface MissionDefinition {
  id: string;
  resourceKey: MissionResourceKey;
  levelKey: LevelResourceKey;
  kind: MissionKind;
  questKeys: QuestResourceKey[];
  recommendedLevel?: number;
  factionTag?: string;
  relatedNpcKeys?: NPCResourceKey[];
}

export interface QuestObjectiveStructure {
  id: string;
  type: 'collect' | 'talk' | 'kill' | 'explore';
  targetResourceKey: string;
  count?: number;
}

export interface QuestRewardStructure {
  type: 'item' | 'experience' | 'currency';
  resourceKey?: string;
  amount: number;
}

export interface QuestDefinition {
  id: string;
  resourceKey: QuestResourceKey;
  levelKey: LevelResourceKey;
  missionKey: MissionResourceKey | null;
  kind: MissionKind;
  objectives: QuestObjectiveStructure[];
  rewards: QuestRewardStructure[];
  relatedNpcKeys: NPCResourceKey[];
  status: 'implemented' | 'stub';
}

export interface LevelLocaleEntry {
  name: string;
  summary?: string;
  directives?: string[];
}

export type LevelLocaleMap = Record<LevelResourceKey, LevelLocaleEntry>;

export interface MissionLocaleEntry {
  label: string;
  summary: string;
}

export type MissionLocaleMap = Record<MissionResourceKey, MissionLocaleEntry>;

export interface QuestLocaleEntry {
  name: string;
  description: string;
  objectiveDescriptions: Record<string, string>;
}

export type QuestLocaleMap = Record<QuestResourceKey, QuestLocaleEntry>;

export interface NPCLocaleEntry {
  name: string;
  title?: string;
}

export type NPCLocaleMap = Record<NPCResourceKey, NPCLocaleEntry>;

export interface NarrativeLocaleBundle {
  levels: LevelLocaleMap;
  missions: MissionLocaleMap;
  quests: QuestLocaleMap;
  npcs: NPCLocaleMap;
}

export const isMissionQuest = (quest: QuestDefinition): boolean => quest.missionKey !== null;

export const isSideQuest = (quest: QuestDefinition): boolean => quest.missionKey === null;

export interface NarrativeNPCRegistration {
  resourceKey: NPCResourceKey;
  levelKeys: LevelResourceKey[];
  missionKeys: MissionResourceKey[];
  questKeys: QuestResourceKey[];
}
