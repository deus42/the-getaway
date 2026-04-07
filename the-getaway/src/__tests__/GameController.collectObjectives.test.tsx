import { StrictMode } from 'react';
import { Provider } from 'react-redux';
import { act, render, waitFor } from '@testing-library/react';
import GameController from '../components/GameController';
import { instantiateItem } from '../content/items';
import type { Position, Quest } from '../game/interfaces/types';
import { store, resetGame } from '../store';
import { addItem, setPlayerData } from '../store/playerSlice';
import { startQuest, updateQuest } from '../store/questsSlice';
import { setMapArea } from '../store/worldSlice';

jest.mock('../components/debug/GameDebugInspector', () => () => null);

const deepClone = <T,>(value: T): T => {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
};

const buildTree = (strictMode = false) => {
  const tree = (
    <Provider store={store}>
      <GameController />
    </Provider>
  );

  return strictMode ? <StrictMode>{tree}</StrictMode> : tree;
};

const renderController = (strictMode = false) => {
  const rafSpy = jest
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation(() => 0);
  const cancelRafSpy = jest
    .spyOn(window, 'cancelAnimationFrame')
    .mockImplementation(() => undefined);

  const view = render(buildTree(strictMode));
  return {
    ...view,
    rafSpy,
    cancelRafSpy,
  };
};

const restoreFrameSpies = (
  rafSpy: jest.SpyInstance<number, [FrameRequestCallback]>,
  cancelRafSpy: jest.SpyInstance<void, [number]>
) => {
  rafSpy.mockRestore();
  cancelRafSpy.mockRestore();
};

const getMedkitQuest = (): Quest => {
  const quest = store.getState().quests.quests.find((entry) => entry.id === 'quest_medkit_supplies');

  if (!quest) {
    throw new Error('Expected medkit quest to exist in test state.');
  }

  return quest;
};

const getCollectObjective = () => {
  const objective = getMedkitQuest().objectives.find((entry) => entry.id === 'collect-medkits');

  if (!objective) {
    throw new Error('Expected medkit collect objective to exist in test state.');
  }

  return objective;
};

const countInventoryMedkits = (): number =>
  store
    .getState()
    .player.data.inventory.items.filter((item) => item.resourceKey === 'items.abandoned_medkit')
    .length;

const setPlayerPosition = (position: Position) => {
  const player = deepClone(store.getState().player.data);
  player.position = position;
  store.dispatch(setPlayerData(player));
};

const setCurrentAreaItems = (
  items: Array<ReturnType<typeof instantiateItem> & { position: Position }>
) => {
  const mapArea = deepClone(store.getState().world.currentMapArea);
  mapArea.entities.items = items;
  store.dispatch(setMapArea(mapArea));
};

const resetMedkitQuest = (isActive: boolean) => {
  const quest = deepClone(getMedkitQuest());
  quest.isActive = isActive;
  quest.isCompleted = false;
  quest.objectives = quest.objectives.map((objective) =>
    objective.id === 'collect-medkits'
      ? {
          ...objective,
          isCompleted: false,
          currentCount: 0,
        }
      : objective
  );
  store.dispatch(updateQuest(quest));
};

describe('GameController collect objective syncing', () => {
  beforeEach(() => {
    store.dispatch(resetGame());
    jest.restoreAllMocks();
  });

  afterEach(() => {
    store.dispatch(resetGame());
    jest.restoreAllMocks();
  });

  test('increments medkit collect progress exactly once when the player enters a pickup tile', async () => {
    const medkit = {
      ...instantiateItem('misc_abandoned_medkit', { id: 'test-medkit-pickup' }),
      position: { x: 18, y: 14 },
    };

    resetMedkitQuest(false);
    store.dispatch(startQuest('quest_medkit_supplies'));
    setCurrentAreaItems([medkit]);
    setPlayerPosition({ x: 17, y: 14 });

    const { unmount, rafSpy, cancelRafSpy } = renderController();

    try {
      act(() => {
        setPlayerPosition({ x: 18, y: 14 });
      });

      await waitFor(() => {
        expect(getMedkitQuest().isActive).toBe(true);
        expect(getCollectObjective().currentCount).toBe(1);
        expect(countInventoryMedkits()).toBe(1);
        expect(store.getState().world.currentMapArea.entities.items).toHaveLength(0);
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(getCollectObjective().currentCount).toBe(1);
      expect(countInventoryMedkits()).toBe(1);
    } finally {
      restoreFrameSpies(rafSpy, cancelRafSpy);
      unmount();
    }
  });

  test('backfills one held medkit in StrictMode without overcounting on remount or rerender', async () => {
    const heldMedkit = instantiateItem('misc_abandoned_medkit', {
      id: 'test-medkit-held',
    });

    resetMedkitQuest(false);
    setCurrentAreaItems([]);
    setPlayerPosition({ x: 9, y: 9 });
    store.dispatch(addItem(heldMedkit));

    const { rerender, unmount, rafSpy, cancelRafSpy } = renderController(true);

    try {
      await waitFor(() => {
        expect(getMedkitQuest().isActive).toBe(true);
        expect(getCollectObjective().currentCount).toBe(1);
        expect(countInventoryMedkits()).toBe(1);
      });

      rerender(buildTree(true));

      await waitFor(() => {
        expect(getCollectObjective().currentCount).toBe(1);
        expect(countInventoryMedkits()).toBe(1);
      });
    } finally {
      restoreFrameSpies(rafSpy, cancelRafSpy);
      unmount();
    }
  });
});
