import { useEffect, useState, ReactNode } from "react";
import { GameProvider } from "../contexts/GameContext";
import { eventBus, GameEvents } from "../game/engine/core/gameEvents";

interface PhaserWrapperProps {
  children: ReactNode;
}

const PhaserWrapper: React.FC<PhaserWrapperProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [domReady, setDomReady] = useState(false);
  const [phaserLoaded, setPhaserLoaded] = useState(false);

  // First, ensure DOM is ready before doing anything
  useEffect(() => {
    const checkDomReady = () => {
      if (document.readyState === "complete") {
        console.log("PhaserWrapper: DOM is fully loaded and ready");
        setDomReady(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (!checkDomReady()) {
      console.log("PhaserWrapper: DOM not ready, waiting for load event");
      const handleLoad = () => {
        console.log("PhaserWrapper: Window load event fired");
        setDomReady(true);
      };
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  // Load Phaser script separately
  useEffect(() => {
    if (!domReady) {
      return;
    }

    // If Phaser is already loaded, mark it as available
    if (typeof window.Phaser !== "undefined") {
      console.log("Phaser already available:", window.Phaser?.VERSION);
      setPhaserLoaded(true);
      return;
    }

    console.log("Loading Phaser script...");

    // Try local file first
    const loadPhaserScript = () => {
      // Try local file first
      const script = document.createElement("script");
      script.src = "/phaser.min.js"; // Local file in public directory
      script.async = false;
      script.defer = false;

      script.onload = () => {
        console.log("Phaser script loaded successfully from local file");

        // Verify Phaser is actually available on window
        if (typeof window.Phaser === "undefined") {
          console.error(
            "Phaser script loaded from local file but window.Phaser is undefined"
          );
          tryFallbackScript();
          return;
        }

        // Delay slightly to ensure Phaser is initialized
        setTimeout(() => {
          console.log("Setting phaserLoaded to true");
          setPhaserLoaded(true);
        }, 100);
      };

      script.onerror = () => {
        console.error("Failed to load Phaser from local file");
        tryFallbackScript();
      };

      document.head.appendChild(script);
    };

    // Try primary CDN fallback
    const tryFallbackScript = () => {
      console.log("Attempting to load Phaser from primary CDN");

      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js";
      script.async = false;
      script.defer = false;

      script.onload = () => {
        console.log("Phaser script loaded from primary CDN");

        if (typeof window.Phaser === "undefined") {
          console.error(
            "Phaser script loaded from primary CDN but window.Phaser is undefined"
          );
          trySecondaryFallbackScript();
          return;
        }

        setTimeout(() => {
          setPhaserLoaded(true);
        }, 100);
      };

      script.onerror = () => {
        console.error("Failed to load Phaser from primary CDN");
        trySecondaryFallbackScript();
      };

      document.head.appendChild(script);
    };

    // Try secondary CDN fallback
    const trySecondaryFallbackScript = () => {
      console.log("Attempting to load Phaser from secondary CDN");

      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/phaser/3.70.0/phaser.min.js";
      script.async = false;
      script.defer = false;

      script.onload = () => {
        console.log("Phaser script loaded from secondary CDN");

        if (typeof window.Phaser === "undefined") {
          setError("Failed to load Phaser after multiple attempts");
          return;
        }

        setTimeout(() => {
          setPhaserLoaded(true);
        }, 100);
      };

      script.onerror = () => {
        setError(
          "Failed to load the game engine. Please check your internet connection and reload."
        );
      };

      document.head.appendChild(script);
    };

    loadPhaserScript();
  }, [domReady]);

  // Set up game events and initialize game when Phaser is loaded
  useEffect(() => {
    if (!phaserLoaded) {
      return;
    }

    console.log("Phaser is loaded, setting up game initialization");

    // Subscribe to game events
    const initSubscription = eventBus.subscribe(
      GameEvents.GAME_INITIALIZED,
      (gameInstance) => {
        console.log("Game initialized event received", gameInstance);
        setLoading(false);
      }
    );

    const errorSubscription = eventBus.subscribe(
      "game:error",
      (errorMessage: string) => {
        console.error("Game error event received:", errorMessage);
        setError(errorMessage);
        setLoading(false);
      }
    );

    // Set timeout in case initialization hangs
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.error("Game initialization timed out");

        // Try direct initialization as last resort
        if (typeof window.Phaser !== "undefined" && !window.game) {
          try {
            console.log("Attempting direct game initialization");
            import("../game").then((gameModule) => {
              try {
                gameModule.initGame();
              } catch (e) {
                console.error("Direct initialization failed:", e);
              }
            });
          } catch (e) {
            console.error("Import error:", e);
          }
        }

        // Show error after timeout
        setTimeout(() => {
          if (loading) {
            setError("Game initialization timed out. Please reload the page.");
            setLoading(false);
          }
        }, 5000); // Give direct init a chance
      }
    }, 20000); // 20 seconds timeout

    return () => {
      initSubscription();
      errorSubscription();
      clearTimeout(timeoutId);
    };
  }, [phaserLoaded, loading]);

  // When everything is ready, check if container exists before proceeding
  useEffect(() => {
    if (!phaserLoaded || !domReady) {
      return;
    }

    console.log("Looking for game container");
    let checkAttempts = 0;
    const MAX_CHECK_ATTEMPTS = 25; // About 5 seconds of checking

    // Make sure container is actually in the DOM - it might not be if we're still loading
    const checkContainerInterval = setInterval(() => {
      checkAttempts++;
      const container = document.getElementById("game-container");

      if (container) {
        console.log("Game container found", container);
        clearInterval(checkContainerInterval);

        // Force container dimensions if needed
        if (container.clientWidth === 0 || container.clientHeight === 0) {
          console.log("Setting container dimensions");
          container.style.width = "100%";
          container.style.height = "100%";
          container.style.minHeight = "500px";

          // Force a reflow
          void container.offsetWidth;
        }

        // Publish container ready event
        eventBus.publish("container:ready", container);
      } else {
        console.log(
          `Waiting for game container... (attempt ${checkAttempts}/${MAX_CHECK_ATTEMPTS})`
        );

        // If we've checked too many times, try creating the container ourselves
        if (checkAttempts >= MAX_CHECK_ATTEMPTS) {
          console.warn(
            "Container not found after maximum attempts, creating emergency container"
          );
          clearInterval(checkContainerInterval);

          // Create an emergency container
          const emergencyContainer = document.createElement("div");
          emergencyContainer.id = "game-container";
          emergencyContainer.style.width = "100%";
          emergencyContainer.style.height = "100%";
          emergencyContainer.style.minHeight = "500px";

          // Find a suitable parent to append to
          const appRoot = document.getElementById("root") || document.body;
          appRoot.appendChild(emergencyContainer);

          console.log("Created emergency game container", emergencyContainer);

          // Publish container ready event
          eventBus.publish("container:ready", emergencyContainer);
        }
      }
    }, 200);

    return () => clearInterval(checkContainerInterval);
  }, [phaserLoaded, domReady]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="bg-surface p-6 rounded-lg max-w-md">
          <h2 className="text-primary text-xl mb-4">Game Engine Error</h2>
          <p className="text-textcolor mb-4">{error}</p>
          <p className="text-textcolor-muted mb-6">
            There was a problem loading the game engine. This might be due to a
            network issue or browser compatibility problem.
          </p>
          <div className="flex justify-end">
            <button
              className="btn-primary"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <GameProvider>
      {children}
      {loading && (
        <div className="min-h-screen flex items-center justify-center bg-background/80 backdrop-blur-sm fixed inset-0 z-50">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-6"></div>
            <div className="text-primary text-xl mb-2">
              Loading game engine...
            </div>
            <div className="text-textcolor/70 text-sm">
              Please wait, this might take a few moments
            </div>
          </div>
        </div>
      )}
    </GameProvider>
  );
};

export default PhaserWrapper;
