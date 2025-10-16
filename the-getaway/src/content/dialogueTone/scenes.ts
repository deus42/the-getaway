import { SceneToneHint } from '../../game/narrative/dialogueTone/toneTypes';

const SHARE_SCARCE_FOOD: SceneToneHint = {
  id: 'scene.share_scarce_food',
  label: 'Share Scarce Food',
  intent: 'break bread after a risky supply run',
  traits: {
    warmth: 0.72,
    melancholy: 0.58,
    wit: 0.46,
    surrealism: 0.42,
    sarcasm: 0.3,
    urgency: 0.28,
    steadiness: 0.64,
  },
  rhetoric: {
    sentenceLengthMean: 17,
    metaphorRate: 0.38,
  },
};

const POST_AMBUSH_REASSURANCE: SceneToneHint = {
  id: 'scene.post_ambush_reassurance',
  label: 'Post-Ambush Reassurance',
  intent: 'steady the squad after scraping through an ambush',
  traits: {
    warmth: 0.62,
    melancholy: 0.55,
    wit: 0.4,
    surrealism: 0.37,
    sarcasm: 0.34,
    urgency: 0.46,
    steadiness: 0.68,
  },
  rhetoric: {
    sentenceLengthMean: 16,
    fragmentPreference: 0.2,
  },
};

const PRE_HEIST_BRIEFING: SceneToneHint = {
  id: 'scene.pre_heist_briefing',
  label: 'Pre-Heist Briefing',
  intent: 'sharpen focus during mission prep',
  traits: {
    warmth: 0.38,
    melancholy: 0.32,
    wit: 0.5,
    surrealism: 0.28,
    sarcasm: 0.52,
    urgency: 0.72,
    steadiness: 0.58,
  },
  rhetoric: {
    sentenceLengthMean: 14,
    fragmentPreference: 0.26,
  },
};

const RADIO_COUNTER_SPEECH: SceneToneHint = {
  id: 'scene.radio_counter_speech',
  label: 'Counter-Broadcast Speech',
  intent: 'mock the regime broadcast while rallying allies',
  traits: {
    warmth: 0.44,
    melancholy: 0.36,
    wit: 0.68,
    surrealism: 0.5,
    sarcasm: 0.74,
    urgency: 0.6,
    steadiness: 0.46,
  },
  rhetoric: {
    sentenceLengthMean: 15,
    sentenceLengthStdDev: 4,
    fragmentPreference: 0.34,
  },
};

export const TONE_SCENES: Record<string, SceneToneHint> = {
  [SHARE_SCARCE_FOOD.id]: SHARE_SCARCE_FOOD,
  [POST_AMBUSH_REASSURANCE.id]: POST_AMBUSH_REASSURANCE,
  [PRE_HEIST_BRIEFING.id]: PRE_HEIST_BRIEFING,
  [RADIO_COUNTER_SPEECH.id]: RADIO_COUNTER_SPEECH,
};

export const getToneScene = (id: string): SceneToneHint | undefined => TONE_SCENES[id];

export const listToneScenes = (): SceneToneHint[] => Object.values(TONE_SCENES);
