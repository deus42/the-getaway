import { MissionDefinition } from '../../../game/narrative/structureTypes';

export const level1ExtractDetainedCouriersMission: MissionDefinition = {
  id: 'level1_extract_detained_couriers',
  resourceKey: 'missions.level1.extract_detained_couriers',
  levelKey: 'levels.downtown_governance_ring',
  kind: 'primary',
  questKeys: ['quests.prison_break'],
  relatedNpcKeys: [],
};
