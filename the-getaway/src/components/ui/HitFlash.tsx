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

  const flashStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 9999,
    animation: `hitFlash ${duration}ms ease-out forwards`,
  };

  const flashVisualStyle = () => {
    switch (type) {
      case 'damage':
        return {
          background: `radial-gradient(circle at center, rgba(239, 68, 68, ${Math.max(
            0,
            intensity * 0.22,
          )}) 0%, rgba(239, 68, 68, 0) 65%)`,
          mixBlendMode: 'screen' as const,
        };
      case 'heal':
        return {
          background: `rgba(52, 211, 153, ${intensity})`,
          mixBlendMode: 'lighten' as const,
        };
      case 'crit':
        return {
          background: `rgba(251, 191, 36, ${intensity * 0.8})`,
          mixBlendMode: 'screen' as const,
        };
      case 'block':
        return {
          background: `rgba(56, 189, 248, ${intensity * 0.7})`,
          mixBlendMode: 'screen' as const,
        };
      default:
        return {
          background: `rgba(255, 255, 255, ${intensity})`,
          mixBlendMode: 'screen' as const,
        };
    }
  };

  const mergedStyle = {
    ...flashStyle,
    ...flashVisualStyle(),
  } satisfies React.CSSProperties;

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
      <div style={mergedStyle} />
    </>
  );
};

export default HitFlash;
