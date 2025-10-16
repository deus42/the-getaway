import { QuestDefinition } from '../../../game/narrative/structureTypes';

export const questCombatPatrolDefinition: QuestDefinition = {
  id: 'quest_combat_patrol',
  resourceKey: 'quests.combat_patrol',
  levelKey: 'levels.slums_command_grid',
  missionKey: 'missions.level0.clear_transit_patrol',
  kind: 'side',
  objectives: [
    {
      id: 'defeat-corpsec',
      type: 'kill',
      targetResourceKey: 'enemies.corpsec_guard',
      count: 3,
    },
  ],
  rewards: [
    { type: 'experience', resourceKey: 'experience.base', amount: 200 },
    { type: 'currency', resourceKey: 'currency.credits', amount: 100 },
  ],
  relatedNpcKeys: ['npcs.captain_reyna'],
  status: 'implemented',
};
