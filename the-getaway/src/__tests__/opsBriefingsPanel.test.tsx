import { render, screen, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import OpsBriefingsPanel from '../components/ui/OpsBriefingsPanel';
import { store, resetGame } from '../store';
import { startQuest, completeQuest } from '../store/questsSlice';
import { getUIStrings } from '../content/ui';
import { DEFAULT_LOCALE } from '../content/locales';

const { questLog: questLogStrings } = getUIStrings(DEFAULT_LOCALE);

const renderPanel = (props?: React.ComponentProps<typeof OpsBriefingsPanel>) => {
  return render(
    <Provider store={store}>
      <OpsBriefingsPanel {...props} />
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

    expect(screen.getByText(/Market Cache Recovery/i)).toBeInTheDocument();
  });

  it('surface completed quests only when overlay is shown', () => {
    renderPanel();

    act(() => {
      store.dispatch(startQuest('quest_market_cache'));
      store.dispatch(completeQuest('quest_market_cache'));
    });

    expect(screen.queryByText(/Market Cache Recovery/i)).not.toBeInTheDocument();

    renderPanel({ showCompleted: true });
    expect(screen.getByText(/Market Cache Recovery/i)).toBeInTheDocument();
  });
});
