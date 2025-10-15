import { GangHeatLevel } from '../../game/interfaces/environment';
import { WeatherPresetDefinition } from './types';

const weatherPresets: WeatherPresetDefinition[] = [
  {
    id: 'weather.curfew.0',
    flag: 'curfewLevel',
    value: 0,
    rainIntensity: 0,
    thunderActive: false,
    sirenLoop: false,
    storyFunction: 'world-building',
    description: 'Dry air wobble when curfew is dormant.',
  },
  {
    id: 'weather.curfew.1',
    flag: 'curfewLevel',
    value: 1,
    rainIntensity: 0.2,
    thunderActive: false,
    sirenLoop: false,
    storyFunction: 'foreshadow',
    description: 'Light drizzle telegraphs rising tension.',
  },
  {
    id: 'weather.curfew.2',
    flag: 'curfewLevel',
    value: 2,
    rainIntensity: 0.6,
    thunderActive: false,
    sirenLoop: true,
    storyFunction: 'payoff',
    description: 'Rain and sirens when curfew crosses enforcement threshold.',
  },
  {
    id: 'weather.curfew.3',
    flag: 'curfewLevel',
    value: 3,
    rainIntensity: 0.85,
    thunderActive: true,
    sirenLoop: true,
    storyFunction: 'world-building',
    description: 'Thunderclaps sync with decision beats at max curfew.',
  },
  {
    id: 'weather.gangHeat.high',
    flag: 'gangHeat',
    value: 'high',
    rainIntensity: 0.75,
    thunderActive: true,
    sirenLoop: true,
    storyFunction: 'misdirect',
    description: 'Extra thunder during high gang heat for dramatic cues.',
  },
];

export const getWeatherPresetForCurfewLevel = (
  level: number
): WeatherPresetDefinition | undefined =>
  weatherPresets.find(
    (preset) => preset.flag === 'curfewLevel' && typeof preset.value === 'number' && preset.value === level
  );

export const getWeatherPresetForGangHeat = (
  level: GangHeatLevel
): WeatherPresetDefinition | undefined =>
  weatherPresets.find(
    (preset) => preset.flag === 'gangHeat' && preset.value === level
  );

export const findWeatherPresetById = (id: string): WeatherPresetDefinition | undefined =>
  weatherPresets.find((preset) => preset.id === id);
