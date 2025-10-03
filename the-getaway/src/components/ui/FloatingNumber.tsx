import React, { useEffect, useState } from 'react';

export interface FloatingNumberProps {
  value: number;
  x: number;
  y: number;
  type: 'damage' | 'heal' | 'crit' | 'miss' | 'block';
  onComplete?: () => void;
}

const FloatingNumber: React.FC<FloatingNumberProps> = ({ value, x, y, type, onComplete }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) {
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
  const displayText = type === 'miss' ? 'MISS' : type === 'block' ? 'BLOCK' : `${styles.prefix}${value}`;

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
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
