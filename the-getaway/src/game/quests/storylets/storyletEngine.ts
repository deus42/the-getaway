import { NPC, Player } from '../../interfaces/types';
import {
  ResolvedStoryletRoles,
  StoryActor,
  StoryletArc,
  StoryletBranch,
  StoryletPlay,
  StoryletResolution,
  StoryletRuntimeSnapshot,
  StoryletTriggerContext,
} from './storyletTypes';

export interface StoryletEvaluationParams {
  plays: StoryletPlay[];
  runtime: StoryletRuntimeSnapshot;
  trigger: StoryletTriggerContext;
  actorPool: StoryActor[];
  now: number;
  locationId?: string;
}

export interface BuildActorPoolParams {
  player: Player;
  npcs: NPC[];
}

const DEFAULT_CONTACTS: StoryActor[] = [
  {
    id: 'npc_lira_vendor',
    name: 'Lira the Smuggler',
    kind: 'contact',
    tags: ['resistance', 'strategist', 'ally', 'bonded', 'quartermaster'],
    traits: ['resistance', 'strategist', 'bonded'],
    factionId: 'resistance',
    relationship: 'bonded',
  },
  {
    id: 'npc_archivist_naila',
    name: 'Archivist Naila',
    kind: 'contact',
    tags: ['resistance', 'scholar', 'ally'],
    traits: ['scholar', 'resistance'],
    factionId: 'resistance',
    relationship: 'ally',
  },
  {
    id: 'npc_courier_brant',
    name: 'Courier Brant',
    kind: 'contact',
    tags: ['resistance', 'runner', 'ally'],
    traits: ['runner', 'ally'],
    factionId: 'resistance',
    relationship: 'ally',
  },
  {
    id: 'npc_firebrand_juno',
    name: 'Firebrand Juno',
    kind: 'contact',
    tags: ['resistance', 'agitator', 'ally', 'witness'],
    traits: ['agitator'],
    factionId: 'resistance',
    relationship: 'ally',
  },
  {
    id: 'npc_seraph_warden',
    name: 'Seraph Warden',
    kind: 'contact',
    tags: ['corpsec', 'warden', 'rival'],
    traits: ['corpsec', 'rival'],
    factionId: 'corpsec',
    relationship: 'rival',
  },
  {
    id: 'npc_drone_handler_kesh',
    name: 'Drone Handler Kesh',
    kind: 'contact',
    tags: ['resistance', 'tech', 'ally'],
    traits: ['technician'],
    factionId: 'resistance',
    relationship: 'ally',
  },
];

const NPC_TAGS_BY_DIALOGUE: Record<
  string,
  {
    tags: string[];
    traits?: string[];
    relationship?: StoryActor['relationship'];
    factionId?: StoryActor['factionId'];
  }
> = {
  npc_lira_vendor: {
    tags: ['resistance', 'ally', 'quartermaster', 'bonded'],
    traits: ['strategist', 'bonded'],
    relationship: 'bonded',
    factionId: 'resistance',
  },
  npc_archivist_naila: {
    tags: ['resistance', 'ally', 'scholar'],
    traits: ['scholar'],
    relationship: 'ally',
    factionId: 'resistance',
  },
  npc_courier_brant: {
    tags: ['resistance', 'ally', 'runner'],
    traits: ['runner'],
    relationship: 'ally',
    factionId: 'resistance',
  },
  npc_firebrand_juno: {
    tags: ['resistance', 'ally', 'agitator'],
    traits: ['agitator'],
    relationship: 'ally',
    factionId: 'resistance',
  },
  npc_seraph_warden: {
    tags: ['corpsec', 'rival', 'warden'],
    traits: ['corpsec', 'rival'],
    relationship: 'rival',
    factionId: 'corpsec',
  },
  npc_drone_handler_kesh: {
    tags: ['resistance', 'ally', 'tech'],
    traits: ['technician'],
    relationship: 'ally',
    factionId: 'resistance',
  },
  npc_medic_yara: {
    tags: ['resistance', 'ally', 'medic'],
    traits: ['medic'],
    relationship: 'ally',
    factionId: 'resistance',
  },
  npc_captain_reyna: {
    tags: ['resistance', 'ally', 'commander'],
    traits: ['commander'],
    relationship: 'ally',
    factionId: 'resistance',
  },
};

const ensureActor = (registry: Map<string, StoryActor>, actor: StoryActor) => {
  if (!registry.has(actor.id)) {
    registry.set(actor.id, { ...actor, tags: [...actor.tags], traits: [...actor.traits] });
  }
};

const mergeActorAttributes = (
  registry: Map<string, StoryActor>,
  actor: StoryActor,
  overrides?: Partial<StoryActor>
) => {
  const existing = registry.get(actor.id);
  if (!existing) {
    ensureActor(registry, overrides ? { ...actor, ...overrides } : actor);
    return;
  }

  existing.tags = Array.from(new Set([...existing.tags, ...(overrides?.tags ?? actor.tags)]));
  existing.traits = Array.from(
    new Set([...existing.traits, ...(overrides?.traits ?? actor.traits)])
  );

  if (typeof overrides?.wounded === 'boolean') {
    existing.wounded = overrides.wounded;
  }

  if (overrides?.relationship) {
    existing.relationship = overrides.relationship;
  }

  if (overrides?.factionId) {
    existing.factionId = overrides.factionId;
  }
};

export const buildStoryActorPool = ({ player, npcs }: BuildActorPoolParams): StoryActor[] => {
  const registry = new Map<string, StoryActor>();

  DEFAULT_CONTACTS.forEach((contact) => ensureActor(registry, contact));

  const woundedThreshold = player.maxHealth > 0 ? player.maxHealth * 0.65 : player.maxHealth;
  const playerActor: StoryActor = {
    id: player.id,
    name: player.name || 'Operative',
    kind: 'player',
    tags: ['player', 'operative', 'ally'],
    traits: [player.personality?.alignment ?? 'earnest'],
    factionId: 'resistance',
    wounded: player.health < woundedThreshold,
    relationship: 'ally',
    backgroundId: player.backgroundId,
  };

  if (player.backgroundId) {
    playerActor.tags.push(player.backgroundId);
  }

  if (player.perks.length > 0) {
    playerActor.tags.push('perked');
  }

  ensureActor(registry, playerActor);

  npcs.forEach((npc) => {
    const actorId = npc.dialogueId ?? npc.id;
    if (!actorId) {
      return;
    }

    const baseActor: StoryActor = {
      id: actorId,
      name: npc.name,
      kind: npc.isInteractive ? 'contact' : 'npc',
      tags: ['npc', npc.isInteractive ? 'ally' : 'witness'],
      traits: [],
      wounded: npc.health < npc.maxHealth,
      relationship: npc.isInteractive ? 'ally' : 'witness',
    };

    const overrides = NPC_TAGS_BY_DIALOGUE[actorId];
    if (overrides) {
      baseActor.tags.push(...overrides.tags);
      if (overrides.traits) {
        baseActor.traits.push(...overrides.traits);
      }
      if (overrides.relationship) {
        baseActor.relationship = overrides.relationship;
      }
      if (overrides.factionId) {
        baseActor.factionId = overrides.factionId;
      }
    }

    mergeActorAttributes(registry, baseActor);
  });

  return Array.from(registry.values());
};

interface RoleMatch {
  roleId: string;
  actor: StoryActor;
  score: number;
}

const scoreActorForRole = (roleId: string, role: StoryletPlay['roles'][number], actor: StoryActor): number | null => {
  if (role.requiredTags && !role.requiredTags.every((tag) => actor.tags.includes(tag))) {
    return null;
  }

  if (role.forbiddenTags && role.forbiddenTags.some((tag) => actor.tags.includes(tag))) {
    return null;
  }

  if (role.requiredTraits && !role.requiredTraits.every((trait) => actor.traits.includes(trait))) {
    return null;
  }

  if (role.forbiddenTraits && role.forbiddenTraits.some((trait) => actor.traits.includes(trait))) {
    return null;
  }

  if (actor.wounded && role.allowWounded === false) {
    return null;
  }

  let score = 1;

  if (role.preferredTags) {
    role.preferredTags.forEach((tag) => {
      if (actor.tags.includes(tag)) {
        score += 2;
      }
    });
  }

  if (role.requiredTraits) {
    score += role.requiredTraits.length;
  }

  if (actor.relationship && role.preferredTags?.includes(actor.relationship)) {
    score += 1.5;
  }

  if (actor.kind === 'player' && roleId !== 'protagonist') {
    score -= 0.25;
  }

  return score;
};

interface CastResult {
  resolvedRoles: ResolvedStoryletRoles;
  totalScore: number;
}

const castStoryletRoles = (
  play: StoryletPlay,
  availableActors: StoryActor[]
): CastResult | null => {
  const unresolvedActors = [...availableActors];
  const resolved: ResolvedStoryletRoles = {};
  const usedIds = new Set<string>();
  let totalScore = 0;

  const playerActor = availableActors.find((actor) => actor.kind === 'player');

  for (const role of play.roles) {
    let bestMatch: RoleMatch | null = null;

    for (const actor of unresolvedActors) {
      if (actor.kind !== 'player' && usedIds.has(actor.id)) {
        continue;
      }

      const score = scoreActorForRole(role.id, role, actor);
      if (score == null) {
        continue;
      }

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { roleId: role.id, actor, score };
      }
    }

    if (!bestMatch && role.fallbackToPlayer && playerActor) {
      const fallbackScore = scoreActorForRole(role.id, role, playerActor);
      if (fallbackScore != null) {
        bestMatch = {
          roleId: role.id,
          actor: playerActor,
          score: Math.max(0.5, fallbackScore),
        };
      }
    }

    if (!bestMatch) {
      return null;
    }

    resolved[role.id] = bestMatch.actor;
    totalScore += bestMatch.score;

    if (bestMatch.actor.kind !== 'player') {
      usedIds.add(bestMatch.actor.id);
    }
  }

  return { resolvedRoles: resolved, totalScore };
};

const branchMatches = (
  branch: StoryletBranch,
  resolvedRoles: ResolvedStoryletRoles,
  context: StoryletTriggerContext
): boolean => {
  if (!branch.conditions || branch.conditions.length === 0) {
    return true;
  }

  return branch.conditions.every((condition) => {
    switch (condition.type) {
      case 'roleTrait': {
        const actor = resolvedRoles[condition.roleId];
        return actor ? actor.traits.includes(condition.trait) : false;
      }
      case 'roleTag': {
        const actor = resolvedRoles[condition.roleId];
        return actor ? actor.tags.includes(condition.tag) : false;
      }
      case 'roleRelationship': {
        const actor = resolvedRoles[condition.roleId];
        return actor ? actor.relationship === condition.relationship : false;
      }
      case 'roleStatus': {
        const actor = resolvedRoles[condition.roleId];
        return condition.status === 'wounded' ? !!actor?.wounded : false;
      }
      case 'contextTag': {
        return !!context.tags?.includes(condition.tag);
      }
      case 'contextArc': {
        return context.arc === condition.arc;
      }
      default:
        return false;
    }
  });
};

const resolveStoryletBranch = (
  play: StoryletPlay,
  resolvedRoles: ResolvedStoryletRoles,
  context: StoryletTriggerContext
): StoryletBranch | null => {
  let selected: StoryletBranch | null = null;
  let bestWeight = -Infinity;

  for (const branch of play.branches) {
    if (!branchMatches(branch, resolvedRoles, context)) {
      continue;
    }

    const weight = branch.weight ?? 1;
    if (!selected || weight > bestWeight) {
      selected = branch;
      bestWeight = weight;
    }
  }

  return selected ?? play.branches[0] ?? null;
};

const matchesTrigger = (play: StoryletPlay, context: StoryletTriggerContext): boolean => {
  return play.triggers.some((trigger) => {
    if (trigger.type !== context.type) {
      return false;
    }

    if (trigger.tags && trigger.tags.length > 0) {
      const contextTags = context.tags ?? [];
      return trigger.tags.every((tag) => contextTags.includes(tag));
    }

    return true;
  });
};

const isCooldownActive = (
  runtime: StoryletRuntimeSnapshot,
  play: StoryletPlay,
  locationId: string | undefined,
  now: number
): boolean => {
  const entry = runtime.entries[play.id];
  if (entry?.cooldownExpiresAt && entry.cooldownExpiresAt > now) {
    return true;
  }

  if (play.cooldown.perLocation && locationId) {
    const lastSeen = runtime.lastSeenByLocation[locationId];
    if (lastSeen === play.id && entry?.cooldownExpiresAt && entry.cooldownExpiresAt > now) {
      return true;
    }
  }

  return false;
};

export const evaluateStorylet = ({
  plays,
  runtime,
  trigger,
  actorPool,
  now,
  locationId,
}: StoryletEvaluationParams): StoryletResolution | null => {
  let bestResolution: StoryletResolution | null = null;
  let bestScore = -Infinity;

  for (const play of plays) {
    if (play.arc !== trigger.arc) {
      continue;
    }

    if (!matchesTrigger(play, trigger)) {
      continue;
    }

    if (isCooldownActive(runtime, play, locationId, now)) {
      continue;
    }

    const castResult = castStoryletRoles(play, actorPool);
    if (!castResult) {
      continue;
    }

    const branch = resolveStoryletBranch(play, castResult.resolvedRoles, trigger);
    if (!branch) {
      continue;
    }

    const runtimeEntry = runtime.entries[play.id];
    let score = (play.weight ?? 1) + castResult.totalScore + (branch.weight ?? 1);

    if (runtimeEntry) {
      score -= runtimeEntry.timesTriggered * 0.75;
    }

    if (score > bestScore) {
      bestScore = score;
      bestResolution = {
        storyletId: play.id,
        play,
        branch,
        outcome: branch.outcome,
        resolvedRoles: castResult.resolvedRoles,
        context: trigger,
        timestamp: now,
        cooldownExpiresAt: now + play.cooldown.durationMs,
      };
    }
  }

  return bestResolution;
};

export const deriveArcFromMissionIndex = (missionLevelIndex: number): StoryletArc => {
  if (missionLevelIndex <= 0) {
    return 'act1_setup';
  }
  if (missionLevelIndex === 1) {
    return 'act2_escalation';
  }
  return 'act3_finale';
};
