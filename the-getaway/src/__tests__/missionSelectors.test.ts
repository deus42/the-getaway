import {
  selectMissionProgress,
  selectAllPrimaryObjectivesComplete,
  selectNextPrimaryObjective,
  selectNextSideObjective,
} from '../store/selectors/missionSelectors';
import type { RootState } from '../store';
import { MissionState } from '../store/missionSlice';
import { Quest } from '../game/interfaces/types';

const buildState = ({ missions, quests }: { missions: MissionState; quests: Quest[] }) => ({
  missions,
  quests: {
    quests,
    dialogues: [],
    activeDialogue: { dialogueId: null, currentNodeId: null },
    lastBriefing: { dialogueId: null, nodeId: null },
  },
}) as unknown as RootState;

const createMissionState = (): MissionState => ({
  levels: [
    {
      level: 0,
      levelId: 'level-0',
      name: 'Slum Perimeter',
      objectives: [
        {
          id: 'primary-cache',
          label: 'Recover seized cache crates',
          summary: 'Reclaim the confiscated supplies.',
          questIds: ['quest_cache'],
          kind: 'primary',
        },
        {
          id: 'primary-datapad',
          label: 'Return encrypted datapad',
          summary: 'Deliver intel to Archivist Naila.',
          questIds: ['quest_datapad'],
          kind: 'primary',
        },
        {
          id: 'side-drones',
          label: 'Shadow drone patrols',
          summary: 'Log three patrol loops.',
          questIds: ['quest_drones'],
          kind: 'side',
        },
      ],
    },
  ],
  currentLevelIndex: 0,
  pendingAdvance: false,
  celebrationAcknowledged: false,
  lastMissionCompletedAt: null,
});

describe('mission selectors', () => {
  it('resolves mission progress with quest completion state', () => {
    const missions = createMissionState();
    const quests: Quest[] = [
      {
        id: 'quest_cache',
        name: 'Cache Retrieval',
        description: 'Bring the cache home.',
        isActive: true,
        isCompleted: false,
        objectives: [
          {
            id: 'recover',
            description: 'Recover cache crates',
            isCompleted: false,
            type: 'collect',
            target: 'Cache crates',
            count: 1,
            currentCount: 0,
          },
        ],
        rewards: [],
      },
      {
        id: 'quest_datapad',
        name: 'Encrypted Intel',
        description: 'Deliver the datapad',
        isActive: true,
        isCompleted: true,
        objectives: [
          {
            id: 'deliver',
            description: 'Deliver the datapad',
            isCompleted: true,
            type: 'talk',
            target: 'Naila',
          },
        ],
        rewards: [],
      },
      {
        id: 'quest_drones',
        name: 'Drone Recon',
        description: 'Track drone loops',
        isActive: true,
        isCompleted: false,
        objectives: [
          {
            id: 'observe',
            description: 'Observe patrols',
            isCompleted: false,
            type: 'explore',
            target: 'Drone Patrol',
            count: 3,
            currentCount: 1,
          },
        ],
        rewards: [],
      },
    ];

    const state = buildState({ missions, quests });
    const progress = selectMissionProgress(state)!;

    expect(progress.primary).toHaveLength(2);
    expect(progress.primary[0].isComplete).toBe(false);
    expect(progress.primary[1].isComplete).toBe(true);
    expect(progress.side[0].completedQuests).toBe(0);
    expect(progress.side[0].totalQuests).toBe(1);
  });

  it('detects next objectives and mission completion state', () => {
    const missions = createMissionState();
    const quests: Quest[] = [
      {
        id: 'quest_cache',
        name: 'Cache Retrieval',
        description: 'Bring the cache home.',
        isActive: true,
        isCompleted: true,
        objectives: [
          {
            id: 'recover',
            description: 'Recover cache crates',
            isCompleted: true,
            type: 'collect',
            target: 'Cache crates',
            count: 1,
            currentCount: 1,
          },
        ],
        rewards: [],
      },
      {
        id: 'quest_datapad',
        name: 'Encrypted Intel',
        description: 'Deliver the datapad',
        isActive: true,
        isCompleted: true,
        objectives: [
          {
            id: 'deliver',
            description: 'Deliver the datapad',
            isCompleted: true,
            type: 'talk',
            target: 'Naila',
          },
        ],
        rewards: [],
      },
      {
        id: 'quest_drones',
        name: 'Drone Recon',
        description: 'Track drone loops',
        isActive: true,
        isCompleted: false,
        objectives: [
          {
            id: 'observe',
            description: 'Observe patrols',
            isCompleted: false,
            type: 'explore',
            target: 'Drone Patrol',
            count: 3,
            currentCount: 1,
          },
        ],
        rewards: [],
      },
    ];

    const state = buildState({ missions, quests });

    expect(selectAllPrimaryObjectivesComplete(state)).toBe(true);
    expect(selectNextPrimaryObjective(state)).toBeNull();
    const nextSide = selectNextSideObjective(state);
    expect(nextSide?.label).toBe('Shadow drone patrols');
  });

  it('treats quests with finished sub-objectives as complete even if turn-in is pending', () => {
    const missions = createMissionState();
    const quests: Quest[] = [
      {
        id: 'quest_cache',
        name: 'Cache Retrieval',
        description: 'Bring the cache home.',
        isActive: true,
        isCompleted: false,
        objectives: [
          {
            id: 'recover',
            description: 'Recover cache crates',
            isCompleted: true,
            type: 'collect',
            target: 'Cache crates',
            count: 1,
            currentCount: 1,
          },
        ],
        rewards: [],
      },
      {
        id: 'quest_datapad',
        name: 'Encrypted Intel',
        description: 'Deliver the datapad',
        isActive: true,
        isCompleted: false,
        objectives: [
          {
            id: 'deliver',
            description: 'Deliver the datapad',
            isCompleted: true,
            type: 'talk',
            target: 'Naila',
          },
        ],
        rewards: [],
      },
      {
        id: 'quest_drones',
        name: 'Drone Recon',
        description: 'Track drone loops',
        isActive: true,
        isCompleted: false,
        objectives: [
          {
            id: 'observe',
            description: 'Observe patrols',
            isCompleted: false,
            type: 'explore',
            target: 'Drone Patrol',
            count: 3,
            currentCount: 1,
          },
        ],
        rewards: [],
      },
    ];

    const state = buildState({ missions, quests });
    const progress = selectMissionProgress(state)!;

    expect(progress.primary[0].isComplete).toBe(true);
    expect(progress.primary[1].isComplete).toBe(true);
    expect(progress.primary[0].completedQuests).toBe(1);
    expect(progress.primary[1].completedQuests).toBe(1);
  });
});
