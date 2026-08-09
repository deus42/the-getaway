import type { Level0ClockBoundaryId, PauseOwner, WorldClockState } from './types';

export interface CompletionState {
  medkitsReturned: boolean;
  transitValidated: boolean;
}

export type StreetMomentId = Level0ClockBoundaryId;

export type WorldClockEvent =
  | { id: 'clock.blue_hour'; boundaryMinute: number; kind: 'phase' }
  | {
      id: StreetMomentId;
      boundaryMinute: number;
      kind: 'street-moment' | 'curfew';
    }
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
  { id: 'clock.2100', boundaryMinute: LEVEL0_STREET_WIND_DOWN_FIRST_MINUTE },
  { id: 'clock.2130', boundaryMinute: LEVEL0_STREET_WIND_DOWN_SECOND_MINUTE },
  { id: 'clock.2200', boundaryMinute: LEVEL0_CURFEW_MINUTE },
  { id: 'clock.2330', boundaryMinute: LEVEL0_STREET_LAST_TRAIN_MINUTE },
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
  LEVEL0_STREET_MOMENTS.filter((boundary) => minute >= boundary.boundaryMinute).map(
    (boundary) => boundary.id
  );

const boundaryIdForMinute = (minute: number): Level0ClockBoundaryId | null => {
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

  if (crosses(LEVEL0_BLUE_HOUR_MINUTE)) {
    events.push({
      id: 'clock.blue_hour',
      boundaryMinute: LEVEL0_BLUE_HOUR_MINUTE,
      kind: 'phase',
    });
  }

  for (const boundary of LEVEL0_STREET_MOMENTS) {
    if (!crosses(boundary.boundaryMinute) || processed.has(boundary.id)) continue;
    processed.add(boundary.id);
    events.push({
      id: boundary.id,
      boundaryMinute: boundary.boundaryMinute,
      kind: boundary.id === 'clock.2200' ? 'curfew' : 'street-moment',
    });
  }

  if (crosses(LEVEL0_DEADLINE_MINUTE)) {
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
      processedBoundaryIds: LEVEL0_STREET_MOMENTS
        .filter((boundary) => processed.has(boundary.id))
        .map((boundary) => boundary.id),
      scheduleStates: {
        ...state.scheduleStates,
        lighting: phase,
        publicActivity: nextMinute >= LEVEL0_CURFEW_MINUTE ? 'curfew' : 'active',
      },
    },
    events,
  };
};
