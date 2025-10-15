import { QuestDefinition } from '../../../game/narrative/structureTypes';

export const questDroneReconDefinition: QuestDefinition = {
  id: 'quest_drone_recon',
  resourceKey: 'quests.drone_recon',
  levelKey: 'levels.slums_command_grid',
  missionKey: 'missions.level0.map_drone_patrols',
  kind: 'side',
  objectives: [
    {
      id: 'observe-patrols',
      type: 'explore',
      targetResourceKey: 'devices.patrol_drone',
      count: 3,
    },
    {
      id: 'deliver-intel',
      type: 'talk',
      targetResourceKey: 'npcs.drone_handler_kesh',
    },
  ],
  rewards: [
    { type: 'experience', resourceKey: 'experience.base', amount: 120 },
    { type: 'item', resourceKey: 'items.holo_projector_lens', amount: 1 },
  ],
  relatedNpcKeys: ['npcs.drone_handler_kesh'],
  status: 'implemented',
};
