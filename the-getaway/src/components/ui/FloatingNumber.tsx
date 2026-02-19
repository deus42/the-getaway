import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { PLAYER_SCREEN_POSITION_EVENT, PlayerScreenPositionDetail } from '../../game/events';

export interface FloatingNumberProps {
  value: number;
  gridX: number;
  gridY: number;
  type: 'damage' | 'heal' | 'crit' | 'miss' | 'block' | 'pickup';
  label?: string;
  onComplete?: () => void;
}

const FloatingNumber: React.FC<FloatingNumberProps> = ({
  value,
  gridX,
  gridY,
  type,
  label,
  onComplete,
}) => {
  const [visible, setVisible] = useState(true);
  const [screenPos, setScreenPos] = useState<{ x: number; y: number } | null>(null);
  const lastDetailRef = useRef<PlayerScreenPositionDetail | null>(null);
  const playerPosition = useSelector((state: RootState) => state.player.data.position);

  const updatePosition = useCallback((detail: PlayerScreenPositionDetail | null) => {
    if (!detail) return;

    lastDetailRef.current = detail;

    // Calculate grid offset from player position
    const gridOffsetX = gridX - playerPosition.x;
    const gridOffsetY = gridY - playerPosition.y;

    // Use tile size of 64 (MainScene default)
    const tileSize = 64;
    const tileWidth = tileSize;
    const tileHeight = tileSize / 2;

    // Convert grid offset to world offset using isometric projection
    const worldOffsetX = (gridOffsetX - gridOffsetY) * (tileWidth / 2);
    const worldOffsetY = (gridOffsetX + gridOffsetY) * (tileHeight / 2);

    // Apply offset to player's world position
    const entityWorldX = detail.worldX + worldOffsetX;
    const entityWorldY = detail.worldY + worldOffsetY;

    // Get camera position
    const cameraWorldX = detail.worldX - detail.screenX / detail.zoom;
    const cameraWorldY = detail.worldY - detail.screenY / detail.zoom;

    // Convert world to screen coordinates
    const screenX = (entityWorldX - cameraWorldX) * detail.zoom;
    const screenY = (entityWorldY - cameraWorldY) * detail.zoom;

    // Convert screen to DOM coordinates
    const scaleX = detail.canvasDisplayWidth / detail.canvasWidth;
    const scaleY = detail.canvasDisplayHeight / detail.canvasHeight;

    const domX = detail.canvasLeft + screenX * scaleX;
    const domY = detail.canvasTop + screenY * scaleY;

    setScreenPos({ x: domX, y: domY });
  }, [gridX, gridY, playerPosition.x, playerPosition.y]);

  useEffect(() => {
    // Get initial position
    if (typeof window !== 'undefined') {
      const initial = window.__getawayPlayerScreenPosition;
      if (initial) {
        updatePosition(initial);
      }
    }
  }, [updatePosition]);

  useEffect(() => {
    const handle = (event: Event) => {
      const custom = event as CustomEvent<PlayerScreenPositionDetail>;
      updatePosition(custom.detail);
    };

    window.addEventListener(PLAYER_SCREEN_POSITION_EVENT, handle as EventListener);
    return () => window.removeEventListener(PLAYER_SCREEN_POSITION_EVENT, handle as EventListener);
  }, [updatePosition]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible || !screenPos) {
    return null;
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'damage':
        return {
          color: '#ef4444',
          glow: 'rgba(239, 68, 68, 0.8)',
          prefix: '-',
          scale: 1,
        };
      case 'heal':
        return {
          color: '#34d399',
          glow: 'rgba(52, 211, 153, 0.8)',
          prefix: '+',
          scale: 1,
        };
      case 'crit':
        return {
          color: '#fbbf24',
          glow: 'rgba(251, 191, 36, 0.9)',
          prefix: '-',
          scale: 1.4,
        };
      case 'miss':
        return {
          color: '#94a3b8',
          glow: 'rgba(148, 163, 184, 0.6)',
          prefix: '',
          scale: 0.9,
        };
      case 'block':
        return {
          color: '#38bdf8',
          glow: 'rgba(56, 189, 248, 0.8)',
          prefix: '',
          scale: 1,
        };
      case 'pickup':
        return {
          color: '#22d3ee',
          glow: 'rgba(34, 211, 238, 0.85)',
          prefix: '+',
          scale: 1.05,
        };
      default:
        return {
          color: '#ffffff',
          glow: 'rgba(255, 255, 255, 0.6)',
          prefix: '',
          scale: 1,
        };
    }
  };

  const styles = getTypeStyles();
  const displayText =
    type === 'miss'
      ? 'MISS'
      : type === 'block'
      ? 'BLOCK'
      : type === 'pickup'
      ? `PICKED UP: ${value > 1 ? `${value}x ` : ''}${label ?? (value === 1 ? 'ITEM' : 'ITEMS')}`
      : `${styles.prefix}${value}`;

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${screenPos.x}px`,
    top: `${screenPos.y}px`,
    transform: 'translate(-50%, -100%)',
    pointerEvents: 'none',
    userSelect: 'none',
    zIndex: 10000,
    animation: 'floatUp 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
  };

  const textStyle: React.CSSProperties = {
    fontSize: `${1.2 * styles.scale}rem`,
    fontWeight: type === 'crit' ? 900 : 800,
    color: styles.color,
    textShadow: `0 0 12px ${styles.glow}, 0 0 6px ${styles.glow}, 0 2px 4px rgba(0, 0, 0, 0.8)`,
    fontFamily: '"DM Mono", "IBM Plex Mono", monospace',
    letterSpacing: '0.05em',
    WebkitTextStroke: type === 'crit' ? `1px ${styles.color}dd` : 'none',
  };

  return (
    <>
      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(${styles.scale * 0.8});
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translateY(-60px) scale(${styles.scale});
            opacity: 0;
          }
        }
      `}</style>
      <div style={containerStyle}>
        <span style={textStyle}>{displayText}</span>
      </div>
    </>
  );
};

export default FloatingNumber;
