import Phaser from 'phaser';
import { MapArea, TileType, Position, Enemy, MapTile } from '../interfaces/types';
import { DEFAULT_TILE_SIZE } from '../world/grid';
import { store } from '../../store';
import { updateGameTime as updateGameTimeAction } from '../../store/worldSlice';
import { DEFAULT_DAY_NIGHT_CONFIG, getDayNightOverlayColor } from '../world/dayNightCycle';

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
  private dayNightOverlay!: Phaser.GameObjects.Rectangle;
  private currentGameTime = 0;
  private timeDispatchAccumulator = 0;
  private handleVisibilityChange = () => {
    if (!this.sys.isActive()) return;
    if (document.visibilityState === 'visible') {
      this.resizeDayNightOverlay();
      this.updateDayNightOverlay();
      if (this.dayNightOverlay) {
        this.dayNightOverlay.setVisible(true);
      }
    }
  };

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

    // Cache initial world time and set up overlay
    const worldState = store.getState().world;
    this.currentGameTime = worldState.currentTime;
    this.timeDispatchAccumulator = 0;
    this.initializeDayNightOverlay();
    this.updateDayNightOverlay();

    // Listen for resize events
    this.scale.on('resize', this.handleResize, this);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
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

  private handleStateChange(): void {
    // This handles updates AFTER the initial one from setTimeout
    if (!this.sys.isActive() || !this.currentMapArea) return;

    const newState = store.getState();
    const playerState = newState.player.data;
    const worldState = newState.world;
    const currentEnemies = worldState.currentMapArea.entities.enemies;

    // Sync local time cache with store updates (e.g., external adjustments)
    this.currentGameTime = worldState.currentTime;
    this.updateDayNightOverlay();

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
    this.scale.off('resize', this.handleResize, this);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
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
      this.resizeDayNightOverlay();
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

    // Ensure overlay matches latest viewport size after camera adjustments
    this.resizeDayNightOverlay();
  }

  private initializeDayNightOverlay(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    this.dayNightOverlay = this.add.rectangle(0, 0, width, height, 0x000000, 0);
    this.dayNightOverlay.setOrigin(0.5, 0.5);
    this.dayNightOverlay.setScrollFactor(0);
    this.dayNightOverlay.setDepth(100);
    this.dayNightOverlay.setBlendMode(Phaser.BlendModes.NORMAL);
    this.dayNightOverlay.setSize(width, height);
    this.dayNightOverlay.setDisplaySize(width, height);
    this.applyOverlayZoom();
  }

  private applyOverlayZoom(): void {
    if (!this.dayNightOverlay) return;
    const zoom = this.cameras.main.zoom || 1;
    const inverseZoom = 1 / zoom;
    this.dayNightOverlay.setScale(inverseZoom, inverseZoom);
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    this.dayNightOverlay.setPosition(centerX, centerY);
  }

  private resizeDayNightOverlay(): void {
    if (!this.dayNightOverlay) return;
    const width = this.scale.width;
    const height = this.scale.height;
    this.dayNightOverlay.setSize(width, height);
    this.dayNightOverlay.setDisplaySize(width, height);
    this.applyOverlayZoom();
  }

  private updateDayNightOverlay(): void {
    if (!this.dayNightOverlay) return;

    const overlayColor = getDayNightOverlayColor(this.currentGameTime, DEFAULT_DAY_NIGHT_CONFIG);
    const match = overlayColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/);

    if (match) {
      const [, r, g, b, a] = match;
      const color = Phaser.Display.Color.GetColor(Number(r), Number(g), Number(b));
      this.dayNightOverlay.setFillStyle(color, Number(a));
    }
  }

  public update(_time: number, delta: number): void {
    if (!this.sys.isActive()) {
      return;
    }

    const deltaSeconds = delta / 1000;
    this.currentGameTime += deltaSeconds;
    this.timeDispatchAccumulator += deltaSeconds;

    this.updateDayNightOverlay();

    if (this.timeDispatchAccumulator >= 0.5) {
      store.dispatch(updateGameTimeAction(this.timeDispatchAccumulator));
      this.timeDispatchAccumulator = 0;
    }
  }
}
