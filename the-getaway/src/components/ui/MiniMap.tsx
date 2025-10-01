import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { getUIStrings } from "../../content/ui";
import { MapArea, TileType } from "../../game/interfaces/types";
import {
  MINIMAP_VIEWPORT_CLICK_EVENT,
  VIEWPORT_UPDATE_EVENT,
} from "../../game/events";

const MAX_CANVAS_WIDTH = 180;
const MAX_CANVAS_HEIGHT = 160;

interface ViewportInfo {
  x: number;
  y: number;
  width: number;
  height: number;
}

const TILE_COLORS: Record<TileType | "default", string> = {
  [TileType.FLOOR]: "#1e293b",
  [TileType.WALL]: "#475569",
  [TileType.DOOR]: "#facc15",
  [TileType.COVER]: "#0f766e",
  [TileType.WATER]: "#0ea5e9",
  [TileType.TRAP]: "#7c3aed",
  default: "#1f2937",
};

const clampScale = (area: MapArea | null): number => {
  if (!area) {
    return 1;
  }

  const widthScale = MAX_CANVAS_WIDTH / area.width;
  const heightScale = MAX_CANVAS_HEIGHT / area.height;
  const rawScale = Math.min(widthScale, heightScale);

  // Keep increments at a tenth to reduce jitter while staying crisp
  const scaled = Math.max(0.6, Math.min(4, Math.floor(rawScale * 10) / 10 || 1));
  return scaled;
};

const MiniMap: React.FC = () => {
  const mapArea = useSelector((state: RootState) => state.world.currentMapArea);
  const playerPosition = useSelector((state: RootState) => state.player.data.position);
  const curfewActive = useSelector((state: RootState) => state.world.curfewActive);
  const enemies = useSelector((state: RootState) => state.world.currentMapArea.entities.enemies);
  const npcs = useSelector((state: RootState) => state.world.currentMapArea.entities.npcs);
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 140, height: 110 });
  const [viewport, setViewport] = useState<ViewportInfo | null>(null);
  const renderScaleRef = useRef<{ scale: number; dpr: number }>({ scale: 1, dpr: 1 });
  const enemyBlips = useMemo(
    () =>
      enemies.map((enemy) => ({
        id: enemy.id,
        x: enemy.position.x,
        y: enemy.position.y,
        health: enemy.health,
      })),
    [enemies]
  );

  const npcBlips = useMemo(
    () =>
      npcs.map((npc) => ({
        id: npc.id,
        x: npc.position.x,
        y: npc.position.y,
      })),
    [npcs]
  );


  // Listen for viewport updates from MainScene
  useEffect(() => {
    const handleViewportUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<ViewportInfo>;
      setViewport(customEvent.detail);
    };

    window.addEventListener(VIEWPORT_UPDATE_EVENT, handleViewportUpdate);
    return () => {
      window.removeEventListener(VIEWPORT_UPDATE_EVENT, handleViewportUpdate);
    };
  }, []);

  useEffect(() => {
    if (!mapArea) {
      return;
    }

    if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let context: CanvasRenderingContext2D | null = null;
    try {
      context = canvas.getContext("2d");
    } catch (error) {
      console.warn("[MiniMap] Canvas rendering unavailable", error);
      return;
    }

    if (!context) {
      return;
    }

    const scale = clampScale(mapArea);
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    renderScaleRef.current = { scale, dpr };

    const logicalWidth = Math.ceil(mapArea.width * scale);
    const logicalHeight = Math.ceil(mapArea.height * scale);
    const canvasWidth = Math.ceil(logicalWidth * dpr);
    const canvasHeight = Math.ceil(logicalHeight * dpr);

    if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      canvas.style.width = `${logicalWidth}px`;
      canvas.style.height = `${logicalHeight}px`;
      setCanvasSize({ width: logicalWidth, height: logicalHeight });
    }

    context.imageSmoothingEnabled = false;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const drawRect = (x: number, y: number, width: number, height: number) => {
      context.fillRect(x, y, width, height);
    };

    // Background wash
    context.fillStyle = "#0b1220";
    drawRect(0, 0, logicalWidth, logicalHeight);

    for (let y = 0; y < mapArea.height; y += 1) {
      for (let x = 0; x < mapArea.width; x += 1) {
        const tile = mapArea.tiles[y][x];
        const color = TILE_COLORS[tile.type] ?? TILE_COLORS.default;
        context.fillStyle = color;
        drawRect(x * scale, y * scale, scale, scale);

        if (tile.provideCover) {
          context.fillStyle = "rgba(14, 116, 144, 0.45)";
          drawRect(x * scale, y * scale, scale, scale);
        }
      }
    }

    // Holo grid overlay for readability
    context.strokeStyle = "rgba(15, 23, 42, 0.35)";
    context.lineWidth = Math.max(1, scale * 0.1);
    for (let x = 0; x <= mapArea.width; x += Math.max(4, Math.round(12 / scale))) {
      const xPos = x * scale;
      context.beginPath();
      context.moveTo(xPos, 0);
      context.lineTo(xPos, logicalHeight);
      context.stroke();
    }
    for (let y = 0; y <= mapArea.height; y += Math.max(4, Math.round(12 / scale))) {
      const yPos = y * scale;
      context.beginPath();
      context.moveTo(0, yPos);
      context.lineTo(logicalWidth, yPos);
      context.stroke();
    }

    const drawBlip = (
      position: { x: number; y: number },
      fill: string,
      stroke: string,
      radiusMultiplier = 0.45
    ) => {
      const centerX = (position.x + 0.5) * scale;
      const centerY = (position.y + 0.5) * scale;
      const radius = Math.max(2, scale * radiusMultiplier);

      context.beginPath();
      context.fillStyle = fill;
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.fill();

      context.lineWidth = Math.max(1, radius * 0.45);
      context.strokeStyle = stroke;
      context.stroke();
    };

    // Player marker
    drawBlip(playerPosition, "#38bdf8", "rgba(224, 242, 254, 0.85)", 0.55);

    // Enemy markers
    enemyBlips
      .filter((enemy) => enemy.health > 0)
      .forEach((enemy) => {
        drawBlip({ x: enemy.x, y: enemy.y }, "#ef4444", "rgba(248, 113, 113, 0.85)", 0.4);
      });

    npcBlips.forEach((npc) => {
      drawBlip({ x: npc.x, y: npc.y }, "#22c55e", "rgba(187, 247, 208, 0.9)", 0.35);
    });

    // District perimeter glow
    context.lineWidth = Math.max(2, scale * 0.6);
    context.strokeStyle = curfewActive
      ? "rgba(126, 232, 201, 0.6)"
      : "rgba(59, 130, 246, 0.55)";
    context.strokeRect(1, 1, logicalWidth - 2, logicalHeight - 2);

    // Viewport rectangle
    if (viewport) {
      const viewportX = viewport.x * scale;
      const viewportY = viewport.y * scale;
      const viewportWidth = viewport.width * scale;
      const viewportHeight = viewport.height * scale;

      // Semi-transparent fill
      context.fillStyle = "rgba(255, 255, 255, 0.08)";
      context.fillRect(viewportX, viewportY, viewportWidth, viewportHeight);

      // Bright border
      context.lineWidth = Math.max(1.5, scale * 0.3);
      context.strokeStyle = "rgba(56, 189, 248, 0.85)";
      context.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);

      // Corner markers for better visibility
      const cornerSize = Math.max(3, scale * 0.8);
      context.fillStyle = "rgba(56, 189, 248, 0.95)";
      // Top-left
      context.fillRect(viewportX - 1, viewportY - 1, cornerSize, cornerSize);
      // Top-right
      context.fillRect(viewportX + viewportWidth - cornerSize + 1, viewportY - 1, cornerSize, cornerSize);
      // Bottom-left
      context.fillRect(viewportX - 1, viewportY + viewportHeight - cornerSize + 1, cornerSize, cornerSize);
      // Bottom-right
      context.fillRect(viewportX + viewportWidth - cornerSize + 1, viewportY + viewportHeight - cornerSize + 1, cornerSize, cornerSize);
    }
  }, [mapArea, playerPosition, curfewActive, enemyBlips, npcBlips, viewport]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mapArea || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const { scale } = renderScaleRef.current;
    const effectiveScale = scale || clampScale(mapArea);

    // Calculate click position relative to canvas
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert to grid coordinates
    const gridX = Math.floor(x / effectiveScale);
    const gridY = Math.floor(y / effectiveScale);

    // Clamp to map bounds
    const clampedX = Math.max(0, Math.min(mapArea.width - 1, gridX));
    const clampedY = Math.max(0, Math.min(mapArea.height - 1, gridY));

    // Dispatch event to MainScene to move camera
    window.dispatchEvent(
      new CustomEvent(MINIMAP_VIEWPORT_CLICK_EVENT, {
        detail: { gridX: clampedX, gridY: clampedY },
      })
    );
  };

  if (!mapArea) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.55rem",
        fontFamily: "'DM Mono', 'IBM Plex Mono', monospace",
        color: "#e2e8f0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: "0.65rem",
            letterSpacing: "0.26em",
            textTransform: "uppercase",
            color: "rgba(148, 163, 184, 0.85)",
          }}
        >
          {uiStrings.miniMap.heading}
        </span>
        <span
          style={{
            fontSize: "0.7rem",
            color: "rgba(148, 163, 184, 0.88)",
          }}
        >
          {mapArea.width}×{mapArea.height}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: "12px",
          overflow: "hidden",
          background: "rgba(10, 15, 25, 0.8)",
          padding: "0.4rem",
          boxShadow: "inset 0 0 0 1px rgba(59, 130, 246, 0.18)",
        }}
      >
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{
            display: "block",
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            imageRendering: "pixelated",
            cursor: "pointer",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "0.55rem",
          fontSize: "0.68rem",
          color: "rgba(148, 163, 184, 0.85)",
        }}
      >
        <span>{mapArea.name}</span>
        <span>
          ({playerPosition.x}, {playerPosition.y})
        </span>
      </div>
    </div>
  );
};

export default MiniMap;
