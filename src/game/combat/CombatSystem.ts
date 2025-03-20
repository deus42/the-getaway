/**
 * CombatSystem handles turn-based grid combat with Action Points
 */

import { eventBus, GameEvents } from '../engine/core/gameEvents';
import { Entity } from '../engine/core/ecs';
import { Vector2 } from '../engine/core/types/Vector2';

// Grid cell type
export interface GridCell {
  x: number;
  y: number;
  type: CellType;
  cover?: CoverType;
  coverDirection?: number; // Direction the cover faces (in radians)
  entityId?: string; // ID of entity occupying this cell
  walkable: boolean;
  coverValue?: number; // How much protection this cell provides (0-1)
  movementCost: number; // Cost in AP to move into this cell
}

// Entity in combat
export interface CombatEntity {
  entity: Entity;
  position: Vector2;
  actionPoints: number;
  maxActionPoints: number;
  initiative: number; // Determines turn order
  team: number; // Team ID (0 = player, 1 = enemies, 2+ = other factions)
  isDead: boolean;
  isActive: boolean; // Whether this entity is taking its turn
}

// Type of grid cell
export enum CellType {
  FLOOR = 'floor',
  WALL = 'wall',
  DOOR = 'door',
  WINDOW = 'window',
  WATER = 'water',
  PIT = 'pit',
  STAIRS = 'stairs',
  OBSTACLE = 'obstacle'
}

// Types of cover
export enum CoverType {
  NONE = 'none',
  HALF = 'half', // Low cover
  FULL = 'full'  // Full height cover
}

// Combat action
export interface CombatAction {
  type: string;
  apCost: number;
  range: number;
  execute: (source: CombatEntity, target: Vector2 | CombatEntity) => void;
}

export class CombatSystem {
  // 2D grid of cells representing the combat area
  private grid: GridCell[][] = [];
  
  // Width and height of the grid
  private width: number = 0;
  private height: number = 0;
  
  // Entities in combat
  private entities: CombatEntity[] = [];
  
  // Current entity index in turn order
  private currentTurnIndex: number = 0;
  
  // Whether combat is active
  private isActive: boolean = false;
  
  // Current round number
  private round: number = 0;
  
  // Available actions for entities
  private actions: Map<string, CombatAction> = new Map();
  
  constructor() {
    // Register standard actions
    this.registerDefaultActions();
  }
  
  /**
   * Initialize the combat system
   */
  initialize(): void {
    console.log('CombatSystem initialized');
  }
  
  /**
   * Register default combat actions
   */
  private registerDefaultActions(): void {
    // Move action
    this.registerAction({
      type: 'move',
      apCost: 1, // Base cost per tile, adjusted by terrain
      range: 1,  // Adjacent tiles
      execute: (source, target) => {
        if (typeof target === 'object' && 'x' in target && 'y' in target) {
          // Move logic
          const sourcePos = source.position;
          const targetPos = target as Vector2;
          
          // Check if the target position is valid
          if (this.isValidMove(source, targetPos)) {
            // Clear entity from current cell
            const currentCell = this.getCell(sourcePos.x, sourcePos.y);
            if (currentCell) {
              currentCell.entityId = undefined;
            }
            
            // Move entity to target cell
            source.position = { ...targetPos };
            const targetCell = this.getCell(targetPos.x, targetPos.y);
            if (targetCell) {
              targetCell.entityId = source.entity.id;
            }
            
            // Trigger move event
            eventBus.publish(GameEvents.COMBAT_STARTED, 'entityMoved', {
              entityId: source.entity.id,
              fromX: sourcePos.x,
              fromY: sourcePos.y,
              toX: targetPos.x,
              toY: targetPos.y
            });
          }
        }
      }
    });
    
    // Melee attack action
    this.registerAction({
      type: 'meleeAttack',
      apCost: 2,
      range: 1, // Adjacent tiles only
      execute: (source, target) => {
        if (typeof target !== 'object' || !('entity' in target)) {
          // Try to find an entity at the target position
          if (typeof target === 'object' && 'x' in target && 'y' in target) {
            const targetPos = target as Vector2;
            const entityAtTarget = this.getEntityAtPosition(targetPos.x, targetPos.y);
            if (entityAtTarget) {
              // Attack the entity
              this.performAttack(source, entityAtTarget, 'melee');
            }
          }
          return;
        }
        
        // Attack the target entity
        this.performAttack(source, target as CombatEntity, 'melee');
      }
    });
    
    // Ranged attack action
    this.registerAction({
      type: 'rangedAttack',
      apCost: 3,
      range: 8, // 8 tiles
      execute: (source, target) => {
        if (typeof target !== 'object' || !('entity' in target)) {
          // Try to find an entity at the target position
          if (typeof target === 'object' && 'x' in target && 'y' in target) {
            const targetPos = target as Vector2;
            const entityAtTarget = this.getEntityAtPosition(targetPos.x, targetPos.y);
            if (entityAtTarget) {
              // Attack the entity
              this.performAttack(source, entityAtTarget, 'ranged');
            }
          }
          return;
        }
        
        // Attack the target entity
        this.performAttack(source, target as CombatEntity, 'ranged');
      }
    });
    
    // Reload action
    this.registerAction({
      type: 'reload',
      apCost: 2,
      range: 0, // Self only
      execute: (source) => {
        // Reload logic (weapon specific)
        eventBus.publish(GameEvents.COMBAT_STARTED, 'entityReloaded', {
          entityId: source.entity.id
        });
      }
    });
    
    // Overwatch action
    this.registerAction({
      type: 'overwatch',
      apCost: 2, // Costs all remaining AP in practice
      range: 0, // Self only
      execute: (source) => {
        // Overwatch logic
        // Save entity's remaining AP for reactions
        eventBus.publish(GameEvents.COMBAT_STARTED, 'entityOverwatch', {
          entityId: source.entity.id,
          ap: source.actionPoints
        });
      }
    });
  }
  
  /**
   * Register a combat action
   * @param action Combat action to register
   */
  registerAction(action: CombatAction): void {
    this.actions.set(action.type, action);
  }
  
  /**
   * Initiate combat with entities and a terrain grid
   * @param entities Entities in combat
   * @param grid Combat grid
   * @param width Grid width
   * @param height Grid height
   */
  initiateCombat(entities: Entity[], grid: GridCell[][], width: number, height: number): void {
    this.isActive = true;
    this.round = 1;
    this.width = width;
    this.height = height;
    this.grid = grid;
    
    // Set up combat entities
    this.entities = entities.map(entity => {
      // TODO: Extract position and combat stats from entity components
      // For now, use placeholder data
      return {
        entity,
        position: { x: 0, y: 0 }, // Default position
        actionPoints: 4,
        maxActionPoints: 4,
        initiative: Math.random() * 10, // Random initiative for now
        team: entity.hasTag('player') ? 0 : 1, // Team 0 for player, 1 for enemies
        isDead: false,
        isActive: false
      };
    });
    
    // Sort entities by initiative
    this.sortEntitiesByInitiative();
    
    // Start first turn
    this.currentTurnIndex = 0;
    this.startTurn(this.currentTurnIndex);
    
    // Publish combat started event
    eventBus.publish(GameEvents.COMBAT_STARTED, 'combatStarted', {
      entities: this.entities.map(e => e.entity.id),
      gridWidth: width,
      gridHeight: height
    });
  }
  
  /**
   * Sort entities by initiative for turn order
   */
  private sortEntitiesByInitiative(): void {
    this.entities.sort((a, b) => b.initiative - a.initiative);
  }
  
  /**
   * Start a turn for the entity at the given index
   * @param index Index of the entity in the turn order
   */
  startTurn(index: number): void {
    // Check if combat is active
    if (!this.isActive) return;
    
    // Check if index is valid
    if (index < 0 || index >= this.entities.length) return;
    
    const entity = this.entities[index];
    
    // Skip dead entities
    if (entity.isDead) {
      this.endTurn();
      return;
    }
    
    // Reset action points
    entity.actionPoints = entity.maxActionPoints;
    
    // Mark as active
    entity.isActive = true;
    
    // Publish turn started event
    eventBus.publish(GameEvents.COMBAT_STARTED, 'turnStarted', {
      entityId: entity.entity.id,
      team: entity.team,
      actionPoints: entity.actionPoints
    });
    
    // If this is an AI-controlled entity, schedule AI turn
    if (entity.team !== 0) {
      // In a real implementation, this would trigger AI decision making
      // For now, just schedule an automatic end turn after a delay
      setTimeout(() => {
        this.executeAITurn(entity);
      }, 1000);
    }
  }
  
  /**
   * Execute an AI turn for an entity
   * @param entity Entity taking its turn
   */
  private executeAITurn(entity: CombatEntity): void {
    // Simple AI for demo purposes - move toward player and attack if possible
    console.log(`AI turn for entity ${entity.entity.id}`);
    
    // Find player entity
    const playerEntity = this.entities.find(e => e.team === 0);
    if (!playerEntity) {
      this.endTurn();
      return;
    }
    
    // TODO: Implement actual AI logic
    // For now, just end the turn
    this.endTurn();
  }
  
  /**
   * End the current turn and move to the next entity
   */
  endTurn(): void {
    // Check if combat is active
    if (!this.isActive) return;
    
    // Get current entity
    const currentEntity = this.entities[this.currentTurnIndex];
    
    // Mark as inactive
    currentEntity.isActive = false;
    
    // Publish turn ended event
    eventBus.publish(GameEvents.COMBAT_STARTED, 'turnEnded', {
      entityId: currentEntity.entity.id
    });
    
    // Move to next entity
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.entities.length;
    
    // If we've gone through all entities, start a new round
    if (this.currentTurnIndex === 0) {
      this.round++;
      eventBus.publish(GameEvents.COMBAT_STARTED, 'roundStarted', {
        round: this.round
      });
    }
    
    // Start next turn
    this.startTurn(this.currentTurnIndex);
    
    // Check for combat end conditions
    this.checkCombatState();
  }
  
  /**
   * Execute an action for the current entity
   * @param actionType Type of action to execute
   * @param target Target position or entity
   * @returns True if the action was executed successfully
   */
  executeAction(actionType: string, target: Vector2 | CombatEntity): boolean {
    // Check if combat is active
    if (!this.isActive) return false;
    
    // Get current entity
    const currentEntity = this.entities[this.currentTurnIndex];
    
    // Check if the entity is active
    if (!currentEntity.isActive) return false;
    
    // Get the action
    const action = this.actions.get(actionType);
    if (!action) return false;
    
    // Check if the entity has enough AP
    if (currentEntity.actionPoints < action.apCost) return false;
    
    // Execute the action
    action.execute(currentEntity, target);
    
    // Deduct AP
    currentEntity.actionPoints -= action.apCost;
    
    // Publish action executed event
    eventBus.publish(GameEvents.COMBAT_STARTED, 'actionExecuted', {
      entityId: currentEntity.entity.id,
      actionType,
      remainingAP: currentEntity.actionPoints
    });
    
    // Check for combat end conditions
    this.checkCombatState();
    
    return true;
  }
  
  /**
   * Check if the current combat should end
   */
  private checkCombatState(): void {
    // Check if any team has been eliminated
    const teams = new Set<number>();
    let aliveEntities = 0;
    
    for (const entity of this.entities) {
      if (!entity.isDead) {
        teams.add(entity.team);
        aliveEntities++;
      }
    }
    
    // If only one team remains or no entities are alive, end combat
    if (teams.size <= 1 || aliveEntities === 0) {
      this.endCombat(teams.size === 1 ? Array.from(teams)[0] : -1);
    }
  }
  
  /**
   * End combat and declare a winner
   * @param winningTeam ID of the winning team (-1 for no winner)
   */
  private endCombat(winningTeam: number): void {
    // Check if combat is already inactive
    if (!this.isActive) return;
    
    this.isActive = false;
    
    // Publish combat ended event
    eventBus.publish(GameEvents.COMBAT_ENDED, 'combatEnded', {
      winningTeam,
      round: this.round
    });
    
    console.log(`Combat ended. Winning team: ${winningTeam}`);
    
    // Reset combat state
    this.entities = [];
    this.grid = [];
    this.currentTurnIndex = 0;
    this.round = 0;
  }
  
  /**
   * Get a cell at the given coordinates
   * @param x X coordinate
   * @param y Y coordinate
   * @returns The cell at the coordinates or undefined if out of bounds
   */
  private getCell(x: number, y: number): GridCell | undefined {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return undefined;
    }
    
    return this.grid[y][x];
  }
  
  /**
   * Check if a move is valid
   * @param entity Entity attempting to move
   * @param target Target position
   * @returns True if the move is valid
   */
  private isValidMove(entity: CombatEntity, target: Vector2): boolean {
    // Check if target is in bounds
    if (target.x < 0 || target.x >= this.width || target.y < 0 || target.y >= this.height) {
      return false;
    }
    
    // Check if target cell is walkable
    const targetCell = this.getCell(target.x, target.y);
    if (!targetCell || !targetCell.walkable) {
      return false;
    }
    
    // Check if target cell is occupied
    if (targetCell.entityId) {
      return false;
    }
    
    // Check if move is in range (for now, just check if it's 1 tile away)
    const dx = target.x - entity.position.x;
    const dy = target.y - entity.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 1) {
      return false;
    }
    
    // Check if entity has enough AP for the move
    if (entity.actionPoints < targetCell.movementCost) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Get the entity at a specific position
   * @param x X coordinate
   * @param y Y coordinate
   * @returns Entity at the position or undefined if none
   */
  private getEntityAtPosition(x: number, y: number): CombatEntity | undefined {
    const cell = this.getCell(x, y);
    if (!cell || !cell.entityId) {
      return undefined;
    }
    
    return this.entities.find(entity => entity.entity.id === cell.entityId);
  }
  
  /**
   * Perform an attack from one entity to another
   * @param source Attacking entity
   * @param target Target entity
   * @param attackType Type of attack (melee, ranged, etc.)
   */
  private performAttack(source: CombatEntity, target: CombatEntity, attackType: string): void {
    // In a real implementation, this would involve damage calculations, hit chance, etc.
    console.log(`Entity ${source.entity.id} attacks ${target.entity.id} with ${attackType}`);
    
    // For now, just publish the attack event
    eventBus.publish(GameEvents.COMBAT_STARTED, 'entityAttacked', {
      sourceId: source.entity.id,
      targetId: target.entity.id,
      attackType,
      damage: 1 // Placeholder
    });
  }
  
  /**
   * Get the current entity taking its turn
   * @returns The current entity or undefined if combat is inactive
   */
  getCurrentEntity(): CombatEntity | undefined {
    if (!this.isActive) return undefined;
    
    return this.entities[this.currentTurnIndex];
  }
  
  /**
   * Get all entities in combat
   * @returns Array of combat entities
   */
  getAllEntities(): CombatEntity[] {
    return [...this.entities];
  }
  
  /**
   * Get the combat grid
   * @returns 2D array of grid cells
   */
  getGrid(): GridCell[][] {
    return this.grid;
  }
  
  /**
   * Check if combat is currently active
   * @returns True if combat is active
   */
  isCombatActive(): boolean {
    return this.isActive;
  }
  
  /**
   * Get the current round number
   * @returns Current round number
   */
  getCurrentRound(): number {
    return this.round;
  }
}

// Create a singleton instance
export const combatSystem = new CombatSystem(); 