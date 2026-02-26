import { configureStore } from '@reduxjs/toolkit';
import worldReducer, {
  applyEnvironmentWeather,
  setCurrentMapAreaZoneMetadata,
  setEnvironmentFlags,
  setGameTime,
} from '../worldSlice';
import settingsReducer from '../settingsSlice';
import playerReducer from '../playerSlice';
import questsReducer from '../questsSlice';
import logReducer from '../logSlice';
import combatFeedbackReducer from '../combatFeedbackSlice';
import missionsReducer from '../missionSlice';
import surveillanceReducer from '../surveillanceSlice';
import storyletReducer from '../storyletSlice';
import autoBattleReducer from '../autoBattleSlice';
import suspicionReducer from '../suspicionSlice';
import paranoiaReducer from '../paranoiaSlice';
import reputationReducer from '../reputationSlice';
import hudLayoutReducer from '../hudLayoutSlice';
import { selectAmbientWorldSnapshot, selectEnvironmentSystemImpacts } from '../selectors/worldSelectors';
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
      autoBattle: autoBattleReducer,
      combatFeedback: combatFeedbackReducer,
      missions: missionsReducer,
      surveillance: surveillanceReducer,
      storylets: storyletReducer,
      suspicion: suspicionReducer,
      paranoia: paranoiaReducer,
      reputation: reputationReducer,
      hudLayout: hudLayoutReducer,
    },
  });

const getSnapshot = (state: RootState) => selectAmbientWorldSnapshot(state);

const roundImpacts = (impact: ReturnType<typeof selectEnvironmentSystemImpacts>) => ({
  behavior: {
    ...impact.behavior,
    sightMultiplier: Number(impact.behavior.sightMultiplier.toFixed(3)),
    chaseMultiplier: Number(impact.behavior.chaseMultiplier.toFixed(3)),
    routineIntervalMultiplier: Number(impact.behavior.routineIntervalMultiplier.toFixed(3)),
  },
  faction: {
    ...impact.faction,
    shopMarkupDelta: Number(impact.faction.shopMarkupDelta.toFixed(3)),
    reinforcementDelayMultiplier: Number(impact.faction.reinforcementDelayMultiplier.toFixed(3)),
  },
  travel: {
    ...impact.travel,
    encounterRiskModifier: Number(impact.travel.encounterRiskModifier.toFixed(3)),
    vehicleWearMultiplier: Number(impact.travel.vehicleWearMultiplier.toFixed(3)),
    visibilityMultiplier: Number(impact.travel.visibilityMultiplier.toFixed(3)),
  },
});

describe('selectAmbientWorldSnapshot', () => {
  it('returns weather metadata enriched with preset description and time of day', () => {
    const store = createTestStore();

    store.dispatch(setEnvironmentFlags({ curfewLevel: 2 }));
    store.dispatch(setGameTime(275));

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

describe('selectEnvironmentSystemImpacts', () => {
  it('summarises industrial corridor lockdown conditions', () => {
    const store = createTestStore();

    store.dispatch(setCurrentMapAreaZoneMetadata({ zoneId: 'industrial_corridor' }));
    store.dispatch(
      setEnvironmentFlags({
        curfewLevel: 3,
        gangHeat: 'high',
        blackoutTier: 'rolling',
      })
    );

    const impacts = selectEnvironmentSystemImpacts(store.getState());
    expect(roundImpacts(impacts)).toMatchInlineSnapshot(`
      {
        "behavior": {
          "chaseMultiplier": 1.404,
          "loadoutBias": "sensor",
          "routineIntervalMultiplier": 1.863,
          "sightMultiplier": 0.608,
        },
        "faction": {
          "reinforcementDelayMultiplier": 0.439,
          "safehouseAccess": "sealed",
          "shopMarkupDelta": 0.4,
        },
        "travel": {
          "advisoryLevel": "severe",
          "encounterRiskModifier": 3,
          "staminaDrainPerMinute": 5,
          "vehicleWearMultiplier": 1.518,
          "visibilityMultiplier": 0.385,
        },
      }
    `);
  });

  it('reflects downtown brownout tension', () => {
    const store = createTestStore();

    store.dispatch(setCurrentMapAreaZoneMetadata({ zoneId: 'downtown_checkpoint' }));
    store.dispatch(
      setEnvironmentFlags({
        curfewLevel: 1,
        gangHeat: 'med',
        blackoutTier: 'brownout',
      })
    );

    const impacts = selectEnvironmentSystemImpacts(store.getState());
    expect(roundImpacts(impacts)).toMatchInlineSnapshot(`
      {
        "behavior": {
          "chaseMultiplier": 1.43,
          "loadoutBias": "sensor",
          "routineIntervalMultiplier": 1.208,
          "sightMultiplier": 1.045,
        },
        "faction": {
          "reinforcementDelayMultiplier": 0.701,
          "safehouseAccess": "restricted",
          "shopMarkupDelta": 0.21,
        },
        "travel": {
          "advisoryLevel": "severe",
          "encounterRiskModifier": 1.75,
          "staminaDrainPerMinute": 0,
          "vehicleWearMultiplier": 1,
          "visibilityMultiplier": 0.8,
        },
      }
    `);
  });

  it('embeds impacts within ambient snapshot', () => {
    const store = createTestStore();
    store.dispatch(setEnvironmentFlags({ curfewLevel: 2, blackoutTier: 'brownout' }));
    const state = store.getState();
    const snapshot = selectAmbientWorldSnapshot(state);
    const impacts = selectEnvironmentSystemImpacts(state);

    expect(snapshot.impacts).toEqual(impacts);
  });
});
