import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const [showCredits, setShowCredits] = useState(false);
  const phaserContainerRef = useRef<HTMLDivElement>(null);
  const [phaserTest, setPhaserTest] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleNewGame = () => {
    navigate("/game");
  };

  const handleOptions = () => {
    // TODO: Show options modal
    console.log("Options clicked");
  };

  const toggleCredits = () => {
    setShowCredits(!showCredits);
  };

  // Test Phaser directly on the main menu
  useEffect(() => {
    console.log("🎮 Main Menu mounted - Testing Phaser");

    // Simple test to see if Phaser is available
    const testPhaser = async () => {
      try {
        // @ts-ignore
        if (typeof window.Phaser === "undefined") {
          console.log("⚠️ Phaser not found, loading from CDN");

          // Dynamically load Phaser
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src =
              "https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js";
            script.onload = () => resolve();
            script.onerror = () =>
              reject(new Error("Failed to load Phaser from CDN"));
            document.head.appendChild(script);
          });

          // Wait a moment for Phaser to initialize
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // @ts-ignore
        if (typeof window.Phaser === "undefined") {
          throw new Error("Phaser failed to load");
        }

        // @ts-ignore
        console.log("✅ Phaser available:", window.Phaser.VERSION);

        // Try to create a simple Phaser game
        if (phaserContainerRef.current) {
          console.log("Creating test Phaser instance");

          // @ts-ignore
          const game = new window.Phaser.Game({
            type: Phaser.AUTO,
            width: 200,
            height: 100,
            parent: phaserContainerRef.current,
            backgroundColor: "#ff3b3b",
            scene: {
              create: function () {
                // @ts-ignore
                this.add.text(10, 10, "Phaser works!", { color: "#fff" });
                console.log("✅ Phaser scene created successfully");
                setPhaserTest({
                  success: true,
                  message: "Phaser initialized successfully",
                });
              },
            },
          });

          return () => {
            console.log("Destroying test Phaser instance");
            game.destroy(true);
          };
        }
      } catch (error) {
        console.error("❌ Phaser test failed:", error);
        setPhaserTest({
          success: false,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    };

    testPhaser();
  }, []);

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center relative overflow-hidden scanlines">
      {/* Animated background elements */}
      <div className="absolute inset-0 z-0">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="absolute bg-primary/5 rounded-lg"
            style={{
              width: `${Math.random() * 300 + 50}px`,
              height: `${Math.random() * 300 + 50}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 30 + 15}s`,
              animationDelay: `${Math.random() * 5}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
              opacity: Math.random() * 0.2,
            }}
          />
        ))}
      </div>

      {/* Game logo/title */}
      <div className="z-10 text-center mb-8">
        <h1 className="text-6xl font-black text-primary pulse-effect mb-2 tracking-wider">
          THE GETAWAY
        </h1>
        <p className="text-xl text-textcolor/70 italic">Escape from Tyranny</p>
        <p className="text-sm mt-2 text-textcolor/50">2036</p>
      </div>

      {/* Phaser test container */}
      <div className="z-10 mb-4">
        <div ref={phaserContainerRef} className="w-[200px] h-[100px] mb-2" />
        {phaserTest && (
          <div
            className={`text-sm ${
              phaserTest.success ? "text-green-500" : "text-red-500"
            }`}
          >
            {phaserTest.message}
          </div>
        )}
      </div>

      {/* Menu buttons */}
      <div className="z-10 flex flex-col gap-4 w-64">
        <button
          onClick={handleNewGame}
          className="btn-primary py-3 text-lg relative hover:translate-y-[-2px]"
        >
          New Game
        </button>

        <button
          onClick={handleOptions}
          className="btn-secondary relative hover:translate-y-[-2px]"
        >
          Options
        </button>

        <button
          onClick={toggleCredits}
          className="btn-secondary relative hover:translate-y-[-2px]"
        >
          {showCredits ? "Hide Credits" : "Credits"}
        </button>
      </div>

      {/* Credits panel */}
      {showCredits && (
        <div className="card mt-8 max-w-md z-10 bg-surface/90 backdrop-blur-sm">
          <h3 className="text-center mb-3 text-primary">Credits</h3>
          <p className="text-sm">
            A dystopian tactical RPG set in a world under authoritarian rule.
            Fight for freedom in a battle against tyranny.
          </p>
          <p className="text-sm mt-2">Created in 2024 by the Resistance.</p>
        </div>
      )}

      {/* Version info */}
      <div className="absolute bottom-4 right-4 text-textcolor/30 text-xs z-10">
        v0.1.0-alpha
      </div>
    </div>
  );
};

export default MainMenu;
