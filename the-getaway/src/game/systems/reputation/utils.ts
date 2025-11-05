import { MapArea, MapTile, Position, TileType } from '../../interfaces/types';

const CELL_SIZE = 12;

export const clamp = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
};

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const distanceBetween = (a: Position, b: Position): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const resolveCellId = (position: Position): string => {
  const cellX = Math.floor(position.x / CELL_SIZE);
  const cellY = Math.floor(position.y / CELL_SIZE);
  return `${cellX}:${cellY}`;
};

export const forEachInterpolatedPoint = (
  from: Position,
  to: Position,
  step: number,
  iteratee: (point: Position) => void
): void => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.max(1, Math.floor(distance / step));

  for (let i = 1; i <= steps; i += 1) {
    const t = i / (steps + 1);
    iteratee({
      x: lerp(from.x, to.x, t),
      y: lerp(from.y, to.y, t),
    });
  }
};

export const sampleLineOfSight = (mapArea: MapArea, from: Position, to: Position): number => {
  let obstructionCount = 0;
  let samples = 0;

  const inspectTile = (tile: MapTile | undefined) => {
    if (!tile) {
      obstructionCount += 1;
      return;
    }

    if (!tile.isWalkable || tile.type === TileType.WALL) {
      obstructionCount += 1;
    } else if (tile.type === TileType.DOOR) {
      obstructionCount += 0.5;
    }
  };

  forEachInterpolatedPoint(from, to, 1.25, (point) => {
    const x = Math.round(point.x);
    const y = Math.round(point.y);
    inspectTile(mapArea.tiles[y]?.[x]);
    samples += 1;
  });

  if (samples === 0) {
    return 1;
  }

  const obstructionRatio = obstructionCount / samples;
  return clamp(1 - obstructionRatio, 0.1, 1);
};
