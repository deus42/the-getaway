import Phaser from 'phaser';
import type { MapBuildingDefinition } from '../../interfaces/types';
import type { BuildingVisualProfile, VisualTheme } from '../contracts';

export class BuildingPainter {
  constructor(private readonly scene: Phaser.Scene, private readonly theme: VisualTheme) {}

  public createLabel(
    building: MapBuildingDefinition,
    center: { x: number; y: number },
    tileHeight: number,
    profile: BuildingVisualProfile
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(center.x, center.y - tileHeight * 0.2);

    const title = this.scene.add.text(0, 0, building.name, {
      fontFamily: 'Orbitron, "DM Sans", sans-serif',
      fontSize: this.theme.qualityBudget.enableHighDensityLabels ? '13px' : '11px',
      fontStyle: '700',
      color: profile.signagePrimaryHex,
      stroke: profile.signageSecondaryHex,
      strokeThickness: 1.8,
      align: 'center',
    });
    title.setOrigin(0.5);
    title.setShadow(0, 0, profile.glowHex, 10, true, true);

    const padX = 16;
    const padY = 10;
    const backdrop = this.scene.add.rectangle(
      0,
      0,
      title.width + padX,
      title.height + padY,
      Phaser.Display.Color.HexStringToColor(profile.backdropHex).color,
      0.62
    );
    backdrop.setStrokeStyle(1.2, Phaser.Display.Color.HexStringToColor(profile.signageSecondaryHex).color, 0.85);

    const accent = this.scene.add.rectangle(
      0,
      -title.height * 0.5 - 1,
      Math.max(28, title.width * 0.7),
      2,
      Phaser.Display.Color.HexStringToColor(profile.accentHex).color,
      0.9
    );

    container.add([backdrop, accent, title]);
    return container;
  }
}
