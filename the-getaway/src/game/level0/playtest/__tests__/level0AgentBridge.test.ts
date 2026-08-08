import { resetGame, store } from '../../../../store';
import {
  initializeLevel0Run,
  syncLevel0PlayerCheckpoint,
} from '../../../../store/level0RuntimeSlice';
import { LEVEL0_LAYOUT_CONTRACT } from '../../../../content/levels/level0/layoutContract';
import { resolveClickIntent } from '../../movement/directMovement';
import {
  LEVEL0_AGENT_MOVE_EVENT,
  LEVEL0_AGENT_MOVE_RESULT_EVENT,
  installLevel0AgentBridge,
} from '../level0AgentBridge';

describe('Level 0 agent bridge', () => {
  beforeEach(() => {
    store.dispatch(resetGame());
    store.dispatch(initializeLevel0Run({
      sessionId: 'agent-session',
      coverId: 'cover.neighbor',
    }));
    window.history.replaceState({}, '', '/?agent=1');
  });

  afterEach(() => {
    delete window.__getawayAgent;
    delete window.render_game_to_text;
    delete window.advanceTime;
    window.history.replaceState({}, '', '/');
  });

  it('reports the canonical runtime instead of retired prototype state', () => {
    const uninstall = installLevel0AgentBridge({ store, search: '?agent=1', nodeEnv: 'test' });
    const snapshot = window.__getawayAgent?.snapshot();

    expect(snapshot?.world.areaId).toBe('level0-get204-four-block-source-candidate-v1');
    expect(snapshot?.world.map.width).toBe(58);
    expect(snapshot?.player.position).toEqual({ x: 16, y: 32 });
    expect(snapshot?.player.name).toBe('The Neighbor');
    expect(snapshot?.paranoia.tier).toBe('calm');
    expect(window.render_game_to_text?.()).toContain('L0_SAFEHOUSE_INTRO');
    uninstall();
  });

  it('exposes the same visible Game Design Bible state through text rendering', () => {
    const getGameBibleUiState = jest.fn(() => ({
      open: true,
      chapterId: 'condition',
      sectionId: 'condition.recovery',
      query: 'Paranoia',
      drawerOpen: false,
      resultCount: 2,
      visibleResults: [{
        chapterId: 'condition',
        sectionId: 'condition.recovery',
        label: 'Paranoia, Breakdown, and Recovery',
        excerpt: 'Restart Attempt restores the departure baseline.',
      }],
    }));
    const uninstall = installLevel0AgentBridge({
      store,
      search: '?agent=1',
      nodeEnv: 'test',
      getGameBibleUiState,
    });

    const rendered = JSON.parse(window.render_game_to_text!());
    expect(rendered.gameBible).toMatchObject({
      open: true,
      chapterId: 'condition',
      sectionId: 'condition.recovery',
      query: 'Paranoia',
      resultCount: 2,
    });
    expect(getGameBibleUiState).toHaveBeenCalled();
    uninstall();
  });

  it('advertises only nearby movement tiles accepted by direct movement clearance', () => {
    store.dispatch(syncLevel0PlayerCheckpoint({
      position: { x: 16, y: 8 },
      facing: { x: 0, y: 1 },
    }));
    const uninstall = installLevel0AgentBridge({ store, search: '?agent=1', nodeEnv: 'test' });
    const snapshot = window.__getawayAgent!.snapshot();

    const rejected = snapshot.world.map.nearbyWalkableTiles.filter(
      (target) => !resolveClickIntent(
        LEVEL0_LAYOUT_CONTRACT,
        snapshot.player.position,
        target
      ).accepted
    );
    expect(rejected).toEqual([]);
    expect(snapshot.world.map.nearbyWalkableTiles).not.toContainEqual({ x: 15, y: 9 });
    uninstall();
  });

  it('routes movement through the same direct-movement event and rejects removed stealth magic', async () => {
    installLevel0AgentBridge({ store, search: '?agent=1', nodeEnv: 'test' });
    const moveListener = jest.fn((event: Event) => {
      const detail = (event as CustomEvent<{ requestId: string }>).detail;
      window.dispatchEvent(new CustomEvent(LEVEL0_AGENT_MOVE_RESULT_EVENT, {
        detail: {
          requestId: detail.requestId,
          accepted: true,
          reason: 'movement-target-accepted',
        },
      }));
    });
    window.addEventListener(LEVEL0_AGENT_MOVE_EVENT, moveListener);

    const movement = await window.__getawayAgent!.dispatch({
      type: 'clickTile',
      position: { x: 25, y: 30 },
    });
    const stealth = await window.__getawayAgent!.dispatch({ type: 'toggleStealth' });

    expect(movement.status).toBe('ok');
    expect(moveListener).toHaveBeenCalledTimes(1);
    expect(stealth.status).toBe('rejected');
    expect(stealth.reason).toBe('removed-system');
    window.removeEventListener(LEVEL0_AGENT_MOVE_EVENT, moveListener);
  });

  it('rejects movement when no canonical scene acknowledges the request', async () => {
    installLevel0AgentBridge({ store, search: '?agent=1', nodeEnv: 'test' });

    const movement = await window.__getawayAgent!.dispatch({
      type: 'clickTile',
      position: { x: 25, y: 30 },
    });

    expect(movement.status).toBe('rejected');
    expect(movement.reason).toBe('scene-not-listening');
  });

  it('clears a prior accepted target when the next movement request is rejected', async () => {
    installLevel0AgentBridge({ store, search: '?agent=1', nodeEnv: 'test' });
    let requestCount = 0;
    const moveListener = (event: Event) => {
      requestCount += 1;
      const detail = (event as CustomEvent<{ requestId: string }>).detail;
      window.dispatchEvent(new CustomEvent(LEVEL0_AGENT_MOVE_RESULT_EVENT, {
        detail: {
          requestId: detail.requestId,
          accepted: requestCount === 1,
          reason: requestCount === 1 ? 'movement-target-accepted' : 'outside-district',
        },
      }));
    };
    window.addEventListener(LEVEL0_AGENT_MOVE_EVENT, moveListener);

    await window.__getawayAgent!.dispatch({
      type: 'clickTile',
      position: { x: 16, y: 47 },
    });
    const rejected = await window.__getawayAgent!.dispatch({
      type: 'clickTile',
      position: { x: -1, y: -1 },
    });
    const idle = await window.__getawayAgent!.dispatch({
      type: 'waitForPlayerIdle',
      timeoutMs: 10,
    });

    expect(rejected).toMatchObject({ status: 'rejected', reason: 'outside-district' });
    expect(idle).toMatchObject({
      status: 'timeout',
      reason: 'player-idle-no-accepted-intent',
    });
    window.removeEventListener(LEVEL0_AGENT_MOVE_EVENT, moveListener);
  });

  it('advances through the canonical clock action without bypassing pause ownership', () => {
    installLevel0AgentBridge({ store, search: '?agent=1', nodeEnv: 'test' });
    const before = store.getState().level0Runtime.run!.worldClock.currentMinute;

    window.advanceTime?.(2_000);

    expect(store.getState().level0Runtime.run!.worldClock.currentMinute).toBe(before + 1);
  });
});
