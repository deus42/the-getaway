import { AppDispatch } from './index';
import { switchTurn } from './worldSlice';
import { resetActionPoints } from './playerSlice';

/**
 * Thunk action to atomically switch turn and reset player AP.
 * This prevents race conditions where the turn switches but AP isn't reset yet.
 */
export const switchToPlayerTurn = () => (dispatch: AppDispatch) => {
  dispatch(switchTurn());
  dispatch(resetActionPoints());
};
