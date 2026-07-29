import Phaser from 'phaser';
import type { MapBuildingDefinition } from '../../interfaces/types';
import type { BuildingVisualProfile, VisualTheme } from '../contracts';
import { adjustColor } from '../../utils/iso';
import {
  resolveLevel0BuildingArt,
  type Level0BuildingArtEntry,
} from '../../../content/environment/level0BuildingArtManifest';
import { resolvePaintedBuildingTransform } from './paintedBuildingTransform';

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
  atmosphere?: {
    emissiveIntensity: number;
    overlayAlpha: number;
  };
}

export interface BuildingMassingResult {
  readonly container: Phaser.GameObjects.Container;
  readonly renderMode: 'painted' | 'vector';
  readonly visualHeightPx: number;
}

interface DiamondPoints {
  top: Phaser.Geom.Point;
  right: Phaser.Geom.Point;
  bottom: Phaser.Geom.Point;
  left: Phaser.Geom.Point;
}

export class BuildingPainter {
  constructor(private readonly scene: Phaser.Scene, private readonly theme: VisualTheme) {}

  public createMassing(
    building: MapBuildingDefinition,
    profile: BuildingVisualProfile,
    metrics: BuildingMassingMetrics
  ): BuildingMassingResult {
    const container = this.scene.add.container(metrics.center.x, metrics.center.y);

    const base = this.toLocal(metrics.center, metrics.footprint);
    const paintedArt = this.theme.mapProfile.buildingArtSetId
      ? resolveLevel0BuildingArt(building.id)
      : undefined;

    if (paintedArt && this.scene.textures.exists(paintedArt.textureKey)) {
      return this.createPaintedMassing(container, paintedArt, metrics, base);
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
    return {
      container,
      renderMode: 'vector',
      visualHeightPx: massingHeight,
    };
  }

  private createPaintedMassing(
    container: Phaser.GameObjects.Container,
    art: Level0BuildingArtEntry,
    metrics: BuildingMassingMetrics,
    base: DiamondPoints
  ): BuildingMassingResult {
    const transform = resolvePaintedBuildingTransform({
      art,
      footprint: base,
    });
    const footprintPlate = this.scene.add.graphics();
    footprintPlate.fillStyle(this.theme.treatment.surface.charcoal, 0.98);
    footprintPlate.fillPoints([base.top, base.right, base.bottom, base.left], true);
    footprintPlate.lineStyle(
      Math.max(1, this.theme.treatment.outline.width),
      this.theme.treatment.outline.color,
      this.theme.treatment.outline.alpha
    );
    footprintPlate.strokePoints([base.top, base.right, base.bottom, base.left], true);

    const footprintPoints = [base.top, base.right, base.bottom, base.left];
    const footprintCenter = footprintPoints.reduce(
      (center, point) => ({
        x: center.x + point.x / footprintPoints.length,
        y: center.y + point.y / footprintPoints.length,
      }),
      { x: 0, y: 0 }
    );
    const inset = footprintPoints.map(
      (point) =>
        new Phaser.Geom.Point(
          footprintCenter.x + (point.x - footprintCenter.x) * 0.94,
          footprintCenter.y + (point.y - footprintCenter.y) * 0.94
        )
    );
    footprintPlate.lineStyle(
      1,
      this.theme.treatment.surface.umber,
      Math.max(0.18, this.theme.treatment.outline.secondaryAlpha)
    );
    footprintPlate.strokePoints(inset, true);

    const sprite = this.scene.add.image(transform.x, transform.y, art.textureKey);

    sprite.setOrigin(transform.origin.x, transform.origin.y);
    sprite.setScale(transform.scale);
    sprite.setAlpha(0.98);

    const emissiveIntensity = Phaser.Math.Clamp(metrics.atmosphere?.emissiveIntensity ?? 0.35, 0, 1);
    const overlayAlpha = Phaser.Math.Clamp(metrics.atmosphere?.overlayAlpha ?? 0.2, 0, 1);
    const nightWeight = Phaser.Math.Clamp(emissiveIntensity * 0.74 + overlayAlpha * 0.34, 0, 0.62);
    const tint = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0xfff9ee),
      Phaser.Display.Color.ValueToColor(0xb29a7e),
      100,
      Math.round(nightWeight * 100)
    );
    sprite.setTint(Phaser.Display.Color.GetColor(tint.r, tint.g, tint.b));

    container.add([footprintPlate, sprite]);
    return {
      container,
      renderMode: 'painted',
      visualHeightPx: sprite.displayHeight,
    };
  }

  public createLabel(
    building: MapBuildingDefinition,
    center: { x: number; y: number },
    tileHeight: number,
    profile: BuildingVisualProfile
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(center.x, center.y - tileHeight * 0.24);
    const painterly = this.theme.renderStyle === 'graphic-painterly-noir';

    const title = this.scene.add.text(0, 0, building.name, {
      fontFamily: painterly
        ? '"DM Mono", "IBM Plex Mono", monospace'
        : 'Orbitron, "DM Sans", sans-serif',
      fontSize: painterly
        ? (this.theme.qualityBudget.enableHighDensityLabels ? '9px' : '8px')
        : (this.theme.qualityBudget.enableHighDensityLabels ? '11px' : '10px'),
      fontStyle: '700',
      color: painterly ? this.colorToHex(this.theme.treatment.surface.bone) : profile.signagePrimaryHex,
      stroke: painterly ? this.colorToHex(this.theme.treatment.ink.primary) : profile.signageSecondaryHex,
      strokeThickness: painterly ? 2 : 1,
      align: 'center',
    });
    title.setOrigin(0.5);
    if (!painterly) {
      title.setShadow(0, 0, profile.glowHex, 4, true, true);
    }
    title.setAlpha(painterly ? 0.48 : 0.72);

    const padX = 14;
    const padY = 8;
    const backdrop = this.scene.add.rectangle(
      0,
      0,
      title.width + padX,
      title.height + padY,
      painterly ? this.theme.treatment.ink.primary : this.hexToColor(profile.backdropHex),
      painterly ? 0.66 : 0.34
    );
    backdrop.setStrokeStyle(
      painterly ? 0.7 : 0.9,
      painterly ? this.theme.treatment.lighting.practical : this.hexToColor(profile.signageSecondaryHex),
      painterly ? 0.2 : 0.28
    );

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
    const rightColor = adjustColor(faceBase, profile.district === 'downtown' ? -0.04 : -0.08);
    const frontColor = adjustColor(faceBase, profile.district === 'downtown' ? -0.09 : -0.14);
    const leftColor = adjustColor(faceBase, profile.district === 'downtown' ? -0.07 : -0.1);
    const roofColor = adjustColor(faceBase, profile.district === 'downtown' ? 0.08 : 0.04);

    bodyLayer.fillStyle(leftColor, profile.district === 'downtown' ? 0.78 : 0.72);
    bodyLayer.fillPoints(leftFace, true);
    bodyLayer.fillStyle(rightColor, profile.district === 'downtown' ? 0.8 : 0.74);
    bodyLayer.fillPoints(rightFace, true);
    bodyLayer.fillStyle(frontColor, profile.district === 'downtown' ? 0.84 : 0.78);
    bodyLayer.fillPoints(frontFace, true);
    bodyLayer.fillStyle(roofColor, profile.district === 'downtown' ? 0.86 : 0.8);
    bodyLayer.fillPoints([roof.top, roof.right, roof.bottom, roof.left], true);

    bodyLayer.lineStyle(1.2, this.hexToColor(profile.trimHex), profile.district === 'downtown' ? 0.28 : 0.22);
    bodyLayer.strokePoints([roof.top, roof.right, roof.bottom, roof.left], true);
    this.drawPodiumBand(bodyLayer, profile, frontFace, rightFace);

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
      const columns = Math.max(3, Math.min(7, Math.floor(span * 0.55)));
      const rows = Math.max(2, Math.min(5, Math.floor(profile.massingHeight * 1.15)));
      const windowColor = this.hexToColor(profile.signageSecondaryHex);
      this.drawCorporateBands(graphics, profile, frontFace, rightFace);
      this.drawFaceGrid(graphics, frontFace, columns, rows, windowColor, 0.12);
      this.drawFaceGrid(graphics, rightFace, columns, rows, windowColor, 0.08);
      graphics.lineStyle(1, this.hexToColor(profile.signagePrimaryHex), 0.36);
      graphics.strokePoints([roof.left, roof.bottom, roof.right], false);
      this.drawDowntownRoofCrown(graphics, profile, roof);
      this.drawFacadeSignPanel(graphics, profile, rightFace, frontFace, span);
      return;
    }

    const stripeColor = this.hexToColor(profile.accentHex);
    this.drawRepairBand(graphics, profile, frontFace, rightFace);
    graphics.lineStyle(1, stripeColor, 0.2);
    const seamFrontLeft = this.lerpPoint(frontFace[0], frontFace[3], 0.44);
    const seamFrontRight = this.lerpPoint(frontFace[1], frontFace[2], 0.44);
    graphics.strokePoints([seamFrontLeft, seamFrontRight], false);
    const seamRightTop = this.lerpPoint(rightFace[0], rightFace[3], 0.36);
    const seamRightBottom = this.lerpPoint(rightFace[1], rightFace[2], 0.36);
    graphics.strokePoints([seamRightTop, seamRightBottom], false);
    this.drawSlumsRoofAddons(graphics, profile, roof);
    this.drawFacadeSignPanel(graphics, profile, frontFace, rightFace, span);
  }

  private drawPodiumBand(
    graphics: Phaser.GameObjects.Graphics,
    profile: BuildingVisualProfile,
    frontFace: Phaser.Geom.Point[],
    rightFace: Phaser.Geom.Point[]
  ): void {
    const frontBand = [
      this.lerpPoint(frontFace[0], frontFace[3], 0.58),
      this.lerpPoint(frontFace[1], frontFace[2], 0.58),
      this.lerpPoint(frontFace[1], frontFace[2], 0.82),
      this.lerpPoint(frontFace[0], frontFace[3], 0.82),
    ];
    const rightBand = [
      this.lerpPoint(rightFace[0], rightFace[3], 0.56),
      this.lerpPoint(rightFace[1], rightFace[2], 0.56),
      this.lerpPoint(rightFace[1], rightFace[2], 0.8),
      this.lerpPoint(rightFace[0], rightFace[3], 0.8),
    ];

    graphics.fillStyle(this.hexToColor(profile.atmosphereHex), profile.district === 'downtown' ? 0.26 : 0.22);
    graphics.fillPoints(frontBand, true);
    graphics.fillPoints(rightBand, true);
    graphics.lineStyle(1, this.hexToColor(profile.trimHex), profile.district === 'downtown' ? 0.2 : 0.16);
    graphics.strokePoints([frontBand[0], frontBand[1]], false);
    graphics.strokePoints([rightBand[0], rightBand[1]], false);
  }

  private drawCorporateBands(
    graphics: Phaser.GameObjects.Graphics,
    profile: BuildingVisualProfile,
    frontFace: readonly [Phaser.Geom.Point, Phaser.Geom.Point, Phaser.Geom.Point, Phaser.Geom.Point],
    rightFace: readonly [Phaser.Geom.Point, Phaser.Geom.Point, Phaser.Geom.Point, Phaser.Geom.Point]
  ): void {
    const frontBand = [
      this.lerpPoint(frontFace[0], frontFace[3], 0.32),
      this.lerpPoint(frontFace[1], frontFace[2], 0.32),
      this.lerpPoint(frontFace[1], frontFace[2], 0.48),
      this.lerpPoint(frontFace[0], frontFace[3], 0.48),
    ];
    const rightBand = [
      this.lerpPoint(rightFace[0], rightFace[3], 0.28),
      this.lerpPoint(rightFace[1], rightFace[2], 0.28),
      this.lerpPoint(rightFace[1], rightFace[2], 0.44),
      this.lerpPoint(rightFace[0], rightFace[3], 0.44),
    ];

    graphics.fillStyle(this.hexToColor(profile.atmosphereHex), 0.22);
    graphics.fillPoints(frontBand, true);
    graphics.fillPoints(rightBand, true);
    graphics.lineStyle(1.05, this.hexToColor(profile.signageSecondaryHex), 0.16);
    graphics.strokePoints([frontBand[0], frontBand[1]], false);
    graphics.strokePoints([rightBand[0], rightBand[1]], false);
  }

  private drawRepairBand(
    graphics: Phaser.GameObjects.Graphics,
    profile: BuildingVisualProfile,
    frontFace: readonly [Phaser.Geom.Point, Phaser.Geom.Point, Phaser.Geom.Point, Phaser.Geom.Point],
    rightFace: readonly [Phaser.Geom.Point, Phaser.Geom.Point, Phaser.Geom.Point, Phaser.Geom.Point]
  ): void {
    const frontPatch = [
      this.lerpPoint(frontFace[0], frontFace[3], 0.62),
      this.lerpPoint(frontFace[1], frontFace[2], 0.62),
      this.lerpPoint(frontFace[1], frontFace[2], 0.8),
      this.lerpPoint(frontFace[0], frontFace[3], 0.8),
    ];
    const rightPatch = [
      this.lerpPoint(rightFace[0], rightFace[3], 0.56),
      this.lerpPoint(rightFace[1], rightFace[2], 0.56),
      this.lerpPoint(rightFace[1], rightFace[2], 0.76),
      this.lerpPoint(rightFace[0], rightFace[3], 0.76),
    ];

    graphics.fillStyle(this.hexToColor(profile.atmosphereHex), 0.22);
    graphics.fillPoints(frontPatch, true);
    graphics.fillPoints(rightPatch, true);
    graphics.lineStyle(0.9, this.hexToColor(profile.trimHex), 0.16);
    graphics.strokePoints([frontPatch[0], frontPatch[2]], false);
    graphics.strokePoints([rightPatch[0], rightPatch[2]], false);
  }

  private drawDowntownRoofCrown(
    graphics: Phaser.GameObjects.Graphics,
    profile: BuildingVisualProfile,
    roof: DiamondPoints
  ): void {
    const crown = [
      this.lerpPoint(roof.left, roof.top, 0.26),
      this.lerpPoint(roof.top, roof.right, 0.26),
      this.lerpPoint(roof.right, roof.bottom, 0.26),
      this.lerpPoint(roof.bottom, roof.left, 0.26),
    ];

    graphics.fillStyle(this.hexToColor(profile.backdropHex), 0.3);
    graphics.fillPoints(crown, true);
    graphics.lineStyle(1.1, this.hexToColor(profile.signagePrimaryHex), 0.3);
    graphics.strokePoints(crown, true);

    const beacon = [
      this.lerpPoint(crown[0], crown[1], 0.5),
      this.lerpPoint(crown[1], crown[2], 0.5),
      this.lerpPoint(crown[2], crown[3], 0.5),
      this.lerpPoint(crown[3], crown[0], 0.5),
    ];
    graphics.fillStyle(this.hexToColor(profile.signageSecondaryHex), 0.12);
    graphics.fillPoints(beacon, true);
  }

  private drawSlumsRoofAddons(
    graphics: Phaser.GameObjects.Graphics,
    profile: BuildingVisualProfile,
    roof: DiamondPoints
  ): void {
    const addon = [
      this.lerpPoint(roof.left, roof.top, 0.2),
      this.lerpPoint(roof.top, roof.right, 0.42),
      this.lerpPoint(roof.right, roof.bottom, 0.54),
      this.lerpPoint(roof.bottom, roof.left, 0.34),
    ];
    graphics.fillStyle(this.hexToColor(profile.atmosphereHex), 0.34);
    graphics.fillPoints(addon, true);
    graphics.lineStyle(1, this.hexToColor(profile.trimHex), 0.22);
    graphics.strokePoints(addon, true);

    const ventLineStart = this.lerpPoint(addon[0], addon[3], 0.46);
    const ventLineEnd = this.lerpPoint(addon[1], addon[2], 0.46);
    graphics.lineStyle(0.9, this.hexToColor(profile.glowHex), 0.18);
    graphics.strokePoints([ventLineStart, ventLineEnd], false);
  }

  private drawFacadeSignPanel(
    graphics: Phaser.GameObjects.Graphics,
    profile: BuildingVisualProfile,
    primaryFace: readonly [Phaser.Geom.Point, Phaser.Geom.Point, Phaser.Geom.Point, Phaser.Geom.Point],
    secondaryFace: readonly [Phaser.Geom.Point, Phaser.Geom.Point, Phaser.Geom.Point, Phaser.Geom.Point],
    span: number
  ): void {
    const heightScale = span > 30 ? 0.3 : 0.36;
    const widthScale = profile.district === 'downtown' ? 0.52 : 0.46;
    const panel = [
      this.lerpPoint(primaryFace[0], primaryFace[3], heightScale),
      this.lerpPoint(primaryFace[0], primaryFace[1], widthScale),
      this.lerpPoint(primaryFace[1], primaryFace[2], heightScale + 0.06),
      this.lerpPoint(primaryFace[3], primaryFace[2], widthScale),
    ];
    graphics.fillStyle(this.hexToColor(profile.backdropHex), profile.district === 'downtown' ? 0.34 : 0.28);
    graphics.fillPoints(panel, true);
    graphics.lineStyle(1.1, this.hexToColor(profile.signagePrimaryHex), 0.32);
    graphics.strokePoints(panel, true);

    const stripeStart = this.lerpPoint(panel[0], panel[3], 0.5);
    const stripeEnd = this.lerpPoint(panel[1], panel[2], 0.5);
    graphics.lineStyle(1, this.hexToColor(profile.signageSecondaryHex), 0.24);
    graphics.strokePoints([stripeStart, stripeEnd], false);

    if (profile.district === 'slums') {
      const hangerStart = this.lerpPoint(secondaryFace[0], secondaryFace[3], 0.24);
      const hangerEnd = this.lerpPoint(secondaryFace[1], secondaryFace[2], 0.24);
      graphics.lineStyle(0.9, this.hexToColor(profile.trimHex), 0.16);
      graphics.strokePoints([hangerStart, hangerEnd], false);
    }
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

  private colorToHex(color: number): string {
    return `#${color.toString(16).padStart(6, '0')}`;
  }
}
