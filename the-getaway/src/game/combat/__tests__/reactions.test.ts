import { afterEach, describe, expect, it } from '@jest/globals';
import {
  drainReactions,
  getReactionQueueSnapshot,
  queueReaction,
  resetReactions,
} from '../combatSystem';

describe('reaction queue scaffolding', () => {
  afterEach(() => {
    resetReactions();
  });

  it('enqueues pending reactions and drains them via predicate', () => {
    const first = queueReaction({ actorId: 'enemy-1', trigger: 'onMovement' });
    expect(getReactionQueueSnapshot().entries).toHaveLength(1);

    queueReaction({ id: first.id, actorId: 'enemy-1', trigger: 'onMovement' });
    expect(getReactionQueueSnapshot().entries).toHaveLength(1);

    queueReaction({ actorId: 'enemy-2', trigger: 'onTargetSpotted', radius: 5 });
    expect(getReactionQueueSnapshot().entries).toHaveLength(2);

    const drained = drainReactions((entry) => entry.trigger === 'onMovement');
    expect(drained).toHaveLength(1);
    expect(drained[0].actorId).toBe('enemy-1');
    expect(getReactionQueueSnapshot().entries).toHaveLength(1);
  });
});
