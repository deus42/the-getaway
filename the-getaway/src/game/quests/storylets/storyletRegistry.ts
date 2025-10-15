import { StoryletPlay } from './storyletTypes';

const STORYLET_LIBRARY: StoryletPlay[] = [
  {
    id: 'firelight_ambush',
    arc: 'act1_setup',
    titleKey: 'storylets.firelight_ambush.title',
    synopsisKey: 'storylets.firelight_ambush.synopsis',
    tags: ['ambush', 'resistance', 'omen'],
    triggers: [
      {
        type: 'missionCompletion',
        tags: ['resistance'],
        intensity: 'medium',
      },
    ],
    roles: [
      {
        id: 'protagonist',
        titleKey: 'storylets.roles.protagonist',
        preferredTags: ['operative', 'player'],
        fallbackToPlayer: true,
        allowWounded: true,
      },
      {
        id: 'mentor',
        titleKey: 'storylets.roles.mentor',
        requiredTags: ['resistance'],
        preferredTags: ['strategist', 'quartermaster'],
      },
      {
        id: 'witness',
        titleKey: 'storylets.roles.witness',
        preferredTags: ['civilian', 'witness'],
        allowWounded: false,
        fallbackToPlayer: true,
      },
    ],
    branches: [
      {
        id: 'scarred_victory',
        weight: 2,
        conditions: [
          {
            type: 'roleStatus',
            roleId: 'protagonist',
            status: 'wounded',
          },
        ],
        outcome: {
          id: 'scarred_victory',
          localizationKey: 'storylets.firelight_ambush.outcomes.scarred_victory',
          variantKey: 'wounded',
          effects: [
            {
              type: 'faction',
              factionId: 'resistance',
              delta: 8,
              reason: 'storylet:firelight_ambush',
            },
            {
              type: 'log',
              logKey: 'storylets.firelight_ambush.log.wounded',
              severity: 'info',
            },
          ],
          tags: ['injury', 'loyalty'],
        },
      },
      {
        id: 'clean_sweep',
        outcome: {
          id: 'clean_sweep',
          localizationKey: 'storylets.firelight_ambush.outcomes.clean_sweep',
          effects: [
            {
              type: 'faction',
              factionId: 'resistance',
              delta: 5,
              reason: 'storylet:firelight_ambush',
            },
            {
              type: 'log',
              logKey: 'storylets.firelight_ambush.log.clean',
              severity: 'info',
            },
          ],
          tags: ['loyalty'],
        },
      },
    ],
    cooldown: {
      durationMs: 1000 * 60 * 20, // 20 minutes
      perLocation: true,
    },
    weight: 3,
  },
  {
    id: 'neon_bivouac',
    arc: 'act2_escalation',
    titleKey: 'storylets.neon_bivouac.title',
    synopsisKey: 'storylets.neon_bivouac.synopsis',
    tags: ['relationship', 'rest', 'memory'],
    triggers: [
      {
        type: 'campfireRest',
        tags: ['rest'],
        intensity: 'low',
      },
    ],
    roles: [
      {
        id: 'protagonist',
        titleKey: 'storylets.roles.protagonist',
        preferredTags: ['operative', 'player'],
        fallbackToPlayer: true,
        allowWounded: true,
      },
      {
        id: 'confidant',
        titleKey: 'storylets.roles.confidant',
        requiredTags: ['ally'],
        preferredTags: ['bonded', 'scholar', 'strategist'],
        allowWounded: true,
      },
    ],
    branches: [
      {
        id: 'bond_renewed',
        weight: 3,
        conditions: [
          {
            type: 'roleRelationship',
            roleId: 'confidant',
            relationship: 'bonded',
          },
        ],
        outcome: {
          id: 'bond_renewed',
          localizationKey: 'storylets.neon_bivouac.outcomes.bond_renewed',
          variantKey: 'bonded',
          effects: [
            {
              type: 'log',
              logKey: 'storylets.neon_bivouac.log.bonded',
              severity: 'info',
            },
            {
              type: 'traitDelta',
              target: 'player',
              trait: 'earnest',
              delta: 1,
            },
          ],
          tags: ['relationship', 'loyalty'],
        },
      },
      {
        id: 'quiet_distance',
        outcome: {
          id: 'quiet_distance',
          localizationKey: 'storylets.neon_bivouac.outcomes.quiet_distance',
          effects: [
            {
              type: 'log',
              logKey: 'storylets.neon_bivouac.log.distance',
              severity: 'info',
            },
          ],
          tags: ['memory'],
        },
      },
    ],
    cooldown: {
      durationMs: 1000 * 60 * 30, // 30 minutes
      perLocation: true,
    },
    weight: 2,
  },
  {
    id: 'serrated_omen',
    arc: 'act3_finale',
    titleKey: 'storylets.serrated_omen.title',
    synopsisKey: 'storylets.serrated_omen.synopsis',
    tags: ['ambush', 'corpsec', 'injury', 'omen'],
    triggers: [
      {
        type: 'patrolAmbush',
        tags: ['corpsec', 'ambush'],
        intensity: 'high',
      },
    ],
    roles: [
      {
        id: 'protagonist',
        titleKey: 'storylets.roles.protagonist',
        preferredTags: ['operative', 'player'],
        fallbackToPlayer: true,
        allowWounded: true,
      },
      {
        id: 'rival',
        titleKey: 'storylets.roles.rival',
        requiredTags: ['corpsec'],
        preferredTags: ['rival', 'warden'],
        allowWounded: true,
      },
      {
        id: 'witness',
        titleKey: 'storylets.roles.witness',
        preferredTags: ['resistance', 'ally'],
        allowWounded: true,
        fallbackToPlayer: false,
      },
    ],
    branches: [
      {
        id: 'rivalry_ignites',
        weight: 2,
        conditions: [
          {
            type: 'roleRelationship',
            roleId: 'rival',
            relationship: 'rival',
          },
        ],
        outcome: {
          id: 'rivalry_ignites',
          localizationKey: 'storylets.serrated_omen.outcomes.rivalry_ignites',
          variantKey: 'rival',
          effects: [
            {
              type: 'faction',
              factionId: 'corpsec',
              delta: -10,
              reason: 'storylet:serrated_omen',
            },
            {
              type: 'playerHealth',
              delta: -4,
              allowKO: false,
            },
            {
              type: 'log',
              logKey: 'storylets.serrated_omen.log.rival',
              severity: 'warning',
            },
          ],
          tags: ['injury', 'corpsec'],
        },
      },
      {
        id: 'shadows_scatter',
        outcome: {
          id: 'shadows_scatter',
          localizationKey: 'storylets.serrated_omen.outcomes.shadows_scatter',
          effects: [
            {
              type: 'log',
              logKey: 'storylets.serrated_omen.log.default',
              severity: 'info',
            },
          ],
          tags: ['ambush'],
        },
      },
    ],
    cooldown: {
      durationMs: 1000 * 60 * 25, // 25 minutes
      perLocation: true,
    },
    weight: 3,
  },
];

const STORYLET_MAP = STORYLET_LIBRARY.reduce<Record<string, StoryletPlay>>((acc, play) => {
  acc[play.id] = play;
  return acc;
}, {});

export const getStoryletLibrary = (): StoryletPlay[] => STORYLET_LIBRARY;

export const getStoryletById = (id: string): StoryletPlay | undefined => STORYLET_MAP[id];
