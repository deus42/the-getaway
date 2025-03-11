import { createGame } from './gameConfig';

let game: Phaser.Game | null = null;

/**
 * Initialize the Phaser game instance
 * @returns The created Phaser.Game instance
 * @throws Error if initialization fails
 */
export const initGame = (): Phaser.Game => {
  // If a game instance already exists, return it
  if (game) {
    console.log('Using existing game instance');
    return game;
  }
  
  console.log('Creating new Phaser game instance...');
  
  try {
    // Check if Phaser is available globally
    if (typeof window.Phaser === 'undefined') {
      throw new Error('Phaser is not available globally');
    }
    
    // Get the game container
    const container = document.getElementById('game-container');
    if (!container) {
      throw new Error('Game container not found');
    }
    
    console.log('Game container found with dimensions:', {
      width: container.clientWidth,
      height: container.clientHeight
    });
    
    // Create the game
    game = createGame();
    console.log('Game created successfully:', game);
    
    return game;
  } catch (error) {
    console.error('Error initializing game:', error);
    throw error;
  }
};

/**
 * Destroy the Phaser game instance
 */
export const destroyGame = (): void => {
  if (game) {
    console.log('Destroying game instance');
    game.destroy(true);
    game = null;
  }
}; 