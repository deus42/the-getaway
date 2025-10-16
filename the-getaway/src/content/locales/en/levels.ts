import { LevelLocaleMap } from '../../../game/narrative/structureTypes';

export const levelLocalesEn: LevelLocaleMap = {
  'levels.slums_command_grid': {
    name: 'Slums Command Grid',
    summary: 'Coordinate resistance operations across the market ring and checkpoint perimeter.',
    directives: [
      'Survey the Slums perimeter and mark hostile patrols',
      'Establish contact with Lira the Smuggler',
      'Secure shelter before curfew sweeps begin',
    ],
  },
  'levels.downtown_governance_ring': {
    name: 'Downtown Governance Ring',
    summary: 'Penetrate the governance vaults and dismantle curfew infrastructure.',
    directives: [
      'Infiltrate executive archives',
      'Override curfew command terminals',
      'Extract detained resistance couriers',
    ],
  },
  'levels.industrial_wasteland': {
    name: 'Industrial Wasteland',
    summary: 'Hold fractured factory districts while crippling CorpSec logistics.',
    directives: [
      'Stabilise refinery outposts',
      'Ambush strategic convoy routes',
      'Recover prototype filtration tech',
    ],
  },
};
