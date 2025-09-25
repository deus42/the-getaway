import { fireEvent, render, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import GameController from '../components/GameController';
import { store, resetGame } from '../store';
import { setGameTime } from '../store/worldSlice';
import { movePlayer } from '../store/playerSlice';
import { TileType, Position } from '../game/interfaces/types';

const NIGHT_TIME_SECONDS = 200;
const CORRIDOR_LENGTH = 4; // starting tile plus three moves to the right

const renderController = () =>
  render(
    <Provider store={store}>
      <GameController />
    </Provider>
  );

const findOpenCorridorStart = (): Position => {
  const mapArea = store.getState().world.currentMapArea;

  for (let y = 1; y < mapArea.height - 1; y += 1) {
    for (let x = 1; x < mapArea.width - CORRIDOR_LENGTH; x += 1) {
      let isCorridor = true;

      for (let offset = 0; offset < CORRIDOR_LENGTH; offset += 1) {
        const tile = mapArea.tiles[y][x + offset];
        const obstructed =
          !tile.isWalkable || tile.provideCover || tile.type === TileType.DOOR;

        if (obstructed) {
          isCorridor = false;
          break;
        }
      }

      if (isCorridor) {
        return { x, y };
      }
    }
  }

  throw new Error('No open corridor found for curfew tests.');
};

describe('Curfew patrol behaviour', () => {
  beforeEach(() => {
    cleanup();
    window.localStorage.clear();
    store.dispatch(resetGame());
    store.dispatch(setGameTime(NIGHT_TIME_SECONDS));
    expect(store.getState().world.curfewActive).toBe(true);

    const startPosition = findOpenCorridorStart();
    store.dispatch(movePlayer(startPosition));
  });

  afterEach(() => {
    cleanup();
    store.dispatch(resetGame());
  });

  it('warns once before spawning a patrol during curfew', () => {
    const initialEnemyCount =
      store.getState().world.currentMapArea.entities.enemies.length;

    const { getByTestId, unmount } = renderController();
    const controller = getByTestId('game-controller');

    fireEvent.keyDown(controller, { key: 'ArrowRight', code: 'ArrowRight' });

    const state = store.getState();
    expect(state.world.currentMapArea.entities.enemies.length).toBe(
      initialEnemyCount
    );
    const lastMessage = state.log.messages[state.log.messages.length - 1];
    expect(lastMessage).toMatch(/take cover before the patrols lock on/i);

    unmount();
  });

  it('spawns only a single patrol after the warning has been issued', () => {
    const baseEnemyCount =
      store.getState().world.currentMapArea.entities.enemies.length;

    const { getByTestId, unmount } = renderController();
    const controller = getByTestId('game-controller');

    fireEvent.keyDown(controller, { key: 'ArrowRight', code: 'ArrowRight' });
    fireEvent.keyDown(controller, { key: 'ArrowRight', code: 'ArrowRight' });

    let state = store.getState();
    expect(state.world.currentMapArea.entities.enemies.length).toBe(
      baseEnemyCount + 1
    );

    fireEvent.keyDown(controller, { key: 'ArrowRight', code: 'ArrowRight' });
    state = store.getState();
    expect(state.world.currentMapArea.entities.enemies.length).toBe(
      baseEnemyCount + 1
    );

    const lastMessage = state.log.messages[state.log.messages.length - 1];
    expect(lastMessage).toMatch(/curfew patrol opens fire/i);

    unmount();
  });
});
