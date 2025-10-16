import { MissionDefinition } from '../../../game/narrative/structureTypes';

export const level0BlackoutCameraGridMission: MissionDefinition = {
  id: 'level0_blackout_camera_grid',
  resourceKey: 'missions.level0.blackout_camera_grid',
  levelKey: 'levels.slums_command_grid',
  kind: 'side',
  questKeys: ['quests.equipment_sabotage'],
  factionTag: 'resistance',
  relatedNpcKeys: ['npcs.firebrand_juno'],
};
