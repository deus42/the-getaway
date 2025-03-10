import { useEffect, useRef } from "react";
import { initGame, destroyGame } from "./game/index";
import "./App.css";

function App() {
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize game when component mounts
    if (gameContainerRef.current) {
      initGame();
    }

    // Cleanup on unmount
    return () => {
      destroyGame();
    };
  }, []);

  return (
    <div className="container-game">
      <header className="app-header">
        <h1>The Getaway</h1>
        <span className="subtitle">Escape from Tyranny</span>
      </header>

      <main
        className="game-container"
        id="game-container"
        ref={gameContainerRef}
      ></main>

      <footer className="app-footer">
        <p>© 2036 Resistance Network - v0.1</p>
      </footer>
    </div>
  );
}

export default App;
