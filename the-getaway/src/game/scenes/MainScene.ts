import Phaser from 'phaser';
import { MapArea, MapTile, Position, SurveillanceZoneState } from '../interfaces/types';
import { DEFAULT_TILE_SIZE } from '../world/grid';
import { RootState, store } from '../../store';
import { updateGameTime as updateGameTimeAction } from '../../store/worldSlice';
import { applySuspicionDecay } from '../../store/suspicionSlice';
import { LevelBuildingDefinition } from '../../content/levels/level0/types';
import { DepthManager, DepthLayers, syncDepthPoint } from '../utils/depth';
import type { DepthResolvableGameObject } from '../utils/depth';
import { IsoObjectFactory } from '../utils/IsoObjectFactory';
import { getIsoMetrics as computeIsoMetrics, toPixel as isoToPixel, getDiamondPoints as isoDiamondPoints, IsoMetrics } from '../utils/iso';
import { bindCameraToVisualSettings, subscribeToVisualSettings, type VisualFxSettings } from '../settings/visualSettings';
import { DisposableBag } from '../runtime/resources/DisposableBag';
import { createSceneContext } from './main/SceneContext';
import { SceneModuleRegistry } from './main/SceneModuleRegistry';
import { CameraModule } from './main/modules/CameraModule';
import { ClockModule } from './main/modules/ClockModule';
import { DayNightOverlayModule } from './main/modules/DayNightOverlayModule';
import { EntityRenderModule } from './main/modules/EntityRenderModule';
import { InputModule } from './main/modules/InputModule';
import { MinimapBridgeModule } from './main/modules/MinimapBridgeModule';
import { StateSyncModule } from './main/modules/StateSyncModule';
import { SurveillanceRenderModule } from './main/modules/SurveillanceRenderModule';
import { WorldRenderModule } from './main/modules/WorldRenderModule';
export class MainScene extends Phaser.Scene {
  private tileSize = DEFAULT_TILE_SIZE;
  private depthManager!: DepthManager;
  private mapGraphics!: Phaser.GameObjects.Graphics;
  private backdropGraphics!: Phaser.GameObjects.Graphics;
  private pathGraphics!: Phaser.GameObjects.Graphics;
  private visionConeGraphics!: Phaser.GameObjects.Graphics;
  private coverDebugGraphics?: Phaser.GameObjects.Graphics;
  private currentMapArea: MapArea | null = null;
  private playerInitialPosition?: Position;
  private isoOriginX = 0;
  private isoOriginY = 0;
  private isoFactory?: IsoObjectFactory;
  private staticPropGroup?: Phaser.GameObjects.Group;
  private lightsFeatureEnabled = false;
  private demoLampGrid?: Position;
  private demoPointLight?: Phaser.GameObjects.PointLight;
  private readonly lightingAmbientColor = 0x0f172a;
  private unsubscribe: (() => void) | null = null;
  private disposeVisualSettings?: () => void;
  private disposeLightingSettings?: () => void;
  private moduleDisposables = new DisposableBag();
  private sceneModuleRegistry?: SceneModuleRegistry<MainScene>;
  private dayNightOverlayModule!: DayNightOverlayModule;
  private minimapBridgeModule!: MinimapBridgeModule;
  private surveillanceRenderModule!: SurveillanceRenderModule;
  private worldRenderModule!: WorldRenderModule;
  private entityRenderModule!: EntityRenderModule;
  private inputModule!: InputModule;
  private cameraModule!: CameraModule;
  private stateSyncModule!: StateSyncModule;
  private clockModule!: ClockModule;
  private lastStoreSnapshot: RootState = store.getState();
  constructor() {
    super({ key: 'MainScene' });
  }
  init(data: { mapArea: MapArea, playerPosition: Position, buildings?: LevelBuildingDefinition[] }): void {
    this.currentMapArea = data.mapArea;
    this.playerInitialPosition = data.playerPosition;
  }
  create(): void {
    if (!this.currentMapArea) {
      console.error('[MainScene] currentMapArea is null on create!');
      return;
    }
    this.cameras.main.setBackgroundColor(0x1a1a1a);
    this.depthManager = new DepthManager(this);
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
    this.initializeSceneModules();
    this.worldRenderModule.ensureVisualPipeline();
    this.cameraModule.setupCameraAndMap();
    this.dayNightOverlayModule.initializeDayNightOverlay();
    this.dayNightOverlayModule.updateDayNightOverlay();
    this.cameras.main.setRoundPixels(false);
    this.disposeVisualSettings = bindCameraToVisualSettings(this.cameras.main);
    this.disposeLightingSettings = subscribeToVisualSettings((settings) => {
      this.applyLightingSettings(settings);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupScene, this);
    const playerName = store.getState().player.data.name ?? 'Operative';
    const playerInitialized = this.entityRenderModule.initializePlayer(this.playerInitialPosition, playerName);
    if (playerInitialized) {
      this.cameraModule.enablePlayerCameraFollow();

      // PoC convenience: `?poc=esb` auto-focuses camera on the ESB landmark area.
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('poc') === 'esb') {
          const esb = this.currentMapArea?.buildings?.find((building) => building.id === 'block_2_2');
          if (esb) {
            const centerX = (esb.footprint.from.x + esb.footprint.to.x) / 2;
            const centerY = (esb.footprint.from.y + esb.footprint.to.y) / 2;
            this.focusCameraOnGridPosition(centerX, centerY, false);
          } else {
            this.focusCameraOnGridPosition(14, 33, false);
          }
        }
      }
    } else {
      console.error('[MainScene] playerInitialPosition is null');
    }
    this.unsubscribe = store.subscribe(this.handleStateChange.bind(this));
    this.lastStoreSnapshot = store.getState();
    this.queueInitialStateSync();
  }
  shutdown(): void {
    this.cleanupScene();
  }
  update(time: number, delta: number): void {
    if (!this.sys.isActive()) return;
    this.sceneModuleRegistry?.onUpdate(time, delta);
  }
  worldToGrid(worldX: number, worldY: number): Position | null {
    const { halfTileWidth, halfTileHeight } = this.getIsoMetrics();
    const relativeX = worldX - this.isoOriginX;
    const relativeY = worldY - this.isoOriginY;
    const gridX = (relativeY / halfTileHeight + relativeX / halfTileWidth) * 0.5;
    const gridY = (relativeY / halfTileHeight - relativeX / halfTileWidth) * 0.5;
    const roundedX = Math.round(gridX);
    const roundedY = Math.round(gridY);
    if (Number.isNaN(roundedX) || Number.isNaN(roundedY)) return null;
    return { x: roundedX, y: roundedY };
  }
  worldToGridContinuous(worldX: number, worldY: number): { x: number; y: number } | null {
    const { halfTileWidth, halfTileHeight } = this.getIsoMetrics();
    const relativeX = worldX - this.isoOriginX;
    const relativeY = worldY - this.isoOriginY;
    const gridX = (relativeY / halfTileHeight + relativeX / halfTileWidth) * 0.5;
    const gridY = (relativeY / halfTileHeight - relativeX / halfTileWidth) * 0.5;
    if (!Number.isFinite(gridX) || !Number.isFinite(gridY)) return null;
    return { x: gridX, y: gridY };
  }
  emitViewportUpdate(): void {
    this.minimapBridgeModule.emitViewportUpdate();
  }
  focusCameraOnGridPosition(gridX: number, gridY: number, animate = true): void {
    this.cameraModule.focusCameraOnGridPosition(gridX, gridY, animate);
  }
  private initializeSceneModules(): void {
    this.moduleDisposables.dispose();
    this.moduleDisposables = new DisposableBag();
    this.dayNightOverlayModule = new DayNightOverlayModule(this, {
      add: this.add,
      cameras: this.cameras,
      scale: this.scale,
      sys: this.sys,
      getCurrentGameTime: () => this.clockModule?.getCurrentGameTime() ?? store.getState().world.currentTime,
      isInCombat: () => this.stateSyncModule?.isInCombat() ?? store.getState().world.inCombat,
      resolveAtmosphereProfile: (baseOverlayRgba?: string) => this.worldRenderModule.resolveAtmosphereProfile(baseOverlayRgba),
      registerStaticDepth: (target, depth) => this.registerStaticDepth(target, depth),
    });
    this.minimapBridgeModule = new MinimapBridgeModule(this, {
      cameras: this.cameras,
      sys: this.sys,
      getCurrentMapArea: () => this.currentMapArea,
      worldToGridContinuous: (worldX: number, worldY: number) => this.worldToGridContinuous(worldX, worldY),
    });
    this.surveillanceRenderModule = new SurveillanceRenderModule(this, {
      getCurrentMapArea: () => this.currentMapArea,
      getVisionConeGraphics: () => this.visionConeGraphics,
      getTileSize: () => this.tileSize,
      getIsoMetrics: () => this.getIsoMetrics(),
      calculatePixelPosition: (gridX: number, gridY: number) => this.calculatePixelPosition(gridX, gridY),
      syncDepth: (target, pixelX, pixelY, bias) => this.syncDepth(target, pixelX, pixelY, bias),
    });
    this.worldRenderModule = new WorldRenderModule(this, {
      add: this.add,
      game: this.game,
      lights: this.lights,
      mapGraphics: this.mapGraphics,
      getBackdropGraphics: () => this.backdropGraphics,
      getCurrentMapArea: () => this.currentMapArea,
      getCurrentGameTime: () => this.clockModule?.getCurrentGameTime() ?? store.getState().world.currentTime,
      getTileSize: () => this.tileSize,
      getIsoFactory: () => this.isoFactory,
      ensureIsoFactory: () => this.ensureIsoFactory(),
      getIsoMetrics: () => this.getIsoMetrics(),
      calculatePixelPosition: (gridX: number, gridY: number) => this.calculatePixelPosition(gridX, gridY),
      syncDepth: (target, pixelX, pixelY, bias) => this.syncDepth(target, pixelX, pixelY, bias),
      renderVisionCones: () => this.surveillanceRenderModule.renderVisionCones(),
      getStaticPropGroup: () => this.staticPropGroup,
      setStaticPropGroup: (group) => { this.staticPropGroup = group; },
      getLightsFeatureEnabled: () => this.lightsFeatureEnabled,
      setLightsFeatureEnabled: (enabled: boolean) => { this.lightsFeatureEnabled = enabled; },
      getDemoLampGrid: () => this.demoLampGrid,
      setDemoLampGrid: (position) => { this.demoLampGrid = position; },
      getDemoPointLight: () => this.demoPointLight,
      setDemoPointLight: (light) => { this.demoPointLight = light; },
      getLightingAmbientColor: () => this.lightingAmbientColor,
      readEntityRuntimeState: () => this.entityRenderModule.getRuntimeStateSnapshot(),
    });
    this.entityRenderModule = new EntityRenderModule(this, {
      add: this.add,
      cameras: this.cameras,
      game: this.game,
      scale: this.scale,
      sys: this.sys,
      hasMapGraphics: () => Boolean(this.mapGraphics),
      ensureIsoFactory: () => this.ensureIsoFactory(),
      getIsoMetrics: () => this.getIsoMetrics(),
      calculatePixelPosition: (gridX: number, gridY: number) => this.calculatePixelPosition(gridX, gridY),
      syncDepth: (target, pixelX, pixelY, bias) => this.syncDepth(target, pixelX, pixelY, bias),
      enablePlayerCameraFollow: () => this.cameraModule.enablePlayerCameraFollow(),
      isInCombat: () => this.stateSyncModule.isInCombat(),
      isCameraFollowingPlayer: () => this.cameraModule.isFollowingPlayer(),
      createCharacterToken: (role, gridX, gridY) => this.worldRenderModule.createCharacterToken(role, gridX, gridY),
      positionCharacterToken: (token, gridX, gridY) => this.worldRenderModule.positionCharacterToken(token, gridX, gridY),
    });
    this.inputModule = new InputModule(this, {
      cameras: this.cameras,
      sys: this.sys,
      pathGraphics: this.pathGraphics,
      getCurrentMapArea: () => this.currentMapArea,
      setCurrentMapArea: (area) => { this.currentMapArea = area; },
      getPlayerInitialPosition: () => this.playerInitialPosition,
      getLastPlayerGridPosition: () => this.entityRenderModule.getLastPlayerGridPosition(),
      getCoverDebugGraphics: () => this.coverDebugGraphics,
      worldToGrid: (worldX: number, worldY: number) => this.worldToGrid(worldX, worldY),
      getIsoMetrics: () => this.getIsoMetrics(),
      calculatePixelPosition: (gridX: number, gridY: number) => this.calculatePixelPosition(gridX, gridY),
      getDiamondPoints: (centerX: number, centerY: number, width: number, height: number) => this.getDiamondPoints(centerX, centerY, width, height),
      renderStaticProps: () => this.worldRenderModule.renderStaticProps(),
    });
    this.cameraModule = new CameraModule(this, {
      cameras: this.cameras,
      scale: this.scale,
      sys: this.sys,
      tweens: this.tweens,
      getCurrentMapArea: () => this.currentMapArea,
      getPlayerInitialPosition: () => this.playerInitialPosition,
      getPlayerTokenContainer: () => this.entityRenderModule.getPlayerTokenContainer(),
      getTileSize: () => this.tileSize,
      setIsoOrigin: (originX: number, originY: number) => { this.isoOriginX = originX; this.isoOriginY = originY; },
      ensureIsoFactory: () => this.ensureIsoFactory(),
      ensureVisualPipeline: () => this.worldRenderModule.ensureVisualPipeline(),
      getIsoMetrics: () => this.getIsoMetrics(),
      calculatePixelPosition: (gridX: number, gridY: number) => this.calculatePixelPosition(gridX, gridY),
      computeIsoBounds: () => this.worldRenderModule.computeIsoBounds(),
      renderStaticProps: () => this.worldRenderModule.renderStaticProps(),
      drawBackdrop: () => this.worldRenderModule.drawBackdrop(),
      drawMap: (tiles: MapTile[][]) => this.worldRenderModule.drawMap(tiles),
      drawBuildingMasses: () => this.worldRenderModule.drawBuildingMasses(),
      drawBuildingLabels: () => this.worldRenderModule.drawBuildingLabels(),
      clearPathPreview: () => this.inputModule.clearPathPreview(),
      resizeDayNightOverlay: () => this.dayNightOverlayModule.resizeDayNightOverlay(),
      applyOverlayZoom: () => this.dayNightOverlayModule.applyOverlayZoom(),
      emitViewportUpdate: () => this.minimapBridgeModule.emitViewportUpdate(),
      dispatchPlayerScreenPosition: () => this.entityRenderModule.dispatchPlayerScreenPosition(),
      isInCombat: () => this.stateSyncModule.isInCombat(),
    });
    this.stateSyncModule = new StateSyncModule(this, {
      sys: this.sys,
      getCurrentMapArea: () => this.currentMapArea,
      setCurrentMapArea: (area) => { this.currentMapArea = area; },
      getItemMarkerSignature: (area: MapArea | null) => this.worldRenderModule.getItemMarkerSignature(area),
      renderStaticProps: () => this.worldRenderModule.renderStaticProps(),
      updateDayNightOverlay: () => this.dayNightOverlayModule.updateDayNightOverlay(),
      updatePlayerPosition: (position: Position) => this.entityRenderModule.updatePlayerPosition(position),
      updatePlayerVitalsIndicator: (position: Position, health: number, maxHealth: number) => this.entityRenderModule.updatePlayerVitalsIndicator(position, health, maxHealth),
      updateEnemies: (enemies) => this.entityRenderModule.updateEnemies(enemies),
      updateNpcs: (npcs) => this.entityRenderModule.updateNpcs(npcs),
      renderVisionCones: () => this.surveillanceRenderModule.renderVisionCones(),
      updateSurveillanceCameras: (zone?: SurveillanceZoneState, overlayEnabled?: boolean) => this.surveillanceRenderModule.updateSurveillanceCameras(zone, overlayEnabled ?? false),
      zoomCameraForCombat: () => this.cameraModule.zoomCameraForCombat(),
      restoreCameraAfterCombat: () => this.cameraModule.restoreCameraAfterCombat(),
      destroyPlayerVitalsIndicator: () => this.entityRenderModule.destroyPlayerVitalsIndicator(),
      destroyCameraSprites: () => this.surveillanceRenderModule.clearCameraSprites(),
      setupCameraAndMap: () => this.cameraModule.setupCameraAndMap(),
      clearPathPreview: () => this.inputModule.clearPathPreview(),
      enablePlayerCameraFollow: () => this.cameraModule.enablePlayerCameraFollow(),
      resetCameraRuntimeStateForMapTransition: () => this.cameraModule.resetForMapTransition(),
      clearEntityRuntimeStateForMapTransition: () => this.entityRenderModule.clearForMapTransition(),
      clearWorldRuntimeStateForMapTransition: () => this.worldRenderModule.clearForMapTransition(),
      resetEntityCombatIndicators: () => this.entityRenderModule.resetCombatIndicators(),
      readRuntimeState: () => ({
        curfewActive: store.getState().world.curfewActive,
        inCombat: store.getState().world.inCombat,
        lastMapAreaId: this.currentMapArea?.id ?? null,
        isMapTransitionPending: false,
      }),
    });
    this.clockModule = new ClockModule(this, {
      getCurrentGameTime: () => store.getState().world.currentTime,
      getAtmosphereRedrawBucket: () => this.worldRenderModule.getAtmosphereRedrawBucket(),
      setAtmosphereRedrawBucket: (bucket: number) => this.worldRenderModule.setAtmosphereRedrawBucket(bucket),
      signalAtmosphereRedraw: () => {
        if (!this.currentMapArea) return;
        this.worldRenderModule.drawBackdrop();
        this.worldRenderModule.drawMap(this.currentMapArea.tiles);
      },
      signalOverlayUpdate: () => this.dayNightOverlayModule.updateDayNightOverlay(),
      signalOcclusionUpdate: () => this.worldRenderModule.applyOcclusionReadability(),
      dispatchGameTime: (elapsedSeconds: number) => { store.dispatch(updateGameTimeAction(elapsedSeconds)); },
      shouldApplySuspicionDecay: () => Boolean(store.getState().settings.reputationSystemsEnabled),
      dispatchSuspicionDecay: (elapsedSeconds: number, timestamp: number) => {
        store.dispatch(applySuspicionDecay({ elapsedSeconds, timestamp }));
      },
      readRuntimeState: () => ({
        currentGameTime: store.getState().world.currentTime,
        timeDispatchAccumulator: 0,
        lastAtmosphereRedrawBucket: this.worldRenderModule.getAtmosphereRedrawBucket(),
        dispatchCadenceSeconds: 0.5,
        atmosphereBucketSeconds: 5,
      }),
    });
    const context = createSceneContext(this, { getState: () => store.getState(), dispatch: store.dispatch }, this.moduleDisposables);
    this.sceneModuleRegistry = new SceneModuleRegistry(context);
    this.sceneModuleRegistry.register(this.dayNightOverlayModule);
    this.sceneModuleRegistry.register(this.minimapBridgeModule);
    this.sceneModuleRegistry.register(this.surveillanceRenderModule);
    this.sceneModuleRegistry.register(this.worldRenderModule);
    this.sceneModuleRegistry.register(this.entityRenderModule);
    this.sceneModuleRegistry.register(this.inputModule);
    this.sceneModuleRegistry.register(this.cameraModule);
    this.sceneModuleRegistry.register(this.stateSyncModule);
    this.sceneModuleRegistry.register(this.clockModule);
    this.sceneModuleRegistry.onCreate();
    context.listenScale('resize', this.handleResize, this);
  }
  private queueInitialStateSync(): void {
    setTimeout(() => {
      if (!this.sys.isActive()) return;
      const initialState = store.getState();
      this.sceneModuleRegistry?.onStateChange(initialState, initialState);
    }, 0);
  }
  private handleStateChange(): void {
    if (!this.sys.isActive() || !this.currentMapArea) return;
    const nextState = store.getState();
    this.sceneModuleRegistry?.onStateChange(this.lastStoreSnapshot, nextState);
    this.lastStoreSnapshot = nextState;
  }
  private cleanupScene(): void {
    this.sceneModuleRegistry?.onShutdown();
    this.sceneModuleRegistry = undefined;
    this.moduleDisposables.dispose();
    if (this.disposeVisualSettings) {
      this.disposeVisualSettings();
      this.disposeVisualSettings = undefined;
    }
    if (this.disposeLightingSettings) {
      this.disposeLightingSettings();
      this.disposeLightingSettings = undefined;
    }
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.coverDebugGraphics?.destroy();
    this.coverDebugGraphics = undefined;
  }
  private handleResize(): void {
    this.sceneModuleRegistry?.onResize();
  }
  private applyLightingSettings(settings: VisualFxSettings): void {
    this.worldRenderModule.applyLightingSettings(settings);
  }
  private ensureIsoFactory(): void {
    if (!this.isoFactory) this.isoFactory = new IsoObjectFactory(this, this.tileSize, this.depthManager);
    this.isoFactory.setIsoOrigin(this.isoOriginX, this.isoOriginY);
  }
  private registerStaticDepth(target: Phaser.GameObjects.GameObject, depth: number): void {
    this.depthManager.registerStatic(target as DepthResolvableGameObject, depth);
  }
  private syncDepth(target: Phaser.GameObjects.GameObject, pixelX: number, pixelY: number, bias: number): void {
    syncDepthPoint(this.depthManager, target as DepthResolvableGameObject, pixelX, pixelY, bias);
  }
  private calculatePixelPosition(gridX: number, gridY: number): { x: number; y: number } {
    return isoToPixel(gridX, gridY, this.isoOriginX, this.isoOriginY, this.tileSize);
  }
  private getIsoMetrics(): IsoMetrics {
    return computeIsoMetrics(this.tileSize);
  }
  private getDiamondPoints(centerX: number, centerY: number, width: number, height: number): Phaser.Geom.Point[] {
    return isoDiamondPoints(centerX, centerY, width, height).map((point) => new Phaser.Geom.Point(point.x, point.y));
  }
}
