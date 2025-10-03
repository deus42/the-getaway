import React from 'react';

interface ScanlineOverlayProps {
  opacity?: number;
  lineHeight?: number;
}

const ScanlineOverlay: React.FC<ScanlineOverlayProps> = ({
  opacity = 0.03,
  lineHeight = 2,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: `repeating-linear-gradient(
          0deg,
          rgba(0, 0, 0, ${opacity}) 0px,
          transparent ${lineHeight}px,
          transparent ${lineHeight * 2}px,
          rgba(0, 0, 0, ${opacity}) ${lineHeight * 2}px
        )`,
        zIndex: 5,
        borderRadius: 'inherit',
      }}
    />
  );
};

export default ScanlineOverlay;
