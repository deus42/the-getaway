import Phaser from 'phaser';
import { TileType, type MapTile } from '../../interfaces/types';
import type { VisualTheme } from '../contracts';
import { adjustColor, getDiamondPoints } from '../../utils/iso';

interface TileContext {
  center: { x: number; y: number };
  tileWidth: number;
  tileHeight: number;
  gridX: number;
  gridY: number;
  groundOnly?: boolean;
}

interface ElevationProfile {
  readonly heightOffset: number;
  readonly topWidth: number;
  readonly topHeight: number;
}

export class TilePainter {
  private wetReflectionAlpha: number;
  private emissiveIntensity: number;

  constructor(
    private readonly graphics: Phaser.GameObjects.Graphics,
    private readonly theme: VisualTheme
  ) {
    this.wetReflectionAlpha = theme.qualityBudget.wetReflectionAlpha;
    this.emissiveIntensity = 0.35;
  }

  public setAtmosphereProfile(atmosphere: { wetReflectionAlpha: number; emissiveIntensity: number }): void {
    this.wetReflectionAlpha = Phaser.Math.Clamp(atmosphere.wetReflectionAlpha, 0, 0.4);
    this.emissiveIntensity = Phaser.Math.Clamp(atmosphere.emissiveIntensity, 0, 1);
  }

  public drawTile(tile: MapTile, context: TileContext): void {
    const tileForGround = context.groundOnly ? { ...tile, type: TileType.FLOOR } : tile;
    const baseColor = this.getTileBaseColor(tileForGround, context.gridX, context.gridY);
    const variationSeed = ((((context.gridX * 13) ^ (context.gridY * 9)) % 9) - 4) * 0.01;
    const modulatedBase = adjustColor(baseColor, variationSeed);

    this.drawGround(tileForGround, context, modulatedBase);

    if (context.groundOnly) {
      return;
    }

    switch (tile.type) {
      case TileType.COVER:
        this.drawCover(tile, context, modulatedBase);
        break;
      case TileType.WALL:
        this.drawWallVolume(tile, context, modulatedBase);
        break;
      case TileType.DOOR:
        this.drawDoorPortal(tile, context, modulatedBase);
        break;
      case TileType.WATER:
      case TileType.TRAP:
        this.drawHazardVariant(tile, context, modulatedBase);
        break;
      default:
        break;
    }
  }

  public drawGround(tile: MapTile, context: TileContext, baseColor: number): void {
    const points = this.getPoints(context.center.x, context.center.y, context.tileWidth, context.tileHeight);
    const macroSeed = Math.floor(context.gridX / 4) ^ Math.floor(context.gridY / 4);
    const macroShift = ((macroSeed % 5) - 2) * 0.03;
    const modulated = adjustColor(baseColor, macroShift);
    const highlight = adjustColor(modulated, 0.2);
    const shadow = adjustColor(modulated, -0.22);

    this.graphics.fillStyle(modulated, 1);
    this.graphics.fillPoints(points, true);

    const [top, right, bottom, left] = points;
    const center = new Phaser.Geom.Point(context.center.x, context.center.y);

    this.graphics.fillStyle(highlight, 0.35);
    this.graphics.fillPoints([top, right, center], true);
    this.graphics.fillPoints([top, center, left], true);

    this.graphics.fillStyle(shadow, 0.3);
    this.graphics.fillPoints([bottom, right, center], true);
    this.graphics.fillPoints([bottom, center, left], true);

    this.graphics.lineStyle(1, adjustColor(modulated, -0.3), 0.42);
    this.graphics.strokePoints(points, true);

    if (tile.type === TileType.FLOOR) {
      this.drawSurfaceTreatments(tile, context, points, modulated);
    } else if (tile.type === TileType.COVER || tile.type === TileType.WALL) {
      this.graphics.lineStyle(0.9, 0xf8fafc, 0.08);
      this.graphics.strokePoints(points, true);
    }
  }

  public drawCover(_tile: MapTile, context: TileContext, baseColor: number): void {
    const elevation = this.getElevationProfile(0.5, context.tileWidth, context.tileHeight);
    const basePoints = this.getPoints(context.center.x, context.center.y, context.tileWidth, context.tileHeight);
    const topPoints = this.getPoints(
      context.center.x,
      context.center.y - elevation.heightOffset,
      elevation.topWidth,
      elevation.topHeight
    );

    const rightFace = [basePoints[1], basePoints[2], topPoints[2], topPoints[1]];
    const frontFace = [basePoints[2], basePoints[3], topPoints[3], topPoints[2]];

    this.graphics.fillStyle(adjustColor(baseColor, -0.15), 0.98);
    this.graphics.fillPoints(frontFace, true);
    this.graphics.fillStyle(adjustColor(baseColor, -0.08), 0.98);
    this.graphics.fillPoints(rightFace, true);

    this.graphics.fillStyle(adjustColor(baseColor, 0.2), 0.95);
    this.graphics.fillPoints(topPoints, true);

    this.graphics.lineStyle(1.1, 0xfbbf24, 0.3);
    this.graphics.strokePoints(topPoints, true);
  }

  public drawWallVolume(_tile: MapTile, context: TileContext, baseColor: number): void {
    const elevation = this.getElevationProfile(1.2, context.tileWidth, context.tileHeight);
    const basePoints = this.getPoints(context.center.x, context.center.y, context.tileWidth, context.tileHeight);
    const topPoints = this.getPoints(
      context.center.x,
      context.center.y - elevation.heightOffset,
      elevation.topWidth,
      elevation.topHeight
    );

    const rightFace = [basePoints[1], basePoints[2], topPoints[2], topPoints[1]];
    const frontFace = [basePoints[2], basePoints[3], topPoints[3], topPoints[2]];

    this.graphics.fillStyle(adjustColor(baseColor, -0.28), 1);
    this.graphics.fillPoints(frontFace, true);
    this.graphics.fillStyle(adjustColor(baseColor, -0.16), 1);
    this.graphics.fillPoints(rightFace, true);

    const topColor = adjustColor(baseColor, 0.18);
    this.graphics.fillStyle(topColor, 1);
    this.graphics.fillPoints(topPoints, true);

    this.graphics.lineStyle(1.2, 0x22d3ee, 0.18);
    this.graphics.strokePoints(topPoints, true);

    const [baseTop, baseRight, baseBottom, baseLeft] = basePoints;
    const [topTop, topRight, topBottom, topLeft] = topPoints;
    this.graphics.lineStyle(1, 0x7dd3fc, 0.2);
    this.graphics.strokePoints([baseLeft, topLeft], false);
    this.graphics.strokePoints([baseBottom, topBottom], false);
    this.graphics.strokePoints([baseRight, topRight], false);
    this.graphics.strokePoints([baseTop, topTop], false);
  }

  public drawDoorPortal(_tile: MapTile, context: TileContext, baseColor: number): void {
    const basePoints = this.getPoints(context.center.x, context.center.y, context.tileWidth, context.tileHeight);
    const [top, right, bottom, left] = basePoints;

    const frameTopLeft = this.lerpPoint(top, left, 0.22);
    const frameTopRight = this.lerpPoint(top, right, 0.22);
    const frameBottomRight = this.lerpPoint(bottom, right, 0.3);
    const frameBottomLeft = this.lerpPoint(bottom, left, 0.3);

    this.graphics.fillStyle(adjustColor(baseColor, -0.2), 0.96);
    this.graphics.fillPoints([frameTopLeft, frameTopRight, frameBottomRight, frameBottomLeft], true);

    const panelTopLeft = this.lerpPoint(frameTopLeft, frameBottomLeft, 0.12);
    const panelTopRight = this.lerpPoint(frameTopRight, frameBottomRight, 0.12);
    const panelBottomRight = this.lerpPoint(frameTopRight, frameBottomRight, 0.86);
    const panelBottomLeft = this.lerpPoint(frameTopLeft, frameBottomLeft, 0.86);

    this.graphics.fillStyle(0x0f172a, 0.84);
    this.graphics.fillPoints([panelTopLeft, panelTopRight, panelBottomRight, panelBottomLeft], true);

    this.graphics.lineStyle(1.3, 0x38bdf8, 0.4);
    this.graphics.strokePoints([panelTopLeft, panelTopRight], false);
  }

  public drawHazardVariant(tile: MapTile, context: TileContext, baseColor: number): void {
    const points = this.getPoints(context.center.x, context.center.y, context.tileWidth * 0.72, context.tileHeight * 0.72);

    if (tile.type === TileType.WATER) {
      const shimmer = this.theme.qualityBudget.enableAnimatedHazards
        ? 0.22 + 0.12 * (0.5 + 0.5 * Math.sin((Date.now() % 2000) / 2000 * Math.PI * 2))
        : 0.2;
      this.graphics.fillStyle(adjustColor(baseColor, 0.2), shimmer);
      this.graphics.fillPoints(points, true);
      this.graphics.lineStyle(1, 0x67e8f9, 0.22);
      this.graphics.strokePoints(points, true);
      return;
    }

    const pulse = this.theme.qualityBudget.enableAnimatedHazards
      ? 0.18 + 0.1 * (0.5 + 0.5 * Math.sin((Date.now() % 1500) / 1500 * Math.PI * 2))
      : 0.18;

    this.graphics.fillStyle(adjustColor(baseColor, 0.35), pulse);
    this.graphics.fillPoints(points, true);
    this.graphics.lineStyle(1.1, 0xf472b6, 0.35);
    this.graphics.strokePoints(points, true);
  }

  private getTileBaseColor(tile: MapTile, gridX: number, gridY: number): number {
    const checker = (gridX + gridY) % 2 === 0;
    const palette = this.theme.tilePalettes;
    const surfacePalette = this.theme.surfacePalettes;

    switch (tile.type) {
      case TileType.WALL:
        return checker ? palette.wallEven : palette.wallOdd;
      case TileType.COVER:
        return checker ? palette.coverEven : palette.coverOdd;
      case TileType.WATER:
        return checker ? palette.waterEven : palette.waterOdd;
      case TileType.TRAP:
        return checker ? palette.trapEven : palette.trapOdd;
      case TileType.DOOR:
        return checker ? palette.doorEven : palette.doorOdd;
      default:
        switch (tile.surfaceKind) {
          case 'road':
            return checker ? surfacePalette.roadEven : surfacePalette.roadOdd;
          case 'crosswalk':
            return checker ? surfacePalette.crosswalkEven : surfacePalette.crosswalkOdd;
          case 'sidewalk':
            return checker ? surfacePalette.sidewalkEven : surfacePalette.sidewalkOdd;
          case 'lot':
          default:
            return checker ? surfacePalette.lotEven : surfacePalette.lotOdd;
        }
    }
  }

  private getElevationProfile(elevation: number, tileWidth: number, tileHeight: number): ElevationProfile {
    return {
      heightOffset: tileHeight * (0.48 + elevation * 0.78),
      topWidth: tileWidth * Math.max(0.7, 1 - elevation * 0.08),
      topHeight: tileHeight * Math.max(0.62, 1 - elevation * 0.1),
    };
  }

  private lerpPoint(a: Phaser.Geom.Point, b: Phaser.Geom.Point, t: number): Phaser.Geom.Point {
    return new Phaser.Geom.Point(
      Phaser.Math.Linear(a.x, b.x, t),
      Phaser.Math.Linear(a.y, b.y, t)
    );
  }

  private getPoints(centerX: number, centerY: number, width: number, height: number): Phaser.Geom.Point[] {
    return getDiamondPoints(centerX, centerY, width, height).map((point) => new Phaser.Geom.Point(point.x, point.y));
  }

  private drawRoadReflection(
    tile: MapTile,
    context: TileContext,
    points: Phaser.Geom.Point[],
    intensityMultiplier = 1
  ): void {
    if (!tile.isWalkable || this.wetReflectionAlpha <= 0.01) {
      return;
    }

    const [top, right, bottom, left] = points;
    const seamOffset = (((context.gridX * 11 + context.gridY * 17) % 9) - 4) * 0.04;
    const intensity = Phaser.Math.Clamp(
      this.wetReflectionAlpha * (0.7 + this.emissiveIntensity * 0.65) * intensityMultiplier,
      0.03,
      0.28
    );
    const coolReflection = adjustColor(0x67e8f9, -0.12 + seamOffset);
    const warmReflection = adjustColor(0xfb923c, -0.25 + seamOffset * 0.7);

    this.graphics.lineStyle(1, coolReflection, intensity);
    this.graphics.strokePoints(
      [
        this.lerpPoint(left, top, 0.3),
        this.lerpPoint(bottom, right, 0.3),
      ],
      false
    );

    this.graphics.lineStyle(0.8, warmReflection, intensity * 0.6);
    this.graphics.strokePoints(
      [
        this.lerpPoint(top, right, 0.55),
        this.lerpPoint(left, bottom, 0.55),
      ],
      false
    );
  }

  private drawSurfaceTreatments(
    tile: MapTile,
    context: TileContext,
    points: Phaser.Geom.Point[],
    modulatedBase: number
  ): void {
    const surface = tile.surfaceKind ?? 'lot';
    const axis = tile.surfaceAxis;
    const [top, right, bottom, left] = points;
    const center = new Phaser.Geom.Point(context.center.x, context.center.y);

    if (surface === 'road' || surface === 'crosswalk') {
      const laneColor = surface === 'crosswalk' ? 0xffc67a : 0xffb35c;
      this.graphics.lineStyle(1, laneColor, surface === 'crosswalk' ? 0.28 : 0.18);

      if (axis === 'avenue' || axis === 'intersection') {
        this.graphics.strokePoints([top, center, bottom], false);
      }
      if (axis === 'street' || axis === 'intersection') {
        this.graphics.strokePoints([left, center, right], false);
      }

      if (surface === 'crosswalk') {
        const stripeColor = 0xf8fafc;
        this.graphics.lineStyle(1.15, stripeColor, 0.42);
        const stripeA = this.lerpPoint(left, top, 0.42);
        const stripeB = this.lerpPoint(bottom, right, 0.42);
        const stripeC = this.lerpPoint(left, top, 0.62);
        const stripeD = this.lerpPoint(bottom, right, 0.62);
        this.graphics.strokePoints([stripeA, stripeB], false);
        this.graphics.strokePoints([stripeC, stripeD], false);
      }

      this.drawRoadReflection(tile, context, points, surface === 'crosswalk' ? 1.1 : 1);
      return;
    }

    if (surface === 'sidewalk') {
      this.graphics.lineStyle(1, adjustColor(modulatedBase, 0.2), 0.24);
      this.graphics.strokePoints(points, true);
      this.graphics.lineStyle(0.9, 0x94a3b8, 0.2);
      this.graphics.strokePoints(
        [
          this.lerpPoint(top, right, 0.5),
          this.lerpPoint(left, bottom, 0.5),
        ],
        false
      );
      this.drawRoadReflection(tile, context, points, 0.65);
      return;
    }

    if ((context.gridX + context.gridY) % 5 === 0) {
      this.graphics.lineStyle(0.8, 0x67e8f9, 0.06);
      this.graphics.strokePoints(points, true);
    }
    this.drawRoadReflection(tile, context, points, 0.45);
  }
}
