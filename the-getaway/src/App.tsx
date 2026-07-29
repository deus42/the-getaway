import { Provider, useSelector } from "react-redux";
import { CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState, lazy, Suspense } from "react";
import GameCanvas from "./components/GameCanvas";
import GameController from "./components/GameController";
import PlayerSummaryPanel from "./components/ui/PlayerSummaryPanel";
import DayNightIndicator from "./components/ui/DayNightIndicator";
import MiniMap from "./components/ui/MiniMap";
import TacticalPanel from "./components/ui/TacticalPanel";
import GeorgeAssistant from "./components/ui/GeorgeAssistant";
import DialogueOverlay from "./components/ui/DialogueOverlay";
import OpsBriefingsPanel from "./components/ui/OpsBriefingsPanel";
import { XPNotificationManager, XPNotificationData } from "./components/ui/XPNotification";
import TacticalHUDFrame from "./components/ui/TacticalHUDFrame";
import CombatFeedbackManager from "./components/ui/CombatFeedbackManager";
import CurfewWarning from "./components/ui/CurfewWarning";
import { PERSISTED_STATE_KEY, resetGame, store, RootState } from "./store";
// (PoC) ESB neon uses additive emissive; no Light2D forcing here.
import { selectHudLayoutPreset } from "./store/selectors/hudLayoutSelectors";
import { HudLayoutPreset } from "./store/hudLayoutSlice";
import MissionProgressionManager from "./components/system/MissionProgressionManager";
import FactionReputationManager from "./components/system/FactionReputationManager";
import { addLogMessage } from "./store/logSlice";
import { endDialogue } from "./store/questsSlice";
import { initializeCharacter, consumeLevelUpEvent, clearPendingPerkSelections, removeXPNotification } from "./store/playerSlice";
import { clearAllFeedback } from "./store/combatFeedbackSlice";
import { PlayerSkills, Player } from "./game/interfaces/types";
import { DEFAULT_SKILLS } from "./game/interfaces/player";
import { getUIStrings } from "./content/ui";
import { getSystemStrings } from "./content/system";
import { listPerks, evaluatePerkAvailability } from "./content/perks";
import { createScopedLogger } from "./utils/logger";
import {
  DEFAULT_DOCK_MIN_HEIGHT,
  measureBottomDockHeight,
} from "./utils/bottomDockSizing";
import MissionCompletionOverlay from "./components/ui/MissionCompletionOverlay";
import MissionFailureOverlay from "./components/ui/MissionFailureOverlay";
import CombatControlWidget from "./components/ui/CombatControlWidget";
import GameDebugInspector from "./components/debug/GameDebugInspector";
import {
  GETAWAY_AGENT_START_LEVEL0_EVENT,
  installGetawayAgentBridge,
  shouldEnableGetawayAgentBridge,
} from "./game/playtest/agentBridge";
import { primeLevel0AudioCues } from "./game/feedback/audioCues";
import { isLevel0Exterior } from "./game/visual/theme/mapVisualTheme";
import "./App.css";

// Lazy load heavy components that aren't needed immediately
const GameMenu = lazy(() => import("./components/ui/GameMenu"));
const CharacterCreationScreen = lazy(() => import("./components/ui/CharacterCreationScreen"));
const CharacterScreen = lazy(() => import("./components/ui/CharacterScreen"));
const LevelUpModal = lazy(() => import("./components/ui/LevelUpModal").then(m => ({ default: m.LevelUpModal })));
const PerkSelectionPanel = lazy(() => import("./components/ui/PerkSelectionPanel"));
const LevelUpPointAllocationPanel = lazy(() => import("./components/ui/LevelUpPointAllocationPanel"));

// Type import for CharacterCreationData
import type { CharacterCreationData } from "./components/ui/CharacterCreationScreen";

const log = createScopedLogger('App');

const layoutShellStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  width: "100vw",
  height: "100vh",
  overflow: "hidden",
  position: "relative",
  backgroundColor: "var(--color-gunmetal-900)",
  color: "var(--color-hud-text)",
  fontFamily: "var(--font-mono)",
};

const mainStageStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: "flex",
  background: "var(--hud-stage-background)",
};

const centerStageStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  height: "100%",
  position: "relative",
  overflow: "hidden",
};

const topLeftOverlayStyle: CSSProperties = {
  position: "absolute",
  top: "1.25rem",
  left: "1.25rem",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "0.75rem",
  zIndex: 5,
  pointerEvents: "auto",
};

const topCenterOverlayStyle: CSSProperties = {
  position: "absolute",
  top: "1.25rem",
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "0.75rem",
  zIndex: 6,
  pointerEvents: "auto",
};

const topRightOverlayStyle: CSSProperties = {
  position: "absolute",
  top: "1.25rem",
  right: "1.25rem",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "0.75rem",
  zIndex: 6,
  pointerEvents: "none",
};

const menuPanelButtonStyle: CSSProperties = {
  all: "unset",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.5rem",
  padding: "0.7rem 0.9rem",
  boxSizing: "border-box",
  borderRadius: "var(--hud-radius-lg)",
  border: "var(--hud-command-button-border)",
  background: "var(--hud-command-button-bg)",
  boxShadow: "var(--hud-command-button-shadow)",
  color: "var(--hud-command-button-text)",
  fontFamily: "var(--font-mono)",
  fontSize: "0.7rem",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  cursor: "pointer",
  pointerEvents: "auto",
  transition: "transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease, color 0.16s ease",
};

const menuPanelLabelStyle: CSSProperties = {
  fontSize: "0.78rem",
  letterSpacing: "0.2em",
  color: "inherit",
};

const menuPanelGlyphStyle: CSSProperties = {
  fontSize: "0.62rem",
  letterSpacing: "0.24em",
  color: "var(--hud-command-button-text-muted)",
  textTransform: "uppercase",
};

interface CommandShellProps {
  onOpenMenu: () => void;
  onToggleCharacter: () => void;
  showMenu: boolean;
  characterOpen: boolean;
  hudLayoutPreset: HudLayoutPreset;
}

const CommandShell: React.FC<CommandShellProps> = ({
  onOpenMenu,
  onToggleCharacter,
  showMenu,
  characterOpen,
  hudLayoutPreset,
}) => {
  const locale = useSelector((state: RootState) => state.settings.locale);
  const testMode = useSelector((state: RootState) => state.settings.testMode);
  const inCombat = useSelector((state: RootState) => state.world.inCombat);
  const uiStrings = getUIStrings(locale);
  const zoneId = useSelector((state: RootState) => state.world.currentMapArea?.zoneId ?? null);
  const isCombatLayout = hudLayoutPreset === 'combat';

  const [questExpanded, setQuestExpanded] = useState(false);
  const [rendererMeta, setRendererMeta] = useState<{ label?: string; detail?: string } | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const [bottomPanelHeight, setBottomPanelHeight] = useState<number>(DEFAULT_DOCK_MIN_HEIGHT);

  useEffect(() => {
    if (!showMenu) {
      return;
    }
    setQuestExpanded(false);
  }, [showMenu]);

  useEffect(() => {
    if (!inCombat) {
      return;
    }
    setQuestExpanded(false);
  }, [inCombat]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const dock = dockRef.current;
    if (!dock) {
      return;
    }

    let frameId: number | null = null;

    const measureDockHeight = () => {
      const nextHeight = measureBottomDockHeight(dock);
      setBottomPanelHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    };

    const scheduleDockMeasure = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        measureDockHeight();
      });
    };

    scheduleDockMeasure();

    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            scheduleDockMeasure();
          });
    resizeObserver?.observe(dock);
    dock
      .querySelectorAll<HTMLElement>('.hud-bottom-lane, .hud-bottom-card-surface')
      .forEach((element) => resizeObserver?.observe(element));

    const mutationObserver =
      typeof MutationObserver === 'undefined'
        ? null
        : new MutationObserver(() => {
            scheduleDockMeasure();
          });
    mutationObserver?.observe(dock, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
    });

    window.addEventListener('resize', scheduleDockMeasure);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('resize', scheduleDockMeasure);
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
    };
  }, [characterOpen, hudLayoutPreset, questExpanded, showMenu, testMode]);

  const handleToggleQuest = () => {
    setQuestExpanded((prev) => !prev);
  };

  const questToggleLabel = questExpanded ? uiStrings.shell.completedToggleClose : uiStrings.shell.completedToggleOpen;
  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }
    if (bottomPanelHeight) {
      document.documentElement.style.setProperty('--bottom-panel-height', `${bottomPanelHeight}px`);
    } else {
      document.documentElement.style.removeProperty('--bottom-panel-height');
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.documentElement.style.removeProperty('--bottom-panel-height');
      }
    };
  }, [bottomPanelHeight]);

  const menuPanelWidth = '90vw';
  const menuPanelMaxWidth = '240px';

  return (
    <div
      style={mainStageStyle}
      className="command-shell-stage"
      data-hud-layout={hudLayoutPreset}
    >
      <div style={centerStageStyle}>
        <TacticalHUDFrame />
        <GameCanvas onRendererInfo={setRendererMeta} />
        <GameController />
        <div style={topLeftOverlayStyle}>
          <button
            type="button"
            onClick={onOpenMenu}
            style={{ ...menuPanelButtonStyle, width: menuPanelWidth, maxWidth: menuPanelMaxWidth }}
            data-testid="menu-overlay-button"
            aria-label={uiStrings.shell.menuButton}
            title={uiStrings.shell.menuButton}
            onMouseEnter={(event) => {
              event.currentTarget.style.transform = 'translateY(-2px)';
              event.currentTarget.style.boxShadow = 'var(--hud-command-button-shadow-hover)';
              event.currentTarget.style.borderColor = 'var(--hud-command-button-border-hover)';
              event.currentTarget.style.color = 'var(--hud-command-button-text-hover)';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = 'translateY(0)';
              event.currentTarget.style.boxShadow = 'var(--hud-command-button-shadow)';
              event.currentTarget.style.borderColor = 'var(--hud-command-button-border-rest)';
              event.currentTarget.style.color = 'var(--hud-command-button-text)';
            }}
            onFocus={(event) => {
              event.currentTarget.style.boxShadow = 'var(--hud-command-button-shadow-focus)';
              event.currentTarget.style.borderColor = 'var(--hud-command-button-border-focus)';
            }}
            onBlur={(event) => {
              event.currentTarget.style.boxShadow = 'var(--hud-command-button-shadow)';
              event.currentTarget.style.borderColor = 'var(--hud-command-button-border-rest)';
            }}
          >
            <span style={menuPanelLabelStyle}>{uiStrings.shell.menuButton}</span>
            <span style={menuPanelGlyphStyle}>ESC</span>
          </button>
          {testMode ? (
            <GameDebugInspector zoneId={zoneId} rendererInfo={rendererMeta} />
          ) : null}
        </div>
        <div style={topCenterOverlayStyle}>
          <CombatControlWidget />
        </div>
        <div style={topRightOverlayStyle}>
          <div style={{ pointerEvents: 'auto' }}>
            <DayNightIndicator />
          </div>
        </div>
        <DialogueOverlay />
        <CombatFeedbackManager />
      </div>
      <div className="hud-bottom-dock" data-hud-layout={hudLayoutPreset} ref={dockRef}>
        <div className="hud-bottom-lane hud-bottom-lane--map">
          <div className="hud-bottom-lane-card">
            <div className="hud-bottom-card-surface">
              <TacticalPanel className="hud-bottom-map-card" variant="frameless">
                <MiniMap />
              </TacticalPanel>
            </div>
          </div>
        </div>
        <div className="hud-bottom-lane hud-bottom-lane--status" data-hud-emphasis={isCombatLayout ? 'true' : undefined}>
          <div className="hud-bottom-lane-card">
            <div className="hud-bottom-card-surface">
              <PlayerSummaryPanel
                onOpenCharacter={onToggleCharacter}
                characterOpen={characterOpen}
                variant="frameless"
              />
            </div>
          </div>
        </div>

        <div className="hud-bottom-lane hud-bottom-lane--george">
          <div className="hud-bottom-lane-card">
            <div className="hud-bottom-card-surface">
              <GeorgeAssistant />
            </div>
          </div>
        </div>

        <div className="hud-bottom-lane hud-bottom-lane--ops">
          <div className="hud-bottom-lane-card">
            <div className="hud-bottom-card-surface">
              <div className="hud-bottom-quests">
                <OpsBriefingsPanel />
              </div>
              <div className="hud-bottom-control-row">
                <button
                  type="button"
                  className="hud-bottom-toggle"
                  onClick={handleToggleQuest}
                  aria-expanded={questExpanded}
                  aria-controls="command-objective-overlay"
                >
                  {questToggleLabel}
                </button>
              </div>
            </div>
          </div>
          <div
            id="command-objective-overlay"
            className="hud-bottom-overlay"
            data-expanded={questExpanded}
          >
            <div className="hud-bottom-overlay__scroll">
              <OpsBriefingsPanel showCompleted />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const hasPersistedGame = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return Boolean(window.localStorage.getItem(PERSISTED_STATE_KEY));
  } catch (error) {
    console.warn("[App] Failed to read persisted game state", error);
    return false;
  }
};

const getRemainingPerks = (player: Player) =>
  listPerks().filter((definition) => !player.perks.includes(definition.id));

const getSelectablePerks = (player: Player) =>
  getRemainingPerks(player)
    .map((definition) => evaluatePerkAvailability(player, definition))
    .filter((availability) => availability.canSelect);

const buildAgentCharacterData = (name: string): CharacterCreationData => ({
  name,
  attributes: DEFAULT_SKILLS,
  backgroundId: 'corpsec_defector',
  visualPreset: 'default',
});
const AGENT_LEVEL0_SESSION_KEY = 'getaway.agent.level0.started';

function AppShell() {
  const [gameStarted, setGameStarted] = useState(false);
  const [showMenu, setShowMenu] = useState(true);
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  const [hasSavedGame, setHasSavedGame] = useState(() => hasPersistedGame());
  const [levelUpData, setLevelUpData] = useState<{
    newLevel: number;
    skillPointsEarned: number;
    attributePointsEarned: number;
    perksUnlocked: number;
  } | null>(null);
  const [xpNotifications, setXpNotifications] = useState<XPNotificationData[]>([]);
  const [showCharacterScreen, setShowCharacterScreen] = useState(false);
  const [pendingPerkSelections, setPendingPerkSelections] = useState(0);
  const [showPerkSelection, setShowPerkSelection] = useState(false);
  const [levelUpFlowActive, setLevelUpFlowActive] = useState(false);
  const [showPointAllocation, setShowPointAllocation] = useState(false);
  const hudLayoutPreset = useSelector(selectHudLayoutPreset);
  const playerHealth = useSelector((state: RootState) => state.player.data.health);
  const level0PainterlyHud = useSelector((state: RootState) =>
    isLevel0Exterior(state.world.currentMapArea)
  );
  const reputationSystemsEnabled = useSelector(
    (state: RootState) => Boolean(state.settings.reputationSystemsEnabled)
  );
  const agentLevel0StartedRef = useRef(false);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (level0PainterlyHud) {
      root.dataset.visualStyle = 'graphic-painterly-noir';
    } else {
      delete root.dataset.visualStyle;
    }

    return () => {
      delete root.dataset.visualStyle;
    };
  }, [level0PainterlyHud]);

  useEffect(() => {
    log.debug('Component mounted');
    log.debug('Store state:', store.getState());
    primeLevel0AudioCues();
  }, []);

  useEffect(() => {
    return installGetawayAgentBridge({
      store,
      nodeEnv: process.env.NODE_ENV,
    });
  }, []);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      const events = state.player.pendingLevelUpEvents;

      setLevelUpData((current) => {
        if (current) {
          return current;
        }
        return events.length > 0 ? events[0] : null;
      });

      const selections = state.player.data.pendingPerkSelections;
      setPendingPerkSelections(selections);

      const notifications = state.player.xpNotifications ?? [];
      setXpNotifications(notifications);
      // Don't auto-open perk selection - let the guided flow handle it
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!showMenu) {
      return;
    }

    if (gameStarted) {
      setHasSavedGame(true);
      return;
    }

    setHasSavedGame(hasPersistedGame());
  }, [showMenu, gameStarted]);

  const handleCharacterCreationComplete = useCallback((data: CharacterCreationData) => {
    store.dispatch(resetGame());

    const attributes: PlayerSkills = data.attributes ?? DEFAULT_SKILLS;
    const backgroundId = data.backgroundId ?? 'corpsec_defector';

    store.dispatch(
      initializeCharacter({
        name: data.name,
        skills: attributes,
        backgroundId,
        visualPreset: data.visualPreset,
      })
    );

    const state = store.getState();
    const { logs } = getSystemStrings(state.settings.locale);
    store.dispatch(addLogMessage(`${logs.operationStart} - Call sign: ${data.name}`));

    setShowCharacterCreation(false);
    setGameStarted(true);
    setHasSavedGame(true);
  }, []);

  // PoC convenience: allow loading straight into a fresh Level 0 run for quick visual review.
  // Usage: add `?poc=esb` to the URL.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('poc') !== 'esb') {
      return;
    }

    if (gameStarted || showCharacterCreation) {
      return;
    }

    // Force a fresh run so we don't reuse an old persisted world.
    try {
      window.localStorage.removeItem(PERSISTED_STATE_KEY);
    } catch {
      // ignore
    }
    setHasSavedGame(false);
    setShowMenu(false);

    // Kick straight into the game with a default character.
    const pocData: CharacterCreationData = {
      name: params.get('pocName') ?? 'Deus',
      attributes: DEFAULT_SKILLS,
      backgroundId: 'corpsec_defector',
      visualPreset: 'default',
    };

    // Keep lights settings as-is; ESB PoC neon is implemented as additive emissive graphics.

    handleCharacterCreationComplete(pocData);
  }, [gameStarted, handleCharacterCreationComplete, showCharacterCreation]);

  useEffect(() => {
    if (!gameStarted) {
      return;
    }
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
  }, [gameStarted]);

  useEffect(() => {
    if (showMenu || showCharacterCreation) {
      setShowCharacterScreen(false);
    }
  }, [showMenu, showCharacterCreation]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'c' && gameStarted && !showMenu && !showCharacterCreation) {
        setShowCharacterScreen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, showMenu, showCharacterCreation]);

  const handleStartNewGame = () => {
    setShowMenu(false);
    setShowCharacterCreation(true);
  };

  const startAgentLevel0 = useCallback((name: string) => {
    try {
      window.localStorage.removeItem(PERSISTED_STATE_KEY);
    } catch {
      // Ignore storage failures; resetGame still clears in-memory state.
    }

    try {
      window.sessionStorage.setItem(AGENT_LEVEL0_SESSION_KEY, '1');
    } catch {
      // Ignore session storage failures; the in-memory guard still prevents duplicate starts.
    }

    store.dispatch(clearAllFeedback());
    setLevelUpData(null);
    setXpNotifications([]);
    setPendingPerkSelections(0);
    setShowPerkSelection(false);
    setShowPointAllocation(false);
    setLevelUpFlowActive(false);
    setShowCharacterScreen(false);
    setHasSavedGame(false);
    setShowMenu(false);
    setShowCharacterCreation(false);
    handleCharacterCreationComplete(buildAgentCharacterData(name));
  }, [handleCharacterCreationComplete]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const params = new URLSearchParams(window.location.search);
    if (
      !shouldEnableGetawayAgentBridge(window.location.search, process.env.NODE_ENV) ||
      params.get('agentStart') !== 'level0'
    ) {
      return undefined;
    }

    let agentAlreadyStartedInSession = false;
    try {
      agentAlreadyStartedInSession =
        window.sessionStorage.getItem(AGENT_LEVEL0_SESSION_KEY) === '1';
    } catch {
      agentAlreadyStartedInSession = false;
    }

    if (agentAlreadyStartedInSession) {
      agentLevel0StartedRef.current = true;
      return undefined;
    }

    if (!gameStarted && !showCharacterCreation && !agentLevel0StartedRef.current) {
      agentLevel0StartedRef.current = true;
      startAgentLevel0(params.get('agentName') ?? 'Agent');
    }

    return undefined;
  }, [gameStarted, showCharacterCreation, startAgentLevel0]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleAgentStart = (event: Event) => {
      const detail = (event as CustomEvent<{ name?: string }>).detail;
      startAgentLevel0(detail?.name ?? 'Agent');
    };

    window.addEventListener(GETAWAY_AGENT_START_LEVEL0_EVENT, handleAgentStart);
    return () => {
      window.removeEventListener(GETAWAY_AGENT_START_LEVEL0_EVENT, handleAgentStart);
    };
  }, [startAgentLevel0]);

  const handleCharacterCreationCancel = () => {
    setShowCharacterCreation(false);
    setShowMenu(true);
  };

  const handleMissionFailureRetry = () => {
    try {
      window.localStorage.removeItem(PERSISTED_STATE_KEY);
    } catch {
      // Ignore storage failures; resetGame still clears in-memory state.
    }

    store.dispatch(resetGame());
    store.dispatch(clearAllFeedback());
    setLevelUpData(null);
    setXpNotifications([]);
    setPendingPerkSelections(0);
    setShowPerkSelection(false);
    setShowPointAllocation(false);
    setLevelUpFlowActive(false);
    setShowCharacterScreen(false);
    setHasSavedGame(false);
    setGameStarted(false);
    setShowMenu(false);
    setShowCharacterCreation(true);
  };

  const handleContinueGame = () => {
    // Clear any lingering combat feedback before resuming
    store.dispatch(clearAllFeedback());

    setGameStarted(true);
    setShowMenu(false);
    setHasSavedGame(true);
  };

  useEffect(() => {
    if (!gameStarted) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();

      if (showCharacterScreen) {
        setShowCharacterScreen(false);
        if (levelUpFlowActive) {
          setLevelUpFlowActive(false);
        }
        return;
      }

      const state = store.getState();
      const hasActiveDialogue = Boolean(state.quests.activeDialogue.dialogueId);

      if (hasActiveDialogue) {
        store.dispatch(endDialogue());
        return;
      }

      if (showMenu) {
        handleContinueGame();
        return;
      }

      if (!showCharacterCreation) {
        setShowMenu(true);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [gameStarted, showMenu, showCharacterCreation, showCharacterScreen, levelUpFlowActive]);

  const handleOpenMenu = () => {
    if (!gameStarted) {
      setShowMenu(true);
      return;
    }

    if (showMenu) {
      handleContinueGame();
      return;
    }

    const state = store.getState();
    const hasActiveDialogue = Boolean(state.quests.activeDialogue.dialogueId);

    if (hasActiveDialogue) {
      store.dispatch(endDialogue());
      return;
    }

    setShowMenu(true);
  };

  const handleToggleCharacterScreen = () => {
    if (!gameStarted || showMenu || showCharacterCreation) {
      return;
    }
    setShowCharacterScreen((prev) => !prev);
  };

  const handleLevelUpContinue = () => {
    if (!levelUpData) return;

    const state = store.getState();
    const playerState = state.player.data;
    const pendingSelections = playerState.pendingPerkSelections;
    const remainingPerks = getRemainingPerks(playerState);
    const selectablePerks = getSelectablePerks(playerState);
    const hasPerksToReview = pendingSelections > 0;
    const hasSelectablePerks = selectablePerks.length > 0;
    const hasPoints = playerState.skillPoints > 0 || playerState.attributePoints > 0;

    setLevelUpFlowActive(hasPerksToReview || hasPoints);

    store.dispatch(consumeLevelUpEvent());
    setLevelUpData(null);

    if (hasPerksToReview && remainingPerks.length > 0) {
      if (!hasSelectablePerks) {
        console.info('[LevelUp] Perk selections available but current requirements are unmet. Player may need to allocate points first.');
      }
      setShowPerkSelection(true);
    } else if (hasPerksToReview && remainingPerks.length === 0) {
      store.dispatch(clearPendingPerkSelections());
      if (hasPoints) {
        setShowPointAllocation(true);
      } else {
        setLevelUpFlowActive(false);
      }
    } else if (hasPoints) {
      setShowPointAllocation(true);
    } else {
      setLevelUpFlowActive(false);
    }
  };

  const handlePerkSelectionClose = () => {
    setShowPerkSelection(false);

    if (!levelUpFlowActive) {
      return;
    }

    const playerState = store.getState().player.data;
    const pendingSelections = playerState.pendingPerkSelections;
    const hasPointsRemaining = playerState.skillPoints > 0 || playerState.attributePoints > 0;
    const remainingPerks = getRemainingPerks(playerState);
    const selectablePerks = getSelectablePerks(playerState);

    if (pendingSelections > 0 && selectablePerks.length === 0 && remainingPerks.length === 0) {
      store.dispatch(clearPendingPerkSelections());
    }

    if (hasPointsRemaining) {
      setShowPointAllocation(true);
      return;
    }

    setLevelUpFlowActive(false);
  };

  const handleCharacterScreenClose = () => {
    setShowCharacterScreen(false);

    if (levelUpFlowActive) {
      setLevelUpFlowActive(false);
    }
  };

  const handlePointAllocationComplete = () => {
    setShowPointAllocation(false);

    const playerState = store.getState().player.data;
    const pendingSelections = playerState.pendingPerkSelections;
    const remainingPerks = getRemainingPerks(playerState);
    const selectablePerks = getSelectablePerks(playerState);

    if (pendingSelections > 0 && selectablePerks.length > 0) {
      setShowPerkSelection(true);
      return;
    }

    if (pendingSelections > 0 && selectablePerks.length === 0 && remainingPerks.length === 0) {
      store.dispatch(clearPendingPerkSelections());
    }

    setLevelUpFlowActive(false);
  };

  const handleDismissXPNotification = (id: string) => {
    store.dispatch(removeXPNotification(id));
  };

  const missionFailureOpen =
    gameStarted && !showMenu && !showCharacterCreation && playerHealth <= 0;

  return (
    <>
      <MissionProgressionManager />
      {reputationSystemsEnabled && <FactionReputationManager />}
      <div style={layoutShellStyle}>
        {gameStarted && (
          <CommandShell
            onOpenMenu={handleOpenMenu}
            onToggleCharacter={handleToggleCharacterScreen}
            showMenu={showMenu}
            characterOpen={showCharacterScreen}
            hudLayoutPreset={hudLayoutPreset}
          />
        )}
        <CurfewWarning />
      </div>
      <Suspense fallback={null}>
        {showMenu && (
          <GameMenu
            onStartNewGame={handleStartNewGame}
            onContinue={handleContinueGame}
            hasActiveGame={gameStarted || hasSavedGame}
          />
        )}
        {showCharacterCreation && (
          <CharacterCreationScreen
            onComplete={handleCharacterCreationComplete}
            onCancel={handleCharacterCreationCancel}
          />
        )}
        {levelUpData && (
          <LevelUpModal
            newLevel={levelUpData.newLevel}
            skillPointsEarned={levelUpData.skillPointsEarned}
            attributePointsEarned={levelUpData.attributePointsEarned}
            perksUnlocked={levelUpData.perksUnlocked}
            onContinue={handleLevelUpContinue}
          />
        )}
        <PerkSelectionPanel
          open={showPerkSelection}
          pendingSelections={pendingPerkSelections}
          onClose={handlePerkSelectionClose}
        />
        {showPointAllocation && (
          <LevelUpPointAllocationPanel
            onComplete={handlePointAllocationComplete}
          />
        )}
        <CharacterScreen open={showCharacterScreen} onClose={handleCharacterScreenClose} />
        <MissionCompletionOverlay />
        <MissionFailureOverlay open={missionFailureOpen} onRetry={handleMissionFailureRetry} />
      </Suspense>
      <XPNotificationManager
        notifications={xpNotifications}
        onDismiss={handleDismissXPNotification}
      />
    </>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppShell />
    </Provider>
  );
}

export default App;
