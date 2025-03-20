/**
 * World class that manages all entities and systems in the ECS
 */

import { Entity } from './Entity';
import { System } from './System';
import { eventBus, GameEvents } from '../gameEvents';

export class World {
  // Collection of all entities in the world
  private entities: Map<string, Entity> = new Map();
  
  // Collection of all systems in the world
  private systems: System[] = [];
  
  // Entities added this frame, will be processed at the end of update
  private entitiesToAdd: Entity[] = [];
  
  // Entity IDs to remove this frame, will be processed at the end of update
  private entitiesToRemove: string[] = [];
  
  // Whether the world is currently updating
  private updating: boolean = false;
  
  constructor() {}
  
  /**
   * Add an entity to the world
   * @param entity Entity to add
   * @returns The entity that was added
   */
  addEntity(entity: Entity): Entity {
    if (this.updating) {
      // If currently updating, queue entity for addition
      this.entitiesToAdd.push(entity);
    } else {
      // Otherwise add immediately
      this.entities.set(entity.id, entity);
      eventBus.publish(GameEvents.WORLD_STATE_CHANGED, 'entityAdded', entity.id);
    }
    return entity;
  }
  
  /**
   * Get an entity by its ID
   * @param id Entity ID to get
   * @returns The entity or undefined if not found
   */
  getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }
  
  /**
   * Remove an entity from the world
   * @param entityId ID of entity to remove
   * @returns True if the entity was found and scheduled for removal
   */
  removeEntity(entityId: string): boolean {
    if (!this.entities.has(entityId)) {
      return false;
    }
    
    if (this.updating) {
      // If currently updating, queue entity for removal
      this.entitiesToRemove.push(entityId);
    } else {
      // Otherwise remove immediately
      this.entities.delete(entityId);
      eventBus.publish(GameEvents.WORLD_STATE_CHANGED, 'entityRemoved', entityId);
    }
    return true;
  }
  
  /**
   * Add a system to the world
   * @param system System to add
   */
  addSystem(system: System): void {
    this.systems.push(system);
    
    // Sort systems by priority
    this.systems.sort((a, b) => a.priority - b.priority);
    
    // Initialize the system
    system.initialize();
  }
  
  /**
   * Remove a system from the world
   * @param systemType Type of system to remove
   * @returns True if the system was found and removed
   */
  removeSystem<T extends System>(systemType: new (...args: any[]) => T): boolean {
    const index = this.systems.findIndex(system => system instanceof systemType);
    if (index === -1) {
      return false;
    }
    
    // Call cleanup on the system before removing
    this.systems[index].cleanup();
    
    // Remove the system
    this.systems.splice(index, 1);
    return true;
  }
  
  /**
   * Get a system by its type
   * @param systemType Type of system to get
   * @returns The system or undefined if not found
   */
  getSystem<T extends System>(systemType: new (...args: any[]) => T): T | undefined {
    return this.systems.find(system => system instanceof systemType) as T | undefined;
  }
  
  /**
   * Update all systems in the world
   * @param deltaTime Time elapsed since last update in seconds
   */
  update(deltaTime: number): void {
    this.updating = true;
    
    // Get a snapshot of the current entities
    const currentEntities = Array.from(this.entities.values());
    
    // Update each enabled system
    for (const system of this.systems) {
      if (system.enabled) {
        system.update(currentEntities, deltaTime);
      }
    }
    
    this.updating = false;
    
    // Process any entities that were queued for addition during the update
    for (const entity of this.entitiesToAdd) {
      this.entities.set(entity.id, entity);
      eventBus.publish(GameEvents.WORLD_STATE_CHANGED, 'entityAdded', entity.id);
    }
    this.entitiesToAdd = [];
    
    // Process any entities that were queued for removal during the update
    for (const entityId of this.entitiesToRemove) {
      this.entities.delete(entityId);
      eventBus.publish(GameEvents.WORLD_STATE_CHANGED, 'entityRemoved', entityId);
    }
    this.entitiesToRemove = [];
  }
  
  /**
   * Find entities that match a predicate
   * @param predicate Function that returns true for entities to include
   * @returns Array of matching entities
   */
  findEntities(predicate: (entity: Entity) => boolean): Entity[] {
    return Array.from(this.entities.values()).filter(predicate);
  }
  
  /**
   * Find entities that have all of the specified component types
   * @param componentTypes Component types that entities must have
   * @returns Array of matching entities
   */
  findEntitiesWithComponents(...componentTypes: (new (...args: any[]) => any)[]): Entity[] {
    return Array.from(this.entities.values()).filter(entity => {
      return componentTypes.every(type => entity.hasComponent(type));
    });
  }
  
  /**
   * Find entities with a specific tag
   * @param tag Tag to search for
   * @returns Array of entities with the tag
   */
  findEntitiesWithTag(tag: string): Entity[] {
    return Array.from(this.entities.values()).filter(entity => entity.hasTag(tag));
  }
  
  /**
   * Get all entities in the world
   * @returns Array of all entities
   */
  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }
  
  /**
   * Get the count of entities in the world
   * @returns Number of entities
   */
  getEntityCount(): number {
    return this.entities.size;
  }
  
  /**
   * Clear all entities from the world
   */
  clearEntities(): void {
    this.entities.clear();
    this.entitiesToAdd = [];
    this.entitiesToRemove = [];
    eventBus.publish(GameEvents.WORLD_STATE_CHANGED, 'entitiesCleared');
  }
}; 