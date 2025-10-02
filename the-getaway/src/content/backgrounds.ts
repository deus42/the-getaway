import { StatModifiers } from '../game/interfaces/types';

export type BackgroundFaction = 'resistance' | 'corpsec' | 'scavengers';

export type StartingItemDefinition =
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
      effectType: 'health' | 'actionPoints' | 'stat';
      value: number;
      statAffected?: keyof import('../game/interfaces/types').PlayerSkills;
      weight?: number;
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
  perk: {
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
    perk: {
      id: 'tactical_training',
      name: 'Tactical Training',
      description: 'Ranged weapons deal +10% damage and start with +1 accuracy tier.',
    },
    factionAdjustments: {
      resistance: 10,
      corpsec: -20,
    },
    startingEquipment: [
      {
        type: 'weapon',
        name: 'CorpSec Service Pistol',
        damage: 12,
        range: 6,
        apCost: 3,
        weight: 3,
        skillType: 'smallGuns',
        equip: true,
      },
      {
        type: 'armor',
        name: 'Kevlar Vest',
        protection: 4,
        weight: 6,
        equip: true,
      },
      {
        type: 'item',
        name: 'CorpSec Credentials',
        description: 'Forged badge and access card from your old unit. May open a door—or raise a gun.',
        weight: 0.5,
        isQuestItem: true,
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
    perk: {
      id: 'street_smarts',
      name: 'Street Smarts',
      description: 'Stealth +15% and barter prices improved by 10%.',
    },
    factionAdjustments: {
      scavengers: 10,
    },
    startingEquipment: [
      {
        type: 'weapon',
        name: 'Shiv Knife',
        damage: 8,
        range: 1,
        apCost: 2,
        weight: 1,
        skillType: 'meleeCombat',
        equip: true,
      },
      {
        type: 'armor',
        name: 'Layered Leather Jacket',
        protection: 2,
        weight: 3,
        equip: true,
      },
      {
        type: 'item',
        name: 'Lockpick Set',
        description: 'Handmade picks tucked in wrap bandages. Essential for doors and dead drops.',
        weight: 0.3,
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
    perk: {
      id: 'code_breaker',
      name: 'Code Breaker',
      description: 'Hacking challenges gain +20% success chance and unlock unique bypass options.',
    },
    factionAdjustments: {
      resistance: 15,
      corpsec: -10,
    },
    startingEquipment: [
      {
        type: 'item',
        name: 'Custom Deck',
        description: 'Portable intrusion rig with cracked firmware and glowing keycaps.',
        weight: 2,
      },
      {
        type: 'item',
        name: 'EMP Charge',
        description: 'One-shot pulse device that fries cameras and briefly blinds drones.',
        weight: 1,
      },
      {
        type: 'armor',
        name: 'Utility Hoodie',
        protection: 1,
        weight: 2,
        equip: true,
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
    perk: {
      id: 'survivalist',
      name: 'Survivalist',
      description: 'Crafting costs reduced by 25% and environmental damage reduced by 2.',
    },
    factionAdjustments: {
      scavengers: 10,
      resistance: 5,
    },
    startingEquipment: [
      {
        type: 'weapon',
        name: 'Industrial Crowbar',
        damage: 14,
        range: 1,
        apCost: 3,
        weight: 5,
        skillType: 'meleeCombat',
        equip: true,
      },
      {
        type: 'item',
        name: 'Gas Mask',
        description: 'Filters patched with scavenged cloth. Keeps the toxic smog out—for a while.',
        weight: 2,
      },
      {
        type: 'consumable',
        name: 'Field Medkit',
        effectType: 'health',
        value: 25,
        weight: 1.5,
      },
    ],
  },
];

export const BACKGROUND_MAP = Object.fromEntries(
  BACKGROUNDS.map((background) => [background.id, background])
);
