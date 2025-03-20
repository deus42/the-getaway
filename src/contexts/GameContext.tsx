import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import { initGame, destroyGame } from "../game";
import { eventBus, GameEvents } from "../game/engine/core/gameEvents";

interface GameContextType {
  game: Phaser.Game | null;
  isLoaded: boolean;
  error: string | null;
  retryInitialization: () => void;
}

const GameContext = createContext<GameContextType>({
  game: null,
  isLoaded: false,
  error: null,
  retryInitialization: () => {},
});

export const useGame = () => useContext(GameContext);

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [game, setGame] = useState<Phaser.Game | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptedInit, setAttemptedInit] = useState(false);
  const [domReady, setDomReady] = useState(false);
  const [containerReady, setContainerReady] = useState(false);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // First effect to ensure DOM is ready
  useEffect(() => {
    // Check if DOM is ready before doing anything
    const checkDomReady = () => {
      if (document.readyState === "complete") {
        console.log("DOM is fully loaded and ready");
        setDomReady(true);
        return true;
      }
      return false;
    };

    // If DOM is not ready, wait for it
    if (!checkDomReady()) {
      console.log("DOM not ready, waiting for load event");
      const handleDomReady = () => {
        console.log("DOM load event fired");
        setDomReady(true);
      };

      window.addEventListener("load", handleDomReady);
      return () => window.removeEventListener("load", handleDomReady);
    }
  }, []);

  // Listen for container ready event from GameView
  useEffect(() => {
    console.log("Setting up container:ready event listener");

    const containerReadySubscription = eventBus.subscribe(
      "container:ready",
      (container) => {
        console.log("Container ready event received", container);
        setContainerReady(true);
      }
    );

    return () => {
      containerReadySubscription();
    };
  }, []);

  // Function to try initializing the game
  const tryInitGame = () => {
    try {
      // Initialize the game
      console.log("Attempting to initialize game...");
      const gameInstance = initGame();

      if (!gameInstance) {
        console.log(
          "Game initialization returned null (likely retrying internally)"
        );
        return;
      }

      console.log("Game instance created:", gameInstance);

      // Set game instance in context
      setGame(gameInstance);
      setIsLoaded(true);
      setError(null);

      // Also set it on window for backward compatibility during transition
      window.game = gameInstance;
    } catch (err) {
      console.error("Error initializing game in GameProvider:", err);
      setError(err instanceof Error ? err.message : String(err));
      eventBus.publish(
        "game:error",
        err instanceof Error ? err.message : String(err)
      );
    }
  };

  // Function to manually retry initialization - exposed in context
  const retryInitialization = () => {
    console.log("Manual retry of game initialization requested");
    setError(null);
    setAttemptedInit(false);

    // Clear any existing initialization timeout
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }

    // Set a short timeout before trying again
    setTimeout(() => {
      if (typeof window.Phaser !== "undefined") {
        initGameWhenReady();
      } else {
        setError("Phaser is not available. Please refresh the page.");
      }
    }, 100);
  };

  // Wait until Phaser is available before initializing
  const initGameWhenReady = () => {
    // If we already attempted init or Phaser is not available, don't proceed
    if (attemptedInit || typeof window.Phaser === "undefined") {
      return;
    }

    console.log("GameProvider: Phaser is available, initializing game...");
    setAttemptedInit(true);

    // Get the container directly - we know it exists now
    const container = document.getElementById("game-container");
    console.log("Game container found:", container);

    if (!container) {
      console.error("Container not found during initialization");
      setError("Game container not found. Please refresh the page.");
      return;
    }

    // Container is ready, initialize game
    tryInitGame();
  };

  // Second effect to initialize game once DOM and container are ready
  useEffect(() => {
    if (!domReady) {
      console.log("Waiting for DOM to be ready before initializing game");
      return;
    }

    if (!containerReady) {
      console.log(
        "Waiting for game container to be ready before initializing game"
      );
      return;
    }

    console.log(
      "GameProvider: DOM and container are ready, checking if Phaser is available"
    );

    // Check if Phaser is already available
    if (typeof window.Phaser !== "undefined") {
      console.log("Phaser already available, initializing immediately");
      initGameWhenReady();
    } else {
      console.log("Waiting for Phaser to be loaded...");

      // Set up a MutationObserver to detect when Phaser script is added
      const observer = new MutationObserver(() => {
        if (typeof window.Phaser !== "undefined" && !attemptedInit) {
          console.log("Phaser detected via observer, initializing game");
          initGameWhenReady();
          observer.disconnect();
        }
      });

      observer.observe(document.head, { childList: true, subtree: true });

      // Also set up an interval as a fallback
      const checkInterval = setInterval(() => {
        if (typeof window.Phaser !== "undefined" && !attemptedInit) {
          console.log("Phaser detected via interval, initializing game");
          initGameWhenReady();
          clearInterval(checkInterval);
        }
      }, 500);

      // Set a timeout to show an error if Phaser doesn't load at all
      initTimeoutRef.current = setTimeout(() => {
        if (typeof window.Phaser === "undefined") {
          console.error("Phaser failed to load after waiting");
          setError(
            "Failed to load Phaser. Please check your connection and refresh the page."
          );
        }
      }, 30000); // 30 seconds

      // Clean up the interval and observer
      return () => {
        clearInterval(checkInterval);
        observer.disconnect();
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current);
        }
      };
    }

    // Cleanup function
    return () => {
      if (game) {
        console.log("GameProvider cleanup - destroying game...");
        destroyGame();
        setGame(null);
        setIsLoaded(false);

        // Also clear from window
        window.game = undefined;
      }
    };
  }, [attemptedInit, game, domReady, containerReady]);

  // Listen for game initialization events
  useEffect(() => {
    const initSubscription = eventBus.subscribe(
      GameEvents.GAME_INITIALIZED,
      (gameInstance) => {
        console.log("Game initialized event received:", gameInstance);
        setGame(gameInstance);
        setIsLoaded(true);
        setError(null);
      }
    );

    const errorSubscription = eventBus.subscribe(
      "game:error",
      (errorMessage: string) => {
        console.error("Game error event received:", errorMessage);
        // Don't overwrite with the same error
        if (error !== errorMessage) {
          setError(errorMessage);
        }
      }
    );

    return () => {
      initSubscription();
      errorSubscription();
    };
  }, [error]);

  const contextValue: GameContextType = {
    game,
    isLoaded,
    error,
    retryInitialization,
  };

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
};
