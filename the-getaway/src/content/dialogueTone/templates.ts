import { ToneTemplate } from '../../game/narrative/dialogueTone/toneTypes';

export const TONE_TEMPLATES: ToneTemplate[] = [
  {
    id: 'template.deadpan.reassure',
    label: 'Deadpan Reassurance',
    template: '{{opener}} {{comfort}} {{promise}}',
    supportsFragments: false,
    maxSentenceLength: 22,
    requiredTraits: {
      warmth: 0.4,
      steadiness: 0.45,
    },
    traitWeightBoost: {
      warmth: 0.6,
      steadiness: 0.3,
      wit: 0.2,
    },
    slots: [
      { id: 'opener', paletteId: 'palette.opener.deadpan' },
      { id: 'comfort', paletteId: 'palette.comfort.solidarity' },
      { id: 'promise', paletteId: 'palette.promise.grit' },
    ],
  },
  {
    id: 'template.urgent.push',
    label: 'Urgent Push',
    template: '{{urgent_intro}} {{directive}}',
    supportsFragments: true,
    maxSentenceLength: 18,
    requiredTraits: {
      urgency: 0.55,
    },
    forbiddenTraits: {
      warmth: 0.85,
    },
    traitWeightBoost: {
      urgency: 0.8,
      wit: 0.2,
      sarcasm: 0.3,
    },
    slots: [
      { id: 'urgent_intro', paletteId: 'palette.urgent.intro', allowFragments: true },
      { id: 'directive', paletteId: 'palette.directive.push', allowFragments: true },
    ],
  },
  {
    id: 'template.surreal.resilience',
    label: 'Surreal Resilience',
    template: '{{opener}} {{surreal_image}} {{resolution}}',
    supportsFragments: false,
    maxSentenceLength: 24,
    requiredTraits: {
      surrealism: 0.45,
    },
    traitWeightBoost: {
      surrealism: 0.9,
      melancholy: 0.4,
      wit: 0.25,
    },
    slots: [
      { id: 'opener', paletteId: 'palette.opener.deadpan' },
      { id: 'surreal_image', paletteId: 'palette.surreal.image' },
      { id: 'resolution', paletteId: 'palette.resolution.resilience' },
    ],
  },
];
