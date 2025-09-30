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
}
