import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getSkillDefinition } from '../../content/skills';
import {
  neonPalette,
  panelSurface,
  cardSurface,
  badgeSurface,
  headingStyle,
  subtleText,
  statValueStyle,
} from './theme';

const panelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  padding: '0.9rem 1rem',
  borderRadius: '18px',
  background: panelSurface.background,
  border: panelSurface.border,
  boxShadow: panelSurface.boxShadow,
  backdropFilter: panelSurface.backdropFilter,
  color: neonPalette.textPrimary,
  fontFamily: '"DM Sans", "Inter", sans-serif',
};

const titleStyle: React.CSSProperties = {
  ...headingStyle,
  fontSize: '0.72rem',
  letterSpacing: '0.22em',
};

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  padding: '0.65rem 0.75rem',
  borderRadius: '14px',
  background: cardSurface.background,
  border: cardSurface.border,
  boxShadow: cardSurface.boxShadow,
  color: neonPalette.textPrimary,
  fontSize: '0.68rem',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 700,
  letterSpacing: '0.05em',
};

const badgeStyle = (accent: string): React.CSSProperties => ({
  ...badgeSurface(accent),
  alignSelf: 'flex-start',
  padding: '0.25rem 0.45rem',
  borderRadius: '999px',
  fontSize: '0.56rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  background: `${accent}26`,
});

const statRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.64rem',
  color: neonPalette.textSecondary,
};

const statLabelStyle: React.CSSProperties = {
  ...subtleText,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};

const statValueEmphasis: React.CSSProperties = {
  ...statValueStyle,
  fontSize: '0.8rem',
};

const perksListStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.35rem',
  paddingTop: '0.35rem',
};

const perkBadgeStyle: React.CSSProperties = {
  padding: '0.25rem 0.5rem',
  borderRadius: '999px',
  border: '1px solid rgba(192, 132, 252, 0.42)',
  background: 'linear-gradient(135deg, rgba(192, 132, 252, 0.22), rgba(76, 29, 149, 0.18))',
  color: '#f3e8ff',
  fontSize: '0.58rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
};

const PlayerLoadoutPanel: React.FC = () => {
  const player = useSelector((state: RootState) => state.player.data);
  const weapon = player.equipped.weapon;
  const armor = player.equipped.armor;

  const renderWeapon = () => (
    <div style={cardStyle}>
      <div style={badgeStyle('rgba(56, 189, 248, 0.75)')}>Weapon</div>
      <div style={cardTitleStyle}>{weapon?.name ?? 'Unarmed'}</div>
      {weapon ? (
        <>
          <div style={statRowStyle}>
            <span style={statLabelStyle}>Damage</span>
            <span style={statValueEmphasis}>{weapon.damage}</span>
          </div>
          <div style={statRowStyle}>
            <span style={statLabelStyle}>Range</span>
            <span style={statValueEmphasis}>{weapon.range}</span>
          </div>
          <div style={statRowStyle}>
            <span style={statLabelStyle}>AP Cost</span>
            <span style={statValueEmphasis}>{weapon.apCost}</span>
          </div>
          <div style={statRowStyle}>
            <span style={statLabelStyle}>Skill</span>
            <span style={statValueEmphasis}>
              {weapon.skillType ? (getSkillDefinition(weapon.skillType)?.name ?? '—') : '—'}
            </span>
          </div>
        </>
      ) : (
        <span style={subtleText}>No weapon equipped</span>
      )}
    </div>
  );

  const renderArmor = () => (
    <div style={cardStyle}>
      <div style={badgeStyle('rgba(96, 165, 250, 0.75)')}>Armor</div>
      <div style={cardTitleStyle}>{armor?.name ?? 'Unarmored'}</div>
      {armor ? (
        <>
          <div style={statRowStyle}>
            <span style={statLabelStyle}>Protection</span>
            <span style={statValueEmphasis}>{armor.protection}</span>
          </div>
          <div style={statRowStyle}>
            <span style={statLabelStyle}>Weight</span>
            <span style={statValueEmphasis}>{armor.weight.toFixed(1)} kg</span>
          </div>
        </>
      ) : (
        <span style={subtleText}>No armor equipped</span>
      )}
    </div>
  );

  const renderPerks = () => (
    <div style={cardStyle}>
      <div style={badgeStyle('rgba(236, 72, 153, 0.65)')}>Perks</div>
      {player.perks.length === 0 ? (
        <span style={subtleText}>No perks acquired</span>
      ) : (
        <div style={perksListStyle}>
          {player.perks.map((perkId) => (
            <span key={perkId} style={perkBadgeStyle}>{perkId}</span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={panelStyle} data-testid="player-loadout-panel" role="region" aria-label="Player Loadout">
      <span style={titleStyle}>Loadout</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.9rem' }}>
        {renderWeapon()}
        {renderArmor()}
      </div>
      {renderPerks()}
    </div>
  );
};

export default React.memo(PlayerLoadoutPanel);
