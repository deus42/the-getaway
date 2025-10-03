import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getUIStrings } from '../../content/ui';
import type { Position } from '../../game/interfaces/types';
import {
  MINIMAP_STATE_EVENT,
  MINIMAP_VIEWPORT_CLICK_EVENT,
  MINIMAP_OBJECTIVE_FOCUS_EVENT,
  MINIMAP_ZOOM_EVENT,
  MINIMAP_PATH_PREVIEW_EVENT,
  PATH_PREVIEW_EVENT,
  MiniMapRenderState,
  MiniMapEntityDetail,
  MiniMapZoomDetail,
  MiniMapObjectiveDetail,
  MiniMapPathPreviewDetail,
  PathPreviewDetail,
} from '../../game/events';
import { miniMapService } from '../../game/services/miniMapService';

const BASE_TILE_COLORS: Record<string, string> = {
  floor: '#0f172a',
  wall: '#1f2937',
  door: '#fbbf24',
  cover: '#0d9488',
  water: '#0ea5e9',
  trap: '#7c3aed',
  default: '#111827',
};

const ENTITY_STYLE: Record<MiniMapEntityDetail['kind'], { fill: string; stroke: string; size: number }> = {
  player: { fill: '#38bdf8', stroke: 'rgba(190, 242, 255, 0.85)', size: 0.8 },
  enemy: { fill: '#ef4444', stroke: 'rgba(248, 113, 113, 0.85)', size: 0.65 },
  npc: { fill: '#22c55e', stroke: 'rgba(187, 247, 208, 0.85)', size: 0.55 },
  objective: { fill: '#fbbf24', stroke: 'rgba(253, 230, 138, 0.8)', size: 0.55 },
};

const OBJECTIVE_STYLE = {
  fill: '#fde68a',
  stroke: 'rgba(250, 204, 21, 0.85)',
};

const CURFEW_BORDER = {
  active: 'rgba(126, 232, 201, 0.7)',
  inactive: 'rgba(59, 130, 246, 0.55)',
};

const GRID_LINE_COLOR = 'rgba(56, 189, 248, 0.12)';
const GRID_MAJOR_COLOR = 'rgba(56, 189, 248, 0.28)';

const PANEL_BACKGROUND = 'linear-gradient(155deg, rgba(14, 22, 40, 0.92), rgba(8, 12, 24, 0.88))';
const CARD_BACKGROUND = 'linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.58))';

const clamp = (value: number, min: number, max: number): number => {
  if (max < min) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
};

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

const distanceBetween = (a: Position, b: Position): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

const get2dContext = (canvas: HTMLCanvasElement | null): CanvasRenderingContext2D | null => {
  if (!canvas || typeof canvas.getContext !== 'function') {
    return null;
  }

  try {
    return canvas.getContext('2d');
  } catch {
    return null;
  }
};

const drawTileGrid = (
  ctx: CanvasRenderingContext2D,
  tiles: MiniMapRenderState['tiles'],
  tileScale: number,
  palette: Record<string, string>,
) => {
  const height = tiles.length;
  const width = tiles[0]?.length ?? 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const tile = tiles[y][x];
      const fill = palette[tile.type.toLowerCase()] ?? palette.default;
      ctx.fillStyle = fill;
      ctx.fillRect(x * tileScale, y * tileScale, tileScale, tileScale);

      if (tile.provideCover) {
        ctx.fillStyle = 'rgba(14, 116, 144, 0.45)';
        ctx.fillRect(x * tileScale, y * tileScale, tileScale, tileScale);
      }
    }
  }

  if (tileScale >= 2) {
    const gridStep = Math.max(4, Math.round(16 / tileScale));
    const majorGridStep = gridStep * 2;

    ctx.strokeStyle = GRID_LINE_COLOR;
    ctx.lineWidth = Math.max(1, tileScale * 0.06);

    for (let gx = 0; gx <= width; gx += gridStep) {
      if (gx % majorGridStep !== 0) {
        const xPos = gx * tileScale;
        ctx.beginPath();
        ctx.moveTo(xPos + 0.5, 0);
        ctx.lineTo(xPos + 0.5, height * tileScale);
        ctx.stroke();
      }
    }

    for (let gy = 0; gy <= height; gy += gridStep) {
      if (gy % majorGridStep !== 0) {
        const yPos = gy * tileScale;
        ctx.beginPath();
        ctx.moveTo(0, yPos + 0.5);
        ctx.lineTo(width * tileScale, yPos + 0.5);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = GRID_MAJOR_COLOR;
    ctx.lineWidth = Math.max(1.2, tileScale * 0.1);

    for (let gx = 0; gx <= width; gx += majorGridStep) {
      const xPos = gx * tileScale;
      ctx.beginPath();
      ctx.moveTo(xPos + 0.5, 0);
      ctx.lineTo(xPos + 0.5, height * tileScale);
      ctx.stroke();
    }

    for (let gy = 0; gy <= height; gy += majorGridStep) {
      const yPos = gy * tileScale;
      ctx.beginPath();
      ctx.moveTo(0, yPos + 0.5);
      ctx.lineTo(width * tileScale, yPos + 0.5);
      ctx.stroke();
    }
  }
};

const drawObjectiveMarker = (
  ctx: CanvasRenderingContext2D,
  marker: MiniMapObjectiveDetail,
  tileScale: number,
) => {
  const centerX = (marker.x + 0.5) * tileScale;
  const centerY = (marker.y + 0.5) * tileScale;
  const radius = Math.max(4, tileScale * 0.6);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((-18 * Math.PI) / 180);
  ctx.fillStyle = OBJECTIVE_STYLE.fill;
  ctx.strokeStyle = OBJECTIVE_STYLE.stroke;
  ctx.lineWidth = Math.max(1, tileScale * 0.16);
  ctx.beginPath();
  const points = 5;
  for (let i = 0; i < points * 2; i += 1) {
    const angle = (Math.PI * i) / points;
    const r = i % 2 === 0 ? radius : radius / 2.2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
};

const drawEntitiesLayer = (
  ctx: CanvasRenderingContext2D,
  state: MiniMapRenderState,
  objectiveMarkers: MiniMapObjectiveDetail[],
) => {
  ctx.save();
  ctx.clearRect(0, 0, state.logicalWidth, state.logicalHeight);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  state.entities.forEach((entity) => {
    const style = ENTITY_STYLE[entity.kind] ?? ENTITY_STYLE.npc;
    const centerX = (entity.x + 0.5) * state.tileScale;
    const centerY = (entity.y + 0.5) * state.tileScale;
    const size = Math.max(3, state.tileScale * style.size);

    ctx.save();
    ctx.globalAlpha = entity.status === 'inactive' ? 0.4 : 1;
    if (entity.status !== 'inactive') {
      ctx.shadowColor = style.fill;
      ctx.shadowBlur = Math.max(4, size * 1.2);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    ctx.fillStyle = style.fill;
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = Math.max(1, size * 0.35);

    if (entity.kind === 'player') {
      ctx.translate(centerX, centerY);
      ctx.rotate((-45 * Math.PI) / 180);
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (entity.kind === 'enemy') {
      ctx.translate(centerX, centerY);
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.9, size * 0.9);
      ctx.lineTo(-size * 0.9, size * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  });

  objectiveMarkers.forEach((marker) => {
    drawObjectiveMarker(ctx, marker, state.tileScale);
  });

  ctx.restore();
};

const drawViewportLayer = (ctx: CanvasRenderingContext2D, state: MiniMapRenderState) => {
  const { viewport, tileScale, logicalWidth, logicalHeight } = state;
  ctx.save();
  ctx.clearRect(0, 0, logicalWidth, logicalHeight);

  if (!viewport || viewport.width <= 0 || viewport.height <= 0) {
    ctx.restore();
    return;
  }

  const viewportX = viewport.x * tileScale;
  const viewportY = viewport.y * tileScale;
  const viewportWidth = viewport.width * tileScale;
  const viewportHeight = viewport.height * tileScale;

  const minWidthPx = Math.max(8, tileScale * 3);
  const minHeightPx = Math.max(6, tileScale * 2);

  const widthScale = viewportWidth < minWidthPx ? minWidthPx / viewportWidth : 1;
  const heightScale = viewportHeight < minHeightPx ? minHeightPx / viewportHeight : 1;
  const scaleFactor = Math.max(widthScale, heightScale);

  const renderWidth = viewportWidth * scaleFactor;
  const renderHeight = viewportHeight * scaleFactor;

  const centerX = viewportX + viewportWidth / 2;
  const centerY = viewportY + viewportHeight / 2;

  const availableWidth = logicalWidth - renderWidth;
  const availableHeight = logicalHeight - renderHeight;

  const renderX = availableWidth <= 0
    ? (logicalWidth - renderWidth) / 2
    : clamp(centerX - renderWidth / 2, 0, availableWidth);
  const renderY = availableHeight <= 0
    ? (logicalHeight - renderHeight) / 2
    : clamp(centerY - renderHeight / 2, 0, availableHeight);

  ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
  ctx.fillRect(renderX, renderY, renderWidth, renderHeight);

  ctx.lineWidth = Math.max(1.5, tileScale * 0.28);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.95)';
  ctx.setLineDash([tileScale * 1.5, tileScale * 1.5]);
  ctx.strokeRect(renderX, renderY, renderWidth, renderHeight);
  ctx.setLineDash([]);

  const cornerSize = Math.max(4, tileScale * 0.7);
  ctx.lineWidth = Math.max(1, tileScale * 0.25);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';

  const drawCorner = (x: number, y: number, horizontal: number, vertical: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y + vertical * cornerSize);
    ctx.lineTo(x, y);
    ctx.lineTo(x + horizontal * cornerSize, y);
    ctx.stroke();
  };

  drawCorner(renderX, renderY, 1, 1);
  drawCorner(renderX + renderWidth, renderY, -1, 1);
  drawCorner(renderX, renderY + renderHeight, 1, -1);
  drawCorner(renderX + renderWidth, renderY + renderHeight, -1, -1);

  const reticleSize = Math.max(3, tileScale * 0.8);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
  ctx.lineWidth = Math.max(1, tileScale * 0.22);
  ctx.beginPath();
  ctx.moveTo(centerX - reticleSize, centerY);
  ctx.lineTo(centerX + reticleSize, centerY);
  ctx.moveTo(centerX, centerY - reticleSize);
  ctx.lineTo(centerX, centerY + reticleSize);
  ctx.stroke();

  ctx.restore();
};

const drawOverlaysLayer = (ctx: CanvasRenderingContext2D, state: MiniMapRenderState) => {
  ctx.save();
  ctx.clearRect(0, 0, state.logicalWidth, state.logicalHeight);

  if (state.curfewActive) {
    const gradient = ctx.createLinearGradient(0, 0, state.logicalWidth, state.logicalHeight);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.18)');
    gradient.addColorStop(1, 'rgba(14, 116, 144, 0.32)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.logicalWidth, state.logicalHeight);
  }

  ctx.lineWidth = Math.max(2, state.tileScale * 0.55);
  ctx.strokeStyle = state.curfewActive ? CURFEW_BORDER.active : CURFEW_BORDER.inactive;
  ctx.strokeRect(1.5, 1.5, state.logicalWidth - 3, state.logicalHeight - 3);

  ctx.lineWidth = Math.max(1, state.tileScale * 0.25);
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
  ctx.strokeRect(3, 3, state.logicalWidth - 6, state.logicalHeight - 6);

  ctx.restore();
};

const drawPathLayer = (
  ctx: CanvasRenderingContext2D,
  state: MiniMapRenderState,
  dashOffset: number,
  draftPath: Position[] | null,
) => {
  ctx.save();
  ctx.clearRect(0, 0, state.logicalWidth, state.logicalHeight);

  const path = state.path && state.path.length > 1 ? state.path : draftPath;
  if (!path || path.length < 2) {
    ctx.restore();
    return;
  }

  ctx.lineWidth = Math.max(1.2, state.tileScale * 0.22);
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.85)';
  ctx.setLineDash([state.tileScale * 1.2, state.tileScale * 0.7]);
  ctx.lineDashOffset = dashOffset;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.beginPath();
  path.forEach((node, index) => {
    const x = (node.x + 0.5) * state.tileScale;
    const y = (node.y + 0.5) * state.tileScale;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
  ctx.setLineDash([]);

  const goal = path[path.length - 1];
  const gx = (goal.x + 0.5) * state.tileScale;
  const gy = (goal.y + 0.5) * state.tileScale;
  const markerRadius = Math.max(3, state.tileScale * 0.6);
  ctx.fillStyle = 'rgba(59, 130, 246, 0.35)';
  ctx.beginPath();
  ctx.arc(gx, gy, markerRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = Math.max(1, state.tileScale * 0.18);
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.95)';
  ctx.stroke();

  ctx.restore();
};

const resizeCanvas = (
  canvas: HTMLCanvasElement | null,
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
) => {
  if (!canvas) {
    return;
  }

  const targetWidth = Math.max(1, Math.round(cssWidth * devicePixelRatio));
  const targetHeight = Math.max(1, Math.round(cssHeight * devicePixelRatio));

  if (canvas.width !== targetWidth) {
    canvas.width = targetWidth;
  }
  if (canvas.height !== targetHeight) {
    canvas.height = targetHeight;
  }

  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
};

const MiniMap: React.FC = () => {
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const tileCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const entityCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pathCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const latestStateRef = useRef<MiniMapRenderState | null>(miniMapService.getState());
  const draftPathRef = useRef<Position[] | null>(null);
  const draggingRef = useRef(false);
  const dragModeRef = useRef<'pan' | 'waypoint'>('pan');
  const dragMovedRef = useRef(false);
  const lastDragUpdateRef = useRef(0);
  const rotationDegRef = useRef(0);
  const playerHeadingRef = useRef(0);
  const previousPlayerPositionRef = useRef<Position | null>(null);
  const pathAnimationFrameRef = useRef<number | null>(null);
  const pathDashOffsetRef = useRef(0);
  const hoverInfoRef = useRef<{ label: string; x: number; y: number } | null>(null);

  const [renderTick, setRenderTick] = useState(0);
  const [canvasSize, setCanvasSize] = useState(() => ({ width: 140, height: 110 }));
  const [userZoom, setUserZoom] = useState(() => miniMapService.getZoom());
  const [legendOpen, setLegendOpen] = useState(true);
  const [hoverInfo, setHoverInfo] = useState<{ label: string; x: number; y: number } | null>(null);
  const tilePalette = BASE_TILE_COLORS;
  const legendItems = [
    { id: 'player', label: uiStrings.miniMap.playerLabel ?? 'Cell Lead', color: ENTITY_STYLE.player.fill },
    { id: 'enemy', label: uiStrings.miniMap.enemyLabel ?? 'Hostile', color: ENTITY_STYLE.enemy.fill },
    { id: 'npc', label: uiStrings.miniMap.npcLabel ?? 'Neutral', color: ENTITY_STYLE.npc.fill },
    { id: 'objective', label: uiStrings.miniMap.objectiveLabel ?? 'Objective', color: ENTITY_STYLE.objective.fill },
  ];

  const resolveState = () => latestStateRef.current;

  const updateRotation = useCallback((state: MiniMapRenderState) => {
    const playerEntity = state.entities.find((entity) => entity.kind === 'player');
    if (!playerEntity) {
      rotationDegRef.current = 0;
      return;
    }

    const previous = previousPlayerPositionRef.current;
    const currentPosition = { x: playerEntity.x, y: playerEntity.y };

    if (previous && (previous.x !== currentPosition.x || previous.y !== currentPosition.y)) {
      const dx = currentPosition.x - previous.x;
      const dy = currentPosition.y - previous.y;
      if (dx !== 0 || dy !== 0) {
        const angle = Math.atan2(dy, dx);
        playerHeadingRef.current = (angle * 180) / Math.PI;
      }
    }

    previousPlayerPositionRef.current = currentPosition;
    rotationDegRef.current = 0;
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<MiniMapRenderState>).detail;
      latestStateRef.current = detail;
      updateRotation(detail);
      setUserZoom(detail.userZoom ?? miniMapService.getZoom());
      setRenderTick(detail.version);
    };

    miniMapService.addEventListener(MINIMAP_STATE_EVENT, handler as EventListener);
    miniMapService.requestImmediateState();

    return () => {
      miniMapService.removeEventListener(MINIMAP_STATE_EVENT, handler as EventListener);
    };
  }, [updateRotation]);

  useEffect(() => {
    const zoomHandler = (event: Event) => {
      const detail = (event as CustomEvent<MiniMapZoomDetail>).detail;
      setUserZoom(detail.zoom);
    };
    miniMapService.addEventListener(MINIMAP_ZOOM_EVENT, zoomHandler as EventListener);
    return () => {
      miniMapService.removeEventListener(MINIMAP_ZOOM_EVENT, zoomHandler as EventListener);
    };
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<PathPreviewDetail>).detail;
      const activeState = latestStateRef.current;
      if (!activeState || detail.areaId !== activeState.areaId) {
        return;
      }
      draftPathRef.current = null;
      setRenderTick((tick) => tick + 1);
    };
    window.addEventListener(PATH_PREVIEW_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(PATH_PREVIEW_EVENT, handler as EventListener);
    };
  }, []);

  useEffect(() => {
    const activeState = latestStateRef.current;
    if (!activeState) {
      return;
    }

    const cssWidth = Math.max(1, Math.round(activeState.logicalWidth));
    const cssHeight = Math.max(1, Math.round(activeState.logicalHeight));
    const dpr = activeState.devicePixelRatio || 1;

    if (canvasSize.width !== cssWidth || canvasSize.height !== cssHeight) {
      setCanvasSize({ width: cssWidth, height: cssHeight });
    }

    const canvases = [
      tileCanvasRef.current,
      overlayCanvasRef.current,
      entityCanvasRef.current,
      pathCanvasRef.current,
      viewportCanvasRef.current,
    ];

    canvases.forEach((canvas) => resizeCanvas(canvas, cssWidth, cssHeight, dpr));

    const tileCtx = get2dContext(tileCanvasRef.current);
    const overlayCtx = get2dContext(overlayCanvasRef.current);
    const entityCtx = get2dContext(entityCanvasRef.current);
    const pathCtx = get2dContext(pathCanvasRef.current);
    const viewportCtx = get2dContext(viewportCanvasRef.current);

    if (tileCtx) tileCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (overlayCtx) overlayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (entityCtx) entityCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (pathCtx) pathCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (viewportCtx) viewportCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const dirty = activeState.dirtyLayers;

    if (tileCtx && (dirty.tiles || renderTick === 0)) {
      tileCtx.clearRect(0, 0, cssWidth, cssHeight);
      drawTileGrid(tileCtx, activeState.tiles, activeState.tileScale, tilePalette);
    }

    if (overlayCtx && (dirty.overlays || renderTick === 0)) {
      drawOverlaysLayer(overlayCtx, activeState);
    }

    if (entityCtx && (dirty.entities || renderTick === 0)) {
      drawEntitiesLayer(entityCtx, activeState, activeState.objectiveMarkers);
    }

    if (viewportCtx && (dirty.viewport || renderTick === 0)) {
      drawViewportLayer(viewportCtx, activeState);
    }

    if (pathCtx && (dirty.path || renderTick === 0 || draftPathRef.current)) {
      drawPathLayer(pathCtx, activeState, pathDashOffsetRef.current, draftPathRef.current);
    }

    if (containerRef.current) {
      containerRef.current.style.transform = 'rotate(0deg)';
    }
  }, [renderTick, tilePalette, canvasSize.width, canvasSize.height]);

  useEffect(() => {
    const animate = () => {
      const state = latestStateRef.current;
      const pathCtx = get2dContext(pathCanvasRef.current);
      if (!state || !pathCtx) {
        pathAnimationFrameRef.current = null;
        return;
      }

      const hasPath = (state.path && state.path.length > 1) || (draftPathRef.current && draftPathRef.current.length > 1);
      if (!hasPath) {
        pathCtx.clearRect(0, 0, state.logicalWidth, state.logicalHeight);
        pathAnimationFrameRef.current = null;
        return;
      }

      pathDashOffsetRef.current = (pathDashOffsetRef.current + 0.75) % (state.tileScale * 1.9);
      drawPathLayer(pathCtx, state, pathDashOffsetRef.current, draftPathRef.current);
      pathAnimationFrameRef.current = requestAnimationFrame(animate);
    };

    const activeState = latestStateRef.current;
    const shouldAnimate = Boolean(
      activeState && ((activeState.path && activeState.path.length > 1) || (draftPathRef.current && draftPathRef.current.length > 1))
    );

    if (shouldAnimate && pathAnimationFrameRef.current === null) {
      pathAnimationFrameRef.current = requestAnimationFrame(animate);
    }

    if (!shouldAnimate && pathAnimationFrameRef.current !== null) {
      cancelAnimationFrame(pathAnimationFrameRef.current);
      pathAnimationFrameRef.current = null;
    }

    return () => {
      if (pathAnimationFrameRef.current !== null) {
        cancelAnimationFrame(pathAnimationFrameRef.current);
        pathAnimationFrameRef.current = null;
      }
    };
  }, [renderTick]);

  const resolveGridFromEvent = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const state = latestStateRef.current;
    const container = containerRef.current;
    if (!state || !container) {
      return null;
    }

    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const localX = event.clientX - centerX;
    const localY = event.clientY - centerY;
    const rotationRadians = -toRadians(rotationDegRef.current);
    const rotatedX = localX * Math.cos(rotationRadians) - localY * Math.sin(rotationRadians) + rect.width / 2;
    const rotatedY = localX * Math.sin(rotationRadians) + localY * Math.cos(rotationRadians) + rect.height / 2;

    const scale = state.tileScale || 1;
    const gridX = Math.floor(rotatedX / scale);
    const gridY = Math.floor(rotatedY / scale);
    const clampedX = Math.max(0, Math.min(state.mapWidth - 1, gridX));
    const clampedY = Math.max(0, Math.min(state.mapHeight - 1, gridY));
    return { gridX: clampedX, gridY: clampedY, renderX: rotatedX, renderY: rotatedY };
  }, []);

  const focusCamera = useCallback((coords: { gridX: number; gridY: number } | null, animate: boolean) => {
    if (!coords) {
      return;
    }
    miniMapService.emitInteraction({
      type: MINIMAP_VIEWPORT_CLICK_EVENT,
      gridX: coords.gridX,
      gridY: coords.gridY,
      animate,
    });
  }, []);

  const dispatchWaypointEvent = useCallback((target: Position) => {
    const state = latestStateRef.current;
    if (!state) {
      return;
    }
    const player = state.entities.find((entity) => entity.kind === 'player');
    if (!player) {
      return;
    }
    const detail: MiniMapPathPreviewDetail = {
      areaId: state.areaId,
      target,
      source: { x: player.x, y: player.y },
    };
    window.dispatchEvent(new CustomEvent<MiniMapPathPreviewDetail>(MINIMAP_PATH_PREVIEW_EVENT, { detail }));
  }, []);

  const updateHoverInfo = useCallback((renderX: number, renderY: number) => {
    const state = latestStateRef.current;
    if (!state) {
      hoverInfoRef.current = null;
      setHoverInfo(null);
      return;
    }

    const scale = state.tileScale || 1;
    const gridX = Math.floor(renderX / scale);
    const gridY = Math.floor(renderY / scale);

    const entityHit = state.entities.find((entity) => entity.x === gridX && entity.y === gridY && entity.kind !== 'player');
    if (entityHit) {
      hoverInfoRef.current = {
        label: `${entityHit.kind.toUpperCase()} • (${entityHit.x}, ${entityHit.y})`,
        x: renderX,
        y: renderY,
      };
      setHoverInfo(hoverInfoRef.current);
      return;
    }

    const player = state.entities.find((entity) => entity.kind === 'player');
    const objectiveHit = state.objectiveMarkers.find((marker) => marker.x === gridX && marker.y === gridY);
    if (objectiveHit && player) {
      const distance = distanceBetween({ x: player.x, y: player.y }, { x: objectiveHit.x, y: objectiveHit.y });
      hoverInfoRef.current = {
        label: `${objectiveHit.label} • d=${distance}`,
        x: renderX,
        y: renderY,
      };
      setHoverInfo(hoverInfoRef.current);
      return;
    }

    hoverInfoRef.current = null;
    setHoverInfo(null);
  }, []);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button === 1) {
      event.preventDefault();
      miniMapService.setZoom(1);
      miniMapService.centerOnPlayer(true);
      return;
    }

    if (event.button !== 0) {
      return;
    }

    const resolved = resolveGridFromEvent(event);
    if (!resolved) {
      return;
    }

    draggingRef.current = true;
    dragMovedRef.current = false;
    lastDragUpdateRef.current = performance.now();
    dragModeRef.current = event.shiftKey ? 'waypoint' : 'pan';

    if (dragModeRef.current === 'pan') {
      focusCamera(resolved, false);
    } else {
      const state = latestStateRef.current;
      const player = state?.entities.find((entity) => entity.kind === 'player');
      if (player) {
        draftPathRef.current = [{ x: player.x, y: player.y }, { x: resolved.gridX, y: resolved.gridY }];
        setRenderTick((tick) => tick + 1);
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const resolved = resolveGridFromEvent(event);
    if (!resolved) {
      return;
    }

    updateHoverInfo(resolved.renderX, resolved.renderY);

    if (!draggingRef.current) {
      return;
    }

    const now = performance.now();
    if (now - lastDragUpdateRef.current < 35) {
      return;
    }
    lastDragUpdateRef.current = now;
    dragMovedRef.current = true;

    if (dragModeRef.current === 'pan') {
      focusCamera(resolved, false);
    } else {
      const state = latestStateRef.current;
      const player = state?.entities.find((entity) => entity.kind === 'player');
      if (player) {
        draftPathRef.current = [{ x: player.x, y: player.y }, { x: resolved.gridX, y: resolved.gridY }];
        setRenderTick((tick) => tick + 1);
      }
    }
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingRef.current) {
      return;
    }

    const resolved = resolveGridFromEvent(event);
    draggingRef.current = false;

    if (!resolved) {
      draftPathRef.current = null;
      setRenderTick((tick) => tick + 1);
      return;
    }

    if (dragModeRef.current === 'pan') {
      focusCamera(resolved, !dragMovedRef.current);
    } else {
      draftPathRef.current = [{ x: resolved.gridX, y: resolved.gridY }];
      dispatchWaypointEvent({ x: resolved.gridX, y: resolved.gridY });
    }
    dragMovedRef.current = false;
  };

  const handleMouseLeave = () => {
    draggingRef.current = false;
    dragMovedRef.current = false;
    hoverInfoRef.current = null;
    setHoverInfo(null);
    draftPathRef.current = null;
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = clamp(event.deltaY, -120, 120);
    const adjustment = delta < 0 ? 0.15 : -0.15;
    miniMapService.adjustZoom(adjustment);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const state = latestStateRef.current;
    if (!state) {
      return;
    }
    const viewport = state.viewport;
    const step = Math.max(1, Math.floor(viewport.width * 0.1));
    let targetX = viewport.x + viewport.width / 2;
    let targetY = viewport.y + viewport.height / 2;
    switch (event.key) {
      case 'ArrowUp':
        targetY -= step;
        break;
      case 'ArrowDown':
        targetY += step;
        break;
      case 'ArrowLeft':
        targetX -= step;
        break;
      case 'ArrowRight':
        targetX += step;
        break;
      default:
        break;
    }
    miniMapService.emitInteraction({
      type: MINIMAP_VIEWPORT_CLICK_EVENT,
      gridX: clamp(Math.round(targetX), 0, state.mapWidth - 1),
      gridY: clamp(Math.round(targetY), 0, state.mapHeight - 1),
      animate: false,
    });
  };

  const activeState = resolveState();

  if (!activeState) {
    return null;
  }

  const playerEntity = activeState.entities.find((entity) => entity.kind === 'player');
  const playerX = playerEntity ? Math.round(playerEntity.x) : 0;
  const playerY = playerEntity ? Math.round(playerEntity.y) : 0;

  const zoomPercent = Math.round(userZoom * 100);

  const handleZoomInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value) / 100;
    miniMapService.setZoom(value);
  };

  const handleZoomButton = (direction: 'in' | 'out') => {
    miniMapService.adjustZoom(direction === 'in' ? 0.15 : -0.15);
  };

  const handleCenterClick = () => {
    miniMapService.centerOnPlayer(true);
  };

  const handleObjectiveFocus = (objective: MiniMapObjectiveDetail) => {
    miniMapService.emitInteraction({
      type: MINIMAP_OBJECTIVE_FOCUS_EVENT,
      target: { x: objective.x, y: objective.y },
      areaId: activeState.areaId,
      animate: true,
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        fontFamily: "'DM Mono', 'IBM Plex Mono', monospace",
        color: '#e2e8f0',
        background: PANEL_BACKGROUND,
        borderRadius: '14px',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        padding: '0.75rem',
        boxShadow: '0 18px 40px rgba(8, 12, 24, 0.35)',
        outline: 'none',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: '0.62rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'rgba(148, 163, 184, 0.85)',
          }}
        >
          {uiStrings.miniMap.heading}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.68rem',
            color: 'rgba(148, 163, 184, 0.85)',
          }}
        >
          <span>{activeState.mapWidth}×{activeState.mapHeight}</span>
          <span>
            {activeState.areaName}
          </span>
        </span>
      </header>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '12px',
          overflow: 'hidden',
          background: CARD_BACKGROUND,
          padding: '0.45rem',
          boxShadow: 'inset 0 0 0 1px rgba(56, 189, 248, 0.14)',
        }}
      >
        <div
          ref={containerRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          role="application"
          aria-label={uiStrings.miniMap.heading}
          style={{
            position: 'relative',
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            cursor: 'pointer',
            userSelect: 'none',
            transform: `rotate(${rotationDegRef.current}deg)`,
            transformOrigin: 'center',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          onContextMenu={(event) => event.preventDefault()}
        >
          <canvas
            ref={tileCanvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              imageRendering: 'pixelated',
              pointerEvents: 'none',
            }}
          />
          <canvas
            ref={overlayCanvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          />
          <canvas
            ref={entityCanvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          />
          <canvas
            ref={pathCanvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          />
          <canvas
            ref={viewportCanvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          />
          {hoverInfo && (
            <span
              style={{
                position: 'absolute',
                left: `${hoverInfo.x}px`,
                top: `${hoverInfo.y}px`,
                transform: 'translate(-50%, -120%)',
                padding: '0.2rem 0.35rem',
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(59, 130, 246, 0.45)',
                borderRadius: '6px',
                fontSize: '0.58rem',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {hoverInfo.label}
            </span>
          )}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.55rem',
          fontSize: '0.6rem',
          color: 'rgba(148, 163, 184, 0.85)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1, minWidth: 0 }}>
            <button
              type="button"
              onClick={() => handleZoomButton('out')}
              style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '999px',
                color: '#bfdbfe',
                width: '1.6rem',
                height: '1.6rem',
                cursor: 'pointer',
              }}
              aria-label="Zoom out minimap"
            >
              −
            </button>
            <input
              type="range"
              min={Math.round(60)}
              max={Math.round(300)}
              value={Math.round(clamp(userZoom, 0.6, 3) * 100)}
              onChange={handleZoomInput}
              style={{ flex: 1 }}
              aria-label="Mini-map zoom"
            />
            <button
              type="button"
              onClick={() => handleZoomButton('in')}
              style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '999px',
                color: '#bfdbfe',
                width: '1.6rem',
                height: '1.6rem',
                cursor: 'pointer',
              }}
              aria-label="Zoom in minimap"
            >
              +
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleCenterClick}
              style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '999px',
                color: '#e0f2fe',
                padding: '0.26rem 0.62rem',
                cursor: 'pointer',
                letterSpacing: '0.08em',
                fontSize: '0.62rem',
                textTransform: 'uppercase',
              }}
            >
              Center
            </button>
            <button
              type="button"
              onClick={() => setLegendOpen((open) => !open)}
              style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '999px',
                color: '#e0f2fe',
                padding: '0.26rem 0.62rem',
                cursor: 'pointer',
                letterSpacing: '0.08em',
                fontSize: '0.62rem',
                textTransform: 'uppercase',
              }}
            >
              {legendOpen ? 'Hide Legend' : 'Show Legend'}
            </button>
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '0.45rem',
          }}
        >
          <div>
            <span style={{ display: 'block', marginBottom: '0.25rem', opacity: 0.7 }}>Cell Coords</span>
            <span>({playerX}, {playerY})</span>
          </div>
          <div>
            <span style={{ display: 'block', marginBottom: '0.25rem', opacity: 0.7 }}>Zoom</span>
            <span>{zoomPercent}%</span>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            flexWrap: 'wrap',
            fontSize: '0.58rem',
          }}
        >
          <span style={{ opacity: 0.55 }}>Use zoom + shift for waypoint targeting</span>
        </div>
      </div>
      {legendOpen && (
        <footer
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            fontSize: '0.66rem',
            color: 'rgba(148, 163, 184, 0.85)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '0.4rem',
            }}
          >
            {legendItems.map((item) => (
              <span
                key={item.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    display: 'inline-block',
                    width: '0.7rem',
                    height: '0.7rem',
                    borderRadius: '0.25rem',
                    background: item.color,
                    boxShadow: `0 0 8px ${item.color}`,
                  }}
                />
                <span>{item.label}</span>
              </span>
            ))}
          </div>
          <div>
            <div style={{ marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '0.58rem', opacity: 0.7 }}>
              {uiStrings.miniMap.objectivesHeading ?? 'Tracked Objectives'}
            </div>
            {activeState.objectiveMarkers.length === 0 ? (
              <span style={{ opacity: 0.6 }}>{uiStrings.miniMap.noObjectives ?? 'No objectives visible.'}</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {activeState.objectiveMarkers.map((objective) => (
                  <div
                    key={objective.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.6rem',
                    }}
                  >
                    <span>
                      {objective.label} ({objective.x}, {objective.y})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleObjectiveFocus(objective)}
                      style={{
                        background: 'rgba(15, 23, 42, 0.65)',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        borderRadius: '999px',
                        color: '#e0f2fe',
                        padding: '0.2rem 0.6rem',
                        cursor: 'pointer',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Focus
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </footer>
      )}
    </div>
  );
};

export default MiniMap;
