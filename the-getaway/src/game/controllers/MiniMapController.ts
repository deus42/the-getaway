import type { RootState } from '../../store';
import type { MapArea, Enemy, NPC, Item, Position, CameraRuntimeState } from '../interfaces/types';
import type { MainScene } from '../scenes/MainScene';
import {
  MiniMapRenderState,
  MiniMapViewportDetail,
  MiniMapDirtyLayers,
  MiniMapObjectiveDetail,
  MiniMapCameraDetail,
  TileTypeGrid,
} from '../events';

const clampValue = (value: number, min: number, max: number): number => {
  if (max < min) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
};

const roundTo = (value: number, precision: number = 4): number => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

const DEFAULT_TILE_SCALE = 2;

const createEntitySignature = (enemies: Enemy[], npcs: NPC[], playerId: string | undefined, playerX: number, playerY: number): string => {
  const enemySig = enemies
    .map((enemy) => `${enemy.id}:${enemy.position.x}:${enemy.position.y}:${enemy.health}`)
    .join('|');
  const npcSig = npcs
    .map((npc) => `${npc.id}:${npc.position.x}:${npc.position.y}`)
    .join('|');
  return `${playerId ?? 'player'}:${playerX}:${playerY}::${enemySig}::${npcSig}`;
};

const createObjectiveSignature = (objectives: MiniMapObjectiveDetail[]): string =>
  objectives
    .map((objective) => `${objective.id}:${objective.x}:${objective.y}:${objective.status}`)
    .join('|');

const getDevicePixelRatio = (): number => {
  if (typeof window === 'undefined') {
    return 1;
  }
  return window.devicePixelRatio || 1;
};

const clampBaseScale = (area: Pick<MapArea, 'width' | 'height'>, maxWidth: number, maxHeight: number): number => {
  const widthScale = maxWidth / Math.max(1, area.width);
  const heightScale = maxHeight / Math.max(1, area.height);
  const rawScale = Math.min(widthScale, heightScale);
  const clamped = Math.max(0.6, Math.min(4, rawScale || DEFAULT_TILE_SCALE));
  return Number.isFinite(clamped) && clamped > 0 ? clamped : DEFAULT_TILE_SCALE;
};

export const normalizeMiniMapViewport = (
  viewport: MiniMapViewportDetail,
  area: Pick<MapArea, 'width' | 'height'>,
): MiniMapViewportDetail => {
  const areaWidth = Math.max(1, area.width);
  const areaHeight = Math.max(1, area.height);

  const rawWidth = Math.max(0.0001, viewport.width);
  const rawHeight = Math.max(0.0001, viewport.height);
  const centerX = viewport.x + rawWidth / 2;
  const centerY = viewport.y + rawHeight / 2;

  const MIN_DIMENSION = 0.001;

  const sanitizedWidth = Math.max(MIN_DIMENSION, rawWidth);
  const sanitizedHeight = Math.max(MIN_DIMENSION, rawHeight);

  const boundedWidth = Math.min(areaWidth, sanitizedWidth);
  const boundedHeight = Math.min(areaHeight, sanitizedHeight);

  const halfWidth = boundedWidth / 2;
  const halfHeight = boundedHeight / 2;

  const minCenterX = halfWidth;
  const maxCenterX = Math.max(halfWidth, areaWidth - halfWidth);
  const minCenterY = halfHeight;
  const maxCenterY = Math.max(halfHeight, areaHeight - halfHeight);

  const clampedCenterX = clampValue(centerX, minCenterX, maxCenterX);
  const clampedCenterY = clampValue(centerY, minCenterY, maxCenterY);

  const finalWidth = roundTo(boundedWidth);
  const finalHeight = roundTo(boundedHeight);

  const adjustedCenterX = clampValue(
    clampedCenterX,
    finalWidth / 2,
    Math.max(finalWidth / 2, areaWidth - finalWidth / 2),
  );
  const adjustedCenterY = clampValue(
    clampedCenterY,
    finalHeight / 2,
    Math.max(finalHeight / 2, areaHeight - finalHeight / 2),
  );

  const finalX = clampValue(roundTo(adjustedCenterX - finalWidth / 2), 0, Math.max(0, areaWidth - finalWidth));
  const finalY = clampValue(roundTo(adjustedCenterY - finalHeight / 2), 0, Math.max(0, areaHeight - finalHeight));

  return {
    x: finalX,
    y: finalY,
    width: finalWidth,
    height: finalHeight,
    zoom: viewport.zoom,
  };
};

interface TileSignature {
  areaId: string;
  ref: TileTypeGrid;
  version: number;
}

interface MiniMapControllerConfig {
  maxCanvasWidth: number;
  maxCanvasHeight: number;
  minZoom: number;
  maxZoom: number;
}

export class MiniMapController {
  private scene: MainScene | null = null;

  private viewport: MiniMapViewportDetail | null = null;

  private tileSignature: TileSignature | null = null;

  private config: MiniMapControllerConfig;

  // Unused field - kept for future use
  // private readonly defaultTileScale: number = DEFAULT_TILE_SCALE;

  private lastRenderState: MiniMapRenderState | null = null;

  // Unused field - path signature tracking not yet implemented
  // private lastPathSignature: string = '';

  constructor(config?: Partial<MiniMapControllerConfig>) {
    this.config = {
      maxCanvasWidth: config?.maxCanvasWidth ?? 180,
      maxCanvasHeight: config?.maxCanvasHeight ?? 160,
      minZoom: config?.minZoom ?? 0.6,
      maxZoom: config?.maxZoom ?? 3,
    };
  }

  bindScene(scene: MainScene | null) {
    this.scene = scene;
  }

  setViewport(detail: MiniMapViewportDetail) {
    this.viewport = detail;
  }

  setCanvasBounds(width: number, height: number): boolean {
    const sanitizedWidth = Number.isFinite(width) ? Math.floor(width) : 0;
    const sanitizedHeight = Number.isFinite(height) ? Math.floor(height) : 0;
    if (sanitizedWidth <= 0 || sanitizedHeight <= 0) {
      return false;
    }

    const clampedWidth = clampValue(sanitizedWidth, 120, 4096);
    const clampedHeight = clampValue(sanitizedHeight, 80, 4096);

    if (
      clampedWidth === this.config.maxCanvasWidth &&
      clampedHeight === this.config.maxCanvasHeight
    ) {
      return false;
    }

    this.config = {
      ...this.config,
      maxCanvasWidth: clampedWidth,
      maxCanvasHeight: clampedHeight,
    };

    return true;
  }

  compose(rootState: RootState, userZoom: number, path: Position[] | null): MiniMapRenderState | null {
    const area = rootState.world.currentMapArea;
    if (!area) {
      return null;
    }

    // Path signature tracking not yet implemented
    // if (this.lastRenderState && this.lastRenderState.areaId !== area.id) {
    //   this.lastPathSignature = '';
    // }

    const baseScale = clampBaseScale(area, this.config.maxCanvasWidth, this.config.maxCanvasHeight);
    const tileScale = roundTo(baseScale * clampValue(userZoom, this.config.minZoom, this.config.maxZoom));
    const logicalWidth = Math.ceil(area.width * tileScale);
    const logicalHeight = Math.ceil(area.height * tileScale);
    const dpr = getDevicePixelRatio();

    const player = rootState.player.data;
    const enemies = rootState.world.currentMapArea.entities.enemies;
    const npcs = rootState.world.currentMapArea.entities.npcs;
    const items = rootState.world.currentMapArea.entities.items;
    const surveillanceZone = rootState.surveillance.zones[area.id];

    const entitySignature = createEntitySignature(enemies, npcs, player.id, player.position.x, player.position.y);
    const cameras = surveillanceZone ? this.buildCameras(surveillanceZone.cameras) : [];
    const cameraSignature = this.createCameraSignature(cameras);

    const tilesRef = area.tiles;
    let tileVersion = this.tileSignature?.version ?? 0;

    if (!this.tileSignature || this.tileSignature.areaId !== area.id || this.tileSignature.ref !== tilesRef) {
      tileVersion += 1;
      this.tileSignature = {
        areaId: area.id,
        ref: tilesRef,
        version: tileVersion,
      };
    }

    const baseViewport = this.viewport ?? {
      x: 0,
      y: 0,
      width: Math.min(area.width, Math.ceil(area.width * 0.4)),
      height: Math.min(area.height, Math.ceil(area.height * 0.4)),
      zoom: this.scene ? this.scene.cameras.main.zoom : 1,
    };

    const normalizedViewport = normalizeMiniMapViewport(baseViewport, area);
    this.viewport = normalizedViewport;

    const objectiveMarkers = this.buildObjectives(items);
    const objectivesSignature = createObjectiveSignature(objectiveMarkers);

    const pathSignature = path && path.length
      ? path.map((node) => `${node.x}:${node.y}`).join('|')
      : '';

    const renderState: MiniMapRenderState = {
      version: (this.lastRenderState?.version ?? 0) + 1,
      areaId: area.id,
      areaName: area.name,
      mapWidth: area.width,
      mapHeight: area.height,
      logicalWidth,
      logicalHeight,
      tileScale,
      devicePixelRatio: dpr,
      baseTileScale: baseScale,
      userZoom: tileScale / baseScale,
      tileVersion,
      tiles: tilesRef,
      entities: this.buildEntities(player.id ?? 'player', player.position.x, player.position.y, enemies, npcs),
      entitiesSignature: entitySignature,
      cameras,
      camerasSignature: cameraSignature,
      viewport: normalizedViewport,
      curfewActive: rootState.world.curfewActive,
      timestamp: Date.now(),
      path: path ?? undefined,
      pathSignature,
      objectiveMarkers,
      objectivesSignature,
      dirtyLayers: this.resolveDirtyLayers({
        tileVersion,
        entitySignature,
        cameraSignature,
        objectivesSignature,
        pathSignature,
        viewport: normalizedViewport,
        curfewActive: rootState.world.curfewActive,
        tileScale,
        areaId: area.id,
      }),
    };

    this.lastRenderState = renderState;
    // Path signature tracking not yet implemented
    // this.lastPathSignature = pathSignature;
    return renderState;
  }

  private buildEntities(
    playerId: string,
    playerX: number,
    playerY: number,
    enemies: Enemy[],
    npcs: NPC[],
  ): MiniMapRenderState['entities'] {
    const entities: MiniMapRenderState['entities'] = [
      {
        id: playerId,
        kind: 'player',
        x: playerX,
        y: playerY,
        status: 'active',
      },
    ];

    enemies.forEach((enemy) => {
      entities.push({
        id: enemy.id,
        kind: 'enemy',
        x: enemy.position.x,
        y: enemy.position.y,
        status: enemy.health > 0 ? 'active' : 'inactive',
      });
    });

    npcs.forEach((npc) => {
      entities.push({
        id: npc.id,
        kind: 'npc',
        x: npc.position.x,
        y: npc.position.y,
        status: 'active',
      });
    });

    return entities;
  }

  private buildCameras(cameras: Record<string, CameraRuntimeState>): MiniMapCameraDetail[] {
    return Object.values(cameras).map((camera) => ({
      id: camera.id,
      type: camera.type,
      x: camera.position.x,
      y: camera.position.y,
      alertState: camera.alertState,
      isActive: camera.isActive,
    }));
  }

  private createCameraSignature(cameras: MiniMapCameraDetail[]): string {
    if (!cameras.length) {
      return '';
    }

    return cameras
      .map((camera) => (
        `${camera.id}:${camera.type}:${camera.x}:${camera.y}:${camera.alertState}:${camera.isActive ? 1 : 0}`
      ))
      .join('|');
  }

  private buildObjectives(items: Item[]): MiniMapObjectiveDetail[] {
    return items
      .filter((item): item is Item & { position: Position } => Boolean(item.position))
      .map((item) => ({
        id: item.id,
        label: item.name,
        x: item.position!.x,
        y: item.position!.y,
        status: 'active',
      }));
  }

  private resolveDirtyLayers(params: {
    tileVersion: number;
    entitySignature: string;
    cameraSignature: string;
    objectivesSignature: string;
    pathSignature: string;
    viewport: MiniMapViewportDetail;
    curfewActive: boolean;
    tileScale: number;
    areaId: string;
  }): MiniMapDirtyLayers {
    const previous = this.lastRenderState;

    if (!previous) {
      return {
        tiles: true,
        overlays: true,
        entities: true,
        viewport: true,
        path: Boolean(params.pathSignature),
      };
    }

    const areaChanged = previous.areaId !== params.areaId;
    const scaleChanged = previous.tileScale !== params.tileScale;
    const tilesDirty = areaChanged || previous.tileVersion !== params.tileVersion || scaleChanged;
    const camerasDirty = areaChanged || previous.camerasSignature !== params.cameraSignature || scaleChanged;
    const entitiesDirty = areaChanged || previous.entitiesSignature !== params.entitySignature || scaleChanged || camerasDirty;
    const objectivesDirty = areaChanged || previous.objectivesSignature !== params.objectivesSignature || scaleChanged;
    const viewportDirty = areaChanged ||
      previous.viewport.x !== params.viewport.x ||
      previous.viewport.y !== params.viewport.y ||
      previous.viewport.width !== params.viewport.width ||
      previous.viewport.height !== params.viewport.height ||
      previous.viewport.zoom !== params.viewport.zoom ||
      previous.tileScale !== params.tileScale;
    const pathDirty = previous.pathSignature !== params.pathSignature || scaleChanged;
    const overlaysDirty = areaChanged || previous.curfewActive !== params.curfewActive || objectivesDirty || viewportDirty;

    return {
      tiles: tilesDirty,
      overlays: overlaysDirty,
      entities: entitiesDirty || objectivesDirty,
      viewport: viewportDirty,
      path: pathDirty,
    };
  }
}
