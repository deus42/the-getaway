import { Player, PlayerSkills, SkillId, PerkCategory, PerkId } from '../game/interfaces/types';

export interface PerkDefinition {
  id: PerkId;
  name: string;
  category: PerkCategory;
  levelRequirement: number;
  description: string;
  effects: string[];
  attributeRequirements?: Array<{ attribute: keyof PlayerSkills; value: number }>;
  skillRequirements?: Array<{ skill: SkillId; value: number }>;
  capstone?: boolean;
  flavor?: string;
}

export interface PerkAvailability {
  perk: PerkDefinition;
  canSelect: boolean;
  reasons: string[];
}

const PERK_DEFINITIONS: PerkDefinition[] = [
  {
    id: 'steadyHands',
    name: 'Steady Hands',
    category: 'combat',
    levelRequirement: 2,
    description: 'Disciplined trigger control keeps recoil in check under fire.',
    effects: ['+10% hit chance with ranged weapons'],
    attributeRequirements: [{ attribute: 'perception', value: 5 }],
  },
  {
    id: 'toughness',
    name: 'Toughness',
    category: 'combat',
    levelRequirement: 2,
    description: 'Scar tissue and grit harden you against battlefield punishment.',
    effects: ['Gain +3 damage resistance'],
    attributeRequirements: [{ attribute: 'endurance', value: 6 }],
  },
  {
    id: 'quickDraw',
    name: 'Quick Draw',
    category: 'combat',
    levelRequirement: 4,
    description: 'Weapons leap into your hands as if magnetised.',
    effects: ['Swapping or equipping weapons costs 0 AP'],
    attributeRequirements: [{ attribute: 'agility', value: 6 }],
    skillRequirements: [{ skill: 'smallGuns', value: 40 }],
  },
  {
    id: 'adrenalineRush',
    name: 'Adrenaline Rush',
    category: 'utility',
    levelRequirement: 4,
    description: 'Near-death spikes your system with combat-ready focus.',
    effects: ['Dropping below 30% HP grants +2 AP for 3 turns'],
    attributeRequirements: [{ attribute: 'endurance', value: 5 }],
  },
  {
    id: 'silentRunner',
    name: 'Silent Runner',
    category: 'utility',
    levelRequirement: 6,
    description: 'Years of training let you sprint without betraying a whisper.',
    effects: ['Running no longer reduces stealth rating'],
    attributeRequirements: [{ attribute: 'agility', value: 7 }],
    skillRequirements: [{ skill: 'stealth', value: 50 }],
  },
  {
    id: 'gunFu',
    name: 'Gun Fu',
    category: 'combat',
    levelRequirement: 12,
    description: 'You flow from target to target with effortless precision.',
    effects: ['First shot each turn costs 0 AP'],
    attributeRequirements: [{ attribute: 'agility', value: 8 }],
    skillRequirements: [{ skill: 'smallGuns', value: 75 }],
    capstone: true,
  },
  {
    id: 'ghost',
    name: 'Ghost',
    category: 'utility',
    levelRequirement: 12,
    description: 'Two breaths and you vanish between the neon glare.',
    effects: ['Entering stealth grants 2 turns of invisibility (once per combat)'],
    attributeRequirements: [{ attribute: 'agility', value: 8 }],
    skillRequirements: [{ skill: 'stealth', value: 75 }],
    capstone: true,
  },
  {
    id: 'executioner',
    name: 'Executioner',
    category: 'combat',
    levelRequirement: 12,
    description: 'You finish fights before enemies can blink.',
    effects: ['Attacks against enemies below 25% HP automatically crit'],
    attributeRequirements: [{ attribute: 'perception', value: 8 }],
    skillRequirements: [{ skill: 'energyWeapons', value: 75 }],
    capstone: true,
  },
];

const PERK_LOOKUP: Record<PerkId, PerkDefinition> = PERK_DEFINITIONS.reduce((acc, perk) => {
  acc[perk.id] = perk;
  return acc;
}, {} as Record<PerkId, PerkDefinition>);

export const PERK_CATEGORIES: PerkCategory[] = ['combat', 'utility', 'dialogue', 'capstone'];

export const listPerks = (): PerkDefinition[] => PERK_DEFINITIONS.slice();

export const listPerksByCategory = (category: PerkCategory): PerkDefinition[] =>
  PERK_DEFINITIONS.filter((perk) => {
    if (category === 'capstone') {
      return perk.capstone === true;
    }
    return perk.category === category && !perk.capstone;
  });

export const getPerkDefinition = (id: PerkId): PerkDefinition => {
  const perk = PERK_LOOKUP[id];
  if (!perk) {
    throw new Error(`[perks] Unknown perk id: ${id}`);
  }
  return perk;
};

const meetsAttributeRequirements = (player: Player, perk: PerkDefinition): string[] => {
  if (!perk.attributeRequirements) {
    return [];
  }

  return perk.attributeRequirements
    .filter(({ attribute, value }) => player.skills[attribute] < value)
    .map(({ attribute, value }) => `${attribute.toUpperCase()} ${value}`);
};

const meetsSkillRequirements = (player: Player, perk: PerkDefinition): string[] => {
  if (!perk.skillRequirements) {
    return [];
  }

  return perk.skillRequirements
    .filter(({ skill, value }) => (player.skillTraining[skill] ?? 0) < value)
    .map(({ skill, value }) => `${skill} ${value}`);
};

export const evaluatePerkAvailability = (player: Player, perk: PerkDefinition): PerkAvailability => {
  const reasons: string[] = [];

  if (player.perks.includes(perk.id)) {
    reasons.push('Already acquired');
  }

  if (player.level < perk.levelRequirement) {
    reasons.push(`Requires level ${perk.levelRequirement}`);
  }

  const attributeFailures = meetsAttributeRequirements(player, perk);
  if (attributeFailures.length > 0) {
    reasons.push(`Attributes: ${attributeFailures.join(', ')}`);
  }

  const skillFailures = meetsSkillRequirements(player, perk);
  if (skillFailures.length > 0) {
    reasons.push(`Skills: ${skillFailures.join(', ')}`);
  }

  return {
    perk,
    canSelect: reasons.length === 0,
    reasons,
  };
};
