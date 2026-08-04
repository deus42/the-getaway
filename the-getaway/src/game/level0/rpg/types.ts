export type AttributeKey = 'physical' | 'mental' | 'social' | 'technical';

export type SkillKey =
  | 'stealth'
  | 'evasion'
  | 'awareness'
  | 'composure'
  | 'insight'
  | 'influence'
  | 'systems'
  | 'opsec';

export interface PlayerIdentity {
  callsign: string;
  appearancePresetId: string;
}

export interface PlayerBuild {
  attributes: Record<AttributeKey, number>;
  skills: Record<SkillKey, number>;
  level: number;
  xp: number;
  unspentSkillPoints: number;
  unspentAttributePoints: number;
}

export interface Level0CreationDraft {
  callsign: string;
  appearancePresetId: string;
  attributes: Record<AttributeKey, number>;
  skills: Record<SkillKey, number>;
}

export type Level0CreationErrorId =
  | 'callsign.required'
  | 'callsign.invalid'
  | 'callsign.too_long'
  | 'appearance.invalid'
  | 'attributes.invalid'
  | 'attributes.over_cap'
  | 'attributes.unspent'
  | 'skills.invalid'
  | 'skills.over_cap'
  | 'skills.unspent';

export interface Level0CreationValidation {
  valid: boolean;
  errors: Level0CreationErrorId[];
  normalizedCallsign: string;
  remainingAttributePoints: number;
  remainingSkillPoints: number;
  identity: PlayerIdentity | null;
  build: PlayerBuild | null;
}

export type ParanoiaCheckPenalty = 0 | 1 | 2 | 3;

export type CheckFactRule =
  | {
      kind: 'lower-requirement';
      factId?: string;
      factIdPrefix?: string;
      amount: number;
      requiredContextId?: string;
    }
  | {
      kind: 'guarantee-success';
      factId: string;
      requiredContextId?: string;
    }
  | {
      kind: 'lower-requirement-from-nearby-fact';
      factIdPrefix: string;
      contextIdPrefix: string;
      amount: number;
    }
  | {
      kind: 'reveal';
      factId: string;
    };

export interface AuthoredModifier {
  id: string;
  amount: number;
  requiredContextId: string;
  localizedReasonKey: string;
}

export interface CheckRequirement {
  id: string;
  attribute: AttributeKey;
  skill: SkillKey;
  requiredTotal: number;
  factRules: CheckFactRule[];
  situationalModifiers: AuthoredModifier[];
  successEffectIds: string[];
  failForwardEffectIds: string[];
  localizedRequirementKey: string;
  visibilityFactId?: string;
  lockedReasonId?: string;
}

export interface CheckResolution {
  checkId: string;
  attribute: AttributeKey;
  attributeValue: number;
  skill: SkillKey;
  skillValue: number;
  paranoiaPenalty: ParanoiaCheckPenalty;
  appliedFactIds: string[];
  appliedModifiers: AuthoredModifier[];
  guaranteedByFactId: string | null;
  baseRequiredTotal: number;
  effectiveRequiredTotal: number;
  finalTotal: number;
  outcome: 'success' | 'fail-forward' | 'fatal';
  successEffectIds: string[];
  failForwardEffectIds: string[];
}

export interface CommittedCheckResolution extends CheckResolution {
  resolutionId: string;
  attemptKey: string;
  paranoiaValue: number;
  knownFactIds: string[];
  activeContextIds: string[];
  resolvedAtWorldMinute: number;
}

export type Level0ResourceKind = 'health' | 'paranoia';
export type Level0RetryTreatment = 'captured-at-departure' | 'discard-on-retry';

export interface Level0ResourceEvent {
  eventId: string;
  resource: Level0ResourceKind;
  sourceId: string;
  amount: number;
  before: number;
  after: number;
  worldMinute: number;
  feedbackId: string;
  retryTreatment: Level0RetryTreatment;
  crossedParanoiaPenalties: Exclude<ParanoiaCheckPenalty, 0>[];
}

export interface Level0XpEvent {
  milestoneId: string;
  amount: number;
  before: number;
  after: number;
  worldMinute: number;
  feedbackId: string;
}

export interface Level0AllocationEvent {
  eventId: string;
  kind: 'level' | 'skill' | 'attribute';
  key?: SkillKey | AttributeKey;
  before: number;
  after: number;
  worldMinute: number;
}

export interface Level0RpgLedger {
  resolvedChecks: Record<string, CommittedCheckResolution>;
  resourceEvents: Level0ResourceEvent[];
  announcedParanoiaPenalties: Exclude<ParanoiaCheckPenalty, 0>[];
  awardedMilestoneIds: string[];
  xpEvents: Level0XpEvent[];
  pendingLevelUps: number;
  allocationEvents: Level0AllocationEvent[];
}
