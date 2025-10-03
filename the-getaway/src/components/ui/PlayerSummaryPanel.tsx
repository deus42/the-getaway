import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { BACKGROUND_MAP } from '../../content/backgrounds';
import { getUIStrings } from '../../content/ui';
import { SKILL_BRANCHES } from '../../content/skills';
import AnimatedStatBar from './AnimatedStatBar';
import {
  neonPalette,
  panelSurface,
  cardSurface,
  badgeSurface,
  headingStyle,
  statValueStyle as themedStatValue,
  subtleText,
  gradientTextStyle,
  glowTextStyle,
  importantValueStyle,
} from './theme';

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
  fontFamily: '"DM Sans", "Inter", sans-serif',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '0.75rem',
};

const nameStyle: React.CSSProperties = {
  ...headingStyle,
  ...gradientTextStyle('#bfdbfe', '#38bdf8'),
  fontSize: '0.9rem',
  letterSpacing: '0.26em',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.4))',
};

const levelBadgeStyle: React.CSSProperties = {
  ...badgeSurface(neonPalette.cyan),
  fontSize: '0.6rem',
  textTransform: 'uppercase',
  padding: '0.22rem 0.55rem',
  borderRadius: '999px',
  letterSpacing: '0.14em',
  background: 'rgba(56, 189, 248, 0.18)',
  boxShadow: '0 10px 20px -10px rgba(56, 189, 248, 0.55)',
  ...glowTextStyle(neonPalette.cyan, 6),
};

const backgroundLabelStyle: React.CSSProperties = {
  ...subtleText,
  fontSize: '0.6rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  marginTop: '0.2rem',
};

const statGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '0.32rem',
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

const statValueStyle: React.CSSProperties = {
  ...themedStatValue,
  fontSize: '0.74rem',
};

const skillSummaryContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.4rem',
  marginTop: '0.1rem',
};

const skillChipStyle = (accent: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.35rem',
  padding: '0.28rem 0.6rem',
  borderRadius: '999px',
  border: `1px solid ${accent}`,
  background: `linear-gradient(140deg, ${accent}26, rgba(15, 23, 42, 0.9))`,
  color: neonPalette.textPrimary,
  fontSize: '0.6rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  boxShadow: `0 10px 18px -12px ${accent}99`,
});

const actionButtonStyle = (active: boolean): React.CSSProperties => ({
  alignSelf: 'flex-start',
  marginTop: '0.2rem',
  padding: active ? '0.42rem 0.75rem' : '0.38rem 0.72rem',
  borderRadius: '999px',
  border: `1px solid ${active ? neonPalette.amber : neonPalette.cyan}`,
  background: active
    ? 'linear-gradient(130deg, rgba(251, 191, 36, 0.6), rgba(249, 115, 22, 0.55))'
    : 'linear-gradient(130deg, rgba(56, 189, 248, 0.48), rgba(14, 165, 233, 0.45))',
  color: active ? '#fff7e1' : '#e0f2fe',
  fontSize: '0.58rem',
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  textAlign: 'center',
  transform: 'translateY(0)',
  boxShadow: active
    ? '0 12px 20px -16px rgba(251, 191, 36, 0.48)'
    : '0 12px 20px -18px rgba(56, 189, 248, 0.45)',
});

const PlayerSummaryPanel: React.FC<PlayerSummaryPanelProps> = ({
  onOpenCharacter,
  characterOpen = false,
  showActionButton = true,
}) => {
  const player = useSelector((state: RootState) => state.player.data);
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);
  const background = player.backgroundId ? BACKGROUND_MAP[player.backgroundId] : undefined;

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
            <span style={levelBadgeStyle}>Level {player.level}</span>
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

      <div style={statGridStyle}>
        <div style={statCardStyle}>
          <span style={statLabelStyle}>Skill Points</span>
          <span style={{ ...statValueStyle, ...glowTextStyle('#34d399', 6) }}>{player.skillPoints}</span>
        </div>
        <div style={statCardStyle}>
          <span style={statLabelStyle}>Attribute Points</span>
          <span style={{ ...statValueStyle, ...glowTextStyle('#c084fc', 6) }}>{player.attributePoints}</span>
        </div>
        <div style={statCardStyle}>
          <span style={statLabelStyle}>Credits</span>
          <span style={{ ...importantValueStyle('#fbbf24') }}>{player.credits}</span>
        </div>
        <div style={statCardStyle}>
          <span style={statLabelStyle}>XP</span>
          <span style={{ ...importantValueStyle('#38bdf8') }}>{player.experience}</span>
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
        <button
          type="button"
          onClick={onOpenCharacter}
          style={actionButtonStyle(characterOpen)}
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
      )}
    </div>
  );
};

export default React.memo(PlayerSummaryPanel);
