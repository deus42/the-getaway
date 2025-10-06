import { Provider, useSelector } from "react-redux";
import { CSSProperties, useEffect, useLayoutEffect, useRef, useState, lazy, Suspense } from "react";
import GameCanvas from "./components/GameCanvas";
import GameController from "./components/GameController";
import PlayerSummaryPanel from "./components/ui/PlayerSummaryPanel";
import LogPanel from "./components/ui/LogPanel";
import DayNightIndicator from "./components/ui/DayNightIndicator";
import MiniMap from "./components/ui/MiniMap";
import LevelIndicator from "./components/ui/LevelIndicator";
import DialogueOverlay from "./components/ui/DialogueOverlay";
import OpsBriefingsPanel from "./components/ui/OpsBriefingsPanel";
import TurnTracker from "./components/ui/TurnTracker";
import { XPNotificationManager, XPNotificationData } from "./components/ui/XPNotification";
import CornerAccents from "./components/ui/CornerAccents";
import ScanlineOverlay from "./components/ui/ScanlineOverlay";
import TacticalHUDFrame from "./components/ui/TacticalHUDFrame";
import DataStreamParticles from "./components/ui/DataStreamParticles";
import CombatFeedbackManager from "./components/ui/CombatFeedbackManager";
import { PERSISTED_STATE_KEY, resetGame, store, RootState } from "./store";
import { addLogMessage } from "./store/logSlice";
import { initializeCharacter, consumeLevelUpEvent, clearPendingPerkSelections, removeXPNotification } from "./store/playerSlice";
import { clearAllFeedback } from "./store/combatFeedbackSlice";
import { PlayerSkills, Player } from "./game/interfaces/types";
import { DEFAULT_SKILLS } from "./game/interfaces/player";
import { getUIStrings } from "./content/ui";
import { getSystemStrings } from "./content/system";
import { listPerks, evaluatePerkAvailability } from "./content/perks";
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

const SIDEBAR_BASIS = 'min(26rem, 24vw)';
const SIDEBAR_FALLBACK_PX = 320;

const mainStageStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: "flex",
  background: "radial-gradient(circle at top, rgba(30, 41, 59, 0.72), rgba(15, 23, 42, 0.95))",
};

const sidebarBaseStyle: CSSProperties = {
  flex: `0 0 ${SIDEBAR_BASIS}`,
  height: "100%",
  padding: "1.2rem 1rem",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  minHeight: 0,
  backdropFilter: "blur(6px)",
  overflowX: "hidden",
  overflowY: "auto",
  transition: "flex-basis 0.25s ease, opacity 0.25s ease, padding 0.25s ease",
};

const leftSidebarStyle: CSSProperties = {
  ...sidebarBaseStyle,
  borderRight: "1px solid rgba(51, 65, 85, 0.65)",
  background: "linear-gradient(180deg, rgba(15, 23, 42, 0.78) 0%, rgba(15, 23, 42, 0.92) 100%)",
  justifyContent: "flex-start",
};

const rightSidebarStyle: CSSProperties = {
  ...sidebarBaseStyle,
  borderLeft: "1px solid rgba(51, 65, 85, 0.65)",
  background: "linear-gradient(180deg, rgba(15, 23, 42, 0.82) 0%, rgba(15, 23, 42, 0.94) 100%)",
};

const panelBaseStyle: CSSProperties = {
  position: "relative",
  background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.78))",
  border: "1px solid rgba(148, 163, 184, 0.24)",
  borderRadius: "14px",
  padding: "1rem 0.9rem",
  boxShadow: "0 24px 42px rgba(15, 23, 42, 0.32)",
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  overflow: "hidden",
};

const panelLabelStyle = (color: string): CSSProperties => ({
  fontSize: "0.58rem",
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  color,
  opacity: 0.85,
  marginBottom: "0.35rem",
});

const panelTitleStyle: CSSProperties = {
  fontSize: "1rem",
  fontWeight: 700,
  color: "#f8fafc",
  marginBottom: "0.65rem",
  letterSpacing: "0.05em",
};

const scrollSectionStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  paddingRight: "0.4rem",
};

const menuButtonStyle: CSSProperties = {
  padding: "0.65rem 1.35rem",
  borderRadius: "9999px",
  border: "1px solid rgba(56, 189, 248, 0.55)",
  background:
    "linear-gradient(135deg, rgba(37, 99, 235, 0.6), rgba(56, 189, 248, 0.65))",
  color: "#e0f2fe",
  fontSize: "0.82rem",
  letterSpacing: "0.12em",
  cursor: "pointer",
  transition: "transform 0.12s ease, box-shadow 0.12s ease",
  boxShadow: "0 18px 32px rgba(37, 99, 235, 0.3)",
};

const menuButtonWrapperStyle: CSSProperties = {
  position: "absolute",
  top: "1.5rem",
  right: "1.5rem",
  zIndex: 2,
};

const centerStageStyle: CSSProperties = {
  flex: "1 1 0%",
  minWidth: 0,
  height: "100%",
  position: "relative",
  overflow: "hidden",
};

const sidebarToggleBaseStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  width: "2.2rem",
  height: "2.2rem",
  borderRadius: "999px",
  border: "1px solid rgba(148, 163, 184, 0.45)",
  background: "linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(30, 41, 59, 0.88))",
  color: "#e2e8f0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.85rem",
  cursor: "pointer",
  zIndex: 5,
  boxShadow: "0 14px 28px rgba(15, 23, 42, 0.45)",
  transition: "all 0.25s ease",
};

interface CommandShellProps {
  onOpenMenu: () => void;
  onToggleCharacter: () => void;
  showMenu: boolean;
  characterOpen: boolean;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
}

const CommandShell: React.FC<CommandShellProps> = ({
  onOpenMenu,
  onToggleCharacter,
  showMenu,
  characterOpen,
  leftCollapsed,
  rightCollapsed,
  onToggleLeftSidebar,
  onToggleRightSidebar,
}) => {
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);

  const leftSidebarRef = useRef<HTMLDivElement | null>(null);
  const rightSidebarRef = useRef<HTMLDivElement | null>(null);
  const [leftWidth, setLeftWidth] = useState<number>(0);
  const [rightWidth, setRightWidth] = useState<number>(0);
  const lastLeftWidth = useRef<number>(0);
  const lastRightWidth = useRef<number>(0);

  useLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const target = leftSidebarRef.current;
    if (!target) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        setLeftWidth(width);
        if (width > 0) {
          lastLeftWidth.current = width;
        }
      }
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const target = rightSidebarRef.current;
    if (!target) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        setRightWidth(width);
        if (width > 0) {
          lastRightWidth.current = width;
        }
      }
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const leftStyle: CSSProperties = leftCollapsed
    ? {
        ...leftSidebarStyle,
        flex: '0 0 0px',
        width: 0,
        padding: 0,
        opacity: 0,
        pointerEvents: 'none',
        visibility: 'hidden',
        borderRight: 'none',
        minWidth: 0,
      }
    : leftSidebarStyle;

  const rightStyle: CSSProperties = rightCollapsed
    ? {
        ...rightSidebarStyle,
        flex: '0 0 0px',
        width: 0,
        padding: 0,
        opacity: 0,
        pointerEvents: 'none',
        visibility: 'hidden',
        borderLeft: 'none',
        minWidth: 0,
      }
    : rightSidebarStyle;

  const centerStyle: CSSProperties = { ...centerStageStyle };

  const measuredLeftWidth = leftWidth > 0 ? leftWidth : (lastLeftWidth.current || SIDEBAR_FALLBACK_PX);
  const measuredRightWidth = rightWidth > 0 ? rightWidth : (lastRightWidth.current || SIDEBAR_FALLBACK_PX);

  const effectiveLeftWidth = leftCollapsed ? 0 : measuredLeftWidth;
  const effectiveRightWidth = rightCollapsed ? 0 : measuredRightWidth;

  const leftToggleStyle: CSSProperties = leftCollapsed
    ? {
        ...sidebarToggleBaseStyle,
        left: '1.75rem',
        transform: 'translate(-50%, -50%)',
      }
    : {
        ...sidebarToggleBaseStyle,
        left: `${Math.max(effectiveLeftWidth, 0) + 12}px`,
        transform: 'translate(-50%, -50%)',
      };

  const rightToggleStyle: CSSProperties = rightCollapsed
    ? {
        ...sidebarToggleBaseStyle,
        right: '1.75rem',
        transform: 'translate(50%, -50%)',
      }
    : {
        ...sidebarToggleBaseStyle,
        right: `${Math.max(effectiveRightWidth, 0) + 12}px`,
        transform: 'translate(50%, -50%)',
      };

  return (
    <>
      {!showMenu && (
        <div style={menuButtonWrapperStyle}>
          <button
            type="button"
            onClick={onOpenMenu}
            data-testid="open-menu"
            style={menuButtonStyle}
          >
            {uiStrings.shell.menuButton}
          </button>
        </div>
      )}
      <div style={mainStageStyle}>
        {!showMenu && (
          <>
            <button
              type="button"
              onClick={onToggleLeftSidebar}
              style={leftToggleStyle}
              aria-pressed={!leftCollapsed}
              aria-label={leftCollapsed ? uiStrings.shell.expandLeft : uiStrings.shell.collapseLeft}
              title={leftCollapsed ? uiStrings.shell.expandLeft : uiStrings.shell.collapseLeft}
            >
              {leftCollapsed ? '›' : '‹'}
            </button>
            <button
              type="button"
              onClick={onToggleRightSidebar}
              style={rightToggleStyle}
              aria-pressed={!rightCollapsed}
              aria-label={rightCollapsed ? uiStrings.shell.expandRight : uiStrings.shell.collapseRight}
              title={rightCollapsed ? uiStrings.shell.expandRight : uiStrings.shell.collapseRight}
            >
              {rightCollapsed ? '‹' : '›'}
            </button>
          </>
        )}
        <div style={leftStyle} ref={leftSidebarRef}>
          {!leftCollapsed && (
            <>
              <div style={{ ...panelBaseStyle }}>
                <CornerAccents color="#38bdf8" size={14} />
                <ScanlineOverlay opacity={0.04} />
                <DataStreamParticles color="#38bdf8" count={2} side="left" />
                <span style={panelLabelStyle("#38bdf8")}>{uiStrings.shell.reconLabel}</span>
                <h2 style={panelTitleStyle}>{uiStrings.shell.reconTitle}</h2>
                <MiniMap />
              </div>
              <div style={{ ...panelBaseStyle, flex: "1 1 0" }}>
                <CornerAccents color="#38bdf8" size={14} />
                <ScanlineOverlay opacity={0.04} />
                <DataStreamParticles color="#38bdf8" count={2} side="left" />
                <span style={panelLabelStyle("#38bdf8")}>{uiStrings.shell.squadLabel}</span>
                <h2 style={panelTitleStyle}>{uiStrings.shell.squadTitle}</h2>
                <div
                  style={{
                    ...scrollSectionStyle,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.8rem",
                  }}
                >
                  <PlayerSummaryPanel onOpenCharacter={onToggleCharacter} characterOpen={characterOpen} />
                  <TurnTracker />
                </div>
              </div>
            </>
          )}
        </div>
        <div style={centerStyle}>
          <TacticalHUDFrame />
          <GameCanvas />
          <GameController />
          <LevelIndicator />
          <DayNightIndicator />
          <DialogueOverlay />
          <CombatFeedbackManager />
        </div>
        <div style={rightStyle} ref={rightSidebarRef}>
          {!rightCollapsed && (
            <>
              <div style={{ ...panelBaseStyle, flex: "1 1 0" }}>
                <CornerAccents color="#f0abfc" size={14} />
                <ScanlineOverlay opacity={0.04} />
                <DataStreamParticles color="#f0abfc" count={2} side="right" />
                <span style={panelLabelStyle("#f0abfc")}>{uiStrings.questLog.panelLabel}</span>
                <h2 style={panelTitleStyle}>{uiStrings.questLog.title}</h2>
                <OpsBriefingsPanel containerStyle={scrollSectionStyle} />
              </div>
              <div style={{ ...panelBaseStyle, flex: "1 1 0" }}>
                <CornerAccents color="#60a5fa" size={14} />
                <ScanlineOverlay opacity={0.04} />
                <DataStreamParticles color="#60a5fa" count={2} side="right" />
                <span style={panelLabelStyle("#60a5fa")}>{uiStrings.shell.telemetryLabel}</span>
                <h2 style={panelTitleStyle}>{uiStrings.shell.telemetryTitle}</h2>
                <div style={scrollSectionStyle}>
                  <LogPanel />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
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
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  useEffect(() => {
    console.log("[App] Component mounted");
    console.log("[App] Store state:", store.getState());
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
  }, [leftSidebarCollapsed, rightSidebarCollapsed, gameStarted]);

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
      <div style={layoutShellStyle}>
        {gameStarted && (
          <CommandShell
            onOpenMenu={handleOpenMenu}
            onToggleCharacter={handleToggleCharacterScreen}
            showMenu={showMenu}
            characterOpen={showCharacterScreen}
            leftCollapsed={leftSidebarCollapsed}
            rightCollapsed={rightSidebarCollapsed}
            onToggleLeftSidebar={() => setLeftSidebarCollapsed((prev) => !prev)}
            onToggleRightSidebar={() => setRightSidebarCollapsed((prev) => !prev)}
          />
        )}
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
      </Suspense>
      <XPNotificationManager
        notifications={xpNotifications}
        onDismiss={handleDismissXPNotification}
      />
    </Provider>
  );
}

export default App;
