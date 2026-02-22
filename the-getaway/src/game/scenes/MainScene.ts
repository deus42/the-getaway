import Phaser from 'phaser';
import { MapArea, TileType, Position, Enemy, MapTile, NPC, AlertLevel, Item, SurveillanceZoneState } from '../interfaces/types';
import { DEFAULT_TILE_SIZE } from '../world/grid';
import { store } from '../../store';
import { updateGameTime as updateGameTimeAction } from '../../store/worldSlice';
import { applySuspicionDecay } from '../../store/suspicionSlice';
import { setLightsEnabled } from '../../store/settingsSlice';
import { DEFAULT_DAY_NIGHT_CONFIG, getDayNightOverlayColor } from '../world/dayNightCycle';
import {
  TILE_CLICK_EVENT,
  PATH_PREVIEW_EVENT,
  PLAYER_SCREEN_POSITION_EVENT,
  PICKUP_STATE_SYNC_EVENT,
  PickupStateSyncDetail,
  PathPreviewDetail,
  ViewportUpdateDetail,
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
import { getVisionConeTiles } from '../combat/perception';
import { resolveCardinalDirection } from '../combat/combatSystem';
import { LevelBuildingDefinition } from '../../content/levels/level0/types';
import { miniMapService } from '../services/miniMapService';
import CameraSprite from '../objects/CameraSprite';
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

const DEFAULT_FIT_ZOOM_FACTOR = 1.25;
const MIN_CAMERA_ZOOM = 0.6;
const MAX_CAMERA_ZOOM = 2.3;
const CAMERA_BOUND_PADDING_TILES = 6;
const CAMERA_FOLLOW_LERP = 0.08;
const COMBAT_ZOOM_MULTIPLIER = 1.28;
const COMBAT_ZOOM_MIN_DELTA = 0.22;
const CAMERA_ZOOM_TWEEN_MS = 340;

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
  private cameraSprites: Map<string, CameraSprite> = new Map();
  private coverDebugGraphics?: Phaser.GameObjects.Graphics;
  private currentMapArea: MapArea | null = null;
  private buildingLabels: Phaser.GameObjects.Container[] = [];
  private buildingMassings: Phaser.GameObjects.GameObject[] = [];
  private buildingMassingEntries: BuildingMassingEntry[] = [];
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
  private disposeVisualSettings?: () => void;
  private disposeLightingSettings?: () => void;
  private lastPlayerScreenDetail?: PlayerScreenPositionDetail;
  private baselineCameraZoom = 1;
  private cameraZoomTween: Phaser.Tweens.Tween | null = null;
  private lightsFeatureEnabled = false;
  private demoLampGrid?: Position;
  private demoPointLight?: Phaser.GameObjects.PointLight;
  private readonly lightingAmbientColor = 0x0f172a;
  private lastItemMarkerSignature = '';
  private hasInitialZoomApplied = false;
  private userAdjustedZoom = false;
  private pendingCameraRestore = false;
  private preCombatZoom: number | null = null;
  private preCombatUserAdjusted = false;
  private pendingRestoreUserAdjusted: boolean | null = null;
  private handlePickupStateSync = (event: Event) => {
    const customEvent = event as CustomEvent<PickupStateSyncDetail>;
    if (!this.sys.isActive() || !this.currentMapArea) {
      return;
    }

    if (customEvent.detail?.areaId && customEvent.detail.areaId !== this.currentMapArea.id) {
      return;
    }

    this.currentMapArea = store.getState().world.currentMapArea;
    this.renderStaticProps();
  };
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

    // Listen for resize events
    this.scale.on('resize', this.handleResize, this);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener(PATH_PREVIEW_EVENT, this.handlePathPreview as EventListener);
    window.addEventListener(PICKUP_STATE_SYNC_EVENT, this.handlePickupStateSync as EventListener);
    miniMapService.initialize(this);

    if (this.input) {
      this.input.on('pointerdown', this.handlePointerDown, this);
      this.input.on('wheel', this.handleWheel);
    }
    
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

      // PoC convenience: `?poc=esb` will auto-focus the camera on the ESB landmark slot.
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('poc') === 'esb') {
          this.cameras.main.setZoom(1.05);
          this.focusCameraOnGridPosition(14, 33, false);
        }
      }
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
    window.removeEventListener(PICKUP_STATE_SYNC_EVENT, this.handlePickupStateSync as EventListener);
    miniMapService.shutdown();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.stopCameraZoomTween();

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

      const depthBias = DepthBias.PROP_TALL + Math.round(metrics.tileHeight * 0.5);
      this.syncDepth(sprite, pixelPos.x, pixelPos.y, depthBias);
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
    if (this.disposeVisualSettings) {
      this.disposeVisualSettings();
      this.disposeVisualSettings = undefined;
    }
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
    this.scale.off('resize', this.handleResize, this);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener(PATH_PREVIEW_EVENT, this.handlePathPreview as EventListener);
    if (this.input) {
      this.input.off('pointerdown', this.handlePointerDown, this);
    }
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

      // ESB PoC: skyline landmark (no occlusion/readability interference).
      // Keep it always behind characters/props (so NPCs never get hidden), but above the map base.
      if (building.id === 'block_2_1') {
        this.registerStaticDepth(mass, DepthLayers.MAP_BASE + 1);
        this.buildingMassings.push(mass);

        // Add a player-scale entrance marker at the door tile (warm portal glow).
        const doorPixel = this.calculatePixelPosition(building.door.x, building.door.y);
        const entrance = this.add.container(doorPixel.x, doorPixel.y);
        entrance.setScrollFactor(1);

        const glow = this.add.graphics();
        glow.fillStyle(0xffb35c, 0.22);
        glow.fillCircle(0, 0, tileHeight * 0.9);
        glow.fillStyle(0xff7a18, 0.18);
        glow.fillCircle(0, 0, tileHeight * 0.55);

        const frame = this.add.graphics();
        frame.lineStyle(2, 0x39d5ff, 0.55);
        frame.strokeRoundedRect(-10, -20, 20, 32, 4);
        frame.lineStyle(1, 0xffffff, 0.15);
        frame.strokeRoundedRect(-12, -22, 24, 36, 6);

        entrance.add([glow, frame]);
        this.syncDepth(entrance, doorPixel.x, doorPixel.y, DepthBias.PROP_LOW);
        this.buildingMassings.push(entrance);

        // Neon mood (fake emissive): additive glows + a small "billboard" near the entrance.
        // (Avoid Phaser PointLight here: it reads like a headlight and easily blows out the palette.)
        const neon = this.add.graphics();
        neon.setBlendMode(Phaser.BlendModes.ADD);

        // Warm door halo
        neon.fillStyle(0xffb35c, 0.09);
        neon.fillCircle(0, 0, tileHeight * 1.25);
        neon.fillStyle(0xff7a18, 0.06);
        neon.fillCircle(0, 0, tileHeight * 0.85);

        // Cyan/magenta edge accent (thin, Art Deco-ish)
        neon.lineStyle(2, 0x39d5ff, 0.10);
        neon.strokeRoundedRect(-12, -24, 24, 40, 6);
        neon.lineStyle(1, 0xc14bff, 0.07);
        neon.strokeRoundedRect(-15, -27, 30, 46, 8);

        entrance.add(neon);

        // Subtle pulse
        this.tweens.add({
          targets: neon,
          alpha: { from: 0.9, to: 1.0 },
          duration: 2400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        return;
      }

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
    const zoomMultiplier = deltaY > 0 ? 0.82 : 1.18;
    const currentZoom = camera.zoom;
    const targetZoom = Phaser.Math.Clamp(
      currentZoom * zoomMultiplier,
      MIN_CAMERA_ZOOM,
      MAX_CAMERA_ZOOM
    );

    if (Math.abs(targetZoom - currentZoom) < 0.0005) {
      return;
    }

    if (!this.inCombat) {
      this.userAdjustedZoom = true;
    }

    this.stopCameraZoomTween();

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

    if (!this.inCombat) {
      this.baselineCameraZoom = targetZoom;
    }
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

    const destination = detail.path[detail.path.length - 1];
    this.renderCoverPreview(destination);
  };

  private clearPathPreview(): void {
    if (this.pathGraphics) {
      this.pathGraphics.clear();
    }
    this.renderCoverPreview();
  }

  private renderCoverPreview(position?: Position): void {
    if (!this.coverDebugGraphics) {
      return;
    }

    this.coverDebugGraphics.clear();

    if (!position || !this.currentMapArea) {
      this.coverDebugGraphics.setVisible(false);
      return;
    }

    const reference = this.lastPlayerGridPosition ?? this.playerInitialPosition;
    if (!reference) {
      this.coverDebugGraphics.setVisible(false);
      return;
    }

    const tile = this.currentMapArea.tiles[position.y]?.[position.x];
    if (!tile?.cover) {
      this.coverDebugGraphics.setVisible(false);
      return;
    }

    const incomingDirection = resolveCardinalDirection(position, reference);
    const coverLevel = tile.cover[incomingDirection];

    if (!coverLevel || coverLevel === 'none') {
      this.coverDebugGraphics.setVisible(false);
      return;
    }

    const { tileWidth, tileHeight } = this.getIsoMetrics();
    const center = this.calculatePixelPosition(position.x, position.y);
    const points = this.getDiamondPoints(center.x, center.y, tileWidth * 0.7, tileHeight * 0.7);
    const [top, right, bottom, left] = points;

    const color = coverLevel === 'full' ? 0x38bdf8 : 0xfbbf24;
    const alpha = coverLevel === 'full' ? 0.35 : 0.25;

    this.coverDebugGraphics.fillStyle(color, alpha);
    switch (incomingDirection) {
      case 'north':
        this.coverDebugGraphics.fillTriangle(top.x, top.y, right.x, right.y, left.x, left.y);
        break;
      case 'south':
        this.coverDebugGraphics.fillTriangle(bottom.x, bottom.y, right.x, right.y, left.x, left.y);
        break;
      case 'east':
        this.coverDebugGraphics.fillTriangle(right.x, right.y, top.x, top.y, bottom.x, bottom.y);
        break;
      case 'west':
        this.coverDebugGraphics.fillTriangle(left.x, left.y, bottom.x, bottom.y, top.x, top.y);
        break;
    }

    this.coverDebugGraphics.fillCircle(center.x, center.y, tileHeight * 0.08);
    this.coverDebugGraphics.setVisible(true);
  }

  private emitViewportUpdate(): void {
    if (!this.currentMapArea || !this.sys.isActive()) {
      return;
    }

    const camera = this.cameras.main;

    const view = camera.worldView;
    const topLeft = this.worldToGridContinuous(view.x, view.y);
    const topRight = this.worldToGridContinuous(view.x + view.width, view.y);
    const bottomLeft = this.worldToGridContinuous(view.x, view.y + view.height);
    const bottomRight = this.worldToGridContinuous(view.x + view.width, view.y + view.height);

    if (!topLeft || !topRight || !bottomLeft || !bottomRight) {
      return;
    }

    const centerX = (topLeft.x + topRight.x + bottomLeft.x + bottomRight.x) / 4;
    const centerY = (topLeft.y + topRight.y + bottomLeft.y + bottomRight.y) / 4;

    const horizontalEdges = [
      Math.abs(topRight.x - topLeft.x),
      Math.abs(bottomRight.x - bottomLeft.x),
    ].filter((value) => Number.isFinite(value));

    const verticalEdges = [
      Math.abs(bottomLeft.y - topLeft.y),
      Math.abs(bottomRight.y - topRight.y),
    ].filter((value) => Number.isFinite(value));

    const edgeWidth = horizontalEdges.length
      ? horizontalEdges.reduce((acc, value) => acc + value, 0) / horizontalEdges.length
      : 0;
    const edgeHeight = verticalEdges.length
      ? verticalEdges.reduce((acc, value) => acc + value, 0) / verticalEdges.length
      : 0;

    const width = Math.max(0.0001, edgeWidth);
    const height = Math.max(0.0001, edgeHeight);

    const detail: ViewportUpdateDetail = {
      x: centerX - width / 2,
      y: centerY - height / 2,
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
    this.ensureVisualPipeline();

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

    const restoreActive = this.pendingCameraRestore || Boolean(this.cameraZoomTween);

    if (!this.inCombat) {
      if (!this.hasInitialZoomApplied) {
        if (!restoreActive) {
          camera.setZoom(desiredZoom);
        }
      } else if (!this.userAdjustedZoom && !restoreActive) {
        const zoomDelta = Math.abs(camera.zoom - desiredZoom);
        if (zoomDelta > 0.0008) {
          this.userAdjustedZoom = false;
          this.animateCameraZoom(desiredZoom);
        }
      }
    }

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
    this.drawBuildingMasses();
    this.drawBuildingLabels();
    this.clearPathPreview();

    // Ensure overlay matches latest viewport size after camera adjustments
    this.resizeDayNightOverlay();
    this.emitViewportUpdate();

    if (!this.inCombat && !restoreActive) {
      this.baselineCameraZoom = camera.zoom;
    }
    this.hasInitialZoomApplied = true;
  }

  private initializeDayNightOverlay(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    this.dayNightOverlay = this.add.rectangle(0, 0, width, height, 0x000000, 0);
    this.dayNightOverlay.setOrigin(0.5, 0.5);
    this.dayNightOverlay.setScrollFactor(0);
    this.registerStaticDepth(this.dayNightOverlay, DepthLayers.DAY_NIGHT_OVERLAY);
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

  private stopCameraZoomTween(): void {
    if (this.cameraZoomTween) {
      this.cameraZoomTween.remove();
      this.cameraZoomTween = null;
      if (this.pendingCameraRestore) {
        this.pendingCameraRestore = false;
        if (this.pendingRestoreUserAdjusted !== null) {
          this.userAdjustedZoom = this.pendingRestoreUserAdjusted;
        }
        this.preCombatZoom = null;
        this.preCombatUserAdjusted = false;
        this.pendingRestoreUserAdjusted = null;
      }
    }
  }

  private animateCameraZoom(targetZoom: number): void {
    if (!this.sys.isActive()) return;
    const camera = this.cameras.main;
    if (!camera) {
      return;
    }

    const clampedTarget = Phaser.Math.Clamp(targetZoom, MIN_CAMERA_ZOOM, MAX_CAMERA_ZOOM);
    const currentZoom = camera.zoom;

    this.stopCameraZoomTween();

    if (Math.abs(currentZoom - clampedTarget) < 0.0005) {
      camera.setZoom(clampedTarget);
      this.applyOverlayZoom();
      this.emitViewportUpdate();
      if (!this.inCombat) {
        this.baselineCameraZoom = camera.zoom;
      }
      if (this.pendingCameraRestore) {
        this.pendingCameraRestore = false;
        if (this.pendingRestoreUserAdjusted !== null) {
          this.userAdjustedZoom = this.pendingRestoreUserAdjusted;
        }
        this.preCombatZoom = null;
        this.preCombatUserAdjusted = false;
        this.pendingRestoreUserAdjusted = null;
      }
      return;
    }

    this.cameraZoomTween = this.tweens.add({
      targets: camera,
      zoom: clampedTarget,
      duration: CAMERA_ZOOM_TWEEN_MS,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        this.applyOverlayZoom();
        this.emitViewportUpdate();
      },
      onComplete: () => {
        this.cameraZoomTween = null;
        if (!this.inCombat) {
          this.baselineCameraZoom = camera.zoom;
        }
        if (this.pendingCameraRestore) {
          this.pendingCameraRestore = false;
          if (this.pendingRestoreUserAdjusted !== null) {
            this.userAdjustedZoom = this.pendingRestoreUserAdjusted;
          }
          this.preCombatZoom = null;
          this.preCombatUserAdjusted = false;
          this.pendingRestoreUserAdjusted = null;
        }
      },
    });
  }

  private zoomCameraForCombat(): void {
    const camera = this.cameras.main;
    if (!camera) {
      return;
    }

    // Capture the exploration zoom so we can restore it later
    this.pendingCameraRestore = false;
    const explorationZoom = camera.zoom;
    if (this.preCombatZoom === null) {
      this.preCombatZoom = explorationZoom;
      this.preCombatUserAdjusted = this.userAdjustedZoom;
    }
    this.baselineCameraZoom = explorationZoom;
    const targetZoom = Math.min(
      MAX_CAMERA_ZOOM,
      Math.max(explorationZoom * COMBAT_ZOOM_MULTIPLIER, explorationZoom + COMBAT_ZOOM_MIN_DELTA)
    );
    this.userAdjustedZoom = false;
    this.animateCameraZoom(targetZoom);
  }

  private restoreCameraAfterCombat(): void {
    const camera = this.cameras.main;
    if (!camera) {
      return;
    }

    const targetZoom = this.preCombatZoom ?? this.baselineCameraZoom ?? camera.zoom;
    this.pendingRestoreUserAdjusted = this.preCombatUserAdjusted;
    this.userAdjustedZoom = true;
    this.pendingCameraRestore = true;
    this.animateCameraZoom(targetZoom);
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

    const baseOverlay = getDayNightOverlayColor(this.currentGameTime, DEFAULT_DAY_NIGHT_CONFIG);
    const atmosphere = this.resolveAtmosphereProfile(baseOverlay);
    this.dayNightOverlay.setFillStyle(atmosphere.overlayColor, atmosphere.overlayAlpha);
  }

  public update(_time: number, delta: number): void {
    if (!this.sys.isActive()) {
      return;
    }

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
