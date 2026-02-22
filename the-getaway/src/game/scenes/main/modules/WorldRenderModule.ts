import Phaser from 'phaser';
import { Item, MapArea, MapTile, Position, TileType } from '../../../interfaces/types';
import type { MainScene } from '../../MainScene';
import { SceneModule } from '../SceneModule';
import { DepthBias } from '../../../utils/depth';
import { adjustColor } from '../../../utils/iso';
import { createNoirVectorTheme, resolveBuildingVisualProfile } from '../../../visual/theme/noirVectorTheme';
import type { BuildingVisualProfile, VisualTheme } from '../../../visual/contracts';
import { TilePainter } from '../../../visual/world/TilePainter';
import { BuildingPainter } from '../../../visual/world/BuildingPainter';
import { CharacterRigFactory } from '../../../visual/entities/CharacterRigFactory';
import { AtmosphereDirector, type AtmosphereProfile } from '../../../visual/world/AtmosphereDirector';
import {
  OcclusionEntityHandle,
  OcclusionMassHandle,
  OcclusionReadabilityController,
} from '../../../visual/world/OcclusionReadabilityController';
import {
  getVisualFxBudgetForPreset,
  updateVisualSettings,
  type VisualFxSettings,
} from '../../../settings/visualSettings';
import { resolvePickupObjectName } from '../../../utils/itemDisplay';
import { store } from '../../../../store';
import { setLightsEnabled } from '../../../../store/settingsSlice';
import type { CharacterToken, IsoObjectFactory } from '../../../utils/IsoObjectFactory';

type EnemySpriteRecord = {
  token: CharacterToken;
  healthBar: Phaser.GameObjects.Graphics;
  nameLabel: Phaser.GameObjects.Text;
  markedForRemoval: boolean;
};

type NpcSpriteRecord = {
  token: CharacterToken;
  indicator?: Phaser.GameObjects.Graphics;
  nameLabel: Phaser.GameObjects.Text;
  markedForRemoval: boolean;
};

type MainSceneWorldRenderInternals = {
  add: Phaser.GameObjects.GameObjectFactory;
  game: Phaser.Game;
  lights: Phaser.GameObjects.LightsManager;
  tileSize: number;
  mapGraphics: Phaser.GameObjects.Graphics;
  backdropGraphics: Phaser.GameObjects.Graphics;
  visualTheme: VisualTheme;
  tilePainter?: TilePainter;
  buildingPainter?: BuildingPainter;
  characterRigFactory?: CharacterRigFactory;
  atmosphereDirector?: AtmosphereDirector;
  occlusionReadabilityController?: OcclusionReadabilityController;
  currentAtmosphereProfile?: AtmosphereProfile;
  lastAtmosphereRedrawBucket: number;
  buildingVisualProfiles: Record<string, BuildingVisualProfile>;
  playerToken?: CharacterToken;
  playerNameLabel?: Phaser.GameObjects.Text;
  enemySprites: Map<string, EnemySpriteRecord>;
  npcSprites: Map<string, NpcSpriteRecord>;
  currentMapArea: MapArea | null;
  buildingLabels: Phaser.GameObjects.Container[];
  buildingMassings: Phaser.GameObjects.Container[];
  buildingMassingEntries: OcclusionMassHandle[];
  staticPropGroup?: Phaser.GameObjects.Group;
  lightsFeatureEnabled: boolean;
  demoLampGrid?: Position;
  demoPointLight?: Phaser.GameObjects.PointLight;
  lightingAmbientColor: number;
  lastItemMarkerSignature: string;
  currentGameTime: number;
  isoOriginX: number;
  isoOriginY: number;
  isoFactory?: IsoObjectFactory;
  ensureIsoFactory(): void;
  getIsoMetrics(): { tileWidth: number; tileHeight: number };
  calculatePixelPosition(gridX: number, gridY: number): { x: number; y: number };
  syncDepth(target: Phaser.GameObjects.GameObject, pixelX: number, pixelY: number, bias: number): void;
  renderVisionCones(): void;
};

export class WorldRenderModule implements SceneModule<MainScene> {
  readonly key = 'worldRender';

  constructor(private readonly scene: MainScene) {}

  init(): void {}

  ensureVisualPipeline(): void {
    const scene = this.getScene();
    const preset = store.getState().settings.visualQualityPreset;
    const themeChanged = !scene.visualTheme || scene.visualTheme.preset !== preset;
    if (!scene.visualTheme || scene.visualTheme.preset !== preset) {
      scene.visualTheme = createNoirVectorTheme(preset);
    }

    if (scene.mapGraphics && (!scene.tilePainter || themeChanged)) {
      scene.tilePainter = new TilePainter(scene.mapGraphics, scene.visualTheme);
    }

    if (!scene.buildingPainter || themeChanged) {
      scene.buildingPainter = new BuildingPainter(this.scene, scene.visualTheme);
    }

    if (!scene.atmosphereDirector || themeChanged) {
      scene.atmosphereDirector = new AtmosphereDirector(scene.visualTheme);
      scene.lastAtmosphereRedrawBucket = -1;
    }

    if (!scene.occlusionReadabilityController || themeChanged) {
      scene.occlusionReadabilityController = new OcclusionReadabilityController();
    }

    if (scene.isoFactory && (!scene.characterRigFactory || themeChanged)) {
      scene.characterRigFactory = new CharacterRigFactory(scene.isoFactory, scene.visualTheme);
    }

    if (scene.currentMapArea?.buildings) {
      const nextProfiles: Record<string, BuildingVisualProfile> = {};
      scene.currentMapArea.buildings.forEach((building) => {
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
      scene.buildingVisualProfiles = nextProfiles;
    } else {
      scene.buildingVisualProfiles = {};
    }
  }

  renderStaticProps(): void {
    const scene = this.getScene();
    if (scene.staticPropGroup) {
      scene.staticPropGroup.clear(true, true);
    }

    scene.demoLampGrid = undefined;
    this.destroyDemoPointLight();

    if (!scene.isoFactory || !scene.currentMapArea) {
      return;
    }
    this.ensureVisualPipeline();

    if (!scene.staticPropGroup) {
      scene.staticPropGroup = scene.add.group();
    }
    const addProp = (prop?: Phaser.GameObjects.GameObject | null) => {
      if (!prop) {
        return;
      }
      scene.staticPropGroup?.add(prop);
    };

    const interactiveNpcs = (scene.currentMapArea.entities.npcs ?? []).filter((npc) => npc.isInteractive);
    const itemMarkers = (scene.currentMapArea.entities.items ?? []).filter(
      (item): item is Item & { position: Position } => Boolean(item.position)
    );
    const isoMetrics = scene.getIsoMetrics();
    interactiveNpcs.forEach((npc) => {
      addProp(
        scene.isoFactory!.createPulsingHighlight(npc.position.x, npc.position.y, {
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
      const pixel = scene.calculatePixelPosition(item.position.x, item.position.y);
      const itemLabelName = resolvePickupObjectName(item);
      addProp(
        scene.isoFactory!.createPulsingHighlight(item.position.x, item.position.y, {
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

      const itemLabel = scene.add.text(
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
      scene.syncDepth(itemLabel, pixel.x, pixel.y, DepthBias.FLOATING_UI + 14);
      addProp(itemLabel);
    });

    if (scene.lightsFeatureEnabled) {
      this.rebuildLightingDemoLight();
    }

    scene.lastItemMarkerSignature = this.getItemMarkerSignature(scene.currentMapArea);
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
    const scene = this.getScene();
    const previousPreset = scene.visualTheme?.preset;
    if (!scene.visualTheme || previousPreset !== settings.qualityPreset) {
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
    const scene = this.getScene();
    if (!scene.currentMapArea) {
      return;
    }

    scene.currentAtmosphereProfile = undefined;
    this.drawBackdrop();
    this.drawMap(scene.currentMapArea.tiles);
    this.drawBuildingMasses();
    this.drawBuildingLabels();
    this.renderStaticProps();
    scene.renderVisionCones();
    this.applyOcclusionReadability();
  }

  drawMap(tiles: MapTile[][]): void {
    const scene = this.getScene();
    if (!scene.mapGraphics) {
      return;
    }

    this.ensureVisualPipeline();
    const atmosphere = this.resolveAtmosphereProfile();
    scene.tilePainter?.setAtmosphereProfile({
      wetReflectionAlpha: atmosphere.wetReflectionAlpha,
      emissiveIntensity: atmosphere.emissiveIntensity,
    });
    scene.mapGraphics.clear();

    const { tileWidth, tileHeight } = scene.getIsoMetrics();
    const buildingFootprintTiles = new Set<string>();
    scene.currentMapArea?.buildings?.forEach((building) => {
      for (let y = building.footprint.from.y; y <= building.footprint.to.y; y += 1) {
        for (let x = building.footprint.from.x; x <= building.footprint.to.x; x += 1) {
          buildingFootprintTiles.add(`${x}:${y}`);
        }
      }
    });

    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[0].length; x++) {
        const tile = tiles[y][x];
        const center = scene.calculatePixelPosition(x, y);
        const hideCoverVolume = scene.currentMapArea?.zoneId?.startsWith('downtown_checkpoint') && tile.type === TileType.COVER;
        const isBuildingFootprint = buildingFootprintTiles.has(`${x}:${y}`);
        const groundOnly =
          hideCoverVolume ||
          isBuildingFootprint &&
          (tile.type === TileType.WALL || tile.type === TileType.COVER || tile.type === TileType.DOOR);

        this.renderTile(tile, center, tileWidth, tileHeight, x, y, groundOnly);
      }
    }
  }

  drawBuildingMasses(): void {
    const scene = this.getScene();
    scene.buildingMassings.forEach((mass) => mass.destroy(true));
    scene.buildingMassings = [];
    scene.buildingMassingEntries = [];

    if (!scene.currentMapArea?.buildings?.length || !scene.buildingPainter) {
      return;
    }

    this.ensureVisualPipeline();
    const buildingPainter = scene.buildingPainter;
    if (!buildingPainter) {
      return;
    }
    const { tileWidth, tileHeight } = scene.getIsoMetrics();

    scene.currentMapArea.buildings.forEach((building) => {
      const profile =
        scene.buildingVisualProfiles[building.id] ??
        resolveBuildingVisualProfile(
          building.district as BuildingVisualProfile['district'],
          building.signageStyle as BuildingVisualProfile['signageStyle'],
          building.propDensity
        );

      const widthTiles = building.footprint.to.x - building.footprint.from.x + 1;
      const depthTiles = building.footprint.to.y - building.footprint.from.y + 1;
      const northWest = scene.calculatePixelPosition(building.footprint.from.x, building.footprint.from.y);
      const northEast = scene.calculatePixelPosition(building.footprint.to.x, building.footprint.from.y);
      const southEast = scene.calculatePixelPosition(building.footprint.to.x, building.footprint.to.y);
      const southWest = scene.calculatePixelPosition(building.footprint.from.x, building.footprint.to.y);
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
      scene.syncDepth(
        mass,
        footprint.bottom.x,
        footprint.bottom.y,
        DepthBias.PROP_TALL + Math.round(profile.massingHeight * 12)
      );
      scene.buildingMassings.push(mass);

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
      scene.buildingMassingEntries.push({
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

  drawBuildingLabels(): void {
    const scene = this.getScene();
    scene.buildingLabels.forEach((label) => label.destroy(true));
    scene.buildingLabels = [];

    if (!scene.currentMapArea?.buildings || scene.currentMapArea.buildings.length === 0) {
      return;
    }

    this.ensureVisualPipeline();

    const { tileHeight } = scene.getIsoMetrics();

    scene.currentMapArea.buildings.forEach((building) => {
      const profile =
        scene.buildingVisualProfiles[building.id] ??
        resolveBuildingVisualProfile(
          building.district as BuildingVisualProfile['district'],
          building.signageStyle as BuildingVisualProfile['signageStyle'],
          building.propDensity
        );
      const centerX = (building.footprint.from.x + building.footprint.to.x) / 2;
      const anchorY = Math.min(building.footprint.from.y, building.door.y) - 0.4;
      const pixel = scene.calculatePixelPosition(centerX, anchorY);
      const labelHeight = tileHeight * (0.8 + profile.massingHeight * 0.18);
      const container = scene.buildingPainter
        ? scene.buildingPainter.createLabel(building, pixel, labelHeight, profile)
        : scene.add.container(pixel.x, pixel.y - tileHeight * 0.2);
      container.setScrollFactor(1);
      scene.syncDepth(container, pixel.x, pixel.y, DepthBias.FLOATING_UI + 20);
      scene.buildingLabels.push(container);
    });
  }

  resolveAtmosphereProfile(baseOverlayRgba?: string): AtmosphereProfile {
    const scene = this.getScene();
    this.ensureVisualPipeline();
    if (!scene.atmosphereDirector) {
      throw new Error('AtmosphereDirector is not initialized.');
    }

    const profile = scene.atmosphereDirector.resolveAtmosphereProfile({
      districtWeight: this.resolveDistrictWeight(),
      timeSeconds: scene.currentGameTime,
      baseOverlayRgba,
    });

    const presetCaps = getVisualFxBudgetForPreset(scene.visualTheme.preset);
    scene.currentAtmosphereProfile = {
      ...profile,
      fogBands: profile.fogBands.slice(0, presetCaps.maxFogBands),
      emissiveIntensity: Phaser.Math.Clamp(profile.emissiveIntensity, 0, 1),
      wetReflectionAlpha: Phaser.Math.Clamp(profile.wetReflectionAlpha, 0, presetCaps.wetReflectionAlpha),
    };

    return scene.currentAtmosphereProfile;
  }

  applyOcclusionReadability(): void {
    const scene = this.getScene();
    if (!scene.occlusionReadabilityController || !scene.buildingMassingEntries.length) {
      return;
    }

    const entities: OcclusionEntityHandle[] = [];
    if (scene.playerToken) {
      entities.push({
        id: 'player',
        pixelX: scene.playerToken.container.x,
        pixelY: scene.playerToken.container.y,
        token: scene.playerToken,
        nameLabel: scene.playerNameLabel,
      });
    }

    scene.enemySprites.forEach((enemyData, enemyId) => {
      entities.push({
        id: enemyId,
        pixelX: enemyData.token.container.x,
        pixelY: enemyData.token.container.y,
        token: enemyData.token,
        nameLabel: enemyData.nameLabel,
        healthBar: enemyData.healthBar,
      });
    });

    scene.npcSprites.forEach((npcData, npcId) => {
      entities.push({
        id: npcId,
        pixelX: npcData.token.container.x,
        pixelY: npcData.token.container.y,
        token: npcData.token,
        nameLabel: npcData.nameLabel,
        indicator: npcData.indicator,
      });
    });

    const profile = scene.currentAtmosphereProfile ?? this.resolveAtmosphereProfile();
    scene.occlusionReadabilityController.applyOcclusionReadability({
      masses: scene.buildingMassingEntries,
      entities,
      occlusionFadeFloor: scene.visualTheme.qualityBudget.occlusionFadeFloor,
      emissiveIntensity: profile.emissiveIntensity,
    });
  }

  drawBackdrop(): void {
    const scene = this.getScene();
    if (!scene.backdropGraphics || !scene.currentMapArea) {
      return;
    }

    const bounds = this.computeIsoBounds();
    const margin = scene.tileSize * 4;
    const width = bounds.maxX - bounds.minX + margin * 2;
    const height = bounds.maxY - bounds.minY + margin * 2;
    const originX = bounds.minX - margin;
    const originY = bounds.minY - margin;

    const atmosphere = this.resolveAtmosphereProfile();
    const skylineSplit = atmosphere.skylineSplit;

    scene.backdropGraphics.clear();
    scene.backdropGraphics.fillGradientStyle(
      atmosphere.gradientTopLeft,
      atmosphere.gradientTopRight,
      atmosphere.gradientBottomLeft,
      atmosphere.gradientBottomRight,
      1,
      1,
      1,
      1
    );
    scene.backdropGraphics.fillRect(originX, originY, width, height);

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
      scene.backdropGraphics.fillStyle(
        tintColor,
        atmosphere.skylineAlphaBase + variant * atmosphere.skylineAlphaVariance
      );
      scene.backdropGraphics.fillRect(x, skylineBaseY - towerHeight, segmentWidth, towerHeight);
      scene.backdropGraphics.fillStyle(adjustColor(tintColor, 0.12), 0.14 + atmosphere.emissiveIntensity * 0.1);
      scene.backdropGraphics.fillRect(x + segmentWidth * 0.72, skylineBaseY - towerHeight, segmentWidth * 0.16, towerHeight);
    }

    const horizonY = originY + height * 0.35;
    scene.backdropGraphics.fillStyle(atmosphere.horizonGlowColor, atmosphere.horizonGlowAlpha);
    scene.backdropGraphics.fillEllipse(originX + width / 2, horizonY, width * 1.08, height * 0.52);

    scene.backdropGraphics.fillStyle(atmosphere.lowerHazeColor, atmosphere.lowerHazeAlpha);
    scene.backdropGraphics.fillRect(originX, originY + height * 0.6, width, height * 0.6);

    atmosphere.fogBands.forEach((band) => {
      const alpha = band.alpha;
      if (alpha <= 0) {
        return;
      }
      scene.backdropGraphics.lineStyle(2, band.color, alpha);
      scene.backdropGraphics.strokeEllipse(
        originX + width / 2,
        originY + height * band.yFactor,
        width * band.widthFactor,
        height * band.heightFactor
      );
    });
  }

  computeIsoBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    const scene = this.getScene();
    if (!scene.currentMapArea) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    const { width, height } = scene.currentMapArea;
    const corners = [
      scene.calculatePixelPosition(0, 0),
      scene.calculatePixelPosition(width - 1, 0),
      scene.calculatePixelPosition(0, height - 1),
      scene.calculatePixelPosition(width - 1, height - 1),
    ];

    const minX = Math.min(...corners.map((point) => point.x));
    const maxX = Math.max(...corners.map((point) => point.x));
    const minY = Math.min(...corners.map((point) => point.y));
    const maxY = Math.max(...corners.map((point) => point.y));

    return { minX, maxX, minY, maxY };
  }

  hasLightPipelineSupport(): boolean {
    const scene = this.getScene();
    return scene.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer;
  }

  enableLighting(): void {
    const scene = this.getScene();
    if (!this.hasLightPipelineSupport()) {
      console.warn('[MainScene] WebGL renderer unavailable; Light2D disabled.');
      scene.lightsFeatureEnabled = false;
      store.dispatch(setLightsEnabled(false));
      updateVisualSettings({ lightsEnabled: false });
      return;
    }
    if (scene.lightsFeatureEnabled) {
      this.rebuildLightingDemoLight();
      return;
    }
    scene.lights.enable().setAmbientColor(scene.lightingAmbientColor);
    scene.lightsFeatureEnabled = true;
    this.rebuildLightingDemoLight();
  }

  disableLighting(force = false): void {
    const scene = this.getScene();
    if (!scene.lightsFeatureEnabled && !force) {
      this.destroyDemoPointLight();
      return;
    }
    this.destroyDemoPointLight();
    if (this.hasLightPipelineSupport()) {
      const manager = scene.lights as typeof scene.lights & { removeAll?: () => void };
      if (typeof manager.removeAll === 'function') {
        manager.removeAll();
      }
      scene.lights.disable();
    }
    scene.lightsFeatureEnabled = false;
  }

  rebuildLightingDemoLight(): void {
    const scene = this.getScene();
    if (!scene.lightsFeatureEnabled || !scene.demoLampGrid) {
      this.destroyDemoPointLight();
      return;
    }

    const { x, y } = scene.calculatePixelPosition(scene.demoLampGrid.x, scene.demoLampGrid.y);
    const lightY = y - scene.tileSize * 0.35;
    const radius = scene.tileSize * 1.6;
    const intensity = 0.4;

    if (!scene.demoPointLight) {
      scene.demoPointLight = scene.add.pointlight(x, lightY, 0x7dd3fc, radius, intensity);
      scene.demoPointLight.setScrollFactor(1);
    } else {
      scene.demoPointLight.setPosition(x, lightY);
      scene.demoPointLight.radius = radius;
      scene.demoPointLight.intensity = intensity;
    }
  }

  destroyDemoPointLight(): void {
    const scene = this.getScene();
    if (scene.demoPointLight) {
      scene.demoPointLight.destroy();
      scene.demoPointLight = undefined;
    }
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
    const scene = this.getScene();
    this.ensureVisualPipeline();
    scene.tilePainter?.drawTile(tile, {
      center,
      tileWidth,
      tileHeight,
      gridX,
      gridY,
      groundOnly,
    });
  }

  private resolveDistrictWeight(): number {
    const scene = this.getScene();
    const profiles = Object.values(scene.buildingVisualProfiles);
    if (!profiles.length) {
      return 0.5;
    }

    const downtownCount = profiles.filter((profile) => profile.district === 'downtown').length;
    return downtownCount / profiles.length;
  }

  private getScene(): MainSceneWorldRenderInternals {
    return this.scene as unknown as MainSceneWorldRenderInternals;
  }
}
