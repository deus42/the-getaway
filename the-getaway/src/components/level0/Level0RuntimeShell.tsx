import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LEVEL0_LAYOUT_CONTRACT } from '../../content/levels/level0/layoutContract';
import { resolveLevel0Interaction } from '../../game/level0/interaction/interactionResolver';
import {
  LEVEL0_AUTOSAVE_KEY,
  LEVEL0_RETRY_KEY,
  clearLevel0Persistence,
  readLevel0Autosave,
  readLevel0Retry,
  writeLevel0DepartureTransaction,
  writeLevel0Autosave,
} from '../../game/level0/runtime/persistence';
import {
  departLevel0Operation,
  evaluateSafehouseAction,
} from '../../game/level0/runtime/safehouse';
import {
  getKnownLevel0AnchorIds,
  getWorldOwnedLevel0AnchorIds,
} from '../../game/level0/runtime/mapKnowledge';
import type { SafehouseActionId } from '../../game/level0/runtime/types';
import {
  GETAWAY_AGENT_START_LEVEL0_EVENT,
  LEVEL0_AGENT_INTERACTION_EVENT,
  LEVEL0_AGENT_RETRY_EVENT,
  installLevel0AgentBridge,
} from '../../game/level0/playtest/level0AgentBridge';
import type { Level0AgentInteractionDetail } from '../../game/level0/playtest/events';
import type { AppDispatch, RootState } from '../../store';
import { PERSISTED_STATE_KEY, resetGame, store } from '../../store';
import {
  acquireLevel0Pause,
  advanceLevel0Clock,
  applyLevel0SafehouseAction as applyLevel0SafehouseActionState,
  commitLevel0Departure,
  hydrateLevel0Run,
  initializeLevel0Run,
  releaseLevel0Pause,
  restoreLevel0Retry,
  setLevel0Feedback,
  syncLevel0PlayerCheckpoint,
  initialLevel0RuntimeState,
} from '../../store/level0RuntimeSlice';
import Level0GameCanvas from './Level0GameCanvas';
import './Level0RuntimeShell.css';

const getStorage = (): Storage | null =>
  typeof window === 'undefined' ? null : window.localStorage;

const readEntryState = () => {
  const storage = getStorage();
  if (!storage) {
    return { compatibleAutosave: false, incompatibleSave: false, hasRetry: false };
  }
  const autosave = readLevel0Autosave(storage);
  const retiredPrototype = storage.getItem(PERSISTED_STATE_KEY) !== null;
  return {
    compatibleAutosave: autosave.status === 'compatible',
    incompatibleSave: autosave.status === 'incompatible' || retiredPrototype,
    hasRetry: readLevel0Retry(storage).status === 'compatible',
  };
};

const makeSessionId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `level0-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const formatWorldTime = (minute: number): string => {
  const clamped = Math.max(0, Math.min(24 * 60, Math.floor(minute)));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const FEEDBACK_COPY: Record<string, string> = {
  'movement.target.accepted': 'Direct movement target accepted.',
  'movement.blocked': 'Movement blocked by authored geometry.',
  'movement.invalid.outside-district': 'Destination is outside the district.',
  'movement.invalid.occupied': 'Destination is occupied. No route was substituted.',
  'movement.invalid.blocked-surface': 'Destination is not walkable.',
  'interaction.none': 'No usable interaction is in range.',
  'interaction.too_far': 'Move closer to use that target.',
  'interaction.occluded': 'The target is blocked from this position.',
  'interaction.unavailable': 'That interaction is currently unavailable.',
  'interaction.undiscovered': 'That target has not been discovered.',
  'interaction.wrong_owner': 'That target is not owned by the world interaction layer.',
  'safehouse.action.wait.applied': 'Waited safely for 30 minutes.',
  'safehouse.action.rest.applied': 'Restored Health and reduced Paranoia. 30 minutes passed.',
  'safehouse.departure.complete': 'Operation departure snapshot created.',
  'retry.restored': 'Operation departure state restored.',
};

const actionLabel = (actionId: SafehouseActionId): string => {
  switch (actionId) {
    case 'wait': return 'Wait 30m';
    case 'rest': return 'Rest 30m';
    case 'depart': return 'Begin operation';
    default: return actionId;
  }
};

const Level0RuntimeShell = () => {
  const dispatch = useDispatch<AppDispatch>();
  const runtime = useSelector(
    (state: RootState) => state.level0Runtime ?? initialLevel0RuntimeState
  );
  const locale = useSelector((state: RootState) => state.settings.locale);
  const [entryState, setEntryState] = useState(readEntryState);
  const [menuOpen, setMenuOpen] = useState(true);
  const [pendingSafehouseAction, setPendingSafehouseAction] = useState<
    'wait' | 'rest' | 'depart' | null
  >(null);
  const agentStartedRef = useRef(false);
  const run = runtime.run;
  const runSessionId = run?.sessionId ?? null;
  const hasRun = run !== null;
  const observationActive = run?.worldClock.pauseOwners.includes('observation') ?? false;
  const terminalMission = run?.mission === 'L0_FAILED' || run?.mission === 'L0_COMPLETE';
  const movementPaused = (run?.worldClock.pauseOwners.length ?? 0) > 0 || terminalMission;
  const ukrainian = locale === 'uk';

  const persistCurrentRun = useCallback(() => {
    const storage = getStorage();
    const currentRun = store.getState().level0Runtime.run;
    if (!storage || !currentRun) return;
    writeLevel0Autosave(storage, currentRun);
    setEntryState((current) =>
      current.compatibleAutosave ? current : { ...current, compatibleAutosave: true }
    );
  }, []);

  const startNewGame = useCallback(() => {
    const storage = getStorage();
    if (storage) {
      clearLevel0Persistence(storage);
      storage.removeItem(PERSISTED_STATE_KEY);
    }
    dispatch(resetGame());
    dispatch(initializeLevel0Run({ sessionId: makeSessionId() }));
    setMenuOpen(false);
    setEntryState({ compatibleAutosave: true, incompatibleSave: false, hasRetry: false });
    const nextRun = store.getState().level0Runtime.run;
    if (storage && nextRun) writeLevel0Autosave(storage, nextRun);
  }, [dispatch]);

  const continueGame = useCallback(() => {
    if (run) {
      dispatch(releaseLevel0Pause('menu'));
      setMenuOpen(false);
      return;
    }
    const storage = getStorage();
    if (!storage) return;
    const result = readLevel0Autosave(storage);
    if (result.status !== 'compatible') {
      setEntryState((current) => ({ ...current, compatibleAutosave: false, incompatibleSave: true }));
      return;
    }
    dispatch(hydrateLevel0Run(result.envelope.payload));
    setMenuOpen(false);
  }, [dispatch, run]);

  const openMenu = useCallback(() => {
    if (run) dispatch(acquireLevel0Pause('menu'));
    persistCurrentRun();
    setMenuOpen(true);
  }, [dispatch, persistCurrentRun, run]);

  const toggleObservation = useCallback(() => {
    if (!run || menuOpen || pendingSafehouseAction || terminalMission) return;
    dispatch(observationActive ? releaseLevel0Pause('observation') : acquireLevel0Pause('observation'));
    dispatch(setLevel0Feedback(observationActive ? 'observation.closed' : 'observation.opened'));
  }, [dispatch, menuOpen, observationActive, pendingSafehouseAction, run, terminalMission]);

  const applySafehouseAction = useCallback((actionId: 'wait' | 'rest') => {
    dispatch(applyLevel0SafehouseActionState(actionId));
    persistCurrentRun();
  }, [dispatch, persistCurrentRun]);

  const beginOperation = useCallback(() => {
    const storage = getStorage();
    const currentRun = store.getState().level0Runtime.run;
    const departureAnchor = LEVEL0_LAYOUT_CONTRACT.anchors.find(
      (anchor) => anchor.id === 'safehouse.departure'
    );
    if (!storage || !currentRun || !departureAnchor) {
      dispatch(setLevel0Feedback('safehouse.departure.persistence_unavailable'));
      return;
    }
    const departure = departLevel0Operation(currentRun, departureAnchor.position);
    if (!departure.created || !departure.snapshot) {
      dispatch(setLevel0Feedback('safehouse.departure.blocked'));
      return;
    }
    const transaction = writeLevel0DepartureTransaction(
      storage,
      departure.run,
      departure.snapshot
    );
    if (transaction.status === 'conflict') {
      dispatch(setLevel0Feedback(`safehouse.departure.${transaction.reason}`));
      return;
    }
    dispatch(commitLevel0Departure(departure.run));
    setEntryState((current) => ({
      ...current,
      compatibleAutosave: true,
      hasRetry: true,
    }));
  }, [dispatch]);

  const requestSafehouseAction = useCallback((actionId: 'wait' | 'rest' | 'depart') => {
    const currentRun = store.getState().level0Runtime.run;
    if (
      !currentRun ||
      pendingSafehouseAction ||
      currentRun.mission === 'L0_FAILED' ||
      currentRun.mission === 'L0_COMPLETE'
    ) return;
    const availability = evaluateSafehouseAction(currentRun, actionId);
    if (!availability.available) {
      dispatch(setLevel0Feedback(availability.blockedReasonId ?? 'safehouse.blocked'));
      return;
    }
    dispatch(acquireLevel0Pause('safehouse_action'));
    setPendingSafehouseAction(actionId);
  }, [dispatch, pendingSafehouseAction]);

  const closeSafehouseConfirmation = useCallback(() => {
    dispatch(releaseLevel0Pause('safehouse_action'));
    setPendingSafehouseAction(null);
  }, [dispatch]);

  const confirmSafehouseAction = useCallback(() => {
    if (!pendingSafehouseAction) return;
    if (pendingSafehouseAction === 'depart') beginOperation();
    else applySafehouseAction(pendingSafehouseAction);
    closeSafehouseConfirmation();
  }, [applySafehouseAction, beginOperation, closeSafehouseConfirmation, pendingSafehouseAction]);

  const retryOperation = useCallback(() => {
    const storage = getStorage();
    if (!storage) return;
    const result = readLevel0Retry(storage);
    if (result.status !== 'compatible') {
      dispatch(setLevel0Feedback('retry.unavailable'));
      return;
    }
    dispatch(restoreLevel0Retry(result.envelope.payload));
    setMenuOpen(false);
    setEntryState((current) => ({ ...current, compatibleAutosave: true, hasRetry: true }));
    const nextRun = store.getState().level0Runtime.run;
    if (nextRun) writeLevel0Autosave(storage, nextRun);
  }, [dispatch]);

  const handleInteraction = useCallback((preferredAnchorId?: string) => {
    const currentRun = store.getState().level0Runtime.run;
    if (!currentRun || observationActive || menuOpen || terminalMission) return;
    const knownAnchorIds = getKnownLevel0AnchorIds(currentRun);
    const worldOwnedAnchorIds = getWorldOwnedLevel0AnchorIds(currentRun);
    const unavailableReasonByAnchorId: Record<string, string> = {};
    ([
      ['interaction.safehouse.wait', 'wait'],
      ['interaction.safehouse.rest', 'rest'],
      ['safehouse.departure', 'depart'],
    ] as const).forEach(([anchorId, actionId]) => {
      const availability = evaluateSafehouseAction(currentRun, actionId);
      if (!availability.available) {
        unavailableReasonByAnchorId[anchorId] = availability.blockedReasonId ?? 'interaction.unavailable';
      }
    });
    const result = resolveLevel0Interaction(
      LEVEL0_LAYOUT_CONTRACT,
      currentRun.player.position,
      {
        ...(preferredAnchorId ? { preferredAnchorId } : {}),
        knownAnchorIds,
        worldOwnedAnchorIds,
        unavailableReasonByAnchorId,
      }
    );
    if (result.status !== 'available' || !result.anchor) {
      dispatch(setLevel0Feedback(result.reasonId ?? 'interaction.none'));
      return;
    }
    if (result.anchor.id === 'interaction.safehouse.wait') {
      requestSafehouseAction('wait');
      return;
    }
    if (result.anchor.id === 'interaction.safehouse.rest') {
      requestSafehouseAction('rest');
      return;
    }
    if (result.anchor.id === 'safehouse.departure') {
      requestSafehouseAction('depart');
      return;
    }
    dispatch(setLevel0Feedback(`interaction.preview.${result.anchor.id}`));
  }, [dispatch, menuOpen, observationActive, requestSafehouseAction, terminalMission]);

  useLayoutEffect(() => {
    document.documentElement.dataset.visualStyle = 'graphic-surveillance-noir-greybox';
    return () => {
      delete document.documentElement.dataset.visualStyle;
    };
  }, []);

  useEffect(() => {
    if (!hasRun || menuOpen) return undefined;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      dispatch(advanceLevel0Clock({ realDeltaMilliseconds: Math.min(1_000, now - previous) }));
      previous = now;
    }, 250);
    return () => window.clearInterval(timer);
  }, [dispatch, hasRun, menuOpen, runSessionId]);

  useEffect(() => {
    if (!hasRun) return undefined;
    const timer = window.setInterval(persistCurrentRun, 10_000);
    const persistOnExit = () => persistCurrentRun();
    window.addEventListener('pagehide', persistOnExit);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('pagehide', persistOnExit);
    };
  }, [hasRun, persistCurrentRun, runSessionId]);

  useEffect(() => {
    if (!hasRun) return undefined;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (pendingSafehouseAction) closeSafehouseConfirmation();
      else if (menuOpen) continueGame();
      else openMenu();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [closeSafehouseConfirmation, continueGame, hasRun, menuOpen, openMenu, pendingSafehouseAction, runSessionId]);

  useEffect(() => {
    if (typeof window === 'undefined' || agentStartedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('agent') === '1' && params.get('agentStart') === 'level0') {
      agentStartedRef.current = true;
      if (params.get('fresh') === '1' || !entryState.compatibleAutosave) {
        startNewGame();
      } else {
        continueGame();
      }
    }
  }, [continueGame, entryState.compatibleAutosave, startNewGame]);

  useEffect(() => installLevel0AgentBridge({ store }), []);

  useEffect(() => {
    const startFromAgent = () => startNewGame();
    const retryFromAgent = () => retryOperation();
    const interactFromAgent = (event: Event) => {
      const detail = (event as CustomEvent<Level0AgentInteractionDetail>).detail;
      handleInteraction(detail?.anchorId);
    };
    window.addEventListener(GETAWAY_AGENT_START_LEVEL0_EVENT, startFromAgent);
    window.addEventListener(LEVEL0_AGENT_RETRY_EVENT, retryFromAgent);
    window.addEventListener(LEVEL0_AGENT_INTERACTION_EVENT, interactFromAgent);
    return () => {
      window.removeEventListener(GETAWAY_AGENT_START_LEVEL0_EVENT, startFromAgent);
      window.removeEventListener(LEVEL0_AGENT_RETRY_EVENT, retryFromAgent);
      window.removeEventListener(LEVEL0_AGENT_INTERACTION_EVENT, interactFromAgent);
    };
  }, [handleInteraction, retryOperation, startNewGame]);

  const clockEventSignature = runtime.clockEventIds.join('|');
  useEffect(() => {
    if (!hasRun || !clockEventSignature) return;
    persistCurrentRun();
  }, [clockEventSignature, hasRun, persistCurrentRun, runSessionId]);

  const safehouseActions = useMemo(() => {
    if (!run) return [];
    return (['wait', 'rest', 'depart'] as const).map((actionId) => ({
      actionId,
      availability: evaluateSafehouseAction(run, actionId),
    }));
  }, [run]);

  const feedbackCopy = runtime.feedbackId
    ? FEEDBACK_COPY[runtime.feedbackId] ?? runtime.feedbackId.split('.').join(' ')
    : 'Click a destination or use WASD. E interacts. O pauses for observation.';

  if (!run || menuOpen) {
    return (
      <main className="level0-entry" data-testid="level0-start-menu">
        <section className="level0-entry__panel">
          <p className="level0-entry__eyebrow">HIDZU CONTROL DISTRICT / LEVEL 0</p>
          <h1>{ukrainian ? 'Втеча з Токіо' : 'Tokyo Escape'}</h1>
          <p className="level0-entry__promise">
            {ukrainian
              ? 'Нагляд, параноя, розмови та втеча. Поточна збірка — чесний ігровий грейбокс нового прологу.'
              : 'Surveillance, paranoia, dialogue, and escape. This build is the honest playable greybox of the rebuilt prologue.'}
          </p>
          {entryState.incompatibleSave ? (
            <div className="level0-entry__notice" data-testid="retired-save-notice">
              {ukrainian
                ? 'Старе збереження прототипу несумісне. Воно не буде змінене, доки ви явно не почнете Нову гру.'
                : 'A retired prototype save is incompatible. It will remain untouched until you explicitly start New Game.'}
            </div>
          ) : null}
          <div className="level0-entry__actions">
            <button type="button" data-testid="level0-new-game" onClick={startNewGame}>
              {ukrainian ? 'Нова гра' : 'New Game'}
            </button>
            <button
              type="button"
              data-testid="level0-continue"
              disabled={!run && !entryState.compatibleAutosave}
              onClick={continueGame}
            >
              {ukrainian ? 'Продовжити' : 'Continue'}
            </button>
            {entryState.hasRetry ? (
              <button type="button" data-testid="level0-retry" onClick={retryOperation}>
                {ukrainian ? 'Повторити операцію' : 'Retry operation'}
              </button>
            ) : null}
          </div>
          <dl className="level0-entry__contract">
            <div><dt>Runtime</dt><dd>Direct movement / no A*</dd></div>
            <div><dt>Clock</dt><dd>18:30 / 30× / paused while reading</dd></div>
            <div><dt>World</dt><dd>3 connected traversal loops</dd></div>
          </dl>
          {run ? <button type="button" className="level0-entry__resume" onClick={continueGame}>Return to district</button> : null}
        </section>
      </main>
    );
  }

  const failed = run.mission === 'L0_FAILED';
  const backgroundControlsLocked = pendingSafehouseAction !== null || terminalMission;

  return (
    <main className="level0-runtime" data-testid="level0-runtime-hud">
      <div
        data-testid="level0-runtime-background"
        inert={backgroundControlsLocked ? true : undefined}
      >
        <Level0GameCanvas
          key={`${run.sessionId}:${runtime.sceneRevision}`}
          run={run}
          movementPaused={movementPaused}
          observationActive={observationActive}
          onPlayerCheckpoint={(position, facing) =>
            dispatch(syncLevel0PlayerCheckpoint({ position, facing }))
          }
          onFeedback={(feedbackId) => dispatch(setLevel0Feedback(feedbackId))}
          onInteraction={handleInteraction}
          onObservationToggle={toggleObservation}
        />

        <header className="level0-runtime__topbar">
        <button
          type="button"
          className="level0-runtime__menu"
          disabled={backgroundControlsLocked}
          onClick={openMenu}
        >Menu <span>Esc</span></button>
        <div className="level0-runtime__status">
          <strong>{formatWorldTime(run.worldClock.currentMinute)}</strong>
          <span>{run.worldClock.phase.replace('-', ' ')}</span>
          <span className={run.worldClock.curfewActive ? 'is-danger' : ''}>
            {run.worldClock.curfewActive ? 'CURFEW ACTIVE' : 'CURFEW 22:00'}
          </span>
          <span>DEADLINE 24:00</span>
        </div>
      </header>

      {observationActive ? (
        <aside className="level0-runtime__observation" data-testid="level0-observation-overlay">
          <strong>OBSERVATION / SIMULATION PAUSED</strong>
          <span>Drag to pan. Wheel to zoom. O returns to movement.</span>
        </aside>
      ) : null}

      <section className="level0-runtime__dock">
        <div className="level0-runtime__lane level0-runtime__lane--map">
          <span className="lane-label">DISTRICT</span>
          <strong>Tokyo / Hidzu perimeter</strong>
          <small>Three-loop greybox · zoom 0.60–1.25</small>
        </div>
        <div className="level0-runtime__lane">
          <span className="lane-label">PROTAGONIST</span>
          <div className="level0-runtime__meters">
            <span>HEALTH <b>{run.health}</b></span>
            <span>PARANOIA <b>{run.paranoia}</b></span>
          </div>
          <small>x {run.player.position.x.toFixed(1)} / y {run.player.position.y.toFixed(1)}</small>
        </div>
        <div className="level0-runtime__lane level0-runtime__lane--feedback">
          <span className="lane-label">GEORGE / RUNTIME</span>
          <p>{feedbackCopy}</p>
          <div className="level0-runtime__controls">
            <button
              type="button"
              data-testid="level0-observation"
              aria-pressed={observationActive}
              disabled={backgroundControlsLocked}
              onClick={toggleObservation}
            >
              {observationActive ? 'Resume' : 'Observe'}
            </button>
            <button
              type="button"
              data-testid="level0-interact"
              disabled={backgroundControlsLocked}
              onClick={() => handleInteraction()}
            >Interact</button>
          </div>
        </div>
        <div className="level0-runtime__lane level0-runtime__lane--safehouse">
          <span className="lane-label">CURRENT BEAT</span>
          <strong>{run.mission.replace('L0_', '').split('_').join(' ')}</strong>
          {run.safehouse.insideBoundary ? (
            <div className="level0-runtime__controls">
              {safehouseActions.map(({ actionId, availability }) => (
                <button
                  type="button"
                  key={actionId}
                  data-testid={`safehouse-${actionId}`}
                  disabled={backgroundControlsLocked || !availability.available}
                  title={availability.blockedReasonId}
                  onClick={() => requestSafehouseAction(actionId)}
                >
                  {actionLabel(actionId)}
                </button>
              ))}
            </div>
          ) : <small>Return to the safehouse boundary for planning actions.</small>}
        </div>
      </section>
      </div>

      {pendingSafehouseAction ? (
        <section
          className="level0-runtime__confirmation"
          data-testid="safehouse-confirmation"
          role="dialog"
          aria-modal="true"
          aria-labelledby="safehouse-confirmation-title"
        >
          <div>
            <p>SAFEHOUSE ACTION / TIME PAUSED</p>
            <h2 id="safehouse-confirmation-title">
              {pendingSafehouseAction === 'depart'
                ? 'Leave the safehouse and create the operation Retry point?'
                : pendingSafehouseAction === 'rest'
                  ? `Rest until ${formatWorldTime(Math.min(24 * 60, run.worldClock.currentMinute + 30))}? Health becomes 100 and Paranoia falls by 40 (minimum 0).`
                  : `Wait until ${formatWorldTime(Math.min(24 * 60, run.worldClock.currentMinute + 30))}?`}
            </h2>
            {pendingSafehouseAction !== 'depart' &&
            run.worldClock.currentMinute + 30 >= 24 * 60 &&
            (!run.completion.medkitsReturned || !run.completion.transitValidated) ? (
              <p className="level0-runtime__deadline-warning">
                Confirming will cross the 24:00 deadline and fail the operation.
              </p>
            ) : null}
            <div className="level0-runtime__controls">
              <button type="button" data-testid="safehouse-confirm" onClick={confirmSafehouseAction}>
                Confirm
              </button>
              <button type="button" data-testid="safehouse-cancel" onClick={closeSafehouseConfirmation}>
                Cancel
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {failed ? (
        <section
          className="level0-runtime__failure"
          data-testid="level0-failure"
          role="dialog"
          aria-modal="true"
          aria-labelledby="level0-failure-title"
        >
          <p>OPERATION FAILED</p>
          <h2 id="level0-failure-title">{run.failureMissingRequirements.length === 1
            ? run.failureMissingRequirements[0] === 'medkits-returned'
              ? 'Midnight arrived before the medkits were returned.'
              : 'Midnight arrived before outbound transit was validated.'
            : 'Midnight arrived before the medkits were returned and transit was validated.'}</h2>
          <button type="button" onClick={retryOperation} disabled={!entryState.hasRetry}>Retry from departure</button>
          <button type="button" onClick={openMenu}>Return to menu</button>
        </section>
      ) : null}

      <span className="level0-runtime__storage" aria-hidden="true">
        {LEVEL0_AUTOSAVE_KEY} / {LEVEL0_RETRY_KEY}
      </span>
    </main>
  );
};

export default Level0RuntimeShell;
