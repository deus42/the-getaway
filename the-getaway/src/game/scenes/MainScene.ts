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
  private _resizeTimeout: number | null = null;

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

    // Fill the entire canvas with background color
    this.cameras.main.setBackgroundColor(0x1a1a1a);

    // Setup map graphics
    this.mapGraphics = this.add.graphics();
    this.mapGraphics.setDepth(0);

    // Initial setup of camera and map
    this.setupCameraAndMap();
    
    // Listen for resize events
    this.scale.on('resize', this.handleResize, this);
    
    // Setup player sprite
    if (this.playerInitialPosition) {
       const playerPixelPos = this.calculatePixelPosition(this.playerInitialPosition.x, this.playerInitialPosition.y);
       this.playerSprite = this.add.rectangle(playerPixelPos.x, playerPixelPos.y, this.tileSize * 0.8, this.tileSize * 0.8, 0x0000ff);
       this.playerSprite.setOrigin(0.5);
       this.playerSprite.setDepth(10);
       console.log('[MainScene] Player sprite created at pixelPos:', playerPixelPos);
    } else { console.error('[MainScene] playerInitialPosition is null'); }

    // Subscribe to Redux store updates
    this.unsubscribe = store.subscribe(this.handleStateChange.bind(this));

    // Process initial enemies
    setTimeout(() => {
      if (this.sys.isActive()) {
        console.log('[MainScene create setTimeout] Processing initial enemies...');
        const initialState = store.getState();
        if (initialState?.world?.currentMapArea?.entities?.enemies) {
           this.updateEnemies(initialState.world.currentMapArea.entities.enemies);
        }
      }
    }, 0);
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

    if (this.currentMapArea.id !== worldState.currentMapArea.id) {
      console.log('[MainScene] Map area changed, updating scene');
      this.currentMapArea = worldState.currentMapArea;
      // clear existing enemy sprites
      this.enemySprites.forEach((data) => {
        data.sprite.destroy();
        data.healthText.destroy();
      });
      this.enemySprites.clear();
      this.setupCameraAndMap();
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

    // Fill the entire background with dark color
    this.mapGraphics.fillStyle(0x1a1a1a);
    const fullWidth = tiles[0].length * this.tileSize;
    const fullHeight = tiles.length * this.tileSize;
    this.mapGraphics.fillRect(0, 0, fullWidth, fullHeight);

    // Draw cells with precise borders
    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[0].length; x++) {
        const tile = tiles[y][x];
        const pixelX = Math.floor(x * this.tileSize); // Ensure pixel-perfect alignment
        const pixelY = Math.floor(y * this.tileSize);

        // Set color based on tile type
        let color: number;
        if (tile.type === TileType.WALL) {
          color = 0xcccccc; // Wall
        } else if (tile.type === TileType.COVER) {
          color = 0x6666dd; // Cover
        } else if (tile.type === TileType.DOOR) {
          color = 0x99cc99; // Door
        } else {
          // Alternate floor colors
          color = (x + y) % 2 === 0 ? 0x333333 : 0x3a3a3a;
        }

        // Draw cell with exact 1px border
        this.mapGraphics.fillStyle(color);
        this.mapGraphics.fillRect(
          pixelX + 1,
          pixelY + 1,
          this.tileSize - 1,
          this.tileSize - 1
        );

        // Draw cell borders with consistent 1px width
        this.mapGraphics.lineStyle(1, 0x1a1a1a, 1);
        this.mapGraphics.strokeRect(
          pixelX,
          pixelY,
          this.tileSize,
          this.tileSize
        );
      }
    }
  }

  // Update calculatePixelPosition to match the new grid drawing approach
  private calculatePixelPosition(gridX: number, gridY: number): { x: number; y: number } {
    return {
      x: gridX * this.tileSize + this.tileSize / 2,
      y: gridY * this.tileSize + this.tileSize / 2
    };
  }

  // Handler for resize events from Phaser - simplify to prevent flickering
  private handleResize(): void {
    // Simple resize without debouncing to avoid blinking
    if (this.sys.isActive() && this.currentMapArea) {
      this.setupCameraAndMap();
    }
  }
  
  // Simplified camera setup to be more stable during resize
  private setupCameraAndMap(): void {
    if (!this.currentMapArea) return;
    
    // Get dimensions
    const mapWidthPx = this.currentMapArea.width * this.tileSize;
    const mapHeightPx = this.currentMapArea.height * this.tileSize;
    const canvasWidth = this.scale.width;
    const canvasHeight = this.scale.height;
    
    // Simple zoom calculation
    const zoomX = canvasWidth / mapWidthPx;
    const zoomY = canvasHeight / mapHeightPx;
    const zoom = Math.min(zoomX, zoomY) * 0.95; // 5% margin
    
    // Set camera
    this.cameras.main.setZoom(zoom);
    this.cameras.main.centerOn(mapWidthPx / 2, mapHeightPx / 2);
    
    // Draw map
    this.drawMap(this.currentMapArea.tiles);
  }
} 