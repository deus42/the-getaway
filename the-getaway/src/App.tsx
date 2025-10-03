import { Provider, useSelector } from "react-redux";
import { CSSProperties, useEffect, useState } from "react";
import GameCanvas from "./components/GameCanvas";
import GameController from "./components/GameController";
import PlayerSummaryPanel from "./components/ui/PlayerSummaryPanel";
import LogPanel from "./components/ui/LogPanel";
import DayNightIndicator from "./components/ui/DayNightIndicator";
import MiniMap from "./components/ui/MiniMap";
import LevelIndicator from "./components/ui/LevelIndicator";
import DialogueOverlay from "./components/ui/DialogueOverlay";
import GameMenu from "./components/ui/GameMenu";
import OpsBriefingsPanel from "./components/ui/OpsBriefingsPanel";
import TurnTracker from "./components/ui/TurnTracker";
import CharacterCreationScreen, { CharacterCreationData } from "./components/ui/CharacterCreationScreen";
import { LevelUpModal } from "./components/ui/LevelUpModal";
import { XPNotificationManager, XPNotificationData } from "./components/ui/XPNotification";
import CharacterScreen from "./components/ui/CharacterScreen";
import PerkSelectionPanel from "./components/ui/PerkSelectionPanel";
import CornerAccents from "./components/ui/CornerAccents";
import ScanlineOverlay from "./components/ui/ScanlineOverlay";
import TacticalHUDFrame from "./components/ui/TacticalHUDFrame";
import DataStreamParticles from "./components/ui/DataStreamParticles";
import CombatFeedbackManager from "./components/ui/CombatFeedbackManager";
import { PERSISTED_STATE_KEY, resetGame, store, RootState } from "./store";
import { addLogMessage } from "./store/logSlice";
import { initializeCharacter, consumeLevelUpEvent } from "./store/playerSlice";
import { PlayerSkills } from "./game/interfaces/types";
import { DEFAULT_SKILLS } from "./game/interfaces/player";
import { getUIStrings } from "./content/ui";
import { getSystemStrings } from "./content/system";
import "./App.css";

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

const sidebarBaseStyle: CSSProperties = {
  width: "20%",
  height: "100%",
  padding: "1.2rem 1rem",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  minHeight: 0,
  backdropFilter: "blur(6px)",
  overflowX: "hidden",
  overflowY: "auto",
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
  width: "60%",
  height: "100%",
  position: "relative",
  overflow: "hidden",
};

interface CommandShellProps {
  onOpenMenu: () => void;
  onToggleCharacter: () => void;
  showMenu: boolean;
  characterOpen: boolean;
}

const CommandShell: React.FC<CommandShellProps> = ({ onOpenMenu, onToggleCharacter, showMenu, characterOpen }) => {
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);

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
        <div style={leftSidebarStyle}>
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
        </div>
        <div style={centerStageStyle}>
          <TacticalHUDFrame />
          <GameCanvas />
          <GameController />
          <LevelIndicator />
          <DayNightIndicator />
          <DialogueOverlay />
          <CombatFeedbackManager />
        </div>
        <div style={rightSidebarStyle}>
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
      setShowPerkSelection(selections > 0);
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

  const handleCloseCharacterScreen = () => {
    setShowCharacterScreen(false);
  };

  const handleLevelUpContinue = () => {
    store.dispatch(consumeLevelUpEvent());
    setLevelUpData(null);
  };

  const handleDismissXPNotification = (id: string) => {
    setXpNotifications((prev) => prev.filter((n) => n.id !== id));
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
          />
        )}
      </div>
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
        onClose={() => setShowPerkSelection(false)}
      />
      <CharacterScreen open={showCharacterScreen} onClose={handleCloseCharacterScreen} />
      <XPNotificationManager
        notifications={xpNotifications}
        onDismiss={handleDismissXPNotification}
      />
    </Provider>
  );
}

export default App;
