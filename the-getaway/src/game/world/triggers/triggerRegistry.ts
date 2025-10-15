import { AppDispatch, RootState } from '../../../store';

export interface EnvironmentalTriggerContext {
  dispatch: AppDispatch;
  getState: () => RootState;
  now: number;
}

export interface EnvironmentalTrigger {
  id: string;
  description?: string;
  once?: boolean;
  cooldownMs?: number;
  when: (state: RootState) => boolean;
  fire: (context: EnvironmentalTriggerContext) => void;
}

interface RegisteredTrigger extends EnvironmentalTrigger {
  fired?: boolean;
  lastFiredAt?: number;
}

const registeredTriggers: RegisteredTrigger[] = [];

export const registerEnvironmentalTrigger = (trigger: EnvironmentalTrigger): void => {
  const existingIndex = registeredTriggers.findIndex((entry) => entry.id === trigger.id);

  if (existingIndex >= 0) {
    registeredTriggers[existingIndex] = { ...registeredTriggers[existingIndex], ...trigger };
    registeredTriggers[existingIndex].fired = false;
    registeredTriggers[existingIndex].lastFiredAt = undefined;
    return;
  }

  registeredTriggers.push({ ...trigger });
};

export const registerEnvironmentalTriggers = (triggers: EnvironmentalTrigger[]): void => {
  triggers.forEach(registerEnvironmentalTrigger);
};

export const clearEnvironmentalTriggers = (): void => {
  registeredTriggers.length = 0;
};

export const getRegisteredEnvironmentalTriggers = (): readonly RegisteredTrigger[] =>
  registeredTriggers;

export const tickEnvironmentalTriggers = (
  dispatch: AppDispatch,
  getState: () => RootState,
  now: number = Date.now()
): void => {
  const state = getState();

  registeredTriggers.forEach((trigger) => {
    if (trigger.once && trigger.fired) {
      return;
    }

    if (typeof trigger.cooldownMs === 'number' && trigger.lastFiredAt !== undefined) {
      if (now - trigger.lastFiredAt < trigger.cooldownMs) {
        return;
      }
    }

    const shouldFire = trigger.when(state);

    if (!shouldFire) {
      return;
    }

    trigger.fire({ dispatch, getState, now });
    trigger.lastFiredAt = now;

    if (trigger.once) {
      trigger.fired = true;
    }
  });
};
