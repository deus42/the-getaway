/* istanbul ignore file */
import { DialogueToneConfig, FactionId, FactionStanding, Player } from '../../interfaces/types';
import { EnvironmentFlags } from '../../interfaces/environment';
import { TimeOfDay } from '../../world/dayNightCycle';
import { Locale } from '../../../content/locales';

export type DialogueRoleId =
  | 'merchant'
  | 'checkpoint_guard'
  | 'street_doc'
  | 'gang_scout'
  | 'safehouse_handler';

export interface RoleTemplateFactionGate {
  factionId: FactionId;
  minimumReputation?: number;
  maximumReputation?: number;
  minimumStanding?: FactionStanding;
  maximumStanding?: FactionStanding;
}

export interface RoleTemplateEnvironmentGate {
  flag: keyof EnvironmentFlags;
  allowed?: Array<string | number>;
  forbidden?: Array<string | number>;
  minimumNumeric?: number;
  maximumNumeric?: number;
}

export interface RoleTemplateGating {
  faction?: RoleTemplateFactionGate[];
  allowedTimesOfDay?: TimeOfDay[];
  forbiddenTimesOfDay?: TimeOfDay[];
  requiredHazardKeywords?: string[];
  forbiddenHazardKeywords?: string[];
  requireCurfewActive?: boolean;
  forbidCurfewActive?: boolean;
  environment?: RoleTemplateEnvironmentGate[];
  requiresPerkIds?: string[];
  forbiddenPerkIds?: string[];
  requiredNpcTags?: string[];
  forbiddenNpcTags?: string[];
  requiredZoneIds?: string[];
}

export interface RoleDialogueContext {
  locale: Locale;
  player: Pick<Player, 'level' | 'perks' | 'factionReputation'>;
  world: {
    timeOfDay: TimeOfDay;
    curfewActive: boolean;
    zoneId: string;
    zoneName?: string;
    hazards: string[];
    environmentFlags: EnvironmentFlags;
  };
  npc?: {
    id: string;
    factionId?: FactionId;
    tags?: string[];
    stance?: 'friendly' | 'neutral' | 'hostile';
  };
  randomSeed?: string;
}

export interface RoleTemplateTokenHelpers {
  rng: () => number;
  pickOne: <T>(items: T[], fallback: T) => T;
  ensure: (value: string | null | undefined, fallback: string) => string;
}

export interface RoleTemplateTokenDefinition {
  id: string;
  fallback: string;
  resolve: (context: RoleDialogueContext, helpers: RoleTemplateTokenHelpers) => string | null;
}

export interface RoleDialogueTemplate {
  id: string;
  roleId: DialogueRoleId;
  templateKey: string;
  summary: string;
  content: string;
  fallbackContent: string;
  gating?: RoleTemplateGating;
  tokens?: RoleTemplateTokenDefinition[];
  toneOverrides?: DialogueToneConfig;
  weight?: number;
  seedHint?: string;
  isFallback?: boolean;
  metadata?: Record<string, unknown>;
}

export interface RoleTemplateRequest {
  roleId: DialogueRoleId;
  templateKey: string;
  context: RoleDialogueContext;
  seedOverride?: string;
}

export interface RoleTemplateResolution {
  templateId: string;
  roleId: DialogueRoleId;
  text: string;
  fallbackText: string;
  tokens: Record<string, string>;
  seed: string;
  toneOverrides?: DialogueToneConfig;
  metadata?: Record<string, unknown>;
}
