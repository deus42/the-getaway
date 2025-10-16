import { RoleDialogueTemplate } from '../../../game/narrative/dialogueTone/roleTemplateTypes';

const restNotes = [
  'Bunks are sanitised—don\'t bleed on them.',
  'We rotate guard shifts every twenty minutes; slot in if you can.',
  'Leave broken gear on the workbench; the techs are patching it nightly.',
];

const supplyNotes = [
  'Food stores run dry in two days unless the next convoy lands.',
  'Filters arrive at dawn—ration what you have left.',
  'Ammo press needs parts; scavenge springs if you spot any.',
];

export const SAFEHOUSE_HANDLER_TEMPLATES: RoleDialogueTemplate[] = [
  {
    id: 'safehouse_handler.default_greeting.welcome',
    roleId: 'safehouse_handler',
    templateKey: 'default_greeting',
    summary: 'Warm welcome when the player returns to a safehouse.',
    content: 'Safehouse doors are sealed. {{restNote}}',
    fallbackContent: 'Safehouse secured. Rest while you can.',
    tokens: [
      {
        id: 'restNote',
        fallback: 'Grab a bunk and breathe.',
        resolve: (_context, helpers) => helpers.pickOne(restNotes, restNotes[0]),
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
    id: 'safehouse_handler.default_greeting.lowSupplies',
    roleId: 'safehouse_handler',
    templateKey: 'default_greeting',
    summary: 'Warns about low supplies when scarcity flag is high.',
    content: 'Pantry\'s thin—{{supplyNote}}',
    fallbackContent: 'Supplies low. Make your run count.',
    gating: {
      environment: [
        {
          flag: 'supplyScarcity',
          allowed: ['tight', 'rationed'],
        },
      ],
    },
    tokens: [
      {
        id: 'supplyNote',
        fallback: 'stretch your rations.',
        resolve: (_context, helpers) => helpers.pickOne(supplyNotes, supplyNotes[0]),
      },
    ],
    toneOverrides: {
      templateId: 'template.deadpan.reassure',
      personaId: 'persona.trace',
      useGenerated: true,
    },
  },
  {
    id: 'safehouse_handler.default_greeting.hazardShelter',
    roleId: 'safehouse_handler',
    templateKey: 'default_greeting',
    summary: 'Highlights shelter when hazards are active outside.',
    content: 'Outside\'s a killbox tonight. Trade routes stay closed until daybreak.',
    fallbackContent: 'Outside is lethal right now. Stay in.',
    gating: {
      requiredHazardKeywords: ['smog', 'radiation', 'patrol'],
    },
    toneOverrides: {
      templateId: 'template.deadpan.reassure',
      personaId: 'persona.trace',
      useGenerated: true,
    },
  },
  {
    id: 'safehouse_handler.default_greeting.curfewShelter',
    roleId: 'safehouse_handler',
    templateKey: 'default_greeting',
    summary: 'Curfew-specific shelter reminder.',
    content: 'Curfew alarms are peaking. Lock-in lasts until morning.',
    fallbackContent: 'Curfew locked. Sit tight.',
    gating: {
      requireCurfewActive: true,
    },
    toneOverrides: {
      templateId: 'template.deadpan.reassure',
      personaId: 'persona.trace',
      useGenerated: true,
    },
  },
  {
    id: 'safehouse_handler.default_greeting.fallback',
    roleId: 'safehouse_handler',
    templateKey: 'default_greeting',
    summary: 'Default handler line.',
    content: 'We keep the lights dim and the exits mapped. Rest easy.',
    fallbackContent: 'Safehouse steady.',
    toneOverrides: {
      templateId: 'template.deadpan.reassure',
      personaId: 'persona.trace',
      useGenerated: true,
    },
    isFallback: true,
  },
];
