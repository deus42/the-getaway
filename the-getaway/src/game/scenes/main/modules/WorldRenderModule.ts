import Phaser from 'phaser';
import { Item, MapArea, MapBuildingDefinition, MapTile, Position, TileType } from '../../../interfaces/types';
import type { MainScene } from '../../MainScene';
import type {
  EntityRenderRuntimeState,
  WorldRenderModulePorts,
  WorldRenderRuntimeState,
} from '../contracts/ModulePorts';
import { SceneModule } from '../SceneModule';
import { DepthBias } from '../../../utils/depth';
import { adjustColor } from '../../../utils/iso';
import { createNoirVectorTheme, resolveBuildingVisualProfile } from '../../../visual/theme/noirVectorTheme';
import { resolveVisualThemeForMap } from '../../../visual/theme/mapVisualTheme';
import type { BuildingVisualProfile, VisualTheme } from '../../../visual/contracts';
import { TilePainter } from '../../../visual/world/TilePainter';
import { BuildingPainter } from '../../../visual/world/BuildingPainter';
import { composeEnvironmentArt } from '../../../visual/world/EnvironmentComposer';
import { SpriteCharacterRigFactory } from '../../../visual/entities/SpriteCharacterRigFactory';
import { AtmosphereDirector, type AtmosphereProfile } from '../../../visual/world/AtmosphereDirector';
import { OcclusionEntityHandle, OcclusionReadabilityController } from '../../../visual/world/OcclusionReadabilityController';
import {
  getVisualFxBudgetForPreset,
  updateVisualSettings,
  type VisualFxSettings,
} from '../../../settings/visualSettings';
import { resolvePickupObjectName } from '../../../utils/itemDisplay';
import { store } from '../../../../store';
import { setLightsEnabled } from '../../../../store/settingsSlice';
import {
  getLevel0GuidedStep,
  LEVEL0_GUIDED_ITEM_KEYS,
  resolveLevel0GuidedContactMarkerState,
  resolveLevel0GuidedItemMarkerState,
} from '../../../quests/level0GuidedSlice';
import type { CharacterToken, IsoObjectFactory } from '../../../utils/IsoObjectFactory';
import type { CharacterRenderDescriptor } from '../../../visual/entities/characterPresentation';
import {
  GET155_PREVIEW_ATLAS_KEY,
  GET155_PREVIEW_PROP_FRAMES,
  LEVEL0_ENVIRONMENT_ATLAS_KEY,
  LEVEL0_ENVIRONMENT_NORMAL_KEY,
  LEVEL0_ENVIRONMENT_PROP_FRAMES,
  PAINTERLY_LEVEL0_ENVIRONMENT_ATLAS_KEY,
  PAINTERLY_LEVEL0_ENVIRONMENT_NORMAL_KEY,
  type EnvironmentAtlasFrameDefinition,
  type Get155PreviewFrameId,
  type Level0EnvironmentPropFrameId,
} from '../../../../content/environment/atlasFrames';
import {
  GET155_LEVEL0_ANCHOR_BUILDING_ID,
  resolveGet155Level0Placements,
} from '../../../../content/environment/get155Level0Slice';
import {
  resolveLevel0RouteBeaconsForStage,
} from '../../../../content/environment/level0RouteSetPieces';

type StaticPropAdder = (prop?: Phaser.GameObjects.GameObject | null) => void;

type PickupSpritePresentation = {
  frameId: Level0EnvironmentPropFrameId;
  tint: number;
  scale: number;
  alpha: number;
};

const hexStringToColor = (value: string): number => {
  return Number.parseInt(value.replace('#', ''), 16);
};

const readValue = <T>(target: object, key: string): T | undefined => {
  return Reflect.get(target, key) as T | undefined;
};

const readRequiredValue = <T>(target: object, key: string): T => {
  const value = readValue<T>(target, key);
  if (value === undefined || value === null) {
    throw new Error(`[WorldRenderModule] Missing required scene value: ${key}`);
  }
  return value;
};

const readNumber = (target: object, key: string, fallback: number): number => {
  const value = readValue<unknown>(target, key);
  return typeof value === 'number' ? value : fallback;
};

const callSceneMethod = <TReturn>(target: object, key: string, ...args: unknown[]): TReturn => {
  const value = readValue<unknown>(target, key);
  if (typeof value !== 'function') {
    throw new Error(`[WorldRenderModule] Missing required scene method: ${key}`);
  }

  return (value as (...methodArgs: unknown[]) => TReturn).apply(target, args);
};

const createDefaultRuntimeState = (): WorldRenderRuntimeState => ({
  visualTheme: createNoirVectorTheme('balanced'),
  tilePainter: undefined,
  buildingPainter: undefined,
  characterRigFactory: undefined,
  atmosphereDirector: undefined,
  occlusionReadabilityController: undefined,
  buildingVisualProfiles: {},
  buildingLabels: [],
  buildingMassings: [],
  buildingMassingEntries: [],
  environmentComposition: undefined,
  currentAtmosphereProfile: undefined,
  lastAtmosphereRedrawBucket: -1,
  lastItemMarkerSignature: '',
});

const createWorldRenderModulePorts = (scene: MainScene): WorldRenderModulePorts => {
  return {
    add: readRequiredValue(scene, 'add'),
    cameras: readRequiredValue(scene, 'cameras'),
    game: readRequiredValue(scene, 'game'),
    lights: readRequiredValue(scene, 'lights'),
    mapGraphics: readRequiredValue(scene, 'mapGraphics'),
    getBackdropGraphics: () => readValue(scene, 'backdropGraphics'),
    getCurrentMapArea: () => readValue(scene, 'currentMapArea') ?? null,
    getCurrentGameTime: () => readNumber(scene, 'currentGameTime', 0),
    getTileSize: () => readNumber(scene, 'tileSize', 0),
    getIsoFactory: () => readValue(scene, 'isoFactory'),
    ensureIsoFactory: () => {
      callSceneMethod(scene, 'ensureIsoFactory');
    },
    getIsoMetrics: () => callSceneMethod(scene, 'getIsoMetrics'),
    calculatePixelPosition: (gridX: number, gridY: number) => callSceneMethod(scene, 'calculatePixelPosition', gridX, gridY),
    syncDepth: (target: Phaser.GameObjects.GameObject, pixelX: number, pixelY: number, bias: number) => {
      callSceneMethod(scene, 'syncDepth', target, pixelX, pixelY, bias);
    },
    renderVisionCones: () => {
      callSceneMethod(scene, 'renderVisionCones');
    },
    getStaticPropGroup: () => readValue(scene, 'staticPropGroup'),
    setStaticPropGroup: (group) => {
      Reflect.set(scene, 'staticPropGroup', group);
    },
    getLightsFeatureEnabled: () => Boolean(readValue(scene, 'lightsFeatureEnabled')),
    setLightsFeatureEnabled: (enabled: boolean) => {
      Reflect.set(scene, 'lightsFeatureEnabled', enabled);
    },
    getDemoLampGrid: () => readValue(scene, 'demoLampGrid'),
    setDemoLampGrid: (position) => {
      Reflect.set(scene, 'demoLampGrid', position);
    },
    getDemoPointLight: () => readValue(scene, 'demoPointLight'),
    setDemoPointLight: (light) => {
      Reflect.set(scene, 'demoPointLight', light);
    },
    getLightingAmbientColor: () => readNumber(scene, 'lightingAmbientColor', 0x0f172a),
    readEntityRuntimeState: () => ({
      playerToken: readValue(scene, 'playerToken'),
      playerNameLabel: readValue(scene, 'playerNameLabel'),
      enemySprites: readValue(scene, 'enemySprites') ?? new Map(),
      npcSprites: readValue(scene, 'npcSprites') ?? new Map(),
    }),
    readRuntimeState: () => ({
      visualTheme: readValue(scene, 'visualTheme') ?? createNoirVectorTheme('balanced'),
      tilePainter: readValue(scene, 'tilePainter'),
      buildingPainter: readValue(scene, 'buildingPainter'),
      characterRigFactory: readValue(scene, 'characterRigFactory'),
      atmosphereDirector: readValue(scene, 'atmosphereDirector'),
      occlusionReadabilityController: readValue(scene, 'occlusionReadabilityController'),
      buildingVisualProfiles: readValue(scene, 'buildingVisualProfiles') ?? {},
      buildingLabels: readValue(scene, 'buildingLabels') ?? [],
      buildingMassings: readValue(scene, 'buildingMassings') ?? [],
      buildingMassingEntries: readValue(scene, 'buildingMassingEntries') ?? [],
      environmentComposition: readValue(scene, 'environmentComposition'),
      currentAtmosphereProfile: readValue(scene, 'currentAtmosphereProfile'),
      lastAtmosphereRedrawBucket: readNumber(scene, 'lastAtmosphereRedrawBucket', -1),
      lastItemMarkerSignature: readValue(scene, 'lastItemMarkerSignature') ?? '',
    }),
    writeRuntimeState: (state) => {
      Reflect.set(scene, 'visualTheme', state.visualTheme);
      Reflect.set(scene, 'tilePainter', state.tilePainter);
      Reflect.set(scene, 'buildingPainter', state.buildingPainter);
      Reflect.set(scene, 'characterRigFactory', state.characterRigFactory);
      Reflect.set(scene, 'atmosphereDirector', state.atmosphereDirector);
      Reflect.set(scene, 'occlusionReadabilityController', state.occlusionReadabilityController);
      Reflect.set(scene, 'buildingVisualProfiles', state.buildingVisualProfiles);
      Reflect.set(scene, 'buildingLabels', state.buildingLabels);
      Reflect.set(scene, 'buildingMassings', state.buildingMassings);
      Reflect.set(scene, 'buildingMassingEntries', state.buildingMassingEntries);
      Reflect.set(scene, 'environmentComposition', state.environmentComposition);
      Reflect.set(scene, 'currentAtmosphereProfile', state.currentAtmosphereProfile);
      Reflect.set(scene, 'lastAtmosphereRedrawBucket', state.lastAtmosphereRedrawBucket);
      Reflect.set(scene, 'lastItemMarkerSignature', state.lastItemMarkerSignature);
    },
  };
};

export class WorldRenderModule implements SceneModule<MainScene> {
  readonly key = 'worldRender';

  private readonly ports: WorldRenderModulePorts;

  private runtimeState: WorldRenderRuntimeState;

  constructor(private readonly scene: MainScene, ports?: WorldRenderModulePorts) {
    this.ports = ports ?? createWorldRenderModulePorts(scene);
    this.runtimeState = {
      ...createDefaultRuntimeState(),
      ...this.ports.readRuntimeState?.(),
    };
    this.pushRuntimeStateToPorts();
  }

  init(): void {}

  onShutdown(): void {
    this.clearForMapTransition();
    this.disableLighting(true);
  }

  createCharacterToken(descriptor: CharacterRenderDescriptor, gridX: number, gridY: number): CharacterToken {
    this.ensureVisualPipeline();
    this.ports.ensureIsoFactory();

    if (this.runtimeState.characterRigFactory) {
      return this.runtimeState.characterRigFactory.createToken(descriptor, gridX, gridY);
    }

    const isoFactory = this.ports.getIsoFactory();
    if (!isoFactory) {
      throw new Error('[WorldRenderModule] IsoObjectFactory not available while creating character token.');
    }

    return isoFactory.createCharacterToken(
      gridX,
      gridY,
      this.runtimeState.visualTheme.entityProfiles[descriptor.role]
    );
  }

  positionCharacterToken(
    token: CharacterToken,
    descriptor: CharacterRenderDescriptor,
    gridX: number,
    gridY: number
  ): void {
    if (this.runtimeState.characterRigFactory) {
      this.runtimeState.characterRigFactory.positionToken(token, descriptor, gridX, gridY);
      return;
    }

    const isoFactory = this.ports.getIsoFactory();
    if (!isoFactory) {
      throw new Error('[WorldRenderModule] IsoObjectFactory not available while positioning character token.');
    }

    isoFactory.positionCharacterToken(token, gridX, gridY);
  }

  getAtmosphereRedrawBucket(): number {
    return this.runtimeState.lastAtmosphereRedrawBucket;
  }

  setAtmosphereRedrawBucket(bucket: number): void {
    this.runtimeState.lastAtmosphereRedrawBucket = bucket;
    this.pushRuntimeStateToPorts();
  }

  getVisualTheme(): VisualTheme {
    return this.runtimeState.visualTheme;
  }

  ensureVisualPipeline(): void {
    const preset = store.getState().settings.visualQualityPreset;
    const nextTheme = resolveVisualThemeForMap(this.ports.getCurrentMapArea(), preset);
    const themeChanged =
      !this.runtimeState.visualTheme ||
      this.runtimeState.visualTheme.id !== nextTheme.id ||
      this.runtimeState.visualTheme.preset !== nextTheme.preset;

    if (themeChanged) {
      this.runtimeState.visualTheme = nextTheme;
    }

    if (this.ports.mapGraphics && (!this.runtimeState.tilePainter || themeChanged)) {
      this.runtimeState.tilePainter = new TilePainter(this.ports.mapGraphics, this.runtimeState.visualTheme);
    }

    if (!this.runtimeState.buildingPainter || themeChanged) {
      this.runtimeState.buildingPainter = new BuildingPainter(this.scene, this.runtimeState.visualTheme);
    }

    if (!this.runtimeState.atmosphereDirector || themeChanged) {
      this.runtimeState.atmosphereDirector = new AtmosphereDirector(this.runtimeState.visualTheme);
      this.runtimeState.lastAtmosphereRedrawBucket = -1;
    }

    if (!this.runtimeState.occlusionReadabilityController || themeChanged) {
      this.runtimeState.occlusionReadabilityController = new OcclusionReadabilityController();
    }

    const isoFactory = this.ports.getIsoFactory();
    if (isoFactory && (!this.runtimeState.characterRigFactory || themeChanged)) {
      this.runtimeState.characterRigFactory = new SpriteCharacterRigFactory(
        this.scene,
        isoFactory,
        this.runtimeState.visualTheme
      );
    }

    const currentMapArea = this.ports.getCurrentMapArea();
    if (currentMapArea?.buildings) {
      const nextProfiles: Record<string, BuildingVisualProfile> = {};
      currentMapArea.buildings.forEach((building) => {
        const resolvedFallback = resolveBuildingVisualProfile(
          building.district as BuildingVisualProfile['district'],
          building.signageStyle as BuildingVisualProfile['signageStyle'],
          building.propDensity
        );

        nextProfiles[building.id] = building.visualProfile
          ? {
              district: building.district === 'downtown' ? 'downtown' : 'slums',
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
      this.runtimeState.buildingVisualProfiles = nextProfiles;
    } else {
      this.runtimeState.buildingVisualProfiles = {};
    }

    this.runtimeState.environmentComposition = undefined;

    this.pushRuntimeStateToPorts();
  }

  renderStaticProps(): void {
    const staticPropGroup = this.ports.getStaticPropGroup();
    if (staticPropGroup) {
      staticPropGroup.clear(true, true);
    }

    this.ports.setDemoLampGrid(undefined);
    this.destroyDemoPointLight();

    if (!this.ports.getIsoFactory() || !this.ports.getCurrentMapArea()) {
      return;
    }
    this.ensureVisualPipeline();

    if (!this.ports.getStaticPropGroup()) {
      this.ports.setStaticPropGroup(this.ports.add.group());
    }

    const addProp = (prop?: Phaser.GameObjects.GameObject | null) => {
      if (!prop) {
        return;
      }
      this.ports.getStaticPropGroup()?.add(prop);
    };

    const currentMapArea = this.ports.getCurrentMapArea();
    if (!currentMapArea) {
      return;
    }

    const interactiveNpcs = (currentMapArea.entities.npcs ?? []).filter((npc) => npc.isInteractive);
    const itemMarkers = (currentMapArea.entities.items ?? []).filter(
      (item): item is Item & { position: Position } => Boolean(item.position)
    );

    const isoFactory = this.ports.getIsoFactory();
    if (!isoFactory) {
      return;
    }

    const isoMetrics = this.ports.getIsoMetrics();
    const guidedStep = getLevel0GuidedStep(store.getState().quests.quests);
    const environmentComposition = this.resolveEnvironmentComposition();
    this.ports.setDemoLampGrid(environmentComposition.preferredLampGrid);
    this.renderAtlasEnvironmentSlice(currentMapArea, isoFactory, addProp);
    this.renderGuidedRouteBeacons(currentMapArea, isoFactory, addProp, guidedStep.stage);

    interactiveNpcs.forEach((npc) => {
      const markerState = resolveLevel0GuidedContactMarkerState(npc, guidedStep);
      const isCurrentGuidedContact = markerState === 'current';
      const pixel = this.ports.calculatePixelPosition(npc.position.x, npc.position.y);
      addProp(
        isoFactory.createPulsingHighlight(npc.position.x, npc.position.y, {
          color: isCurrentGuidedContact ? 0xfacc15 : 0x22d3ee,
          alpha: isCurrentGuidedContact ? 0.3 : 0.14,
          pulseColor: isCurrentGuidedContact ? 0xfff3bf : 0x7dd3fc,
          pulseAlpha: { from: isCurrentGuidedContact ? 0.42 : 0.26, to: 0.05 },
          pulseScale: isCurrentGuidedContact ? 1.42 : 1.22,
          widthScale: isCurrentGuidedContact ? 0.82 : 0.58,
          heightScale: isCurrentGuidedContact ? 0.82 : 0.58,
          depthOffset: 9,
          duration: isCurrentGuidedContact ? 950 : 1400,
        })
      );

      if (!isCurrentGuidedContact) {
        return;
      }

      addProp(this.createGuidedContactBeacon(pixel, isoMetrics.tileWidth, isoMetrics.tileHeight));
    });

    itemMarkers.forEach((item) => {
      const markerState = resolveLevel0GuidedItemMarkerState(item, guidedStep);
      const isCurrentGuidedItem = markerState === 'current';
      const isFutureGuidedItem = markerState === 'future';
      const color = isCurrentGuidedItem ? 0xfacc15 : item.isQuestItem ? 0x94a3b8 : 0x22d3ee;
      const pulseColor = isCurrentGuidedItem ? 0xfff3bf : item.isQuestItem ? 0xcbd5e1 : 0x7dd3fc;
      const pixel = this.ports.calculatePixelPosition(item.position.x, item.position.y);
      const pickupSprite = this.createPickupSpriteProp(isoFactory, item);

      if (pickupSprite && isFutureGuidedItem) {
        pickupSprite.setAlpha(Math.min(pickupSprite.alpha, 0.48));
        pickupSprite.setTint(0x94a3b8);
      }

      addProp(pickupSprite);

      addProp(
        isoFactory.createPulsingHighlight(item.position.x, item.position.y, {
          color,
          alpha: isCurrentGuidedItem ? 0.32 : item.isQuestItem ? 0.12 : 0.22,
          pulseColor,
          pulseAlpha: {
            from: isCurrentGuidedItem ? 0.42 : item.isQuestItem ? 0.18 : 0.3,
            to: 0.06,
          },
          pulseScale: isCurrentGuidedItem ? 1.36 : item.isQuestItem ? 1.16 : 1.22,
          widthScale: isCurrentGuidedItem ? 0.82 : 0.62,
          heightScale: isCurrentGuidedItem ? 0.82 : 0.62,
          depthOffset: 8,
          duration: isCurrentGuidedItem ? 950 : item.isQuestItem ? 1450 : 1300,
        })
      );

      if (!item.isQuestItem || isFutureGuidedItem) {
        return;
      }

      const itemLabelName = isCurrentGuidedItem
        ? `TARGET: ${resolvePickupObjectName(item)}`
        : resolvePickupObjectName(item);
      const itemLabel = this.ports.add.text(pixel.x, pixel.y - isoMetrics.tileHeight * 0.7, itemLabelName, {
        fontFamily: 'Orbitron, "DM Sans", sans-serif',
        fontSize: '10px',
        fontStyle: '700',
        color: isCurrentGuidedItem ? '#fff7ad' : '#fde68a',
        align: 'center',
      });
      itemLabel.setOrigin(0.5, 1);
      itemLabel.setStroke(isCurrentGuidedItem ? '#92400e' : '#f59e0b', 1.1);
      itemLabel.setShadow(0, 0, isCurrentGuidedItem ? '#facc15' : '#f59e0b', 8, true, true);
      this.ports.syncDepth(itemLabel, pixel.x, pixel.y, DepthBias.FLOATING_UI + 14);
      addProp(itemLabel);
    });

    if (this.ports.getLightsFeatureEnabled()) {
      this.rebuildLightingDemoLight();
    }

    this.runtimeState.lastItemMarkerSignature = this.getItemMarkerSignature(currentMapArea);
    this.pushRuntimeStateToPorts();
  }

  getItemMarkerSignature(area: MapArea | null): string {
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

  private createGuidedContactBeacon(
    pixel: Position,
    tileWidth: number,
    tileHeight: number
  ): Phaser.GameObjects.Graphics {
    const beacon = this.ports.add.graphics();
    beacon.setBlendMode(Phaser.BlendModes.ADD);
    beacon.fillStyle(0xfacc15, 0.14);
    beacon.fillEllipse(
      pixel.x,
      pixel.y - tileHeight * 0.75,
      tileWidth * 0.54,
      tileHeight * 0.9
    );
    beacon.lineStyle(2.2, 0xfff3bf, 0.86);
    beacon.beginPath();
    beacon.moveTo(pixel.x, pixel.y - tileHeight * 1.92);
    beacon.lineTo(pixel.x, pixel.y - tileHeight * 0.72);
    beacon.strokePath();
    beacon.fillStyle(0xfff3bf, 0.92);
    beacon.fillTriangle(
      pixel.x,
      pixel.y - tileHeight * 2.12,
      pixel.x - tileWidth * 0.12,
      pixel.y - tileHeight * 1.78,
      pixel.x + tileWidth * 0.12,
      pixel.y - tileHeight * 1.78
    );
    beacon.lineStyle(1.4, 0x92400e, 0.55);
    beacon.strokeTriangle(
      pixel.x,
      pixel.y - tileHeight * 2.12,
      pixel.x - tileWidth * 0.12,
      pixel.y - tileHeight * 1.78,
      pixel.x + tileWidth * 0.12,
      pixel.y - tileHeight * 1.78
    );
    this.ports.syncDepth(beacon, pixel.x, pixel.y, DepthBias.FLOATING_UI + 15);
    return beacon;
  }

  applyLightingSettings(settings: VisualFxSettings): void {
    const previousPreset = this.runtimeState.visualTheme?.preset;
    if (!this.runtimeState.visualTheme || previousPreset !== settings.qualityPreset) {
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

  refreshVisualLayers(): void {
    const currentMapArea = this.ports.getCurrentMapArea();
    if (!currentMapArea) {
      return;
    }

    this.runtimeState.currentAtmosphereProfile = undefined;
    this.drawBackdrop();
    this.drawMap(currentMapArea.tiles);
    this.drawBuildingMasses();
    this.drawBuildingLabels();
    this.renderStaticProps();
    this.ports.renderVisionCones();
    this.applyOcclusionReadability();
    this.pushRuntimeStateToPorts();
  }

  drawMap(tiles: MapTile[][]): void {
    if (!this.ports.mapGraphics) {
      return;
    }

    this.ensureVisualPipeline();
    const atmosphere = this.resolveAtmosphereProfile();

    this.runtimeState.tilePainter?.setAtmosphereProfile({
      wetReflectionAlpha: atmosphere.wetReflectionAlpha,
      emissiveIntensity: atmosphere.emissiveIntensity,
    });
    const environmentComposition = this.resolveEnvironmentComposition();
    this.runtimeState.tilePainter?.setScenicTileContext(environmentComposition.scenicTileContextByKey);

    this.ports.mapGraphics.clear();

    const { tileWidth, tileHeight } = this.ports.getIsoMetrics();
    const currentMapArea = this.ports.getCurrentMapArea();
    const buildingFootprintTiles = new Set<string>();

    currentMapArea?.buildings?.forEach((building) => {
      for (let y = building.footprint.from.y; y <= building.footprint.to.y; y += 1) {
        for (let x = building.footprint.from.x; x <= building.footprint.to.x; x += 1) {
          buildingFootprintTiles.add(`${x}:${y}`);
        }
      }
    });

    for (let y = 0; y < tiles.length; y += 1) {
      for (let x = 0; x < tiles[0].length; x += 1) {
        const tile = tiles[y][x];
        const center = this.ports.calculatePixelPosition(x, y);
        const hideCoverVolume = currentMapArea?.zoneId?.startsWith('downtown_checkpoint') && tile.type === TileType.COVER;
        const isBoundaryTile =
          x === 0 || y === 0 || x === tiles[0].length - 1 || y === tiles.length - 1;
        const hideBoundaryVolume =
          !this.runtimeState.visualTheme.mapProfile.showBoundaryWalls &&
          isBoundaryTile &&
          tile.type === TileType.WALL;
        const isBuildingFootprint = buildingFootprintTiles.has(`${x}:${y}`);
        const groundOnly =
          hideCoverVolume ||
          hideBoundaryVolume ||
          (isBuildingFootprint && (tile.type === TileType.WALL || tile.type === TileType.COVER || tile.type === TileType.DOOR));

        this.renderTile(tile, center, tileWidth, tileHeight, x, y, groundOnly);
      }
    }
  }

  drawBuildingMasses(): void {
    this.runtimeState.buildingMassings.forEach((mass) => mass.destroy(true));
    this.runtimeState.buildingMassings = [];
    this.runtimeState.buildingMassingEntries = [];

    const currentMapArea = this.ports.getCurrentMapArea();
    if (!currentMapArea?.buildings?.length || !this.runtimeState.buildingPainter) {
      this.pushRuntimeStateToPorts();
      return;
    }

    this.ensureVisualPipeline();

    const buildingPainter = this.runtimeState.buildingPainter;
    if (!buildingPainter) {
      return;
    }

    const { tileWidth, tileHeight } = this.ports.getIsoMetrics();
    const atmosphere = this.runtimeState.currentAtmosphereProfile ?? this.resolveAtmosphereProfile();

    currentMapArea.buildings.forEach((building) => {
      const profile =
        this.runtimeState.buildingVisualProfiles[building.id] ??
        resolveBuildingVisualProfile(
          building.district as BuildingVisualProfile['district'],
          building.signageStyle as BuildingVisualProfile['signageStyle'],
          building.propDensity
        );

      const widthTiles = building.footprint.to.x - building.footprint.from.x + 1;
      const depthTiles = building.footprint.to.y - building.footprint.from.y + 1;
      const northWest = this.ports.calculatePixelPosition(building.footprint.from.x, building.footprint.from.y);
      const northEast = this.ports.calculatePixelPosition(building.footprint.to.x, building.footprint.from.y);
      const southEast = this.ports.calculatePixelPosition(building.footprint.to.x, building.footprint.to.y);
      const southWest = this.ports.calculatePixelPosition(building.footprint.from.x, building.footprint.to.y);
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

      const massing = buildingPainter.createMassing(building, profile, {
        center: pixelCenter,
        tileHeight,
        widthTiles,
        depthTiles,
        footprint,
        atmosphere: {
          emissiveIntensity: atmosphere.emissiveIntensity,
          overlayAlpha: atmosphere.overlayAlpha,
        },
      });
      const mass = massing.container;
      mass.setScrollFactor(1);

      // The legacy landmark remains a fallback, but its oversized source art
      // keeps the historical depth treatment without coupling orchestration to an ID.
      if (massing.renderMode === 'legacy-esb') {
        const esbDepthPoint = {
          x: footprint.top.x,
          y: footprint.top.y - tileHeight,
        };
        const esbBias = DepthBias.PROP_LOW;
        this.ports.syncDepth(mass, esbDepthPoint.x, esbDepthPoint.y, esbBias);
        this.runtimeState.buildingMassings.push(mass);

        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          if (params.get('pocDebug') === '1') {
            const footprintDebug = this.ports.add.graphics();
            footprintDebug.lineStyle(2, 0x39d5ff, 0.65);
            footprintDebug.strokePoints([footprint.top, footprint.right, footprint.bottom, footprint.left], true);
            this.ports.syncDepth(
              footprintDebug,
              footprint.bottom.x,
              footprint.bottom.y,
              DepthBias.FLOATING_UI + 28
            );
            this.runtimeState.buildingMassings.push(footprintDebug);

            const doorPixel = this.ports.calculatePixelPosition(building.door.x, building.door.y);
            const debugText = this.ports.add.text(doorPixel.x, doorPixel.y - tileHeight * 1.6, `door ${building.door.x},${building.door.y}`, {
              fontFamily: 'monospace',
              fontSize: '10px',
              color: '#39d5ff',
              stroke: '#000000',
              strokeThickness: 3,
            });
            debugText.setOrigin(0.5, 1);
            this.ports.syncDepth(debugText, doorPixel.x, doorPixel.y, DepthBias.FLOATING_UI + 30);
            this.runtimeState.buildingMassings.push(debugText);
          }
        }
        return;
      }

      this.ports.syncDepth(
        mass,
        footprint.bottom.x,
        footprint.bottom.y,
        DepthBias.PROP_TALL + Math.round(profile.massingHeight * 12)
      );
      this.runtimeState.buildingMassings.push(mass);

      const doorPixel = this.ports.calculatePixelPosition(building.door.x, building.door.y);
      const entranceGlow = this.ports.add.graphics();
      entranceGlow.setScrollFactor(1);
      entranceGlow.setBlendMode(Phaser.BlendModes.ADD);

      const entranceGlowColor = hexStringToColor(profile.signagePrimaryHex);
      const entranceGlowAlpha = Phaser.Math.Clamp(0.03 + atmosphere.emissiveIntensity * 0.06, 0.04, 0.1);
      entranceGlow.fillStyle(entranceGlowColor, entranceGlowAlpha);
      entranceGlow.fillEllipse(doorPixel.x, doorPixel.y + tileHeight * 0.08, tileWidth * 0.7, tileHeight * 0.5);
      entranceGlow.lineStyle(1.2, entranceGlowColor, entranceGlowAlpha * 1.35);
      entranceGlow.strokeRoundedRect(
        doorPixel.x - tileWidth * 0.14,
        doorPixel.y - tileHeight * 0.66,
        tileWidth * 0.28,
        tileHeight * 0.8,
        4
      );
      this.ports.syncDepth(entranceGlow, doorPixel.x, doorPixel.y, DepthBias.PROP_LOW + 2);
      this.runtimeState.buildingMassings.push(entranceGlow);

      const massingHeight = massing.visualHeightPx;
      const boundsMinX = Math.min(footprint.top.x, footprint.right.x, footprint.bottom.x, footprint.left.x);
      const boundsMaxX = Math.max(footprint.top.x, footprint.right.x, footprint.bottom.x, footprint.left.x);
      const boundsMinY = Math.min(
        footprint.top.y - massingHeight,
        footprint.right.y - massingHeight,
        footprint.bottom.y - massingHeight,
        footprint.left.y - massingHeight
      );
      const boundsMaxY = Math.max(footprint.top.y, footprint.right.y, footprint.bottom.y, footprint.left.y);
      this.runtimeState.buildingMassingEntries.push({
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

    this.pushRuntimeStateToPorts();
  }

  drawBuildingLabels(): void {
    this.runtimeState.buildingLabels.forEach((label) => label.destroy(true));
    this.runtimeState.buildingLabels = [];

    const currentMapArea = this.ports.getCurrentMapArea();
    if (
      !this.runtimeState.visualTheme.mapProfile.showBuildingLabels ||
      !currentMapArea?.buildings ||
      currentMapArea.buildings.length === 0
    ) {
      this.pushRuntimeStateToPorts();
      return;
    }

    this.ensureVisualPipeline();

    const { tileHeight } = this.ports.getIsoMetrics();

    currentMapArea.buildings.forEach((building) => {
      const profile =
        this.runtimeState.buildingVisualProfiles[building.id] ??
        resolveBuildingVisualProfile(
          building.district as BuildingVisualProfile['district'],
          building.signageStyle as BuildingVisualProfile['signageStyle'],
          building.propDensity
        );

      const centerX = (building.footprint.from.x + building.footprint.to.x) / 2;
      const anchorY = Math.min(building.footprint.from.y, building.door.y) - 0.4;
      const pixel = this.ports.calculatePixelPosition(centerX, anchorY);
      const labelHeight = tileHeight * (0.8 + profile.massingHeight * 0.18);
      const container = this.runtimeState.buildingPainter
        ? this.runtimeState.buildingPainter.createLabel(building, pixel, labelHeight, profile)
        : this.ports.add.container(pixel.x, pixel.y - tileHeight * 0.2);

      container.setScrollFactor(1);
      this.ports.syncDepth(container, pixel.x, pixel.y, DepthBias.FLOATING_UI + 20);
      this.runtimeState.buildingLabels.push(container);
    });

    this.pushRuntimeStateToPorts();
  }

  resolveAtmosphereProfile(baseOverlayRgba?: string): AtmosphereProfile {
    this.ensureVisualPipeline();

    if (!this.runtimeState.atmosphereDirector) {
      throw new Error('AtmosphereDirector is not initialized.');
    }

    const profile = this.runtimeState.atmosphereDirector.resolveAtmosphereProfile({
      districtWeight: this.resolveDistrictWeight(),
      timeSeconds: this.ports.getCurrentGameTime(),
      baseOverlayRgba,
    });

    const presetCaps = getVisualFxBudgetForPreset(this.runtimeState.visualTheme.preset);
    this.runtimeState.currentAtmosphereProfile = {
      ...profile,
      fogBands: profile.fogBands.slice(0, presetCaps.maxFogBands),
      emissiveIntensity: Phaser.Math.Clamp(profile.emissiveIntensity, 0, 1),
      wetReflectionAlpha: Phaser.Math.Clamp(profile.wetReflectionAlpha, 0, presetCaps.wetReflectionAlpha),
    };

    this.pushRuntimeStateToPorts();
    return this.runtimeState.currentAtmosphereProfile;
  }

  applyOcclusionReadability(): void {
    if (!this.runtimeState.occlusionReadabilityController || !this.runtimeState.buildingMassingEntries.length) {
      return;
    }

    const entityState = this.ports.readEntityRuntimeState?.() as Partial<EntityRenderRuntimeState> | undefined;
    const entities: OcclusionEntityHandle[] = [];

    if (entityState?.playerToken) {
      entities.push({
        id: 'player',
        pixelX: entityState.playerToken.container.x,
        pixelY: entityState.playerToken.container.y,
        token: entityState.playerToken,
        nameLabel: entityState.playerNameLabel,
      });
    }

    entityState?.enemySprites?.forEach((enemyData, enemyId) => {
      entities.push({
        id: enemyId,
        pixelX: enemyData.token.container.x,
        pixelY: enemyData.token.container.y,
        token: enemyData.token,
        nameLabel: enemyData.nameLabel,
        healthBar: enemyData.healthBar,
      });
    });

    entityState?.npcSprites?.forEach((npcData, npcId) => {
      entities.push({
        id: npcId,
        pixelX: npcData.token.container.x,
        pixelY: npcData.token.container.y,
        token: npcData.token,
        nameLabel: npcData.nameLabel,
        indicator: npcData.indicator,
      });
    });

    const profile = this.runtimeState.currentAtmosphereProfile ?? this.resolveAtmosphereProfile();
    this.runtimeState.occlusionReadabilityController.applyOcclusionReadability({
      masses: this.runtimeState.buildingMassingEntries,
      entities,
      occlusionFadeFloor: this.runtimeState.visualTheme.qualityBudget.occlusionFadeFloor,
      emissiveIntensity: profile.emissiveIntensity,
    });
  }

  drawBackdrop(): void {
    const backdropGraphics = this.ports.getBackdropGraphics();
    const currentMapArea = this.ports.getCurrentMapArea();
    if (!backdropGraphics || !currentMapArea) {
      return;
    }

    const bounds = this.computeIsoBounds();
    const tileSize = this.ports.getTileSize();
    const horizontalMargin = tileSize * 8;
    const topMargin = tileSize * 18;
    const bottomMargin = tileSize * 10;
    const width = bounds.maxX - bounds.minX + horizontalMargin * 2;
    const height = bounds.maxY - bounds.minY + topMargin + bottomMargin;
    const originX = bounds.minX - horizontalMargin;
    const originY = bounds.minY - topMargin;

    const atmosphere = this.resolveAtmosphereProfile();
    const skylineSplit = atmosphere.skylineSplit;

    backdropGraphics.clear();
    backdropGraphics.fillGradientStyle(
      atmosphere.gradientTopLeft,
      atmosphere.gradientTopRight,
      atmosphere.gradientBottomLeft,
      atmosphere.gradientBottomRight,
      1,
      1,
      1,
      1
    );
    backdropGraphics.fillRect(originX, originY, width, height);
    this.ports.cameras.main.setBackgroundColor(atmosphere.gradientTopLeft);

    const skylineBaseY = originY + height * 0.47;
    const skylineColumns = atmosphere.skylineColumns;
    const downtownColor = atmosphere.skylineDowntownColor;
    const slumsColor = atmosphere.skylineSlumsColor;

    for (let column = 0; column < skylineColumns; column += 1) {
      const normalized = column / skylineColumns;
      const x = originX + normalized * width;
      const widthScale = 0.68 + (((column * 13) % 7) * 0.08);
      const segmentWidth = (width / skylineColumns) * widthScale;
      const variant = ((column * 29) % 11) / 11;
      const towerHeight = height * (0.08 + variant * 0.2) * (normalized < skylineSplit ? 1.02 : 0.72);
      const tintMix = normalized < skylineSplit ? 0.78 : 0.26;
      const tint = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(slumsColor),
        Phaser.Display.Color.ValueToColor(downtownColor),
        1,
        tintMix
      );
      const tintColor = Phaser.Display.Color.GetColor(tint.r, tint.g, tint.b);
      backdropGraphics.fillStyle(tintColor, atmosphere.skylineAlphaBase + variant * atmosphere.skylineAlphaVariance);
      backdropGraphics.fillRect(x, skylineBaseY - towerHeight, segmentWidth, towerHeight);
      backdropGraphics.fillStyle(adjustColor(tintColor, 0.08), 0.06 + atmosphere.emissiveIntensity * 0.05);
      backdropGraphics.fillRect(x + segmentWidth * 0.72, skylineBaseY - towerHeight, segmentWidth * 0.16, towerHeight);
    }

    const nearlineBaseY = originY + height * 0.71;
    const nearlineColumns = Math.round(skylineColumns * 1.2);
    for (let column = 0; column < nearlineColumns; column += 1) {
      const normalized = column / nearlineColumns;
      const x = originX + normalized * width;
      const segmentWidth = (width / nearlineColumns) * (0.9 + (((column * 7) % 5) * 0.1));
      const heightVariance = ((column * 17) % 9) / 9;
      const layerHeight = height * (0.04 + heightVariance * 0.08);
      const tintMix = normalized < skylineSplit ? 0.7 : 0.34;
      const tint = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(slumsColor),
        Phaser.Display.Color.ValueToColor(downtownColor),
        1,
        tintMix
      );
      const tintColor = Phaser.Display.Color.GetColor(tint.r, tint.g, tint.b);
      backdropGraphics.fillStyle(tintColor, Math.min(0.18, atmosphere.skylineAlphaBase + 0.04 + heightVariance * 0.03));
      backdropGraphics.fillRect(x, nearlineBaseY - layerHeight, segmentWidth, layerHeight);
    }

    const horizonY = originY + height * 0.46;
    backdropGraphics.fillStyle(atmosphere.horizonGlowColor, atmosphere.horizonGlowAlpha);
    backdropGraphics.fillEllipse(originX + width / 2, horizonY, width * 1.08, height * 0.52);

    backdropGraphics.fillStyle(adjustColor(atmosphere.gradientTopRight, 0.08), 0.04 + atmosphere.horizonGlowAlpha * 0.2);
    backdropGraphics.fillEllipse(originX + width * 0.52, originY + height * 0.28, width * 1.18, height * 0.42);

    backdropGraphics.fillStyle(adjustColor(atmosphere.horizonGlowColor, 0.04), 0.04 + atmosphere.emissiveIntensity * 0.08);
    backdropGraphics.fillEllipse(originX + width / 2, originY + height * 0.78, width * 1.2, height * 0.28);

    backdropGraphics.fillStyle(atmosphere.lowerHazeColor, atmosphere.lowerHazeAlpha);
    backdropGraphics.fillRect(originX, originY + height * 0.5, width, height * 0.7);

    atmosphere.fogBands.forEach((band) => {
      if (band.alpha <= 0) {
        return;
      }
      backdropGraphics.lineStyle(2, band.color, band.alpha);
      backdropGraphics.strokeEllipse(
        originX + width / 2,
        originY + height * band.yFactor,
        width * band.widthFactor,
        height * band.heightFactor
      );
    });
  }

  computeIsoBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    const currentMapArea = this.ports.getCurrentMapArea();
    if (!currentMapArea) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    const { width, height } = currentMapArea;
    const corners = [
      this.ports.calculatePixelPosition(0, 0),
      this.ports.calculatePixelPosition(width - 1, 0),
      this.ports.calculatePixelPosition(0, height - 1),
      this.ports.calculatePixelPosition(width - 1, height - 1),
    ];

    return {
      minX: Math.min(...corners.map((point) => point.x)),
      maxX: Math.max(...corners.map((point) => point.x)),
      minY: Math.min(...corners.map((point) => point.y)),
      maxY: Math.max(...corners.map((point) => point.y)),
    };
  }

  hasLightPipelineSupport(): boolean {
    return this.ports.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer;
  }

  enableLighting(): void {
    if (!this.hasLightPipelineSupport()) {
      console.warn('[MainScene] WebGL renderer unavailable; Light2D disabled.');
      this.ports.setLightsFeatureEnabled(false);
      store.dispatch(setLightsEnabled(false));
      updateVisualSettings({ lightsEnabled: false });
      return;
    }

    if (this.ports.getLightsFeatureEnabled()) {
      this.rebuildLightingDemoLight();
      return;
    }

    this.ports.lights.enable().setAmbientColor(this.ports.getLightingAmbientColor());
    this.ports.setLightsFeatureEnabled(true);
    this.rebuildLightingDemoLight();
  }

  disableLighting(force = false): void {
    if (!this.ports.getLightsFeatureEnabled() && !force) {
      this.destroyDemoPointLight();
      return;
    }

    this.destroyDemoPointLight();

    if (this.hasLightPipelineSupport()) {
      const manager = this.ports.lights as typeof this.ports.lights & { removeAll?: () => void };
      if (typeof manager.removeAll === 'function') {
        manager.removeAll();
      }
      this.ports.lights.disable();
    }

    this.ports.setLightsFeatureEnabled(false);
  }

  rebuildLightingDemoLight(): void {
    const demoLampGrid = this.ports.getDemoLampGrid();
    if (!this.ports.getLightsFeatureEnabled() || !demoLampGrid) {
      this.destroyDemoPointLight();
      return;
    }

    const { x, y } = this.ports.calculatePixelPosition(demoLampGrid.x, demoLampGrid.y);
    const lightY = y - this.ports.getTileSize() * 0.35;
    const radius = this.ports.getTileSize() * 1.6;
    const intensity = 0.4;

    const existingPointLight = this.ports.getDemoPointLight();
    if (!existingPointLight) {
      const light = this.ports.add.pointlight(x, lightY, 0x7dd3fc, radius, intensity);
      light.setScrollFactor(1);
      this.ports.setDemoPointLight(light);
      return;
    }

    existingPointLight.setPosition(x, lightY);
    existingPointLight.radius = radius;
    existingPointLight.intensity = intensity;
  }

  destroyDemoPointLight(): void {
    const demoPointLight = this.ports.getDemoPointLight();
    if (demoPointLight) {
      demoPointLight.destroy();
      this.ports.setDemoPointLight(undefined);
    }
  }

  clearForMapTransition(): void {
    this.runtimeState.buildingLabels.forEach((label) => label.destroy(true));
    this.runtimeState.buildingLabels = [];
    this.runtimeState.buildingMassings.forEach((mass) => mass.destroy(true));
    this.runtimeState.buildingMassings = [];
    this.runtimeState.buildingMassingEntries = [];
    this.runtimeState.environmentComposition = undefined;
    this.runtimeState.currentAtmosphereProfile = undefined;
    this.runtimeState.lastAtmosphereRedrawBucket = -1;
    this.runtimeState.lastItemMarkerSignature = '';
    this.pushRuntimeStateToPorts();
  }

  private renderAtlasEnvironmentSlice(
    currentMapArea: MapArea,
    isoFactory: IsoObjectFactory,
    addProp: StaticPropAdder
  ): void {
    if (
      this.scene.textures.exists(PAINTERLY_LEVEL0_ENVIRONMENT_ATLAS_KEY) ||
      this.scene.textures.exists(LEVEL0_ENVIRONMENT_ATLAS_KEY)
    ) {
      this.renderAtlasDoorFacades(currentMapArea, isoFactory, addProp);
    }

    this.renderGet155PreviewSlice(currentMapArea, isoFactory, addProp);
  }

  private renderAtlasDoorFacades(
    currentMapArea: MapArea,
    isoFactory: IsoObjectFactory,
    addProp: StaticPropAdder
  ): void {
    const buildings = this.getSortedBuildings(currentMapArea);
    const facadeLimit = this.runtimeState.visualTheme.preset === 'performance' ? 3 : 6;

    buildings.slice(0, facadeLimit).forEach((building) => {
      const sprite = this.createAtlasSpriteProp(
        isoFactory,
        building.door.x,
        building.door.y,
        'entryFacade',
        DepthBias.PROP_LOW + 18,
        `entry:${building.id}`
      );
      addProp(sprite);
    });
  }

  private renderGuidedRouteBeacons(
    currentMapArea: MapArea,
    isoFactory: IsoObjectFactory,
    addProp: StaticPropAdder,
    stage: ReturnType<typeof getLevel0GuidedStep>['stage']
  ): void {
    const isoMetrics = this.ports.getIsoMetrics();
    resolveLevel0RouteBeaconsForStage(stage).forEach((beacon) => {
      const tile = currentMapArea.tiles[beacon.position.y]?.[beacon.position.x];
      if (!tile?.isWalkable) {
        return;
      }

      addProp(
        isoFactory.createPulsingHighlight(beacon.position.x, beacon.position.y, {
          color: 0xfacc15,
          alpha: 0.18,
          pulseColor: 0xfff3bf,
          pulseAlpha: { from: 0.3, to: 0.04 },
          pulseScale: 1.24,
          widthScale: 0.42,
          heightScale: 0.42,
          depthOffset: 7,
          duration: 1100,
        })
      );

      const pixel = this.ports.calculatePixelPosition(beacon.position.x, beacon.position.y);
      addProp(this.createGuidedRouteBeaconMarker(pixel, isoMetrics.tileWidth, isoMetrics.tileHeight));
    });
  }

  private createGuidedRouteBeaconMarker(
    pixel: Position,
    tileWidth: number,
    tileHeight: number
  ): Phaser.GameObjects.Graphics {
    const marker = this.ports.add.graphics();
    marker.setBlendMode(Phaser.BlendModes.ADD);
    marker.fillStyle(0xfff3bf, 0.82);
    marker.beginPath();
    marker.moveTo(pixel.x, pixel.y - tileHeight * 0.42);
    marker.lineTo(pixel.x + tileWidth * 0.11, pixel.y - tileHeight * 0.24);
    marker.lineTo(pixel.x, pixel.y - tileHeight * 0.06);
    marker.lineTo(pixel.x - tileWidth * 0.11, pixel.y - tileHeight * 0.24);
    marker.closePath();
    marker.fillPath();
    marker.lineStyle(1.2, 0x92400e, 0.55);
    marker.strokePath();
    marker.fillStyle(0xfacc15, 0.28);
    marker.fillEllipse(pixel.x, pixel.y - tileHeight * 0.24, tileWidth * 0.32, tileHeight * 0.22);
    this.ports.syncDepth(marker, pixel.x, pixel.y, DepthBias.FLOATING_UI + 10);
    return marker;
  }

  private renderGet155PreviewSlice(
    currentMapArea: MapArea,
    isoFactory: IsoObjectFactory,
    addProp: StaticPropAdder
  ): void {
    if (!this.scene.textures.exists(GET155_PREVIEW_ATLAS_KEY)) {
      return;
    }

    const buildings = this.getSortedBuildings(currentMapArea);
    const anchorBuilding = buildings.find((building) => building.id === GET155_LEVEL0_ANCHOR_BUILDING_ID);
    if (!anchorBuilding) {
      return;
    }

    resolveGet155Level0Placements(anchorBuilding).forEach((placement) => {
      const sprite = this.createGet155PreviewSprite(
        isoFactory,
        placement.anchor.x,
        placement.anchor.y,
        placement.frameId,
        this.resolveGet155PreviewDepthBias(placement.frameId),
        `level0:${placement.frameId}:${anchorBuilding.id}`
      );
      addProp(sprite);
    });
  }

  private createPickupSpriteProp(
    isoFactory: IsoObjectFactory,
    item: Item & { position: Position }
  ): Phaser.GameObjects.Image | null {
    const presentation = this.resolvePickupSpritePresentation(item);
    const sprite = this.createAtlasSpriteProp(
      isoFactory,
      item.position.x,
      item.position.y,
      presentation.frameId,
      DepthBias.PROP_LOW + 6,
      `pickup:${item.id}`
    );

    if (!sprite) {
      return null;
    }

    const pixel = this.ports.calculatePixelPosition(item.position.x, item.position.y);
    sprite.setName(`level0-pickup:${item.id}`);
    sprite.setTint(presentation.tint);
    sprite.setScale(presentation.scale);
    sprite.setAlpha(presentation.alpha);
    sprite.setY(sprite.y - this.ports.getIsoMetrics().tileHeight * 0.08);
    this.ports.syncDepth(sprite, pixel.x, pixel.y, DepthBias.PROP_LOW + 6);

    return sprite;
  }

  private resolvePickupSpritePresentation(item: Item): PickupSpritePresentation {
    switch (item.resourceKey) {
      case LEVEL0_GUIDED_ITEM_KEYS.keycard:
        return { frameId: 'keypad', tint: 0xffffff, scale: 0.72, alpha: 1 };
      case LEVEL0_GUIDED_ITEM_KEYS.datapad:
        return { frameId: 'datapad', tint: 0xffffff, scale: 0.64, alpha: 0.98 };
      case LEVEL0_GUIDED_ITEM_KEYS.transitTokens:
        return { frameId: 'transitToken', tint: 0xffffff, scale: 0.6, alpha: 0.98 };
      case 'items.abandoned_medkit':
        return { frameId: 'medkit', tint: 0xffffff, scale: 0.5, alpha: 0.95 };
      default:
        return {
          frameId: item.isQuestItem ? 'sign' : 'crate',
          tint: item.isQuestItem ? 0xfde68a : 0x7dd3fc,
          scale: 0.32,
          alpha: 0.9,
        };
    }
  }

  private createAtlasSpriteProp(
    isoFactory: IsoObjectFactory,
    gridX: number,
    gridY: number,
    frameId: Level0EnvironmentPropFrameId,
    depthBias: number,
    debugName: string
  ): Phaser.GameObjects.Image | null {
    const frame = LEVEL0_ENVIRONMENT_PROP_FRAMES[frameId];
    const atlasSource = this.resolveLevel0AtlasFrameSource(frame.frame);
    if (!atlasSource) {
      return null;
    }

    const sprite = isoFactory.createSpriteProp(gridX, gridY, frame.frame, {
      textureKey: atlasSource.textureKey,
      normalTextureKey: atlasSource.normalTextureKey,
      depthBias,
      origin: frame.origin,
    });
    this.applyAtlasSpritePresentation(sprite, frame, debugName);
    isoFactory.applyLightingToSprite(sprite, this.ports.getLightsFeatureEnabled());
    return sprite;
  }

  private createGet155PreviewSprite(
    isoFactory: IsoObjectFactory,
    gridX: number,
    gridY: number,
    frameId: Get155PreviewFrameId,
    depthBias: number,
    debugName: string
  ): Phaser.GameObjects.Image | null {
    const frame = GET155_PREVIEW_PROP_FRAMES[frameId];
    if (!this.hasGet155PreviewAtlasFrame(frame.frame)) {
      return null;
    }

    const sprite = isoFactory.createSpriteProp(gridX, gridY, frame.frame, {
      textureKey: GET155_PREVIEW_ATLAS_KEY,
      depthBias,
      origin: frame.origin,
    });
    this.applyAtlasSpritePresentation(sprite, frame, debugName);
    sprite.setName(`get155-preview:${debugName}`);
    return sprite;
  }

  private applyAtlasSpritePresentation(
    sprite: Phaser.GameObjects.Image,
    frame: EnvironmentAtlasFrameDefinition,
    debugName: string
  ): void {
    sprite.setName(`level0-atlas:${debugName}`);
    sprite.setScale(frame.scale);
    sprite.setAlpha(frame.alpha);
  }

  private resolveLevel0AtlasFrameSource(
    frame: string
  ): { textureKey: string; normalTextureKey: string } | null {
    const prefersPainterly =
      this.runtimeState.visualTheme.mapProfile.environmentAtlasSetId === 'level0-painterly-v1';
    const candidates = prefersPainterly
      ? [
          {
            textureKey: PAINTERLY_LEVEL0_ENVIRONMENT_ATLAS_KEY,
            normalTextureKey: PAINTERLY_LEVEL0_ENVIRONMENT_NORMAL_KEY,
          },
          {
            textureKey: LEVEL0_ENVIRONMENT_ATLAS_KEY,
            normalTextureKey: LEVEL0_ENVIRONMENT_NORMAL_KEY,
          },
        ]
      : [
          {
            textureKey: LEVEL0_ENVIRONMENT_ATLAS_KEY,
            normalTextureKey: LEVEL0_ENVIRONMENT_NORMAL_KEY,
          },
        ];

    return candidates.find(({ textureKey }) => {
      const texture = this.scene.textures.get(textureKey);
      return Boolean(texture?.has(frame));
    }) ?? null;
  }

  private hasGet155PreviewAtlasFrame(frame: string): boolean {
    const texture = this.scene.textures.get(GET155_PREVIEW_ATLAS_KEY);
    return Boolean(texture?.has(frame));
  }

  private getSortedBuildings(currentMapArea: MapArea): MapBuildingDefinition[] {
    return [...(currentMapArea.buildings ?? [])].sort((left, right) => left.id.localeCompare(right.id));
  }

  private resolveGet155PreviewDepthBias(frameId: Get155PreviewFrameId): number {
    if (frameId === 'crate') {
      return DepthBias.PROP_LOW + 16;
    }

    if (frameId === 'buildingArtDeco') {
      return DepthBias.PROP_TALL + 26;
    }

    return DepthBias.PROP_TALL + 18;
  }

  private renderTile(
    tile: MapTile,
    center: { x: number; y: number },
    tileWidth: number,
    tileHeight: number,
    gridX: number,
    gridY: number,
    groundOnly = false
  ): void {
    this.ensureVisualPipeline();
    this.runtimeState.tilePainter?.drawTile(tile, {
      center,
      tileWidth,
      tileHeight,
      gridX,
      gridY,
      groundOnly,
    });
  }

  private resolveEnvironmentComposition() {
    if (this.runtimeState.environmentComposition) {
      return this.runtimeState.environmentComposition;
    }

    const currentMapArea = this.ports.getCurrentMapArea();
    if (!currentMapArea?.buildings?.length) {
      const emptyComposition = {
        scenicTileContextByKey: {},
        preferredLampGrid: undefined,
      };
      this.runtimeState.environmentComposition = emptyComposition;
      return emptyComposition;
    }

    const composition = composeEnvironmentArt(
      currentMapArea,
      currentMapArea.buildings,
      this.runtimeState.buildingVisualProfiles,
      this.runtimeState.visualTheme
    );
    this.runtimeState.environmentComposition = composition;
    return composition;
  }

  private resolveDistrictWeight(): number {
    const profiles = Object.values(this.runtimeState.buildingVisualProfiles);
    if (!profiles.length) {
      return 0.5;
    }

    const downtownCount = profiles.filter((profile) => profile.district === 'downtown').length;
    return downtownCount / profiles.length;
  }

  private pushRuntimeStateToPorts(): void {
    this.ports.writeRuntimeState?.(this.runtimeState);
  }
}
