import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getPerkDefinition } from '../../content/perks';
import { getSkillDefinition } from '../../content/skills';
import { getUIStrings } from '../../content/ui';
import { PerkId } from '../../game/interfaces/types';
import Tooltip, { TooltipContent } from './Tooltip';

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

const hintStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  color: 'rgba(148, 163, 184, 0.75)',
  lineHeight: 1.4,
  marginBottom: '0.3rem',
};

const gridStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.6rem',
};

const perkBadgeStyle: React.CSSProperties = {
  width: '46px',
  height: '46px',
  borderRadius: '10px',
  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.18), rgba(14, 165, 233, 0.16))',
  border: '1px solid rgba(56, 189, 248, 0.4)',
  color: '#e0f2fe',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.15rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  boxShadow: '0 0 12px rgba(56, 189, 248, 0.25), inset 0 0 8px rgba(56, 189, 248, 0.2)',
};

const perkCategoryLabelMap: Record<'combat' | 'utility' | 'dialogue' | 'capstone', string> = {
  combat: 'Combat',
  utility: 'Utility',
  dialogue: 'Dialogue',
  capstone: 'Capstone',
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
    return player.perks
      .map((perkId) => {
        try {
          return getPerkDefinition(perkId as PerkId);
        } catch (error) {
          console.warn('[PerkListPanel] Unknown perk id encountered:', perkId, error);
          return null;
        }
      })
      .filter((perk): perk is ReturnType<typeof getPerkDefinition> => perk !== null);
  }, [player.perks]);

  return (
    <div style={containerStyle}>
      <h3 style={headingStyle}>{uiStrings.perks.panelTitle}</h3>
      <div style={hintStyle}>
        Permanent abilities earned at even levels that enhance your character's capabilities
      </div>
        {acquiredPerks.length === 0 ? (
          <div style={emptyStyle}>{uiStrings.perks.emptyLabel}</div>
        ) : (
          <div style={gridStyle}>
            {acquiredPerks.map((perk) => (
              <Tooltip
                key={perk.id}
                content={(
                  <TooltipContent
                    title={perk.name}
                    description={perk.description}
                    lines={perk.effects}
                    footer={perk.flavor ? <em>{perk.flavor}</em> : undefined}
                  />
                )}
                wrapperStyle={{ display: 'inline-flex' }}
              >
                <div style={perkBadgeStyle}>{perk.name.charAt(0)}</div>
              </Tooltip>
            ))}
          </div>
        )}
    </div>
  );
};

export default PerkListPanel;
