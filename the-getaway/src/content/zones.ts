import { DangerRating } from '../game/interfaces/types';

export interface ZoneMetadata {
  zoneId: string;
  name: string;
  level: number;
  danger: DangerRating;
  hazards: string[];
  objectives: string[];
  summary: string;
}

const DEFAULT_METADATA: ZoneMetadata = {
  zoneId: 'unknown_zone',
  name: 'Unknown Sector',
  level: 0,
  danger: 'low',
  hazards: [],
  objectives: [],
  summary: 'No reconnaissance available for this zone.',
};

const ZONE_METADATA: Record<string, ZoneMetadata> = {
  downtown_checkpoint: {
    zoneId: 'downtown_checkpoint',
    name: 'Slums Command Grid',
    level: 0,
    danger: 'moderate',
    hazards: [
      'CorpSec curfew sweeps after sundown',
      'Autonomous patrol drones scanning alleys',
      'Tight choke points with improvised barricades',
    ],
    objectives: [
      'Recover Lira\'s contraband cache from the downtown evidence lockers.',
      'Decrypt the surveillance manifests Archivist Naila smuggled out.',
      'Re-establish Brant\'s courier drop routes across the grid before curfew.',
      'Black out the CorpSec camera grid guarding the barricades.',
      'Map patrol drone loops and assign safe counter-routes.',
      'Restock Medic Yara\'s rebel clinic with field medkits.',
      'Ambush the transit patrol escorting the sweep captain.',
    ],
    summary:
      'Primary resistance staging ground on the edge of Downtown. Expect constant patrol loops and rapid curfew escalations once alarms trip.',
  },
  gov_complex: {
    zoneId: 'gov_complex',
    name: 'Downtown Governance Ring',
    level: 1,
    danger: 'high',
    hazards: [
      'Omnidirectional camera grids with rapid resync pulses',
      'CorpSec riot squads supported by shield drones',
      'Encrypted checkpoints requiring forged credentials',
    ],
    objectives: [
      'Breaching the executive archives for blackmail dossiers',
      'Subverting curfew order terminals',
      'Exfiltrating detained resistance couriers',
    ],
    summary:
      'Corporate command nerve centre governing the city core. Security density spikes during curfew and when alert level rises above Suspicious.',
  },
  corporate_plaza: {
    zoneId: 'corporate_plaza',
    name: 'Skyline Transit Spire',
    level: 1,
    danger: 'moderate',
    hazards: [
      'Precision sniper nests covering rooftop routes',
      'Kinetic response teams dispatched via mag-rails',
      'Marketing holo projectors causing navigation glare',
    ],
    objectives: [
      'Sabotage skyline transit relays to halt corporate reinforcements',
      'Secure encrypted comm relays for resistance broadcasts',
      'Extract high-value defectors under corporate escort',
    ],
    summary:
      'Vertical plaza bridging transit hubs and corporate towers. Movement is exposed but offers vantage points if you neutralise overwatch nests.',
  },
  industrial_corridor: {
    zoneId: 'industrial_corridor',
    name: 'Industrial Wasteland',
    level: 2,
    danger: 'critical',
    hazards: [
      'Toxic smog plumes reducing visibility and draining health',
      'Open radiation pockets around collapsed reactors',
      'Unstable power conduits causing electrical surges',
      'Hostile scavenger clans with improvised explosives',
    ],
    objectives: [
      'Stabilise the resistance refinery outpost',
      'Disrupt CorpSec convoy routes feeding the upper city',
      'Recover prototype filtration tech before corp retrieval teams arrive',
    ],
    summary:
      'Decommissioned industrial belt now weaponised by corp security. Navigation requires filtration gear and constant hazard monitoring.',
  },
  resistance_safehouse: {
    zoneId: 'resistance_safehouse',
    name: 'Resistance Safehouse Network',
    level: 0,
    danger: 'low',
    hazards: ['Tight corridors with limited firing lanes'],
    objectives: [
      'Resupply from hidden caches',
      'Brief with cell leadership for mission intel',
      'Coordinate evac routes ahead of major operations',
    ],
    summary:
      'Hidden safehouse offering respite between sorties. Minimal patrol risk but expect limited mobility and quick extraction drills.',
  },
};

const resolveBaseZoneId = (zoneId: string): string => {
  if (zoneId.includes('::')) {
    return zoneId.split('::')[0] ?? zoneId;
  }
  return zoneId;
};

export const getZoneMetadata = (zoneId: string): ZoneMetadata => {
  if (!zoneId) {
    return DEFAULT_METADATA;
  }

  const direct = ZONE_METADATA[zoneId];
  if (direct) {
    return direct;
  }

  const base = ZONE_METADATA[resolveBaseZoneId(zoneId)];
  if (base) {
    return base;
  }

  return {
    ...DEFAULT_METADATA,
    zoneId,
  };
};

export const listKnownZones = (): ZoneMetadata[] => Object.values(ZONE_METADATA);
