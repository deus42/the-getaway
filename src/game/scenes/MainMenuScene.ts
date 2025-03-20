import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  private startButton: Phaser.GameObjects.Container | null = null;
  private titleText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create a modern-looking background with dystopian theme
    this.createBackground(width, height);
    
    // Add game title with dystopian styling to match React app
    this.titleText = this.add.text(width / 2, height * 0.25, 'THE GETAWAY', {
      fontFamily: 'monospace',
      fontSize: '64px',
      color: '#ff3b3b', // Match primary color
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
      shadow: { color: '#ff0000', blur: 10, offsetX: 2, offsetY: 2, fill: true }
    });
    this.titleText.setOrigin(0.5);
    
    // Add subtitle and year to match React app
    const subtitleText = this.add.text(width / 2, height * 0.35, 'Escape from Tyranny', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#dddddd',
      fontStyle: 'italic'
    });
    subtitleText.setOrigin(0.5);
    
    // Add year
    const yearText = this.add.text(width / 2, height * 0.40, '2036', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#999999'
    });
    yearText.setOrigin(0.5);
    
    // Create stylish buttons to match React app
    this.createButtons(width, height);
    
    // Add version text with better styling
    const versionText = this.add.text(
      width - 20, 
      height - 20, 
      'v0.1.0-alpha', 
      { 
        fontFamily: 'monospace', 
        fontSize: '12px', 
        color: '#666666' 
      }
    );
    versionText.setOrigin(1);
    
    // Add a pulsating effect to the title
    this.tweens.add({
      targets: this.titleText,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Add grid overlay for cyberpunk feel to match React app
    this.createGridOverlay(width, height);
  }

  private createBackground(width: number, height: number): void {
    // Main background with dark color to match React app
    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(0x030303, 1); // Match the bg-background color
    bgGraphics.fillRect(0, 0, width, height);
    
    // Create dynamic backdrop with moving elements - more subtle and matching React app theme
    for (let i = 0; i < 8; i++) {
      const size = Phaser.Math.Between(100, 300);
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const alpha = Phaser.Math.FloatBetween(0.05, 0.1);
      
      const rect = this.add.rectangle(x, y, size, size, 0xff3b3b, alpha); // Match primary color
      rect.setOrigin(0.5);
      
      this.tweens.add({
        targets: rect,
        angle: '+=360',
        duration: Phaser.Math.Between(20000, 30000),
        repeat: -1,
        ease: 'Linear'
      });
      
      this.tweens.add({
        targets: rect,
        x: rect.x + Phaser.Math.Between(-200, 200),
        y: rect.y + Phaser.Math.Between(-200, 200),
        duration: Phaser.Math.Between(20000, 30000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }
  
  private createGridOverlay(width: number, height: number): void {
    // Create grid overlay similar to React app
    const gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, 0xff3b3b, 0.2);
    
    // Horizontal lines
    const gridSize = 80;
    for (let y = 0; y < height; y += gridSize) {
      gridGraphics.moveTo(0, y);
      gridGraphics.lineTo(width, y);
    }
    
    // Vertical lines
    for (let x = 0; x < width; x += gridSize) {
      gridGraphics.moveTo(x, 0);
      gridGraphics.lineTo(x, height);
    }
    
    gridGraphics.strokePath();
    gridGraphics.setAlpha(0.2);
  }
  
  private createButtons(width: number, height: number): void {
    // Create the New Game button - match React app naming
    this.startButton = this.add.container(width / 2, height * 0.6);
    
    const buttonBg = this.add.rectangle(0, 0, 220, 60, 0x333333, 0.8);
    buttonBg.setStrokeStyle(2, 0xff3b3b); // Match primary color
    buttonBg.setOrigin(0.5);
    
    const buttonHighlight = this.add.rectangle(0, 0, 220, 60, 0xff3b3b, 0); // Match primary color
    buttonHighlight.setOrigin(0.5);
    
    const buttonText = this.add.text(0, 0, 'New Game', { // Match React app button text
      fontFamily: 'monospace', // Match React app font
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    buttonText.setOrigin(0.5);
    
    this.startButton.add([buttonBg, buttonHighlight, buttonText]);
    
    // Make the button interactive
    buttonBg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        buttonHighlight.fillColor = 0xff3b3b; // Match primary color
        buttonHighlight.fillAlpha = 0.3;
        buttonText.setScale(1.1);
      })
      .on('pointerout', () => {
        buttonHighlight.fillAlpha = 0;
        buttonText.setScale(1);
      })
      .on('pointerdown', () => {
        buttonHighlight.fillAlpha = 0.5;
      })
      .on('pointerup', () => {
        this.showNotification('Starting new game...');
        
        // Add a short delay to see the notification
        this.time.delayedCall(1000, () => {
          this.scene.start('WorldScene');
        });
      });
    
    // Add options button
    const optionsButton = this.createSimpleButton(width / 2, height * 0.7, 'Options'); // Match React app naming
    optionsButton.on('pointerup', () => {
      this.showNotification('Options menu coming soon!');
    });
    
    // Add credits button
    const creditsButton = this.createSimpleButton(width / 2, height * 0.8, 'Credits'); // Match React app naming
    creditsButton.on('pointerup', () => {
      this.showNotification('Created for "The Getaway" - A dystopian adventure');
    });
    
    // Add return to main menu button
    const mainMenuButton = this.createSimpleButton(width / 2, height * 0.9, 'Return to Main Menu');
    mainMenuButton.on('pointerup', () => {
      // This will redirect back to the React app's main menu
      window.location.href = '/';
    });
  }
  
  private createSimpleButton(x: number, y: number, text: string): Phaser.GameObjects.Rectangle {
    const buttonContainer = this.add.container(x, y);
    
    const buttonBg = this.add.rectangle(0, 0, 220, 50, 0x222222, 0.7);
    buttonBg.setStrokeStyle(1, 0x444444);
    buttonBg.setOrigin(0.5);
    buttonBg.setInteractive({ useHandCursor: true });
    
    const buttonText = this.add.text(0, 0, text, {
      fontFamily: 'monospace', // Match React app font
      fontSize: '20px',
      color: '#cccccc'
    });
    buttonText.setOrigin(0.5);
    
    buttonContainer.add([buttonBg, buttonText]);
    
    // Add hover effects
    buttonBg.on('pointerover', () => {
      buttonBg.fillColor = 0x333333;
      buttonText.setColor('#ffffff');
      // Add slight translation for hover effect like React app
      buttonContainer.y -= 2;
    })
    .on('pointerout', () => {
      buttonBg.fillColor = 0x222222;
      buttonText.setColor('#cccccc');
      // Return to original position
      buttonContainer.y += 2;
    });
    
    return buttonBg;
  }

  private showNotification(message: string): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const notificationBox = this.add.container(width / 2, height * 0.9);
    
    const boxBg = this.add.rectangle(0, 0, width * 0.7, 60, 0x000000, 0.7);
    boxBg.setOrigin(0.5);
    boxBg.setStrokeStyle(1, 0xffffff);
    
    const boxText = this.add.text(0, 0, message, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      align: 'center'
    });
    boxText.setOrigin(0.5);
    
    notificationBox.add([boxBg, boxText]);
    
    // Add a fade-in and fade-out effect
    notificationBox.alpha = 0;
    this.tweens.add({
      targets: notificationBox,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: notificationBox,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
              notificationBox.destroy();
            }
          });
        });
      }
    });
  }
} 