import { MissionDefinition } from '../../../game/narrative/structureTypes';

export const level0MapDronePatrolsMission: MissionDefinition = {
  id: 'level0_map_drone_patrols',
  resourceKey: 'missions.level0.map_drone_patrols',
  levelKey: 'levels.slums_command_grid',
  kind: 'side',
  questKeys: ['quests.drone_recon'],
  relatedNpcKeys: ['npcs.drone_handler_kesh'],
};
