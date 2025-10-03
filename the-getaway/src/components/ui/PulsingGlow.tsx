import React, { CSSProperties } from 'react';

interface PulsingGlowProps {
  color: string;
  intensity?: number;
  speed?: number;
  children: React.ReactNode;
}

const PulsingGlow: React.FC<PulsingGlowProps> = ({
  color,
  intensity = 0.6,
  speed = 2,
  children,
}) => {
  const containerStyle: CSSProperties = {
    position: 'relative',
    display: 'contents',
  };

  const animationName = `pulse-${color.replace('#', '')}`;

  const keyframes = `
    @keyframes ${animationName} {
      0%, 100% {
        box-shadow: 0 0 ${intensity * 8}px ${color}${Math.floor(intensity * 128).toString(16).padStart(2, '0')},
                    inset 0 0 ${intensity * 6}px ${color}${Math.floor(intensity * 64).toString(16).padStart(2, '0')};
      }
      50% {
        box-shadow: 0 0 ${intensity * 16}px ${color}${Math.floor(intensity * 255).toString(16).padStart(2, '0')},
                    inset 0 0 ${intensity * 12}px ${color}${Math.floor(intensity * 128).toString(16).padStart(2, '0')};
      }
    }
  `;

  return (
    <div style={containerStyle}>
      <style>{keyframes}</style>
      <div
        style={{
          animation: `${animationName} ${speed}s ease-in-out infinite`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PulsingGlow;
