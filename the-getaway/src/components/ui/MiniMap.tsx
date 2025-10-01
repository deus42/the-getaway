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
  floor: '#1e293b',
  wall: '#475569',
  door: '#facc15',
  cover: '#0f766e',
  water: '#0ea5e9',
  trap: '#7c3aed',
  default: '#1f2937',
};

const ENTITY_STYLE: Record<MiniMapEntityDetail['kind'], { fill: string; stroke: string; radius: number }> = {
  player: { fill: '#38bdf8', stroke: 'rgba(224, 242, 254, 0.85)', radius: 0.55 },
  enemy: { fill: '#ef4444', stroke: 'rgba(248, 113, 113, 0.85)', radius: 0.4 },
  npc: { fill: '#22c55e', stroke: 'rgba(187, 247, 208, 0.9)', radius: 0.35 },
  objective: { fill: '#fbbf24', stroke: 'rgba(253, 230, 138, 0.85)', radius: 0.35 },
};

const CURFEW_BORDER = {
  active: 'rgba(126, 232, 201, 0.65)',
  inactive: 'rgba(59, 130, 246, 0.55)',
};

const GRID_LINE_COLOR = 'rgba(15, 23, 42, 0.35)';

type TileCache = {
  areaId: string;
  tileVersion: number;
  canvas: HTMLCanvasElement | null;
};

const createTileCache = (): TileCache => ({ areaId: '', tileVersion: -1, canvas: null });

const getTileColor = (type: string): string => TILE_COLORS[type.toLowerCase()] ?? TILE_COLORS.default;

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

  ctx.strokeStyle = GRID_LINE_COLOR;
  ctx.lineWidth = Math.max(1, tileScale * 0.1);

  const gridStep = Math.max(4, Math.round(12 / tileScale));

  for (let gx = 0; gx <= width; gx += gridStep) {
    const xPos = gx * tileScale;
    ctx.beginPath();
    ctx.moveTo(xPos, 0);
    ctx.lineTo(xPos, offscreen.height);
    ctx.stroke();
  }

  for (let gy = 0; gy <= height; gy += gridStep) {
    const yPos = gy * tileScale;
    ctx.beginPath();
    ctx.moveTo(0, yPos);
    ctx.lineTo(offscreen.width, yPos);
    ctx.stroke();
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
  ctx.lineWidth = Math.max(2, state.tileScale * 0.6);
  ctx.strokeStyle = state.curfewActive ? CURFEW_BORDER.active : CURFEW_BORDER.inactive;
  ctx.strokeRect(1, 1, cssWidth - 2, cssHeight - 2);
  ctx.restore();
};

const drawEntities = (ctx: CanvasRenderingContext2D, state: MiniMapStateDetail) => {
  ctx.save();
  state.entities.forEach((entity) => {
    const style = ENTITY_STYLE[entity.kind] ?? ENTITY_STYLE.npc;
    const centerX = (entity.x + 0.5) * state.tileScale;
    const centerY = (entity.y + 0.5) * state.tileScale;
    const radius = Math.max(2, state.tileScale * style.radius);

    ctx.beginPath();
    ctx.fillStyle = style.fill;
    ctx.globalAlpha = entity.status === 'inactive' ? 0.35 : 1;
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = Math.max(1, radius * 0.45);
    ctx.strokeStyle = style.stroke;
    ctx.stroke();
  });
  ctx.restore();
};

const drawViewport = (ctx: CanvasRenderingContext2D, state: MiniMapStateDetail) => {
  const { viewport, tileScale } = state;
  if (!viewport || viewport.width <= 0 || viewport.height <= 0) {
    return;
  }

  const viewportX = viewport.x * tileScale;
  const viewportY = viewport.y * tileScale;
  const viewportWidth = viewport.width * tileScale;
  const viewportHeight = viewport.height * tileScale;

  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(viewportX, viewportY, viewportWidth, viewportHeight);

  ctx.lineWidth = Math.max(1.5, tileScale * 0.3);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
  ctx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);

  const cornerSize = Math.max(3, tileScale * 0.8);
  ctx.fillStyle = 'rgba(56, 189, 248, 0.95)';

  ctx.fillRect(viewportX - 1, viewportY - 1, cornerSize, cornerSize);
  ctx.fillRect(viewportX + viewportWidth - cornerSize + 1, viewportY - 1, cornerSize, cornerSize);
  ctx.fillRect(viewportX - 1, viewportY + viewportHeight - cornerSize + 1, cornerSize, cornerSize);
  ctx.fillRect(
    viewportX + viewportWidth - cornerSize + 1,
    viewportY + viewportHeight - cornerSize + 1,
    cornerSize,
    cornerSize,
  );
  ctx.restore();
};

const MiniMap: React.FC = () => {
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tileCacheRef = useRef<TileCache>(createTileCache());
  const canvasSizeRef = useRef<{ width: number; height: number }>({ width: 140, height: 110 });
  const latestStateRef = useRef<MiniMapStateDetail | null>(miniMapService.getState());

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

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const state = latestStateRef.current;
    const canvas = canvasRef.current;
    if (!state || !canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const scale = state.tileScale || 1;

    const gridX = Math.floor(x / scale);
    const gridY = Math.floor(y / scale);
    const clampedX = Math.max(0, Math.min(state.mapWidth - 1, gridX));
    const clampedY = Math.max(0, Math.min(state.mapHeight - 1, gridY));

    miniMapService.emitInteraction({
      type: MINIMAP_VIEWPORT_CLICK_EVENT,
      gridX: clampedX,
      gridY: clampedY,
    });
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
        gap: '0.55rem',
        fontFamily: "'DM Mono', 'IBM Plex Mono', monospace",
        color: '#e2e8f0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: 'rgba(148, 163, 184, 0.85)',
          }}
        >
          {uiStrings.miniMap.heading}
        </span>
        <span
          style={{
            fontSize: '0.7rem',
            color: 'rgba(148, 163, 184, 0.88)',
          }}
        >
          {activeState.mapWidth}×{activeState.mapHeight}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '12px',
          overflow: 'hidden',
          background: 'rgba(10, 15, 25, 0.8)',
          padding: '0.4rem',
          boxShadow: 'inset 0 0 0 1px rgba(59, 130, 246, 0.18)',
        }}
      >
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{
            display: 'block',
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            imageRendering: 'pixelated',
            cursor: 'pointer',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.55rem',
          fontSize: '0.68rem',
          color: 'rgba(148, 163, 184, 0.85)',
        }}
      >
        <span>{activeState.areaName}</span>
        <span>
          ({playerX}, {playerY})
        </span>
      </div>
    </div>
  );
};

export default MiniMap;
