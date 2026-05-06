import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getUIStrings } from '../../content/ui';
import { RootState } from '../../store';
import { selectStartedMissionProgress } from '../../store/selectors/missionSelectors';
import { selectParanoiaTier, selectParanoiaValue } from '../../store/selectors/paranoiaSelectors';
import { playLevel0FeedbackCue } from '../../game/feedback/audioCues';

interface MissionFailureOverlayProps {
  open: boolean;
  onRetry: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(13, 10, 15, 0.91)',
  backdropFilter: 'blur(6px)',
  zIndex: 21,
  padding: '1.5rem',
};

const shellStyle: React.CSSProperties = {
  width: 'min(520px, 92vw)',
  borderRadius: '16px',
  border: '1px solid rgba(248, 113, 113, 0.42)',
  background: 'linear-gradient(135deg, rgba(32, 12, 18, 0.97), rgba(17, 24, 39, 0.95))',
  color: '#f8fafc',
  fontFamily: "'DM Mono', 'IBM Plex Mono', monospace",
  boxShadow: '0 40px 68px rgba(2, 6, 23, 0.6), 0 0 34px rgba(248, 113, 113, 0.12)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.2rem',
  padding: '2rem 2.2rem',
};

const panelStyle: React.CSSProperties = {
  border: '1px solid rgba(148, 163, 184, 0.22)',
  borderRadius: '12px',
  padding: '0.9rem 1.1rem',
  background: 'rgba(15, 23, 42, 0.68)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
};

const retryButtonStyle: React.CSSProperties = {
  all: 'unset',
  cursor: 'pointer',
  padding: '0.72rem 1.2rem',
  borderRadius: '999px',
  border: '1px solid rgba(248, 113, 113, 0.55)',
  background: 'linear-gradient(135deg, rgba(248, 113, 113, 0.78), rgba(251, 146, 60, 0.66))',
  boxShadow: '0 20px 36px rgba(127, 29, 29, 0.35)',
  color: '#1f0a0a',
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  textAlign: 'center',
};

const MissionFailureOverlay: React.FC<MissionFailureOverlayProps> = ({ open, onRetry }) => {
  const locale = useSelector((state: RootState) => state.settings.locale);
  const missionProgress = useSelector(selectStartedMissionProgress);
  const currentArea = useSelector((state: RootState) => state.world.currentMapArea);
  const paranoiaValue = useSelector(selectParanoiaValue);
  const paranoiaTier = useSelector(selectParanoiaTier);
  const missionStrings = getUIStrings(locale).mission;
  const playedCueRef = useRef(false);

  useEffect(() => {
    if (!open) {
      playedCueRef.current = false;
      return;
    }
    if (!playedCueRef.current) {
      playLevel0FeedbackCue('invalid');
      playedCueRef.current = true;
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const levelName =
    missionProgress?.name ?? currentArea?.displayName ?? currentArea?.name ?? 'Level 0';
  const primaryObjectives = missionProgress?.primary ?? [];
  const completedPrimaryObjectives = primaryObjectives.filter((objective) => objective.isComplete);
  const remainingPrimaryObjectives = primaryObjectives.filter((objective) => !objective.isComplete);

  return (
    <div role="dialog" aria-modal="true" style={overlayStyle}>
      <div style={shellStyle}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.28em',
              color: 'rgba(248, 113, 113, 0.82)',
              textTransform: 'uppercase',
            }}
          >
            {missionStrings.failedTitle}
          </span>
          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              margin: 0,
            }}
          >
            {missionStrings.failedSubtitle(levelName)}
          </h2>
        </header>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={panelStyle}>
            <span style={{ fontSize: '0.7rem', color: 'rgba(148, 163, 184, 0.78)' }}>
              {missionStrings.failedSummaryLabel}
            </span>
            {primaryObjectives.length === 0 ? (
              <span style={{ fontSize: '0.72rem', color: 'rgba(226, 232, 240, 0.86)' }}>
                {missionStrings.failedNoObjective}
              </span>
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
                  <li key={objective.id} style={{ fontSize: '0.74rem', color: 'rgba(226, 232, 240, 0.9)' }}>
                    {missionStrings.failedClearedPrefix}: {objective.label}
                  </li>
                ))}
                {remainingPrimaryObjectives.map((objective) => (
                  <li key={objective.id} style={{ fontSize: '0.74rem', color: 'rgba(226, 232, 240, 0.9)' }}>
                    {missionStrings.failedRemainingPrefix}: {objective.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={panelStyle}>
            <span style={{ fontSize: '0.7rem', color: 'rgba(148, 163, 184, 0.78)' }}>
              {missionStrings.failedPressureLabel}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'rgba(226, 232, 240, 0.88)', lineHeight: 1.45 }}>
              {missionStrings.failedPressureSummary({
                tier: paranoiaTier.replace(/_/g, ' '),
                value: Math.round(paranoiaValue),
              })}
            </span>
          </div>

          <span style={{ fontSize: '0.64rem', color: 'rgba(148, 163, 184, 0.68)' }}>
            {missionStrings.failedRetryHint}
          </span>
        </section>

        <button type="button" onClick={onRetry} style={retryButtonStyle}>
          {missionStrings.retryCta}
        </button>
      </div>
    </div>
  );
};

export default MissionFailureOverlay;
