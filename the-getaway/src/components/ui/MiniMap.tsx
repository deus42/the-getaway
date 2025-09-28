import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { MapArea, TileType } from "../../game/interfaces/types";

const MAX_CANVAS_WIDTH = 180;
const MAX_CANVAS_HEIGHT = 160;

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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 140, height: 110 });

  const entitySignature = useMemo(
    () =>
      [
        ...enemies
          .filter((enemy) => enemy.health > 0)
          .map((enemy) => `enemy:${enemy.id}:${enemy.position.x}:${enemy.position.y}:${enemy.health}`),
        ...npcs.map((npc) => `npc:${npc.id}:${npc.position.x}:${npc.position.y}`),
      ].join("|"),
    [enemies, npcs]
  );

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
    const canvasWidth = Math.ceil(mapArea.width * scale);
    const canvasHeight = Math.ceil(mapArea.height * scale);

    if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
      setCanvasSize({ width: canvasWidth, height: canvasHeight });
    }

    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    // Background wash
    context.fillStyle = "#0b1220";
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    for (let y = 0; y < mapArea.height; y += 1) {
      for (let x = 0; x < mapArea.width; x += 1) {
        const tile = mapArea.tiles[y][x];
        const color = TILE_COLORS[tile.type] ?? TILE_COLORS.default;
        context.fillStyle = color;
        context.fillRect(x * scale, y * scale, scale, scale);

        if (tile.provideCover) {
          context.fillStyle = "rgba(14, 116, 144, 0.45)";
          context.fillRect(x * scale, y * scale, scale, scale);
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
      context.lineTo(xPos, canvasHeight);
      context.stroke();
    }
    for (let y = 0; y <= mapArea.height; y += Math.max(4, Math.round(12 / scale))) {
      const yPos = y * scale;
      context.beginPath();
      context.moveTo(0, yPos);
      context.lineTo(canvasWidth, yPos);
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
    enemies
      .filter((enemy) => enemy.health > 0)
      .forEach((enemy) => {
        drawBlip(enemy.position, "#ef4444", "rgba(248, 113, 113, 0.85)", 0.4);
      });

    npcs.forEach((npc) => {
      drawBlip(npc.position, "#22c55e", "rgba(187, 247, 208, 0.9)", 0.35);
    });

    // District perimeter glow
    context.lineWidth = Math.max(2, scale * 0.6);
    context.strokeStyle = curfewActive
      ? "rgba(126, 232, 201, 0.6)"
      : "rgba(59, 130, 246, 0.55)";
    context.strokeRect(1, 1, canvasWidth - 2, canvasHeight - 2);
  }, [mapArea, playerPosition, curfewActive, entitySignature, enemies, npcs]);

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
          Tactical Map
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
          style={{
            display: "block",
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            imageRendering: "pixelated",
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
