import { RootState } from '../../../../store';
import { SceneContext } from '../SceneContext';
import { SceneModule } from '../SceneModule';
import { SceneModuleRegistry } from '../SceneModuleRegistry';

const createMockState = (): RootState => {
  return {} as RootState;
};

const createTracingModule = (
  key: string,
  calls: string[],
  dependsOn?: readonly string[]
): SceneModule => ({
  key,
  dependsOn,
  init: () => {
    calls.push(`${key}:init`);
  },
  onCreate: () => {
    calls.push(`${key}:create`);
  },
  onStateChange: () => {
    calls.push(`${key}:state`);
  },
  onResize: () => {
    calls.push(`${key}:resize`);
  },
  onUpdate: () => {
    calls.push(`${key}:update`);
  },
  onShutdown: () => {
    calls.push(`${key}:shutdown`);
  },
});

describe('SceneModuleRegistry', () => {
  it('runs lifecycle hooks in dependency order and shutdown in reverse order', () => {
    const calls: string[] = [];
    const context = {} as SceneContext;
    const registry = new SceneModuleRegistry(context);

    registry.register(createTracingModule('feature', calls, ['ui']));
    registry.register(createTracingModule('core', calls));
    registry.register(createTracingModule('ui', calls, ['core']));

    registry.onCreate();
    registry.onStateChange(createMockState(), createMockState());
    registry.onResize();
    registry.onUpdate(16, 16);
    registry.onShutdown();

    expect(calls).toEqual([
      'feature:init',
      'core:init',
      'ui:init',
      'core:create',
      'ui:create',
      'feature:create',
      'core:state',
      'ui:state',
      'feature:state',
      'core:resize',
      'ui:resize',
      'feature:resize',
      'core:update',
      'ui:update',
      'feature:update',
      'feature:shutdown',
      'ui:shutdown',
      'core:shutdown',
    ]);
  });

  it('clears modules after shutdown so teardown remains idempotent', () => {
    const calls: string[] = [];
    const context = {} as SceneContext;
    const registry = new SceneModuleRegistry(context);

    registry.register(createTracingModule('only', calls));
    registry.onShutdown();
    registry.onShutdown();

    expect(calls).toEqual(['only:init', 'only:shutdown']);
  });

  it('fails fast when registering duplicate module keys', () => {
    const context = {} as SceneContext;
    const registry = new SceneModuleRegistry(context);
    registry.register(createTracingModule('dup', []));

    expect(() => {
      registry.register(createTracingModule('dup', []));
    }).toThrow('Duplicate module key');
  });

  it('fails fast when module dependency is missing', () => {
    const context = {} as SceneContext;
    const registry = new SceneModuleRegistry(context);
    registry.register(createTracingModule('dependent', [], ['missing']));

    expect(() => {
      registry.onCreate();
    }).toThrow('depends on missing module');
  });

  it('fails fast on dependency cycles', () => {
    const context = {} as SceneContext;
    const registry = new SceneModuleRegistry(context);
    registry.register(createTracingModule('a', [], ['c']));
    registry.register(createTracingModule('b', [], ['a']));
    registry.register(createTracingModule('c', [], ['b']));

    expect(() => {
      registry.onCreate();
    }).toThrow('Dependency cycle detected');
  });
});
