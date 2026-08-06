import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LEVEL0_LAYOUT_CONTRACT } from '../../content/levels/level0/layoutContract';
import { isLevel0PlayerAppearanceId } from '../../content/characters/spriteManifest';
import {
  createConfirmedLevel0Sample,
  isValidLevel0Callsign,
  normalizeLevel0Callsign,
} from '../../game/level0/rpg/creation';
import { getParanoiaCheckPenalty } from '../../game/level0/rpg/checks';
import { getNextLevelThreshold } from '../../game/level0/rpg/progression';
import type { PlayerBuild, PlayerIdentity } from '../../game/level0/rpg/types';
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
import type { Level0RunState, SafehouseActionId } from '../../game/level0/runtime/types';
import {
  GETAWAY_AGENT_START_LEVEL0_EVENT,
  LEVEL0_AGENT_INTERACTION_EVENT,
  LEVEL0_AGENT_RETRY_EVENT,
  installLevel0AgentBridge,
} from '../../game/level0/playtest/level0AgentBridge';
import type { Level0AgentInteractionDetail } from '../../game/level0/playtest/events';
import {
  LEVEL0_ACTOR_INTERACTION_PRESENTATION_EVENT,
  type Level0ActorInteractionPresentationDetail,
} from '../../game/level0/scene/level0ActorPresentation';
import { resolveGet204CityStartPosition } from '../../game/level0/art/get204City';
import type { AppDispatch, RootState } from '../../store';
import { PERSISTED_STATE_KEY, resetGame, store } from '../../store';
import {
  acquireLevel0Pause,
  activateLevel0PendingLevel,
  advanceLevel0Clock,
  allocateLevel0Attribute,
  allocateLevel0Skill,
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
import Level0CharacterCreation from './Level0CharacterCreation';
import Level0CharacterPanel from './Level0CharacterPanel';
import Level0GameCanvas from './Level0GameCanvas';
import {
  describeLevel0ResourceEvent,
  describeLevel0Source,
  localizeLevel0Copy,
  type Level0LocalizedCopy,
} from './level0RpgCopy';
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

const FEEDBACK_COPY: Record<string, Level0LocalizedCopy> = {
  'movement.target.accepted': {
    en: 'Direct movement target accepted.',
    uk: 'Ціль прямого руху прийнята.',
  },
  'movement.blocked': {
    en: 'Movement blocked by authored geometry.',
    uk: 'Рух блокує геометрія світу.',
  },
  'movement.invalid.outside-district': {
    en: 'Destination is outside the district.',
    uk: 'Ціль розташована поза межами району.',
  },
  'movement.invalid.occupied': {
    en: 'Destination is occupied. No route was substituted.',
    uk: 'Ціль зайнята. Інший маршрут не обирався.',
  },
  'movement.invalid.blocked-surface': {
    en: 'Destination is not walkable.',
    uk: 'До цієї цілі не можна пройти.',
  },
  'interaction.none': {
    en: 'No usable interaction is in range.',
    uk: 'У межах досяжності немає доступної взаємодії.',
  },
  'interaction.too_far': {
    en: 'Move closer to use that target.',
    uk: 'Підійдіть ближче, щоб скористатися ціллю.',
  },
  'interaction.occluded': {
    en: 'The target is blocked from this position.',
    uk: 'З цієї позиції ціль перекрита.',
  },
  'interaction.unavailable': {
    en: 'That interaction is currently unavailable.',
    uk: 'Ця взаємодія зараз недоступна.',
  },
  'interaction.undiscovered': {
    en: 'That target has not been discovered.',
    uk: 'Цю ціль ще не виявлено.',
  },
  'interaction.wrong_owner': {
    en: 'That target is not controlled by the world interaction layer.',
    uk: 'Ця ціль не належить шару взаємодій світу.',
  },
  'safehouse.action.wait.applied': {
    en: 'Waited safely for 30 minutes.',
    uk: 'Безпечно минуло 30 хвилин.',
  },
  'safehouse.action.rest.applied': {
    en: 'Rest completed. 30 minutes passed.',
    uk: 'Відпочинок завершено. Минуло 30 хвилин.',
  },
  'safehouse.departure.complete': {
    en: 'Operation departure snapshot created.',
    uk: 'Створено точку повтору на виході до операції.',
  },
  'retry.restored': {
    en: 'Operation departure state restored.',
    uk: 'Стан на виході до операції відновлено.',
  },
  'observation.opened': {
    en: 'Observation opened. Simulation paused.',
    uk: 'Режим спостереження відкрито. Симуляцію призупинено.',
  },
  'observation.closed': {
    en: 'Observation closed. Exploration resumed.',
    uk: 'Режим спостереження закрито. Дослідження продовжено.',
  },
  'level_up.activated': {
    en: 'Level increased. Allocate the available points.',
    uk: 'Рівень підвищено. Розподіліть доступні очки.',
  },
  'level_up.skill.allocated': {
    en: 'Skill point allocated.',
    uk: 'Очко навички розподілено.',
  },
  'level_up.attribute.allocated': {
    en: 'Attribute point allocated.',
    uk: 'Очко атрибута розподілено.',
  },
};

const IDLE_FEEDBACK_COPY: Level0LocalizedCopy = {
  en: 'Click a destination or use WASD. E interacts. O pauses for observation.',
  uk: 'Клацніть ціль або використовуйте WASD. E — взаємодія. O — пауза для спостереження.',
};

const GENERIC_FEEDBACK_COPY: Level0LocalizedCopy = {
  en: 'The situation changed. Review the current objective and available actions.',
  uk: 'Ситуація змінилася. Перевірте поточну ціль і доступні дії.',
};

const actionLabel = (actionId: SafehouseActionId): string => {
  switch (actionId) {
    case 'wait': return 'Wait 30m';
    case 'rest': return 'Rest 30m';
    case 'depart': return 'Begin operation';
    default: return actionId;
  }
};

const failureTitle = (
  run: Level0RunState,
  ukrainian: boolean
): string => {
  if (run.failureCause === 'failure.health') {
    return ukrainian
      ? 'Здоров’я впало до 0. Ви не пережили наслідки.'
      : 'Health reached 0. You did not survive the consequence.';
  }
  if (run.failureCause === 'failure.paranoia') {
    return ukrainian
      ? 'Параноя досягла 100. Фізіологічний колапс став смертельним.'
      : 'Paranoia reached 100. The physiological collapse was fatal.';
  }
  if (run.failureCause === 'failure.capture') {
    return ukrainian
      ? 'Hidzu підтвердила вашу особу та затримала вас.'
      : 'Hidzu confirmed your identity and captured you.';
  }
  if (run.failureMissingRequirements.length === 1) {
    return run.failureMissingRequirements[0] === 'medkits-returned'
      ? ukrainian
        ? 'Опівніч настала до повернення медичних засобів.'
        : 'Midnight arrived before the medkits were returned.'
      : ukrainian
        ? 'Опівніч настала до підтвердження виїзного транзиту.'
        : 'Midnight arrived before outbound transit was validated.';
  }
  return ukrainian
    ? 'Опівніч настала до повернення медичних засобів і підтвердження транзиту.'
    : 'Midnight arrived before the medkits were returned and transit was validated.';
};

const Level0RuntimeShell = () => {
  const dispatch = useDispatch<AppDispatch>();
  const runtime = useSelector(
    (state: RootState) => state.level0Runtime ?? initialLevel0RuntimeState
  );
  const locale = useSelector((state: RootState) => state.settings.locale);
  const [entryState, setEntryState] = useState(readEntryState);
  const [menuOpen, setMenuOpen] = useState(true);
  const [creationOpen, setCreationOpen] = useState(false);
  const [characterOpen, setCharacterOpen] = useState(false);
  const [pendingSafehouseAction, setPendingSafehouseAction] = useState<
    'wait' | 'rest' | 'depart' | null
  >(null);
  const agentStartedRef = useRef(false);
  const newGameTriggerRef = useRef<HTMLButtonElement>(null);
  const creationWasOpenRef = useRef(false);
  const characterTriggerRef = useRef<HTMLButtonElement>(null);
  const characterWasOpenRef = useRef(false);
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

  const initializeNewRun = useCallback((identity: PlayerIdentity, build: PlayerBuild) => {
    const storage = getStorage();
    if (storage) {
      clearLevel0Persistence(storage);
      storage.removeItem(PERSISTED_STATE_KEY);
    }
    dispatch(resetGame());
    dispatch(initializeLevel0Run({
      sessionId: makeSessionId(),
      identity,
      build,
    }));
    const initializedRun = store.getState().level0Runtime.run;
    if (initializedRun) {
      const proofPosition = resolveGet204CityStartPosition(initializedRun.player.position);
      if (
        proofPosition.x !== initializedRun.player.position.x ||
        proofPosition.y !== initializedRun.player.position.y
      ) {
        dispatch(syncLevel0PlayerCheckpoint({
          position: proofPosition,
          facing: { x: 0, y: -1 },
        }));
      }
    }
    setCreationOpen(false);
    setCharacterOpen(false);
    setMenuOpen(false);
    setEntryState({ compatibleAutosave: true, incompatibleSave: false, hasRetry: false });
    const nextRun = store.getState().level0Runtime.run;
    if (storage && nextRun) writeLevel0Autosave(storage, nextRun);
  }, [dispatch]);

  const startNewGame = useCallback(() => {
    setCreationOpen(true);
    setMenuOpen(false);
  }, []);

  const confirmCharacterCreation = useCallback((identity: PlayerIdentity, build: PlayerBuild) => {
    initializeNewRun(identity, build);
  }, [initializeNewRun]);

  const cancelCharacterCreation = useCallback(() => {
    setCreationOpen(false);
    setMenuOpen(true);
  }, []);

  const startAgentGame = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = normalizeLevel0Callsign(params.get('agentName') ?? 'Agent');
    const callsign = isValidLevel0Callsign(requested) ? requested : 'Agent';
    const requestedAppearance = params.get('agentAppearance');
    const appearancePresetId = isLevel0PlayerAppearanceId(requestedAppearance)
      ? requestedAppearance
      : undefined;
    const sample = createConfirmedLevel0Sample(
      'technical_evasion',
      callsign,
      appearancePresetId
    );
    initializeNewRun(sample.identity, sample.build);
  }, [initializeNewRun]);

  const continueGame = useCallback(() => {
    if (run) {
      dispatch(releaseLevel0Pause('menu'));
      setCreationOpen(false);
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
    setCreationOpen(false);
    setMenuOpen(false);
  }, [dispatch, run]);

  const openMenu = useCallback(() => {
    if (run) {
      dispatch(acquireLevel0Pause('menu'));
    }
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
    setCharacterOpen(false);
    setCreationOpen(false);
    setMenuOpen(false);
    setEntryState((current) => ({ ...current, compatibleAutosave: true, hasRetry: true }));
    const nextRun = store.getState().level0Runtime.run;
    if (nextRun) writeLevel0Autosave(storage, nextRun);
  }, [dispatch]);

  const openCharacter = useCallback(() => {
    if (!run || menuOpen || pendingSafehouseAction || terminalMission) return;
    dispatch(acquireLevel0Pause('character'));
    setCharacterOpen(true);
  }, [dispatch, menuOpen, pendingSafehouseAction, run, terminalMission]);

  const closeCharacter = useCallback(() => {
    dispatch(releaseLevel0Pause('character'));
    setCharacterOpen(false);
    persistCurrentRun();
  }, [dispatch, persistCurrentRun]);

  const activateCharacterLevel = useCallback(() => {
    dispatch(activateLevel0PendingLevel());
    persistCurrentRun();
  }, [dispatch, persistCurrentRun]);

  const allocateCharacterAttribute = useCallback((attribute: Parameters<typeof allocateLevel0Attribute>[0]) => {
    dispatch(allocateLevel0Attribute(attribute));
    persistCurrentRun();
  }, [dispatch, persistCurrentRun]);

  const allocateCharacterSkill = useCallback((skill: Parameters<typeof allocateLevel0Skill>[0]) => {
    dispatch(allocateLevel0Skill(skill));
    persistCurrentRun();
  }, [dispatch, persistCurrentRun]);

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
    window.dispatchEvent(new CustomEvent<Level0ActorInteractionPresentationDetail>(
      LEVEL0_ACTOR_INTERACTION_PRESENTATION_EVENT,
      { detail: { anchorId: result.anchor.id } }
    ));
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
    if (creationOpen) {
      creationWasOpenRef.current = true;
      return;
    }
    if (!creationWasOpenRef.current) return;
    creationWasOpenRef.current = false;
    newGameTriggerRef.current?.focus();
  }, [creationOpen]);

  useEffect(() => {
    if (characterOpen) {
      characterWasOpenRef.current = true;
      return;
    }
    if (!characterWasOpenRef.current) return;
    characterWasOpenRef.current = false;
    characterTriggerRef.current?.focus();
  }, [characterOpen]);

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
    if (!hasRun && !creationOpen) return undefined;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (creationOpen) cancelCharacterCreation();
      else if (characterOpen) closeCharacter();
      else if (pendingSafehouseAction) closeSafehouseConfirmation();
      else if (menuOpen) continueGame();
      else openMenu();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [
    cancelCharacterCreation,
    characterOpen,
    closeCharacter,
    closeSafehouseConfirmation,
    continueGame,
    creationOpen,
    hasRun,
    menuOpen,
    openMenu,
    pendingSafehouseAction,
    runSessionId,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined' || agentStartedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('agent') === '1' && params.get('agentStart') === 'level0') {
      agentStartedRef.current = true;
      if (params.get('fresh') === '1' || !entryState.compatibleAutosave) {
        startAgentGame();
      } else {
        continueGame();
      }
    }
  }, [continueGame, entryState.compatibleAutosave, startAgentGame]);

  useEffect(() => installLevel0AgentBridge({ store }), []);

  useEffect(() => {
    const startFromAgent = () => startAgentGame();
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
  }, [handleInteraction, retryOperation, startAgentGame]);

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

  const feedbackResourceEvents = run
    ? runtime.feedbackResourceEventIds.flatMap((eventId) => {
        const event = run.rpg.resourceEvents.find((candidate) => candidate.eventId === eventId);
        return event ? [event] : [];
      })
    : [];
  const feedbackCopy = feedbackResourceEvents.length > 0
    ? feedbackResourceEvents.map((event) => describeLevel0ResourceEvent(event, ukrainian)).join(' · ')
    : runtime.feedbackId
      ? localizeLevel0Copy(FEEDBACK_COPY[runtime.feedbackId] ?? GENERIC_FEEDBACK_COPY, ukrainian)
      : localizeLevel0Copy(IDLE_FEEDBACK_COPY, ukrainian);

  if (creationOpen) {
    return (
      <Level0CharacterCreation
        ukrainian={ukrainian}
        onCancel={cancelCharacterCreation}
        onConfirm={confirmCharacterCreation}
      />
    );
  }

  if (!run || menuOpen) {
    return (
      <main className="level0-entry" data-testid="level0-start-menu">
        <section className="level0-entry__panel">
          <p className="level0-entry__eyebrow">HIDZU CONTROL DISTRICT / LEVEL 0</p>
          <h1>{ukrainian ? 'Втеча з Токіо' : 'Tokyo Escape'}</h1>
          <p className="level0-entry__promise">
            {ukrainian
              ? 'Нагляд, параноя, розмови та втеча в контрольованому Токіо.'
              : 'Surveillance, paranoia, dialogue, and escape through controlled Tokyo.'}
          </p>
          {entryState.incompatibleSave ? (
            <div className="level0-entry__notice" data-testid="retired-save-notice">
              {ukrainian
                ? 'Старе збереження прототипу несумісне. Воно не буде змінене, доки ви явно не почнете Нову гру.'
                : 'A retired prototype save is incompatible. It will remain untouched until you explicitly start New Game.'}
            </div>
          ) : null}
          <div className="level0-entry__actions">
            <button
              type="button"
              data-testid="level0-new-game"
              ref={newGameTriggerRef}
              onClick={startNewGame}
            >
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
  const backgroundControlsLocked = characterOpen || pendingSafehouseAction !== null || terminalMission;
  const cleanVisualProof =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('cleanVisual') === '1';
  const nextLevelThreshold = getNextLevelThreshold(run.build.level);
  const paranoiaPenalty = getParanoiaCheckPenalty(run.paranoia);

  return (
    <main
      className={`level0-runtime${cleanVisualProof ? ' level0-runtime--clean-visual' : ''}`}
      data-testid="level0-runtime-hud"
    >
      <div
        data-testid="level0-runtime-background"
        inert={backgroundControlsLocked ? true : undefined}
      >
        <Level0GameCanvas
          key={`${run.sessionId}:${runtime.sceneRevision}`}
          run={run}
          movementPaused={movementPaused}
          observationActive={observationActive}
          georgePresentationVisible={!backgroundControlsLocked}
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
          <small>Public-to-controlled city seam · adaptive overview · close 2.00</small>
        </div>
        <div className="level0-runtime__lane">
          <span className="lane-label">PROTAGONIST</span>
          <strong>{run.identity.callsign} · LV {run.build.level}</strong>
          <div className="level0-runtime__meters">
            <span>HEALTH <b>{run.health}</b></span>
            <span>PARANOIA <b>{run.paranoia} / −{paranoiaPenalty}</b></span>
          </div>
          <small>
            XP {run.build.xp}{nextLevelThreshold === null ? '' : ` / ${nextLevelThreshold}`}
          </small>
          <div className="level0-runtime__controls">
            <button
              type="button"
              data-testid="level0-character-open"
              ref={characterTriggerRef}
              disabled={backgroundControlsLocked}
              onClick={openCharacter}
            >Character</button>
          </div>
        </div>
        <div className="level0-runtime__lane level0-runtime__lane--feedback">
          <span className="lane-label">GEORGE / RUNTIME</span>
          <p role="status" aria-live="polite">{feedbackCopy}</p>
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

      {characterOpen ? (
        <Level0CharacterPanel
          run={run}
          ukrainian={ukrainian}
          onClose={closeCharacter}
          onActivateLevel={activateCharacterLevel}
          onAllocateAttribute={allocateCharacterAttribute}
          onAllocateSkill={allocateCharacterSkill}
        />
      ) : null}

      {failed ? (
        <section
          className="level0-runtime__failure"
          data-testid="level0-failure"
          role="dialog"
          aria-modal="true"
          aria-labelledby="level0-failure-title"
        >
          <p>{ukrainian ? 'ОПЕРАЦІЮ ПРОВАЛЕНО' : 'OPERATION FAILED'}</p>
          <h2 id="level0-failure-title">{failureTitle(run, ukrainian)}</h2>
          {run.failureSourceId ? (
            <small>
              {ukrainian ? 'Джерело' : 'Source'}: {' '}
              {describeLevel0Source(run.failureSourceId, ukrainian)}
            </small>
          ) : null}
          <button type="button" onClick={retryOperation} disabled={!entryState.hasRetry}>
            {ukrainian ? 'Повторити від виходу' : 'Retry from departure'}
          </button>
          <button type="button" onClick={openMenu}>
            {ukrainian ? 'Повернутися до меню' : 'Return to menu'}
          </button>
        </section>
      ) : null}

      <span className="level0-runtime__storage" aria-hidden="true">
        {LEVEL0_AUTOSAVE_KEY} / {LEVEL0_RETRY_KEY}
      </span>
    </main>
  );
};

export default Level0RuntimeShell;
