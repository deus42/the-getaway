/**
 * Global TypeScript definitions
 */

import Phaser from 'phaser';

declare global {
  interface Window {
    Phaser: typeof Phaser;
    game?: Phaser.Game;
  }

  // Add the __pixiId property to HTMLElement for Phaser compatibility
  interface HTMLElement {
    __pixiId?: string;
  }
}

// This export is needed to make this a module
export {}; 