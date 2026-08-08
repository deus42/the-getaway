import type { Level0RunState } from '../runtime/types';
import type {
  CommittedLevel0GateVerdict,
  Level0AbilityDefinition,
  Level0AbilityId,
  Level0GatePath,
  Level0GateRequirement,
  Level0GateVerdict,
  Level0ParanoiaTier,
} from './types';

const fragile = (
  id: Level0AbilityId,
  locksAt: 'uneasy' | 'shaken'
): Level0AbilityDefinition => ({ id, tag: { fragile: locksAt } });

const hardened = (id: Level0AbilityId): Level0AbilityDefinition => ({
  id,
  tag: 'hardened',
});

export const LEVEL0_ABILITY_CATALOG: Record<Level0AbilityId, Level0AbilityDefinition> = {
  'ability.read_people': fragile('ability.read_people', 'uneasy'),
  'ability.negotiate': fragile('ability.negotiate', 'uneasy'),
  'ability.blend_in': fragile('ability.blend_in', 'uneasy'),
  'ability.steady_voice': fragile('ability.steady_voice', 'shaken'),
  'ability.spot_patterns': fragile('ability.spot_patterns', 'shaken'),
  'ability.terminal_craft': hardened('ability.terminal_craft'),
  'ability.trace_discipline': hardened('ability.trace_discipline'),
  'ability.slip_away': hardened('ability.slip_away'),
  'ability.quiet_feet': hardened('ability.quiet_feet'),
};

export const deriveLevel0ParanoiaTier = (value: number): Level0ParanoiaTier => {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error('Level 0 Paranoia must be a finite value from 0 to 100');
  }
  if (value === 100) return 'breakdown';
  if (value >= 90) return 'breaking';
  if (value >= 70) return 'shaken';
  if (value >= 40) return 'uneasy';
  return 'calm';
};

export interface Level0AbilityState {
  status: 'lit' | 'locked';
  reasonId: 'ability.lit' | 'ability.locked.uneasy' | 'ability.locked.shaken';
}

const tierRank: Record<Exclude<Level0ParanoiaTier, 'breakdown'>, number> = {
  calm: 0,
  uneasy: 1,
  shaken: 2,
  breaking: 3,
};

export const resolveLevel0AbilityState = (
  abilityId: Level0AbilityId,
  paranoia: number
): Level0AbilityState => {
  const ability = LEVEL0_ABILITY_CATALOG[abilityId];
  if (!ability) throw new Error(`Unknown Level 0 ability: ${abilityId}`);
  if (ability.tag === 'hardened') return { status: 'lit', reasonId: 'ability.lit' };
  const locksAt = ability.tag.fragile;
  const tier = deriveLevel0ParanoiaTier(paranoia);
  const locked = tier === 'breakdown' || tierRank[tier] >= tierRank[locksAt];
  return locked
    ? {
        status: 'locked',
        reasonId: locksAt === 'uneasy'
          ? 'ability.locked.uneasy'
          : 'ability.locked.shaken',
      }
    : { status: 'lit', reasonId: 'ability.lit' };
};

const gate = (
  id: Level0GateRequirement['id'],
  abilityPath: Level0AbilityId | null,
  factPath: string | null,
  costedPath: string | null
): Level0GateRequirement => ({
  id,
  abilityPath,
  factPath,
  costedPath,
  successEffectIds: [`effect.${id}.success`],
  failForwardEffectIds: [`effect.${id}.fail_forward`],
});

export const LEVEL0_GATE_CATALOG: Record<Level0GateRequirement['id'], Level0GateRequirement> = {
  'gate.lira_read_stakes': gate(
    'gate.lira_read_stakes', 'ability.read_people', null, 'cost.listen_longer_5m'
  ),
  'gate.naila_opsec': gate(
    'gate.naila_opsec', 'ability.trace_discipline', null, 'cost.press_naila_paranoia'
  ),
  'gate.brant_credibility': gate(
    'gate.brant_credibility', 'ability.negotiate', null, 'cost.buy_time_10m'
  ),
  'gate.public_blend': gate(
    'gate.public_blend',
    'ability.blend_in',
    'fact.brant.delivery_protocol',
    'cost.wait_busy_window_10m'
  ),
  'gate.camera_loop': gate(
    'gate.camera_loop', 'ability.terminal_craft', null, 'cost.use_avoidance_route'
  ),
  'gate.camera_trace': gate(
    'gate.camera_trace',
    'ability.trace_discipline',
    'fact.naila.camera_topology',
    'cost.accept_trace_risk'
  ),
  'gate.manifest_recognition': gate(
    'gate.manifest_recognition',
    'ability.spot_patterns',
    'fact.naila.cold_iron_pattern',
    'cost.study_manifest_5m'
  ),
  'gate.intercept_social': gate(
    'gate.intercept_social',
    'ability.negotiate',
    'fact.brant.delivery_protocol',
    'cost.use_sibling_interception_path'
  ),
  'gate.intercept_composure': gate(
    'gate.intercept_composure',
    'ability.steady_voice',
    null,
    'cost.use_sibling_interception_path'
  ),
  'gate.intercept_evasion': gate(
    'gate.intercept_evasion',
    'ability.slip_away',
    'fact.world.hiding.nearby',
    'cost.use_sibling_interception_path'
  ),
  'gate.pursuit_hide': gate(
    'gate.pursuit_hide', 'ability.quiet_feet', 'fact.world.hiding.context', null
  ),
};

export interface ResolveLevel0GateInput {
  requirement: Level0GateRequirement;
  path: Level0GatePath;
  heldAbilityIds: readonly Level0AbilityId[];
  knownFactIds: readonly string[];
  paranoia: number;
  acceptCostedPath?: boolean;
  presentation: 'preview' | 'result';
}

export const resolveLevel0Gate = ({
  requirement,
  path,
  heldAbilityIds,
  knownFactIds,
  paranoia,
  acceptCostedPath = false,
  presentation,
}: ResolveLevel0GateInput): Level0GateVerdict => {
  const paranoiaTier = deriveLevel0ParanoiaTier(paranoia);
  const base = {
    gateId: requirement.id,
    path,
    presentation,
    abilityId: requirement.abilityPath,
    factId: requirement.factPath,
    costedPathId: requirement.costedPath,
    paranoiaTier,
  };
  if (paranoiaTier === 'breakdown') {
    return { ...base, status: 'not-met', reasonId: 'gate.blocked.breakdown' };
  }
  if (path === 'ability') {
    if (!requirement.abilityPath) {
      return { ...base, status: 'not-met', reasonId: 'gate.blocked.path_unavailable' };
    }
    if (!heldAbilityIds.includes(requirement.abilityPath)) {
      return { ...base, status: 'not-met', reasonId: 'gate.blocked.ability_missing' };
    }
    const abilityState = resolveLevel0AbilityState(requirement.abilityPath, paranoia);
    if (abilityState.status === 'locked') {
      return {
        ...base,
        status: 'not-met',
        reasonId: abilityState.reasonId === 'ability.locked.uneasy'
          ? 'gate.blocked.ability_locked.uneasy'
          : 'gate.blocked.ability_locked.shaken',
      };
    }
    return { ...base, status: 'met', reasonId: 'gate.met.ability' };
  }
  if (path === 'fact') {
    if (!requirement.factPath) {
      return { ...base, status: 'not-met', reasonId: 'gate.blocked.path_unavailable' };
    }
    return knownFactIds.includes(requirement.factPath)
      ? { ...base, status: 'met', reasonId: 'gate.met.fact' }
      : { ...base, status: 'not-met', reasonId: 'gate.blocked.fact_missing' };
  }
  if (!requirement.costedPath) {
    return { ...base, status: 'not-met', reasonId: 'gate.blocked.path_unavailable' };
  }
  return acceptCostedPath
    ? { ...base, status: 'met', reasonId: 'gate.met.costed' }
    : { ...base, status: 'not-met', reasonId: 'gate.blocked.cost_not_accepted' };
};

export interface CommitLevel0GateInput {
  gateId: Level0GateRequirement['id'];
  path: Level0GatePath;
  contextIds: readonly string[];
  acceptCostedPath?: boolean;
}

export const createLevel0GateAttemptKey = (
  gateId: string,
  contextIds: readonly string[]
): string => `${gateId}::${[...contextIds].sort().join('|')}`;

export const commitLevel0GateVerdict = (
  run: Level0RunState,
  input: CommitLevel0GateInput
): { run: Level0RunState; verdict: CommittedLevel0GateVerdict | null; blockedReasonId?: string } => {
  if (run.mission === 'L0_FAILED' || run.mission === 'L0_COMPLETE') {
    return { run, verdict: null, blockedReasonId: 'gate.blocked.terminal' };
  }
  const requirement = LEVEL0_GATE_CATALOG[input.gateId];
  const attemptKey = createLevel0GateAttemptKey(input.gateId, input.contextIds);
  const existing = Object.values(run.rpg.gateResolutions).find(
    (resolution) => resolution.attemptKey === attemptKey
  );
  if (existing) return { run, verdict: existing };
  const verdict = resolveLevel0Gate({
    requirement,
    path: input.path,
    heldAbilityIds: run.abilities.heldAbilityIds,
    knownFactIds: Object.keys(run.facts.known),
    paranoia: run.paranoia,
    acceptCostedPath: input.acceptCostedPath,
    presentation: 'result',
  });
  const committed: CommittedLevel0GateVerdict = {
    ...verdict,
    resolutionId: `${attemptKey}::${input.path}`,
    attemptKey,
    resolvedAtWorldMinute: run.worldClock.currentMinute,
  };
  return {
    verdict: committed,
    run: {
      ...run,
      rpg: {
        ...run.rpg,
        gateResolutions: {
          ...run.rpg.gateResolutions,
          [committed.resolutionId]: committed,
        },
      },
    },
  };
};
