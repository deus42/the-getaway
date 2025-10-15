import { GangHeatLevel } from '../../game/interfaces/environment';
import { RumorRotationDefinition } from './types';

const rumorRotationsByGangHeat: Record<GangHeatLevel, RumorRotationDefinition[]> = {
  low: [
    {
      id: 'rumor.low.coyotes-logo',
      groupId: 'slum-barflies',
      flag: 'gangHeat',
      value: 'low',
      storyFunction: 'world-building',
      description: 'Warm-up chatter when the streets are calm.',
      lines: [
        'Coyotes rebranded again. Same howls, new accounting font.',
        'CorpSec confiscated their synth-leather jackets. Fashion crime unit, I guess.',
        'If the gang war is over, someone forgot to tell the bullet holes.',
      ],
    },
    {
      id: 'rumor.low.tax-audit',
      groupId: 'dock-liquor-patrons',
      flag: 'gangHeat',
      value: 'low',
      storyFunction: 'foreshadow',
      description: 'Hints at upcoming tensions despite low heat.',
      lines: [
        'Heard the Coyotes scheduled a tax audit. They grow up so fast.',
        'You know it’s quiet when the bartops stop vibrating.',
        'Peace smells like ozone and unpaid protection money.',
      ],
    },
  ],
  med: [
    {
      id: 'rumor.med.return',
      groupId: 'slum-barflies',
      flag: 'gangHeat',
      value: 'med',
      storyFunction: 'misdirect',
      description: 'Contradicts official statements to set up later payoffs.',
      lines: [
        'Coyotes are back. Again. They brought merch this time.',
        'Saw their lieutenant handing out coupons for muggings. 20% off with code “WHOOPS”.',
        'If the city says everything is fine, duck.',
      ],
    },
    {
      id: 'rumor.med.payroll',
      groupId: 'dock-liquor-patrons',
      flag: 'gangHeat',
      value: 'med',
      storyFunction: 'payoff',
      description: 'Signals growing pressure around the docks.',
      lines: [
        'Dock payroll went missing. Must have taken the scenic route through a heist.',
        'CorpSec switched to hazard pay. They called it “enthusiasm adjustment”.',
        'Graffiti keeps spelling “WE ARE TEMPORARY”. Someone stamped “UNTIL AUDIT COMPLETE” on top.',
      ],
    },
  ],
  high: [
    {
      id: 'rumor.high.curfew',
      groupId: 'slum-barflies',
      flag: 'gangHeat',
      value: 'high',
      storyFunction: 'foreshadow',
      description: 'Signals impending clampdowns.',
      lines: [
        'Curfew now starts before brunch. Crime brunch still sold out.',
        'Coyotes swapped bullets for invoices. Same damage, more paperwork.',
        'Saw CorpSec drones high-fiving. Never a good omen.',
      ],
    },
    {
      id: 'rumor.high.wanted',
      groupId: 'dock-liquor-patrons',
      flag: 'gangHeat',
      value: 'high',
      storyFunction: 'payoff',
      description: 'Pairs with power glitch triggers that reveal wanted posters.',
      lines: [
        'CRTs keep flashing some wanted face. He already skipped town, obviously.',
        'Dock sirens learned harmony. It’s unnerving in four-part.',
        'When the lights flicker, we clap. Keeps the grid on edge.',
      ],
    },
  ],
};

export const getRumorRotationsForGangHeat = (
  level: GangHeatLevel
): RumorRotationDefinition[] => rumorRotationsByGangHeat[level] ?? [];
