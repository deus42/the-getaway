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
  backgroundColor: '#121212',
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
    autoCenter: Phaser.Scale.CENTER_BOTH
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
        container.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
        container.style.borderRadius = '8px';
        container.style.overflow = 'hidden';
      }
    }
  },
  // Make sure autoFocus is true to ensure keyboard input works
  autoFocus: true
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
    return game;
  } catch (error) {
    console.error('Error creating Phaser game instance:', error);
    throw error;
  }
}; 