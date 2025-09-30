import Phaser from 'phaser';
import { MapArea, TileType, Position, Enemy, MapTile, NPC, AlertLevel } from '../interfaces/types';
import { DEFAULT_TILE_SIZE } from '../world/grid';
import { store } from '../../store';
import { updateGameTime as updateGameTimeAction } from '../../store/worldSlice';
import { DEFAULT_DAY_NIGHT_CONFIG, getDayNightOverlayColor } from '../world/dayNightCycle';
import { TILE_CLICK_EVENT, PATH_PREVIEW_EVENT, PathPreviewDetail } from '../events';
import { IsoObjectFactory } from '../utils/IsoObjectFactory';
import { getIsoMetrics as computeIsoMetrics, toPixel as isoToPixel, getDiamondPoints as isoDiamondPoints, adjustColor as isoAdjustColor, IsoMetrics } from '../utils/iso';
import { getVisionConeTiles } from '../combat/perception';
import { LevelBuildingDefinition } from '../../content/levels/level0/types';

const TILE_BASE_COLORS: Record<TileType | 'DEFAULT', { even: number; odd: number }> = {
  [TileType.WALL]: { even: 0x353a4d, odd: 0x2d3244 },
  [TileType.COVER]: { even: 0x26363c, odd: 0x202f33 },
  [TileType.WATER]: { even: 0x16405a, odd: 0x12364d },
  [TileType.TRAP]: { even: 0x462342, odd: 0x3b1c37 },
  [TileType.DOOR]: { even: 0x2a2622, odd: 0x221e1b },
  [TileType.FLOOR]: { even: 0x1e2432, odd: 0x232838 },
  DEFAULT: { even: 0x1e2432, odd: 0x232838 },
};

const DEFAULT_FIT_ZOOM_FACTOR = 1.25;
const MIN_CAMERA_ZOOM = 0.6;
const MAX_CAMERA_ZOOM = 2.3;
const CAMERA_BOUND_PADDING_TILES = 6;
const CAMERA_FOLLOW_LERP = 0.22;

// Tracks enemy marker geometry alongside its floating health label
interface EnemySpriteData {
  sprite: Phaser.GameObjects.Ellipse;
  healthBar: Phaser.GameObjects.Graphics;
  base: Phaser.GameObjects.Graphics;
  markedForRemoval: boolean;
}

interface NpcSpriteData {
  sprite: Phaser.GameObjects.Ellipse;
  indicator?: Phaser.GameObjects.Graphics;
  markedForRemoval: boolean;
}

export class MainScene extends Phaser.Scene {
  private tileSize: number = DEFAULT_TILE_SIZE;
  private mapGraphics!: Phaser.GameObjects.Graphics;
  private backdropGraphics!: Phaser.GameObjects.Graphics;
  private pathGraphics!: Phaser.GameObjects.Graphics;
  private visionConeGraphics!: Phaser.GameObjects.Graphics;
  private playerSprite!: Phaser.GameObjects.Ellipse;
  private playerBase?: Phaser.GameObjects.Graphics;
  private enemySprites: Map<string, EnemySpriteData> = new Map();
  private npcSprites: Map<string, NpcSpriteData> = new Map();
  private currentMapArea: MapArea | null = null;
  private buildingDefinitions: LevelBuildingDefinition[] = [];
  private buildingLabels: Phaser.GameObjects.Text[] = [];
  private unsubscribe: (() => void) | null = null;
  private playerInitialPosition?: Position;
  private dayNightOverlay!: Phaser.GameObjects.Rectangle;
  private curfewActive = false;
  private currentGameTime = 0;
  private timeDispatchAccumulator = 0;
  private isoOriginX = 0;
  private isoOriginY = 0;
  private isCameraFollowingPlayer = false;
  private inCombat = false;
  private playerVitalsIndicator?: Phaser.GameObjects.Graphics;
  private isoFactory?: IsoObjectFactory;
  private staticPropGroup?: Phaser.GameObjects.Group;
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

  public init(data: { mapArea: MapArea, playerPosition: Position, buildings?: LevelBuildingDefinition[] }): void {
    this.currentMapArea = data.mapArea;
    this.playerInitialPosition = data.playerPosition;
    this.buildingDefinitions = data.buildings || [];
    this.enemySprites = new Map<string, EnemySpriteData>(); // Reset map on init
    this.npcSprites = new Map<string, NpcSpriteData>();
    this.isCameraFollowingPlayer = false;
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

    this.visionConeGraphics = this.add.graphics();
    this.visionConeGraphics.setDepth(2);

    this.pathGraphics = this.add.graphics();
    this.pathGraphics.setDepth(4);

    // Initial setup of camera and map
    this.setupCameraAndMap();
    this.cameras.main.setRoundPixels(true);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupScene, this);

    // Cache initial world time and set up overlay
    const worldState = store.getState().world;
    this.currentGameTime = worldState.currentTime;
    this.timeDispatchAccumulator = 0;
    this.inCombat = worldState.inCombat;
    this.initializeDayNightOverlay();
    this.updateDayNightOverlay();
    this.curfewActive = worldState.curfewActive;

    // Listen for resize events
    this.scale.on('resize', this.handleResize, this);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener(PATH_PREVIEW_EVENT, this.handlePathPreview as EventListener);

    if (this.input) {
      this.input.on('pointerdown', this.handlePointerDown, this);
      this.input.on('wheel', this.handleWheel);
    }
    
    // Setup player sprite
    if (this.playerInitialPosition) {
       const metrics = this.getIsoMetrics();
       const playerPixelPos = this.calculatePixelPosition(this.playerInitialPosition.x, this.playerInitialPosition.y);
       this.playerBase = this.isoFactory?.createCharacterBase(this.playerInitialPosition.x, this.playerInitialPosition.y, {
         baseColor: 0x111827,
         outlineColor: 0x2563eb,
         alpha: 0.9,
         widthScale: 0.75,
         heightScale: 0.5,
         depthOffset: 1,
       });
       this.playerSprite = this.add.ellipse(
         playerPixelPos.x,
         playerPixelPos.y,
         metrics.tileWidth * 0.45,
         metrics.tileHeight * 0.9,
         0x00b4ff
       );
       this.playerSprite.setDepth(playerPixelPos.y + 8);
       this.enablePlayerCameraFollow();
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
        if (initialState?.world?.currentMapArea?.entities?.npcs) {
           this.updateNpcs(initialState.world.currentMapArea.entities.npcs);
        }
        this.renderVisionCones();
      }
    }, 0);
  }

  private cleanupScene(): void {
    if (this.input) {
      this.input.off('pointerdown', this.handlePointerDown, this);
      this.input.off('wheel', this.handleWheel);
    }
    this.scale.off('resize', this.handleResize, this);
    window.removeEventListener(PATH_PREVIEW_EVENT, this.handlePathPreview as EventListener);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    this.destroyPlayerVitalsIndicator();
    this.npcSprites.forEach((data) => {
      if (data.indicator) {
        data.indicator.destroy();
        data.indicator = undefined;
      }
    });
  }

  private handleStateChange(): void {
    // This handles updates AFTER the initial one from setTimeout
    if (!this.sys.isActive() || !this.currentMapArea) return;

    const newState = store.getState();
    const playerState = newState.player.data;
    const worldState = newState.world;
    const currentEnemies = worldState.currentMapArea.entities.enemies;

    const previousCombatState = this.inCombat;
    this.inCombat = worldState.inCombat;

    if (!this.inCombat && previousCombatState) {
      this.destroyPlayerVitalsIndicator();
      this.enemySprites.forEach((data) => {
        data.healthBar.clear();
        data.healthBar.setVisible(false);
      });
      this.npcSprites.forEach((data) => {
        if (data.indicator) {
          data.indicator.destroy();
          data.indicator = undefined;
        }
      });
    }

    // Sync local time cache with store updates (e.g., external adjustments)
    this.currentGameTime = worldState.currentTime;
    this.updateDayNightOverlay();

    if (this.currentMapArea.id !== worldState.currentMapArea.id) {
      console.log('[MainScene] Map area changed, updating scene');
      this.currentMapArea = worldState.currentMapArea;
      // clear existing enemy sprites
      this.enemySprites.forEach((data) => {
        data.sprite.destroy();
        data.healthBar.destroy();
      });
      this.enemySprites.clear();
      this.npcSprites.forEach((data) => {
        data.sprite.destroy();
        if (data.indicator) {
          data.indicator.destroy();
        }
      });
      this.npcSprites.clear();
      this.setupCameraAndMap();
      this.clearPathPreview();
      this.enablePlayerCameraFollow();
    }

    if (this.curfewActive !== worldState.curfewActive) {
      this.curfewActive = worldState.curfewActive;
    }

    this.updatePlayerPosition(playerState.position);
    this.updatePlayerVitalsIndicator(playerState.position, playerState.health, playerState.maxHealth);
    this.updateEnemies(currentEnemies);
    this.updateNpcs(worldState.currentMapArea.entities.npcs);
    this.renderVisionCones();
  }
  private ensureIsoFactory(): void {
    if (!this.isoFactory) {
      this.isoFactory = new IsoObjectFactory(this, this.tileSize);
    }

    this.isoFactory.setIsoOrigin(this.isoOriginX, this.isoOriginY);
  }

  private renderStaticProps(): void {
    if (this.staticPropGroup) {
      this.staticPropGroup.clear(true, true);
    }

    if (!this.isoFactory || !this.currentMapArea || this.currentMapArea.isInterior) {
      return;
    }

    if (!this.staticPropGroup) {
      this.staticPropGroup = this.add.group();
    }

    const crate = this.isoFactory.createCrate(12, 20, { tint: 0x8d5524, height: 0.6, scale: 0.5 });
    const props = [
      this.isoFactory.createCrate(12, 20, { tint: 0x8d5524, height: 0.6, scale: 0.52 }),
      this.isoFactory.createCrate(9, 18, { tint: 0x3f3f46, height: 0.55, scale: 0.48, alpha: 0.95 }),
      this.isoFactory.createHighlightDiamond(12, 20, {
        color: 0x38bdf8,
        alpha: 0.22,
        widthScale: 0.82,
        heightScale: 0.82,
      }),
      this.isoFactory.createHighlightDiamond(9, 18, {
        color: 0xf97316,
        alpha: 0.18,
        widthScale: 0.74,
        heightScale: 0.74,
      }),
    ];

    props.forEach((prop) => {
      if (prop) {
        this.staticPropGroup?.add(prop);
      }
    });
  }
  
  private updatePlayerPosition(position: Position): void {
    if (this.playerSprite) {
       const pixelPos = this.calculatePixelPosition(position.x, position.y);
       this.playerSprite.setPosition(pixelPos.x, pixelPos.y);
       this.playerSprite.setDepth(pixelPos.y + 8);
       if (this.playerBase && this.isoFactory) {
         this.isoFactory.updateCharacterBase(this.playerBase, position.x, position.y);
       }
    } else {
       console.warn("[MainScene] Player sprite not available for position update.");
    }
  }

  private updatePlayerVitalsIndicator(position: Position, health: number, maxHealth: number): void {
    if (!this.inCombat) {
      this.destroyPlayerVitalsIndicator();
      return;
    }

    if (!this.playerSprite || !this.sys.isActive()) {
      return;
    }

    const metrics = this.getIsoMetrics();
    const pixelPos = this.calculatePixelPosition(position.x, position.y);
    const barWidth = metrics.tileWidth * 0.38;
    const barHeight = Math.max(4, metrics.tileHeight * 0.08);
    const x = pixelPos.x - barWidth / 2;
    const y = pixelPos.y - metrics.tileHeight * 0.7;
    const percent = maxHealth > 0 ? Math.max(0, Math.min(1, health / maxHealth)) : 0;

    if (!this.playerVitalsIndicator) {
      this.playerVitalsIndicator = this.add.graphics();
    }

    const graphics = this.playerVitalsIndicator;
    graphics.clear();
    graphics.fillStyle(0x0f172a, 0.82);
    graphics.fillRoundedRect(x, y, barWidth, barHeight, Math.min(4, barHeight));

    if (percent > 0) {
      graphics.fillStyle(0x38bdf8, 1);
      graphics.fillRoundedRect(
        x + 1,
        y + 1,
        (barWidth - 2) * percent,
        Math.max(1, barHeight - 2),
        Math.max(2, barHeight - 2)
      );
    }

    graphics.setDepth(pixelPos.y + 9);
  }

  private destroyPlayerVitalsIndicator(): void {
    if (this.playerVitalsIndicator) {
      this.playerVitalsIndicator.destroy();
      this.playerVitalsIndicator = undefined;
    }
  }

  private updateNpcCombatIndicator(
    data: NpcSpriteData,
    pixelPos: { x: number; y: number },
    metrics: { tileWidth: number; tileHeight: number },
    npc: NPC
  ): void {
    if (!this.inCombat || !npc.isInteractive) {
      if (data.indicator) {
        data.indicator.destroy();
        data.indicator = undefined;
      }
      return;
    }

    if (!data.indicator) {
      data.indicator = this.add.graphics();
    }

    const graphics = data.indicator;
    const barWidth = metrics.tileWidth * 0.26;
    const barHeight = Math.max(3, metrics.tileHeight * 0.06);
    const x = pixelPos.x - barWidth / 2;
    const y = pixelPos.y - metrics.tileHeight * 0.68;

    graphics.clear();
    graphics.fillStyle(0x102a43, 0.82);
    graphics.fillRoundedRect(x, y, barWidth, barHeight, Math.min(3, barHeight));
    graphics.fillStyle(0x22c55e, 1);
    graphics.fillRoundedRect(
      x + 1,
      y + 1,
      barWidth - 2,
      Math.max(1, barHeight - 2),
      Math.max(2, barHeight - 2)
    );
    graphics.setDepth(pixelPos.y + 6);
  }
      if (!existingSpriteData) {
        if (enemy.health <= 0) continue;

        const base = this.isoFactory?.createCharacterBase(enemy.position.x, enemy.position.y, {
          baseColor: 0x1f2937,
          outlineColor: 0xef4444,
          alpha: 0.85,
          widthScale: 0.72,
          heightScale: 0.48,
          depthOffset: 1,
        });

        const enemySprite = this.add.ellipse(
          pixelPos.x,
          pixelPos.y,
          metrics.tileWidth * 0.45,
          metrics.tileHeight * 0.9,
          0xff5252
        );
        enemySprite.setDepth(pixelPos.y + 6);

        const healthBar = this.add.graphics();
        healthBar.setVisible(false);

        this.enemySprites.set(enemy.id, {
          sprite: enemySprite,
          healthBar,
          base: base ?? this.add.graphics(),
          markedForRemoval: false,
        });

        const createdData = this.enemySprites.get(enemy.id);
        if (createdData) {
          this.updateEnemyHealthBar(createdData, pixelPos, metrics, enemy);
        }
        console.log(`[MainScene updateEnemies] Created sprite & health for ${enemy.id}`);
    if (!this.npcSprites) {
        if (enemy.health <= 0) {
          existingSpriteData.markedForRemoval = true;
        } else {
          existingSpriteData.sprite.setPosition(pixelPos.x, pixelPos.y);
          existingSpriteData.sprite.setDepth(pixelPos.y + 6);
          if (existingSpriteData.base && this.isoFactory) {
            this.isoFactory.updateCharacterBase(existingSpriteData.base, enemy.position.x, enemy.position.y, {
              baseColor: 0x1f2937,
              outlineColor: 0xef4444,
              alpha: 0.85,
              widthScale: 0.72,
              heightScale: 0.48,
              depthOffset: 1,
            });
          }
          this.updateEnemyHealthBar(existingSpriteData, pixelPos, metrics, enemy);
          existingSpriteData.markedForRemoval = false;
      const strokeAlpha = isInteractive ? 0.7 : 0.55;
        const npcSprite = this.add.ellipse(
          pixelPos.x,
          pixelPos.y,
          metrics.tileWidth * 0.32,
          metrics.tileHeight * 0.7,
          fillColor,
          fillAlpha
        );
        npcSprite.setDepth(pixelPos.y + 5);
        npcSprite.setStrokeStyle(1.5, strokeColor, strokeAlpha);

        this.npcSprites.set(npc.id, {
          sprite: npcSprite,
          markedForRemoval: false,
        });
        const createdData = this.npcSprites.get(npc.id);
        if (createdData) {
          this.updateNpcCombatIndicator(createdData, pixelPos, metrics, npc);
        }
      } else {
        existingSpriteData.sprite.setPosition(pixelPos.x, pixelPos.y);
        existingSpriteData.sprite.setDepth(pixelPos.y + 5);
        existingSpriteData.sprite.setFillStyle(fillColor, fillAlpha);
        existingSpriteData.sprite.setStrokeStyle(1.5, strokeColor, strokeAlpha);
        existingSpriteData.markedForRemoval = false;
        this.updateNpcCombatIndicator(existingSpriteData, pixelPos, metrics, npc);
      }
    }

    this.npcSprites.forEach((spriteData, id) => {
      if (spriteData.markedForRemoval) {
        spriteData.sprite.destroy();
        if (spriteData.indicator) {
          spriteData.indicator.destroy();
        }
        this.npcSprites.delete(id);
      }
    });
  }
  
  private updateEnemies(enemies: Enemy[]) {
    if (!this.mapGraphics || !this.sys.isActive()) {
      return;
    }
    if (!this.enemySprites) {
      this.enemySprites = new Map<string, EnemySpriteData>();
    }

    this.enemySprites.forEach((spriteData) => { spriteData.markedForRemoval = true; });

    const metrics = this.getIsoMetrics();

    for (const enemy of enemies) {
      const existingSpriteData = this.enemySprites.get(enemy.id);
      const pixelPos = this.calculatePixelPosition(enemy.position.x, enemy.position.y);

      if (!existingSpriteData) {
         if(enemy.health <= 0) continue;

         const enemySprite = this.add.ellipse(
           pixelPos.x,
         const base = this.isoFactory?.createCharacterBase(enemy.position.x, enemy.position.y, {
           baseColor: 0x1f2937,
           outlineColor: 0xef4444,
           alpha: 0.85,
           widthScale: 0.72,
           heightScale: 0.48,
           depthOffset: 1,
         }) ?? undefined;
           pixelPos.y,
           metrics.tileWidth * 0.45,
           metrics.tileHeight * 0.9,
           0xff5252
         );
         enemySprite.setDepth(pixelPos.y + 6);

         const healthBar = this.add.graphics();
         healthBar.setVisible(false);
         this.enemySprites.set(enemy.id, { sprite: enemySprite, healthBar, markedForRemoval: false });
         this.enemySprites.set(enemy.id, { sprite: enemySprite, healthBar, base: base ?? this.add.graphics(), markedForRemoval: false });
         if (createdData) {
           this.updateEnemyHealthBar(createdData, pixelPos, metrics, enemy);
         }
         console.log(`[MainScene updateEnemies] Created sprite & health for ${enemy.id}`);
      } else {
         if(enemy.health <= 0) {
             existingSpriteData.markedForRemoval = true;
         } else {
             existingSpriteData.sprite.setPosition(pixelPos.x, pixelPos.y);
             existingSpriteData.sprite.setDepth(pixelPos.y + 6);
             this.updateEnemyHealthBar(existingSpriteData, pixelPos, metrics, enemy);
             if (existingSpriteData.base && this.isoFactory) {
               this.isoFactory.updateCharacterBase(existingSpriteData.base, enemy.position.x, enemy.position.y, {
                 baseColor: 0x1f2937,
                 outlineColor: 0xef4444,
                 alpha: 0.85,
                 widthScale: 0.72,
                 heightScale: 0.48,
                 depthOffset: 1,
               });
             }
             existingSpriteData.markedForRemoval = false;
         }
      }
    }

    this.enemySprites.forEach((spriteData, id) => {
      if (spriteData.markedForRemoval) {
        if (spriteData.base) {
          spriteData.base.destroy();
        }
        spriteData.sprite.destroy();
        spriteData.healthBar.destroy();
        this.enemySprites.delete(id);
      }
    });
  }

  private updateEnemyHealthBar(
    data: EnemySpriteData,
    pixelPos: { x: number; y: number },
    metrics: { tileWidth: number; tileHeight: number },
    enemy: Enemy
  ): void {
    const graphics = data.healthBar;
    if (!this.inCombat) {
      graphics.clear();
      graphics.setVisible(false);
      return;
    }

    graphics.setVisible(true);
    const barWidth = metrics.tileWidth * 0.38;
    const barHeight = Math.max(4, metrics.tileHeight * 0.08);
    const x = pixelPos.x - barWidth / 2;
    const y = pixelPos.y - metrics.tileHeight * 0.75;
    const percent = enemy.maxHealth > 0 ? Phaser.Math.Clamp(enemy.health / enemy.maxHealth, 0, 1) : 0;

    graphics.clear();
    graphics.fillStyle(0x3f1d1d, 0.88);
    graphics.fillRoundedRect(x, y, barWidth, barHeight, Math.min(4, barHeight));

    if (percent > 0) {
      graphics.fillStyle(0xef4444, 1);
      graphics.fillRoundedRect(
        x + 1,
        y + 1,
        (barWidth - 2) * percent,
        Math.max(1, barHeight - 2),
        Math.max(2, barHeight - 2)
      );
    }

    graphics.setDepth(pixelPos.y + 7);
  }

  private renderVisionCones(): void {
    if (!this.currentMapArea || !this.visionConeGraphics) {
      return;
    }

    this.visionConeGraphics.clear();

    const enemies = this.currentMapArea.entities.enemies;
    const metrics = this.getIsoMetrics();

    enemies.forEach((enemy) => {
      if (!enemy.visionCone || enemy.health <= 0) {
        return;
      }

      // Get all tiles in vision cone
      const visionTiles = getVisionConeTiles(
        enemy.position,
        enemy.visionCone,
        this.currentMapArea!
      );

      if (visionTiles.length === 0) {
        return;
      }

      // Determine color based on alert level
      let coneColor = 0xffff00; // Yellow for idle/suspicious
      let coneAlpha = 0.1;

      switch (enemy.alertLevel) {
        case AlertLevel.SUSPICIOUS:
          coneColor = 0xffaa00;
          coneAlpha = 0.15;
          break;
        case AlertLevel.INVESTIGATING:
          coneColor = 0xff6600;
          coneAlpha = 0.2;
          break;
        case AlertLevel.ALARMED:
          coneColor = 0xff0000;
          coneAlpha = 0.25;
          break;
        default:
          coneColor = 0xffff00;
          coneAlpha = 0.1;
      }

      // Draw vision cone tiles
      this.visionConeGraphics.fillStyle(coneColor, coneAlpha);

      visionTiles.forEach((tile) => {
        const pixelPos = this.calculatePixelPosition(tile.x, tile.y);

        // Draw isometric diamond for each tile
        const points = [
          pixelPos.x, pixelPos.y - metrics.tileHeight / 2,  // top
          pixelPos.x + metrics.tileWidth / 2, pixelPos.y,    // right
          pixelPos.x, pixelPos.y + metrics.tileHeight / 2,  // bottom
          pixelPos.x - metrics.tileWidth / 2, pixelPos.y,    // left
        ];

        this.visionConeGraphics.fillPoints(points, true);
      });
    });
  }

  public shutdown(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.npcSprites.forEach((data) => {
      data.sprite.destroy();
      if (data.indicator) {
        data.indicator.destroy();
      }
    });
    this.npcSprites.clear();
    this.destroyPlayerVitalsIndicator();
    this.scale.off('resize', this.handleResize, this);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener(PATH_PREVIEW_EVENT, this.handlePathPreview as EventListener);
    if (this.input) {
      this.input.off('pointerdown', this.handlePointerDown, this);
    }
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

  private drawBuildingLabels(): void {
    // Clear existing labels
    this.buildingLabels.forEach(label => label.destroy());
    this.buildingLabels = [];

    if (!this.currentMapArea) return;

    // Only render labels for the main outdoor area (not interiors)
    if (this.currentMapArea.isInterior) return;

    const seenCenters = new Set<string>();
    const metrics = this.getIsoMetrics();

    this.buildingDefinitions.forEach((building) => {
      const key = `${building.footprint.from.x}:${building.footprint.from.y}:${building.footprint.to.x}:${building.footprint.to.y}`;
      if (seenCenters.has(key)) {
        return;
      }
      seenCenters.add(key);

      // Calculate center of building footprint
      const centerX = (building.footprint.from.x + building.footprint.to.x) / 2;
      const centerY = (building.footprint.from.y + building.footprint.to.y) / 2;

      // Convert grid position to isometric pixel coordinates
      const pixelPos = this.calculatePixelPosition(centerX, centerY);

      const label = this.add.text(pixelPos.x, pixelPos.y, building.name, {
        fontSize: '14px',
        fontFamily: 'Inter, Arial, sans-serif',
        fontStyle: '600',
        color: '#f8fafc',
        stroke: '#0f172a',
        strokeThickness: 4,
        align: 'center',
        wordWrap: { width: metrics.tileWidth * 4.2 },
      });

      label.setOrigin(0.5, 0.5);
      label.setDepth(pixelPos.y + 1);
      label.setAlpha(0.95);
      label.setPadding(10, 6, 10, 6);
      label.setBackgroundColor('rgba(15, 23, 42, 0.6)');
      label.setShadow(0, 3, '#000000', 4, false, true);
      this.buildingLabels.push(label);
    });
  }

  private drawDoorTile(centerX: number, centerY: number): void {
    if (!this.mapGraphics) {
      return;
    }

    const { tileWidth, tileHeight } = this.getIsoMetrics();
    const frameColor = 0x4c3b2c;
    const glowColor = 0xf3c58c;
    const panelColor = 0x201a16;

    const frame = this.getDiamondPoints(centerX, centerY, tileWidth * 0.8, tileHeight * 0.84);
    this.mapGraphics.lineStyle(2, frameColor, 0.85);
    this.mapGraphics.strokePoints(frame, true);

    const panel = this.getDiamondPoints(centerX, centerY, tileWidth * 0.56, tileHeight * 0.62);
    this.mapGraphics.fillStyle(panelColor, 0.96);
    this.mapGraphics.fillPoints(panel, true);

    const glow = this.getDiamondPoints(centerX, centerY - tileHeight * 0.1, tileWidth * 0.4, tileHeight * 0.34);
    this.mapGraphics.fillStyle(glowColor, 0.4);
    this.mapGraphics.fillPoints(glow, true);

    const sill = this.getDiamondPoints(centerX, centerY + tileHeight * 0.18, tileWidth * 0.5, tileHeight * 0.18);
    this.mapGraphics.fillStyle(this.adjustColor(panelColor, 0.18), 0.85);
    this.mapGraphics.fillPoints(sill, true);

    const handle = this.getDiamondPoints(centerX + tileWidth * 0.14, centerY, tileWidth * 0.08, tileHeight * 0.18);
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
    const variationSeed = ((((gridX * 11) ^ (gridY * 7)) % 7) - 3) * 0.012;
    const modulatedBase = this.adjustColor(baseColor, variationSeed);
    const highlightColor = this.adjustColor(modulatedBase, 0.16);
    const shadowColor = this.adjustColor(modulatedBase, -0.18);

    const tilePoints = this.getDiamondPoints(center.x, center.y, tileWidth, tileHeight);

    const dropFactor = tile.type === TileType.WALL ? -0.38 : -0.32;
    const dropColor = this.adjustColor(modulatedBase, dropFactor);
    const shadowWidth = tileWidth * (tile.type === TileType.WALL ? 1.08 : 1.03);
    const shadowHeight = tileHeight * (tile.type === TileType.WALL ? 1.2 : 1.1);
    const shadowOffsetY = halfHeight * (tile.type === TileType.WALL ? 1.0 : 0.78);
    const shadowPoints = this.getDiamondPoints(
      center.x + halfWidth * 0.12,
      center.y + shadowOffsetY,
      shadowWidth,
      shadowHeight
    );
    this.mapGraphics.fillStyle(dropColor, tile.type === TileType.WALL ? 0.5 : 0.3);
    this.mapGraphics.fillPoints(shadowPoints, true);

    this.mapGraphics.fillStyle(modulatedBase, 1);
    this.mapGraphics.fillPoints(tilePoints, true);

    const topPoint = new Phaser.Geom.Point(center.x, center.y - halfHeight);
    const rightPoint = new Phaser.Geom.Point(center.x + halfWidth, center.y);
    const leftPoint = new Phaser.Geom.Point(center.x - halfWidth, center.y);
    const bottomPoint = new Phaser.Geom.Point(center.x, center.y + halfHeight);
    const centerPoint = new Phaser.Geom.Point(center.x, center.y);

    this.mapGraphics.fillStyle(highlightColor, 0.45);
    this.mapGraphics.fillPoints([topPoint, rightPoint, centerPoint], true);
    this.mapGraphics.fillPoints([topPoint, centerPoint, leftPoint], true);

    this.mapGraphics.fillStyle(shadowColor, 0.38);
    this.mapGraphics.fillPoints([bottomPoint, centerPoint, rightPoint], true);
    this.mapGraphics.fillPoints([bottomPoint, leftPoint, centerPoint], true);

    switch (tile.type) {
      case TileType.COVER: {
        // Cover tiles render as regular floor tiles without special highlighting
        break;
      }
      case TileType.WALL: {
        const crest = this.getDiamondPoints(center.x, center.y - halfHeight * 0.58, tileWidth * 0.86, tileHeight * 0.78);
        this.mapGraphics.fillStyle(this.adjustColor(modulatedBase, 0.14), 1);
        this.mapGraphics.fillPoints(crest, true);

        const facade = [
          new Phaser.Geom.Point(center.x + halfWidth, center.y),
          new Phaser.Geom.Point(center.x + halfWidth * 0.32, center.y + tileHeight * 0.82),
          new Phaser.Geom.Point(center.x - halfWidth * 0.32, center.y + tileHeight * 0.82),
          new Phaser.Geom.Point(center.x - halfWidth, center.y)
        ];
        this.mapGraphics.fillStyle(this.adjustColor(modulatedBase, -0.22), 0.9);
        this.mapGraphics.fillPoints(facade, true);
        break;
      }
      case TileType.WATER: {
        const sheenColor = this.adjustColor(modulatedBase, 0.3);
        this.mapGraphics.fillStyle(sheenColor, 0.26);
        this.mapGraphics.fillPoints(
          this.getDiamondPoints(center.x, center.y - tileHeight * 0.06, tileWidth * 0.6, tileHeight * 0.5),
          true
        );
        this.mapGraphics.lineStyle(1, this.adjustColor(sheenColor, 0.25), 0.45);
        for (let ripple = 0; ripple < 2; ripple++) {
          const scale = 0.82 - ripple * 0.22;
          const ripplePoints = this.getDiamondPoints(center.x, center.y, tileWidth * scale, tileHeight * scale);
          this.mapGraphics.strokePoints(ripplePoints, true);
        }
        break;
      }
      case TileType.TRAP: {
        const pulseColor = this.adjustColor(modulatedBase, 0.6);
        this.mapGraphics.fillStyle(pulseColor, 0.22);
        this.mapGraphics.fillPoints(
          this.getDiamondPoints(center.x, center.y, tileWidth * 0.58, tileHeight * 0.6),
          true
        );
        this.mapGraphics.fillStyle(pulseColor, 0.14);
        this.mapGraphics.fillPoints(
          this.getDiamondPoints(center.x, center.y, tileWidth * 0.3, tileHeight * 0.96),
          true
        );
        this.mapGraphics.fillPoints(
          this.getDiamondPoints(center.x, center.y, tileWidth * 0.96, tileHeight * 0.3),
          true
        );
        this.mapGraphics.lineStyle(1.2, this.adjustColor(pulseColor, 0.35), 0.75);
        this.mapGraphics.strokePoints(
          this.getDiamondPoints(center.x, center.y, tileWidth * 0.82, tileHeight * 0.32),
          true
        );
        break;
      }
      default:
        break;
    }

    const outlineColor = this.adjustColor(modulatedBase, -0.3);
    this.mapGraphics.lineStyle(1, outlineColor, 0.35);
    this.mapGraphics.strokePoints(tilePoints, true);
  }

  private getTileBaseColor(tile: MapTile, gridX: number, gridY: number): number {
    const checker = (gridX + gridY) % 2 === 0;
    const palette = TILE_BASE_COLORS[tile.type] ?? TILE_BASE_COLORS.DEFAULT;
    return checker ? palette.even : palette.odd;
  }

  private adjustColor(color: number, factor: number): number {
    return isoAdjustColor(color, factor);
  }

  private calculatePixelPosition(gridX: number, gridY: number): { x: number; y: number } {
    return isoToPixel(gridX, gridY, this.isoOriginX, this.isoOriginY, this.tileSize);
  }

  private getIsoMetrics(): IsoMetrics {
    return computeIsoMetrics(this.tileSize);
  }

  private getDiamondPoints(
    centerX: number,
    centerY: number,
    width: number,
    height: number
  ): Phaser.Geom.Point[] {
    return isoDiamondPoints(centerX, centerY, width, height).map((point) => new Phaser.Geom.Point(point.x, point.y));
  }

  private worldToGrid(worldX: number, worldY: number): Position | null {
    const { halfTileWidth, halfTileHeight } = this.getIsoMetrics();

    const relativeX = worldX - this.isoOriginX;
    const relativeY = worldY - this.isoOriginY;

    const gridX = (relativeY / halfTileHeight + relativeX / halfTileWidth) * 0.5;
    const gridY = (relativeY / halfTileHeight - relativeX / halfTileWidth) * 0.5;

    const roundedX = Math.round(gridX);
    const roundedY = Math.round(gridY);

    if (Number.isNaN(roundedX) || Number.isNaN(roundedY)) {
      return null;
    }

    return { x: roundedX, y: roundedY };
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.currentMapArea || !this.sys.isActive()) {
      return;
    }

    if (!pointer.leftButtonDown()) {
      return;
    }

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const gridPosition = this.worldToGrid(worldPoint.x, worldPoint.y);

    if (!gridPosition) {
      return;
    }

    const { x, y } = gridPosition;

    if (
      x < 0 ||
      y < 0 ||
      x >= this.currentMapArea.width ||
      y >= this.currentMapArea.height
    ) {
      return;
    }

    const tile = this.currentMapArea.tiles[y][x];

    if (!tile.isWalkable && tile.type !== TileType.DOOR) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent(TILE_CLICK_EVENT, {
        detail: {
          position: gridPosition,
          areaId: this.currentMapArea.id,
        },
      })
    );
  }

  private handleWheel = (
    pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number
  ): void => {
    if (!this.sys.isActive()) {
      return;
    }

    const camera = this.cameras.main;
    const zoomMultiplier = deltaY > 0 ? 0.9 : 1.1;
    const currentZoom = camera.zoom;
    const targetZoom = Phaser.Math.Clamp(
      currentZoom * zoomMultiplier,
      MIN_CAMERA_ZOOM,
      MAX_CAMERA_ZOOM
    );

    if (Math.abs(targetZoom - currentZoom) < 0.0005) {
      return;
    }

    let worldPointBefore: Phaser.Math.Vector2 | null = null;

    if (!this.isCameraFollowingPlayer) {
      worldPointBefore = camera.getWorldPoint(pointer.x, pointer.y);
    }

    camera.setZoom(targetZoom);

    if (this.isCameraFollowingPlayer) {
      camera.setDeadzone(
        Math.max(120, this.scale.width * 0.22),
        Math.max(160, this.scale.height * 0.28)
      );
      this.recenterCameraOnPlayer();
    } else {
      const worldPointAfter = camera.getWorldPoint(pointer.x, pointer.y);
      const deltaWorldX = (worldPointBefore?.x ?? 0) - worldPointAfter.x;
      const deltaWorldY = (worldPointBefore?.y ?? 0) - worldPointAfter.y;
      camera.scrollX += deltaWorldX;
      camera.scrollY += deltaWorldY;
      this.clampCameraToBounds(camera);
    }

    this.applyOverlayZoom();
  };

  private clampCameraToBounds(camera: Phaser.Cameras.Scene2D.Camera): void {
    const bounds = camera.getBounds();

    if (!bounds) {
      return;
    }

    const viewWidth = camera.width / camera.zoom;
    const viewHeight = camera.height / camera.zoom;
    const minX = bounds.x;
    const maxX = bounds.x + Math.max(0, bounds.width - viewWidth);
    const minY = bounds.y;
    const maxY = bounds.y + Math.max(0, bounds.height - viewHeight);

    camera.scrollX = Phaser.Math.Clamp(camera.scrollX, minX, maxX);
    camera.scrollY = Phaser.Math.Clamp(camera.scrollY, minY, maxY);
  }

  private handlePathPreview = (event: Event): void => {
    if (!this.sys.isActive()) {
      return;
    }

    const customEvent = event as CustomEvent<PathPreviewDetail>;
    const detail = customEvent.detail;

    if (!detail) {
      this.clearPathPreview();
      return;
    }

    if (!this.currentMapArea || detail.areaId !== this.currentMapArea.id) {
      this.clearPathPreview();
      return;
    }

    this.pathGraphics.clear();

    if (!detail.path || detail.path.length === 0) {
      return;
    }

    const { tileWidth, tileHeight } = this.getIsoMetrics();

    detail.path.forEach((position, index) => {
      const center = this.calculatePixelPosition(position.x, position.y);
      const scale = index === detail.path.length - 1 ? 0.8 : 0.55;
      const points = this.getDiamondPoints(
        center.x,
        center.y,
        tileWidth * scale,
        tileHeight * scale
      );
      const color = index === detail.path.length - 1 ? 0xffc857 : 0x38d9ff;
      const alpha = index === detail.path.length - 1 ? 0.45 : 0.3;
      this.pathGraphics.fillStyle(color, alpha);
      this.pathGraphics.fillPoints(points, true);
    });
  };

  private clearPathPreview(): void {
    if (this.pathGraphics) {
      this.pathGraphics.clear();
    }
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
      0x05070f,
      0x0a1423,
      0x0d1321,
      0x17213a,
      1,
      1,
      1,
      1
    );
    this.backdropGraphics.fillRect(originX, originY, width, height);

    const horizonY = originY + height * 0.28;
    this.backdropGraphics.fillStyle(0x1c314d, 0.22);
    this.backdropGraphics.fillEllipse(originX + width / 2, horizonY, width * 1.06, height * 0.5);

    this.backdropGraphics.fillStyle(0x070b12, 0.5);
    this.backdropGraphics.fillRect(originX, originY + height * 0.62, width, height * 0.55);

    for (let i = 0; i < 4; i++) {
      const alpha = 0.18 - i * 0.03;
      if (alpha <= 0) {
        continue;
      }
      const factor = 1.2 + i * 0.25;
      this.backdropGraphics.lineStyle(2, 0x132034, alpha);
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
      this.enablePlayerCameraFollow();
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
    this.ensureIsoFactory();

    const isoWidth = (width + height) * halfTileWidth;
    const isoHeight = (width + height) * halfTileHeight;
    const zoomX = canvasWidth / isoWidth;
    const zoomY = canvasHeight / isoHeight;
    const fitZoom = Math.min(zoomX, zoomY);
    const desiredZoom = Phaser.Math.Clamp(
      fitZoom * DEFAULT_FIT_ZOOM_FACTOR,
      MIN_CAMERA_ZOOM,
      MAX_CAMERA_ZOOM
    );

    const camera = this.cameras.main;
    camera.setZoom(desiredZoom);

    const bounds = this.computeIsoBounds();
    const padding = this.tileSize * CAMERA_BOUND_PADDING_TILES;
    camera.setBounds(
      bounds.minX - padding,
      bounds.minY - padding,
      bounds.maxX - bounds.minX + padding * 2,
      bounds.maxY - bounds.minY + padding * 2
    );

    const centerX = (width - 1) / 2;
    const centerY = (height - 1) / 2;
    const centerPoint = this.calculatePixelPosition(centerX, centerY);
    const spawnPoint = this.playerInitialPosition
      ? this.calculatePixelPosition(
          this.playerInitialPosition.x,
          this.playerInitialPosition.y
        )
      : null;
    const focusPoint = spawnPoint ?? centerPoint;

    if (!this.isCameraFollowingPlayer) {
      camera.centerOn(focusPoint.x, focusPoint.y + tileHeight * 0.25);
    } else {
      this.recenterCameraOnPlayer();
    }

    this.renderStaticProps();
    this.drawBackdrop();
    this.drawMap(this.currentMapArea.tiles);
    this.drawBuildingLabels();
    this.clearPathPreview();

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

}
