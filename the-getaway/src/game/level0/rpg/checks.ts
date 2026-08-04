import type { Level0RunState } from '../runtime/types';
import type {
  AuthoredModifier,
  CheckFactRule,
  CheckRequirement,
  CheckResolution,
  CommittedCheckResolution,
  ParanoiaCheckPenalty,
  PlayerBuild,
} from './types';

const requirement = (
  definition: Omit<CheckRequirement, 'situationalModifiers' | 'successEffectIds' |
    'failForwardEffectIds' | 'localizedRequirementKey'> &
    Partial<Pick<CheckRequirement, 'situationalModifiers' | 'successEffectIds' |
      'failForwardEffectIds' | 'localizedRequirementKey'>>
): CheckRequirement => ({
  situationalModifiers: [],
  successEffectIds: [`effect.${definition.id}.success`],
  failForwardEffectIds: [`effect.${definition.id}.fail_forward`],
  localizedRequirementKey: `${definition.id}.requirement`,
  ...definition,
});

export const LEVEL0_CHECK_CATALOG: Record<string, CheckRequirement> = {
  'check.lira_read_stakes': requirement({
    id: 'check.lira_read_stakes', attribute: 'social', skill: 'insight', requiredTotal: 3,
    factRules: [],
  }),
  'check.naila_opsec': requirement({
    id: 'check.naila_opsec', attribute: 'technical', skill: 'opsec', requiredTotal: 4,
    factRules: [],
  }),
  'check.brant_credibility': requirement({
    id: 'check.brant_credibility', attribute: 'social', skill: 'influence', requiredTotal: 4,
    factRules: [],
  }),
  'check.public_blend': requirement({
    id: 'check.public_blend', attribute: 'social', skill: 'insight', requiredTotal: 4,
    factRules: [{ kind: 'lower-requirement', factId: 'fact.brant.delivery_protocol', amount: 1 }],
  }),
  'check.camera_loop': requirement({
    id: 'check.camera_loop', attribute: 'technical', skill: 'systems', requiredTotal: 4,
    factRules: [{ kind: 'lower-requirement', factId: 'fact.naila.camera_topology', amount: 1 }],
  }),
  'check.camera_trace': requirement({
    id: 'check.camera_trace', attribute: 'mental', skill: 'opsec', requiredTotal: 4,
    factRules: [],
  }),
  'check.manifest_recognition': requirement({
    id: 'check.manifest_recognition', attribute: 'mental', skill: 'awareness', requiredTotal: 4,
    factRules: [{ kind: 'guarantee-success', factId: 'fact.naila.cold_iron_pattern' }],
  }),
  'check.intercept_influence': requirement({
    id: 'check.intercept_influence', attribute: 'social', skill: 'influence', requiredTotal: 5,
    factRules: [{
      kind: 'lower-requirement',
      factId: 'fact.brant.delivery_protocol',
      amount: 1,
      requiredContextId: 'context.public_route_interception',
    }],
  }),
  'check.intercept_composure': requirement({
    id: 'check.intercept_composure', attribute: 'mental', skill: 'composure', requiredTotal: 5,
    factRules: [],
  }),
  'check.intercept_evasion': requirement({
    id: 'check.intercept_evasion', attribute: 'physical', skill: 'evasion', requiredTotal: 5,
    factRules: [{
      kind: 'lower-requirement-from-nearby-fact',
      factIdPrefix: 'fact.world.hiding.',
      contextIdPrefix: 'context.nearby_hiding.',
      amount: 1,
    }],
  }),
  'check.pursuit_hide': requirement({
    id: 'check.pursuit_hide', attribute: 'mental', skill: 'stealth', requiredTotal: 4,
    factRules: [],
  }),
};

export const getParanoiaCheckPenalty = (paranoia: number): ParanoiaCheckPenalty => {
  if (paranoia >= 90) return 3;
  if (paranoia >= 70) return 2;
  if (paranoia >= 40) return 1;
  return 0;
};

const factMatches = (
  rule: CheckFactRule,
  knownFactIds: readonly string[],
  activeContextIds: readonly string[]
): string | null => {
  if (rule.kind === 'lower-requirement-from-nearby-fact') {
    for (const contextId of activeContextIds) {
      if (!contextId.startsWith(rule.contextIdPrefix)) continue;
      const suffix = contextId.slice(rule.contextIdPrefix.length);
      const expectedFactId = `${rule.factIdPrefix}${suffix}`;
      if (knownFactIds.includes(expectedFactId)) return expectedFactId;
    }
    return null;
  }
  if ('factId' in rule && rule.factId) {
    return knownFactIds.includes(rule.factId) ? rule.factId : null;
  }
  if ('factIdPrefix' in rule && rule.factIdPrefix) {
    return knownFactIds.find((factId) => factId.startsWith(rule.factIdPrefix!)) ?? null;
  }
  return null;
};

const contextMatches = (
  rule: CheckFactRule | AuthoredModifier,
  activeContextIds: readonly string[]
) => !('requiredContextId' in rule) || !rule.requiredContextId ||
  activeContextIds.includes(rule.requiredContextId);

export interface ResolveLevel0CheckInput {
  requirement: CheckRequirement;
  build: PlayerBuild;
  paranoia: number;
  knownFactIds: readonly string[];
  activeContextIds: readonly string[];
}

export const resolveLevel0Check = ({
  requirement: current,
  build,
  paranoia,
  knownFactIds,
  activeContextIds,
}: ResolveLevel0CheckInput): CheckResolution => {
  const attributeValue = build.attributes[current.attribute];
  const skillValue = build.skills[current.skill];
  const paranoiaPenalty = getParanoiaCheckPenalty(paranoia);
  const appliedFactIds: string[] = [];
  let requirementReduction = 0;
  let guaranteedByFactId: string | null = null;

  current.factRules.forEach((rule) => {
    const matchedFactId = factMatches(rule, knownFactIds, activeContextIds);
    if (!matchedFactId || !contextMatches(rule, activeContextIds)) return;
    if (!appliedFactIds.includes(matchedFactId)) appliedFactIds.push(matchedFactId);
    if (rule.kind === 'lower-requirement' ||
      rule.kind === 'lower-requirement-from-nearby-fact') {
      requirementReduction += rule.amount;
    }
    if (rule.kind === 'guarantee-success') guaranteedByFactId = matchedFactId;
  });

  const appliedModifiers = current.situationalModifiers.filter((modifier) =>
    contextMatches(modifier, activeContextIds)
  );
  const modifierTotal = appliedModifiers.reduce((sum, modifier) => sum + modifier.amount, 0);
  const effectiveRequiredTotal = Math.max(0, current.requiredTotal - requirementReduction);
  const finalTotal = attributeValue + skillValue - paranoiaPenalty + modifierTotal;
  const fatal = paranoia >= 100;
  const outcome = fatal
    ? 'fatal' as const
    : guaranteedByFactId !== null || finalTotal >= effectiveRequiredTotal
      ? 'success' as const
      : 'fail-forward' as const;

  return {
    checkId: current.id,
    attribute: current.attribute,
    attributeValue,
    skill: current.skill,
    skillValue,
    paranoiaPenalty,
    appliedFactIds,
    appliedModifiers,
    guaranteedByFactId,
    baseRequiredTotal: current.requiredTotal,
    effectiveRequiredTotal,
    finalTotal,
    outcome,
    successEffectIds: [...current.successEffectIds],
    failForwardEffectIds: [...current.failForwardEffectIds],
  };
};

export interface CommitLevel0CheckInput {
  resolutionId: string;
  checkId: string;
  activeContextIds: string[];
}

export type CommitLevel0CheckResult =
  | {
      run: Level0RunState;
      resolution: CommittedCheckResolution;
      applied: boolean;
      blockedReasonId?: never;
    }
  | {
      run: Level0RunState;
      resolution: null;
      applied: false;
      blockedReasonId: 'check.blocked.terminal';
    };

export const createLevel0CheckAttemptKey = (
  checkId: string,
  activeContextIds: readonly string[]
): string => `${checkId}::${[...activeContextIds].sort().join('|')}`;

export const commitLevel0CheckResolution = (
  run: Level0RunState,
  input: CommitLevel0CheckInput
): CommitLevel0CheckResult => {
  const current = LEVEL0_CHECK_CATALOG[input.checkId];
  if (!current) throw new Error(`Unknown Level 0 check: ${input.checkId}`);
  if (!input.resolutionId.trim()) throw new Error('Level 0 check resolution ID is required');
  if (input.activeContextIds.some((id) => !id.trim()) ||
    new Set(input.activeContextIds).size !== input.activeContextIds.length) {
    throw new Error('Level 0 check context IDs must be unique non-empty IDs');
  }
  const attemptKey = createLevel0CheckAttemptKey(input.checkId, input.activeContextIds);
  const existing = Object.values(run.rpg.resolvedChecks).find(
    (resolution) => resolution.attemptKey === attemptKey
  );
  if (existing) return { run, resolution: existing, applied: false };
  if (run.rpg.resolvedChecks[input.resolutionId]) {
    throw new Error(
      `Level 0 resolution ID ${input.resolutionId} already belongs to another check attempt`
    );
  }
  if (run.mission === 'L0_FAILED' || run.mission === 'L0_COMPLETE') {
    return {
      run,
      resolution: null,
      applied: false,
      blockedReasonId: 'check.blocked.terminal',
    };
  }
  const knownFactIds = Object.keys(run.facts.known);
  const resolution: CommittedCheckResolution = {
    ...resolveLevel0Check({
      requirement: current,
      build: run.build,
      paranoia: run.paranoia,
      knownFactIds,
      activeContextIds: input.activeContextIds,
    }),
    resolutionId: input.resolutionId,
    attemptKey,
    paranoiaValue: run.paranoia,
    knownFactIds: [...knownFactIds],
    activeContextIds: [...input.activeContextIds],
    resolvedAtWorldMinute: run.worldClock.currentMinute,
  };
  return {
    applied: true,
    resolution,
    run: {
      ...run,
      rpg: {
        ...run.rpg,
        resolvedChecks: {
          ...run.rpg.resolvedChecks,
          [input.resolutionId]: resolution,
        },
      },
    },
  };
};
