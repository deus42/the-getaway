import Phaser from 'phaser';

/**
 * Manages input for the player character
 */
export class InputHandler {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private sprintKey: Phaser.Input.Keyboard.Key;
  private interactKey: Phaser.Input.Keyboard.Key;
  private inventoryKey: Phaser.Input.Keyboard.Key;
  
  // State for JustDown detection
  private wasInteractDown: boolean = false;
  private wasInventoryDown: boolean = false;
  
  /**
   * Creates a new input handler
   * @param cursors Direction keys
   * @param sprintKey Key for sprinting
   * @param interactKey Key for interactions
   * @param inventoryKey Key for inventory
   */
  constructor(
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    sprintKey: Phaser.Input.Keyboard.Key,
    interactKey: Phaser.Input.Keyboard.Key,
    inventoryKey: Phaser.Input.Keyboard.Key
  ) {
    this.cursors = cursors;
    this.sprintKey = sprintKey;
    this.interactKey = interactKey;
    this.inventoryKey = inventoryKey;
  }
  
  /**
   * Update method to be called each frame
   */
  public update(): void {
    // Track previous states for JustDown detection
    this.wasInteractDown = this.interactKey.isDown;
    this.wasInventoryDown = this.inventoryKey.isDown;
  }
  
  /**
   * Check if a movement key is being pressed
   * @returns Whether any movement key is down
   */
  public isMoving(): boolean {
    return this.cursors.left.isDown || 
           this.cursors.right.isDown || 
           this.cursors.up.isDown || 
           this.cursors.down.isDown;
  }
  
  /**
   * Get horizontal input (-1 for left, 1 for right, 0 for none)
   * @returns Horizontal input value
   */
  public getHorizontalInput(): number {
    let x = 0;
    if (this.cursors.left.isDown) x -= 1;
    if (this.cursors.right.isDown) x += 1;
    return x;
  }
  
  /**
   * Get vertical input (-1 for up, 1 for down, 0 for none)
   * @returns Vertical input value
   */
  public getVerticalInput(): number {
    let y = 0;
    if (this.cursors.up.isDown) y -= 1;
    if (this.cursors.down.isDown) y += 1;
    return y;
  }
  
  /**
   * Check if sprint key is being pressed
   * @returns Whether sprint key is down
   */
  public isSprinting(): boolean {
    return this.sprintKey.isDown;
  }
  
  /**
   * Check if interact key was just pressed
   * @returns Whether interact key was just pressed
   */
  public isInteractKeyJustPressed(): boolean {
    return this.interactKey.isDown && !this.wasInteractDown;
  }
  
  /**
   * Check if inventory key was just pressed
   * @returns Whether inventory key was just pressed
   */
  public isInventoryKeyJustPressed(): boolean {
    return this.inventoryKey.isDown && !this.wasInventoryDown;
  }
  
  /**
   * Get the direction angle based on input
   * @returns Angle in radians
   */
  public getInputAngle(): number | null {
    const x = this.getHorizontalInput();
    const y = this.getVerticalInput();
    
    if (x === 0 && y === 0) return null;
    
    return Math.atan2(y, x);
  }
} 