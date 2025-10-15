import type { GeneratedSceneDefinition } from '../../game/narrative/tripleTypes';
import rawSceneLevel0RecoverCacheAmbush from '../levels/level0/missions/level0-recover-cache/generatedScenes/scene-level0-recover-cache-ambush-route.json';

const sceneLevel0RecoverCacheAmbush =
  rawSceneLevel0RecoverCacheAmbush as GeneratedSceneDefinition;

const SCENE_DEFINITIONS: Record<string, GeneratedSceneDefinition> = {
  [sceneLevel0RecoverCacheAmbush.resourceKey]: sceneLevel0RecoverCacheAmbush,
};

export const GENERATED_SCENE_DEFINITIONS = SCENE_DEFINITIONS;

export const getGeneratedSceneByKey = (
  resourceKey: string
): GeneratedSceneDefinition | undefined => SCENE_DEFINITIONS[resourceKey];
