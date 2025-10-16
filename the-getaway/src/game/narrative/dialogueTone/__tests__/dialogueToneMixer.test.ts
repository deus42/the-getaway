import { mixDialogueTone } from '../dialogueToneMixer';
import {
  ToneAuthorFingerprint,
  ToneLibrary,
  TonePersonaDefinition,
  ToneTemplate,
  TonePalette,
} from '../toneTypes';

const buildTemplate = (): ToneTemplate => ({
  id: 'template.deadpan.alert',
  label: 'Deadpan Alert',
  template: '{{greeting}} {{call_to_action}}',
  supportsFragments: false,
  maxSentenceLength: 16,
  slots: [
    { id: 'greeting', paletteId: 'palette.greeting' },
    { id: 'call_to_action', paletteId: 'palette.action' },
  ],
  traitWeightBoost: {
    urgency: 0.6,
    wit: 0.2,
  },
});

const greetingPalette: TonePalette = {
  id: 'palette.greeting',
  slotId: 'greeting',
  defaultText: 'Stay sharp.',
  entries: [
    { id: 'steady', text: "Streetlight's back on.", weight: 1, traitInfluence: { steadiness: 0.4 } },
    { id: 'urgent', text: 'Sirens warm up.', weight: 1, traitInfluence: { urgency: 0.6 } },
  ],
};

const actionPalette: TonePalette = {
  id: 'palette.action',
  slotId: 'call_to_action',
  defaultText: 'Move quiet.',
  entries: [
    { id: 'warn', text: 'Move before the floodlights bloom.', weight: 1, traitInfluence: { urgency: 0.5 } },
    { id: 'banter', text: 'Maybe outrun the choirboys tonight.', weight: 0.8, traitInfluence: { wit: 0.5 } },
  ],
};

const library: ToneLibrary = {
  authors: {},
  personas: {},
  scenes: {},
  templates: [buildTemplate()],
  palettes: [greetingPalette, actionPalette],
};

const author: ToneAuthorFingerprint = {
  id: 'author.vonnegut_brautigan',
  label: 'Vonnegut x Brautigan Blend',
  influences: ['plot.tone.guideline.1', 'plot.tone.guideline.2'],
  traits: {
    wit: 0.7,
    melancholy: 0.55,
    sarcasm: 0.6,
    warmth: 0.45,
    urgency: 0.4,
    steadiness: 0.5,
    surrealism: 0.6,
  },
  rhetoric: {
    sentenceLengthMean: 18,
    metaphorRate: 0.45,
  },
  templateBias: ['template.deadpan.alert'],
};

const persona: TonePersonaDefinition = {
  id: 'persona.trace',
  label: 'Trace (Player Default)',
  personaTags: ['player', 'resistance'],
  traits: {
    wit: 0.6,
    melancholy: 0.4,
    warmth: 0.5,
    urgency: 0.65,
    steadiness: 0.35,
    sarcasm: 0.55,
    surrealism: 0.45,
  },
  rhetoric: {
    sentenceLengthMean: 14,
  },
  templateBias: ['template.deadpan.alert'],
};

const calmerScene = {
  id: 'scene.post_ambush_reassurance',
  label: 'Post Ambush Reassurance',
  intent: 'steady nerves after a narrow escape',
  traits: {
    steadiness: 0.7,
    warmth: 0.6,
    urgency: 0.2,
    melancholy: 0.5,
    wit: 0.5,
    sarcasm: 0.35,
    surrealism: 0.45,
  },
};

describe('mixDialogueTone', () => {
  it('blends traits using weighted averages', () => {
    const result = mixDialogueTone(
      {
        author,
        persona,
        scene: calmerScene,
        seed: 'blend-test',
      },
      library,
    );

    expect(result.traits.warmth).toBeGreaterThan(0.47);
    expect(result.traits.warmth).toBeLessThanOrEqual(0.5);
    expect(result.traits.urgency).toBeCloseTo(0.46, 2);
  });

  it('clamps rhetoric when template disallows fragments', () => {
    const urgentPersona: TonePersonaDefinition = {
      ...persona,
      traits: {
        ...persona.traits,
        urgency: 0.95,
      },
      rhetoric: {
        sentenceLengthMean: 10,
        fragmentPreference: 0.8,
      },
    };

    const result = mixDialogueTone(
      {
        author,
        persona: urgentPersona,
        seed: 'clamp-test',
      },
      library,
    );

    expect(result.rhetoric.fragmentPreference).toBeLessThanOrEqual(0.5);
    expect(result.clampLog.length).toBeGreaterThan(0);
  });

  it('selects palette entries deterministically per seed', () => {
    const first = mixDialogueTone(
      {
        author,
        persona,
        scene: calmerScene,
        seed: 'deterministic-seed',
      },
      library,
    );

    const second = mixDialogueTone(
      {
        author,
        persona,
        scene: calmerScene,
        seed: 'deterministic-seed',
      },
      library,
    );

    expect(second.render.text).toBe(first.render.text);
    expect(second.render.templateId).toBe(first.render.templateId);
  });
});
