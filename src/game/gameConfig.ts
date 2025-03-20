import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { WorldScene } from './scenes/WorldScene';
import { GameOverScene } from './scenes/GameOverScene';
import { MainMenuScene as PhaserMainMenuScene } from './scenes/MainMenuScene';
import { MainScene } from './engine/MainScene';
import { eventBus, GameEvents } from './engine/core/gameEvents';

// Get container dimensions with fallbacks
const getContainerDimensions = () => {
  const container = document.getElementById('game-container');
  
  if (container) {
    const width = container.clientWidth || 1280;
    const height = container.clientHeight || 720;
    
    // If dimensions are very small, use fallbacks
    if (width < 100 || height < 100) {
      console.warn(`Container has suspiciously small dimensions: ${width}x${height}, using fallbacks`);
      return { width: 1280, height: 720 };
    }
    
    return { width, height };
  }
  
  console.warn('No container found for game, using default dimensions');
  return { width: 1280, height: 720 }; // Default fallback
};

/**
 * Creates the Phaser game with proper configuration
 */
export const createGame = (): Phaser.Game => {
  console.log('Creating game with proper configuration');
  
  // Get current container dimensions
  const dimensions = getContainerDimensions();
  console.log('Container dimensions for game config:', dimensions);
  
  // Ensure parent element exists before creating game
  const parentElement = document.getElementById('game-container');
  if (!parentElement) {
    console.warn('Parent element not found, delaying game creation');
    
    // Create a temporary container if needed
    const tempContainer = document.createElement('div');
    tempContainer.id = 'game-container-temp';
    tempContainer.style.width = `${dimensions.width}px`;
    tempContainer.style.height = `${dimensions.height}px`;
    tempContainer.style.display = 'none';
    document.body.appendChild(tempContainer);
  }
  
  // Create and return the game
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: dimensions.width,
    height: dimensions.height,
    parent: parentElement ? 'game-container' : 'game-container-temp',
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
      GameOverScene,
      MainScene
    ],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
      pixelArt: false,
      antialias: true
    },
    callbacks: {
      postBoot: (g) => {
        // When game boots, move it to the correct container if that was created later
        setTimeout(() => {
          const realContainer = document.getElementById('game-container');
          const tempContainer = document.getElementById('game-container-temp');
          
          if (tempContainer && realContainer && g.canvas) {
            console.log('Moving game canvas to real container');
            realContainer.appendChild(g.canvas);
            document.body.removeChild(tempContainer);
          }
        }, 100);
      }
    }
  });
  
  console.log('Game created with configuration:', game.config);
  
  // Set up resize handling to adjust game canvas when window size changes
  window.addEventListener('resize', () => {
    try {
      if (game && !game.isBooted) return;
      
      const dimensions = getContainerDimensions();
      game.scale.resize(dimensions.width, dimensions.height);
      console.log('Game resized to:', dimensions);
    } catch (error) {
      console.error('Error resizing game:', error);
    }
  });
  
  return game;
};

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
    GameOverScene,
    MainScene
  ],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    pixelArt: false,
    antialias: true
  }
}; 