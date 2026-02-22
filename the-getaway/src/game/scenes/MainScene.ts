import Phaser from 'phaser';
import { MapArea, TileType, Position, Enemy, MapTile, NPC, Item, SurveillanceZoneState } from '../interfaces/types';
import { DEFAULT_TILE_SIZE } from '../world/grid';
import { RootState, store } from '../../store';
import { updateGameTime as updateGameTimeAction } from '../../store/worldSlice';
import { applySuspicionDecay } from '../../store/suspicionSlice';
import { setLightsEnabled } from '../../store/settingsSlice';
import {
  PLAYER_SCREEN_POSITION_EVENT,
  PlayerScreenPositionDetail,
} from '../events';
import { IsoObjectFactory, CharacterToken } from '../utils/IsoObjectFactory';
import {
  getIsoMetrics as computeIsoMetrics,
  toPixel as isoToPixel,
  getDiamondPoints as isoDiamondPoints,
  adjustColor,
  IsoMetrics,
} from '../utils/iso';
import { LevelBuildingDefinition } from '../../content/levels/level0/types';
import { DepthManager, DepthBias, DepthLayers, computeDepth, syncDepthPoint } from '../utils/depth';
import type { DepthResolvableGameObject } from '../utils/depth';
import type { BuildingVisualProfile, VisualTheme } from '../visual/contracts';
import { createNoirVectorTheme, resolveBuildingVisualProfile } from '../visual/theme/noirVectorTheme';
import { TilePainter } from '../visual/world/TilePainter';
import { BuildingPainter } from '../visual/world/BuildingPainter';
import { CharacterRigFactory } from '../visual/entities/CharacterRigFactory';
import { AtmosphereDirector, type AtmosphereProfile } from '../visual/world/AtmosphereDirector';
import {
  OcclusionReadabilityController,
  type OcclusionEntityHandle,
  type OcclusionMassHandle,
} from '../visual/world/OcclusionReadabilityController';
import {
  bindCameraToVisualSettings,
  getVisualFxBudgetForPreset,
  subscribeToVisualSettings,
  updateVisualSettings,
  type VisualFxSettings,
} from '../settings/visualSettings';
import { resolvePickupObjectName } from '../utils/itemDisplay';
import { DisposableBag } from '../runtime/resources/DisposableBag';
import { createSceneContext } from './main/SceneContext';
import { SceneModuleRegistry } from './main/SceneModuleRegistry';
import { CameraModule } from './main/modules/CameraModule';
import { DayNightOverlayModule } from './main/modules/DayNightOverlayModule';
import { InputModule } from './main/modules/InputModule';
import { MinimapBridgeModule } from './main/modules/MinimapBridgeModule';
import { SurveillanceRenderModule } from './main/modules/SurveillanceRenderModule';

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
  private tilePainter?: TilePainter;
  private buildingPainter?: BuildingPainter;
  private characterRigFactory?: CharacterRigFactory;
  private atmosphereDirector?: AtmosphereDirector;
  private occlusionReadabilityController?: OcclusionReadabilityController;
  private currentAtmosphereProfile?: AtmosphereProfile;
  private lastAtmosphereRedrawBucket = -1;
  private buildingVisualProfiles: Record<string, BuildingVisualProfile> = {};
  private playerToken?: CharacterToken;
  private playerNameLabel?: Phaser.GameObjects.Text;
  private enemySprites: Map<string, EnemySpriteData> = new Map();
  private npcSprites: Map<string, NpcSpriteData> = new Map();
  private coverDebugGraphics?: Phaser.GameObjects.Graphics;
  private currentMapArea: MapArea | null = null;
  private buildingLabels: Phaser.GameObjects.Container[] = [];
  private buildingMassings: Phaser.GameObjects.Container[] = [];
  private buildingMassingEntries: BuildingMassingEntry[] = [];
  private unsubscribe: (() => void) | null = null;
  private playerInitialPosition?: Position;
  public dayNightOverlay!: Phaser.GameObjects.Rectangle;
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
  private disposeVisualSettings?: () => void;
  private disposeLightingSettings?: () => void;
  private lastPlayerScreenDetail?: PlayerScreenPositionDetail;
  public baselineCameraZoom = 1;
  public cameraZoomTween: Phaser.Tweens.Tween | null = null;
  private lightsFeatureEnabled = false;
  private demoLampGrid?: Position;
  private demoPointLight?: Phaser.GameObjects.PointLight;
  private readonly lightingAmbientColor = 0x0f172a;
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
  private readonly surveillanceRenderModule = new SurveillanceRenderModule(this);
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
    this.sceneModuleRegistry.register(this.inputModule);
    this.sceneModuleRegistry.register(this.cameraModule);
    this.sceneModuleRegistry.onCreate();
    context.listenScale('resize', this.handleResize, this);
    this.lastStoreSnapshot = store.getState();
  }

  private ensureVisualPipeline(): void {
    const preset = store.getState().settings.visualQualityPreset;
    const themeChanged = !this.visualTheme || this.visualTheme.preset !== preset;
    if (!this.visualTheme || this.visualTheme.preset !== preset) {
      this.visualTheme = createNoirVectorTheme(preset);
    }

    if (this.mapGraphics && (!this.tilePainter || themeChanged)) {
      this.tilePainter = new TilePainter(this.mapGraphics, this.visualTheme);
    }

    if (!this.buildingPainter || themeChanged) {
      this.buildingPainter = new BuildingPainter(this, this.visualTheme);
    }

    if (!this.atmosphereDirector || themeChanged) {
      this.atmosphereDirector = new AtmosphereDirector(this.visualTheme);
      this.lastAtmosphereRedrawBucket = -1;
    }

    if (!this.occlusionReadabilityController || themeChanged) {
      this.occlusionReadabilityController = new OcclusionReadabilityController();
    }

    if (this.isoFactory && (!this.characterRigFactory || themeChanged)) {
      this.characterRigFactory = new CharacterRigFactory(this.isoFactory, this.visualTheme);
    }

    if (this.currentMapArea?.buildings) {
      const nextProfiles: Record<string, BuildingVisualProfile> = {};
      this.currentMapArea.buildings.forEach((building) => {
        const resolvedFallback = resolveBuildingVisualProfile(
          building.district as BuildingVisualProfile['district'],
          building.signageStyle as BuildingVisualProfile['signageStyle'],
          building.propDensity
        );
        nextProfiles[building.id] = building.visualProfile
          ? {
              district: (building.district === 'downtown' ? 'downtown' : 'slums'),
              signageStyle: (building.signageStyle as BuildingVisualProfile['signageStyle']) ?? resolvedFallback.signageStyle,
              propDensity: building.propDensity ?? resolvedFallback.propDensity,
              facadePattern: building.visualProfile.facadePattern ?? resolvedFallback.facadePattern,
              lotPattern: building.visualProfile.lotPattern ?? resolvedFallback.lotPattern,
              massingStyle: building.visualProfile.massingStyle ?? resolvedFallback.massingStyle,
              massingHeight: building.visualProfile.massingHeight ?? resolvedFallback.massingHeight,
              accentHex: building.visualProfile.accentHex ?? resolvedFallback.accentHex,
              glowHex: building.visualProfile.glowHex ?? resolvedFallback.glowHex,
              trimHex: building.visualProfile.trimHex ?? resolvedFallback.trimHex,
              atmosphereHex: building.visualProfile.atmosphereHex ?? resolvedFallback.atmosphereHex,
              signagePrimaryHex: building.visualProfile.signagePrimaryHex ?? resolvedFallback.signagePrimaryHex,
              signageSecondaryHex: building.visualProfile.signageSecondaryHex ?? resolvedFallback.signageSecondaryHex,
              backdropHex: building.visualProfile.backdropHex ?? resolvedFallback.backdropHex,
            }
          : resolvedFallback;
      });
      this.buildingVisualProfiles = nextProfiles;
    } else {
      this.buildingVisualProfiles = {};
    }
  }

  private registerStaticDepth(target: Phaser.GameObjects.GameObject, depth: number): void {
    this.depthManager.registerStatic(target as DepthResolvableGameObject, depth);
  }

  private syncDepth(target: Phaser.GameObjects.GameObject, pixelX: number, pixelY: number, bias: number): void {
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
    if (this.staticPropGroup) {
      this.staticPropGroup.clear(true, true);
    }

    this.demoLampGrid = undefined;
    this.destroyDemoPointLight();

    if (!this.isoFactory || !this.currentMapArea) {
      return;
    }
    this.ensureVisualPipeline();

    if (!this.staticPropGroup) {
      this.staticPropGroup = this.add.group();
    }
    const addProp = (prop?: Phaser.GameObjects.GameObject | null) => {
      if (!prop) {
        return;
      }
      this.staticPropGroup?.add(prop);
    };

    const interactiveNpcs = (this.currentMapArea.entities.npcs ?? []).filter((npc) => npc.isInteractive);
    const itemMarkers = (this.currentMapArea.entities.items ?? []).filter(
      (item): item is Item & { position: Position } => Boolean(item.position)
    );
    const isoMetrics = this.getIsoMetrics();
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

    itemMarkers.forEach((item) => {
      const color = item.isQuestItem ? 0xfacc15 : 0x22d3ee;
      const pulseColor = item.isQuestItem ? 0xfff3bf : 0x7dd3fc;
      const pixel = this.calculatePixelPosition(item.position.x, item.position.y);
      const itemLabelName = resolvePickupObjectName(item);
      addProp(
        this.isoFactory!.createPulsingHighlight(item.position.x, item.position.y, {
          color,
          alpha: item.isQuestItem ? 0.24 : 0.22,
          pulseColor,
          pulseAlpha: { from: item.isQuestItem ? 0.34 : 0.3, to: 0.08 },
          pulseScale: item.isQuestItem ? 1.28 : 1.22,
          widthScale: 0.72,
          heightScale: 0.72,
          depthOffset: 8,
          duration: item.isQuestItem ? 1150 : 1300,
        })
      );

      const itemLabel = this.add.text(
        pixel.x,
        pixel.y - isoMetrics.tileHeight * 0.7,
        itemLabelName,
        {
          fontFamily: 'Orbitron, "DM Sans", sans-serif',
          fontSize: '10px',
          fontStyle: '700',
          color: item.isQuestItem ? '#fde68a' : '#dbeafe',
          align: 'center',
        }
      );
      itemLabel.setOrigin(0.5, 1);
      itemLabel.setStroke(item.isQuestItem ? '#f59e0b' : '#0284c7', 1.1);
      itemLabel.setShadow(0, 0, item.isQuestItem ? '#f59e0b' : '#38bdf8', 8, true, true);
      this.syncDepth(itemLabel, pixel.x, pixel.y, DepthBias.FLOATING_UI + 14);
      addProp(itemLabel);
    });

    if (this.lightsFeatureEnabled) {
      this.rebuildLightingDemoLight();
    }

    this.lastItemMarkerSignature = this.getItemMarkerSignature(this.currentMapArea);
  }

  private getItemMarkerSignature(area: MapArea | null): string {
    if (!area) {
      return '';
    }

    const markers = (area.entities.items ?? []).filter(
      (item): item is Item & { position: Position } => Boolean(item.position)
    );

    if (markers.length === 0) {
      return '';
    }

    return markers
      .map((item) => `${item.id ?? item.name}@${item.position.x},${item.position.y}`)
      .sort()
      .join('|');
  }

  private applyLightingSettings(settings: VisualFxSettings): void {
    const previousPreset = this.visualTheme?.preset;
    if (!this.visualTheme || previousPreset !== settings.qualityPreset) {
      this.ensureVisualPipeline();
      this.refreshVisualLayers();
    }

    const budget = getVisualFxBudgetForPreset(settings.qualityPreset);
    const lightsRequested = settings.lightsEnabled && settings.qualityPreset !== 'performance';

    if (lightsRequested && !this.hasLightPipelineSupport()) {
      console.warn('[MainScene] Light2D not supported by current renderer; disabling lighting toggle.');
      store.dispatch(setLightsEnabled(false));
      updateVisualSettings({ lightsEnabled: false });
      this.disableLighting(true);
      return;
    }
    if (lightsRequested) {
      this.enableLighting();
    } else {
      this.disableLighting();
    }

    if (!budget.colorMatrixEnabled && settings.colorMatrix.enabled) {
      updateVisualSettings({
        colorMatrix: {
          enabled: false,
        },
      });
    }
  }

  private refreshVisualLayers(): void {
    if (!this.currentMapArea) {
      return;
    }

    this.currentAtmosphereProfile = undefined;
    this.drawBackdrop();
    this.drawMap(this.currentMapArea.tiles);
    this.drawBuildingMasses();
    this.drawBuildingLabels();
    this.renderStaticProps();
    this.renderVisionCones();
    this.applyOcclusionReadability();
  }

  private hasLightPipelineSupport(): boolean {
    return this.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer;
  }

  private enableLighting(): void {
    if (!this.hasLightPipelineSupport()) {
      console.warn('[MainScene] WebGL renderer unavailable; Light2D disabled.');
      this.lightsFeatureEnabled = false;
      store.dispatch(setLightsEnabled(false));
      updateVisualSettings({ lightsEnabled: false });
      return;
    }
    if (this.lightsFeatureEnabled) {
      this.rebuildLightingDemoLight();
      return;
    }
    this.lights.enable().setAmbientColor(this.lightingAmbientColor);
    this.lightsFeatureEnabled = true;
    this.rebuildLightingDemoLight();
  }

  private disableLighting(force = false): void {
    if (!this.lightsFeatureEnabled && !force) {
      this.destroyDemoPointLight();
      return;
    }
    this.destroyDemoPointLight();
    if (this.hasLightPipelineSupport()) {
      const manager = this.lights as typeof this.lights & { removeAll?: () => void };
      if (typeof manager.removeAll === 'function') {
        manager.removeAll();
      }
      this.lights.disable();
    }
    this.lightsFeatureEnabled = false;
  }

  private rebuildLightingDemoLight(): void {
    if (!this.lightsFeatureEnabled || !this.demoLampGrid) {
      this.destroyDemoPointLight();
      return;
    }

    const { x, y } = this.calculatePixelPosition(this.demoLampGrid.x, this.demoLampGrid.y);
    const lightY = y - this.tileSize * 0.35;
    const radius = this.tileSize * 1.6;
    const intensity = 0.4;

    if (!this.demoPointLight) {
      this.demoPointLight = this.add.pointlight(x, lightY, 0x7dd3fc, radius, intensity);
      this.demoPointLight.setScrollFactor(1);
    } else {
      this.demoPointLight.setPosition(x, lightY);
      this.demoPointLight.radius = radius;
      this.demoPointLight.intensity = intensity;
    }
  }

  private destroyDemoPointLight(): void {
    if (this.demoPointLight) {
      this.demoPointLight.destroy();
      this.demoPointLight = undefined;
    }
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
    if (this.characterRigFactory) {
      this.characterRigFactory.positionToken(this.playerToken, position.x, position.y);
    } else {
      this.isoFactory!.positionCharacterToken(this.playerToken, position.x, position.y);
    }

    const pixelPos = this.calculatePixelPosition(position.x, position.y);
    this.dispatchPlayerScreenPosition();
    if (this.playerNameLabel) {
      const metrics = this.getIsoMetrics();
      this.positionCharacterLabel(this.playerNameLabel, pixelPos.x, pixelPos.y, metrics.tileHeight * 1.6);
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

    this.syncDepth(graphics, pixelPos.x, pixelPos.y, DepthBias.FLOATING_UI + 9);
  }

  private destroyPlayerVitalsIndicator(): void {
    if (this.playerVitalsIndicator) {
      this.playerVitalsIndicator.destroy();
      this.playerVitalsIndicator = undefined;
    }
  }

  private enablePlayerCameraFollow(): void {
    this.cameraModule.enablePlayerCameraFollow();
  }

  public recenterCameraOnPlayer(): void {
    this.cameraModule.recenterCameraOnPlayer();
  }

  private updateEnemies(enemies: Enemy[]): void {
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

        const token = this.characterRigFactory
          ? this.characterRigFactory.createToken('hostileNpc', enemy.position.x, enemy.position.y)
          : this.isoFactory!.createCharacterToken(
              enemy.position.x,
              enemy.position.y,
              this.visualTheme.entityProfiles.hostileNpc
            );

        const healthBar = this.add.graphics();
        healthBar.setVisible(false);

        const nameLabel = this.createCharacterNameLabel(enemy.name ?? 'Hostile', 0xef4444);
        this.positionCharacterLabel(nameLabel, pixelPos.x, pixelPos.y, metrics.tileHeight * 1.45);

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

      if (this.characterRigFactory) {
        this.characterRigFactory.positionToken(existingSpriteData.token, enemy.position.x, enemy.position.y);
      } else {
        this.isoFactory!.positionCharacterToken(existingSpriteData.token, enemy.position.x, enemy.position.y);
      }
      existingSpriteData.markedForRemoval = false;
      this.positionCharacterLabel(existingSpriteData.nameLabel, pixelPos.x, pixelPos.y, metrics.tileHeight * 1.45);

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
    this.syncDepth(graphics, pixelPos.x, pixelPos.y, DepthBias.FLOATING_UI + 6);
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
        const role = npc.isInteractive ? 'interactiveNpc' : 'friendlyNpc';
        const token = this.characterRigFactory
          ? this.characterRigFactory.createToken(role, npc.position.x, npc.position.y)
          : this.isoFactory!.createCharacterToken(
              npc.position.x,
              npc.position.y,
              this.visualTheme.entityProfiles[role]
            );

        const nameLabel = this.createCharacterNameLabel(npc.name ?? 'Civilian', npc.isInteractive ? 0x22d3ee : 0x94a3b8);
        this.positionCharacterLabel(nameLabel, pixelPos.x, pixelPos.y, metrics.tileHeight * 1.35);

        const npcData: NpcSpriteData = {
          token,
          nameLabel,
          markedForRemoval: false,
        };

        this.npcSprites.set(npc.id, npcData);
        this.updateNpcCombatIndicator(npcData, pixelPos, metrics, npc);
        continue;
      }

      if (this.characterRigFactory) {
        this.characterRigFactory.positionToken(existingSpriteData.token, npc.position.x, npc.position.y);
      } else {
        this.isoFactory!.positionCharacterToken(existingSpriteData.token, npc.position.x, npc.position.y);
      }
      existingSpriteData.markedForRemoval = false;
      this.positionCharacterLabel(existingSpriteData.nameLabel, pixelPos.x, pixelPos.y, metrics.tileHeight * 1.35);
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

    this.syncDepth(graphics, pixelPos.x, pixelPos.y, DepthBias.FLOATING_UI + 7);
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
    if (!this.mapGraphics) return;
    
    this.ensureVisualPipeline();
    const atmosphere = this.resolveAtmosphereProfile();
    this.tilePainter?.setAtmosphereProfile({
      wetReflectionAlpha: atmosphere.wetReflectionAlpha,
      emissiveIntensity: atmosphere.emissiveIntensity,
    });
    this.mapGraphics.clear();

    const { tileWidth, tileHeight } = this.getIsoMetrics();
    const buildingFootprintTiles = new Set<string>();
    this.currentMapArea?.buildings?.forEach((building) => {
      for (let y = building.footprint.from.y; y <= building.footprint.to.y; y += 1) {
        for (let x = building.footprint.from.x; x <= building.footprint.to.x; x += 1) {
          buildingFootprintTiles.add(`${x}:${y}`);
        }
      }
    });

    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[0].length; x++) {
        const tile = tiles[y][x];
        const center = this.calculatePixelPosition(x, y);
        const hideCoverVolume = this.currentMapArea?.zoneId?.startsWith('downtown_checkpoint') && tile.type === TileType.COVER;
        const isBuildingFootprint = buildingFootprintTiles.has(`${x}:${y}`);
        const groundOnly =
          hideCoverVolume ||
          isBuildingFootprint &&
          (tile.type === TileType.WALL || tile.type === TileType.COVER || tile.type === TileType.DOOR);

        this.renderTile(tile, center, tileWidth, tileHeight, x, y, groundOnly);
      }
    }
  }

  private drawBuildingMasses(): void {
    this.buildingMassings.forEach((mass) => mass.destroy(true));
    this.buildingMassings = [];
    this.buildingMassingEntries = [];

    if (!this.currentMapArea?.buildings?.length || !this.buildingPainter) {
      return;
    }

    this.ensureVisualPipeline();
    const buildingPainter = this.buildingPainter;
    if (!buildingPainter) {
      return;
    }
    const { tileWidth, tileHeight } = this.getIsoMetrics();

    this.currentMapArea.buildings.forEach((building) => {
      const profile =
        this.buildingVisualProfiles[building.id] ??
        resolveBuildingVisualProfile(
          building.district as BuildingVisualProfile['district'],
          building.signageStyle as BuildingVisualProfile['signageStyle'],
          building.propDensity
        );

      const widthTiles = building.footprint.to.x - building.footprint.from.x + 1;
      const depthTiles = building.footprint.to.y - building.footprint.from.y + 1;
      const northWest = this.calculatePixelPosition(building.footprint.from.x, building.footprint.from.y);
      const northEast = this.calculatePixelPosition(building.footprint.to.x, building.footprint.from.y);
      const southEast = this.calculatePixelPosition(building.footprint.to.x, building.footprint.to.y);
      const southWest = this.calculatePixelPosition(building.footprint.from.x, building.footprint.to.y);
      const footprint = {
        top: new Phaser.Geom.Point(northWest.x, northWest.y - tileHeight * 0.5),
        right: new Phaser.Geom.Point(northEast.x + tileWidth * 0.5, northEast.y),
        bottom: new Phaser.Geom.Point(southEast.x, southEast.y + tileHeight * 0.5),
        left: new Phaser.Geom.Point(southWest.x - tileWidth * 0.5, southWest.y),
      };
      const pixelCenter = {
        x: (footprint.top.x + footprint.right.x + footprint.bottom.x + footprint.left.x) / 4,
        y: (footprint.top.y + footprint.right.y + footprint.bottom.y + footprint.left.y) / 4,
      };

      const mass = buildingPainter.createMassing(building, profile, {
        center: pixelCenter,
        tileHeight,
        widthTiles,
        depthTiles,
        footprint,
      });
      mass.setScrollFactor(1);
      this.syncDepth(
        mass,
        footprint.bottom.x,
        footprint.bottom.y,
        DepthBias.PROP_TALL + Math.round(profile.massingHeight * 12)
      );
      this.buildingMassings.push(mass);

      const districtHeightBoost = profile.district === 'downtown' ? 0.78 : 0.7;
      const massingHeight = tileHeight * Math.max(0.58, profile.massingHeight * districtHeightBoost);
      const boundsMinX = Math.min(footprint.top.x, footprint.right.x, footprint.bottom.x, footprint.left.x);
      const boundsMaxX = Math.max(footprint.top.x, footprint.right.x, footprint.bottom.x, footprint.left.x);
      const boundsMinY = Math.min(
        footprint.top.y - massingHeight,
        footprint.right.y - massingHeight,
        footprint.bottom.y - massingHeight,
        footprint.left.y - massingHeight
      );
      const boundsMaxY = Math.max(footprint.top.y, footprint.right.y, footprint.bottom.y, footprint.left.y);
      this.buildingMassingEntries.push({
        id: building.id,
        container: mass,
        bounds: new Phaser.Geom.Rectangle(
          boundsMinX,
          boundsMinY,
          Math.max(1, boundsMaxX - boundsMinX),
          Math.max(1, boundsMaxY - boundsMinY)
        ),
      });
    });
  }

  private drawBuildingLabels(): void {
    this.buildingLabels.forEach((label) => label.destroy(true));
    this.buildingLabels = [];

    if (!this.currentMapArea?.buildings || this.currentMapArea.buildings.length === 0) {
      return;
    }

    this.ensureVisualPipeline();

    const { tileHeight } = this.getIsoMetrics();

    this.currentMapArea.buildings.forEach((building) => {
      const profile =
        this.buildingVisualProfiles[building.id] ??
        resolveBuildingVisualProfile(
          building.district as BuildingVisualProfile['district'],
          building.signageStyle as BuildingVisualProfile['signageStyle'],
          building.propDensity
        );
      const centerX = (building.footprint.from.x + building.footprint.to.x) / 2;
      const anchorY = Math.min(building.footprint.from.y, building.door.y) - 0.4;
      const pixel = this.calculatePixelPosition(centerX, anchorY);
      const labelHeight = tileHeight * (0.8 + profile.massingHeight * 0.18);
      const container = this.buildingPainter
        ? this.buildingPainter.createLabel(building, pixel, labelHeight, profile)
        : this.add.container(pixel.x, pixel.y - tileHeight * 0.2);
      container.setScrollFactor(1);
      this.syncDepth(container, pixel.x, pixel.y, DepthBias.FLOATING_UI + 20);
      this.buildingLabels.push(container);
    });
  }

  private renderTile(
    tile: MapTile,
    center: { x: number; y: number },
    tileWidth: number,
    tileHeight: number,
    gridX: number,
    gridY: number,
    groundOnly: boolean = false
  ): void {
    this.ensureVisualPipeline();
    this.tilePainter?.drawTile(tile, {
      center,
      tileWidth,
      tileHeight,
      gridX,
      gridY,
      groundOnly,
    });
  }

  private createCharacterNameLabel(name: string, accentColor: number, fontSize: number = 12): Phaser.GameObjects.Text {
    const label = this.add.text(0, 0, name.toUpperCase(), {
      fontFamily: 'Orbitron, "DM Sans", sans-serif',
      fontSize: `${fontSize}px`,
      fontStyle: '700',
      color: this.colorToHex(0xf8fafc),
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
    verticalOffset: number
  ): void {
    label.setPosition(pixelX, pixelY - verticalOffset);
    label.setDepth(computeDepth(pixelX, pixelY, DepthBias.OVERLAY));
  }

  private colorToHex(color: number): string {
    return `#${color.toString(16).padStart(6, '0')}`;
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

  private resolveDistrictWeight(): number {
    const profiles = Object.values(this.buildingVisualProfiles);
    if (!profiles.length) {
      return 0.5;
    }

    const downtownCount = profiles.filter((profile) => profile.district === 'downtown').length;
    return downtownCount / profiles.length;
  }

  private resolveAtmosphereProfile(baseOverlayRgba?: string): AtmosphereProfile {
    this.ensureVisualPipeline();
    if (!this.atmosphereDirector) {
      throw new Error('AtmosphereDirector is not initialized.');
    }

    const profile = this.atmosphereDirector.resolveAtmosphereProfile({
      districtWeight: this.resolveDistrictWeight(),
      timeSeconds: this.currentGameTime,
      baseOverlayRgba,
    });

    const presetCaps = getVisualFxBudgetForPreset(this.visualTheme.preset);
    this.currentAtmosphereProfile = {
      ...profile,
      fogBands: profile.fogBands.slice(0, presetCaps.maxFogBands),
      emissiveIntensity: Phaser.Math.Clamp(profile.emissiveIntensity, 0, 1),
      wetReflectionAlpha: Phaser.Math.Clamp(profile.wetReflectionAlpha, 0, presetCaps.wetReflectionAlpha),
    };

    return this.currentAtmosphereProfile;
  }

  private applyOcclusionReadability(): void {
    if (!this.occlusionReadabilityController || !this.buildingMassingEntries.length) {
      return;
    }

    const entities: OcclusionEntityHandle[] = [];
    if (this.playerToken) {
      entities.push({
        id: 'player',
        pixelX: this.playerToken.container.x,
        pixelY: this.playerToken.container.y,
        token: this.playerToken,
        nameLabel: this.playerNameLabel,
      });
    }

    this.enemySprites.forEach((enemyData, enemyId) => {
      entities.push({
        id: enemyId,
        pixelX: enemyData.token.container.x,
        pixelY: enemyData.token.container.y,
        token: enemyData.token,
        nameLabel: enemyData.nameLabel,
        healthBar: enemyData.healthBar,
      });
    });

    this.npcSprites.forEach((npcData, npcId) => {
      entities.push({
        id: npcId,
        pixelX: npcData.token.container.x,
        pixelY: npcData.token.container.y,
        token: npcData.token,
        nameLabel: npcData.nameLabel,
        indicator: npcData.indicator,
      });
    });

    const profile = this.currentAtmosphereProfile ?? this.resolveAtmosphereProfile();
    this.occlusionReadabilityController.applyOcclusionReadability({
      masses: this.buildingMassingEntries,
      entities,
      occlusionFadeFloor: this.visualTheme.qualityBudget.occlusionFadeFloor,
      emissiveIntensity: profile.emissiveIntensity,
    });
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

    const atmosphere = this.resolveAtmosphereProfile();
    const skylineSplit = atmosphere.skylineSplit;

    this.backdropGraphics.clear();
    this.backdropGraphics.fillGradientStyle(
      atmosphere.gradientTopLeft,
      atmosphere.gradientTopRight,
      atmosphere.gradientBottomLeft,
      atmosphere.gradientBottomRight,
      1,
      1,
      1,
      1
    );
    this.backdropGraphics.fillRect(originX, originY, width, height);

    const skylineBaseY = originY + height * 0.52;
    const skylineColumns = atmosphere.skylineColumns;
    const downtownColor = atmosphere.skylineDowntownColor;
    const slumsColor = atmosphere.skylineSlumsColor;

    for (let column = 0; column < skylineColumns; column += 1) {
      const normalized = column / skylineColumns;
      const x = originX + normalized * width;
      const widthScale = 0.68 + (((column * 13) % 7) * 0.08);
      const segmentWidth = (width / skylineColumns) * widthScale;
      const variant = ((column * 29) % 11) / 11;
      const towerHeight = height * (0.12 + variant * 0.28) * (normalized < skylineSplit ? 1.12 : 0.78);
      const tintMix = normalized < skylineSplit ? 0.78 : 0.26;
      const tint = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(slumsColor),
        Phaser.Display.Color.ValueToColor(downtownColor),
        1,
        tintMix
      );
      const tintColor = Phaser.Display.Color.GetColor(tint.r, tint.g, tint.b);
      this.backdropGraphics.fillStyle(
        tintColor,
        atmosphere.skylineAlphaBase + variant * atmosphere.skylineAlphaVariance
      );
      this.backdropGraphics.fillRect(x, skylineBaseY - towerHeight, segmentWidth, towerHeight);
      this.backdropGraphics.fillStyle(adjustColor(tintColor, 0.12), 0.14 + atmosphere.emissiveIntensity * 0.1);
      this.backdropGraphics.fillRect(x + segmentWidth * 0.72, skylineBaseY - towerHeight, segmentWidth * 0.16, towerHeight);
    }

    const horizonY = originY + height * 0.35;
    this.backdropGraphics.fillStyle(atmosphere.horizonGlowColor, atmosphere.horizonGlowAlpha);
    this.backdropGraphics.fillEllipse(originX + width / 2, horizonY, width * 1.08, height * 0.52);

    this.backdropGraphics.fillStyle(atmosphere.lowerHazeColor, atmosphere.lowerHazeAlpha);
    this.backdropGraphics.fillRect(originX, originY + height * 0.6, width, height * 0.6);

    atmosphere.fogBands.forEach((band) => {
      const alpha = band.alpha;
      if (alpha <= 0) {
        return;
      }
      this.backdropGraphics.lineStyle(2, band.color, alpha);
      this.backdropGraphics.strokeEllipse(
        originX + width / 2,
        originY + height * band.yFactor,
        width * band.widthFactor,
        height * band.heightFactor
      );
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
