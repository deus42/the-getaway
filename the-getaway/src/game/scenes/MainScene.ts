import Phaser from 'phaser';
import { MapArea, Position, Enemy, MapTile, NPC, SurveillanceZoneState } from '../interfaces/types';
import { DEFAULT_TILE_SIZE } from '../world/grid';
import { RootState, store } from '../../store';
import { updateGameTime as updateGameTimeAction } from '../../store/worldSlice';
import { applySuspicionDecay } from '../../store/suspicionSlice';
import {
  PlayerScreenPositionDetail,
} from '../events';
import { IsoObjectFactory, CharacterToken } from '../utils/IsoObjectFactory';
import {
  getIsoMetrics as computeIsoMetrics,
  toPixel as isoToPixel,
  getDiamondPoints as isoDiamondPoints,
  IsoMetrics,
} from '../utils/iso';
import { LevelBuildingDefinition } from '../../content/levels/level0/types';
import { DepthManager, DepthLayers, syncDepthPoint } from '../utils/depth';
import type { DepthResolvableGameObject } from '../utils/depth';
import type { BuildingVisualProfile, VisualTheme } from '../visual/contracts';
import { TilePainter } from '../visual/world/TilePainter';
import { BuildingPainter } from '../visual/world/BuildingPainter';
import { CharacterRigFactory } from '../visual/entities/CharacterRigFactory';
import { AtmosphereDirector, type AtmosphereProfile } from '../visual/world/AtmosphereDirector';
import {
  OcclusionReadabilityController,
  type OcclusionMassHandle,
} from '../visual/world/OcclusionReadabilityController';
import {
  bindCameraToVisualSettings,
  subscribeToVisualSettings,
  type VisualFxSettings,
} from '../settings/visualSettings';
import { DisposableBag } from '../runtime/resources/DisposableBag';
import { createSceneContext } from './main/SceneContext';
import { SceneModuleRegistry } from './main/SceneModuleRegistry';
import { CameraModule } from './main/modules/CameraModule';
import { DayNightOverlayModule } from './main/modules/DayNightOverlayModule';
import { EntityRenderModule } from './main/modules/EntityRenderModule';
import { InputModule } from './main/modules/InputModule';
import { MinimapBridgeModule } from './main/modules/MinimapBridgeModule';
import { SurveillanceRenderModule } from './main/modules/SurveillanceRenderModule';
import { WorldRenderModule } from './main/modules/WorldRenderModule';

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

type BuildingMassingEntry = OcclusionMassHandle;

export class MainScene extends Phaser.Scene {
  private tileSize: number = DEFAULT_TILE_SIZE;
  private depthManager!: DepthManager;
  private mapGraphics!: Phaser.GameObjects.Graphics;
  private backdropGraphics!: Phaser.GameObjects.Graphics;
  private pathGraphics!: Phaser.GameObjects.Graphics;
  private visionConeGraphics!: Phaser.GameObjects.Graphics;
  private visualTheme!: VisualTheme;
  public tilePainter?: TilePainter;
  public buildingPainter?: BuildingPainter;
  private characterRigFactory?: CharacterRigFactory;
  public atmosphereDirector?: AtmosphereDirector;
  public occlusionReadabilityController?: OcclusionReadabilityController;
  public currentAtmosphereProfile?: AtmosphereProfile;
  private lastAtmosphereRedrawBucket = -1;
  public buildingVisualProfiles: Record<string, BuildingVisualProfile> = {};
  private playerToken?: CharacterToken;
  private playerNameLabel?: Phaser.GameObjects.Text;
  private enemySprites: Map<string, EnemySpriteData> = new Map();
  private npcSprites: Map<string, NpcSpriteData> = new Map();
  private coverDebugGraphics?: Phaser.GameObjects.Graphics;
  private currentMapArea: MapArea | null = null;
  private buildingLabels: Phaser.GameObjects.Container[] = [];
  private buildingMassings: Phaser.GameObjects.Container[] = [];
  public buildingMassingEntries: BuildingMassingEntry[] = [];
  private unsubscribe: (() => void) | null = null;
  private playerInitialPosition?: Position;
  public dayNightOverlay!: Phaser.GameObjects.Rectangle;
  private curfewActive = false;
  private currentGameTime = 0;
  private timeDispatchAccumulator = 0;
  private isoOriginX = 0;
  private isoOriginY = 0;
  public isCameraFollowingPlayer = false;
  public lastPlayerGridPosition: Position | null = null;
  private inCombat = false;
  public playerVitalsIndicator?: Phaser.GameObjects.Graphics;
  private isoFactory?: IsoObjectFactory;
  public staticPropGroup?: Phaser.GameObjects.Group;
  private disposeVisualSettings?: () => void;
  private disposeLightingSettings?: () => void;
  public lastPlayerScreenDetail?: PlayerScreenPositionDetail;
  public baselineCameraZoom = 1;
  public cameraZoomTween: Phaser.Tweens.Tween | null = null;
  public lightsFeatureEnabled = false;
  public demoLampGrid?: Position;
  public demoPointLight?: Phaser.GameObjects.PointLight;
  public readonly lightingAmbientColor = 0x0f172a;
  private lastItemMarkerSignature = '';
  public hasInitialZoomApplied = false;
  public userAdjustedZoom = false;
  public pendingCameraRestore = false;
  public preCombatZoom: number | null = null;
  public preCombatUserAdjusted = false;
  public pendingRestoreUserAdjusted: boolean | null = null;
  private moduleDisposables = new DisposableBag();
  private sceneModuleRegistry?: SceneModuleRegistry<MainScene>;
  private readonly dayNightOverlayModule = new DayNightOverlayModule(this);
  private readonly minimapBridgeModule = new MinimapBridgeModule(this);
  private readonly inputModule = new InputModule(this);
  private readonly cameraModule = new CameraModule(this);
  private readonly entityRenderModule = new EntityRenderModule(this);
  private readonly surveillanceRenderModule = new SurveillanceRenderModule(this);
  private readonly worldRenderModule = new WorldRenderModule(this);
  private lastStoreSnapshot: RootState = store.getState();

  constructor() {
    super({ key: 'MainScene' });
  }

  private initializeSceneModules(): void {
    this.moduleDisposables.dispose();
    this.moduleDisposables = new DisposableBag();

    const context = createSceneContext(
      this,
      {
        getState: () => store.getState(),
        dispatch: store.dispatch,
      },
      this.moduleDisposables
    );

    this.sceneModuleRegistry = new SceneModuleRegistry(context);
    this.sceneModuleRegistry.register(this.dayNightOverlayModule);
    this.sceneModuleRegistry.register(this.minimapBridgeModule);
    this.sceneModuleRegistry.register(this.surveillanceRenderModule);
    this.sceneModuleRegistry.register(this.worldRenderModule);
    this.sceneModuleRegistry.register(this.entityRenderModule);
    this.sceneModuleRegistry.register(this.inputModule);
    this.sceneModuleRegistry.register(this.cameraModule);
    this.sceneModuleRegistry.onCreate();
    context.listenScale('resize', this.handleResize, this);
    this.lastStoreSnapshot = store.getState();
  }

  private ensureVisualPipeline(): void {
    this.worldRenderModule.ensureVisualPipeline();
  }

  private registerStaticDepth(target: Phaser.GameObjects.GameObject, depth: number): void {
    this.depthManager.registerStatic(target as DepthResolvableGameObject, depth);
  }

  public syncDepth(target: Phaser.GameObjects.GameObject, pixelX: number, pixelY: number, bias: number): void {
    syncDepthPoint(this.depthManager, target as DepthResolvableGameObject, pixelX, pixelY, bias);
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
    this.cameras.main.setBackgroundColor(0x1a1a1a);
    this.depthManager = new DepthManager(this);

    // Setup map graphics
    this.backdropGraphics = this.add.graphics();
    this.registerStaticDepth(this.backdropGraphics, DepthLayers.BACKDROP);

    this.mapGraphics = this.add.graphics();
    this.registerStaticDepth(this.mapGraphics, DepthLayers.MAP_BASE);

    this.visionConeGraphics = this.add.graphics();
    this.registerStaticDepth(this.visionConeGraphics, DepthLayers.VISION_OVERLAY);

    this.pathGraphics = this.add.graphics();
    this.registerStaticDepth(this.pathGraphics, DepthLayers.PATH_PREVIEW);

    this.coverDebugGraphics = this.add.graphics();
    this.registerStaticDepth(this.coverDebugGraphics, DepthLayers.COVER_DEBUG);
    this.coverDebugGraphics.setVisible(false);

    this.ensureVisualPipeline();

    // Initial setup of camera and map
    this.setupCameraAndMap();
    this.cameras.main.setRoundPixels(false);
    this.disposeVisualSettings = bindCameraToVisualSettings(this.cameras.main);
    this.disposeLightingSettings = subscribeToVisualSettings((settings) => {
      this.applyLightingSettings(settings);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupScene, this);

    // Cache initial world time and set up overlay
    const worldState = store.getState().world;
    this.currentGameTime = worldState.currentTime;
    this.timeDispatchAccumulator = 0;
    this.inCombat = worldState.inCombat;
    this.lastAtmosphereRedrawBucket = Math.floor(this.currentGameTime / 5);
    this.currentAtmosphereProfile = undefined;
    this.drawBackdrop();
    this.drawMap(this.currentMapArea.tiles);
    this.initializeDayNightOverlay();
    this.updateDayNightOverlay();
    this.curfewActive = worldState.curfewActive;
    this.initializeSceneModules();
    
    // Setup player token
    if (this.playerInitialPosition) {
      this.ensureIsoFactory();
      const token = this.characterRigFactory
        ? this.characterRigFactory.createToken(
            'player',
            this.playerInitialPosition.x,
            this.playerInitialPosition.y
          )
        : this.isoFactory!.createCharacterToken(
            this.playerInitialPosition.x,
            this.playerInitialPosition.y,
            this.visualTheme.entityProfiles.player
          );
      this.playerToken = token;

      const metrics = this.getIsoMetrics();
      const pixelPos = this.calculatePixelPosition(this.playerInitialPosition.x, this.playerInitialPosition.y);
      const playerName = store.getState().player.data.name ?? 'Operative';
      this.playerNameLabel = this.createCharacterNameLabel(playerName, 0x38bdf8, 14);
      this.positionCharacterLabel(this.playerNameLabel, pixelPos.x, pixelPos.y, metrics.tileHeight * 1.6);

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
    this.surveillanceRenderModule.clearCameraSprites();
  }

  private cleanupScene(): void {
    this.sceneModuleRegistry?.onShutdown();
    this.sceneModuleRegistry = undefined;
    this.moduleDisposables.dispose();
    this.stopCameraZoomTween();

    if (this.disposeVisualSettings) {
      this.disposeVisualSettings();
      this.disposeVisualSettings = undefined;
    }
    if (this.disposeLightingSettings) {
      this.disposeLightingSettings();
      this.disposeLightingSettings = undefined;
    }
    this.disableLighting(true);

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
    this.buildingLabels.forEach((label) => label.destroy(true));
    this.buildingLabels = [];
    this.buildingMassings.forEach((mass) => mass.destroy(true));
    this.buildingMassings = [];
    this.buildingMassingEntries = [];
    this.currentAtmosphereProfile = undefined;

    if (this.coverDebugGraphics) {
      this.coverDebugGraphics.destroy();
      this.coverDebugGraphics = undefined;
    }
  }

  private handleStateChange(): void {
    // This handles updates AFTER the initial one from setTimeout
    if (!this.sys.isActive() || !this.currentMapArea) return;

    const newState = store.getState();
    const previousState = this.lastStoreSnapshot;
    this.sceneModuleRegistry?.onStateChange(previousState, newState);
    this.lastStoreSnapshot = newState;
    const playerState = newState.player.data;
    const worldState = newState.world;
    const currentEnemies = worldState.currentMapArea.entities.enemies;

    const previousCombatState = this.inCombat;
    this.inCombat = worldState.inCombat;

    if (this.inCombat && !previousCombatState) {
      this.zoomCameraForCombat();
    }

    if (!this.inCombat && previousCombatState) {
      this.restoreCameraAfterCombat();
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

    if (!worldState.currentMapArea || !this.currentMapArea) {
      return;
    }

    if (this.currentMapArea.id !== worldState.currentMapArea.id) {
      this.hasInitialZoomApplied = false;
      this.userAdjustedZoom = false;
      this.preCombatZoom = null;
      this.preCombatUserAdjusted = false;
      this.pendingRestoreUserAdjusted = null;
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
      this.currentAtmosphereProfile = undefined;
      this.lastAtmosphereRedrawBucket = -1;
      this.setupCameraAndMap();
      this.clearPathPreview();
      this.enablePlayerCameraFollow();
    }

    const previousItemMarkerSignature = this.lastItemMarkerSignature;
    this.currentMapArea = worldState.currentMapArea;
    const nextItemMarkerSignature = this.getItemMarkerSignature(this.currentMapArea);
    if (previousItemMarkerSignature !== nextItemMarkerSignature) {
      this.renderStaticProps();
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
      this.isoFactory = new IsoObjectFactory(this, this.tileSize, this.depthManager);
    }

    this.isoFactory.setIsoOrigin(this.isoOriginX, this.isoOriginY);
    if (this.visualTheme) {
      this.characterRigFactory = new CharacterRigFactory(this.isoFactory, this.visualTheme);
    }
  }

  private renderStaticProps(): void {
    this.worldRenderModule.renderStaticProps();
  }

  private getItemMarkerSignature(area: MapArea | null): string {
    return this.worldRenderModule.getItemMarkerSignature(area);
  }

  private applyLightingSettings(settings: VisualFxSettings): void {
    this.worldRenderModule.applyLightingSettings(settings);
  }

  private disableLighting(force = false): void {
    this.worldRenderModule.disableLighting(force);
  }
  
  private updatePlayerPosition(position: Position): void {
    this.entityRenderModule.updatePlayerPosition(position);
  }

  private updatePlayerVitalsIndicator(position: Position, health: number, maxHealth: number): void {
    this.entityRenderModule.updatePlayerVitalsIndicator(position, health, maxHealth);
  }

  private destroyPlayerVitalsIndicator(): void {
    this.entityRenderModule.destroyPlayerVitalsIndicator();
  }

  private enablePlayerCameraFollow(): void {
    this.cameraModule.enablePlayerCameraFollow();
  }

  public recenterCameraOnPlayer(): void {
    this.cameraModule.recenterCameraOnPlayer();
  }

  private updateEnemies(enemies: Enemy[]): void {
    this.entityRenderModule.updateEnemies(enemies);
  }

  private updateNpcs(npcs: NPC[]): void {
    this.entityRenderModule.updateNpcs(npcs);
  }

  private renderVisionCones(): void {
    this.surveillanceRenderModule.renderVisionCones();
  }

  private updateSurveillanceCameras(zone?: SurveillanceZoneState, overlayEnabled: boolean = false): void {
    this.surveillanceRenderModule.updateSurveillanceCameras(zone, overlayEnabled);
  }

  public shutdown(): void {
    this.cleanupScene();

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
    this.stopCameraZoomTween();
    this.buildingLabels.forEach((label) => label.destroy(true));
    this.buildingLabels = [];
    this.buildingMassings.forEach((mass) => mass.destroy(true));
    this.buildingMassings = [];
    this.buildingMassingEntries = [];
    this.currentAtmosphereProfile = undefined;
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
  }

  private drawMap(tiles: MapTile[][]) {
    this.worldRenderModule.drawMap(tiles);
  }

  public drawBuildingMasses(): void {
    this.worldRenderModule.drawBuildingMasses();
  }

  public drawBuildingLabels(): void {
    this.worldRenderModule.drawBuildingLabels();
  }

  private createCharacterNameLabel(name: string, accentColor: number, fontSize: number = 12): Phaser.GameObjects.Text {
    return this.entityRenderModule.createCharacterNameLabel(name, accentColor, fontSize);
  }

  private positionCharacterLabel(
    label: Phaser.GameObjects.Text,
    pixelX: number,
    pixelY: number,
    verticalOffset: number
  ): void {
    this.entityRenderModule.positionCharacterLabel(label, pixelX, pixelY, verticalOffset);
  }

  private calculatePixelPosition(gridX: number, gridY: number): { x: number; y: number } {
    return isoToPixel(gridX, gridY, this.isoOriginX, this.isoOriginY, this.tileSize);
  }

  private dispatchPlayerScreenPosition(): void {
    this.entityRenderModule.dispatchPlayerScreenPosition();
  }

  private getIsoMetrics(): IsoMetrics {
    return computeIsoMetrics(this.tileSize);
  }

  public getDiamondPoints(
    centerX: number,
    centerY: number,
    width: number,
    height: number
  ): Phaser.Geom.Point[] {
    return isoDiamondPoints(centerX, centerY, width, height).map((point) => new Phaser.Geom.Point(point.x, point.y));
  }

  public worldToGrid(worldX: number, worldY: number): Position | null {
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

  public worldToGridContinuous(worldX: number, worldY: number): { x: number; y: number } | null {
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

  public clampCameraToBounds(camera: Phaser.Cameras.Scene2D.Camera): void {
    this.cameraModule.clampCameraToBounds(camera);
  }

  public clampCameraCenterTarget(targetX: number, targetY: number): { x: number; y: number } {
    return this.cameraModule.clampCameraCenterTarget(targetX, targetY);
  }

  private clearPathPreview(): void {
    this.inputModule.clearPathPreview();
  }

  public emitViewportUpdate(): void {
    this.minimapBridgeModule.emitViewportUpdate();
  }

  public focusCameraOnGridPosition(gridX: number, gridY: number, animate = true): void {
    this.cameraModule.focusCameraOnGridPosition(gridX, gridY, animate);
  }

  public resolveAtmosphereProfile(baseOverlayRgba?: string): AtmosphereProfile {
    return this.worldRenderModule.resolveAtmosphereProfile(baseOverlayRgba);
  }

  private applyOcclusionReadability(): void {
    this.worldRenderModule.applyOcclusionReadability();
  }

  private drawBackdrop(): void {
    this.worldRenderModule.drawBackdrop();
  }

  public computeIsoBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    return this.worldRenderModule.computeIsoBounds();
  }

  // Handler for resize events from Phaser - simplify to prevent flickering
  public handleResize(): void {
    this.sceneModuleRegistry?.onResize();
  }
  
  // Simplified camera setup to be more stable during resize
  private setupCameraAndMap(): void {
    this.cameraModule.setupCameraAndMap();
  }

  private initializeDayNightOverlay(): void {
    this.dayNightOverlayModule.initializeDayNightOverlay();
  }

  public applyOverlayZoom(): void {
    this.dayNightOverlayModule.applyOverlayZoom();
  }

  private stopCameraZoomTween(): void {
    this.cameraModule.stopCameraZoomTween();
  }

  public animateCameraZoom(targetZoom: number): void {
    this.cameraModule.animateCameraZoom(targetZoom);
  }

  private zoomCameraForCombat(): void {
    this.cameraModule.zoomCameraForCombat();
  }

  private restoreCameraAfterCombat(): void {
    this.cameraModule.restoreCameraAfterCombat();
  }

  public resizeDayNightOverlay(): void {
    this.dayNightOverlayModule.resizeDayNightOverlay();
  }

  private updateDayNightOverlay(): void {
    this.dayNightOverlayModule.updateDayNightOverlay();
  }

  public update(_time: number, delta: number): void {
    if (!this.sys.isActive()) {
      return;
    }
    this.sceneModuleRegistry?.onUpdate(_time, delta);

    const deltaSeconds = delta / 1000;
    this.currentGameTime += deltaSeconds;
    this.timeDispatchAccumulator += deltaSeconds;

    const atmosphereBucket = Math.floor(this.currentGameTime / 5);
    if (atmosphereBucket !== this.lastAtmosphereRedrawBucket && this.currentMapArea) {
      this.lastAtmosphereRedrawBucket = atmosphereBucket;
      this.drawBackdrop();
      this.drawMap(this.currentMapArea.tiles);
    }

    this.updateDayNightOverlay();
    this.applyOcclusionReadability();

    if (this.timeDispatchAccumulator >= 0.5) {
      const elapsedSeconds = this.timeDispatchAccumulator;
      store.dispatch(updateGameTimeAction(elapsedSeconds));
      const reputationSystemsEnabled = Boolean(
        store.getState().settings.reputationSystemsEnabled
      );
      if (reputationSystemsEnabled) {
        store.dispatch(
          applySuspicionDecay({
            elapsedSeconds,
            timestamp: this.currentGameTime,
          })
        );
      }
      this.timeDispatchAccumulator = 0;
    }

    this.dispatchPlayerScreenPosition();
  }

}
