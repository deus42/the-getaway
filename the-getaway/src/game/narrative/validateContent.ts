import {
  LEVEL_DEFINITIONS,
  LEVEL_DEFINITION_BY_KEY,
} from '../../content/levels';
import {
  MISSION_DEFINITIONS,
  MISSION_DEFINITION_BY_KEY,
} from '../../content/missions/index';
import {
  QUEST_DEFINITIONS,
  QUEST_DEFINITION_BY_KEY,
} from '../../content/quests';
import { NPC_REGISTRATIONS } from '../../content/npcs';
import {
  LevelDefinition,
  MissionDefinition,
  QuestDefinition,
  NarrativeLocaleBundle,
  LevelResourceKey,
  MissionResourceKey,
  QuestResourceKey,
  NPCResourceKey,
} from './structureTypes';
import {
  Locale,
  SUPPORTED_LOCALES,
  getNarrativeLocaleBundle,
} from '../../content/locales';

export interface NarrativeValidationIssue {
  severity: 'error' | 'warning';
  message: string;
  resourceKey?: string;
}

export interface NarrativeValidationReport {
  errors: NarrativeValidationIssue[];
  warnings: NarrativeValidationIssue[];
}

const addIssue = (
  collection: NarrativeValidationIssue[],
  severity: 'error' | 'warning',
  message: string,
  resourceKey?: string
) => {
  collection.push({ severity, message, resourceKey });
};

const validateLevel = (
  level: LevelDefinition,
  localesByLocale: Record<Locale, NarrativeLocaleBundle>,
  errors: NarrativeValidationIssue[]
) => {
  for (const locale of SUPPORTED_LOCALES) {
    const levelLocale = localesByLocale[locale].levels[level.resourceKey];
    if (!levelLocale) {
      addIssue(errors, 'error', `Missing level locale entry for ${level.resourceKey} (${locale})`, level.resourceKey);
    }
  }
};

const validateMission = (
  mission: MissionDefinition,
  errors: NarrativeValidationIssue[],
  warnings: NarrativeValidationIssue[]
) => {
  if (!LEVEL_DEFINITION_BY_KEY[mission.levelKey]) {
    addIssue(errors, 'error', `Mission ${mission.resourceKey} references unknown level ${mission.levelKey}`, mission.resourceKey);
  }

  mission.questKeys.forEach((questKey) => {
    if (!QUEST_DEFINITION_BY_KEY[questKey]) {
      addIssue(errors, 'error', `Mission ${mission.resourceKey} references unknown quest ${questKey}`, mission.resourceKey);
    }
  });
};

const validateMissionLocales = (
  mission: MissionDefinition,
  localesByLocale: Record<Locale, NarrativeLocaleBundle>,
  errors: NarrativeValidationIssue[]
) => {
  for (const locale of SUPPORTED_LOCALES) {
    const localeEntry = localesByLocale[locale].missions[mission.resourceKey];
    if (!localeEntry) {
      addIssue(errors, 'error', `Missing mission locale entry for ${mission.resourceKey} (${locale})`, mission.resourceKey);
    }
  }
};

const validateQuest = (
  quest: QuestDefinition,
  errors: NarrativeValidationIssue[],
  warnings: NarrativeValidationIssue[]
) => {
  if (!LEVEL_DEFINITION_BY_KEY[quest.levelKey]) {
    addIssue(errors, 'error', `Quest ${quest.resourceKey} references unknown level ${quest.levelKey}`, quest.resourceKey);
  }

  if (quest.missionKey) {
    if (!MISSION_DEFINITION_BY_KEY[quest.missionKey]) {
      addIssue(errors, 'error', `Quest ${quest.resourceKey} references unknown mission ${quest.missionKey}`, quest.resourceKey);
    }
  }
};

const validateQuestLocales = (
  quest: QuestDefinition,
  localesByLocale: Record<Locale, NarrativeLocaleBundle>,
  errors: NarrativeValidationIssue[]
) => {
  for (const locale of SUPPORTED_LOCALES) {
    const localeEntry = localesByLocale[locale].quests[quest.resourceKey];
    if (!localeEntry) {
      addIssue(errors, 'error', `Missing quest locale entry for ${quest.resourceKey} (${locale})`, quest.resourceKey);
    }
  }
};

const validateNPCLocales = (
  npcKey: NPCResourceKey,
  localesByLocale: Record<Locale, NarrativeLocaleBundle>,
  errors: NarrativeValidationIssue[]
) => {
  for (const locale of SUPPORTED_LOCALES) {
    const localeEntry = localesByLocale[locale].npcs[npcKey];
    if (!localeEntry) {
      addIssue(errors, 'error', `Missing NPC locale entry for ${npcKey} (${locale})`, npcKey);
    }
  }
};

const buildLocaleBundles = (): Record<Locale, NarrativeLocaleBundle> => {
  return SUPPORTED_LOCALES.reduce<Record<Locale, NarrativeLocaleBundle>>((acc, locale) => {
    acc[locale] = getNarrativeLocaleBundle(locale);
    return acc;
  }, {} as Record<Locale, NarrativeLocaleBundle>);
};

export const validateNarrativeContent = (): NarrativeValidationReport => {
  const errors: NarrativeValidationIssue[] = [];
  const warnings: NarrativeValidationIssue[] = [];

  const localeBundles = buildLocaleBundles();

  LEVEL_DEFINITIONS.forEach((level) => validateLevel(level, localeBundles, errors));

  MISSION_DEFINITIONS.forEach((mission) => {
    validateMission(mission, errors, warnings);
    validateMissionLocales(mission, localeBundles, errors);
  });

  QUEST_DEFINITIONS.forEach((quest) => {
    validateQuest(quest, errors, warnings);
    validateQuestLocales(quest, localeBundles, errors);
  });

  NPC_REGISTRATIONS.forEach((registration) => {
    registration.levelKeys.forEach((levelKey) => {
      if (!LEVEL_DEFINITION_BY_KEY[levelKey]) {
        addIssue(errors, 'error', `NPC ${registration.resourceKey} references unknown level ${levelKey}`, registration.resourceKey);
      }
    });

    registration.missionKeys.forEach((missionKey) => {
      if (!MISSION_DEFINITION_BY_KEY[missionKey]) {
        addIssue(errors, 'error', `NPC ${registration.resourceKey} references unknown mission ${missionKey}`, registration.resourceKey);
      }
    });

    registration.questKeys.forEach((questKey) => {
      if (!QUEST_DEFINITION_BY_KEY[questKey]) {
        addIssue(errors, 'error', `NPC ${registration.resourceKey} references unknown quest ${questKey}`, registration.resourceKey);
      }
    });

    validateNPCLocales(registration.resourceKey, localeBundles, errors);
  });

  return { errors, warnings };
};

export const assertNarrativeContentValid = () => {
  const report = validateNarrativeContent();
  if (report.errors.length > 0) {
    const message = report.errors
      .map((issue) => `${issue.message}${issue.resourceKey ? ` [${issue.resourceKey}]` : ''}`)
      .join('\n');
    throw new Error(`Narrative content validation failed:\n${message}`);
  }
};
