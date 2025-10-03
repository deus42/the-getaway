import React from 'react';

interface CornerAccentsProps {
  color?: string;
  size?: number;
  thickness?: number;
  glow?: boolean;
}

const CornerAccents: React.FC<CornerAccentsProps> = ({
  color = '#38bdf8',
  size = 16,
  thickness = 2,
  glow = true,
}) => {
  const cornerStyle = (rotation: number, top?: number, right?: number, bottom?: number, left?: number): React.CSSProperties => ({
    position: 'absolute',
    width: `${size}px`,
    height: `${size}px`,
    top,
    right,
    bottom,
    left,
    pointerEvents: 'none',
    transform: `rotate(${rotation}deg)`,
    zIndex: 10,
  });

  const lineStyle = (isVertical: boolean): React.CSSProperties => ({
    position: 'absolute',
    background: color,
    boxShadow: glow ? `0 0 8px ${color}, 0 0 4px ${color}` : 'none',
    ...(isVertical ? {
      width: `${thickness}px`,
      height: '100%',
      left: 0,
      top: 0,
    } : {
      height: `${thickness}px`,
      width: '100%',
      left: 0,
      top: 0,
    }),
  });

  const Corner = ({ rotation, top, right, bottom, left }: { rotation: number; top?: number; right?: number; bottom?: number; left?: number }) => (
    <div style={cornerStyle(rotation, top, right, bottom, left)}>
      <div style={lineStyle(true)} />
      <div style={lineStyle(false)} />
    </div>
  );

  return (
    <>
      <Corner rotation={0} top={0} left={0} />
      <Corner rotation={90} top={0} right={0} />
      <Corner rotation={180} bottom={0} right={0} />
      <Corner rotation={270} bottom={0} left={0} />
    </>
  );
};

export default CornerAccents;
