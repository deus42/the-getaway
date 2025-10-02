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

export interface BarricadeOptions {
  tint?: number;
  height?: number;
  widthScale?: number;
  depthOffset?: number;
}

export interface StreetLightOptions {
  baseColor?: number;
  poleColor?: number;
  glowColor?: number;
  height?: number;
  widthScale?: number;
  glowAlpha?: number;
}

export interface BillboardOptions {
  baseColor?: number;
  glowColor?: number;
  panelColor?: number;
  accentColor?: number;
  widthScale?: number;
  heightScale?: number;
  glowAlpha?: number;
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

  public createBarricade(gridX: number, gridY: number, options: BarricadeOptions = {}): Phaser.GameObjects.Graphics {
    const metrics = getIsoMetrics(this.tileSize);
    const { x, y } = toPixel(gridX, gridY, this.originX, this.originY, this.tileSize);
    const tint = options.tint ?? 0x4b5563;
    const width = metrics.tileWidth * (options.widthScale ?? 0.9);
    const depthHeight = metrics.tileHeight * 0.32 * (options.height ?? 1);
    const baseHeight = metrics.tileHeight * 0.34;

    const topPoints = getDiamondPoints(x, y - depthHeight, width, baseHeight).map(
      (point) => new Phaser.Geom.Point(point.x, point.y)
    );
    const basePoints = getDiamondPoints(x, y, width, baseHeight).map(
      (point) => new Phaser.Geom.Point(point.x, point.y)
    );

    const leftFace = [basePoints[3], basePoints[0], topPoints[0], topPoints[3]];
    const rightFace = [basePoints[0], basePoints[1], topPoints[1], topPoints[0]];
    const frontFace = [basePoints[1], basePoints[2], topPoints[2], topPoints[1]];

    const graphics = this.scene.add.graphics();
    graphics.fillStyle(tint, 0.96);
    graphics.fillPoints(frontFace, true);
    graphics.fillStyle(tint, 0.92);
    graphics.fillPoints(leftFace, true);
    graphics.fillStyle(tint, 0.88);
    graphics.fillPoints(rightFace, true);
    graphics.lineStyle(1.5, adjustColor(tint, 0.18), 0.9);
    graphics.strokePoints(basePoints, true);
    graphics.strokePoints(topPoints, true);
    graphics.setDepth(y + (options.depthOffset ?? 6));

    return graphics;
  }

  public createStreetLight(gridX: number, gridY: number, options: StreetLightOptions = {}): Phaser.GameObjects.Container {
    const metrics = getIsoMetrics(this.tileSize);
    const { x, y } = toPixel(gridX, gridY, this.originX, this.originY, this.tileSize);
    const baseColor = options.baseColor ?? 0x0f172a;
    const poleColor = options.poleColor ?? 0x1e293b;
    const glowColor = options.glowColor ?? 0x38bdf8;
    const heightFactor = options.height ?? 1.2;
    const widthScale = options.widthScale ?? 0.42;

    const container = this.scene.add.container(x, y);

    const base = this.scene.add.graphics();
    const baseDiamond = getDiamondPoints(0, 0, metrics.tileWidth * widthScale, metrics.tileHeight * 0.32).map(
      (point) => new Phaser.Geom.Point(point.x, point.y)
    );
    base.fillStyle(baseColor, 0.95);
    base.fillPoints(baseDiamond, true);
    base.lineStyle(1.2, adjustColor(baseColor, 0.18), 0.9);
    base.strokePoints(baseDiamond, true);

    const pole = this.scene.add.graphics();
    const poleHeight = metrics.tileHeight * (1.8 * heightFactor);
    const poleWidth = Math.max(2, metrics.tileWidth * 0.05);
    pole.fillStyle(poleColor, 1);
    pole.fillRect(-poleWidth / 2, -poleHeight, poleWidth, poleHeight);
    pole.setAlpha(0.95);

    const lamp = this.scene.add.graphics();
    const lampWidth = metrics.tileWidth * 0.55;
    const lampHeight = metrics.tileHeight * 0.3;
    const lampPoints = getDiamondPoints(0, -poleHeight, lampWidth, lampHeight).map(
      (point) => new Phaser.Geom.Point(point.x, point.y)
    );
    lamp.fillStyle(adjustColor(glowColor, -0.4), 0.96);
    lamp.fillPoints(lampPoints, true);
    lamp.lineStyle(1.2, adjustColor(glowColor, 0.2), 0.9);
    lamp.strokePoints(lampPoints, true);

    const glow = this.scene.add.graphics();
    glow.fillStyle(glowColor, options.glowAlpha ?? 0.22);
    glow.fillEllipse(0, metrics.tileHeight * 0.05, metrics.tileWidth * 0.9, metrics.tileHeight * 0.36);
    glow.setBlendMode(Phaser.BlendModes.ADD);

    container.add([glow, base, pole, lamp]);
    container.setDepth(y + 14);

    return container;
  }

  public createBillboard(gridX: number, gridY: number, options: BillboardOptions = {}): Phaser.GameObjects.Container {
    const metrics = getIsoMetrics(this.tileSize);
    const { x, y } = toPixel(gridX, gridY, this.originX, this.originY, this.tileSize);
    const baseColor = options.baseColor ?? 0x111827;
    const glowColor = options.glowColor ?? 0x38bdf8;
    const panelColor = options.panelColor ?? adjustColor(glowColor, -0.2);
    const accentColor = options.accentColor ?? adjustColor(glowColor, 0.25);
    const widthScale = options.widthScale ?? 0.9;
    const heightScale = options.heightScale ?? 1.1;

    const container = this.scene.add.container(x, y);

    const base = this.scene.add.graphics();
    const baseDiamond = getDiamondPoints(0, 0, metrics.tileWidth * 0.45, metrics.tileHeight * 0.28).map(
      (point) => new Phaser.Geom.Point(point.x, point.y)
    );
    base.fillStyle(baseColor, 0.94);
    base.fillPoints(baseDiamond, true);
    base.lineStyle(1.3, adjustColor(baseColor, 0.15), 0.9);
    base.strokePoints(baseDiamond, true);

    const support = this.scene.add.graphics();
    const poleHeight = metrics.tileHeight * 1.35 * heightScale;
    const poleWidth = Math.max(2, metrics.tileWidth * 0.04);
    support.fillStyle(adjustColor(baseColor, 0.1), 1);
    support.fillRect(-poleWidth / 2, -poleHeight, poleWidth, poleHeight);

    const panel = this.scene.add.graphics();
    const panelWidth = metrics.tileWidth * widthScale;
    const panelHeight = metrics.tileHeight * 0.6 * heightScale;
    const panelPoints = [
      new Phaser.Geom.Point(-panelWidth / 2, -poleHeight),
      new Phaser.Geom.Point(panelWidth / 2, -poleHeight - panelHeight * 0.18),
      new Phaser.Geom.Point(panelWidth / 2, -poleHeight - panelHeight),
      new Phaser.Geom.Point(-panelWidth / 2, -poleHeight - panelHeight * 0.82),
    ];
    panel.fillStyle(panelColor, 0.93);
    panel.fillPoints(panelPoints, true);
    panel.lineStyle(1.6, accentColor, 0.95);
    panel.strokePoints(panelPoints, true);

    const panelGlow = this.scene.add.graphics();
    panelGlow.fillStyle(glowColor, options.glowAlpha ?? 0.25);
    panelGlow.fillEllipse(0, -poleHeight - panelHeight * 0.6, panelWidth * 1.1, panelHeight * 1.4);
    panelGlow.setBlendMode(Phaser.BlendModes.ADD);

    container.add([panelGlow, base, support, panel]);
    container.setDepth(y + 12);

    return container;
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
