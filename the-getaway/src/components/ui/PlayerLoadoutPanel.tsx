import React, { useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { getSkillDefinition } from '../../content/skills';
import { getPerkDefinition, PerkDefinition } from '../../content/perks';
import { Durability, PerkId, EquipmentSlot, Item, Weapon, Armor } from '../../game/interfaces/types';
import { equipItem, unequipItem } from '../../store/playerSlice';
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
  gap: '0.65rem',
  minHeight: 0,
  height: '100%',
  overflow: 'hidden',
};

const cardsWrapperStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.85rem',
  overflowY: 'auto',
  paddingRight: '0.2rem',
};

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.32rem',
  padding: '0.6rem 0.7rem',
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

const baseButtonStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  padding: '0.3rem 0.55rem',
  borderRadius: '999px',
  border: '1px solid rgba(148, 163, 184, 0.35)',
  background: 'rgba(30, 41, 59, 0.65)',
  color: '#e2e8f0',
  fontSize: '0.56rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'background 0.15s ease, border-color 0.15s ease',
};

const unequipButtonStyle: React.CSSProperties = {
  ...baseButtonStyle,
  borderColor: 'rgba(248, 113, 113, 0.55)',
  background: 'rgba(248, 113, 113, 0.18)',
};

const equipWeaponButtonStyle: React.CSSProperties = {
  ...baseButtonStyle,
  borderColor: 'rgba(56, 189, 248, 0.55)',
  background: 'rgba(56, 189, 248, 0.18)',
};

const equipArmorButtonStyle: React.CSSProperties = {
  ...baseButtonStyle,
  borderColor: 'rgba(96, 165, 250, 0.55)',
  background: 'rgba(96, 165, 250, 0.18)',
};

const resolvePreferredSlot = (item: Item): EquipmentSlot | null => {
  if (item.equipSlot) {
    return item.equipSlot;
  }
  if ('damage' in item) {
    return 'primaryWeapon';
  }
  if ('protection' in item) {
    return 'bodyArmor';
  }
  return null;
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

const PlayerLoadoutPanel: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const player = useSelector((state: RootState) => state.player.data);
  const weapon = player.equipped.weapon;
  const armor = player.equipped.armor;

  const stowedWeapons = useMemo(
    () =>
      player.inventory.items.filter(
        (item): item is Weapon => resolvePreferredSlot(item) === 'primaryWeapon'
      ),
    [player.inventory.items]
  );

  const stowedArmor = useMemo(
    () =>
      player.inventory.items.filter(
        (item): item is Armor => resolvePreferredSlot(item) === 'bodyArmor'
      ),
    [player.inventory.items]
  );

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

  const handleEquipItem = useCallback(
    (itemId: string, slot: EquipmentSlot) => {
      dispatch(equipItem({ itemId, slot }));
    },
    [dispatch]
  );

  const handleUnequip = useCallback(
    (slot: EquipmentSlot) => {
      dispatch(unequipItem({ slot }));
    },
    [dispatch]
  );

  const renderWeapon = () => {
    const durability = describeDurability(weapon?.durability);

    return (
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
          {durability && (
            <div style={statRowStyle}>
              <span style={statLabelStyle}>Durability</span>
              <span style={statValueEmphasis}>{durability.copy}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {weapon && (
              <button
                type="button"
                style={unequipButtonStyle}
                onClick={() => handleUnequip('primaryWeapon')}
              >
                Unequip
              </button>
            )}
            {stowedWeapons.map((item) => (
              <button
                key={item.id}
                type="button"
                style={equipWeaponButtonStyle}
                onClick={() => handleEquipItem(item.id, 'primaryWeapon')}
              >
                Equip {item.name}
              </button>
            ))}
          </div>
        </>
      ) : (
        <span style={subtleText}>No weapon equipped</span>
      )}
    </div>
  );
  };

  const renderArmor = () => {
    const durability = describeDurability(armor?.durability);

    return (
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
          {durability && (
            <div style={statRowStyle}>
              <span style={statLabelStyle}>Durability</span>
              <span style={statValueEmphasis}>{durability.copy}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {armor && (
              <button
                type="button"
                style={unequipButtonStyle}
                onClick={() => handleUnequip('bodyArmor')}
              >
                Unequip
              </button>
            )}
            {stowedArmor.map((item) => (
              <button
                key={item.id}
                type="button"
                style={equipArmorButtonStyle}
                onClick={() => handleEquipItem(item.id, 'bodyArmor')}
              >
                Equip {item.name}
              </button>
            ))}
          </div>
        </>
      ) : (
        <span style={subtleText}>No armor equipped</span>
      )}
    </div>
  );
  };

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
      <div style={cardsWrapperStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.9rem' }}>
          {renderWeapon()}
          {renderArmor()}
        </div>
        {renderPerks()}
      </div>
    </div>
  );
};

export default React.memo(PlayerLoadoutPanel);
