import { FactionId, PersonalityTrait } from '../../interfaces/types';

export type StoryletArc = 'act1_setup' | 'act2_escalation' | 'act3_finale';

export type StoryletTriggerType = 'missionCompletion' | 'patrolAmbush' | 'campfireRest';

export type StoryletTag =
  | 'ambush'
  | 'relationship'
  | 'injury'
  | 'resistance'
  | 'corpsec'
  | 'rest'
  | 'memory'
  | 'loyalty'
  | 'omen';

export interface StoryletTrigger {
  type: StoryletTriggerType;
  tags?: StoryletTag[];
  intensity?: 'low' | 'medium' | 'high';
}

export interface StoryletCooldown {
  durationMs: number;
  perLocation?: boolean;
}

export interface StoryActor {
  id: string;
  name: string;
  kind: 'player' | 'companion' | 'contact' | 'npc';
  tags: string[];
  traits: string[];
  factionId?: FactionId;
  wounded?: boolean;
  relationship?: 'bonded' | 'rival' | 'witness' | 'ally' | 'stranger';
  backgroundId?: string;
}

export interface StoryRoleDefinition {
  id: string;
  titleKey?: string;
  preferredTags?: string[];
  requiredTags?: string[];
  forbiddenTags?: string[];
  requiredTraits?: string[];
  forbiddenTraits?: string[];
  allowWounded?: boolean;
  fallbackToPlayer?: boolean;
}

export type StoryletCondition =
  | { type: 'roleTrait'; roleId: string; trait: string }
  | { type: 'roleTag'; roleId: string; tag: string }
  | { type: 'roleRelationship'; roleId: string; relationship: 'bonded' | 'rival' | 'witness' | 'ally' }
  | { type: 'roleStatus'; roleId: string; status: 'wounded' }
  | { type: 'contextTag'; tag: StoryletTag }
  | { type: 'contextArc'; arc: StoryletArc };

export type StoryletEffect =
  | {
      type: 'log';
      logKey: string;
      severity?: 'info' | 'warning';
    }
  | {
      type: 'faction';
      factionId: FactionId;
      delta: number;
      reason?: string;
    }
  | {
      type: 'playerHealth';
      delta: number;
      allowKO?: boolean;
    }
  | {
      type: 'traitDelta';
      target: 'player' | { roleId: string };
      trait: PersonalityTrait;
      delta: number;
    };

export interface StoryletOutcome {
  id: string;
  localizationKey: string;
  variantKey?: string;
  effects: StoryletEffect[];
  tags?: StoryletTag[];
}

export interface StoryletBranch {
  id: string;
  weight?: number;
  conditions?: StoryletCondition[];
  outcome: StoryletOutcome;
}

export interface StoryletPlay {
  id: string;
  arc: StoryletArc;
  titleKey: string;
  synopsisKey: string;
  tags: StoryletTag[];
  triggers: StoryletTrigger[];
  roles: StoryRoleDefinition[];
  branches: StoryletBranch[];
  cooldown: StoryletCooldown;
  weight?: number;
}

export interface StoryletTriggerContext {
  type: StoryletTriggerType;
  arc: StoryletArc;
  timestamp: number;
  locationId?: string;
  missionId?: string;
  tags?: StoryletTag[];
}

export interface ResolvedStoryletRoles {
  [roleId: string]: StoryActor;
}

export interface StoryletResolution {
  storyletId: string;
  play: StoryletPlay;
  branch: StoryletBranch;
  outcome: StoryletOutcome;
  resolvedRoles: ResolvedStoryletRoles;
  context: StoryletTriggerContext;
  timestamp: number;
  cooldownExpiresAt: number;
}

export interface StoryletRuntimeEntry {
  storyletId: string;
  lastTriggeredAt: number | null;
  cooldownExpiresAt: number | null;
  timesTriggered: number;
}

export interface StoryletRuntimeSnapshot {
  entries: Record<string, StoryletRuntimeEntry>;
  lastSeenByLocation: Record<string, string>;
}
