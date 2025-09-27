import { act, render, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import GameController from '../components/GameController';
import { store, resetGame } from '../store';
import { setMapArea } from '../store/worldSlice';
import { MapArea, NPC, TileType } from '../game/interfaces/types';

const createEmptyMapArea = (id: string, width: number, height: number, npc: NPC): MapArea => {
  const tiles = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => ({
      type: TileType.FLOOR,
      position: { x, y },
      isWalkable: true,
      provideCover: false,
    }))
  );

  return {
    id,
    name: 'Routine Test Sector',
    width,
    height,
    tiles,
    entities: {
      enemies: [],
      npcs: [npc],
      items: [],
    },
  };
};

describe('NPC routines', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    cleanup();
    window.localStorage.clear();
    store.dispatch(resetGame());
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    cleanup();
    store.dispatch(resetGame());
  });

  it('moves NPCs to their scheduled waypoint for the active time of day', () => {
    const initialTimeOfDay = store.getState().world.timeOfDay;
    const npc: NPC = {
      id: 'npc-routine-1',
      name: 'Routine Walker',
      position: { x: 1, y: 1 },
      health: 10,
      maxHealth: 10,
      routine: [
        {
          position: { x: 4, y: 1 },
          timeOfDay: initialTimeOfDay,
          duration: 120,
        },
      ],
      dialogueId: 'npc_routine_test',
      isInteractive: false,
    };

    const mapArea = createEmptyMapArea('routine-test-area', 6, 6, npc);
    store.dispatch(setMapArea(mapArea));

    render(
      <Provider store={store}>
        <GameController />
      </Provider>
    );

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    const updatedNpc = store
      .getState()
      .world.currentMapArea.entities.npcs.find((entity) => entity.id === npc.id);

    expect(updatedNpc).toBeDefined();
    expect(updatedNpc!.position).toEqual({ x: 4, y: 1 });
  });
});

