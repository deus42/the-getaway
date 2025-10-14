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

const level1PrimaryObjectives = () => ([
  {
    id: 'level1-primary-archives',
    label: 'Seize Governance Archives',
    summary: 'Infiltrate the Downtown governance ring and extract leverage dossiers from the executive vault.',
    questIds: ['quest_government_archives'],
    kind: 'primary' as const,
  },
  {
    id: 'level1-primary-curfew',
    label: 'Override Curfew Terminals',
    summary: 'Deploy forged credentials and subvert curfew order terminals to open safe travel corridors.',
    questIds: ['quest_curfew_override'],
    kind: 'primary' as const,
  },
  {
    id: 'level1-primary-prisoners',
    label: 'Extract Detained Couriers',
    summary: 'Locate holding cells beneath the Governance Ring and exfiltrate captured resistance couriers.',
    questIds: ['quest_prison_break'],
    kind: 'primary' as const,
  },
]);

const level1SideObjectives = () => ([
  {
    id: 'level1-side-camera-sync',
    label: 'Hijack Camera Resync Pulses',
    summary: 'Plant signal forks to desynchronise omnidirectional cameras during patrol rotations.',
    questIds: ['quest_camera_resync'],
    kind: 'side' as const,
  },
  {
    id: 'level1-side-supply-diversion',
    label: 'Divert Corporate Supply Convoys',
    summary: 'Stage accidents at mag-rail checkpoints to reroute corp supplies to the resistance.',
    questIds: ['quest_supply_diversion'],
    kind: 'side' as const,
  },
  {
    id: 'level1-side-propaganda',
    label: 'Broadcast Resistance Propaganda',
    summary: 'Hijack skyline projectors and loop resistance messaging over corp propaganda reels.',
    questIds: ['quest_plaza_broadcast'],
    kind: 'side' as const,
  },
]);

const level2PrimaryObjectives = () => ([
  {
    id: 'level2-primary-refinery',
    label: 'Stabilise Refinery Outpost',
    summary: 'Reactivate filtration towers and hold the refinery outpost against CorpSec artillery teams.',
    questIds: ['quest_refinery_stabilization'],
    kind: 'primary' as const,
  },
  {
    id: 'level2-primary-convoy',
    label: 'Cripple Corp Convoy Routes',
    summary: 'Ambush logistics convoys feeding the upper districts through the industrial corridor.',
    questIds: ['quest_convoy_ambush'],
    kind: 'primary' as const,
  },
  {
    id: 'level2-primary-filtration',
    label: 'Recover Prototype Filtration Core',
    summary: 'Secure experimental respirator tech before CorpSec retrieval teams extract it from the wasteland.',
    questIds: ['quest_filtration_recovery'],
    kind: 'primary' as const,
  },
]);

const level2SideObjectives = () => ([
  {
    id: 'level2-side-scavengers',
    label: 'Broker Truce with Scavenger Clans',
    summary: 'Negotiate ceasefires with scavenger warbands to reduce ambushes in the industrial belt.',
    questIds: ['quest_scavenger_truce'],
    kind: 'side' as const,
    factionTag: 'scavengers',
  },
  {
    id: 'level2-side-power-grid',
    label: 'Stabilise Industrial Power Grid',
    summary: 'Patch ruptured conduits to prevent cascading blackouts in resistance-held factories.',
    questIds: ['quest_power_grid'],
    kind: 'side' as const,
  },
  {
    id: 'level2-side-evac',
    label: 'Secure Evacuation Lanes',
    summary: 'Deploy signal flares and clear debris to keep evacuation pads operational during assaults.',
    questIds: ['quest_industrial_evac'],
    kind: 'side' as const,
  },
]);

const LEVEL_DEFINITIONS: Record<Locale, MissionLevelDefinition[]> = {
  en: [
    {
      level: 0,
      levelId: 'level-0',
      name: 'Slums Command Grid',
      zoneId: 'downtown_checkpoint',
      objectives: [...level0PrimaryObjectives(), ...level0SideObjectives()],
    },
    {
      level: 1,
      levelId: 'level-1',
      name: 'Downtown Governance Ring',
      zoneId: 'gov_complex',
      objectives: [...level1PrimaryObjectives(), ...level1SideObjectives()],
    },
    {
      level: 2,
      levelId: 'level-2',
      name: 'Industrial Wasteland',
      zoneId: 'industrial_corridor',
      objectives: [...level2PrimaryObjectives(), ...level2SideObjectives()],
    },
  ],
  uk: [
    {
      level: 0,
      levelId: 'level-0',
      name: 'Slums Command Grid',
      zoneId: 'downtown_checkpoint',
      objectives: [...level0PrimaryObjectives(), ...level0SideObjectives()],
    },
    {
      level: 1,
      levelId: 'level-1',
      name: 'Downtown Governance Ring',
      zoneId: 'gov_complex',
      objectives: [...level1PrimaryObjectives(), ...level1SideObjectives()],
    },
    {
      level: 2,
      levelId: 'level-2',
      name: 'Industrial Wasteland',
      zoneId: 'industrial_corridor',
      objectives: [...level2PrimaryObjectives(), ...level2SideObjectives()],
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
