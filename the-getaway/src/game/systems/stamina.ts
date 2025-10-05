export const STAMINA_COSTS = {
  sprintTile: 2,
  climbObstacle: 6,
  strenuousInteraction: 1,
} as const;

export const STAMINA_REGEN_OUT_OF_COMBAT = 3;
export const EXHAUSTION_THRESHOLD = 0.3;
export const EXHAUSTION_RECOVERY = 0.4;

export const clampStamina = (value: number, max: number): number => {
  if (!Number.isFinite(value) || !Number.isFinite(max)) {
    return 0;
  }

  if (max <= 0) {
    return 0;
  }

  if (value < 0) {
    return 0;
  }

  if (value > max) {
    return max;
  }

  return value;
};

export const getStaminaRatio = (stamina: number, maxStamina: number): number => {
  if (!Number.isFinite(stamina) || !Number.isFinite(maxStamina) || maxStamina <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, stamina / maxStamina));
};

export const shouldEnterExhaustion = (stamina: number, maxStamina: number): boolean =>
  getStaminaRatio(stamina, maxStamina) < EXHAUSTION_THRESHOLD;

export const shouldLeaveExhaustion = (stamina: number, maxStamina: number): boolean =>
  getStaminaRatio(stamina, maxStamina) > EXHAUSTION_RECOVERY;

export const hasEnoughStamina = (stamina: number, maxStamina: number, cost: number): boolean => {
  if (!Number.isFinite(cost) || cost <= 0) {
    return true;
  }

  return clampStamina(stamina, maxStamina) >= cost;
};
