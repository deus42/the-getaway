import type { GameBibleUiState } from '../../../content/gameBible/types';
import { deriveLevel0ParanoiaTier } from '../rpg/gates';
import type { Level0RuntimeState } from '../../../store/level0RuntimeSlice';
import type { Level0MissionState, Level0RunState } from '../runtime/types';
import type { PlaytestEvidenceClass } from '../../playtest/playtestContractV2';

export const LEVEL0_PLAYTEST_OBSERVATION_SCHEMA = 'level0_playtest_observation_v2' as const;

export const LEVEL0_PLAYTEST_PROBE_IDS = [
  'level0.creation',
  'level0.lira-acceptance',
  'level0.preparation',
  'level0.departure-baseline',
  'level0.infiltration',
  'level0.medkits',
  'level0.manifest-unknown',
  'level0.manifest-naila-warning',
  'level0.manifest-recognized',
  'level0.manifest-copied',
  'level0.surveillance-recovery',
  'level0.return',
  'level0.transit-validation',
  'level0.debrief',
  'level0.capture',
  'level0.deadline',
  'level0.restart-attempt',
] as const;

export type Level0PlaytestProbeId = typeof LEVEL0_PLAYTEST_PROBE_IDS[number];
export type Level0PlaytestTransitionId =
  | 'level0.transition.surveillance-recovered'
  | 'level0.transition.restart-attempt';

export interface Level0PlaytestProbeDefinition {
  id: Level0PlaytestProbeId;
  label: string;
}

export const LEVEL0_PLAYTEST_PROBE_CATALOG: readonly Level0PlaytestProbeDefinition[] = [
  { id: 'level0.creation', label: 'Cover creation' },
  { id: 'level0.lira-acceptance', label: 'Lira acceptance' },
  { id: 'level0.preparation', label: 'Preparation' },
  { id: 'level0.departure-baseline', label: 'Departure baseline' },
  { id: 'level0.infiltration', label: 'Infiltration' },
  { id: 'level0.medkits', label: 'Medkits secured' },
  { id: 'level0.manifest-unknown', label: 'Manifest unknown' },
  { id: 'level0.manifest-naila-warning', label: 'Manifest Naila warning' },
  { id: 'level0.manifest-recognized', label: 'Manifest recognized' },
  { id: 'level0.manifest-copied', label: 'Manifest copied' },
  { id: 'level0.surveillance-recovery', label: 'Surveillance recovery' },
  { id: 'level0.return', label: 'Return to Lira' },
  { id: 'level0.transit-validation', label: 'Transit validation' },
  { id: 'level0.debrief', label: 'Debrief' },
  { id: 'level0.capture', label: 'Capture failure' },
  { id: 'level0.deadline', label: 'Deadline failure' },
  { id: 'level0.restart-attempt', label: 'Restart Attempt restoration' },
] as const;

type ManifestEvidenceState =
  | 'unknown'
  | 'naila-warning'
  | 'manifest-recognized'
  | 'manifest-copied';

interface CompactLevel0RuntimeObservation {
  schemaVersion: number;
  sessionId: string;
  coverId: string;
  mission: Level0MissionState;
  objectiveStates: Record<string, string>;
  knownFactIds: string[];
  consultedContacts: string[];
  pauseOwners: string[];
  currentWorldMinute: number;
  clockPhase: string;
  paranoiaTier: string;
  safehouse: {
    insideBoundary: boolean;
    operationAttemptBaselineCreated: boolean;
    transitCredentialState: string;
    debriefAvailable: boolean;
  };
  surveillance: {
    level: string;
    directlyObserved: boolean;
    sourceDeviceId: string | null;
    lastKnownPosition: { x: number; y: number } | null;
  };
  playerPosition: { x: number; y: number };
  completion: {
    medkitsReturned: boolean;
    transitValidated: boolean;
  };
  failureCause: string | null;
  failureSourceId: string | null;
  manifestEvidenceState: ManifestEvidenceState;
}

export interface Level0PlaytestObservationV2 {
  schema: typeof LEVEL0_PLAYTEST_OBSERVATION_SCHEMA;
  capturedAt: string;
  evidenceClass: PlaytestEvidenceClass;
  gateRun: string | null;
  runtime: CompactLevel0RuntimeObservation | null;
  feedbackId: string | null;
  transitionIds: Level0PlaytestTransitionId[];
}

export interface Level0PlaytestProbeResult {
  probeId: Level0PlaytestProbeId;
  state: 'met' | 'unmet' | 'unavailable';
  acceptanceEligible: boolean;
  reason: string;
}

interface BuildLevel0PlaytestObservationOptions {
  runtime: Level0RuntimeState;
  evidenceClass: PlaytestEvidenceClass;
  gateRun: string | null;
  transitionIds: readonly Level0PlaytestTransitionId[];
}

interface Level0PlaytestObserverStore {
  getState(): { level0Runtime: Level0RuntimeState };
}

const DEFAULT_GAME_BIBLE_STATE: GameBibleUiState = {
  open: false,
  chapterId: null,
  sectionId: null,
  query: '',
  drawerOpen: false,
  resultCount: 0,
  visibleResults: [],
};

const GATE_RUN_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9._:-]{0,79})$/;

const diagnosticEnvironment = (nodeEnv?: string): string | undefined =>
  nodeEnv ?? (typeof process !== 'undefined' ? process.env.NODE_ENV : undefined);

const diagnosticsEnabled = (search: string, nodeEnv?: string): boolean =>
  diagnosticEnvironment(nodeEnv) !== 'production' &&
  new URLSearchParams(search).get('agent') === '1';

export const resolveLevel0GateRunMarker = (
  search: string,
  nodeEnv?: string
): string | null => {
  if (!diagnosticsEnabled(search, nodeEnv)) return null;
  const gateRun = new URLSearchParams(search).get('gateRun');
  return gateRun && GATE_RUN_PATTERN.test(gateRun) ? gateRun : null;
};

const deriveManifestEvidenceState = (run: Level0RunState): ManifestEvidenceState => {
  const known = run.facts.known;
  if (known['fact.cache.cold_iron_copied']) return 'manifest-copied';
  if (known['fact.cache.cold_iron_recognized']) return 'manifest-recognized';
  if (known['fact.naila.cold_iron_pattern']) return 'naila-warning';
  return 'unknown';
};

const compactRuntime = (run: Level0RunState): CompactLevel0RuntimeObservation => ({
  schemaVersion: run.schemaVersion,
  sessionId: run.sessionId,
  coverId: run.identity.coverId,
  mission: run.mission,
  objectiveStates: Object.fromEntries(
    Object.values(run.objectives).map((objective) => [objective.objectiveId, objective.status])
  ),
  knownFactIds: Object.keys(run.facts.known).sort(),
  consultedContacts: (Object.keys(run.contacts) as Array<keyof typeof run.contacts>)
    .filter((contactId) => run.contacts[contactId].consulted),
  pauseOwners: [...run.worldClock.pauseOwners],
  currentWorldMinute: run.worldClock.currentMinute,
  clockPhase: run.worldClock.phase,
  paranoiaTier: deriveLevel0ParanoiaTier(run.paranoia),
  safehouse: {
    insideBoundary: run.safehouse.insideBoundary,
    operationAttemptBaselineCreated: run.safehouse.operationAttemptBaselineCreated,
    transitCredentialState: run.safehouse.transitCredentialState,
    debriefAvailable: run.safehouse.debriefAvailable,
  },
  surveillance: {
    level: run.surveillance.level,
    directlyObserved: run.surveillance.directlyObserved,
    sourceDeviceId: run.surveillance.sourceDeviceId ?? null,
    lastKnownPosition: run.surveillance.lastKnownPosition
      ? { ...run.surveillance.lastKnownPosition }
      : null,
  },
  playerPosition: { ...run.player.position },
  completion: { ...run.completion },
  failureCause: run.failureCause,
  failureSourceId: run.failureSourceId,
  manifestEvidenceState: deriveManifestEvidenceState(run),
});

export const buildLevel0PlaytestObservation = (
  options: BuildLevel0PlaytestObservationOptions
): Level0PlaytestObservationV2 => ({
  schema: LEVEL0_PLAYTEST_OBSERVATION_SCHEMA,
  capturedAt: new Date().toISOString(),
  evidenceClass: options.evidenceClass,
  gateRun: options.gateRun,
  runtime: options.runtime.run ? compactRuntime(options.runtime.run) : null,
  feedbackId: options.runtime.feedbackId,
  transitionIds: [...options.transitionIds],
});

const MISSION_SEQUENCE: readonly Level0MissionState[] = [
  'L0_COVER_SELECT',
  'L0_SAFEHOUSE_INTRO',
  'L0_LIRA_BRIEFING',
  'L0_PREPARATION',
  'L0_OPERATION_DEPARTED',
  'L0_INFILTRATION',
  'L0_MEDKITS_SECURED',
  'L0_ESCAPE',
  'L0_LIRA_RETURN',
  'L0_TRANSIT_VALIDATION',
  'L0_DEBRIEF',
  'L0_COMPLETE',
] as const;

const missionReached = (
  mission: Level0MissionState,
  target: Level0MissionState
): boolean => {
  const currentIndex = MISSION_SEQUENCE.indexOf(mission);
  const targetIndex = MISSION_SEQUENCE.indexOf(target);
  return currentIndex >= 0 && targetIndex >= 0 && currentIndex >= targetIndex;
};

const probeObserved = (
  probeId: Level0PlaytestProbeId,
  observation: Level0PlaytestObservationV2
): boolean => {
  const runtime = observation.runtime;
  if (!runtime) return false;
  switch (probeId) {
    case 'level0.creation':
      return runtime.coverId.length > 0;
    case 'level0.lira-acceptance':
      return missionReached(runtime.mission, 'L0_PREPARATION');
    case 'level0.preparation':
      return missionReached(runtime.mission, 'L0_PREPARATION');
    case 'level0.departure-baseline':
      return runtime.safehouse.operationAttemptBaselineCreated;
    case 'level0.infiltration':
      return missionReached(runtime.mission, 'L0_INFILTRATION');
    case 'level0.medkits':
      return missionReached(runtime.mission, 'L0_MEDKITS_SECURED') ||
        runtime.completion.medkitsReturned;
    case 'level0.manifest-unknown':
      return runtime.manifestEvidenceState === 'unknown';
    case 'level0.manifest-naila-warning':
      return runtime.manifestEvidenceState === 'naila-warning';
    case 'level0.manifest-recognized':
      return runtime.manifestEvidenceState === 'manifest-recognized';
    case 'level0.manifest-copied':
      return runtime.manifestEvidenceState === 'manifest-copied';
    case 'level0.surveillance-recovery':
      return observation.transitionIds.includes('level0.transition.surveillance-recovered');
    case 'level0.return':
      return runtime.completion.medkitsReturned || missionReached(runtime.mission, 'L0_LIRA_RETURN');
    case 'level0.transit-validation':
      return runtime.completion.transitValidated ||
        missionReached(runtime.mission, 'L0_TRANSIT_VALIDATION');
    case 'level0.debrief':
      return missionReached(runtime.mission, 'L0_DEBRIEF');
    case 'level0.capture':
      return runtime.failureCause === 'failure.capture';
    case 'level0.deadline':
      return runtime.failureCause === 'failure.deadline';
    case 'level0.restart-attempt':
      return observation.transitionIds.includes('level0.transition.restart-attempt');
  }
};

export const evaluateLevel0PlaytestProbe = (
  probeId: Level0PlaytestProbeId,
  observation: Level0PlaytestObservationV2
): Level0PlaytestProbeResult => {
  if (!observation.runtime) {
    return {
      probeId,
      state: 'unavailable',
      acceptanceEligible: false,
      reason: 'runtime-unavailable',
    };
  }
  const met = probeObserved(probeId, observation);
  if (observation.evidenceClass === 'fixture-only') {
    return {
      probeId,
      state: met ? 'met' : 'unmet',
      acceptanceEligible: false,
      reason: 'fixture-only-evidence',
    };
  }
  return {
    probeId,
    state: met ? 'met' : 'unmet',
    acceptanceEligible: met,
    reason: met ? 'observed-authoritative-state' : 'milestone-not-observed',
  };
};

const recordObservedTransitions = (
  previous: CompactLevel0RuntimeObservation | null,
  current: CompactLevel0RuntimeObservation | null,
  transitionIds: Set<Level0PlaytestTransitionId>
): void => {
  if (!previous || !current || previous.sessionId !== current.sessionId) return;
  if (previous.surveillance.level !== 'clear' && current.surveillance.level === 'clear') {
    transitionIds.add('level0.transition.surveillance-recovered');
  }
  if (
    previous.safehouse.operationAttemptBaselineCreated &&
    current.safehouse.operationAttemptBaselineCreated &&
    previous.mission !== 'L0_OPERATION_DEPARTED' &&
    current.mission === 'L0_OPERATION_DEPARTED'
  ) {
    transitionIds.add('level0.transition.restart-attempt');
  }
};

export const installLevel0PlaytestObserver = (options: {
  store: Level0PlaytestObserverStore;
  search?: string;
  nodeEnv?: string;
  evidenceClass?: Exclude<PlaytestEvidenceClass, 'fixture-only'>;
  getGameBibleUiState?: () => GameBibleUiState;
}): (() => void) => {
  if (typeof window === 'undefined') return () => undefined;
  const search = options.search ?? window.location.search;
  delete window.__getawayAgent;
  delete window.advanceTime;
  if (!diagnosticsEnabled(search, options.nodeEnv)) {
    delete window.render_game_to_text;
    return () => undefined;
  }

  const gateRun = resolveLevel0GateRunMarker(search, options.nodeEnv);
  const transitionIds = new Set<Level0PlaytestTransitionId>();
  let previousRuntime: CompactLevel0RuntimeObservation | null = null;

  const renderGameToText = (): string => {
    const observation = buildLevel0PlaytestObservation({
      runtime: options.store.getState().level0Runtime,
      evidenceClass: options.evidenceClass ?? 'live-guided',
      gateRun,
      transitionIds: [...transitionIds],
    });
    recordObservedTransitions(previousRuntime, observation.runtime, transitionIds);
    previousRuntime = observation.runtime;
    const observationWithTransitions = {
      ...observation,
      transitionIds: [...transitionIds],
    };
    return JSON.stringify({
      ...observationWithTransitions,
      probes: LEVEL0_PLAYTEST_PROBE_IDS.map((probeId) =>
        evaluateLevel0PlaytestProbe(probeId, observationWithTransitions)
      ),
      gameBible: options.getGameBibleUiState?.() ?? DEFAULT_GAME_BIBLE_STATE,
    });
  };

  window.render_game_to_text = renderGameToText;
  return () => {
    if (window.render_game_to_text === renderGameToText) delete window.render_game_to_text;
  };
};

declare global {
  interface Window {
    render_game_to_text?: () => string;
  }
}
