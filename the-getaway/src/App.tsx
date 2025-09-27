import { Provider } from "react-redux";
import { CSSProperties, useEffect, useState } from "react";
import GameCanvas from "./components/GameCanvas";
import GameController from "./components/GameController";
import PlayerStatusPanel from "./components/ui/PlayerStatusPanel";
import LogPanel from "./components/ui/LogPanel";
import DayNightIndicator from "./components/ui/DayNightIndicator";
import MiniMap from "./components/ui/MiniMap";
import LevelIndicator from "./components/ui/LevelIndicator";
import GameMenu from "./components/ui/GameMenu";
import { PERSISTED_STATE_KEY, resetGame, store } from "./store";
import { addLogMessage } from "./store/logSlice";
import "./App.css";

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
  const [hasSavedGame, setHasSavedGame] = useState(() => hasPersistedGame());

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
    store.dispatch(resetGame());
    store.dispatch(
      addLogMessage(
        "Operation Emberfall commences. Your cell slips back into the Slums."
      )
    );
    setGameStarted(true);
    setShowMenu(false);
    setHasSavedGame(true);
  };

  const handleContinueGame = () => {
    setGameStarted(true);
    setShowMenu(false);
    setHasSavedGame(true);
  };

  const handleOpenMenu = () => {
    setShowMenu(true);
  };

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
    padding: "1.75rem 1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    minHeight: 0,
    backdropFilter: "blur(6px)",
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
    borderRadius: "18px",
    padding: "1.35rem 1.2rem",
    boxShadow: "0 24px 42px rgba(15, 23, 42, 0.32)",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  };

  const panelLabelStyle = (color: string): CSSProperties => ({
    fontSize: "0.62rem",
    letterSpacing: "0.38em",
    textTransform: "uppercase",
    color,
    opacity: 0.85,
    marginBottom: "0.5rem",
  });

  const panelTitleStyle: CSSProperties = {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#f8fafc",
    marginBottom: "1rem",
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

  return (
    <Provider store={store}>
      <div style={layoutShellStyle}>
        {gameStarted && (
          <>
            {!showMenu && (
              <button
                type="button"
                onClick={handleOpenMenu}
                data-testid="open-menu"
                style={menuButtonStyle}
              >
                Menu
              </button>
            )}
            <div style={mainStageStyle}>
              <div style={leftSidebarStyle}>
                <div style={{ ...panelBaseStyle }}>
                  <span style={panelLabelStyle("#38bdf8")}>Recon</span>
                  <h2 style={panelTitleStyle}>Tactical Feed</h2>
                  <MiniMap />
                </div>
                <div style={{ ...panelBaseStyle, flex: "1 1 0" }}>
                  <span style={panelLabelStyle("#38bdf8")}>Squad</span>
                  <h2 style={panelTitleStyle}>Recon Status</h2>
                  <div style={scrollSectionStyle}>
                    <PlayerStatusPanel />
                  </div>
                </div>
              </div>
              <div style={centerStageStyle}>
                <GameCanvas />
                <GameController />
                <LevelIndicator />
                <DayNightIndicator />
              </div>
              <div style={rightSidebarStyle}>
                <div style={{ ...panelBaseStyle, flex: "1 1 0" }}>
                  <span style={panelLabelStyle("#f0abfc")}>Dialog</span>
                  <h2 style={panelTitleStyle}>Ops Briefings</h2>
                  <div
                    style={{
                      ...scrollSectionStyle,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "rgba(148, 163, 184, 0.75)",
                      fontStyle: "italic",
                    }}
                  >
                    Available in future update
                  </div>
                </div>
                <div style={{ ...panelBaseStyle, flex: "1 1 0" }}>
                  <span style={panelLabelStyle("#60a5fa")}>Telemetry</span>
                  <h2 style={panelTitleStyle}>Action Log</h2>
                  <div style={scrollSectionStyle}>
                    <LogPanel />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {showMenu && (
        <GameMenu
          onStartNewGame={handleStartNewGame}
          onContinue={handleContinueGame}
          hasActiveGame={gameStarted || hasSavedGame}
        />
      )}
    </Provider>
  );
}

export default App;
