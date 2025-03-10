import Phaser from 'phaser';
import { InputHandler } from './InputHandler';

/**
 * Manages movement for game entities
 */
export class MovementController {
  private entity: Phaser.Physics.Arcade.Sprite;
  private input: InputHandler;
  private baseSpeed: number;
  private sprintModifier: number = 1.7;
  private staminaCost: number = 0.5;
  private enabled: boolean = true;
  
  // Stamina management
  private stamina: number = 100;
  private maxStamina: number = 100;
  private staminaRegenRate: number = 0.2;
  
  // Callbacks
  public onStaminaChange: ((current: number, max: number) => void) | null = null;
  
  /**
   * Creates a new movement controller
   * @param entity Entity to control
   * @param input Input handler for movement controls
   * @param baseSpeed Base movement speed
   * @param sprintModifier Multiplier for sprint speed
   */
  constructor(
    entity: Phaser.Physics.Arcade.Sprite, 
    input: InputHandler, 
    baseSpeed: number = 200,
    sprintModifier: number = 1.7
  ) {
    this.entity = entity;
    this.input = input;
    this.baseSpeed = baseSpeed;
    this.sprintModifier = sprintModifier;
  }
  
  /**
   * Update method to be called each frame
   * @param delta Time since last frame
   */
  public update(delta: number): void {
    if (!this.enabled) {
      this.entity.setVelocity(0, 0);
      return;
    }
    
    // Reset velocity
    this.entity.setVelocity(0, 0);
    
    // Handle sprinting and stamina
    const isSprinting = this.input.isSprinting() && this.stamina > 0;
    const currentSpeed = isSprinting ? this.baseSpeed * this.sprintModifier : this.baseSpeed;
    
    // Update stamina
    if (isSprinting) {
      this.updateStamina(-this.staminaCost);
    } else {
      this.updateStamina(this.staminaRegenRate);
    }
    
    // Apply movement based on input
    const horizontalInput = this.input.getHorizontalInput();
    const verticalInput = this.input.getVerticalInput();
    
    if (horizontalInput !== 0 || verticalInput !== 0) {
      // Apply velocity
      this.entity.setVelocityX(horizontalInput * currentSpeed);
      this.entity.setVelocityY(verticalInput * currentSpeed);
      
      // Handle sprite flipping based on direction
      if (horizontalInput < 0) {
        this.entity.setFlipX(true);
      } else if (horizontalInput > 0) {
        this.entity.setFlipX(false);
      }
      
      // Normalize diagonal movement
      if (horizontalInput !== 0 && verticalInput !== 0) {
        if (this.entity.body) {
          this.entity.body.velocity.normalize().scale(currentSpeed);
        }
      }
    }
  }
  
  /**
   * Update stamina value
   * @param amount Amount to change (positive to add, negative to subtract)
   */
  private updateStamina(amount: number): void {
    this.stamina = Math.max(0, Math.min(this.maxStamina, this.stamina + amount));
    
    if (this.onStaminaChange) {
      this.onStaminaChange(this.stamina, this.maxStamina);
    }
  }
  
  /**
   * Move entity toward a target position - useful for turn-based grid movement
   * @param targetX Target X position
   * @param targetY Target Y position
   * @param speed Movement speed
   * @param onComplete Callback when movement completes
   */
  public moveToPosition(
    targetX: number, 
    targetY: number, 
    speed: number = this.baseSpeed,
    onComplete?: () => void
  ): void {
    if (!this.enabled) return;
    
    const distance = Phaser.Math.Distance.Between(
      this.entity.x, 
      this.entity.y, 
      targetX, 
      targetY
    );
    
    const duration = distance / speed * 1000; // Convert to milliseconds
    
    this.entity.scene.tweens.add({
      targets: this.entity,
      x: targetX,
      y: targetY,
      duration: duration,
      ease: 'Linear',
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });
  }
  
  /**
   * Move entity a number of grid cells
   * @param deltaX X cells to move
   * @param deltaY Y cells to move
   * @param gridSize Size of each grid cell
   * @param speed Movement speed
   * @param onComplete Callback when movement completes
   */
  public moveByGrid(
    deltaX: number, 
    deltaY: number, 
    gridSize: number = 32,
    speed: number = this.baseSpeed,
    onComplete?: () => void
  ): void {
    if (!this.enabled) return;
    
    const targetX = this.entity.x + (deltaX * gridSize);
    const targetY = this.entity.y + (deltaY * gridSize);
    
    // Set sprite direction
    if (deltaX < 0) {
      this.entity.setFlipX(true);
    } else if (deltaX > 0) {
      this.entity.setFlipX(false);
    }
    
    this.moveToPosition(targetX, targetY, speed, onComplete);
  }
  
  /**
   * Enable or disable movement
   * @param enabled Whether movement is enabled
   */
  public enable(enabled: boolean = true): void {
    this.enabled = enabled;
    if (!enabled) {
      this.entity.setVelocity(0, 0);
    }
  }
  
  /**
   * Disable movement
   */
  public disable(): void {
    this.enable(false);
  }
  
  /**
   * Set base movement speed
   * @param speed New base speed
   */
  public setBaseSpeed(speed: number): void {
    this.baseSpeed = speed;
  }
  
  /**
   * Get current stamina value
   * @returns Current stamina
   */
  public getStamina(): number {
    return this.stamina;
  }
  
  /**
   * Get maximum stamina value
   * @returns Maximum stamina
   */
  public getMaxStamina(): number {
    return this.maxStamina;
  }
  
  /**
   * Set maximum stamina
   * @param max New maximum stamina
   */
  public setMaxStamina(max: number): void {
    this.maxStamina = max;
    this.stamina = Math.min(this.stamina, this.maxStamina);
    
    if (this.onStaminaChange) {
      this.onStaminaChange(this.stamina, this.maxStamina);
    }
  }
} 