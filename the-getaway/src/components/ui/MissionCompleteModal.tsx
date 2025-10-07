import React from 'react';
import { ResolvedMissionObjective } from '../../game/interfaces/missions';

interface MissionCompleteModalProps {
  open: boolean;
  levelName: string;
  missionStrings: {
    accomplishedTitle: string;
    accomplishedSubtitle: (levelName: string) => string;
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
  background: 'rgba(15, 23, 42, 0.86)',
  backdropFilter: 'blur(6px)',
  zIndex: 20,
  padding: '1.5rem',
};

const shellStyle: React.CSSProperties = {
  width: 'min(520px, 92vw)',
  borderRadius: '18px',
  border: '1px solid rgba(94, 234, 212, 0.2)',
  background: 'linear-gradient(135deg, rgba(6, 15, 28, 0.95), rgba(13, 31, 48, 0.92))',
  color: '#f8fafc',
  fontFamily: "'DM Mono', 'IBM Plex Mono', monospace",
  boxShadow: '0 40px 68px rgba(2, 6, 23, 0.55)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.2rem',
  padding: '2rem 2.2rem',
};

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.75rem',
};

const MissionCompleteModal: React.FC<MissionCompleteModalProps> = ({
  open,
  levelName,
  missionStrings,
  sideObjectives,
  onContinue,
  onDefer,
}) => {
  if (!open) {
    return null;
  }

  const remainingSideObjectives = sideObjectives.filter((objective) => !objective.isComplete);

  return (
    <div role="dialog" aria-modal="true" style={overlayStyle}>
      <div style={shellStyle}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.28em',
              color: 'rgba(94, 234, 212, 0.75)',
              textTransform: 'uppercase',
            }}
          >
            {missionStrings.accomplishedTitle}
          </span>
          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              margin: 0,
            }}
          >
            {missionStrings.accomplishedSubtitle(levelName)}
          </h2>
        </header>
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div
            style={{
              border: '1px solid rgba(148, 163, 184, 0.22)',
              borderRadius: '14px',
              padding: '0.9rem 1.1rem',
              background: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
            }}
          >
            <span style={{ fontSize: '0.7rem', color: 'rgba(148, 163, 184, 0.78)' }}>
              {missionStrings.sideReminder}
            </span>
            {remainingSideObjectives.length === 0 ? (
              <span style={{ fontSize: '0.72rem', color: 'rgba(226, 232, 240, 0.88)' }}>
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
                  color: 'rgba(226, 232, 240, 0.88)',
                  listStyle: 'disc',
                }}
              >
                {remainingSideObjectives.map((objective) => (
                  <li key={objective.id}>{objective.label}</li>
                ))}
              </ul>
            )}
          </div>
          <span style={{ fontSize: '0.64rem', color: 'rgba(148, 163, 184, 0.65)' }}>
            {missionStrings.deferHint}
          </span>
        </section>
        <div style={buttonRowStyle}>
          <button
            type="button"
            onClick={onContinue}
            style={{
              all: 'unset',
              cursor: 'pointer',
              padding: '0.65rem 1.4rem',
              borderRadius: '999px',
              border: '1px solid rgba(94, 234, 212, 0.5)',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.7), rgba(94, 234, 212, 0.65))',
              color: '#02111f',
              letterSpacing: '0.15em',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              boxShadow: '0 20px 36px rgba(13, 148, 136, 0.35)',
            }}
          >
            {missionStrings.continueCta}
          </button>
          <button
            type="button"
            onClick={onDefer}
            style={{
              all: 'unset',
              cursor: 'pointer',
              padding: '0.6rem 1.25rem',
              borderRadius: '999px',
              border: '1px solid rgba(148, 163, 184, 0.45)',
              background: 'rgba(15, 23, 42, 0.75)',
              color: 'rgba(226, 232, 240, 0.9)',
              letterSpacing: '0.12em',
              fontSize: '0.7rem',
              textTransform: 'uppercase',
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
