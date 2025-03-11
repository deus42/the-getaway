/**
 * Utility to check if Phaser is properly loaded and available in the application
 */

export interface PhaserCheckResult {
  isPhaserAvailable: boolean;
  version?: string;
  isWebGLAvailable: boolean;
  isCanvasAvailable: boolean;
  error?: string;
}

export function checkPhaserAvailability(): PhaserCheckResult {
  const result: PhaserCheckResult = {
    isPhaserAvailable: false,
    isWebGLAvailable: false,
    isCanvasAvailable: false
  };
  
  try {
    // Check if Phaser is loaded
    // @ts-ignore
    if (window.Phaser) {
      result.isPhaserAvailable = true;
      // @ts-ignore
      result.version = window.Phaser.VERSION;
    }
    
    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      result.isWebGLAvailable = !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      result.isWebGLAvailable = false;
    }
    
    // Check Canvas support
    try {
      const canvas = document.createElement('canvas');
      result.isCanvasAvailable = !!(canvas.getContext('2d'));
    } catch (e) {
      result.isCanvasAvailable = false;
    }
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
  }
  
  return result;
}

export function logPhaserInfo(): void {
  const phaserStatus = checkPhaserAvailability();
  
  console.log('=== PHASER STATUS ===');
  console.log('Phaser available:', phaserStatus.isPhaserAvailable);
  if (phaserStatus.isPhaserAvailable) {
    console.log('Phaser version:', phaserStatus.version);
  }
  console.log('WebGL support:', phaserStatus.isWebGLAvailable);
  console.log('Canvas support:', phaserStatus.isCanvasAvailable);
  
  if (phaserStatus.error) {
    console.error('Error checking Phaser:', phaserStatus.error);
  }
  console.log('=== END PHASER STATUS ===');
  
  // Also check for modules required by Phaser
  try {
    console.log('=== MODULE STATUS ===');
    // @ts-ignore
    console.log('window.WEBGL_RENDERER:', typeof window.WEBGL_RENDERER !== 'undefined');
    // @ts-ignore
    console.log('window.CANVAS_RENDERER:', typeof window.CANVAS_RENDERER !== 'undefined');
    console.log('=== END MODULE STATUS ===');
  } catch (e) {
    console.error('Error checking modules:', e);
  }
}

/**
 * Logs details about script loading on the page
 */
export function logScriptStatus(): void {
  console.log('=== SCRIPT STATUS ===');
  
  // Check all <script> tags on the page
  const scripts = document.getElementsByTagName('script');
  console.log(`Found ${scripts.length} script tags on page:`);
  
  Array.from(scripts).forEach((script, index) => {
    console.log(`[${index}] src: ${script.src || '(inline)'}, type: ${script.type || 'default'}`);
  });
  
  // Check for any possible conflicts or errors
  console.log('Checking for possible script errors:');
  const errors = (window as any).__errors || [];
  if (errors.length > 0) {
    console.error('Found script errors:', errors);
  } else {
    console.log('No script errors found in global error tracker');
  }
  
  console.log('=== END SCRIPT STATUS ===');
} 