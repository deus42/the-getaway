import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Title text
    const titleText = this.add.text(width / 2, height / 4, 'THE GETAWAY', { 
      fontFamily: 'Arial Black',
      fontSize: '64px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8,
      shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 2, stroke: true, fill: true }
    });
    titleText.setOrigin(0.5);

    // Subtitle
    const subtitleText = this.add.text(width / 2, height / 4 + 70, 'Escape from Tyranny', { 
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#cccccc'
    });
    subtitleText.setOrigin(0.5);

    // Year text
    const yearText = this.add.text(width / 2, height / 4 + 110, '2036', { 
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#999999'
    });
    yearText.setOrigin(0.5);

    // Menu items array
    const menuItems = [
      { text: 'Start Game', scene: 'WorldScene' },
      { text: 'Options', scene: null },
      { text: 'Credits', scene: null }
    ];

    // Create menu items
    menuItems.forEach((item, index) => {
      const y = height / 2 + index * 60;
      
      const menuItem = this.add.text(width / 2, y, item.text, { 
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#ffffff'
      });
      
      menuItem.setOrigin(0.5);
      menuItem.setInteractive({ useHandCursor: true });
      
      // Hover effects
      menuItem.on('pointerover', () => {
        menuItem.setStyle({ color: '#ff0000' });
      });
      
      menuItem.on('pointerout', () => {
        menuItem.setStyle({ color: '#ffffff' });
      });
      
      // Click handler
      menuItem.on('pointerdown', () => {
        if (item.scene) {
          this.scene.start(item.scene);
        } else {
          // For unimplemented options, just show a text notification
          this.showNotification(`${item.text} - Not yet implemented`);
        }
      });
    });

    // Version text
    const versionText = this.add.text(width - 20, height - 20, 'v0.1 - Alpha', { 
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#666666'
    });
    versionText.setOrigin(1);

    // Create a background atmosphere with dark gradient
    const graphics = this.add.graphics();
    
    // Using a solid color instead of gradient since createLinearGradient isn't supported
    graphics.fillStyle(0x000033, 1);
    graphics.fillRect(0, 0, width, height);
    graphics.setDepth(-1);
  }

  private showNotification(message: string): void {
    const notification = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height - 100,
      message,
      { 
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 10, y: 5 }
      }
    );
    notification.setOrigin(0.5);
    
    // Fade out and destroy after 2 seconds
    this.tweens.add({
      targets: notification,
      alpha: 0,
      duration: 1000,
      delay: 2000,
      onComplete: () => {
        notification.destroy();
      }
    });
  }
} 