/**
 * Base Component class for the Entity Component System
 * Components are pure data containers
 */

import { Entity } from './Entity';

export abstract class Component {
  // Reference to the entity this component is attached to
  entity?: Entity;
  
  // Flag to track if this component is active/enabled
  enabled: boolean = true;
  
  constructor() {}
  
  /**
   * Called when the component is added to an entity
   * Override in derived classes for initialization logic
   */
  onAttached(): void {}
  
  /**
   * Called when the component is removed from an entity
   * Override in derived classes for cleanup logic
   */
  onDetached(): void {}
  
  /**
   * Enable or disable this component
   * @param enabled Whether the component should be enabled
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * Clone this component to create a copy
   * Each derived component should implement this method
   */
  abstract clone(): Component;
}; 