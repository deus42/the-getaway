import { RoleDialogueTemplate } from '../../../game/narrative/dialogueTone/roleTemplateTypes';

const patrolIntel = [
  'CorpSec squads shifted to the mag-line every half hour.',
  'Drone lattice thins out near the collapsed tram. Use it.',
  'Rumor says resistance cracked the western floodgate. Check it tonight.',
  'The scavengers set a new killbox under the viaduct. Don\'t stray.',
];

const hostileWarnings = [
  'Step wrong and I tip off the enforcers.',
  'You smell like CorpSec. Two words: back off.',
  'My crew has eyes everywhere. Try nothing.',
];

export const GANG_SCOUT_TEMPLATES: RoleDialogueTemplate[] = [
  {
    id: 'gang_scout.default_greeting.friendly',
    roleId: 'gang_scout',
    templateKey: 'default_greeting',
    summary: 'Alliance tone when player reputation with scavengers is high.',
    content: 'Scav nets flagged you green. {{intel}}',
    fallbackContent: 'You\'re clear with the crew.',
    gating: {
      faction: [
        {
          factionId: 'scavengers',
          minimumReputation: 10,
        },
      ],
    },
    tokens: [
      {
        id: 'intel',
        fallback: 'Stick to the alleys; corp eyes are thick tonight.',
        resolve: (_context, helpers) => helpers.pickOne(patrolIntel, patrolIntel[0]),
      },
    ],
    toneOverrides: {
      templateId: 'template.urgent.push',
      personaId: 'persona.trace',
      useGenerated: true,
    },
  },
  {
    id: 'gang_scout.default_greeting.hostile',
    roleId: 'gang_scout',
    templateKey: 'default_greeting',
    summary: 'Threatening line when player reputation is poor.',
    content: 'Crew tagged you as trouble. {{warning}}',
    fallbackContent: 'Crew doesn\'t trust you.',
    gating: {
      faction: [
        {
          factionId: 'scavengers',
          maximumReputation: -5,
        },
      ],
    },
    tokens: [
      {
        id: 'warning',
        fallback: 'You move, we respond.',
        resolve: (_context, helpers) => helpers.pickOne(hostileWarnings, hostileWarnings[0]),
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
    id: 'gang_scout.default_greeting.blackoutRecon',
    roleId: 'gang_scout',
    templateKey: 'default_greeting',
    summary: 'Intel drop during blackout scenarios.',
    content: 'Blackout\'s blanketing the grid. Use it to ghost past scanners.',
    fallbackContent: 'Blackout cover tonight. Move quiet.',
    gating: {
      environment: [
        {
          flag: 'blackoutTier',
          allowed: ['brownout', 'rolling'],
        },
      ],
    },
    toneOverrides: {
      templateId: 'template.deadpan.reassure',
      personaId: 'persona.trace',
      useGenerated: true,
    },
  },
  {
    id: 'gang_scout.default_greeting.nightWatch',
    roleId: 'gang_scout',
    templateKey: 'default_greeting',
    summary: 'Night-only greeting referencing curfew sweeps.',
    content: 'Night patrol spotted a CorpSec sweeper moving east. Stay in the shadows.',
    fallbackContent: 'Night sweeps inbound. Stay sharp.',
    gating: {
      allowedTimesOfDay: ['night'],
    },
    toneOverrides: {
      templateId: 'template.urgent.push',
      personaId: 'persona.trace',
      useGenerated: true,
    },
  },
  {
    id: 'gang_scout.default_greeting.fallback',
    roleId: 'gang_scout',
    templateKey: 'default_greeting',
    summary: 'General-purpose line.',
    content: 'Eyes are open. Feed me intel if you want safe passage.',
    fallbackContent: 'Watch your angles out there.',
    toneOverrides: {
      templateId: 'template.deadpan.reassure',
      personaId: 'persona.trace',
      useGenerated: true,
    },
    isFallback: true,
  },
];
