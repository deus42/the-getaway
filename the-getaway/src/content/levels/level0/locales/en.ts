import { Level0LocaleContent } from '../types';

export const level0EnglishContent: Level0LocaleContent = {
  dialogues: [
    {
      id: 'npc_lira_vendor',
      npcId: 'Lira the Smuggler',
      nodes: [
        {
          id: 'intro',
          text: 'Lira taps ash into a ration tin shaped like a coyote. "Need gear, gossip, or a miracle? Silver buys silence. Favours keep you breathing past curfew."',
          options: [
            {
              text: 'What’s humming through the market tonight?',
              nextNodeId: 'trade',
              skillCheck: {
                skill: 'charisma',
                threshold: 6,
              },
            },
            {
              text: 'Any shipments vanish like the coyotes Harbour Control promised us?',
              nextNodeId: 'quest',
              questEffect: {
                questId: 'quest_market_cache',
                effect: 'start',
              },
            },
            {
              text: 'Cache is back in rebel hands.',
              nextNodeId: 'quest_complete',
              questEffect: {
                questId: 'quest_market_cache',
                effect: 'complete',
              },
            },
            {
              text: 'Keep that halo crooked, Lira.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'trade',
          text: '"Inventory is thinner than curfew soup. Bring transit tokens and I’ll pop the reserve locker before the drones finish their hymn."',
          options: [
            {
              text: 'I’ll rattle a few turnstiles.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'quest',
          text: '"CorpSec bagged my street cache and called it evidence. Slip into Downtown, liberate the crates, and we’ll toast with reclaimed rainwater."',
          options: [
            {
              text: 'Consider their evidence misplaced.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'quest_complete',
          text: '"Knew you’d outrun their choirboys. I’m rerouting stock through alleys where the neon farms still glow."',
          options: [
            {
              text: 'Stay unscannable, Lira.',
              nextNodeId: null,
            },
          ],
        },
      ],
    },
    {
      id: 'npc_archivist_naila',
      npcId: 'Archivist Naila',
      nodes: [
        {
          id: 'intro',
          text: 'Naila polishes cracked lenses that reflect three different skies. "Knowledge is leverage. Help me unmask their manifests and I’ll carve you breathing space."',
          options: [
            {
              text: 'What relic are we lifting today?',
              nextNodeId: 'mission',
              questEffect: {
                questId: 'quest_datapad_truth',
                effect: 'start',
              },
            },
            {
              text: 'The manifests are singing on my rig.',
              nextNodeId: 'mission_complete',
              questEffect: {
                questId: 'quest_datapad_truth',
                effect: 'complete',
              },
            },
            {
              text: 'Rain check, Archivist.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'mission',
          text: '"Lira’s guarding a datapad fat with patrol math. Bring it home and I’ll paint their rotations like constellations."',
          options: [
            {
              text: 'I’ll fetch the glowing brick.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'mission_complete',
          text: '"This cracks them wide open. Uploading safe windows to your ops board before Harrow’s speechwriters invent new lies."',
          options: [
            {
              text: 'Appreciate the starlight, Naila.',
              nextNodeId: null,
            },
          ],
        },
      ],
    },
    {
      id: 'npc_courier_brant',
      npcId: 'Courier Brant',
      nodes: [
        {
          id: 'intro',
          text: 'Brant pats a battered messenger bag like it might bark. "My runners vanished after curfew. Help me find them and I’ll open my routes like a choose-your-own-adventure."',
          options: [
            {
              text: 'Point me toward their last breadcrumb.',
              nextNodeId: 'task',
              questEffect: {
                questId: 'quest_courier_network',
                effect: 'start',
              },
            },
            {
              text: 'Your couriers beat the curfew this time.',
              nextNodeId: 'task_complete',
              questEffect: {
                questId: 'quest_courier_network',
                effect: 'complete',
              },
            },
            {
              text: 'Different fire to put out tonight.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'task',
          text: '"They were logging tram tokens near the hub, humming old Metro jingles. Sweep the plazas, grab whatever they stashed."',
          options: [
            {
              text: 'Stay restless, Brant.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'task_complete',
          text: '"You dragged them out of the drone choir. These routes will keep you two minutes ahead of the sweepers."',
          options: [
            {
              text: 'Keep the network breathing raggedly.',
              nextNodeId: null,
            },
          ],
        },
      ],
    },
  ],
  quests: [
    {
      id: 'quest_market_cache',
      name: 'Market Cache Recovery',
      description: 'Lira wants her seized Smuggler cache liberated from a Downtown patrol route.',
      isActive: false,
      isCompleted: false,
      objectives: [
        {
          id: 'recover-keycard',
          description: 'Secure the Corporate Keycard hidden in Downtown.',
          isCompleted: false,
          type: 'collect',
          target: 'Corporate Keycard',
          count: 1,
          currentCount: 0,
        },
        {
          id: 'return-to-lira',
          description: 'Return to Lira in the Slums.',
          isCompleted: false,
          type: 'talk',
          target: 'Lira the Smuggler',
        },
      ],
      rewards: [
        { type: 'currency', amount: 80 },
        { type: 'item', id: 'Encrypted Datapad', amount: 1 },
      ],
    },
    {
      id: 'quest_datapad_truth',
      name: 'Manifests of Control',
      description: 'Archivist Naila needs the Encrypted Datapad to expose patrol rotations.',
      isActive: false,
      isCompleted: false,
      objectives: [
        {
          id: 'obtain-datapad',
          description: 'Acquire the Encrypted Datapad from the Slums cache.',
          isCompleted: false,
          type: 'collect',
          target: 'Encrypted Datapad',
          count: 1,
          currentCount: 0,
        },
        {
          id: 'deliver-naila',
          description: 'Deliver the datapad to Archivist Naila in Downtown.',
          isCompleted: false,
          type: 'talk',
          target: 'Archivist Naila',
        },
      ],
      rewards: [
        { type: 'experience', amount: 120 },
        { type: 'item', id: 'Transit Tokens', amount: 1 },
      ],
    },
    {
      id: 'quest_courier_network',
      name: 'Courier Network Rescue',
      description: 'Courier Brant lost contact with his runners near the transit hub.',
      isActive: false,
      isCompleted: false,
      objectives: [
        {
          id: 'find-transit-tokens',
          description: 'Collect Transit Tokens scattered around Downtown plazas.',
          isCompleted: false,
          type: 'collect',
          target: 'Transit Tokens',
          count: 3,
          currentCount: 0,
        },
        {
          id: 'report-brant',
          description: 'Report back to Courier Brant with the recovered tokens.',
          isCompleted: false,
          type: 'talk',
          target: 'Courier Brant',
        },
      ],
      rewards: [
        { type: 'experience', amount: 90 },
        { type: 'currency', amount: 60 },
      ],
    },
  ],
  npcBlueprints: [
    {
      name: 'Lira the Smuggler',
      position: { x: 26, y: 20 },
      health: 12,
      maxHealth: 12,
      routine: [
        { position: { x: 26, y: 20 }, timeOfDay: 'day', duration: 240 },
        { position: { x: 30, y: 26 }, timeOfDay: 'evening', duration: 240 },
        { position: { x: 22, y: 19 }, timeOfDay: 'night', duration: 240 },
      ],
      dialogueId: 'npc_lira_vendor',
      isInteractive: true,
    },
    {
      name: 'Orn Patrol Sentry',
      position: { x: 46, y: 28 },
      health: 20,
      maxHealth: 20,
      routine: [
        { position: { x: 46, y: 28 }, timeOfDay: 'day', duration: 180 },
        { position: { x: 50, y: 20 }, timeOfDay: 'evening', duration: 180 },
        { position: { x: 40, y: 34 }, timeOfDay: 'night', duration: 180 },
      ],
      dialogueId: 'npc_guard_orn',
      isInteractive: false,
    },
    {
      name: 'Archivist Naila',
      position: { x: 28, y: 14 },
      health: 14,
      maxHealth: 14,
      routine: [
        { position: { x: 28, y: 14 }, timeOfDay: 'day', duration: 300 },
        { position: { x: 32, y: 24 }, timeOfDay: 'evening', duration: 300 },
      ],
      dialogueId: 'npc_archivist_naila',
      isInteractive: true,
    },
    {
      name: 'Courier Brant',
      position: { x: 14, y: 24 },
      health: 16,
      maxHealth: 16,
      routine: [
        { position: { x: 14, y: 24 }, timeOfDay: 'day', duration: 180 },
        { position: { x: 10, y: 16 }, timeOfDay: 'evening', duration: 180 },
        { position: { x: 34, y: 16 }, timeOfDay: 'night', duration: 180 },
      ],
      dialogueId: 'npc_courier_brant',
      isInteractive: true,
    },
  ],
  itemBlueprints: [
    {
      name: 'Abandoned Medkit',
      description: 'A half-stocked medkit tucked beside a market stall.',
      weight: 2,
      value: 40,
      isQuestItem: false,
    },
    {
      name: 'Encrypted Datapad',
      description: 'Contains black market manifests guarded by Lira.',
      weight: 1,
      value: 150,
      isQuestItem: true,
    },
    {
      name: 'Corporate Keycard',
      description: 'Security clearance stolen from a tower executive.',
      weight: 0.2,
      value: 200,
      isQuestItem: true,
    },
    {
      name: 'Transit Tokens',
      description: 'Old metro tokens. Some merchants still barter for them.',
      weight: 0.5,
      value: 30,
      isQuestItem: false,
    },
  ],
  buildingDefinitions: [
    {
      id: 'block_1_1',
      name: 'Waterfront Commons',
      footprint: { from: { x: 4, y: 4 }, to: { x: 23, y: 19 } },
      door: { x: 13, y: 20 },
      interior: { width: 20, height: 12 },
    },
    {
      id: 'block_1_2',
      name: 'Mercantile Exchange',
      footprint: { from: { x: 27, y: 4 }, to: { x: 59, y: 19 } },
      door: { x: 43, y: 20 },
      interior: { width: 26, height: 12 },
    },
    {
      id: 'block_1_3',
      name: 'Arcology Plaza',
      footprint: { from: { x: 63, y: 4 }, to: { x: 95, y: 19 } },
      door: { x: 79, y: 20 },
      interior: { width: 26, height: 12 },
    },
    {
      id: 'block_1_4',
      name: 'Civic Forum',
      footprint: { from: { x: 99, y: 4 }, to: { x: 131, y: 19 } },
      door: { x: 115, y: 20 },
      interior: { width: 28, height: 12 },
    },
    {
      id: 'block_2_1',
      name: 'Residency Row',
      footprint: { from: { x: 4, y: 22 }, to: { x: 23, y: 43 } },
      door: { x: 13, y: 44 },
      interior: { width: 18, height: 14 },
    },
    {
      id: 'block_2_2',
      name: 'Market Hub',
      footprint: { from: { x: 27, y: 22 }, to: { x: 59, y: 43 } },
      door: { x: 43, y: 44 },
      interior: { width: 26, height: 14 },
    },
    {
      id: 'block_2_3',
      name: 'Corporate Plaza',
      footprint: { from: { x: 63, y: 22 }, to: { x: 95, y: 43 } },
      door: { x: 79, y: 44 },
      interior: { width: 26, height: 14 },
    },
    {
      id: 'block_2_4',
      name: 'Registry Plaza',
      footprint: { from: { x: 99, y: 22 }, to: { x: 131, y: 43 } },
      door: { x: 115, y: 44 },
      interior: { width: 28, height: 14 },
    },
    {
      id: 'block_3_1',
      name: 'Industrial Yards',
      footprint: { from: { x: 4, y: 46 }, to: { x: 23, y: 67 } },
      door: { x: 13, y: 68 },
      interior: { width: 18, height: 14 },
    },
    {
      id: 'block_3_2',
      name: 'Transit Node',
      footprint: { from: { x: 27, y: 46 }, to: { x: 59, y: 67 } },
      door: { x: 43, y: 68 },
      interior: { width: 26, height: 14 },
    },
    {
      id: 'block_3_3',
      name: 'Research Quadrant',
      footprint: { from: { x: 63, y: 46 }, to: { x: 95, y: 67 } },
      door: { x: 79, y: 68 },
      interior: { width: 26, height: 14 },
    },
    {
      id: 'block_3_4',
      name: 'Museum Promenade',
      footprint: { from: { x: 99, y: 46 }, to: { x: 131, y: 67 } },
      door: { x: 115, y: 68 },
      interior: { width: 28, height: 14 },
    },
    {
      id: 'block_4_1',
      name: 'Logistics Yard',
      footprint: { from: { x: 4, y: 70 }, to: { x: 23, y: 91 } },
      door: { x: 13, y: 92 },
      interior: { width: 18, height: 14 },
    },
    {
      id: 'block_4_2',
      name: 'Entertainment Strip',
      footprint: { from: { x: 27, y: 70 }, to: { x: 59, y: 91 } },
      door: { x: 43, y: 92 },
      interior: { width: 26, height: 14 },
    },
    {
      id: 'block_4_3',
      name: 'Solar Array',
      footprint: { from: { x: 63, y: 70 }, to: { x: 95, y: 91 } },
      door: { x: 79, y: 92 },
      interior: { width: 26, height: 14 },
    },
    {
      id: 'block_4_4',
      name: 'Aerostat Docks',
      footprint: { from: { x: 99, y: 70 }, to: { x: 131, y: 91 } },
      door: { x: 115, y: 92 },
      interior: { width: 28, height: 14 },
    },
  ],
  coverSpots: {
    slums: [
      { x: 12, y: 20 },
      { x: 18, y: 14 },
      { x: 24, y: 24 },
      { x: 28, y: 30 },
      { x: 34, y: 22 },
      { x: 40, y: 28 },
      { x: 8, y: 24 },
      { x: 14, y: 32 },
      { x: 22, y: 8 },
      { x: 30, y: 10 },
      { x: 44, y: 24 },
      { x: 48, y: 32 },
      { x: 36, y: 12 },
      { x: 50, y: 18 },
      { x: 18, y: 34 },
      { x: 10, y: 12 },
    ],
    downtown: [
      { x: 12, y: 18 },
      { x: 20, y: 20 },
      { x: 42, y: 18 },
      { x: 52, y: 20 },
      { x: 74, y: 18 },
      { x: 84, y: 20 },
      { x: 106, y: 18 },
      { x: 118, y: 20 },
      { x: 14, y: 40 },
      { x: 22, y: 44 },
      { x: 44, y: 38 },
      { x: 56, y: 44 },
      { x: 76, y: 40 },
      { x: 88, y: 44 },
      { x: 108, y: 38 },
      { x: 120, y: 44 },
      { x: 16, y: 68 },
      { x: 26, y: 70 },
      { x: 46, y: 66 },
      { x: 58, y: 68 },
      { x: 80, y: 66 },
      { x: 92, y: 68 },
      { x: 112, y: 66 },
      { x: 124, y: 68 },
      { x: 18, y: 94 },
      { x: 30, y: 96 },
      { x: 48, y: 94 },
      { x: 62, y: 92 },
      { x: 82, y: 94 },
      { x: 100, y: 92 },
      { x: 116, y: 96 },
      { x: 132, y: 94 },
    ],
  },
  world: {
    areaName: 'Downtown',
    objectives: [
      'Survey the Slums perimeter and mark hostile patrols',
      'Establish contact with Lira the Smuggler',
      'Secure shelter before curfew sweeps begin',
    ],
    initialEnemyName: 'Guard',
  },
};
