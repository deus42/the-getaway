import {
  LEVEL0_DEFAULT_PLAYER_APPEARANCE_ID,
  isLevel0PlayerAppearanceId,
  type Level0PlayerAppearanceId,
} from '../../../content/characters/spriteManifest';
import type {
  AttributeKey,
  Level0CreationDraft,
  Level0CreationErrorId,
  Level0CreationValidation,
  PlayerBuild,
  PlayerIdentity,
  SkillKey,
} from './types';

export const ATTRIBUTE_KEYS = [
  'physical',
  'mental',
  'social',
  'technical',
] as const satisfies readonly AttributeKey[];

export const SKILL_KEYS = [
  'stealth',
  'evasion',
  'awareness',
  'composure',
  'insight',
  'influence',
  'systems',
  'opsec',
] as const satisfies readonly SkillKey[];

export const LEVEL0_ATTRIBUTE_CREATION_BUDGET = 4;
export const LEVEL0_SKILL_CREATION_BUDGET = 6;
export const LEVEL0_ATTRIBUTE_CREATION_CAP = 3;
export const LEVEL0_SKILL_CREATION_CAP = 2;
export const LEVEL0_LONG_TERM_CAP = 5;
export const LEVEL0_CALLSIGN_MAX_CODE_POINTS = 24;

const callsignPattern = /^[\p{L}\p{N}](?:[\p{L}\p{N} .'’_-]*[\p{L}\p{N}])?$/u;

const baseAttributes = (): Record<AttributeKey, number> => ({
  physical: 1,
  mental: 1,
  social: 1,
  technical: 1,
});

const baseSkills = (): Record<SkillKey, number> => ({
  stealth: 0,
  evasion: 0,
  awareness: 0,
  composure: 0,
  insight: 0,
  influence: 0,
  systems: 0,
  opsec: 0,
});

export const normalizeLevel0Callsign = (value: string): string =>
  value.normalize('NFC').trim().replace(/\s+/gu, ' ');

export const isValidLevel0Callsign = (value: unknown): value is string => {
  if (typeof value !== 'string' || normalizeLevel0Callsign(value) !== value) return false;
  const callsignLength = Array.from(value).length;
  return callsignLength >= 1 &&
    callsignLength <= LEVEL0_CALLSIGN_MAX_CODE_POINTS &&
    callsignPattern.test(value);
};

export const createLevel0CreationDraft = (
  appearancePresetId = LEVEL0_DEFAULT_PLAYER_APPEARANCE_ID
): Level0CreationDraft => ({
  callsign: '',
  appearancePresetId,
  attributes: baseAttributes(),
  skills: baseSkills(),
});

const allocatedAttributePoints = (attributes: Record<AttributeKey, number>) =>
  ATTRIBUTE_KEYS.reduce((sum, key) => sum + attributes[key] - 1, 0);

const allocatedSkillPoints = (skills: Record<SkillKey, number>) =>
  SKILL_KEYS.reduce((sum, key) => sum + skills[key], 0);

const pushUnique = (errors: Level0CreationErrorId[], error: Level0CreationErrorId) => {
  if (!errors.includes(error)) errors.push(error);
};

export const validateLevel0CreationDraft = (
  draft: Level0CreationDraft
): Level0CreationValidation => {
  const errors: Level0CreationErrorId[] = [];
  const normalizedCallsign = normalizeLevel0Callsign(draft.callsign);
  const callsignLength = Array.from(normalizedCallsign).length;
  if (!normalizedCallsign) pushUnique(errors, 'callsign.required');
  else {
    if (callsignLength > LEVEL0_CALLSIGN_MAX_CODE_POINTS) {
      pushUnique(errors, 'callsign.too_long');
    }
    if (!callsignPattern.test(normalizedCallsign)) pushUnique(errors, 'callsign.invalid');
  }

  if (!isLevel0PlayerAppearanceId(draft.appearancePresetId)) {
    pushUnique(errors, 'appearance.invalid');
  }

  const attributeValues = ATTRIBUTE_KEYS.map((key) => draft.attributes[key]);
  if (attributeValues.some((value) => !Number.isInteger(value) || value < 1)) {
    pushUnique(errors, 'attributes.invalid');
  }
  if (attributeValues.some((value) => value > LEVEL0_ATTRIBUTE_CREATION_CAP)) {
    pushUnique(errors, 'attributes.over_cap');
  }
  const attributePoints = allocatedAttributePoints(draft.attributes);
  if (attributePoints !== LEVEL0_ATTRIBUTE_CREATION_BUDGET) {
    pushUnique(errors, 'attributes.unspent');
  }

  const skillValues = SKILL_KEYS.map((key) => draft.skills[key]);
  if (skillValues.some((value) => !Number.isInteger(value) || value < 0)) {
    pushUnique(errors, 'skills.invalid');
  }
  if (skillValues.some((value) => value > LEVEL0_SKILL_CREATION_CAP)) {
    pushUnique(errors, 'skills.over_cap');
  }
  const skillPoints = allocatedSkillPoints(draft.skills);
  if (skillPoints !== LEVEL0_SKILL_CREATION_BUDGET) {
    pushUnique(errors, 'skills.unspent');
  }

  const valid = errors.length === 0;
  const identity: PlayerIdentity | null = valid
    ? { callsign: normalizedCallsign, appearancePresetId: draft.appearancePresetId }
    : null;
  const build: PlayerBuild | null = valid
    ? {
        attributes: { ...draft.attributes },
        skills: { ...draft.skills },
        level: 1,
        xp: 0,
        unspentSkillPoints: 0,
        unspentAttributePoints: 0,
      }
    : null;

  return {
    valid,
    errors,
    normalizedCallsign,
    remainingAttributePoints: LEVEL0_ATTRIBUTE_CREATION_BUDGET - attributePoints,
    remainingSkillPoints: LEVEL0_SKILL_CREATION_BUDGET - skillPoints,
    identity,
    build,
  };
};

export type Level0SampleCharacterId = 'social_mental' | 'technical_evasion';

export const createLevel0SampleCharacter = (
  sampleId: Level0SampleCharacterId,
  callsign: string,
  appearancePresetId: Level0PlayerAppearanceId = sampleId === 'social_mental'
    ? 'player_civilian_01'
    : 'player_civilian_02'
): Level0CreationDraft => {
  const draft = createLevel0CreationDraft(appearancePresetId);
  draft.callsign = callsign;
  if (sampleId === 'social_mental') {
    draft.attributes.mental = 3;
    draft.attributes.social = 3;
    draft.skills.composure = 2;
    draft.skills.insight = 2;
    draft.skills.influence = 2;
  } else {
    draft.attributes.physical = 3;
    draft.attributes.technical = 3;
    draft.skills.evasion = 2;
    draft.skills.systems = 2;
    draft.skills.opsec = 2;
  }
  return draft;
};

export const createConfirmedLevel0Sample = (
  sampleId: Level0SampleCharacterId,
  callsign: string,
  appearancePresetId?: Level0PlayerAppearanceId
): { identity: PlayerIdentity; build: PlayerBuild } => {
  const result = validateLevel0CreationDraft(
    createLevel0SampleCharacter(sampleId, callsign, appearancePresetId)
  );
  if (!result.identity || !result.build) {
    throw new Error(`Invalid Level 0 sample character: ${result.errors.join(', ')}`);
  }
  return { identity: result.identity, build: result.build };
};
