import {
  DEFAULT_DOCK_MAX_HEIGHT,
  DEFAULT_DOCK_MIN_HEIGHT,
  measureBottomDockHeight,
  resolveBottomDockHeight,
} from '../utils/bottomDockSizing';

const createRect = (height: number): DOMRect =>
  ({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: height,
    width: 0,
    height,
    toJSON: () => ({}),
  } as DOMRect);

const setElementHeights = (
  element: HTMLElement,
  {
    rectHeight,
    clientHeight,
    scrollHeight,
  }: {
    rectHeight: number;
    clientHeight: number;
    scrollHeight: number;
  }
) => {
  Object.defineProperty(element, 'clientHeight', {
    configurable: true,
    get: () => clientHeight,
  });
  Object.defineProperty(element, 'scrollHeight', {
    configurable: true,
    get: () => scrollHeight,
  });
  element.getBoundingClientRect = jest.fn(() => createRect(rectHeight));
};

describe('bottomDockSizing', () => {
  test('keeps a compact minimum height when content is short', () => {
    expect(
      resolveBottomDockHeight({
        contentHeights: [120, 140, 136],
      })
    ).toBe(DEFAULT_DOCK_MIN_HEIGHT);
  });

  test('grows to fit the tallest lane content before clamping', () => {
    expect(
      resolveBottomDockHeight({
        contentHeights: [188, 212, 193],
        dockChromeHeight: 33,
      })
    ).toBe(245);
  });

  test('caps the dock height at the configured maximum', () => {
    expect(
      resolveBottomDockHeight({
        contentHeights: [400],
        dockChromeHeight: 33,
      })
    ).toBe(DEFAULT_DOCK_MAX_HEIGHT);
  });

  test('measures dock height from live lane content demand instead of clipped lane boxes', () => {
    const dock = document.createElement('div');
    dock.className = 'hud-bottom-dock';
    dock.getBoundingClientRect = jest.fn(() => createRect(228));

    const laneHeights = [195, 195, 195, 195];
    const surfaceHeights = [
      { rectHeight: 193, clientHeight: 193, scrollHeight: 193 },
      { rectHeight: 193, clientHeight: 193, scrollHeight: 210 },
      { rectHeight: 193, clientHeight: 193, scrollHeight: 193 },
      { rectHeight: 193, clientHeight: 193, scrollHeight: 193 },
    ];

    laneHeights.forEach((laneHeight, index) => {
      const lane = document.createElement('div');
      lane.className = 'hud-bottom-lane';
      lane.getBoundingClientRect = jest.fn(() => createRect(laneHeight));

      const surface = document.createElement('div');
      surface.className = 'hud-bottom-card-surface';
      setElementHeights(surface, surfaceHeights[index]);

      lane.appendChild(surface);
      dock.appendChild(lane);
    });

    expect(measureBottomDockHeight(dock)).toBe(245);
  });
});
