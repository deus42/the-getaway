import Phaser from 'phaser';
import { MapArea, TileType, Position, Enemy, MapTile } from '../interfaces/types';
import { DEFAULT_TILE_SIZE } from '../world/grid';
import { store } from '../../store';

// Change EnemySpriteData to use Rectangle
interface EnemySpriteData {
  sprite: Phaser.GameObjects.Rectangle; // Changed from Sprite to Rectangle
  healthText: Phaser.GameObjects.Text;
  markedForRemoval: boolean;
}

export class MainScene extends Phaser.Scene {
  private tileSize: number = DEFAULT_TILE_SIZE;
  private mapGraphics!: Phaser.GameObjects.Graphics;
  private playerSprite!: Phaser.GameObjects.Rectangle;
  private enemySprites: Map<string, EnemySpriteData> = new Map(); // Type uses Rectangle now
  private currentMapArea: MapArea | null = null;
  private unsubscribe: (() => void) | null = null;
  private playerInitialPosition?: Position;

  constructor() {
    super({ key: 'MainScene' });
  }

  public init(data: { mapArea: MapArea, playerPosition: Position }): void {
    this.currentMapArea = data.mapArea;
    this.playerInitialPosition = data.playerPosition;
    this.enemySprites = new Map<string, EnemySpriteData>(); // Reset map on init
  }

  public create(): void {
    console.log('[MainScene] create method called.');

    if (!this.currentMapArea) {
      console.error("[MainScene] currentMapArea is null on create!");
      return;
    }

    // Setup map graphics
    this.mapGraphics = this.add.graphics();
    this.mapGraphics.setDepth(0);
    this.drawMap(this.currentMapArea.tiles);

    // Setup player sprite
    if (this.playerInitialPosition) {
       const playerPixelPos = this.calculatePixelPosition(this.playerInitialPosition.x, this.playerInitialPosition.y);
       this.playerSprite = this.add.rectangle(playerPixelPos.x, playerPixelPos.y, this.tileSize * 0.8, this.tileSize * 0.8, 0x0000ff);
       this.playerSprite.setOrigin(0.5);
       this.playerSprite.setDepth(10);
       console.log('[MainScene] Player sprite created at pixelPos:', playerPixelPos);
    } else { console.error('[MainScene] playerInitialPosition is null'); }

    // Subscribe to Redux store updates for SUBSEQUENT changes
    this.unsubscribe = store.subscribe(this.handleStateChange.bind(this));

    // Explicitly process INITIAL enemies slightly deferred
    setTimeout(() => {
      // Ensure scene is still active when the timeout runs
      if (this.sys.isActive()) {
        console.log('[MainScene create setTimeout] Processing initial enemies...');
        const initialState = store.getState();
        if (initialState?.world?.currentMapArea?.entities?.enemies) {
           this.updateEnemies(initialState.world.currentMapArea.entities.enemies);
        } else {
           console.warn('[MainScene create setTimeout] Could not find initial enemies in state.');
        }
      } else {
         console.log('[MainScene create setTimeout] Scene became inactive before initial enemy processing.');
      }
    }, 0); // 0ms delay defers execution until after current stack/render cycle
  }

  public update(): void {
    // Game loop update logic goes here
  }
  
  private handleStateChange(): void {
    // This handles updates AFTER the initial one from setTimeout
    if (!this.sys.isActive() || !this.currentMapArea) return;

    const newState = store.getState();
    const playerState = newState.player.data;
    const worldState = newState.world;
    const currentEnemies = worldState.currentMapArea.entities.enemies;

    if(this.currentMapArea.id !== worldState.currentMapArea.id) {
        console.warn("[MainScene handleStateChange] Map area mismatch, scene might need restarting.");
        return;
    }

    this.updatePlayerPosition(playerState.position);
    this.updateEnemies(currentEnemies);
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
        const pixelPos = this.calculatePixelPosition(x, y);
        
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
    if (this.playerSprite) {
       const pixelPos = this.calculatePixelPosition(position.x, position.y);
       this.playerSprite.setPosition(pixelPos.x, pixelPos.y);
    } else {
       console.warn("[MainScene] Player sprite not available for position update.");
    }
  }
  
  private updateEnemies(enemies: Enemy[]) {
    if (!this.mapGraphics || !this.sys.isActive()) {
      return;
    }
    if (!this.enemySprites) {
      this.enemySprites = new Map<string, EnemySpriteData>();
    }

    this.enemySprites.forEach((spriteData) => { spriteData.markedForRemoval = true; });

    for (const enemy of enemies) {
      const existingSpriteData = this.enemySprites.get(enemy.id);
      const pixelPos = this.calculatePixelPosition(enemy.position.x, enemy.position.y);

      if (!existingSpriteData) {
         if(enemy.health <= 0) continue;

         const enemySprite = this.add.rectangle(pixelPos.x, pixelPos.y, this.tileSize * 0.8, this.tileSize * 0.8, 0xff0000);
         enemySprite.setOrigin(0.5);
         enemySprite.setDepth(10);

         const healthText = this.add.text(pixelPos.x, pixelPos.y + this.tileSize / 2, `${enemy.health}/${enemy.maxHealth}`, { fontSize: '12px', color: '#ffffff', align: 'center', resolution: 2 }).setOrigin(0.5, 0).setDepth(11);

         this.enemySprites.set(enemy.id, { sprite: enemySprite, healthText: healthText, markedForRemoval: false });
         console.log(`[MainScene updateEnemies] Created sprite & health for ${enemy.id}`);
      } else {
         if(enemy.health <= 0) {
             existingSpriteData.markedForRemoval = true;
         } else {
             existingSpriteData.sprite.setPosition(pixelPos.x, pixelPos.y);
             existingSpriteData.healthText.setPosition(pixelPos.x, pixelPos.y + this.tileSize / 2).setText(`${enemy.health}/${enemy.maxHealth}`);
             existingSpriteData.markedForRemoval = false;
         }
      }
    }

    this.enemySprites.forEach((spriteData, id) => {
      if (spriteData.markedForRemoval) {
        spriteData.sprite.destroy();
        spriteData.healthText.destroy();
        this.enemySprites.delete(id);
      }
    });
  }
  
  public shutdown(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    console.log('[MainScene] shutdown complete.');
  }

  private drawMap(tiles: MapTile[][]) {
    if (!this.mapGraphics) return;
    this.mapGraphics.clear();
    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[y].length; x++) {
        const tile = tiles[y][x];
        const pixelPos = this.calculatePixelPosition(x, y);
        let color = 0x555555; // Default floor
        if (tile.type === TileType.WALL) color = 0xaaaaaa;
        else if (tile.type === TileType.COVER) color = 0x7777cc; // Blueish for cover
        else if (tile.type === TileType.DOOR) color = 0x88aa88;

        this.mapGraphics.fillStyle(color, 1);
        this.mapGraphics.fillRect(
          pixelPos.x - this.tileSize / 2,
          pixelPos.y - this.tileSize / 2,
          this.tileSize,
          this.tileSize
        );
        this.mapGraphics.lineStyle(1, 0x222222, 1);
        this.mapGraphics.strokeRect(
            pixelPos.x - this.tileSize / 2,
            pixelPos.y - this.tileSize / 2,
            this.tileSize,
            this.tileSize
        );
      }
    }
  }

  // Helper needed for updateEnemies and updatePlayerPosition
  private calculatePixelPosition(gridX: number, gridY: number): { x: number; y: number } {
    // Simple calculation assuming TILE_SIZE is defined
    const offsetX = this.tileSize / 2; // Center sprites in tiles
    const offsetY = this.tileSize / 2;
    return {
        x: gridX * this.tileSize + offsetX,
        y: gridY * this.tileSize + offsetY,
    };
  }
} 