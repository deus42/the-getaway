import React, { useMemo } from 'react';

export interface StatusEffect {
  id: string;
  name: string;
  icon: string;
  color: string;
  duration?: number;
  stacks?: number;
  type: 'buff' | 'debuff' | 'neutral';
}

interface StatusEffectIconProps {
  effect: StatusEffect;
  size?: number;
  showDuration?: boolean;
}

const StatusEffectIcon: React.FC<StatusEffectIconProps> = ({ effect, size = 32, showDuration = true }) => {
  const borderColor = useMemo(() => {
    switch (effect.type) {
      case 'buff':
        return '#34d399';
      case 'debuff':
        return '#ef4444';
      default:
        return '#38bdf8';
    }
  }, [effect.type]);

  const iconContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '8px',
    border: `2px solid ${borderColor}`,
    background: `linear-gradient(135deg, ${effect.color}30, rgba(15, 23, 42, 0.9))`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 0 12px ${borderColor}60, 0 4px 8px rgba(0, 0, 0, 0.4)`,
    animation: 'statusPulse 2s ease-in-out infinite',
  };

  const iconStyle: React.CSSProperties = {
    fontSize: `${size * 0.55}px`,
    filter: `drop-shadow(0 0 4px ${effect.color})`,
  };

  const stacksBadgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    width: '16px',
    height: '16px',
    borderRadius: '999px',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    border: '1px solid rgba(251, 191, 36, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.6rem',
    fontWeight: 700,
    color: '#0b1120',
    boxShadow: '0 0 8px rgba(251, 191, 36, 0.6)',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
  };

  const durationBarStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    height: '3px',
    background: 'rgba(15, 23, 42, 0.8)',
    borderRadius: '0 0 6px 6px',
    overflow: 'hidden',
  };

  const durationFillStyle: React.CSSProperties = {
    height: '100%',
    width: effect.duration ? `${Math.min(100, effect.duration)}%` : '100%',
    background: `linear-gradient(90deg, ${borderColor}, ${effect.color})`,
    transition: 'width 0.3s ease',
    boxShadow: `0 0 6px ${borderColor}`,
  };

  return (
    <>
      <style>{`
        @keyframes statusPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 12px ${borderColor}60, 0 4px 8px rgba(0, 0, 0, 0.4);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 20px ${borderColor}90, 0 6px 12px rgba(0, 0, 0, 0.5);
          }
        }
      `}</style>
      <div style={iconContainerStyle} title={effect.name}>
        <span style={iconStyle}>{effect.icon}</span>
        {effect.stacks && effect.stacks > 1 && (
          <span style={stacksBadgeStyle}>{effect.stacks}</span>
        )}
        {showDuration && effect.duration !== undefined && (
          <div style={durationBarStyle}>
            <div style={durationFillStyle} />
          </div>
        )}
      </div>
    </>
  );
};

export default StatusEffectIcon;
