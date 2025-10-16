import { v4 as uuidv4 } from 'uuid';
import { Position } from '../interfaces/types';

export type ReactionTrigger = 'onMovement' | 'onAction' | 'onTargetSpotted';

export interface ReactionEntry {
  id: string;
  actorId: string;
  trigger: ReactionTrigger;
  radius?: number;
  targetPosition?: Position;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface ReactionQueue {
  entries: ReactionEntry[];
}

export const createReactionQueue = (): ReactionQueue => ({
  entries: [],
});

export type ReactionEnqueueInput = Omit<ReactionEntry, 'id' | 'createdAt'> & {
  id?: string;
  createdAt?: number;
};

export const enqueueReaction = (
  queue: ReactionQueue,
  entry: ReactionEnqueueInput
): { queue: ReactionQueue; entry: ReactionEntry } => {
  const resolved: ReactionEntry = {
    ...entry,
    id: entry.id ?? uuidv4(),
    createdAt: entry.createdAt ?? Date.now(),
  };

  const entries = [...queue.entries.filter((candidate) => candidate.id !== resolved.id), resolved];

  return {
    queue: {
      entries,
    },
    entry: resolved,
  };
};

export const consumeReactions = (
  queue: ReactionQueue,
  predicate: (entry: ReactionEntry) => boolean
): { queue: ReactionQueue; reactions: ReactionEntry[] } => {
  const reactions: ReactionEntry[] = [];
  const remaining: ReactionEntry[] = [];

  for (const entry of queue.entries) {
    if (predicate(entry)) {
      reactions.push(entry);
    } else {
      remaining.push(entry);
    }
  }

  return {
    queue: { entries: remaining },
    reactions,
  };
};

export const clearReactionQueue = (): ReactionQueue => ({ entries: [] });
