import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.tsx";
import { ensurePhaserGlobals } from "./game/fixPhaser";

// Early diagnostic logging - this should show up regardless of React rendering
console.log("⚡ Application starting - main.tsx loaded");

// Ensure Phaser globals are set up correctly
ensurePhaserGlobals();

// Set up global error handler to catch any unhandled errors
window.onerror = (message, source, lineno, colno, error) => {
  console.error("🚨 Global error caught:", {
    message,
    source,
    lineno,
    colno,
    error,
  });
  return false; // Let default error handling continue
};

// Check for Phaser in the global scope
console.log("📋 Initial Phaser check:", {
  // @ts-ignore
  isAvailable: typeof window.Phaser !== "undefined",
  // @ts-ignore
  version: window.Phaser?.VERSION || "not loaded",
});

// Try to preload Phaser directly in main.tsx before React renders
if (typeof window.Phaser === "undefined") {
  console.log("🔄 Attempting to preload Phaser globally");
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js";
  script.async = false; // Make sure it loads synchronously
  script.onload = () => {
    // @ts-ignore
    console.log("✅ Phaser preloaded successfully:", window.Phaser?.VERSION);
  };
  script.onerror = (e) => {
    console.error("❌ Failed to preload Phaser:", e);
  };
  document.head.appendChild(script);
}

console.log("🔍 DOM ready state:", document.readyState);

// Start React application
try {
  console.log("🚀 Starting React application");
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found!");
  }
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  console.log("✅ React application mounted");
} catch (error) {
  console.error("💥 Failed to start React application:", error);
  // Show a fallback UI
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; color: #ff3b3b; background: #030303; font-family: sans-serif;">
        <h1>Application Error</h1>
        <p>There was a problem starting the application. Please check the console for details.</p>
        <pre style="background: #121212; padding: 10px; overflow: auto;">${error}</pre>
        <button onclick="window.location.reload()" style="padding: 10px; background: #ff3b3b; color: white; border: none; cursor: pointer;">
          Reload Application
        </button>
      </div>
    `;
  }
}
