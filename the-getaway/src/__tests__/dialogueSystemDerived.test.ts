import { describe, test, expect } from '@jest/globals';
import { DEFAULT_PLAYER } from '../game/interfaces/player';
import { DialogueOption } from '../game/interfaces/types';
import { checkSkillRequirement } from '../game/quests/dialogueSystem';

describe('Dialogue system derived stat integration', () => {
  test('charisma dialogue bonus applies to skill checks', () => {
    const player = {
      ...DEFAULT_PLAYER,
      skills: {
        ...DEFAULT_PLAYER.skills,
        charisma: 6,
      },
    };

    const option: DialogueOption = {
      text: 'Persuade the guard',
      nextNodeId: null,
      skillCheck: {
        skill: 'charisma',
        threshold: 8,
      },
    };

    expect(checkSkillRequirement(player, option)).toBe(true);
  });

  test('skill check fails when requirement exceeds bonus-adjusted attribute', () => {
    const player = {
      ...DEFAULT_PLAYER,
      skills: {
        ...DEFAULT_PLAYER.skills,
        charisma: 3,
      },
    };

    const option: DialogueOption = {
      text: 'Convince the officer',
      nextNodeId: null,
      skillCheck: {
        skill: 'charisma',
        threshold: 12,
      },
    };

    expect(checkSkillRequirement(player, option)).toBe(false);
  });
});
