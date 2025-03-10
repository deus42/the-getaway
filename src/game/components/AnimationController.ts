import Phaser from 'phaser';
import { PlayerState } from './PlayerStateMachine';

/**
 * Manages animations for game entities
 */
export class AnimationController {
  private entity: Phaser.GameObjects.Sprite;
  private scene: Phaser.Scene;
  private currentAnimation: string | null = null;
  private animationsRegistered: boolean = false;
  
  /**
   * Creates a new animation controller
   * @param entity Entity to animate
   * @param scene Scene context
   */
  constructor(entity: Phaser.GameObjects.Sprite, scene: Phaser.Scene) {
    this.entity = entity;
    this.scene = scene;
  }
  
  /**
   * Register all animations with the scene
   */
  public registerAnimations(): void {
    if (this.animationsRegistered) return;
    
    // Define player animations - in a full game, these would be loaded from spritesheet
    // Since we're using a basic texture, we'll create simple animations
    
    // Idle animation
    this.scene.anims.create({
      key: 'player-idle',
      frames: [{ key: 'player-texture', frame: 0 }],
      frameRate: 10,
      repeat: -1
    });
    
    // Walking animation
    this.scene.anims.create({
      key: 'player-walk',
      frames: [{ key: 'player-texture', frame: 0 }],
      frameRate: 10,
      repeat: -1
    });
    
    // Running animation
    this.scene.anims.create({
      key: 'player-run',
      frames: [{ key: 'player-texture', frame: 0 }],
      frameRate: 15,
      repeat: -1
    });
    
    // Hurt animation
    this.scene.anims.create({
      key: 'player-hurt',
      frames: [{ key: 'player-texture', frame: 0 }],
      frameRate: 10,
      repeat: 0
    });
    
    // Death animation
    this.scene.anims.create({
      key: 'player-death',
      frames: [{ key: 'player-texture', frame: 0 }],
      frameRate: 5,
      repeat: 0
    });
    
    // Interaction animation
    this.scene.anims.create({
      key: 'player-interact',
      frames: [{ key: 'player-texture', frame: 0 }],
      frameRate: 10,
      repeat: 0
    });
    
    this.animationsRegistered = true;
  }
  
  /**
   * Update animations based on current state
   * @param state Current entity state
   */
  public update(state: PlayerState): void {
    let animationKey: string;
    
    // Determine which animation to play based on state
    switch (state) {
      case PlayerState.IDLE:
        animationKey = 'player-idle';
        break;
      case PlayerState.WALKING:
        animationKey = 'player-walk';
        break;
      case PlayerState.RUNNING:
        animationKey = 'player-run';
        break;
      case PlayerState.INTERACTING:
        animationKey = 'player-interact';
        break;
      case PlayerState.DEAD:
        animationKey = 'player-death';
        break;
      default:
        animationKey = 'player-idle';
    }
    
    // Only change animation if it's different
    if (this.currentAnimation !== animationKey) {
      this.entity.play(animationKey);
      this.currentAnimation = animationKey;
    }
  }
  
  /**
   * Play an animation once
   * @param key Animation key
   * @param callback Optional callback when animation completes
   */
  public playOnce(key: string, callback?: () => void): void {
    if (!this.animationsRegistered) {
      console.warn('Animations not registered yet');
      return;
    }
    
    const animKey = `player-${key}`;
    this.entity.play(animKey);
    this.currentAnimation = animKey;
    
    if (callback) {
      this.entity.once(Phaser.Animations.Events.ANIMATION_COMPLETE, callback);
    }
  }
  
  /**
   * Set breathing animation - for use with idle states
   * @param enabled Whether to enable breathing
   */
  public setBreathingEffect(enabled: boolean): void {
    if (enabled) {
      // Create a subtle breathing effect when idle
      this.scene.tweens.add({
        targets: this.entity,
        scaleY: { from: 1, to: 1.05 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } else {
      // Stop breathing effect
      this.scene.tweens.killTweensOf(this.entity);
    }
  }
  
  /**
   * Play a specific frame
   * @param frameName Frame to display
   */
  public setFrame(frameName: string | number): void {
    this.entity.setFrame(frameName);
  }
} 