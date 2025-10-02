import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { BACKGROUND_MAP } from '../../content/backgrounds';
import { getUIStrings } from '../../content/ui';
import { SKILL_BRANCHES } from '../../content/skills';

interface PlayerSummaryPanelProps {
  onOpenCharacter?: () => void;
  characterOpen?: boolean;
  showActionButton?: boolean;
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  padding: '0.45rem 0.55rem',
  background: 'linear-gradient(185deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95))',
  borderRadius: '10px',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  boxShadow: '0 18px 28px rgba(15, 23, 42, 0.4)',
  minHeight: 0,
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.5rem',
};

const nameStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 700,
  color: '#f8fafc',
  letterSpacing: '0.04em',
};

const levelBadgeStyle: React.CSSProperties = {
  fontSize: '0.6rem',
  textTransform: 'uppercase',
  padding: '0.2rem 0.4rem',
  borderRadius: '999px',
  border: '1px solid rgba(56, 189, 248, 0.4)',
  background: 'rgba(14, 165, 233, 0.15)',
  color: '#bae6fd',
  letterSpacing: '0.08em',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

const barShellStyle: React.CSSProperties = {
  width: '100%',
  height: '0.4rem',
  borderRadius: '999px',
  background: 'rgba(71, 85, 105, 0.3)',
  overflow: 'hidden',
};

const barFillStyle = (color: string, width: string): React.CSSProperties => ({
  width,
  height: '100%',
  borderRadius: '999px',
  background: color,
  transition: 'width 0.25s ease',
});

const labelRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.6rem',
  color: 'rgba(226, 232, 240, 0.9)',
  marginBottom: '0.15rem',
};

const statGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '0.3rem',
};

const statCardStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.55)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  borderRadius: '6px',
  padding: '0.3rem 0.4rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.05rem',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '0.55rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgba(148, 163, 184, 0.75)',
};

const statValueStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#f8fafc',
};

const skillSummaryContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.3rem',
  marginTop: '0rem',
};

const skillChipStyle = (accent: string): React.CSSProperties => ({
  padding: '0.2rem 0.45rem',
  borderRadius: '999px',
  border: `1px solid ${accent}`,
  background: 'rgba(15, 23, 42, 0.6)',
  color: accent,
  fontSize: '0.55rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
});

const actionButtonStyle = (active: boolean): React.CSSProperties => ({
  alignSelf: 'stretch',
  marginTop: '0.15rem',
  padding: '0.5rem 0.8rem',
  borderRadius: '8px',
  border: active ? '1px solid rgba(249, 115, 22, 0.75)' : '1px solid rgba(56, 189, 248, 0.55)',
  background: active
    ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.5), rgba(251, 191, 36, 0.5))'
    : 'linear-gradient(135deg, rgba(14, 165, 233, 0.45), rgba(56, 189, 248, 0.35))',
  color: active ? '#fff7ed' : '#e0f2fe',
  fontSize: '0.68rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textAlign: 'center',
  boxShadow: active
    ? '0 8px 16px rgba(249, 115, 22, 0.25)'
    : '0 8px 16px rgba(56, 189, 248, 0.25)',
});

const taglineStyle: React.CSSProperties = {
  fontSize: '0.55rem',
  color: 'rgba(148, 163, 184, 0.8)',
  letterSpacing: '0.03em',
  lineHeight: '1.3',
};

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

  const healthPercent = useMemo(() =>
    player.maxHealth > 0
      ? Math.max(0, Math.min(1, player.health / player.maxHealth)) * 100
      : 0,
    [player.health, player.maxHealth]
  );

  return (
    <div style={containerStyle} data-testid="player-summary-panel">
      <div style={headerStyle}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...nameStyle, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>{player.name}</span>
            <span style={levelBadgeStyle}>Level {player.level}</span>
          </div>
          <div style={{ fontSize: '0.58rem', color: 'rgba(148, 163, 184, 0.75)', letterSpacing: '0.06em', marginTop: '0.1rem' }}>
            {background?.name ?? 'Unaffiliated'}
          </div>
        </div>
      </div>

      <div>
        <div style={labelRowStyle}>
          <span>Health</span>
          <span>{player.health}/{player.maxHealth}</span>
        </div>
        <div style={barShellStyle}>
          <div style={barFillStyle('#22c55e', `${healthPercent}%`)} />
        </div>
      </div>

      <div style={statGridStyle}>
        <div style={statCardStyle}>
          <span style={statLabelStyle}>Skill Points</span>
          <span style={statValueStyle}>{player.skillPoints}</span>
        </div>
        <div style={statCardStyle}>
          <span style={statLabelStyle}>Attribute Points</span>
          <span style={statValueStyle}>{player.attributePoints}</span>
        </div>
        <div style={statCardStyle}>
          <span style={statLabelStyle}>Credits</span>
          <span style={statValueStyle}>{player.credits}</span>
        </div>
        <div style={statCardStyle}>
          <span style={statLabelStyle}>XP</span>
          <span style={statValueStyle}>{player.experience}</span>
        </div>
      </div>
      {branchTotals.length > 0 && (
        <div style={skillSummaryContainerStyle}>
          {branchTotals.slice(0, 4).map((summary) => (
            <span
              key={summary.id}
              style={skillChipStyle(branchAccent[summary.id] ?? '#38bdf8')}
            >
              {summary.label}: {summary.total}
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
        >
          {uiStrings.shell.characterButton}
        </button>
      )}
    </div>
  );
};

export default React.memo(PlayerSummaryPanel);
