import { createInitialLevel0RunState } from '../runtime/safehouse';
import type { Level0RunState } from '../runtime/types';

/** Test-only convenience. Production callers must provide a player-confirmed cover. */
export const createTestLevel0RunState = (sessionId: string): Level0RunState => {
  return createInitialLevel0RunState(sessionId, 'cover.neighbor');
};
