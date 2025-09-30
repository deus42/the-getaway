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
  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  gap: '0.65rem',
};

const statCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.45rem',
  background: 'linear-gradient(182deg, rgba(30, 41, 59, 0.76), rgba(15, 23, 42, 0.92))',
  borderRadius: '12px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  padding: '0.75rem 0.8rem',
};

const statHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const abbreviationBadgeStyle = (highlightColor: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.2rem 0.45rem',
  borderRadius: '999px',
  fontSize: '0.65rem',
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: '#f8fafc',
  background: highlightColor,
  boxShadow: '0 8px 16px rgba(59, 130, 246, 0.22)',
});

const focusLabelStyle: React.CSSProperties = {
  fontSize: '0.64rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(148, 163, 184, 0.78)',
};

const statTitleStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: '0.4rem',
  color: '#e2e8f0',
};

const statValueStyle: React.CSSProperties = {
  fontSize: '1.35rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  color: '#f8fafc',
};

const statRangeStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: 'rgba(148, 163, 184, 0.74)',
  letterSpacing: '0.045em',
};

const progressTrackStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '0.35rem',
  borderRadius: '999px',
  overflow: 'hidden',
  background: 'rgba(148, 163, 184, 0.2)',
};

const statDescriptionStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  lineHeight: 1.35,
  color: 'rgba(148, 163, 184, 0.88)',
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
          const description = uiStrings.skillDescriptions[entry.key];
          const focusLabel = uiStrings.statFocus[entry.focus];
          const highlight = focusColorMap[entry.focus] ?? focusColorMap.combat;

          return (
            <article key={entry.key} style={statCardStyle}>
              <div style={statHeaderStyle}>
                <span style={abbreviationBadgeStyle(highlight)}>{entry.abbreviation}</span>
                <span style={focusLabelStyle}>{focusLabel}</span>
              </div>

              <div style={statTitleStyle}>
                <span>{label}</span>
                <span style={statValueStyle}>{entry.value}</span>
              </div>
              <span style={statRangeStyle}>
                {entry.min} – {entry.max}
              </span>

              <div style={progressTrackStyle}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: `${Math.round(entry.normalized * 100)}%`,
                    background: highlight,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              <p style={statDescriptionStyle}>{description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default PlayerStatsPanel;
