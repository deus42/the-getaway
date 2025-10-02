import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { BACKGROUND_MAP } from '../../content/backgrounds';
import { getUIStrings } from '../../content/ui';
import { neonPalette, panelSurface, subtleText, statValueStyle } from './theme';

const PlayerStatusPanel: React.FC = () => {
  const player = useSelector((state: RootState) => state.player.data);
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);

  const { inventory } = player;
  const itemCount = inventory.items.length;

  const background = player.backgroundId ? BACKGROUND_MAP[player.backgroundId] : undefined;
  const backgroundLabel = background ? background.name : 'Unaffiliated';

  return (
    <div
      style={{
        background: panelSurface.background,
        borderRadius: '9px',
        border: panelSurface.border,
        boxShadow: panelSurface.boxShadow,
        backdropFilter: panelSurface.backdropFilter,
        padding: '0.38rem 0.45rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        fontFamily: '"DM Sans", "Inter", sans-serif',
        color: neonPalette.textPrimary,
        fontSize: '0.52rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          gap: '0.4rem',
          paddingBottom: '0.1rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ ...subtleText, fontSize: '0.42rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Load</span>
          <span style={{ ...statValueStyle, fontSize: '0.6rem', color: neonPalette.cyan }}>
            {inventory.currentWeight}/{inventory.maxWeight} kg
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ ...subtleText, fontSize: '0.42rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Items</span>
          <span style={{ ...statValueStyle, fontSize: '0.6rem', color: neonPalette.amber }}>{itemCount}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ ...subtleText, fontSize: '0.42rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Perks</span>
          <span style={{ ...statValueStyle, fontSize: '0.6rem', color: neonPalette.violet }}>{player.perks.length}</span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(148, 163, 184, 0.1)',
          paddingTop: '0.18rem',
          color: neonPalette.textSecondary,
          fontSize: '0.48rem',
        }}
      >
        <span style={{ letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Background</span>
        <span style={{ ...subtleText, fontSize: '0.48rem', color: neonPalette.textSecondary, whiteSpace: 'nowrap' }}>
          {backgroundLabel}
        </span>
        <span
          title={uiStrings.playerStatus.factionReputationLabel}
          style={{
            ...subtleText,
            fontSize: '0.46rem',
            letterSpacing: '0.08em',
            color: neonPalette.textSecondary,
            whiteSpace: 'nowrap',
          }}
        >
          R {player.factionReputation.resistance} • C {player.factionReputation.corpsec} • S {player.factionReputation.scavengers}
        </span>
      </div>
    </div>
  );
};

export default React.memo(PlayerStatusPanel);
