/**
 * Type definitions for Phaser global access
 */

interface Window {
  Phaser: typeof import('phaser');
  WEBGL_RENDERER: boolean;
  CANVAS_RENDERER: boolean;
}

declare const Phaser: typeof import('phaser'); 