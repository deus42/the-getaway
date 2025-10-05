import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import NotificationBadge from './NotificationBadge';
import {
  characterPanelSurface,
  characterPanelHeaderStyle,
  characterPanelLabelStyle,
  characterPanelTitleStyle,
} from './theme';

const panelStyle: React.CSSProperties = {
  ...characterPanelSurface,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.6rem',
  color: 'rgba(226, 232, 240, 0.85)',
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

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '0.5rem',
};

const itemCardStyle: React.CSSProperties = {
  borderRadius: '10px',
  border: '1px solid rgba(148, 163, 184, 0.22)',
  background: 'rgba(15, 23, 42, 0.6)',
  padding: '0.45rem 0.55rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.2rem',
  color: '#e2e8f0',
  fontSize: '0.6rem',
};

const itemNameStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  fontWeight: 600,
};

const mutedStyle: React.CSSProperties = {
  color: 'rgba(148, 163, 184, 0.75)',
};

const footerStyle: React.CSSProperties = {
  fontSize: '0.58rem',
  color: 'rgba(148, 163, 184, 0.75)',
};

const PlayerInventoryPanel: React.FC = () => {
  const player = useSelector((state: RootState) => state.player.data);
  const items = player.inventory.items;
  const displayItems = items.slice(0, 6);
  const remaining = items.length - displayItems.length;

  const renderItem = (itemId: string, name: string, weight: number, value: number, description: string) => (
    <div key={itemId} style={itemCardStyle} role="listitem" aria-label={`${name}: ${description}`}>
      <div style={itemNameStyle}>{name}</div>
      <div style={mutedStyle}>{description}</div>
      <div style={footerStyle} aria-label={`Weight: ${weight.toFixed(1)} kilograms, Value: ₿${value} credits`}>
        {weight.toFixed(1)} kg • ₿{value}
      </div>
    </div>
  );

  return (
    <div style={panelStyle} data-testid="player-inventory-panel" role="region" aria-label="Player Inventory">
      <header style={headerRowStyle}>
        <div style={headingGroupStyle}>
          <span style={headingLabelStyle}>Operative</span>
          <h3 style={headingTitleStyle}>Inventory</h3>
        </div>
        <span aria-label={`Inventory weight: ${player.inventory.currentWeight.toFixed(1)} of ${player.inventory.maxWeight} kilograms`}>
          {`${player.inventory.currentWeight.toFixed(1)} / ${player.inventory.maxWeight} kg`}
        </span>
      </header>
      {displayItems.length === 0 ? (
        <span style={mutedStyle}>Pack is empty — time to scavenge.</span>
      ) : (
        <div style={gridStyle} role="list" aria-label="Inventory items">
          {displayItems.map((item) =>
            renderItem(item.id, item.name, item.weight, item.value, item.description)
          )}
        </div>
      )}
      {remaining > 0 && (
        <div style={{ ...footerStyle, display: 'flex', alignItems: 'center', gap: '0.4rem' }} aria-live="polite">
          <NotificationBadge count={remaining} color="#34d399" size={18} pulse={false} />
          <span>more stashed</span>
        </div>
      )}
    </div>
  );
};

export default React.memo(PlayerInventoryPanel);
