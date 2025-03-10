import Phaser from 'phaser';

export interface DialogLine {
  text: string;
  choices?: {
    text: string;
    nextId?: string;
    action?: () => void;
  }[];
  nextId?: string;
}

export interface DialogTree {
  [key: string]: DialogLine;
}

export class NPC extends Phaser.Physics.Arcade.Sprite {
  private _name: string;
  private faction: string;
  private dialogTree: DialogTree;
  private interactionZone: Phaser.GameObjects.Zone;
  private isInteractable: boolean = true;
  private movementPattern: 'stationary' | 'patrol' | 'follow' = 'stationary';
  private patrolPoints: Phaser.Math.Vector2[] = [];
  private currentPatrolIndex: number = 0;
  private movementSpeed: number = 50;
  private patrolWaitTime: number = 2000; // milliseconds to wait at each point
  private waitTimer: number = 0;
  
  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    textureKey: string, 
    name: string, 
    faction: string,
    dialogTree: DialogTree,
    movementPattern: 'stationary' | 'patrol' | 'follow' = 'stationary'
  ) {
    // Choose the appropriate texture based on the faction
    let actualTexture: string;
    switch (faction.toLowerCase()) {
      case 'resistance':
        actualTexture = 'resistance-texture';
        break;
      case 'civilian':
        actualTexture = 'refugee-texture';
        break;
      case 'neutral':
        actualTexture = 'smuggler-texture';
        break;
      default:
        actualTexture = textureKey + '-texture';
    }
    
    super(scene, x, y, actualTexture);
    
    // Add the NPC to the scene and physics system
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Set up properties
    this._name = name;
    this.faction = faction;
    this.dialogTree = dialogTree;
    this.movementPattern = movementPattern;
    
    // Create interaction zone
    this.interactionZone = scene.add.zone(x, y, 100, 100);
    scene.physics.world.enable(this.interactionZone);
    (this.interactionZone.body as Phaser.Physics.Arcade.Body).setCircle(50);
    (this.interactionZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.interactionZone.setData('npc', this);
    
    // Set physics properties
    this.setImmovable(true);
    this.setCollideWorldBounds(true);
    
    // Add a text label with the NPC's name
    const label = scene.add.text(x, y - 40, name, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 5, y: 2 }
    });
    label.setOrigin(0.5);
    
    // Keep the label following the NPC
    scene.events.on('update', () => {
      label.setPosition(this.x, this.y - 30);
    });
  }
  
  public setupPatrol(points: Phaser.Math.Vector2[]): void {
    this.patrolPoints = points;
    this.movementPattern = 'patrol';
  }
  
  update(time: number, delta: number): void {
    // Update interaction zone position
    this.interactionZone.setPosition(this.x, this.y);
    
    // Handle movement based on pattern
    if (this.movementPattern === 'patrol' && this.patrolPoints.length > 0) {
      this.handlePatrolMovement(delta);
    }
    
    // Add some idle animation
    if (this.body && this.body.velocity.x === 0 && this.body.velocity.y === 0) {
      // Slight "breathing" effect for idle NPCs
      const breatheFactor = Math.sin(time / 800) * 0.02 + 1;
      this.setScale(1, breatheFactor);
    }
  }
  
  private handlePatrolMovement(delta: number): void {
    const target = this.patrolPoints[this.currentPatrolIndex];
    
    // Check if we need to wait at the current point
    if (this.waitTimer > 0) {
      this.waitTimer -= delta;
      this.setVelocity(0, 0);
      return;
    }
    
    // Check if we've reached the target point
    const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
    if (distance < 5) {
      this.setVelocity(0, 0);
      this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
      this.waitTimer = this.patrolWaitTime;
      return;
    }
    
    // Move towards the target point
    const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
    this.setVelocityX(Math.cos(angle) * this.movementSpeed);
    this.setVelocityY(Math.sin(angle) * this.movementSpeed);
    
    // Flip the sprite based on movement direction
    if (this.body && this.body.velocity.x < 0) {
      this.setFlipX(true);
    } else if (this.body && this.body.velocity.x > 0) {
      this.setFlipX(false);
    }
  }
  
  public getName(): string {
    return this._name;
  }
  
  public getFaction(): string {
    return this.faction;
  }
  
  public getDialogTree(): DialogTree {
    return this.dialogTree;
  }
  
  public startDialog(): string {
    return 'start'; // Return the initial dialog ID
  }
  
  public isPlayerInRange(player: Phaser.Physics.Arcade.Sprite): boolean {
    return Phaser.Geom.Intersects.RectangleToRectangle(
      this.interactionZone.getBounds(),
      player.getBounds()
    );
  }
  
  public setInteractable(value: boolean): void {
    this.isInteractable = value;
  }
  
  public canInteract(): boolean {
    return this.isInteractable;
  }
  
  public getInteractionZone(): Phaser.GameObjects.Zone {
    return this.interactionZone;
  }
} 