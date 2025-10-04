import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getUIStrings } from '../../content/ui';
import { listPerksByCategory, evaluatePerkAvailability } from '../../content/perks';
import { selectPerk } from '../../store/playerSlice';
import { PerkCategory, PerkId } from '../../game/interfaces/types';

interface PerkSelectionPanelProps {
  open: boolean;
  pendingSelections: number;
  onClose: () => void;
}

type CategoryKey = PerkCategory;

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 12000,
  backgroundColor: 'rgba(8, 15, 31, 0.9)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '3vh 3vw',
};

const panelStyle: React.CSSProperties = {
  width: 'min(1040px, 92vw)',
  maxHeight: '92vh',
  overflowY: 'auto',
  background: 'linear-gradient(160deg, rgba(15, 23, 42, 0.98), rgba(8, 11, 24, 0.92))',
  borderRadius: '18px',
  border: '1px solid rgba(56, 189, 248, 0.25)',
  boxShadow: '0 40px 90px rgba(2, 6, 23, 0.75)',
  color: '#e2e8f0',
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle: React.CSSProperties = {
  padding: '1.4rem 1.6rem 1rem',
  borderBottom: '1px solid rgba(56, 189, 248, 0.18)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.35rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  margin: 0,
};

const remainingStyle: React.CSSProperties = {
  marginTop: '0.35rem',
  fontSize: '0.75rem',
  letterSpacing: '0.08em',
  color: 'rgba(148, 163, 184, 0.78)',
};

const bodyStyle: React.CSSProperties = {
  padding: '1.4rem 1.6rem 2rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.2rem',
};

const categoryHeaderStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#38bdf8',
  marginBottom: '0.6rem',
};

const perkGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '1rem',
};

const perkCardStyle = (locked: boolean): React.CSSProperties => ({
  borderRadius: '14px',
  border: `1px solid ${locked ? 'rgba(148, 163, 184, 0.16)' : 'rgba(56, 189, 248, 0.24)'}`,
  background: locked
    ? 'linear-gradient(150deg, rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.85))'
    : 'linear-gradient(150deg, rgba(15, 23, 42, 0.9), rgba(12, 18, 34, 0.92))',
  padding: '1.1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.65rem',
  boxShadow: locked ? 'none' : '0 20px 32px rgba(56, 189, 248, 0.12)',
  minHeight: '220px',
});

const perkNameStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 700,
  letterSpacing: '0.05em',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
};

const capstoneBadgeStyle: React.CSSProperties = {
  fontSize: '0.55rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  padding: '0.2rem 0.5rem',
  borderRadius: '999px',
  border: '1px solid rgba(251, 191, 36, 0.55)',
  background: 'rgba(251, 191, 36, 0.16)',
  color: '#fbbf24',
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'rgba(148, 163, 184, 0.78)',
};

const textStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  lineHeight: 1.5,
  color: 'rgba(226, 232, 240, 0.9)',
};

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: '1.1rem',
  fontSize: '0.78rem',
  color: 'rgba(226, 232, 240, 0.82)',
};

const buttonStyle = (disabled: boolean): React.CSSProperties => ({
  marginTop: 'auto',
  alignSelf: 'flex-start',
  padding: '0.55rem 1rem',
  borderRadius: '999px',
  border: '1px solid rgba(56, 189, 248, 0.5)',
  background: disabled
    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.75), rgba(15, 23, 42, 0.78))'
    : 'linear-gradient(135deg, rgba(37, 99, 235, 0.65), rgba(56, 189, 248, 0.7))',
  color: disabled ? 'rgba(148, 163, 184, 0.7)' : '#e0f2fe',
  letterSpacing: '0.14em',
  fontSize: '0.62rem',
  textTransform: 'uppercase',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'transform 0.15s ease',
});

const footerStyle: React.CSSProperties = {
  padding: '1rem 1.6rem 1.4rem',
  borderTop: '1px solid rgba(56, 189, 248, 0.18)',
  display: 'flex',
  justifyContent: 'flex-end',
};

const headerCloseButtonStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '0.5rem 0.7rem',
  borderRadius: '8px',
  border: '1px solid rgba(148, 163, 184, 0.4)',
  background: disabled ? 'rgba(15, 23, 42, 0.6)' : 'rgba(15, 23, 42, 0.85)',
  color: disabled ? 'rgba(148, 163, 184, 0.6)' : '#e2e8f0',
  fontSize: '1rem',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s ease',
  opacity: disabled ? 0.6 : 1,
});

const continueButtonStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '0.6rem 1.4rem',
  borderRadius: '999px',
  border: `1px solid ${disabled ? 'rgba(148, 163, 184, 0.3)' : 'rgba(56, 189, 248, 0.5)'}`,
  background: disabled
    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.75), rgba(15, 23, 42, 0.78))'
    : 'linear-gradient(135deg, rgba(37, 99, 235, 0.65), rgba(56, 189, 248, 0.7))',
  color: disabled ? 'rgba(148, 163, 184, 0.6)' : '#e0f2fe',
  letterSpacing: '0.16em',
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: 600,
  transition: 'all 0.2s ease',
});

const buildRequirementList = (lines: string[]): React.ReactElement | null => {
  if (lines.length === 0) {
    return null;
  }
  return (
    <ul style={listStyle}>
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
};

const PerkSelectionPanel: React.FC<PerkSelectionPanelProps> = ({ open, pendingSelections, onClose }) => {
  const dispatch = useDispatch();
  const player = useSelector((state: RootState) => state.player.data);
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);

  const categories: CategoryKey[] = useMemo(() => ['combat', 'utility', 'dialogue', 'capstone'], []);

  const byCategory = useMemo(() => {
    return categories.map((category) => {
      const definitions = listPerksByCategory(category);
      return {
        category,
        label: uiStrings.perks.categoryLabels[category],
        perks: definitions.map((definition) => {
          const availability = evaluatePerkAvailability(player, definition);
          return {
            definition,
            availability,
          };
        }),
      };
    }).filter((entry) => entry.perks.length > 0);
  }, [categories, player, uiStrings.perks.categoryLabels]);

  const hasSelectablePerks = useMemo(
    () => byCategory.some((entry) => entry.perks.some(({ availability }) => availability.canSelect)),
    [byCategory]
  );

  const closeDisabled = pendingSelections > 0 && hasSelectablePerks;

  if (!open) {
    return null;
  }

  const handleSelect = (perkId: PerkId, canSelect: boolean) => {
    if (!canSelect || pendingSelections <= 0) {
      return;
    }
    dispatch(selectPerk(perkId));
  };

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label={uiStrings.perks.panelTitle}>
      <div style={panelStyle}>
        <header style={headerStyle}>
          <div>
            <h2 style={titleStyle}>{uiStrings.perks.panelTitle}</h2>
            <div style={remainingStyle}>{uiStrings.perks.remainingLabel(pendingSelections)}</div>
          </div>
          <button
            type="button"
            style={headerCloseButtonStyle(closeDisabled)}
            onClick={closeDisabled ? undefined : onClose}
            disabled={closeDisabled}
            title={closeDisabled ? 'Spend all perk selections before closing' : 'Close'}
            aria-disabled={closeDisabled}
          >
            ✕
          </button>
        </header>
        <div style={bodyStyle}>
          {pendingSelections > 0 && !hasSelectablePerks && (
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '10px',
                padding: '0.9rem',
                marginBottom: '0.8rem',
                color: 'rgba(226, 232, 240, 0.9)',
                fontSize: '0.75rem',
                lineHeight: 1.45,
              }}
            >
              All current perks are either already owned or locked. Spend your new attribute or skill points to unlock additional choices, or continue to return later.
            </div>
          )}
          {byCategory.map(({ category, label, perks }) => (
            <section key={category}>
              <h3 style={categoryHeaderStyle}>{label}</h3>
              <div style={perkGridStyle}>
                {perks.map(({ definition, availability }) => {
                  const locked = !availability.canSelect;
                  return (
                    <article key={definition.id} style={perkCardStyle(locked)}>
                      <div style={perkNameStyle}>
                        <span>{definition.name}</span>
                        {definition.capstone && <span style={capstoneBadgeStyle}>{uiStrings.perks.capstoneTag}</span>}
                      </div>
                      <div style={textStyle}>{definition.description}</div>
                      {definition.effects.length > 0 && (
                        <div>
                          <div style={sectionLabelStyle}>{uiStrings.perks.effectsLabel}</div>
                          {buildRequirementList(definition.effects)}
                        </div>
                      )}
                      <div>
                        <div style={sectionLabelStyle}>{uiStrings.perks.requirementsLabel}</div>
                        {buildRequirementList(
                          [
                            `Level ${definition.levelRequirement}`,
                            ...(definition.attributeRequirements?.map((req) => `${req.attribute.toUpperCase()} ${req.value}`) ?? []),
                            ...(definition.skillRequirements?.map((req) => `${req.skill} ${req.value}`) ?? []),
                          ]
                        )}
                      </div>
                      {locked && availability.reasons.length > 0 && (
                        <div>
                          <div style={sectionLabelStyle}>{uiStrings.perks.lockedLabel}</div>
                          {buildRequirementList(availability.reasons)}
                        </div>
                      )}
                      {player.perks.includes(definition.id) && (
                        <div style={{ ...sectionLabelStyle, color: '#fbbf24' }}>{uiStrings.perks.alreadyOwnedLabel}</div>
                      )}
                      <button
                        type="button"
                        style={buttonStyle(!availability.canSelect || pendingSelections <= 0 || player.perks.includes(definition.id))}
                        onClick={() => handleSelect(definition.id, availability.canSelect)}
                        disabled={!availability.canSelect || pendingSelections <= 0 || player.perks.includes(definition.id)}
                      >
                        {uiStrings.perks.selectLabel}
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        <footer style={footerStyle}>
          <button
            type="button"
            style={continueButtonStyle(pendingSelections > 0 && hasSelectablePerks)}
            onClick={onClose}
            disabled={pendingSelections > 0 && hasSelectablePerks}
            title={
              pendingSelections > 0 && hasSelectablePerks
                ? 'Select all available perks before continuing'
                : 'Continue'
            }
          >
            Continue
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PerkSelectionPanel;
