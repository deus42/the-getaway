import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private worldLayer!: Phaser.Tilemaps.TilemapLayer;
  private map!: Phaser.Tilemaps.Tilemap;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // Load tilemap and tileset
    this.load.image('tiles', 'assets/images/tileset.svg');
    this.load.tilemapTiledJSON('map', 'assets/maps/main-world.json');
    
    // Load player sprite
    this.load.image('player', 'assets/images/player.svg');
  }

  create() {
    // Create the tilemap
    this.map = this.make.tilemap({ key: 'map' });
    const tileset = this.map.addTilesetImage('tileset', 'tiles');
    
    if (!tileset) {
      console.error('Failed to load tileset');
      return;
    }
    
    // Create layers
    // Store groundLayer if needed later
    this.worldLayer = this.map.createLayer('World', tileset)!;
    
    // Set collisions
    this.worldLayer.setCollisionByProperty({ collides: true });
    
    // Set up player
    this.player = this.physics.add.sprite(100, 100, 'player');
    this.player.setCollideWorldBounds(true);
    
    // Add collisions
    this.physics.add.collider(this.player, this.worldLayer);
    
    // Set up camera to follow player
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.startFollow(this.player, true, 0.5, 0.5);
    
    // Set up controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // Add debug graphics if needed
    if (process.env.NODE_ENV === 'development') {
      // Debug graphics to show collision boundaries
      const debugGraphics = this.add.graphics().setAlpha(0.7);
      this.worldLayer.renderDebug(debugGraphics, {
        tileColor: null,
        collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255),
        faceColor: new Phaser.Display.Color(40, 39, 37, 255)
      });
    }
    
    // Example NPC creation (placeholder)
    const npc = this.physics.add.sprite(200, 200, 'player');
    npc.setTint(0xff0000);
    this.physics.add.collider(npc, this.worldLayer);
    
    // Example text for UI
    this.add.text(10, 10, 'The Getaway: Dystopian World', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 5, y: 5 }
    }).setScrollFactor(0);
  }

  update() {
    // Stop any previous movement
    this.player.setVelocity(0);

    // Handle horizontal movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-150);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(150);
    }

    // Handle vertical movement
    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-150);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(150);
    }
    
    // Normalize movement for consistent speed in all directions
    if (this.player.body.velocity.x !== 0 && this.player.body.velocity.y !== 0) {
      this.player.body.velocity.normalize().scale(150);
    }
  }
}
