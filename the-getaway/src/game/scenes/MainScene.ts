import Phaser from 'phaser';
import { MapArea, TileType, Position, Enemy, MapTile } from '../interfaces/types';
import { DEFAULT_TILE_SIZE } from '../world/grid';
import { store } from '../../store';
import { updateGameTime as updateGameTimeAction } from '../../store/worldSlice';
import { DEFAULT_DAY_NIGHT_CONFIG, getDayNightOverlayColor } from '../world/dayNightCycle';

// Tracks enemy marker geometry alongside its floating health label
interface EnemySpriteData {
  sprite: Phaser.GameObjects.Ellipse;
  healthText: Phaser.GameObjects.Text;
  markedForRemoval: boolean;
}

export class MainScene extends Phaser.Scene {
  private tileSize: number = DEFAULT_TILE_SIZE;
  private mapGraphics!: Phaser.GameObjects.Graphics;
  private playerSprite!: Phaser.GameObjects.Ellipse;
  private enemySprites: Map<string, EnemySpriteData> = new Map();
  private currentMapArea: MapArea | null = null;
  private unsubscribe: (() => void) | null = null;
  private playerInitialPosition?: Position;
  private dayNightOverlay!: Phaser.GameObjects.Rectangle;
  private coverMarkers: Phaser.GameObjects.Polygon[] = [];
  private coverMarkerTweens: Phaser.Tweens.Tween[] = [];
  private curfewActive = false;
  private currentGameTime = 0;
  private timeDispatchAccumulator = 0;
  private isoOriginX = 0;
  private isoOriginY = 0;
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
    this.curfewActive = worldState.curfewActive;
    this.refreshCoverHighlights(this.curfewActive);

    // Listen for resize events
    this.scale.on('resize', this.handleResize, this);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Setup player sprite
    if (this.playerInitialPosition) {
       const metrics = this.getIsoMetrics();
       const playerPixelPos = this.calculatePixelPosition(this.playerInitialPosition.x, this.playerInitialPosition.y);
       this.playerSprite = this.add.ellipse(
         playerPixelPos.x,
         playerPixelPos.y,
         metrics.tileWidth * 0.45,
         metrics.tileHeight * 0.9,
         0x00b4ff
       );
       this.playerSprite.setDepth(playerPixelPos.y + 8);
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
      this.refreshCoverHighlights(this.curfewActive);
    }

    if (this.curfewActive !== worldState.curfewActive) {
      this.refreshCoverHighlights(worldState.curfewActive);
    }

    this.updatePlayerPosition(playerState.position);
    this.updateEnemies(currentEnemies);
  }
  
  private updatePlayerPosition(position: Position): void {
    if (this.playerSprite) {
       const pixelPos = this.calculatePixelPosition(position.x, position.y);
       this.playerSprite.setPosition(pixelPos.x, pixelPos.y);
       this.playerSprite.setDepth(pixelPos.y + 8);
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

         const metrics = this.getIsoMetrics();
         const enemySprite = this.add.ellipse(
           pixelPos.x,
           pixelPos.y,
           metrics.tileWidth * 0.45,
           metrics.tileHeight * 0.9,
           0xff5252
         );
         enemySprite.setDepth(pixelPos.y + 6);

         const healthTextY = pixelPos.y + metrics.tileHeight * 0.6;
         const healthText = this.add
           .text(
             pixelPos.x,
             healthTextY,
             `${enemy.health}/${enemy.maxHealth}`,
             { fontSize: '12px', color: '#ffffff', align: 'center', resolution: 2 }
           )
           .setOrigin(0.5, 0)
           .setDepth(pixelPos.y + 7);

         this.enemySprites.set(enemy.id, { sprite: enemySprite, healthText: healthText, markedForRemoval: false });
         console.log(`[MainScene updateEnemies] Created sprite & health for ${enemy.id}`);
      } else {
         if(enemy.health <= 0) {
             existingSpriteData.markedForRemoval = true;
         } else {
             existingSpriteData.sprite.setPosition(pixelPos.x, pixelPos.y);
             existingSpriteData.sprite.setDepth(pixelPos.y + 6);
             const metrics = this.getIsoMetrics();
             const healthTextY = pixelPos.y + metrics.tileHeight * 0.6;
             existingSpriteData.healthText
               .setPosition(pixelPos.x, healthTextY)
               .setText(`${enemy.health}/${enemy.maxHealth}`)
               .setDepth(pixelPos.y + 7);
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
    this.clearCoverHighlights();
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

    const { tileWidth, tileHeight } = this.getIsoMetrics();

    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[0].length; x++) {
        const tile = tiles[y][x];
        const center = this.calculatePixelPosition(x, y);

        if (tile.type === TileType.DOOR) {
          this.drawDoorTile(center.x, center.y);
          continue;
        }

        let color: number;
        switch (tile.type) {
          case TileType.WALL:
            color = 0xbfc3c9;
            break;
          case TileType.COVER:
            color = 0x5b6ee1;
            break;
          case TileType.WATER:
            color = 0x1f6b7a; // neon ground glow
            break;
          case TileType.TRAP:
            color = 0x8235c4; // beacon pad
            break;
          default:
            color = (x + y) % 2 === 0 ? 0x30333a : 0x272a31;
            break;
        }

        const tilePoints = this.getDiamondPoints(center.x, center.y, tileWidth, tileHeight);
        this.mapGraphics.fillStyle(color);
        this.mapGraphics.fillPoints(tilePoints, true);
      }
    }
  }

  private drawDoorTile(centerX: number, centerY: number): void {
    if (!this.mapGraphics) {
      return;
    }

    const { tileWidth, tileHeight } = this.getIsoMetrics();
    const base = this.getDiamondPoints(centerX, centerY, tileWidth, tileHeight);
    this.mapGraphics.fillStyle(0x2f2f2f);
    this.mapGraphics.fillPoints(base, true);

    const glow = this.getDiamondPoints(centerX, centerY, tileWidth * 0.8, tileHeight * 0.85);
    this.mapGraphics.fillStyle(0xffbe5d);
    this.mapGraphics.fillPoints(glow, true);

    const threshold = this.getDiamondPoints(centerX, centerY + tileHeight * 0.05, tileWidth * 0.28, tileHeight * 0.6);
    this.mapGraphics.fillStyle(0x8c5523);
    this.mapGraphics.fillPoints(threshold, true);
  }

  private calculatePixelPosition(gridX: number, gridY: number): { x: number; y: number } {
    const { halfTileWidth, halfTileHeight } = this.getIsoMetrics();
    const isoX = (gridX - gridY) * halfTileWidth + this.isoOriginX;
    const isoY = (gridX + gridY) * halfTileHeight + this.isoOriginY;

    return { x: isoX, y: isoY };
  }

  private getIsoMetrics(): {
    tileWidth: number;
    tileHeight: number;
    halfTileWidth: number;
    halfTileHeight: number;
  } {
    const tileWidth = this.tileSize;
    const tileHeight = this.tileSize / 2;

    return {
      tileWidth,
      tileHeight,
      halfTileWidth: tileWidth / 2,
      halfTileHeight: tileHeight / 2
    };
  }

  private getDiamondPoints(
    centerX: number,
    centerY: number,
    width: number,
    height: number
  ): Phaser.Geom.Point[] {
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    return [
      new Phaser.Geom.Point(centerX, centerY - halfHeight),
      new Phaser.Geom.Point(centerX + halfWidth, centerY),
      new Phaser.Geom.Point(centerX, centerY + halfHeight),
      new Phaser.Geom.Point(centerX - halfWidth, centerY)
    ];
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
    
    const { width, height } = this.currentMapArea;
    const { tileHeight, halfTileWidth, halfTileHeight } = this.getIsoMetrics();
    const canvasWidth = this.scale.width;
    const canvasHeight = this.scale.height;

    this.isoOriginX = (height - 1) * halfTileWidth;
    this.isoOriginY = tileHeight; // lift map slightly so the top diamond is visible

    const isoWidth = (width + height) * halfTileWidth;
    const isoHeight = (width + height) * halfTileHeight;
    const zoomX = canvasWidth / isoWidth;
    const zoomY = canvasHeight / isoHeight;
    const zoom = Math.min(zoomX, zoomY) * 0.94;

    this.cameras.main.setZoom(zoom);

    const centerX = (width - 1) / 2;
    const centerY = (height - 1) / 2;
    const centerPoint = this.calculatePixelPosition(centerX, centerY);
    this.cameras.main.centerOn(centerPoint.x, centerPoint.y + tileHeight * 0.25);

    this.drawMap(this.currentMapArea.tiles);

    // Ensure overlay matches latest viewport size after camera adjustments
    this.resizeDayNightOverlay();
    this.refreshCoverHighlights(this.curfewActive);
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

  private refreshCoverHighlights(isCurfewActive: boolean): void {
    this.curfewActive = isCurfewActive;
    this.clearCoverHighlights();

    if (!this.currentMapArea || !this.sys.isActive()) {
      return;
    }

    const highlightColor = isCurfewActive ? 0x4ade80 : 0x22c55e;
    const baseAlpha = isCurfewActive ? 0.4 : 0.18;
    const borderAlpha = isCurfewActive ? 0.9 : 0.35;

    for (let y = 0; y < this.currentMapArea.height; y += 1) {
      for (let x = 0; x < this.currentMapArea.width; x += 1) {
        const tile = this.currentMapArea.tiles[y][x];
        if (!tile.provideCover) {
          continue;
        }

        const pixelPos = this.calculatePixelPosition(x, y);
        const { tileWidth, tileHeight } = this.getIsoMetrics();
        const points = [
          0,
          -tileHeight / 2,
          tileWidth / 2,
          0,
          0,
          tileHeight / 2,
          -tileWidth / 2,
          0,
        ];
        const marker = this.add.polygon(
          pixelPos.x,
          pixelPos.y,
          points,
          highlightColor,
          baseAlpha
        );
        marker.setOrigin(0.5);
        marker.setDepth(pixelPos.y + 4);
        marker.setStrokeStyle(2, highlightColor, borderAlpha);

        this.coverMarkers.push(marker);

        if (isCurfewActive) {
          const tween = this.tweens.add({
            targets: marker,
            alpha: { from: baseAlpha, to: baseAlpha * 0.25 },
            duration: 900,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
          });
          this.coverMarkerTweens.push(tween);
        }
      }
    }
  }

  private clearCoverHighlights(): void {
    this.coverMarkerTweens.forEach((tween) => tween.remove());
    this.coverMarkerTweens = [];
    this.coverMarkers.forEach((marker) => marker.destroy());
    this.coverMarkers = [];
  }
}
