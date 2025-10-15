import { QuestDefinition } from '../../../game/narrative/structureTypes';

export const questMarketCacheDefinition: QuestDefinition = {
  id: 'quest_market_cache',
  resourceKey: 'quests.market_cache',
  levelKey: 'levels.slums_command_grid',
  missionKey: 'missions.level0.recover_cache',
  kind: 'primary',
  objectives: [
    {
      id: 'recover-keycard',
      type: 'collect',
      targetResourceKey: 'items.corporate_keycard',
      count: 1,
    },
    {
      id: 'return-to-lira',
      type: 'talk',
      targetResourceKey: 'npcs.lira_smuggler',
    },
  ],
  rewards: [
    { type: 'currency', resourceKey: 'currency.credits', amount: 80 },
    { type: 'item', resourceKey: 'items.encrypted_datapad', amount: 1 },
  ],
  relatedNpcKeys: ['npcs.lira_smuggler'],
  status: 'implemented',
};
