import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getPerkDefinition } from '../../content/perks';
import { getUIStrings } from '../../content/ui';
import { PerkId } from '../../game/interfaces/types';

const containerStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.72)',
  borderRadius: '12px',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  padding: '0.9rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.7rem',
};

const headingStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#38bdf8',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '0.6rem',
};

const perkCardStyle: React.CSSProperties = {
  borderRadius: '10px',
  border: '1px solid rgba(56, 189, 248, 0.18)',
  background: 'linear-gradient(140deg, rgba(15, 23, 42, 0.88), rgba(12, 20, 38, 0.9))',
  padding: '0.7rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
};

const perkNameStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 600,
  letterSpacing: '0.06em',
  color: '#e2e8f0',
};

const perkEffectStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  color: 'rgba(226, 232, 240, 0.75)',
  lineHeight: 1.4,
};

const emptyStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  color: 'rgba(148, 163, 184, 0.75)',
};

const PerkListPanel: React.FC = () => {
  const player = useSelector((state: RootState) => state.player.data);
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);

  const acquiredPerks = useMemo(() => {
    return player.perks.map((perkId) => {
      const definition = getPerkDefinition(perkId as PerkId);
      return definition;
    });
  }, [player.perks]);

  return (
    <div style={containerStyle}>
      <h3 style={headingStyle}>{uiStrings.perks.panelTitle}</h3>
      {acquiredPerks.length === 0 ? (
        <div style={emptyStyle}>{uiStrings.perks.emptyLabel}</div>
      ) : (
        <div style={gridStyle}>
          {acquiredPerks.map((perk) => (
            <div key={perk.id} style={perkCardStyle}>
              <div style={perkNameStyle}>{perk.name}</div>
              <div style={perkEffectStyle}>{perk.effects.join(' • ')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PerkListPanel;
