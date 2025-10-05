import { EncumbranceState } from '../interfaces/types';

export type EncumbranceLevel = EncumbranceState['level'];

const EPSILON = 0.0001;

const PENALTIES: Record<EncumbranceLevel, { movement: number; attack: number; warning?: string }> = {
  normal: {
    movement: 1,
    attack: 1,
  },
  heavy: {
    movement: 1.25,
    attack: 1.1,
    warning: 'Pack weight is slowing you. You will bleed AP if you keep hauling this much.',
  },
  overloaded: {
    movement: 2,
    attack: 1.25,
    warning: 'Overloaded. Movement now chews double AP until you off-load gear.',
  },
  immobile: {
    movement: Number.POSITIVE_INFINITY,
    attack: Number.POSITIVE_INFINITY,
    warning: 'You are pinned by your gear. Drop items before you can move or fight.',
  },
};

const clampPercentage = (value: number): number => {
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.round(value * 100) / 100);
};

const resolveEncumbranceLevel = (percentage: number): EncumbranceLevel => {
  if (percentage >= 120 - EPSILON) {
    return 'immobile';
  }
  if (percentage >= 100 - EPSILON) {
    return 'overloaded';
  }
  if (percentage >= 80 - EPSILON) {
    return 'heavy';
  }
  return 'normal';
};

export const computeEncumbranceState = (
  currentWeight: number,
  maxWeight: number,
  previous?: EncumbranceState
): EncumbranceState => {
  const denominator = maxWeight <= 0 ? 1 : maxWeight;
  const rawPercentage = (currentWeight / denominator) * 100;
  const percentage = clampPercentage(rawPercentage);
  const level = resolveEncumbranceLevel(percentage);
  const penalties = PENALTIES[level];

  const warning = penalties.warning ?? (previous?.level === level ? previous?.warning : undefined);

  return {
    level,
    percentage,
    movementApMultiplier: penalties.movement,
    attackApMultiplier: penalties.attack,
    warning,
  };
};

export const isMovementBlockedByEncumbrance = (encumbrance: EncumbranceState): boolean => {
  return encumbrance.level === 'immobile' || encumbrance.movementApMultiplier === Number.POSITIVE_INFINITY;
};

export const getEncumbrancePenaltySummary = (encumbrance: EncumbranceState): string => {
  const { level, movementApMultiplier, attackApMultiplier } = encumbrance;

  switch (level) {
    case 'normal':
      return 'Encumbrance nominal';
    case 'heavy':
      return `Heavy load: movement x${movementApMultiplier.toFixed(2)}, attacks x${attackApMultiplier.toFixed(2)}`;
    case 'overloaded':
      return `Overloaded: movement x${movementApMultiplier.toFixed(2)}, attacks x${attackApMultiplier.toFixed(2)}`;
    case 'immobile':
      return 'Immobile: cannot move or act';
    default:
      return 'Encumbrance unknown';
  }
};
