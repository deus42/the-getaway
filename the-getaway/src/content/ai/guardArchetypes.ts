import { AlertLevel } from '../../game/interfaces/types';
import { NpcFsmConfig, NpcUtilityModifier } from '../../game/ai/fsm/types';

export interface GuardArchetypeDefinition {
  id: string;
  label: string;
  description?: string;
  fsm: NpcFsmConfig;
}

export const DEFAULT_GUARD_ARCHETYPE_ID = 'corpsec-sentinel';

const baseUtility = (overrides: Partial<NpcUtilityModifier>): NpcUtilityModifier => ({
  kind: 'lineOfSight',
  state: 'chase',
  weight: 0,
  ...overrides,
}) as NpcUtilityModifier;

const SENTINEL_MODIFIERS: NpcUtilityModifier[] = [
  baseUtility({ kind: 'lineOfSight', state: 'attack', weight: 3 }),
  baseUtility({ kind: 'lineOfSight', state: 'chase', weight: 2 }),
  baseUtility({ kind: 'lostLineOfSight', state: 'search', weight: 2 }),
  baseUtility({ kind: 'healthBelow', state: 'flee', threshold: 0.35, weight: 3 }),
  baseUtility({ kind: 'suppressionAbove', state: 'panic', threshold: 0.6, weight: 2 }),
  baseUtility({
    kind: 'alertAtLeast',
    state: 'attack',
    alert: AlertLevel.INVESTIGATING,
    weight: 1.5,
  }),
  baseUtility({
    kind: 'alertBelow',
    state: 'patrol',
    alert: AlertLevel.SUSPICIOUS,
    weight: 1,
  }),
  baseUtility({
    kind: 'distanceBelow',
    state: 'attack',
    tiles: 2,
    weight: 2.5,
  }),
  baseUtility({
    kind: 'distanceAbove',
    state: 'patrol',
    tiles: 8,
    weight: 1.2,
  }),
  { kind: 'healthBelow', state: 'attack', threshold: 0.4, weight: -3 },
  { kind: 'healthBelow', state: 'chase', threshold: 0.4, weight: -3 },
  { kind: 'healthBelow', state: 'panic', threshold: 0.35, weight: 2 },
];

const ENFORCER_MODIFIERS: NpcUtilityModifier[] = [
  baseUtility({ kind: 'lineOfSight', state: 'attack', weight: 4 }),
  baseUtility({ kind: 'lineOfSight', state: 'chase', weight: 3 }),
  baseUtility({ kind: 'lostLineOfSight', state: 'search', weight: 1.5 }),
  baseUtility({ kind: 'healthBelow', state: 'panic', threshold: 0.25, weight: 2 }),
  baseUtility({ kind: 'suppressionAbove', state: 'flee', threshold: 0.8, weight: 2 }),
  baseUtility({
    kind: 'alertAtLeast',
    state: 'attack',
    alert: AlertLevel.ALARMED,
    weight: 2,
  }),
  baseUtility({
    kind: 'directorAtLeast',
    state: 'panic',
    threshold: 0.8,
    weight: 1.5,
  }),
];

const CAUTIOUS_MODIFIERS: NpcUtilityModifier[] = [
  baseUtility({ kind: 'lineOfSight', state: 'chase', weight: 1.5 }),
  baseUtility({ kind: 'lostLineOfSight', state: 'search', weight: 3 }),
  baseUtility({ kind: 'healthBelow', state: 'flee', threshold: 0.5, weight: 3 }),
  baseUtility({ kind: 'alertBelow', state: 'patrol', alert: AlertLevel.SUSPICIOUS, weight: 2 }),
  baseUtility({ kind: 'distanceAbove', state: 'patrol', tiles: 6, weight: 1.5 }),
  baseUtility({ kind: 'distanceBelow', state: 'inspectNoise', tiles: 4, weight: 1.2 }),
];

const buildFsmConfig = (id: string, overrides: Partial<NpcFsmConfig>): NpcFsmConfig => ({
  id,
  initialState: 'patrol',
  baseWeights: {
    idle: 0.5,
    patrol: 3,
    chase: 1,
    search: 1,
    attack: 0.5,
    inspectNoise: 0.5,
    flee: 0.2,
    panic: 0.1,
  },
  cooldowns: {
    panic: 12000,
    flee: 8000,
    inspectNoise: 2000,
  },
  minimumSelectableWeight: 0.05,
  ...overrides,
});

export const guardArchetypeCatalog: Record<string, GuardArchetypeDefinition> = {
  [DEFAULT_GUARD_ARCHETYPE_ID]: {
    id: DEFAULT_GUARD_ARCHETYPE_ID,
    label: 'CorpSec Sentinel',
    description:
      'Baseline guard tuned for perimeter patrols; favours holding ground until line of sight is confirmed.',
    fsm: buildFsmConfig(DEFAULT_GUARD_ARCHETYPE_ID, {
      baseWeights: {
        idle: 0.6,
        patrol: 3.5,
        chase: 0.3,
        search: 0.9,
        attack: 0.9,
        inspectNoise: 0.6,
        flee: 0.4,
        panic: 0.2,
      },
      utilityModifiers: SENTINEL_MODIFIERS,
    }),
  },
  'corpsec-enforcer': {
    id: 'corpsec-enforcer',
    label: 'CorpSec Enforcer',
    description: 'Aggressive shock troops that lean into panic suppression and rapid response.',
    fsm: buildFsmConfig('corpsec-enforcer', {
      initialState: 'patrol',
      baseWeights: {
        idle: 0.2,
        patrol: 2.5,
        chase: 1.5,
        search: 0.6,
        attack: 1.2,
        inspectNoise: 0.4,
        flee: 0.2,
        panic: 0.4,
      },
      utilityModifiers: ENFORCER_MODIFIERS,
      cooldowns: {
        panic: 10000,
        flee: 6000,
        inspectNoise: 1500,
      },
    }),
  },
  'corpsec-watchman': {
    id: 'corpsec-watchman',
    label: 'CorpSec Watchman',
    description: 'Cautious sentry who prioritises searching and calling in reinforcements.',
    fsm: buildFsmConfig('corpsec-watchman', {
      baseWeights: {
        idle: 1,
        patrol: 2.5,
        chase: 0.6,
        search: 1.4,
        attack: 0.5,
        inspectNoise: 0.8,
        flee: 0.5,
        panic: 0.2,
      },
      utilityModifiers: CAUTIOUS_MODIFIERS,
      cooldowns: {
        panic: 12000,
        flee: 9000,
        inspectNoise: 2500,
      },
    }),
  },
};

export const getGuardArchetype = (id: string): GuardArchetypeDefinition | undefined =>
  guardArchetypeCatalog[id];
