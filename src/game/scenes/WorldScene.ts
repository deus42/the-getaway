import Phaser from 'phaser';

export class WorldScene extends Phaser.Scene {
  // Player sprite
  private player!: Phaser.Physics.Arcade.Sprite;
  
  // Controls
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  
  // Map & layers
  private map!: Phaser.Tilemaps.Tilemap;
  private tileset!: Phaser.Tilemaps.Tileset;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private buildingsLayer!: Phaser.Tilemaps.TilemapLayer;
  
  // UI elements
  private statusText!: Phaser.GameObjects.Text;
  private dialogBox!: Phaser.GameObjects.Container;
  
  // Game state
  private isDialogActive: boolean = false;
  
  constructor() {
    super({ key: 'WorldScene' });
  }

  create(): void {
    // Setup world boundaries
    this.physics.world.setBounds(0, 0, 2000, 2000);
    
    // Create a simple background (will be replaced with tilemap)
    const background = this.add.rectangle(0, 0, 2000, 2000, 0x333333);
    background.setOrigin(0);
    
    // Create simple "buildings" - will be replaced with tilemap
    this.createSimpleCity();
    
    // Create player
    this.player = this.physics.add.sprite(400, 300, 'player');
    this.player.setCollideWorldBounds(true);
    
    // Setup camera
    this.cameras.main.setBounds(0, 0, 2000, 2000);
    this.cameras.main.startFollow(this.player, true, 0.5, 0.5);
    this.cameras.main.setZoom(1);
    
    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // UI - Status text
    this.statusText = this.add.text(10, 10, 'Miami Underground - 2036', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 10, y: 5 }
    });
    this.statusText.setScrollFactor(0);
    
    // Create dialog box (hidden by default)
    this.createDialogBox();
    
    // Add some NPCs
    this.createNPCs();
    
    // Event listeners
    this.events.on('shutdown', this.shutdown, this);
  }
  
  update(): void {
    if (!this.player) return;
    
    // Handle dialog
    if (this.isDialogActive) {
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.closeDialog();
      }
      return; // Don't allow movement during dialog
    }
    
    // Movement
    const speed = 200;
    
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.flipX = true;
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.flipX = false;
    } else {
      this.player.setVelocityX(0);
    }
    
    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
    } else {
      this.player.setVelocityY(0);
    }
    
    // Normalize diagonal movement
    if (this.player.body.velocity.x !== 0 && this.player.body.velocity.y !== 0) {
      this.player.body.velocity.normalize().scale(speed);
    }
  }
  
  private createSimpleCity(): void {
    // Will be replaced with proper tilemap
    const buildings = this.physics.add.staticGroup();
    
    // Create a grid of "buildings"
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        if (Math.random() > 0.3) { // 70% chance of a building
          const buildingX = 100 + x * 350;
          const buildingY = 100 + y * 350;
          const width = Phaser.Math.Between(50, 200);
          const height = Phaser.Math.Between(50, 200);
          
          const building = this.add.rectangle(buildingX, buildingY, width, height, 0x555555);
          buildings.add(building);
        }
      }
    }
    
    // Collide with buildings
    this.physics.add.collider(this.player, buildings);
  }
  
  private createDialogBox(): void {
    // Create dialog container
    this.dialogBox = this.add.container(this.cameras.main.width / 2, this.cameras.main.height - 150);
    this.dialogBox.setScrollFactor(0);
    
    // Background
    const background = this.add.rectangle(0, 0, this.cameras.main.width * 0.8, 120, 0x000000, 0.8);
    
    // Text
    const dialogText = this.add.text(0, 0, '', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      wordWrap: { width: this.cameras.main.width * 0.7 }
    });
    dialogText.setOrigin(0.5);
    
    // Info text
    const infoText = this.add.text(0, 50, '[Space] to continue', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#aaaaaa'
    });
    infoText.setOrigin(0.5);
    
    // Add to container
    this.dialogBox.add([background, dialogText, infoText]);
    this.dialogBox.setAlpha(0); // Hidden by default
    
    // Store dialog text for easy access
    this.dialogBox.setData('dialogText', dialogText);
  }
  
  private createNPCs(): void {
    // Create a few NPCs with interaction zones
    const npcData = [
      { x: 500, y: 200, color: 0x6666ff, name: 'Resistance Fighter', dialog: "Hey, you! Yes, you. We need people like you. The dictator's men have been cracking down hard lately. If you're interested in helping the resistance, find me later at the old warehouse." },
      { x: 800, y: 650, color: 0xff6666, name: 'Smuggler', dialog: "Psst... looking to cross the border? I know some people who can help, for the right price. The northern checkpoints are heavily guarded, but we know the blind spots." },
      { x: 300, y: 900, color: 0x66ff66, name: 'Refugee', dialog: "Please, have you seen my family? We got separated during the last raid. The militia came in the night, took everyone they suspected of being part of the resistance. I barely escaped..." }
    ];
    
    npcData.forEach(npc => {
      // NPC sprite
      const npcSprite = this.physics.add.sprite(npc.x, npc.y, 'player');
      npcSprite.setTint(npc.color);
      
      // Interaction zone
      const zone = this.add.zone(npc.x, npc.y, 100, 100);
      this.physics.world.enable(zone);
      zone.body.setCircle(50);
      zone.setData('npc', npc);
      
      // Overlap with player
      this.physics.add.overlap(this.player, zone, () => {
        this.statusText.setText(`Press SPACE to talk to ${npc.name}`);
        
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.isDialogActive) {
          this.showDialog(npc.name, npc.dialog);
        }
      }, undefined, this);
    });
  }
  
  private showDialog(name: string, text: string): void {
    this.isDialogActive = true;
    
    // Get dialog text object
    const dialogText = this.dialogBox.getData('dialogText') as Phaser.GameObjects.Text;
    dialogText.setText(`${name}:\n${text}`);
    
    // Show dialog box
    this.tweens.add({
      targets: this.dialogBox,
      alpha: 1,
      duration: 300
    });
    
    // Update status text
    this.statusText.setText('');
  }
  
  private closeDialog(): void {
    // Hide dialog box
    this.tweens.add({
      targets: this.dialogBox,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.isDialogActive = false;
        this.statusText.setText('Miami Underground - 2036');
      }
    });
  }
  
  private shutdown(): void {
    // Cleanup event listeners
    this.events.off('shutdown');
  }
} 