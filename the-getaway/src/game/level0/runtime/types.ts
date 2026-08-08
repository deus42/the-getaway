import type { WorldPoint } from '../layout/types';
import type {
  CoverIdentity,
  Level0RpgLedger,
  RunAbilities,
} from '../rpg/types';

export type {
  CommittedLevel0GateVerdict,
  CoverIdentity,
  Level0AbilityId,
  Level0CoverId,
  Level0GateId,
  Level0GateRequirement,
  Level0GateVerdict,
  Level0ParanoiaEvent,
  Level0ParanoiaTier,
  Level0ResearchEvent,
  Level0ResearchOptionId,
  Level0ResearchState,
  Level0ResearchStateRecord,
  Level0RpgLedger,
  RunAbilities,
} from '../rpg/types';

export type PauseOwner =
  | 'menu'
  | 'bible'
  | 'settings'
  | 'cover_select'
  | 'character'
  | 'dossier'
  | 'social_feed'
  | 'dialogue'
  | 'observation'
  | 'terminal'
  | 'safehouse_action'
  | 'george_consultation'
  | 'interception'
  | 'restart_attempt_confirmation'
  | 'research'
  | 'debrief'
  | 'mission_recap'
  | 'failure'
  | 'completion';

export interface WorldClockState {
  currentWorldMillisecond: number;
  currentMinute: number;
  phase: 'dusk' | 'blue-hour' | 'curfew';
  curfewActive: boolean;
  deadlineReached: boolean;
  lastProcessedScheduleBoundaryId?: string;
  processedBoundaryIds: string[];
  pauseOwners: PauseOwner[];
  scheduleStates: Record<string, string>;
}

export type Level0MissionState =
  | 'L0_COVER_SELECT'
  | 'L0_SAFEHOUSE_INTRO'
  | 'L0_LIRA_BRIEFING'
  | 'L0_PREPARATION'
  | 'L0_OPERATION_DEPARTED'
  | 'L0_INFILTRATION'
  | 'L0_MEDKITS_SECURED'
  | 'L0_ESCAPE'
  | 'L0_LIRA_RETURN'
  | 'L0_TRANSIT_VALIDATION'
  | 'L0_DEBRIEF'
  | 'L0_COMPLETE'
  | 'L0_FAILED';

export interface Level0RuntimeGenerationState {
  generationVersion: string;
  seed: string;
  authoredVariantIds: Record<string, string>;
}

export interface Level0PlayerRuntimeCheckpoint {
  position: WorldPoint;
  facing: WorldPoint;
}

export type SurveillanceLevel = 'clear' | 'suspicious' | 'pursuit';
export type Level0DeadlineRequirement = 'medkits-returned' | 'transit-validated';

export type Level0FailureCause =
  | 'failure.deadline'
  | 'failure.breakdown'
  | 'failure.capture'
  | 'failure.save_incompatible';

export interface SafehouseState {
  insideBoundary: boolean;
  operationAttemptBaselineCreated: boolean;
  recoveryAvailable: boolean;
  transitCredentialState: 'not-issued' | 'issued' | 'validated';
  debriefAvailable: boolean;
  usedActionIds: string[];
}

export type SafehouseActionId =
  | 'wait'
  | 'rest'
  | 'depart'
  | 'character'
  | 'dossier'
  | 'george'
  | 'research'
  | 'outbound-transit';

export interface SafehouseActionAvailability {
  actionId: SafehouseActionId;
  available: boolean;
  blockedReasonId?: string;
  evaluatedAgainstSurveillanceLevel: SurveillanceLevel;
  directlyObserved: boolean;
}

export interface Level0SurveillanceRuntimeState {
  level: SurveillanceLevel;
  directlyObserved: boolean;
  sourceDeviceId?: string;
  lastKnownPosition?: WorldPoint;
}

export interface ObjectiveState {
  objectiveId: string;
  status: 'hidden' | 'available' | 'active' | 'completed' | 'failed' | 'superseded';
  completedAtWorldMinute?: number;
}

export interface FactLedger {
  known: Record<string, { factId: string; acquisitionIds: string[] }>;
}

export interface MapKnowledgeState {
  discoveredLocationIds: string[];
  discoveredCameraIds: string[];
  discoveredTerminalIds: string[];
  discoveredHidingContextIds: string[];
  discoveredBlendingContextIds: string[];
  objectivePrecision: Record<string, 'hidden' | 'district' | 'area' | 'entrance' | 'exact'>;
}

export interface ContactState {
  consulted: boolean;
  lastDialogueNodeId?: string;
  acquiredFactIds: string[];
}

export type ContactStateRecord = Record<'lira' | 'naila' | 'brant', ContactState>;

export interface Level0RunState {
  schemaVersion: 3;
  contentVersions: Record<string, string>;
  sessionId: string;
  identity: CoverIdentity;
  abilities: RunAbilities;
  rpg: Level0RpgLedger;
  paranoia: number;
  worldClock: WorldClockState;
  mission: Level0MissionState;
  objectives: Record<string, ObjectiveState>;
  facts: FactLedger;
  mapKnowledge: MapKnowledgeState;
  contacts: ContactStateRecord;
  safehouse: SafehouseState;
  surveillance: Level0SurveillanceRuntimeState;
  player: Level0PlayerRuntimeCheckpoint;
  runtimeGeneration: Level0RuntimeGenerationState;
  completion: {
    medkitsReturned: boolean;
    transitValidated: boolean;
  };
  failureCause: Level0FailureCause | null;
  failureSourceId: string | null;
  failureMissingRequirements: Level0DeadlineRequirement[];
}

export interface OperationAttemptBaseline {
  schemaVersion: 3;
  contentVersions: Record<string, string>;
  sessionId: string;
  createdAtWorldMinute: number;
  identity: CoverIdentity;
  abilities: RunAbilities;
  rpg: Level0RpgLedger;
  paranoia: number;
  worldClock: WorldClockState;
  mission: Level0MissionState;
  objectives: Record<string, ObjectiveState>;
  facts: FactLedger;
  mapKnowledge: MapKnowledgeState;
  contacts: ContactStateRecord;
  safehouse: SafehouseState;
  surveillance: Level0SurveillanceRuntimeState;
  player: Level0PlayerRuntimeCheckpoint;
  runtimeGeneration: Level0RuntimeGenerationState;
  completion: Level0RunState['completion'];
}

export interface OperationAttemptBaselineReadback {
  departureWorldMinute: number;
  contactsConsulted: Array<'naila' | 'brant'>;
  paranoiaTier: Exclude<import('../rpg/types').Level0ParanoiaTier, 'breakdown'>;
  heldAbilityIds: import('../rpg/types').Level0AbilityId[];
  localizedRestorationMeaningKey: string;
}
