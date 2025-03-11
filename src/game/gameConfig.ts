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
      debug: false // Disable physics debug rendering in all environments
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
    pixelArt: false, // Set to false for smoother graphics
    antialias: true, // Enable antialiasing for smoother edges
    roundPixels: false // Disable pixel rounding for smoother movement
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
    postBoot: (game) => {
      // Add shadow and other effects to the game container
      const container = document.getElementById('game-container');
      if (container) {
        container.style.boxShadow = '0 0 20px rgba(255, 59, 59, 0.3)';
        container.style.borderRadius = '4px';
      }
      
      // Apply a slight red tint filter to the canvas for dystopian feel
      const canvas = document.querySelector('#game-container canvas');
      if (canvas instanceof HTMLElement) {
        canvas.style.filter = 'brightness(1.05) contrast(1.1) saturate(1.2) sepia(0.1)';
      }
    }
  },
  // Disable default banner
  banner: false,
  // Ensure focus for keyboard controls
  autoFocus: true,
  // Disable loader bar for custom loading screen
  loader: {
    path: 'assets/images/'
  },
  // Transparent background to blend with our UI
  transparent: false
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