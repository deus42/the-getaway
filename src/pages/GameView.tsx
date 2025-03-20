import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { initGame } from "../game";
import { useGame } from "../contexts/GameContext";
import { eventBus, GameEvents } from "../game/engine/core/gameEvents";

// More comprehensive diagnostic functions to help identify issues
const logPhaserInfo = () => {
  console.log("🔍 Diagnostic: Checking Phaser availability");
  if (typeof window.Phaser === "undefined") {
    console.error("❌ Phaser is NOT available on window object");
  } else {
    console.log(`✅ Phaser is available, version: ${window.Phaser.VERSION}`);
  }

  console.log("🔍 Diagnostic: Checking window.game availability");
  if (typeof window.game === "undefined") {
    console.error("❌ window.game is NOT available");
  } else {
    console.log("✅ window.game is available:", window.game);

    // Check scenes if game is available
    try {
      if (window.game.scene && window.game.scene.scenes) {
        console.log(
          "Available scenes:",
          window.game.scene.scenes.map((s) => s.scene.key)
        );
      } else {
        console.warn("No scenes available in game object");
      }
    } catch (err) {
      console.error("Error checking scenes:", err);
    }
  }
};

const logScriptStatus = () => {
  console.log("🔍 Diagnostic: Checking Phaser script status");
  const scripts = document.querySelectorAll("script");
  const phaserScript = Array.from(scripts).find(
    (script) => script.src && script.src.includes("phaser")
  );

  if (phaserScript) {
    console.log(`✅ Found Phaser script: ${phaserScript.src}`);
    console.log(
      `Script loading status: ${
        phaserScript.getAttribute("async") ? "async" : "sync"
      }`
    );
  } else {
    console.error("❌ No Phaser script found in document");

    // Dynamically add Phaser script if missing
    console.log("Attempting to dynamically add Phaser script");
    const script = document.createElement("script");
    script.src = "/phaser.min.js"; // Adjust path if needed
    script.async = true;
    script.onload = () => console.log("Phaser script loaded dynamically");
    script.onerror = (e) =>
      console.error("Failed to load Phaser script dynamically:", e);
    document.head.appendChild(script);
  }
};

const GameView: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [containerReady, setContainerReady] = useState(false);

  // Use the game context
  const { game, isLoaded, error: gameError, retryInitialization } = useGame();

  // Signal when container is ready in the DOM
  useEffect(() => {
    // Ensure the container exists
    if (gameContainerRef.current) {
      console.log("Game container is available in the DOM", {
        width: gameContainerRef.current.clientWidth,
        height: gameContainerRef.current.clientHeight,
      });

      // Make sure container has dimensions
      if (
        gameContainerRef.current.clientWidth === 0 ||
        gameContainerRef.current.clientHeight === 0
      ) {
        console.log("Container has zero dimensions, applying styles");
        gameContainerRef.current.style.width = "100%";
        gameContainerRef.current.style.height = "100%";
        gameContainerRef.current.style.minHeight = "500px";

        // Also try explicit pixel dimensions if needed
        if (gameContainerRef.current.clientWidth === 0) {
          gameContainerRef.current.style.width = "1280px";
        }

        if (gameContainerRef.current.clientHeight === 0) {
          gameContainerRef.current.style.height = "720px";
        }

        // Force a reflow to apply dimensions
        void gameContainerRef.current.offsetWidth;
      }

      // Inform the game context that the container is ready
      setContainerReady(true);
      eventBus.publish("container:ready", gameContainerRef.current);
    } else {
      console.error("Game container ref is not available!");
    }
  }, []);

  // Add this effect to ensure container dimensions are set after the DOM is fully rendered
  useEffect(() => {
    // Delay checking dimensions slightly to ensure React has rendered and browser has calculated sizes
    const delayedCheck = setTimeout(() => {
      if (gameContainerRef.current) {
        console.log("Checking container dimensions after delay", {
          width: gameContainerRef.current.clientWidth,
          height: gameContainerRef.current.clientHeight,
        });

        // If still zero dimensions, try more aggressive approaches
        if (
          gameContainerRef.current.clientWidth === 0 ||
          gameContainerRef.current.clientHeight === 0
        ) {
          console.warn(
            "Container still has zero dimensions after delay, applying fixes"
          );

          // Try absolute positioning
          gameContainerRef.current.style.position = "absolute";
          gameContainerRef.current.style.top = "0";
          gameContainerRef.current.style.left = "0";
          gameContainerRef.current.style.right = "0";
          gameContainerRef.current.style.bottom = "0";
          gameContainerRef.current.style.width = "100%";
          gameContainerRef.current.style.height = "100%";

          // Force layout calculation and send container ready event again
          void gameContainerRef.current.offsetWidth;
          eventBus.publish("container:ready", gameContainerRef.current);
        }
      }
    }, 500);

    return () => clearTimeout(delayedCheck);
  }, []);

  // Handle errors and loading state from GameContext
  useEffect(() => {
    console.log("GameView mounted - game status:", {
      isLoaded,
      error: gameError,
      containerReady,
    });

    // Clear any previous error
    if (!gameError) {
      setError(null);
    }

    // If there's an error from the game context, show it
    if (gameError) {
      console.error("GameContext error detected:", gameError);
      setError(gameError);
      setLoading(false);
    }

    // Update loading state based on game loaded status
    if (isLoaded) {
      console.log("Game is loaded, setting loading to false");
      setLoading(false);
    }

    // Listen for scene changes to update loading state
    const sceneSubscription = eventBus.subscribe(
      GameEvents.SCENE_CHANGED,
      (sceneName) => {
        console.log(`Scene changed to ${sceneName}, setting loading to false`);
        setLoading(false);
      }
    );

    return () => {
      // Clean up subscription
      sceneSubscription();
    };
  }, [isLoaded, gameError, containerReady]);

  // Create the handleReturnToMenu callback outside the JSX to avoid hook issues
  const handleReturnToMenu = useCallback(() => {
    console.log("🔍 Return to Game Menu clicked");

    try {
      if (!isLoaded || !game) {
        console.error("❌ Game not initialized or not loaded yet");
        alert("Game menu not available. Please refresh the page.");
        return;
      }

      console.log("✅ Game instance found via context:", game);

      // Get all available scenes
      if (game.scene && game.scene.scenes) {
        const scenes = game.scene.scenes.map((s) => s.scene.key);
        console.log("Available scenes:", scenes);

        // Log active scenes
        const activeScenes = game.scene.getScenes(true).map((s) => s.scene.key);
        console.log("Currently active scenes:", activeScenes);
      }

      // Stop all active scenes first
      game.scene.getScenes(true).forEach((scene) => {
        game.scene.stop(scene.scene.key);
      });

      // Try to start the main menu scene
      const possibleSceneKeys = [
        "MainMenuScene",
        "PhaserMainMenuScene",
        "MainMenu",
        "BootScene", // Fallback to boot scene
      ];

      let sceneFound = false;

      // Try each possible scene key
      for (const sceneKey of possibleSceneKeys) {
        try {
          console.log(`Attempting to start scene: ${sceneKey}`);
          const scene = game.scene.getScene(sceneKey);
          if (scene) {
            console.log(`✅ Found scene ${sceneKey}, starting it`);
            game.scene.start(sceneKey);

            // Also publish an event for any listeners
            eventBus.publish(GameEvents.SCENE_CHANGED, sceneKey);

            sceneFound = true;
            break;
          }
        } catch (e) {
          console.log(`Scene ${sceneKey} not found or error:`, e);
        }
      }

      // If no scene was found, try starting the first available scene
      if (!sceneFound && game.scene.scenes && game.scene.scenes.length > 0) {
        const firstSceneKey = game.scene.scenes[0].scene.key;
        console.log(
          `No menu scene found, starting first available scene: ${firstSceneKey}`
        );
        game.scene.start(firstSceneKey);

        // Also publish an event for any listeners
        eventBus.publish(GameEvents.SCENE_CHANGED, firstSceneKey);
      }

      if (
        !sceneFound &&
        (!game.scene.scenes || game.scene.scenes.length === 0)
      ) {
        throw new Error("No scenes available to navigate to");
      }
    } catch (error) {
      console.error("❌ Failed to navigate to game menu:", error);
      alert("Unable to return to game menu. Please try refreshing the page.");
    }
  }, [game, isLoaded]);

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

    // Use the context's retry function instead of page reload
    retryInitialization();

    // If there's still an error after 5 seconds, reload the page as a fallback
    setTimeout(() => {
      if (error) {
        window.location.reload();
      }
    }, 5000);
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
          <h2 className="text-primary text-xl font-bold tracking-wider pulse-effect">
            THE GETAWAY
          </h2>
          <span className="text-textcolor/50 text-sm ml-3 font-mono">2036</span>
        </div>
        <div className="flex gap-4">
          <button
            className="btn-primary py-2 px-6 text-sm bg-primary text-black font-bold relative shadow-[0_0_15px_rgba(255,59,59,0.3)] hover:shadow-[0_0_25px_rgba(255,59,59,0.6)] border border-primary hover:translate-y-[-2px] transition-all duration-300"
            onClick={handleReturnToMenu}
          >
            <span className="relative z-10">Return to Game Menu</span>
            <div className="absolute inset-0 bg-primary/20 scanlines"></div>
          </button>
          <button className="btn-secondary text-sm py-1 px-4 hover:bg-surface-hover transition-all duration-300 border border-primary/30 hover:text-primary hover:shadow-[0_0_10px_rgba(255,59,59,0.3)]">
            Options
          </button>
          <button
            className="btn-secondary text-sm py-1 px-4 hover:bg-surface-hover transition-all duration-300 border border-primary/30 hover:text-primary hover:shadow-[0_0_10px_rgba(255,59,59,0.3)]"
            onClick={handleExitGame}
          >
            Exit Game
          </button>
        </div>
      </header>

      {/* Game container - enhanced styling */}
      <main className="flex-grow relative z-10">
        <div
          ref={gameContainerRef}
          id="game-container"
          className="w-full h-full border border-primary/10 shadow-[0_0_30px_rgba(255,59,59,0.1)]"
          style={{ minHeight: "calc(100vh - 58px)" }}
        />

        {/* Error message */}
        {error && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4 z-20">
            <div className="bg-surface p-6 rounded-lg max-w-md border border-primary/30 shadow-[0_0_20px_rgba(255,59,59,0.2)]">
              <h3 className="text-primary text-xl mb-4 font-bold tracking-wider">
                SYSTEM ERROR
              </h3>
              <p className="text-textcolor mb-5 font-mono">
                <span className="text-primary/80">ERROR CODE:</span> {error}
              </p>
              <div className="flex justify-between">
                <button
                  className="btn-secondary py-2 px-6 hover:translate-y-[-2px] transition-all duration-300 border border-primary/50 hover:text-primary hover:shadow-[0_0_10px_rgba(255,59,59,0.3)]"
                  onClick={() => navigate("/")}
                >
                  Exit to Main Screen
                </button>
                <button
                  className="btn-primary py-2 px-6 hover:translate-y-[-2px] transition-all duration-300 bg-primary text-black font-bold shadow-[0_0_15px_rgba(255,59,59,0.3)]"
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
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-6 shadow-[0_0_30px_rgba(255,59,59,0.3)]"></div>
            <div className="text-primary text-2xl font-bold tracking-wider pulse-effect font-mono">
              INITIALIZING
            </div>
            <div className="text-textcolor/70 text-sm mt-2 font-mono">
              Establishing secure connection
              <span className="animate-pulse">...</span>
            </div>
            <div className="mt-8 px-10 py-2 border border-primary/20 text-xs font-mono text-textcolor/50 bg-black/20 backdrop-blur-sm">
              <span className="text-primary/70">STATUS:</span> LOADING GAME
              ASSETS
            </div>
          </div>
        )}
      </main>

      {/* Game UI footer - optional stats bar */}
      <footer className="bg-surface/80 backdrop-blur-sm border-t border-primary/20 py-2 px-4 text-xs text-textcolor/50 flex justify-between z-10 font-mono">
        <div>
          <span className="text-primary/50">STATUS:</span> ACTIVE
        </div>
        <div>
          <span className="text-primary/50">SYSTEM:</span> v0.1.0-alpha
        </div>
      </footer>
    </div>
  );
};

export default GameView;
