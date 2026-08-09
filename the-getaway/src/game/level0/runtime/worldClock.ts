import type { PauseOwner, WorldClockState } from './types';

export interface CompletionState {
  medkitsReturned: boolean;
  transitValidated: boolean;
}

export type StreetMomentId =
  | 'street.wind_down_first'
  | 'street.wind_down_second'
  | 'street.curfew_lockdown'
  | 'street.last_train';

export type Level0ClockBoundaryId =
  | 'clock.blue_hour'
  | 'clock.curfew'
  | 'clock.deadline'
  | StreetMomentId;

export type WorldClockEvent =
  | { id: 'clock.blue_hour'; boundaryMinute: number; kind: 'phase' }
  | { id: 'clock.curfew'; boundaryMinute: number; kind: 'curfew' }
  | { id: StreetMomentId; boundaryMinute: number; kind: 'street-moment' }
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
export const LEVEL0_STREET_WIND_DOWN_FIRST_MINUTE = 21 * 60;
export const LEVEL0_STREET_WIND_DOWN_SECOND_MINUTE = 21 * 60 + 30;
export const LEVEL0_CURFEW_MINUTE = 22 * 60;
export const LEVEL0_STREET_LAST_TRAIN_MINUTE = 23 * 60 + 30;
export const LEVEL0_DEADLINE_MINUTE = 24 * 60;
export const LEVEL0_TIME_SCALE = 30;

export const LEVEL0_STREET_MOMENTS: ReadonlyArray<{
  id: StreetMomentId;
  boundaryMinute: number;
}> = [
  { id: 'street.wind_down_first', boundaryMinute: LEVEL0_STREET_WIND_DOWN_FIRST_MINUTE },
  { id: 'street.wind_down_second', boundaryMinute: LEVEL0_STREET_WIND_DOWN_SECOND_MINUTE },
  { id: 'street.curfew_lockdown', boundaryMinute: LEVEL0_CURFEW_MINUTE },
  { id: 'street.last_train', boundaryMinute: LEVEL0_STREET_LAST_TRAIN_MINUTE },
];

// Canonical processing order for the persisted idempotency set. The save
// validator recomputes this exact sequence, so ordering here is contractual:
// same-minute entries keep curfew activation ahead of its street bundle.
const CLOCK_BOUNDARIES: ReadonlyArray<{
  id: Level0ClockBoundaryId;
  boundaryMinute: number;
}> = [
  { id: 'clock.blue_hour', boundaryMinute: LEVEL0_BLUE_HOUR_MINUTE },
  { id: 'street.wind_down_first', boundaryMinute: LEVEL0_STREET_WIND_DOWN_FIRST_MINUTE },
  { id: 'street.wind_down_second', boundaryMinute: LEVEL0_STREET_WIND_DOWN_SECOND_MINUTE },
  { id: 'clock.curfew', boundaryMinute: LEVEL0_CURFEW_MINUTE },
  { id: 'street.curfew_lockdown', boundaryMinute: LEVEL0_CURFEW_MINUTE },
  { id: 'street.last_train', boundaryMinute: LEVEL0_STREET_LAST_TRAIN_MINUTE },
  { id: 'clock.deadline', boundaryMinute: LEVEL0_DEADLINE_MINUTE },
];

export const processedStreetMomentIdsAt = (minute: number): StreetMomentId[] =>
  LEVEL0_STREET_MOMENTS.filter((moment) => minute >= moment.boundaryMinute).map(
    (moment) => moment.id
  );

export const crossedStreetMoments = (
  previousMinute: number,
  nextMinute: number
): ReadonlyArray<{ id: StreetMomentId; boundaryMinute: number }> =>
  LEVEL0_STREET_MOMENTS.filter(
    (moment) => previousMinute < moment.boundaryMinute && nextMinute >= moment.boundaryMinute
  );

const processedBoundariesAt = (minute: number): Level0ClockBoundaryId[] =>
  CLOCK_BOUNDARIES.filter((boundary) => minute >= boundary.boundaryMinute).map(
    (boundary) => boundary.id
  );

const boundaryIdForMinute = (minute: number): string | null => {
  const processed = processedBoundariesAt(minute);
  return processed.length > 0 ? processed[processed.length - 1] : null;
};

const derivePhase = (minute: number): WorldClockState['phase'] => {
  if (minute >= LEVEL0_CURFEW_MINUTE) return 'curfew';
  if (minute >= LEVEL0_BLUE_HOUR_MINUTE) return 'blue-hour';
  return 'dusk';
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

  for (const boundary of CLOCK_BOUNDARIES) {
    if (!crosses(boundary.boundaryMinute) || processed.has(boundary.id)) continue;
    processed.add(boundary.id);
    if (boundary.id === 'clock.blue_hour') {
      events.push({
        id: 'clock.blue_hour',
        boundaryMinute: boundary.boundaryMinute,
        kind: 'phase',
      });
    } else if (boundary.id === 'clock.curfew') {
      events.push({
        id: 'clock.curfew',
        boundaryMinute: boundary.boundaryMinute,
        kind: 'curfew',
      });
    } else if (boundary.id === 'clock.deadline') {
      const missing: Array<'medkits-returned' | 'transit-validated'> = [];
      if (!completion.medkitsReturned) missing.push('medkits-returned');
      if (!completion.transitValidated) missing.push('transit-validated');
      if (missing.length > 0) {
        events.push({
          id: 'clock.deadline',
          boundaryMinute: boundary.boundaryMinute,
          kind: 'deadline-failure',
          missing,
        });
      }
    } else {
      events.push({
        id: boundary.id,
        boundaryMinute: boundary.boundaryMinute,
        kind: 'street-moment',
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
      processedBoundaryIds: CLOCK_BOUNDARIES.filter((boundary) => processed.has(boundary.id)).map(
        (boundary) => boundary.id
      ),
      scheduleStates: {
        ...state.scheduleStates,
        lighting: phase,
        publicActivity: nextMinute >= LEVEL0_CURFEW_MINUTE ? 'curfew' : 'active',
      },
    },
    events,
  };
};
