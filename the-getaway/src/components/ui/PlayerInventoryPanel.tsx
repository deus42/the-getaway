import React, { useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import {
  EquipmentSlot,
  Item,
  EncumbranceState,
} from '../../game/interfaces/types';
import {
  assignHotbarSlot,
  equipItem,
  repairItem,
  unequipItem,
  useInventoryItem as consumeInventoryItemAction,
} from '../../store/playerSlice';
import { getUIStrings } from '../../content/ui';
import NotificationBadge from './NotificationBadge';
import {
  characterPanelSurface,
  characterPanelHeaderStyle,
  characterPanelLabelStyle,
  characterPanelTitleStyle,
  subtleText,
  neonPalette,
} from './theme';

const panelStyle: React.CSSProperties = {
  ...characterPanelSurface,
  display: 'grid',
  gridTemplateRows: 'auto auto minmax(0, 1fr)',
  gap: '0.75rem',
  minHeight: 0,
  height: '100%',
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  color: neonPalette.textSecondary,
  gap: '0.6rem',
};

const headingGroupStyle: React.CSSProperties = {
  ...characterPanelHeaderStyle,
};

const headingLabelStyle: React.CSSProperties = {
  ...characterPanelLabelStyle,
};

const headingTitleStyle: React.CSSProperties = {
  ...characterPanelTitleStyle,
};

const weightBlockStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '0.14rem',
  fontSize: '0.62rem',
  color: neonPalette.textMuted,
};

const weightDetailsStyle: React.CSSProperties = {
  fontSize: '0.55rem',
  color: 'rgba(148, 163, 184, 0.72)',
};

const encumbranceRowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.18rem',
};

const filterBarContainerStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.45rem',
  padding: '0.3rem 0',
  background: 'rgba(15, 23, 42, 0.92)',
  borderBottom: '1px solid rgba(56, 189, 248, 0.14)',
};

const filterBarStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.4rem',
};

const filterButtonBase: React.CSSProperties = {
  borderRadius: '999px',
  border: '1px solid rgba(148, 163, 184, 0.25)',
  padding: '0.22rem 0.65rem',
  fontSize: '0.58rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  background: 'rgba(15, 23, 42, 0.55)',
  color: 'rgba(226, 232, 240, 0.85)',
  cursor: 'pointer',
  transition: 'border-color 0.2s ease, background 0.2s ease, color 0.2s ease',
};

const itemGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: '0.45rem',
};

const itemCardStyle: React.CSSProperties = {
  borderRadius: '12px',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(15, 23, 42, 0.7)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.34rem',
  padding: '0.52rem 0.55rem',
  color: '#e2e8f0',
};

const itemHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.3rem',
};

const itemTitleStyle: React.CSSProperties = {
  fontSize: '0.74rem',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  flexWrap: 'wrap',
};

const badgeStyle = (accent: string): React.CSSProperties => ({
  borderRadius: '6px',
  padding: '0.15rem 0.35rem',
  fontSize: '0.54rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: accent,
  border: `1px solid ${accent}`,
  background: 'rgba(15, 23, 42, 0.65)',
});

const itemMetaStyle: React.CSSProperties = {
  ...subtleText,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.22rem',
  fontSize: '0.6rem',
};

const durabilityTrackStyle: React.CSSProperties = {
  height: '6px',
  borderRadius: '999px',
  background: 'rgba(148, 163, 184, 0.2)',
  overflow: 'hidden',
};

const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.3rem',
  marginTop: '0.15rem',
};

const actionButtonStyle: React.CSSProperties = {
  borderRadius: '6px',
  border: '1px solid rgba(148, 163, 184, 0.25)',
  padding: '0.25rem 0.45rem',
  fontSize: '0.58rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  background: 'rgba(30, 41, 59, 0.7)',
  color: neonPalette.textSecondary,
  cursor: 'pointer',
};

const hotbarPillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.18rem 0.4rem',
  borderRadius: '999px',
  fontSize: '0.55rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  border: '1px solid rgba(56, 189, 248, 0.5)',
  color: '#e0f2fe',
  background: 'rgba(37, 99, 235, 0.2)',
};

const equipmentGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: '0.45rem',
};

const equipmentCardStyle: React.CSSProperties = {
  borderRadius: '12px',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(9, 16, 32, 0.6)',
  padding: '0.55rem 0.6rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
};

const equipmentLabelStyle: React.CSSProperties = {
  fontSize: '0.58rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: neonPalette.textMuted,
};

const equipmentValueStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600,
  color: neonPalette.textPrimary,
};

const hotbarSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
};

const hotbarGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: '0.4rem',
};

const hotbarSlotStyle: React.CSSProperties = {
  borderRadius: '10px',
  border: '1px dashed rgba(148, 163, 184, 0.28)',
  padding: '0.4rem 0.5rem',
  background: 'rgba(15, 23, 42, 0.5)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  fontSize: '0.6rem',
  color: neonPalette.textSecondary,
};

const emptyStateStyle: React.CSSProperties = {
  ...subtleText,
  padding: '0.6rem 0',
};

const scrollContainerStyle: React.CSSProperties = {
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.7rem',
  overflowY: 'auto',
  paddingRight: '0.4rem',
  paddingBottom: '0.6rem',
  position: 'relative',
};

const listMetaStyle: React.CSSProperties = {
  fontSize: '0.58rem',
  color: neonPalette.textMuted,
};

const FILTER_OPTIONS: FilterId[] = ['all', 'weapons', 'armor', 'consumables', 'quest', 'misc'];

const SLOT_BADGE_COLORS: Record<EquipmentSlot, string> = {
  primaryWeapon: 'rgba(56, 189, 248, 0.75)',
  secondaryWeapon: 'rgba(59, 130, 246, 0.65)',
  meleeWeapon: 'rgba(251, 191, 36, 0.75)',
  bodyArmor: 'rgba(96, 165, 250, 0.75)',
  helmet: 'rgba(147, 197, 253, 0.75)',
  accessory1: 'rgba(236, 72, 153, 0.65)',
  accessory2: 'rgba(236, 72, 153, 0.65)',
};

const encumbranceColorMap: Record<EncumbranceState['level'] | 'unknown', string> = {
  normal: '#34d399',
  heavy: '#fbbf24',
  overloaded: '#fb7185',
  immobile: '#f87171',
  unknown: neonPalette.textSecondary,
};

type FilterId = 'all' | 'weapons' | 'armor' | 'consumables' | 'quest' | 'misc';
interface InventoryEntry {
  item: Item;
  category: FilterId;
  condition: number | null;
}

const REPAIR_COST_PER_POINT = 2;

const isWeapon = (item: Item): boolean => {
  return (item as unknown as Record<string, unknown>).damage !== undefined;
};

const isArmor = (item: Item): boolean => {
  return (item as unknown as Record<string, unknown>).protection !== undefined;
};

const isConsumable = (item: Item): boolean => {
  return (item as unknown as Record<string, unknown>).effect !== undefined;
};

const categorizeItem = (item: Item): FilterId => {
  if (item.isQuestItem) {
    return 'quest';
  }
  if (isWeapon(item)) {
    return 'weapons';
  }
  if (isArmor(item)) {
    return 'armor';
  }
  if (isConsumable(item)) {
    return 'consumables';
  }
  return 'misc';
};

const resolvePreferredSlot = (item: Item): EquipmentSlot | null => {
  if (item.equipSlot) {
    return item.equipSlot;
  }
  if (isWeapon(item)) {
    const weaponRange = (item as unknown as Record<string, unknown>).range;
    const skillType = (item as unknown as Record<string, unknown>).skillType;
    if (
      (typeof weaponRange === 'number' && weaponRange <= 1) ||
      skillType === 'meleeCombat'
    ) {
      return 'meleeWeapon';
    }
    return 'primaryWeapon';
  }
  if (isArmor(item)) {
    return 'bodyArmor';
  }
  return null;
};

const getConditionPercentage = (item: Item): number | null => {
  if (!item.durability || item.durability.max <= 0) {
    return null;
  }
  const ratio = item.durability.current / item.durability.max;
  if (!Number.isFinite(ratio)) {
    return null;
  }
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
};

const getDurabilityFillStyle = (percentage: number): React.CSSProperties => {
  let color = '#34d399';
  if (percentage < 25) {
    color = '#f87171';
  } else if (percentage < 50) {
    color = '#fbbf24';
  } else if (percentage < 75) {
    color = '#38bdf8';
  }
  return {
    width: `${percentage}%`,
    height: '100%',
    background: color,
    transition: 'width 0.25s ease',
  };
};

const getStackCount = (item: Item): number => {
  if (!item.stackable) {
    return 1;
  }
  const quantity = item.quantity ?? 1;
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return 1;
  }
  return Math.floor(quantity);
};


const PlayerInventoryPanel: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const player = useSelector((state: RootState) => state.player.data);
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);
  const inventoryStrings = uiStrings.inventoryPanel;
  const weightUnit = uiStrings.playerStatus.loadUnit;

  const formatWeightWithUnit = useCallback((value: number): string => {
    const rounded = Number.isFinite(value) ? Math.round(value * 10) / 10 : 0;
    return `${rounded.toFixed(1)} ${weightUnit}`;
  }, [weightUnit]);

  const [activeFilter, setActiveFilter] = useState<FilterId>('all');

  const inventoryEntries = useMemo<InventoryEntry[]>(() => {
    return player.inventory.items.map((item) => ({
      item,
      category: categorizeItem(item),
      condition: getConditionPercentage(item),
    }));
  }, [player.inventory.items]);

  const filterCounts = useMemo<Record<FilterId, number>>(() => {
    const counts = FILTER_OPTIONS.reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {} as Record<FilterId, number>);

    inventoryEntries.forEach((entry) => {
      counts.all += 1;
      counts[entry.category] += 1;
    });

    return counts;
  }, [inventoryEntries]);

  const filteredItems = useMemo<InventoryEntry[]>(() => {
    return inventoryEntries.filter((entry) => activeFilter === 'all' || entry.category === activeFilter);
  }, [inventoryEntries, activeFilter]);

  const sortedItems = useMemo<InventoryEntry[]>(() => {
    return [...filteredItems].sort((a, b) =>
      a.item.name.localeCompare(b.item.name, undefined, { sensitivity: 'base' })
    );
  }, [filteredItems]);

  const encumbranceDescriptor = useMemo(() => {
    const level = player.encumbrance.level ?? 'unknown';
    const descriptorKey = (['normal', 'heavy', 'overloaded', 'immobile'].includes(level)
      ? level
      : 'unknown') as EncumbranceState['level'] | 'unknown';

    const label =
      inventoryStrings.encumbranceDescriptors[descriptorKey] ??
      inventoryStrings.encumbranceDescriptors.unknown;

    let summary: string;
    if (descriptorKey === 'heavy') {
      summary = inventoryStrings.encumbranceSummary.heavy(
        player.encumbrance.movementApMultiplier,
        player.encumbrance.attackApMultiplier
      );
    } else if (descriptorKey === 'overloaded') {
      summary = inventoryStrings.encumbranceSummary.overloaded(
        player.encumbrance.movementApMultiplier,
        player.encumbrance.attackApMultiplier
      );
    } else if (descriptorKey === 'immobile') {
      summary = inventoryStrings.encumbranceSummary.immobile;
    } else if (descriptorKey === 'normal') {
      summary = inventoryStrings.encumbranceSummary.normal;
    } else {
      summary = inventoryStrings.encumbranceSummary.unknown;
    }

    const warning = inventoryStrings.encumbranceWarning[descriptorKey];
    const color = encumbranceColorMap[descriptorKey] ?? encumbranceColorMap.unknown;

    return {
      label,
      summary,
      warning,
      color,
    };
  }, [inventoryStrings, player.encumbrance]);

  const slotDefinitions = useMemo(() => {
    const slots = inventoryStrings.equipment.slots;
    return [
      {
        id: 'primaryWeapon' as const,
        badgeColor: SLOT_BADGE_COLORS.primaryWeapon,
        label: slots.primaryWeapon.label,
        description: slots.primaryWeapon.description,
        emptyCopy: slots.primaryWeapon.empty,
      },
      {
        id: 'secondaryWeapon' as const,
        badgeColor: SLOT_BADGE_COLORS.secondaryWeapon,
        label: slots.secondaryWeapon.label,
        description: slots.secondaryWeapon.description,
        emptyCopy: slots.secondaryWeapon.empty,
      },
      {
        id: 'meleeWeapon' as const,
        badgeColor: SLOT_BADGE_COLORS.meleeWeapon,
        label: slots.meleeWeapon.label,
        description: slots.meleeWeapon.description,
        emptyCopy: slots.meleeWeapon.empty,
      },
      {
        id: 'bodyArmor' as const,
        badgeColor: SLOT_BADGE_COLORS.bodyArmor,
        label: slots.bodyArmor.label,
        description: slots.bodyArmor.description,
        emptyCopy: slots.bodyArmor.empty,
      },
      {
        id: 'helmet' as const,
        badgeColor: SLOT_BADGE_COLORS.helmet,
        label: slots.helmet.label,
        description: slots.helmet.description,
        emptyCopy: slots.helmet.empty,
      },
      {
        id: 'accessory1' as const,
        badgeColor: SLOT_BADGE_COLORS.accessory1,
        label: slots.accessory1.label,
        description: slots.accessory1.description,
        emptyCopy: slots.accessory1.empty,
      },
      {
        id: 'accessory2' as const,
        badgeColor: SLOT_BADGE_COLORS.accessory2,
        label: slots.accessory2.label,
        description: slots.accessory2.description,
        emptyCopy: slots.accessory2.empty,
      },
    ];
  }, [inventoryStrings.equipment.slots]);

  const hotbarAssignments = useMemo<(string | null)[]>(() => {
    const slots = player.inventory.hotbar ?? [];
    if (slots.length === 0) {
      return [null, null, null, null, null];
    }
    return slots;
  }, [player.inventory.hotbar]);
  const assignedHotbarCount = hotbarAssignments.filter(Boolean).length;

  const hotbarIsFull = useMemo(() => hotbarAssignments.every((entry) => entry !== null), [
    hotbarAssignments,
  ]);

  const handleEquip = useCallback(
    (item: Item) => {
      const slot = resolvePreferredSlot(item);
      if (!slot) {
        return;
      }
      dispatch(equipItem({ itemId: item.id, slot }));
    },
    [dispatch]
  );

  const handleRepair = useCallback(
    (item: Item) => {
      if (!item.durability) {
        return;
      }
      const missing = Math.max(0, item.durability.max - item.durability.current);
      if (missing <= 0) {
        return;
      }
      dispatch(repairItem({ itemId: item.id, amount: missing }));
    },
    [dispatch]
  );

  const handleUse = useCallback(
    (item: Item) => {
      dispatch(consumeInventoryItemAction(item.id));
    },
    [dispatch]
  );

  const handleHotbarToggle = useCallback(
    (item: Item) => {
      const currentIndex = hotbarAssignments.findIndex((entry) => entry === item.id);
      if (currentIndex !== -1) {
        dispatch(assignHotbarSlot({ slotIndex: currentIndex, itemId: null }));
        return;
      }

      const emptyIndex = hotbarAssignments.findIndex((entry) => entry === null);
      if (emptyIndex === -1) {
        return;
      }

      dispatch(assignHotbarSlot({ slotIndex: emptyIndex, itemId: item.id }));
    },
    [dispatch, hotbarAssignments]
  );

  const getEquippedItem = useCallback(
    (slot: EquipmentSlot): Item | undefined => {
      if (player.equippedSlots && player.equippedSlots[slot]) {
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

  const handleUnequip = useCallback(
    (slot: EquipmentSlot) => {
      setActiveFilter('all');
      dispatch(unequipItem({ slot }));
    },
    [dispatch]
  );

  const equippedItems = useMemo(
    () => slotDefinitions.map((slot) => getEquippedItem(slot.id)).filter(Boolean) as Item[],
    [getEquippedItem, slotDefinitions]
  );

  const equippedWeight = useMemo(
    () => equippedItems.reduce((sum, item) => sum + (Number.isFinite(item.weight) ? (item.weight as number) : 0), 0),
    [equippedItems]
  );

  const totalWeight = useMemo(
    () => player.inventory.currentWeight + equippedWeight,
    [player.inventory.currentWeight, equippedWeight]
  );

  return (
    <div
      style={panelStyle}
      data-testid="player-inventory-panel"
      role="region"
      aria-label={inventoryStrings.title}
    >
      <header style={headerRowStyle}>
        <div style={headingGroupStyle}>
          <span style={headingLabelStyle}>{uiStrings.loadoutPanel.headingLabel}</span>
          <h3 style={headingTitleStyle}>{inventoryStrings.title}</h3>
        </div>
        <div style={weightBlockStyle}>
          <span>{inventoryStrings.weightTitle}</span>
          <strong style={{ fontSize: '0.74rem', color: neonPalette.textPrimary }}>
            {`${formatWeightWithUnit(totalWeight)} / ${formatWeightWithUnit(player.inventory.maxWeight)}`}
          </strong>
          <span style={weightDetailsStyle}>
            {inventoryStrings.summary(
              formatWeightWithUnit(player.inventory.currentWeight),
              formatWeightWithUnit(equippedWeight)
            )}
          </span>
        </div>
      </header>

      <div style={encumbranceRowStyle}>
        <span style={{ fontSize: '0.64rem', color: encumbranceDescriptor.color }}>
          {encumbranceDescriptor.label} ({player.encumbrance.percentage.toFixed(1)}%)
        </span>
        <span style={{ ...subtleText, fontSize: '0.6rem' }}>
          {encumbranceDescriptor.summary}
        </span>
        {encumbranceDescriptor.warning && (
          <span style={{ fontSize: '0.58rem', color: '#fbbf24' }}>{encumbranceDescriptor.warning}</span>
        )}
      </div>

      <div style={scrollContainerStyle}>
        <div style={filterBarContainerStyle}>
          <div style={filterBarStyle} role="group" aria-label={inventoryStrings.filtersAriaLabel}>
            {FILTER_OPTIONS.map((filterId) => {
              const isActive = activeFilter === filterId;
              return (
                <button
                  key={filterId}
                  type="button"
                  style={{
                    ...filterButtonBase,
                    border: isActive ? '1px solid rgba(56, 189, 248, 0.65)' : filterButtonBase.border,
                    background: isActive ? 'rgba(37, 99, 235, 0.2)' : filterButtonBase.background,
                    color: isActive ? '#e0f2fe' : filterButtonBase.color,
                  }}
                  aria-pressed={isActive}
                  onClick={() => setActiveFilter(filterId)}
                >
                  {inventoryStrings.filters[filterId]}
                  <span style={{ marginLeft: '0.35rem', color: 'rgba(148, 163, 184, 0.75)' }}>
                    {filterCounts[filterId] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          <span style={listMetaStyle}>
            {inventoryStrings.showingCount(sortedItems.length, inventoryEntries.length)}
          </span>
        </div>

        {sortedItems.length === 0 ? (
          <span style={emptyStateStyle}>{inventoryStrings.emptyState}</span>
        ) : (
          <div style={itemGridStyle} role="list" aria-label={inventoryStrings.itemsAriaLabel}>
            {sortedItems.map(({ item, condition }) => {
              const quantity = getStackCount(item);
              const canEquip = Boolean(resolvePreferredSlot(item));
              const canUse = isConsumable(item);
              const needsRepair = item.durability && item.durability.current < item.durability.max;
              const missingDurability = needsRepair && item.durability
                ? item.durability.max - item.durability.current
                : 0;
              const estimatedRepairCost = missingDurability * REPAIR_COST_PER_POINT;
              const hotbarIndex = hotbarAssignments.findIndex((entry) => entry === item.id);
              const isHotbarAssigned = hotbarIndex !== -1;
              const hotbarButtonDisabled = !isHotbarAssigned && hotbarIsFull;
              const hotbarButtonLabel = isHotbarAssigned
                ? inventoryStrings.actions.removeFromHotbar
                : hotbarButtonDisabled
                ? inventoryStrings.actions.hotbarFull
                : inventoryStrings.actions.addToHotbar;
              const hotbarBadgeLabel = inventoryStrings.hotbarBadge(hotbarIndex + 1);
              const weightDisplay = formatWeightWithUnit(item.weight);

              return (
                <div key={item.id} style={itemCardStyle} role="listitem" aria-label={item.name}>
                  <div style={itemHeaderStyle}>
                    <div style={itemTitleStyle}>
                      <span>{item.name}</span>
                      {quantity > 1 && (
                        <span style={{ fontSize: '0.62rem', color: neonPalette.textMuted }}>×{quantity}</span>
                      )}
                      {isHotbarAssigned && <span style={hotbarPillStyle}>{hotbarBadgeLabel}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                      {item.isQuestItem && (
                        <span style={badgeStyle('#fbbf24')}>{inventoryStrings.badges.quest}</span>
                      )}
                      {isWeapon(item) && (
                        <span style={badgeStyle('#38bdf8')}>{inventoryStrings.badges.weapon}</span>
                      )}
                      {isArmor(item) && (
                        <span style={badgeStyle('#a855f7')}>{inventoryStrings.badges.armor}</span>
                      )}
                      {canUse && (
                        <span style={badgeStyle('#34d399')}>{inventoryStrings.badges.consumable}</span>
                      )}
                    </div>
                  </div>

                  <div style={itemMetaStyle}>
                    <span>{item.description}</span>
                    <span aria-label={inventoryStrings.itemWeightAria(weightDisplay, item.value)}>
                      {inventoryStrings.weightValue(weightDisplay, item.value)}
                    </span>
                  </div>

                  {item.durability && (
                    <div>
                      <div style={{ ...subtleText, fontSize: '0.58rem', marginBottom: '0.22rem' }}>
                        {inventoryStrings.durabilityLabel(item.durability.current, item.durability.max)}
                      </div>
                      <div style={durabilityTrackStyle} aria-hidden="true">
                        <div style={getDurabilityFillStyle(condition ?? 0)} />
                      </div>
                    </div>
                  )}

                  <div style={actionRowStyle}>
                    {canEquip && (
                      <button type="button" style={actionButtonStyle} onClick={() => handleEquip(item)}>
                        {inventoryStrings.actions.equip}
                      </button>
                    )}

                    {needsRepair && (
                      <button
                        type="button"
                        style={{ ...actionButtonStyle, borderColor: '#fbbf24', color: '#fde68a' }}
                        onClick={() => handleRepair(item)}
                        aria-label={inventoryStrings.actions.repairAria(item.name, estimatedRepairCost)}
                      >
                        {inventoryStrings.actions.repair(estimatedRepairCost)}
                      </button>
                    )}

                    {canUse && (
                      <button
                        type="button"
                        style={{ ...actionButtonStyle, borderColor: '#34d399', color: '#bbf7d0' }}
                        onClick={() => handleUse(item)}
                      >
                        {inventoryStrings.actions.use}
                      </button>
                    )}
                    <button
                      type="button"
                      style={{
                        ...actionButtonStyle,
                        borderColor: isHotbarAssigned ? 'rgba(248, 113, 113, 0.55)' : '#34d399',
                        color: isHotbarAssigned ? '#fecaca' : '#bbf7d0',
                        opacity: hotbarButtonDisabled ? 0.6 : 1,
                        cursor: hotbarButtonDisabled ? 'not-allowed' : 'pointer',
                      }}
                      onClick={() => handleHotbarToggle(item)}
                      disabled={hotbarButtonDisabled}
                    >
                      {hotbarButtonLabel}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <section style={hotbarSectionStyle} aria-label={inventoryStrings.equippedAriaLabel}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={equipmentLabelStyle}>{inventoryStrings.equipment.title}</span>
          </div>
          <div style={equipmentGridStyle}>
            {slotDefinitions.map((slot) => {
              const equippedItem = getEquippedItem(slot.id);
              const condition = equippedItem ? getConditionPercentage(equippedItem) : null;
              const hasDurability = equippedItem?.durability && condition !== null;

              return (
                <div key={slot.id} style={equipmentCardStyle}>
                  <span style={equipmentLabelStyle}>{slot.label}</span>
                  <div style={equipmentValueStyle}>{equippedItem?.name ?? slot.emptyCopy}</div>
                  <span style={{ ...subtleText, fontSize: '0.58rem' }}>{slot.description}</span>
                  {hasDurability && (
                    <div>
                      <div style={{ ...subtleText, fontSize: '0.56rem', marginBottom: '0.2rem' }}>
                        {inventoryStrings.conditionLabel(condition ?? 0)}
                      </div>
                      <div style={durabilityTrackStyle} aria-hidden="true">
                        <div style={getDurabilityFillStyle(condition ?? 0)} />
                      </div>
                    </div>
                  )}
                  {equippedItem && (
                    <button
                      type="button"
                      style={{ ...actionButtonStyle, alignSelf: 'flex-start' }}
                      onClick={() => handleUnequip(slot.id)}
                    >
                      {inventoryStrings.actions.unequip}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section style={hotbarSectionStyle} aria-label={inventoryStrings.hotbarAriaLabel}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={equipmentLabelStyle}>{inventoryStrings.hotbar.title}</span>
            <NotificationBadge count={assignedHotbarCount} color="#34d399" size={18} pulse={false} />
          </div>
          <div style={hotbarGridStyle}>
            {hotbarAssignments.map((itemId, index) => {
              const assignedItem = player.inventory.items.find((entry) => entry.id === itemId);
              return (
                <div key={index} style={hotbarSlotStyle}>
                  <span style={{ fontSize: '0.58rem', color: neonPalette.textMuted }}>
                    {inventoryStrings.hotbar.slotLabel(index + 1)}
                  </span>
                  <span style={{ fontSize: '0.64rem', color: neonPalette.textPrimary }}>
                    {assignedItem?.name ?? inventoryStrings.hotbar.unassigned}
                  </span>
                  <button
                    type="button"
                    style={{ ...actionButtonStyle, alignSelf: 'flex-start', padding: '0.18rem 0.4rem' }}
                    onClick={() => dispatch(assignHotbarSlot({ slotIndex: index, itemId: null }))}
                    disabled={!itemId}
                  >
                    {inventoryStrings.actions.clearHotbar}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default React.memo(PlayerInventoryPanel);
