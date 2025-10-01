import Phaser from 'phaser';
import { DEFAULT_TILE_SIZE } from '../world/grid';
import { getIsoMetrics, toPixel, getDiamondPoints, adjustColor } from './iso';

export interface CrateOptions {
  tint?: number;
  scale?: number;
  height?: number;
  alpha?: number;
}

export interface HighlightOptions {
  color?: number;
  alpha?: number;
  widthScale?: number;
  heightScale?: number;
}

export interface CharacterBaseOptions extends HighlightOptions {
  baseColor?: number;
  outlineColor?: number;
  depthOffset?: number;
  widthScale?: number;
  heightScale?: number;
}

export interface CharacterTokenOptions extends CharacterBaseOptions {
  primaryColor?: number;
  accentColor?: number;
  glowColor?: number;
  columnHeight?: number;
  haloRadius?: number;
}

export interface CharacterToken {
  container: Phaser.GameObjects.Container;
  base: Phaser.GameObjects.Graphics;
  column: Phaser.GameObjects.Graphics;
  beacon: Phaser.GameObjects.Graphics;
  halo: Phaser.GameObjects.Graphics;
  depthOffset: number;
  options: CharacterTokenOptions;
}

export class IsoObjectFactory {
  private originX = 0;
  private originY = 0;

  constructor(private readonly scene: Phaser.Scene, private readonly tileSize: number = DEFAULT_TILE_SIZE) {}

  public setIsoOrigin(x: number, y: number): this {
    this.originX = x;
    this.originY = y;
    return this;
  }

  public createCrate(gridX: number, gridY: number, options: CrateOptions = {}): Phaser.GameObjects.Graphics {
    const metrics = getIsoMetrics(this.tileSize);
    const { x, y } = toPixel(gridX, gridY, this.originX, this.originY, this.tileSize);

    const scale = options.scale ?? 0.55;
    const heightScale = options.height ?? 0.65;
    const alpha = options.alpha ?? 1;
    const baseColor = options.tint ?? 0x8d5524;
    const topColor = adjustColor(baseColor, 0.2);
    const sideColor = adjustColor(baseColor, -0.12);
    const shadowColor = adjustColor(baseColor, -0.35);

    const graphics = this.scene.add.graphics();
    graphics.setAlpha(alpha);

    const topOffset = metrics.tileHeight * heightScale;
    const width = metrics.tileWidth * scale;
    const height = metrics.tileHeight * scale;

    const topDiamond = getDiamondPoints(x, y - topOffset, width, height);
    const baseDiamond = getDiamondPoints(x, y, width, height);

    const leftFace = [baseDiamond[3], baseDiamond[0], topDiamond[0], topDiamond[3]];
    const rightFace = [baseDiamond[0], baseDiamond[1], topDiamond[1], topDiamond[0]];

    graphics.fillStyle(sideColor, 1);
    graphics.fillPoints(leftFace, true);
    graphics.fillStyle(adjustColor(sideColor, -0.05), 1);
    graphics.fillPoints(rightFace, true);

    graphics.fillStyle(topColor, 1);
    graphics.fillPoints(topDiamond, true);

    graphics.lineStyle(1.2, shadowColor, 0.8);
    graphics.strokePoints(baseDiamond, true);
    graphics.strokePoints(topDiamond, true);

    graphics.setDepth(y + 6);
    return graphics;
  }

  public createHighlightDiamond(gridX: number, gridY: number, options: HighlightOptions = {}): Phaser.GameObjects.Graphics {
    const { x, y } = toPixel(gridX, gridY, this.originX, this.originY, this.tileSize);
    const metrics = getIsoMetrics(this.tileSize);
    const width = metrics.tileWidth * (options.widthScale ?? 1);
    const height = metrics.tileHeight * (options.heightScale ?? 1);
    const color = options.color ?? 0x60a5fa;
    const alpha = options.alpha ?? 0.3;

    const diamond = getDiamondPoints(x, y, width, height);
    const graphics = this.scene.add.graphics();

    graphics.fillStyle(color, alpha);
    graphics.fillPoints(diamond, true);
    graphics.lineStyle(1.5, adjustColor(color, 0.2), alpha + 0.2);
    graphics.strokePoints(diamond, true);
    graphics.setDepth(y + 4);

    return graphics;
  }

  public createCharacterBase(gridX: number, gridY: number, options: CharacterBaseOptions = {}): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    this.updateCharacterBase(graphics, gridX, gridY, options);
    return graphics;
  }

  public updateCharacterBase(
    graphics: Phaser.GameObjects.Graphics,
    gridX: number,
    gridY: number,
    options?: CharacterBaseOptions
  ): void {
    const previous = (graphics.getData('isoOptions') as CharacterBaseOptions | undefined) ?? {};
    const resolved: CharacterBaseOptions = {
      baseColor: options?.baseColor ?? previous.baseColor ?? 0x111827,
      outlineColor: options?.outlineColor ?? previous.outlineColor ?? adjustColor(0x111827, 0.25),
      alpha: options?.alpha ?? previous.alpha ?? 0.85,
      widthScale: options?.widthScale ?? previous.widthScale ?? 0.82,
      heightScale: options?.heightScale ?? previous.heightScale ?? 0.6,
      depthOffset: options?.depthOffset ?? previous.depthOffset ?? 2,
    };

    graphics.setData('isoOptions', resolved);

    const { x, y } = toPixel(gridX, gridY, this.originX, this.originY, this.tileSize);
    const metrics = getIsoMetrics(this.tileSize);

    const width = metrics.tileWidth * (resolved.widthScale ?? 1);
    const height = metrics.tileHeight * (resolved.heightScale ?? 1);
    const diamond = getDiamondPoints(x, y, width, height);

    graphics.clear();
    graphics.fillStyle(resolved.baseColor ?? 0x111827, resolved.alpha ?? 0.85);
    graphics.fillPoints(diamond, true);
    graphics.lineStyle(1.4, resolved.outlineColor ?? adjustColor(resolved.baseColor ?? 0x111827, 0.25), (resolved.alpha ?? 0.85) + 0.1);
    graphics.strokePoints(diamond, true);
    graphics.setDepth(y + (resolved.depthOffset ?? 2));
  }

  public createCharacterToken(gridX: number, gridY: number, options: CharacterTokenOptions = {}): CharacterToken {
    const container = this.scene.add.container(0, 0);
    const metrics = getIsoMetrics(this.tileSize);
    const baseWidth = metrics.tileWidth * (options.widthScale ?? 0.8);
    const baseHeight = metrics.tileHeight * (options.heightScale ?? 0.5);
    const columnHeight = metrics.tileHeight * (options.columnHeight ?? 1.4);
    const topScale = Math.max(0.55, 1 - columnHeight / (metrics.tileHeight * 3));
    const haloRadius = (options.haloRadius ?? metrics.tileWidth * 0.55);

    const baseColor = options.baseColor ?? 0x111827;
    const outlineColor = options.outlineColor ?? adjustColor(baseColor, 0.25);
    const primaryColor = options.primaryColor ?? 0x38bdf8;
    const accentColor = options.accentColor ?? adjustColor(primaryColor, 0.2);
    const glowColor = options.glowColor ?? primaryColor;

    const base = this.scene.add.graphics();
    const baseDiamond = getDiamondPoints(0, 0, baseWidth, baseHeight).map((point) => new Phaser.Geom.Point(point.x, point.y));
    base.fillStyle(baseColor, options.alpha ?? 0.92);
    base.fillPoints(baseDiamond, true);
    base.lineStyle(1.4, outlineColor, 0.9);
    base.strokePoints(baseDiamond, true);

    const column = this.scene.add.graphics();
    const topPoints = getDiamondPoints(0, -columnHeight, baseWidth * topScale, baseHeight * topScale).map((point) => new Phaser.Geom.Point(point.x, point.y));
    const bottomPoints = baseDiamond;

    const rightFace = [bottomPoints[1], bottomPoints[2], topPoints[2], topPoints[1]];
    const frontFace = [bottomPoints[2], bottomPoints[3], topPoints[3], topPoints[2]];

    column.fillStyle(adjustColor(primaryColor, -0.4), 0.96);
    column.fillPoints(frontFace, true);
    column.fillStyle(adjustColor(primaryColor, -0.25), 0.98);
    column.fillPoints(rightFace, true);
    column.lineStyle(1.1, adjustColor(primaryColor, 0.1), 0.88);
    column.strokePoints(frontFace, true);
    column.strokePoints(rightFace, true);

    const beacon = this.scene.add.graphics();
    beacon.fillStyle(accentColor, 0.92);
    beacon.fillPoints(topPoints, true);
    beacon.lineStyle(1.2, adjustColor(accentColor, 0.3), 0.95);
    beacon.strokePoints(topPoints, true);

    const halo = this.scene.add.graphics();
    halo.fillStyle(glowColor, 0.2);
    halo.fillEllipse(0, metrics.tileHeight * 0.1, haloRadius, haloRadius * 0.45);
    halo.setBlendMode(Phaser.BlendModes.ADD);

    container.add([halo, base, column, beacon]);

    const token: CharacterToken = {
      container,
      base,
      column,
      beacon,
      halo,
      depthOffset: options.depthOffset ?? 6,
      options,
    };

    this.positionCharacterToken(token, gridX, gridY);

    return token;
  }

  public positionCharacterToken(token: CharacterToken, gridX: number, gridY: number): void {
    const { x, y } = toPixel(gridX, gridY, this.originX, this.originY, this.tileSize);
    token.container.setPosition(x, y);
    token.container.setDepth(y + token.depthOffset);
  }
}
