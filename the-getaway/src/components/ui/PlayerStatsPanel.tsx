import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getUIStrings } from '../../content/ui';
import { buildPlayerStatProfile, PlayerStatFocus } from '../../game/interfaces/playerStats';
import { getEquippedBonuses, calculateEffectiveSkills } from '../../game/systems/equipmentEffects';
import { calculateDerivedStatsWithEquipment, calculateDerivedStats } from '../../game/systems/statCalculations';
import { spendAttributePoint } from '../../store/playerSlice';
import NotificationBadge from './NotificationBadge';

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
  background: 'rgba(15, 23, 42, 0.6)',
  borderRadius: '12px',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  padding: '0.5rem 0.6rem',
  boxShadow: 'inset 0 1px 0 rgba(148, 163, 184, 0.18)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.1rem',
};

const headingLabelStyle: React.CSSProperties = {
  fontSize: '0.5rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'rgba(148, 163, 184, 0.72)',
};

const headingTitleStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  color: '#f8fafc',
};

const statGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '0.25rem',
};

const statRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.3rem 0.4rem',
  borderRadius: '5px',
  background: 'rgba(30, 41, 59, 0.4)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

const statLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.3rem',
  fontSize: '0.62rem',
  color: '#cbd5e1',
};

const abbreviationBadgeStyle = (highlightColor: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.08rem 0.25rem',
  borderRadius: '3px',
  fontSize: '0.5rem',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#f8fafc',
  background: highlightColor,
});

const statValueStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#f8fafc',
};

const valueWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
};

const attributePointsBannerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.2rem',
  padding: '0.35rem 0.45rem',
  borderRadius: '6px',
  border: '1px solid rgba(94, 234, 212, 0.35)',
  background: 'rgba(15, 118, 110, 0.15)',
};

const attributePointsHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const attributePointsTitleStyle: React.CSSProperties = {
  fontSize: '0.58rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'rgba(94, 234, 212, 0.95)',
};

const attributePointsValueStyle: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: '0.7rem',
  fontWeight: 700,
  color: '#5eead4',
  textShadow: '0 0 6px rgba(94, 234, 212, 0.45)',
};

const attributePointsHintStyle: React.CSSProperties = {
  fontSize: '0.58rem',
  color: 'rgba(203, 213, 225, 0.9)',
  margin: 0,
};

const attributeButtonStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '0.2rem 0.35rem',
  borderRadius: '5px',
  border: '1px solid rgba(94, 234, 212, 0.6)',
  background: disabled ? 'rgba(148, 163, 184, 0.18)' : 'rgba(94, 234, 212, 0.18)',
  color: disabled ? 'rgba(148, 163, 184, 0.8)' : '#5eead4',
  fontSize: '0.6rem',
  fontWeight: 600,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s ease',
  minWidth: '3.75rem',
  textAlign: 'center',
});

const warningBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem 0.6rem',
  borderRadius: '8px',
  border: '1px solid rgba(251, 191, 36, 0.35)',
  background: 'rgba(217, 119, 6, 0.15)',
  fontSize: '0.68rem',
  color: 'rgba(254, 243, 199, 0.95)',
};

const focusColorMap: Record<PlayerStatFocus, string> = {
  combat: 'linear-gradient(135deg, rgba(239, 68, 68, 0.85), rgba(248, 113, 113, 0.85))',
  perception: 'linear-gradient(135deg, rgba(56, 189, 248, 0.85), rgba(59, 130, 246, 0.85))',
  survival: 'linear-gradient(135deg, rgba(45, 212, 191, 0.85), rgba(16, 185, 129, 0.85))',
  social: 'linear-gradient(135deg, rgba(244, 114, 182, 0.85), rgba(236, 72, 153, 0.85))',
  intellect: 'linear-gradient(135deg, rgba(165, 180, 252, 0.85), rgba(99, 102, 241, 0.85))',
  mobility: 'linear-gradient(135deg, rgba(96, 165, 250, 0.85), rgba(37, 99, 235, 0.85))',
  fortuity: 'linear-gradient(135deg, rgba(250, 204, 21, 0.85), rgba(245, 158, 11, 0.85))',
};

const PlayerStatsPanel: React.FC = () => {
  const dispatch = useDispatch();
  const player = useSelector((state: RootState) => state.player.data);
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);

  // Calculate effective skills including equipment bonuses
  const effectiveSkills = useMemo(() => {
    const equipmentBonuses = getEquippedBonuses(player);
    return calculateEffectiveSkills(player.skills, equipmentBonuses);
  }, [player]);

  const profile = useMemo(() => buildPlayerStatProfile(effectiveSkills), [effectiveSkills]);

  const { derived, equipmentError } = useMemo(() => {
    try {
      return { derived: calculateDerivedStatsWithEquipment(player), equipmentError: false };
    } catch (error) {
      console.warn('[PlayerStatsPanel] Unable to use equipment-aware stats, falling back to base attributes.', error);
      return { derived: calculateDerivedStats(player.skills), equipmentError: true };
    }
  }, [player]);

  const attributePointsAvailable = player.attributePoints;
  const showAttributeBoosters = attributePointsAvailable > 0;

  const handleIncreaseAttribute = (attribute: keyof typeof player.skills) => {
    dispatch(spendAttributePoint(attribute));
  };

  const getIncreaseAttributeLabel = (abbreviation: string) => {
    const { increaseAttribute } = uiStrings.playerStatus as {
      increaseAttribute?: ((abbr: string) => string) | string;
    };

    if (typeof increaseAttribute === 'function') {
      return increaseAttribute(abbreviation);
    }

    if (typeof increaseAttribute === 'string') {
      return increaseAttribute;
    }

    return `Increase ${abbreviation}`;
  };

  const derivedStats = [
    {
      label: uiStrings.playerStatus.derivedStats.hp,
      value: derived.maxHP,
    },
    {
      label: uiStrings.playerStatus.derivedStats.carryWeight,
      value: `${derived.carryWeight} kg`,
    },
    {
      label: uiStrings.playerStatus.derivedStats.crit,
      value: `${derived.criticalChance}%`,
    },
    {
      label: uiStrings.playerStatus.derivedStats.hit,
      value: `+${derived.hitChanceModifier}%`,
    },
    {
      label: uiStrings.playerStatus.derivedStats.dodge,
      value: `+${derived.dodgeChance}%`,
    },
  ];

  return (
    <section style={containerStyle} aria-label="player-statistics">
      <header style={headerStyle}>
        <span style={headingLabelStyle}>{uiStrings.playerStatus.attributesLabel}</span>
        <h3 style={headingTitleStyle}>{uiStrings.playerStatus.attributesTitle}</h3>
      </header>

      {equipmentError && (
        <div style={warningBannerStyle} role="alert">
          <span>⚠️</span>
          <span>Equipment stats unavailable. Showing base attributes only.</span>
        </div>
      )}

      {showAttributeBoosters && (
        <div
          style={attributePointsBannerStyle}
          role="group"
          aria-label={uiStrings.playerStatus.attributePointsLabel}
        >
          <div style={attributePointsHeaderStyle}>
            <span style={attributePointsTitleStyle}>{uiStrings.playerStatus.attributePointsLabel}</span>
            <NotificationBadge count={attributePointsAvailable} color="#5eead4" size={22} pulse={attributePointsAvailable > 0} />
          </div>
          <p style={attributePointsHintStyle}>{uiStrings.playerStatus.attributePointsHint}</p>
        </div>
      )}

      <div style={statGridStyle}>
        {profile.map((entry) => {
          const label = uiStrings.skills[entry.key];
          const highlight = focusColorMap[entry.focus] ?? focusColorMap.combat;
          const baseValue = player.skills[entry.key];
          const hasBonus = baseValue !== entry.value;
          const increaseDisabled = baseValue >= 10 || attributePointsAvailable <= 0;
          const increaseAttributeLabel = getIncreaseAttributeLabel(entry.abbreviation);

          return (
            <div
              key={entry.key}
              style={statRowStyle}
              title={uiStrings.skillDescriptions[entry.key]}
            >
              <div style={statLabelStyle}>
                <span style={abbreviationBadgeStyle(highlight)}>{entry.abbreviation}</span>
                <span>{label}</span>
              </div>
              <div style={valueWrapperStyle}>
                <span
                  style={{
                    ...statValueStyle,
                    color: hasBonus ? '#22c55e' : '#f8fafc',
                  }}
                >
                  {entry.value}
                  {hasBonus && (
                    <span style={{ fontSize: '0.65rem', marginLeft: '0.2rem', opacity: 0.6 }}>
                      ({baseValue})
                    </span>
                  )}
                </span>
                {showAttributeBoosters && (
                  <button
                    type="button"
                    style={attributeButtonStyle(increaseDisabled)}
                    disabled={increaseDisabled}
                    onClick={() => handleIncreaseAttribute(entry.key)}
                    aria-label={increaseAttributeLabel}
                    title={
                      increaseDisabled && baseValue >= 10
                        ? uiStrings.playerStatus.attributeMaxed
                        : increaseAttributeLabel
                    }
                  >
                    +1
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <header style={{ ...headerStyle, marginTop: '0.4rem' }}>
        <span style={headingLabelStyle}>{uiStrings.playerStatus.derivedLabel}</span>
        <h3 style={headingTitleStyle}>{uiStrings.playerStatus.derivedTitle}</h3>
      </header>

      <div style={statGridStyle}>
        {derivedStats.map((entry) => (
          <div key={entry.label} style={statRowStyle}>
            <span style={statLabelStyle}>{entry.label}</span>
            <span style={statValueStyle}>{entry.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default React.memo(PlayerStatsPanel);
