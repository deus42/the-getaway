import { Position, MapTile } from './interfaces/types';

export const TILE_CLICK_EVENT = 'isoTileSelected';
export const PATH_PREVIEW_EVENT = 'isoPathPreview';
export const VIEWPORT_UPDATE_EVENT = 'viewportUpdate';
export const MINIMAP_VIEWPORT_CLICK_EVENT = 'minimapViewportClick';
export const MINIMAP_STATE_EVENT = 'minimapStateUpdate';
export const MINIMAP_ZOOM_EVENT = 'minimapZoomUpdate';
export const MINIMAP_PATH_PREVIEW_EVENT = 'minimapPathPreview';
export const MINIMAP_OBJECTIVE_FOCUS_EVENT = 'minimapObjectiveFocus';
export const PLAYER_SCREEN_POSITION_EVENT = 'playerScreenPositionUpdate';


export interface TileClickDetail {
  areaId: string;
  position: Position;
}

export interface PathPreviewDetail {
  areaId: string;
  path: Position[];
}

export interface ViewportUpdateDetail {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MinimapViewportClickDetail {
  gridX: number;
  gridY: number;
  animate?: boolean;
}

export interface MiniMapPathPreviewDetail {
  areaId: string;
  target: Position;
  source?: Position;
  requestId?: string;
}

export interface MiniMapObjectiveFocusDetail {
  target: Position;
  areaId: string;
  animate?: boolean;
}

export type MiniMapInteractionDetail =
  | ({ type: typeof MINIMAP_VIEWPORT_CLICK_EVENT } & MinimapViewportClickDetail)
  | ({ type: typeof MINIMAP_OBJECTIVE_FOCUS_EVENT } & MiniMapObjectiveFocusDetail);

export interface MiniMapZoomDetail {
  zoom: number;
}

export type MiniMapEntityKind = 'player' | 'enemy' | 'npc' | 'objective';

export interface MiniMapEntityDetail {
  id: string;
  kind: MiniMapEntityKind;
  x: number;
  y: number;
  status: 'active' | 'inactive';
}

export interface MiniMapViewportDetail extends ViewportUpdateDetail {
  zoom: number;
}

export interface MiniMapDirtyLayers {
  tiles: boolean;
  overlays: boolean;
  entities: boolean;
  viewport: boolean;
  path: boolean;
}

export interface MiniMapObjectiveDetail {
  id: string;
  label: string;
  x: number;
  y: number;
  status: 'active' | 'completed';
  distance?: number;
}

export interface MiniMapRenderState {
  version: number;
  areaId: string;
  areaName: string;
  mapWidth: number;
  mapHeight: number;
  logicalWidth: number;
  logicalHeight: number;
  tileScale: number;
  devicePixelRatio: number;
  baseTileScale: number;
  userZoom: number;
  tileVersion: number;
  tiles: TileTypeGrid;
  entities: MiniMapEntityDetail[];
  entitiesSignature: string;
  viewport: MiniMapViewportDetail;
  curfewActive: boolean;
  timestamp: number;
  path?: Position[];
  pathSignature: string;
  objectiveMarkers: MiniMapObjectiveDetail[];
  objectivesSignature: string;
  dirtyLayers: MiniMapDirtyLayers;
}

export interface PlayerScreenPositionDetail {
  worldX: number;
  worldY: number;
  screenX: number;
  screenY: number;
  canvasWidth: number;
  canvasHeight: number;
  canvasDisplayWidth: number;
  canvasDisplayHeight: number;
  canvasLeft: number;
  canvasTop: number;
  zoom: number;
  timestamp: number;
}

export type TileTypeGrid = MapTile[][];

declare global {
  interface Window {
    __getawayPlayerScreenPosition?: PlayerScreenPositionDetail;
  }
}

export {};
