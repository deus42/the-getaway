import { evaluateStorylet, buildStoryActorPool } from '../storyletEngine';
import { getStoryletLibrary } from '../storyletRegistry';
import {
  StoryletRuntimeSnapshot,
  StoryletTriggerContext,
} from '../storyletTypes';
import { DEFAULT_PLAYER } from '../../../interfaces/player';
import { NPC } from '../../../interfaces/types';

const createNpc = (dialogueId: string, name: string, overrides: Partial<NPC> = {}): NPC => ({
  id: dialogueId,
  name,
  position: { x: 0, y: 0 },
  health: overrides.health ?? 12,
  maxHealth: overrides.maxHealth ?? 12,
  routine: overrides.routine ?? [
    { position: { x: 0, y: 0 }, timeOfDay: 'day', duration: 120 },
  ],
  dialogueId,
  isInteractive: overrides.isInteractive ?? true,
});

describe('storyletEngine', () => {
  const plays = getStoryletLibrary();
  const baseRuntime: StoryletRuntimeSnapshot = {
    entries: {},
    lastSeenByLocation: {},
  };

  it('selects the wounded victory branch after a mission completion', () => {
    const player = {
      ...DEFAULT_PLAYER,
      name: 'Test Operative',
      backgroundId: 'corpsec_defector',
      maxHealth: 100,
      health: 40,
    };

    const npcs: NPC[] = [
      createNpc('npc_lira_vendor', 'Lira the Smuggler'),
      createNpc('npc_archivist_naila', 'Archivist Naila'),
    ];

    const actorPool = buildStoryActorPool({ player, npcs });
    const now = Date.now();

    const trigger: StoryletTriggerContext = {
      type: 'missionCompletion',
      arc: 'act1_setup',
      timestamp: now,
      missionId: 'mission_0',
      locationId: 'slums',
      tags: ['resistance', 'injury'],
    };

    const resolution = evaluateStorylet({
      plays,
      runtime: baseRuntime,
      trigger,
      actorPool,
      now,
      locationId: 'slums',
    });

    expect(resolution).not.toBeNull();
    expect(resolution?.storyletId).toBe('firelight_ambush');
    expect(resolution?.branch.id).toBe('scarred_victory');
    expect(resolution?.resolvedRoles.mentor.name).toContain('Lira');
    expect(resolution?.resolvedRoles.protagonist.id).toBe(player.id);
  });

  it('respects cooldowns and per-location locks', () => {
    const player = {
      ...DEFAULT_PLAYER,
      name: 'Cooldown Tester',
      maxHealth: 90,
      health: 30,
    };
    const npcs: NPC[] = [createNpc('npc_lira_vendor', 'Lira the Smuggler')];
    const actorPool = buildStoryActorPool({ player, npcs });
    const now = Date.now();

    const trigger: StoryletTriggerContext = {
      type: 'missionCompletion',
      arc: 'act1_setup',
      timestamp: now,
      locationId: 'slums',
      tags: ['resistance', 'injury'],
    };

    const runtime: StoryletRuntimeSnapshot = {
      entries: {
        firelight_ambush: {
          storyletId: 'firelight_ambush',
          lastTriggeredAt: now - 500,
          cooldownExpiresAt: now + 60_000,
          timesTriggered: 1,
        },
      },
      lastSeenByLocation: {
        slums: 'firelight_ambush',
      },
    };

    const blocked = evaluateStorylet({
      plays,
      runtime,
      trigger,
      actorPool,
      now,
      locationId: 'slums',
    });

    expect(blocked).toBeNull();
  });

  it('casts bonded confidant during campfire rest', () => {
    const player = {
      ...DEFAULT_PLAYER,
      name: 'Rest Tester',
      backgroundId: 'corpsec_defector',
      maxHealth: 100,
      health: 100,
    };
    const npcs: NPC[] = [
      createNpc('npc_lira_vendor', 'Lira the Smuggler'),
      createNpc('npc_archivist_naila', 'Archivist Naila'),
    ];
    const actorPool = buildStoryActorPool({ player, npcs });
    const now = Date.now();

    const trigger: StoryletTriggerContext = {
      type: 'campfireRest',
      arc: 'act2_escalation',
      timestamp: now,
      locationId: 'hideout',
      tags: ['rest', 'relationship'],
    };

    const resolution = evaluateStorylet({
      plays,
      runtime: baseRuntime,
      trigger,
      actorPool,
      now,
      locationId: 'hideout',
    });

    expect(resolution).not.toBeNull();
    expect(resolution?.storyletId).toBe('neon_bivouac');
    expect(resolution?.branch.id).toBe('bond_renewed');
    expect(resolution?.resolvedRoles.confidant.name).toContain('Lira');
  });

  it('selects the rivalry branch during a patrol ambush', () => {
    const player = {
      ...DEFAULT_PLAYER,
      name: 'Ambush Tester',
      maxHealth: 95,
      health: 45,
    };
    const npcs: NPC[] = [
      createNpc('npc_seraph_warden', 'Seraph Warden'),
      createNpc('npc_firebrand_juno', 'Firebrand Juno'),
    ];
    const actorPool = buildStoryActorPool({ player, npcs });
    const now = Date.now();

    const trigger: StoryletTriggerContext = {
      type: 'patrolAmbush',
      arc: 'act3_finale',
      timestamp: now,
      locationId: 'downtown',
      tags: ['corpsec', 'ambush', 'injury'],
    };

    const resolution = evaluateStorylet({
      plays,
      runtime: baseRuntime,
      trigger,
      actorPool,
      now,
      locationId: 'downtown',
    });

    expect(resolution).not.toBeNull();
    expect(resolution?.storyletId).toBe('serrated_omen');
    expect(resolution?.branch.id).toBe('rivalry_ignites');
    expect(resolution?.resolvedRoles.rival.name).toContain('Seraph');
  });
});
