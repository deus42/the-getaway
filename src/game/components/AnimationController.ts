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
    
    // First check if we have required texture
    if (!this.checkRequiredTextures()) {
      this.createFallbackTexture();
    }
    
    // Check if animations were already created in BootScene
    if (this.checkAnimationsExist()) {
      console.log('Animations already exist, not creating new ones');
      this.animationsRegistered = true;
      return;
    }
    
    try {
      // Define player animations - in a full game, these would be loaded from spritesheet
      // Since we're using a basic texture, we'll create simple animations
      
      // Get the texture
      const textureKey = this.entity.texture.key;
      const hasFrames = this.scene.textures.get(textureKey).frameTotal > 1;
      
      if (hasFrames) {
        // Use spritesheet frames if available
        this.createAnimationsFromSpritesheet(textureKey);
      } else {
        // Otherwise create simple animations with just frame 0
        this.createAnimation('player-idle', [0], 10);
        this.createAnimation('player-walk', [0], 10);
        this.createAnimation('player-run', [0], 15);
        this.createAnimation('player-hurt', [0], 10, 0);
        this.createAnimation('player-death', [0], 5, 0);
        this.createAnimation('player-interact', [0], 10, 0);
      }
      
      this.animationsRegistered = true;
      console.log('Player animations registered successfully');
    } catch (e) {
      console.error('Error creating animations:', e);
      // Create a fallback texture if animation creation fails
      this.createFallbackTexture();
      // Try once more with the fallback
      this.createFallbackAnimations();
    }
  }
  
  /**
   * Check if all required textures exist
   */
  private checkRequiredTextures(): boolean {
    // Check if player texture exists
    return this.scene.textures.exists('player-texture') || this.scene.textures.exists('player');
  }
  
  /**
   * Create fallback texture for the player
   */
  private createFallbackTexture(): void {
    console.log('Creating fallback player texture');
    
    // Create a simple player texture as fallback
    const graphics = this.scene.add.graphics({ x: 0, y: 0 });
    
    // Blue square for player - simple but functional
    graphics.fillStyle(0x3333ff);
    graphics.fillRect(0, 0, 32, 32);
    
    // Add some details to make it look a bit like a character
    graphics.fillStyle(0xffffff);
    graphics.fillRect(8, 8, 5, 5); // Eye
    graphics.fillRect(19, 8, 5, 5); // Eye
    graphics.fillRect(12, 20, 8, 3); // Mouth
    
    // Generate the texture
    graphics.generateTexture('player-texture', 32, 32);
    graphics.destroy();
    
    // Set the entity's texture if it doesn't have one
    if (this.entity.texture.key === '__MISSING') {
      this.entity.setTexture('player-texture');
    }
  }
  
  /**
   * Create a single animation with error handling
   */
  private createAnimation(key: string, frames: number[], frameRate: number, repeat: number = -1): void {
    try {
      // Get the texture key from the entity
      const textureKey = this.entity.texture.key || 'player-texture';
      
      // Create frame objects from the frame numbers
      const frameObjects = frames.map(frame => ({ key: textureKey, frame }));
      
      // Create the animation
      if (!this.scene.anims.exists(key)) {
        this.scene.anims.create({
          key,
          frames: frameObjects.length > 0 ? frameObjects : [{ key: textureKey, frame: 0 }],
          frameRate,
          repeat
        });
      }
    } catch (e) {
      console.error(`Failed to create animation: ${key}`, e);
    }
  }
  
  /**
   * Create fallback animations
   */
  private createFallbackAnimations(): void {
    console.log('Creating fallback animations');
    
    // Make sure we have a texture to use
    if (!this.scene.textures.exists('player-texture')) {
      this.createFallbackTexture();
    }
    
    // Create basic animations with no frames (single frame)
    const animKeys = [
      'player-idle',
      'player-walk',
      'player-run',
      'player-hurt',
      'player-death',
      'player-interact'
    ];
    
    animKeys.forEach(key => {
      if (!this.scene.anims.exists(key)) {
        this.scene.anims.create({
          key,
          frames: [{ key: 'player-texture', frame: 0 }],
          frameRate: 10,
          repeat: key.includes('hurt') || key.includes('death') ? 0 : -1
        });
      }
    });
    
    this.animationsRegistered = true;
  }
  
  /**
   * Update animations based on current state
   * @param state Current entity state
   */
  public update(state: PlayerState): void {
    // Check if animations are registered
    if (!this.animationsRegistered) {
      try {
        this.registerAnimations();
      } catch (e) {
        console.error('Failed to register animations in update', e);
        return;
      }
    }
    
    // Make sure the entity has a valid texture
    if (this.entity.texture.key === '__MISSING') {
      console.warn('Entity has missing texture, applying fallback');
      this.createFallbackTexture();
      this.createFallbackAnimations();
    }
    
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
    
    // Make sure the animation exists before playing
    if (!this.scene.anims.exists(animationKey)) {
      console.warn(`Animation ${animationKey} not found, creating fallback`);
      this.createAnimation(animationKey, [0], 10);
    }
    
    // Only change animation if it's different and exists
    if (this.currentAnimation !== animationKey) {
      try {
        this.entity.play(animationKey);
        this.currentAnimation = animationKey;
      } catch (e) {
        console.error(`Error playing animation ${animationKey}:`, e);
        // Reset to basic state by just showing the texture with no animation
        this.entity.setTexture(this.entity.texture.key, 0);
      }
    }
  }
  
  /**
   * Play an animation once
   * @param key Animation key
   * @param callback Optional callback when animation completes
   */
  public playOnce(key: string, callback?: () => void): void {
    if (!this.animationsRegistered) {
      console.warn('Animations not registered yet, registering now');
      this.registerAnimations();
    }
    
    const animKey = `player-${key}`;
    
    // Check if the animation exists
    if (!this.scene.anims.exists(animKey)) {
      console.warn(`Animation ${animKey} not found, creating fallback`);
      this.createAnimation(animKey, [0], 10, 0);
    }
    
    try {
      this.entity.play(animKey);
      this.currentAnimation = animKey;
      
      if (callback) {
        this.entity.once(Phaser.Animations.Events.ANIMATION_COMPLETE, callback);
      }
    } catch (e) {
      console.error(`Error playing animation ${animKey}:`, e);
      // Just show the base frame
      this.entity.setTexture(this.entity.texture.key, 0);
      
      // Still call the callback since we can't play the animation
      if (callback) {
        setTimeout(callback, 100);
      }
    }
  }
  
  /**
   * Set breathing animation - for use with idle states
   * @param enabled Whether to enable breathing
   */
  public setBreathingEffect(enabled: boolean): void {
    if (enabled) {
      // Create a subtle breathing effect when idle
      try {
        this.scene.tweens.add({
          targets: this.entity,
          scaleY: { from: 1, to: 1.05 },
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      } catch (e) {
        console.error('Error creating breathing effect:', e);
      }
    } else {
      // Stop breathing effect
      try {
        this.scene.tweens.killTweensOf(this.entity);
      } catch (e) {
        console.error('Error stopping breathing effect:', e);
      }
    }
  }
  
  /**
   * Play a specific frame
   * @param frameName Frame to display
   */
  public setFrame(frameName: string | number): void {
    try {
      this.entity.setFrame(frameName);
    } catch (e) {
      console.error(`Error setting frame ${frameName}:`, e);
      // Try to set to the first frame as fallback
      try {
        this.entity.setFrame(0);
      } catch (innerError) {
        console.error('Failed to set fallback frame:', innerError);
      }
    }
  }
  
  /**
   * Check if all required animations already exist
   */
  private checkAnimationsExist(): boolean {
    const requiredAnimations = [
      'player-idle',
      'player-walk',
      'player-run',
      'player-hurt',
      'player-death'
    ];
    
    return requiredAnimations.every(key => this.scene.anims.exists(key));
  }
  
  /**
   * Creates animations from a spritesheet
   */
  private createAnimationsFromSpritesheet(textureKey: string): void {
    try {
      // Get frame count
      const frameCount = this.scene.textures.get(textureKey).frameTotal;
      
      // Only create animations that don't exist yet
      if (!this.scene.anims.exists('player-idle')) {
        this.scene.anims.create({
          key: 'player-idle',
          frames: this.scene.anims.generateFrameNumbers(textureKey, { frames: [0] }),
          frameRate: 10,
          repeat: -1
        });
      }
      
      if (!this.scene.anims.exists('player-walk')) {
        if (frameCount >= 3) {
          // Multi-frame walk animation
          this.scene.anims.create({
            key: 'player-walk',
            frames: this.scene.anims.generateFrameNumbers(textureKey, { frames: [1, 0, 2, 0] }),
            frameRate: 8,
            repeat: -1
          });
        } else {
          // Single frame animation
          this.scene.anims.create({
            key: 'player-walk',
            frames: this.scene.anims.generateFrameNumbers(textureKey, { frames: [0] }),
            frameRate: 8,
            repeat: -1
          });
        }
      }
      
      if (!this.scene.anims.exists('player-run')) {
        if (frameCount >= 3) {
          // Multi-frame run animation
          this.scene.anims.create({
            key: 'player-run',
            frames: this.scene.anims.generateFrameNumbers(textureKey, { frames: [1, 0, 2, 0] }),
            frameRate: 12,
            repeat: -1
          });
        } else {
          // Single frame animation
          this.scene.anims.create({
            key: 'player-run',
            frames: this.scene.anims.generateFrameNumbers(textureKey, { frames: [0] }),
            frameRate: 12,
            repeat: -1
          });
        }
      }
      
      if (!this.scene.anims.exists('player-hurt')) {
        if (frameCount >= 4) {
          this.scene.anims.create({
            key: 'player-hurt',
            frames: this.scene.anims.generateFrameNumbers(textureKey, { frames: [3, 0] }),
            frameRate: 8,
            repeat: 0
          });
        } else {
          this.scene.anims.create({
            key: 'player-hurt',
            frames: this.scene.anims.generateFrameNumbers(textureKey, { frames: [0] }),
            frameRate: 8,
            repeat: 0
          });
        }
      }
      
      if (!this.scene.anims.exists('player-death')) {
        if (frameCount >= 5) {
          this.scene.anims.create({
            key: 'player-death',
            frames: this.scene.anims.generateFrameNumbers(textureKey, { frames: [3, 4] }),
            frameRate: 4,
            repeat: 0
          });
        } else {
          this.scene.anims.create({
            key: 'player-death',
            frames: this.scene.anims.generateFrameNumbers(textureKey, { frames: [0] }),
            frameRate: 4,
            repeat: 0
          });
        }
      }
      
      if (!this.scene.anims.exists('player-interact')) {
        this.scene.anims.create({
          key: 'player-interact',
          frames: this.scene.anims.generateFrameNumbers(textureKey, { frames: [0] }),
          frameRate: 10,
          repeat: 0
        });
      }
    } catch (e) {
      console.error('Error creating animations from spritesheet:', e);
      this.createFallbackAnimations();
    }
  }
} 