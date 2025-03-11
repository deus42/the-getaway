import Phaser from 'phaser';
import { Player } from '../entities/Player';

export class UISystem {
  private scene: Phaser.Scene;
  private player: Player;
  
  // UI elements
  private container!: Phaser.GameObjects.Container;
  private healthBar!: Phaser.GameObjects.Graphics;
  private staminaBar!: Phaser.GameObjects.Graphics;
  private minimap!: Phaser.GameObjects.Graphics;
  private locationText!: Phaser.GameObjects.Text;
  private objectiveText!: Phaser.GameObjects.Text;
  private notificationQueue: { text: string, duration: number }[] = [];
  private activeNotification: Phaser.GameObjects.Text | null = null;
  private notificationTimer: Phaser.Time.TimerEvent | null = null;
  
  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    
    // Create UI container
    this.container = scene.add.container(0, 0);
    this.container.setDepth(100);
    this.container.setScrollFactor(0);
    
    // Create UI elements
    this.createHealthBar();
    this.createStaminaBar();
    this.createMinimap();
    this.createLocationDisplay();
    this.createObjectiveDisplay();
  }
  
  private createHealthBar(): void {
    // Create styled container
    const healthContainer = this.scene.add.container(20, 20);
    
    // Background with scanlines effect
    const healthBg = this.scene.add.rectangle(0, 0, 200, 30, 0x000000, 0.5);
    healthBg.setOrigin(0);
    healthBg.setStrokeStyle(2, 0xff3b3b);
    
    // Add scanlines overlay
    const scanlines = this.scene.add.image(0, 0, 'scanlines');
    scanlines.setOrigin(0);
    scanlines.setAlpha(0.1);
    scanlines.setDisplaySize(200, 30);
    
    // Create a red glowing bar
    this.healthBar = this.scene.add.graphics();
    
    // Add label with cyberpunk style
    const healthLabel = this.scene.add.text(10, 15, 'Health', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ff3b3b'
    });
    healthLabel.setOrigin(0, 0.5);
    healthLabel.setShadow(0, 0, '#ff0000', 5);
    
    // Add to container
    healthContainer.add([healthBg, this.healthBar, scanlines, healthLabel]);
    this.container.add(healthContainer);
    
    // Update the initial state
    this.updateHealthBar();
  }
  
  private createStaminaBar(): void {
    // Create styled container
    const staminaContainer = this.scene.add.container(20, 60);
    
    // Background with scanlines effect
    const staminaBg = this.scene.add.rectangle(0, 0, 200, 20, 0x000000, 0.5);
    staminaBg.setOrigin(0);
    staminaBg.setStrokeStyle(2, 0xffcc00);
    
    // Add scanlines overlay
    const scanlines = this.scene.add.image(0, 0, 'scanlines');
    scanlines.setOrigin(0);
    scanlines.setAlpha(0.1);
    scanlines.setDisplaySize(200, 20);
    
    // Create a yellow glowing bar
    this.staminaBar = this.scene.add.graphics();
    
    // Add label with cyberpunk style
    const staminaLabel = this.scene.add.text(10, 10, 'Stamina', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffcc00'
    });
    staminaLabel.setOrigin(0, 0.5);
    staminaLabel.setShadow(0, 0, '#ffaa00', 5);
    
    // Add to container
    staminaContainer.add([staminaBg, this.staminaBar, scanlines, staminaLabel]);
    this.container.add(staminaContainer);
    
    // Update the initial state
    this.updateStaminaBar();
  }
  
  private createMinimap(): void {
    // Container positioned at top-right corner
    const minimapContainer = this.scene.add.container(
      this.scene.cameras.main.width - 150,
      20
    );
    
    // Create styled border
    const minimapBorder = this.scene.add.rectangle(0, 0, 120, 120, 0x000000, 0.7);
    minimapBorder.setOrigin(0);
    minimapBorder.setStrokeStyle(2, 0xff3b3b);
    
    // Create actual minimap graphics
    this.minimap = this.scene.add.graphics();
    this.minimap.setX(0);
    this.minimap.setY(0);
    
    // Create grid lines for the minimap
    const gridGraphics = this.scene.add.graphics();
    gridGraphics.lineStyle(1, 0x333333, 0.5);
    
    // Draw grid lines
    for (let i = 0; i <= 120; i += 20) {
      gridGraphics.moveTo(i, 0);
      gridGraphics.lineTo(i, 120);
      gridGraphics.moveTo(0, i);
      gridGraphics.lineTo(120, i);
    }
    gridGraphics.strokePath();
    
    // Add scanlines effect
    const scanlines = this.scene.add.image(0, 0, 'scanlines');
    scanlines.setOrigin(0);
    scanlines.setAlpha(0.1);
    scanlines.setDisplaySize(120, 120);
    
    // Add minimap label
    const minimapLabel = this.scene.add.text(60, -10, 'TACTICAL MAP', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffffff'
    });
    minimapLabel.setOrigin(0.5, 0);
    
    // Add to container
    minimapContainer.add([minimapBorder, gridGraphics, this.minimap, scanlines, minimapLabel]);
    this.container.add(minimapContainer);
  }
  
  private createLocationDisplay(): void {
    // Container at the top center
    const locationContainer = this.scene.add.container(
      this.scene.cameras.main.width / 2,
      20
    );
    
    // Create a styled background
    const locationBg = this.scene.add.rectangle(0, 0, 300, 40, 0x000000, 0.5);
    locationBg.setOrigin(0.5, 0);
    locationBg.setStrokeStyle(1, 0x666666);
    
    // Location text with style
    this.locationText = this.scene.add.text(0, 20, 'Downtown Miami', {
      fontFamily: 'monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff'
    });
    this.locationText.setOrigin(0.5, 0.5);
    this.locationText.setShadow(0, 0, '#33ccff', 5);
    
    // Add to container
    locationContainer.add([locationBg, this.locationText]);
    this.container.add(locationContainer);
  }
  
  private createObjectiveDisplay(): void {
    // Position in the top right of the minimap
    const objectiveContainer = this.scene.add.container(
      this.scene.cameras.main.width - 150,
      150
    );
    
    // Create a styled background
    const objectiveBg = this.scene.add.rectangle(0, 0, 220, 30, 0x000000, 0.7);
    objectiveBg.setOrigin(0);
    objectiveBg.setStrokeStyle(1, 0xff3b3b);
    
    // Add scanlines overlay
    const scanlines = this.scene.add.image(0, 0, 'scanlines');
    scanlines.setOrigin(0);
    scanlines.setAlpha(0.1);
    scanlines.setDisplaySize(220, 30);
    
    // Objective text with prefix
    const objectivePrefix = this.scene.add.text(10, 15, 'Objective:', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ff3b3b'
    });
    objectivePrefix.setOrigin(0, 0.5);
    
    // Actual objective text
    this.objectiveText = this.scene.add.text(85, 15, 'Find the resistance contact', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff'
    });
    this.objectiveText.setOrigin(0, 0.5);
    
    // Add to container
    objectiveContainer.add([objectiveBg, scanlines, objectivePrefix, this.objectiveText]);
    this.container.add(objectiveContainer);
  }
  
  public update(): void {
    this.updateHealthBar();
    this.updateStaminaBar();
    this.updateMinimap();
  }
  
  private updateHealthBar(): void {
    const health = this.player.getHealth();
    const maxHealth = this.player.getMaxHealth();
    const percentage = Math.max(0, health / maxHealth);
    
    this.healthBar.clear();
    
    // Draw background 
    this.healthBar.fillStyle(0x660000);
    this.healthBar.fillRect(10, 5, 180, 20);
    
    // Draw health bar with gradient
    const color1 = 0xff0000;
    const color2 = 0xff3b3b;
    const width = 180 * percentage;
    
    // Create gradient effect
    this.healthBar.fillStyle(color1);
    this.healthBar.fillRect(10, 5, width, 20);
    
    // Add glow effect
    this.healthBar.fillStyle(color2, 0.3);
    this.healthBar.fillRect(10, 5, width, 5);
    
    // Add segmented bar effect
    this.healthBar.lineStyle(1, 0x000000, 0.3);
    for (let i = 0; i < 9; i++) {
      const x = 10 + (i * 20);
      this.healthBar.lineBetween(x, 5, x, 25);
    }
  }
  
  private updateStaminaBar(): void {
    const stamina = this.player.getStamina();
    const maxStamina = this.player.getMaxStamina();
    const percentage = Math.max(0, stamina / maxStamina);
    
    this.staminaBar.clear();
    
    // Draw background
    this.staminaBar.fillStyle(0x665500);
    this.staminaBar.fillRect(10, 5, 180, 10);
    
    // Draw stamina bar with gradient
    const color1 = 0xffaa00;
    const color2 = 0xffcc00;
    const width = 180 * percentage;
    
    // Create gradient effect
    this.staminaBar.fillStyle(color1);
    this.staminaBar.fillRect(10, 5, width, 10);
    
    // Add glow effect
    this.staminaBar.fillStyle(color2, 0.3);
    this.staminaBar.fillRect(10, 5, width, 3);
    
    // Add segmented bar effect
    this.staminaBar.lineStyle(1, 0x000000, 0.3);
    for (let i = 0; i < 9; i++) {
      const x = 10 + (i * 20);
      this.staminaBar.lineBetween(x, 5, x, 15);
    }
  }
  
  private updateMinimap(): void {
    this.minimap.clear();
    
    // Get scene information
    const worldBounds = this.scene.physics.world.bounds;
    const minimapSize = 120;
    
    // Scale factors to convert world coordinates to minimap
    const scaleX = minimapSize / worldBounds.width;
    const scaleY = minimapSize / worldBounds.height;
    
    // Draw player position
    const playerX = this.player.x * scaleX;
    const playerY = this.player.y * scaleY;
    
    // Player dot with pulsing effect
    const time = this.scene.time.now;
    const pulseScale = 1 + (Math.sin(time / 200) * 0.2);
    const pulseAlpha = 0.7 + (Math.sin(time / 200) * 0.3);
    
    // Draw player indicator with pulsing effects
    this.minimap.fillStyle(0x00ffff, pulseAlpha);
    this.minimap.fillCircle(playerX, playerY, 4 * pulseScale);
    
    this.minimap.fillStyle(0xffffff);
    this.minimap.fillCircle(playerX, playerY, 2);
    
    // Draw field of view indicator
    this.minimap.lineStyle(1, 0x00ffff, 0.3);
    this.minimap.beginPath();
    this.minimap.arc(playerX, playerY, 15, Math.PI * 1.25, Math.PI * 1.75);
    this.minimap.strokePath();
    
    // Draw static building placeholders for the minimap
    // This is more reliable than trying to access physics bodies which may cause typing issues
    this.drawMinimapBuildings(scaleX, scaleY);
    
    // Draw a border around the player's current view area
    const camera = this.scene.cameras.main;
    const viewX = camera.scrollX * scaleX;
    const viewY = camera.scrollY * scaleY;
    const viewWidth = camera.width * scaleX;
    const viewHeight = camera.height * scaleY;
    
    this.minimap.lineStyle(1, 0xff3b3b, 0.8);
    this.minimap.strokeRect(viewX, viewY, viewWidth, viewHeight);
  }
  
  /**
   * Draws simplified building representations on the minimap
   */
  private drawMinimapBuildings(scaleX: number, scaleY: number): void {
    // These would ideally be generated based on actual game data
    // For now, we're using static positions for demonstration
    const buildingPositions = [
      { x: 300, y: 300, width: 100, height: 100 },
      { x: 600, y: 400, width: 150, height: 80 },
      { x: 800, y: 600, width: 120, height: 120 },
      { x: 400, y: 800, width: 130, height: 90 },
      { x: 1000, y: 300, width: 140, height: 110 },
      { x: 1200, y: 900, width: 100, height: 100 },
      { x: 1500, y: 500, width: 90, height: 160 },
      { x: 900, y: 1200, width: 120, height: 100 },
      { x: 1400, y: 1400, width: 110, height: 110 },
      { x: 300, y: 1600, width: 140, height: 80 }
    ];
    
    // Draw each building on the minimap
    buildingPositions.forEach(building => {
      const x = building.x * scaleX;
      const y = building.y * scaleY;
      const width = building.width * scaleX;
      const height = building.height * scaleY;
      
      this.minimap.fillStyle(0x666666, 0.7);
      this.minimap.fillRect(x, y, width, height);
      
      // Add a slight outline to buildings
      this.minimap.lineStyle(1, 0x444444, 0.5);
      this.minimap.strokeRect(x, y, width, height);
    });
  }
  
  public setLocation(locationName: string): void {
    this.locationText.setText(locationName);
    
    // Animate the text
    this.scene.tweens.add({
      targets: this.locationText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 200,
      yoyo: true
    });
  }
  
  public setObjective(objective: string): void {
    this.objectiveText.setText(`Objective: ${objective}`);
    
    // Animate the text
    this.scene.tweens.add({
      targets: this.objectiveText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 200,
      yoyo: true
    });
  }
  
  public showNotification(text: string, duration: number = 3000): void {
    // Add to queue
    this.notificationQueue.push({ text, duration });
    
    // If no notification is active, show the next one
    if (!this.activeNotification) {
      this.showNextNotification();
    }
  }
  
  private showNextNotification(): void {
    // If queue is empty, do nothing
    if (this.notificationQueue.length === 0) {
      this.activeNotification = null;
      return;
    }
    
    // Get the next notification
    const notification = this.notificationQueue.shift();
    if (!notification) return;
    
    // Create the notification text
    this.activeNotification = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height - 100,
      notification.text,
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#00000080',
        padding: { x: 15, y: 10 }
      }
    );
    this.activeNotification.setOrigin(0.5);
    this.activeNotification.setAlpha(0);
    this.activeNotification.setScrollFactor(0);
    this.activeNotification.setDepth(200);
    
    // Add to container
    this.container.add(this.activeNotification);
    
    // Fade in
    this.scene.tweens.add({
      targets: this.activeNotification,
      alpha: 1,
      y: this.scene.cameras.main.height - 120,
      duration: 300,
      ease: 'Power2'
    });
    
    // Set timer to remove the notification
    this.notificationTimer = this.scene.time.delayedCall(notification.duration, () => {
      if (!this.activeNotification) return;
      
      // Fade out
      this.scene.tweens.add({
        targets: this.activeNotification,
        alpha: 0,
        y: this.scene.cameras.main.height - 100,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          if (this.activeNotification) {
            this.activeNotification.destroy();
            this.activeNotification = null;
          }
          
          // Show the next notification
          this.showNextNotification();
        }
      });
    });
  }
  
  public destroy(): void {
    // Clean up resources
    if (this.notificationTimer) {
      this.notificationTimer.remove();
    }
    
    this.container.destroy();
  }
} 