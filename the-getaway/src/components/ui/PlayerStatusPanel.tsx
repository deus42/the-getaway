import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  calculateXPForLevel,
  calculateXPProgress,
  formatXPDisplay,
} from '../../game/systems/progression';
import { BACKGROUND_MAP } from '../../content/backgrounds';

const PlayerStatusPanel: React.FC = () => {
  const player = useSelector((state: RootState) => state.player.data);
  const healthRatio = player.maxHealth > 0 ? player.health / player.maxHealth : 0;
  const healthPercent = Math.max(0, Math.min(1, healthRatio)) * 100;

  const xpTarget = calculateXPForLevel(player.level + 1);
  const xpProgress = calculateXPProgress(player.experience, player.level);
  const xpDisplay = formatXPDisplay(player.experience, player.level);

  const healthColor = healthPercent > 60 ? '#22c55e' : healthPercent > 30 ? '#f59e0b' : '#ef4444';

  const { inventory } = player;
  const itemCount = inventory.items.length;

  const attributeColor = player.attributePoints > 0 ? '#5eead4' : '#cbd5e1';
  const skillColor = player.skillPoints > 0 ? '#fbbf24' : '#cbd5e1';

  const background = player.backgroundId ? BACKGROUND_MAP[player.backgroundId] : undefined;
  const backgroundLabel = background ? background.name : 'Unaffiliated';

  const infoItems = [
    {
      label: 'Attribute Points',
      value: player.attributePoints,
      color: attributeColor,
    },
    {
      label: 'Skill Points',
      value: player.skillPoints,
      color: skillColor,
    },
    {
      label: 'Credits',
      value: player.credits,
      color: '#f8fafc',
    },
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
        padding: "0.75rem 0.85rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
        fontFamily: "'DM Sans', 'Inter', sans-serif",
        color: "#e2e8f0",
        fontSize: "0.7rem",
      }}
    >
      {/* Player Name */}
      <div style={{
        fontSize: "0.85rem",
        fontWeight: 600,
        color: "#38bdf8",
        letterSpacing: "0.05em",
        marginBottom: "-0.2rem"
      }}>
        {player.name}
      </div>

      {/* Health Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(148, 163, 184, 0.8)", minWidth: "32px" }}>HP</span>
        <div style={{ flex: 1, position: "relative", height: "0.5rem", borderRadius: "999px", background: "rgba(71, 85, 105, 0.3)" }}>
          <div style={{ width: `${healthPercent}%`, height: "100%", background: healthColor, borderRadius: "999px", transition: "width 0.25s ease" }} />
        </div>
        <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#f8fafc", minWidth: "48px", textAlign: "right" }}>{player.health}/{player.maxHealth}</span>
      </div>

      {/* Level & XP */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        padding: '0.55rem 0.6rem',
        borderRadius: '8px',
        border: '1px solid rgba(148, 163, 184, 0.18)',
        background: 'rgba(30, 41, 59, 0.4)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'rgba(148, 163, 184, 0.85)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Level</span>
          <span style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.85rem' }}>{player.level}</span>
        </div>
        <div style={{ position: 'relative', height: '0.4rem', borderRadius: '999px', background: 'rgba(71, 85, 105, 0.35)' }}>
          <div
            style={{
              width: `${Math.min(100, xpProgress)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #fbbf24, #f97316)',
              borderRadius: '999px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#cbd5e1' }}>
          <span>{xpDisplay}</span>
          <span>Next: {xpTarget} XP</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.45rem 0.6rem' }}>
        {infoItems.map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.15rem',
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

      {/* Inventory */}
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
        <span>
          Reps R {player.factionReputation.resistance} / C {player.factionReputation.corpsec} / S {player.factionReputation.scavengers}
        </span>
      </div>
    </div>
  );
};

export default PlayerStatusPanel;
