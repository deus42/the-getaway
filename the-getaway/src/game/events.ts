import { Position } from './interfaces/types';

export const TILE_CLICK_EVENT = 'isoTileSelected';
export const PATH_PREVIEW_EVENT = 'isoPathPreview';
export const VIEWPORT_UPDATE_EVENT = 'viewportUpdate';
export const MINIMAP_VIEWPORT_CLICK_EVENT = 'minimapViewportClick';

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
  isDragging?: boolean;
}
