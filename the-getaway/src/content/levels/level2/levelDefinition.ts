import { LevelDefinition } from '../../../game/narrative/structureTypes';

export const level2Definition: LevelDefinition = {
  id: 'level-2',
  resourceKey: 'levels.industrial_wasteland',
  order: 2,
  zoneKey: 'industrial_corridor',
  missionKeys: [
    'missions.level2.stabilise_refinery_outpost',
    'missions.level2.cripple_convoy_routes',
    'missions.level2.recover_filtration_core',
    'missions.level2.broker_scavenger_truce',
    'missions.level2.stabilise_power_grid',
    'missions.level2.secure_evacuation_lanes',
  ],
  defaultMissionKey: 'missions.level2.stabilise_refinery_outpost',
  relatedNpcKeys: [],
};
