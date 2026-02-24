import Phaser from 'phaser';
import { CameraAlertState } from '../interfaces/types';

interface CameraSpriteOptions {
  tileSize: number;
  rangeTiles: number;
  fieldOfView: number;
  initialDirection: number;
}

const DEGREE_TO_RAD = Phaser.Math.DEG_TO_RAD;

const ALERT_COLORS: Record<CameraAlertState, { fill: number; alpha: number }> = {
  [CameraAlertState.IDLE]: { fill: 0x3b82f6, alpha: 0.15 },
  [CameraAlertState.SUSPICIOUS]: { fill: 0xfacc15, alpha: 0.22 },
  [CameraAlertState.INVESTIGATING]: { fill: 0xf97316, alpha: 0.26 },
  [CameraAlertState.ALARMED]: { fill: 0xef4444, alpha: 0.3 },
  [CameraAlertState.DISABLED]: { fill: 0x64748b, alpha: 0.12 },
};

export class CameraSprite extends Phaser.GameObjects.Container {
  private housing: Phaser.GameObjects.Rectangle;
  private lens: Phaser.GameObjects.Ellipse;
  private led: Phaser.GameObjects.Arc;
  private cone: Phaser.GameObjects.Graphics;
  private ledTween: Phaser.Tweens.Tween | null = null;
  private rangePixels: number;
  private fieldOfView: number;
  private direction: number;
  private tileSize: number;
  private isActiveSprite = false;
  private alertState: CameraAlertState = CameraAlertState.DISABLED;
  private overlayVisible = false;

  constructor(scene: Phaser.Scene, x: number, y: number, options: CameraSpriteOptions) {
    super(scene, x, y);

    const { tileSize, rangeTiles, fieldOfView, initialDirection } = options;

    this.tileSize = tileSize;
    this.fieldOfView = fieldOfView;
    this.direction = initialDirection;
    this.rangePixels = rangeTiles * tileSize;

    this.housing = scene.add.rectangle(0, 0, tileSize * 0.5, tileSize * 0.35, 0x333333, 1);
    this.housing.setOrigin(0.5, 0.5);

    this.lens = scene.add.ellipse(tileSize * 0.15, 0, tileSize * 0.22, tileSize * 0.16, 0x000000, 1);
    this.lens.setStrokeStyle(1, 0x1f2937, 0.6);

    this.led = scene.add.circle(-tileSize * 0.18, -tileSize * 0.08, tileSize * 0.12, 0xff0000, 1);
    this.led.setAlpha(0);

    this.cone = scene.add.graphics();
    this.cone.setAlpha(0);
    this.cone.setDepth(-1);

    this.add([this.cone, this.housing, this.lens, this.led]);
    this.setSize(tileSize, tileSize);

    this.scene.add.existing(this);

    this.drawVisionCone();
    this.setAlertState(CameraAlertState.DISABLED);
  }

  public setActiveState(active: boolean): void {
    if (this.isActiveSprite === active) {
      return;
    }

    this.isActiveSprite = active;

    if (active) {
      if (this.ledTween) {
        this.ledTween.resume();
      } else {
        this.ledTween = this.scene.tweens.add({
          targets: this.led,
          alpha: { from: 1, to: 0.3 },
          duration: 1000,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        });
      }

    } else {
      if (this.ledTween) {
        this.ledTween.pause();
      }
      this.led.setAlpha(0);
    }

    this.refreshConeAlpha();
  }

  public setAlertState(state: CameraAlertState): void {
    this.alertState = state;
    const { fill } = ALERT_COLORS[state];

    this.drawVisionCone(fill);

    if (this.isActiveSprite && state !== CameraAlertState.DISABLED) {
      const ledColor = state === CameraAlertState.ALARMED
        ? 0xff4d4f
        : state === CameraAlertState.INVESTIGATING
        ? 0xf97316
        : state === CameraAlertState.SUSPICIOUS
        ? 0xfacc15
        : 0x22d3ee;
      this.led.setFillStyle(ledColor, 1);
    } else if (state === CameraAlertState.DISABLED) {
      this.led.setFillStyle(0x64748b, 0.8);
    }

    this.refreshConeAlpha();
  }

  public setDirection(angleDegrees: number): void {
    this.direction = angleDegrees;
    this.drawVisionCone();
    this.refreshConeAlpha();
  }

  public setRangeTiles(rangeTiles: number): void {
    this.rangePixels = rangeTiles * this.tileSize;
    this.drawVisionCone();
    this.refreshConeAlpha();
  }

  public updateVision(originWorld: { x: number; y: number }): void {
    this.cone.setPosition(originWorld.x - this.x, originWorld.y - this.y);
  }

  public setOverlayVisible(visible: boolean): void {
    if (this.overlayVisible === visible) {
      return;
    }
    this.overlayVisible = visible;
    this.refreshConeAlpha();
  }

  public destroy(fromScene?: boolean): void {
    if (this.ledTween) {
      this.ledTween.stop();
      this.ledTween.remove();
      this.ledTween = null;
    }
    super.destroy(fromScene);
  }

  private drawVisionCone(overrideColor?: number): void {
    const color = overrideColor ?? ALERT_COLORS[this.alertState].fill;
    this.cone.clear();

    const startAngle = (this.direction - this.fieldOfView / 2) * DEGREE_TO_RAD;
    const endAngle = (this.direction + this.fieldOfView / 2) * DEGREE_TO_RAD;

    this.cone.fillStyle(color, ALERT_COLORS[this.alertState].alpha);
    this.cone.slice(0, 0, this.rangePixels, startAngle, endAngle, false);
    this.cone.fillPath();

    this.cone.lineStyle(1.2, color, Math.min(0.65, ALERT_COLORS[this.alertState].alpha + 0.1));
    this.cone.beginPath();
    this.cone.moveTo(0, 0);
    this.cone.arc(0, 0, this.rangePixels, startAngle, endAngle, false);
    this.cone.closePath();
    this.cone.strokePath();
  }

  private refreshConeAlpha(): void {
    const canShow = this.isActiveSprite && this.overlayVisible && this.alertState !== CameraAlertState.DISABLED;
    const alpha = canShow ? ALERT_COLORS[this.alertState].alpha : 0;
    this.cone.setAlpha(alpha);
  }
}

export default CameraSprite;
