import type { Item, NPC, Quest } from '../interfaces/types';

export const LEVEL0_GUIDED_QUEST_IDS = {
  liraCache: 'quest_market_cache',
  datapadTruth: 'quest_datapad_truth',
  courierNetwork: 'quest_courier_network',
} as const;

export const LEVEL0_GUIDED_DIALOGUE_IDS = {
  lira: 'npc_lira_vendor',
  naila: 'npc_archivist_naila',
  brant: 'npc_courier_brant',
} as const;

export const LEVEL0_GUIDED_ITEM_KEYS = {
  keycard: 'items.corporate_keycard',
  datapad: 'items.encrypted_datapad',
  transitTokens: 'items.transit_tokens',
} as const;

export type Level0GuidedStage =
  | 'lira-start'
  | 'lira-keycard'
  | 'lira-return'
  | 'naila-start'
  | 'naila-datapad'
  | 'naila-return'
  | 'brant-start'
  | 'brant-tokens'
  | 'brant-return'
  | 'complete';

export interface Level0GuidedStep {
  stage: Level0GuidedStage;
  questId: string | null;
  objectiveId?: string;
  contactDialogueId?: string;
  itemResourceKeys?: readonly string[];
}

export type Level0GuidedItemMarkerState = 'current' | 'future' | 'other';
export type Level0GuidedContactMarkerState = 'current' | 'other';

const LEVEL0_GUIDED_ITEM_RESOURCE_KEYS = Object.values(LEVEL0_GUIDED_ITEM_KEYS);

const findQuest = (quests: Quest[], questId: string): Quest | undefined =>
  quests.find((quest) => quest.id === questId);

const isQuestComplete = (quests: Quest[], questId: string): boolean => {
  const quest = findQuest(quests, questId);
  return Boolean(quest?.isCompleted);
};

const isObjectiveComplete = (
  quest: Quest | undefined,
  objectiveId: string
): boolean =>
  Boolean(quest?.objectives.find((objective) => objective.id === objectiveId)?.isCompleted);

export const getLevel0GuidedStep = (quests: Quest[]): Level0GuidedStep => {
  const liraQuest = findQuest(quests, LEVEL0_GUIDED_QUEST_IDS.liraCache);
  const nailaQuest = findQuest(quests, LEVEL0_GUIDED_QUEST_IDS.datapadTruth);
  const brantQuest = findQuest(quests, LEVEL0_GUIDED_QUEST_IDS.courierNetwork);

  if (!liraQuest?.isCompleted) {
    if (!liraQuest?.isActive) {
      return {
        stage: 'lira-start',
        questId: LEVEL0_GUIDED_QUEST_IDS.liraCache,
        contactDialogueId: LEVEL0_GUIDED_DIALOGUE_IDS.lira,
      };
    }

    if (!isObjectiveComplete(liraQuest, 'recover-keycard')) {
      return {
        stage: 'lira-keycard',
        questId: LEVEL0_GUIDED_QUEST_IDS.liraCache,
        objectiveId: 'recover-keycard',
        itemResourceKeys: [LEVEL0_GUIDED_ITEM_KEYS.keycard],
      };
    }

    return {
      stage: 'lira-return',
      questId: LEVEL0_GUIDED_QUEST_IDS.liraCache,
      objectiveId: 'return-to-lira',
      contactDialogueId: LEVEL0_GUIDED_DIALOGUE_IDS.lira,
    };
  }

  if (!nailaQuest?.isCompleted) {
    if (!nailaQuest?.isActive) {
      return {
        stage: 'naila-start',
        questId: LEVEL0_GUIDED_QUEST_IDS.datapadTruth,
        contactDialogueId: LEVEL0_GUIDED_DIALOGUE_IDS.naila,
      };
    }

    if (!isObjectiveComplete(nailaQuest, 'obtain-datapad')) {
      return {
        stage: 'naila-datapad',
        questId: LEVEL0_GUIDED_QUEST_IDS.datapadTruth,
        objectiveId: 'obtain-datapad',
        itemResourceKeys: [LEVEL0_GUIDED_ITEM_KEYS.datapad],
      };
    }

    return {
      stage: 'naila-return',
      questId: LEVEL0_GUIDED_QUEST_IDS.datapadTruth,
      objectiveId: 'deliver-naila',
      contactDialogueId: LEVEL0_GUIDED_DIALOGUE_IDS.naila,
    };
  }

  if (!brantQuest?.isCompleted) {
    if (!brantQuest?.isActive) {
      return {
        stage: 'brant-start',
        questId: LEVEL0_GUIDED_QUEST_IDS.courierNetwork,
        contactDialogueId: LEVEL0_GUIDED_DIALOGUE_IDS.brant,
      };
    }

    if (!isObjectiveComplete(brantQuest, 'find-transit-tokens')) {
      return {
        stage: 'brant-tokens',
        questId: LEVEL0_GUIDED_QUEST_IDS.courierNetwork,
        objectiveId: 'find-transit-tokens',
        itemResourceKeys: [LEVEL0_GUIDED_ITEM_KEYS.transitTokens],
      };
    }

    return {
      stage: 'brant-return',
      questId: LEVEL0_GUIDED_QUEST_IDS.courierNetwork,
      objectiveId: 'report-brant',
      contactDialogueId: LEVEL0_GUIDED_DIALOGUE_IDS.brant,
    };
  }

  return {
    stage: 'complete',
    questId: null,
  };
};

export const isLevel0GuidedQuestStartAvailable = (
  questId: string,
  quests: Quest[]
): boolean => {
  switch (questId) {
    case LEVEL0_GUIDED_QUEST_IDS.liraCache:
      return true;
    case LEVEL0_GUIDED_QUEST_IDS.datapadTruth:
      return isQuestComplete(quests, LEVEL0_GUIDED_QUEST_IDS.liraCache);
    case LEVEL0_GUIDED_QUEST_IDS.courierNetwork:
      return isQuestComplete(quests, LEVEL0_GUIDED_QUEST_IDS.datapadTruth);
    default:
      return true;
  }
};

export const isLevel0GuidedContact = (
  npc: Pick<NPC, 'dialogueId'>,
  step: Level0GuidedStep
): boolean => Boolean(step.contactDialogueId && npc.dialogueId === step.contactDialogueId);

export const resolveLevel0GuidedContactMarkerState = (
  npc: Pick<NPC, 'dialogueId'>,
  step: Level0GuidedStep
): Level0GuidedContactMarkerState =>
  isLevel0GuidedContact(npc, step) ? 'current' : 'other';

export const isLevel0GuidedItem = (
  item: Pick<Item, 'resourceKey'>,
  step: Level0GuidedStep
): boolean =>
  Boolean(
    item.resourceKey &&
      step.itemResourceKeys?.some((resourceKey) => resourceKey === item.resourceKey)
  );

export const resolveLevel0GuidedItemMarkerState = (
  item: Pick<Item, 'resourceKey'>,
  step: Level0GuidedStep
): Level0GuidedItemMarkerState => {
  if (!item.resourceKey) {
    return 'other';
  }

  if (isLevel0GuidedItem(item, step)) {
    return 'current';
  }

  return LEVEL0_GUIDED_ITEM_RESOURCE_KEYS.some((resourceKey) => resourceKey === item.resourceKey)
    ? 'future'
    : 'other';
};
