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
  background: 'var(--hud-color-overlay)',
  backdropFilter: 'var(--hud-overlay-blur)',
  zIndex: 21,
  padding: '1.5rem',
};

const shellStyle: React.CSSProperties = {
  width: 'min(520px, 92vw)',
  borderRadius: 'var(--hud-radius-lg)',
  border: '1px solid var(--hud-color-threat)',
  background: 'var(--hud-panel-gradient)',
  color: 'var(--hud-color-bone)',
  fontFamily: "'DM Mono', 'IBM Plex Mono', monospace",
  boxShadow: 'var(--shadow-overlay)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.2rem',
  padding: '2rem 2.2rem',
};

const panelStyle: React.CSSProperties = {
  border: '1px solid var(--hud-color-rule)',
  borderRadius: 'var(--hud-radius-md)',
  padding: '0.9rem 1.1rem',
  background: 'var(--hud-color-surface-inset)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
};

const retryButtonStyle: React.CSSProperties = {
  all: 'unset',
  cursor: 'pointer',
  padding: '0.72rem 1.2rem',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid var(--hud-color-threat)',
  background: 'var(--hud-color-threat)',
  boxShadow: 'none',
  color: 'var(--hud-color-ink)',
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
    <div className="mission-failure" role="dialog" aria-modal="true" style={overlayStyle}>
      <div className="mission-failure__shell" style={shellStyle}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.28em',
              color: 'var(--hud-color-threat)',
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
            <span style={{ fontSize: '0.7rem', color: 'var(--hud-color-muted)' }}>
              {missionStrings.failedSummaryLabel}
            </span>
            {primaryObjectives.length === 0 ? (
              <span style={{ fontSize: '0.72rem', color: 'var(--hud-color-bone)' }}>
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
                  <li key={objective.id} style={{ fontSize: '0.74rem', color: 'var(--hud-color-bone)' }}>
                    {missionStrings.failedClearedPrefix}: {objective.label}
                  </li>
                ))}
                {remainingPrimaryObjectives.map((objective) => (
                  <li key={objective.id} style={{ fontSize: '0.74rem', color: 'var(--hud-color-bone)' }}>
                    {missionStrings.failedRemainingPrefix}: {objective.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={panelStyle}>
            <span style={{ fontSize: '0.7rem', color: 'var(--hud-color-muted)' }}>
              {missionStrings.failedPressureLabel}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--hud-color-bone)', lineHeight: 1.45 }}>
              {missionStrings.failedPressureSummary({
                tier: paranoiaTier.replace(/_/g, ' '),
                value: Math.round(paranoiaValue),
              })}
            </span>
          </div>

          <span style={{ fontSize: '0.64rem', color: 'var(--hud-color-muted)' }}>
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
