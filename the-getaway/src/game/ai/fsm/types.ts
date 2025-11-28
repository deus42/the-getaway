/* istanbul ignore file */
import {
  AlertLevel,
  Enemy,
  EnemyAiState,
  MapArea,
  NPC,
  Player,
  Position,
} from '../../interfaces/types';

export type NpcAiState = EnemyAiState;

export type NpcTransitionWeights = Partial<Record<NpcAiState, number>>;

export interface NpcContext {
  /** Active enemy actor */
  enemy: Enemy;
  /** Player snapshot */
  player: Player;
  /** Current combat map */
  mapArea: MapArea;
  /** Other hostile entities in scene */
  squad: Enemy[];
  /** Nearby neutral NPCs that may influence behaviour */
  civilians: NPC[];
  /** Whether the player is currently visible to the actor */
  hasLineOfSight: boolean;
  /** Manhattan distance to the player */
  distanceToPlayer: number;
  /** True when the actor took damage during the previous exchange */
  tookRecentDamage: boolean;
  /** Normalised health (0–1) */
  healthRatio: number;
  /** Suppression value normalised to 0–1 */
  suppressionRatio: number;
  /** Current alert level derived from perception */
  alertLevel: AlertLevel | undefined;
  /** Optional last known player location for search routines */
  lastKnownPlayerPosition?: Position | null;
  /** Optional pacing signal from the Street-Tension director */
  directorIntensity?: number;
  /** Current world timestamp used for cooldown bookkeeping */
  now: number;
}

export interface HealthUtilityModifier {
  kind: 'healthBelow' | 'healthAbove';
  state: NpcAiState;
  threshold: number;
  weight: number;
}

export interface LineOfSightUtilityModifier {
  kind: 'lineOfSight' | 'lostLineOfSight';
  state: NpcAiState;
  weight: number;
}

export interface AlertUtilityModifier {
  kind: 'alertAtLeast' | 'alertBelow';
  state: NpcAiState;
  alert: AlertLevel;
  weight: number;
}

export interface SuppressionUtilityModifier {
  kind: 'suppressionAbove';
  state: NpcAiState;
  threshold: number;
  weight: number;
}

export interface DistanceUtilityModifier {
  kind: 'distanceBelow' | 'distanceAbove';
  state: NpcAiState;
  tiles: number;
  weight: number;
}

export interface DirectorUtilityModifier {
  kind: 'directorAtLeast';
  state: NpcAiState;
  threshold: number;
  weight: number;
}

export type NpcUtilityModifier =
  | HealthUtilityModifier
  | LineOfSightUtilityModifier
  | AlertUtilityModifier
  | SuppressionUtilityModifier
  | DistanceUtilityModifier
  | DirectorUtilityModifier;

export type NpcCooldownConfig = Partial<Record<NpcAiState, number>>;

export interface NpcStateHandlers {
  [state: string]: ((context: NpcContext, step: NpcFsmStepMetadata) => void | Promise<void>) | undefined;
}

export interface NpcFsmConfig {
  /** Stable id for telemetry / persistence */
  id: string;
  /** Initial fallback state */
  initialState: NpcAiState;
  /** Static base weights per state */
  baseWeights: NpcTransitionWeights;
  /** Per-state cooldown durations (ms) */
  cooldowns?: NpcCooldownConfig;
  /** Utility modifiers applied when evaluating weights */
  utilityModifiers?: NpcUtilityModifier[];
  /** Optional clamp for minimum selectable weight */
  minimumSelectableWeight?: number;
}

export interface NpcFsmSnapshot {
  currentState: NpcAiState;
  lastTransitionAt: number;
  cooldowns: Partial<Record<NpcAiState, number>>;
  personalitySeed: number;
}

export interface NpcFsmStepMetadata {
  previousState: NpcAiState;
  selectedState: NpcAiState;
  weights: Record<NpcAiState, number>;
  utilityBreakdown: Record<NpcAiState, number>;
  now: number;
}

export interface NpcFsmStepResult {
  state: NpcAiState;
  metadata: NpcFsmStepMetadata;
}

export interface NpcFsmController {
  getState(): NpcAiState;
  getSnapshot(): NpcFsmSnapshot;
  step(
    context: NpcContext,
    handlers?: NpcStateHandlers
  ): NpcFsmStepResult;
}
