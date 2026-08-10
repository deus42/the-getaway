import { resetGame, store } from '../store';
import { endDialogue } from '../store/questsSlice';
import {
  startDialogue,
  startQuest,
  updateObjectiveStatus,
} from '../store/questsSlice';
import { advanceToNextLevel, missionAccomplished } from '../store/missionSlice';
import {
  buildAgentStateSignature,
  buildAgentSnapshot,
  installGetawayAgentBridge,
  resolveAgentMovementTimeoutMs,
  shouldEnableGetawayAgentBridge,
  validateAgentAction,
} from '../game/playtest/agentBridge';
import { setStealthState } from '../store/playerSlice';

describe('getaway agent bridge', () => {
  beforeEach(() => {
    store.dispatch(resetGame());
  });

  afterEach(() => {
    delete window.__getawayAgent;
  });

  it('is available only to explicitly gated test fixtures', () => {
    expect(shouldEnableGetawayAgentBridge('', 'development')).toBe(false);
    expect(shouldEnableGetawayAgentBridge('?agent=0', 'development')).toBe(false);
    expect(shouldEnableGetawayAgentBridge('?agent=1', 'production')).toBe(false);
    expect(shouldEnableGetawayAgentBridge('?agent=1', 'development')).toBe(false);
    expect(shouldEnableGetawayAgentBridge('?agent=1', 'test')).toBe(true);
  });

  it('does not install a global bridge without the query gate', () => {
    installGetawayAgentBridge({
      store,
      search: '',
      nodeEnv: 'development',
    });

    expect(window.__getawayAgent).toBeUndefined();
  });

  it('does not install a global bridge in production mode', () => {
    installGetawayAgentBridge({
      store,
      search: '?agent=1',
      nodeEnv: 'production',
    });

    expect(window.__getawayAgent).toBeUndefined();
  });

  it('installs a fixture-only snapshot bridge in test mode', () => {
    const cleanup = installGetawayAgentBridge({
      store,
      search: '?agent=1',
      nodeEnv: 'test',
    });

    expect(window.__getawayAgent?.version).toBe('getaway-agent-v1');
    const snapshot = window.__getawayAgent?.snapshot();
    expect(snapshot?.schema).toBe('getaway_agent_snapshot_v1');
    expect(snapshot?.evidenceClass).toBe('fixture-only');
    expect(snapshot?.player.position).toEqual(store.getState().player.data.position);
    expect(snapshot?.player.inventoryCount).toBe(store.getState().player.data.inventory.items.length);
    expect('inventory' in (snapshot?.player ?? {})).toBe(false);
    expect(snapshot?.world.map.nearbyWalkableTiles.length).toBeGreaterThan(0);
    expect(snapshot?.items.some((item) => item.resourceKey === 'items.corporate_keycard')).toBe(true);

    cleanup();
    expect(window.__getawayAgent).toBeUndefined();
  });

  it('builds the expected snapshot shape from Redux state', () => {
    const snapshot = buildAgentSnapshot(store.getState());

    expect(snapshot.objectives.length).toBeGreaterThan(0);
    expect(snapshot.npcs.length).toBeGreaterThan(0);
    expect(snapshot.world.map.walkableTileCount).toBeGreaterThan(0);
    expect(snapshot.recentLogs.length).toBeLessThanOrEqual(12);
  });

  it('marks only the next incomplete quest objective as active', () => {
    store.dispatch(startQuest('quest_market_cache'));

    const startedObjectives = buildAgentSnapshot(store.getState()).objectives
      .filter((objective) => objective.questId === 'quest_market_cache');
    expect(startedObjectives.filter((objective) => objective.isActive).map((objective) => objective.objectiveId))
      .toEqual(['recover-keycard']);

    store.dispatch(
      updateObjectiveStatus({
        questId: 'quest_market_cache',
        objectiveId: 'recover-keycard',
        isCompleted: true,
      })
    );

    const returnObjectives = buildAgentSnapshot(store.getState()).objectives
      .filter((objective) => objective.questId === 'quest_market_cache');
    expect(returnObjectives.filter((objective) => objective.isActive).map((objective) => objective.objectiveId))
      .toEqual(['return-to-lira']);
  });

  it('exposes only selectable dialogue options with stable bridge indexes', () => {
    store.dispatch(startQuest('quest_market_cache'));
    store.dispatch(
      updateObjectiveStatus({
        questId: 'quest_market_cache',
        objectiveId: 'recover-keycard',
        isCompleted: true,
      })
    );
    store.dispatch(startDialogue({ dialogueId: 'npc_lira_vendor', nodeId: 'intro' }));

    const snapshot = buildAgentSnapshot(store.getState());
    const completion = snapshot.dialogue.options.find((option) =>
      /Cache is back in rebel hands/i.test(option.text)
    );

    expect(completion).toMatchObject({
      originalIndex: 2,
      hasQuestEffect: true,
    });
    expect(completion?.index).toEqual(expect.any(Number));
    expect(snapshot.dialogue.options.some((option) => /Walk me through/i.test(option.text))).toBe(false);
  });

  it('rejects malformed agent actions before dispatch', () => {
    expect(validateAgentAction({ type: 'clickTile', position: { x: 1.5, y: 2 } }).ok).toBe(false);
    expect(validateAgentAction({ type: 'interactNpc', id: 123 }).ok).toBe(false);
    expect(validateAgentAction({ type: 'collectItem', position: { x: 1, y: 2.5 } }).ok).toBe(false);
    expect(validateAgentAction({ type: 'setClock', phase: 'dawn' }).ok).toBe(false);
    expect(validateAgentAction({ type: 'chooseDialogueOption', index: -1 }).ok).toBe(false);
    expect(validateAgentAction({ type: 'waitForObjectiveChange', fromId: 12 }).ok).toBe(false);
    expect(validateAgentAction({ type: 'waitForDialogue', timeoutMs: Number.NaN }).ok).toBe(false);
    expect(validateAgentAction({ type: 'wait', ms: Number.NaN }).ok).toBe(false);
    expect(validateAgentAction({ type: 'wait', ms: 250 }).ok).toBe(true);
    expect(validateAgentAction({ type: 'interactNpc', role: 'lira' }).ok).toBe(true);
    expect(validateAgentAction({ type: 'collectItem', name: 'keycard' }).ok).toBe(true);
    expect(validateAgentAction({ type: 'continueMission' }).ok).toBe(true);
    expect(validateAgentAction({ type: 'advanceMission' }).ok).toBe(true);
    expect(validateAgentAction({ type: 'triggerMissionFailure' }).ok).toBe(true);
    expect(validateAgentAction({ type: 'restartAttempt' }).ok).toBe(true);
  });

  it('scales semantic movement waits for long NPC routes', () => {
    expect(resolveAgentMovementTimeoutMs(0)).toBe(6000);
    expect(resolveAgentMovementTimeoutMs(8)).toBe(9360);
    expect(resolveAgentMovementTimeoutMs(48)).toBe(22000);
  });

  it('returns structured action metadata from bridge dispatches', async () => {
    const cleanup = installGetawayAgentBridge({
      store,
      search: '?agent=1',
      nodeEnv: 'test',
    });

    const result = await window.__getawayAgent!.dispatch({ type: 'wait', ms: 1 });

    expect(result.ok).toBe(true);
    expect(result.status).toBe('ok');
    expect(result.reason).toBe('Waited 1ms.');
    expect(result.beforeObjectiveId).toBeDefined();
    expect(result.afterObjectiveId).toBeDefined();
    expect(result.stateChanged).toBe(false);
    expect(result.evidenceHint).toBe('Fixed wait completed.');

    cleanup();
  });

  it('treats stealth state as QA-visible action state', () => {
    const before = buildAgentSnapshot(store.getState());

    store.dispatch(setStealthState({ enabled: true, cooldownExpiresAt: null }));

    const after = buildAgentSnapshot(store.getState());
    expect(buildAgentStateSignature(before)).not.toBe(buildAgentStateSignature(after));
  });

  it('reports stealth toggle requests as no-op when no controller handles them', async () => {
    const cleanup = installGetawayAgentBridge({
      store,
      search: '?agent=1',
      nodeEnv: 'test',
    });

    const result = await window.__getawayAgent!.dispatch({ type: 'toggleStealth' });

    expect(result.ok).toBe(true);
    expect(result.status).toBe('no-op');
    expect(result.stateChanged).toBe(false);
    expect(result.reason).toBe('Stealth toggle produced no QA-visible state change.');

    cleanup();
  });

  it('advances pending mission recap through the QA bridge', async () => {
    store.dispatch(missionAccomplished());
    const cleanup = installGetawayAgentBridge({
      store,
      search: '?agent=1',
      nodeEnv: 'test',
    });

    const result = await window.__getawayAgent!.dispatch({ type: 'advanceMission' });
    const snapshot = window.__getawayAgent!.snapshot();

    expect(result.ok).toBe(true);
    expect(result.status).toBe('ok');
    expect(result.reason).toContain('Advanced mission');
    expect(snapshot.mission.currentLevelIndex).toBe(1);
    expect(snapshot.mission.pendingAdvance).toBe(false);

    cleanup();
  });

  it('clicks the live mission completion continue button through the QA bridge', async () => {
    store.dispatch(missionAccomplished());
    const continueButton = document.createElement('button');
    continueButton.dataset.testid = 'mission-complete-continue';
    continueButton.textContent = 'Next Level';
    continueButton.addEventListener('click', () => {
      store.dispatch(advanceToNextLevel());
    });
    document.body.appendChild(continueButton);

    const cleanup = installGetawayAgentBridge({
      store,
      search: '?agent=1',
      nodeEnv: 'test',
    });

    const result = await window.__getawayAgent!.dispatch({ type: 'continueMission' });
    const snapshot = window.__getawayAgent!.snapshot();

    expect(result.ok).toBe(true);
    expect(result.status).toBe('ok');
    expect(result.reason).toBe('Clicked mission completion continue.');
    expect(result.evidenceHint).toBe('Mission completion continue button was clicked through the live DOM.');
    expect(snapshot.mission.currentLevelIndex).toBe(1);
    expect(snapshot.mission.pendingAdvance).toBe(false);

    cleanup();
    continueButton.remove();
  });

  it('can trigger mission failure through the QA bridge', async () => {
    const cleanup = installGetawayAgentBridge({
      store,
      search: '?agent=1',
      nodeEnv: 'test',
    });

    const result = await window.__getawayAgent!.dispatch({ type: 'triggerMissionFailure' });
    const snapshot = window.__getawayAgent!.snapshot();

    expect(result.ok).toBe(true);
    expect(result.status).toBe('ok');
    expect(result.reason).toContain('Triggered mission failure');
    expect(snapshot.player.health).toBe(0);
    expect(snapshot.overlays.missionFailureOpen).toBe(true);

    cleanup();
  });

  it('rejects unresolved semantic targets through action metadata', async () => {
    const cleanup = installGetawayAgentBridge({
      store,
      search: '?agent=1',
      nodeEnv: 'test',
    });

    const result = await window.__getawayAgent!.dispatch({ type: 'interactNpc', role: 'missing-contact' });

    expect(result.ok).toBe(false);
    expect(result.status).toBe('rejected');
    expect(result.reason).toContain('No matching interactive NPC');
    expect(result.stateChanged).toBe(false);

    cleanup();
  });

  it('times out deterministic wait helpers when preconditions never appear', async () => {
    store.dispatch(endDialogue());
    const cleanup = installGetawayAgentBridge({
      store,
      search: '?agent=1',
      nodeEnv: 'test',
    });

    const dialogueResult = await window.__getawayAgent!.dispatch({ type: 'waitForDialogue', timeoutMs: 0 });
    const activeObjectiveId = buildAgentSnapshot(store.getState()).objectives.find(
      (objective) => objective.isActive && !objective.isCompleted
    )?.objectiveId;
    const objectiveResult = await window.__getawayAgent!.dispatch({
      type: 'waitForObjectiveChange',
      fromId: activeObjectiveId,
      timeoutMs: 0,
    });

    expect(dialogueResult.status).toBe('timeout');
    expect(objectiveResult.status).toBe('timeout');
    expect(dialogueResult.ok).toBe(false);
    expect(objectiveResult.ok).toBe(false);

    cleanup();
  });
});
