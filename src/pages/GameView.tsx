import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { initGame } from "../game";
import { logPhaserInfo, logScriptStatus } from "../utils/checkPhaser";

const GameView: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear any previous error
    setError(null);
    setLoading(true);

    // Run diagnostics
    logPhaserInfo();
    logScriptStatus();

    // Initialize game when component mounts
    const initializeGame = async () => {
      try {
        console.log("Starting game initialization...");

        // 1. Verify Phaser is available
        if (typeof window.Phaser === "undefined") {
          throw new Error("Phaser is not available. Please reload the page.");
        }

        console.log("Phaser available, version:", window.Phaser.VERSION);

        // 2. Verify the game container exists
        if (!gameContainerRef.current) {
          throw new Error("Game container not found");
        }

        // 3. Ensure the container has size
        if (
          gameContainerRef.current.clientWidth === 0 ||
          gameContainerRef.current.clientHeight === 0
        ) {
          console.log(
            "Game container has no dimensions, setting explicit size"
          );
          gameContainerRef.current.style.width = "100%";
          gameContainerRef.current.style.height = "600px";

          // Allow time for the DOM to update with new dimensions
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        console.log("Game container dimensions:", {
          width: gameContainerRef.current.clientWidth,
          height: gameContainerRef.current.clientHeight,
        });

        // 4. Initialize the game with direct Phaser access as fallback
        let gameInstance;
        try {
          // First try the standard way
          gameInstance = initGame();
          console.log("Game initialized via standard method");
        } catch (err) {
          console.warn(
            "Standard initialization failed, trying direct Phaser method",
            err
          );

          // Fallback to direct Phaser initialization
          gameInstance = new window.Phaser.Game({
            type: Phaser.AUTO,
            width: gameContainerRef.current.clientWidth,
            height: gameContainerRef.current.clientHeight,
            parent: "game-container",
            backgroundColor: "#121212",
            scene: {
              create: function () {
                this.add.text(100, 100, "Game is starting...", {
                  color: "#ffffff",
                });
              },
            },
          });

          console.log("Game initialized via direct Phaser method");
        }

        setLoading(false);

        return () => {
          console.log("Cleaning up game instance");
          if (gameInstance) {
            if (typeof gameInstance.destroy === "function") {
              gameInstance.destroy(true);
            }
          }
        };
      } catch (err) {
        console.error("Game initialization error:", err);
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    };

    initializeGame();
  }, []);

  const handleExitGame = () => {
    // Show confirmation dialog before exiting
    if (
      window.confirm(
        "Are you sure you want to exit? Any unsaved progress will be lost."
      )
    ) {
      navigate("/");
    }
  };

  const handleRetry = () => {
    setError(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Game header with controls */}
      <header className="bg-surface border-b border-surface p-2 flex justify-between items-center">
        <h2 className="text-primary">The Getaway</h2>
        <div className="flex gap-4">
          <button className="btn-secondary text-sm py-1">Settings</button>
          <button
            className="btn-secondary text-sm py-1"
            onClick={handleExitGame}
          >
            Exit
          </button>
        </div>
      </header>

      {/* Game container */}
      <main className="flex-grow relative">
        <div
          ref={gameContainerRef}
          id="game-container"
          className="w-full h-full"
          style={{ minHeight: "600px" }}
        />

        {/* Error message */}
        {error && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center p-4">
            <div className="bg-surface p-6 rounded-lg max-w-md">
              <h3 className="text-primary mb-4">Game Initialization Error</h3>
              <p className="text-textcolor mb-4">{error}</p>
              <div className="flex justify-end">
                <button className="btn-primary" onClick={handleRetry}>
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="text-primary text-2xl">Loading game...</div>
          </div>
        )}
      </main>
    </div>
  );
};

export default GameView;
