import { Locale, getNarrativeLocaleBundle } from '../locales';
import {
  QuestDefinition,
  QuestResourceKey,
  LevelResourceKey,
  QuestLocaleEntry,
  QuestObjectiveStructure,
  QuestRewardStructure,
  NarrativeLocaleBundle,
  NPCResourceKey,
} from '../../game/narrative/structureTypes';
import { Quest, QuestObjective, QuestReward } from '../../game/interfaces/types';
import { QUEST_DEFINITIONS, QUEST_DEFINITION_BY_KEY } from './index';

const formatFallbackLabel = (resourceKey: string): string => {
  const parts = resourceKey.split('.');
  const slug = parts[parts.length - 1] ?? resourceKey;
  return slug
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const resolveTargetLabel = (resourceKey: string, bundle: NarrativeLocaleBundle): string => {
  if (!resourceKey.includes('.')) {
    return formatFallbackLabel(resourceKey);
  }
  const [domain] = resourceKey.split('.');

  switch (domain) {
    case 'npcs':
      return bundle.npcs[resourceKey as NPCResourceKey]?.name ?? formatFallbackLabel(resourceKey);
    default:
      return formatFallbackLabel(resourceKey);
  }
};

const deriveObjectiveDescription = (
  definition: QuestObjectiveStructure,
  localeEntry: QuestLocaleEntry
): string => localeEntry.objectiveDescriptions[definition.id] ?? formatFallbackLabel(definition.id);

const mapObjective = (
  structure: QuestObjectiveStructure,
  localeEntry: QuestLocaleEntry,
  bundle: NarrativeLocaleBundle
): QuestObjective => ({
  id: structure.id,
  description: deriveObjectiveDescription(structure, localeEntry),
  isCompleted: false,
  type: structure.type,
  target: resolveTargetLabel(structure.targetResourceKey, bundle),
  count: structure.count,
  currentCount: 0,
});

const mapReward = (structure: QuestRewardStructure): QuestReward => ({
  type: structure.type,
  id: structure.resourceKey ? formatFallbackLabel(structure.resourceKey) : undefined,
  amount: structure.amount,
});

const buildQuestFromDefinition = (
  definition: QuestDefinition,
  localeEntry: QuestLocaleEntry,
  bundle: NarrativeLocaleBundle
): Quest => ({
  id: definition.id,
  name: localeEntry.name,
  description: localeEntry.description,
  isActive: false,
  isCompleted: false,
  objectives: definition.objectives.map((objective) =>
    mapObjective(objective, localeEntry, bundle)
  ),
  rewards: definition.rewards.map(mapReward),
});

export const getQuestDefinitionByResourceKey = (resourceKey: QuestResourceKey): QuestDefinition | undefined =>
  QUEST_DEFINITION_BY_KEY[resourceKey];

export const buildQuestsForLevel = (locale: Locale, levelKey: LevelResourceKey): Quest[] => {
  const bundle = getNarrativeLocaleBundle(locale);

  return QUEST_DEFINITIONS
    .filter((definition) => definition.levelKey === levelKey && definition.status === 'implemented')
    .map((definition) => {
      const localeEntry = bundle.quests[definition.resourceKey];
      if (!localeEntry) {
        throw new Error(`Missing locale entry for quest ${definition.resourceKey}`);
      }
      return buildQuestFromDefinition(definition, localeEntry, bundle);
    });
};
