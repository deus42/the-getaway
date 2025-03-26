import Phaser from 'phaser';
import { MapArea, TileType, Position, Player, Enemy } from '../interfaces/types';
import { DEFAULT_TILE_SIZE, gridToPixel } from '../world/grid';
import { store, RootState } from '../../store';

export class MainScene extends Phaser.Scene {
  private tileSize: number = DEFAULT_TILE_SIZE;
  private mapGraphics!: Phaser.GameObjects.Graphics;
  private playerSprite!: Phaser.GameObjects.Rectangle;
  private enemySprites: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private playerInfoText!: Phaser.GameObjects.Text;
  private combatInfoText!: Phaser.GameObjects.Text;
  private currentMapArea: MapArea | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    super({ key: 'MainScene' });
  }

  public init(): void {
    // Initialize properties but don't subscribe to Redux yet
    this.currentMapArea = null;
    this.unsubscribe = null;
  }

  public create(): void {
    // Initialize graphics for map rendering
    this.mapGraphics = this.add.graphics();
    
    // Create a temporary player sprite (rectangle)
    this.playerSprite = this.add.rectangle(0, 0, this.tileSize * 0.8, this.tileSize * 0.8, 0x0000ff);
    this.playerSprite.setOrigin(0.5);
    
    // Get current state from Redux
    const state = store.getState() as RootState;
    this.currentMapArea = state.world.currentMapArea;
    
    // Initial render
    this.renderMap();
    this.updatePlayerPosition(state.player.data.position);
    
    // Create and update enemy sprites
    this.updateEnemies(state.world.currentMapArea.entities.enemies);
    
    // Add text to show we're in the main scene
    this.add.text(10, 10, 'The Getaway - Main Scene', { color: '#ffffff' });
    
    // Add player info display
    this.playerInfoText = this.add.text(10, 40, '', { color: '#ffffff', fontSize: '14px' });
    this.updatePlayerInfo(state.player.data);
    
    // Add combat info display
    this.combatInfoText = this.add.text(10, 100, '', { color: '#ffffff', fontSize: '14px' });
    this.updateCombatInfo(state.world.inCombat, state.world.isPlayerTurn);
    
    // IMPORTANT: Subscribe to Redux store changes AFTER all UI elements are created
    this.unsubscribe = store.subscribe(() => {
      this.handleStateChange();
    });
  }

  public update(): void {
    // Game loop update logic goes here
  }
  
  private handleStateChange(): void {
    const state = store.getState() as RootState;
    
    // Update map if it changed
    if (state.world.currentMapArea.id !== this.currentMapArea?.id) {
      this.currentMapArea = state.world.currentMapArea;
      this.renderMap();
    }
    
    // Update player position and info
    this.updatePlayerPosition(state.player.data.position);
    this.updatePlayerInfo(state.player.data);
    
    // Update enemies
    this.updateEnemies(state.world.currentMapArea.entities.enemies);
    
    // Update combat info
    this.updateCombatInfo(state.world.inCombat, state.world.isPlayerTurn);
  }
  
  private renderMap(): void {
    if (!this.currentMapArea) return;
    
    this.mapGraphics.clear();
    
    // Draw grid lines first
    this.mapGraphics.lineStyle(1, 0x222222, 0.5);
    
    // Vertical grid lines
    for (let x = 0; x <= this.currentMapArea.width; x++) {
      this.mapGraphics.beginPath();
      this.mapGraphics.moveTo(x * this.tileSize, 0);
      this.mapGraphics.lineTo(x * this.tileSize, this.currentMapArea.height * this.tileSize);
      this.mapGraphics.closePath();
      this.mapGraphics.strokePath();
    }
    
    // Horizontal grid lines
    for (let y = 0; y <= this.currentMapArea.height; y++) {
      this.mapGraphics.beginPath();
      this.mapGraphics.moveTo(0, y * this.tileSize);
      this.mapGraphics.lineTo(this.currentMapArea.width * this.tileSize, y * this.tileSize);
      this.mapGraphics.closePath();
      this.mapGraphics.strokePath();
    }
    
    // Render each tile
    for (let y = 0; y < this.currentMapArea.height; y++) {
      for (let x = 0; x < this.currentMapArea.width; x++) {
        const tile = this.currentMapArea.tiles[y][x];
        const pixelPos = gridToPixel({x, y}, this.tileSize);
        
        // Set fill color based on tile type
        switch (tile.type) {
          case TileType.FLOOR:
            this.mapGraphics.fillStyle(0x333333);
            break;
          case TileType.WALL:
            this.mapGraphics.fillStyle(0x777777); // Lighter grey for better visibility
            break;
          case TileType.COVER:
            this.mapGraphics.fillStyle(0x338833); // More visible green for cover
            break;
          case TileType.DOOR:
            this.mapGraphics.fillStyle(0xAA6622); // Brighter brown for doors
            break;
          case TileType.WATER:
            this.mapGraphics.fillStyle(0x3366AA); // Brighter blue for water
            break;
          case TileType.TRAP:
            this.mapGraphics.fillStyle(0xAA3333); // Brighter red for traps
            break;
          default:
            this.mapGraphics.fillStyle(0x333333);
        }
        
        // Draw tile with a small border
        this.mapGraphics.fillRect(
          pixelPos.x + 1, 
          pixelPos.y + 1, 
          this.tileSize - 2, 
          this.tileSize - 2
        );
        
        // Add indicators for non-walkable/cover tiles
        if (!tile.isWalkable) {
          // Add an X to non-walkable tiles
          this.mapGraphics.lineStyle(2, 0xEEEEEE, 0.7);
          this.mapGraphics.beginPath();
          this.mapGraphics.moveTo(pixelPos.x + 10, pixelPos.y + 10);
          this.mapGraphics.lineTo(pixelPos.x + this.tileSize - 10, pixelPos.y + this.tileSize - 10);
          this.mapGraphics.moveTo(pixelPos.x + this.tileSize - 10, pixelPos.y + 10);
          this.mapGraphics.lineTo(pixelPos.x + 10, pixelPos.y + this.tileSize - 10);
          this.mapGraphics.closePath();
          this.mapGraphics.strokePath();
        } else if (tile.provideCover) {
          // Add a circle to cover tiles
          this.mapGraphics.lineStyle(2, 0xEEEEEE, 0.7);
          this.mapGraphics.beginPath();
          this.mapGraphics.arc(
            pixelPos.x + this.tileSize / 2, 
            pixelPos.y + this.tileSize / 2, 
            this.tileSize / 4, 
            0, 
            Math.PI * 2
          );
          this.mapGraphics.closePath();
          this.mapGraphics.strokePath();
        }
      }
    }
  }
  
  private updatePlayerPosition(position: Position): void {
    // Add null check
    if (!this.playerSprite) return;
    
    const pixelPos = gridToPixel(position, this.tileSize);
    this.playerSprite.setPosition(
      pixelPos.x + this.tileSize / 2,
      pixelPos.y + this.tileSize / 2
    );
  }
  
  private updatePlayerInfo(player: Player): void {
    // Add null check
    if (!this.playerInfoText) return;
    
    this.playerInfoText.setText(
      `Health: ${player.health}/${player.maxHealth}\n` +
      `AP: ${player.actionPoints}/${player.maxActionPoints}`
    );
  }
  
  private updateCombatInfo(inCombat: boolean, isPlayerTurn: boolean): void {
    // Add null check to ensure combatInfoText exists
    if (!this.combatInfoText) return;
    
    if (inCombat) {
      this.combatInfoText.setText(
        `COMBAT MODE\n` +
        `Current Turn: ${isPlayerTurn ? 'PLAYER' : 'ENEMY'}`
      );
      this.combatInfoText.setColor('#ff0000');
    } else {
      this.combatInfoText.setText('');
    }
  }
  
  private updateEnemies(enemies: Enemy[]): void {
    // Add null check
    if (!this.enemySprites) return;
    
    // Remove sprites for enemies that no longer exist
    const enemyIds = new Set(enemies.map(enemy => enemy.id));
    
    this.enemySprites.forEach((sprite, enemyId) => {
      if (!enemyIds.has(enemyId)) {
        sprite.destroy();
        this.enemySprites.delete(enemyId);
      }
    });
    
    // Update or create sprites for enemies
    enemies.forEach(enemy => {
      let enemySprite = this.enemySprites.get(enemy.id);
      
      // Create sprite if it doesn't exist
      if (!enemySprite) {
        enemySprite = this.add.rectangle(0, 0, this.tileSize * 0.8, this.tileSize * 0.8, 0xff0000);
        enemySprite.setOrigin(0.5);
        this.enemySprites.set(enemy.id, enemySprite);
        
        // Add health text above enemy
        const healthText = this.add.text(0, 0, `${enemy.health}`, { 
          fontSize: '12px', 
          color: '#ffffff',
          backgroundColor: '#000000' 
        });
        healthText.setOrigin(0.5, 1.5);
        
        // Store the health text as a property of the enemy sprite
        (enemySprite as Phaser.GameObjects.Rectangle & { healthText: Phaser.GameObjects.Text }).healthText = healthText;
      }
      
      // Update position
      const pixelPos = gridToPixel(enemy.position, this.tileSize);
      enemySprite.setPosition(
        pixelPos.x + this.tileSize / 2,
        pixelPos.y + this.tileSize / 2
      );
      
      // Update health text
      const healthText = (enemySprite as Phaser.GameObjects.Rectangle & { healthText: Phaser.GameObjects.Text }).healthText;
      if (healthText) {
        healthText.setText(`${enemy.health}`);
        healthText.setPosition(
          pixelPos.x + this.tileSize / 2,
          pixelPos.y + this.tileSize / 2
        );
      }
    });
  }
  
  public shutdown(): void {
    // Unsubscribe from Redux when scene shuts down
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
} 