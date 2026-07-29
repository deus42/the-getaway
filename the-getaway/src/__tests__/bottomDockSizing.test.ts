import {
  COMPACT_DOCK_BREAKPOINT,
  COMPACT_DOCK_MAX_HEIGHT,
  DEFAULT_DOCK_MAX_HEIGHT,
  DEFAULT_DOCK_MIN_HEIGHT,
  observeBottomDockViewportResizes,
  measureBottomDockHeight,
  readBottomDockInsetPx,
  resolveBottomDockLayout,
  resolveCompactDockHeight,
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
  test('switches to a two-row compact layout only below the desktop threshold', () => {
    expect(resolveBottomDockLayout(1025)).toBe('compact');
    expect(resolveBottomDockLayout(1280)).toBe('compact');
    expect(resolveBottomDockLayout(COMPACT_DOCK_BREAKPOINT)).toBe('compact');
    expect(resolveBottomDockLayout(COMPACT_DOCK_BREAKPOINT + 1)).toBe('desktop');
  });

  test('caps compact dock height while respecting short landscape viewports', () => {
    expect(resolveCompactDockHeight(1195)).toBe(COMPACT_DOCK_MAX_HEIGHT);
    expect(resolveCompactDockHeight(768)).toBe(399);
  });

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

    expect(
      measureBottomDockHeight(dock, {
        viewportWidth: 1440,
        viewportHeight: 900,
      })
    ).toBe(245);
  });

  test('publishes the actual two-row dock rectangle in compact mode', () => {
    const dock = document.createElement('div');
    dock.className = 'hud-bottom-dock';
    dock.getBoundingClientRect = jest.fn(() => createRect(440));

    expect(
      measureBottomDockHeight(dock, {
        viewportWidth: 804,
        viewportHeight: 1195,
      })
    ).toBe(440);
  });

  test('remeasures for visual-viewport resizes as well as window resizes', () => {
    const windowTarget = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    const visualViewportTarget = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    const listener = jest.fn();

    const cleanup = observeBottomDockViewportResizes(
      windowTarget,
      visualViewportTarget,
      listener
    );

    expect(windowTarget.addEventListener).toHaveBeenCalledWith('resize', listener);
    expect(visualViewportTarget.addEventListener).toHaveBeenCalledWith('resize', listener);

    cleanup();

    expect(windowTarget.removeEventListener).toHaveBeenCalledWith('resize', listener);
    expect(visualViewportTarget.removeEventListener).toHaveBeenCalledWith('resize', listener);
  });

  test('reads the rendered dock instead of a stale published CSS value', () => {
    const dock = document.createElement('div');
    dock.className = 'hud-bottom-dock';
    dock.getBoundingClientRect = jest.fn(() => createRect(374.4));
    document.body.appendChild(dock);
    document.documentElement.style.setProperty('--bottom-panel-height', '245px');

    expect(readBottomDockInsetPx(document)).toBe(374);

    dock.remove();
    document.documentElement.style.removeProperty('--bottom-panel-height');
  });

  test('falls back to the numeric CSS value before the dock mounts', () => {
    document.documentElement.style.setProperty('--bottom-panel-height', '245px');

    expect(readBottomDockInsetPx(document)).toBe(245);

    document.documentElement.style.removeProperty('--bottom-panel-height');
  });
});
