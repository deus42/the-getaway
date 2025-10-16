import { LevelDefinition } from '../../../game/narrative/structureTypes';

export const level0Definition: LevelDefinition = {
  id: 'level-0',
  resourceKey: 'levels.slums_command_grid',
  order: 0,
  zoneKey: 'downtown_checkpoint',
  missionKeys: [
    'missions.level0.recover_cache',
    'missions.level0.decrypt_manifests',
    'missions.level0.rebuild_courier_network',
    'missions.level0.blackout_camera_grid',
    'missions.level0.map_drone_patrols',
    'missions.level0.restock_rebel_clinic',
    'missions.level0.clear_transit_patrol',
  ],
  defaultMissionKey: 'missions.level0.recover_cache',
  relatedNpcKeys: [
    'npcs.lira_smuggler',
    'npcs.archivist_naila',
    'npcs.courier_brant',
    'npcs.firebrand_juno',
    'npcs.seraph_warden',
    'npcs.drone_handler_kesh',
    'npcs.medic_yara',
    'npcs.captain_reyna',
  ],
};
