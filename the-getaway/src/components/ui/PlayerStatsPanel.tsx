import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getUIStrings } from '../../content/ui';
import { buildPlayerStatProfile, PlayerStatFocus } from '../../game/interfaces/playerStats';

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  background: 'rgba(15, 23, 42, 0.6)',
  borderRadius: '12px',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  padding: '0.85rem 0.9rem',
  boxShadow: 'inset 0 1px 0 rgba(148, 163, 184, 0.18)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
};

const headingLabelStyle: React.CSSProperties = {
  fontSize: '0.62rem',
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: 'rgba(148, 163, 184, 0.72)',
};

const headingTitleStyle: React.CSSProperties = {
  fontSize: '0.94rem',
  fontWeight: 600,
  letterSpacing: '0.05em',
  color: '#f8fafc',
};

const statGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '0.5rem',
};

const statRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.5rem 0.65rem',
  borderRadius: '8px',
  background: 'rgba(30, 41, 59, 0.4)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

const statLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.75rem',
  color: '#cbd5e1',
};

const abbreviationBadgeStyle = (highlightColor: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.15rem 0.35rem',
  borderRadius: '4px',
  fontSize: '0.6rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#f8fafc',
  background: highlightColor,
});

const statValueStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 600,
  color: '#f8fafc',
};

const focusColorMap: Record<PlayerStatFocus, string> = {
  combat: 'linear-gradient(135deg, rgba(239, 68, 68, 0.85), rgba(248, 113, 113, 0.85))',
  perception: 'linear-gradient(135deg, rgba(56, 189, 248, 0.85), rgba(59, 130, 246, 0.85))',
  survival: 'linear-gradient(135deg, rgba(45, 212, 191, 0.85), rgba(16, 185, 129, 0.85))',
  social: 'linear-gradient(135deg, rgba(244, 114, 182, 0.85), rgba(236, 72, 153, 0.85))',
  intellect: 'linear-gradient(135deg, rgba(165, 180, 252, 0.85), rgba(99, 102, 241, 0.85))',
  mobility: 'linear-gradient(135deg, rgba(96, 165, 250, 0.85), rgba(37, 99, 235, 0.85))',
  fortuity: 'linear-gradient(135deg, rgba(250, 204, 21, 0.85), rgba(245, 158, 11, 0.85))',
};

const PlayerStatsPanel: React.FC = () => {
  const skills = useSelector((state: RootState) => state.player.data.skills);
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);
  const profile = buildPlayerStatProfile(skills);

  return (
    <section style={containerStyle} aria-label="player-statistics">
      <header style={headerStyle}>
        <span style={headingLabelStyle}>{uiStrings.playerStatus.attributesLabel}</span>
        <h3 style={headingTitleStyle}>{uiStrings.playerStatus.attributesTitle}</h3>
      </header>

      <div style={statGridStyle}>
        {profile.map((entry) => {
          const label = uiStrings.skills[entry.key];
          const highlight = focusColorMap[entry.focus] ?? focusColorMap.combat;

          return (
            <div key={entry.key} style={statRowStyle}>
              <div style={statLabelStyle}>
                <span style={abbreviationBadgeStyle(highlight)}>{entry.abbreviation}</span>
                <span>{label}</span>
              </div>
              <span style={statValueStyle}>{entry.value}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PlayerStatsPanel;
