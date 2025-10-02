import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { BACKGROUND_MAP } from '../../content/backgrounds';
import { getUIStrings } from '../../content/ui';

const PlayerStatusPanel: React.FC = () => {
  const player = useSelector((state: RootState) => state.player.data);
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);

  const { inventory } = player;
  const itemCount = inventory.items.length;

  const background = player.backgroundId ? BACKGROUND_MAP[player.backgroundId] : undefined;
  const backgroundLabel = background ? background.name : 'Unaffiliated';

  const infoItems = [
    {
      label: 'Inventory Load',
      value: `${inventory.currentWeight}/${inventory.maxWeight} kg`,
      color: '#cbd5e1',
    },
    {
      label: 'Items',
      value: itemCount,
      color: '#cbd5e1',
    },
    {
      label: 'Perks',
      value: player.perks.length,
      color: '#a855f7',
    },
  ];

  return (
    <div
      style={{
        background: "linear-gradient(182deg, rgba(30, 41, 59, 0.82), rgba(15, 23, 42, 0.92))",
        borderRadius: "12px",
        border: "1px solid rgba(148, 163, 184, 0.2)",
        padding: "0.5rem 0.6rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
        fontFamily: "'DM Sans', 'Inter', sans-serif",
        color: "#e2e8f0",
        fontSize: "0.65rem",
      }}
    >
      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.35rem 0.5rem' }}>
        {infoItems.map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.1rem',
              background: 'rgba(15, 23, 42, 0.45)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              borderRadius: '8px',
              padding: '0.45rem 0.55rem',
            }}
          >
            <span style={{ color: 'rgba(148, 163, 184, 0.75)', fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.label}</span>
            <span style={{ fontWeight: 600, color: item.color }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Background & Reputation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '0.35rem',
          borderTop: '1px solid rgba(148, 163, 184, 0.15)',
          fontSize: '0.65rem',
          color: 'rgba(148, 163, 184, 0.8)',
        }}
      >
        <span>Background: {backgroundLabel}</span>
        <span title={uiStrings.playerStatus.factionReputationLabel}>
          {uiStrings.playerStatus.factions.resistance.charAt(0)} {player.factionReputation.resistance} / {uiStrings.playerStatus.factions.corpsec.charAt(0)} {player.factionReputation.corpsec} / {uiStrings.playerStatus.factions.scavengers.charAt(0)} {player.factionReputation.scavengers}
        </span>
      </div>
    </div>
  );
};

export default React.memo(PlayerStatusPanel);
