import { describe, expect, it } from '@jest/globals';
import { createPainterlyNoirTheme } from '../painterlyNoirTheme';

describe('painterly noir city composition', () => {
  it('opens Level 0 at a neighborhood-scale zoom', () => {
    const theme = createPainterlyNoirTheme('balanced');

    expect(theme.mapProfile.camera.minimumInitialZoom).toBe(0.8);
    expect(theme.mapProfile.showBuildingLabels).toBe(false);
    expect(theme.mapProfile.showBoundaryWalls).toBe(false);
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
