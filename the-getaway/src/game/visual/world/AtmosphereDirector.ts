import Phaser from 'phaser';
import type { VisualTheme } from '../contracts';

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
    const cycleRadians = ((input.timeSeconds % 180) / 180) * Math.PI * 2;
    const dayFactor = clamp01(0.5 + 0.5 * Math.sin(cycleRadians - Math.PI * 0.5));
    const nightFactor = 1 - dayFactor;

    const downtownSky = blendColor(0x143054, 0x0b1c3a, nightFactor * 0.45);
    const slumsSky = blendColor(0x3e2123, 0x211015, nightFactor * 0.42);
    const topBlend = blendColor(slumsSky, downtownSky, districtWeight);

    const gradientTopLeft = blendColor(topBlend, 0x060b15, 0.3 + nightFactor * 0.38);
    const gradientTopRight = blendColor(topBlend, 0x0c1930, 0.24 + districtWeight * 0.22 + nightFactor * 0.24);
    const gradientBottomLeft = blendColor(0x1a0f14, 0x0e2238, districtWeight * 0.58);
    const gradientBottomRight = blendColor(0x090d15, 0x122640, districtWeight * 0.62);

    const maxFogBands = Math.max(1, this.theme.qualityBudget.maxFogBands);
    const fogBands: AtmosphereFogBand[] = [];
    for (let band = 0; band < maxFogBands; band += 1) {
      const t = (band + 1) / (maxFogBands + 1);
      const color = blendColor(0x2a1e26, 0x173a5a, districtWeight * 0.7 + t * 0.2);
      const alpha = clamp01((0.16 + nightFactor * 0.12) * (1 - t * 0.72));
      fogBands.push({
        widthFactor: 1.1 + t * 0.95,
        heightFactor: 0.34 + t * 0.28,
        yFactor: 0.66 + t * 0.2,
        color,
        alpha,
      });
    }

    const emissiveIntensity = clamp01(
      0.28 + nightFactor * 0.56 + districtWeight * 0.12 + this.theme.qualityBudget.maxEmissiveZones * 0.012
    );
    const wetReflectionAlpha = clamp01(
      this.theme.qualityBudget.wetReflectionAlpha * (0.68 + nightFactor * 0.65)
    );

    const baseOverlay = parseRgba(input.baseOverlayRgba);
    const fallbackOverlayColor = blendColor(0x0b1220, 0x231118, 1 - districtWeight);
    const overlayColor = baseOverlay
      ? blendColor(baseOverlay.color, fallbackOverlayColor, 0.22 + nightFactor * 0.26)
      : fallbackOverlayColor;
    const overlayAlpha = clamp01(
      (baseOverlay?.alpha ?? 0.12 + nightFactor * 0.32) * (0.9 + nightFactor * 0.2)
    );

    return {
      gradientTopLeft,
      gradientTopRight,
      gradientBottomLeft,
      gradientBottomRight,
      skylineDowntownColor: blendColor(0x1f4f7a, 0x153a5e, nightFactor * 0.45),
      skylineSlumsColor: blendColor(0x5a2a2a, 0x3a1d24, nightFactor * 0.4),
      skylineColumns: this.theme.preset === 'cinematic' ? 34 : this.theme.preset === 'balanced' ? 30 : 24,
      skylineSplit: Phaser.Math.Clamp(0.24 + districtWeight * 0.52, 0.2, 0.82),
      skylineAlphaBase: 0.22 + nightFactor * 0.16,
      skylineAlphaVariance: 0.12,
      horizonGlowColor: blendColor(0x5d2835, 0x2d5b86, districtWeight),
      horizonGlowAlpha: 0.14 + nightFactor * 0.1,
      lowerHazeColor: blendColor(0x05070d, 0x0a101d, districtWeight * 0.4),
      lowerHazeAlpha: 0.42 + nightFactor * 0.2,
      fogBands,
      emissiveIntensity,
      wetReflectionAlpha,
      overlayColor,
      overlayAlpha,
    };
  }
}
