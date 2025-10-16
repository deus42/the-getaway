import { TonePersonaDefinition } from '../../game/narrative/dialogueTone/toneTypes';

const TRACE: TonePersonaDefinition = {
  id: 'persona.trace',
  label: 'Trace (Player)',
  personaTags: ['player', 'resistance'],
  traits: {
    wit: 0.65,
    warmth: 0.54,
    urgency: 0.62,
    steadiness: 0.4,
    sarcasm: 0.58,
    melancholy: 0.47,
    surrealism: 0.44,
  },
  rhetoric: {
    sentenceLengthMean: 14,
    sentenceLengthStdDev: 4,
    fragmentPreference: 0.28,
  },
  motifBias: ['motif.streetlight', 'motif.rain_hum'],
  templateBias: ['template.urgent.push', 'template.deadpan.reassure'],
  lexiconOverrides: {
    directive: [
      'Keep moving like the cameras forgot you.',
      'Drift along the blackout fringe—quiet shoes, loud mission.',
    ],
  },
};

const AMARA: TonePersonaDefinition = {
  id: 'persona.amara_velez',
  label: 'Amara Velez',
  personaTags: ['mentor', 'resistance'],
  traits: {
    wit: 0.52,
    warmth: 0.66,
    urgency: 0.48,
    steadiness: 0.68,
    sarcasm: 0.38,
    melancholy: 0.55,
    surrealism: 0.42,
  },
  rhetoric: {
    sentenceLengthMean: 17,
    sentenceLengthStdDev: 3,
    fragmentPreference: 0.18,
  },
  motifBias: ['motif.compass', 'motif.streetlight'],
  templateBias: ['template.deadpan.reassure', 'template.surreal.resilience'],
  lexiconOverrides: {
    comfort: [
      'Breathe—we’ve lived through harsher tides.',
      'You held the line; I’ll hold the fallout.',
    ],
  },
};

const THEO: TonePersonaDefinition = {
  id: 'persona.theo_anders',
  label: 'Theo Anders',
  personaTags: ['hacker', 'ally'],
  traits: {
    wit: 0.7,
    warmth: 0.5,
    urgency: 0.57,
    steadiness: 0.38,
    sarcasm: 0.64,
    melancholy: 0.42,
    surrealism: 0.58,
  },
  rhetoric: {
    sentenceLengthMean: 13,
    sentenceLengthStdDev: 5,
    fragmentPreference: 0.36,
  },
  motifBias: ['motif.glowsticks', 'motif.rain_hum'],
  templateBias: ['template.urgent.push'],
  lexiconOverrides: {
    opener: [
      'Signal’s noisy but alive.',
      'Console’s humming like a nervous choir.',
    ],
  },
};

const SADIQ: TonePersonaDefinition = {
  id: 'persona.sadiq_rahm',
  label: 'Sadiq Rahm',
  personaTags: ['strategist', 'ally'],
  traits: {
    wit: 0.48,
    warmth: 0.4,
    urgency: 0.52,
    steadiness: 0.6,
    sarcasm: 0.46,
    melancholy: 0.58,
    surrealism: 0.36,
  },
  rhetoric: {
    sentenceLengthMean: 16,
    sentenceLengthStdDev: 3,
    fragmentPreference: 0.22,
  },
  motifBias: ['motif.compass'],
  templateBias: ['template.deadpan.reassure'],
  lexiconOverrides: {
    promise: [
      'We bank this win, re-draw the map, hit harder tomorrow.',
      'Blueprints shift in our favour; we keep walking.',
    ],
  },
};

export const TONE_PERSONAS: Record<string, TonePersonaDefinition> = {
  [TRACE.id]: TRACE,
  [AMARA.id]: AMARA,
  [THEO.id]: THEO,
  [SADIQ.id]: SADIQ,
};

export const DEFAULT_PERSONA_ID = TRACE.id;

export const getTonePersona = (id: string): TonePersonaDefinition =>
  TONE_PERSONAS[id] ?? TONE_PERSONAS[DEFAULT_PERSONA_ID];

export const listTonePersonas = (): TonePersonaDefinition[] => Object.values(TONE_PERSONAS);
