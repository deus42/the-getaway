/**
 * Base Entity class for the Entity Component System
 * An entity is a container for components
 */

import { Component } from './Component';
import { v4 as uuidv4 } from 'uuid'; // We'll need to add this dependency

export class Entity {
  // Unique ID for this entity
  readonly id: string;
  
  // Map of component type names to component instances
  private components: Map<string, Component> = new Map();
  
  // Optional reference to the associated Phaser game object
  gameObject?: Phaser.GameObjects.GameObject;
  
  // Optional tag for quick categorization
  tags: Set<string> = new Set();

  constructor(id?: string) {
    this.id = id || uuidv4();
  }

  /**
   * Add a component to this entity
   * @param component Component instance to add
   * @returns This entity for chaining
   */
  addComponent<T extends Component>(component: T): Entity {
    const componentName = component.constructor.name;
    this.components.set(componentName, component);
    component.entity = this;
    return this;
  }

  /**
   * Get a component by its type
   * @param componentType Component class to get
   * @returns The component instance or undefined if not found
   */
  getComponent<T extends Component>(componentType: new (...args: any[]) => T): T | undefined {
    return this.components.get(componentType.name) as T | undefined;
  }

  /**
   * Check if this entity has a component
   * @param componentType Component class to check for
   * @returns True if the entity has the component
   */
  hasComponent<T extends Component>(componentType: new (...args: any[]) => T): boolean {
    return this.components.has(componentType.name);
  }

  /**
   * Remove a component from this entity
   * @param componentType Component class to remove
   * @returns True if the component was removed
   */
  removeComponent<T extends Component>(componentType: new (...args: any[]) => T): boolean {
    const componentName = componentType.name;
    if (this.components.has(componentName)) {
      // Clear the entity reference before removing
      const component = this.components.get(componentName);
      if (component) {
        component.entity = undefined;
      }
      this.components.delete(componentName);
      return true;
    }
    return false;
  }

  /**
   * Get all components on this entity
   * @returns Array of all components
   */
  getAllComponents(): Component[] {
    return Array.from(this.components.values());
  }

  /**
   * Add a tag to this entity
   * @param tag Tag to add
   */
  addTag(tag: string): void {
    this.tags.add(tag);
  }

  /**
   * Check if this entity has a tag
   * @param tag Tag to check for
   * @returns True if the entity has the tag
   */
  hasTag(tag: string): boolean {
    return this.tags.has(tag);
  }

  /**
   * Remove a tag from this entity
   * @param tag Tag to remove
   */
  removeTag(tag: string): void {
    this.tags.delete(tag);
  }
}; 