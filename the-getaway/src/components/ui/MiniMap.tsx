import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CameraAlertState } from '../../game/interfaces/types';
import {
  MINIMAP_STATE_EVENT,
  MINIMAP_VIEWPORT_CLICK_EVENT,
  MiniMapRenderState,
  MiniMapEntityDetail,
  MiniMapCameraDetail,
} from '../../game/events';
import { miniMapService } from '../../game/services/miniMapService';

const TILE_COLORS: Record<string, string> = {
  floor: '#0b1529',
  wall: '#1f2937',
  door: '#fbbf24',
  cover: '#1d4ed8',
  water: '#0ea5e9',
  trap: '#7c3aed',
  default: '#0d1221',
};

const ENTITY_COLORS: Record<MiniMapEntityDetail['kind'], string> = {
  player: '#60a5fa',
  enemy: '#f87171',
  npc: '#34d399',
  objective: '#facc15',
};

const CAMERA_COLORS: Record<CameraAlertState, string> = {
  [CameraAlertState.IDLE]: '#38bdf8',
  [CameraAlertState.SUSPICIOUS]: '#fbbf24',
  [CameraAlertState.ALARMED]: '#ef4444',
  [CameraAlertState.DISABLED]: '#64748b',
};

interface DrawContext {
  ctx: CanvasRenderingContext2D;
  state: MiniMapRenderState;
  scale: number;
}

interface ViewportSize {
  width: number;
  height: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const getFixedViewportSize = (
  viewport: { width: number; height: number },
  bounds: { width: number; height: number },
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
  height: number,
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
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  return ctx;
};

const drawTiles = ({ ctx, state, scale }: DrawContext) => {
  const { tiles, tileScale, logicalWidth, logicalHeight } = state;

  const background = ctx.createLinearGradient(0, 0, logicalWidth, logicalHeight);
  background.addColorStop(0, 'rgba(11, 20, 34, 0.92)');
  background.addColorStop(1, 'rgba(8, 12, 24, 0.96)');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  for (let y = 0; y < tiles.length; y += 1) {
    for (let x = 0; x < tiles[y].length; x += 1) {
      const tile = tiles[y][x];
      const color = TILE_COLORS[tile.type.toLowerCase()] ?? TILE_COLORS.default;
      ctx.fillStyle = color;
      ctx.fillRect(x * tileScale, y * tileScale, tileScale, tileScale);
      if (tile.provideCover) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.fillRect(x * tileScale, y * tileScale, tileScale, tileScale);
      }
    }
  }

  if (tileScale >= 2) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = Math.max(1, tileScale * 0.06) / scale;
    for (let gx = 0; gx <= tiles[0].length; gx += 1) {
      ctx.beginPath();
      ctx.moveTo(gx * tileScale + 0.5, 0);
      ctx.lineTo(gx * tileScale + 0.5, logicalHeight);
      ctx.stroke();
    }
    for (let gy = 0; gy <= tiles.length; gy += 1) {
      ctx.beginPath();
      ctx.moveTo(0, gy * tileScale + 0.5);
      ctx.lineTo(logicalWidth, gy * tileScale + 0.5);
      ctx.stroke();
    }
  }
};

const drawOverlay = ({ ctx, state, scale }: DrawContext) => {
  const { logicalWidth, logicalHeight, curfewActive } = state;

  if (curfewActive) {
    const glow = ctx.createRadialGradient(
      logicalWidth / 2,
      logicalHeight / 2,
      Math.min(logicalWidth, logicalHeight) * 0.1,
      logicalWidth / 2,
      logicalHeight / 2,
      Math.max(logicalWidth, logicalHeight) * 0.8,
    );
    glow.addColorStop(0, 'rgba(96, 165, 250, 0.18)');
    glow.addColorStop(1, 'rgba(96, 165, 250, 0.04)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);
  }

  ctx.lineWidth = 1.5 / scale;
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.55)';
  ctx.strokeRect(1, 1, logicalWidth - 2, logicalHeight - 2);

  ctx.lineWidth = 1 / scale;
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.65)';
  ctx.strokeRect(2.5, 2.5, logicalWidth - 5, logicalHeight - 5);
};

const drawEntities = ({ ctx, state, scale }: DrawContext) => {
  const { tileScale, entities, cameras } = state;
  const objectiveMarkers = state.objectiveMarkers ?? [];

  entities.forEach((entity) => {
    const color = ENTITY_COLORS[entity.kind] ?? ENTITY_COLORS.npc;
    const radius = Math.max(3, tileScale * (entity.kind === 'player' ? 0.7 : 0.5));
    const x = (entity.x + 0.5) * tileScale;
    const y = (entity.y + 0.5) * tileScale;

    ctx.save();
    if (entity.status !== 'inactive') {
      ctx.shadowColor = color;
      ctx.shadowBlur = Math.max(4, radius * 1.5) / scale;
    }

    if (entity.kind === 'player') {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y - radius);
      ctx.lineTo(x + radius, y + radius);
      ctx.lineTo(x - radius, y + radius);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = entity.status === 'inactive' ? 'rgba(148, 163, 184, 0.35)' : color;
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.85, 0, Math.PI * 2);
      ctx.fill();
      if (entity.kind === 'enemy') {
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.lineWidth = Math.max(1, radius * 0.3) / scale;
        ctx.stroke();
      }
    }
    ctx.restore();
  });

  objectiveMarkers.forEach((objective) => {
    const ring = Math.max(5, tileScale * 0.55);
    const x = (objective.x + 0.5) * tileScale;
    const y = (objective.y + 0.5) * tileScale;
    ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
    ctx.beginPath();
    ctx.arc(x, y, ring, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.95)';
    ctx.lineWidth = Math.max(1, tileScale * 0.14) / scale;
    ctx.beginPath();
    ctx.arc(x, y, ring * 0.7, 0, Math.PI * 2);
    ctx.stroke();
  });

  cameras.forEach((camera: MiniMapCameraDetail) => {
    const color = camera.isActive ? CAMERA_COLORS[camera.alertState] : CAMERA_COLORS[CameraAlertState.DISABLED];
    const radius = Math.max(3, tileScale * 0.4);
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
    ctx.restore();
  });
};

const drawPath = ({ ctx, state, scale }: DrawContext) => {
  const { path, tileScale } = state;
  if (!path || path.length < 2) {
    return;
  }
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.85)';
  ctx.lineWidth = Math.max(1.5, tileScale * 0.2) / scale;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.setLineDash([tileScale * 0.9, tileScale * 0.6]);
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
  ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
  ctx.beginPath();
  ctx.arc(goalX, goalY, Math.max(4, tileScale * 0.45), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.95)';
  ctx.lineWidth = Math.max(1, tileScale * 0.14) / scale;
  ctx.beginPath();
  ctx.arc(goalX, goalY, Math.max(3, tileScale * 0.3), 0, Math.PI * 2);
  ctx.stroke();
};

const drawViewport = ({ ctx, state, scale }: DrawContext, fixedSize: ViewportSize) => {
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

  ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
  ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

  ctx.strokeStyle = 'rgba(59, 130, 246, 0.95)';
  ctx.lineWidth = Math.max(1.5, tileScale * 0.28) / scale;
  ctx.setLineDash([tileScale * 1.5, tileScale * 1.5]);
  ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
  ctx.setLineDash([]);

  const cornerSize = Math.max(4, tileScale * 0.7);
  ctx.lineWidth = Math.max(1, tileScale * 0.25) / scale;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';

  ctx.beginPath();
  ctx.moveTo(rectX, rectY + cornerSize);
  ctx.lineTo(rectX, rectY);
  ctx.lineTo(rectX + cornerSize, rectY);

  ctx.moveTo(rectX + rectWidth - cornerSize, rectY);
  ctx.lineTo(rectX + rectWidth, rectY);
  ctx.lineTo(rectX + rectWidth, rectY + cornerSize);

  ctx.moveTo(rectX, rectY + rectHeight - cornerSize);
  ctx.lineTo(rectX, rectY + rectHeight);
  ctx.lineTo(rectX + cornerSize, rectY + rectHeight);

  ctx.moveTo(rectX + rectWidth - cornerSize, rectY + rectHeight);
  ctx.lineTo(rectX + rectWidth, rectY + rectHeight);
  ctx.lineTo(rectX + rectWidth, rectY + rectHeight - cornerSize);
  ctx.stroke();

  const reticleSize = Math.max(3, tileScale * 0.8);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
  ctx.lineWidth = Math.max(1, tileScale * 0.22) / scale;
  ctx.beginPath();
  ctx.moveTo(centerX - reticleSize, centerY);
  ctx.lineTo(centerX + reticleSize, centerY);
  ctx.moveTo(centerX, centerY - reticleSize);
  ctx.lineTo(centerX, centerY + reticleSize);
  ctx.stroke();
};

const drawMiniMap = (
  canvas: HTMLCanvasElement | null,
  state: MiniMapRenderState,
  width: number,
  height: number,
  fixedViewportSize: ViewportSize,
) => {
  const ctx = prepareCanvas(canvas, width, height);
  if (!ctx) {
    return;
  }
  ctx.clearRect(0, 0, width, height);

  const { logicalWidth, logicalHeight } = state;
  if (logicalWidth === 0 || logicalHeight === 0) {
    return;
  }

  const scale = Math.min(width / logicalWidth, height / logicalHeight);
  const offsetX = (width - logicalWidth * scale) / 2;
  const offsetY = (height - logicalHeight * scale) / 2;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  const drawContext: DrawContext = { ctx, state, scale };
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
  const latestStateRef = useRef<MiniMapRenderState | null>(miniMapService.getState());
  const [dimensions, setDimensions] = useState({ width: 280, height: 180 });
  const [renderToken, setRenderToken] = useState(0);
  const viewportSizeRef = useRef<ViewportSize | null>(null);
  const lastAreaIdRef = useRef<string | null>(null);

  const draggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const dragMovedRef = useRef(false);

  const resolveState = () => latestStateRef.current;

  const ensureViewportSize = useCallback((state: MiniMapRenderState) => {
    const viewport = state.viewport;
    if (!viewport) {
      return;
    }
    if (lastAreaIdRef.current !== state.areaId) {
      viewportSizeRef.current = null;
      lastAreaIdRef.current = state.areaId;
    }
    const fixed = getFixedViewportSize(viewport, { width: state.mapWidth, height: state.mapHeight });
    const current = viewportSizeRef.current;
    if (!current || current.width !== fixed.width || current.height !== fixed.height) {
      viewportSizeRef.current = fixed;
    }
  }, []);

  useEffect(() => {
    const handleState = (event: Event) => {
      const detail = (event as CustomEvent<MiniMapRenderState>).detail;
      latestStateRef.current = detail;
      ensureViewportSize(detail);
      setRenderToken(detail.version);
    };
    miniMapService.addEventListener(MINIMAP_STATE_EVENT, handleState as EventListener);
    miniMapService.requestImmediateState();
    return () => {
      miniMapService.removeEventListener(MINIMAP_STATE_EVENT, handleState as EventListener);
    };
  }, [ensureViewportSize]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(() => {
      const width = Math.max(160, Math.floor(element.clientWidth));
      const height = Math.max(120, Math.floor(element.clientHeight));
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
    if (!state || !size) {
      return;
    }
    drawMiniMap(canvasRef.current, state, dimensions.width, dimensions.height, size);
  }, [dimensions.width, dimensions.height, renderToken]);

  const resolveGridFromPointer = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const state = resolveState();
    const canvas = canvasRef.current;
    if (!state || !canvas) {
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    if (width === 0 || height === 0) {
      return null;
    }

    const scale = Math.min(width / state.logicalWidth, height / state.logicalHeight);
    const offsetX = (width - state.logicalWidth * scale) / 2;
    const offsetY = (height - state.logicalHeight * scale) / 2;

    const localX = (event.clientX - rect.left - offsetX) / scale;
    const localY = (event.clientY - rect.top - offsetY) / scale;

    const gridX = clamp(localX / state.tileScale, 0, state.mapWidth);
    const gridY = clamp(localY / state.tileScale, 0, state.mapHeight);
    return { gridX, gridY };
  }, []);

  const focusCamera = useCallback((coords: { gridX: number; gridY: number } | null, animate: boolean) => {
    if (!coords) {
      return;
    }
    const state = resolveState();
    const viewport = state?.viewport;
    if (!state || !viewport) {
      return;
    }

    const fixedSize =
      viewportSizeRef.current ?? getFixedViewportSize(viewport, { width: state.mapWidth, height: state.mapHeight });

    const halfWidth = fixedSize.width / 2;
    const halfHeight = fixedSize.height / 2;

    const centerX = clamp(coords.gridX, halfWidth, Math.max(halfWidth, state.mapWidth - halfWidth));
    const centerY = clamp(coords.gridY, halfHeight, Math.max(halfHeight, state.mapHeight - halfHeight));

    viewportSizeRef.current = fixedSize;

    miniMapService.emitInteraction({
      type: MINIMAP_VIEWPORT_CLICK_EVENT,
      gridX: centerX,
      gridY: centerY,
      animate,
    });
  }, [resolveState]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch' && event.button !== 0) {
      return;
    }
    const coords = resolveGridFromPointer(event);
    if (!coords) {
      return;
    }
    draggingRef.current = true;
    dragMovedRef.current = false;
    pointerIdRef.current = event.pointerId;
    if (typeof event.currentTarget.setPointerCapture === 'function') {
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
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const state = resolveState();
    if (!state) {
      return;
    }
    const fixedSize =
      viewportSizeRef.current ?? getFixedViewportSize(state.viewport, { width: state.mapWidth, height: state.mapHeight });
    const step = Math.max(1, Math.floor(fixedSize.width * 0.2));
    let targetX = (state.viewport.x + state.viewport.width / 2);
    let targetY = (state.viewport.y + state.viewport.height / 2);
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
    focusCamera({ gridX: targetX, gridY: targetY }, false);
  };

  const state = resolveState();
  if (!state || !viewportSizeRef.current) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="MiniMap"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerLeave}
      style={{
        position: 'relative',
        display: 'flex',
        width: '100%',
        height: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'radial-gradient(circle at top, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.95))',
        boxShadow: '0 18px 40px rgba(8, 12, 24, 0.35)',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};

export default React.memo(MiniMap);
