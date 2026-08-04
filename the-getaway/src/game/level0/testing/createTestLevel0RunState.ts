import { createConfirmedLevel0Sample } from '../rpg/creation';
import { createInitialLevel0RunState } from '../runtime/safehouse';
import type { Level0RunState } from '../runtime/types';

/** Test-only convenience. Production callers must provide a player-confirmed identity and build. */
export const createTestLevel0RunState = (sessionId: string): Level0RunState => {
  const sample = createConfirmedLevel0Sample('social_mental', 'Test Operative');
  return createInitialLevel0RunState(sessionId, sample.identity, sample.build);
};
