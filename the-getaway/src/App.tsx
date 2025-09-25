import { Provider } from "react-redux";
import GameCanvas from "./components/GameCanvas";
import GameController from "./components/GameController";
import { store } from "./store";
import "./App.css";
import PlayerStatusPanel from "./components/ui/PlayerStatusPanel";
import LogPanel from "./components/ui/LogPanel";
import { useEffect } from "react";
import DayNightIndicator from "./components/ui/DayNightIndicator";
import TurnIndicator from "./components/ui/TurnIndicator";

function App() {
  useEffect(() => {
    console.log("[App] Component mounted");
    console.log("[App] Store state:", store.getState());
  }, []);

  return (
    <Provider store={store}>
      <div
        style={{
          margin: 0,
          padding: 0,
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
        }}
      >
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
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
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
                style={{ flex: 1, overflowY: "auto", paddingRight: "0.5rem", minHeight: 0 }}
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
      </div>
    </Provider>
  );
}

export default App;
