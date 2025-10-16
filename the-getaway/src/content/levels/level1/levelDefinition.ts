import { LevelDefinition } from '../../../game/narrative/structureTypes';

export const level1Definition: LevelDefinition = {
  id: 'level-1',
  resourceKey: 'levels.downtown_governance_ring',
  order: 1,
  zoneKey: 'gov_complex',
  missionKeys: [
    'missions.level1.seize_governance_archives',
    'missions.level1.override_curfew_terminals',
    'missions.level1.extract_detained_couriers',
    'missions.level1.hijack_camera_resync',
    'missions.level1.divert_supply_convoys',
    'missions.level1.broadcast_resistance_propaganda',
  ],
  defaultMissionKey: 'missions.level1.seize_governance_archives',
  relatedNpcKeys: [],
};
