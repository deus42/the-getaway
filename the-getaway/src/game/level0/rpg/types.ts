export type Level0CoverId =
  | 'cover.neighbor'
  | 'cover.technician'
  | 'cover.commuter'
  | 'cover.archivist';

export interface CoverIdentity {
  coverId: Level0CoverId;
  appearancePresetId: string;
}

export type Level0AbilityId =
  | 'ability.read_people'
  | 'ability.negotiate'
  | 'ability.blend_in'
  | 'ability.steady_voice'
  | 'ability.spot_patterns'
  | 'ability.terminal_craft'
  | 'ability.trace_discipline'
  | 'ability.slip_away'
  | 'ability.quiet_feet';

export type Level0ParanoiaTier =
  | 'calm'
  | 'uneasy'
  | 'shaken'
  | 'breaking'
  | 'breakdown';

export interface Level0AbilityDefinition {
  id: Level0AbilityId;
  tag: 'hardened' | { fragile: 'uneasy' | 'shaken' };
}

export type Level0ResearchOptionId =
  | 'research.naila_camera_topology'
  | 'research.brant_delivery_protocol';

export type Level0ResearchState = 'unavailable' | 'available' | 'consumed';

export type Level0ResearchStateRecord = Record<
  Level0ResearchOptionId,
  Level0ResearchState
>;

export interface RunAbilities {
  heldAbilityIds: Level0AbilityId[];
  researchState: Level0ResearchStateRecord;
}

export type Level0GateId =
  | 'gate.lira_read_stakes'
  | 'gate.naila_opsec'
  | 'gate.brant_credibility'
  | 'gate.public_blend'
  | 'gate.camera_loop'
  | 'gate.camera_trace'
  | 'gate.manifest_recognition'
  | 'gate.intercept_social'
  | 'gate.intercept_composure'
  | 'gate.intercept_evasion'
  | 'gate.pursuit_hide';

export type Level0GatePath = 'ability' | 'fact' | 'costed';
export type Level0GatePresentation = 'preview' | 'result';

export interface Level0GateRequirement {
  id: Level0GateId;
  abilityPath: Level0AbilityId | null;
  factPath: string | null;
  costedPath: string | null;
  successEffectIds: readonly string[];
  failForwardEffectIds: readonly string[];
}

export interface Level0GateVerdict {
  gateId: Level0GateId;
  path: Level0GatePath;
  status: 'met' | 'not-met';
  reasonId: string;
  presentation: Level0GatePresentation;
  abilityId: Level0AbilityId | null;
  factId: string | null;
  costedPathId: string | null;
  paranoiaTier: Level0ParanoiaTier;
}

export interface CommittedLevel0GateVerdict extends Level0GateVerdict {
  resolutionId: string;
  attemptKey: string;
  resolvedAtWorldMinute: number;
}

export type Level0AttemptTreatment = 'captured-in-baseline' | 'discard-on-restart';

export interface Level0ParanoiaEvent {
  eventId: string;
  sourceId: string;
  amount: number;
  before: number;
  after: number;
  worldMinute: number;
  feedbackId: string;
  attemptTreatment: Level0AttemptTreatment;
  newlyEnteredTiers: Array<Exclude<Level0ParanoiaTier, 'calm' | 'breakdown'>>;
}

export interface Level0ResearchEvent {
  eventId: string;
  optionId: Level0ResearchOptionId;
  consumedFactId: string;
  grantedAbilityId: Level0AbilityId;
  worldMinuteCost: number;
  completedAtWorldMinute: number;
}

export interface Level0RpgLedger {
  gateResolutions: Record<string, CommittedLevel0GateVerdict>;
  paranoiaEvents: Level0ParanoiaEvent[];
  announcedParanoiaTiers: Array<Exclude<Level0ParanoiaTier, 'calm' | 'breakdown'>>;
  researchEvents: Level0ResearchEvent[];
}
