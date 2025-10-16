import { MissionDefinition } from '../../../game/narrative/structureTypes';

export const level1HijackCameraResyncMission: MissionDefinition = {
  id: 'level1_hijack_camera_resync',
  resourceKey: 'missions.level1.hijack_camera_resync',
  levelKey: 'levels.downtown_governance_ring',
  kind: 'side',
  questKeys: ['quests.camera_resync'],
  relatedNpcKeys: [],
};
