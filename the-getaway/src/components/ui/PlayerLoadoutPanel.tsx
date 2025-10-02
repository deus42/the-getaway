import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getSkillDefinition } from '../../content/skills';

const panelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
  padding: '1rem',
  borderRadius: '14px',
  border: '1px solid rgba(148, 163, 184, 0.24)',
  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.78))',
  boxShadow: '0 18px 30px rgba(15, 23, 42, 0.35)',
};

const sectionStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: '0.6rem',
};

const titleStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: '#93c5fd',
};

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  padding: '0.75rem 0.85rem',
  borderRadius: '10px',
  border: '1px solid rgba(56, 189, 248, 0.25)',
  background: 'rgba(15, 23, 42, 0.6)',
  color: '#e2e8f0',
  fontSize: '0.75rem',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  fontWeight: 600,
  color: '#f8fafc',
};

const badgeStyle = (accent: string): React.CSSProperties => ({
  alignSelf: 'flex-start',
  padding: '0.2rem 0.45rem',
  borderRadius: '999px',
  border: `1px solid ${accent}`,
  color: accent,
  fontSize: '0.62rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
});

const statRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.7rem',
  color: 'rgba(226, 232, 240, 0.85)',
};

const perksListStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.35rem',
  paddingTop: '0.4rem',
};

const perkBadgeStyle: React.CSSProperties = {
  padding: '0.25rem 0.55rem',
  borderRadius: '999px',
  border: '1px solid rgba(192, 132, 252, 0.45)',
  background: 'rgba(192, 132, 252, 0.15)',
  color: '#f5f3ff',
  fontSize: '0.65rem',
  letterSpacing: '0.06em',
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
            <span>Damage</span>
            <span>{weapon.damage}</span>
          </div>
          <div style={statRowStyle}>
            <span>Range</span>
            <span>{weapon.range}</span>
          </div>
          <div style={statRowStyle}>
            <span>AP Cost</span>
            <span>{weapon.apCost}</span>
          </div>
          <div style={statRowStyle}>
            <span>Skill</span>
            <span>{weapon.skillType ? getSkillDefinition(weapon.skillType).name : '—'}</span>
          </div>
        </>
      ) : (
        <span style={{ color: 'rgba(148, 163, 184, 0.75)' }}>No weapon equipped</span>
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
            <span>Protection</span>
            <span>{armor.protection}</span>
          </div>
          <div style={statRowStyle}>
            <span>Weight</span>
            <span>{armor.weight.toFixed(1)} kg</span>
          </div>
        </>
      ) : (
        <span style={{ color: 'rgba(148, 163, 184, 0.75)' }}>No armor equipped</span>
      )}
    </div>
  );

  const renderPerks = () => (
    <div style={cardStyle}>
      <div style={badgeStyle('rgba(236, 72, 153, 0.65)')}>Perks</div>
      {player.perks.length === 0 ? (
        <span style={{ color: 'rgba(148, 163, 184, 0.75)' }}>No perks acquired</span>
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
    <div style={panelStyle} data-testid="player-loadout-panel">
      <span style={titleStyle}>Loadout</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.9rem' }}>
        {renderWeapon()}
        {renderArmor()}
      </div>
      {renderPerks()}
    </div>
  );
};

export default PlayerLoadoutPanel;
