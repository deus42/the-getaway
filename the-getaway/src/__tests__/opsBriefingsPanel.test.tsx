import { render, screen, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import OpsBriefingsPanel from '../components/ui/OpsBriefingsPanel';
import { store, resetGame } from '../store';
import { startQuest, completeQuest } from '../store/questsSlice';
import { getUIStrings } from '../content/ui';
import { DEFAULT_LOCALE } from '../content/locales';

const { questLog: questLogStrings } = getUIStrings(DEFAULT_LOCALE);

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

    expect(screen.getByText(questLogStrings.empty, { exact: false })).toBeInTheDocument();
  });

  it('shows active quest after acceptance', () => {
    renderPanel();

    act(() => {
      store.dispatch(startQuest('quest_market_cache'));
    });

    expect(screen.getByText(questLogStrings.active, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/Market Cache Recovery/i)).toBeInTheDocument();
  });

  it('moves quest into recently closed section upon completion', () => {
    renderPanel();

    act(() => {
      store.dispatch(startQuest('quest_market_cache'));
      store.dispatch(completeQuest('quest_market_cache'));
    });

    expect(screen.getByText(questLogStrings.completed, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/Market Cache Recovery/i)).toBeInTheDocument();
  });
});
