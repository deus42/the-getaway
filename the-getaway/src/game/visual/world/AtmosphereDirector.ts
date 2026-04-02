import Phaser from 'phaser';
import type { VisualTheme } from '../contracts';
import { getCurrentLightLevel, getCurrentTimeOfDay } from '../../world/dayNightCycle';

export interface AtmosphereResolutionInput {
  districtWeight: number;
  timeSeconds: number;
  baseOverlayRgba?: string;
}

export interface AtmosphereFogBand {
  widthFactor: number;
  heightFactor: number;
  yFactor: number;
  color: number;
  alpha: number;
}

export interface AtmosphereProfile {
  gradientTopLeft: number;
  gradientTopRight: number;
  gradientBottomLeft: number;
  gradientBottomRight: number;
  skylineDowntownColor: number;
  skylineSlumsColor: number;
  skylineColumns: number;
  skylineSplit: number;
  skylineAlphaBase: number;
  skylineAlphaVariance: number;
  horizonGlowColor: number;
  horizonGlowAlpha: number;
  lowerHazeColor: number;
  lowerHazeAlpha: number;
  fogBands: AtmosphereFogBand[];
  emissiveIntensity: number;
  wetReflectionAlpha: number;
  overlayColor: number;
  overlayAlpha: number;
}

const clamp01 = (value: number): number => Phaser.Math.Clamp(value, 0, 1);

const blendColor = (fromColor: number, toColor: number, amount: number): number => {
  const from = Phaser.Display.Color.ValueToColor(fromColor);
  const to = Phaser.Display.Color.ValueToColor(toColor);
  const t = clamp01(amount);
  const r = Phaser.Math.Linear(from.red, to.red, t);
  const g = Phaser.Math.Linear(from.green, to.green, t);
  const b = Phaser.Math.Linear(from.blue, to.blue, t);
  return Phaser.Display.Color.GetColor(r, g, b);
};

const parseRgba = (
  rgba?: string
): { color: number; alpha: number } | null => {
  if (!rgba) {
    return null;
  }

  const match = rgba.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/i);
  if (!match) {
    return null;
  }

  const [, r, g, b, a] = match;
  return {
    color: Phaser.Display.Color.GetColor(Number(r), Number(g), Number(b)),
    alpha: clamp01(Number(a)),
  };
};

export class AtmosphereDirector {
  constructor(private readonly theme: VisualTheme) {}

  public resolveAtmosphereProfile(input: AtmosphereResolutionInput): AtmosphereProfile {
    const districtWeight = clamp01(input.districtWeight);
    const phase = getCurrentTimeOfDay(input.timeSeconds);
    const lightLevel = clamp01(getCurrentLightLevel(input.timeSeconds));
    const darkness = clamp01(1 - lightLevel);
    const duskWeight = phase === 'evening' ? 1 : phase === 'morning' ? 0.34 : 0;
    const dayWeight = phase === 'day' ? 1 : phase === 'morning' ? 0.58 : 0;
    const nightWeight = phase === 'night'
      ? 1
      : phase === 'evening'
        ? clamp01(0.46 + darkness * 0.4)
        : phase === 'morning'
          ? clamp01(darkness * 0.22)
          : clamp01(darkness * 0.12);
    const streetLift = clamp01(0.16 + districtWeight * 0.1 + dayWeight * 0.16 + duskWeight * 0.08);

    const downtownSky = blendColor(0x7c96b2, 0x0b1933, nightWeight * 0.72);
    const slumsSky = blendColor(0x876a58, 0x1d0f17, nightWeight * 0.68 + duskWeight * 0.14);
    const topBlend = blendColor(slumsSky, downtownSky, districtWeight);

    const gradientTopLeft = blendColor(topBlend, 0x6d86a3, 0.1 + dayWeight * 0.22 + nightWeight * 0.08);
    const gradientTopRight = blendColor(topBlend, 0x7490b1, 0.12 + districtWeight * 0.12 + dayWeight * 0.26 + nightWeight * 0.1);
    const gradientBottomLeft = blendColor(0x3a2b31, 0x355373, 0.28 + districtWeight * 0.36 + streetLift * 0.18);
    const gradientBottomRight = blendColor(0x1a2433, 0x3b6289, 0.24 + districtWeight * 0.4 + streetLift * 0.2);

    const maxFogBands = Math.max(1, this.theme.qualityBudget.maxFogBands);
    const fogBands: AtmosphereFogBand[] = [];
    for (let band = 0; band < maxFogBands; band += 1) {
      const t = (band + 1) / (maxFogBands + 1);
      const color = blendColor(0x3d2a31, 0x1b4667, districtWeight * 0.7 + t * 0.2);
      const alpha = clamp01((0.06 + nightWeight * 0.1 + duskWeight * 0.04 + dayWeight * 0.03) * (1 - t * 0.72));
      fogBands.push({
        widthFactor: 1.18 + t * 1.05,
        heightFactor: 0.28 + t * 0.24,
        yFactor: 0.54 + t * 0.22,
        color,
        alpha,
      });
    }

    const emissiveIntensity = clamp01(
      0.24 + darkness * 0.4 + districtWeight * 0.08 + duskWeight * 0.08 + this.theme.qualityBudget.maxEmissiveZones * 0.008
    );
    const wetReflectionAlpha = clamp01(
      this.theme.qualityBudget.wetReflectionAlpha * (0.55 + darkness * 0.78 + duskWeight * 0.12)
    );

    const baseOverlay = parseRgba(input.baseOverlayRgba);
    const fallbackOverlayColor = blendColor(0x1a2236, 0x28131b, 1 - districtWeight);
    const overlayColor = baseOverlay
      ? blendColor(baseOverlay.color, fallbackOverlayColor, 0.1 + nightWeight * 0.18 + duskWeight * 0.08)
      : fallbackOverlayColor;
    const overlayBaseAlpha = baseOverlay
      ? baseOverlay.alpha
      : 0.02 + darkness * 0.18 + duskWeight * 0.05;
    const overlayAlpha = clamp01(
      overlayBaseAlpha * (0.62 + darkness * 0.18 + duskWeight * 0.1)
    );

    return {
      gradientTopLeft,
      gradientTopRight,
      gradientBottomLeft,
      gradientBottomRight,
      skylineDowntownColor: blendColor(0x6d8dac, 0x153457, nightWeight * 0.5),
      skylineSlumsColor: blendColor(0x845848, 0x3a1d24, nightWeight * 0.42),
      skylineColumns: this.theme.preset === 'cinematic' ? 36 : this.theme.preset === 'balanced' ? 32 : 26,
      skylineSplit: Phaser.Math.Clamp(0.24 + districtWeight * 0.52, 0.2, 0.82),
      skylineAlphaBase: 0.18 + dayWeight * 0.06 + nightWeight * 0.08 + duskWeight * 0.03,
      skylineAlphaVariance: 0.08,
      horizonGlowColor: blendColor(0x845038, 0x2c6494, districtWeight),
      horizonGlowAlpha: 0.16 + dayWeight * 0.05 + duskWeight * 0.14 + nightWeight * 0.04,
      lowerHazeColor: blendColor(0x2e3d4e, 0x101623, districtWeight * 0.45),
      lowerHazeAlpha: 0.26 + nightWeight * 0.14 + streetLift * 0.12,
      fogBands,
      emissiveIntensity,
      wetReflectionAlpha,
      overlayColor,
      overlayAlpha,
    };
  }
}
