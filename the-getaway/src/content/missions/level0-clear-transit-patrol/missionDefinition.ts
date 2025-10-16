import { MissionDefinition } from '../../../game/narrative/structureTypes';

export const level0ClearTransitPatrolMission: MissionDefinition = {
  id: 'level0_clear_transit_patrol',
  resourceKey: 'missions.level0.clear_transit_patrol',
  levelKey: 'levels.slums_command_grid',
  kind: 'side',
  questKeys: ['quests.combat_patrol'],
  relatedNpcKeys: ['npcs.captain_reyna'],
};
