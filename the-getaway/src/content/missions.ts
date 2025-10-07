import { Locale } from './locales';
import { MissionLevelDefinition } from '../game/interfaces/missions';

const level0PrimaryObjectives = () => ([
  {
    id: 'level0-primary-cache',
    label: 'Recover Lira’s Confiscated Cache',
    summary: 'Slip through Downtown patrols, reclaim the seized crates, and keep Lira’s supply lines alive.',
    questIds: ['quest_market_cache'],
    kind: 'primary' as const,
  },
  {
    id: 'level0-primary-manifests',
    label: 'Decrypt the Patrol Manifests',
    summary: 'Secure the encrypted datapad and return it to Archivist Naila so ops can plan curfew breaches.',
    questIds: ['quest_datapad_truth'],
    kind: 'primary' as const,
  },
  {
    id: 'level0-primary-couriers',
    label: 'Rebuild the Courier Network',
    summary: 'Find Brant’s missing runners and feed the resistance transit intel before the routes freeze.',
    questIds: ['quest_courier_network'],
    kind: 'primary' as const,
  },
]);

const level0SideObjectives = () => ([
  {
    id: 'level0-side-cameras',
    label: 'Black Out the Camera Grid',
    summary: 'Sabotage surveillance nodes so Firebrand Juno can move barricades without CorpSec eyes.',
    questIds: ['quest_equipment_sabotage'],
    kind: 'side' as const,
    factionTag: 'resistance',
  },
  {
    id: 'level0-side-drones',
    label: 'Map Drone Patrol Routes',
    summary: 'Shadow patrol drones and deliver their loop data to Kesh to keep infiltration lanes viable.',
    questIds: ['quest_drone_recon'],
    kind: 'side' as const,
  },
  {
    id: 'level0-side-clinic',
    label: 'Restock the Rebel Clinic',
    summary: 'Scavenge abandoned medkits so the street clinic can keep patched fighters in the field.',
    questIds: ['quest_medkit_supplies'],
    kind: 'side' as const,
  },
  {
    id: 'level0-side-transit',
    label: 'Clear the Transit Hub Patrol',
    summary: 'Eliminate the CorpSec squad choking the transit hub to re-open a fallback extraction route.',
    questIds: ['quest_combat_patrol'],
    kind: 'side' as const,
  },
]);

const LEVEL_DEFINITIONS: Record<Locale, MissionLevelDefinition[]> = {
  en: [
    {
      level: 0,
      levelId: 'level-0',
      name: 'Slums Command Grid',
      objectives: [...level0PrimaryObjectives(), ...level0SideObjectives()],
    },
  ],
  uk: [
    {
      level: 0,
      levelId: 'level-0',
      name: 'Slums Command Grid',
      objectives: [...level0PrimaryObjectives(), ...level0SideObjectives()],
    },
  ],
};

export const getMissionManifest = (locale: Locale): MissionLevelDefinition[] => {
  const manifest = LEVEL_DEFINITIONS[locale] ?? LEVEL_DEFINITIONS.en;
  return manifest.map((entry) => ({
    ...entry,
    objectives: entry.objectives.map((objective) => ({ ...objective, questIds: [...objective.questIds] })),
  }));
};
