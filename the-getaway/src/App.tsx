import { Provider } from "react-redux";
import { useEffect, useState } from "react";
import GameCanvas from "./components/GameCanvas";
import GameController from "./components/GameController";
import PlayerStatusPanel from "./components/ui/PlayerStatusPanel";
import LogPanel from "./components/ui/LogPanel";
import DayNightIndicator from "./components/ui/DayNightIndicator";
import TurnIndicator from "./components/ui/TurnIndicator";
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

  return (
    <Provider store={store}>
      <div
        style={{
          margin: 0,
          padding: 0,
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {gameStarted && (
          <>
            {!showMenu && (
              <button
                type="button"
                onClick={handleOpenMenu}
                data-testid="open-menu"
                style={{
                  position: "absolute",
                  top: "1.5rem",
                  right: "1.5rem",
                  zIndex: 2,
                  padding: "0.65rem 1.25rem",
                  borderRadius: "9999px",
                  border: "1px solid rgba(56,189,248,0.65)",
                  backgroundColor: "rgba(15,23,42,0.85)",
                  color: "#e0f2fe",
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                  transition: "transform 0.12s ease, box-shadow 0.12s ease",
                }}
              >
                Menu
              </button>
            )}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                backgroundColor: "#1a1a1a",
                color: "white",
                fontFamily: "monospace",
              }}
            >
              <div
                style={{
                  width: "20%",
                  height: "100%",
                  borderRight: "1px solid #333",
                  overflow: "hidden",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                  minHeight: 0,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <h2
                    style={{
                      color: "#4ade80",
                      marginBottom: "1rem",
                      fontSize: "1.25rem",
                      fontWeight: "bold",
                    }}
                  >
                    Status
                  </h2>
                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      paddingRight: "0.5rem",
                      minHeight: 0,
                    }}
                  >
                    <PlayerStatusPanel />
                  </div>
                </div>
              </div>
              <div
                style={{
                  width: "60%",
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <GameCanvas />
                <GameController />
                <DayNightIndicator />
                <TurnIndicator />
              </div>
              <div
                style={{
                  width: "20%",
                  height: "100%",
                  borderLeft: "1px solid #333",
                  overflow: "hidden",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                  minHeight: 0,
                }}
              >
                <div
                  style={{
                    flex: "1 1 50%",
                    display: "flex",
                    flexDirection: "column",
                    borderBottom: "1px solid #2d2d2d",
                    paddingBottom: "1rem",
                    minHeight: 0,
                  }}
                >
                  <h2
                    style={{
                      color: "#e879f9",
                      marginBottom: "1rem",
                      fontSize: "1.25rem",
                      fontWeight: "bold",
                    }}
                  >
                    Dialog
                  </h2>
                  <div
                    style={{
                      flex: 1,
                      fontStyle: "italic",
                      color: "#666",
                      overflowY: "auto",
                    }}
                  >
                    Available in future update
                  </div>
                </div>
                <div
                  style={{
                    flex: "1 1 50%",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                  }}
                >
                  <h2
                    style={{
                      color: "#60a5fa",
                      marginBottom: "1rem",
                      fontSize: "1.25rem",
                      fontWeight: "bold",
                    }}
                  >
                    Action Log
                  </h2>
                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      paddingRight: "0.5rem",
                      minHeight: 0,
                    }}
                  >
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
