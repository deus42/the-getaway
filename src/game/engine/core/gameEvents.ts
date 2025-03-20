/**
 * Game Event Bus for communication between Phaser and React components
 * Implements a pub/sub pattern for decoupled communication
 */

type EventCallback = (...args: any[]) => void;

class GameEventBus {
  private listeners: Record<string, EventCallback[]> = {};

  /**
   * Subscribe to an event
   * @param event The event name to subscribe to
   * @param callback Function to call when event is published
   * @returns Unsubscribe function
   */
  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    
    this.listeners[event].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  /**
   * Publish an event with optional arguments
   * @param event The event name to publish
   * @param args Arguments to pass to subscribers
   */
  publish(event: string, ...args: any[]): void {
    if (!this.listeners[event]) return;
    
    this.listeners[event].forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event listener for "${event}":`, error);
      }
    });
  }

  /**
   * Check if an event has any subscribers
   * @param event Event name to check
   * @returns Whether the event has subscribers
   */
  hasSubscribers(event: string): boolean {
    return !!this.listeners[event] && this.listeners[event].length > 0;
  }

  /**
   * Remove all subscribers for an event
   * @param event Event name to clear
   */
  clearEvent(event: string): void {
    delete this.listeners[event];
  }

  /**
   * Remove all subscribers for all events
   */
  clearAllEvents(): void {
    this.listeners = {};
  }
}

// Create a singleton instance
export const eventBus = new GameEventBus();

// Define common event names as constants to avoid typos
export const GameEvents = {
  GAME_INITIALIZED: 'game:initialized',
  GAME_DESTROYED: 'game:destroyed',
  SCENE_CHANGED: 'scene:changed',
  COMBAT_STARTED: 'combat:started',
  COMBAT_ENDED: 'combat:ended',
  PLAYER_DAMAGED: 'player:damaged',
  PLAYER_LEVEL_UP: 'player:levelUp',
  QUEST_UPDATED: 'quest:updated',
  INVENTORY_CHANGED: 'inventory:changed',
  DIALOG_STARTED: 'dialog:started',
  DIALOG_ENDED: 'dialog:ended',
  WORLD_STATE_CHANGED: 'world:stateChanged',
  FACTION_REP_CHANGED: 'faction:reputationChanged',
}; 