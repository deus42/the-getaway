import {
  NarrativeNPCRegistration,
  NPCResourceKey,
} from '../../game/narrative/structureTypes';

const npcRegistrations: NarrativeNPCRegistration[] = [
  {
    resourceKey: 'npcs.lira_smuggler',
    levelKeys: ['levels.slums_command_grid'],
    missionKeys: ['missions.level0.recover_cache'],
    questKeys: ['quests.market_cache'],
  },
  {
    resourceKey: 'npcs.archivist_naila',
    levelKeys: ['levels.slums_command_grid'],
    missionKeys: ['missions.level0.decrypt_manifests'],
    questKeys: ['quests.datapad_truth'],
  },
  {
    resourceKey: 'npcs.courier_brant',
    levelKeys: ['levels.slums_command_grid'],
    missionKeys: ['missions.level0.rebuild_courier_network'],
    questKeys: ['quests.courier_network'],
  },
  {
    resourceKey: 'npcs.firebrand_juno',
    levelKeys: ['levels.slums_command_grid'],
    missionKeys: ['missions.level0.blackout_camera_grid'],
    questKeys: ['quests.equipment_sabotage'],
  },
  {
    resourceKey: 'npcs.seraph_warden',
    levelKeys: ['levels.slums_command_grid'],
    missionKeys: [],
    questKeys: [],
  },
  {
    resourceKey: 'npcs.drone_handler_kesh',
    levelKeys: ['levels.slums_command_grid'],
    missionKeys: ['missions.level0.map_drone_patrols'],
    questKeys: ['quests.drone_recon'],
  },
  {
    resourceKey: 'npcs.medic_yara',
    levelKeys: ['levels.slums_command_grid'],
    missionKeys: ['missions.level0.restock_rebel_clinic'],
    questKeys: ['quests.medkit_supplies'],
  },
  {
    resourceKey: 'npcs.captain_reyna',
    levelKeys: ['levels.slums_command_grid'],
    missionKeys: ['missions.level0.clear_transit_patrol'],
    questKeys: ['quests.combat_patrol'],
  },
];

export const NPC_REGISTRATIONS: NarrativeNPCRegistration[] = npcRegistrations;

export const NPC_REGISTRATION_BY_KEY: Record<NPCResourceKey, NarrativeNPCRegistration> =
  npcRegistrations.reduce<Record<NPCResourceKey, NarrativeNPCRegistration>>((acc, registration) => {
    acc[registration.resourceKey] = registration;
    return acc;
  }, {} as Record<NPCResourceKey, NarrativeNPCRegistration>);
