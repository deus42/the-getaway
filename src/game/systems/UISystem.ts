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
    // Background
    const healthBg = this.scene.add.rectangle(20, 20, 200, 20, 0x000000, 0.7);
    healthBg.setOrigin(0);
    healthBg.setStrokeStyle(1, 0xffffff);
    
    // Health bar
    this.healthBar = this.scene.add.graphics();
    this.updateHealthBar();
    
    // Icon and label
    const healthIcon = this.scene.add.text(10, 20, '❤️', { fontSize: '16px' });
    healthIcon.setOrigin(0, 0.5);
    
    const healthLabel = this.scene.add.text(230, 20, 'Health', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ff3b3b'
    });
    healthLabel.setOrigin(0, 0.5);
    
    // Add to container
    this.container.add([healthBg, this.healthBar, healthIcon, healthLabel]);
  }
  
  private createStaminaBar(): void {
    // Background
    const staminaBg = this.scene.add.rectangle(20, 50, 200, 10, 0x000000, 0.7);
    staminaBg.setOrigin(0);
    staminaBg.setStrokeStyle(1, 0xffffff);
    
    // Stamina bar
    this.staminaBar = this.scene.add.graphics();
    this.updateStaminaBar();
    
    // Icon and label
    const staminaIcon = this.scene.add.text(10, 50, '⚡', { fontSize: '14px' });
    staminaIcon.setOrigin(0, 0.5);
    
    const staminaLabel = this.scene.add.text(230, 50, 'Stamina', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffcc00'
    });
    staminaLabel.setOrigin(0, 0.5);
    
    // Add to container
    this.container.add([staminaBg, this.staminaBar, staminaIcon, staminaLabel]);
  }
  
  private createMinimap(): void {
    // Minimap background
    const minimapBg = this.scene.add.rectangle(
      this.scene.cameras.main.width - 120, 
      120, 
      200, 
      200, 
      0x000000, 
      0.7
    );
    minimapBg.setOrigin(0.5);
    minimapBg.setStrokeStyle(2, 0xff3b3b);
    
    // Minimap
    this.minimap = this.scene.add.graphics();
    this.updateMinimap();
    
    // Add to container
    this.container.add([minimapBg, this.minimap]);
  }
  
  private createLocationDisplay(): void {
    // Location text
    this.locationText = this.scene.add.text(
      this.scene.cameras.main.width / 2, 
      20, 
      'Miami Underground - 2036', 
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#00000080',
        padding: { x: 10, y: 5 }
      }
    );
    this.locationText.setOrigin(0.5, 0);
    
    // Add to container
    this.container.add(this.locationText);
  }
  
  private createObjectiveDisplay(): void {
    // Objective text
    this.objectiveText = this.scene.add.text(
      this.scene.cameras.main.width - 20, 
      80, 
      'Objective: Find the resistance', 
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ffffff',
        align: 'right',
        backgroundColor: '#00000080',
        padding: { x: 10, y: 5 }
      }
    );
    this.objectiveText.setOrigin(1, 0);
    
    // Add to container
    this.container.add(this.objectiveText);
  }
  
  public update(): void {
    this.updateHealthBar();
    this.updateStaminaBar();
    this.updateMinimap();
  }
  
  private updateHealthBar(): void {
    const health = this.player.getHealth();
    
    // Clear and redraw health bar
    this.healthBar.clear();
    this.healthBar.fillStyle(0xff3b3b, 1);
    this.healthBar.fillRect(20, 20, 200 * (health / 100), 20);
    
    // Add danger effect when health is low
    if (health < 25) {
      this.healthBar.fillStyle(0xff0000, Math.sin(this.scene.time.now / 200) * 0.3 + 0.7);
      this.healthBar.fillRect(20, 20, 200 * (health / 100), 20);
    }
  }
  
  private updateStaminaBar(): void {
    const stamina = this.player.getStamina();
    
    // Clear and redraw stamina bar
    this.staminaBar.clear();
    this.staminaBar.fillStyle(0xffcc00, 1);
    this.staminaBar.fillRect(20, 50, 200 * (stamina / 100), 10);
  }
  
  private updateMinimap(): void {
    // This would be implemented with actual game world data
    // For now, we'll just create a simple placeholder
    this.minimap.clear();
    
    // Draw a simple minimap representation
    this.minimap.fillStyle(0x333333);
    this.minimap.fillRect(
      this.scene.cameras.main.width - 120 - 90, 
      120 - 90, 
      180, 
      180
    );
    
    // Draw obstacles on the minimap (simulated)
    this.minimap.fillStyle(0x555555);
    this.minimap.fillRect(
      this.scene.cameras.main.width - 120 - 60, 
      120 - 70, 
      40, 
      80
    );
    this.minimap.fillRect(
      this.scene.cameras.main.width - 120 + 30, 
      120 - 20, 
      60, 
      40
    );
    this.minimap.fillRect(
      this.scene.cameras.main.width - 120 - 40, 
      120 + 50, 
      70, 
      30
    );
    
    // Draw player position
    this.minimap.fillStyle(0xff3b3b);
    this.minimap.fillCircle(
      this.scene.cameras.main.width - 120, 
      120, 
      5
    );
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