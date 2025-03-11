/**
 * Ensures that required Phaser globals are defined when running in our environment
 */

export function ensurePhaserGlobals(): void {
  console.log("🔧 Checking and ensuring Phaser globals...");
  
  // Ensure WEBGL_RENDERER and CANVAS_RENDERER are defined globally
  // These are constants Phaser expects to be in the global scope
  if (typeof window !== 'undefined') {
    // @ts-expect-error -- adding global Phaser variables
    if (typeof window.WEBGL_RENDERER === 'undefined') {
      console.log("Adding missing WEBGL_RENDERER global");
      // @ts-expect-error -- adding global Phaser variables
      window.WEBGL_RENDERER = true;
    }
    
    // @ts-expect-error -- adding global Phaser variables
    if (typeof window.CANVAS_RENDERER === 'undefined') {
      console.log("Adding missing CANVAS_RENDERER global");
      // @ts-expect-error -- adding global Phaser variables
      window.CANVAS_RENDERER = true;
    }
    
    // Make sure Phaser global namespace exists
    // @ts-expect-error -- adding global Phaser variables
    if (typeof window.Phaser === 'undefined') {
      console.error("❌ Phaser global is missing completely!");
    } else {
      // @ts-expect-error -- checking global Phaser variables
      console.log("✅ Phaser global exists:", window.Phaser.VERSION);
    }
  }
  
  console.log("🔧 Phaser globals check complete");
} 