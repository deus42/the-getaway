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
          gameContainerRef.current.style.height = "100%";

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
    <div className="min-h-screen w-full bg-background flex flex-col scanlines">
      {/* Background elements for consistent styling */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/70"></div>

        {/* Grid overlay for cyberpunk/dystopian feel */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(0deg, transparent 24%, rgba(255, 59, 59, 0.3) 25%, rgba(255, 59, 59, 0.3) 26%, transparent 27%, transparent 74%, rgba(255, 59, 59, 0.3) 75%, rgba(255, 59, 59, 0.3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 59, 59, 0.3) 25%, rgba(255, 59, 59, 0.3) 26%, transparent 27%, transparent 74%, rgba(255, 59, 59, 0.3) 75%, rgba(255, 59, 59, 0.3) 76%, transparent 77%, transparent)",
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      {/* Game header with controls */}
      <header className="bg-surface/90 backdrop-blur-sm border-b border-primary/30 py-3 px-6 flex justify-between items-center z-10">
        <div className="flex items-center">
          <h2 className="text-primary text-xl font-bold tracking-wider">
            THE GETAWAY
          </h2>
          <span className="text-textcolor/50 text-sm ml-3">2036</span>
        </div>
        <div className="flex gap-4">
          <button className="btn-secondary text-sm py-1 px-4 hover:bg-surface-hover transition-all duration-300">
            Settings
          </button>
          <button
            className="btn-secondary text-sm py-1 px-4 hover:bg-surface-hover transition-all duration-300"
            onClick={handleExitGame}
          >
            Exit
          </button>
        </div>
      </header>

      {/* Game container - enhanced styling */}
      <main className="flex-grow relative z-10">
        <div
          ref={gameContainerRef}
          id="game-container"
          className="w-full h-full"
          style={{ minHeight: "calc(100vh - 58px)" }}
        />

        {/* Error message */}
        {error && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4 z-20">
            <div className="bg-surface p-6 rounded-lg max-w-md border border-primary/30">
              <h3 className="text-primary text-xl mb-4">
                Game Initialization Error
              </h3>
              <p className="text-textcolor mb-5">{error}</p>
              <div className="flex justify-end">
                <button
                  className="btn-primary py-2 px-6 hover:translate-y-[-2px] transition-all duration-300"
                  onClick={handleRetry}
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator with dystopian styling */}
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-6"></div>
            <div className="text-primary text-2xl font-bold tracking-wider pulse-effect">
              INITIALIZING
            </div>
            <div className="text-textcolor/70 text-sm mt-2">
              Establishing secure connection...
            </div>
          </div>
        )}
      </main>

      {/* Game UI footer - optional stats bar */}
      <footer className="bg-surface/80 backdrop-blur-sm border-t border-primary/20 py-2 px-4 text-xs text-textcolor/50 flex justify-between z-10">
        <div>STATUS: ACTIVE</div>
        <div>SYSTEM v0.1.0</div>
      </footer>
    </div>
  );
};

export default GameView;
