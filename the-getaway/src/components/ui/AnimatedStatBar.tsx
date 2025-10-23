import React, { useMemo, useRef, useEffect } from 'react';

interface AnimatedStatBarProps {
  label: string;
  current: number;
  max: number;
  icon?: string;
  baseColor: string;
  lowThreshold?: number;
  criticalThreshold?: number;
  emphasisColor?: string;
  disableGlow?: boolean;
  dangerDirection?: 'ascending' | 'descending' | 'none';
  warningColor?: string;
  criticalColor?: string;
}

const AnimatedStatBar: React.FC<AnimatedStatBarProps> = ({
  label,
  current,
  max,
  icon,
  baseColor,
  lowThreshold = 50,
  criticalThreshold = 25,
  emphasisColor,
  disableGlow = false,
  dangerDirection = 'descending',
  warningColor = '#f59e0b',
  criticalColor = '#ef4444',
}) => {
  const prevValueRef = useRef(current);

  useEffect(() => {
    prevValueRef.current = current;
  }, [current]);

  const percent = useMemo(() =>
    max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0,
    [current, max]
  );

  const normalizedThresholds = useMemo(() => {
    const low = Math.max(0, Math.min(100, lowThreshold));
    const critical = Math.max(0, Math.min(100, criticalThreshold));
    return {
      low,
      critical,
    };
  }, [lowThreshold, criticalThreshold]);

  const { low: lowCutoff, critical: criticalCutoff } = normalizedThresholds;

  const isWarning = useMemo(() => {
    if (dangerDirection === 'none') return false;
    if (dangerDirection === 'ascending') {
      return percent >= lowCutoff;
    }
    return percent <= lowCutoff;
  }, [dangerDirection, lowCutoff, percent]);

  const isCritical = useMemo(() => {
    if (dangerDirection === 'none') return false;
    if (dangerDirection === 'ascending') {
      return percent >= criticalCutoff;
    }
    return percent <= criticalCutoff;
  }, [dangerDirection, criticalCutoff, percent]);

  const barColor = useMemo(() => {
    if (dangerDirection === 'none') return baseColor;
    if (dangerDirection === 'ascending') {
      if (percent >= criticalCutoff) return criticalColor;
      if (percent >= lowCutoff) return warningColor;
    } else {
      if (percent <= criticalCutoff) return criticalColor;
      if (percent <= lowCutoff) return warningColor;
    }
    return baseColor;
  }, [baseColor, criticalColor, dangerDirection, lowCutoff, percent, warningColor, criticalCutoff]);

  const shouldPulse = isCritical && !disableGlow;

  const labelRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.64rem',
    letterSpacing: '0.12em',
    marginBottom: '0.18rem',
    color: emphasisColor ?? 'rgba(148, 163, 184, 0.85)',
  };

  const labelWithIconStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    filter: shouldPulse ? `drop-shadow(0 0 4px ${barColor})` : 'none',
    animation: shouldPulse ? 'pulse-icon 1.5s ease-in-out infinite' : 'none',
  };

  const barShellStyle: React.CSSProperties = {
    width: '100%',
    height: '0.44rem',
    borderRadius: '999px',
    background: 'rgba(30, 64, 175, 0.28)',
    overflow: 'hidden',
    border: `1px solid ${barColor}40`,
    boxShadow: disableGlow ? 'none' : shouldPulse ? `0 0 8px ${barColor}80` : 'none',
    animation: disableGlow ? 'none' : shouldPulse ? 'pulse-bar 1.5s ease-in-out infinite' : 'none',
  };

  const barFillStyle: React.CSSProperties = {
    width: `${percent}%`,
    height: '100%',
    borderRadius: '999px',
    background: `linear-gradient(135deg, ${barColor}, rgba(255, 255, 255, 0.25))`,
    boxShadow: disableGlow ? 'none' : shouldPulse ? `0 0 12px ${barColor}80` : 'none',
    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
  };

  const shimmerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
    animation: 'shimmer 2s infinite',
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: '"DM Mono", monospace',
    fontWeight: 600,
    color: emphasisColor ?? (isWarning ? barColor : '#e2e8f0'),
    textShadow: emphasisColor
      ? `0 0 6px ${emphasisColor}80`
      : isCritical
        ? disableGlow ? 'none' : `0 0 4px ${barColor}`
        : 'none',
    transition: 'color 0.3s ease',
  };

  return (
    <>
      <style>{`
        @keyframes pulse-icon {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }
        @keyframes pulse-bar {
          0%, 100% { box-shadow: 0 0 8px ${barColor}80; }
          50% { box-shadow: 0 0 16px ${barColor}ff; }
        }
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>
      <div>
        <div style={labelRowStyle}>
          <div style={labelWithIconStyle}>
            {icon && <span style={iconStyle}>{icon}</span>}
            <span>{label}</span>
          </div>
          <span style={valueStyle}>
            {current}/{max}
          </span>
        </div>
        <div style={barShellStyle}>
          <div style={barFillStyle}>
            {!disableGlow && <div style={shimmerStyle} />}
          </div>
        </div>
      </div>
    </>
  );
};

export default AnimatedStatBar;
