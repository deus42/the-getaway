import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Background
    const background = this.add.rectangle(0, 0, width, height, 0x000000);
    background.setOrigin(0);
    
    // Game Over text
    const gameOverText = this.add.text(width / 2, height / 3, 'GAME OVER', {
      fontFamily: 'Arial Black',
      fontSize: '64px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 6
    });
    gameOverText.setOrigin(0.5);
    
    // Reason text (will be passed as data when starting this scene)
    const reason = this.scene.settings.data?.reason || 'You were captured by the regime.';
    const reasonText = this.add.text(width / 2, height / 2, reason, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: width * 0.8 }
    });
    reasonText.setOrigin(0.5);
    
    // Retry Button
    const retryButton = this.add.text(width / 2, height * 0.65, 'RETRY', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#880000',
      padding: { x: 20, y: 10 }
    });
    retryButton.setOrigin(0.5);
    retryButton.setInteractive({ useHandCursor: true });
    
    retryButton.on('pointerover', () => {
      retryButton.setStyle({ backgroundColor: '#aa0000' });
    });
    
    retryButton.on('pointerout', () => {
      retryButton.setStyle({ backgroundColor: '#880000' });
    });
    
    retryButton.on('pointerdown', () => {
      this.scene.start('WorldScene');
    });
    
    // Main Menu Button
    const menuButton = this.add.text(width / 2, height * 0.75, 'MAIN MENU', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 }
    });
    menuButton.setOrigin(0.5);
    menuButton.setInteractive({ useHandCursor: true });
    
    menuButton.on('pointerover', () => {
      menuButton.setStyle({ backgroundColor: '#555555' });
    });
    
    menuButton.on('pointerout', () => {
      menuButton.setStyle({ backgroundColor: '#333333' });
    });
    
    menuButton.on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });
    
    // Create a blood-like effect using particles (optional)
    const particles = this.add.particles('player');
    const emitter = particles.createEmitter({
      tint: 0xff0000,
      alpha: { start: 1, end: 0 },
      scale: { start: 0.5, end: 1 },
      speed: { min: -100, max: 100 },
      angle: { min: 0, max: 360 },
      gravityY: 0,
      lifespan: 2000,
      blendMode: 'SCREEN',
      frequency: 50,
      emitZone: {
        source: new Phaser.Geom.Rectangle(0, 0, width, height),
        type: 'random',
        quantity: 20
      }
    });
    
    // Play once then stop
    this.time.delayedCall(2000, () => {
      emitter.stop();
    });
  }
} 