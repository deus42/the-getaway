import { RoleDialogueTemplate } from '../../../game/narrative/dialogueTone/roleTemplateTypes';

const HAZARD_KEYWORDS = {
  blackout: ['blackout', 'brownout'],
  smog: ['smog', 'toxic', 'fumes'],
  surveillance: ['surveillance', 'camera', 'drone'],
};

const highlightItemTokens = [
  'ration bricks',
  'filtered water packs',
  'reactive dampeners',
  'silenced carbines',
  'patch kits',
];

const blackoutItems = ['battery bricks', 'jury-rigged lanterns', 'hand-crank dynamos'];
const smogItems = ['homemade filters', 'charcoal respirators', 'sealed goggles'];
const surveillanceItems = ['signal scrubbers', 'anti-drone flares', 'masking foil'];

const merchantRumors = [
  'Keep your head down; CorpSec doubled patrol rotations.',
  'George whispered about a convoy slipping through the south gate tonight.',
  'If you see a checkpoint scanner, go around—no one’s calibrating them right now.',
  'Word is the resistance safehouse stashed contraband in the hollow neon signs.',
];

export const MERCHANT_ROLE_TEMPLATES: RoleDialogueTemplate[] = [
  {
    id: 'merchant.default_greeting.resistanceFriend',
    roleId: 'merchant',
    templateKey: 'default_greeting',
    summary: 'Warm greeting for resistance-aligned players during regular hours.',
    content: 'Signal\'s clean for you. {{highlightItem}} just landed—priced for family. {{rumorHook}}',
    fallbackContent: 'Welcome back. Supplies are stocked.',
    gating: {
      faction: [
        {
          factionId: 'resistance',
          minimumReputation: 25,
        },
      ],
      forbiddenTimesOfDay: ['night'],
    },
    tokens: [
      {
        id: 'highlightItem',
        fallback: 'Ration bricks',
        resolve: (context, helpers) => {
          const hazards = context.world.hazards.join(' ').toLowerCase();
          if (HAZARD_KEYWORDS.blackout.some((keyword) => hazards.includes(keyword))) {
            return helpers.pickOne(blackoutItems, blackoutItems[0]);
          }
          if (HAZARD_KEYWORDS.smog.some((keyword) => hazards.includes(keyword))) {
            return helpers.pickOne(smogItems, smogItems[0]);
          }
          if (HAZARD_KEYWORDS.surveillance.some((keyword) => hazards.includes(keyword))) {
            return helpers.pickOne(surveillanceItems, surveillanceItems[0]);
          }
          return helpers.pickOne(highlightItemTokens, highlightItemTokens[0]);
        },
      },
      {
        id: 'rumorHook',
        fallback: 'Stay nimble out there.',
        resolve: (_context, helpers) => helpers.pickOne(merchantRumors, merchantRumors[0]),
      },
    ],
    toneOverrides: {
      templateId: 'template.deadpan.reassure',
      personaId: 'persona.amara_velez',
      useGenerated: true,
    },
    weight: 3,
  },
  {
    id: 'merchant.default_greeting.curfewUrgent',
    roleId: 'merchant',
    templateKey: 'default_greeting',
    summary: 'Curt greeting while curfew is active.',
    content: 'Curfew sirens already spun up. {{highlightItem}} on the counter—take it and bolt.',
    fallbackContent: 'Curfew\'s live. Make it quick.',
    gating: {
      requireCurfewActive: true,
    },
    tokens: [
      {
        id: 'highlightItem',
        fallback: 'Emergency stim kit',
        resolve: (context, helpers) => {
          if (context.player.perks.includes('quickDraw')) {
            return 'reflex chems—your speed deserves it';
          }
          if (context.player.perks.includes('toughness')) {
            return 'impact gel armor—fits right onto your plates';
          }
          return helpers.pickOne(['emergency stim kit', 'flashburst grenade', 'thermal cloak'], 'emergency stim kit');
        },
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
    id: 'merchant.default_greeting.corpsecWatcher',
    roleId: 'merchant',
    templateKey: 'default_greeting',
    summary: 'Wary exchange when player reputation is low with CorpSec.',
    content: 'CorpSec sniffers are wired to sniffing you. Credits up front, {{highlightItem}} after.',
    fallbackContent: 'No trust, no chatter—show credits.',
    gating: {
      faction: [
        {
          factionId: 'corpsec',
          maximumReputation: -10,
        },
      ],
    },
    tokens: [
      {
        id: 'highlightItem',
        fallback: 'scrambler chip',
        resolve: (_context, helpers) =>
          helpers.pickOne(['scrambler chip', 'masking foil strip', 'signal foam'], 'scrambler chip'),
      },
    ],
    toneOverrides: {
      templateId: 'template.urgent.push',
      personaId: 'persona.trace',
      useGenerated: true,
    },
  },
  {
    id: 'merchant.default_greeting.genericFallback',
    roleId: 'merchant',
    templateKey: 'default_greeting',
    summary: 'Default line when no other gating applies.',
    content: 'Stock\'s thin but serviceable. {{highlightItem}} still on the shelves.',
    fallbackContent: 'Limited stock today.',
    tokens: [
      {
        id: 'highlightItem',
        fallback: 'standard issue kits',
        resolve: (_context, helpers) =>
          helpers.pickOne(['standard issue kits', 'bulk rations', 'basic medpacks'], 'basic medpacks'),
      },
    ],
    toneOverrides: {
      templateId: 'template.deadpan.reassure',
      personaId: 'persona.trace',
      useGenerated: true,
    },
    weight: 1,
    isFallback: true,
  },
];
