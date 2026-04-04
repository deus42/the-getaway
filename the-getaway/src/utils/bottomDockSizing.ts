export const DEFAULT_DOCK_MIN_HEIGHT = 244;
export const DEFAULT_DOCK_MAX_HEIGHT = 304;

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

export const measureBottomDockHeight = (dock: HTMLElement): number => {
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
