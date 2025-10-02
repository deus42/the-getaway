import { SkillBranchId, SkillId } from '../game/interfaces/types';

export interface SkillDefinition {
  id: SkillId;
  name: string;
  branch: SkillBranchId;
  maxValue: number;
  increment: number;
  taggedIncrement: number;
  description: string;
  effectSummary: string;
  stub?: boolean;
}

export interface SkillBranchDefinition {
  id: SkillBranchId;
  label: string;
  blurb: string;
  skills: SkillDefinition[];
}

const DEFAULT_INCREMENT = 5;
const TAGGED_INCREMENT = 10;

export const SKILL_BRANCHES: SkillBranchDefinition[] = [
  {
    id: 'combat',
    label: 'Combat',
    blurb: 'Disciplines that determine battlefield performance and weapon mastery.',
    skills: [
      {
        id: 'smallGuns',
        name: 'Small Guns',
        branch: 'combat',
        maxValue: 100,
        increment: DEFAULT_INCREMENT,
        taggedIncrement: TAGGED_INCREMENT,
        description: 'Training with ballistic pistols, SMGs, and rifles.',
        effectSummary: '+0.5% hit chance per point with ballistic weapons.',
      },
      {
        id: 'energyWeapons',
        name: 'Energy Weapons',
        branch: 'combat',
        maxValue: 100,
        increment: DEFAULT_INCREMENT,
        taggedIncrement: TAGGED_INCREMENT,
        description: 'Mastery of beam, laser, and plasma weapon systems.',
        effectSummary: '+0.4% hit chance and +0.3% crit chance per point with energy weapons.',
      },
      {
        id: 'meleeCombat',
        name: 'Melee Combat',
        branch: 'combat',
        maxValue: 100,
        increment: DEFAULT_INCREMENT,
        taggedIncrement: TAGGED_INCREMENT,
        description: 'Close-quarters tactics for blades, clubs, and unarmed strikes.',
        effectSummary: '+0.3% melee hit chance per point and +1 damage per 10 points.',
      },
      {
        id: 'explosives',
        name: 'Explosives',
        branch: 'combat',
        maxValue: 100,
        increment: DEFAULT_INCREMENT,
        taggedIncrement: TAGGED_INCREMENT,
        description: 'Deployment of grenades, mines, and shaped charges.',
        effectSummary: '+0.25% throw accuracy per point and +1 tile radius per 25 points.',
      },
    ],
  },
  {
    id: 'tech',
    label: 'Tech',
    blurb: 'System infiltration, fabrication, and field engineering aptitudes.',
    skills: [
      {
        id: 'hacking',
        name: 'Hacking',
        branch: 'tech',
        maxValue: 100,
        increment: DEFAULT_INCREMENT,
        taggedIncrement: TAGGED_INCREMENT,
        description: 'Bypass security systems and crack encrypted terminals.',
        effectSummary: 'Unlocks advanced intrusion dialogue choices and minigames (stub).',
        stub: true,
      },
      {
        id: 'engineering',
        name: 'Engineering',
        branch: 'tech',
        maxValue: 100,
        increment: DEFAULT_INCREMENT,
        taggedIncrement: TAGGED_INCREMENT,
        description: 'Maintain drones, turrets, and battlefield gadgets.',
        effectSummary: 'Improves deployable durability and crafting options (stub).',
        stub: true,
      },
      {
        id: 'science',
        name: 'Science',
        branch: 'tech',
        maxValue: 100,
        increment: DEFAULT_INCREMENT,
        taggedIncrement: TAGGED_INCREMENT,
        description: 'Chemical analysis and experimental tech research.',
        effectSummary: 'Boosts chem crafting and anomaly research (stub).',
        stub: true,
      },
    ],
  },
  {
    id: 'survival',
    label: 'Survival',
    blurb: 'Field medicine, stealth, and salvage expertise.',
    skills: [
      {
        id: 'medicine',
        name: 'Medicine',
        branch: 'survival',
        maxValue: 100,
        increment: DEFAULT_INCREMENT,
        taggedIncrement: TAGGED_INCREMENT,
        description: 'Treat injuries and synthesize bio-stims under fire.',
        effectSummary: 'Increases healing efficiency and unlocks aid recipes (stub).',
        stub: true,
      },
      {
        id: 'stealth',
        name: 'Stealth',
        branch: 'survival',
        maxValue: 100,
        increment: DEFAULT_INCREMENT,
        taggedIncrement: TAGGED_INCREMENT,
        description: 'Avoid detection and blend into hostile zones.',
        effectSummary: 'Improves detection thresholds and noise damping (stub).',
        stub: true,
      },
      {
        id: 'scavenging',
        name: 'Scavenging',
        branch: 'survival',
        maxValue: 100,
        increment: DEFAULT_INCREMENT,
        taggedIncrement: TAGGED_INCREMENT,
        description: 'Recover components and rare materials from ruins.',
        effectSummary: 'Increases loot yields and salvage spots (stub).',
        stub: true,
      },
    ],
  },
  {
    id: 'social',
    label: 'Social',
    blurb: 'Command presence, negotiation, and underground influence.',
    skills: [
      {
        id: 'persuasion',
        name: 'Persuasion',
        branch: 'social',
        maxValue: 100,
        increment: DEFAULT_INCREMENT,
        taggedIncrement: TAGGED_INCREMENT,
        description: 'Convince allies and sway neutral factions.',
        effectSummary: 'Unlocks diplomatic dialogue options and better rewards (stub).',
        stub: true,
      },
      {
        id: 'intimidation',
        name: 'Intimidation',
        branch: 'social',
        maxValue: 100,
        increment: DEFAULT_INCREMENT,
        taggedIncrement: TAGGED_INCREMENT,
        description: 'Force compliance through presence and threat.',
        effectSummary: 'Unlocks threat-based dialogue paths (stub).',
        stub: true,
      },
      {
        id: 'barter',
        name: 'Barter',
        branch: 'social',
        maxValue: 100,
        increment: DEFAULT_INCREMENT,
        taggedIncrement: TAGGED_INCREMENT,
        description: 'Broker deals and hustle black-market channels.',
        effectSummary: 'Improves vendor prices and trade availability (stub).',
        stub: true,
      },
    ],
  },
];

export const SKILL_DEFINITIONS: Record<SkillId, SkillDefinition> = SKILL_BRANCHES
  .flatMap((branch) => branch.skills)
  .reduce<Record<SkillId, SkillDefinition>>((acc, skill) => {
    acc[skill.id] = skill;
    return acc;
  }, {} as Record<SkillId, SkillDefinition>);

export const BRANCH_LOOKUP: Record<SkillBranchId, SkillBranchDefinition> = SKILL_BRANCHES
  .reduce<Record<SkillBranchId, SkillBranchDefinition>>((acc, branch) => {
    acc[branch.id] = branch;
    return acc;
  }, {} as Record<SkillBranchId, SkillBranchDefinition>);

export const getSkillDefinition = (skillId: SkillId): SkillDefinition => {
  const skill = SKILL_DEFINITIONS[skillId];
  if (!skill) {
    throw new Error(`[skills] Unknown skill id: ${skillId}`);
  }
  return skill;
};

export const getBranchDefinition = (branchId: SkillBranchId): SkillBranchDefinition => {
  const branch = BRANCH_LOOKUP[branchId];
  if (!branch) {
    throw new Error(`[skills] Unknown branch id: ${branchId}`);
  }
  return branch;
};
