import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getUIStrings } from '../../content/ui';
import {
  MINIMAP_STATE_EVENT,
  MINIMAP_VIEWPORT_CLICK_EVENT,
  MiniMapStateDetail,
  MiniMapEntityDetail,
  TileTypeGrid,
} from '../../game/events';
import { miniMapService } from '../../game/services/miniMapService';

const TILE_COLORS: Record<string, string> = {
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

const CURFEW_BORDER = {
  active: 'rgba(126, 232, 201, 0.7)',
  inactive: 'rgba(59, 130, 246, 0.55)',
};

const GRID_LINE_COLOR = 'rgba(15, 23, 42, 0.3)';

const PANEL_BACKGROUND = 'linear-gradient(155deg, rgba(14, 22, 40, 0.92), rgba(8, 12, 24, 0.88))';
const CARD_BACKGROUND = 'linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.58))';

type LegendItem = {
  id: MiniMapEntityDetail['kind'];
  label: string;
  color: string;
};

const LEGEND_ITEMS: LegendItem[] = [
  { id: 'player', label: 'Cell Lead', color: ENTITY_STYLE.player.fill },
  { id: 'enemy', label: 'Hostile', color: ENTITY_STYLE.enemy.fill },
  { id: 'npc', label: 'Neutral', color: ENTITY_STYLE.npc.fill },
  { id: 'objective', label: 'Objective', color: ENTITY_STYLE.objective.fill },
];

type TileCache = {
  areaId: string;
  tileVersion: number;
  canvas: HTMLCanvasElement | null;
};

const createTileCache = (): TileCache => ({ areaId: '', tileVersion: -1, canvas: null });

const getTileColor = (type: string): string => TILE_COLORS[type.toLowerCase()] ?? TILE_COLORS.default;

const clamp = (value: number, min: number, max: number): number => {
  if (max < min) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
};

const drawTilesToCanvas = (tiles: TileTypeGrid, tileScale: number): HTMLCanvasElement => {
  const width = tiles[0]?.length ?? 0;
  const height = tiles.length;
  const offscreen = document.createElement('canvas');
  offscreen.width = Math.max(1, Math.ceil(width * tileScale));
  offscreen.height = Math.max(1, Math.ceil(height * tileScale));
  const ctx = offscreen.getContext('2d');

  if (!ctx) {
    return offscreen;
  }

  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const tile = tiles[y][x];
      const fill = getTileColor(tile.type);
      ctx.fillStyle = fill;
      ctx.fillRect(x * tileScale, y * tileScale, tileScale, tileScale);

      if (tile.provideCover) {
        ctx.fillStyle = 'rgba(14, 116, 144, 0.45)';
        ctx.fillRect(x * tileScale, y * tileScale, tileScale, tileScale);
      }
    }
  }

  if (tileScale >= 2) {
    ctx.strokeStyle = GRID_LINE_COLOR;
    ctx.lineWidth = Math.max(1, tileScale * 0.08);

    const gridStep = Math.max(4, Math.round(16 / tileScale));

    for (let gx = 0; gx <= width; gx += gridStep) {
      const xPos = gx * tileScale;
      ctx.beginPath();
      ctx.moveTo(xPos + 0.5, 0);
      ctx.lineTo(xPos + 0.5, offscreen.height);
      ctx.stroke();
    }

    for (let gy = 0; gy <= height; gy += gridStep) {
      const yPos = gy * tileScale;
      ctx.beginPath();
      ctx.moveTo(0, yPos + 0.5);
      ctx.lineTo(offscreen.width, yPos + 0.5);
      ctx.stroke();
    }
  }

  return offscreen;
};

const drawBorder = (
  ctx: CanvasRenderingContext2D,
  cssWidth: number,
  cssHeight: number,
  state: MiniMapStateDetail,
) => {
  ctx.save();
  const borderColor = state.curfewActive ? CURFEW_BORDER.active : CURFEW_BORDER.inactive;
  ctx.lineWidth = Math.max(2, state.tileScale * 0.55);
  ctx.strokeStyle = borderColor;
  ctx.strokeRect(1.5, 1.5, cssWidth - 3, cssHeight - 3);
  ctx.lineWidth = Math.max(1, state.tileScale * 0.25);
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
  ctx.strokeRect(3, 3, cssWidth - 6, cssHeight - 6);
  ctx.restore();
};

const drawEntities = (ctx: CanvasRenderingContext2D, state: MiniMapStateDetail) => {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  state.entities.forEach((entity) => {
    const style = ENTITY_STYLE[entity.kind] ?? ENTITY_STYLE.npc;
    const centerX = (entity.x + 0.5) * state.tileScale;
    const centerY = (entity.y + 0.5) * state.tileScale;
    const size = Math.max(3, state.tileScale * style.size);

    ctx.globalAlpha = entity.status === 'inactive' ? 0.4 : 1;
    ctx.fillStyle = style.fill;
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = Math.max(1, size * 0.35);

    if (entity.kind === 'player') {
      ctx.save();
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
      ctx.restore();
    } else if (entity.kind === 'enemy') {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.9, size * 0.9);
      ctx.lineTo(-size * 0.9, size * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
  ctx.restore();
};

const drawViewport = (ctx: CanvasRenderingContext2D, state: MiniMapStateDetail) => {
  const { viewport, tileScale, logicalWidth, logicalHeight } = state;
  if (!viewport || viewport.width <= 0 || viewport.height <= 0) {
    return;
  }

  const viewportX = viewport.x * tileScale;
  const viewportY = viewport.y * tileScale;
  const viewportWidth = viewport.width * tileScale;
  const viewportHeight = viewport.height * tileScale;

  const safeWidth = Math.max(viewportWidth, 0.0001);
  const safeHeight = Math.max(viewportHeight, 0.0001);

  const minWidthPx = Math.max(8, tileScale * 3);
  const minHeightPx = Math.max(6, tileScale * 2);

  const widthScale = safeWidth < minWidthPx ? minWidthPx / safeWidth : 1;
  const heightScale = safeHeight < minHeightPx ? minHeightPx / safeHeight : 1;
  const scaleFactor = Math.max(widthScale, heightScale);

  const renderWidth = safeWidth * scaleFactor;
  const renderHeight = safeHeight * scaleFactor;

  const centerX = viewportX + safeWidth / 2;
  const centerY = viewportY + safeHeight / 2;

  const availableWidth = logicalWidth - renderWidth;
  const availableHeight = logicalHeight - renderHeight;

  const renderX = availableWidth <= 0
    ? (logicalWidth - renderWidth) / 2
    : clamp(centerX - renderWidth / 2, 0, availableWidth);
  const renderY = availableHeight <= 0
    ? (logicalHeight - renderHeight) / 2
    : clamp(centerY - renderHeight / 2, 0, availableHeight);

  ctx.save();
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

const MiniMap: React.FC = () => {
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tileCacheRef = useRef<TileCache>(createTileCache());
  const canvasSizeRef = useRef<{ width: number; height: number }>({ width: 140, height: 110 });
  const latestStateRef = useRef<MiniMapStateDetail | null>(miniMapService.getState());
  const draggingRef = useRef(false);
  const dragMovedRef = useRef(false);
  const lastDragUpdateRef = useRef(0);

  const [renderTick, setRenderTick] = useState(0);
  const [canvasSize, setCanvasSize] = useState(canvasSizeRef.current);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<MiniMapStateDetail>).detail;
      latestStateRef.current = detail;
      setRenderTick(detail.version);
    };

    miniMapService.addEventListener(MINIMAP_STATE_EVENT, handler as EventListener);
    miniMapService.requestImmediateState();

    return () => {
      miniMapService.removeEventListener(MINIMAP_STATE_EVENT, handler as EventListener);
    };
  }, []);

  useEffect(() => {
    const activeState = latestStateRef.current;
    if (!activeState) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const cssWidth = Math.max(1, Math.round(activeState.logicalWidth));
    const cssHeight = Math.max(1, Math.round(activeState.logicalHeight));
    const dpr = activeState.devicePixelRatio || 1;

    if (
      canvasSizeRef.current.width !== cssWidth ||
      canvasSizeRef.current.height !== cssHeight
    ) {
      canvasSizeRef.current = { width: cssWidth, height: cssHeight };
      setCanvasSize(canvasSizeRef.current);
    }

    const targetWidth = Math.max(1, Math.round(cssWidth * dpr));
    const targetHeight = Math.max(1, Math.round(cssHeight * dpr));

    if (canvas.width !== targetWidth) {
      canvas.width = targetWidth;
    }
    if (canvas.height !== targetHeight) {
      canvas.height = targetHeight;
    }

    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const cache = tileCacheRef.current;
    if (
      !cache.canvas ||
      cache.areaId !== activeState.areaId ||
      cache.tileVersion !== activeState.tileVersion
    ) {
      cache.canvas = drawTilesToCanvas(activeState.tiles, activeState.tileScale);
      cache.areaId = activeState.areaId;
      cache.tileVersion = activeState.tileVersion;
    }

    if (cache.canvas) {
      ctx.drawImage(cache.canvas, 0, 0, cssWidth, cssHeight);
    }

    drawBorder(ctx, cssWidth, cssHeight, activeState);
    drawEntities(ctx, activeState);
    drawViewport(ctx, activeState);
  }, [renderTick, locale]);

  const resolveGridFromEvent = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const state = latestStateRef.current;
    const canvas = canvasRef.current;
    if (!state || !canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const scale = state.tileScale || 1;

    const gridX = Math.floor(x / scale);
    const gridY = Math.floor(y / scale);
    const clampedX = Math.max(0, Math.min(state.mapWidth - 1, gridX));
    const clampedY = Math.max(0, Math.min(state.mapHeight - 1, gridY));
    return { gridX: clampedX, gridY: clampedY };
  };

  const focusCamera = (coords: { gridX: number; gridY: number } | null, animate: boolean) => {
    if (!coords) {
      return;
    }
    miniMapService.emitInteraction({
      type: MINIMAP_VIEWPORT_CLICK_EVENT,
      gridX: coords.gridX,
      gridY: coords.gridY,
      animate,
    });
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) {
      return;
    }
    draggingRef.current = true;
    dragMovedRef.current = false;
    lastDragUpdateRef.current = performance.now();
    focusCamera(resolveGridFromEvent(event), false);
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) {
      return;
    }
    const now = performance.now();
    if (now - lastDragUpdateRef.current < 40) {
      return;
    }
    lastDragUpdateRef.current = now;
    dragMovedRef.current = true;
    focusCamera(resolveGridFromEvent(event), false);
  };

  const handleCanvasMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) {
      return;
    }
    const coords = resolveGridFromEvent(event);
    const shouldAnimate = !dragMovedRef.current;
    draggingRef.current = false;
    dragMovedRef.current = false;
    focusCamera(coords, shouldAnimate);
  };

  const handleCanvasMouseLeave = () => {
    draggingRef.current = false;
    dragMovedRef.current = false;
  };

  const activeState = latestStateRef.current;

  if (!activeState) {
    return null;
  }

  const playerEntity = activeState.entities.find((entity) => entity.kind === 'player');
  const playerX = playerEntity ? Math.round(playerEntity.x) : 0;
  const playerY = playerEntity ? Math.round(playerEntity.y) : 0;

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
        <canvas
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseLeave}
          onContextMenu={(event) => event.preventDefault()}
          style={{
            display: 'block',
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            imageRendering: 'pixelated',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
          }}
        />
      </div>
      <footer
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.45rem',
          fontSize: '0.66rem',
          color: 'rgba(148, 163, 184, 0.85)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Cell Coords</span>
          <span>({playerX}, {playerY})</span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '0.4rem',
          }}
        >
          {LEGEND_ITEMS.map((item) => (
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
      </footer>
    </div>
  );
};

export default MiniMap;
