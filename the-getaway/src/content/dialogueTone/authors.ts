import { ToneAuthorFingerprint } from '../../game/narrative/dialogueTone/toneTypes';

const AUTHOR_VONNEGUT_BRAUTIGAN: ToneAuthorFingerprint = {
  id: 'author.vonnegut_brautigan_core',
  label: 'Vonnegut-Brautigan Core Voice',
  influences: ['plot.tone.guideline.1', 'plot.tone.guideline.2', 'plot.tone.guideline.7'],
  traits: {
    wit: 0.75,
    melancholy: 0.6,
    surrealism: 0.68,
    sarcasm: 0.55,
    warmth: 0.52,
    urgency: 0.48,
    steadiness: 0.5,
  },
  rhetoric: {
    sentenceLengthMean: 18,
    sentenceLengthStdDev: 5,
    metaphorRate: 0.48,
    fragmentPreference: 0.22,
  },
  templateBias: ['template.deadpan.reassure', 'template.surreal.resilience'],
  fallbackTemplates: ['template.deadpan.reassure'],
};

const AUTHOR_PROPAGANDA_GLITCH: ToneAuthorFingerprint = {
  id: 'author.propaganda_glitch',
  label: 'Glitched Broadcast Satire',
  influences: ['plot.tone.guideline.4', 'plot.tone.guideline.2'],
  traits: {
    wit: 0.55,
    melancholy: 0.35,
    surrealism: 0.5,
    sarcasm: 0.7,
    warmth: 0.32,
    urgency: 0.6,
    steadiness: 0.44,
  },
  rhetoric: {
    sentenceLengthMean: 14,
    sentenceLengthStdDev: 3,
    metaphorRate: 0.28,
    fragmentPreference: 0.32,
  },
  templateBias: ['template.urgent.push'],
  fallbackTemplates: ['template.urgent.push'],
};

export const TONE_AUTHORS: Record<string, ToneAuthorFingerprint> = {
  [AUTHOR_VONNEGUT_BRAUTIGAN.id]: AUTHOR_VONNEGUT_BRAUTIGAN,
  [AUTHOR_PROPAGANDA_GLITCH.id]: AUTHOR_PROPAGANDA_GLITCH,
};

export const DEFAULT_AUTHOR_ID = AUTHOR_VONNEGUT_BRAUTIGAN.id;

export const getToneAuthor = (id: string): ToneAuthorFingerprint =>
  TONE_AUTHORS[id] ?? TONE_AUTHORS[DEFAULT_AUTHOR_ID];

export const listToneAuthors = (): ToneAuthorFingerprint[] => Object.values(TONE_AUTHORS);
