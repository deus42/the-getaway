import React, { useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { getSkillDefinition } from '../../content/skills';
import { getPerkDefinition, PerkDefinition } from '../../content/perks';
import { Durability, PerkId, EquipmentSlot, Item, Weapon, Armor } from '../../game/interfaces/types';
import { equipItem, unequipItem } from '../../store/playerSlice';
import Tooltip, { TooltipContent } from './Tooltip';
import { getUIStrings } from '../../content/ui';
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

const equipmentGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '0.9rem',
  alignContent: 'start',
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

const cardActionsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.4rem',
  marginTop: '0.25rem',
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

const SLOT_BADGE_COLORS: Record<EquipmentSlot, string> = {
  primaryWeapon: 'rgba(56, 189, 248, 0.75)',
  secondaryWeapon: 'rgba(59, 130, 246, 0.65)',
  meleeWeapon: 'rgba(251, 191, 36, 0.75)',
  bodyArmor: 'rgba(96, 165, 250, 0.75)',
  helmet: 'rgba(147, 197, 253, 0.75)',
  accessory1: 'rgba(236, 72, 153, 0.65)',
  accessory2: 'rgba(236, 72, 153, 0.65)',
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

const equipAccessoryButtonStyle: React.CSSProperties = {
  ...baseButtonStyle,
  borderColor: 'rgba(236, 72, 153, 0.55)',
  background: 'rgba(236, 72, 153, 0.18)',
};

const resolvePreferredSlot = (item: Item): EquipmentSlot | null => {
  if (item.equipSlot) {
    return item.equipSlot;
  }
  if ('damage' in item) {
    const weaponRange = (item as Record<string, unknown>).range;
    const skillType = (item as Record<string, unknown>).skillType;
    if (
      (typeof weaponRange === 'number' && weaponRange <= 1) ||
      skillType === 'meleeCombat'
    ) {
      return 'meleeWeapon';
    }
    return 'primaryWeapon';
  }
  if ('protection' in item) {
    return 'bodyArmor';
  }
  return null;
};

const isWeapon = (item?: Item): item is Weapon => Boolean(item && 'damage' in item);

const isArmor = (item?: Item): item is Armor => Boolean(item && 'protection' in item);

const PlayerLoadoutPanel: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const player = useSelector((state: RootState) => state.player.data);
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);
  const loadoutStrings = uiStrings.loadoutPanel;
  const inventoryStrings = uiStrings.inventoryPanel;
  const weightUnit = uiStrings.playerStatus.loadUnit;

  const formatWeightWithUnit = useCallback((value: number): string => {
    const rounded = Number.isFinite(value) ? Math.round(value * 10) / 10 : 0;
    return `${rounded.toFixed(1)} ${weightUnit}`;
  }, [weightUnit]);

  const describeDurability = useCallback((durability?: Durability) => {
    if (!durability || durability.max <= 0) {
      return null;
    }
    const ratio = Math.max(0, Math.min(1, durability.current / durability.max));
    const percentage = Math.round(ratio * 100);

    if (ratio >= 1) {
      return { copy: loadoutStrings.condition.pristine(percentage), style: statRowStyle, color: 'rgba(226, 232, 240, 0.86)' };
    }
    if (ratio <= 0) {
      return { copy: loadoutStrings.condition.broken, style: warningRowStyle, color: '#f87171' };
    }
    if (ratio <= 0.25) {
      return { copy: loadoutStrings.condition.critical(percentage), style: warningRowStyle, color: '#fbbf24' };
    }
    if (ratio <= 0.5) {
      return { copy: loadoutStrings.condition.worn(percentage), style: warningRowStyle, color: '#f59e0b' };
    }
    return { copy: loadoutStrings.condition.used(percentage), style: statRowStyle, color: 'rgba(250, 204, 21, 0.95)' };
  }, [loadoutStrings.condition]);

  const slotDefinitions = useMemo(() => {
    const slots = inventoryStrings.equipment.slots;
    return [
      {
        id: 'primaryWeapon' as const,
        badgeColor: SLOT_BADGE_COLORS.primaryWeapon,
        label: slots.primaryWeapon.label,
        emptyCopy: slots.primaryWeapon.empty,
      },
      {
        id: 'secondaryWeapon' as const,
        badgeColor: SLOT_BADGE_COLORS.secondaryWeapon,
        label: slots.secondaryWeapon.label,
        emptyCopy: slots.secondaryWeapon.empty,
      },
      {
        id: 'meleeWeapon' as const,
        badgeColor: SLOT_BADGE_COLORS.meleeWeapon,
        label: slots.meleeWeapon.label,
        emptyCopy: slots.meleeWeapon.empty,
      },
      {
        id: 'bodyArmor' as const,
        badgeColor: SLOT_BADGE_COLORS.bodyArmor,
        label: slots.bodyArmor.label,
        emptyCopy: slots.bodyArmor.empty,
      },
      {
        id: 'helmet' as const,
        badgeColor: SLOT_BADGE_COLORS.helmet,
        label: slots.helmet.label,
        emptyCopy: slots.helmet.empty,
      },
      {
        id: 'accessory1' as const,
        badgeColor: SLOT_BADGE_COLORS.accessory1,
        label: slots.accessory1.label,
        emptyCopy: slots.accessory1.empty,
      },
      {
        id: 'accessory2' as const,
        badgeColor: SLOT_BADGE_COLORS.accessory2,
        label: slots.accessory2.label,
        emptyCopy: slots.accessory2.empty,
      },
    ];
  }, [inventoryStrings.equipment.slots]);
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

  const slotInventory = useMemo(() => {
    const initial: Record<EquipmentSlot, Item[]> = {
      primaryWeapon: [],
      secondaryWeapon: [],
      meleeWeapon: [],
      bodyArmor: [],
      helmet: [],
      accessory1: [],
      accessory2: [],
    };

    player.inventory.items.forEach((item) => {
      const slot = resolvePreferredSlot(item);
      if (slot && initial[slot]) {
        initial[slot].push(item);
      }
    });

    return initial;
  }, [player.inventory.items]);

  const getEquippedItem = useCallback(
    (slot: EquipmentSlot): Item | undefined => {
      if (player.equippedSlots?.[slot]) {
        return player.equippedSlots[slot];
      }

      switch (slot) {
        case 'primaryWeapon':
          return player.equipped.weapon;
        case 'secondaryWeapon':
          return player.equipped.secondaryWeapon;
        case 'meleeWeapon':
          return player.equipped.meleeWeapon;
        case 'bodyArmor':
          return player.equipped.bodyArmor ?? player.equipped.armor;
        case 'helmet':
          return player.equipped.helmet;
        case 'accessory1':
          return player.equipped.accessory1;
        case 'accessory2':
          return player.equipped.accessory2;
        default:
          return undefined;
      }
    },
    [player.equipped, player.equippedSlots]
  );

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

  const renderPerks = () => (
    <div style={cardStyle}>
      <div style={badgeStyle('rgba(236, 72, 153, 0.65)')}>{loadoutStrings.perksLabel}</div>
      {knownPerks.length === 0 && unknownPerkIds.length === 0 ? (
        <span style={subtleText}>{loadoutStrings.noPerks}</span>
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

  const statLinesForItem = useCallback(
    (slot: EquipmentSlot, item?: Item): { label: string; value: string }[] => {
      if (!item) {
        return [];
      }

      const stats = loadoutStrings.stats;

      if (isWeapon(item)) {
        const lines: { label: string; value: string }[] = [
          { label: stats.damage, value: `${item.damage}` },
          { label: stats.range, value: `${item.range}` },
          { label: stats.apCost, value: `${item.apCost}` },
        ];

        if (item.skillType) {
          lines.push({
            label: stats.skill,
            value: getSkillDefinition(item.skillType)?.name ?? '—',
          });
        }

        return lines;
      }

      if (isArmor(item)) {
        const protection = typeof item.protection === 'number' ? `${item.protection}` : '—';
        return [
          { label: stats.protection, value: protection },
          { label: stats.weight, value: formatWeightWithUnit(item.weight) },
        ];
      }

      const genericLines = [
        { label: stats.weight, value: formatWeightWithUnit(item.weight) },
        { label: stats.value, value: `₿${item.value}` },
      ];

      if (slot === 'accessory1' || slot === 'accessory2') {
        return genericLines;
      }

      return genericLines;
    },
    [formatWeightWithUnit, loadoutStrings.stats]
  );

  const renderSlotCard = (slotDefinition: (typeof slotDefinitions)[number]) => {
    const { id, label, badgeColor, emptyCopy } = slotDefinition;
    const equippedItem = getEquippedItem(id);
    const durability = describeDurability(equippedItem?.durability);
    const statLines = statLinesForItem(id, equippedItem);
    const reserveItems = slotInventory[id];
    const equipButtonStyle =
      id === 'bodyArmor' || id === 'helmet'
        ? equipArmorButtonStyle
        : id === 'accessory1' || id === 'accessory2'
        ? equipAccessoryButtonStyle
        : equipWeaponButtonStyle;

    return (
      <div key={id} style={cardStyle}>
        <div style={badgeStyle(badgeColor)}>{label}</div>
        <div style={cardTitleStyle}>{equippedItem?.name ?? emptyCopy}</div>

        {equippedItem ? (
          <>
            {statLines.map((line) => (
              <div key={`${id}-${line.label}`} style={statRowStyle}>
                <span style={statLabelStyle}>{line.label}</span>
                <span style={statValueEmphasis}>{line.value}</span>
              </div>
            ))}

            {durability && (
              <div style={durability.style}>
                <span style={statLabelStyle}>{loadoutStrings.stats.durability}</span>
                <span style={{ ...statValueEmphasis, color: durability.color }}>{durability.copy}</span>
              </div>
            )}

            {equippedItem.description && (
              <span style={subtleText}>{equippedItem.description}</span>
            )}

            <div style={cardActionsStyle}>
              <button
                type="button"
                style={unequipButtonStyle}
                onClick={() => handleUnequip(id)}
              >
                {loadoutStrings.actions.unequip}
              </button>
              {reserveItems
                .filter((item) => item.id !== equippedItem.id)
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    style={equipButtonStyle}
                    onClick={() => handleEquipItem(item.id, id)}
                  >
                    {loadoutStrings.actions.equip(item.name)}
                  </button>
                ))}
            </div>
          </>
        ) : (
          <>
            <span style={subtleText}>{emptyCopy}</span>
            {reserveItems.length > 0 ? (
              <div style={cardActionsStyle}>
                {reserveItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    style={equipButtonStyle}
                    onClick={() => handleEquipItem(item.id, id)}
                  >
                    {loadoutStrings.actions.equip(item.name)}
                  </button>
                ))}
              </div>
            ) : (
              <span style={{ ...subtleText, fontSize: '0.58rem' }}>{loadoutStrings.noCompatible}</span>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div
      style={panelStyle}
      data-testid="player-loadout-panel"
      role="region"
      aria-label={loadoutStrings.ariaLabel}
    >
      <header style={headerStyle}>
        <span style={headingLabelStyle}>{loadoutStrings.headingLabel}</span>
        <h3 style={headingTitleStyle}>{loadoutStrings.headingTitle}</h3>
      </header>
      <div style={cardsWrapperStyle}>
        <div style={equipmentGridStyle}>
          {slotDefinitions.map(renderSlotCard)}
        </div>
        {renderPerks()}
      </div>
    </div>
  );
};

export default React.memo(PlayerLoadoutPanel);
