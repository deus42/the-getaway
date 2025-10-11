import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { BACKGROUND_MAP } from '../../content/backgrounds';
import { getUIStrings } from '../../content/ui';
import { SKILL_BRANCHES } from '../../content/skills';
import { formatXPDisplay, calculateXPForLevel } from '../../game/systems/progression';
import { addExperience } from '../../store/playerSlice';
import AnimatedStatBar from './AnimatedStatBar';
import {
  neonPalette,
  panelSurface,
  cardSurface,
  badgeSurface,
  headingStyle,
  subtleText,
  gradientTextStyle,
  glowTextStyle,
  importantValueStyle,
} from './theme';
import { dystopianTokens } from '../../theme/dystopianTokens';

const { colors, fonts, motion } = dystopianTokens;

interface PlayerSummaryPanelProps {
  onOpenCharacter?: () => void;
  characterOpen?: boolean;
  showActionButton?: boolean;
}

const summaryContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
  padding: '0.95rem 1rem',
  borderRadius: '18px',
  background: panelSurface.background,
  border: panelSurface.border,
  boxShadow: panelSurface.boxShadow,
  backdropFilter: panelSurface.backdropFilter,
  color: neonPalette.textPrimary,
  fontFamily: fonts.body,
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '0.75rem',
};

const nameStyle: React.CSSProperties = {
  ...headingStyle,
  ...gradientTextStyle(colors.accentGlow, colors.accentSecondary),
  fontSize: '0.9rem',
  letterSpacing: '0.26em',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  filter: 'drop-shadow(0 0 8px rgba(75, 231, 207, 0.32))',
};

const levelBadgeStyle: React.CSSProperties = {
  ...badgeSurface(neonPalette.cyan),
  fontSize: '0.6rem',
  textTransform: 'uppercase',
  padding: '0.22rem 0.55rem',
  borderRadius: '999px',
  letterSpacing: '0.14em',
  background: 'rgba(75, 231, 207, 0.16)',
  boxShadow: '0 10px 22px -12px rgba(75, 231, 207, 0.55)',
  ...glowTextStyle(neonPalette.cyan, 5),
};

const backgroundLabelStyle: React.CSSProperties = {
  ...subtleText,
  fontSize: '0.6rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  marginTop: '0.2rem',
  fontFamily: fonts.badge,
};

const statGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '0.32rem',
};

const staminaContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  width: '100%',
};

const staminaBarWrapperStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const fatigueBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  padding: '0.22rem 0.55rem',
  borderRadius: '999px',
  border: `1px solid ${colors.warning}`,
  background: colors.warningSoft,
  color: colors.warning,
  fontSize: '0.55rem',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  boxShadow: '0 8px 18px -12px rgba(255, 212, 121, 0.6)',
};

const crouchBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  padding: '0.22rem 0.55rem',
  borderRadius: '999px',
  border: `1px solid ${colors.divider}`,
  background: 'rgba(21, 33, 38, 0.42)',
  color: colors.foreground,
  fontSize: '0.55rem',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  boxShadow: '0 8px 18px -12px rgba(45, 62, 72, 0.55)',
};

const statCardStyle: React.CSSProperties = {
  background: cardSurface.background,
  border: cardSurface.border,
  boxShadow: cardSurface.boxShadow,
  borderRadius: '12px',
  padding: '0.45rem 0.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.12rem',
  minWidth: 0,
};

const statLabelStyle: React.CSSProperties = {
  ...subtleText,
  fontSize: '0.5rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};


const skillSummaryContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
  marginTop: '0.25rem',
};

const skillChipStyle = (accent: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.65rem',
  padding: '0.38rem 0.85rem',
  borderRadius: '999px',
  border: `1px solid ${accent}`,
  background: `linear-gradient(140deg, ${accent}20, rgba(11, 17, 23, 0.88))`,
  color: neonPalette.textPrimary,
  fontSize: '0.6rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  boxShadow: `0 10px 18px -12px ${accent}88`,
  flex: '1 1 calc(50% - 0.5rem)',
  minWidth: '140px',
});

const actionButtonStyle = (active: boolean): React.CSSProperties => ({
  alignSelf: 'flex-start',
  marginTop: '0.2rem',
  padding: active ? '0.42rem 0.75rem' : '0.38rem 0.72rem',
  borderRadius: '999px',
  border: `1px solid ${active ? colors.warning : colors.accent}`,
  background: active
    ? 'linear-gradient(130deg, rgba(255, 212, 121, 0.42), rgba(255, 184, 107, 0.55))'
    : 'linear-gradient(130deg, rgba(75, 231, 207, 0.34), rgba(43, 197, 249, 0.42))',
  color: active ? '#fff7de' : colors.foreground,
  fontSize: '0.58rem',
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: `transform ${motion.hoverDuration}ms ${motion.hoverEase}, box-shadow ${motion.hoverDuration}ms ${motion.hoverEase}`,
  textAlign: 'center',
  transform: 'translateY(0)',
  boxShadow: active
    ? '0 12px 20px -16px rgba(255, 184, 107, 0.48)'
    : '0 12px 20px -18px rgba(75, 231, 207, 0.45)',
});

const PlayerSummaryPanel: React.FC<PlayerSummaryPanelProps> = ({
  onOpenCharacter,
  characterOpen = false,
  showActionButton = true,
}) => {
  const dispatch = useDispatch();
  const player = useSelector((state: RootState) => state.player.data);
  const locale = useSelector((state: RootState) => state.settings.locale);
  const testMode = useSelector((state: RootState) => state.settings.testMode);
  const uiStrings = getUIStrings(locale);
  const background = player.backgroundId ? BACKGROUND_MAP[player.backgroundId] : undefined;

  const handleLevelUp = () => {
    const currentLevel = player.level;
    const xpForNextLevel = calculateXPForLevel(currentLevel + 1);
    const currentXP = player.experience;
    const xpNeeded = xpForNextLevel - currentXP;
    dispatch(addExperience({ amount: Math.max(1, xpNeeded), reason: 'Test mode XP boost' }));
  };

  const branchTotals = useMemo(() => {
    const totals = SKILL_BRANCHES.map((branch) => {
      const total = branch.skills.reduce((acc, skill) => acc + (player.skillTraining[skill.id] ?? 0), 0);
      return { id: branch.id, label: branch.label, total };
    }).filter((entry) => entry.total > 0);

    totals.sort((a, b) => b.total - a.total);
    return totals;
  }, [player.skillTraining]);

  const branchAccent: Record<string, string> = {
    combat: '#f97316',
    tech: '#38bdf8',
    survival: '#34d399',
    social: '#c084fc',
  };

  return (
    <div style={summaryContainerStyle} data-testid="player-summary-panel">
      <div style={headerStyle}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={nameStyle}>
            <span>{player.name}</span>
            <span style={levelBadgeStyle}>
              {uiStrings.playerStatus.levelLabel} {player.level}
            </span>
            {player.isCrouching && (
              <span style={crouchBadgeStyle}>{uiStrings.playerStatus.crouchIndicator}</span>
            )}
          </div>
          <div style={backgroundLabelStyle}>{background?.name ?? 'Unaffiliated'}</div>
        </div>
      </div>

      <AnimatedStatBar
        label="Health"
        current={player.health}
        max={player.maxHealth}
        baseColor="#ef4444"
        lowThreshold={50}
        criticalThreshold={25}
        emphasisColor="#ef4444"
      />

      <div
        style={staminaContainerStyle}
        aria-label={uiStrings.playerStatus.staminaLabel}
      >
        <div style={staminaBarWrapperStyle}>
          <AnimatedStatBar
            label={uiStrings.playerStatus.staminaLabel}
            current={player.stamina}
            max={player.maxStamina}
            baseColor="#10b981"
            lowThreshold={35}
            criticalThreshold={25}
            emphasisColor="#10b981"
          />
        </div>
        {player.isExhausted && (
          <span style={fatigueBadgeStyle} title={uiStrings.playerStatus.fatigueHint}>
            ⚠️ {uiStrings.playerStatus.fatigueStatus}
          </span>
        )}
      </div>

      <div style={statGridStyle}>
        <div style={statCardStyle}>
          <span style={statLabelStyle}>Credits</span>
          <span style={{ ...importantValueStyle('#fbbf24') }}>₿{player.credits}</span>
        </div>
        <div style={statCardStyle}>
          <span style={statLabelStyle}>Experience</span>
          <span style={{ ...importantValueStyle('#38bdf8') }}>{formatXPDisplay(player.experience, player.level)}</span>
        </div>
      </div>
      {branchTotals.length > 0 && (
        <div style={skillSummaryContainerStyle}>
          {branchTotals.slice(0, 4).map((summary) => (
            <span
              key={summary.id}
              style={skillChipStyle(branchAccent[summary.id] ?? '#38bdf8')}
            >
              <span>{summary.label}</span>
              <span style={{
                fontWeight: 700,
                color: branchAccent[summary.id] ?? neonPalette.cyan,
                ...glowTextStyle(branchAccent[summary.id] ?? neonPalette.cyan, 4)
              }}>
                {summary.total}
              </span>
            </span>
          ))}
        </div>
      )}
      {onOpenCharacter && showActionButton && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
          <button
            type="button"
            onClick={onOpenCharacter}
            style={{ ...actionButtonStyle(characterOpen), flex: 1 }}
            data-testid="summary-open-character"
            aria-pressed={characterOpen}
            onMouseEnter={(event) => {
              event.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = 'translateY(0) scale(1)';
            }}
          >
            {uiStrings.shell.characterButton}
          </button>
          {testMode && (
            <button
              type="button"
              onClick={handleLevelUp}
              style={{
                ...actionButtonStyle(false),
                flex: 1,
                background: 'linear-gradient(130deg, rgba(251, 191, 36, 0.48), rgba(249, 115, 22, 0.45))',
                border: `1px solid ${neonPalette.amber}`,
                boxShadow: '0 12px 20px -16px rgba(251, 191, 36, 0.48)',
              }}
              title="Test Mode: Gain XP to level up"
              onMouseEnter={(event) => {
                event.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.transform = 'translateY(0) scale(1)';
              }}
            >
              ⬆ Level Up
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(PlayerSummaryPanel);
