import React, { CSSProperties, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import AnimatedStatBar from './AnimatedStatBar';

const trackerContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
  padding: '0.7rem 0.8rem',
  borderRadius: '10px',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'linear-gradient(185deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95))',
  boxShadow: '0 18px 28px rgba(15, 23, 42, 0.4)',
  color: '#e2e8f0',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.6rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'rgba(148, 163, 184, 0.85)',
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
};

const turnBadgeBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.4rem 0.7rem',
  borderRadius: '999px',
  fontSize: '0.68rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
};

const playerBadgeStyle: CSSProperties = {
  ...turnBadgeBase,
  color: '#0b1120',
  background: 'linear-gradient(135deg, #38bdf8, #60a5fa)',
  textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
  boxShadow: '0 0 12px rgba(56, 189, 248, 0.6), 0 10px 20px -10px rgba(56, 189, 248, 0.55)',
};

const enemyBadgeStyle: CSSProperties = {
  ...turnBadgeBase,
  color: '#f1f5f9',
  background: 'linear-gradient(135deg, rgba(248, 113, 113, 0.8), rgba(239, 68, 68, 0.9))',
  textShadow: '0 1px 3px rgba(0, 0, 0, 0.6)',
  boxShadow: '0 0 12px rgba(239, 68, 68, 0.6), 0 10px 20px -10px rgba(239, 68, 68, 0.55)',
};

const apBarTrack: CSSProperties = {
  flex: 1,
  height: '6px',
  borderRadius: '999px',
  background: 'rgba(51, 65, 85, 0.55)',
  overflow: 'hidden',
};

const apBarFillBase: CSSProperties = {
  height: '100%',
  borderRadius: '999px',
  transition: 'width 160ms ease-out',
};

const enemyListStyle: CSSProperties = {
  display: 'grid',
  gap: '0.45rem',
};

const enemyRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  fontSize: '0.72rem',
  color: '#cbd5f5',
};

const TurnTracker: React.FC = () => {
  const { inCombat, isPlayerTurn, currentMapArea } = useSelector((state: RootState) => state.world);
  const player = useSelector((state: RootState) => state.player.data);

  const enemySnapshots = useMemo(() => {
    return currentMapArea?.entities.enemies.map((enemy) => ({
      id: enemy.id,
      name: enemy.name,
      ap: enemy.actionPoints,
      maxAp: enemy.maxActionPoints,
    })) ?? [];
  }, [currentMapArea?.entities.enemies]);

  const turnLabel = inCombat ? (isPlayerTurn ? 'Player Turn' : 'Enemy Turn') : 'Exploration';

  const currentBadgeStyle = isPlayerTurn ? playerBadgeStyle : enemyBadgeStyle;

  return (
    <div style={trackerContainerStyle}>
      <div style={headerStyle}>
        <span>Turn Status</span>
        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div style={currentBadgeStyle}>{turnLabel}</div>

        <AnimatedStatBar
          label="Action Points"
          current={player.actionPoints}
          max={player.maxActionPoints}
          icon="⚡"
          baseColor="#38bdf8"
          lowThreshold={40}
          criticalThreshold={20}
        />

        {inCombat && enemySnapshots.length > 0 && (
          <div>
            <div style={{ fontSize: '0.62rem', color: 'rgba(248, 113, 113, 0.7)', marginBottom: '0.3rem' }}>
              Hostile Readout
            </div>
            <div style={enemyListStyle}>
              {enemySnapshots.map((enemy) => {
                const apRatio = enemy.maxAp > 0
                  ? Math.max(0, Math.min(1, enemy.ap / enemy.maxAp))
                  : 0;

                return (
                  <div key={enemy.id} style={enemyRowStyle}>
                    <span style={{ flex: '0 0 auto', fontWeight: 600, fontSize: '0.72rem' }}>{enemy.name}</span>
                    <div style={{ ...apBarTrack, width: '100px' }}>
                      <div
                        style={{
                          ...apBarFillBase,
                          width: `${apRatio * 100}%`,
                          background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.85), rgba(248, 113, 113, 0.75))',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.68rem', minWidth: '42px', textAlign: 'right' }}>
                      {enemy.ap}/{enemy.maxAp}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TurnTracker;
