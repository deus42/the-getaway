import { MissionDefinition } from '../../../game/narrative/structureTypes';

export const level0RecoverCacheMission: MissionDefinition = {
  id: 'level0_recover_cache',
  resourceKey: 'missions.level0.recover_cache',
  levelKey: 'levels.slums_command_grid',
  kind: 'primary',
  questKeys: ['quests.market_cache'],
  relatedNpcKeys: ['npcs.lira_smuggler'],
};
