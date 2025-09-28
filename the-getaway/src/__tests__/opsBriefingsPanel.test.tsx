import { render, screen, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import OpsBriefingsPanel from '../components/ui/OpsBriefingsPanel';
import { store, resetGame } from '../store';
import { startQuest, completeQuest } from '../store/questsSlice';

const renderPanel = () => {
  return render(
    <Provider store={store}>
      <OpsBriefingsPanel containerStyle={{}} />
    </Provider>
  );
};

describe('OpsBriefingsPanel (Quest Log)', () => {
  beforeEach(() => {
    store.dispatch(resetGame());
  });

  it('shows placeholder when no quests are active or completed', () => {
    renderPanel();

    expect(
      screen.getByText(/No quests tracked. Connect with contacts to unlock new objectives./i)
    ).toBeInTheDocument();
  });

  it('shows active quest after acceptance', () => {
    renderPanel();

    act(() => {
      store.dispatch(startQuest('quest_market_cache'));
    });

    expect(screen.getByText(/Active Quests/i)).toBeInTheDocument();
    expect(screen.getByText(/Market Cache Recovery/i)).toBeInTheDocument();
  });

  it('moves quest into recently closed section upon completion', () => {
    renderPanel();

    act(() => {
      store.dispatch(startQuest('quest_market_cache'));
      store.dispatch(completeQuest('quest_market_cache'));
    });

    expect(screen.getByText(/Completed Quests/i)).toBeInTheDocument();
    expect(screen.getByText(/Market Cache Recovery/i)).toBeInTheDocument();
  });
});
