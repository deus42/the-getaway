import { QuestDefinition } from '../../../game/narrative/structureTypes';

export const questDatapadTruthDefinition: QuestDefinition = {
  id: 'quest_datapad_truth',
  resourceKey: 'quests.datapad_truth',
  levelKey: 'levels.slums_command_grid',
  missionKey: 'missions.level0.decrypt_manifests',
  kind: 'primary',
  objectives: [
    {
      id: 'obtain-datapad',
      type: 'collect',
      targetResourceKey: 'items.encrypted_datapad',
      count: 1,
    },
    {
      id: 'deliver-naila',
      type: 'talk',
      targetResourceKey: 'npcs.archivist_naila',
    },
  ],
  rewards: [
    { type: 'experience', resourceKey: 'experience.base', amount: 120 },
    { type: 'item', resourceKey: 'items.transit_tokens', amount: 1 },
  ],
  relatedNpcKeys: ['npcs.archivist_naila'],
  status: 'implemented',
};
