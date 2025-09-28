import { NPC } from '../../../game/interfaces/types';

export const level0SlumsNPCs: Array<Omit<NPC, 'id'>> = [
  {
    name: 'Lira the Smuggler',
    position: { x: 26, y: 20 },
    health: 12,
    maxHealth: 12,
    routine: [
      { position: { x: 26, y: 20 }, timeOfDay: 'day', duration: 240 },
      { position: { x: 30, y: 26 }, timeOfDay: 'evening', duration: 240 },
      { position: { x: 22, y: 19 }, timeOfDay: 'night', duration: 240 },
    ],
    dialogueId: 'npc_lira_vendor',
    isInteractive: true,
  },
  {
    name: 'Orn Patrol Sentry',
    position: { x: 46, y: 28 },
    health: 20,
    maxHealth: 20,
    routine: [
      { position: { x: 46, y: 28 }, timeOfDay: 'day', duration: 180 },
      { position: { x: 50, y: 20 }, timeOfDay: 'evening', duration: 180 },
      { position: { x: 40, y: 34 }, timeOfDay: 'night', duration: 180 },
    ],
    dialogueId: 'npc_guard_orn',
    isInteractive: false,
  },
];

export const level0DowntownNPCs: Array<Omit<NPC, 'id'>> = [
  {
    name: 'Archivist Naila',
    position: { x: 28, y: 14 },
    health: 14,
    maxHealth: 14,
    routine: [
      { position: { x: 28, y: 14 }, timeOfDay: 'day', duration: 300 },
      { position: { x: 32, y: 24 }, timeOfDay: 'evening', duration: 300 },
    ],
    dialogueId: 'npc_archivist_naila',
    isInteractive: true,
  },
  {
    name: 'Courier Brant',
    position: { x: 14, y: 24 },
    health: 16,
    maxHealth: 16,
    routine: [
      { position: { x: 14, y: 24 }, timeOfDay: 'day', duration: 180 },
      { position: { x: 10, y: 16 }, timeOfDay: 'evening', duration: 180 },
      { position: { x: 34, y: 16 }, timeOfDay: 'night', duration: 180 },
    ],
    dialogueId: 'npc_courier_brant',
    isInteractive: true,
  },
];

export const level0AllNPCs: Array<Omit<NPC, 'id'>> = [
  ...level0SlumsNPCs,
  ...level0DowntownNPCs,
];
