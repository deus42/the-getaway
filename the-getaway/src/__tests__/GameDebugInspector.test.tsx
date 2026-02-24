import { Provider } from 'react-redux';
import { Store, createStore } from 'redux';
import { render, screen } from '@testing-library/react';
import GameDebugInspector from '../components/debug/GameDebugInspector';
import { store as appStore } from '../store';
import type { RootState } from '../store';

jest.mock('phaser', () => ({
  VERSION: 'test-mock',
}));

type StoreOptions = {
  testMode?: boolean;
  heatmapEnabled?: boolean;
};

const cloneBaselineState = (): RootState => {
  const baseline = appStore.getState();
  const originMapArea = baseline.world.currentMapArea ?? baseline.world.mapAreas[0];
  if (!originMapArea) {
    throw new Error('Expected a baseline map area for debug inspector tests');
  }

  return {
    ...baseline,
    settings: { ...baseline.settings },
    reputation: {
      ...baseline.reputation,
      debug: {
        ...baseline.reputation.debug,
        inspectorTargetId: undefined,
      },
      profiles: { ...baseline.reputation.profiles },
      events: { ...baseline.reputation.events },
      witnessRecords: { ...baseline.reputation.witnessRecords },
      recordsByEvent: { ...baseline.reputation.recordsByEvent },
      carriers: { ...baseline.reputation.carriers },
      edges: { ...baseline.reputation.edges },
    },
    suspicion: {
      ...baseline.suspicion,
      zones: { ...baseline.suspicion.zones },
    },
    paranoia: {
      ...baseline.paranoia,
    },
    world: {
      ...baseline.world,
      currentMapArea: {
        ...originMapArea,
        entities: {
          ...originMapArea.entities,
          npcs: [...originMapArea.entities.npcs],
        },
      },
    },
  };
};

const createTestStore = ({ testMode, heatmapEnabled }: StoreOptions = {}): Store<RootState> => {
  const state = cloneBaselineState();

  if (typeof testMode !== 'undefined') {
    state.settings = { ...state.settings, testMode };
  }

  if (typeof heatmapEnabled !== 'undefined') {
    state.reputation = {
      ...state.reputation,
      debug: {
        ...state.reputation.debug,
        heatmapEnabled,
      },
    };
  }

  return createStore(() => state);
};

const renderWithStore = (options: StoreOptions) => {
  const testStore = createTestStore(options);
  return render(
    <Provider store={testStore}>
      <GameDebugInspector zoneId="zone::test" rendererInfo={{ label: 'Test Renderer', detail: 'snapshot' }} />
    </Provider>
  );
};

describe('GameDebugInspector gating', () => {
  it('omits the toggle when test mode is disabled', () => {
    renderWithStore({ testMode: false });
    expect(screen.queryByText(/Show Debug Panel/i)).toBeNull();
  });

  it('renders the toggle when test mode is enabled', () => {
    renderWithStore({ testMode: true });
    expect(screen.getByText(/Show Debug Panel/i)).toBeInTheDocument();
  });
});
