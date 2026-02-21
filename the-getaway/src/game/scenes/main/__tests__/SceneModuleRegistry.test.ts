import { RootState } from '../../../../store';
import { SceneContext } from '../SceneContext';
import { SceneModule } from '../SceneModule';
import { SceneModuleRegistry } from '../SceneModuleRegistry';

const createMockState = (): RootState => {
  return {} as RootState;
};

const createTracingModule = (
  key: string,
  calls: string[]
): SceneModule => ({
  key,
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
  it('runs lifecycle hooks in registration order and shutdown in reverse order', () => {
    const calls: string[] = [];
    const context = {} as SceneContext;
    const registry = new SceneModuleRegistry(context);

    registry.register(createTracingModule('a', calls));
    registry.register(createTracingModule('b', calls));
    registry.register(createTracingModule('c', calls));

    registry.onCreate();
    registry.onStateChange(createMockState(), createMockState());
    registry.onResize();
    registry.onUpdate(16, 16);
    registry.onShutdown();

    expect(calls).toEqual([
      'a:init',
      'b:init',
      'c:init',
      'a:create',
      'b:create',
      'c:create',
      'a:state',
      'b:state',
      'c:state',
      'a:resize',
      'b:resize',
      'c:resize',
      'a:update',
      'b:update',
      'c:update',
      'c:shutdown',
      'b:shutdown',
      'a:shutdown',
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
});
