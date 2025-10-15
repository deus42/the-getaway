import { MissionDefinition } from '../../../game/narrative/structureTypes';

export const level0DecryptManifestsMission: MissionDefinition = {
  id: 'level0_decrypt_manifests',
  resourceKey: 'missions.level0.decrypt_manifests',
  levelKey: 'levels.slums_command_grid',
  kind: 'primary',
  questKeys: ['quests.datapad_truth'],
  relatedNpcKeys: ['npcs.archivist_naila'],
};
