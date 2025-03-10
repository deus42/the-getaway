import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { WorldScene } from './scenes/WorldScene';
import { GameOverScene } from './scenes/GameOverScene';
import { MainMenuScene } from './scenes/MainMenuScene';

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
      debug: false
    }
  },
  scene: [BootScene, MainMenuScene, WorldScene, GameOverScene],
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
    postBoot: function() {
      // Apply CSS to make the game container look better
      const container = document.getElementById('game-container');
      if (container) {
        container.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
        container.style.borderRadius = '8px';
        container.style.overflow = 'hidden';
        
        // Create a stylish background behind the game
        document.body.style.backgroundColor = '#1a1a2e';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.height = '100vh';
        document.body.style.display = 'flex';
        document.body.style.justifyContent = 'center';
        document.body.style.alignItems = 'center';
      }
    }
  }
};

export const createGame = (): Phaser.Game => {
  return new Phaser.Game(gameConfig);
}; 