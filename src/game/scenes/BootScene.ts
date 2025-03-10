import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Create loading bar
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(240, 270, 320, 50);
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Loading text
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: {
        font: '20px monospace',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);
    
    // Loading percentages
    const percentText = this.make.text({
      x: width / 2,
      y: height / 2 - 5,
      text: '0%',
      style: {
        font: '18px monospace',
        color: '#ffffff'
      }
    });
    percentText.setOrigin(0.5, 0.5);
    
    // Loading assets text
    const assetText = this.make.text({
      x: width / 2,
      y: height / 2 + 50,
      text: '',
      style: {
        font: '18px monospace',
        color: '#ffffff'
      }
    });
    assetText.setOrigin(0.5, 0.5);
    
    // Update progress bar as assets load
    this.load.on('progress', (value: number) => {
      percentText.setText(parseInt(String(value * 100)) + '%');
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(250, 280, 300 * value, 30);
    });
    
    // Update file progress text
    this.load.on('fileprogress', (file: Phaser.Loader.File) => {
      assetText.setText('Loading asset: ' + file.key);
    });
    
    // Remove progress bar when complete
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      assetText.destroy();
      
      // Create textures needed for the game before transitioning
      this.createGameTextures();
      
      // Start the main menu scene
      this.scene.start('MainMenuScene');
    });
    
    // Load assets - use direct image loads instead of spritesheets for now
    this.loadAssets();
  }

  private loadAssets(): void {
    // Player character
    this.load.image('player', 'assets/images/player.svg');
    
    // NPCs
    this.load.image('npc-civilian', 'assets/images/player.svg'); 
    this.load.image('npc-regime', 'assets/images/player.svg');
    
    // Tileset for the map
    this.load.image('tileset', 'assets/images/tileset.svg');
  }
  
  private createGameTextures(): void {
    // Create programmer art for player character
    const graphics = this.make.graphics({ x: 0, y: 0 });
    
    // Player texture
    graphics.clear();
    graphics.fillStyle(0x3B6EFF); // Blue player
    graphics.fillCircle(16, 10, 6); // Head
    graphics.fillRect(10, 16, 12, 16); // Body
    graphics.fillRect(8, 20, 4, 10); // Left arm
    graphics.fillRect(20, 20, 4, 10); // Right arm
    graphics.generateTexture('player-texture', 32, 32);
    
    // Resistance NPC texture
    graphics.clear();
    graphics.fillStyle(0x6666FF); // Resistance color 
    graphics.fillCircle(16, 10, 6);
    graphics.fillRect(10, 16, 12, 16);
    graphics.fillRect(8, 20, 4, 10);
    graphics.fillRect(20, 20, 4, 10);
    graphics.generateTexture('resistance-texture', 32, 32);
    
    // Smuggler NPC texture
    graphics.clear(); 
    graphics.fillStyle(0xFF6666); // Smuggler color
    graphics.fillCircle(16, 10, 6);
    graphics.fillRect(10, 16, 12, 16);
    graphics.fillRect(8, 20, 4, 10);
    graphics.fillRect(20, 20, 4, 10);
    graphics.generateTexture('smuggler-texture', 32, 32);
    
    // Refugee NPC texture
    graphics.clear();
    graphics.fillStyle(0x66FF66); // Refugee color
    graphics.fillCircle(16, 10, 6);
    graphics.fillRect(10, 16, 12, 16);
    graphics.fillRect(8, 20, 4, 10);
    graphics.fillRect(20, 20, 4, 10);
    graphics.generateTexture('refugee-texture', 32, 32);
    
    // Item textures
    graphics.clear();
    graphics.fillStyle(0xFF0000);
    graphics.fillRect(0, 0, 20, 20);
    graphics.generateTexture('medkit-texture', 20, 20);
    
    graphics.clear();
    graphics.fillStyle(0xFFFF00);
    graphics.fillRect(0, 0, 20, 20);
    graphics.generateTexture('ammo-texture', 20, 20);
    
    graphics.clear();
    graphics.fillStyle(0x00FF00);
    graphics.fillRect(0, 0, 20, 20);
    graphics.generateTexture('food-texture', 20, 20);
    
    // Debug to ensure the scene is working
    console.log('Game textures created successfully');
  }
} 