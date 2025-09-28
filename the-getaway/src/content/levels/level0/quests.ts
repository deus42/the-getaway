import { Quest } from '../../../game/interfaces/types';

export const level0Quests: Quest[] = [
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
];
