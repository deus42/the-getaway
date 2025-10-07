import missionReducer, {
  missionAccomplished,
  deferMissionAdvance,
  showMissionAdvancePrompt,
  advanceToNextLevel,
  MissionState,
} from '../store/missionSlice';

describe('missionSlice reducers', () => {
  const baseState: MissionState = {
    levels: [
      {
        level: 0,
        levelId: 'level-0',
        name: 'Slum Perimeter',
        objectives: [
          {
            id: 'primary-cache',
            label: 'Recover cache crates',
            summary: 'Retrieve confiscated supplies.',
            questIds: ['quest_cache'],
            kind: 'primary',
          },
        ],
      },
      {
        level: 1,
        levelId: 'level-1',
        name: 'Transit Hub',
        objectives: [],
      },
    ],
    currentLevelIndex: 0,
    pendingAdvance: false,
    celebrationAcknowledged: false,
    lastMissionCompletedAt: null,
  };

  it('marks mission accomplished and allows defer/reopen flow', () => {
    const accomplished = missionReducer(baseState, missionAccomplished());
    expect(accomplished.pendingAdvance).toBe(true);
    expect(accomplished.celebrationAcknowledged).toBe(false);
    expect(accomplished.lastMissionCompletedAt).not.toBeNull();

    const deferred = missionReducer(accomplished, deferMissionAdvance());
    expect(deferred.pendingAdvance).toBe(true);
    expect(deferred.celebrationAcknowledged).toBe(true);

    const reopened = missionReducer(deferred, showMissionAdvancePrompt());
    expect(reopened.celebrationAcknowledged).toBe(false);
  });

  it('advances to the next level and resets flags', () => {
    const accomplished = missionReducer(baseState, missionAccomplished());
    const advanced = missionReducer(accomplished, advanceToNextLevel());

    expect(advanced.currentLevelIndex).toBe(1);
    expect(advanced.pendingAdvance).toBe(false);
    expect(advanced.celebrationAcknowledged).toBe(false);
  });
});
