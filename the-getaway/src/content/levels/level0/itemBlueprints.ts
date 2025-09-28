import { Item } from '../../../game/interfaces/types';

export const level0SlumsItems: Array<Omit<Item, 'id'>> = [
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
];

export const level0DowntownItems: Array<Omit<Item, 'id'>> = [
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
];

export const level0AllItems: Array<Omit<Item, 'id'>> = [
  ...level0SlumsItems,
  ...level0DowntownItems,
];
