import Phaser from 'phaser';
import { 
  PlayerStateMachine, 
  PlayerState,
  HealthComponent,
  InventoryComponent,
  InputHandler,
  MovementController,
  AnimationController
} from '../components';
import { Item, DamageType } from '../interfaces';

/**
 * Player class represents the main character controlled by the player.
 * Uses component-based architecture for modularity and extensibility.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  // Core components
  private stateMachine: PlayerStateMachine;
  private health: HealthComponent;
  private inventory: InventoryComponent;
  private inputHandler: InputHandler;
  private movement: MovementController;
  private animations: AnimationController;
  
  // Turn-based stats
  private actionPoints: number = 3;
  private maxActionPoints: number = 3;
  private currentTurn: boolean = false;
  
  // Additional properties
  private invulnerable: boolean = false;
  private invulnerabilityTimer: Phaser.Time.TimerEvent | null = null;
  
  /**
   * Creates a new Player instance
   * @param scene The scene this player belongs to
   * @param x Initial x position
   * @param y Initial y position
   */
  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Try to use the player texture if it exists, otherwise use a fallback
    const textureKey = scene.textures.exists('player-texture') ? 
      'player-texture' : (scene.textures.exists('player') ? 'player' : 'player-texture');
    
    super(scene, x, y, textureKey);
    
    // Setup basic physics and add to scene
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    this.setCollideWorldBounds(true);
    this.setDrag(0.2);
    
    // Check if we need to create a texture (might be missing at this point)
    if (this.texture.key === '__MISSING') {
      this.createFallbackTexture();
    }
    
    // Initialize components
    this.stateMachine = new PlayerStateMachine();
    this.health = new HealthComponent(100, 100);
    this.inventory = new InventoryComponent(20); // 20 slots
    this.animations = new AnimationController(this, scene);
    
    // Setup input with safer keyboard checks
    if (!scene.input.keyboard) {
      console.warn('Keyboard input not available, using fallback controls');
      this.inputHandler = this.createFallbackInputHandler();
    } else {
      try {
        this.inputHandler = new InputHandler(
          scene.input.keyboard.createCursorKeys(),
          scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
          scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
          scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I) // Inventory key
        );
      } catch (e) {
        console.error('Error setting up input handler:', e);
        this.inputHandler = this.createFallbackInputHandler();
      }
    }
    
    // Initialize movement after input is available
    this.movement = new MovementController(this, this.inputHandler, 200);
    
    // Register animations
    try {
      this.animations.registerAnimations();
    } catch (e) {
      console.error('Error registering animations:', e);
    }
    
    // Set initial state
    this.stateMachine.setState(PlayerState.IDLE);
    
    // Set up health regeneration
    scene.time.addEvent({
      delay: 3000,
      callback: this.health.regenerate,
      callbackScope: this.health,
      loop: true
    });
    
    // Listen for health changes
    this.health.onDamage = this.onDamageTaken.bind(this);
    this.health.onHeal = this.onHealReceived.bind(this);
    this.health.onDeath = this.onDeath.bind(this);
  }
  
  /**
   * Creates a fallback texture if the main texture is missing
   */
  private createFallbackTexture(): void {
    console.log('Creating fallback player texture');
    
    // Create a simple player texture as fallback
    const graphics = this.scene.add.graphics({ x: 0, y: 0 });
    
    // Blue square for player - simple but functional
    graphics.fillStyle(0x3333ff);
    graphics.fillRect(0, 0, 32, 32);
    
    // Add some details to make it look a bit like a character
    graphics.fillStyle(0xffffff);
    graphics.fillRect(8, 8, 5, 5); // Eye
    graphics.fillRect(19, 8, 5, 5); // Eye
    graphics.fillRect(12, 20, 8, 3); // Mouth
    
    // Generate the texture
    graphics.generateTexture('player-texture', 32, 32);
    graphics.destroy();
    
    // Set the texture
    this.setTexture('player-texture');
  }
  
  /**
   * Creates a fallback input handler if keyboard is not available
   */
  private createFallbackInputHandler(): InputHandler {
    // Create a dummy input handler that doesn't rely on keyboard
    const dummyInput = {
      isLeftDown: () => false,
      isRightDown: () => false,
      isUpDown: () => false,
      isDownDown: () => false,
      isRunDown: () => false,
      isInteractKeyJustPressed: () => false,
      isInventoryKeyJustPressed: () => false,
      update: () => {}
    };
    
    return dummyInput as unknown as InputHandler;
  }
  
  /**
   * Update method called each frame
   * @param _time Current time (unused)
   * @param delta Time elapsed since last frame
   */
  update(_time: number, delta: number): void {
    try {
      // Update all components
      this.inputHandler.update();
      
      // State machine controls what actions are allowed based on state
      this.stateMachine.update(delta);
      
      // Apply movement based on current state
      if (this.currentTurn || !this.isInTurnBasedMode()) {
        this.movement.update();
      }
      
      // Update animations based on state - with error handling
      try {
        this.animations.update(this.stateMachine.getCurrentState());
      } catch (e) {
        console.error('Animation update error:', e);
      }
    } catch (e) {
      console.error('Error in player update:', e);
    }
  }
  
  /**
   * Handle taking damage with invulnerability frames
   * @param amount Amount of damage taken
   * @param type Type of damage (ballistic, melee, etc.)
   */
  public takeDamage(amount: number, type: DamageType = DamageType.BALLISTIC): void {
    if (this.invulnerable) return;
    
    // Apply damage after calculations (resistance, armor, etc.)
    const calculatedDamage = this.calculateDamage(amount, type);
    this.health.takeDamage(calculatedDamage);
    
    // Visual feedback
    this.scene.cameras.main.shake(100, 0.01 * calculatedDamage);
    
    // Set invulnerability for a short time
    this.setInvulnerable(1000);
  }
  
  /**
   * Make player invulnerable for a period of time
   * @param duration Duration in milliseconds
   */
  private setInvulnerable(duration: number): void {
    this.invulnerable = true;
    
    // Visual feedback with blinking
    const blinkEvent = this.scene.time.addEvent({
      delay: 100,
      callback: () => { this.setAlpha(this.alpha === 1 ? 0.5 : 1); },
      repeat: duration / 100 - 1
    });
    
    // Clear existing timer if any
    if (this.invulnerabilityTimer) {
      this.invulnerabilityTimer.destroy();
    }
    
    // Set timer to end invulnerability
    this.invulnerabilityTimer = this.scene.time.delayedCall(duration, () => {
      this.invulnerable = false;
      this.setAlpha(1);
      blinkEvent.destroy();
    });
  }
  
  /**
   * Calculate actual damage based on resistance and other factors
   * @param amount Base damage amount
   * @param type Type of damage
   * @returns Calculated damage amount
   */
  private calculateDamage(amount: number, type: DamageType): number {
    // Here you can add resistance calculations, critical hits, etc.
    let damage = amount;
    
    // Apply resistance based on damage type
    // This would be expanded with proper resistance stats
    switch (type) {
      case DamageType.BALLISTIC:
        // Example: 20% damage reduction
        damage *= 0.8;
        break;
      case DamageType.MELEE:
        // Example: 10% damage reduction
        damage *= 0.9;
        break;
    }
    
    return Math.round(damage);
  }
  
  /**
   * Heal the player
   * @param amount Amount to heal
   */
  public heal(amount: number): void {
    this.health.heal(amount);
  }
  
  /**
   * Callback when damage is taken
   * @param amount Amount of damage taken
   * @param currentHealth Current health after damage
   */
  private onDamageTaken(amount: number, currentHealth: number): void {
    // Play hurt animation
    this.animations.playOnce('hurt');
    
    // Flash the sprite red
    this.setTint(0xff0000);
    this.scene.time.delayedCall(200, () => {
      this.clearTint();
    });
    
    // TODO: Add damage floating text or particles
    console.log(`Player took ${amount} damage, health: ${currentHealth}`);
  }
  
  /**
   * Callback when healing is received
   * @param amount Amount healed
   * @param currentHealth Current health after healing
   */
  private onHealReceived(amount: number, currentHealth: number): void {
    // TODO: Add healing visual effect
    console.log(`Player healed ${amount}, health: ${currentHealth}`);
  }
  
  /**
   * Callback when player dies
   */
  private onDeath(): void {
    this.stateMachine.setState(PlayerState.DEAD);
    this.animations.playOnce('death');
    
    // Disable movement and input
    this.movement.disable();
    
    // Show game over after animation completes
    this.scene.time.delayedCall(1500, () => {
      this.scene.scene.start('GameOverScene');
    });
  }
  
  /**
   * Add an item to the player's inventory
   * @param item Item to add
   * @returns Whether the item was successfully added
   */
  public addItem(item: Item): boolean {
    return this.inventory.addItem(item);
  }
  
  /**
   * Check if the player has a specific item
   * @param itemId ID of the item to check
   * @returns Whether the player has the item
   */
  public hasItem(itemId: string): boolean {
    return this.inventory.hasItem(itemId);
  }
  
  /**
   * Use an item from the inventory
   * @param itemId ID of the item to use
   * @returns Whether the item was successfully used
   */
  public useItem(itemId: string): boolean {
    const item = this.inventory.getItem(itemId);
    if (!item) return false;
    
    // Handle different item types
    switch (item.type) {
      case 'consumable':
        if (item.healAmount) {
          this.heal(item.healAmount);
        }
        return this.inventory.removeItem(itemId);
      
      case 'equippable':
        // TODO: Equipment system
        console.log('Equipment system not yet implemented');
        return false;
      
      default:
        console.warn('Unknown item type:', item.type);
        return false;
    }
  }
  
  /**
   * Start the player's turn in turn-based mode
   * @param actionPoints Action points available for this turn
   */
  public startTurn(actionPoints: number = this.maxActionPoints): void {
    this.currentTurn = true;
    this.actionPoints = actionPoints;
    // Emit turn started event or call callbacks
    console.log('Player turn started with', actionPoints, 'AP');
  }
  
  /**
   * End the player's turn in turn-based mode
   */
  public endTurn(): void {
    this.currentTurn = false;
    this.actionPoints = 0;
    // Emit turn ended event or call callbacks
    console.log('Player turn ended');
  }
  
  /**
   * Use action points for an action
   * @param cost Cost in action points
   * @returns Whether the action could be performed
   */
  public useActionPoints(cost: number): boolean {
    if (this.actionPoints >= cost) {
      this.actionPoints -= cost;
      return true;
    }
    return false;
  }
  
  /**
   * Check if enough action points are available
   * @param cost Cost to check
   * @returns Whether enough points are available
   */
  public hasEnoughActionPoints(cost: number): boolean {
    return this.actionPoints >= cost;
  }
  
  /**
   * Check if player is in turn-based mode
   * @returns Whether in turn-based mode
   */
  private isInTurnBasedMode(): boolean {
    // This would be determined by a game setting or current mode
    // For now, let's assume it's always false (real-time mode)
    return false;
  }
  
  // Getters for various properties
  public getHealth(): number { return this.health.getCurrentHealth(); }
  public getMaxHealth(): number { return this.health.getMaxHealth(); }
  public getActionPoints(): number { return this.actionPoints; }
  public getMaxActionPoints(): number { return this.maxActionPoints; }
  public getInventory(): Item[] { return this.inventory.getAllItems(); }
  public getCurrentState(): PlayerState { return this.stateMachine.getCurrentState(); }
  public isInteractKeyJustPressed(): boolean { return this.inputHandler.isInteractKeyJustPressed(); }
  public getStamina(): number { return this.movement.getStamina(); }
  public getMaxStamina(): number { return this.movement.getMaxStamina(); }
  public isInteractKeyJustDown(): boolean { return this.isInteractKeyJustPressed(); }
} 