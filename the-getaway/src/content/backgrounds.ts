import { StatModifiers } from '../game/interfaces/types';
import { ItemDefinitionId } from './items';

export type BackgroundFaction = 'resistance' | 'corpsec' | 'scavengers';

export type StartingItemDefinition =
  | {
      type: 'catalog';
      definitionId: ItemDefinitionId;
      equip?: boolean;
      quantity?: number;
      durability?: {
        max?: number;
        current?: number;
      };
    }
  | {
      type: 'weapon';
      name: string;
      damage: number;
      range: number;
      apCost: number;
      weight: number;
      statModifiers?: StatModifiers;
      equip?: boolean;
      skillType?: import('../game/interfaces/types').CombatSkillId;
    }
  | {
      type: 'armor';
      name: string;
      protection: number;
      weight: number;
      statModifiers?: StatModifiers;
      equip?: boolean;
    }
  | {
      type: 'consumable';
      name: string;
      effectType: 'health' | 'actionPoints' | 'stat' | 'repair';
      value: number;
      statAffected?: keyof import('../game/interfaces/types').PlayerSkills;
      weight?: number;
      target?: 'weapon' | 'armor' | 'any';
      stackable?: boolean;
      maxStack?: number;
      quantity?: number;
    }
  | {
      type: 'item';
      name: string;
      description: string;
      weight: number;
      isQuestItem?: boolean;
    };

export interface BackgroundDefinition {
  id: string;
  name: string;
  tagline: string;
  description: string[];
  perk?: {
    id: string;
    name: string;
    description: string;
  };
  factionAdjustments: Partial<Record<BackgroundFaction, number>>;
  startingEquipment: StartingItemDefinition[];
}

export const BACKGROUNDS: BackgroundDefinition[] = [
  {
    id: 'corpsec_defector',
    name: 'Ex-CorpSec Defector',
    tagline: 'Turned the regime’s training against them.',
    description: [
      'Former security officer who leaked patrol routes until the alarms sounded on you.',
      'You know their formations by heart and still dream in evac sirens.',
    ],
    // Background perks not yet implemented - reserved for future expansion
    // perk: {
    //   id: 'tactical_training',
    //   name: 'Tactical Training',
    //   description: 'Ranged weapons deal +10% damage and start with +1 accuracy tier.',
    // },
    factionAdjustments: {
      resistance: 10,
      corpsec: -20,
    },
    startingEquipment: [
      {
        type: 'catalog',
        definitionId: 'weapon_corpsec_service_pistol',
        equip: true,
      },
      {
        type: 'catalog',
        definitionId: 'armor_kevlar_vest',
        equip: true,
      },
      {
        type: 'catalog',
        definitionId: 'misc_corpsec_credentials',
      },
      {
        type: 'catalog',
        definitionId: 'consumable_basic_repair_kit',
        quantity: 1,
      },
    ],
  },
  {
    id: 'street_urchin',
    name: 'Street Urchin',
    tagline: 'Raised by alleys, guided by whispers.',
    description: [
      'You hustled the markets since curfew was a bedtime story.',
      'Lockpicks, fast feet, and favor debts keep you breathing.',
    ],
    // Background perks not yet implemented - reserved for future expansion
    // perk: {
    //   id: 'street_smarts',
    //   name: 'Street Smarts',
    //   description: 'Stealth +15% and barter prices improved by 10%.',
    // },
    factionAdjustments: {
      scavengers: 10,
    },
    startingEquipment: [
      {
        type: 'catalog',
        definitionId: 'weapon_shiv_knife',
        equip: true,
      },
      {
        type: 'catalog',
        definitionId: 'armor_layered_leather_jacket',
        equip: true,
      },
      {
        type: 'catalog',
        definitionId: 'misc_lockpick_set',
      },
      {
        type: 'catalog',
        definitionId: 'consumable_basic_repair_kit',
        quantity: 1,
      },
    ],
  },
  {
    id: 'underground_hacker',
    name: 'Underground Hacker',
    tagline: 'Screensaver by day, blackout by night.',
    description: [
      'Your code toppled curfew drones before dawn.',
      'Signal ghosts and failsafe exploits follow in your wake.',
    ],
    // Background perks not yet implemented - reserved for future expansion
    // perk: {
    //   id: 'code_breaker',
    //   name: 'Code Breaker',
    //   description: 'Hacking challenges gain +20% success chance and unlock unique bypass options.',
    // },
    factionAdjustments: {
      resistance: 15,
      corpsec: -10,
    },
    startingEquipment: [
      {
        type: 'catalog',
        definitionId: 'misc_custom_deck',
      },
      {
        type: 'catalog',
        definitionId: 'misc_emp_charge',
      },
      {
        type: 'catalog',
        definitionId: 'armor_utility_hoodie',
        equip: true,
      },
      {
        type: 'catalog',
        definitionId: 'consumable_basic_repair_kit',
        quantity: 1,
      },
    ],
  },
  {
    id: 'wasteland_scavenger',
    name: 'Wasteland Scavenger',
    tagline: 'Dust lungs, steady hands, endless caches.',
    description: [
      'You crossed toxic badlands with nothing but a crowbar and spite.',
      'Trade routes and buried caches live in your head like lullabies.',
    ],
    // Background perks not yet implemented - reserved for future expansion
    // perk: {
    //   id: 'survivalist',
    //   name: 'Survivalist',
    //   description: 'Crafting costs reduced by 25% and environmental damage reduced by 2.',
    // },
    factionAdjustments: {
      scavengers: 10,
      resistance: 5,
    },
    startingEquipment: [
      {
        type: 'catalog',
        definitionId: 'weapon_industrial_crowbar',
        equip: true,
      },
      {
        type: 'catalog',
        definitionId: 'misc_gas_mask',
      },
      {
        type: 'catalog',
        definitionId: 'consumable_field_medkit',
        quantity: 1,
      },
      {
        type: 'catalog',
        definitionId: 'consumable_basic_repair_kit',
        quantity: 1,
      },
    ],
  },
];

export const BACKGROUND_MAP = Object.fromEntries(
  BACKGROUNDS.map((background) => [background.id, background])
);
