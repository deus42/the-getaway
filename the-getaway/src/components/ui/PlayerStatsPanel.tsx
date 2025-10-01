import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getUIStrings } from '../../content/ui';
import { buildPlayerStatProfile, PlayerStatFocus } from '../../game/interfaces/playerStats';
import { getEquippedBonuses, calculateEffectiveSkills } from '../../game/systems/equipmentEffects';

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.55rem',
  background: 'rgba(15, 23, 42, 0.6)',
  borderRadius: '12px',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  padding: '0.65rem 0.75rem',
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
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
};

const statRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.6rem 0.75rem',
  borderRadius: '8px',
  background: 'rgba(30, 41, 59, 0.5)',
  border: '1px solid rgba(148, 163, 184, 0.15)',
  transition: 'all 0.2s ease',
};

const statLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  fontSize: '0.8rem',
  color: '#cbd5e1',
  flex: 1,
};

const statDescriptionStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  color: 'rgba(203, 213, 225, 0.6)',
  marginTop: '0.15rem',
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
  const player = useSelector((state: RootState) => state.player.data);
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);

  // Calculate effective skills including equipment bonuses
  const equipmentBonuses = getEquippedBonuses(player);
  const effectiveSkills = calculateEffectiveSkills(player.skills, equipmentBonuses);
  const profile = buildPlayerStatProfile(effectiveSkills);

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
          const highlight = focusColorMap[entry.focus] ?? focusColorMap.combat;
          const baseValue = player.skills[entry.key];
          const hasBonus = baseValue !== entry.value;

          return (
            <div key={entry.key} style={statRowStyle}>
              <div style={statLabelStyle}>
                <span style={abbreviationBadgeStyle(highlight)}>{entry.abbreviation}</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>{label}</span>
                  <span style={statDescriptionStyle}>{description}</span>
                </div>
              </div>
              <span style={{
                ...statValueStyle,
                color: hasBonus ? '#22c55e' : '#f8fafc'
              }}>
                {entry.value}
                {hasBonus && <span style={{ fontSize: '0.7rem', marginLeft: '0.25rem', opacity: 0.7 }}>({baseValue})</span>}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PlayerStatsPanel;
