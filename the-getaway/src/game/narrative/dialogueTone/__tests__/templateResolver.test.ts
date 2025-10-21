import { resolveRoleDialogueTemplate } from '../templateResolver';
import { RoleDialogueContext } from '../roleTemplateTypes';

type RoleDialogueContextOverrides = {
  locale?: RoleDialogueContext['locale'];
  player?: Partial<RoleDialogueContext['player']>;
  world?: Partial<RoleDialogueContext['world']>;
  npc?: RoleDialogueContext['npc'];
  randomSeed?: string;
};

const buildContext = (overrides: RoleDialogueContextOverrides = {}): RoleDialogueContext => {
  const defaultPlayer = {
    level: 8,
    perks: [] as string[],
    factionReputation: {
      resistance: 0,
      corpsec: 0,
      scavengers: 0,
    },
  };

  const defaultWorld = {
    timeOfDay: 'day' as RoleDialogueContext['world']['timeOfDay'],
    curfewActive: false,
    zoneId: 'downtown_checkpoint',
    zoneName: 'Downtown Checkpoint',
    hazards: [] as string[],
    environmentFlags: {
      gangHeat: 'med' as const,
      curfewLevel: 1,
      supplyScarcity: 'norm' as const,
      blackoutTier: 'none' as const,
    },
  };

  const playerOverride: Partial<RoleDialogueContext['player']> = overrides.player ?? {};
  const worldOverride: Partial<RoleDialogueContext['world']> = overrides.world ?? {};

  return {
    locale: overrides.locale ?? 'en',
    player: {
      level: playerOverride.level ?? defaultPlayer.level,
      perks: playerOverride.perks ?? defaultPlayer.perks,
      factionReputation: {
        resistance: playerOverride.factionReputation?.resistance ?? defaultPlayer.factionReputation.resistance,
        corpsec: playerOverride.factionReputation?.corpsec ?? defaultPlayer.factionReputation.corpsec,
        scavengers: playerOverride.factionReputation?.scavengers ?? defaultPlayer.factionReputation.scavengers,
      },
    },
    world: {
      timeOfDay: worldOverride.timeOfDay ?? defaultWorld.timeOfDay,
      curfewActive: worldOverride.curfewActive ?? defaultWorld.curfewActive,
      zoneId: worldOverride.zoneId ?? defaultWorld.zoneId,
      zoneName: worldOverride.zoneName ?? defaultWorld.zoneName,
      hazards: worldOverride.hazards ?? defaultWorld.hazards,
      environmentFlags: {
        gangHeat: worldOverride.environmentFlags?.gangHeat ?? defaultWorld.environmentFlags.gangHeat,
        curfewLevel: worldOverride.environmentFlags?.curfewLevel ?? defaultWorld.environmentFlags.curfewLevel,
        supplyScarcity: worldOverride.environmentFlags?.supplyScarcity ?? defaultWorld.environmentFlags.supplyScarcity,
        blackoutTier: worldOverride.environmentFlags?.blackoutTier ?? defaultWorld.environmentFlags.blackoutTier,
      },
    },
    npc: overrides.npc,
    randomSeed: overrides.randomSeed ?? 'test-seed',
  };
};

describe('resolveRoleDialogueTemplate', () => {
  it('selects hazard-aware merchant lines when blackout keywords are present', () => {
    const context = buildContext({
      player: {
        level: 10,
        perks: [],
        factionReputation: {
          resistance: 40,
          corpsec: -15,
          scavengers: 0,
        },
      },
      world: {
        hazards: ['Rolling blackout in the market grid'],
      },
    });

    const resolution = resolveRoleDialogueTemplate({
      roleId: 'merchant',
      templateKey: 'default_greeting',
      context,
    });

    expect(resolution).not.toBeNull();
    expect(resolution?.templateId).toBe('merchant.default_greeting.resistanceFriend');
    expect(resolution?.tokens.highlightItem.toLowerCase()).toMatch(/battery|lantern|dynamo/);
    expect(resolution?.text).not.toMatch(/{{\s*highlightItem\s*}}/);
  });

  it('falls back to corpsec watcher line when resistance rep is negative', () => {
    const resolution = resolveRoleDialogueTemplate({
      roleId: 'merchant',
      templateKey: 'default_greeting',
      context: buildContext({
        player: {
          level: 6,
          perks: [],
          factionReputation: {
            resistance: -20,
            corpsec: -12,
            scavengers: 4,
          },
        },
      }),
    });

    expect(resolution).not.toBeNull();
    expect(resolution?.templateId).toBe('merchant.default_greeting.corpsecWatcher');
    expect(resolution?.text.toLowerCase()).toContain('credits up front');
  });

  it('returns deterministic tokens across repeated calls with the same context', () => {
    const context = buildContext({
      player: {
        level: 12,
        perks: ['adrenalineRush'],
        factionReputation: {
          resistance: 32,
          corpsec: -5,
          scavengers: 18,
        },
      },
      world: {
        curfewActive: true,
        timeOfDay: 'night',
      },
    });

    const first = resolveRoleDialogueTemplate({
      roleId: 'street_doc',
      templateKey: 'default_greeting',
      context,
    });
    const second = resolveRoleDialogueTemplate({
      roleId: 'street_doc',
      templateKey: 'default_greeting',
      context,
    });

    expect(first?.seed).toBe(second?.seed);
    expect(first?.text).toBe(second?.text);
    expect(first?.tokens).toEqual(second?.tokens);
  });

  it('uses fallback template when no gated variants qualify', () => {
    const context = buildContext({
      player: {
        level: 4,
        perks: [],
        factionReputation: {
          resistance: 0,
          corpsec: 0,
          scavengers: 0,
        },
      },
      world: {
        curfewActive: false,
        hazards: [],
      },
    });

    const resolution = resolveRoleDialogueTemplate({
      roleId: 'merchant',
      templateKey: 'default_greeting',
      context,
    });

    expect(resolution).not.toBeNull();
    expect(resolution?.templateId).toBe('merchant.default_greeting.genericFallback');
    expect(resolution?.text.toLowerCase()).toContain('stock\'s thin');
  });
});
