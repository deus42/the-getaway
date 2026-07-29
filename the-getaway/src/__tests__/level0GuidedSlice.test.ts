import { describe, expect, it } from '@jest/globals';
import type { Quest } from '../game/interfaces/types';
import {
  getLevel0GuidedStep,
  LEVEL0_GUIDED_ITEM_KEYS,
  LEVEL0_GUIDED_QUEST_IDS,
  resolveLevel0GuidedContactMarkerState,
  resolveLevel0GuidedItemMarkerState,
} from '../game/quests/level0GuidedSlice';

const quest = (
  id: string,
  isActive: boolean,
  isCompleted: boolean,
  completedObjectives: string[] = []
): Quest => ({
  id,
  name: id,
  description: id,
  isActive,
  isCompleted,
  rewards: [],
  objectives: [
    {
      id: id === LEVEL0_GUIDED_QUEST_IDS.courierNetwork ? 'find-transit-tokens' : 'recover-keycard',
      description: 'collect',
      isCompleted: completedObjectives.includes(
        id === LEVEL0_GUIDED_QUEST_IDS.courierNetwork ? 'find-transit-tokens' : 'recover-keycard'
      ),
      type: 'collect',
      target: 'target',
    },
  ],
});

describe('level0 guided item marker state', () => {
  it('marks only the current guided pickup as the main world target', () => {
    const step = getLevel0GuidedStep([
      quest(LEVEL0_GUIDED_QUEST_IDS.liraCache, true, false),
      quest(LEVEL0_GUIDED_QUEST_IDS.datapadTruth, false, false),
      quest(LEVEL0_GUIDED_QUEST_IDS.courierNetwork, false, false),
    ]);

    expect(resolveLevel0GuidedItemMarkerState(
      { resourceKey: LEVEL0_GUIDED_ITEM_KEYS.keycard },
      step
    )).toBe('current');
    expect(resolveLevel0GuidedItemMarkerState(
      { resourceKey: LEVEL0_GUIDED_ITEM_KEYS.datapad },
      step
    )).toBe('future');
    expect(resolveLevel0GuidedItemMarkerState(
      { resourceKey: 'items.abandoned_medkit' },
      step
    )).toBe('other');
  });

  it('keeps guided pickups dimmed while the next contact is the current target', () => {
    const step = getLevel0GuidedStep([
      quest(LEVEL0_GUIDED_QUEST_IDS.liraCache, false, true, ['recover-keycard']),
      quest(LEVEL0_GUIDED_QUEST_IDS.datapadTruth, false, false),
      quest(LEVEL0_GUIDED_QUEST_IDS.courierNetwork, false, false),
    ]);

    expect(step.stage).toBe('naila-start');
    expect(resolveLevel0GuidedItemMarkerState(
      { resourceKey: LEVEL0_GUIDED_ITEM_KEYS.datapad },
      step
    )).toBe('future');
  });

  it('marks only the current guided contact as the main world route target', () => {
    const step = getLevel0GuidedStep([
      quest(LEVEL0_GUIDED_QUEST_IDS.liraCache, false, true, ['recover-keycard']),
      quest(LEVEL0_GUIDED_QUEST_IDS.datapadTruth, false, false),
      quest(LEVEL0_GUIDED_QUEST_IDS.courierNetwork, false, false),
    ]);

    expect(step.stage).toBe('naila-start');
    expect(resolveLevel0GuidedContactMarkerState(
      { dialogueId: 'npc_archivist_naila' },
      step
    )).toBe('current');
    expect(resolveLevel0GuidedContactMarkerState(
      { dialogueId: 'npc_lira_vendor' },
      step
    )).toBe('other');
  });
});
