import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { setAutoBattleEnabled } from '../../store/settingsSlice';
import { getUIStrings } from '../../content/ui';
import type { Enemy } from '../../game/interfaces/types';

const EMPTY_ENEMIES: Enemy[] = [];

const widgetStyle: React.CSSProperties = {
  width: 'min(360px, 32vw)',
  minWidth: '280px',
  padding: '0.85rem 1rem 1.1rem',
  borderRadius: '16px',
  background: 'linear-gradient(165deg, rgba(10,17,32,0.93), rgba(15,23,42,0.9))',
  border: '1px solid rgba(56,189,248,0.28)',
  boxShadow: '0 18px 36px rgba(15,23,42,0.55)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.72rem',
  pointerEvents: 'auto',
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '0.62rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: '#94a3b8',
};

const hostileSummaryStyle: React.CSSProperties = {
  display: 'inline-flex',
  gap: '0.42rem',
  alignItems: 'center',
  fontSize: '0.62rem',
  letterSpacing: '0.18em',
};

const hostileCountStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: '0.78rem',
  color: '#38bdf8',
};

const hostileLabelStyle: React.CSSProperties = {
  opacity: 0.8,
  color: '#cbd5f5',
};

const turnBannerStyle = (playerTurn: boolean): React.CSSProperties => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.52rem 1rem',
  borderRadius: '12px',
  fontWeight: 700,
  letterSpacing: '0.22em',
  fontSize: '0.76rem',
  textTransform: 'uppercase',
  color: playerTurn ? '#0f172a' : '#f8fafc',
  background: playerTurn
    ? 'linear-gradient(135deg, #38bdf8, #60a5fa)'
    : 'linear-gradient(135deg, rgba(248,113,113,0.85), rgba(239,68,68,0.95))',
  boxShadow: playerTurn
    ? '0 0 18px rgba(56,189,248,0.6), 0 14px 24px -10px rgba(56,189,248,0.55)'
    : '0 0 18px rgba(239,68,68,0.6), 0 14px 24px -10px rgba(239,68,68,0.55)',
});

const playerCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.65rem',
  padding: '0.9rem 1rem 0.85rem',
  borderRadius: '14px',
  background: 'linear-gradient(155deg, rgba(15,23,42,0.92), rgba(30,41,59,0.8))',
  border: '1px solid rgba(56,189,248,0.18)',
  boxShadow: '0 16px 32px rgba(15,23,42,0.45)',
};

const apHeaderRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.68rem',
  letterSpacing: '0.16em',
  color: '#9ca3c6',
  textTransform: 'uppercase',
};

const apValue = (exhausted: boolean): React.CSSProperties => ({
  fontSize: '0.98rem',
  fontWeight: 600,
  color: exhausted ? '#fda4af' : '#f8fafc',
  textShadow: exhausted ? '0 0 12px rgba(248,113,113,0.45)' : 'none',
});

const apProgressTrack: React.CSSProperties = {
  position: 'relative',
  height: '9px',
  borderRadius: '999px',
  background: 'linear-gradient(90deg, rgba(30,41,59,0.9), rgba(11,16,28,0.85))',
  overflow: 'hidden',
  boxShadow: 'inset 0 0 8px rgba(15,23,42,0.6)',
};

const apProgressFill = (ratio: number): React.CSSProperties => ({
  position: 'absolute',
  top: 0,
  left: 0,
  height: '100%',
  width: `${Math.max(0, Math.min(1, ratio)) * 100}%`,
  background: 'linear-gradient(90deg, rgba(96,165,250,0.95), rgba(56,189,248,0.85))',
  boxShadow: '0 0 16px rgba(56,189,248,0.38)',
  transition: 'width 160ms ease-out',
});

const autoToggleStyle = (status: 'off' | 'running' | 'paused'): React.CSSProperties => {
  const palette = {
    off: {
      border: 'rgba(148,163,184,0.32)',
      glow: 'rgba(148,163,184,0.22)',
      background: 'linear-gradient(135deg, rgba(15,23,42,0.86), rgba(30,41,59,0.78))',
      label: '#cbd5f5',
      state: '#94a3b8',
      dot: '#64748b',
    },
    running: {
      border: 'rgba(34,197,94,0.55)',
      glow: 'rgba(34,197,94,0.45)',
      background: 'linear-gradient(135deg, rgba(22,163,74,0.25), rgba(74,222,128,0.18))',
      label: '#d1fae5',
      state: '#86efac',
      dot: '#34d399',
    },
    paused: {
      border: 'rgba(250,204,21,0.55)',
      glow: 'rgba(250,204,21,0.38)',
      background: 'linear-gradient(135deg, rgba(120,53,15,0.28), rgba(217,119,6,0.22))',
      label: '#fef3c7',
      state: '#fde68a',
      dot: '#fbbf24',
    },
  }[status];

  return {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.52rem 0.9rem',
    borderRadius: '12px',
    border: `1px solid ${palette.border}`,
    background: palette.background,
    color: palette.label,
    fontWeight: 500,
    fontSize: '0.72rem',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    boxShadow: `0 0 22px ${palette.glow}`,
    transition: 'transform 120ms ease, box-shadow 120ms ease, border-color 160ms ease',
  };
};

const autoLabelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '0.14rem',
};

const autoPrimaryStyle: React.CSSProperties = {
  fontSize: '0.58rem',
  letterSpacing: '0.3em',
  opacity: 0.74,
};

const autoStateStyle = (status: 'off' | 'running' | 'paused'): React.CSSProperties => {
  const colors: Record<typeof status, string> = {
    off: '#cbd5f5',
    running: '#bbf7d0',
    paused: '#fde68a',
  };
  return {
    fontSize: '0.84rem',
    letterSpacing: '0.14em',
    color: colors[status],
  };
};

const statusDot = (status: 'off' | 'running' | 'paused'): React.CSSProperties => {
  const glows: Record<typeof status, { background: string; shadow: string }> = {
    off: { background: '#64748b', shadow: 'rgba(100,116,139,0.35)' },
    running: { background: '#34d399', shadow: 'rgba(52,211,153,0.55)' },
    paused: { background: '#fbbf24', shadow: 'rgba(251,191,36,0.45)' },
  };

  return {
    width: '0.6rem',
    height: '0.6rem',
    borderRadius: '50%',
    background: glows[status].background,
    boxShadow: `0 0 14px ${glows[status].shadow}`,
  };
};

const enemyCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  padding: '0.82rem 0.95rem',
  borderRadius: '14px',
  background: 'linear-gradient(160deg, rgba(17,24,39,0.86), rgba(15,23,42,0.9))',
  border: '1px solid rgba(99,102,241,0.22)',
  boxShadow: '0 16px 32px rgba(15,23,42,0.42)',
};

const enemyLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.58rem',
  letterSpacing: '0.24em',
  color: '#808bb2',
  textTransform: 'uppercase',
};

const enemyRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr) auto',
  alignItems: 'center',
  gap: '0.6rem',
  fontSize: '0.72rem',
  color: '#d1dcff',
};

const enemyProgressTrack: React.CSSProperties = {
  position: 'relative',
  height: '6px',
  borderRadius: '999px',
  background: 'rgba(71,85,105,0.45)',
  overflow: 'hidden',
};

const enemyProgressFill = (ratio: number): React.CSSProperties => ({
  position: 'absolute',
  inset: 0,
  width: `${Math.max(0, Math.min(1, ratio)) * 100}%`,
  background: 'linear-gradient(90deg, rgba(239,68,68,0.85), rgba(248,113,113,0.78))',
  boxShadow: '0 0 12px rgba(248,113,113,0.32)',
  transition: 'width 160ms ease-out',
});

const enemyApLabelStyle: React.CSSProperties = {
  fontSize: '0.66rem',
  opacity: 0.84,
  minWidth: '44px',
  textAlign: 'right',
};

const CombatControlWidget: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const locale = useSelector((state: RootState) => state.settings.locale);
  const autoBattleStatus = useSelector((state: RootState) => state.autoBattle.status);
  const inCombat = useSelector((state: RootState) => state.world.inCombat);
  const isPlayerTurn = useSelector((state: RootState) => state.world.isPlayerTurn);
  const autoBattleEnabled = useSelector((state: RootState) => state.settings.autoBattleEnabled);
  const playerActionPoints = useSelector((state: RootState) => state.player.data.actionPoints);
  const playerMaxActionPoints = useSelector((state: RootState) => state.player.data.maxActionPoints);
  const enemySnapshots = useSelector(
    (state: RootState) => state.world.currentMapArea?.entities.enemies ?? EMPTY_ENEMIES
  );

  const uiStrings = getUIStrings(locale);

  const livingEnemies = useMemo(
    () => enemySnapshots.filter((enemy) => enemy.health > 0),
    [enemySnapshots]
  );

  const livingEnemyCount = livingEnemies.length;
  const enemyRows = useMemo(() => {
    return livingEnemies
      .slice()
      .sort((a, b) => b.actionPoints - a.actionPoints)
      .slice(0, 4);
  }, [livingEnemies]);

  const [displayedActionPoints, setDisplayedActionPoints] = useState<number>(
    playerActionPoints
  );

  const displayedApRef = useRef(displayedActionPoints);
  const apTweenTimeout = useRef<number | null>(null);

  useEffect(() => {
    displayedApRef.current = displayedActionPoints;
  }, [displayedActionPoints]);

  useEffect(() => {
    const target = playerActionPoints;

    if (apTweenTimeout.current) {
      window.clearTimeout(apTweenTimeout.current);
      apTweenTimeout.current = null;
    }

    if (!inCombat) {
      setDisplayedActionPoints(target);
      return;
    }

    const shouldAnimate = autoBattleEnabled && autoBattleStatus === 'running';

    if (!shouldAnimate || target >= displayedApRef.current) {
      setDisplayedActionPoints(target);
      return;
    }

    const stepDown = () => {
      const current = displayedApRef.current;
      if (current <= target) {
        apTweenTimeout.current = null;
        return;
      }
      setDisplayedActionPoints(current - 1);
      apTweenTimeout.current = window.setTimeout(stepDown, 70);
    };

    apTweenTimeout.current = window.setTimeout(stepDown, 60);

    return () => {
      if (apTweenTimeout.current) {
        window.clearTimeout(apTweenTimeout.current);
        apTweenTimeout.current = null;
      }
    };
  }, [playerActionPoints, inCombat, autoBattleEnabled, autoBattleStatus]);

  useEffect(() => {
    return () => {
      if (apTweenTimeout.current) {
        window.clearTimeout(apTweenTimeout.current);
      }
    };
  }, []);

  if (!inCombat) {
    return null;
  }

  const maxActionPoints = Math.max(0, playerMaxActionPoints);
  const apRatio =
    maxActionPoints > 0
      ? Math.max(0, Math.min(1, displayedActionPoints / maxActionPoints))
      : 0;

  const handleToggle = () => {
    dispatch(setAutoBattleEnabled(!autoBattleEnabled));
  };

  const determineAutoStatus = (): 'off' | 'running' | 'paused' => {
    if (!autoBattleEnabled) {
      return 'off';
    }
    if (autoBattleStatus === 'paused') {
      return 'paused';
    }
    if (autoBattleStatus === 'running') {
      return 'running';
    }
    return 'off';
  };

  const autoStatus = determineAutoStatus();

  return (
    <div style={widgetStyle} data-testid="combat-control-widget">
      <div style={headerRowStyle}>
        <span>{uiStrings.turnTracker.heading.toUpperCase()}</span>
        <span style={hostileSummaryStyle}>
          <span style={hostileCountStyle}>{livingEnemyCount}</span>
          <span style={hostileLabelStyle}>{uiStrings.turnTracker.hostileReadout.toUpperCase()}</span>
        </span>
      </div>

      <div style={turnBannerStyle(isPlayerTurn)}>
        {isPlayerTurn ? uiStrings.turnTracker.playerTurn : uiStrings.turnTracker.enemyTurn}
      </div>

      <div style={playerCardStyle}>
        <div style={apHeaderRowStyle}>
          <span>{uiStrings.playerStatus.actionPointsLabel}</span>
            <span style={apValue(displayedActionPoints === 0)}>
            {displayedActionPoints}/{playerMaxActionPoints}
          </span>
        </div>
        <div style={apProgressTrack}>
          <div style={apProgressFill(apRatio)} />
        </div>
      </div>

      <button
        type="button"
        onClick={handleToggle}
        style={autoToggleStyle(autoStatus)}
        aria-pressed={autoBattleEnabled}
        aria-label={uiStrings.autoBattle.toggleLabel}
      >
        <span style={autoLabelStyle}>
          <span style={autoPrimaryStyle}>{uiStrings.autoBattle.heading.toUpperCase()}</span>
          <span style={autoStateStyle(autoStatus)}>
            {autoStatus === 'off'
              ? uiStrings.autoBattle.hudToggleOffLabel
              : uiStrings.autoBattle.hudToggleOnLabel}
          </span>
        </span>
        <span style={statusDot(autoStatus)} />
      </button>

      <div style={enemyCardStyle}>
        <span style={enemyLabelStyle}>{uiStrings.turnTracker.hostileReadout.toUpperCase()}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {enemyRows.length > 0 ? (
            enemyRows.map((enemy) => {
              const ratio =
                enemy.maxActionPoints > 0
                  ? Math.max(0, Math.min(1, enemy.actionPoints / enemy.maxActionPoints))
                  : 0;
              return (
                <div key={enemy.id} style={enemyRowStyle}>
                  <span
                    style={{
                      fontWeight: 600,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                    }}
                    title={enemy.name}
                  >
                    {enemy.name}
                  </span>
                  <div style={enemyProgressTrack}>
                    <div style={enemyProgressFill(ratio)} />
                  </div>
                  <span style={enemyApLabelStyle}>
                    {enemy.actionPoints}/{enemy.maxActionPoints}
                  </span>
                </div>
              );
            })
          ) : (
            <span
              style={{
                fontSize: '0.68rem',
                color: '#9ca3c6',
                textAlign: 'center',
                letterSpacing: '0.1em',
              }}
            >
              {uiStrings.turnTracker.playerTurn.toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CombatControlWidget;
