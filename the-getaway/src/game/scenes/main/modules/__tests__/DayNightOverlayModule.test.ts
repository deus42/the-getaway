jest.mock('phaser', () => ({
  __esModule: true,
  default: {},
}));

import { DayNightOverlayModule } from '../DayNightOverlayModule';

describe('DayNightOverlayModule', () => {
  it('uses a neutral combat overlay to prevent blackout while capping alpha', () => {
    const setFillStyle = jest.fn();
    const module = new DayNightOverlayModule({} as never, {
      add: {} as never,
      cameras: { main: { zoom: 1 } } as never,
      scale: { width: 960, height: 540 } as never,
      sys: { isActive: () => true } as never,
      getCurrentGameTime: () => 240,
      isInCombat: () => true,
      resolveAtmosphereProfile: () => ({
        overlayColor: 0x123456,
        overlayAlpha: 0.72,
      }),
      registerStaticDepth: jest.fn(),
    });
    (module as unknown as { overlay?: { setFillStyle: (...args: unknown[]) => void } }).overlay = {
      setFillStyle,
    };
    module.updateDayNightOverlay();

    expect(setFillStyle).toHaveBeenCalledWith(0xffffff, 0.28);
  });

  it('uses full atmosphere overlay alpha outside combat', () => {
    const setFillStyle = jest.fn();
    const module = new DayNightOverlayModule({} as never, {
      add: {} as never,
      cameras: { main: { zoom: 1 } } as never,
      scale: { width: 960, height: 540 } as never,
      sys: { isActive: () => true } as never,
      getCurrentGameTime: () => 240,
      isInCombat: () => false,
      resolveAtmosphereProfile: () => ({
        overlayColor: 0x654321,
        overlayAlpha: 0.36,
      }),
      registerStaticDepth: jest.fn(),
    });
    (module as unknown as { overlay?: { setFillStyle: (...args: unknown[]) => void } }).overlay = {
      setFillStyle,
    };
    module.updateDayNightOverlay();

    expect(setFillStyle).toHaveBeenCalledWith(0x654321, 0.36);
  });
});
