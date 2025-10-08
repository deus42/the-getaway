import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getUIStrings } from '../../content/ui';
import { characterPanelSurface, neonPalette } from './theme';
import { selectAllFactionStandings } from '../../store/selectors/factionSelectors';
import { getLocalizedStandingLabel } from '../../game/systems/factions';

const panelStyle: React.CSSProperties = {
  ...characterPanelSurface,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.7rem',
  padding: '0.8rem',
  minHeight: 0,
};

const headingStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(226, 232, 240, 0.78)',
};

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
  overflow: 'auto',
};

const factionCardStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.35)',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: '10px',
  padding: '0.6rem 0.7rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.45rem',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.6rem',
};

const nameGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.18rem',
};

const nameStyle: React.CSSProperties = {
  fontSize: '0.74rem',
  fontWeight: 600,
  color: neonPalette.textPrimary,
  letterSpacing: '0.08em',
};

const standingBadgeStyle = (color: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.2rem',
  borderRadius: '999px',
  padding: '0.18rem 0.5rem',
  fontSize: '0.58rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'rgba(15, 23, 42, 0.95)',
  background: color,
});

const valueStyle: React.CSSProperties = {
  fontSize: '0.62rem',
  letterSpacing: '0.08em',
  color: 'rgba(148, 163, 184, 0.85)',
};

const barTrackStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '0.35rem',
  borderRadius: '999px',
  background: 'rgba(71, 85, 105, 0.35)',
  overflow: 'hidden',
};

const barFillStyle = (percentage: number, color: string): React.CSSProperties => ({
  position: 'absolute',
  inset: 0,
  width: `${Math.max(0, Math.min(100, percentage))}%`,
  background: color,
  borderRadius: '999px',
  transition: 'width 0.4s ease',
});

const effectsListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  color: 'rgba(203, 213, 225, 0.9)',
  fontSize: '0.6rem',
  lineHeight: 1.35,
};

const effectRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.35rem',
};

const EFFECT_ICON = '•';

const formatPercentage = (value: number): number => {
  const clamped = Math.max(-100, Math.min(100, value));
  return ((clamped + 100) / 200) * 100;
};

export const FactionReputationPanel: React.FC = () => {
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = useMemo(() => getUIStrings(locale), [locale]);
  const factions = useSelector(selectAllFactionStandings);

  if (!factions.length) {
    return null;
  }

  return (
    <section style={panelStyle} aria-label={uiStrings.factionPanel.ariaLabel}>
      <h2 style={headingStyle}>{uiStrings.factionPanel.heading}</h2>
      <div style={listStyle} role="list">
        {factions.map((faction) => {
          const localizedStanding = getLocalizedStandingLabel(locale, faction.standingId);
          const percentage = formatPercentage(faction.value);
          const nextThresholdLabel = faction.nextThreshold
            ? getLocalizedStandingLabel(locale, faction.nextThreshold.standing.id)
            : null;

          const nextThreshold = faction.nextThreshold && nextThresholdLabel
            ? uiStrings.factionPanel.nextThreshold(nextThresholdLabel, faction.nextThreshold.requiredValue)
            : uiStrings.factionPanel.maxStanding;

          return (
            <article
              key={faction.factionId}
              style={factionCardStyle}
              role="listitem"
              aria-label={`${faction.name} ${localizedStanding}`}
            >
              <div style={rowStyle}>
                <div style={nameGroupStyle}>
                  <span style={nameStyle}>{faction.name}</span>
                  <span style={valueStyle}>
                    {uiStrings.factionPanel.reputationLabel}: {faction.value}
                  </span>
                </div>
                <span style={standingBadgeStyle(faction.color)}>
                  {faction.icon}
                  {localizedStanding}
                </span>
              </div>
              <div style={barTrackStyle}>
                <div
                  style={barFillStyle(percentage, faction.color)}
                  role="presentation"
                />
              </div>
              <div style={valueStyle}>
                {uiStrings.factionPanel.standingLabel}: {localizedStanding} • {nextThreshold}
              </div>
              <div style={effectsListStyle}>
                <span style={{ fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {uiStrings.factionPanel.effectsLabel}
                </span>
                {faction.effects.length === 0 ? (
                  <span>{uiStrings.factionPanel.noEffects}</span>
                ) : (
                  faction.effects.map((effect, index) => (
                    <div key={`${faction.factionId}-effect-${index}`} style={effectRowStyle}>
                      <span aria-hidden="true">{EFFECT_ICON}</span>
                      <span>{effect}</span>
                    </div>
                  ))
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default React.memo(FactionReputationPanel);
