import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private speed: number = 200;
  private health: number = 100;
  private stamina: number = 100;
  private inventory: string[] = [];
  
  private isMoving: boolean = false;
  private isSprinting: boolean = false;
  private staminaRegenTimer: Phaser.Time.TimerEvent | null = null;
  
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private sprintKey: Phaser.Input.Keyboard.Key;
  private interactKey: Phaser.Input.Keyboard.Key;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Use the generated texture instead of the sprite sheet
    super(scene, x, y, 'player-texture');
    
    // Add the player to the scene and physics system
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Set up physics properties
    this.setCollideWorldBounds(true);
    this.setBounce(0.1);
    this.setDrag(0.2);
    
    // Set up controls
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.sprintKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.interactKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Set up stamina regeneration
    this.staminaRegenTimer = scene.time.addEvent({
      delay: 100,
      callback: this.regenStamina,
      callbackScope: this,
      loop: true
    });
  }
  
  update(): void {
    this.handleMovement();
    this.updateVisuals();
  }
  
  private handleMovement(): void {
    // Reset velocity
    this.setVelocity(0);
    
    // Determine if sprinting
    this.isSprinting = this.sprintKey.isDown && this.stamina > 0;
    const currentSpeed = this.isSprinting ? this.speed * 1.7 : this.speed;
    
    // Consume stamina when sprinting
    if (this.isSprinting) {
      this.stamina = Math.max(0, this.stamina - 0.5);
    }
    
    // Horizontal movement
    if (this.cursors.left.isDown) {
      this.setVelocityX(-currentSpeed);
      this.setFlipX(true);
      this.isMoving = true;
    } else if (this.cursors.right.isDown) {
      this.setVelocityX(currentSpeed);
      this.setFlipX(false);
      this.isMoving = true;
    }
    
    // Vertical movement
    if (this.cursors.up.isDown) {
      this.setVelocityY(-currentSpeed);
      this.isMoving = true;
    } else if (this.cursors.down.isDown) {
      this.setVelocityY(currentSpeed);
      this.isMoving = true;
    }
    
    // Normalize diagonal movement
    if (this.body.velocity.x !== 0 && this.body.velocity.y !== 0) {
      this.body.velocity.normalize().scale(currentSpeed);
    }
    
    // Set not moving if no keys are pressed
    if (!this.cursors.left.isDown && !this.cursors.right.isDown && 
        !this.cursors.up.isDown && !this.cursors.down.isDown) {
      this.isMoving = false;
    }
  }
  
  private updateVisuals(): void {
    // Simple visual updates for now without animations
    // In a full game, you would have proper animations here
    
    // Scale the player slightly based on movement/sprint
    if (this.isMoving) {
      if (this.isSprinting) {
        // Make player look slightly smaller when sprinting (to give sense of speed)
        this.setScale(0.95, 0.95);
      } else {
        // Normal movement scale
        this.setScale(1, 1);
      }
    } else {
      // Idle state
      this.setScale(1, 1);
    }
    
    // Simulate a "breathing" effect when idle
    if (!this.isMoving) {
      const breatheFactor = Math.sin(this.scene.time.now / 500) * 0.03 + 1;
      this.setScale(1, breatheFactor);
    }
  }
  
  private regenStamina(): void {
    if (!this.isSprinting) {
      this.stamina = Math.min(100, this.stamina + 0.2);
    }
  }
  
  public getHealth(): number {
    return this.health;
  }
  
  public getStamina(): number {
    return this.stamina;
  }
  
  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    
    // Flash the player red when taking damage
    this.scene.tweens.add({
      targets: this,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 3
    });
    
    // Check if player is dead
    if (this.health <= 0) {
      this.die();
    }
  }
  
  public heal(amount: number): void {
    this.health = Math.min(100, this.health + amount);
  }
  
  public addToInventory(item: string): void {
    this.inventory.push(item);
  }
  
  public hasItem(item: string): boolean {
    return this.inventory.includes(item);
  }
  
  private die(): void {
    this.scene.scene.start('GameOverScene', { 
      reason: 'You were captured by the regime forces.' 
    });
  }
  
  public isInteractKeyJustDown(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.interactKey);
  }
} 