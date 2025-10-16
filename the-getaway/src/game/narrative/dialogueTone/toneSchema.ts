import {
  DEFAULT_RHETORIC,
  ToneProfile,
  ToneTraitId,
  TONE_TRAITS,
  RhetoricalProfile,
} from './toneTypes';

export interface JsonSchema {
  $schema: string;
  title: string;
  type: 'object';
  required: string[];
  properties: Record<string, unknown>;
  additionalProperties: boolean;
}

export const toneProfileSchema: JsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Dialogue Tone Profile',
  type: 'object',
  required: ['id', 'label', 'traits'],
  additionalProperties: false,
  properties: {
    id: { type: 'string', minLength: 1 },
    label: { type: 'string', minLength: 1 },
    traits: {
      type: 'object',
      additionalProperties: false,
      properties: TONE_TRAITS.reduce<Record<string, unknown>>((accumulator, trait) => {
        accumulator[trait] = { type: 'number', minimum: 0, maximum: 1 };
        return accumulator;
      }, {}),
    },
    rhetoric: {
      type: 'object',
      additionalProperties: false,
      properties: {
        sentenceLengthMean: { type: 'number', minimum: 4, maximum: 40 },
        sentenceLengthStdDev: { type: 'number', minimum: 0, maximum: 12 },
        metaphorRate: { type: 'number', minimum: 0, maximum: 1 },
        fragmentPreference: { type: 'number', minimum: 0, maximum: 1 },
        motifDensity: { type: 'number', minimum: 0, maximum: 1 },
      },
    },
    motifBias: {
      type: 'array',
      items: { type: 'string' },
    },
    lexiconOverrides: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    templateBias: {
      type: 'array',
      items: { type: 'string' },
    },
    fallbackTemplates: {
      type: 'array',
      items: { type: 'string' },
    },
  },
};

const isNumberInRange = (value: unknown, minimum: number, maximum: number): value is number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return false;
  }
  return value >= minimum && value <= maximum;
};

const sanitizeTraits = (traits: Partial<Record<string, unknown>>): Partial<Record<ToneTraitId, number>> => {
  const result: Partial<Record<ToneTraitId, number>> = {};
  for (const trait of TONE_TRAITS) {
    const value = traits[trait];
    if (isNumberInRange(value, 0, 1)) {
      result[trait] = value;
    }
  }
  return result;
};

const sanitizeRhetoric = (
  rhetoric: Partial<Record<keyof RhetoricalProfile, unknown>> | undefined,
): Partial<RhetoricalProfile> | undefined => {
  if (!rhetoric) {
    return undefined;
  }

  const result: Partial<RhetoricalProfile> = {};
  if (isNumberInRange(rhetoric.sentenceLengthMean, 4, 40)) {
    result.sentenceLengthMean = rhetoric.sentenceLengthMean;
  }
  if (isNumberInRange(rhetoric.sentenceLengthStdDev, 0, 12)) {
    result.sentenceLengthStdDev = rhetoric.sentenceLengthStdDev;
  }
  if (isNumberInRange(rhetoric.metaphorRate, 0, 1)) {
    result.metaphorRate = rhetoric.metaphorRate;
  }
  if (isNumberInRange(rhetoric.fragmentPreference, 0, 1)) {
    result.fragmentPreference = rhetoric.fragmentPreference;
  }
  if (isNumberInRange(rhetoric.motifDensity, 0, 1)) {
    result.motifDensity = rhetoric.motifDensity;
  }

  return Object.keys(result).length > 0 ? result : undefined;
};

export interface ToneProfileValidation {
  valid: boolean;
  errors: string[];
  profile?: ToneProfile;
}

export const validateToneProfile = (input: unknown): ToneProfileValidation => {
  const errors: string[] = [];

  if (typeof input !== 'object' || input === null) {
    return { valid: false, errors: ['Profile must be an object.'] };
  }

  const candidate = input as Record<string, unknown>;
  const { id, label, traits, rhetoric } = candidate;

  if (typeof id !== 'string' || id.trim().length === 0) {
    errors.push('Profile id must be a non-empty string.');
  }

  if (typeof label !== 'string' || label.trim().length === 0) {
    errors.push('Profile label must be a non-empty string.');
  }

  if (typeof traits !== 'object' || traits === null) {
    errors.push('Profile traits must be an object.');
  }

  const sanitizedTraits = typeof traits === 'object' && traits !== null ? sanitizeTraits(traits as Partial<Record<string, unknown>>) : {};

  if (!traits || Object.keys(sanitizedTraits).length === 0) {
    errors.push('Profile traits must include at least one recognised trait key.');
  }

  const sanitizedRhetoric = sanitizeRhetoric(rhetoric as Partial<Record<keyof RhetoricalProfile, unknown>>);

  const motifBias = Array.isArray(candidate.motifBias)
    ? candidate.motifBias.map((entry) => String(entry))
    : undefined;

  const lexiconOverrides = typeof candidate.lexiconOverrides === 'object' && candidate.lexiconOverrides !== null
    ? Object.entries(candidate.lexiconOverrides as Record<string, unknown>).reduce<Record<string, string[]>>((accumulator, [key, value]) => {
        if (Array.isArray(value)) {
          accumulator[key] = value.map((entry) => String(entry));
        }
        return accumulator;
      }, {})
    : undefined;

  const templateBias = Array.isArray(candidate.templateBias)
    ? candidate.templateBias.map((entry) => String(entry))
    : undefined;

  const fallbackTemplates = Array.isArray(candidate.fallbackTemplates)
    ? candidate.fallbackTemplates.map((entry) => String(entry))
    : undefined;

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const profile: ToneProfile = {
    id: id as string,
    label: label as string,
    traits: sanitizedTraits,
    rhetoric: sanitizedRhetoric,
    motifBias,
    lexiconOverrides,
    templateBias,
    fallbackTemplates,
  };

  return { valid: true, errors: [], profile };
};

export const mergeWithDefaultRhetoric = (profile: ToneProfile): RhetoricalProfile => {
  if (!profile.rhetoric) {
    return { ...DEFAULT_RHETORIC };
  }

  return {
    sentenceLengthMean: profile.rhetoric.sentenceLengthMean ?? DEFAULT_RHETORIC.sentenceLengthMean,
    sentenceLengthStdDev: profile.rhetoric.sentenceLengthStdDev ?? DEFAULT_RHETORIC.sentenceLengthStdDev,
    metaphorRate: profile.rhetoric.metaphorRate ?? DEFAULT_RHETORIC.metaphorRate,
    fragmentPreference: profile.rhetoric.fragmentPreference ?? DEFAULT_RHETORIC.fragmentPreference,
    motifDensity: profile.rhetoric.motifDensity ?? DEFAULT_RHETORIC.motifDensity,
  };
};
