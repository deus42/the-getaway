import { MissionDefinition } from '../../../game/narrative/structureTypes';

export const level0RebuildCourierNetworkMission: MissionDefinition = {
  id: 'level0_rebuild_courier_network',
  resourceKey: 'missions.level0.rebuild_courier_network',
  levelKey: 'levels.slums_command_grid',
  kind: 'primary',
  questKeys: ['quests.courier_network'],
  relatedNpcKeys: ['npcs.courier_brant'],
};
