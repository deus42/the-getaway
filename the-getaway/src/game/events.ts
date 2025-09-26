import { Position } from './interfaces/types';

export const TILE_CLICK_EVENT = 'isoTileSelected';
export const PATH_PREVIEW_EVENT = 'isoPathPreview';

export interface TileClickDetail {
  areaId: string;
  position: Position;
}

export interface PathPreviewDetail {
  areaId: string;
  path: Position[];
}
