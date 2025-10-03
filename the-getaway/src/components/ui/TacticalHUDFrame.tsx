import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const TacticalHUDFrame: React.FC = () => {
  const { currentMapArea, inCombat } = useSelector((state: RootState) => state.world);
  const player = useSelector((state: RootState) => state.player.data);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const cornerBracketStyle = (rotation: number, top?: string, right?: string, bottom?: string, left?: string): React.CSSProperties => ({
    position: 'absolute',
    width: '40px',
    height: '40px',
    top,
    right,
    bottom,
    left,
    border: '2px solid #38bdf8',
    borderBottom: 'none',
    borderRight: 'none',
    transform: `rotate(${rotation}deg)`,
    boxShadow: '0 0 10px rgba(56, 189, 248, 0.5), inset 0 0 10px rgba(56, 189, 248, 0.2)',
    pointerEvents: 'none',
    animation: 'pulse-glow 2s ease-in-out infinite',
  });

  const topInfoStyle: React.CSSProperties = {
    position: 'absolute',
    top: '8px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '1.5rem',
    fontSize: '0.65rem',
    color: '#38bdf8',
    fontFamily: '"DM Mono", monospace',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    pointerEvents: 'none',
    textShadow: '0 0 8px rgba(56, 189, 248, 0.8)',
  };

  const statusIndicatorStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.3rem 0.6rem',
    background: 'rgba(15, 23, 42, 0.85)',
    border: `1px solid ${active ? '#ef4444' : '#38bdf8'}`,
    borderRadius: '4px',
    boxShadow: active ? '0 0 12px rgba(239, 68, 68, 0.6)' : '0 0 8px rgba(56, 189, 248, 0.4)',
  });

  const pulseAnimation = `
    @keyframes pulse-glow {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
  `;

  return (
    <>
      <style>{pulseAnimation}</style>

      {/* Corner brackets */}
      <div style={cornerBracketStyle(0, '0', undefined, undefined, '0')} />
      <div style={cornerBracketStyle(90, '0', '0', undefined, undefined)} />
      <div style={cornerBracketStyle(180, undefined, '0', '0', undefined)} />
      <div style={cornerBracketStyle(270, undefined, undefined, '0', '0')} />

      {/* Top info bar */}
      <div style={topInfoStyle}>
        <div style={statusIndicatorStyle(inCombat)}>
          <span style={{ fontSize: '8px' }}>●</span>
          <span>{inCombat ? 'COMBAT' : 'TACTICAL'}</span>
        </div>
        <div style={{ ...statusIndicatorStyle(false), border: '1px solid #94a3b8' }}>
          <span>LOC: {currentMapArea?.id ?? 'UNKNOWN'}</span>
        </div>
        <div style={{ ...statusIndicatorStyle(false), border: '1px solid #94a3b8' }}>
          <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </div>

      {/* Bottom threat indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '0.6rem',
          color: inCombat ? '#ef4444' : '#38bdf8',
          fontFamily: '"DM Mono", monospace',
          letterSpacing: '0.15em',
          pointerEvents: 'none',
          textShadow: `0 0 8px ${inCombat ? 'rgba(239, 68, 68, 0.8)' : 'rgba(56, 189, 248, 0.8)'}`,
          padding: '0.25rem 0.8rem',
          background: 'rgba(15, 23, 42, 0.85)',
          border: `1px solid ${inCombat ? '#ef4444' : '#38bdf8'}`,
          borderRadius: '4px',
          boxShadow: inCombat ? '0 0 12px rgba(239, 68, 68, 0.6)' : '0 0 8px rgba(56, 189, 248, 0.4)',
        }}
      >
        THREAT LEVEL: {inCombat ? 'HOSTILE' : 'CLEAR'}
      </div>

      {/* Edge scanline effects */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #38bdf8, transparent)',
          opacity: 0.3,
          pointerEvents: 'none',
          animation: 'scanline-horizontal 3s linear infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #38bdf8, transparent)',
          opacity: 0.3,
          pointerEvents: 'none',
          animation: 'scanline-horizontal 3s linear infinite reverse',
        }}
      />

      <style>{`
        @keyframes scanline-horizontal {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </>
  );
};

export default TacticalHUDFrame;
