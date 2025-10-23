import type { Player, Enemy, MapArea, SurveillanceZoneState } from '../../interfaces/types';
import type { ZoneHeatComputation } from '../suspicion';
import type { CombinedSystemImpact } from '../../world/environment/environmentMatrix';
import type { TimeOfDay } from '../../world/dayNightCycle';

export type ParanoiaTier = 'calm' | 'uneasy' | 'on_edge' | 'panicked' | 'breakdown';

export interface ParanoiaStimuliBreakdown {
  gains: Record<string, number>;
  losses: Record<string, number>;
  spikes: Record<string, number>;
}

export interface ParanoiaTickMultipliers {
  gain: number;
  decay: number;
}

export interface ParanoiaStimuliResult {
  gains: Record<string, number>;
  losses: Record<string, number>;
  spikes: Record<string, number>;
  multipliers: ParanoiaTickMultipliers;
}

export interface ParanoiaRuntimeState {
  cameraAlarmedAt: Record<string, number>;
  guardAlertRank: Record<string, number>;
  lastCurfewActive: boolean;
  lastLowHealth: boolean;
  lastLowAmmo: boolean;
  lastSafehouse: boolean;
}

export interface ParanoiaTickContext {
  player: Player;
  enemies: Enemy[];
  mapArea: MapArea | null;
  surveillanceZone?: SurveillanceZoneState;
  zoneHeat?: ZoneHeatComputation | null;
  environmentImpacts: CombinedSystemImpact;
  timeOfDay: TimeOfDay;
  curfewActive: boolean;
  worldTimeSeconds: number;
  deltaMs: number;
  timestamp: number;
}

