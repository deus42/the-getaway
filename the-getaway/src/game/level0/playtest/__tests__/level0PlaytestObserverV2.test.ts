import { resetGame, store } from '../../../../store';
import { initializeLevel0Run } from '../../../../store/level0RuntimeSlice';
import { createInitialLevel0RunState } from '../../runtime/safehouse';
import {
  LEVEL0_PLAYTEST_PROBE_IDS,
  buildLevel0PlaytestObservation,
  evaluateLevel0PlaytestProbe,
  installLevel0PlaytestObserver,
} from '../level0PlaytestObserverV2';

describe('Level 0 playtest observer v2', () => {
  beforeEach(() => {
    store.dispatch(resetGame());
    store.dispatch(initializeLevel0Run({
      sessionId: 'observer-session',
      coverId: 'cover.neighbor',
    }));
    window.history.replaceState({}, '', '/?agent=1&gateRun=GET-179-observer');
  });

  afterEach(() => {
    delete window.__getawayAgent;
    delete window.render_game_to_text;
    delete window.advanceTime;
    window.history.replaceState({}, '', '/');
    jest.restoreAllMocks();
  });

  it('publishes the complete approved observation-only probe catalog', () => {
    expect(LEVEL0_PLAYTEST_PROBE_IDS).toEqual([
      'level0.creation',
      'level0.lira-acceptance',
      'level0.preparation',
      'level0.departure-baseline',
      'level0.infiltration',
      'level0.medkits',
      'level0.manifest-unknown',
      'level0.manifest-naila-warning',
      'level0.manifest-recognized',
      'level0.manifest-copied',
      'level0.surveillance-recovery',
      'level0.return',
      'level0.transit-validation',
      'level0.debrief',
      'level0.capture',
      'level0.deadline',
      'level0.restart-attempt',
    ]);
    expect(new Set(LEVEL0_PLAYTEST_PROBE_IDS).size).toBe(LEVEL0_PLAYTEST_PROBE_IDS.length);
  });

  it('exposes compact observations and probe states without an action or clock surface', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const uninstall = installLevel0PlaytestObserver({
      store,
      search: '?agent=1&gateRun=GET-179-observer',
      nodeEnv: 'test',
    });

    const rendered = JSON.parse(window.render_game_to_text!());

    expect(rendered).toMatchObject({
      schema: 'level0_playtest_observation_v2',
      evidenceClass: 'live-guided',
      gateRun: 'GET-179-observer',
      runtime: {
        sessionId: 'observer-session',
        mission: 'L0_SAFEHOUSE_INTRO',
        coverId: 'cover.neighbor',
      },
    });
    expect(rendered.probes).toHaveLength(LEVEL0_PLAYTEST_PROBE_IDS.length);
    expect(rendered.probes.find(
      (probe: { probeId: string }) => probe.probeId === 'level0.creation'
    )).toMatchObject({ state: 'met', acceptanceEligible: true });
    expect(window.__getawayAgent).toBeUndefined();
    expect(window.advanceTime).toBeUndefined();
    expect(rendered.runtime).not.toHaveProperty('health');
    expect(rendered.runtime).not.toHaveProperty('enemies');
    expect(dispatchSpy).not.toHaveBeenCalled();

    uninstall();
    expect(window.render_game_to_text).toBeUndefined();
  });

  it('does not install diagnostics without the agent gate or in production', () => {
    installLevel0PlaytestObserver({ store, search: '', nodeEnv: 'development' });
    expect(window.render_game_to_text).toBeUndefined();

    installLevel0PlaytestObserver({ store, search: '?agent=1', nodeEnv: 'production' });
    expect(window.render_game_to_text).toBeUndefined();
  });

  it('lets fixtures exercise classification without satisfying acceptance', () => {
    const fixtureRun = {
      ...createInitialLevel0RunState('fixture-session', 'cover.neighbor'),
      mission: 'L0_DEBRIEF' as const,
    };
    const observation = buildLevel0PlaytestObservation({
      runtime: {
        status: 'active',
        run: fixtureRun,
        feedbackId: null,
        feedbackParanoiaEventIds: [],
        clockEventIds: [],
        sceneRevision: 1,
      },
      evidenceClass: 'fixture-only',
      gateRun: null,
      transitionIds: [],
    });

    expect(evaluateLevel0PlaytestProbe('level0.debrief', observation)).toEqual({
      probeId: 'level0.debrief',
      state: 'met',
      acceptanceEligible: false,
      reason: 'fixture-only-evidence',
    });
  });

  it('does not confuse consulting Lira with accepting her operation', () => {
    const consulted = createInitialLevel0RunState('consulted-session', 'cover.neighbor');
    consulted.contacts.lira.consulted = true;
    const consultedObservation = buildLevel0PlaytestObservation({
      runtime: {
        status: 'active',
        run: consulted,
        feedbackId: null,
        feedbackParanoiaEventIds: [],
        clockEventIds: [],
        sceneRevision: 1,
      },
      evidenceClass: 'live-guided',
      gateRun: 'GET-179-worker-1',
      transitionIds: [],
    });

    expect(evaluateLevel0PlaytestProbe(
      'level0.lira-acceptance',
      consultedObservation
    ).state).toBe('unmet');

    consulted.mission = 'L0_PREPARATION';
    const acceptedObservation = buildLevel0PlaytestObservation({
      runtime: {
        status: 'active',
        run: consulted,
        feedbackId: null,
        feedbackParanoiaEventIds: [],
        clockEventIds: [],
        sceneRevision: 1,
      },
      evidenceClass: 'live-guided',
      gateRun: 'GET-179-worker-1',
      transitionIds: [],
    });
    expect(evaluateLevel0PlaytestProbe(
      'level0.lira-acceptance',
      acceptedObservation
    ).state).toBe('met');
  });
});
