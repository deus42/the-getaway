import Phaser from 'phaser';
import { eventBus, GameEvents } from '../engine/core/gameEvents';

export class BootScene extends Phaser.Scene {
  private isLoading: boolean = false;
  private loadingText: Phaser.GameObjects.Text | null = null;
  private progressBar: Phaser.GameObjects.Graphics | null = null;
  private progressBox: Phaser.GameObjects.Graphics | null = null;
  private assetLoadCount: number = 0;
  private assetsLoaded: boolean = false;
  private fallbackAssetsCreated: boolean = false;

  constructor() {
    super({ key: 'BootScene' });
    console.log('BootScene constructor called');
  }

  init() {
    console.log('BootScene init called');
    this.isLoading = false;
    this.assetLoadCount = 0;
    this.assetsLoaded = false;
    this.fallbackAssetsCreated = false;
  }

  preload(): void {
    console.log('BootScene preload started');
    this.isLoading = true;

    // Set up error handling for asset loading
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.error(`Error loading asset: ${file.key} (${file.url})`, file);
      // Continue loading other assets
      this.assetLoadCount++;
      
      // If too many errors, create fallback assets
      if (!this.fallbackAssetsCreated && this.assetLoadCount >= 3) {
        this.createFallbackAssets();
      }
    });

    // Create loading UI elements
    this.createLoadingUI();

    // Listen for progress events
    this.load.on('progress', (value: number) => {
      if (this.progressBar) {
        this.progressBar.clear();
        this.progressBar.fillStyle(0xff3b3b, 1);
        this.progressBar.fillRect(
          this.cameras.main.width / 4,
          this.cameras.main.height / 2 - 15,
          (this.cameras.main.width / 2) * value,
          30
        );
      }
      
      if (this.loadingText) {
        this.loadingText.setText(`Loading... ${Math.floor(value * 100)}%`);
      }
    });

    // When all assets are loaded
    this.load.on('complete', () => {
      console.log('All assets loaded');
      this.assetsLoaded = true;
      if (this.progressBar) this.progressBar.destroy();
      if (this.progressBox) this.progressBox.destroy();
      if (this.loadingText) this.loadingText.destroy();
      
      // Proceed to the next scene
      this.startGame();
    });

    // Load essential assets with error handling
    this.safeLoadAssets();
  }
  
  create(): void {
    console.log('BootScene create called');
    
    // If loading failed, create fallback assets
    if (!this.assetsLoaded && !this.fallbackAssetsCreated) {
      this.createFallbackAssets();
    }
    
    // Start the game (main menu) if not already started in preload
    if (!this.isLoading) {
      this.startGame();
    }
    
    // Notify that the boot scene is ready
    eventBus.publish(GameEvents.SCENE_CHANGED, 'BootScene');
  }
  
  private safeLoadAssets(): void {
    try {
      // Load essential assets with try-catch
      try {
        // Try to load the loading screen image first
        this.load.svg('loading', 'assets/images/loading.svg');
        this.load.svg('player', 'assets/images/player.svg');
      } catch (e) {
        console.error('Error loading initial assets:', e);
        // Create fallback assets if loading fails
        this.createFallbackAssets();
      }
      
      // Background
      this.load.image('background', 'assets/images/background.png');
      
      // Essential UI elements
      this.load.image('ui-frame', 'assets/images/ui-frame.png');
      this.load.image('button', 'assets/images/button.png');
      
      // Start loading in background
      this.load.start();
    } catch (e) {
      console.error('Error in safeLoadAssets:', e);
      this.createFallbackAssets();
    }
  }
  
  private createLoadingUI(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Create loading box
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(width / 4, height / 2 - 15, width / 2, 30);
    
    // Create progress bar (empty initially)
    this.progressBar = this.add.graphics();
    
    // Loading text
    this.loadingText = this.add.text(width / 2, height / 2 - 35, 'Loading...', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff'
    });
    this.loadingText.setOrigin(0.5, 0.5);
    
    // Game title above loading bar
    const titleText = this.add.text(width / 2, height / 3, 'THE GETAWAY', {
      fontFamily: 'monospace',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#ff3b3b'
    });
    titleText.setOrigin(0.5, 0.5);
  }
  
  private createFallbackAssets(): void {
    if (this.fallbackAssetsCreated) return;
    
    console.log('Creating fallback assets');
    this.fallbackAssetsCreated = true;
    
    // Create a blank texture for missing assets
    const graphics = this.add.graphics({ x: 0, y: 0 });
    
    // Create a missing texture indicator
    graphics.fillStyle(0x333333);
    graphics.fillRect(0, 0, 64, 64);
    graphics.lineStyle(2, 0xff0000);
    graphics.strokeRect(1, 1, 62, 62);
    graphics.lineTo(62, 62);
    graphics.moveTo(1, 62);
    graphics.lineTo(62, 1);
    graphics.generateTexture('missing-asset', 64, 64);
    
    // Create a proper player texture with multiple frames
    this.createPlayerSpritesheet(graphics);
    
    // Create button texture
    graphics.clear();
    graphics.fillStyle(0x444444);
    graphics.fillRect(0, 0, 200, 50);
    graphics.lineStyle(2, 0xff3b3b);
    graphics.strokeRect(0, 0, 200, 50);
    graphics.generateTexture('button', 200, 50);
    
    // UI frame
    graphics.clear();
    graphics.fillStyle(0x333333);
    graphics.fillRect(0, 0, 400, 300);
    graphics.lineStyle(2, 0xff3b3b);
    graphics.strokeRect(0, 0, 400, 300);
    graphics.generateTexture('ui-frame', 400, 300);
    
    // Background
    graphics.clear();
    graphics.fillStyle(0x111111);
    graphics.fillRect(0, 0, 800, 600);
    
    // Add some grid lines for visual reference
    graphics.lineStyle(1, 0x222222);
    for (let i = 0; i < 800; i += 40) {
      graphics.moveTo(i, 0);
      graphics.lineTo(i, 600);
    }
    for (let i = 0; i < 600; i += 40) {
      graphics.moveTo(0, i);
      graphics.lineTo(800, i);
    }
    
    graphics.generateTexture('background', 800, 600);
    graphics.destroy();
    
    // Create the animation data for the player
    this.createPlayerAnimations();
    
    // Notify that we're using fallback assets
    console.log('Using fallback assets due to loading errors');
  }
  
  /**
   * Creates a proper player spritesheet with multiple frames
   */
  private createPlayerSpritesheet(graphics: Phaser.GameObjects.Graphics): void {
    // Create a larger canvas for the spritesheet (5 frames side by side)
    const frameWidth = 32;
    const frameHeight = 32;
    const frames = 5;
    const sheetWidth = frameWidth * frames;
    
    graphics.clear();
    
    // Background color (transparent)
    graphics.fillStyle(0x000000, 0);
    graphics.fillRect(0, 0, sheetWidth, frameHeight);
    
    // Draw frame 0 (idle)
    let x = 0;
    graphics.fillStyle(0x3333ff); // Blue base
    graphics.fillRect(x + 8, 4, 16, 24); // Body
    graphics.fillStyle(0xffffff);
    graphics.fillRect(x + 10, 8, 4, 4); // Left eye
    graphics.fillRect(x + 18, 8, 4, 4); // Right eye
    graphics.fillRect(x + 12, 16, 8, 2); // Mouth
    
    // Draw frame 1 (walk 1)
    x = frameWidth;
    graphics.fillStyle(0x3333ff);
    graphics.fillRect(x + 8, 4, 16, 24); // Body
    graphics.fillRect(x + 6, 20, 4, 8); // Left leg extended
    graphics.fillRect(x + 22, 16, 4, 8); // Right leg back
    graphics.fillStyle(0xffffff);
    graphics.fillRect(x + 10, 8, 4, 4); // Left eye
    graphics.fillRect(x + 18, 8, 4, 4); // Right eye
    graphics.fillRect(x + 12, 16, 8, 2); // Mouth
    
    // Draw frame 2 (walk 2)
    x = frameWidth * 2;
    graphics.fillStyle(0x3333ff);
    graphics.fillRect(x + 8, 4, 16, 24); // Body
    graphics.fillRect(x + 6, 16, 4, 8); // Left leg back
    graphics.fillRect(x + 22, 20, 4, 8); // Right leg extended
    graphics.fillStyle(0xffffff);
    graphics.fillRect(x + 10, 8, 4, 4); // Left eye
    graphics.fillRect(x + 18, 8, 4, 4); // Right eye
    graphics.fillRect(x + 12, 16, 8, 2); // Mouth
    
    // Draw frame 3 (hurt)
    x = frameWidth * 3;
    graphics.fillStyle(0xff3333); // Red tint for hurt
    graphics.fillRect(x + 8, 4, 16, 24); // Body
    graphics.fillStyle(0xffffff);
    graphics.fillRect(x + 10, 8, 4, 4); // Left eye (x)
    graphics.fillRect(x + 18, 8, 4, 4); // Right eye (x)
    graphics.fillRect(x + 12, 18, 8, 2); // Mouth (frown)
    
    // Draw frame 4 (dead)
    x = frameWidth * 4;
    graphics.fillStyle(0x3333ff);
    graphics.fillRect(x + 8, 4, 16, 24); // Body (rotated)
    graphics.rotate(0.2); // Tilt slightly
    graphics.fillStyle(0xffffff);
    graphics.fillRect(x + 10, 8, 4, 2); // Left eye (closed)
    graphics.fillRect(x + 18, 8, 4, 2); // Right eye (closed)
    graphics.fillRect(x + 12, 18, 8, 2); // Mouth (flat)
    graphics.rotate(-0.2); // Reset rotation
    
    // Generate the complete spritesheet texture
    graphics.generateTexture('player-texture', sheetWidth, frameHeight);
    
    // Also create a simpler fallback in case animation systems encounter issues
    graphics.clear();
    graphics.fillStyle(0x3333ff);
    graphics.fillRect(0, 0, 32, 32);
    graphics.fillStyle(0xffffff);
    graphics.fillRect(8, 8, 4, 4); // Eye
    graphics.fillRect(20, 8, 4, 4); // Eye
    graphics.fillRect(12, 18, 8, 2); // Mouth
    graphics.generateTexture('player', 32, 32);
  }
  
  /**
   * Creates animations from the spritesheet
   */
  private createPlayerAnimations(): void {
    // Make sure the animation factory is ready
    if (!this.anims) {
      console.warn('Animation factory not ready');
      return;
    }
    
    try {
      // Idle animation
      this.anims.create({
        key: 'player-idle',
        frames: this.anims.generateFrameNumbers('player-texture', { start: 0, end: 0 }),
        frameRate: 10,
        repeat: -1
      });
      
      // Walk animation
      this.anims.create({
        key: 'player-walk',
        frames: this.anims.generateFrameNumbers('player-texture', { frames: [1, 0, 2, 0] }),
        frameRate: 8,
        repeat: -1
      });
      
      // Run animation
      this.anims.create({
        key: 'player-run',
        frames: this.anims.generateFrameNumbers('player-texture', { frames: [1, 0, 2, 0] }),
        frameRate: 12,
        repeat: -1
      });
      
      // Hurt animation
      this.anims.create({
        key: 'player-hurt',
        frames: this.anims.generateFrameNumbers('player-texture', { frames: [3, 0] }),
        frameRate: 8,
        repeat: 0
      });
      
      // Death animation
      this.anims.create({
        key: 'player-death',
        frames: this.anims.generateFrameNumbers('player-texture', { frames: [3, 4] }),
        frameRate: 4,
        repeat: 0
      });
      
      // Create other game animations as needed
      
      console.log('Player animations created successfully in BootScene');
    } catch (e) {
      console.error('Error creating animations in BootScene:', e);
    }
  }
  
  private startGame(): void {
    this.isLoading = false;
    
    console.log('Starting game (transitioning to MainMenuScene)');
    
    // Try to start the main menu scene, with fallbacks
    try {
      // First check if MainMenuScene exists
      if (this.scene.get('MainMenuScene')) {
        this.scene.start('MainMenuScene');
      }
      // Try PhaserMainMenuScene as an alternative
      else if (this.scene.get('PhaserMainMenuScene')) {
        this.scene.start('PhaserMainMenuScene');
      }
      // If all else fails, use WorldScene
      else if (this.scene.get('WorldScene')) {
        this.scene.start('WorldScene');
      } else {
        console.error('No valid scene found to transition to');
        
        // Create a simple main menu scene on the fly as a last resort
        this.createEmergencyMainMenu();
      }
    } catch (e) {
      console.error('Error starting next scene:', e);
      // Create emergency menu as fallback
      this.createEmergencyMainMenu();
    }
  }
  
  private createEmergencyMainMenu(): void {
    console.log('Creating emergency main menu');
    
    // Clear existing objects
    this.children.removeAll();
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Add a background
    this.add.rectangle(0, 0, width, height, 0x000000)
      .setOrigin(0, 0);
    
    // Title
    this.add.text(width / 2, height / 4, 'THE GETAWAY', {
      fontFamily: 'monospace',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ff3b3b'
    }).setOrigin(0.5);
    
    // Sub-title
    this.add.text(width / 2, height / 4 + 50, 'Emergency Mode', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Start game button
    const startButton = this.add.rectangle(width / 2, height / 2, 200, 50, 0x333333)
      .setInteractive({ useHandCursor: true });
    
    const startText = this.add.text(width / 2, height / 2, 'START GAME', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Button hover effects
    startButton.on('pointerover', () => {
      startButton.fillColor = 0x444444;
    });
    
    startButton.on('pointerout', () => {
      startButton.fillColor = 0x333333;
    });
    
    // Start the world scene on click
    startButton.on('pointerdown', () => {
      if (this.scene.get('WorldScene')) {
        this.scene.start('WorldScene');
      } else {
        alert('Unable to start game. Please refresh the page.');
      }
    });
    
    // Notify that the emergency menu is ready
    eventBus.publish(GameEvents.SCENE_CHANGED, 'EmergencyMenu');
  }
} 