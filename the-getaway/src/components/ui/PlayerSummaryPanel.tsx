import React from 'react';
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
  gap: '0.75rem',
  padding: '0.75rem',
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
  fontSize: '0.95rem',
  fontWeight: 700,
  color: '#f8fafc',
  letterSpacing: '0.04em',
};

const levelBadgeStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  textTransform: 'uppercase',
  padding: '0.25rem 0.5rem',
  borderRadius: '999px',
  border: '1px solid rgba(56, 189, 248, 0.4)',
  background: 'rgba(14, 165, 233, 0.15)',
  color: '#bae6fd',
  letterSpacing: '0.12em',
};

const barShellStyle: React.CSSProperties = {
  width: '100%',
  height: '0.5rem',
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
  fontSize: '0.65rem',
  color: 'rgba(226, 232, 240, 0.9)',
};

const statGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '0.5rem',
};

const statCardStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.55)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  borderRadius: '8px',
  padding: '0.55rem 0.65rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.2rem',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '0.6rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'rgba(148, 163, 184, 0.75)',
};

const statValueStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  fontWeight: 600,
  color: '#f8fafc',
};

const skillSummaryContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.4rem',
  marginTop: '0.1rem',
};

const skillChipStyle = (accent: string): React.CSSProperties => ({
  padding: '0.25rem 0.55rem',
  borderRadius: '999px',
  border: `1px solid ${accent}`,
  background: 'rgba(15, 23, 42, 0.6)',
  color: accent,
  fontSize: '0.62rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
});

const actionButtonStyle = (active: boolean): React.CSSProperties => ({
  alignSelf: 'flex-start',
  marginTop: '0.35rem',
  padding: '0.45rem 0.9rem',
  borderRadius: '999px',
  border: active ? '1px solid rgba(249, 115, 22, 0.65)' : '1px solid rgba(56, 189, 248, 0.45)',
  background: active
    ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.4), rgba(251, 191, 36, 0.4))'
    : 'linear-gradient(135deg, rgba(14, 165, 233, 0.35), rgba(56, 189, 248, 0.25))',
  color: active ? '#fff7ed' : '#e0f2fe',
  fontSize: '0.65rem',
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
});

const taglineStyle: React.CSSProperties = {
  fontSize: '0.62rem',
  color: 'rgba(148, 163, 184, 0.8)',
  letterSpacing: '0.05em',
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
  const branchTotals = SKILL_BRANCHES.map((branch) => {
    const total = branch.skills.reduce((acc, skill) => acc + (player.skillTraining[skill.id] ?? 0), 0);
    return { id: branch.id, label: branch.label, total };
  }).filter((entry) => entry.total > 0);

  branchTotals.sort((a, b) => b.total - a.total);

  const branchAccent: Record<string, string> = {
    combat: '#f97316',
    tech: '#38bdf8',
    survival: '#34d399',
    social: '#c084fc',
  };

  const healthPercent = player.maxHealth > 0
    ? Math.max(0, Math.min(1, player.health / player.maxHealth)) * 100
    : 0;

  const apPercent = player.maxActionPoints > 0
    ? Math.max(0, Math.min(1, player.actionPoints / player.maxActionPoints)) * 100
    : 0;

  return (
    <div style={containerStyle} data-testid="player-summary-panel">
      <div style={headerStyle}>
        <div>
          <div style={nameStyle}>{player.name}</div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(148, 163, 184, 0.75)', letterSpacing: '0.08em' }}>
            {background?.name ?? 'Unaffiliated'}
          </div>
          <div style={taglineStyle}>{background?.tagline ?? 'Independent operative on call.'}</div>
        </div>
        <div style={levelBadgeStyle}>Level {player.level}</div>
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

      <div>
        <div style={labelRowStyle}>
          <span>Action Points</span>
          <span>{player.actionPoints}/{player.maxActionPoints}</span>
        </div>
        <div style={barShellStyle}>
          <div style={barFillStyle('#38bdf8', `${apPercent}%`)} />
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

export default PlayerSummaryPanel;
