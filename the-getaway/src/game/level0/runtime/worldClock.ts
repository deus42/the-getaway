import type { PauseOwner, WorldClockState } from './types';

export interface CompletionState {
  medkitsReturned: boolean;
  transitValidated: boolean;
}

export type WorldClockEvent =
  | { id: 'clock.blue_hour'; boundaryMinute: number; kind: 'phase' }
  | { id: 'clock.curfew'; boundaryMinute: number; kind: 'curfew' }
  | {
      id: 'clock.deadline';
      boundaryMinute: number;
      kind: 'deadline-failure';
      missing: Array<'medkits-returned' | 'transit-validated'>;
    };

export interface WorldClockResult {
  state: WorldClockState;
  events: WorldClockEvent[];
}

export const LEVEL0_START_MINUTE = 18 * 60 + 30;
export const LEVEL0_BLUE_HOUR_MINUTE = 20 * 60;
export const LEVEL0_CURFEW_MINUTE = 22 * 60;
export const LEVEL0_DEADLINE_MINUTE = 24 * 60;
export const LEVEL0_TIME_SCALE = 30;

const boundaryIdForMinute = (minute: number): string | null => {
  if (minute >= LEVEL0_DEADLINE_MINUTE) return 'clock.deadline';
  if (minute >= LEVEL0_CURFEW_MINUTE) return 'clock.curfew';
  if (minute >= LEVEL0_BLUE_HOUR_MINUTE) return 'clock.blue_hour';
  return null;
};

const derivePhase = (minute: number): WorldClockState['phase'] => {
  if (minute >= LEVEL0_CURFEW_MINUTE) return 'curfew';
  if (minute >= LEVEL0_BLUE_HOUR_MINUTE) return 'blue-hour';
  return 'dusk';
};

const processedBoundariesAt = (minute: number): string[] => {
  const ids: string[] = [];
  if (minute >= LEVEL0_BLUE_HOUR_MINUTE) ids.push('clock.blue_hour');
  if (minute >= LEVEL0_CURFEW_MINUTE) ids.push('clock.curfew');
  if (minute >= LEVEL0_DEADLINE_MINUTE) ids.push('clock.deadline');
  return ids;
};

export const createWorldClockState = (
  currentMinute = LEVEL0_START_MINUTE
): WorldClockState => {
  const normalizedMinute = Math.max(0, currentMinute);
  const processedBoundaryIds = processedBoundariesAt(normalizedMinute);
  const lastProcessedScheduleBoundaryId = boundaryIdForMinute(normalizedMinute) ?? undefined;
  const phase = derivePhase(normalizedMinute);

  return {
    currentWorldMillisecond: normalizedMinute * 60_000,
    currentMinute: normalizedMinute,
    phase,
    curfewActive: normalizedMinute >= LEVEL0_CURFEW_MINUTE,
    deadlineReached: normalizedMinute >= LEVEL0_DEADLINE_MINUTE,
    ...(lastProcessedScheduleBoundaryId ? { lastProcessedScheduleBoundaryId } : {}),
    processedBoundaryIds,
    pauseOwners: [],
    scheduleStates: {
      lighting: phase,
      publicActivity: normalizedMinute >= LEVEL0_CURFEW_MINUTE ? 'curfew' : 'active',
    },
  };
};

export const acquirePauseOwner = (state: WorldClockState, owner: PauseOwner): WorldClockState => ({
  ...state,
  pauseOwners: state.pauseOwners.includes(owner) ? state.pauseOwners : [...state.pauseOwners, owner],
});

export const releasePauseOwner = (state: WorldClockState, owner: PauseOwner): WorldClockState => ({
  ...state,
  pauseOwners: state.pauseOwners.filter((candidate) => candidate !== owner),
});

export const advanceWorldClock = (
  state: WorldClockState,
  options: {
    realMilliseconds: number;
    activeExploration: boolean;
    completion: CompletionState;
  }
): WorldClockResult => {
  if (
    !options.activeExploration ||
    state.pauseOwners.length > 0 ||
    !Number.isFinite(options.realMilliseconds) ||
    options.realMilliseconds <= 0 ||
    state.deadlineReached
  ) {
    return { state, events: [] };
  }

  const worldMilliseconds = options.realMilliseconds * LEVEL0_TIME_SCALE;
  return moveClockToWorldMillisecond(
    state,
    state.currentWorldMillisecond + worldMilliseconds,
    options.completion
  );
};

export const jumpWorldClockMinutes = (
  state: WorldClockState,
  minutes: number,
  completion: CompletionState
): WorldClockResult => {
  if (!Number.isFinite(minutes) || minutes <= 0 || state.deadlineReached) {
    return { state, events: [] };
  }
  return moveClockToWorldMillisecond(
    state,
    state.currentWorldMillisecond + minutes * 60_000,
    completion
  );
};

const moveClockToWorldMillisecond = (
  state: WorldClockState,
  requestedWorldMillisecond: number,
  completion: CompletionState
): WorldClockResult => {
  const deadlineMillisecond = LEVEL0_DEADLINE_MINUTE * 60_000;
  const nextWorldMillisecond = Math.min(requestedWorldMillisecond, deadlineMillisecond);
  const previousMinute = state.currentWorldMillisecond / 60_000;
  const nextMinute = nextWorldMillisecond / 60_000;
  const processed = new Set(state.processedBoundaryIds);
  const events: WorldClockEvent[] = [];

  const crosses = (boundaryMinute: number) =>
    previousMinute < boundaryMinute && nextMinute >= boundaryMinute;

  if (crosses(LEVEL0_BLUE_HOUR_MINUTE) && !processed.has('clock.blue_hour')) {
    processed.add('clock.blue_hour');
    events.push({
      id: 'clock.blue_hour',
      boundaryMinute: LEVEL0_BLUE_HOUR_MINUTE,
      kind: 'phase',
    });
  }
  if (crosses(LEVEL0_CURFEW_MINUTE) && !processed.has('clock.curfew')) {
    processed.add('clock.curfew');
    events.push({
      id: 'clock.curfew',
      boundaryMinute: LEVEL0_CURFEW_MINUTE,
      kind: 'curfew',
    });
  }
  if (crosses(LEVEL0_DEADLINE_MINUTE) && !processed.has('clock.deadline')) {
    processed.add('clock.deadline');
    const missing: Array<'medkits-returned' | 'transit-validated'> = [];
    if (!completion.medkitsReturned) missing.push('medkits-returned');
    if (!completion.transitValidated) missing.push('transit-validated');
    if (missing.length > 0) {
      events.push({
        id: 'clock.deadline',
        boundaryMinute: LEVEL0_DEADLINE_MINUTE,
        kind: 'deadline-failure',
        missing,
      });
    }
  }

  const phase = derivePhase(nextMinute);
  const lastProcessedScheduleBoundaryId = boundaryIdForMinute(nextMinute) ?? undefined;
  return {
    state: {
      ...state,
      currentWorldMillisecond: nextWorldMillisecond,
      currentMinute: nextMinute,
      phase,
      curfewActive: nextMinute >= LEVEL0_CURFEW_MINUTE,
      deadlineReached: nextMinute >= LEVEL0_DEADLINE_MINUTE,
      ...(lastProcessedScheduleBoundaryId ? { lastProcessedScheduleBoundaryId } : {}),
      processedBoundaryIds: [...processed],
      scheduleStates: {
        ...state.scheduleStates,
        lighting: phase,
        publicActivity: nextMinute >= LEVEL0_CURFEW_MINUTE ? 'curfew' : 'active',
      },
    },
    events,
  };
};
