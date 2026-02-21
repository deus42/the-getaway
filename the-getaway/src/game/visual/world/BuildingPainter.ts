import Phaser from 'phaser';
import type { MapBuildingDefinition } from '../../interfaces/types';
import type { BuildingVisualProfile, VisualTheme } from '../contracts';
import { adjustColor } from '../../utils/iso';

export interface BuildingFootprintProjection {
  top: Phaser.Geom.Point;
  right: Phaser.Geom.Point;
  bottom: Phaser.Geom.Point;
  left: Phaser.Geom.Point;
}

export interface BuildingMassingMetrics {
  center: { x: number; y: number };
  tileHeight: number;
  widthTiles: number;
  depthTiles: number;
  footprint: BuildingFootprintProjection;
}

interface DiamondPoints {
  top: Phaser.Geom.Point;
  right: Phaser.Geom.Point;
  bottom: Phaser.Geom.Point;
  left: Phaser.Geom.Point;
}

const ESB_BUILDING_ID = 'block_2_1';
const ESB_ATLAS_KEY = 'esb';
const ESB_FRAME_KEY = 'esb_iso';

export class BuildingPainter {
  constructor(private readonly scene: Phaser.Scene, private readonly theme: VisualTheme) {}

  public createMassing(
    building: MapBuildingDefinition,
    profile: BuildingVisualProfile,
    metrics: BuildingMassingMetrics
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(metrics.center.x, metrics.center.y);

    const base = this.toLocal(metrics.center, metrics.footprint);

    // PoC landmark override: swap one Level 0 building slot for an ESB sprite.
    if (building.id === ESB_BUILDING_ID && this.scene.textures.exists(ESB_ATLAS_KEY)) {
      const sprite = this.scene.add.image(base.bottom.x, base.bottom.y, ESB_ATLAS_KEY, ESB_FRAME_KEY);
      sprite.setOrigin(0.5, 1);

      // Scale the sprite to feel like a landmark but still sit within the Level 0 composition.
      // (Height-based scaling is more stable than footprint-width scaling because Level 0 blocks can be very wide.)
      const targetHeight = metrics.tileHeight * (14 + profile.massingHeight * 2.2);
      sprite.setScale(targetHeight / Math.max(1, sprite.height));

      // Slight alpha lift so it reads through atmospheric overlays.
      sprite.setAlpha(0.98);

      container.add(sprite);
      return container;
    }

    const shadowLayer = this.scene.add.graphics();
    const bodyLayer = this.scene.add.graphics();
    const detailLayer = this.scene.add.graphics();

    const span = metrics.widthTiles + metrics.depthTiles;
    const districtHeightBoost = profile.district === 'downtown' ? 0.78 : 0.7;
    const massingHeight = metrics.tileHeight * Math.max(0.58, profile.massingHeight * districtHeightBoost);
    const roofInset = profile.district === 'downtown' ? 0.03 : 0.015;
    const roof = this.createRoof(base, massingHeight, roofInset);

    this.drawBaseShadow(shadowLayer, base);
    this.drawBody(bodyLayer, detailLayer, profile, base, roof);
    this.drawDistrictDetails(detailLayer, profile, base, roof, span);

    container.add([shadowLayer, bodyLayer, detailLayer]);
    return container;
  }

  public createLabel(
    building: MapBuildingDefinition,
    center: { x: number; y: number },
    tileHeight: number,
    profile: BuildingVisualProfile
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(center.x, center.y - tileHeight * 0.24);

    const title = this.scene.add.text(0, 0, building.name, {
      fontFamily: 'Orbitron, "DM Sans", sans-serif',
      fontSize: this.theme.qualityBudget.enableHighDensityLabels ? '13px' : '11px',
      fontStyle: '700',
      color: profile.signagePrimaryHex,
      stroke: profile.signageSecondaryHex,
      strokeThickness: 1.6,
      align: 'center',
    });
    title.setOrigin(0.5);
    title.setShadow(0, 0, profile.glowHex, 8, true, true);

    const padX = 14;
    const padY = 8;
    const backdrop = this.scene.add.rectangle(
      0,
      0,
      title.width + padX,
      title.height + padY,
      this.hexToColor(profile.backdropHex),
      0.58
    );
    backdrop.setStrokeStyle(1.1, this.hexToColor(profile.signageSecondaryHex), 0.72);

    container.add([backdrop, title]);
    return container;
  }

  private drawBaseShadow(graphics: Phaser.GameObjects.Graphics, base: DiamondPoints): void {
    graphics.fillStyle(0x02060e, 0.14);
    graphics.fillPoints([base.top, base.right, base.bottom, base.left], true);
  }

  private drawBody(
    bodyLayer: Phaser.GameObjects.Graphics,
    detailLayer: Phaser.GameObjects.Graphics,
    profile: BuildingVisualProfile,
    base: DiamondPoints,
    roof: DiamondPoints
  ): void {
    const rightFace = [base.right, base.bottom, roof.bottom, roof.right];
    const frontFace = [base.bottom, base.left, roof.left, roof.bottom];
    const leftFace = [base.left, base.top, roof.top, roof.left];

    const faceBase = this.hexToColor(profile.backdropHex);
    const rightColor = adjustColor(faceBase, -0.06);
    const frontColor = adjustColor(faceBase, -0.13);
    const leftColor = adjustColor(faceBase, -0.1);
    const roofColor = adjustColor(faceBase, 0.03);

    bodyLayer.fillStyle(leftColor, 0.72);
    bodyLayer.fillPoints(leftFace, true);
    bodyLayer.fillStyle(rightColor, 0.74);
    bodyLayer.fillPoints(rightFace, true);
    bodyLayer.fillStyle(frontColor, 0.78);
    bodyLayer.fillPoints(frontFace, true);
    bodyLayer.fillStyle(roofColor, 0.8);
    bodyLayer.fillPoints([roof.top, roof.right, roof.bottom, roof.left], true);

    bodyLayer.lineStyle(1.2, this.hexToColor(profile.trimHex), 0.24);
    bodyLayer.strokePoints([roof.top, roof.right, roof.bottom, roof.left], true);

    detailLayer.lineStyle(1, this.hexToColor(profile.trimHex), 0.16);
    detailLayer.strokePoints([base.bottom, roof.bottom], false);
    detailLayer.strokePoints([base.left, roof.left], false);
    detailLayer.strokePoints([base.right, roof.right], false);
  }

  private drawDistrictDetails(
    graphics: Phaser.GameObjects.Graphics,
    profile: BuildingVisualProfile,
    base: DiamondPoints,
    roof: DiamondPoints,
    span: number
  ): void {
    const rightFace = [base.right, base.bottom, roof.bottom, roof.right] as const;
    const frontFace = [base.bottom, base.left, roof.left, roof.bottom] as const;

    if (profile.district === 'downtown') {
      const columns = Math.max(4, Math.min(10, Math.floor(span * 0.8)));
      const rows = Math.max(3, Math.min(8, Math.floor(profile.massingHeight * 1.7)));
      const windowColor = this.hexToColor(profile.signageSecondaryHex);
      this.drawFaceGrid(graphics, frontFace, columns, rows, windowColor, 0.2);
      this.drawFaceGrid(graphics, rightFace, columns, rows, windowColor, 0.16);
      graphics.lineStyle(1, this.hexToColor(profile.signagePrimaryHex), 0.36);
      graphics.strokePoints([roof.left, roof.bottom, roof.right], false);
      return;
    }

    const stripeColor = this.hexToColor(profile.accentHex);
    graphics.lineStyle(1, stripeColor, 0.2);
    const seamFrontLeft = this.lerpPoint(frontFace[0], frontFace[3], 0.44);
    const seamFrontRight = this.lerpPoint(frontFace[1], frontFace[2], 0.44);
    graphics.strokePoints([seamFrontLeft, seamFrontRight], false);
    const seamRightTop = this.lerpPoint(rightFace[0], rightFace[3], 0.36);
    const seamRightBottom = this.lerpPoint(rightFace[1], rightFace[2], 0.36);
    graphics.strokePoints([seamRightTop, seamRightBottom], false);
  }

  private drawFaceGrid(
    graphics: Phaser.GameObjects.Graphics,
    face: readonly [Phaser.Geom.Point, Phaser.Geom.Point, Phaser.Geom.Point, Phaser.Geom.Point],
    columns: number,
    rows: number,
    color: number,
    alpha: number
  ): void {
    graphics.lineStyle(1, color, alpha);

    for (let c = 1; c < columns; c += 1) {
      const t = c / columns;
      const basePoint = this.lerpPoint(face[0], face[1], t);
      const roofPoint = this.lerpPoint(face[3], face[2], t);
      graphics.strokePoints([basePoint, roofPoint], false);
    }

    for (let r = 1; r < rows; r += 1) {
      const t = r / rows;
      const left = this.lerpPoint(face[0], face[3], t);
      const right = this.lerpPoint(face[1], face[2], t);
      graphics.strokePoints([left, right], false);
    }
  }

  private createRoof(base: DiamondPoints, height: number, inset: number): DiamondPoints {
    return {
      top: this.liftAndInset(base.top, height, inset),
      right: this.liftAndInset(base.right, height, inset),
      bottom: this.liftAndInset(base.bottom, height, inset),
      left: this.liftAndInset(base.left, height, inset),
    };
  }

  private liftAndInset(point: Phaser.Geom.Point, height: number, inset: number): Phaser.Geom.Point {
    return new Phaser.Geom.Point(point.x * (1 - inset), point.y * (1 - inset) - height);
  }

  private toLocal(center: { x: number; y: number }, footprint: BuildingFootprintProjection): DiamondPoints {
    const toLocalPoint = (point: Phaser.Geom.Point): Phaser.Geom.Point =>
      new Phaser.Geom.Point(point.x - center.x, point.y - center.y);

    return {
      top: toLocalPoint(footprint.top),
      right: toLocalPoint(footprint.right),
      bottom: toLocalPoint(footprint.bottom),
      left: toLocalPoint(footprint.left),
    };
  }

  private lerpPoint(a: Phaser.Geom.Point, b: Phaser.Geom.Point, t: number): Phaser.Geom.Point {
    return new Phaser.Geom.Point(
      Phaser.Math.Linear(a.x, b.x, t),
      Phaser.Math.Linear(a.y, b.y, t)
    );
  }

  private hexToColor(hex: string): number {
    return Phaser.Display.Color.HexStringToColor(hex).color;
  }
}
