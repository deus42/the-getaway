import * as creation from '../creation';
import * as gates from '../gates';
import * as research from '../research';

describe('GET-216 cover identity contract', () => {
  it('publishes four authored covers with exactly one playable social-forward cover', () => {
    const catalog = (creation as unknown as {
      LEVEL0_COVER_CATALOG?: Record<string, {
        playable: boolean;
        startingAbilityIds: readonly string[];
      }>;
    }).LEVEL0_COVER_CATALOG;

    expect(catalog).toBeDefined();
    expect(Object.keys(catalog ?? {})).toEqual([
      'cover.neighbor',
      'cover.technician',
      'cover.commuter',
      'cover.archivist',
    ]);
    expect(Object.values(catalog ?? {}).filter((cover) => cover.playable)).toHaveLength(1);
    expect(catalog?.['cover.neighbor']).toMatchObject({
      playable: true,
      startingAbilityIds: [
        'ability.read_people',
        'ability.negotiate',
        'ability.blend_in',
      ],
    });
  });

  it('derives named Paranoia tiers and locks only declared fragile abilities', () => {
    const contract = gates as unknown as {
      LEVEL0_ABILITY_CATALOG?: Record<string, unknown>;
      deriveLevel0ParanoiaTier?: (value: number) => string;
      resolveLevel0AbilityState?: (
        abilityId: string,
        paranoia: number
      ) => { status: string; reasonId: string };
    };

    expect(Object.keys(contract.LEVEL0_ABILITY_CATALOG ?? {})).toEqual([
      'ability.read_people',
      'ability.negotiate',
      'ability.blend_in',
      'ability.steady_voice',
      'ability.spot_patterns',
      'ability.terminal_craft',
      'ability.trace_discipline',
      'ability.slip_away',
      'ability.quiet_feet',
    ]);
    expect([0, 39, 40, 69, 70, 89, 90, 99, 100].map(
      (value) => contract.deriveLevel0ParanoiaTier?.(value)
    )).toEqual([
      'calm', 'calm', 'uneasy', 'uneasy', 'shaken', 'shaken', 'breaking', 'breaking',
      'breakdown',
    ]);
    expect(contract.resolveLevel0AbilityState?.('ability.read_people', 40)).toEqual({
      status: 'locked',
      reasonId: 'ability.locked.uneasy',
    });
    expect(contract.resolveLevel0AbilityState?.('ability.steady_voice', 40)).toEqual({
      status: 'lit',
      reasonId: 'ability.lit',
    });
    expect(contract.resolveLevel0AbilityState?.('ability.steady_voice', 70)).toEqual({
      status: 'locked',
      reasonId: 'ability.locked.shaken',
    });
    expect(contract.resolveLevel0AbilityState?.('ability.terminal_craft', 99)).toEqual({
      status: 'lit',
      reasonId: 'ability.lit',
    });
  });

  it('resolves authored gate paths as met or not met with exact non-arithmetic reasons', () => {
    const contract = gates as unknown as {
      LEVEL0_GATE_CATALOG?: Record<string, unknown>;
      resolveLevel0Gate?: (input: {
        requirement: unknown;
        path: 'ability' | 'fact' | 'costed';
        heldAbilityIds: readonly string[];
        knownFactIds: readonly string[];
        paranoia: number;
        acceptCostedPath?: boolean;
        presentation: 'preview' | 'result';
      }) => Record<string, unknown>;
    };
    const requirement = contract.LEVEL0_GATE_CATALOG?.['gate.public_blend'];

    expect(requirement).toBeDefined();
    expect(contract.resolveLevel0Gate?.({
      requirement,
      path: 'ability',
      heldAbilityIds: ['ability.blend_in'],
      knownFactIds: [],
      paranoia: 0,
      presentation: 'preview',
    })).toMatchObject({
      gateId: 'gate.public_blend',
      path: 'ability',
      status: 'met',
      reasonId: 'gate.met.ability',
      presentation: 'preview',
    });
    expect(contract.resolveLevel0Gate?.({
      requirement,
      path: 'ability',
      heldAbilityIds: ['ability.blend_in'],
      knownFactIds: [],
      paranoia: 40,
      presentation: 'preview',
    })).toMatchObject({
      status: 'not-met',
      reasonId: 'gate.blocked.ability_locked.uneasy',
    });
    expect(contract.resolveLevel0Gate?.({
      requirement,
      path: 'fact',
      heldAbilityIds: [],
      knownFactIds: ['fact.brant.delivery_protocol'],
      paranoia: 99,
      presentation: 'result',
    })).toMatchObject({
      status: 'met',
      reasonId: 'gate.met.fact',
      presentation: 'result',
    });
    expect(contract.resolveLevel0Gate?.({
      requirement,
      path: 'costed',
      heldAbilityIds: [],
      knownFactIds: [],
      paranoia: 0,
      acceptCostedPath: true,
      presentation: 'preview',
    })).toMatchObject({
      status: 'met',
      reasonId: 'gate.met.costed',
    });
  });

  it('consumes one declared fact and grants one ability once per research option', () => {
    const contract = research as unknown as {
      LEVEL0_RESEARCH_CATALOG?: Record<string, unknown>;
      applyLevel0Research?: (input: {
        option: unknown;
        knownFactIds: readonly string[];
        heldAbilityIds: readonly string[];
        researchState: Record<string, string>;
      }) => Record<string, unknown>;
    };
    const option = contract.LEVEL0_RESEARCH_CATALOG?.['research.naila_camera_topology'];

    expect(option).toMatchObject({
      requiredFactId: 'fact.naila.camera_topology',
      worldMinuteCost: 20,
      grantedAbilityId: 'ability.terminal_craft',
    });
    expect(contract.applyLevel0Research?.({
      option,
      knownFactIds: [],
      heldAbilityIds: [],
      researchState: {
        'research.naila_camera_topology': 'unavailable',
        'research.brant_delivery_protocol': 'unavailable',
      },
    })).toMatchObject({
      applied: false,
      reasonId: 'research.blocked.fact_missing',
    });

    const first = contract.applyLevel0Research?.({
      option,
      knownFactIds: ['fact.naila.camera_topology'],
      heldAbilityIds: ['ability.read_people'],
      researchState: {
        'research.naila_camera_topology': 'available',
        'research.brant_delivery_protocol': 'unavailable',
      },
    });
    expect(first).toMatchObject({
      applied: true,
      consumedFactId: 'fact.naila.camera_topology',
      grantedAbilityId: 'ability.terminal_craft',
      worldMinuteCost: 20,
      knownFactIds: [],
      heldAbilityIds: ['ability.read_people', 'ability.terminal_craft'],
      researchState: {
        'research.naila_camera_topology': 'consumed',
      },
    });
    expect(contract.applyLevel0Research?.({
      option,
      knownFactIds: [],
      heldAbilityIds: first?.heldAbilityIds as readonly string[],
      researchState: first?.researchState as Record<string, string>,
    })).toMatchObject({
      applied: false,
      reasonId: 'research.blocked.consumed',
    });
  });
});
