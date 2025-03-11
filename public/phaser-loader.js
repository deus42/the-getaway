// This script loads before the React application and ensures Phaser is available
console.log("📜 phaser-loader.js executing...");

// Track errors
window.__phaserErrors = [];

// Function to load Phaser
function loadPhaser() {
  try {
    console.log("🔍 Checking for Phaser...");

    // If Phaser is already loaded, skip
    if (window.Phaser) {
      console.log("✅ Phaser already loaded:", window.Phaser.VERSION);
      return Promise.resolve();
    }

    console.log("⏳ Loading Phaser from CDN...");

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js";
      script.async = false;

      script.onload = () => {
        console.log("✅ Phaser loaded successfully:", window.Phaser.VERSION);
        resolve();
      };

      script.onerror = (err) => {
        const error = new Error("Failed to load Phaser script");
        console.error("❌ Phaser load error:", error);
        window.__phaserErrors.push({ type: "load_error", error });
        reject(error);
      };

      document.head.appendChild(script);
    });
  } catch (error) {
    console.error("❌ Error in loadPhaser:", error);
    window.__phaserErrors.push({ type: "init_error", error });
    return Promise.reject(error);
  }
}

// Load Phaser immediately
loadPhaser().catch((error) => {
  console.error("❌ Fatal error loading Phaser:", error);
});

// Expose a global function to check Phaser status
window.checkPhaserStatus = function () {
  console.log("📊 Phaser status:", {
    loaded: typeof window.Phaser !== "undefined",
    version: window.Phaser?.VERSION,
    errors: window.__phaserErrors,
  });

  return {
    loaded: typeof window.Phaser !== "undefined",
    version: window.Phaser?.VERSION,
    errors: window.__phaserErrors,
  };
};

// Log when script is done
console.log("📜 phaser-loader.js executed");
