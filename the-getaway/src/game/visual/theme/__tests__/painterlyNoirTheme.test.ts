import { describe, expect, it } from '@jest/globals';
import { PAINTERLY_MIN_INITIAL_ZOOM, createPainterlyNoirTheme } from '../painterlyNoirTheme';

describe('painterly noir city composition', () => {
  it('opens Level 0 at the owner-tuned street-tactical zoom', () => {
    const theme = createPainterlyNoirTheme('balanced');

    expect(theme.mapProfile.camera.minimumInitialZoom).toBe(PAINTERLY_MIN_INITIAL_ZOOM);
    // Guard against accidental regressions to overview-scale openings; the
    // exact value is owner taste, retuned via ?initialZoom before edits.
    expect(PAINTERLY_MIN_INITIAL_ZOOM).toBeGreaterThanOrEqual(0.95);
    expect(theme.mapProfile.showBuildingLabels).toBe(false);
    expect(theme.mapProfile.showBoundaryWalls).toBe(false);
    expect(theme.mapProfile.citySurround).toBeDefined();
    expect(theme.mapProfile.backdropStyle).toBe('surround-fade');
  });

  it('keeps crosswalk pavement dark and uses restrained macro variation', () => {
    const theme = createPainterlyNoirTheme('balanced');

    expect(theme.surfacePalettes.crosswalkEven).toBe(0x202124);
    expect(theme.surfacePalettes.crosswalkOdd).toBe(0x1f2023);
    expect(theme.treatment.surface.variation).toBeLessThanOrEqual(0.05);
    expect(theme.treatment.grid.majorLineInterval).toBe(8);
    expect(theme.treatment.grid.majorLineAlpha).toBeLessThanOrEqual(0.05);
  });
});
