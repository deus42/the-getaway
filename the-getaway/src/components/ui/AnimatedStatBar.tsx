import React, { useMemo } from 'react';

type DangerDirection = 'ascending' | 'descending' | 'none';
type StatVariant = 'health' | 'paranoia' | 'action' | 'neutral';
type StatLevel = 'base' | 'warning' | 'critical';

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export interface AnimatedStatBarProps {
  label: string;
  current: number;
  max: number;
  icon?: string;
  variant?: StatVariant;
  lowThreshold?: number;
  criticalThreshold?: number;
  disableGlow?: boolean;
  dangerDirection?: DangerDirection;
}

const determineLevel = (
  percent: number,
  low: number,
  critical: number,
  direction: DangerDirection,
): StatLevel => {
  if (direction === 'none') return 'base';
  if (direction === 'ascending') {
    if (percent >= critical) return 'critical';
    if (percent >= low) return 'warning';
    return 'base';
  }
  if (percent <= critical) return 'critical';
  if (percent <= low) return 'warning';
  return 'base';
};

const AnimatedStatBar: React.FC<AnimatedStatBarProps> = ({
  label,
  current,
  max,
  icon,
  variant = 'neutral',
  lowThreshold = 50,
  criticalThreshold = 25,
  disableGlow = false,
  dangerDirection = 'descending',
}) => {
  const percent = useMemo(() => {
    if (max <= 0) return 0;
    const raw = (current / max) * 100;
    return Math.max(0, Math.min(100, raw));
  }, [current, max]);

  const level = determineLevel(percent, lowThreshold, criticalThreshold, dangerDirection);

  return (
    <div className="hud-stat" data-variant={variant} data-level={level} data-glow={disableGlow ? 'off' : 'on'}>
      <div className={cx('hud-stat__row', level !== 'base' ? 'hud-stat__row--emphasis' : null)}>
        <div className="flex items-center gap-[0.4rem]">
          {icon ? <span className="hud-stat__icon">{icon}</span> : null}
          <span>{label}</span>
        </div>
        <span className="hud-stat__value" aria-live="polite">
          {current}/{max}
        </span>
      </div>
      <div className="hud-stat__bar">
        <div className="hud-stat__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

export default AnimatedStatBar;
