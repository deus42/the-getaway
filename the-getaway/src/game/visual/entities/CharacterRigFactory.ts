import Phaser from 'phaser';
import type { IsoObjectFactory, CharacterToken, CharacterTokenOptions } from '../../utils/IsoObjectFactory';
import type { EntityVisualRole, VisualTheme } from '../contracts';
import { adjustColor } from '../../utils/iso';

interface RigMotionState {
  lastX: number;
  lastY: number;
  cadence: number;
}

const resolveOptions = (theme: VisualTheme, role: EntityVisualRole): CharacterTokenOptions => {
  const profile = theme.entityProfiles[role];
  return {
    baseColor: profile.baseColor,
    outlineColor: profile.outlineColor,
    primaryColor: profile.primaryColor,
    accentColor: profile.accentColor,
    glowColor: profile.glowColor,
    columnHeight: profile.columnHeight,
    widthScale: profile.widthScale,
    heightScale: profile.heightScale,
    depthOffset: profile.depthOffset,
  };
};

export class CharacterRigFactory {
  private readonly motionByToken = new WeakMap<CharacterToken, RigMotionState>();

  constructor(
    private readonly isoFactory: IsoObjectFactory,
    private readonly theme: VisualTheme
  ) {}

  public createToken(role: EntityVisualRole, gridX: number, gridY: number): CharacterToken {
    const token = this.isoFactory.createCharacterToken(gridX, gridY, resolveOptions(this.theme, role));
    this.decorateToken(role, token);
    this.motionByToken.set(token, {
      lastX: gridX,
      lastY: gridY,
      cadence: (Math.abs(gridX * 17 + gridY * 31) % 11) * 0.23,
    });
    return token;
  }

  public positionToken(token: CharacterToken, gridX: number, gridY: number): void {
    this.isoFactory.positionCharacterToken(token, gridX, gridY);
    const motion = this.motionByToken.get(token);
    const shell = token.container.getData('rigShell') as Phaser.GameObjects.Graphics | undefined;
    const stride = token.container.getData('rigStride') as Phaser.GameObjects.Graphics | undefined;
    if (!motion || !shell || !stride) {
      return;
    }

    const deltaX = gridX - motion.lastX;
    const deltaY = gridY - motion.lastY;
    const hasMoved = deltaX !== 0 || deltaY !== 0;

    if (hasMoved) {
      motion.cadence += 0.55;
      const lean = Phaser.Math.Clamp(deltaX * 0.22, -0.24, 0.24);
      shell.setRotation(lean);
      token.container.scaleX = deltaX < 0 ? -1 : 1;
      stride.setAlpha(0.28 + Math.min(0.42, Math.abs(deltaX) * 0.2 + Math.abs(deltaY) * 0.2));
      stride.setScale(1 + Math.abs(deltaX) * 0.1, 1 + Math.abs(deltaY) * 0.08);
      token.halo.setAlpha(0.2 + Math.min(0.16, (Math.abs(deltaX) + Math.abs(deltaY)) * 0.08));
    } else {
      motion.cadence += 0.08;
      shell.setRotation(shell.rotation * 0.86);
      stride.setAlpha(Math.max(0.12, stride.alpha * 0.85));
      stride.setScale(
        Phaser.Math.Linear(stride.scaleX, 1, 0.25),
        Phaser.Math.Linear(stride.scaleY, 1, 0.25)
      );
      token.halo.setAlpha(Phaser.Math.Linear(token.halo.alpha, 0.2, 0.2));
    }

    shell.y = -2 + Math.sin(motion.cadence) * 1.8;
    token.beacon.y = -Math.sin(motion.cadence + 0.45) * 1.25;
    motion.lastX = gridX;
    motion.lastY = gridY;
  }

  private decorateToken(role: EntityVisualRole, token: CharacterToken): void {
    const profile = this.theme.entityProfiles[role];
    const shell = token.container.scene.add.graphics();
    const marker = token.container.scene.add.graphics();
    const stride = token.container.scene.add.graphics();
    const bodyWidth = 16 * profile.widthScale;
    const bodyHeight = 24 * profile.columnHeight * 0.64;

    shell.fillStyle(adjustColor(profile.primaryColor, -0.2), 0.9);
    shell.lineStyle(1.2, profile.outlineColor, 0.95);
    shell.fillEllipse(0, -bodyHeight * 0.3, bodyWidth, bodyHeight);
    shell.strokeEllipse(0, -bodyHeight * 0.3, bodyWidth, bodyHeight);

    marker.fillStyle(profile.accentColor, 0.94);
    marker.lineStyle(1, adjustColor(profile.accentColor, 0.35), 0.92);
    stride.fillStyle(profile.glowColor, 0.18);
    stride.fillEllipse(0, 2.5, 21 * profile.widthScale, 8.4 * profile.heightScale);
    stride.setBlendMode(Phaser.BlendModes.ADD);

    switch (role) {
      case 'player':
        shell.fillStyle(adjustColor(profile.accentColor, -0.15), 0.95);
        shell.fillTriangle(0, -bodyHeight * 1.08, -4.4, -bodyHeight * 0.64, 4.4, -bodyHeight * 0.64);
        marker.fillTriangle(0, -bodyHeight * 0.96, -3.4, -bodyHeight * 0.7, 3.4, -bodyHeight * 0.7);
        break;
      case 'hostileNpc':
        shell.fillStyle(adjustColor(profile.primaryColor, -0.34), 0.98);
        shell.fillRect(-bodyWidth * 0.55, -bodyHeight * 0.75, bodyWidth * 1.1, bodyHeight * 0.32);
        marker.fillTriangle(-4.5, -bodyHeight * 0.85, -8.2, -bodyHeight * 0.58, -2.2, -bodyHeight * 0.58);
        marker.fillTriangle(4.5, -bodyHeight * 0.85, 2.2, -bodyHeight * 0.58, 8.2, -bodyHeight * 0.58);
        break;
      case 'interactiveNpc':
        shell.fillStyle(adjustColor(profile.primaryColor, 0.08), 0.95);
        shell.fillEllipse(0, -bodyHeight * 0.86, bodyWidth * 0.88, bodyWidth * 0.72);
        marker.fillStyle(profile.accentColor, 0.9);
        marker.fillCircle(0, -bodyHeight * 1.02, 3.2);
        marker.fillRect(-0.8, -bodyHeight * 0.96, 1.6, 9.6);
        break;
      case 'friendlyNpc':
      default:
        shell.fillStyle(adjustColor(profile.primaryColor, 0.04), 0.92);
        shell.fillEllipse(0, -bodyHeight * 0.87, bodyWidth * 0.92, bodyWidth * 0.62);
        marker.fillTriangle(0, -bodyHeight * 0.96, -3.8, -bodyHeight * 0.78, 3.8, -bodyHeight * 0.78);
        break;
    }

    token.container.addAt(shell, 2);
    token.container.add(marker);
    token.container.add(stride);
    token.container.setData('rigShell', shell);
    token.container.setData('rigStride', stride);

    const pulseTween = token.container.scene.tweens.add({
      targets: marker,
      alpha: { from: 0.4, to: 0.95 },
      yoyo: true,
      repeat: -1,
      duration: 920 + (role === 'hostileNpc' ? 180 : 0),
      ease: 'Sine.easeInOut',
    });

    token.container.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (pulseTween.isPlaying()) {
        pulseTween.stop();
      }
    });
  }
}
