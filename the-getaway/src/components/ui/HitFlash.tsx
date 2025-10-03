import React, { useEffect, useState } from 'react';

export interface HitFlashProps {
  active: boolean;
  type?: 'damage' | 'heal' | 'crit' | 'block';
  intensity?: number;
  duration?: number;
}

const HitFlash: React.FC<HitFlashProps> = ({
  active,
  type = 'damage',
  intensity = 0.6,
  duration = 300,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [active, duration]);

  if (!visible) {
    return null;
  }

  const getFlashColor = () => {
    switch (type) {
      case 'damage':
        return `rgba(239, 68, 68, ${intensity})`;
      case 'heal':
        return `rgba(52, 211, 153, ${intensity})`;
      case 'crit':
        return `rgba(251, 191, 36, ${intensity * 0.8})`;
      case 'block':
        return `rgba(56, 189, 248, ${intensity * 0.7})`;
      default:
        return `rgba(255, 255, 255, ${intensity})`;
    }
  };

  const flashStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: getFlashColor(),
    pointerEvents: 'none',
    zIndex: 9999,
    mixBlendMode: type === 'heal' ? 'lighten' : 'screen',
    animation: `hitFlash ${duration}ms ease-out forwards`,
  };

  return (
    <>
      <style>{`
        @keyframes hitFlash {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
      <div style={flashStyle} />
    </>
  );
};

export default HitFlash;
