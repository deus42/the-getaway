import { configureStore } from '@reduxjs/toolkit';
import { LEVEL0_LAYOUT_CONTRACT } from '../../content/levels/level0/layoutContract';
import { departLevel0Operation } from '../../game/level0/runtime/safehouse';
import reducer, {
  applyLevel0Paranoia,
  initializeLevel0Run,
  restartAttempt,
} from '../level0RuntimeSlice';

const createStore = () => configureStore({ reducer: { level0Runtime: reducer } });

describe('GET-216 Level 0 v3 Redux seam', () => {
  it('initializes from a cover and applies Paranoia without retired numeric state', () => {
    const store = createStore();
    store.dispatch(initializeLevel0Run({ sessionId: 'slice-v3', coverId: 'cover.neighbor' }));
    store.dispatch(applyLevel0Paranoia({
      eventId: 'slice.paranoia.1',
      amount: 40,
      sourceId: 'camera.identity_gate',
      feedbackId: 'paranoia.camera_observation',
    }));

    const state = store.getState().level0Runtime;
    expect(state.run).toMatchObject({
      identity: { coverId: 'cover.neighbor' },
      paranoia: 40,
    });
    expect(state.run).not.toHaveProperty('health');
    expect(state.run).not.toHaveProperty('build');
    expect(state.feedbackParanoiaEventIds).toEqual(['slice.paranoia.1']);
  });

  it('exposes only Restart Attempt vocabulary for baseline restoration', () => {
    const store = createStore();
    store.dispatch(initializeLevel0Run({ sessionId: 'restart-v3', coverId: 'cover.neighbor' }));
    const run = store.getState().level0Runtime.run!;
    const anchor = LEVEL0_LAYOUT_CONTRACT.anchors.find(
      (candidate) => candidate.id === 'safehouse.departure'
    );
    const departure = departLevel0Operation(
      { ...run, mission: 'L0_PREPARATION' },
      anchor!.position
    );
    store.dispatch(applyLevel0Paranoia({
      eventId: 'slice.paranoia.after',
      amount: 70,
      sourceId: 'camera.identity_gate',
      feedbackId: 'paranoia.camera_observation',
    }));
    store.dispatch(restartAttempt(departure.baseline!));

    expect(store.getState().level0Runtime.run?.paranoia).toBe(0);
    expect(store.getState().level0Runtime.feedbackId).toBe('restart_attempt.restored');
  });
});
