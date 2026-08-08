import type {
  Level0AbilityId,
  Level0ResearchOptionId,
  Level0ResearchStateRecord,
} from './types';

export interface Level0ResearchOption {
  id: Level0ResearchOptionId;
  requiredFactId: string;
  worldMinuteCost: 15 | 20;
  grantedAbilityId: Level0AbilityId;
}

export const LEVEL0_RESEARCH_CATALOG: Record<Level0ResearchOptionId, Level0ResearchOption> = {
  'research.naila_camera_topology': {
    id: 'research.naila_camera_topology',
    requiredFactId: 'fact.naila.camera_topology',
    worldMinuteCost: 20,
    grantedAbilityId: 'ability.terminal_craft',
  },
  'research.brant_delivery_protocol': {
    id: 'research.brant_delivery_protocol',
    requiredFactId: 'fact.brant.delivery_protocol',
    worldMinuteCost: 15,
    grantedAbilityId: 'ability.steady_voice',
  },
};

export const createInitialLevel0ResearchState = (): Level0ResearchStateRecord => ({
  'research.naila_camera_topology': 'unavailable',
  'research.brant_delivery_protocol': 'unavailable',
});

export interface ApplyLevel0ResearchInput {
  option: Level0ResearchOption;
  knownFactIds: readonly string[];
  heldAbilityIds: readonly Level0AbilityId[];
  researchState: Level0ResearchStateRecord;
}

export interface ApplyLevel0ResearchResult {
  applied: boolean;
  reasonId: string;
  consumedFactId: string | null;
  grantedAbilityId: Level0AbilityId | null;
  worldMinuteCost: number;
  knownFactIds: string[];
  heldAbilityIds: Level0AbilityId[];
  researchState: Level0ResearchStateRecord;
}

export const applyLevel0Research = ({
  option,
  knownFactIds,
  heldAbilityIds,
  researchState,
}: ApplyLevel0ResearchInput): ApplyLevel0ResearchResult => {
  const base = {
    consumedFactId: null,
    grantedAbilityId: null,
    worldMinuteCost: 0,
    knownFactIds: [...knownFactIds],
    heldAbilityIds: [...heldAbilityIds],
    researchState: { ...researchState },
  };
  if (researchState[option.id] === 'consumed') {
    return { ...base, applied: false, reasonId: 'research.blocked.consumed' };
  }
  if (!knownFactIds.includes(option.requiredFactId)) {
    return { ...base, applied: false, reasonId: 'research.blocked.fact_missing' };
  }
  if (heldAbilityIds.includes(option.grantedAbilityId)) {
    return { ...base, applied: false, reasonId: 'research.blocked.ability_held' };
  }
  return {
    applied: true,
    reasonId: 'research.applied',
    consumedFactId: option.requiredFactId,
    grantedAbilityId: option.grantedAbilityId,
    worldMinuteCost: option.worldMinuteCost,
    knownFactIds: knownFactIds.filter((factId) => factId !== option.requiredFactId),
    heldAbilityIds: [...heldAbilityIds, option.grantedAbilityId],
    researchState: { ...researchState, [option.id]: 'consumed' },
  };
};

export const synchronizeLevel0ResearchState = (
  knownFactIds: readonly string[],
  current: Level0ResearchStateRecord
): Level0ResearchStateRecord => Object.fromEntries(
  Object.values(LEVEL0_RESEARCH_CATALOG).map((option) => [
    option.id,
    current[option.id] === 'consumed'
      ? 'consumed'
      : knownFactIds.includes(option.requiredFactId)
        ? 'available'
        : 'unavailable',
  ])
) as Level0ResearchStateRecord;
