import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

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

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '0.75rem',
  color: 'rgba(226, 232, 240, 0.85)',
};

const titleStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: '#34d399',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '0.75rem',
};

const itemCardStyle: React.CSSProperties = {
  borderRadius: '10px',
  border: '1px solid rgba(148, 163, 184, 0.22)',
  background: 'rgba(15, 23, 42, 0.6)',
  padding: '0.65rem 0.75rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
  color: '#e2e8f0',
  fontSize: '0.7rem',
};

const itemNameStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 600,
};

const mutedStyle: React.CSSProperties = {
  color: 'rgba(148, 163, 184, 0.75)',
};

const footerStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  color: 'rgba(148, 163, 184, 0.75)',
};

const PlayerInventoryPanel: React.FC = () => {
  const player = useSelector((state: RootState) => state.player.data);
  const items = player.inventory.items;
  const displayItems = items.slice(0, 6);
  const remaining = items.length - displayItems.length;

  const renderItem = (itemId: string, name: string, weight: number, value: number, description: string) => (
    <div key={itemId} style={itemCardStyle}>
      <div style={itemNameStyle}>{name}</div>
      <div style={mutedStyle}>{description}</div>
      <div style={footerStyle}>
        {weight.toFixed(1)} kg • {value} cr
      </div>
    </div>
  );

  return (
    <div style={panelStyle} data-testid="player-inventory-panel">
      <div style={headerStyle}>
        <span style={titleStyle}>Inventory</span>
        <span>{`${player.inventory.currentWeight.toFixed(1)} / ${player.inventory.maxWeight} kg`}</span>
      </div>
      {displayItems.length === 0 ? (
        <span style={mutedStyle}>Pack is empty — time to scavenge.</span>
      ) : (
        <div style={gridStyle}>
          {displayItems.map((item) =>
            renderItem(item.id, item.name, item.weight, item.value, item.description)
          )}
        </div>
      )}
      {remaining > 0 && (
        <span style={footerStyle}>{`+${remaining} more stashed`}</span>
      )}
    </div>
  );
};

export default PlayerInventoryPanel;
