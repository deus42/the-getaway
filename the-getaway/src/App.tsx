import { Provider, useSelector } from "react-redux";
import { CSSProperties, useEffect, useState } from "react";
import GameCanvas from "./components/GameCanvas";
import GameController from "./components/GameController";
import PlayerStatusPanel from "./components/ui/PlayerStatusPanel";
import PlayerStatsPanel from "./components/ui/PlayerStatsPanel";
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
import { PERSISTED_STATE_KEY, resetGame, store, RootState } from "./store";
import { addLogMessage } from "./store/logSlice";
import { setSkill } from "./store/playerSlice";
import { PlayerSkills } from "./game/interfaces/types";
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
  overflow: "hidden",
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
  position: "absolute",
  top: "1.5rem",
  right: "1.5rem",
  zIndex: 2,
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

const centerStageStyle: CSSProperties = {
  width: "60%",
  height: "100%",
  position: "relative",
  overflow: "hidden",
};

interface CommandShellProps {
  onOpenMenu: () => void;
  showMenu: boolean;
}

const CommandShell: React.FC<CommandShellProps> = ({ onOpenMenu, showMenu }) => {
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);

  return (
    <>
      {!showMenu && (
        <button
          type="button"
          onClick={onOpenMenu}
          data-testid="open-menu"
          style={menuButtonStyle}
        >
          {uiStrings.shell.menuButton}
        </button>
      )}
      <div style={mainStageStyle}>
        <div style={leftSidebarStyle}>
          <div style={{ ...panelBaseStyle }}>
            <span style={panelLabelStyle("#38bdf8")}>{uiStrings.shell.reconLabel}</span>
            <h2 style={panelTitleStyle}>{uiStrings.shell.reconTitle}</h2>
            <MiniMap />
          </div>
          <div style={{ ...panelBaseStyle, flex: "1 1 0" }}>
            <span style={panelLabelStyle("#38bdf8")}>{uiStrings.shell.squadLabel}</span>
            <h2 style={panelTitleStyle}>{uiStrings.shell.squadTitle}</h2>
            <div
              style={{
                ...scrollSectionStyle,
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <PlayerStatusPanel />
              <PlayerStatsPanel />
            </div>
          </div>
        </div>
        <div style={centerStageStyle}>
          <GameCanvas />
          <GameController />
          <TurnTracker />
          <LevelIndicator />
          <DayNightIndicator />
          <DialogueOverlay />
        </div>
        <div style={rightSidebarStyle}>
          <div style={{ ...panelBaseStyle, flex: "1 1 0" }}>
            <span style={panelLabelStyle("#f0abfc")}>{uiStrings.questLog.panelLabel}</span>
            <h2 style={panelTitleStyle}>{uiStrings.questLog.title}</h2>
            <OpsBriefingsPanel containerStyle={scrollSectionStyle} />
          </div>
          <div style={{ ...panelBaseStyle, flex: "1 1 0" }}>
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

  useEffect(() => {
    console.log("[App] Component mounted");
    console.log("[App] Store state:", store.getState());
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

  const handleStartNewGame = () => {
    setShowMenu(false);
    setShowCharacterCreation(true);
  };

  const handleCharacterCreationComplete = (data: CharacterCreationData) => {
    store.dispatch(resetGame());

    // Apply character attributes if provided
    if (data.attributes) {
      Object.entries(data.attributes).forEach(([skill, value]) => {
        store.dispatch(setSkill({
          skill: skill as keyof PlayerSkills,
          value: value as number
        }));
      });
    }

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

  const handleLevelUpContinue = () => {
    setLevelUpData(null);
  };

  const handleDismissXPNotification = (id: string) => {
    setXpNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <Provider store={store}>
      <div style={layoutShellStyle}>
        {gameStarted && (
          <CommandShell onOpenMenu={handleOpenMenu} showMenu={showMenu} />
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
      <XPNotificationManager
        notifications={xpNotifications}
        onDismiss={handleDismissXPNotification}
      />
    </Provider>
  );
}

export default App;
