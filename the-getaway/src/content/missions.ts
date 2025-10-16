import { Locale, getNarrativeLocaleBundle } from './locales';
import {
  LevelDefinition,
  MissionDefinition,
  MissionResourceKey,
  NarrativeLocaleBundle,
} from '../game/narrative/structureTypes';
import { MissionLevelDefinition, MissionObjectiveDefinition } from '../game/interfaces/missions';
import { LEVEL_DEFINITIONS } from './levels';
import { MISSION_DEFINITION_BY_KEY } from './missions/index';
import { QUEST_DEFINITION_BY_KEY } from './quests';

const resolveMission = (missionKey: MissionResourceKey): MissionDefinition => {
  const mission = MISSION_DEFINITION_BY_KEY[missionKey];
  if (!mission) {
    throw new Error(`Unknown mission resource key: ${missionKey}`);
  }
  return mission;
};

const buildObjectiveDefinition = (
  mission: MissionDefinition,
  bundle: NarrativeLocaleBundle
): MissionObjectiveDefinition => {
  const localeEntry = bundle.missions[mission.resourceKey];
  if (!localeEntry) {
    throw new Error(`Missing locale entry for mission ${mission.resourceKey}`);
  }

  const questIds = mission.questKeys.map((questKey) => {
    const quest = QUEST_DEFINITION_BY_KEY[questKey];
    if (!quest) {
      throw new Error(`Mission ${mission.resourceKey} references unknown quest key ${questKey}`);
    }
    return quest.id;
  });

  return {
    id: mission.id,
    label: localeEntry.label,
    summary: localeEntry.summary,
    questIds,
    kind: mission.kind,
    recommendedLevel: mission.recommendedLevel,
    factionTag: mission.factionTag,
  };
};

const buildLevelDefinition = (
  level: LevelDefinition,
  bundle: NarrativeLocaleBundle
): MissionLevelDefinition => {
  const levelLocale = bundle.levels[level.resourceKey];
  const objectives = level.missionKeys.map(resolveMission).map((mission) =>
    buildObjectiveDefinition(mission, bundle)
  );

  return {
    level: level.order,
    levelId: level.id,
    name: levelLocale?.name ?? level.id,
    zoneId: level.zoneKey,
    objectives,
  };
};

export const getMissionManifest = (locale: Locale): MissionLevelDefinition[] => {
  const bundle = getNarrativeLocaleBundle(locale);
  return LEVEL_DEFINITIONS.map((levelDefinition) =>
    buildLevelDefinition(levelDefinition, bundle)
  );
};
