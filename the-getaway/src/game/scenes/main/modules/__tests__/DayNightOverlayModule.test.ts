jest.mock('phaser', () => ({
  __esModule: true,
  default: {},
}));

import { DayNightOverlayModule } from '../DayNightOverlayModule';

describe('DayNightOverlayModule', () => {
  it('uses a neutral combat overlay to prevent blackout while capping alpha', () => {
    const setFillStyle = jest.fn();
    const scene = {
      inCombat: true,
      currentGameTime: 240,
      dayNightOverlay: {
        setFillStyle,
      },
      resolveAtmosphereProfile: () => ({
        overlayColor: 0x123456,
        overlayAlpha: 0.72,
      }),
    };

    const module = new DayNightOverlayModule(scene as never);
    module.updateDayNightOverlay();

    expect(setFillStyle).toHaveBeenCalledWith(0xffffff, 0.28);
  });

  it('uses full atmosphere overlay alpha outside combat', () => {
    const setFillStyle = jest.fn();
    const scene = {
      inCombat: false,
      currentGameTime: 240,
      dayNightOverlay: {
        setFillStyle,
      },
      resolveAtmosphereProfile: () => ({
        overlayColor: 0x654321,
        overlayAlpha: 0.36,
      }),
    };

    const module = new DayNightOverlayModule(scene as never);
    module.updateDayNightOverlay();

    expect(setFillStyle).toHaveBeenCalledWith(0x654321, 0.36);
  });
});
