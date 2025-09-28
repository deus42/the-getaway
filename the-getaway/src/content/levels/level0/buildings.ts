import { Position } from '../../../game/interfaces/types';

export interface LevelBuildingDefinition {
  id: string;
  name: string;
  footprint: { from: Position; to: Position };
  door: Position;
  interior: { width: number; height: number };
}

export const level0SlumsBuildings: LevelBuildingDefinition[] = [
  {
    id: 'slums_tenement',
    name: 'Riverside Tenement',
    footprint: { from: { x: 4, y: 6 }, to: { x: 12, y: 16 } },
    door: { x: 8, y: 16 },
    interior: { width: 12, height: 8 },
  },
  {
    id: 'slums_storage',
    name: 'Delta Storage Yard',
    footprint: { from: { x: 6, y: 24 }, to: { x: 14, y: 34 } },
    door: { x: 10, y: 24 },
    interior: { width: 10, height: 8 },
  },
  {
    id: 'slums_workshop',
    name: 'Ordnance Workshops',
    footprint: { from: { x: 20, y: 6 }, to: { x: 30, y: 16 } },
    door: { x: 25, y: 6 },
    interior: { width: 12, height: 8 },
  },
  {
    id: 'slums_terraces',
    name: 'Stacked Terraces',
    footprint: { from: { x: 22, y: 26 }, to: { x: 34, y: 36 } },
    door: { x: 28, y: 26 },
    interior: { width: 12, height: 10 },
  },
  {
    id: 'slums_market',
    name: 'Night Market Canopy',
    footprint: { from: { x: 36, y: 10 }, to: { x: 40, y: 20 } },
    door: { x: 38, y: 20 },
    interior: { width: 8, height: 6 },
  },
  {
    id: 'slums_depot',
    name: 'Depot Barracks',
    footprint: { from: { x: 42, y: 24 }, to: { x: 52, y: 34 } },
    door: { x: 47, y: 24 },
    interior: { width: 14, height: 10 },
  },
];

export const level0DowntownBuildings: LevelBuildingDefinition[] = [
  {
    id: 'downtown_arcology',
    name: 'Arcology Spires',
    footprint: { from: { x: 6, y: 6 }, to: { x: 30, y: 22 } },
    door: { x: 18, y: 26 },
    interior: { width: 18, height: 10 },
  },
  {
    id: 'downtown_exchange',
    name: 'Grand Exchange',
    footprint: { from: { x: 40, y: 8 }, to: { x: 66, y: 22 } },
    door: { x: 54, y: 26 },
    interior: { width: 20, height: 10 },
  },
  {
    id: 'downtown_conclave',
    name: 'Magistrate Conclave',
    footprint: { from: { x: 76, y: 8 }, to: { x: 102, y: 22 } },
    door: { x: 90, y: 26 },
    interior: { width: 18, height: 12 },
  },
  {
    id: 'downtown_embassy',
    name: 'Embassy Row',
    footprint: { from: { x: 112, y: 8 }, to: { x: 138, y: 22 } },
    door: { x: 126, y: 26 },
    interior: { width: 18, height: 12 },
  },
  {
    id: 'downtown_archives',
    name: 'Civic Archives',
    footprint: { from: { x: 6, y: 32 }, to: { x: 30, y: 48 } },
    door: { x: 18, y: 56 },
    interior: { width: 16, height: 10 },
  },
  {
    id: 'downtown_transit',
    name: 'Transit Nexus',
    footprint: { from: { x: 40, y: 32 }, to: { x: 66, y: 48 } },
    door: { x: 54, y: 56 },
    interior: { width: 20, height: 12 },
  },
  {
    id: 'downtown_research',
    name: 'Research Core',
    footprint: { from: { x: 76, y: 32 }, to: { x: 102, y: 48 } },
    door: { x: 90, y: 56 },
    interior: { width: 18, height: 12 },
  },
  {
    id: 'downtown_embassy_plaza',
    name: 'Embassy Plaza',
    footprint: { from: { x: 112, y: 32 }, to: { x: 138, y: 48 } },
    door: { x: 126, y: 56 },
    interior: { width: 18, height: 12 },
  },
  {
    id: 'downtown_residential',
    name: 'Residential Terraces',
    footprint: { from: { x: 6, y: 60 }, to: { x: 30, y: 78 } },
    door: { x: 18, y: 86 },
    interior: { width: 16, height: 12 },
  },
  {
    id: 'downtown_citadel',
    name: 'Security Citadel',
    footprint: { from: { x: 40, y: 60 }, to: { x: 66, y: 78 } },
    door: { x: 54, y: 86 },
    interior: { width: 18, height: 12 },
  },
  {
    id: 'downtown_biotech_garden',
    name: 'Biotech Gardens',
    footprint: { from: { x: 76, y: 60 }, to: { x: 102, y: 78 } },
    door: { x: 90, y: 86 },
    interior: { width: 18, height: 12 },
  },
  {
    id: 'downtown_embassy_port',
    name: 'Aerostat Port',
    footprint: { from: { x: 112, y: 60 }, to: { x: 138, y: 78 } },
    door: { x: 126, y: 86 },
    interior: { width: 18, height: 12 },
  },
  {
    id: 'downtown_theatre',
    name: 'Holo Theatre',
    footprint: { from: { x: 6, y: 84 }, to: { x: 34, y: 102 } },
    door: { x: 18, y: 86 },
    interior: { width: 16, height: 10 },
  },
  {
    id: 'downtown_barracks',
    name: 'Sentry Barracks',
    footprint: { from: { x: 40, y: 84 }, to: { x: 70, y: 102 } },
    door: { x: 54, y: 86 },
    interior: { width: 16, height: 10 },
  },
  {
    id: 'downtown_logistics',
    name: 'Harbor Logistics',
    footprint: { from: { x: 76, y: 84 }, to: { x: 106, y: 102 } },
    door: { x: 90, y: 86 },
    interior: { width: 18, height: 10 },
  },
  {
    id: 'downtown_solar_farm',
    name: 'Solar Farm Annex',
    footprint: { from: { x: 112, y: 84 }, to: { x: 138, y: 102 } },
    door: { x: 126, y: 86 },
    interior: { width: 14, height: 10 },
  },
];

export const level0AllBuildings: LevelBuildingDefinition[] = [
  ...level0SlumsBuildings,
  ...level0DowntownBuildings,
];
