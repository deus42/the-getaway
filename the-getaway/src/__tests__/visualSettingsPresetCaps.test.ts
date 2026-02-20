import {
  getVisualFxBudgetForPreset,
  getVisualPresetCaps,
  type VisualPresetCaps,
} from '../game/settings/visualSettings';

type Preset = 'performance' | 'balanced' | 'cinematic';

const expectedCaps: Record<Preset, VisualPresetCaps> = {
  performance: {
    bloomStrengthCap: 0.18,
    vignetteCap: 0.22,
    colorMatrixEnabled: false,
    maxFogBands: 2,
    maxEmissiveZones: 6,
    wetReflectionAlpha: 0.08,
    occlusionFadeFloor: 0.56,
  },
  balanced: {
    bloomStrengthCap: 0.32,
    vignetteCap: 0.34,
    colorMatrixEnabled: true,
    maxFogBands: 4,
    maxEmissiveZones: 10,
    wetReflectionAlpha: 0.14,
    occlusionFadeFloor: 0.48,
  },
  cinematic: {
    bloomStrengthCap: 0.48,
    vignetteCap: 0.44,
    colorMatrixEnabled: true,
    maxFogBands: 6,
    maxEmissiveZones: 14,
    wetReflectionAlpha: 0.2,
    occlusionFadeFloor: 0.38,
  },
};

describe('visual settings preset caps', () => {
  const presets: Preset[] = ['performance', 'balanced', 'cinematic'];

  test.each(presets)('returns expected cap table for %s', (preset) => {
    expect(getVisualPresetCaps(preset)).toEqual(expectedCaps[preset]);
  });

  test.each(presets)('budget helper matches preset cap helper for %s', (preset) => {
    expect(getVisualFxBudgetForPreset(preset)).toEqual(getVisualPresetCaps(preset));
  });

  it('keeps readability guardrails across presets', () => {
    const performance = getVisualPresetCaps('performance');
    const balanced = getVisualPresetCaps('balanced');
    const cinematic = getVisualPresetCaps('cinematic');

    expect(performance.maxFogBands).toBeLessThan(balanced.maxFogBands);
    expect(balanced.maxFogBands).toBeLessThan(cinematic.maxFogBands);

    expect(performance.wetReflectionAlpha).toBeLessThan(balanced.wetReflectionAlpha);
    expect(balanced.wetReflectionAlpha).toBeLessThan(cinematic.wetReflectionAlpha);

    expect(performance.occlusionFadeFloor).toBeGreaterThan(balanced.occlusionFadeFloor);
    expect(balanced.occlusionFadeFloor).toBeGreaterThan(cinematic.occlusionFadeFloor);
  });
});
