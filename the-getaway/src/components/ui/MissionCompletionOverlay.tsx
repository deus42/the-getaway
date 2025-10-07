import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUIStrings } from '../../content/ui';
import MissionCompleteModal from './MissionCompleteModal';
import {
  selectMissionCelebrationAcknowledged,
  selectMissionPendingAdvance,
  selectMissionProgress,
} from '../../store/selectors/missionSelectors';
import {
  advanceToNextLevel,
  deferMissionAdvance,
  showMissionAdvancePrompt,
} from '../../store/missionSlice';
import { emitLevelAdvanceRequestedEvent } from '../../game/systems/missionProgression';
import { AppDispatch, RootState } from '../../store';

const toastStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '1.5rem',
  right: '1.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(6, 18, 31, 0.9))',
  border: '1px solid rgba(94, 234, 212, 0.28)',
  borderRadius: '14px',
  padding: '0.75rem 1rem',
  boxShadow: '0 22px 42px rgba(2, 8, 20, 0.45)',
  fontFamily: "'DM Mono', 'IBM Plex Mono', monospace",
  zIndex: 15,
};

const toastButtonStyle: React.CSSProperties = {
  all: 'unset',
  cursor: 'pointer',
  padding: '0.45rem 0.9rem',
  borderRadius: '999px',
  border: '1px solid rgba(94, 234, 212, 0.45)',
  background: 'rgba(15, 118, 110, 0.22)',
  color: '#5eead4',
  letterSpacing: '0.16em',
  fontSize: '0.62rem',
  textTransform: 'uppercase',
};

const MissionCompletionOverlay: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const locale = useSelector((state: RootState) => state.settings.locale);
  const missionProgress = useSelector(selectMissionProgress);
  const missionState = useSelector((state: RootState) => state.missions);
  const pendingAdvance = useSelector(selectMissionPendingAdvance);
  const celebrationAcknowledged = useSelector(selectMissionCelebrationAcknowledged);
  const uiStrings = getUIStrings(locale);

  const modalOpen = pendingAdvance && !celebrationAcknowledged;
  const nextLevel = missionState.levels[missionState.currentLevelIndex + 1];

  const handleContinue = () => {
    if (!missionProgress) {
      return;
    }

    emitLevelAdvanceRequestedEvent({
      level: missionProgress.level,
      levelId: missionProgress.levelId,
      name: missionProgress.name,
      nextLevel: nextLevel?.level ?? missionProgress.level + 1,
      nextLevelId: nextLevel?.levelId,
    });

    dispatch(advanceToNextLevel());
  };

  const handleDefer = () => {
    dispatch(deferMissionAdvance());
  };

  const handleReopen = () => {
    dispatch(showMissionAdvancePrompt());
  };

  return (
    <>
      <MissionCompleteModal
        open={modalOpen}
        levelName={missionProgress?.name ?? 'Current Sector'}
        missionStrings={uiStrings.mission}
        primaryObjectives={missionProgress?.primary ?? []}
        sideObjectives={missionProgress?.side ?? []}
        onContinue={handleContinue}
        onDefer={handleDefer}
      />
      {pendingAdvance && celebrationAcknowledged && (
        <div style={toastStyle} role="status" aria-live="polite">
          <span style={{ fontSize: '0.64rem', color: 'rgba(226, 232, 240, 0.9)' }}>
            {uiStrings.levelIndicator.primaryCompleteFootnote}
          </span>
          <button type="button" onClick={handleReopen} style={toastButtonStyle}>
            {uiStrings.levelIndicator.missionReadyBadge}
          </button>
        </div>
      )}
    </>
  );
};

export default MissionCompletionOverlay;
