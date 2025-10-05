import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getSkillDefinition } from '../../content/skills';
import { getPerkDefinition, PerkDefinition } from '../../content/perks';
import { Durability, PerkId } from '../../game/interfaces/types';
import Tooltip, { TooltipContent } from './Tooltip';
import {
  characterPanelSurface,
  characterPanelHeaderStyle,
  characterPanelLabelStyle,
  characterPanelTitleStyle,
  subtleText,
  statValueStyle,
} from './theme';

const panelStyle: React.CSSProperties = {
  ...characterPanelSurface,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  padding: '0.65rem 0.75rem',
  borderRadius: '10px',
  background: 'rgba(30, 41, 59, 0.55)',
  border: '1px solid rgba(148, 163, 184, 0.22)',
  color: '#e2e8f0',
  fontSize: '0.68rem',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 700,
  letterSpacing: '0.05em',
};

const badgeStyle = (accent: string): React.CSSProperties => ({
  alignSelf: 'flex-start',
  padding: '0.22rem 0.45rem',
  borderRadius: '999px',
  fontSize: '0.56rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  border: `1px solid ${accent}`,
  color: accent,
  background: 'rgba(15, 23, 42, 0.7)',
});

const statRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.64rem',
  color: 'rgba(226, 232, 240, 0.86)',
};

const warningRowStyle: React.CSSProperties = {
  ...statRowStyle,
  fontWeight: 600,
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
  gap: '0.45rem',
  paddingTop: '0.35rem',
};

const perkBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.32rem 0.6rem',
  borderRadius: '999px',
  background: 'rgba(76, 29, 149, 0.16)',
  border: '1px solid rgba(192, 132, 252, 0.45)',
  color: '#f3e8ff',
  fontSize: '0.6rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  minHeight: '34px',
};

const headerStyle: React.CSSProperties = {
  ...characterPanelHeaderStyle,
};

const headingLabelStyle: React.CSSProperties = {
  ...characterPanelLabelStyle,
};

const headingTitleStyle: React.CSSProperties = {
  ...characterPanelTitleStyle,
};

const PlayerLoadoutPanel: React.FC = () => {
  const player = useSelector((state: RootState) => state.player.data);
  const weapon = player.equipped.weapon;
  const armor = player.equipped.armor;

  const renderDurabilityRow = (meta: { copy: string; style: React.CSSProperties; color: string } | null) => {
    if (!meta) {
      return null;
    }

    return (
      <div style={{ ...meta.style, color: meta.color }}>
        <span style={statLabelStyle}>Durability</span>
        <span style={{ ...statValueEmphasis, color: meta.color }}>{meta.copy}</span>
      </div>
    );
  };

  const describeDurability = (durability?: Durability) => {
    if (!durability || durability.max <= 0) {
      return null;
    }

    const ratio = Math.max(0, Math.min(1, durability.current / durability.max));
    const percentage = Math.round(ratio * 100);

    if (ratio === 1) {
      return {
        copy: `Condition ${percentage}%`,
        style: statRowStyle,
        color: 'rgba(226, 232, 240, 0.86)',
      };
    }

    if (ratio <= 0) {
      return {
        copy: 'Condition 0% – Broken',
        style: warningRowStyle,
        color: '#f87171',
      };
    }

    if (ratio <= 0.25) {
      return {
        copy: `Condition ${percentage}% – Critical`,
        style: warningRowStyle,
        color: '#fbbf24',
      };
    }

    if (ratio <= 0.5) {
      return {
        copy: `Condition ${percentage}% – Worn`,
        style: warningRowStyle,
        color: '#f59e0b',
      };
    }

    return {
      copy: `Condition ${percentage}%`,
      style: statRowStyle,
      color: 'rgba(250, 204, 21, 0.95)',
    };
  };

  const { knownPerks, unknownPerkIds } = useMemo(() => {
    const known: PerkDefinition[] = [];
    const unknown: string[] = [];

    player.perks.forEach((perkId) => {
      try {
        known.push(getPerkDefinition(perkId as PerkId));
      } catch (error) {
        console.warn('[PlayerLoadoutPanel] Unknown perk id encountered:', perkId, error);
        unknown.push(perkId);
      }
    });

    return { knownPerks: known, unknownPerkIds: unknown };
  }, [player.perks]);

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
          {renderDurabilityRow(describeDurability(weapon.durability))}
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
          {renderDurabilityRow(describeDurability(armor.durability))}
        </>
      ) : (
        <span style={subtleText}>No armor equipped</span>
      )}
    </div>
  );

  const renderPerks = () => (
    <div style={cardStyle}>
      <div style={badgeStyle('rgba(236, 72, 153, 0.65)')}>Perks</div>
      {knownPerks.length === 0 && unknownPerkIds.length === 0 ? (
        <span style={subtleText}>No perks acquired</span>
      ) : (
        <div style={perksListStyle}>
          {knownPerks.map((perk) => (
            <Tooltip
              key={perk.id}
              content={(
                <TooltipContent
                  title={perk.name}
                  description={perk.description}
                  lines={perk.effects}
                />
              )}
              wrapperStyle={{ display: 'inline-flex' }}
            >
              <span style={perkBadgeStyle}>{perk.name}</span>
            </Tooltip>
          ))}
          {unknownPerkIds.map((perkId) => (
            <span key={perkId} style={perkBadgeStyle}>{perkId}</span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={panelStyle} data-testid="player-loadout-panel" role="region" aria-label="Player Loadout">
      <header style={headerStyle}>
        <span style={headingLabelStyle}>Operative</span>
        <h3 style={headingTitleStyle}>Loadout</h3>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.9rem' }}>
        {renderWeapon()}
        {renderArmor()}
      </div>
      {renderPerks()}
    </div>
  );
};

export default React.memo(PlayerLoadoutPanel);
