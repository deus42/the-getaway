/**
 * Base System class for the Entity Component System
 * Systems process entities that have specific sets of components
 */

import { Entity } from './Entity';
import { Component } from './Component';

export abstract class System {
  // Priority of this system (lower numbers run first)
  priority: number = 0;
  
  // Whether this system is enabled
  enabled: boolean = true;
  
  constructor(priority: number = 0) {
    this.priority = priority;
  }
  
  /**
   * Update method called each frame for this system
   * @param entities All entities in the world
   * @param deltaTime Time elapsed since last update in seconds
   */
  abstract update(entities: Entity[], deltaTime: number): void;
  
  /**
   * Filter entities to only those that this system should process
   * @param entities All entities in the world
   * @returns Filtered entities that match this system's requirements
   */
  protected filterEntities(entities: Entity[]): Entity[] {
    return entities.filter(entity => this.canProcessEntity(entity));
  }
  
  /**
   * Check if this system can process a specific entity
   * @param entity Entity to check
   * @returns True if this system can process the entity
   */
  protected abstract canProcessEntity(entity: Entity): boolean;
  
  /**
   * Enable or disable this system
   * @param enabled Whether the system should be enabled
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * Initialize the system
   * Called once when the system is added to the world
   */
  initialize(): void {}
  
  /**
   * Cleanup the system
   * Called when the system is removed from the world
   */
  cleanup(): void {}
}; 