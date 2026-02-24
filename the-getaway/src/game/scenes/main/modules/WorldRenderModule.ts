import Phaser from 'phaser';
import { Item, MapArea, MapTile, Position, TileType } from '../../../interfaces/types';
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
import type { BuildingVisualProfile } from '../../../visual/contracts';
import { TilePainter } from '../../../visual/world/TilePainter';
import { BuildingPainter } from '../../../visual/world/BuildingPainter';
import { CharacterRigFactory } from '../../../visual/entities/CharacterRigFactory';
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
import type { CharacterToken } from '../../../utils/IsoObjectFactory';
import type { EntityVisualRole } from '../../../visual/contracts';

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
  currentAtmosphereProfile: undefined,
  lastAtmosphereRedrawBucket: -1,
  lastItemMarkerSignature: '',
});

const createWorldRenderModulePorts = (scene: MainScene): WorldRenderModulePorts => {
  return {
    add: readRequiredValue(scene, 'add'),
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

  createCharacterToken(role: EntityVisualRole, gridX: number, gridY: number): CharacterToken {
    this.ensureVisualPipeline();
    this.ports.ensureIsoFactory();

    if (this.runtimeState.characterRigFactory) {
      return this.runtimeState.characterRigFactory.createToken(role, gridX, gridY);
    }

    const isoFactory = this.ports.getIsoFactory();
    if (!isoFactory) {
      throw new Error('[WorldRenderModule] IsoObjectFactory not available while creating character token.');
    }

    return isoFactory.createCharacterToken(
      gridX,
      gridY,
      this.runtimeState.visualTheme.entityProfiles[role]
    );
  }

  positionCharacterToken(token: CharacterToken, gridX: number, gridY: number): void {
    if (this.runtimeState.characterRigFactory) {
      this.runtimeState.characterRigFactory.positionToken(token, gridX, gridY);
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

  ensureVisualPipeline(): void {
    const preset = store.getState().settings.visualQualityPreset;
    const themeChanged = !this.runtimeState.visualTheme || this.runtimeState.visualTheme.preset !== preset;

    if (!this.runtimeState.visualTheme || this.runtimeState.visualTheme.preset !== preset) {
      this.runtimeState.visualTheme = createNoirVectorTheme(preset);
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
      this.runtimeState.characterRigFactory = new CharacterRigFactory(isoFactory, this.runtimeState.visualTheme);
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
    interactiveNpcs.forEach((npc) => {
      addProp(
        isoFactory.createPulsingHighlight(npc.position.x, npc.position.y, {
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
      const pixel = this.ports.calculatePixelPosition(item.position.x, item.position.y);
      const itemLabelName = resolvePickupObjectName(item);

      addProp(
        isoFactory.createPulsingHighlight(item.position.x, item.position.y, {
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

      const itemLabel = this.ports.add.text(pixel.x, pixel.y - isoMetrics.tileHeight * 0.7, itemLabelName, {
        fontFamily: 'Orbitron, "DM Sans", sans-serif',
        fontSize: '10px',
        fontStyle: '700',
        color: item.isQuestItem ? '#fde68a' : '#dbeafe',
        align: 'center',
      });
      itemLabel.setOrigin(0.5, 1);
      itemLabel.setStroke(item.isQuestItem ? '#f59e0b' : '#0284c7', 1.1);
      itemLabel.setShadow(0, 0, item.isQuestItem ? '#f59e0b' : '#38bdf8', 8, true, true);
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
        const isBuildingFootprint = buildingFootprintTiles.has(`${x}:${y}`);
        const groundOnly =
          hideCoverVolume ||
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

      const mass = buildingPainter.createMassing(building, profile, {
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
      mass.setScrollFactor(1);

      // GET-170 PoC: ESB skyline mass + neon entrance marker.
      // Important: DO NOT keep the ESB in a fixed depth layer, otherwise distant buildings (e.g. block_1_1)
      // can render on top of it, breaking isometric ordering.
      if (building.id === 'block_2_2') {
        const esbBias = Math.min(
          DepthBias.CHARACTER_BASE - 1,
          DepthBias.PROP_TALL + Math.round(profile.massingHeight * 12)
        );
        this.ports.syncDepth(mass, footprint.bottom.x, footprint.bottom.y, esbBias);
        this.runtimeState.buildingMassings.push(mass);

        const doorPixel = this.ports.calculatePixelPosition(building.door.x, building.door.y);
        const entrance = this.ports.add.container(doorPixel.x, doorPixel.y);
        entrance.setScrollFactor(1);

        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          if (params.get('pocDebug') === '1') {
            const footprintDebug = this.ports.add.graphics();
            footprintDebug.lineStyle(2, 0x39d5ff, 0.65);
            footprintDebug.strokePoints(
              [footprint.top, footprint.right, footprint.bottom, footprint.left],
              true
            );
            this.ports.syncDepth(
              footprintDebug,
              footprint.bottom.x,
              footprint.bottom.y,
              DepthBias.FLOATING_UI + 28
            );
            this.runtimeState.buildingMassings.push(footprintDebug);

            const debugText = this.ports.add.text(0, -tileHeight * 1.6, `door ${building.door.x},${building.door.y}`, {
              fontFamily: 'monospace',
              fontSize: '10px',
              color: '#39d5ff',
              stroke: '#000000',
              strokeThickness: 3,
            });
            debugText.setOrigin(0.5, 1);
            entrance.add(debugText);
          }
        }

        const neon = this.ports.add.graphics();
        neon.setBlendMode(Phaser.BlendModes.ADD);
        neon.fillStyle(0xffb35c, 0.06);
        neon.fillCircle(0, 0, tileHeight * 1.1);
        neon.fillStyle(0xff7a18, 0.04);
        neon.fillCircle(0, 0, tileHeight * 0.75);
        neon.lineStyle(2, 0x39d5ff, 0.09);
        neon.strokeRoundedRect(-10, -18, 20, 30, 4);
        neon.lineStyle(1, 0xc14bff, 0.06);
        neon.strokeRoundedRect(-13, -21, 26, 36, 6);
        neon.fillStyle(0x39d5ff, 0.025);
        neon.fillRoundedRect(tileHeight * 1.0, -tileHeight * 1.25, tileHeight * 2.4, tileHeight * 0.85, 6);
        neon.lineStyle(2, 0x39d5ff, 0.08);
        neon.strokeRoundedRect(tileHeight * 1.0, -tileHeight * 1.25, tileHeight * 2.4, tileHeight * 0.85, 6);
        neon.lineStyle(1, 0xffb35c, 0.05);
        neon.strokeRoundedRect(tileHeight * 1.05, -tileHeight * 1.2, tileHeight * 2.3, tileHeight * 0.75, 6);
        entrance.add(neon);

        this.ports.syncDepth(entrance, doorPixel.x, doorPixel.y, DepthBias.PROP_LOW);
        this.runtimeState.buildingMassings.push(entrance);

        this.scene.tweens.add({
          targets: neon,
          alpha: { from: 0.85, to: 1.0 },
          duration: 2800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        return;
      }

      this.ports.syncDepth(
        mass,
        footprint.bottom.x,
        footprint.bottom.y,
        DepthBias.PROP_TALL + Math.round(profile.massingHeight * 12)
      );
      this.runtimeState.buildingMassings.push(mass);

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
    if (!currentMapArea?.buildings || currentMapArea.buildings.length === 0) {
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
    const margin = this.ports.getTileSize() * 4;
    const width = bounds.maxX - bounds.minX + margin * 2;
    const height = bounds.maxY - bounds.minY + margin * 2;
    const originX = bounds.minX - margin;
    const originY = bounds.minY - margin;

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
      backdropGraphics.fillStyle(tintColor, atmosphere.skylineAlphaBase + variant * atmosphere.skylineAlphaVariance);
      backdropGraphics.fillRect(x, skylineBaseY - towerHeight, segmentWidth, towerHeight);
      backdropGraphics.fillStyle(adjustColor(tintColor, 0.12), 0.14 + atmosphere.emissiveIntensity * 0.1);
      backdropGraphics.fillRect(x + segmentWidth * 0.72, skylineBaseY - towerHeight, segmentWidth * 0.16, towerHeight);
    }

    const horizonY = originY + height * 0.35;
    backdropGraphics.fillStyle(atmosphere.horizonGlowColor, atmosphere.horizonGlowAlpha);
    backdropGraphics.fillEllipse(originX + width / 2, horizonY, width * 1.08, height * 0.52);

    backdropGraphics.fillStyle(atmosphere.lowerHazeColor, atmosphere.lowerHazeAlpha);
    backdropGraphics.fillRect(originX, originY + height * 0.6, width, height * 0.6);

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
    this.runtimeState.currentAtmosphereProfile = undefined;
    this.runtimeState.lastAtmosphereRedrawBucket = -1;
    this.runtimeState.lastItemMarkerSignature = '';
    this.pushRuntimeStateToPorts();
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
