import React from 'react';
import StatusEffectIcon, { StatusEffect } from './StatusEffectIcon';
import Tooltip, { TooltipContent } from './Tooltip';
import {
  characterPanelSurface,
  characterPanelHeaderStyle,
  characterPanelLabelStyle,
  characterPanelTitleStyle,
} from './theme';

interface StatusEffectsPanelProps {
  effects?: StatusEffect[];
}

const containerStyle: React.CSSProperties = {
  ...characterPanelSurface,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
};

const headerStyle: React.CSSProperties = {
  ...characterPanelHeaderStyle,
};

const headingLabelStyle: React.CSSProperties = {
  ...characterPanelLabelStyle,
};

const headingTitleStyle: React.CSSProperties = {
  ...characterPanelTitleStyle,
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
    description: 'Visibility reduced; enemies require higher perception to detect you.',
  },
  {
    id: 'tactical-advantage',
    name: 'Tactical Advantage',
    icon: '🎯',
    color: '#10b981',
    type: 'buff',
    duration: 3,
    description: 'Gain +15% hit chance while flanking enemies.',
  },
];

const StatusEffectsPanel: React.FC<StatusEffectsPanelProps> = ({ effects = DEMO_EFFECTS }) => {
  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <span style={headingLabelStyle}>Status</span>
        <h3 style={headingTitleStyle}>Active Effects</h3>
      </header>
      {effects && effects.length > 0 ? (
        <div style={effectsGridStyle}>
          {effects.map((effect) => {
            const durationLabel = effect.duration !== undefined
              ? `${effect.duration} turn${effect.duration === 1 ? '' : 's'} remaining`
              : 'Persistent';
            const stacksLabel = effect.stacks && effect.stacks > 1 ? `${effect.stacks} stacks` : null;
            const typeLabel = effect.type === 'buff'
              ? 'Buff'
              : effect.type === 'debuff'
                ? 'Debuff'
                : 'Status';
            const metaDetails = stacksLabel
              ? [typeLabel, durationLabel, stacksLabel]
              : [typeLabel, durationLabel];

            return (
              <Tooltip
                key={effect.id}
                content={(
                  <TooltipContent
                    title={effect.name}
                    description={effect.description}
                    meta={metaDetails}
                  />
                )}
                wrapperStyle={{ display: 'inline-flex' }}
              >
                <StatusEffectIcon effect={effect} size={40} showDuration={true} />
              </Tooltip>
            );
          })}
        </div>
      ) : (
        <div style={emptyStateStyle}>No active effects</div>
      )}
    </div>
  );
};

export default StatusEffectsPanel;
