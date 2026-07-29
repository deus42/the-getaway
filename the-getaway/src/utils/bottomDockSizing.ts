export const DEFAULT_DOCK_MIN_HEIGHT = 244;
export const DEFAULT_DOCK_MAX_HEIGHT = 304;
export const COMPACT_DOCK_BREAKPOINT = 1359;
export const COMPACT_DOCK_MAX_HEIGHT = 440;
export const COMPACT_DOCK_VIEWPORT_RATIO = 0.52;

const DEFAULT_DOCK_CHROME_HEIGHT = 33;
const DEFAULT_SURFACE_BORDER_HEIGHT = 2;

interface ResolveBottomDockHeightOptions {
  contentHeights: number[];
  dockChromeHeight?: number;
  minHeight?: number;
  maxHeight?: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export type BottomDockLayout = 'compact' | 'desktop';

export const resolveBottomDockLayout = (viewportWidth: number): BottomDockLayout =>
  viewportWidth <= COMPACT_DOCK_BREAKPOINT ? 'compact' : 'desktop';

export const resolveCompactDockHeight = (viewportHeight: number): number =>
  Math.round(Math.min(COMPACT_DOCK_MAX_HEIGHT, viewportHeight * COMPACT_DOCK_VIEWPORT_RATIO));

type BottomDockResizeTarget = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;

export const observeBottomDockViewportResizes = (
  windowTarget: BottomDockResizeTarget,
  visualViewportTarget: BottomDockResizeTarget | null | undefined,
  listener: EventListenerOrEventListenerObject
): (() => void) => {
  windowTarget.addEventListener('resize', listener);
  visualViewportTarget?.addEventListener('resize', listener);

  return () => {
    windowTarget.removeEventListener('resize', listener);
    visualViewportTarget?.removeEventListener('resize', listener);
  };
};

export const readBottomDockInsetPx = (
  ownerDocument: Document | undefined = typeof document === 'undefined' ? undefined : document
): number => {
  if (!ownerDocument) {
    return 0;
  }

  const dock = ownerDocument.querySelector<HTMLElement>('.hud-bottom-dock');
  const renderedHeight = dock?.getBoundingClientRect().height ?? 0;
  if (Number.isFinite(renderedHeight) && renderedHeight > 0) {
    return Math.round(renderedHeight);
  }

  const raw = ownerDocument.defaultView
    ?.getComputedStyle(ownerDocument.documentElement)
    .getPropertyValue('--bottom-panel-height') ?? '';
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

export const resolveBottomDockHeight = ({
  contentHeights,
  dockChromeHeight = DEFAULT_DOCK_CHROME_HEIGHT,
  minHeight = DEFAULT_DOCK_MIN_HEIGHT,
  maxHeight = DEFAULT_DOCK_MAX_HEIGHT,
}: ResolveBottomDockHeightOptions): number => {
  if (contentHeights.length === 0) {
    return minHeight;
  }

  const tallestContent = Math.max(...contentHeights);
  return clamp(Math.round(tallestContent + dockChromeHeight), minHeight, maxHeight);
};

const measureSurfaceContentHeight = (surface: HTMLElement): number => {
  const borderHeight =
    Math.round(surface.getBoundingClientRect().height) - surface.clientHeight;
  return Math.max(surface.scrollHeight, surface.clientHeight) + Math.max(borderHeight, DEFAULT_SURFACE_BORDER_HEIGHT);
};

interface MeasureBottomDockHeightOptions {
  viewportWidth?: number;
  viewportHeight?: number;
}

export const measureBottomDockHeight = (
  dock: HTMLElement,
  options: MeasureBottomDockHeightOptions = {}
): number => {
  const viewportWidth = options.viewportWidth ?? (typeof window === 'undefined' ? 1920 : window.innerWidth);
  const viewportHeight = options.viewportHeight ?? (typeof window === 'undefined' ? 1080 : window.innerHeight);
  if (resolveBottomDockLayout(viewportWidth) === 'compact') {
    const renderedHeight = Math.round(dock.getBoundingClientRect().height);
    return renderedHeight > 0 ? renderedHeight : resolveCompactDockHeight(viewportHeight);
  }

  const laneHeights = Array.from(
    dock.querySelectorAll<HTMLElement>('.hud-bottom-lane')
  )
    .map((lane) => Math.round(lane.getBoundingClientRect().height))
    .filter((height) => height > 0);
  const surfaceHeights = Array.from(
    dock.querySelectorAll<HTMLElement>('.hud-bottom-card-surface')
  )
    .map(measureSurfaceContentHeight)
    .filter((height) => height > 0);

  const dockHeight = Math.round(dock.getBoundingClientRect().height);
  const dockChromeHeight = laneHeights.length > 0
    ? Math.max(0, dockHeight - Math.min(...laneHeights))
    : DEFAULT_DOCK_CHROME_HEIGHT;

  return resolveBottomDockHeight({
    contentHeights: surfaceHeights,
    dockChromeHeight,
  });
};
