import { RoleDialogueTemplate } from '../../../game/narrative/dialogueTone/roleTemplateTypes';

const triageTips = [
  'Keep wounds sealed; alley dust is lethal.',
  'Rotating sutures hourly keeps CorpSec toxins from setting in.',
  'Swap filters every hour—mutation spores love stagnant air.',
  'Use the city\'s steam vents to sterilise gear if the clinic is compromised.',
];

const stimulantAdvice = [
  'Don\'t stack stim packs unless you want your heart to stage a protest.',
  'Hydrate with electrolytes after each stim; trust me, you need them.',
  'If the stim crash hits, sleep it off. No negotiation.',
];

export const STREET_DOC_TEMPLATES: RoleDialogueTemplate[] = [
  {
    id: 'street_doc.default_greeting.resistanceAlly',
    roleId: 'street_doc',
    templateKey: 'default_greeting',
    summary: 'Compassionate line for resistance allies.',
    content: 'Clinic\'s running hot, but I carved out a cot for you. {{advice}}',
    fallbackContent: 'Clinic\'s open for resistance blood.',
    gating: {
      faction: [
        {
          factionId: 'resistance',
          minimumStanding: 'friendly',
        },
      ],
      forbiddenTimesOfDay: ['night'],
    },
    tokens: [
      {
        id: 'advice',
        fallback: 'Stay hydrated and bandage often.',
        resolve: (_context, helpers) => helpers.pickOne(triageTips, triageTips[0]),
      },
    ],
    toneOverrides: {
      templateId: 'template.deadpan.reassure',
      personaId: 'persona.amara_velez',
      useGenerated: true,
    },
    weight: 2,
  },
  {
    id: 'street_doc.default_greeting.stimWarning',
    roleId: 'street_doc',
    templateKey: 'default_greeting',
    summary: 'Warns players who lean on adrenaline perks.',
    content: 'Saw your vitals spike mid-field. {{stimulantNote}}',
    fallbackContent: 'Your vitals scream stim abuse.',
    gating: {
      forbiddenTimesOfDay: ['morning'],
    },
    tokens: [
      {
        id: 'stimulantNote',
        fallback: 'Dial down the stim packs or you\'ll pancake.',
        resolve: (context, helpers) => {
          if (context.player.perks.includes('adrenalineRush')) {
            return helpers.pickOne(stimulantAdvice, stimulantAdvice[0]);
          }
          return 'Your heart rate needs calm, not more gunfire.';
        },
      },
    ],
    toneOverrides: {
      templateId: 'template.deadpan.reassure',
      personaId: 'persona.amara_velez',
      useGenerated: true,
    },
  },
  {
    id: 'street_doc.default_greeting.hazardClinic',
    roleId: 'street_doc',
    templateKey: 'default_greeting',
    summary: 'Environmental note when hazardous clouds are active.',
    content: 'Smog\'s thick tonight. I packed spare filters and anti-rad chems.',
    fallbackContent: 'Air\'s poison. Use the filters.',
    gating: {
      requiredHazardKeywords: ['smog', 'toxic', 'radiation'],
    },
    toneOverrides: {
      templateId: 'template.deadpan.reassure',
      personaId: 'persona.trace',
      useGenerated: true,
    },
    weight: 2,
  },
  {
    id: 'street_doc.default_greeting.overrun',
    roleId: 'street_doc',
    templateKey: 'default_greeting',
    summary: 'Terse line when curfew is active.',
    content: 'I\'m triaging patrol victims on the floor. Sit, bleed, talk later.',
    fallbackContent: 'Busy. Sit and wait.',
    gating: {
      requireCurfewActive: true,
    },
    toneOverrides: {
      templateId: 'template.urgent.push',
      personaId: 'persona.trace',
      useGenerated: true,
    },
  },
  {
    id: 'street_doc.default_greeting.defaultFallback',
    roleId: 'street_doc',
    templateKey: 'default_greeting',
    summary: 'General-purpose greeting.',
    content: 'Slide onto the stool. Tools are clean; I made sure.',
    fallbackContent: 'Seat\'s open. Let\'s patch you.',
    toneOverrides: {
      templateId: 'template.deadpan.reassure',
      personaId: 'persona.trace',
      useGenerated: true,
    },
    isFallback: true,
  },
];
