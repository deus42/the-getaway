import { configureStore } from '@reduxjs/toolkit';
import worldReducer, { applyEnvironmentWeather, setEnvironmentFlags, setGameTime } from '../worldSlice';
import settingsReducer from '../settingsSlice';
import playerReducer from '../playerSlice';
import questsReducer from '../questsSlice';
import logReducer from '../logSlice';
import combatFeedbackReducer from '../combatFeedbackSlice';
import missionsReducer from '../missionSlice';
import surveillanceReducer from '../surveillanceSlice';
import storyletReducer from '../storyletSlice';
import { selectAmbientWorldSnapshot } from '../selectors/worldSelectors';
import { getWeatherPresetForCurfewLevel } from '../../content/environment';
import type { RootState } from '../index';

const createTestStore = () =>
  configureStore({
    reducer: {
      player: playerReducer,
      world: worldReducer,
      settings: settingsReducer,
      quests: questsReducer,
      log: logReducer,
      combatFeedback: combatFeedbackReducer,
      missions: missionsReducer,
      surveillance: surveillanceReducer,
      storylets: storyletReducer,
    },
  });

const getSnapshot = (state: RootState) => selectAmbientWorldSnapshot(state);

describe('selectAmbientWorldSnapshot', () => {
  it('returns weather metadata enriched with preset description and time of day', () => {
    const store = createTestStore();

    store.dispatch(setEnvironmentFlags({ curfewLevel: 2 }));
    store.dispatch(setGameTime(150));

    const preset = getWeatherPresetForCurfewLevel(2);
    const { world } = store.getState();

    expect(preset).toBeDefined();
    expect(world.timeOfDay).toBe('night');

    if (!preset) {
      return;
    }

    store.dispatch(
      applyEnvironmentWeather({
        presetId: preset.id,
        rainIntensity: preset.rainIntensity,
        thunderActive: preset.thunderActive,
        sirenLoop: preset.sirenLoop,
        storyFunction: preset.storyFunction,
        updatedAt: 1_000,
        timeOfDay: world.timeOfDay,
      })
    );

    const snapshot = getSnapshot(store.getState());

    expect(snapshot.weather.description).toBe(preset.description);
    expect(snapshot.weather.timeOfDay).toBe(world.timeOfDay);
    expect(snapshot.weather.storyFunction).toBe(preset.storyFunction);
  });

  it('preserves explicit weather story function when preset metadata is unavailable', () => {
    const store = createTestStore();

    store.dispatch(
      applyEnvironmentWeather({
        presetId: null,
        rainIntensity: 0.4,
        thunderActive: false,
        sirenLoop: false,
        storyFunction: 'misdirect',
        updatedAt: 500,
        timeOfDay: 'evening',
      })
    );

    const snapshot = getSnapshot(store.getState());

    expect(snapshot.weather.description).toBe('');
    expect(snapshot.weather.storyFunction).toBe('misdirect');
    expect(snapshot.weather.timeOfDay).toBe('evening');
  });
});
