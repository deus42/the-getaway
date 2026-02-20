jest.mock('phaser', () => {
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
  const linear = (from: number, to: number, t: number) => from + (to - from) * t;
  const toColor = (value: number) => ({
    red: (value >> 16) & 0xff,
    green: (value >> 8) & 0xff,
    blue: value & 0xff,
  });
  const getColor = (red: number, green: number, blue: number) =>
    ((Math.round(red) & 0xff) << 16) |
    ((Math.round(green) & 0xff) << 8) |
    (Math.round(blue) & 0xff);

  const phaser = {
    Math: {
      Clamp: clamp,
      Linear: linear,
    },
    Display: {
      Color: {
        ValueToColor: toColor,
        GetColor: getColor,
      },
    },
  };

  return {
    __esModule: true,
    default: phaser,
    ...phaser,
  };
});

import type { VisualQualityPreset } from '../game/visual/contracts';
import { createNoirVectorTheme } from '../game/visual/theme/noirVectorTheme';
import { AtmosphereDirector } from '../game/visual/world/AtmosphereDirector';

const PRESETS: VisualQualityPreset[] = ['performance', 'balanced', 'cinematic'];

describe('AtmosphereDirector', () => {
  test.each(PRESETS)('resolves bounded profile for %s preset', (preset) => {
    const theme = createNoirVectorTheme(preset);
    const director = new AtmosphereDirector(theme);
    const profile = director.resolveAtmosphereProfile({
      districtWeight: 0.62,
      timeSeconds: 120,
      baseOverlayRgba: 'rgba(20, 40, 80, 0.3)',
    });

    expect(profile.fogBands).toHaveLength(theme.qualityBudget.maxFogBands);
    profile.fogBands.forEach((band) => {
      expect(band.alpha).toBeGreaterThanOrEqual(0);
      expect(band.alpha).toBeLessThanOrEqual(1);
      expect(band.widthFactor).toBeGreaterThan(1);
      expect(band.heightFactor).toBeGreaterThan(0);
    });

    expect(profile.emissiveIntensity).toBeGreaterThanOrEqual(0);
    expect(profile.emissiveIntensity).toBeLessThanOrEqual(1);
    expect(profile.wetReflectionAlpha).toBeGreaterThanOrEqual(0);
    expect(profile.wetReflectionAlpha).toBeLessThanOrEqual(1);
    expect(profile.overlayAlpha).toBeGreaterThanOrEqual(0);
    expect(profile.overlayAlpha).toBeLessThanOrEqual(1);
  });

  it('increases emissive and wet reflections at night', () => {
    const director = new AtmosphereDirector(createNoirVectorTheme('balanced'));
    const dayProfile = director.resolveAtmosphereProfile({
      districtWeight: 0.5,
      timeSeconds: 90,
    });
    const nightProfile = director.resolveAtmosphereProfile({
      districtWeight: 0.5,
      timeSeconds: 0,
    });

    expect(nightProfile.emissiveIntensity).toBeGreaterThan(dayProfile.emissiveIntensity);
    expect(nightProfile.wetReflectionAlpha).toBeGreaterThan(dayProfile.wetReflectionAlpha);
    expect(nightProfile.overlayAlpha).toBeGreaterThan(dayProfile.overlayAlpha);
  });

  it('falls back to default overlay parsing when rgba input is invalid', () => {
    const director = new AtmosphereDirector(createNoirVectorTheme('balanced'));
    const withInvalidOverlay = director.resolveAtmosphereProfile({
      districtWeight: 0.3,
      timeSeconds: 45,
      baseOverlayRgba: 'not-an-rgba',
    });
    const withNoOverlay = director.resolveAtmosphereProfile({
      districtWeight: 0.3,
      timeSeconds: 45,
    });

    expect(withInvalidOverlay.overlayColor).toBe(withNoOverlay.overlayColor);
    expect(withInvalidOverlay.overlayAlpha).toBeCloseTo(withNoOverlay.overlayAlpha, 6);
  });
});
