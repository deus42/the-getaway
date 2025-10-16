import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
import { selectMissionPendingAdvance, selectMissionProgress } from '../../store/selectors/missionSelectors';
import { missionAccomplished } from '../../store/missionSlice';
import { triggerStorylet } from '../../store/storyletSlice';
import { emitMissionAccomplishedEvent } from '../../game/systems/missionProgression';

export const MissionProgressionManager: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const missionProgress = useSelector(selectMissionProgress);
  const pendingAdvance = useSelector(selectMissionPendingAdvance);
  const primaryCompleteRef = useRef(false);
  const broadcastRef = useRef(false);

  useEffect(() => {
    const primaryComplete = missionProgress?.allPrimaryComplete ?? false;

    if (primaryComplete && !primaryCompleteRef.current && !pendingAdvance) {
      dispatch(missionAccomplished());
    }

    primaryCompleteRef.current = primaryComplete;
  }, [missionProgress?.allPrimaryComplete, pendingAdvance, dispatch]);

  useEffect(() => {
    if (!missionProgress) {
      broadcastRef.current = false;
      return;
    }

    if (pendingAdvance && !broadcastRef.current) {
      emitMissionAccomplishedEvent({
        level: missionProgress.level,
        levelId: missionProgress.levelId,
        name: missionProgress.name,
      });
      dispatch(
        triggerStorylet({
          type: 'missionCompletion',
          missionId: missionProgress.levelId,
        })
      );
      broadcastRef.current = true;
    }

    if (!pendingAdvance) {
      broadcastRef.current = false;
    }
  }, [dispatch, pendingAdvance, missionProgress]);

  return null;
};

export default MissionProgressionManager;
