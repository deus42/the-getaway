import { LevelDefinition, LevelResourceKey } from '../../game/narrative/structureTypes';
import { level0Definition } from './level0/levelDefinition';
import { level1Definition } from './level1/levelDefinition';
import { level2Definition } from './level2/levelDefinition';

const definitions = [level0Definition, level1Definition, level2Definition];

definitions.sort((a, b) => a.order - b.order);

export const LEVEL_DEFINITIONS: LevelDefinition[] = definitions;

export const LEVEL_DEFINITION_BY_KEY: Record<LevelResourceKey, LevelDefinition> =
  definitions.reduce<Record<LevelResourceKey, LevelDefinition>>((acc, definition) => {
    acc[definition.resourceKey] = definition;
    return acc;
  }, {} as Record<LevelResourceKey, LevelDefinition>);
