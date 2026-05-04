import { act, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import OpsBriefingsPanel from '../components/ui/OpsBriefingsPanel';
import { getUIStrings } from '../content/ui';
import { DEFAULT_LOCALE } from '../content/locales';
import { resetGame, store } from '../store';
import { completeQuest, startQuest } from '../store/questsSlice';

const { questLog: questLogStrings } = getUIStrings(DEFAULT_LOCALE);

const renderPanel = (props?: React.ComponentProps<typeof OpsBriefingsPanel>) => {
  return render(
    <Provider store={store}>
      <OpsBriefingsPanel {...props} />
    </Provider>
  );
};

describe('OpsBriefingsPanel', () => {
  beforeEach(() => {
    store.dispatch(resetGame());
  });

  it('renders the guided primary beat and active side section at boot', () => {
    renderPanel();

    expect(screen.getByText(questLogStrings.primaryProgress)).toBeInTheDocument();
    expect(screen.getByText(questLogStrings.activeSideQuests)).toBeInTheDocument();
    expect(screen.queryByText(questLogStrings.availableSideQuests)).not.toBeInTheDocument();
    expect(screen.getByText('Recover Lira’s Confiscated Cache')).toBeInTheDocument();
    expect(screen.queryByText('Camera Blackout')).not.toBeInTheDocument();
    expect(screen.queryByText('Drone Route Surveillance')).not.toBeInTheDocument();
    expect(screen.queryByText(/Talk to Firebrand Juno/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/shadow a patrol drone and log 3 unique waypoints/i)
    ).not.toBeInTheDocument();
  });

  it('moves a side quest from available to active after quest start', () => {
    renderPanel();
    expect(screen.queryByText(questLogStrings.giverLabel('Firebrand Juno'))).not.toBeInTheDocument();

    act(() => {
      store.dispatch(startQuest('quest_equipment_sabotage'));
    });

    expect(screen.getByText('Camera Blackout')).toBeInTheDocument();
    expect(screen.queryByText(questLogStrings.giverLabel('Firebrand Juno'))).not.toBeInTheDocument();
    expect(
      screen.getByText(/Sabotage 3 active surveillance cameras during curfew/i)
    ).toBeInTheDocument();
  });

  it('shows completed quests in completed overlay mode', () => {
    act(() => {
      store.dispatch(startQuest('quest_market_cache'));
      store.dispatch(completeQuest('quest_market_cache'));
    });

    renderPanel({ showCompleted: true });

    expect(screen.getByText(questLogStrings.completed)).toBeInTheDocument();
    expect(screen.getByText('Market Cache Recovery')).toBeInTheDocument();
  });
});
