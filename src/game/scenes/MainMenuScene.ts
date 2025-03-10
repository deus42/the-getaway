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

    // Create a modern-looking background
    this.createBackground(width, height);
    
    // Add game title with stylish text
    this.titleText = this.add.text(width / 2, height * 0.25, 'THE GETAWAY', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '64px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: { color: '#000000', blur: 10, offsetX: 2, offsetY: 2, fill: true }
    });
    this.titleText.setOrigin(0.5);
    
    // Add subtitle text
    const subtitleText = this.add.text(width / 2, height * 0.35, 'A Tale of Resistance and Survival', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#cccccc',
      fontStyle: 'italic'
    });
    subtitleText.setOrigin(0.5);
    
    // Create stylish buttons
    this.createButtons(width, height);
    
    // Add version text with better styling
    const versionText = this.add.text(
      width - 20, 
      height - 20, 
      'Version 0.1.0', 
      { 
        fontFamily: 'monospace', 
        fontSize: '16px', 
        color: '#888888' 
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
  }

  private createBackground(width: number, height: number): void {
    // Main background with gradient effect
    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(0x0a0a20, 1);
    bgGraphics.fillRect(0, 0, width, height);
    
    // Create dynamic backdrop with moving elements
    for (let i = 0; i < 10; i++) {
      const size = Phaser.Math.Between(50, 150);
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const alpha = Phaser.Math.FloatBetween(0.05, 0.15);
      
      const rect = this.add.rectangle(x, y, size, size, 0x2233aa, alpha);
      rect.setOrigin(0.5);
      
      this.tweens.add({
        targets: rect,
        angle: '+=360',
        duration: Phaser.Math.Between(10000, 20000),
        repeat: -1,
        ease: 'Linear'
      });
      
      this.tweens.add({
        targets: rect,
        x: rect.x + Phaser.Math.Between(-200, 200),
        y: rect.y + Phaser.Math.Between(-200, 200),
        duration: Phaser.Math.Between(8000, 15000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }
  
  private createButtons(width: number, height: number): void {
    // Create the start button
    this.startButton = this.add.container(width / 2, height * 0.6);
    
    const buttonBg = this.add.rectangle(0, 0, 220, 60, 0x333333, 0.8);
    buttonBg.setStrokeStyle(2, 0x6666ff);
    buttonBg.setOrigin(0.5);
    
    const buttonHighlight = this.add.rectangle(0, 0, 220, 60, 0x6666ff, 0);
    buttonHighlight.setOrigin(0.5);
    
    const buttonText = this.add.text(0, 0, 'START GAME', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    buttonText.setOrigin(0.5);
    
    this.startButton.add([buttonBg, buttonHighlight, buttonText]);
    
    // Make the button interactive
    buttonBg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        buttonHighlight.fillColor = 0x6666ff;
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
    const optionsButton = this.createSimpleButton(width / 2, height * 0.7, 'OPTIONS');
    optionsButton.on('pointerup', () => {
      this.showNotification('Options menu coming soon!');
    });
    
    // Add credits button
    const creditsButton = this.createSimpleButton(width / 2, height * 0.8, 'CREDITS');
    creditsButton.on('pointerup', () => {
      this.showNotification('Created for "The Getaway" - A dystopian adventure');
    });
  }
  
  private createSimpleButton(x: number, y: number, text: string): Phaser.GameObjects.Rectangle {
    const buttonContainer = this.add.container(x, y);
    
    const buttonBg = this.add.rectangle(0, 0, 200, 50, 0x222222, 0.7);
    buttonBg.setStrokeStyle(1, 0x4444aa);
    buttonBg.setOrigin(0.5);
    buttonBg.setInteractive({ useHandCursor: true });
    
    const buttonText = this.add.text(0, 0, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#cccccc'
    });
    buttonText.setOrigin(0.5);
    
    buttonContainer.add([buttonBg, buttonText]);
    
    // Add hover effects
    buttonBg.on('pointerover', () => {
      buttonBg.fillColor = 0x333344;
      buttonText.setColor('#ffffff');
    })
    .on('pointerout', () => {
      buttonBg.fillColor = 0x222222;
      buttonText.setColor('#cccccc');
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