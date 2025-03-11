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
    // Load UI elements
    this.load.image('ui-frame', 'assets/images/ui-frame.png');
    this.load.image('healthbar', 'assets/images/healthbar.png');
    this.load.image('staminabar', 'assets/images/staminabar.png');
    this.load.image('scanlines', 'assets/images/scanlines.png');
    this.load.image('particle', 'assets/images/particle.png');
    
    // Load environment textures
    this.load.image('building', 'assets/images/building.png');
    this.load.image('road', 'assets/images/road.png');
    
    // Load placeholders but we'll generate better textures programmatically
    this.load.image('player', 'assets/images/player.svg');
    this.load.image('npc', 'assets/images/player.svg');
  }
  
  private createGameTextures(): void {
    // Create programmer art for player character with better styling
    const graphics = this.make.graphics({ x: 0, y: 0 });
    
    // Player texture - cyberpunk character
    graphics.clear();
    
    // Character base 
    graphics.fillStyle(0x111111); // Dark base
    graphics.fillRect(12, 8, 8, 24); // Body
    
    // Neon blue highlights
    graphics.fillStyle(0x00AAFF);
    graphics.fillRect(10, 12, 12, 2); // Shoulders
    graphics.fillRect(14, 8, 4, 16); // Center line
    
    // Face/mask
    graphics.fillStyle(0xCCCCCC); // Light face
    graphics.fillRect(12, 4, 8, 6); // Head
    
    // Visor
    graphics.fillStyle(0x00FFFF); // Cyan visor
    graphics.fillRect(13, 6, 6, 2); // Eyes
    
    // Limbs with highlights
    graphics.fillStyle(0x222222); // Dark limbs
    graphics.fillRect(8, 16, 4, 10); // Left arm
    graphics.fillRect(20, 16, 4, 10); // Right arm
    graphics.fillRect(12, 30, 3, 8); // Left leg
    graphics.fillRect(17, 30, 3, 8); // Right leg
    
    // Neon highlights on limbs
    graphics.fillStyle(0x00AAFF);
    graphics.fillRect(8, 18, 4, 2); // Left arm highlight
    graphics.fillRect(20, 18, 4, 2); // Right arm highlight
    graphics.fillRect(12, 34, 3, 2); // Left leg highlight
    graphics.fillRect(17, 34, 3, 2); // Right leg highlight
    
    // Generate the improved texture
    graphics.generateTexture('player-texture', 32, 40);
    
    // Resistance NPC texture - blue resistance fighter
    graphics.clear();
    
    // Base
    graphics.fillStyle(0x111111);
    graphics.fillRect(12, 8, 8, 24);
    
    // Resistance colors
    graphics.fillStyle(0x6666FF); // Purple/blue resistance  
    graphics.fillRect(14, 8, 4, 16);
    graphics.fillRect(10, 12, 12, 2);
    
    // Face with mask
    graphics.fillStyle(0xAAAAAA);
    graphics.fillRect(12, 4, 8, 6);
    
    // Resistance symbol
    graphics.fillStyle(0xFF3333); // Red resistance symbol
    graphics.fillRect(14, 6, 4, 2);
    
    // Limbs
    graphics.fillStyle(0x222222);
    graphics.fillRect(8, 16, 4, 10);
    graphics.fillRect(20, 16, 4, 10);
    graphics.fillRect(12, 30, 3, 8);
    graphics.fillRect(17, 30, 3, 8);
    
    // Limb highlights
    graphics.fillStyle(0x6666FF);
    graphics.fillRect(8, 18, 4, 2);
    graphics.fillRect(20, 18, 4, 2);
    graphics.fillRect(12, 34, 3, 2);
    graphics.fillRect(17, 34, 3, 2);
    
    graphics.generateTexture('resistance-texture', 32, 40);
    
    // Smuggler NPC texture
    graphics.clear();
    
    // Base
    graphics.fillStyle(0x111111);
    graphics.fillRect(12, 8, 8, 24);
    
    // Smuggler colors - gold/amber
    graphics.fillStyle(0xFFAA00); 
    graphics.fillRect(14, 8, 4, 16);
    graphics.fillRect(10, 12, 12, 2);
    
    // Face 
    graphics.fillStyle(0x996633); // Darker face tone
    graphics.fillRect(12, 4, 8, 6);
    
    // Smuggler visor
    graphics.fillStyle(0xFFDD44); // Gold visor
    graphics.fillRect(13, 6, 6, 2);
    
    // Limbs
    graphics.fillStyle(0x222222);
    graphics.fillRect(8, 16, 4, 10);
    graphics.fillRect(20, 16, 4, 10);
    graphics.fillRect(12, 30, 3, 8);
    graphics.fillRect(17, 30, 3, 8);
    
    // Limb highlights
    graphics.fillStyle(0xFFAA00);
    graphics.fillRect(8, 18, 4, 2);
    graphics.fillRect(20, 18, 4, 2);
    graphics.fillRect(12, 34, 3, 2);
    graphics.fillRect(17, 34, 3, 2);
    
    graphics.generateTexture('smuggler-texture', 32, 40);
    
    // Regime soldier - regime agent
    graphics.clear();
    
    // Base
    graphics.fillStyle(0x111111);
    graphics.fillRect(12, 8, 8, 24);
    
    // Regime colors - red
    graphics.fillStyle(0xFF3333);
    graphics.fillRect(14, 8, 4, 16);
    graphics.fillRect(10, 12, 12, 2);
    
    // Face/helmet
    graphics.fillStyle(0x333333); // Dark helmet 
    graphics.fillRect(12, 4, 8, 6);
    
    // Visor
    graphics.fillStyle(0xFF0000); // Red visor
    graphics.fillRect(13, 6, 6, 2);
    
    // Limbs
    graphics.fillStyle(0x222222);
    graphics.fillRect(8, 16, 4, 10);
    graphics.fillRect(20, 16, 4, 10);
    graphics.fillRect(12, 30, 3, 8);
    graphics.fillRect(17, 30, 3, 8);
    
    // Limb highlights
    graphics.fillStyle(0xFF3333);
    graphics.fillRect(8, 18, 4, 2);
    graphics.fillRect(20, 18, 4, 2);
    graphics.fillRect(12, 34, 3, 2);
    graphics.fillRect(17, 34, 3, 2);
    
    graphics.generateTexture('regime-texture', 32, 40);
    
    // Building textures - create a variety of building styles
    this.createBuildingTextures();
  }
  
  private createBuildingTextures(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    
    // Create different building styles
    
    // Corporate skyscraper
    graphics.clear();
    // Base building
    graphics.fillStyle(0x333333);
    graphics.fillRect(0, 0, 128, 256);
    
    // Windows grid 
    graphics.fillStyle(0x666666);
    for (let y = 16; y < 256; y += 24) {
      for (let x = 16; x < 128; x += 24) {
        graphics.fillRect(x, y, 16, 16);
      }
    }
    
    // Highlights/lights in windows (random)
    graphics.fillStyle(0xAAFFFF);
    for (let y = 16; y < 256; y += 24) {
      for (let x = 16; x < 128; x += 24) {
        if (Math.random() > 0.7) {
          graphics.fillRect(x + 4, y + 4, 8, 8);
        }
      }
    }
    
    // Building top
    graphics.fillStyle(0x222222);
    graphics.fillRect(0, 0, 128, 8);
    
    graphics.generateTexture('building-corporate', 128, 256);
    
    // Residential building
    graphics.clear();
    // Base
    graphics.fillStyle(0x444444);
    graphics.fillRect(0, 0, 96, 128);
    
    // Windows
    graphics.fillStyle(0x888888);
    for (let y = 8; y < 128; y += 20) {
      for (let x = 8; x < 96; x += 24) {
        graphics.fillRect(x, y, 16, 12);
      }
    }
    
    // Random lights
    graphics.fillStyle(0xFFCC66);
    for (let y = 8; y < 128; y += 20) {
      for (let x = 8; x < 96; x += 24) {
        if (Math.random() > 0.6) {
          graphics.fillRect(x + 4, y + 3, 8, 6);
        }
      }
    }
    
    graphics.generateTexture('building-residential', 96, 128);
    
    // Government building
    graphics.clear();
    // Base
    graphics.fillStyle(0x555555);
    graphics.fillRect(0, 0, 192, 144);
    
    // Columns
    graphics.fillStyle(0x777777);
    for (let x = 16; x < 192; x += 32) {
      graphics.fillRect(x, 0, 16, 144);
    }
    
    // Door
    graphics.fillStyle(0x333333);
    graphics.fillRect(80, 110, 32, 34);
    
    // Regime emblem
    graphics.fillStyle(0xFF0000);
    graphics.fillRect(80, 24, 32, 32);
    
    graphics.generateTexture('building-government', 192, 144);
    
    // Create street texture
    graphics.clear();
    
    // Base road
    graphics.fillStyle(0x222222);
    graphics.fillRect(0, 0, 128, 512);
    
    // Center line
    graphics.fillStyle(0xFFFF00);
    graphics.fillRect(60, 0, 8, 512);
    
    // Side markings
    graphics.fillStyle(0xFFFFFF);
    for (let y = 0; y < 512; y += 64) {
      graphics.fillRect(8, y, 16, 32);
      graphics.fillRect(104, y, 16, 32);
    }
    
    graphics.generateTexture('road-texture', 128, 512);
  }
} 