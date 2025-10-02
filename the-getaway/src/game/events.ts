import { Position, MapTile } from './interfaces/types';

export const TILE_CLICK_EVENT = 'isoTileSelected';
export const PATH_PREVIEW_EVENT = 'isoPathPreview';
export const VIEWPORT_UPDATE_EVENT = 'viewportUpdate';
export const MINIMAP_VIEWPORT_CLICK_EVENT = 'minimapViewportClick';
export const MINIMAP_STATE_EVENT = 'minimapStateUpdate';

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

export type MiniMapInteractionDetail =
  | ({ type: typeof MINIMAP_VIEWPORT_CLICK_EVENT } & MinimapViewportClickDetail);

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

export interface MiniMapStateDetail {
  version: number;
  areaId: string;
  areaName: string;
  mapWidth: number;
  mapHeight: number;
  logicalWidth: number;
  logicalHeight: number;
  tileScale: number;
  devicePixelRatio: number;
  tileVersion: number;
  tiles: TileTypeGrid;
  entities: MiniMapEntityDetail[];
  entitiesSignature: string;
  viewport: MiniMapViewportDetail;
  curfewActive: boolean;
  timestamp: number;
}

export type TileTypeGrid = MapTile[][];
