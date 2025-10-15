import { MissionDefinition } from '../../../game/narrative/structureTypes';

export const level1OverrideCurfewTerminalsMission: MissionDefinition = {
  id: 'level1_override_curfew_terminals',
  resourceKey: 'missions.level1.override_curfew_terminals',
  levelKey: 'levels.downtown_governance_ring',
  kind: 'primary',
  questKeys: ['quests.curfew_override'],
  relatedNpcKeys: [],
};
