import { QuestDefinition } from '../../../game/narrative/structureTypes';

export const questEquipmentSabotageDefinition: QuestDefinition = {
  id: 'quest_equipment_sabotage',
  resourceKey: 'quests.equipment_sabotage',
  levelKey: 'levels.slums_command_grid',
  missionKey: 'missions.level0.blackout_camera_grid',
  kind: 'side',
  objectives: [
    {
      id: 'sabotage-cameras',
      type: 'kill',
      targetResourceKey: 'devices.surveillance_camera',
      count: 3,
    },
    {
      id: 'report-juno',
      type: 'talk',
      targetResourceKey: 'npcs.firebrand_juno',
    },
  ],
  rewards: [
    { type: 'experience', resourceKey: 'experience.base', amount: 150 },
    { type: 'item', resourceKey: 'items.saboteur_charge_kit', amount: 1 },
  ],
  relatedNpcKeys: ['npcs.firebrand_juno'],
  status: 'implemented',
};
