import React from 'react';
import { ResolvedMissionObjective } from '../../game/interfaces/missions';

interface MissionCompleteModalProps {
  open: boolean;
  levelName: string;
  missionStrings: {
    accomplishedTitle: string;
    accomplishedSubtitle: (levelName: string) => string;
    primarySummaryLabel: string;
    continueCta: string;
    deferCta: string;
    deferHint: string;
    sideReminder: string;
  };
  primaryObjectives: ResolvedMissionObjective[];
  sideObjectives: ResolvedMissionObjective[];
  onContinue: () => void;
  onDefer: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--hud-color-overlay)',
  backdropFilter: 'var(--hud-overlay-blur)',
  zIndex: 20,
  padding: '1.5rem',
};

const shellStyle: React.CSSProperties = {
  width: 'min(520px, 92vw)',
  borderRadius: 'var(--hud-radius-lg)',
  border: '1px solid var(--hud-color-rule-active)',
  background: 'var(--hud-panel-gradient)',
  color: 'var(--hud-color-bone)',
  fontFamily: "'DM Mono', 'IBM Plex Mono', monospace",
  boxShadow: 'var(--shadow-overlay)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.2rem',
  padding: '2rem 2.2rem',
};

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
};

const buttonBaseStyle: React.CSSProperties = {
  all: 'unset',
  cursor: 'pointer',
  flex: 1,
  padding: '0.7rem 1.2rem',
  borderRadius: 'var(--radius-pill)',
  letterSpacing: '0.15em',
  fontSize: '0.72rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  textAlign: 'center',
  minWidth: 0,
};

const MissionCompleteModal: React.FC<MissionCompleteModalProps> = ({
  open,
  levelName,
  missionStrings,
  primaryObjectives,
  sideObjectives,
  onContinue,
  onDefer,
}) => {
  if (!open) {
    return null;
  }

  const completedPrimaryObjectives = primaryObjectives.filter((objective) => objective.isComplete);
  const remainingSideObjectives = sideObjectives.filter((objective) => !objective.isComplete);

  return (
    <div className="mission-complete" role="dialog" aria-modal="true" style={overlayStyle}>
      <div className="mission-complete__shell" style={shellStyle}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.28em',
              color: 'var(--hud-color-practical)',
              textTransform: 'uppercase',
            }}
          >
            {missionStrings.accomplishedTitle}
          </span>
          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              margin: 0,
            }}
          >
            {missionStrings.accomplishedSubtitle(levelName)}
          </h2>
        </header>
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div
            style={{
              border: '1px solid var(--hud-color-rule-active)',
              borderRadius: 'var(--hud-radius-md)',
              padding: '0.9rem 1.1rem',
              background: 'var(--hud-color-surface-inset)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
            }}
          >
            <span style={{ fontSize: '0.7rem', color: 'var(--hud-color-muted)' }}>
              {missionStrings.primarySummaryLabel}
            </span>
            {completedPrimaryObjectives.length === 0 ? (
              <span style={{ fontSize: '0.72rem', color: 'var(--hud-color-bone)' }}>—</span>
            ) : (
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                }}
              >
                {completedPrimaryObjectives.map((objective) => (
                  <li
                    key={objective.id}
                    style={{
                      display: 'flex',
                      gap: '0.55rem',
                      alignItems: 'flex-start',
                      fontSize: '0.74rem',
                      color: 'var(--hud-color-bone)',
                      lineHeight: 1.35,
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        width: '0.9rem',
                        height: '0.9rem',
                        borderRadius: 'var(--radius-pill)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--hud-color-practical)',
                        color: 'var(--hud-color-ink)',
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        border: '1px solid var(--hud-color-rule-active)',
                      }}
                    >
                      ✓
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                      <span style={{ fontWeight: 600 }}>{objective.label}</span>
                      {objective.summary && (
                        <span style={{ fontSize: '0.66rem', color: 'var(--hud-color-muted)' }}>{objective.summary}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div
            style={{
              border: '1px solid var(--hud-color-rule)',
              borderRadius: 'var(--hud-radius-md)',
              padding: '0.9rem 1.1rem',
              background: 'var(--hud-color-surface-inset)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
            }}
          >
            <span style={{ fontSize: '0.7rem', color: 'var(--hud-color-muted)' }}>
              {missionStrings.sideReminder}
            </span>
            {remainingSideObjectives.length === 0 ? (
              <span style={{ fontSize: '0.72rem', color: 'var(--hud-color-bone)' }}>
                —
              </span>
            ) : (
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '1.1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  fontSize: '0.72rem',
                  color: 'var(--hud-color-bone)',
                  listStyle: 'disc',
                }}
              >
                {remainingSideObjectives.map((objective) => (
                  <li key={objective.id}>{objective.label}</li>
                ))}
              </ul>
            )}
          </div>
          <span style={{ fontSize: '0.64rem', color: 'var(--hud-color-muted)' }}>
            {missionStrings.deferHint}
          </span>
        </section>
        <div style={buttonRowStyle}>
          <button
            type="button"
            data-testid="mission-complete-continue"
            onClick={onContinue}
            style={{
              ...buttonBaseStyle,
              border: '1px solid var(--hud-color-rule-active)',
              background: 'var(--hud-color-practical)',
              color: 'var(--hud-color-ink)',
              boxShadow: 'none',
            }}
          >
            {missionStrings.continueCta}
          </button>
          <button
            type="button"
            data-testid="mission-complete-defer"
            onClick={onDefer}
            style={{
              ...buttonBaseStyle,
              border: '1px solid var(--hud-color-rule)',
              background: 'var(--hud-color-surface-inset)',
              color: 'var(--hud-color-bone)',
            }}
          >
            {missionStrings.deferCta}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MissionCompleteModal;
