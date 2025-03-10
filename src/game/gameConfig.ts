import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { WorldScene } from './scenes/WorldScene';
import { GameOverScene } from './scenes/GameOverScene';
import { MainMenuScene } from './scenes/MainMenuScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: 'game-container',
  backgroundColor: '#000000',
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
    antialias: false
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

export const createGame = (): Phaser.Game => {
  return new Phaser.Game(gameConfig);
}; 