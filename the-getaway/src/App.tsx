import { Provider } from "react-redux";
import GameCanvas from "./components/GameCanvas";
import GameController from "./components/GameController";
import { store } from "./store";
import "./App.css";
import PlayerStatusPanel from "./components/ui/PlayerStatusPanel";
import LogPanel from "./components/ui/LogPanel";

function App() {
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
              overflow: "auto",
              padding: "1rem",
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
            <PlayerStatusPanel />
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
          </div>
          <div
            style={{
              width: "20%",
              height: "100%",
              borderLeft: "1px solid #333",
              overflow: "auto",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
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
            <LogPanel />
          </div>
        </div>
      </div>
    </Provider>
  );
}

export default App;
