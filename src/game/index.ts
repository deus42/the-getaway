import { createGame } from './gameConfig';
import { eventBus, GameEvents } from './engine/core/gameEvents';

let game: Phaser.Game | null = null;
let initializationInProgress = false;
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 5;

/**
 * Checks if the container element exists and has dimensions
 * @param containerId The ID of the container element
 * @returns The container element or null if not found/ready
 */
const getGameContainer = (containerId = 'game-container'): HTMLElement | null => {
  // Get the container element
  let container = document.getElementById(containerId);
  
  // If no container is found, try to create one as a fallback
  if (!container) {
    console.warn(`Container element with ID "${containerId}" not found, creating fallback`);
    
    // Create fallback container
    container = document.createElement('div');
    container.id = containerId;
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.minHeight = '500px';
    
    // Find a suitable parent
    const parent = document.querySelector('main') || document.body;
    parent.appendChild(container);
    
    console.log(`Created fallback container with ID "${containerId}"`);
  }
  
  // Check if container has dimensions
  if (container.clientWidth === 0 || container.clientHeight === 0) {
    console.warn(`Container element has zero dimensions: ${container.clientWidth}x${container.clientHeight}`);
    
    // Try to set dimensions
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.minHeight = '500px';
    
    // Force layout recalculation
    void container.offsetWidth;
    
    // Check again after setting dimensions
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      console.error('Container still has zero dimensions after attempting to set them');
      
      // Set explicit pixel dimensions as last resort
      container.style.width = '1280px';
      container.style.height = '720px';
      void container.offsetWidth;
      
      // If still zero dimensions, we'll consider this a non-fatal issue
      // and let the game creation handle it with default dimensions
      if (container.clientWidth === 0 || container.clientHeight === 0) {
        console.warn('Using default dimensions as fallback');
      }
    }
  }
  
  console.log(`Container ready with dimensions: ${container.clientWidth}x${container.clientHeight}`);
  return container;
};

/**
 * Initialize the Phaser game instance
 * @returns The created Phaser.Game instance
 * @throws Error if initialization fails
 */
export const initGame = (): Phaser.Game => {
  // Track initialization attempts
  initAttempts++;
  console.log(`Game initialization attempt ${initAttempts}/${MAX_INIT_ATTEMPTS}`);
  
  // If too many attempts, throw an error
  if (initAttempts > MAX_INIT_ATTEMPTS) {
    const error = new Error(`Max initialization attempts (${MAX_INIT_ATTEMPTS}) exceeded`);
    eventBus.publish('game:error', error.message);
    throw error;
  }

  // If already initializing, prevent duplicate initialization
  if (initializationInProgress) {
    console.log('Game initialization already in progress, waiting...');
    throw new Error('Game initialization already in progress, please wait');
  }
  
  // If a game instance already exists, return it
  if (game) {
    console.log('Using existing game instance');
    
    // Check if the game has been destroyed or is in an invalid state
    try {
      if (!game.isRunning) {
        console.warn('Existing game instance is not running, creating a new one');
        game = null; // Clear the reference to create a new game
      } else {
        // Ensure it's assigned to window for backward compatibility
        window.game = game;
        
        // Publish event
        eventBus.publish(GameEvents.GAME_INITIALIZED, game);
        
        return game;
      }
    } catch (error) {
      console.error('Error checking game state, creating a new instance:', error);
      game = null; // Clear the reference to create a new game
    }
  }
  
  console.log('Creating new Phaser game instance...');
  initializationInProgress = true;
  
  try {
    // Check if Phaser is available globally
    if (typeof window.Phaser === 'undefined') {
      initializationInProgress = false;
      // Don't reset attempts here, we want to track all attempts
      const error = new Error('Phaser is not available globally');
      eventBus.publish('game:error', error.message);
      throw error;
    }
    
    // Verify Phaser version
    console.log('Phaser version:', window.Phaser.VERSION);
    
    // Get the game container with validation
    const container = getGameContainer();
    if (!container) {
      initializationInProgress = false;
      const error = new Error('Game container not found or not ready');
      eventBus.publish('game:error', error.message);
      
      // Retry after a delay instead of throwing
      setTimeout(() => {
        try {
          console.log('Retrying game initialization after container check failed');
          initGame();
        } catch (e) {
          console.error('Retry failed after container check:', e);
        }
      }, 500);
      
      return null as any; // Typescript needs a return value
    }
    
    // Debug info
    console.log('Window dimensions:', window.innerWidth, window.innerHeight);
    console.log('Document ready state:', document.readyState);
    
    // Create the game with a try-catch block
    try {
      // Clear any previous game instance and event listeners
      if (window.game) {
        try {
          window.game.destroy(true);
          window.game = undefined;
        } catch (destroyError) {
          console.warn('Error destroying previous game instance:', destroyError);
        }
      }
      
      // Create the game with explicit container dimensions
      game = createGame();
      console.log('Game created successfully');
    } catch (gameCreateError) {
      console.error('Error in Phaser.Game constructor:', gameCreateError);
      
      // Try with an alternative configuration
      try {
        console.log('Attempting with alternative game configuration...');
        game = new window.Phaser.Game({
          type: Phaser.AUTO,
          width: container.clientWidth || 800,
          height: container.clientHeight || 600,
          parent: 'game-container',
          backgroundColor: '#020202',
          // Minimal configuration for recovery
          scene: {
            create: function() {
              console.log('Alternative game scene created');
              this.events.once('shutdown', () => {
                console.log('Alternative scene shutting down');
              });
              this.add.text(100, 100, 'Game is recovering...', { color: '#ffffff' });
              
              // Let the game context know initialization completed even with fallback
              eventBus.publish(GameEvents.GAME_INITIALIZED, game);
              
              // Try to transition to the boot scene after a delay
              setTimeout(() => {
                try {
                  if (this.scene.get('BootScene')) {
                    this.scene.start('BootScene');
                  } else {
                    console.error('BootScene not found in alternative config');
                  }
                } catch (startError) {
                  console.error('Error starting BootScene from alternative scene:', startError);
                }
              }, 1000);
            }
          }
        });
        console.log('Alternative game configuration successful');
      } catch (alternativeError) {
        console.error('Alternative game configuration also failed:', alternativeError);
        initializationInProgress = false;
        
        // Retry after a delay instead of immediately failing
        setTimeout(() => {
          try {
            console.log('Retrying game initialization after both configurations failed');
            initGame();
          } catch (e) {
            console.error('Retry failed after both configurations failed:', e);
            throw gameCreateError; // Finally throw the original error if all retries fail
          }
        }, 1000);
        
        return null as any; // Typescript needs a return value
      }
    }
    
    // Make the game instance available globally for backward compatibility
    window.game = game;
    
    // Set a timeout to ensure the game has time to fully initialize before emitting the event
    setTimeout(() => {
      initializationInProgress = false;
      // Only reset attempts on success
      initAttempts = 0;
      console.log('Game initialization complete, emitting initialized event');
      eventBus.publish(GameEvents.GAME_INITIALIZED, game);
    }, 100);
    
    return game;
  } catch (error) {
    console.error('Error initializing game:', error);
    initializationInProgress = false;
    
    // Publish error event
    if (error instanceof Error) {
      eventBus.publish('game:error', error.message);
    } else {
      eventBus.publish('game:error', 'Unknown game initialization error');
    }
    
    // If we still have attempts left, try again after a delay
    if (initAttempts <= MAX_INIT_ATTEMPTS) {
      setTimeout(() => {
        try {
          console.log(`Retrying game initialization (attempt ${initAttempts+1}/${MAX_INIT_ATTEMPTS})`);
          initGame();
        } catch (e) {
          console.error('Retry failed:', e);
        }
      }, 1000);
      
      return null as any; // Typescript needs a return value
    }
    
    throw error;
  }
};

/**
 * Destroy the Phaser game instance
 */
export const destroyGame = (): void => {
  if (game) {
    console.log('Destroying game instance');
    
    // Publish event before destruction
    eventBus.publish(GameEvents.GAME_DESTROYED);
    
    try {
      game.destroy(true);
    } catch (error) {
      console.error('Error while destroying game:', error);
    }
    
    game = null;
    initializationInProgress = false;
    initAttempts = 0; // Reset attempts on destroy
    
    // Clean up global reference
    window.game = undefined;
  }
}; 