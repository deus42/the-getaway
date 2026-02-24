import { fireEvent, render, cleanup, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import GameController from '../components/GameController';
import { store, resetGame } from '../store';
import { setGameTime } from '../store/worldSlice';
import { movePlayer } from '../store/playerSlice';
import { TileType, Position } from '../game/interfaces/types';
import { findPath } from '../game/world/pathfinding';

jest.mock('../components/debug/GameDebugInspector', () => () => null);

const NIGHT_TIME_SECONDS = 280;
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
  });

  afterEach(() => {
    cleanup();
    store.dispatch(resetGame());
  });

  it('warns once before spawning a patrol during curfew', () => {
    const startPosition = findOpenCorridorStart();
    store.dispatch(movePlayer(startPosition));

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
    expect(lastMessage).toMatch(/duck inside before the patrols lock on/i);

    unmount();
  });

  it('spawns only a single patrol after the warning has been issued', () => {
    const startPosition = findOpenCorridorStart();
    store.dispatch(movePlayer(startPosition));

    const { getByTestId, unmount } = renderController();
    const controller = getByTestId('game-controller');

    fireEvent.keyDown(controller, { key: 'ArrowRight', code: 'ArrowRight' });
    fireEvent.keyDown(controller, { key: 'ArrowRight', code: 'ArrowRight' });

    let state = store.getState();
    const spawnCount = state.world.currentMapArea.entities.enemies.length;

    fireEvent.keyDown(controller, { key: 'ArrowRight', code: 'ArrowRight' });
    state = store.getState();
    expect(state.world.currentMapArea.entities.enemies.length).toBe(spawnCount);

    const lastMessage = state.log.messages[state.log.messages.length - 1];
    expect(lastMessage).toMatch(/curfew patrol opens fire/i);

    unmount();
  });

  it('lets the player reset the alert by entering a building interior', () => {
    const startPosition = findOpenCorridorStart();
    store.dispatch(movePlayer(startPosition));



    const { getByTestId, unmount } = renderController();
    const controller = getByTestId('game-controller');

    fireEvent.keyDown(controller, { key: 'ArrowRight', code: 'ArrowRight' });
    let state = store.getState();
    expect(state.log.messages[state.log.messages.length - 1]).toMatch(
      /duck inside before the patrols lock on/i
    );
    expect(state.world.currentMapArea.isInterior).toBe(false);

    const currentAreaId = state.world.currentMapArea.id;
    const area = state.world.currentMapArea;
    const approachOffsets: Array<{
      key: string;
      code: string;
      offset: Position;
    }> = [
      { key: 'ArrowUp', code: 'ArrowUp', offset: { x: 0, y: 1 } },
      { key: 'ArrowDown', code: 'ArrowDown', offset: { x: 0, y: -1 } },
      { key: 'ArrowLeft', code: 'ArrowLeft', offset: { x: 1, y: 0 } },
      { key: 'ArrowRight', code: 'ArrowRight', offset: { x: -1, y: 0 } },
    ];

    const playerSnapshot = store.getState().player.data;
    const enemiesSnapshot = state.world.currentMapArea.entities.enemies;

    const candidateConnections = store
      .getState()
      .world.mapConnections.filter(
        (connection) => connection.fromAreaId === currentAreaId
      );

    let entryConnection: typeof candidateConnections[number] | undefined;
    let approach:
      | { key: string; code: string; offset: Position; target: Position }
      | undefined;

    const findApproach = (
      connection: typeof candidateConnections[number]
    ): { key: string; code: string; offset: Position; target: Position } | undefined => {
      for (const option of approachOffsets) {
        const candidate: Position = {
          x: connection.fromPosition.x + option.offset.x,
          y: connection.fromPosition.y + option.offset.y,
        };

        if (
          candidate.x < 0 ||
          candidate.y < 0 ||
          candidate.x >= area.width ||
          candidate.y >= area.height
        ) {
          continue;
        }

        const tile = area.tiles[candidate.y]?.[candidate.x];
        if (!tile) {
          continue;
        }

        if (!tile.isWalkable || tile.type === TileType.DOOR) {
          continue;
        }

        return { ...option, target: candidate };
      }

      return undefined;
    };

    for (const connection of candidateConnections) {
      const candidateApproach = findApproach(connection);
      if (!candidateApproach) {
        continue;
      }

      const path = findPath(
        playerSnapshot.position,
        candidateApproach.target,
        area,
        {
          player: playerSnapshot,
          enemies: enemiesSnapshot,
        }
      );

      const alreadyAtTarget =
        playerSnapshot.position.x === candidateApproach.target.x &&
        playerSnapshot.position.y === candidateApproach.target.y;

      if (!alreadyAtTarget && path.length === 0) {
        continue;
      }

      entryConnection = connection;
      approach = candidateApproach;
      break;
    }

    if (!entryConnection || !approach) {
      throw new Error('No valid approach tile located for the chosen doorway.');
    }

    const { fromPosition, toAreaId } = entryConnection;
    const approachTarget: Position = approach.target;

    const stepToKey = (dx: number, dy: number): { key: string; code: string } => {
      if (dx === 1 && dy === 0) {
        return { key: 'ArrowRight', code: 'ArrowRight' };
      }
      if (dx === -1 && dy === 0) {
        return { key: 'ArrowLeft', code: 'ArrowLeft' };
      }
      if (dx === 0 && dy === 1) {
        return { key: 'ArrowDown', code: 'ArrowDown' };
      }
      if (dx === 0 && dy === -1) {
        return { key: 'ArrowUp', code: 'ArrowUp' };
      }

      throw new Error(`Unsupported step delta (${dx}, ${dy}).`);
    };

    act(() => {
      store.dispatch(movePlayer(approachTarget));
    });
    state = store.getState();
    const currentPosition = state.player.data.position;

    const finalDx = fromPosition.x - currentPosition.x;
    const finalDy = fromPosition.y - currentPosition.y;
    const finalDirection = stepToKey(finalDx, finalDy);

    fireEvent.keyDown(controller, finalDirection);

    state = store.getState();
    expect(state.world.currentMapArea.id).toBe(toAreaId);
    expect(state.world.currentMapArea.isInterior).toBe(true);
    expect(state.world.currentMapArea.entities.enemies.length).toBe(0);
    expect(state.log.messages[state.log.messages.length - 1]).toMatch(
      /slip inside the structure/i
    );

    unmount();
  });
});
