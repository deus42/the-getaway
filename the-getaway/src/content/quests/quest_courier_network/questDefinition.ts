import { QuestDefinition } from '../../../game/narrative/structureTypes';

export const questCourierNetworkDefinition: QuestDefinition = {
  id: 'quest_courier_network',
  resourceKey: 'quests.courier_network',
  levelKey: 'levels.slums_command_grid',
  missionKey: 'missions.level0.rebuild_courier_network',
  kind: 'primary',
  objectives: [
    {
      id: 'find-transit-tokens',
      type: 'collect',
      targetResourceKey: 'items.transit_tokens',
      count: 3,
    },
    {
      id: 'report-brant',
      type: 'talk',
      targetResourceKey: 'npcs.courier_brant',
    },
  ],
  rewards: [
    { type: 'experience', resourceKey: 'experience.base', amount: 90 },
    { type: 'currency', resourceKey: 'currency.credits', amount: 60 },
  ],
  relatedNpcKeys: ['npcs.courier_brant'],
  status: 'implemented',
};
