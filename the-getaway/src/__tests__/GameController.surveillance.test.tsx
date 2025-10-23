import { StrictMode } from 'react';
import { Provider } from 'react-redux';
import { render, waitFor } from '@testing-library/react';
import GameController from '../components/GameController';
import { store, resetGame } from '../store';
import { initializeZoneSurveillance } from '../game/systems/surveillance/cameraSystem';

jest.mock('../components/debug/GameDebugInspector', () => () => null);

describe('GameController surveillance bootstrap', () => {
  beforeEach(() => {
    store.dispatch(resetGame());
  });

  afterEach(() => {
    store.dispatch(resetGame());
  });

  test('keeps existing surveillance zone after StrictMode remount cycle', async () => {
    const initialState = store.getState();
    const { currentMapArea, timeOfDay } = initialState.world;

    initializeZoneSurveillance({
      area: currentMapArea,
      timeOfDay,
      dispatch: store.dispatch,
      timestamp: performance.now(),
    });

    expect(store.getState().surveillance.zones[currentMapArea.id]).toBeTruthy();

    const rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
    const cancelRafSpy = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);

    const { unmount } = render(
      <StrictMode>
        <Provider store={store}>
          <GameController />
        </Provider>
      </StrictMode>
    );

    try {
      await waitFor(() => {
        expect(store.getState().surveillance.zones[currentMapArea.id]).toBeTruthy();
      });
    } finally {
      rafSpy.mockRestore();
      cancelRafSpy.mockRestore();
      unmount();
    }
  });
});
