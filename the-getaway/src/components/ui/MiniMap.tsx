import React, { useCallback, useEffect, useRef, useState } from "react";
import { CameraAlertState } from "../../game/interfaces/types";
import {
  MINIMAP_STATE_EVENT,
  MINIMAP_VIEWPORT_CLICK_EVENT,
  MiniMapRenderState,
  MiniMapEntityDetail,
  MiniMapCameraDetail,
} from "../../game/events";
import { miniMapService } from "../../game/services/miniMapService";
import { HUD_ICON, HUD_GRID_UNIT } from "../../styles/hudTokens";

const TILE_COLORS: Record<string, string> = {
  floor: "#101b32",
  wall: "#1f2937",
  door: "#fbbf24",
  cover: "#1d4ed8",
  water: "#0ea5e9",
  trap: "#7c3aed",
  default: "#101b32",
};

const ENTITY_COLORS: Record<MiniMapEntityDetail["kind"], string> = {
  player: "#60a5fa",
  enemy: "#f87171",
  npc: "#34d399",
  objective: "#facc15",
};

const CAMERA_COLORS: Record<CameraAlertState, string> = {
  [CameraAlertState.IDLE]: "#38bdf8",
  [CameraAlertState.SUSPICIOUS]: "#fbbf24",
  [CameraAlertState.INVESTIGATING]: "#f97316",
  [CameraAlertState.ALARMED]: "#ef4444",
  [CameraAlertState.DISABLED]: "#64748b",
};

const ICON_STROKE_WIDTH: number = HUD_ICON.stroke;
const ICON_MAX_RADIUS: number = HUD_ICON.liveArea / 2;
const HUD_SURFACE_FALLBACK = "rgba(15, 23, 42, 0.95)";
const HUD_RADIUS_FALLBACK = 16;
const DEFAULT_MINIMAP_WIDTH = 256;
const DEFAULT_MINIMAP_HEIGHT = 192;
const MIN_MINIMAP_WIDTH = 192;
const MIN_MINIMAP_HEIGHT = 160;

const resolveCssVar = (variable: string, fallback: string): string => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return fallback;
  }
  try {
    const computed = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue(variable);
    return computed?.trim() || fallback;
  } catch {
    return fallback;
  }
};

const resolveHudSurfaceColor = (): string =>
  resolveCssVar("--color-hud-surface", HUD_SURFACE_FALLBACK);
const resolveHudRadius = (): number => {
  const raw = resolveCssVar("--hud-radius-lg", `${HUD_RADIUS_FALLBACK}px`);
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : HUD_RADIUS_FALLBACK;
};

interface DrawContext {
  ctx: CanvasRenderingContext2D;
  state: MiniMapRenderState;
  scale: number;
  crop: CropBounds;
}

interface ViewportSize {
  width: number;
  height: number;
}

interface CropBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

const createDefaultCrop = (state: MiniMapRenderState): CropBounds => ({
  minX: 0,
  minY: 0,
  maxX: Math.max(0, state.mapWidth - 1),
  maxY: Math.max(0, state.mapHeight - 1),
  width: Math.max(1, state.mapWidth),
  height: Math.max(1, state.mapHeight),
});

const isBoundaryTile = (
  tile: MiniMapRenderState["tiles"][number][number]
): boolean => {
  if (!tile) {
    return false;
  }
  const type = tile.type?.toString().toLowerCase() ?? "";
  if (type === "wall" || type === "door" || type === "cover") {
    return true;
  }
  return tile.isWalkable === false;
};

const computeWallCrop = (state: MiniMapRenderState): CropBounds => {
  const tiles = state.tiles;
  if (!tiles.length || !tiles[0]?.length) {
    return createDefaultCrop(state);
  }

  const clampValue = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const findBoundaryFromLeft = (
    row: MiniMapRenderState["tiles"][number]
  ): number => {
    if (!row) {
      return -1;
    }
    for (let x = 0; x < row.length; x += 1) {
      if (isBoundaryTile(row[x])) {
        return x;
      }
    }
    return -1;
  };

  const findBoundaryFromRight = (
    row: MiniMapRenderState["tiles"][number]
  ): number => {
    if (!row) {
      return -1;
    }
    for (let x = row.length - 1; x >= 0; x -= 1) {
      if (isBoundaryTile(row[x])) {
        return x;
      }
    }
    return -1;
  };

  const findBoundaryFromTop = (columnIndex: number): number => {
    for (let y = 0; y < tiles.length; y += 1) {
      const row = tiles[y];
      if (row && isBoundaryTile(row[columnIndex])) {
        return y;
      }
    }
    return -1;
  };

  const findBoundaryFromBottom = (columnIndex: number): number => {
    for (let y = tiles.length - 1; y >= 0; y -= 1) {
      const row = tiles[y];
      if (row && isBoundaryTile(row[columnIndex])) {
        return y;
      }
    }
    return -1;
  };

  let left = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  for (let y = 0; y < tiles.length; y += 1) {
    const row = tiles[y];
    const leftBoundary = findBoundaryFromLeft(row);
    if (leftBoundary !== -1 && leftBoundary < left) {
      left = leftBoundary;
    }
    const rightBoundary = findBoundaryFromRight(row);
    if (rightBoundary !== -1 && rightBoundary > right) {
      right = rightBoundary;
    }
  }

  for (let x = 0; x < state.mapWidth; x += 1) {
    const topBoundary = findBoundaryFromTop(x);
    if (topBoundary !== -1 && topBoundary < top) {
      top = topBoundary;
    }
    const bottomBoundary = findBoundaryFromBottom(x);
    if (bottomBoundary !== -1 && bottomBoundary > bottom) {
      bottom = bottomBoundary;
    }
  }

  if (
    !Number.isFinite(left) ||
    !Number.isFinite(right) ||
    !Number.isFinite(top) ||
    !Number.isFinite(bottom)
  ) {
    return createDefaultCrop(state);
  }

  const safeMinX = clampValue(left, 0, Math.max(0, state.mapWidth - 1));
  const safeMaxX = clampValue(right, safeMinX, Math.max(0, state.mapWidth - 1));
  const safeMinY = clampValue(top, 0, Math.max(0, state.mapHeight - 1));
  const safeMaxY = clampValue(
    bottom,
    safeMinY,
    Math.max(0, state.mapHeight - 1)
  );

  return {
    minX: safeMinX,
    minY: safeMinY,
    maxX: safeMaxX,
    maxY: safeMaxY,
    width: Math.max(1, safeMaxX - safeMinX + 1),
    height: Math.max(1, safeMaxY - safeMinY + 1),
  };
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const getIconRadius = (tileScale: number, multiplier: number): number =>
  Math.min(ICON_MAX_RADIUS, Math.max(3, tileScale * multiplier));

const getStrokeWidth = (scale: number, weight = ICON_STROKE_WIDTH): number =>
  Math.max(0.5, weight) / Math.max(scale, 0.0001);

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const effectiveRadius = Math.max(
    0,
    Math.min(radius, Math.min(width, height) / 2)
  );
  ctx.beginPath();
  ctx.moveTo(x + effectiveRadius, y);
  ctx.lineTo(x + width - effectiveRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + effectiveRadius);
  ctx.lineTo(x + width, y + height - effectiveRadius);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - effectiveRadius,
    y + height
  );
  ctx.lineTo(x + effectiveRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - effectiveRadius);
  ctx.lineTo(x, y + effectiveRadius);
  ctx.quadraticCurveTo(x, y, x + effectiveRadius, y);
  ctx.closePath();
};

const getFixedViewportSize = (
  viewport: { width: number; height: number },
  bounds: { width: number; height: number }
): ViewportSize => {
  const targetRatio = 4 / 3;
  const maxWidth = Math.max(1, Math.round(bounds.width));
  const maxHeight = Math.max(1, Math.round(bounds.height));

  let width = Math.max(1, viewport.width);
  let height = Math.max(1, viewport.height);

  if (width / height > targetRatio) {
    width = height * targetRatio;
  } else {
    height = width / targetRatio;
  }

  if (width > maxWidth) {
    width = maxWidth;
    height = width / targetRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * targetRatio;
    if (width > maxWidth) {
      width = maxWidth;
      height = width / targetRatio;
    }
  }

  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
};

const prepareCanvas = (
  canvas: HTMLCanvasElement | null,
  width: number,
  height: number
): CanvasRenderingContext2D | null => {
  if (!canvas) {
    return null;
  }
  const dpr = window.devicePixelRatio || 1;
  const targetWidth = Math.max(1, Math.round(width * dpr));
  const targetHeight = Math.max(1, Math.round(height * dpr));
  if (canvas.width !== targetWidth) {
    canvas.width = targetWidth;
  }
  if (canvas.height !== targetHeight) {
    canvas.height = targetHeight;
  }
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  return ctx;
};

const drawTiles = ({ ctx, state, crop }: DrawContext) => {
  const { tiles, tileScale } = state;
  const surfaceColor = resolveHudSurfaceColor();
  ctx.fillStyle = surfaceColor;
  ctx.fillRect(
    crop.minX * tileScale,
    crop.minY * tileScale,
    crop.width * tileScale,
    crop.height * tileScale
  );

  for (let y = crop.minY; y <= crop.maxY; y += 1) {
    const row = tiles[y];
    if (!row) {
      continue;
    }
    for (let x = crop.minX; x <= crop.maxX; x += 1) {
      const tile = row[x];
      if (!tile) {
        continue;
      }
      const color = TILE_COLORS[tile.type.toLowerCase()] ?? TILE_COLORS.default;
      ctx.fillStyle = color;
      ctx.fillRect(x * tileScale, y * tileScale, tileScale, tileScale);
      if (tile.provideCover) {
        ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
        ctx.fillRect(x * tileScale, y * tileScale, tileScale, tileScale);
      }
    }
  }
};

const drawOverlay = ({ ctx, state }: DrawContext) => {
  // No overlay to keep MiniMap visuals identical to player HUD (no glow)
  void ctx;
  void state;
};

const drawEntities = ({ ctx, state, scale, crop }: DrawContext) => {
  const { tileScale, entities, cameras } = state;
  const objectiveMarkers = state.objectiveMarkers ?? [];

  entities.forEach((entity) => {
    if (
      entity.x < crop.minX ||
      entity.x > crop.maxX ||
      entity.y < crop.minY ||
      entity.y > crop.maxY
    ) {
      return;
    }
    const color = ENTITY_COLORS[entity.kind] ?? ENTITY_COLORS.npc;
    const radius = getIconRadius(
      tileScale,
      entity.kind === "player" ? 0.7 : entity.kind === "npc" ? 0.62 : 0.5
    );
    const x = (entity.x + 0.5) * tileScale;
    const y = (entity.y + 0.5) * tileScale;

    if (entity.kind === "player") {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y - radius);
      ctx.lineTo(x + radius, y + radius);
      ctx.lineTo(x - radius, y + radius);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle =
        entity.status === "inactive" ? "rgba(148, 163, 184, 0.35)" : color;
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.85, 0, Math.PI * 2);
      ctx.fill();
      if (entity.kind === "enemy" || entity.kind === "npc") {
        ctx.strokeStyle = "rgba(15, 23, 42, 0.85)";
        ctx.lineWidth = getStrokeWidth(scale);
        ctx.stroke();
      }
    }
  });

  objectiveMarkers.forEach((objective) => {
    if (
      objective.x < crop.minX ||
      objective.x > crop.maxX ||
      objective.y < crop.minY ||
      objective.y > crop.maxY
    ) {
      return;
    }
    const isQuestContact = objective.markerKind === "questContact";
    const ring = Math.min(
      ICON_MAX_RADIUS,
      Math.max(isQuestContact ? 6 : 5, tileScale * (isQuestContact ? 0.66 : 0.55))
    );
    const x = (objective.x + 0.5) * tileScale;
    const y = (objective.y + 0.5) * tileScale;
    ctx.fillStyle = isQuestContact
      ? "rgba(34, 211, 238, 0.2)"
      : "rgba(251, 191, 36, 0.2)";
    ctx.beginPath();
    ctx.arc(x, y, ring, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isQuestContact
      ? "rgba(34, 211, 238, 0.95)"
      : "rgba(251, 191, 36, 0.95)";
    ctx.lineWidth = getStrokeWidth(scale);
    ctx.beginPath();
    ctx.arc(x, y, ring * 0.7, 0, Math.PI * 2);
    ctx.stroke();
  });

  cameras.forEach((camera: MiniMapCameraDetail) => {
    if (
      camera.x < crop.minX ||
      camera.x > crop.maxX ||
      camera.y < crop.minY ||
      camera.y > crop.maxY
    ) {
      return;
    }
    const color = camera.isActive
      ? CAMERA_COLORS[camera.alertState]
      : CAMERA_COLORS[CameraAlertState.DISABLED];
    const radius = getIconRadius(tileScale, 0.5);
    const x = (camera.x + 0.5) * tileScale;
    const y = (camera.y + 0.5) * tileScale;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - radius);
    ctx.lineTo(x + radius, y + radius);
    ctx.lineTo(x - radius, y + radius);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = getStrokeWidth(scale);
    ctx.strokeStyle = "rgba(15, 23, 42, 0.65)";
    ctx.stroke();
    ctx.restore();
  });
};

const drawPath = ({ ctx, state, scale }: DrawContext) => {
  const { path, tileScale } = state;
  if (!path || path.length < 2) {
    return;
  }
  ctx.strokeStyle = "rgba(59, 130, 246, 0.6)";
  ctx.lineWidth = getStrokeWidth(scale, ICON_STROKE_WIDTH * 0.95);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.setLineDash([tileScale * 0.8, tileScale * 0.5]);
  ctx.beginPath();
  path.forEach((node, index) => {
    const x = (node.x + 0.5) * tileScale;
    const y = (node.y + 0.5) * tileScale;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
  ctx.setLineDash([]);

  const goal = path[path.length - 1];
  const goalX = (goal.x + 0.5) * tileScale;
  const goalY = (goal.y + 0.5) * tileScale;
  ctx.fillStyle = "rgba(59, 130, 246, 0.12)";
  ctx.beginPath();
  ctx.arc(goalX, goalY, Math.max(4, tileScale * 0.4), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(59, 130, 246, 0.7)";
  ctx.lineWidth = getStrokeWidth(scale);
  ctx.beginPath();
  ctx.arc(goalX, goalY, Math.max(3, tileScale * 0.28), 0, Math.PI * 2);
  ctx.stroke();
};

const drawViewport = (
  { ctx, state, scale }: DrawContext,
  fixedSize: ViewportSize
) => {
  const { viewport, tileScale } = state;
  if (!viewport || viewport.width <= 0 || viewport.height <= 0) {
    return;
  }

  const rectWidthTiles = fixedSize.width;
  const rectHeightTiles = fixedSize.height;
  const rectWidth = rectWidthTiles * tileScale;
  const rectHeight = rectHeightTiles * tileScale;

  const centerX = (viewport.x + viewport.width / 2) * tileScale;
  const centerY = (viewport.y + viewport.height / 2) * tileScale;

  const rectX = centerX - rectWidth / 2;
  const rectY = centerY - rectHeight / 2;

  const viewportRadius = Math.min(
    Math.max(4, rectWidth * 0.12),
    resolveHudRadius() / Math.max(scale, 0.0001)
  );

  ctx.save();
  ctx.lineWidth = getStrokeWidth(scale, ICON_STROKE_WIDTH * 0.85);
  ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
  drawRoundedRect(ctx, rectX, rectY, rectWidth, rectHeight, viewportRadius);
  ctx.stroke();
  ctx.restore();

  const reticleSize = Math.max(2, tileScale * 0.5);
  ctx.save();
  ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
  ctx.lineWidth = getStrokeWidth(scale, ICON_STROKE_WIDTH * 0.75);
  ctx.beginPath();
  ctx.moveTo(centerX - reticleSize, centerY);
  ctx.lineTo(centerX + reticleSize, centerY);
  ctx.moveTo(centerX, centerY - reticleSize);
  ctx.lineTo(centerX, centerY + reticleSize);
  ctx.stroke();
  ctx.restore();
};

const drawMiniMap = (
  canvas: HTMLCanvasElement | null,
  state: MiniMapRenderState,
  width: number,
  height: number,
  fixedViewportSize: ViewportSize,
  crop: CropBounds
) => {
  const ctx = prepareCanvas(canvas, width, height);
  if (!ctx) {
    return;
  }
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = resolveHudSurfaceColor();
  ctx.fillRect(0, 0, width, height);

  const displayLogicalWidth = crop.width * state.tileScale;
  const displayLogicalHeight = crop.height * state.tileScale;
  if (displayLogicalWidth <= 0 || displayLogicalHeight <= 0) {
    return;
  }

  const scale = Math.min(
    width / displayLogicalWidth,
    height / displayLogicalHeight
  );
  const offsetX = (width - displayLogicalWidth * scale) / 2;
  const offsetY = (height - displayLogicalHeight * scale) / 2;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  ctx.translate(-crop.minX * state.tileScale, -crop.minY * state.tileScale);

  const drawContext: DrawContext = { ctx, state, scale, crop };
  drawTiles(drawContext);
  drawOverlay(drawContext);
  drawPath(drawContext);
  drawEntities(drawContext);
  drawViewport(drawContext, fixedViewportSize);

  ctx.restore();
};

const MiniMap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const latestStateRef = useRef<MiniMapRenderState | null>(
    miniMapService.getState()
  );
  const cropBoundsRef = useRef<CropBounds | null>(
    latestStateRef.current ? computeWallCrop(latestStateRef.current) : null
  );
  const [dimensions, setDimensions] = useState({
    width: DEFAULT_MINIMAP_WIDTH,
    height: DEFAULT_MINIMAP_HEIGHT,
  });
  const [renderToken, setRenderToken] = useState(0);
  const viewportSizeRef = useRef<ViewportSize | null>(null);
  const lastAreaIdRef = useRef<string | null>(null);

  const draggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const dragMovedRef = useRef(false);

  const resolveState = useCallback(() => latestStateRef.current, []);
  const resolveCropBounds = useCallback(
    (state: MiniMapRenderState | null): CropBounds | null => {
      if (!state) {
        return null;
      }
      if (!cropBoundsRef.current) {
        cropBoundsRef.current = computeWallCrop(state);
      }
      return cropBoundsRef.current ?? createDefaultCrop(state);
    },
    []
  );

  const ensureViewportSize = useCallback((state: MiniMapRenderState) => {
    const viewport = state.viewport;
    if (!viewport) {
      return;
    }
    if (lastAreaIdRef.current !== state.areaId) {
      viewportSizeRef.current = null;
      lastAreaIdRef.current = state.areaId;
    }
    const fixed = getFixedViewportSize(viewport, {
      width: state.mapWidth,
      height: state.mapHeight,
    });
    const current = viewportSizeRef.current;
    if (
      !current ||
      current.width !== fixed.width ||
      current.height !== fixed.height
    ) {
      viewportSizeRef.current = fixed;
    }
  }, []);

  useEffect(() => {
    const handleState = (event: Event) => {
      const detail = (event as CustomEvent<MiniMapRenderState>).detail;
      latestStateRef.current = detail;
      cropBoundsRef.current = computeWallCrop(detail);
      ensureViewportSize(detail);
      setRenderToken(detail.version);
    };
    miniMapService.addEventListener(
      MINIMAP_STATE_EVENT,
      handleState as EventListener
    );
    miniMapService.requestImmediateState();
    return () => {
      miniMapService.removeEventListener(
        MINIMAP_STATE_EVENT,
        handleState as EventListener
      );
    };
  }, [ensureViewportSize]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(() => {
      const width = Math.max(
        MIN_MINIMAP_WIDTH,
        Math.floor(element.clientWidth / HUD_GRID_UNIT) * HUD_GRID_UNIT
      );
      const height = Math.max(
        MIN_MINIMAP_HEIGHT,
        Math.floor(element.clientHeight / HUD_GRID_UNIT) * HUD_GRID_UNIT
      );
      setDimensions((prev) => {
        if (prev.width === width && prev.height === height) {
          return prev;
        }
        return { width, height };
      });
      miniMapService.setCanvasBounds(width, height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const state = resolveState();
    const size = viewportSizeRef.current;
    const crop = resolveCropBounds(state);
    if (!state || !size || !crop) {
      return;
    }
    drawMiniMap(
      canvasRef.current,
      state,
      dimensions.width,
      dimensions.height,
      size,
      crop
    );
  }, [
    dimensions.width,
    dimensions.height,
    renderToken,
    resolveState,
    resolveCropBounds,
  ]);

  const resolveGridFromPointer = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const state = resolveState();
      const canvas = canvasRef.current;
      const crop = resolveCropBounds(state);
      if (!state || !canvas || !crop) {
        return null;
      }
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width === 0 || height === 0) {
        return null;
      }

      const displayLogicalWidth = crop.width * state.tileScale;
      const displayLogicalHeight = crop.height * state.tileScale;
      const scale = Math.min(
        width / displayLogicalWidth,
        height / displayLogicalHeight
      );
      const offsetX = (width - displayLogicalWidth * scale) / 2;
      const offsetY = (height - displayLogicalHeight * scale) / 2;

      const localX = (event.clientX - rect.left - offsetX) / scale;
      const localY = (event.clientY - rect.top - offsetY) / scale;

      const worldX = localX + crop.minX * state.tileScale;
      const worldY = localY + crop.minY * state.tileScale;

      const gridX = clamp(worldX / state.tileScale, 0, state.mapWidth);
      const gridY = clamp(worldY / state.tileScale, 0, state.mapHeight);
      return { gridX, gridY };
    },
    [resolveCropBounds, resolveState]
  );

  const focusCamera = useCallback(
    (coords: { gridX: number; gridY: number } | null, animate: boolean) => {
      if (!coords) {
        return;
      }
      const state = resolveState();
      const viewport = state?.viewport;
      if (!state || !viewport) {
        return;
      }

      const fixedSize =
        viewportSizeRef.current ??
        getFixedViewportSize(viewport, {
          width: state.mapWidth,
          height: state.mapHeight,
        });

      const halfWidth = fixedSize.width / 2;
      const halfHeight = fixedSize.height / 2;

      const centerX = clamp(
        coords.gridX,
        halfWidth,
        Math.max(halfWidth, state.mapWidth - halfWidth)
      );
      const centerY = clamp(
        coords.gridY,
        halfHeight,
        Math.max(halfHeight, state.mapHeight - halfHeight)
      );

      viewportSizeRef.current = fixedSize;

      miniMapService.emitInteraction({
        type: MINIMAP_VIEWPORT_CLICK_EVENT,
        gridX: centerX,
        gridY: centerY,
        animate,
      });
    },
    [resolveState]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch" && event.button !== 0) {
      return;
    }
    const coords = resolveGridFromPointer(event);
    if (!coords) {
      return;
    }
    draggingRef.current = true;
    dragMovedRef.current = false;
    pointerIdRef.current = event.pointerId;
    if (typeof event.currentTarget.setPointerCapture === "function") {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Ignore capture failures
      }
    }
    focusCamera(coords, true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || pointerIdRef.current !== event.pointerId) {
      return;
    }
    const coords = resolveGridFromPointer(event);
    if (!coords) {
      return;
    }
    dragMovedRef.current = true;
    focusCamera(coords, false);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || pointerIdRef.current !== event.pointerId) {
      return;
    }
    const coords = resolveGridFromPointer(event);
    focusCamera(coords, !dragMovedRef.current);
    draggingRef.current = false;
    pointerIdRef.current = null;
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }
    draggingRef.current = false;
    pointerIdRef.current = null;
  };

  const handlePointerLeave = () => {
    draggingRef.current = false;
    pointerIdRef.current = null;
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = clamp(event.deltaY, -120, 120);
    miniMapService.adjustZoom(delta < 0 ? 0.15 : -0.15);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (
      !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
    ) {
      return;
    }
    event.preventDefault();
    const state = resolveState();
    if (!state) {
      return;
    }
    const fixedSize =
      viewportSizeRef.current ??
      getFixedViewportSize(state.viewport, {
        width: state.mapWidth,
        height: state.mapHeight,
      });
    const step = Math.max(1, Math.floor(fixedSize.width * 0.2));
    let targetX = state.viewport.x + state.viewport.width / 2;
    let targetY = state.viewport.y + state.viewport.height / 2;
    switch (event.key) {
      case "ArrowUp":
        targetY -= step;
        break;
      case "ArrowDown":
        targetY += step;
        break;
      case "ArrowLeft":
        targetX -= step;
        break;
      case "ArrowRight":
        targetX += step;
        break;
      default:
        break;
    }
    focusCamera({ gridX: targetX, gridY: targetY }, false);
  };

  const state = resolveState();
  const hasViewport = Boolean(state && viewportSizeRef.current);

  if (!hasViewport) {
    return null;
  }

  return (
    <section className="mini-map-panel" aria-label="MiniMap panel">
      <div
        ref={containerRef}
        className="mini-map-canvas"
        role="application"
        aria-label="MiniMap viewport"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerLeave}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />
      </div>
    </section>
  );
};

export default React.memo(MiniMap);
