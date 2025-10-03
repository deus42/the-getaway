import React from 'react';
import StatusEffectIcon, { StatusEffect } from './StatusEffectIcon';

interface StatusEffectsPanelProps {
  effects?: StatusEffect[];
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
  background: 'rgba(15, 23, 42, 0.6)',
  borderRadius: '12px',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  padding: '0.8rem',
  boxShadow: 'inset 0 1px 0 rgba(148, 163, 184, 0.18)',
};

const headingStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#38bdf8',
};

const effectsGridStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
};

const emptyStateStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  color: 'rgba(148, 163, 184, 0.6)',
  textAlign: 'center',
  padding: '1rem',
};

// Demo effects for display purposes
const DEMO_EFFECTS: StatusEffect[] = [
  {
    id: 'stealth',
    name: 'Stealth',
    icon: '🥷',
    color: '#8b5cf6',
    type: 'buff',
    duration: 5,
  },
  {
    id: 'tactical-advantage',
    name: 'Tactical Advantage',
    icon: '🎯',
    color: '#10b981',
    type: 'buff',
    duration: 3,
  },
];

const StatusEffectsPanel: React.FC<StatusEffectsPanelProps> = ({ effects = DEMO_EFFECTS }) => {
  return (
    <div style={containerStyle}>
      <h3 style={headingStyle}>Active Effects</h3>
      {effects && effects.length > 0 ? (
        <div style={effectsGridStyle}>
          {effects.map((effect) => (
            <StatusEffectIcon key={effect.id} effect={effect} size={40} showDuration={true} />
          ))}
        </div>
      ) : (
        <div style={emptyStateStyle}>No active effects</div>
      )}
    </div>
  );
};

export default StatusEffectsPanel;
