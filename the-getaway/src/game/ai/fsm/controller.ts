import { createNpcRng, hashString } from './random';
import {
  NpcAiState,
  NpcContext,
  NpcCooldownConfig,
  NpcFsmConfig,
  NpcFsmController,
  NpcFsmSnapshot,
  NpcFsmStepMetadata,
  NpcFsmStepResult,
  NpcStateHandlers,
  NpcTransitionWeights,
  NpcUtilityModifier,
} from './types';

const ALL_STATES: NpcAiState[] = [
  'idle',
  'patrol',
  'chase',
  'search',
  'attack',
  'inspectNoise',
  'flee',
  'panic',
];

const cloneCooldowns = (cooldowns?: Partial<Record<NpcAiState, number>>) => {
  if (!cooldowns) {
    return {};
  }
  return ALL_STATES.reduce<Partial<Record<NpcAiState, number>>>((acc, state) => {
    if (typeof cooldowns[state] === 'number') {
      acc[state] = cooldowns[state];
    }
    return acc;
  }, {});
};

const ensureWeights = (base: NpcTransitionWeights): Record<NpcAiState, number> => {
  return ALL_STATES.reduce<Record<NpcAiState, number>>((acc, state) => {
    const value = base[state];
    acc[state] = typeof value === 'number' ? Math.max(0, value) : 0;
    return acc;
  }, {} as Record<NpcAiState, number>);
};

const applyUtilityModifiers = (
  weights: Record<NpcAiState, number>,
  modifiers: NpcUtilityModifier[] | undefined,
  context: NpcContext,
  breakdown: Record<NpcAiState, number>
) => {
  if (!modifiers || modifiers.length === 0) {
    return;
  }

  for (const modifier of modifiers) {
    const { state, weight } = modifier;
    let delta = 0;

    switch (modifier.kind) {
      case 'healthBelow':
        if (context.healthRatio <= modifier.threshold) {
          delta = weight;
        }
        break;
      case 'healthAbove':
        if (context.healthRatio >= modifier.threshold) {
          delta = weight;
        }
        break;
      case 'lineOfSight':
        if (context.hasLineOfSight) {
          delta = weight;
        }
        break;
      case 'lostLineOfSight':
        if (!context.hasLineOfSight) {
          delta = weight;
        }
        break;
      case 'alertAtLeast':
        if ((context.alertLevel ?? 0) >= modifier.alert) {
          delta = weight;
        }
        break;
      case 'alertBelow':
        if ((context.alertLevel ?? 0) < modifier.alert) {
          delta = weight;
        }
        break;
      case 'suppressionAbove':
        if (context.suppressionRatio >= modifier.threshold) {
          delta = weight;
        }
        break;
      case 'distanceBelow':
        if (context.distanceToPlayer <= modifier.tiles) {
          delta = weight;
        }
        break;
      case 'distanceAbove':
        if (context.distanceToPlayer >= modifier.tiles) {
          delta = weight;
        }
        break;
      case 'directorAtLeast':
        if (
          typeof context.directorIntensity === 'number' &&
          context.directorIntensity >= modifier.threshold
        ) {
          delta = weight;
        }
        break;
      default:
        break;
    }

    if (delta !== 0) {
      const next = Math.max(0, (weights[state] ?? 0) + delta);
      weights[state] = next;
      breakdown[state] = (breakdown[state] ?? 0) + delta;
    }
  }
};

const applyCooldowns = (
  weights: Record<NpcAiState, number>,
  activeCooldowns: Partial<Record<NpcAiState, number>>,
  now: number
) => {
  ALL_STATES.forEach((state) => {
    const readyAt = activeCooldowns[state];
    if (typeof readyAt === 'number' && readyAt > now) {
      weights[state] = 0;
    }
  });
};

const clampMinimumSelectable = (
  weights: Record<NpcAiState, number>,
  minimum: number
) => {
  if (minimum <= 0) {
    return;
  }

  ALL_STATES.forEach((state) => {
    if (weights[state] > 0 && weights[state] < minimum) {
      weights[state] = minimum;
    }
  });
};

const weightedSample = (weights: Record<NpcAiState, number>, next: () => number): NpcAiState => {
  let total = 0;
  ALL_STATES.forEach((state) => {
    total += weights[state];
  });

  if (total <= 0) {
    return 'idle';
  }

  const target = next() * total;
  let cumulative = 0;

  for (const state of ALL_STATES) {
    cumulative += weights[state];
    if (target <= cumulative) {
      return state;
    }
  }

  return ALL_STATES[ALL_STATES.length - 1];
};

const scheduleCooldown = (
  cooldowns: Partial<Record<NpcAiState, number>>,
  configuration: NpcCooldownConfig | undefined,
  state: NpcAiState,
  now: number
) => {
  const duration = configuration?.[state];
  if (typeof duration === 'number' && duration > 0) {
    cooldowns[state] = now + duration;
  }
};

export const createNpcFsmController = (
  config: NpcFsmConfig,
  snapshot?: Partial<NpcFsmSnapshot>
): NpcFsmController => {
  const personalitySeed = snapshot?.personalitySeed ?? hashString(config.id);
  const rng = createNpcRng(`${config.id}:${personalitySeed}`, personalitySeed);
  let currentState: NpcAiState = snapshot?.currentState ?? config.initialState;
  let lastTransitionAt = snapshot?.lastTransitionAt ?? 0;
  const activeCooldowns = cloneCooldowns(snapshot?.cooldowns);
  const cooldownConfig = config.cooldowns ?? {};

  const minimumSelectableWeight = config.minimumSelectableWeight ?? 0;

  const getSnapshot = (): NpcFsmSnapshot => ({
    currentState,
    lastTransitionAt,
    cooldowns: cloneCooldowns(activeCooldowns),
    personalitySeed,
  });

  const getState = () => currentState;

  const step = (context: NpcContext, handlers?: NpcStateHandlers): NpcFsmStepResult => {
    const weights = ensureWeights(config.baseWeights);
    const utilityBreakdown = ALL_STATES.reduce<Record<NpcAiState, number>>((acc, state) => {
      acc[state] = 0;
      return acc;
    }, {} as Record<NpcAiState, number>);

    applyUtilityModifiers(weights, config.utilityModifiers, context, utilityBreakdown);
    applyCooldowns(weights, activeCooldowns, context.now);
    clampMinimumSelectable(weights, minimumSelectableWeight);

    if (weights[currentState] > 0) {
      // keep a slight bias towards the current state to reduce jitter
      weights[currentState] += 0.5;
    }

    const selectedState = weightedSample(weights, rng.next);
    const previousState = currentState;

    if (selectedState !== currentState) {
      scheduleCooldown(activeCooldowns, cooldownConfig, selectedState, context.now);
      currentState = selectedState;
      lastTransitionAt = context.now;
    }

    const metadata: NpcFsmStepMetadata = {
      previousState,
      selectedState,
      weights,
      utilityBreakdown,
      now: context.now,
    };

    const handler = handlers?.[selectedState];
    if (handler) {
      handler(context, metadata);
    }

    return {
      state: selectedState,
      metadata,
    };
  };

  return {
    getState,
    getSnapshot,
    step,
  };
};
