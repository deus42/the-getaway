import { EnvironmentalNoteDefinition } from './types';

const noteDefinitions: EnvironmentalNoteDefinition[] = [
  {
    id: 'note.supply.norm.crate',
    flag: 'supplyScarcity',
    value: 'norm',
    storyFunction: 'world-building',
    description: 'Everyday logistics with a dry punchline.',
    preferredZoneId: 'downtown_checkpoint',
    position: { x: 28, y: 26 },
    lines: [
      '[DATE STAMP SMEARED]',
      'Shift log: 6 crates “medical”.',
      'Counted 5.',
      'Crate 6 coughing.',
    ],
  },
  {
    id: 'note.supply.tight.ammo-iou',
    flag: 'supplyScarcity',
    value: 'tight',
    storyFunction: 'misdirect',
    description: 'Sets up later gag about returned bullets.',
    preferredZoneId: 'downtown_checkpoint',
    position: { x: 34, y: 30 },
    lines: [
      'IOU: 3 bullets. Return unused.',
      'Signed: Depot Clerk, with love.',
      'PS: Bring wipes.',
    ],
  },
  {
    id: 'note.supply.rationed.bullet-receipt',
    flag: 'supplyScarcity',
    value: 'rationed',
    storyFunction: 'payoff',
    description: 'Punchline for earlier IOU rumor.',
    preferredZoneId: 'downtown_checkpoint',
    position: { x: 36, y: 28 },
    lines: [
      'Receipt: All three bullets returned.',
      'Two still lodged in debtor.',
      'Processing fee waived.',
    ],
  },
  {
    id: 'note.curfew.tier2',
    flag: 'curfewLevel',
    value: 2,
    storyFunction: 'foreshadow',
    description: 'Hints at creeping curfew changes.',
    preferredZoneId: 'downtown_checkpoint',
    position: { x: 40, y: 24 },
    lines: [
      'Memo: Curfew trial balloon.',
      'Please begin night at 3 PM.',
      'Public feedback: “Already dark”.',
    ],
  },
  {
    id: 'note.gangHeat.high',
    flag: 'gangHeat',
    value: 'high',
    storyFunction: 'payoff',
    description: 'Ties to high-heat rumors.',
    preferredZoneId: 'downtown_checkpoint',
    position: { x: 32, y: 34 },
    lines: [
      'Wanted poster: “Seen smiling. Suspicious.”',
      'Reward: Half-price cola (while grid stable).',
      'Report sightings to CO-LAW vending kiosks.',
    ],
  },
  {
    id: 'note.gangHeat.low.suspicion-drill',
    flag: 'gangHeat',
    value: 'low',
    storyFunction: 'world-building',
    description: 'Field memo coaching crews on witness heat drills.',
    preferredZoneId: 'downtown_checkpoint',
    position: { x: 30, y: 24 },
    lines: [
      'Ops memo: Trigger one patrol sighting and log the heat spike.',
      'Break line-of-sight, watch the Suspicion Inspector cool to calm.',
      'Report anomalies to George so the city remembers accurately.',
    ],
  },
];

export const getNoteDefinitionsForFlag = (
  flag: EnvironmentalNoteDefinition['flag'],
  value: EnvironmentalNoteDefinition['value']
): EnvironmentalNoteDefinition[] =>
  noteDefinitions.filter((definition) => definition.flag === flag && definition.value === value);
