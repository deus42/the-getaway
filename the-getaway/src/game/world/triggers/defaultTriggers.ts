import { v4 as uuidv4 } from 'uuid';
import {
  getRumorRotationsForGangHeat,
  getNoteDefinitionsForFlag,
  getSignageVariantsForFlag,
  getWeatherPresetForCurfewLevel,
  getWeatherPresetForGangHeat,
  RumorRotationDefinition,
  SignageVariantDefinition,
  EnvironmentalNoteDefinition,
  WeatherPresetDefinition,
} from '../../../content/environment';
import {
  registerEnvironmentalTriggers,
  clearEnvironmentalTriggers,
  EnvironmentalTrigger,
} from './triggerRegistry';
import {
  applyEnvironmentRumorSet,
  setNpcAmbientProfile,
  applyEnvironmentWeather,
  applyEnvironmentSignage,
  registerEnvironmentalNote,
  addItemToMap,
} from '../../../store/worldSlice';
import { addLogMessage } from '../../../store/logSlice';
import { getSystemStrings } from '../../../content/system';
import { Item } from '../../interfaces/types';
import { GangHeatLevel } from '../../interfaces/environment';
import { RootState } from '../../../store';

type NpcMatcher = { dialogueId?: string; name?: string };

const NPC_GROUPS: Record<string, NpcMatcher[]> = {
  'slum-barflies': [
    { dialogueId: 'npc_lira_vendor' },
    { dialogueId: 'npc_courier_brant' },
  ],
  'dock-liquor-patrons': [
    { dialogueId: 'npc_captain_reyna' },
    { dialogueId: 'npc_drone_handler_kesh' },
  ],
};

const createRumorTriggers = (): EnvironmentalTrigger[] => {
  const levels: GangHeatLevel[] = ['low', 'med', 'high'];

  return levels.flatMap<EnvironmentalTrigger>((level) => {
    const rotations = getRumorRotationsForGangHeat(level);

    return rotations.map<EnvironmentalTrigger>((rotation) => ({
      id: `environment.rumor.${rotation.id}`,
      cooldownMs: 1_000,
      when: (state) => {
        const { flags, rumorSets } = state.world.environment;
        if (flags.gangHeat !== level) {
          return false;
        }

        if (!(rotation.groupId in NPC_GROUPS)) {
          return false;
        }

        const current = rumorSets[rotation.groupId];
        return !current || current.sourceId !== rotation.id;
      },
      fire: ({ dispatch, getState, now }) => {
        const state = getState();
        const locale = state.settings.locale;
        const logStrings = getSystemStrings(locale).logs;
        const groupTargets = NPC_GROUPS[rotation.groupId];

        dispatch(
          applyEnvironmentRumorSet({
            groupId: rotation.groupId,
            snapshot: {
              lines: [...rotation.lines],
              storyFunction: rotation.storyFunction,
              sourceId: rotation.id,
              updatedAt: now,
            },
          })
        );

        groupTargets.forEach((matcher) => {
          dispatch(
            setNpcAmbientProfile({
              match: matcher,
              profile: {
                lines: [...rotation.lines],
                storyFunction: rotation.storyFunction,
                sourceId: rotation.id,
                updatedAt: now,
              },
            })
          );
        });

        dispatch(addLogMessage(logStrings.environmentRumorSwap(rotation.description)));
      },
    }));
  });
};

const createWeatherTriggers = (): EnvironmentalTrigger[] => {
  const curfewLevels = [0, 1, 2, 3];

  const curfewTriggers = curfewLevels
    .map<WeatherPresetDefinition | undefined>((level) => getWeatherPresetForCurfewLevel(level))
    .filter((preset): preset is WeatherPresetDefinition => Boolean(preset))
    .map<EnvironmentalTrigger>((preset) => ({
      id: `environment.weather.curfew.${preset.id}`,
      cooldownMs: 2_000,
      when: (state) => {
        if (state.world.environment.flags.curfewLevel !== preset.value) {
          return false;
        }

        return state.world.environment.weather.presetId !== preset.id;
      },
      fire: ({ dispatch, getState, now }) => {
        const presetForOverride = getWeatherPresetForCurfewLevel(
          getState().world.environment.flags.curfewLevel
        );

        if (!presetForOverride) {
          return;
        }

        const locale = getState().settings.locale;
        const logStrings = getSystemStrings(locale).logs;

        dispatch(
          applyEnvironmentWeather({
            presetId: presetForOverride.id,
            rainIntensity: presetForOverride.rainIntensity,
            sirenLoop: presetForOverride.sirenLoop,
            thunderActive: presetForOverride.thunderActive,
            storyFunction: presetForOverride.storyFunction,
            updatedAt: now,
          })
        );

        dispatch(addLogMessage(logStrings.environmentWeatherShift(presetForOverride.description)));
      },
    }));

  const gangHeatOverrides: EnvironmentalTrigger[] = ['med', 'high']
    .map<GangHeatLevel>((level) => level)
    .map((level) => getWeatherPresetForGangHeat(level))
    .filter((preset): preset is WeatherPresetDefinition => Boolean(preset))
    .map<EnvironmentalTrigger>((preset) => ({
      id: `environment.weather.gangHeat.${preset.id}`,
      cooldownMs: 2_000,
      when: (state) => {
        if (state.world.environment.flags.gangHeat !== preset.value) {
          return false;
        }

        if (state.world.environment.flags.curfewLevel >= 3) {
          // Highest curfew already covers thunder cues.
          return false;
        }

        return state.world.environment.weather.presetId !== preset.id;
      },
      fire: ({ dispatch, getState, now }) => {
        const locale = getState().settings.locale;
        const logStrings = getSystemStrings(locale).logs;

        dispatch(
          applyEnvironmentWeather({
            presetId: preset.id,
            rainIntensity: preset.rainIntensity,
            sirenLoop: preset.sirenLoop,
            thunderActive: preset.thunderActive,
            storyFunction: preset.storyFunction,
            updatedAt: now,
          })
        );

        dispatch(addLogMessage(logStrings.environmentWeatherShift(preset.description)));
      },
    }));

  return [...curfewTriggers, ...gangHeatOverrides];
};

const createSignageTriggers = (): EnvironmentalTrigger[] => {
  const flags: Array<SignageVariantDefinition['flag']> = ['blackoutTier', 'supplyScarcity'];

  return flags
    .flatMap((flag) => {
      const values = flag === 'blackoutTier' ? ['none', 'brownout', 'rolling'] : ['norm', 'tight', 'rationed'];

      return values.flatMap<EnvironmentalTrigger>((value) => {
        const variants = getSignageVariantsForFlag(
          flag,
          flag === 'blackoutTier' ? (value as SignageVariantDefinition['value']) : (value as SignageVariantDefinition['value'])
        );

        return variants.map((variant) => ({
          id: `environment.signage.${variant.id}`,
          cooldownMs: 4_000,
          when: (state) => {
            const currentValue =
              flag === 'blackoutTier'
                ? state.world.environment.flags.blackoutTier
                : state.world.environment.flags.supplyScarcity;

            if (currentValue !== value) {
              return false;
            }

            const currentVariant = state.world.environment.signage[variant.signId];
            return !currentVariant || currentVariant.variantId !== variant.id;
          },
          fire: ({ dispatch, getState, now }) => {
            const locale = getState().settings.locale;
            const logStrings = getSystemStrings(locale).logs;

            dispatch(
              applyEnvironmentSignage({
                signId: variant.signId,
                snapshot: {
                  variantId: variant.id,
                  storyFunction: variant.storyFunction,
                  updatedAt: now,
                },
              })
            );

            dispatch(addLogMessage(logStrings.environmentSignageSwap(variant.text)));
          },
        }));
      });
    });
};

const findNotePosition = (state: RootState, definition: EnvironmentalNoteDefinition) => {
  if (definition.position) {
    return definition.position;
  }

  const playerPosition = state.player.data.position;

  return {
    x: Math.max(0, playerPosition.x),
    y: Math.max(0, playerPosition.y - 1),
  };
};

const createNoteTriggers = (): EnvironmentalTrigger[] => {
  const noteFlags: Array<EnvironmentalNoteDefinition['flag']> = ['supplyScarcity', 'curfewLevel', 'gangHeat'];

  return noteFlags.flatMap<EnvironmentalTrigger>((flag) => {
    const candidateValues =
      flag === 'supplyScarcity'
        ? ['norm', 'tight', 'rationed']
        : flag === 'gangHeat'
        ? ['low', 'med', 'high']
        : [0, 1, 2, 3];

    return candidateValues.flatMap<EnvironmentalTrigger>((value) => {
      const definitions = getNoteDefinitionsForFlag(flag, value);

      return definitions.map<EnvironmentalTrigger>((definition) => ({
        id: `environment.notes.${definition.id}`,
        cooldownMs: 5_000,
        when: (state) => {
          const flags = state.world.environment.flags;
          const matchesFlag =
            flag === 'supplyScarcity'
              ? flags.supplyScarcity === value
              : flag === 'gangHeat'
              ? flags.gangHeat === value
              : flags.curfewLevel === value;

          if (!matchesFlag) {
            return false;
          }

          return !state.world.environment.notes.some(
            (instance) => instance.definitionId === definition.id
          );
        },
        fire: ({ dispatch, getState, now }) => {
          const state = getState();

          const position = findNotePosition(state, definition);
          const areaId = state.world.currentMapArea.id;
          const locale = state.settings.locale;
          const logStrings = getSystemStrings(locale).logs;

          dispatch(
            registerEnvironmentalNote({
              instanceId: `env-note::${definition.id}`,
              definitionId: definition.id,
              areaId,
              lines: [...definition.lines],
              storyFunction: definition.storyFunction,
              spawnedAt: now,
            })
          );

          const noteItem: Item = {
            id: `env-note-item::${definition.id}::${uuidv4()}`,
            name: 'Found Note',
            description: definition.lines.join(' / '),
            weight: 0,
            value: 0,
            isQuestItem: false,
            stackable: false,
          };

          dispatch(
            addItemToMap({
              item: noteItem,
              position,
            })
          );

          dispatch(
            addLogMessage(
              logStrings.environmentNoteSpawned(definition.description ?? 'new memo recovered')
            )
          );
        },
      }));
    });
  });
};

let triggersRegistered = false;

export const resetEnvironmentalTriggersForTest = (): void => {
  triggersRegistered = false;
  clearEnvironmentalTriggers();
};

export const ensureDefaultEnvironmentalTriggersRegistered = (): void => {
  if (triggersRegistered) {
    return;
  }

  const triggers: EnvironmentalTrigger[] = [
    ...createRumorTriggers(),
    ...createWeatherTriggers(),
    ...createSignageTriggers(),
    ...createNoteTriggers(),
  ];

  registerEnvironmentalTriggers(triggers);
  triggersRegistered = true;
};
