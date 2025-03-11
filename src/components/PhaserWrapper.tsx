import { useEffect, useState, ReactNode } from "react";

interface PhaserWrapperProps {
  children: ReactNode;
}

const PhaserWrapper: React.FC<PhaserWrapperProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phaserLoaded, setPhaserLoaded] = useState(false);

  useEffect(() => {
    // Check if Phaser is already loaded
    // @ts-ignore
    if (window.Phaser) {
      console.log("Phaser already loaded, skipping injection");
      setPhaserLoaded(true);
      setLoading(false);
      return;
    }

    // If not, dynamically load Phaser
    const loadPhaser = async () => {
      try {
        console.log("Attempting to load Phaser dynamically...");
        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js";
        script.async = true;

        // Create a promise to wait for script load or error
        const loadPromise = new Promise<void>((resolve, reject) => {
          script.onload = () => {
            console.log("Phaser loaded successfully via CDN");
            // @ts-ignore
            console.log("Phaser version:", window.Phaser?.VERSION);
            setPhaserLoaded(true);
            resolve();
          };

          script.onerror = () => {
            reject(new Error("Failed to load Phaser from CDN"));
          };
        });

        // Add script to document
        document.body.appendChild(script);

        // Wait for script to load with timeout
        const timeoutPromise = new Promise<void>((_, reject) => {
          setTimeout(
            () => reject(new Error("Phaser load timeout after 10 seconds")),
            10000
          );
        });

        // Race the load against timeout
        await Promise.race([loadPromise, timeoutPromise]);
      } catch (err) {
        console.error("Error loading Phaser:", err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    loadPhaser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-primary text-xl">Loading game engine...</div>
      </div>
    );
  }

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

  // If Phaser is loaded successfully, render children
  return <>{children}</>;
};

export default PhaserWrapper;
