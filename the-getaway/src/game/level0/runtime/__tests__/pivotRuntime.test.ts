import { LEVEL0_LAYOUT_CONTRACT } from '../../../../content/levels/level0/layoutContract';
import { applyLevel0ParanoiaEffect } from '../../rpg/paranoia';
import {
  applySafehouseResearch,
  createInitialLevel0RunState,
  departLevel0Operation,
  restartLevel0Attempt,
} from '../safehouse';

describe('GET-216 Level 0 v3 runtime', () => {
  it('starts from one authored cover with binary abilities and no retired numeric build', () => {
    const run = createInitialLevel0RunState('session-v3', 'cover.neighbor');

    expect(run).toMatchObject({
      schemaVersion: 3,
      identity: {
        coverId: 'cover.neighbor',
        appearancePresetId: 'player_civilian_01',
      },
      abilities: {
        heldAbilityIds: [
          'ability.read_people',
          'ability.negotiate',
          'ability.blend_in',
        ],
        researchState: {
          'research.naila_camera_topology': 'unavailable',
          'research.brant_delivery_protocol': 'unavailable',
        },
      },
      paranoia: 0,
      rpg: {
        gateResolutions: {},
        paranoiaEvents: [],
        announcedParanoiaTiers: [],
        researchEvents: [],
      },
    });
    expect(run).not.toHaveProperty('health');
    expect(run).not.toHaveProperty('build');
  });

  it('records named tier entry once and ends the attempt as breakdown at 100', () => {
    let run = createInitialLevel0RunState('paranoia-v3', 'cover.neighbor');
    run = applyLevel0ParanoiaEffect(run, {
      eventId: 'paranoia.camera.1',
      amount: 40,
      sourceId: 'camera.identity_gate',
      feedbackId: 'paranoia.camera_observation',
    }).run;
    expect(run.paranoia).toBe(40);
    expect(run.rpg.announcedParanoiaTiers).toEqual(['uneasy']);
    expect(run.rpg.paranoiaEvents[0]).toMatchObject({
      before: 0,
      after: 40,
      newlyEnteredTiers: ['uneasy'],
    });

    run = applyLevel0ParanoiaEffect(run, {
      eventId: 'paranoia.camera.2',
      amount: 60,
      sourceId: 'camera.identity_gate',
      feedbackId: 'paranoia.identity_confirmed',
    }).run;
    expect(run).toMatchObject({
      paranoia: 100,
      mission: 'L0_FAILED',
      failureCause: 'failure.breakdown',
      failureSourceId: 'camera.identity_gate',
    });
    expect(run.rpg.announcedParanoiaTiers).toEqual(['uneasy', 'shaken', 'breaking']);
    expect(run.worldClock.pauseOwners).toContain('failure');
  });

  it('researches once by consuming the exact fact and world minutes', () => {
    const initial = createInitialLevel0RunState('research-v3', 'cover.neighbor');
    const run = {
      ...initial,
      mission: 'L0_PREPARATION' as const,
      facts: {
        known: {
          'fact.naila.camera_topology': {
            factId: 'fact.naila.camera_topology',
            acquisitionIds: ['dialogue.naila.topology'],
          },
        },
      },
      abilities: {
        ...initial.abilities,
        researchState: {
          ...initial.abilities.researchState,
          'research.naila_camera_topology': 'available' as const,
        },
      },
    };

    const first = applySafehouseResearch(run, 'research.naila_camera_topology');
    expect(first).toMatchObject({ applied: true, clockEventIds: [] });
    expect(first.run.worldClock.currentMinute).toBe(run.worldClock.currentMinute + 20);
    expect(first.run.facts.known).not.toHaveProperty('fact.naila.camera_topology');
    expect(first.run.abilities.heldAbilityIds).toContain('ability.terminal_craft');
    expect(first.run.abilities.researchState['research.naila_camera_topology']).toBe('consumed');
    expect(first.run.rpg.researchEvents).toHaveLength(1);

    const repeated = applySafehouseResearch(first.run, 'research.naila_camera_topology');
    expect(repeated).toMatchObject({
      applied: false,
      blockedReasonId: 'research.blocked.consumed',
    });
    expect(repeated.run).toBe(first.run);
  });

  it('creates one immutable operation baseline and restarts from it exactly', () => {
    const initial = createInitialLevel0RunState('baseline-v3', 'cover.neighbor');
    const preparation = { ...initial, mission: 'L0_PREPARATION' as const };
    const departureAnchor = LEVEL0_LAYOUT_CONTRACT.anchors.find(
      (anchor) => anchor.id === 'safehouse.departure'
    );
    expect(departureAnchor).toBeDefined();

    const departure = departLevel0Operation(preparation, departureAnchor!.position);
    expect(departure.created).toBe(true);
    expect(departure.baseline).toMatchObject({
      schemaVersion: 3,
      sessionId: 'baseline-v3',
      mission: 'L0_OPERATION_DEPARTED',
    });
    expect(departure.run.safehouse.operationAttemptBaselineCreated).toBe(true);

    const changed = applyLevel0ParanoiaEffect(departure.run, {
      eventId: 'paranoia.after_departure',
      amount: 70,
      sourceId: 'camera.identity_gate',
      feedbackId: 'paranoia.camera_observation',
    }).run;
    const restarted = restartLevel0Attempt(departure.baseline!);
    expect(restarted.paranoia).toBe(0);
    expect(restarted.rpg.paranoiaEvents).toEqual([]);
    expect(restarted.identity).toEqual(departure.run.identity);
    expect(restarted.abilities).toEqual(departure.run.abilities);
    expect(restarted.player).toEqual(departure.run.player);
    expect(restarted).not.toEqual(changed);
    expect(restarted.worldClock.pauseOwners).toEqual([]);
  });
});
