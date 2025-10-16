import { RoleDialogueTemplate } from '../../../game/narrative/dialogueTone/roleTemplateTypes';

const enforcementNotes = [
  'Keep your papers visible and your hands where the drones can see them.',
  'If you spot a rebel courier, flag Ops immediately.',
  'Curfew level\'s rising—movement passes expire at sundown.',
  'Checkpoint scanners lag two beats; don\'t test them.',
];

const crackdownWarnings = [
  'Orders say we hit siege level if one more rumor spikes.',
  'CorpSec command wants names; don\'t make me drag you in.',
  'We\'re one alert away from full lockdown.',
];

export const CHECKPOINT_GUARD_TEMPLATES: RoleDialogueTemplate[] = [
  {
    id: 'checkpoint_guard.default_greeting.standard',
    roleId: 'checkpoint_guard',
    templateKey: 'default_greeting',
    summary: 'Baseline checkpoint greeting with procedural warning.',
    content: 'Checkpoint Delta online. {{instructionHook}}',
    fallbackContent: 'Checkpoint active. Move along.',
    tokens: [
      {
        id: 'instructionHook',
        fallback: 'Stay within curfew limits.',
        resolve: (_context, helpers) => helpers.pickOne(enforcementNotes, enforcementNotes[0]),
      },
    ],
    toneOverrides: {
      templateId: 'template.urgent.push',
      personaId: 'persona.trace',
      useGenerated: true,
    },
    weight: 2,
  },
  {
    id: 'checkpoint_guard.default_greeting.highAlert',
    roleId: 'checkpoint_guard',
    templateKey: 'default_greeting',
    summary: 'Escalated warning when curfew level is high.',
    content: 'Alert tier is {{alertTier}}. Any resistance contact gets you cuffed.',
    fallbackContent: 'High alert. Don\'t test me.',
    gating: {
      environment: [
        {
          flag: 'curfewLevel',
          minimumNumeric: 2,
        },
      ],
    },
    tokens: [
      {
        id: 'alertTier',
        fallback: 'escalating',
        resolve: (context) => {
          if (context.world.environmentFlags.curfewLevel >= 3) {
            return 'siege';
          }
          return 'escalating';
        },
      },
    ],
    toneOverrides: {
      templateId: 'template.urgent.push',
      personaId: 'persona.trace',
      useGenerated: true,
    },
    weight: 3,
  },
  {
    id: 'checkpoint_guard.default_greeting.blackout',
    roleId: 'checkpoint_guard',
    templateKey: 'default_greeting',
    summary: 'Warning when blackout tier is active.',
    content: 'Power grid\'s unstable; blackout tier {{blackoutTier}}. Expect spot checks.',
    fallbackContent: 'Power grid\'s shaky. Expect spot checks.',
    gating: {
      environment: [
        {
          flag: 'blackoutTier',
          allowed: ['brownout', 'rolling'],
        },
      ],
    },
    tokens: [
      {
        id: 'blackoutTier',
        fallback: 'brownout',
        resolve: (context) => context.world.environmentFlags.blackoutTier,
      },
    ],
    toneOverrides: {
      templateId: 'template.deadpan.reassure',
      personaId: 'persona.trace',
      useGenerated: true,
    },
    weight: 2,
  },
  {
    id: 'checkpoint_guard.default_greeting.crackdown',
    roleId: 'checkpoint_guard',
    templateKey: 'default_greeting',
    summary: 'Threatening line for hostile resistance reputation.',
    content: 'Your face is flagged on half the scanners in this grid. {{warning}}',
    fallbackContent: 'I\'ve got eyes on you.',
    gating: {
      faction: [
        {
          factionId: 'resistance',
          maximumReputation: -10,
        },
      ],
    },
    tokens: [
      {
        id: 'warning',
        fallback: 'Step out of line and I\'m calling it in.',
        resolve: (_context, helpers) => helpers.pickOne(crackdownWarnings, crackdownWarnings[0]),
      },
    ],
    toneOverrides: {
      templateId: 'template.urgent.push',
      personaId: 'persona.trace',
      useGenerated: true,
    },
  },
  {
    id: 'checkpoint_guard.default_greeting.nightShift',
    roleId: 'checkpoint_guard',
    templateKey: 'default_greeting',
    summary: 'Night-time variant referencing curfew sweeps.',
    content: 'Night shift sweep in progress. Curfew papers or back to shelter.',
    fallbackContent: 'Curfew papers or move.',
    gating: {
      allowedTimesOfDay: ['night'],
    },
    toneOverrides: {
      templateId: 'template.urgent.push',
      personaId: 'persona.trace',
      useGenerated: true,
    },
    isFallback: true,
  },
];
