import { Provider, useSelector } from "react-redux";
import { CSSProperties, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import GameCanvas from "./components/GameCanvas";
import GameController from "./components/GameController";
import PlayerSummaryPanel from "./components/ui/PlayerSummaryPanel";
import LogPanel from "./components/ui/LogPanel";
import DayNightIndicator from "./components/ui/DayNightIndicator";
import MiniMap from "./components/ui/MiniMap";
import LevelIndicator from "./components/ui/LevelIndicator";
import GeorgeAssistant from "./components/ui/GeorgeAssistant";
import DialogueOverlay from "./components/ui/DialogueOverlay";
import OpsBriefingsPanel from "./components/ui/OpsBriefingsPanel";
import { XPNotificationManager, XPNotificationData } from "./components/ui/XPNotification";
import TacticalHUDFrame from "./components/ui/TacticalHUDFrame";
import CombatFeedbackManager from "./components/ui/CombatFeedbackManager";
import CameraDetectionHUD from "./components/ui/CameraDetectionHUD";
import CurfewWarning from "./components/ui/CurfewWarning";
import { PERSISTED_STATE_KEY, resetGame, store, RootState } from "./store";
import MissionProgressionManager from "./components/system/MissionProgressionManager";
import FactionReputationManager from "./components/system/FactionReputationManager";
import { addLogMessage } from "./store/logSlice";
import { initializeCharacter, consumeLevelUpEvent, clearPendingPerkSelections, removeXPNotification } from "./store/playerSlice";
import { clearAllFeedback } from "./store/combatFeedbackSlice";
import { PlayerSkills, Player } from "./game/interfaces/types";
import { DEFAULT_SKILLS } from "./game/interfaces/player";
import { getUIStrings } from "./content/ui";
import { getSystemStrings } from "./content/system";
import { listPerks, evaluatePerkAvailability } from "./content/perks";
import { createScopedLogger } from "./utils/logger";
import MissionCompletionOverlay from "./components/ui/MissionCompletionOverlay";
import CombatControlWidget from "./components/ui/CombatControlWidget";
import GameDebugInspector from "./components/debug/GameDebugInspector";
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
  backgroundColor: "#0f172a",
  color: "#e2e8f0",
  fontFamily: "'DM Mono', 'IBM Plex Mono', monospace",
};

const mainStageStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: "flex",
  background: "radial-gradient(circle at top, rgba(30, 41, 59, 0.72), rgba(15, 23, 42, 0.95))",
};

const scrollSectionStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  paddingRight: "0.35rem",
};

const DEFAULT_DOCK_MAX_HEIGHT = 300;

const bottomPanelBaseStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  alignItems: "stretch",
  gap: "0.75rem",
  padding: "0.6rem 1.2rem 0.7rem",
  background: "linear-gradient(140deg, rgba(10, 18, 34, 0.94), rgba(15, 24, 40, 0.9))",
  boxShadow: "0 -18px 40px rgba(8, 12, 24, 0.35)",
  pointerEvents: "auto",
  zIndex: 6,
  minHeight: "118px",
  maxHeight: `${DEFAULT_DOCK_MAX_HEIGHT}px`,
};

const laneBaseStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.45rem",
  minHeight: 0,
  height: "100%",
  flex: "1 1 auto",
};

const mapSectionStyle: CSSProperties = {
  ...laneBaseStyle,
  alignItems: "stretch",
  justifyContent: "flex-start",
};

const mapViewportStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "stretch",
  justifyContent: "flex-start",
};

const statusSectionStyle: CSSProperties = {
  ...laneBaseStyle,
};

const playerSummaryScrollStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  maxHeight: "100%",
  overflowY: "hidden",
  paddingRight: "0.3rem",
};

const objectivesSectionStyle: CSSProperties = {
  ...laneBaseStyle,
  position: 'relative',
};

const objectivesListStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  maxHeight: "100%",
  overflowY: "auto",
  paddingRight: "0.3rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.45rem",
};

const georgeSectionStyle: CSSProperties = {
  ...laneBaseStyle,
  position: 'relative',
  overflow: "visible",
};

const sectionControlRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "0.35rem",
};

const inlineButtonStyle: CSSProperties = {
  all: "unset",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.28rem",
  padding: "0.28rem 0.6rem",
  borderRadius: "999px",
  border: "1px solid rgba(148, 163, 184, 0.3)",
  background: "rgba(15, 23, 42, 0.55)",
  color: "#e2e8f0",
  fontSize: "0.58rem",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  cursor: "pointer",
  transition: "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
};

const dockExpansionBaseStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: "calc(100% + 0.55rem)",
  background: "linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.9))",
  border: "1px solid rgba(148, 163, 184, 0.3)",
  borderRadius: "16px",
  padding: "1rem 1rem 1.2rem",
  boxShadow: "0 28px 58px rgba(10, 16, 28, 0.55)",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  maxHeight: "55vh",
  overflow: "hidden",
  opacity: 0,
  pointerEvents: "none",
  transform: "translateY(12px)",
  transition: "opacity 0.22s ease, transform 0.22s ease",
  zIndex: 8,
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

const menuOverlayButtonStyle: CSSProperties = {
  all: "unset",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.6rem 1.15rem",
  borderRadius: "999px",
  border: "1.5px solid rgba(56, 189, 248, 0.75)",
  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(56, 189, 248, 0.85))",
  color: "#041321",
  fontSize: "0.74rem",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  cursor: "pointer",
  pointerEvents: "auto",
  transition: "transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease",
  boxShadow: "0 18px 36px rgba(56, 189, 248, 0.35)",
};

interface CommandShellProps {
  onOpenMenu: () => void;
  onToggleCharacter: () => void;
  showMenu: boolean;
  characterOpen: boolean;
  levelPanelCollapsed: boolean;
  onToggleLevelPanel: () => void;
}

const CommandShell: React.FC<CommandShellProps> = ({
  onOpenMenu,
  onToggleCharacter,
  showMenu,
  characterOpen,
  levelPanelCollapsed,
  onToggleLevelPanel,
}) => {
  const locale = useSelector((state: RootState) => state.settings.locale);
  const inCombat = useSelector((state: RootState) => state.world.inCombat);
  const uiStrings = getUIStrings(locale);
  const zoneId = useSelector((state: RootState) => state.world.currentMapArea?.zoneId ?? null);

  const [questExpanded, setQuestExpanded] = useState(false);
  const [logExpanded, setLogExpanded] = useState(false);
  const [rendererMeta, setRendererMeta] = useState<{ label?: string; detail?: string } | null>(null);
  const statusLaneRef = useRef<HTMLDivElement | null>(null);
  const [playerLaneHeight, setPlayerLaneHeight] = useState<number | null>(null);
  const [bottomPanelHeight, setBottomPanelHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!showMenu) {
      return;
    }
    setQuestExpanded(false);
    setLogExpanded(false);
  }, [showMenu]);

  useEffect(() => {
    if (!inCombat) {
      return;
    }
    setQuestExpanded(false);
    setLogExpanded(false);
  }, [inCombat]);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
  }, [questExpanded, logExpanded]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') {
      return;
    }
    const target = statusLaneRef.current;
    if (!target) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const nextHeight = Math.round(entry.contentRect.height);
      setPlayerLaneHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    });
    observer.observe(target);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const target = statusLaneRef.current;
    if (!target) {
      return;
    }
    const initialHeight = Math.round(target.getBoundingClientRect().height);
    setPlayerLaneHeight((prev) => (prev === initialHeight ? prev : initialHeight));
  }, []);

  useEffect(() => {
    if (!playerLaneHeight) {
      setBottomPanelHeight(null);
      return;
    }
    if (typeof window === 'undefined') {
      setBottomPanelHeight(playerLaneHeight);
      return;
    }
    const rootFontSize = parseFloat(window.getComputedStyle(document.documentElement).fontSize || '16') || 16;
    const verticalPadding = rootFontSize * 1.3; // 0.6rem top + 0.7rem bottom
    const nextHeight = Math.min(Math.round(playerLaneHeight + verticalPadding), DEFAULT_DOCK_MAX_HEIGHT);
    setBottomPanelHeight((prev) => (prev === nextHeight ? prev : nextHeight));
  }, [playerLaneHeight]);

  const questExpansionContainer: CSSProperties = {
    ...scrollSectionStyle,
    paddingRight: "0.4rem",
  };

  const logExpansionContainer: CSSProperties = {
    ...scrollSectionStyle,
    paddingRight: "0.4rem",
  };

  const expansionStyle = (expanded: boolean): CSSProperties => ({
    ...dockExpansionBaseStyle,
    opacity: expanded ? 1 : 0,
    pointerEvents: expanded ? 'auto' : 'none',
    transform: expanded ? 'translateY(0)' : 'translateY(12px)',
  });

  const handleToggleQuest = () => {
    setQuestExpanded((prev) => {
      const next = !prev;
      if (next) {
        setLogExpanded(false);
      }
      return next;
    });
  };

  const handleToggleLog = () => {
    setLogExpanded((prev) => {
      const next = !prev;
      if (next) {
        setQuestExpanded(false);
      }
      return next;
    });
  };

  const questToggleLabel = questExpanded ? uiStrings.shell.completedToggleClose : uiStrings.shell.completedToggleOpen;
  const logToggleLabel = logExpanded ? uiStrings.shell.eventsToggleClose : uiStrings.shell.eventsToggleOpen;
  const bottomPanelStyle = useMemo(() => {
    if (!bottomPanelHeight) {
      return bottomPanelBaseStyle;
    }
    const nextHeight = `${bottomPanelHeight}px`;
    return {
      ...bottomPanelBaseStyle,
      height: nextHeight,
      maxHeight: nextHeight,
    };
  }, [bottomPanelHeight]);

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

  return (
    <div style={mainStageStyle}>
      <div style={centerStageStyle}>
        <TacticalHUDFrame />
        <GameCanvas onRendererInfo={setRendererMeta} />
        <GameController />
        <div style={topLeftOverlayStyle}>
          <LevelIndicator
            collapsed={levelPanelCollapsed}
            onToggle={onToggleLevelPanel}
          />
          <GameDebugInspector zoneId={zoneId} rendererInfo={rendererMeta} />
        </div>
        <div style={topCenterOverlayStyle}>
          <CombatControlWidget />
        </div>
        <div style={topRightOverlayStyle}>
          <div style={{ pointerEvents: 'auto' }}>
            <button
              type="button"
              onClick={onOpenMenu}
              style={menuOverlayButtonStyle}
              data-testid="menu-overlay-button"
              aria-label={uiStrings.shell.menuButton}
              title={uiStrings.shell.menuButton}
              onMouseEnter={(event) => {
                event.currentTarget.style.transform = 'translateY(-1px)';
                event.currentTarget.style.boxShadow = '0 20px 40px rgba(56, 189, 248, 0.4)';
                event.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.95)';
                event.currentTarget.style.color = '#020e1b';
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.transform = 'translateY(0)';
                event.currentTarget.style.boxShadow = '0 18px 36px rgba(56, 189, 248, 0.35)';
                event.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.75)';
                event.currentTarget.style.color = '#041321';
              }}
            >
              <span style={{ fontSize: '0.62rem', letterSpacing: '0.2em' }}>{uiStrings.shell.menuButton}</span>
            </button>
          </div>
          <div style={{ pointerEvents: 'auto' }}>
            <DayNightIndicator />
          </div>
          <div style={{ pointerEvents: 'auto' }}>
            <CameraDetectionHUD />
          </div>
        </div>
        <DialogueOverlay />
        <CombatFeedbackManager />
      </div>
      <div style={bottomPanelStyle}>
        <div style={mapSectionStyle}>
          <div style={mapViewportStyle}>
            <MiniMap />
          </div>
        </div>

        <div style={statusSectionStyle} ref={statusLaneRef}>
          <div style={playerSummaryScrollStyle}>
            <PlayerSummaryPanel onOpenCharacter={onToggleCharacter} characterOpen={characterOpen} />
          </div>
        </div>

        <div style={objectivesSectionStyle}>
          <OpsBriefingsPanel containerStyle={objectivesListStyle} />
          <div style={sectionControlRowStyle}>
            <button
              type="button"
              style={inlineButtonStyle}
              onClick={handleToggleQuest}
              aria-expanded={questExpanded}
              aria-controls="command-objective-overlay"
              onMouseEnter={(event) => {
                event.currentTarget.style.transform = 'translateY(-1px)';
                event.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.55)';
                event.currentTarget.style.boxShadow = '0 12px 24px rgba(148, 163, 184, 0.22)';
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.transform = 'translateY(0)';
                event.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.35)';
                event.currentTarget.style.boxShadow = 'none';
              }}
            >
              {questToggleLabel}
            </button>
          </div>
          <div id="command-objective-overlay" style={expansionStyle(questExpanded)}>
            <OpsBriefingsPanel containerStyle={questExpansionContainer} showCompleted />
          </div>
        </div>

        <div style={georgeSectionStyle}>
          <GeorgeAssistant
            footerControls={(
              <button
                type="button"
                style={inlineButtonStyle}
                onClick={handleToggleLog}
                aria-expanded={logExpanded}
                aria-controls="command-events-overlay"
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform = 'translateY(-1px)';
                  event.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.55)';
                  event.currentTarget.style.boxShadow = '0 12px 24px rgba(96, 165, 250, 0.22)';
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = 'translateY(0)';
                  event.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.35)';
                  event.currentTarget.style.boxShadow = 'none';
                }}
              >
                {logToggleLabel}
              </button>
            )}
          />
          <div id="command-events-overlay" style={expansionStyle(logExpanded)}>
            <div style={logExpansionContainer}>
              <LogPanel />
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

const getRemainingPerks = (player: Player) => listPerks().filter((definition) => !player.perks.includes(definition.id));

const getSelectablePerks = (player: Player) => {
  return getRemainingPerks(player)
    .map((definition) => evaluatePerkAvailability(player, definition))
    .filter((availability) => availability.canSelect);
};

function App() {
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
  const [levelPanelCollapsed, setLevelPanelCollapsed] = useState(true);

  useEffect(() => {
    log.debug('Component mounted');
    log.debug('Store state:', store.getState());
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
      if (event.key.toLowerCase() === 'l' && gameStarted && !showMenu && !showCharacterCreation) {
        setLevelPanelCollapsed((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, showMenu, showCharacterCreation]);

  const handleStartNewGame = () => {
    setShowMenu(false);
    setShowCharacterCreation(true);
  };

  const handleCharacterCreationComplete = (data: CharacterCreationData) => {
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

    const { logs } = getSystemStrings(store.getState().settings.locale);
    store.dispatch(addLogMessage(`${logs.operationStart} - Call sign: ${data.name}`));

    setShowCharacterCreation(false);
    setGameStarted(true);
    setHasSavedGame(true);
  };

  const handleCharacterCreationCancel = () => {
    setShowCharacterCreation(false);
    setShowMenu(true);
  };

  const handleContinueGame = () => {
    // Clear any lingering combat feedback before resuming
    store.dispatch(clearAllFeedback());

    setGameStarted(true);
    setShowMenu(false);
    setHasSavedGame(true);
  };

  useEffect(() => {
    if (!gameStarted || !showMenu) {
      return;
    }

    const handleEscapeResume = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleContinueGame();
      }
    };

    window.addEventListener('keydown', handleEscapeResume);
    return () => window.removeEventListener('keydown', handleEscapeResume);
  }, [gameStarted, showMenu]);

  const handleOpenMenu = () => {
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

  return (
    <Provider store={store}>
      <MissionProgressionManager />
      <FactionReputationManager />
      <div style={layoutShellStyle}>
        {gameStarted && (
          <CommandShell
            onOpenMenu={handleOpenMenu}
            onToggleCharacter={handleToggleCharacterScreen}
            showMenu={showMenu}
            characterOpen={showCharacterScreen}
            levelPanelCollapsed={levelPanelCollapsed}
            onToggleLevelPanel={() => setLevelPanelCollapsed((prev) => !prev)}
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
      </Suspense>
      <XPNotificationManager
        notifications={xpNotifications}
        onDismiss={handleDismissXPNotification}
      />
    </Provider>
  );
}

export default App;
