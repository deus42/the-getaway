export type MissionObjectiveKind = 'primary' | 'side';

export interface MissionObjectiveDefinition {
  id: string;
  label: string;
  summary?: string;
  questIds: string[];
  kind: MissionObjectiveKind;
  recommendedLevel?: number;
  factionTag?: string;
}

export interface MissionLevelDefinition {
  level: number;
  levelId: string;
  name: string;
  objectives: MissionObjectiveDefinition[];
}

export interface MissionLevelState {
  level: number;
  levelId: string;
  name: string;
  objectives: MissionObjectiveDefinition[];
}

export interface ResolvedMissionObjective extends MissionObjectiveDefinition {
  isComplete: boolean;
  totalQuests: number;
  completedQuests: number;
}

export interface MissionProgressSnapshot {
  level: number;
  levelId: string;
  name: string;
  primary: ResolvedMissionObjective[];
  side: ResolvedMissionObjective[];
  allPrimaryComplete: boolean;
}
