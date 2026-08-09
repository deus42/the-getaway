import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { GameBibleUiState } from '../../content/gameBible/types';
import { LEVEL0_LAYOUT_CONTRACT } from '../../content/levels/level0/layoutContract';
import { resolveGet204CityStartPosition } from '../../game/level0/art/get204City';
import { LEVEL0_RUNTIME_VISUAL } from '../../game/level0/art/get205HidzuRuntime';
import { resolveLevel0Interaction } from '../../game/level0/interaction/interactionResolver';
import {
  deriveLevel0ParanoiaTier,
  resolveLevel0AbilityState,
} from '../../game/level0/rpg/gates';
import { LEVEL0_RESEARCH_CATALOG } from '../../game/level0/rpg/research';
import type {
  Level0CoverId,
  Level0ResearchOptionId,
} from '../../game/level0/rpg/types';
import {
  GETAWAY_AGENT_START_LEVEL0_EVENT,
  LEVEL0_AGENT_INTERACTION_EVENT,
  LEVEL0_AGENT_RESTART_ATTEMPT_EVENT,
  installLevel0AgentBridge,
} from '../../game/level0/playtest/level0AgentBridge';
import type { Level0AgentInteractionDetail } from '../../game/level0/playtest/events';
import {
  LEVEL0_ACTOR_INTERACTION_PRESENTATION_EVENT,
  type Level0ActorInteractionPresentationDetail,
} from '../../game/level0/scene/level0ActorPresentation';
import { shouldAdvanceLevel0Clock } from '../../game/level0/runtime/clockEligibility';
import {
  getKnownLevel0AnchorIds,
  getWorldOwnedLevel0AnchorIds,
} from '../../game/level0/runtime/mapKnowledge';
import {
  LEVEL0_ATTEMPT_BASELINE_KEY,
  LEVEL0_AUTOSAVE_KEY,
  clearLevel0Persistence,
  readLevel0Autosave,
  readLevel0OperationAttemptBaseline,
  writeLevel0Autosave,
  writeLevel0DepartureTransaction,
} from '../../game/level0/runtime/persistence';
import {
  departLevel0Operation,
  evaluateSafehouseAction,
} from '../../game/level0/runtime/safehouse';
import {
  getGroundingActionByAnchor,
  LEVEL0_GROUNDING_ACTIONS,
  resolveGroundingVerdict,
  type GroundingActionId,
} from '../../game/level0/city/grounding';
import { localizeLevel0CityCopy } from '../../game/level0/city/routeNames';
import { getGeorgeThresholdLine } from '../../game/level0/city/georgeThresholdLines';
import type {
  Level0RunState,
  PauseOwner,
  SafehouseActionId,
} from '../../game/level0/runtime/types';
import type { AppDispatch, RootState } from '../../store';
import { PERSISTED_STATE_KEY, resetGame, store } from '../../store';
import {
  acquireLevel0Pause,
  advanceLevel0Clock,
  applyLevel0Grounding,
  applyLevel0SafehouseAction as applyLevel0SafehouseActionState,
  commitLevel0Departure,
  hydrateLevel0Run,
  initializeLevel0Run,
  initialLevel0RuntimeState,
  releaseLevel0Pause,
  researchLevel0Ability,
  restartAttempt,
  setLevel0Feedback,
  syncLevel0PlayerCheckpoint,
} from '../../store/level0RuntimeSlice';
import { setLocale } from '../../store/settingsSlice';
import { playLevel0FeedbackCue } from '../../game/feedback/audioCues';
import Level0CharacterPanel from './Level0CharacterPanel';
import Level0CoverSelect from './Level0CoverSelect';
import Level0GameBible from './Level0GameBible';
import Level0GameCanvas from './Level0GameCanvas';
import {
  LEVEL0_ABILITY_COPY,
  LEVEL0_PARANOIA_TIER_COPY,
  LEVEL0_RESEARCH_COPY,
  describeLevel0Cover,
  describeLevel0ParanoiaEvent,
  describeLevel0Source,
  localizeLevel0Copy,
  type Level0LocalizedCopy,
} from './level0RpgCopy';
import './Level0RuntimeShell.css';

interface Level0EntryState {
  compatibleAutosave: boolean;
  incompatibleSave: boolean;
  hasAttemptBaseline: boolean;
}

type PendingSafehouseAction =
  | { kind: 'wait' | 'rest' | 'depart' }
  | { kind: 'research'; optionId: Level0ResearchOptionId }
  | { kind: 'grounding'; actionId: GroundingActionId };

const getStorage = (): Storage | null =>
  typeof window === 'undefined' ? null : window.localStorage;

const readEntryState = (): Level0EntryState => {
  const storage = getStorage();
  if (!storage) {
    return {
      compatibleAutosave: false,
      incompatibleSave: false,
      hasAttemptBaseline: false,
    };
  }
  const autosave = readLevel0Autosave(storage);
  const retiredPrototype = storage.getItem(PERSISTED_STATE_KEY) !== null;
  return {
    compatibleAutosave: autosave.status === 'compatible',
    incompatibleSave: autosave.status === 'incompatible' || retiredPrototype,
    hasAttemptBaseline: readLevel0OperationAttemptBaseline(storage).status === 'compatible',
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

const LEVEL0_RUNTIME_INITIAL_ZOOM_LABEL = LEVEL0_RUNTIME_VISUAL.defaultZoom.toFixed(2);

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
    en: 'Waited safely for thirty minutes.',
    uk: 'Безпечно минуло тридцять хвилин.',
  },
  'safehouse.action.rest.applied': {
    en: 'Rest completed. Paranoia eased.',
    uk: 'Відпочинок завершено. Параноя послабилася.',
  },
  'safehouse.departure.complete': {
    en: 'Operation attempt baseline created.',
    uk: 'Створено базовий стан спроби операції.',
  },
  'restart_attempt.restored': {
    en: 'The operation attempt was restored to departure.',
    uk: 'Спробу операції відновлено до моменту виходу.',
  },
  'restart_attempt.unavailable': {
    en: 'No compatible operation attempt baseline is available.',
    uk: 'Немає сумісного базового стану спроби операції.',
  },
  'research.applied': {
    en: 'Research completed. A new ability is now held.',
    uk: 'Дослідження завершено. Отримано нову здатність.',
  },
  'research.blocked.fact_missing': {
    en: 'Research requires a verified contact fact.',
    uk: 'Для дослідження потрібен підтверджений факт від контакту.',
  },
  'research.blocked.consumed': {
    en: 'That research has already been completed.',
    uk: 'Це дослідження вже завершено.',
  },
  'observation.opened': {
    en: 'Observation opened. Simulation paused.',
    uk: 'Режим спостереження відкрито. Симуляцію призупинено.',
  },
  'observation.closed': {
    en: 'Observation closed. Exploration resumed.',
    uk: 'Режим спостереження закрито. Дослідження продовжено.',
  },
  'grounding.applied': {
    en: 'Ten quiet minutes pass. The street feels a little further away.',
    uk: 'Минає десять тихих хвилин. Вулиця відступає трохи далі.',
  },
  'grounding.blocked.used': {
    en: 'That moment has already been spent tonight.',
    uk: 'Цю мить сьогодні вже витрачено.',
  },
  'grounding.blocked.deadline': {
    en: 'There is no time left to stop. Midnight is too close.',
    uk: 'Зупинятися вже немає часу. Північ надто близько.',
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

const actionLabel = (
  actionId: Extract<SafehouseActionId, 'wait' | 'rest' | 'depart'>,
  ukrainian: boolean
): string => {
  if (actionId === 'wait') return ukrainian ? 'Чекати 30 хв' : 'Wait 30m';
  if (actionId === 'rest') return ukrainian ? 'Відпочити 30 хв' : 'Rest 30m';
  return ukrainian ? 'Почати операцію' : 'Begin operation';
};

const failureTitle = (run: Level0RunState, ukrainian: boolean): string => {
  if (run.failureCause === 'failure.breakdown') {
    return ukrainian
      ? 'Тиск нагляду став нестерпним. Ви здалися до завершення втечі.'
      : 'Surveillance pressure became unmanageable. You surrendered before the escape was complete.';
  }
  if (run.failureCause === 'failure.capture') {
    return ukrainian
      ? 'Hidzu підтвердила вашу особу та затримала вас.'
      : 'Hidzu confirmed your identity and captured you.';
  }
  if (run.failureCause === 'failure.save_incompatible') {
    return ukrainian
      ? 'Цю спробу створено за несумісними правилами. Почніть нову гру.'
      : 'This attempt was created under incompatible rules. Start a new game.';
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

const pendingPauseOwner = (pending: PendingSafehouseAction): PauseOwner =>
  pending.kind === 'research' ? 'research' : 'safehouse_action';

const pendingGroundingAction = (pending: PendingSafehouseAction | null) =>
  pending?.kind === 'grounding' ? LEVEL0_GROUNDING_ACTIONS[pending.actionId] : null;

const Level0RuntimeShell = () => {
  const dispatch = useDispatch<AppDispatch>();
  const runtime = useSelector(
    (state: RootState) => state.level0Runtime ?? initialLevel0RuntimeState
  );
  const locale = useSelector((state: RootState) => state.settings.locale);
  const [entryState, setEntryState] = useState(readEntryState);
  const [menuOpen, setMenuOpen] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const [coverSelectOpen, setCoverSelectOpen] = useState(false);
  const [characterOpen, setCharacterOpen] = useState(false);
  const [bibleOpen, setBibleOpen] = useState(false);
  const [pendingSafehouseAction, setPendingSafehouseAction] = useState<PendingSafehouseAction | null>(null);
  const agentStartedRef = useRef(false);
  const newGameTriggerRef = useRef<HTMLButtonElement>(null);
  const coverSelectWasOpenRef = useRef(false);
  const characterTriggerRef = useRef<HTMLButtonElement>(null);
  const characterWasOpenRef = useRef(false);
  const bibleInvokerRef = useRef<HTMLElement | null>(null);
  const biblePauseAcquiredRef = useRef(false);
  const bibleUiStateRef = useRef<GameBibleUiState>({
    open: false,
    chapterId: null,
    sectionId: null,
    query: '',
    drawerOpen: false,
    resultCount: 0,
    visibleResults: [],
  });

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
    setEntryState((current) => current.compatibleAutosave
      ? current
      : { ...current, compatibleAutosave: true });
  }, []);

  const initializeNewRun = useCallback((coverId: Level0CoverId) => {
    const storage = getStorage();
    if (storage) {
      clearLevel0Persistence(storage);
      storage.removeItem(PERSISTED_STATE_KEY);
    }
    dispatch(resetGame());
    dispatch(initializeLevel0Run({ sessionId: makeSessionId(), coverId }));
    const initializedRun = store.getState().level0Runtime.run;
    if (initializedRun) {
      const startPosition = resolveGet204CityStartPosition(initializedRun.player.position);
      if (
        startPosition.x !== initializedRun.player.position.x ||
        startPosition.y !== initializedRun.player.position.y
      ) {
        dispatch(syncLevel0PlayerCheckpoint({
          position: startPosition,
          facing: { x: 0, y: -1 },
        }));
      }
    }
    setCoverSelectOpen(false);
    setCharacterOpen(false);
    setMenuOpen(false);
    setEntryState({
      compatibleAutosave: true,
      incompatibleSave: false,
      hasAttemptBaseline: false,
    });
    const nextRun = store.getState().level0Runtime.run;
    if (storage && nextRun) writeLevel0Autosave(storage, nextRun);
  }, [dispatch]);

  const startNewGame = useCallback(() => {
    setCoverSelectOpen(true);
    setMenuOpen(false);
  }, []);

  const cancelCoverSelect = useCallback(() => {
    setCoverSelectOpen(false);
    setMenuOpen(true);
  }, []);

  const startAgentGame = useCallback(() => {
    initializeNewRun('cover.neighbor');
  }, [initializeNewRun]);

  const continueGame = useCallback(() => {
    if (run) {
      dispatch(releaseLevel0Pause('menu'));
      setCoverSelectOpen(false);
      setMenuOpen(false);
      return;
    }
    const storage = getStorage();
    if (!storage) return;
    const result = readLevel0Autosave(storage);
    if (result.status !== 'compatible') {
      setEntryState((current) => ({
        ...current,
        compatibleAutosave: false,
        incompatibleSave: true,
      }));
      return;
    }
    dispatch(hydrateLevel0Run(result.envelope.payload));
    setCoverSelectOpen(false);
    setMenuOpen(false);
  }, [dispatch, run]);

  const openMenu = useCallback(() => {
    if (run) dispatch(acquireLevel0Pause('menu'));
    persistCurrentRun();
    setMenuOpen(true);
  }, [dispatch, persistCurrentRun, run]);

  const toggleObservation = useCallback(() => {
    if (
      !run ||
      menuOpen ||
      coverSelectOpen ||
      characterOpen ||
      bibleOpen ||
      pendingSafehouseAction ||
      terminalMission
    ) return;
    dispatch(observationActive
      ? releaseLevel0Pause('observation')
      : acquireLevel0Pause('observation'));
    dispatch(setLevel0Feedback(observationActive ? 'observation.closed' : 'observation.opened'));
  }, [
    bibleOpen,
    characterOpen,
    coverSelectOpen,
    dispatch,
    menuOpen,
    observationActive,
    pendingSafehouseAction,
    run,
    terminalMission,
  ]);

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
    if (!departure.created || !departure.baseline) {
      dispatch(setLevel0Feedback('safehouse.departure.blocked'));
      return;
    }
    const transaction = writeLevel0DepartureTransaction(
      storage,
      departure.run,
      departure.baseline
    );
    if (transaction.status === 'conflict') {
      dispatch(setLevel0Feedback(`safehouse.departure.${transaction.reason}`));
      return;
    }
    dispatch(commitLevel0Departure(departure.run));
    setEntryState((current) => ({
      ...current,
      compatibleAutosave: true,
      hasAttemptBaseline: true,
    }));
  }, [dispatch]);

  const requestSafehouseAction = useCallback((kind: 'wait' | 'rest' | 'depart') => {
    const currentRun = store.getState().level0Runtime.run;
    if (!currentRun || pendingSafehouseAction || terminalMission) return;
    const availability = evaluateSafehouseAction(currentRun, kind);
    if (!availability.available) {
      dispatch(setLevel0Feedback(availability.blockedReasonId ?? 'safehouse.blocked'));
      return;
    }
    const pending: PendingSafehouseAction = { kind };
    dispatch(acquireLevel0Pause(pendingPauseOwner(pending)));
    setPendingSafehouseAction(pending);
  }, [dispatch, pendingSafehouseAction, terminalMission]);

  const requestGroundingAction = useCallback((actionId: GroundingActionId) => {
    const currentRun = store.getState().level0Runtime.run;
    if (!currentRun || pendingSafehouseAction || terminalMission) return;
    const action = LEVEL0_GROUNDING_ACTIONS[actionId];
    const verdict = resolveGroundingVerdict(action, {
      usedGroundingIds: currentRun.recovery.usedGroundingActionIds,
      currentMinute: currentRun.worldClock.currentMinute,
    });
    if (!verdict.allowed) {
      dispatch(setLevel0Feedback(verdict.reasonId ?? 'grounding.blocked'));
      return;
    }
    const pending: PendingSafehouseAction = { kind: 'grounding', actionId };
    dispatch(acquireLevel0Pause(pendingPauseOwner(pending)));
    setPendingSafehouseAction(pending);
  }, [dispatch, pendingSafehouseAction, terminalMission]);

  const requestResearch = useCallback((optionId: Level0ResearchOptionId) => {
    const currentRun = store.getState().level0Runtime.run;
    if (!currentRun || pendingSafehouseAction || terminalMission) return;
    const availability = evaluateSafehouseAction(currentRun, 'research');
    const researchState = currentRun.abilities.researchState[optionId];
    if (!availability.available) {
      dispatch(setLevel0Feedback(availability.blockedReasonId ?? 'research.blocked'));
      return;
    }
    if (researchState !== 'available') {
      dispatch(setLevel0Feedback(
        researchState === 'consumed'
          ? 'research.blocked.consumed'
          : 'research.blocked.fact_missing'
      ));
      return;
    }
    const pending: PendingSafehouseAction = { kind: 'research', optionId };
    dispatch(acquireLevel0Pause(pendingPauseOwner(pending)));
    setPendingSafehouseAction(pending);
  }, [dispatch, pendingSafehouseAction, terminalMission]);

  const closeSafehouseConfirmation = useCallback(() => {
    if (pendingSafehouseAction) {
      dispatch(releaseLevel0Pause(pendingPauseOwner(pendingSafehouseAction)));
    }
    setPendingSafehouseAction(null);
  }, [dispatch, pendingSafehouseAction]);

  const confirmSafehouseAction = useCallback(() => {
    if (!pendingSafehouseAction) return;
    if (pendingSafehouseAction.kind === 'depart') {
      beginOperation();
    } else if (pendingSafehouseAction.kind === 'research') {
      dispatch(researchLevel0Ability(pendingSafehouseAction.optionId));
      persistCurrentRun();
    } else if (pendingSafehouseAction.kind === 'grounding') {
      dispatch(applyLevel0Grounding(pendingSafehouseAction.actionId));
      playLevel0FeedbackCue('grounding');
      persistCurrentRun();
    } else {
      dispatch(applyLevel0SafehouseActionState(pendingSafehouseAction.kind));
      persistCurrentRun();
    }
    closeSafehouseConfirmation();
  }, [
    beginOperation,
    closeSafehouseConfirmation,
    dispatch,
    pendingSafehouseAction,
    persistCurrentRun,
  ]);

  const restartOperationAttempt = useCallback(() => {
    const storage = getStorage();
    if (!storage) return;
    const result = readLevel0OperationAttemptBaseline(storage);
    if (result.status !== 'compatible') {
      dispatch(setLevel0Feedback('restart_attempt.unavailable'));
      return;
    }
    dispatch(restartAttempt(result.envelope.payload));
    setCharacterOpen(false);
    setCoverSelectOpen(false);
    setMenuOpen(false);
    setEntryState((current) => ({
      ...current,
      compatibleAutosave: true,
      hasAttemptBaseline: true,
    }));
    const nextRun = store.getState().level0Runtime.run;
    if (nextRun) writeLevel0Autosave(storage, nextRun);
  }, [dispatch]);

  const openBible = useCallback(() => {
    if (coverSelectOpen || characterOpen || pendingSafehouseAction || terminalMission) return;
    bibleInvokerRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    if (run && !biblePauseAcquiredRef.current) {
      dispatch(acquireLevel0Pause('bible'));
      biblePauseAcquiredRef.current = true;
    }
    setBibleOpen(true);
  }, [characterOpen, coverSelectOpen, dispatch, pendingSafehouseAction, run, terminalMission]);

  const closeBible = useCallback(() => {
    if (biblePauseAcquiredRef.current) {
      dispatch(releaseLevel0Pause('bible'));
      biblePauseAcquiredRef.current = false;
    }
    bibleUiStateRef.current = {
      ...bibleUiStateRef.current,
      open: false,
      drawerOpen: false,
      query: '',
      resultCount: 0,
      visibleResults: [],
    };
    setBibleOpen(false);
    window.requestAnimationFrame(() => bibleInvokerRef.current?.focus());
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
        unavailableReasonByAnchorId[anchorId] =
          availability.blockedReasonId ?? 'interaction.unavailable';
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
    const groundingAction = getGroundingActionByAnchor(result.anchor.id);
    if (groundingAction) {
      requestGroundingAction(groundingAction.id);
      return;
    }
    dispatch(setLevel0Feedback(`interaction.preview.${result.anchor.id}`));
  }, [
    dispatch,
    menuOpen,
    observationActive,
    requestGroundingAction,
    requestSafehouseAction,
    terminalMission,
  ]);

  useLayoutEffect(() => {
    document.documentElement.dataset.visualStyle = 'graphic-surveillance-noir-greybox';
    return () => {
      delete document.documentElement.dataset.visualStyle;
    };
  }, []);

  useEffect(() => {
    if (coverSelectOpen) {
      coverSelectWasOpenRef.current = true;
      return;
    }
    if (!coverSelectWasOpenRef.current) return;
    coverSelectWasOpenRef.current = false;
    newGameTriggerRef.current?.focus();
  }, [coverSelectOpen]);

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
    if (!hasRun || menuOpen || !sceneReady) return undefined;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const elapsed = Math.min(1_000, now - previous);
      previous = now;
      if (!shouldAdvanceLevel0Clock({
        hasRun,
        menuOpen,
        sceneReady,
        documentHidden: document.hidden,
      })) return;
      dispatch(advanceLevel0Clock({ realDeltaMilliseconds: elapsed }));
    }, 250);
    return () => window.clearInterval(timer);
  }, [dispatch, hasRun, menuOpen, runSessionId, sceneReady]);

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
    const handleBibleShortcut = (event: KeyboardEvent) => {
      if (event.key !== 'F1') return;
      if (coverSelectOpen || characterOpen || pendingSafehouseAction || terminalMission) return;
      event.preventDefault();
      event.stopPropagation();
      if (!bibleOpen) openBible();
    };
    window.addEventListener('keydown', handleBibleShortcut, true);
    return () => window.removeEventListener('keydown', handleBibleShortcut, true);
  }, [bibleOpen, characterOpen, coverSelectOpen, openBible, pendingSafehouseAction, terminalMission]);

  useEffect(() => () => {
    if (biblePauseAcquiredRef.current) {
      dispatch(releaseLevel0Pause('bible'));
      biblePauseAcquiredRef.current = false;
    }
  }, [dispatch]);

  useEffect(() => {
    if (!hasRun && !coverSelectOpen) return undefined;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || bibleOpen) return;
      event.preventDefault();
      if (coverSelectOpen) cancelCoverSelect();
      else if (characterOpen) closeCharacter();
      else if (pendingSafehouseAction) closeSafehouseConfirmation();
      else if (menuOpen) continueGame();
      else openMenu();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [
    bibleOpen,
    cancelCoverSelect,
    characterOpen,
    closeCharacter,
    closeSafehouseConfirmation,
    continueGame,
    coverSelectOpen,
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
      if (params.get('fresh') === '1' || !entryState.compatibleAutosave) startAgentGame();
      else continueGame();
    }
  }, [continueGame, entryState.compatibleAutosave, startAgentGame]);

  useEffect(() => installLevel0AgentBridge({
    store,
    nodeEnv: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'development'
      : 'production',
    getGameBibleUiState: () => bibleUiStateRef.current,
  }), []);

  useEffect(() => {
    const startFromAgent = () => startAgentGame();
    const restartFromAgent = () => restartOperationAttempt();
    const interactFromAgent = (event: Event) => {
      const detail = (event as CustomEvent<Level0AgentInteractionDetail>).detail;
      handleInteraction(detail?.anchorId);
    };
    window.addEventListener(GETAWAY_AGENT_START_LEVEL0_EVENT, startFromAgent);
    window.addEventListener(LEVEL0_AGENT_RESTART_ATTEMPT_EVENT, restartFromAgent);
    window.addEventListener(LEVEL0_AGENT_INTERACTION_EVENT, interactFromAgent);
    return () => {
      window.removeEventListener(GETAWAY_AGENT_START_LEVEL0_EVENT, startFromAgent);
      window.removeEventListener(LEVEL0_AGENT_RESTART_ATTEMPT_EVENT, restartFromAgent);
      window.removeEventListener(LEVEL0_AGENT_INTERACTION_EVENT, interactFromAgent);
    };
  }, [handleInteraction, restartOperationAttempt, startAgentGame]);

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

  const feedbackParanoiaEvents = run
    ? runtime.feedbackParanoiaEventIds.flatMap((eventId) => {
        const event = run.rpg.paranoiaEvents.find((candidate) => candidate.eventId === eventId);
        return event ? [event] : [];
      })
    : [];
  const feedbackCopy = feedbackParanoiaEvents.length > 0
    ? feedbackParanoiaEvents
      .map((event) => {
        const base = describeLevel0ParanoiaEvent(event, ukrainian);
        const georgeLine = run ? getGeorgeThresholdLine(run, event, ukrainian) : null;
        return georgeLine ? `${base} · George: ${georgeLine}` : base;
      })
      .join(' · ')
    : runtime.feedbackId
      ? localizeLevel0Copy(FEEDBACK_COPY[runtime.feedbackId] ?? GENERIC_FEEDBACK_COPY, ukrainian)
      : localizeLevel0Copy(IDLE_FEEDBACK_COPY, ukrainian);

  if (coverSelectOpen) {
    return (
      <Level0CoverSelect
        ukrainian={ukrainian}
        onCancel={cancelCoverSelect}
        onConfirm={initializeNewRun}
      />
    );
  }

  if (!run || menuOpen) {
    return (
      <>
        <main
          className="level0-entry"
          data-testid="level0-start-menu"
          inert={bibleOpen ? true : undefined}
          aria-hidden={bibleOpen ? true : undefined}
        >
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
                  ? 'Старе збереження прототипу несумісне. Почніть Нову гру, щоб створити спробу за чинними правилами.'
                  : 'A retired prototype save is incompatible. Start New Game to create an attempt under the current rules.'}
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
              {entryState.hasAttemptBaseline ? (
                <button
                  type="button"
                  data-testid="level0-restart-attempt-menu"
                  onClick={restartOperationAttempt}
                >
                  {ukrainian ? 'Перезапустити спробу' : 'Restart Attempt'}
                </button>
              ) : null}
              <button type="button" data-testid="level0-bible-open" onClick={openBible}>
                {ukrainian ? 'Біблія ігрового дизайну' : 'Game Design Bible'} <span>F1</span>
              </button>
              <button
                type="button"
                className="level0-entry__locale"
                data-testid="level0-locale-toggle"
                aria-label={ukrainian ? 'Switch language to English' : 'Перемкнути мову на українську'}
                onClick={() => dispatch(setLocale(ukrainian ? 'en' : 'uk'))}
              >
                {ukrainian ? 'ENG' : 'УКР'}
              </button>
            </div>
            <dl className="level0-entry__contract">
              <div><dt>Identity</dt><dd>Authored civilian cover</dd></div>
              <div><dt>Pressure</dt><dd>Named Paranoia conditions</dd></div>
              <div><dt>Choices</dt><dd>Ability, fact, or declared cost</dd></div>
            </dl>
            {run ? (
              <button type="button" className="level0-entry__resume" onClick={continueGame}>
                {ukrainian ? 'Повернутися до району' : 'Return to district'}
              </button>
            ) : null}
          </section>
        </main>
        {bibleOpen ? (
          <Level0GameBible
            locale={locale}
            simulationPaused={Boolean(run)}
            onClose={closeBible}
            onUiStateChange={(state) => { bibleUiStateRef.current = state; }}
          />
        ) : null}
      </>
    );
  }

  const failed = run.mission === 'L0_FAILED';
  const backgroundControlsLocked =
    bibleOpen || characterOpen || pendingSafehouseAction !== null || terminalMission;
  const cleanVisualProof = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('cleanVisual') === '1';
  const paranoiaTier = deriveLevel0ParanoiaTier(run.paranoia);
  const paranoiaTierLabel = localizeLevel0Copy(
    LEVEL0_PARANOIA_TIER_COPY[paranoiaTier],
    ukrainian
  );
  const paranoiaSliderStyle = {
    '--paranoia-position': `${run.paranoia}%`,
  } as CSSProperties;
  const pendingResearch = pendingSafehouseAction?.kind === 'research'
    ? LEVEL0_RESEARCH_CATALOG[pendingSafehouseAction.optionId]
    : null;
  const pendingResearchOptionId = pendingSafehouseAction?.kind === 'research'
    ? pendingSafehouseAction.optionId
    : null;
  const pendingGrounding = pendingGroundingAction(pendingSafehouseAction);
  const pendingTimeCost = pendingSafehouseAction?.kind === 'wait' || pendingSafehouseAction?.kind === 'rest'
    ? 30
    : pendingGrounding
      ? pendingGrounding.worldMinutes
      : pendingResearch?.worldMinuteCost ?? 0;

  return (
    <main
      className={`level0-runtime${cleanVisualProof ? ' level0-runtime--clean-visual' : ''}`}
      data-testid="level0-runtime-hud"
    >
      <div data-testid="level0-runtime-background" inert={backgroundControlsLocked ? true : undefined}>
        <Level0GameCanvas
          key={`${run.sessionId}:${runtime.sceneRevision}`}
          run={run}
          locale={locale}
          movementPaused={movementPaused}
          observationActive={observationActive}
          georgePresentationVisible={!backgroundControlsLocked}
          onSceneReady={setSceneReady}
          onPlayerCheckpoint={(position, facing) =>
            dispatch(syncLevel0PlayerCheckpoint({ position, facing }))}
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
          >
            {ukrainian ? 'Меню' : 'Menu'} <span>Esc</span>
          </button>
          <div className="level0-runtime__status">
            <strong>{formatWorldTime(run.worldClock.currentMinute)}</strong>
            <span>{run.worldClock.phase.replace('-', ' ')}</span>
            <span className={run.worldClock.curfewActive ? 'is-danger' : ''}>
              {run.worldClock.curfewActive
                ? ukrainian ? 'КОМЕНДАНТСЬКА ГОДИНА' : 'CURFEW ACTIVE'
                : ukrainian ? 'КОМЕНДАНТСЬКА 22:00' : 'CURFEW 22:00'}
            </span>
            <span>{ukrainian ? 'ДЕДЛАЙН 24:00' : 'DEADLINE 24:00'}</span>
          </div>
        </header>

        {observationActive ? (
          <aside className="level0-runtime__observation" data-testid="level0-observation-overlay">
            <strong>{ukrainian ? 'СПОСТЕРЕЖЕННЯ / СИМУЛЯЦІЮ ПРИЗУПИНЕНО' : 'OBSERVATION / SIMULATION PAUSED'}</strong>
            <span>{ukrainian ? 'Перетягуйте для огляду. Колесо змінює масштаб. O повертає рух.' : 'Drag to pan. Wheel to zoom. O returns to movement.'}</span>
          </aside>
        ) : null}

        <section className="level0-runtime__dock">
          <div className="level0-runtime__lane level0-runtime__lane--map">
            <span className="lane-label">{ukrainian ? 'РАЙОН' : 'DISTRICT'}</span>
            <strong>Tokyo / Hidzu perimeter</strong>
            <small>
              {ukrainian ? 'Міський шов · огляд району · наближення ' : 'City seam · district overview · close '}
              {LEVEL0_RUNTIME_INITIAL_ZOOM_LABEL}
            </small>
          </div>
          <div className="level0-runtime__lane" data-paranoia-tier={paranoiaTier}>
            <span className="lane-label">{ukrainian ? 'ПРОТАГОНІСТ' : 'PROTAGONIST'}</span>
            <strong>{describeLevel0Cover(run.identity.coverId, ukrainian)}</strong>
            <div className="level0-runtime__meters">
              <span>
                {ukrainian ? 'ПАРАНОЯ' : 'PARANOIA'}{' '}
                <b>{paranoiaTierLabel}</b>
              </span>
              <div
                className="level0-runtime__paranoia-slider"
                data-testid="level0-paranoia-slider-hud"
                role="meter"
                aria-label={ukrainian ? 'Параноя' : 'Paranoia'}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={run.paranoia}
                aria-valuetext={paranoiaTierLabel}
                style={paranoiaSliderStyle}
              >
                <span className="level0-runtime__paranoia-fill" aria-hidden="true" />
                <span className="level0-runtime__paranoia-thumb" aria-hidden="true" />
                <span className="level0-runtime__paranoia-thresholds" aria-hidden="true">
                  <i /><i /><i />
                </span>
              </div>
            </div>
            <div className="level0-runtime__ability-strip" aria-label={ukrainian ? 'Здібності' : 'Abilities'}>
              {run.abilities.heldAbilityIds.slice(0, 3).map((abilityId) => {
                const state = resolveLevel0AbilityState(abilityId, run.paranoia);
                return (
                  <span key={abilityId} data-state={state.status}>
                    {localizeLevel0Copy(LEVEL0_ABILITY_COPY[abilityId].label, ukrainian)}
                  </span>
                );
              })}
            </div>
            <div className="level0-runtime__controls">
              <button
                type="button"
                data-testid="level0-character-open"
                ref={characterTriggerRef}
                disabled={backgroundControlsLocked}
                onClick={openCharacter}
              >
                {ukrainian ? 'Персонаж' : 'Character'}
              </button>
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
                {observationActive
                  ? ukrainian ? 'Продовжити' : 'Resume'
                  : ukrainian ? 'Спостерігати' : 'Observe'}
              </button>
              <button
                type="button"
                data-testid="level0-interact"
                disabled={backgroundControlsLocked}
                onClick={() => handleInteraction()}
              >
                {ukrainian ? 'Взаємодія' : 'Interact'}
              </button>
            </div>
          </div>
          <div className="level0-runtime__lane level0-runtime__lane--safehouse">
            <span className="lane-label">{ukrainian ? 'ПОТОЧНИЙ ЕТАП' : 'CURRENT BEAT'}</span>
            <strong>{run.mission.replace('L0_', '').split('_').join(' ')}</strong>
            {run.safehouse.insideBoundary ? (
              <>
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
                      {actionLabel(actionId, ukrainian)}
                    </button>
                  ))}
                </div>
                <div className="level0-runtime__research-actions">
                  {Object.values(LEVEL0_RESEARCH_CATALOG).map((option) => {
                    const state = run.abilities.researchState[option.id];
                    return (
                      <button
                        type="button"
                        key={option.id}
                        data-testid={`safehouse-${option.id}`}
                        disabled={backgroundControlsLocked || state !== 'available'}
                        title={state === 'available' ? undefined : state}
                        onClick={() => requestResearch(option.id)}
                      >
                        {localizeLevel0Copy(LEVEL0_RESEARCH_COPY[option.id].label, ukrainian)}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <small>{ukrainian ? 'Поверніться до безпечного місця для планування.' : 'Return to the safehouse for planning actions.'}</small>
            )}
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
            <p>{pendingSafehouseAction.kind === 'research'
              ? ukrainian ? 'ДОСЛІДЖЕННЯ / ЧАС ЗУПИНЕНО' : 'RESEARCH / TIME PAUSED'
              : pendingSafehouseAction.kind === 'grounding'
                ? ukrainian ? 'ХВИЛИНА НА ВУЛИЦІ / ЧАС ЗУПИНЕНО' : 'STREET MOMENT / TIME PAUSED'
                : ukrainian ? 'ДІЯ В БЕЗПЕЧНОМУ МІСЦІ / ЧАС ЗУПИНЕНО' : 'SAFEHOUSE ACTION / TIME PAUSED'}</p>
            <h2 id="safehouse-confirmation-title">
              {pendingSafehouseAction.kind === 'grounding' && pendingGrounding
                ? localizeLevel0CityCopy(pendingGrounding.confirmPreview, ukrainian)
                : pendingSafehouseAction.kind === 'depart'
                ? ukrainian
                  ? 'Залишити безпечне місце та зафіксувати базовий стан цієї спроби?'
                  : 'Leave the safehouse and record this attempt’s departure baseline?'
                : pendingSafehouseAction.kind === 'rest'
                  ? ukrainian
                    ? `Відпочити до ${formatWorldTime(run.worldClock.currentMinute + 30)}? Параноя суттєво послабиться.`
                    : `Rest until ${formatWorldTime(run.worldClock.currentMinute + 30)}? Paranoia will ease substantially.`
                  : pendingSafehouseAction.kind === 'wait'
                    ? ukrainian
                      ? `Чекати до ${formatWorldTime(run.worldClock.currentMinute + 30)}?`
                      : `Wait until ${formatWorldTime(run.worldClock.currentMinute + 30)}?`
                    : pendingResearchOptionId
                      ? ukrainian
                        ? `${localizeLevel0Copy(LEVEL0_RESEARCH_COPY[pendingResearchOptionId].label, true)}? Це витратить факт і ${pendingResearch?.worldMinuteCost ?? 0} хвилин.`
                        : `${localizeLevel0Copy(LEVEL0_RESEARCH_COPY[pendingResearchOptionId].label, false)}? This consumes its fact and ${pendingResearch?.worldMinuteCost ?? 0} minutes.`
                      : ''}
            </h2>
            {pendingTimeCost > 0 &&
            run.worldClock.currentMinute + pendingTimeCost >= 24 * 60 &&
            (!run.completion.medkitsReturned || !run.completion.transitValidated) ? (
              <p className="level0-runtime__deadline-warning">
                {ukrainian
                  ? 'Підтвердження перетне дедлайн 24:00 і провалить операцію.'
                  : 'Confirming will cross the 24:00 deadline and fail the operation.'}
              </p>
            ) : null}
            <div className="level0-runtime__controls">
              <button type="button" data-testid="safehouse-confirm" onClick={confirmSafehouseAction}>
                {ukrainian ? 'Підтвердити' : 'Confirm'}
              </button>
              <button type="button" data-testid="safehouse-cancel" onClick={closeSafehouseConfirmation}>
                {ukrainian ? 'Скасувати' : 'Cancel'}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {characterOpen ? (
        <Level0CharacterPanel run={run} ukrainian={ukrainian} onClose={closeCharacter} />
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
              {ukrainian ? 'Джерело' : 'Source'}: {describeLevel0Source(run.failureSourceId, ukrainian)}
            </small>
          ) : null}
          <button
            type="button"
            data-testid="level0-restart-attempt"
            onClick={restartOperationAttempt}
            disabled={!entryState.hasAttemptBaseline}
          >
            {ukrainian ? 'Перезапустити спробу' : 'Restart Attempt'}
          </button>
          <button type="button" onClick={openMenu}>
            {ukrainian ? 'Повернутися до меню' : 'Return to menu'}
          </button>
        </section>
      ) : null}

      {bibleOpen ? (
        <Level0GameBible
          locale={locale}
          simulationPaused={run.worldClock.pauseOwners.includes('bible')}
          onClose={closeBible}
          onUiStateChange={(state) => { bibleUiStateRef.current = state; }}
        />
      ) : null}

      <span className="level0-runtime__storage" aria-hidden="true">
        {LEVEL0_AUTOSAVE_KEY} / {LEVEL0_ATTEMPT_BASELINE_KEY}
      </span>
    </main>
  );
};

export default Level0RuntimeShell;
