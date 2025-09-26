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
  private backdropGraphics!: Phaser.GameObjects.Graphics;
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
    this.backdropGraphics = this.add.graphics();
    this.backdropGraphics.setDepth(-20);

    this.mapGraphics = this.add.graphics();
    this.mapGraphics.setDepth(-5);

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

        this.renderTile(tile, center, tileWidth, tileHeight, x, y);

        if (tile.type === TileType.DOOR) {
          this.drawDoorTile(center.x, center.y);
        }
      }
    }
  }

  private drawDoorTile(centerX: number, centerY: number): void {
    if (!this.mapGraphics) {
      return;
    }

    const { tileWidth, tileHeight } = this.getIsoMetrics();
    const frameColor = 0x623d1a;
    const glowColor = 0xffc67a;

    const frame = this.getDiamondPoints(centerX, centerY, tileWidth * 0.82, tileHeight * 0.88);
    this.mapGraphics.lineStyle(2, frameColor, 0.9);
    this.mapGraphics.strokePoints(frame, true);

    const panel = this.getDiamondPoints(centerX, centerY, tileWidth * 0.55, tileHeight * 0.64);
    this.mapGraphics.fillStyle(0x2c2118, 0.95);
    this.mapGraphics.fillPoints(panel, true);

    this.mapGraphics.fillStyle(glowColor, 0.45);
    this.mapGraphics.fillPoints(
      this.getDiamondPoints(centerX, centerY - tileHeight * 0.12, tileWidth * 0.38, tileHeight * 0.36),
      true
    );

    const handle = this.getDiamondPoints(centerX + tileWidth * 0.15, centerY, tileWidth * 0.08, tileHeight * 0.2);
    this.mapGraphics.fillStyle(glowColor, 0.7);
    this.mapGraphics.fillPoints(handle, true);
  }

  private renderTile(
    tile: MapTile,
    center: { x: number; y: number },
    tileWidth: number,
    tileHeight: number,
    gridX: number,
    gridY: number
  ): void {
    const halfWidth = tileWidth / 2;
    const halfHeight = tileHeight / 2;
    const baseColor = this.getTileBaseColor(tile, gridX, gridY);
    const variationSeed = ((gridX * 13 + gridY * 7) % 6) * 0.02;
    const modulatedBase = this.adjustColor(baseColor, variationSeed);
    const highlightColor = this.adjustColor(modulatedBase, 0.22);
    const shadowColor = this.adjustColor(modulatedBase, -0.28);

    const tilePoints = this.getDiamondPoints(center.x, center.y, tileWidth, tileHeight);

    const dropColor = this.adjustColor(modulatedBase, -0.55);
    const shadowWidth = tileWidth * (tile.type === TileType.WALL ? 1.12 : 1.04);
    const shadowHeight = tileHeight * (tile.type === TileType.WALL ? 1.28 : 1.16);
    const shadowOffsetY = halfHeight * (tile.type === TileType.WALL ? 1.05 : 0.85);
    const shadowPoints = this.getDiamondPoints(
      center.x + halfWidth * 0.18,
      center.y + shadowOffsetY,
      shadowWidth,
      shadowHeight
    );
    this.mapGraphics.fillStyle(dropColor, tile.type === TileType.WALL ? 0.65 : 0.4);
    this.mapGraphics.fillPoints(shadowPoints, true);

    this.mapGraphics.fillStyle(modulatedBase, 1);
    this.mapGraphics.fillPoints(tilePoints, true);

    const topPoint = new Phaser.Geom.Point(center.x, center.y - halfHeight);
    const rightPoint = new Phaser.Geom.Point(center.x + halfWidth, center.y);
    const leftPoint = new Phaser.Geom.Point(center.x - halfWidth, center.y);
    const bottomPoint = new Phaser.Geom.Point(center.x, center.y + halfHeight);
    const centerPoint = new Phaser.Geom.Point(center.x, center.y);

    this.mapGraphics.fillStyle(highlightColor, 0.62);
    this.mapGraphics.fillPoints([topPoint, rightPoint, centerPoint], true);
    this.mapGraphics.fillPoints([topPoint, centerPoint, leftPoint], true);

    this.mapGraphics.fillStyle(shadowColor, 0.55);
    this.mapGraphics.fillPoints([bottomPoint, centerPoint, rightPoint], true);
    this.mapGraphics.fillPoints([bottomPoint, leftPoint, centerPoint], true);

    switch (tile.type) {
      case TileType.COVER: {
        const coverAccent = this.adjustColor(modulatedBase, 0.35);
        const coverFrame = this.getDiamondPoints(center.x, center.y, tileWidth * 0.7, tileHeight * 0.74);
        this.mapGraphics.fillStyle(coverAccent, 0.18);
        this.mapGraphics.fillPoints(
          this.getDiamondPoints(center.x, center.y, tileWidth * 0.56, tileHeight * 0.6),
          true
        );
        this.mapGraphics.lineStyle(2, 0x58ffc8, 0.7);
        this.mapGraphics.strokePoints(coverFrame, true);
        break;
      }
      case TileType.WALL: {
        const crest = this.getDiamondPoints(center.x, center.y - halfHeight * 0.65, tileWidth * 0.88, tileHeight * 0.82);
        this.mapGraphics.fillStyle(this.adjustColor(modulatedBase, 0.18), 1);
        this.mapGraphics.fillPoints(crest, true);

        const facade = [
          new Phaser.Geom.Point(center.x + halfWidth, center.y),
          new Phaser.Geom.Point(center.x + halfWidth * 0.35, center.y + tileHeight * 0.85),
          new Phaser.Geom.Point(center.x - halfWidth * 0.35, center.y + tileHeight * 0.85),
          new Phaser.Geom.Point(center.x - halfWidth, center.y)
        ];
        this.mapGraphics.fillStyle(this.adjustColor(modulatedBase, -0.35), 0.95);
        this.mapGraphics.fillPoints(facade, true);
        break;
      }
      case TileType.WATER: {
        const sheenColor = this.adjustColor(modulatedBase, 0.55);
        this.mapGraphics.fillStyle(sheenColor, 0.32);
        this.mapGraphics.fillPoints(
          this.getDiamondPoints(center.x, center.y - tileHeight * 0.08, tileWidth * 0.62, tileHeight * 0.52),
          true
        );
        this.mapGraphics.lineStyle(1, this.adjustColor(sheenColor, 0.25), 0.5);
        for (let ripple = 0; ripple < 3; ripple++) {
          const scale = 0.8 - ripple * 0.18;
          const ripplePoints = this.getDiamondPoints(center.x, center.y, tileWidth * scale, tileHeight * scale);
          this.mapGraphics.strokePoints(ripplePoints, true);
        }
        break;
      }
      case TileType.TRAP: {
        const pulseColor = this.adjustColor(modulatedBase, 0.75);
        this.mapGraphics.fillStyle(pulseColor, 0.28);
        this.mapGraphics.fillPoints(
          this.getDiamondPoints(center.x, center.y, tileWidth * 0.6, tileHeight * 0.64),
          true
        );
        this.mapGraphics.fillStyle(pulseColor, 0.18);
        this.mapGraphics.fillPoints(
          this.getDiamondPoints(center.x, center.y, tileWidth * 0.28, tileHeight * 1.02),
          true
        );
        this.mapGraphics.fillPoints(
          this.getDiamondPoints(center.x, center.y, tileWidth * 1.02, tileHeight * 0.28),
          true
        );
        this.mapGraphics.lineStyle(1.5, this.adjustColor(pulseColor, 0.3), 0.85);
        this.mapGraphics.strokePoints(
          this.getDiamondPoints(center.x, center.y, tileWidth * 0.86, tileHeight * 0.32),
          true
        );
        break;
      }
      default:
        break;
    }

    const outlineColor = this.adjustColor(modulatedBase, -0.45);
    this.mapGraphics.lineStyle(1, outlineColor, 0.4);
    this.mapGraphics.strokePoints(tilePoints, true);
  }

  private getTileBaseColor(tile: MapTile, gridX: number, gridY: number): number {
    const checker = (gridX + gridY) % 2 === 0;

    switch (tile.type) {
      case TileType.WALL:
        return checker ? 0x3b4657 : 0x333c4b;
      case TileType.COVER:
        return checker ? 0x243546 : 0x1f2f3f;
      case TileType.WATER:
        return checker ? 0x103d5f : 0x0d3452;
      case TileType.TRAP:
        return checker ? 0x2d0f46 : 0x230c38;
      case TileType.DOOR:
        return checker ? 0x211d1a : 0x1b1815;
      default:
        return checker ? 0x181c24 : 0x1e212b;
    }
  }

  private adjustColor(color: number, factor: number): number {
    const { red, green, blue } = Phaser.Display.Color.IntegerToColor(color);

    if (factor >= 0) {
      const r = Phaser.Math.Clamp(Math.round(red + (255 - red) * factor), 0, 255);
      const g = Phaser.Math.Clamp(Math.round(green + (255 - green) * factor), 0, 255);
      const b = Phaser.Math.Clamp(Math.round(blue + (255 - blue) * factor), 0, 255);
      return Phaser.Display.Color.GetColor(r, g, b);
    }

    const scale = Math.max(0, 1 + factor);
    const r = Phaser.Math.Clamp(Math.round(red * scale), 0, 255);
    const g = Phaser.Math.Clamp(Math.round(green * scale), 0, 255);
    const b = Phaser.Math.Clamp(Math.round(blue * scale), 0, 255);
    return Phaser.Display.Color.GetColor(r, g, b);
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

  private drawBackdrop(): void {
    if (!this.backdropGraphics || !this.currentMapArea) {
      return;
    }

    const bounds = this.computeIsoBounds();
    const margin = this.tileSize * 4;
    const width = bounds.maxX - bounds.minX + margin * 2;
    const height = bounds.maxY - bounds.minY + margin * 2;
    const originX = bounds.minX - margin;
    const originY = bounds.minY - margin;

    this.backdropGraphics.clear();
    this.backdropGraphics.fillGradientStyle(
      0x060712,
      0x0d1a38,
      0x04060d,
      0x0a1e3f,
      1,
      1,
      1,
      1
    );
    this.backdropGraphics.fillRect(originX, originY, width, height);

    const horizonY = originY + height * 0.28;
    this.backdropGraphics.fillStyle(0x1a315f, 0.28);
    this.backdropGraphics.fillEllipse(originX + width / 2, horizonY, width * 1.05, height * 0.52);

    this.backdropGraphics.fillStyle(0x070b14, 0.55);
    this.backdropGraphics.fillRect(originX, originY + height * 0.62, width, height * 0.55);

    for (let i = 0; i < 4; i++) {
      const alpha = 0.18 - i * 0.03;
      if (alpha <= 0) {
        continue;
      }
      const factor = 1.2 + i * 0.25;
      this.backdropGraphics.lineStyle(2, 0x0c1527, alpha);
      this.backdropGraphics.strokeEllipse(
        originX + width / 2,
        originY + height * 0.78,
        width * factor,
        height * 0.46 * factor
      );
    }
  }

  private computeIsoBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    if (!this.currentMapArea) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    const { width, height } = this.currentMapArea;
    const corners = [
      this.calculatePixelPosition(0, 0),
      this.calculatePixelPosition(width - 1, 0),
      this.calculatePixelPosition(0, height - 1),
      this.calculatePixelPosition(width - 1, height - 1),
    ];

    const minX = Math.min(...corners.map((point) => point.x));
    const maxX = Math.max(...corners.map((point) => point.x));
    const minY = Math.min(...corners.map((point) => point.y));
    const maxY = Math.max(...corners.map((point) => point.y));

    return { minX, maxX, minY, maxY };
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

    this.drawBackdrop();
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
    this.dayNightOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
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
        marker.setBlendMode(Phaser.BlendModes.ADD);
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
