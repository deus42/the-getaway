import { resetGame, store } from '../store';
import { completeQuest, startQuest } from '../store/questsSlice';
import { selectOpsBriefingModel } from '../store/selectors/opsBriefingSelectors';

describe('selectOpsBriefingModel', () => {
  beforeEach(() => {
    store.dispatch(resetGame());
  });

  it('groups objectives and quests into primary, active side, available side, and completed buckets', () => {
    const baseline = selectOpsBriefingModel(store.getState());

    expect(baseline.primaryObjectives.length).toBeGreaterThan(0);
    expect(baseline.activeSideQuests).toHaveLength(0);
    expect(
      baseline.availableSideQuests.some((quest) => quest.id === 'quest_equipment_sabotage')
    ).toBe(true);
    expect(
      baseline.availableSideQuests.some((quest) => quest.id === 'quest_drone_recon')
    ).toBe(true);
    expect(baseline.completedQuests).toHaveLength(0);
  });

  it('resolves giver name from locale data and updates buckets as quests progress', () => {
    let model = selectOpsBriefingModel(store.getState());
    const sabotageQuest = model.availableSideQuests.find(
      (quest) => quest.id === 'quest_equipment_sabotage'
    );

    expect(sabotageQuest?.giverName).toBe('Firebrand Juno');
    expect(sabotageQuest?.kind).toBe('side');

    store.dispatch(startQuest('quest_equipment_sabotage'));
    model = selectOpsBriefingModel(store.getState());
    expect(
      model.activeSideQuests.some((quest) => quest.id === 'quest_equipment_sabotage')
    ).toBe(true);
    expect(
      model.availableSideQuests.some((quest) => quest.id === 'quest_equipment_sabotage')
    ).toBe(false);

    store.dispatch(startQuest('quest_market_cache'));
    store.dispatch(completeQuest('quest_market_cache'));
    model = selectOpsBriefingModel(store.getState());
    expect(
      model.completedQuests.some((quest) => quest.id === 'quest_market_cache')
    ).toBe(true);
  });
});

