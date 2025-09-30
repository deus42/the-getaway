import { PlayerSkills } from './types';

export type PlayerStatKey = keyof PlayerSkills;

export type PlayerStatFocus =
  | 'combat'
  | 'perception'
  | 'survival'
  | 'social'
  | 'intellect'
  | 'mobility'
  | 'fortuity';

export interface PlayerStatDefinition {
  key: PlayerStatKey;
  abbreviation: string;
  min: number;
  max: number;
  focus: PlayerStatFocus;
}

export interface PlayerStatProfileEntry {
  key: PlayerStatKey;
  abbreviation: string;
  value: number;
  min: number;
  max: number;
  normalized: number;
  focus: PlayerStatFocus;
}

export const PLAYER_STAT_DEFINITIONS: Record<PlayerStatKey, PlayerStatDefinition> = {
  strength: {
    key: 'strength',
    abbreviation: 'STR',
    min: 1,
    max: 10,
    focus: 'combat',
  },
  perception: {
    key: 'perception',
    abbreviation: 'PER',
    min: 1,
    max: 10,
    focus: 'perception',
  },
  endurance: {
    key: 'endurance',
    abbreviation: 'END',
    min: 1,
    max: 10,
    focus: 'survival',
  },
  charisma: {
    key: 'charisma',
    abbreviation: 'CHA',
    min: 1,
    max: 10,
    focus: 'social',
  },
  intelligence: {
    key: 'intelligence',
    abbreviation: 'INT',
    min: 1,
    max: 10,
    focus: 'intellect',
  },
  agility: {
    key: 'agility',
    abbreviation: 'AGI',
    min: 1,
    max: 10,
    focus: 'mobility',
  },
  luck: {
    key: 'luck',
    abbreviation: 'LCK',
    min: 1,
    max: 10,
    focus: 'fortuity',
  },
};

const clamp = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) {
    return min;
  }

  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
};

export const buildPlayerStatProfile = (
  skills: PlayerSkills
): PlayerStatProfileEntry[] => {
  return (Object.keys(PLAYER_STAT_DEFINITIONS) as PlayerStatKey[]).map((key) => {
    const definition = PLAYER_STAT_DEFINITIONS[key];
    const rawValue = skills[key];
    const value = clamp(rawValue, definition.min, definition.max);
    const span = Math.max(1, definition.max - definition.min);
    const normalized = (value - definition.min) / span;

    return {
      key,
      abbreviation: definition.abbreviation,
      value,
      min: definition.min,
      max: definition.max,
      normalized,
      focus: definition.focus,
    };
  });
};
