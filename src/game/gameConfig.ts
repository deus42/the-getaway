import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { WorldScene } from './scenes/WorldScene';
import { GameOverScene } from './scenes/GameOverScene';
import { MainMenuScene as PhaserMainMenuScene } from './scenes/MainMenuScene';
import { MainScene } from './engine/MainScene';

/**
 * Phaser game configuration
 */
export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#030303', // Match the background color from our theme
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: process.env.NODE_ENV === 'development'
    }
  },
  scene: [
    BootScene, 
    PhaserMainMenuScene, 
    WorldScene, 
    MainScene, 
    GameOverScene
  ],
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  fps: {
    target: 60,
    min: 30
  },
  callbacks: {
    postBoot: function(game) {
      // Apply CSS to make the game container look better
      console.log('Game post-boot callback executing');
      
      const container = document.getElementById('game-container');
      if (container) {
        container.style.boxShadow = '0 0 20px rgba(255, 59, 59, 0.2)';
        container.style.overflow = 'hidden';
      }
      
      // Add a global filter to match our dystopian UI theme
      try {
        if (game && game.canvas) {
          // Add subtle red tint filter to match theme
          const canvas = game.canvas as HTMLCanvasElement;
          canvas.style.filter = 'brightness(0.95) contrast(1.05) saturate(1.1)';
        }
      } catch (e) {
        console.warn('Could not apply canvas filter:', e);
      }
    }
  },
  // Make sure autoFocus is true to ensure keyboard input works
  autoFocus: true,
  // Disable default loader bar (we'll use our own)
  loader: {
    path: 'assets/'
  },
  // Transparent background to blend with our UI
  transparent: false,
  // Set the banner to false to avoid console spam
  banner: false
};

/**
 * Creates and returns a new Phaser game instance
 */
export const createGame = (): Phaser.Game => {
  console.log('Creating Phaser game with config:', {
    width: gameConfig.width,
    height: gameConfig.height,
    parent: gameConfig.parent,
    type: gameConfig.type
  });
  
  try {
    const game = new Phaser.Game(gameConfig);
    
    // Additional game setup after initialization
    game.events.on('ready', () => {
      console.log('Game is ready and initialized');
    });
    
    return game;
  } catch (error) {
    console.error('Error creating Phaser game instance:', error);
    throw error;
  }
}; 