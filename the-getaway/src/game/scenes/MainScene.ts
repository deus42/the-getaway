import Phaser from 'phaser';
import { MapArea, TileType, Position, Enemy, MapTile, NPC, AlertLevel, Item, SurveillanceZoneState } from '../interfaces/types';
import { DEFAULT_TILE_SIZE } from '../world/grid';
import { store } from '../../store';
import { updateGameTime as updateGameTimeAction } from '../../store/worldSlice';
import { DEFAULT_DAY_NIGHT_CONFIG, getDayNightOverlayColor } from '../world/dayNightCycle';
import {
  TILE_CLICK_EVENT,
  PATH_PREVIEW_EVENT,
  PLAYER_SCREEN_POSITION_EVENT,
  PathPreviewDetail,
  ViewportUpdateDetail,
  PlayerScreenPositionDetail,
} from '../events';
import { IsoObjectFactory, CharacterToken } from '../utils/IsoObjectFactory';
import { getIsoMetrics as computeIsoMetrics, toPixel as isoToPixel, getDiamondPoints as isoDiamondPoints, adjustColor as isoAdjustColor, IsoMetrics } from '../utils/iso';
import { getVisionConeTiles } from '../combat/perception';
import { LevelBuildingDefinition } from '../../content/levels/level0/types';
import { miniMapService } from '../services/miniMapService';
import CameraSprite from '../objects/CameraSprite';
import { CrtScanlinePipeline } from '../fx/CrtScanlinePipeline';
import { dystopianTokens } from '../../theme/dystopianTokens';

const parseHexColor = (hex: string) => Phaser.Display.Color.HexStringToColor(hex).color;
const themeColors = dystopianTokens.colors;
const themeFonts = dystopianTokens.fonts;
const themeMotion = dystopianTokens.motion;

const TILE_BASE_COLORS: Record<TileType | 'DEFAULT', { even: number; odd: number }> = {
  [TileType.WALL]: {
    even: parseHexColor('#1f2a32'),
    odd: parseHexColor('#162028'),
  },
  [TileType.COVER]: {
    even: parseHexColor('#1a2f2d'),
    odd: parseHexColor('#142524'),
  },
  [TileType.WATER]: {
    even: parseHexColor('#0d2d3a'),
    odd: parseHexColor('#0a2430'),
  },
  [TileType.TRAP]: {
    even: parseHexColor('#35212d'),
    odd: parseHexColor('#2a1a24'),
  },
  [TileType.DOOR]: {
    even: parseHexColor('#1d1d20'),
    odd: parseHexColor('#15161a'),
  },
  [TileType.FLOOR]: {
    even: parseHexColor('#152126'),
    odd: parseHexColor('#101a1f'),
  },
  DEFAULT: {
    even: parseHexColor('#152126'),
    odd: parseHexColor('#101a1f'),
  },
};

const DEFAULT_FIT_ZOOM_FACTOR = 1.25;
const MIN_CAMERA_ZOOM = 0.6;
const MAX_CAMERA_ZOOM = 2.3;
const CAMERA_BOUND_PADDING_TILES = 6;
const CAMERA_FOLLOW_LERP = 0.08;

interface ElevationProfile {
  heightOffset: number;
  topWidth: number;
  topHeight: number;
}

// Tracks enemy marker geometry alongside its floating health label
interface EnemySpriteData {
  token: CharacterToken;
  healthBar: Phaser.GameObjects.Graphics;
  nameLabel: Phaser.GameObjects.Text;
  markedForRemoval: boolean;
}

interface NpcSpriteData {
  token: CharacterToken;
  indicator?: Phaser.GameObjects.Graphics;
  nameLabel: Phaser.GameObjects.Text;
  markedForRemoval: boolean;
}

export class MainScene extends Phaser.Scene {
  private tileSize: number = DEFAULT_TILE_SIZE;
  private mapGraphics!: Phaser.GameObjects.Graphics;
  private backdropGraphics!: Phaser.GameObjects.Graphics;
  private pathGraphics!: Phaser.GameObjects.Graphics;
  private visionConeGraphics!: Phaser.GameObjects.Graphics;
  private playerToken?: CharacterToken;
  private playerNameLabel?: Phaser.GameObjects.Text;
  private enemySprites: Map<string, EnemySpriteData> = new Map();
  private npcSprites: Map<string, NpcSpriteData> = new Map();
  private cameraSprites: Map<string, CameraSprite> = new Map();
  private currentMapArea: MapArea | null = null;
  private buildingLabels: Phaser.GameObjects.Container[] = [];
  private unsubscribe: (() => void) | null = null;
  private playerInitialPosition?: Position;
  private dayNightOverlay!: Phaser.GameObjects.Rectangle;
  private curfewActive = false;
  private currentGameTime = 0;
  private timeDispatchAccumulator = 0;
  private isoOriginX = 0;
  private isoOriginY = 0;
  private isCameraFollowingPlayer = false;
  private lastPlayerGridPosition: Position | null = null;
  private inCombat = false;
  private playerVitalsIndicator?: Phaser.GameObjects.Graphics;
  private isoFactory?: IsoObjectFactory;
  private staticPropGroup?: Phaser.GameObjects.Group;
  private lastPlayerScreenDetail?: PlayerScreenPositionDetail;
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
    this.enemySprites = new Map<string, EnemySpriteData>(); // Reset map on init
    this.npcSprites = new Map<string, NpcSpriteData>();
    this.isCameraFollowingPlayer = false;
  }

  public create(): void {

    if (!this.currentMapArea) {
      console.error("[MainScene] currentMapArea is null on create!");
      return;
    }

    // Fill the entire canvas with background color
    this.cameras.main.setBackgroundColor(parseHexColor(themeColors.background));

    // Setup map graphics
    this.backdropGraphics = this.add.graphics();
    this.backdropGraphics.setDepth(-20);

    const renderer = this.game.renderer;
    if (renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
      const hasPipeline =
        typeof renderer.hasPipeline === 'function' &&
        renderer.hasPipeline(CrtScanlinePipeline.KEY);

      if (hasPipeline) {
        this.backdropGraphics.setPostPipeline(CrtScanlinePipeline.KEY);
      }
    }

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
    miniMapService.initialize(this);

    if (this.input) {
      this.input.on('pointerdown', this.handlePointerDown, this);
      this.input.on('wheel', this.handleWheel);
    }
    
    // Setup player token
    if (this.playerInitialPosition) {
      this.ensureIsoFactory();
      const token = this.isoFactory!.createCharacterToken(this.playerInitialPosition.x, this.playerInitialPosition.y, {
        baseColor: 0x0f172a,
        outlineColor: 0x2563eb,
        primaryColor: 0x2563eb,
        accentColor: 0x7dd3fc,
        glowColor: 0x38bdf8,
        columnHeight: 1.5,
        depthOffset: 10,
      });
      this.playerToken = token;

      const metrics = this.getIsoMetrics();
      const pixelPos = this.calculatePixelPosition(this.playerInitialPosition.x, this.playerInitialPosition.y);
      const playerName = store.getState().player.data.name ?? 'Operative';
      this.playerNameLabel = this.createCharacterNameLabel(
        playerName,
        parseHexColor(themeColors.accent),
        14
      );
      this.positionCharacterLabel(this.playerNameLabel, pixelPos.x, pixelPos.y, metrics.tileHeight * 1.6, 18);
      this.triggerFocusFlicker(this.playerNameLabel);
      this.applyMicroHover(this.playerNameLabel);

      this.enablePlayerCameraFollow();
    } else {
      console.error('[MainScene] playerInitialPosition is null');
    }

    // Subscribe to Redux store updates
    this.unsubscribe = store.subscribe(this.handleStateChange.bind(this));

    // Process initial enemies
    setTimeout(() => {
      if (this.sys.isActive()) {
        const initialState = store.getState();
        if (initialState?.world?.currentMapArea?.entities?.enemies) {
           this.updateEnemies(initialState.world.currentMapArea.entities.enemies);
        }
        if (initialState?.world?.currentMapArea?.entities?.npcs) {
          this.updateNpcs(initialState.world.currentMapArea.entities.npcs);
        }
        const zoneState = initialState?.surveillance?.zones?.[initialState.world.currentMapArea.id];
        const overlayEnabled = initialState?.surveillance?.hud?.overlayEnabled ?? false;
        this.updateSurveillanceCameras(zoneState, overlayEnabled);
        this.renderVisionCones();
      }
    }, 0);
  }

  private destroyCameraSprites(): void {
    this.cameraSprites.forEach((sprite) => {
      sprite.destroy(true);
    });
    this.cameraSprites.clear();
  }

  private cleanupScene(): void {
    if (this.input) {
      this.input.off('pointerdown', this.handlePointerDown, this);
      this.input.off('wheel', this.handleWheel);
    }
    this.scale.off('resize', this.handleResize, this);
    window.removeEventListener(PATH_PREVIEW_EVENT, this.handlePathPreview as EventListener);
    miniMapService.shutdown();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    this.destroyPlayerVitalsIndicator();
    this.destroyCameraSprites();
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
      this.currentMapArea = worldState.currentMapArea;
      // clear existing enemy sprites
      this.enemySprites.forEach((data) => {
        data.token.container.destroy(true);
        data.healthBar.destroy();
        data.nameLabel.destroy();
      });
      this.enemySprites.clear();
      this.npcSprites.forEach((data) => {
        data.token.container.destroy(true);
        data.nameLabel.destroy();
        if (data.indicator) {
          data.indicator.destroy();
        }
      });
      this.npcSprites.clear();
      this.destroyCameraSprites();
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
    const zoneState = newState.surveillance?.zones?.[this.currentMapArea.id];
    const overlayEnabled = newState.surveillance?.hud?.overlayEnabled ?? false;
    this.updateSurveillanceCameras(zoneState, overlayEnabled);
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
    const addProp = (prop?: Phaser.GameObjects.GameObject | null) => {
      if (!prop) {
        return;
      }
      this.staticPropGroup?.add(prop);
    };

    // All decorative building props removed - clean map with only NPC and item highlights
    const interactiveNpcs = (this.currentMapArea.entities.npcs ?? []).filter((npc) => npc.isInteractive);
    interactiveNpcs.forEach((npc) => {
      addProp(
        this.isoFactory!.createPulsingHighlight(npc.position.x, npc.position.y, {
          color: 0x22d3ee,
          alpha: 0.14,
          pulseColor: 0x7dd3fc,
          pulseAlpha: { from: 0.26, to: 0.05 },
          pulseScale: 1.22,
          widthScale: 0.58,
          heightScale: 0.58,
          depthOffset: 9,
          duration: 1400,
        })
      );
    });

    const itemMarkers = (this.currentMapArea.entities.items ?? []).filter(
      (item): item is Item & { position: Position } => Boolean(item.position)
    );

    itemMarkers.forEach((item) => {
      const color = item.isQuestItem ? 0xfacc15 : 0x10b981;
      const pulseColor = item.isQuestItem ? 0xfff3bf : 0x6ee7b7;
      addProp(
        this.isoFactory!.createPulsingHighlight(item.position.x, item.position.y, {
          color,
          alpha: 0.18,
          pulseColor,
          pulseAlpha: { from: 0.28, to: 0.06 },
          pulseScale: item.isQuestItem ? 1.25 : 1.18,
          widthScale: 0.62,
          heightScale: 0.62,
          depthOffset: 8,
          duration: item.isQuestItem ? 1250 : 1450,
        })
      );
    });
  }
  
  private updatePlayerPosition(position: Position): void {
    if (!this.playerToken) {
      console.warn('[MainScene] Player token not available for position update.');
      return;
    }

    const hasPlayerMoved =
      !this.lastPlayerGridPosition ||
      this.lastPlayerGridPosition.x !== position.x ||
      this.lastPlayerGridPosition.y !== position.y;

    this.ensureIsoFactory();
    this.isoFactory!.positionCharacterToken(this.playerToken, position.x, position.y);

    const pixelPos = this.calculatePixelPosition(position.x, position.y);
    this.dispatchPlayerScreenPosition();
    if (this.playerNameLabel) {
      const metrics = this.getIsoMetrics();
      this.positionCharacterLabel(this.playerNameLabel, pixelPos.x, pixelPos.y, metrics.tileHeight * 1.6, 18);
    }

    if (hasPlayerMoved) {
      this.lastPlayerGridPosition = { ...position };
      if (!this.isCameraFollowingPlayer) {
        this.enablePlayerCameraFollow();
      }
    }
  }

  private updatePlayerVitalsIndicator(position: Position, health: number, maxHealth: number): void {
    if (!this.inCombat) {
      this.destroyPlayerVitalsIndicator();
      return;
    }

    if (!this.playerToken || !this.sys.isActive()) {
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

  private enablePlayerCameraFollow(): void {
    if (!this.playerToken || !this.sys.isActive()) {
      return;
    }

    const camera = this.cameras.main;
    if (!this.isCameraFollowingPlayer) {
      camera.startFollow(this.playerToken.container, false, CAMERA_FOLLOW_LERP, CAMERA_FOLLOW_LERP);
    }
    camera.setDeadzone(Math.max(120, this.scale.width * 0.22), Math.max(160, this.scale.height * 0.28));
    this.isCameraFollowingPlayer = true;
    this.recenterCameraOnPlayer();
    this.dispatchPlayerScreenPosition();
  }

  private recenterCameraOnPlayer(): void {
    if (!this.playerToken || !this.sys.isActive()) {
      return;
    }

    const camera = this.cameras.main;
    camera.centerOn(this.playerToken.container.x, this.playerToken.container.y);
    this.dispatchPlayerScreenPosition();
  }

  private updateEnemies(enemies: Enemy[]) {
    if (!this.mapGraphics || !this.sys.isActive()) {
      return;
    }

    this.ensureIsoFactory();

    this.enemySprites.forEach((spriteData) => {
      spriteData.markedForRemoval = true;
    });

    const metrics = this.getIsoMetrics();

    for (const enemy of enemies) {
      const existingSpriteData = this.enemySprites.get(enemy.id);
      const pixelPos = this.calculatePixelPosition(enemy.position.x, enemy.position.y);

      if (!existingSpriteData) {
        if (enemy.health <= 0) {
          continue;
        }

        const token = this.isoFactory!.createCharacterToken(enemy.position.x, enemy.position.y, {
          baseColor: 0x1e1b2f,
          outlineColor: 0x7f1d1d,
          primaryColor: 0xef4444,
          accentColor: 0xf97316,
          glowColor: 0xfb7185,
          columnHeight: 1.3,
          depthOffset: 8,
        });

        const healthBar = this.add.graphics();
        healthBar.setVisible(false);

        const nameLabel = this.createCharacterNameLabel(enemy.name ?? 'Hostile', 0xef4444);
        this.positionCharacterLabel(nameLabel, pixelPos.x, pixelPos.y, metrics.tileHeight * 1.45, 14);

        this.enemySprites.set(enemy.id, {
          token,
          healthBar,
          nameLabel,
          markedForRemoval: false,
        });

        const createdData = this.enemySprites.get(enemy.id);
        if (createdData) {
          this.updateEnemyHealthBar(createdData, pixelPos, metrics, enemy);
        }

        continue;
      }

      if (enemy.health <= 0) {
        existingSpriteData.markedForRemoval = true;
        continue;
      }

      this.isoFactory!.positionCharacterToken(existingSpriteData.token, enemy.position.x, enemy.position.y);
      existingSpriteData.markedForRemoval = false;
      this.positionCharacterLabel(existingSpriteData.nameLabel, pixelPos.x, pixelPos.y, metrics.tileHeight * 1.45, 14);

      this.updateEnemyHealthBar(existingSpriteData, pixelPos, metrics, enemy);
    }

    this.enemySprites.forEach((spriteData, id) => {
      if (spriteData.markedForRemoval) {
        spriteData.token.container.destroy(true);
        spriteData.healthBar.destroy();
        spriteData.nameLabel.destroy();
        this.enemySprites.delete(id);
      }
    });
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

  private updateNpcs(npcs: NPC[]): void {
    if (!this.sys.isActive()) {
      return;
    }

    this.npcSprites.forEach((spriteData) => {
      spriteData.markedForRemoval = true;
    });

    this.ensureIsoFactory();
    const metrics = this.getIsoMetrics();

    for (const npc of npcs) {
      const existingSpriteData = this.npcSprites.get(npc.id);
      const pixelPos = this.calculatePixelPosition(npc.position.x, npc.position.y);

      if (!existingSpriteData) {
        const token = this.isoFactory!.createCharacterToken(npc.position.x, npc.position.y, {
          baseColor: 0x142027,
          outlineColor: npc.isInteractive ? 0x0ea5e9 : 0x4b5563,
          primaryColor: npc.isInteractive ? 0x22d3ee : 0x94a3b8,
          accentColor: npc.isInteractive ? 0x38bdf8 : 0xcbd5f5,
          glowColor: npc.isInteractive ? 0x22d3ee : 0x64748b,
          columnHeight: 1.15,
          depthOffset: 7,
        });

        const nameLabel = this.createCharacterNameLabel(npc.name ?? 'Civilian', npc.isInteractive ? 0x22d3ee : 0x94a3b8);
        this.positionCharacterLabel(nameLabel, pixelPos.x, pixelPos.y, metrics.tileHeight * 1.35, 12);

        const npcData: NpcSpriteData = {
          token,
          nameLabel,
          markedForRemoval: false,
        };

        this.npcSprites.set(npc.id, npcData);
        this.updateNpcCombatIndicator(npcData, pixelPos, metrics, npc);
        continue;
      }

      this.isoFactory!.positionCharacterToken(existingSpriteData.token, npc.position.x, npc.position.y);
      existingSpriteData.markedForRemoval = false;
      this.positionCharacterLabel(existingSpriteData.nameLabel, pixelPos.x, pixelPos.y, metrics.tileHeight * 1.35, 12);
      this.updateNpcCombatIndicator(existingSpriteData, pixelPos, metrics, npc);
    }

    this.npcSprites.forEach((spriteData, id) => {
      if (spriteData.markedForRemoval) {
        spriteData.token.container.destroy(true);
        spriteData.nameLabel.destroy();
        if (spriteData.indicator) {
          spriteData.indicator.destroy();
        }
        this.npcSprites.delete(id);
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

  private updateSurveillanceCameras(zone?: SurveillanceZoneState, overlayEnabled: boolean = false): void {
    if (!zone || !this.currentMapArea) {
      if (this.cameraSprites.size > 0) {
        this.destroyCameraSprites();
      }
      return;
    }

    const remainingIds = new Set(this.cameraSprites.keys());
    const metrics = this.getIsoMetrics();

    Object.values(zone.cameras).forEach((camera) => {
      remainingIds.delete(camera.id);
      const pixelPos = this.calculatePixelPosition(camera.position.x, camera.position.y);
      let sprite = this.cameraSprites.get(camera.id);

      if (!sprite) {
        sprite = new CameraSprite(this, pixelPos.x, pixelPos.y, {
          tileSize: this.tileSize,
          rangeTiles: camera.range,
          fieldOfView: camera.fieldOfView,
          initialDirection: camera.currentDirection,
        });
        this.cameraSprites.set(camera.id, sprite);
      } else {
        sprite.setPosition(pixelPos.x, pixelPos.y);
        sprite.setRangeTiles(camera.range);
      }

      sprite.setDepth(pixelPos.y + metrics.tileHeight * 0.5);
      sprite.setOverlayVisible(overlayEnabled);
      sprite.setActiveState(camera.isActive);
      sprite.setAlertState(camera.alertState);
      sprite.setDirection(camera.currentDirection);
    });

    remainingIds.forEach((cameraId) => {
      const sprite = this.cameraSprites.get(cameraId);
      if (sprite) {
        sprite.destroy(true);
      }
      this.cameraSprites.delete(cameraId);
    });
  }

  public shutdown(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.enemySprites.forEach((data) => {
      data.token.container.destroy(true);
      data.healthBar.destroy();
      data.nameLabel.destroy();
    });
    this.enemySprites.clear();

    this.npcSprites.forEach((data) => {
      data.token.container.destroy(true);
      data.nameLabel.destroy();
      if (data.indicator) {
        data.indicator.destroy();
      }
    });
    this.npcSprites.clear();
    this.destroyCameraSprites();
    if (this.playerToken) {
      this.playerToken.container.destroy(true);
      this.playerToken = undefined;
      this.lastPlayerScreenDetail = undefined;
    }
    if (this.playerNameLabel) {
      this.playerNameLabel.destroy();
      this.playerNameLabel = undefined;
    }
    this.destroyPlayerVitalsIndicator();
    this.scale.off('resize', this.handleResize, this);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener(PATH_PREVIEW_EVENT, this.handlePathPreview as EventListener);
    if (this.input) {
      this.input.off('pointerdown', this.handlePointerDown, this);
    }
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
      }
    }
  }

  private drawBuildingLabels(): void {
    this.buildingLabels.forEach((label) => label.destroy(true));
    this.buildingLabels = [];

    // Neon signage has been retired; buildings no longer spawn floating marquees.
  }

  private renderTile(
    tile: MapTile,
    center: { x: number; y: number },
    tileWidth: number,
    tileHeight: number,
    gridX: number,
    gridY: number
  ): void {
    const baseColor = this.getTileBaseColor(tile, gridX, gridY);
    const variationSeed = ((((gridX * 11) ^ (gridY * 7)) % 7) - 3) * 0.012;
    const modulatedBase = this.adjustColor(baseColor, variationSeed);
    const highlightColor = this.adjustColor(modulatedBase, 0.16);
    const shadowColor = this.adjustColor(modulatedBase, -0.18);

    const tilePoints = this.getDiamondPoints(center.x, center.y, tileWidth, tileHeight);

    const elevation = this.getTileElevation(tile.type);
    const profile = this.getElevationProfile(elevation, tileWidth, tileHeight);

    this.renderTileShadow(center, tileWidth, tileHeight, modulatedBase, elevation);

    this.mapGraphics.fillStyle(modulatedBase, 1);
    this.mapGraphics.fillPoints(tilePoints, true);

    let capPoints: Phaser.Geom.Point[] | null = null;

    if (elevation > 0) {
      capPoints = this.renderElevationPrism(
        tilePoints,
        center,
        tileWidth,
        tileHeight,
        modulatedBase,
        elevation,
        profile
      );
    } else {
      this.renderFlatTileHighlights(center, tilePoints, highlightColor, shadowColor, tileWidth, tileHeight);
    }

    switch (tile.type) {
      case TileType.COVER:
        if (capPoints) {
          this.renderCoverDetails(capPoints, tilePoints, modulatedBase, profile);
        }
        break;
      case TileType.WALL:
        if (capPoints) {
          this.renderWallDetails(capPoints, tilePoints, modulatedBase, profile);
        }
        break;
      case TileType.WATER:
        this.renderWaterTile(center, tileWidth, tileHeight, modulatedBase);
        break;
      case TileType.TRAP:
        this.renderTrapTile(center, tileWidth, tileHeight, modulatedBase);
        break;
      case TileType.DOOR:
        this.drawDoorTile(center.x, center.y);
        break;
      case TileType.FLOOR:
        // Cyberpunk scan line grid - subtle data grid aesthetic
        if (gridX % 4 === 0 || gridY % 4 === 0) {
          this.mapGraphics.lineStyle(0.8, 0x1e40af, 0.08);
          this.mapGraphics.strokePoints(tilePoints, true);
        }
        break;
      default:
        break;
    }

    const outlineColor = this.adjustColor(modulatedBase, elevation > 0 ? -0.22 : -0.3);
    const outlineAlpha = elevation > 0 ? 0.55 : 0.35;
    this.mapGraphics.lineStyle(1, outlineColor, outlineAlpha);
    this.mapGraphics.strokePoints(tilePoints, true);

    if (capPoints) {
      const capOutline = this.adjustColor(modulatedBase, -0.12);
      this.mapGraphics.lineStyle(1, capOutline, 0.6);
      this.mapGraphics.strokePoints(capPoints, true);
    }
  }

  private renderTileShadow(
    center: { x: number; y: number },
    tileWidth: number,
    tileHeight: number,
    baseColor: number,
    elevation: number
  ): void {
    const widthScale = elevation > 0 ? 1.08 + Math.min(0.22, elevation * 0.2) : 1.03;
    const heightScale = elevation > 0 ? 1.14 + Math.min(0.34, elevation * 0.24) : 1.1;
    const offsetScale = elevation > 0 ? 0.82 + Math.min(0.28, elevation * 0.18) : 0.78;
    const alpha = elevation > 0 ? 0.42 + Math.min(0.2, elevation * 0.18) : 0.28;

    const shadowPoints = this.getDiamondPoints(
      center.x + tileWidth * 0.08,
      center.y + tileHeight * offsetScale,
      tileWidth * widthScale,
      tileHeight * heightScale
    );

    this.mapGraphics.fillStyle(this.adjustColor(baseColor, -0.42), alpha);
    this.mapGraphics.fillPoints(shadowPoints, true);
  }

  private renderFlatTileHighlights(
    center: { x: number; y: number },
    _tilePoints: Phaser.Geom.Point[],
    highlightColor: number,
    shadowColor: number,
    tileWidth: number,
    tileHeight: number
  ): void {
    const halfWidth = tileWidth / 2;
    const halfHeight = tileHeight / 2;

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
  }

  private renderElevationPrism(
    basePoints: Phaser.Geom.Point[],
    center: { x: number; y: number },
    _tileWidth: number,
    _tileHeight: number,
    baseColor: number,
    elevation: number,
    profile: ElevationProfile
  ): Phaser.Geom.Point[] {
    const topPoints = this.getDiamondPoints(
      center.x,
      center.y - profile.heightOffset,
      profile.topWidth,
      profile.topHeight
    );

    const rightFace = [basePoints[1], basePoints[2], topPoints[2], topPoints[1]];
    const frontFace = [basePoints[2], basePoints[3], topPoints[3], topPoints[2]];

    const rightTint = this.adjustColor(baseColor, -0.12 - elevation * 0.08);
    const frontTint = this.adjustColor(baseColor, -0.22 - elevation * 0.1);

    this.mapGraphics.fillStyle(frontTint, 0.95);
    this.mapGraphics.fillPoints(frontFace, true);

    this.mapGraphics.fillStyle(rightTint, 0.98);
    this.mapGraphics.fillPoints(rightFace, true);

    const capColor = this.adjustColor(baseColor, 0.12 + elevation * 0.08);
    this.mapGraphics.fillStyle(capColor, 1);
    this.mapGraphics.fillPoints(topPoints, true);

    return topPoints;
  }

  private renderWallDetails(
    capPoints: Phaser.Geom.Point[],
    basePoints: Phaser.Geom.Point[],
    baseColor: number,
    profile: ElevationProfile
  ): void {
    const bandTopLeft = this.lerpPoint(capPoints[3], basePoints[3], 0.28);
    const bandTopRight = this.lerpPoint(capPoints[2], basePoints[2], 0.28);
    const bandBottomRight = this.lerpPoint(capPoints[2], basePoints[2], 0.72);
    const bandBottomLeft = this.lerpPoint(capPoints[3], basePoints[3], 0.72);

    this.mapGraphics.fillStyle(0x38bdf8, 0.32);
    this.mapGraphics.fillPoints(
      [bandTopLeft, bandTopRight, bandBottomRight, bandBottomLeft],
      true
    );

    const sillInset = 0.86;
    const sillLeft = this.lerpPoint(capPoints[3], basePoints[3], sillInset);
    const sillRight = this.lerpPoint(capPoints[2], basePoints[2], sillInset);
    const sillThickness = profile.topHeight * 0.18;

    const sillPoints = [
      new Phaser.Geom.Point(sillLeft.x, sillLeft.y),
      new Phaser.Geom.Point(sillRight.x, sillRight.y),
      new Phaser.Geom.Point(sillRight.x, sillRight.y + sillThickness),
      new Phaser.Geom.Point(sillLeft.x, sillLeft.y + sillThickness),
    ];

    this.mapGraphics.fillStyle(this.adjustColor(baseColor, -0.35), 0.85);
    this.mapGraphics.fillPoints(sillPoints, true);

    const glow = [
      this.lerpPoint(capPoints[3], basePoints[3], 0.08),
      this.lerpPoint(capPoints[2], basePoints[2], 0.08),
      this.lerpPoint(capPoints[2], basePoints[2], 0.16),
      this.lerpPoint(capPoints[3], basePoints[3], 0.16),
    ];

    this.mapGraphics.fillStyle(0x60a5fa, 0.22);
    this.mapGraphics.fillPoints(glow, true);
  }

  private renderCoverDetails(
    capPoints: Phaser.Geom.Point[],
    basePoints: Phaser.Geom.Point[],
    baseColor: number,
    profile: ElevationProfile
  ): void {
    const topPlate = this.getDiamondPoints(
      (capPoints[0].x + capPoints[2].x) / 2,
      (capPoints[0].y + capPoints[2].y) / 2,
      profile.topWidth * 0.7,
      profile.topHeight * 0.55
    );

    this.mapGraphics.fillStyle(this.adjustColor(baseColor, 0.28), 0.85);
    this.mapGraphics.fillPoints(topPlate, true);

    const frontLip = [
      this.lerpPoint(capPoints[3], basePoints[3], 0.35),
      this.lerpPoint(capPoints[2], basePoints[2], 0.35),
      this.lerpPoint(capPoints[2], basePoints[2], 0.58),
      this.lerpPoint(capPoints[3], basePoints[3], 0.58),
    ];

    this.mapGraphics.fillStyle(this.adjustColor(baseColor, -0.08), 0.78);
    this.mapGraphics.fillPoints(frontLip, true);

    // Hazard stripes - diagonal yellow/black pattern on front face
    const stripeCount = 3;
    const stripeSpacing = (frontLip[1].x - frontLip[0].x) / (stripeCount * 2);

    this.mapGraphics.lineStyle(1.8, 0xfbbf24, 0.45);
    for (let i = 0; i < stripeCount; i++) {
      const offset = i * stripeSpacing * 2;
      const x1 = frontLip[0].x + offset;
      const x2 = frontLip[0].x + offset + stripeSpacing * 0.7;
      const y1 = frontLip[0].y + (frontLip[2].y - frontLip[0].y) * 0.15;
      const y2 = frontLip[2].y - (frontLip[2].y - frontLip[0].y) * 0.15;

      this.mapGraphics.lineBetween(x1, y1, x2, y2);
    }

    const braceLeftTop = this.lerpPoint(capPoints[3], basePoints[3], 0.45);
    const braceLeftBottom = this.lerpPoint(capPoints[3], basePoints[3], 0.86);
    const braceRightTop = this.lerpPoint(capPoints[2], basePoints[2], 0.45);
    const braceRightBottom = this.lerpPoint(capPoints[2], basePoints[2], 0.86);

    this.mapGraphics.lineStyle(1.4, this.adjustColor(baseColor, -0.2), 0.7);
    this.mapGraphics.lineBetween(braceLeftTop.x, braceLeftTop.y, braceLeftBottom.x, braceLeftBottom.y);
    this.mapGraphics.lineBetween(braceRightTop.x, braceRightTop.y, braceRightBottom.x, braceRightBottom.y);
  }

  private renderWaterTile(
    center: { x: number; y: number },
    tileWidth: number,
    tileHeight: number,
    baseColor: number
  ): void {
    // Animated shimmer effect
    const time = this.time.now;
    const shimmerCycle = 2000; // 2 second cycle
    const shimmerPhase = (time % shimmerCycle) / shimmerCycle;
    const shimmerIntensity = 0.5 + 0.5 * Math.sin(shimmerPhase * Math.PI * 2);

    const sheenColor = this.adjustColor(baseColor, 0.3);
    const sheenAlpha = 0.2 + 0.12 * shimmerIntensity;

    this.mapGraphics.fillStyle(sheenColor, sheenAlpha);
    this.mapGraphics.fillPoints(
      this.getDiamondPoints(center.x, center.y - tileHeight * 0.06, tileWidth * 0.6, tileHeight * 0.5),
      true
    );

    // Subtle cyan glow underneath - cyberpunk contaminated water
    this.mapGraphics.fillStyle(0x06b6d4, 0.08 + 0.06 * shimmerIntensity);
    this.mapGraphics.fillPoints(
      this.getDiamondPoints(center.x, center.y, tileWidth * 0.45, tileHeight * 0.4),
      true
    );

    const rippleAlpha = 0.35 + 0.15 * shimmerIntensity;
    this.mapGraphics.lineStyle(1, this.adjustColor(sheenColor, 0.25), rippleAlpha);
    for (let ripple = 0; ripple < 2; ripple++) {
      const scale = 0.82 - ripple * 0.22;
      const ripplePoints = this.getDiamondPoints(center.x, center.y, tileWidth * scale, tileHeight * scale);
      this.mapGraphics.strokePoints(ripplePoints, true);
    }
  }

  private renderTrapTile(
    center: { x: number; y: number },
    tileWidth: number,
    tileHeight: number,
    baseColor: number
  ): void {
    // Animated pulsing effect - breathes to indicate danger
    const time = this.time.now;
    const pulseCycle = 1500; // 1.5 second cycle
    const pulsePhase = (time % pulseCycle) / pulseCycle;
    const pulseIntensity = 0.5 + 0.5 * Math.sin(pulsePhase * Math.PI * 2);

    const pulseColor = this.adjustColor(baseColor, 0.6);
    const baseAlpha = 0.15 + 0.12 * pulseIntensity;

    this.mapGraphics.fillStyle(pulseColor, baseAlpha);
    this.mapGraphics.fillPoints(
      this.getDiamondPoints(center.x, center.y, tileWidth * 0.58, tileHeight * 0.6),
      true
    );

    const crossAlpha = 0.1 + 0.08 * pulseIntensity;
    this.mapGraphics.fillStyle(pulseColor, crossAlpha);
    this.mapGraphics.fillPoints(
      this.getDiamondPoints(center.x, center.y, tileWidth * 0.3, tileHeight * 0.96),
      true
    );
    this.mapGraphics.fillPoints(
      this.getDiamondPoints(center.x, center.y, tileWidth * 0.96, tileHeight * 0.3),
      true
    );

    const outlineAlpha = 0.65 + 0.2 * pulseIntensity;
    this.mapGraphics.lineStyle(1.2, this.adjustColor(pulseColor, 0.35), outlineAlpha);
    this.mapGraphics.strokePoints(
      this.getDiamondPoints(center.x, center.y, tileWidth * 0.82, tileHeight * 0.32),
      true
    );
  }

  private drawDoorTile(centerX: number, centerY: number): void {
    if (!this.mapGraphics) {
      return;
    }

    const { tileWidth, tileHeight } = this.getIsoMetrics();
    const basePoints = this.getDiamondPoints(centerX, centerY, tileWidth, tileHeight);

    const wallElevation = this.getTileElevation(TileType.WALL);
    const profile = this.getElevationProfile(wallElevation, tileWidth, tileHeight);
    const capPoints = this.getDiamondPoints(
      centerX,
      centerY - profile.heightOffset,
      profile.topWidth,
      profile.topHeight
    );

    const frontTopLeft = capPoints[3];
    const frontTopRight = capPoints[2];
    const frontBottomLeft = basePoints[3];
    const frontBottomRight = basePoints[2];

    const frameTopLeft = this.lerpPoint(frontTopLeft, frontBottomLeft, 0.15);
    const frameTopRight = this.lerpPoint(frontTopRight, frontBottomRight, 0.15);
    const frameBottomRight = this.lerpPoint(frontTopRight, frontBottomRight, 0.88);
    const frameBottomLeft = this.lerpPoint(frontTopLeft, frontBottomLeft, 0.88);

    // Outer frame - dark metallic
    this.mapGraphics.fillStyle(0x1a1f2e, 0.98);
    this.mapGraphics.fillPoints([frameTopLeft, frameTopRight, frameBottomRight, frameBottomLeft], true);

    // Frame highlights - cyberpunk edge lighting
    this.mapGraphics.lineStyle(1.8, 0x38bdf8, 0.65);
    this.mapGraphics.strokePoints([frameTopLeft, frameTopRight], false);
    this.mapGraphics.lineStyle(1.2, 0x1e40af, 0.45);
    this.mapGraphics.strokePoints([frameBottomLeft, frameBottomRight], false);

    // Door panel with gradient effect
    const panelInset = 0.18;
    const panelTopLeft = this.lerpPoint(frameTopLeft, frameBottomLeft, panelInset);
    const panelTopRight = this.lerpPoint(frameTopRight, frameBottomRight, panelInset);
    const panelBottomRight = this.lerpPoint(frameTopRight, frameBottomRight, 1 - panelInset * 0.4);
    const panelBottomLeft = this.lerpPoint(frameTopLeft, frameBottomLeft, 1 - panelInset * 0.4);

    // Main panel - dark with slight transparency for depth
    this.mapGraphics.fillStyle(0x0f172a, 0.85);
    this.mapGraphics.fillPoints([panelTopLeft, panelTopRight, panelBottomRight, panelBottomLeft], true);

    // Panel highlight overlay - creates glass/holographic effect
    const highlightTopLeft = this.lerpPoint(panelTopLeft, panelBottomLeft, 0.05);
    const highlightTopRight = this.lerpPoint(panelTopRight, panelBottomRight, 0.05);
    const highlightBottomRight = this.lerpPoint(panelTopRight, panelBottomRight, 0.35);
    const highlightBottomLeft = this.lerpPoint(panelTopLeft, panelBottomLeft, 0.35);

    this.mapGraphics.fillStyle(0x38bdf8, 0.12);
    this.mapGraphics.fillPoints([highlightTopLeft, highlightTopRight, highlightBottomRight, highlightBottomLeft], true);

    // Access panel indicator - small cyan accent
    const indicatorTop = this.lerpPoint(panelTopLeft, panelTopRight, 0.78);
    const indicatorBottom = this.lerpPoint(
      this.lerpPoint(panelTopLeft, panelBottomLeft, 0.28),
      this.lerpPoint(panelTopRight, panelBottomRight, 0.28),
      0.78
    );
    const indicatorHeight = Math.abs(indicatorBottom.y - indicatorTop.y);
    const indicatorWidth = indicatorHeight * 0.4;

    this.mapGraphics.fillStyle(0x06b6d4, 0.9);
    this.mapGraphics.fillRect(
      indicatorTop.x - indicatorWidth / 2,
      indicatorTop.y,
      indicatorWidth,
      indicatorHeight
    );

    // Glowing accent line
    this.mapGraphics.lineStyle(0.8, 0x22d3ee, 0.7);
    this.mapGraphics.strokePoints([panelTopLeft, panelTopRight], false);
  }

  private getTileElevation(type: TileType): number {
    switch (type) {
      case TileType.WALL:
        return 1;
      case TileType.COVER:
        return 0.45;
      default:
        return 0;
    }
  }

  private getElevationProfile(elevation: number, tileWidth: number, tileHeight: number): ElevationProfile {
    if (elevation <= 0) {
      return {
        heightOffset: tileHeight * 0.38,
        topWidth: tileWidth,
        topHeight: tileHeight,
      };
    }

    const heightOffset = tileHeight * (0.48 + elevation * 0.78);
    const widthScale = Math.max(0.7, 1 - elevation * 0.08);
    const heightScale = Math.max(0.62, 1 - elevation * 0.1);

    return {
      heightOffset,
      topWidth: tileWidth * widthScale,
      topHeight: tileHeight * heightScale,
    };
  }

  private lerpPoint(a: Phaser.Geom.Point, b: Phaser.Geom.Point, t: number): Phaser.Geom.Point {
    return new Phaser.Geom.Point(
      Phaser.Math.Linear(a.x, b.x, t),
      Phaser.Math.Linear(a.y, b.y, t)
    );
  }

  private createCharacterNameLabel(
    name: string,
    accentColor: number,
    fontSize: number = 12
  ): Phaser.GameObjects.Text {
    const label = this.add.text(0, 0, name.toUpperCase(), {
      fontFamily: themeFonts.heading,
      fontSize: `${fontSize}px`,
      fontStyle: '700',
      color: themeColors.foreground,
      align: 'center',
    });
    label.setOrigin(0.5, 1);
    label.setStroke(this.colorToHex(accentColor), 1.4);
    label.setShadow(0, 0, this.colorToHex(accentColor), 8, true, true);
    label.setBlendMode(Phaser.BlendModes.ADD);
    label.setAlpha(0.95);
    return label;
  }

  private positionCharacterLabel(
    label: Phaser.GameObjects.Text,
    pixelX: number,
    pixelY: number,
    verticalOffset: number,
    depthBoost: number
  ): void {
    label.setPosition(pixelX, pixelY - verticalOffset);
    label.setDepth(pixelY + depthBoost);
  }

  private colorToHex(color: number): string {
    return `#${color.toString(16).padStart(6, '0')}`;
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

  private dispatchPlayerScreenPosition(): void {
    if (!this.playerToken || !this.sys.isActive()) {
      return;
    }

    const camera = this.cameras.main;
    const container = this.playerToken.container;

    const worldX = container.x;
    const worldY = container.y;
    const screenX = (worldX - camera.worldView.x) * camera.zoom;
    const screenY = (worldY - camera.worldView.y) * camera.zoom;

    const rect = this.game.canvas?.getBoundingClientRect();
    const displayWidth = rect?.width ?? this.scale.width;
    const displayHeight = rect?.height ?? this.scale.height;

    const detail: PlayerScreenPositionDetail = {
      worldX,
      worldY,
      screenX,
      screenY,
      canvasWidth: this.scale.width,
      canvasHeight: this.scale.height,
      canvasDisplayWidth: displayWidth,
      canvasDisplayHeight: displayHeight,
      canvasLeft: rect?.left ?? 0,
      canvasTop: rect?.top ?? 0,
      zoom: camera.zoom,
      timestamp: typeof performance !== 'undefined' ? performance.now() : Date.now(),
    };

    const last = this.lastPlayerScreenDetail;
    if (
      last &&
      Math.abs(last.screenX - detail.screenX) < 0.5 &&
      Math.abs(last.screenY - detail.screenY) < 0.5 &&
      Math.abs(last.zoom - detail.zoom) < 0.0001 &&
      last.canvasWidth === detail.canvasWidth &&
      last.canvasHeight === detail.canvasHeight
    ) {
      return;
    }

    this.lastPlayerScreenDetail = detail;
    if (typeof window !== 'undefined') {
      window.__getawayPlayerScreenPosition = detail;
      window.dispatchEvent(new CustomEvent(PLAYER_SCREEN_POSITION_EVENT, { detail }));
    }
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

  private worldToGridContinuous(worldX: number, worldY: number): { x: number; y: number } | null {
    const { halfTileWidth, halfTileHeight } = this.getIsoMetrics();

    const relativeX = worldX - this.isoOriginX;
    const relativeY = worldY - this.isoOriginY;

    const gridX = (relativeY / halfTileHeight + relativeX / halfTileWidth) * 0.5;
    const gridY = (relativeY / halfTileHeight - relativeX / halfTileWidth) * 0.5;

    if (!Number.isFinite(gridX) || !Number.isFinite(gridY)) {
      return null;
    }

    return { x: gridX, y: gridY };
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
    this.emitViewportUpdate();
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

  private clampCameraCenterTarget(targetX: number, targetY: number): { x: number; y: number } {
    const camera = this.cameras.main;
    const bounds = camera.getBounds();

    if (!bounds) {
      return { x: targetX, y: targetY };
    }

    const viewWidth = camera.worldView.width;
    const viewHeight = camera.worldView.height;
    const halfWidth = viewWidth / 2;
    const halfHeight = viewHeight / 2;

    const minX = bounds.x + halfWidth;
    const maxX = bounds.x + Math.max(halfWidth, bounds.width - halfWidth);
    const minY = bounds.y + halfHeight;
    const maxY = bounds.y + Math.max(halfHeight, bounds.height - halfHeight);

    const clampedX = Phaser.Math.Clamp(targetX, minX, Math.max(minX, maxX));
    const clampedY = Phaser.Math.Clamp(targetY, minY, Math.max(minY, maxY));

    return { x: clampedX, y: clampedY };
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

    // Color-code path by length/cost - green (cheap) to red (expensive)
    const pathLength = detail.path.length;

    detail.path.forEach((position, index) => {
      const center = this.calculatePixelPosition(position.x, position.y);
      const scale = index === detail.path.length - 1 ? 0.8 : 0.55;
      const points = this.getDiamondPoints(
        center.x,
        center.y,
        tileWidth * scale,
        tileHeight * scale
      );

      let color: number;
      let alpha: number;

      if (index === detail.path.length - 1) {
        // Destination marker - bright yellow
        color = 0xffc857;
        alpha = 0.5;
      } else {
        // Path steps - color by total cost
        // Green (1-3 steps), Yellow (4-6), Orange (7-9), Red (10+)
        if (pathLength <= 3) {
          color = 0x34d399; // Green - low cost
          alpha = 0.32;
        } else if (pathLength <= 6) {
          color = 0xfbbf24; // Yellow - medium cost
          alpha = 0.35;
        } else if (pathLength <= 9) {
          color = 0xfb923c; // Orange - high cost
          alpha = 0.38;
        } else {
          color = 0xf87171; // Red - very high cost
          alpha = 0.4;
        }
      }

      this.pathGraphics.fillStyle(color, alpha);
      this.pathGraphics.fillPoints(points, true);
    });
  };

  private clearPathPreview(): void {
    if (this.pathGraphics) {
      this.pathGraphics.clear();
    }
  }

  private emitViewportUpdate(): void {
    if (!this.currentMapArea || !this.sys.isActive()) {
      return;
    }

    const camera = this.cameras.main;

    const topLeft = this.worldToGridContinuous(camera.worldView.x, camera.worldView.y);
    const bottomRight = this.worldToGridContinuous(
      camera.worldView.x + camera.worldView.width,
      camera.worldView.y + camera.worldView.height
    );

    if (!topLeft || !bottomRight) {
      return;
    }

    const minX = Math.min(topLeft.x, bottomRight.x);
    const minY = Math.min(topLeft.y, bottomRight.y);
    const maxX = Math.max(topLeft.x, bottomRight.x);
    const maxY = Math.max(topLeft.y, bottomRight.y);

    const width = Math.max(0.0001, maxX - minX);
    const height = Math.max(0.0001, maxY - minY);

    const detail: ViewportUpdateDetail = {
      x: minX,
      y: minY,
      width,
      height,
    };

    miniMapService.updateViewport({
      ...detail,
      zoom: camera.zoom,
    });
  }

  public focusCameraOnGridPosition(gridX: number, gridY: number, animate = true): void {
    if (!this.sys.isActive() || !this.currentMapArea) {
      return;
    }

    const metrics = this.getIsoMetrics();
    const pixelPos = this.calculatePixelPosition(gridX, gridY);
    const desiredX = pixelPos.x;
    const desiredY = pixelPos.y + metrics.halfTileHeight;
    const { x: targetX, y: targetY } = this.clampCameraCenterTarget(desiredX, desiredY);
    const camera = this.cameras.main;

    this.isCameraFollowingPlayer = false;
    camera.stopFollow();

    const finalize = () => {
      this.clampCameraToBounds(camera);
      this.emitViewportUpdate();
    };

    if (animate) {
      camera.pan(targetX, targetY, 300, 'Sine.easeInOut', false, (_cam, progress) => {
        this.emitViewportUpdate();
        if (progress === 1) {
          finalize();
        }
      });
    } else {
      camera.centerOn(targetX, targetY);
      finalize();
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
      parseHexColor('#06090f'),
      parseHexColor('#0d151d'),
      parseHexColor('#0f1c24'),
      parseHexColor('#162530'),
      1,
      1,
      1,
      1
    );
    this.backdropGraphics.fillRect(originX, originY, width, height);

    const horizonY = originY + height * 0.28;
    this.backdropGraphics.fillStyle(parseHexColor('#173339'), 0.28);
    this.backdropGraphics.fillEllipse(originX + width / 2, horizonY, width * 1.08, height * 0.52);

    this.backdropGraphics.fillStyle(parseHexColor('#060c11'), 0.55);
    this.backdropGraphics.fillRect(originX, originY + height * 0.62, width, height * 0.55);

    for (let i = 0; i < 4; i++) {
      const alpha = 0.18 - i * 0.03;
      if (alpha <= 0) {
        continue;
      }
      const factor = 1.18 + i * 0.24;
      this.backdropGraphics.lineStyle(2, parseHexColor('#102026'), alpha);
      this.backdropGraphics.strokeEllipse(
        originX + width / 2,
        originY + height * 0.78,
        width * factor,
        height * 0.46 * factor
      );
    }
  }

  private applyMicroHover(
    gameObject: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform
  ): void {
    const interactiveTarget = gameObject as Phaser.GameObjects.GameObject &
      Phaser.GameObjects.Components.Transform &
      Phaser.GameObjects.Components.Input;

    if (typeof interactiveTarget.setInteractive !== 'function') {
      return;
    }

    interactiveTarget.setInteractive({ useHandCursor: true });
    interactiveTarget.on('pointerover', () => {
      this.tweens.add({
        targets: gameObject,
        scale: themeMotion.hoverScale,
        duration: themeMotion.hoverDuration,
        ease: 'Quad.easeOut',
      });
    });

    interactiveTarget.on('pointerout', () => {
      this.tweens.add({
        targets: gameObject,
        scale: 1,
        duration: themeMotion.hoverDuration,
        ease: 'Quad.easeOut',
      });
    });
  }

  private triggerFocusFlicker(gameObject?: Phaser.GameObjects.GameObject): void {
    if (!gameObject) {
      return;
    }

    const alphaTarget = gameObject as Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Alpha;
    if (typeof alphaTarget.setAlpha !== 'function') {
      return;
    }

    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: themeMotion.focusFlickerDuration,
      yoyo: true,
      repeat: 0,
      ease: 'Quad.easeInOut',
      onUpdate: () => {
        alphaTarget.setAlpha(0.85 + 0.15 * Math.random());
      },
      onComplete: () => {
        alphaTarget.setAlpha(1);
      },
    });
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
    this.emitViewportUpdate();
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

    this.dispatchPlayerScreenPosition();
  }

}
