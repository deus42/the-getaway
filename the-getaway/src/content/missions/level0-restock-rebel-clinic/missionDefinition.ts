import { MissionDefinition } from '../../../game/narrative/structureTypes';

export const level0RestockRebelClinicMission: MissionDefinition = {
  id: 'level0_restock_rebel_clinic',
  resourceKey: 'missions.level0.restock_rebel_clinic',
  levelKey: 'levels.slums_command_grid',
  kind: 'side',
  questKeys: ['quests.medkit_supplies'],
  relatedNpcKeys: ['npcs.medic_yara'],
};
