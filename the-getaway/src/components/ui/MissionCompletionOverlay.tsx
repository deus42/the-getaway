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
} from '../../store/missionSlice';
import { emitLevelAdvanceRequestedEvent } from '../../game/systems/missionProgression';
import { AppDispatch, RootState } from '../../store';

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

  return (
    <MissionCompleteModal
      open={modalOpen}
      levelName={missionProgress?.name ?? 'Current Sector'}
      missionStrings={uiStrings.mission}
      primaryObjectives={missionProgress?.primary ?? []}
      sideObjectives={missionProgress?.side ?? []}
      onContinue={handleContinue}
      onDefer={handleDefer}
    />
  );
};

export default MissionCompletionOverlay;
