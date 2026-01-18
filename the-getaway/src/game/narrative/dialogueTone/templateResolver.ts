import { createSeededRng } from './seededRng';
import {
  RoleDialogueContext,
  RoleDialogueTemplate,
  RoleTemplateEnvironmentGate,
  RoleTemplateFactionGate,
  RoleTemplateRequest,
  RoleTemplateResolution,
  RoleTemplateTokenDefinition,
  RoleTemplateTokenHelpers,
} from './roleTemplateTypes';
import { ROLE_TEMPLATE_REGISTRY, listAllRoleDialogueTemplates } from '../../../content/dialogueTemplates/roles';
import { getStandingForValue, getStandingRank } from '../../systems/factions';

const DEFAULT_TEMPLATE_WEIGHT = 1;

const evaluateEnvironmentGate = (
  gate: RoleTemplateEnvironmentGate,
  flags: RoleDialogueContext['world']['environmentFlags'],
): boolean => {
  const value = flags[gate.flag];
  if (gate.allowed && gate.allowed.length > 0 && !gate.allowed.includes(value as string)) {
    return false;
  }
  if (gate.forbidden && gate.forbidden.includes(value as string)) {
    return false;
  }
  if (typeof value === 'number') {
    if (typeof gate.minimumNumeric === 'number' && value < gate.minimumNumeric) {
      return false;
    }
    if (typeof gate.maximumNumeric === 'number' && value > gate.maximumNumeric) {
      return false;
    }
  }
  return true;
};

const evaluateToken = (
  token: RoleTemplateTokenDefinition,
  context: RoleDialogueContext,
  helpers: RoleTemplateTokenHelpers,
): string => {
  try {
    const resolved = token.resolve(context, helpers);
    return helpers.ensure(resolved, token.fallback);
  } catch (error) {
    console.warn('[RoleTemplateResolver] Token resolver failed', token.id, error);
    return token.fallback;
  }
};

const renderTokens = (
  template: RoleDialogueTemplate,
  context: RoleDialogueContext,
  seed: string,
): Record<string, string> => {
  if (!template.tokens || template.tokens.length === 0) {
    return {};
  }

  const seeded = createSeededRng(`${seed}::${template.id}::tokens`);
  const helpers: RoleTemplateTokenHelpers = {
    rng: () => seeded.next(),
    pickOne: (items, fallback) => {
      if (!items || items.length === 0) {
        return fallback;
      }
      return items[seeded.nextInt(items.length)];
    },
    ensure: (value, fallback) => (value && value.trim().length > 0 ? value : fallback),
  };

  return template.tokens.reduce<Record<string, string>>((accumulator, token) => {
    accumulator[token.id] = evaluateToken(token, context, helpers);
    return accumulator;
  }, {});
};

const applyTokens = (text: string, tokens: Record<string, string>): string => {
  if (!text) {
    return '';
  }

  return text.replace(/{{\s*([\w.]+)\s*}}/g, (match, tokenId) => {
    const resolved = tokens[tokenId];
    if (typeof resolved === 'string' && resolved.length > 0) {
      return resolved;
    }
    return match;
  });
};

const checkPerkRequirements = (perks: string[], requires?: string[], forbids?: string[]): boolean => {
  if (requires && requires.some((perk) => !perks.includes(perk))) {
    return false;
  }
  if (forbids && forbids.some((perk) => perks.includes(perk))) {
    return false;
  }
  return true;
};

const checkFactionGates = (
  context: RoleDialogueContext,
  templates: RoleTemplateFactionGate[] | undefined,
): boolean => {
  if (context.reputationSystemsEnabled === false) {
    return true;
  }
  if (!templates || templates.length === 0) {
    return true;
  }

  return templates.every((gate) => {
    const value = context.player.factionReputation?.[gate.factionId] ?? 0;
    if (typeof gate.minimumReputation === 'number' && value < gate.minimumReputation) {
      return false;
    }
    if (typeof gate.maximumReputation === 'number' && value > gate.maximumReputation) {
      return false;
    }
    const standing = getStandingForValue(value);
    if (gate.minimumStanding) {
      const currentRank = getStandingRank(standing.id);
      const requiredRank = getStandingRank(gate.minimumStanding);
      if (currentRank < requiredRank) {
        return false;
      }
    }
    if (gate.maximumStanding) {
      const currentRank = getStandingRank(standing.id);
      const maxRank = getStandingRank(gate.maximumStanding);
      if (currentRank > maxRank) {
        return false;
      }
    }
    return true;
  });
};

const checkHazardKeywords = (
  hazardList: string[],
  requiredKeywords?: string[],
  forbiddenKeywords?: string[],
): boolean => {
  if (requiredKeywords && requiredKeywords.length > 0) {
    const hasRequired = requiredKeywords.every((keyword) =>
      hazardList.some((hazard) => hazard.toLowerCase().includes(keyword.toLowerCase())),
    );
    if (!hasRequired) {
      return false;
    }
  }
  if (forbiddenKeywords && forbiddenKeywords.length > 0) {
    const hasForbidden = forbiddenKeywords.some((keyword) =>
      hazardList.some((hazard) => hazard.toLowerCase().includes(keyword.toLowerCase())),
    );
    if (hasForbidden) {
      return false;
    }
  }
  return true;
};

const matchesTemplateGating = (template: RoleDialogueTemplate, context: RoleDialogueContext): boolean => {
  const gating = template.gating;
  if (!gating) {
    return true;
  }
  const { world, player, npc } = context;

  if (!checkFactionGates(context, gating.faction)) {
    return false;
  }

  if (!checkPerkRequirements(player.perks ?? [], gating.requiresPerkIds, gating.forbiddenPerkIds)) {
    return false;
  }

  if (gating.allowedTimesOfDay && gating.allowedTimesOfDay.length > 0 && !gating.allowedTimesOfDay.includes(world.timeOfDay)) {
    return false;
  }

  if (gating.forbiddenTimesOfDay && gating.forbiddenTimesOfDay.includes(world.timeOfDay)) {
    return false;
  }

  if (typeof gating.requireCurfewActive === 'boolean' && gating.requireCurfewActive !== world.curfewActive) {
    return false;
  }

  if (typeof gating.forbidCurfewActive === 'boolean' && gating.forbidCurfewActive === world.curfewActive) {
    return false;
  }

  if (!checkHazardKeywords(world.hazards ?? [], gating.requiredHazardKeywords, gating.forbiddenHazardKeywords)) {
    return false;
  }

  if (gating.environment && gating.environment.length > 0) {
    const allMatch = gating.environment.every((gate: RoleTemplateEnvironmentGate) =>
      evaluateEnvironmentGate(gate, world.environmentFlags),
    );
    if (!allMatch) {
      return false;
    }
  }

  if (gating.requiredNpcTags && gating.requiredNpcTags.length > 0) {
    const npcTags = npc?.tags ?? [];
    const hasAllTags = gating.requiredNpcTags.every((tag) => npcTags.includes(tag));
    if (!hasAllTags) {
      return false;
    }
  }

  if (gating.forbiddenNpcTags && gating.forbiddenNpcTags.length > 0) {
    const npcTags = npc?.tags ?? [];
    if (gating.forbiddenNpcTags.some((tag) => npcTags.includes(tag))) {
      return false;
    }
  }

  if (gating.requiredZoneIds && gating.requiredZoneIds.length > 0 && !gating.requiredZoneIds.includes(world.zoneId)) {
    return false;
  }

  return true;
};

const pickTemplate = (
  templates: RoleDialogueTemplate[],
  seed: string,
): RoleDialogueTemplate | null => {
  if (!templates.length) {
    return null;
  }

  if (templates.length === 1) {
    return templates[0];
  }

  const seeded = createSeededRng(`${seed}::templatePick`);
  const totalWeight = templates.reduce((accumulator, template) => accumulator + (template.weight ?? DEFAULT_TEMPLATE_WEIGHT), 0);
  let threshold = seeded.next() * totalWeight;

  for (const template of templates) {
    threshold -= template.weight ?? DEFAULT_TEMPLATE_WEIGHT;
    if (threshold <= 0) {
      return template;
    }
  }

  return templates[seeded.nextInt(templates.length)];
};

const resolveTemplatePool = (
  roleId: RoleTemplateRequest['roleId'],
  templateKey: string,
): RoleDialogueTemplate[] => {
  const roleTemplates = ROLE_TEMPLATE_REGISTRY[roleId];
  if (!roleTemplates) {
    return [];
  }
  return roleTemplates.filter((template) => template.templateKey === templateKey);
};

export const resolveRoleDialogueTemplate = (
  request: RoleTemplateRequest,
): RoleTemplateResolution | null => {
  const { roleId, templateKey, context } = request;
  const pool = resolveTemplatePool(roleId, templateKey);

  if (pool.length === 0) {
    console.warn('[RoleTemplateResolver] Missing templates for role', roleId, 'template', templateKey);
    return null;
  }

  const filtered = pool.filter((template) => matchesTemplateGating(template, context));
  const candidates = filtered.length > 0 ? filtered : pool.filter((template) => template.isFallback) || pool;

  const seedBase = request.seedOverride ?? context.randomSeed ?? `${roleId}:${templateKey}`;
  const template = pickTemplate(candidates, seedBase) ?? candidates[0];

  const seed = `${seedBase}::${template.seedHint ?? template.id}`;
  const tokens = renderTokens(template, context, seed);
  const resolvedText = applyTokens(template.content, tokens);
  const fallbackText = applyTokens(template.fallbackContent, tokens);

  return {
    templateId: template.id,
    roleId,
    text: resolvedText,
    fallbackText,
    tokens,
    seed,
    toneOverrides: template.toneOverrides,
    metadata: template.metadata,
  };
};

export const listRegisteredRoleTemplates = (): RoleDialogueTemplate[] => listAllRoleDialogueTemplates();
