import React, { CSSProperties, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const trackerContainerStyle: CSSProperties = {
  position: 'absolute',
  top: '1.25rem',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 3,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  minWidth: '320px',
  padding: '1rem 1.25rem',
  borderRadius: '18px',
  border: '1px solid rgba(59, 130, 246, 0.45)',
  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.86), rgba(15, 23, 42, 0.7))',
  boxShadow: '0 18px 36px rgba(15, 23, 42, 0.38)',
  color: '#e2e8f0',
  backdropFilter: 'blur(10px)',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.75rem',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: 'rgba(148, 163, 184, 0.85)',
};

const turnBadgeBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.45rem 0.85rem',
  borderRadius: '999px',
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.12em',
};

const playerBadgeStyle: CSSProperties = {
  ...turnBadgeBase,
  color: '#0b1120',
  background: 'linear-gradient(135deg, #38bdf8, #60a5fa)',
};

const enemyBadgeStyle: CSSProperties = {
  ...turnBadgeBase,
  color: '#f1f5f9',
  background: 'linear-gradient(135deg, rgba(248, 113, 113, 0.8), rgba(239, 68, 68, 0.9))',
};

const apBarContainer: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.8rem',
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
  gap: '0.55rem',
};

const enemyRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  fontSize: '0.82rem',
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

  const playerApRatio = player.maxActionPoints > 0
    ? Math.max(0, Math.min(1, player.actionPoints / player.maxActionPoints))
    : 0;

  const currentBadgeStyle = isPlayerTurn ? playerBadgeStyle : enemyBadgeStyle;

  return (
    <div style={trackerContainerStyle}>
      <div style={headerStyle}>
        <span>Turn Status</span>
        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={currentBadgeStyle}>{turnLabel}</div>

        <div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(148, 163, 184, 0.7)', marginBottom: '0.4rem' }}>
            Player Action Points
          </div>
          <div style={apBarContainer}>
            <div style={apBarTrack}>
              <div
                style={{
                  ...apBarFillBase,
                  width: `${playerApRatio * 100}%`,
                  background: 'linear-gradient(90deg, #38bdf8, #60a5fa)',
                }}
              />
            </div>
            <span style={{ fontSize: '0.82rem', minWidth: '54px', textAlign: 'right' }}>
              {player.actionPoints}/{player.maxActionPoints}
            </span>
          </div>
        </div>

        {inCombat && enemySnapshots.length > 0 && (
          <div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(248, 113, 113, 0.7)', marginBottom: '0.4rem' }}>
              Hostile Readout
            </div>
            <div style={enemyListStyle}>
              {enemySnapshots.map((enemy) => {
                const apRatio = enemy.maxAp > 0
                  ? Math.max(0, Math.min(1, enemy.ap / enemy.maxAp))
                  : 0;

                return (
                  <div key={enemy.id} style={enemyRowStyle}>
                    <span style={{ flex: '0 0 auto', fontWeight: 600 }}>{enemy.name}</span>
                    <div style={{ ...apBarTrack, width: '120px' }}>
                      <div
                        style={{
                          ...apBarFillBase,
                          width: `${apRatio * 100}%`,
                          background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.85), rgba(248, 113, 113, 0.75))',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.78rem', minWidth: '42px', textAlign: 'right' }}>
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
