import { RootState, store } from '../../../../store';
import { updateGameTime as updateGameTimeAction } from '../../../../store/worldSlice';
import { applySuspicionDecay } from '../../../../store/suspicionSlice';
import type { MainScene } from '../../MainScene';
import type { ClockModulePorts, ClockRuntimeState } from '../contracts/ModulePorts';
import { SceneContext } from '../SceneContext';
import { SceneModule } from '../SceneModule';

const DEFAULT_DISPATCH_CADENCE_SECONDS = 0.5;
const DEFAULT_ATMOSPHERE_BUCKET_SECONDS = 5;

const readValue = <T>(target: object, key: string): T | undefined => {
  return Reflect.get(target, key) as T | undefined;
};

const readNumber = (target: object, key: string, fallback: number): number => {
  const value = readValue<unknown>(target, key);
  return typeof value === 'number' ? value : fallback;
};

const callSceneMethod = <TReturn>(target: object, key: string, ...args: unknown[]): TReturn => {
  const value = readValue<unknown>(target, key);
  if (typeof value !== 'function') {
    throw new Error(`[ClockModule] Missing required scene method: ${key}`);
  }

  return (value as (...methodArgs: unknown[]) => TReturn).apply(target, args);
};

const createClockModulePorts = (scene: MainScene): ClockModulePorts => {
  return {
    getCurrentGameTime: () => readNumber(scene, 'currentGameTime', store.getState().world.currentTime),
    getAtmosphereRedrawBucket: () => readNumber(scene, 'lastAtmosphereRedrawBucket', -1),
    setAtmosphereRedrawBucket: (bucket: number) => {
      Reflect.set(scene, 'lastAtmosphereRedrawBucket', bucket);
    },
    signalAtmosphereRedraw: () => {
      const currentMapArea = readValue<{ tiles: unknown[][] } | null>(scene, 'currentMapArea');
      if (!currentMapArea) {
        return;
      }
      callSceneMethod(scene, 'drawBackdrop');
      callSceneMethod(scene, 'drawMap', currentMapArea.tiles);
    },
    signalOverlayUpdate: () => {
      callSceneMethod(scene, 'updateDayNightOverlay');
    },
    signalOcclusionUpdate: () => {
      callSceneMethod(scene, 'applyOcclusionReadability');
    },
    dispatchGameTime: (elapsedSeconds: number) => {
      store.dispatch(updateGameTimeAction(elapsedSeconds));
    },
    shouldApplySuspicionDecay: () => Boolean(store.getState().settings.reputationSystemsEnabled),
    dispatchSuspicionDecay: (elapsedSeconds: number, timestamp: number) => {
      store.dispatch(
        applySuspicionDecay({
          elapsedSeconds,
          timestamp,
        })
      );
    },
    readRuntimeState: () => ({
      currentGameTime: readNumber(scene, 'currentGameTime', store.getState().world.currentTime),
      timeDispatchAccumulator: readNumber(scene, 'timeDispatchAccumulator', 0),
      lastAtmosphereRedrawBucket: readNumber(scene, 'lastAtmosphereRedrawBucket', -1),
      dispatchCadenceSeconds: DEFAULT_DISPATCH_CADENCE_SECONDS,
      atmosphereBucketSeconds: DEFAULT_ATMOSPHERE_BUCKET_SECONDS,
    }),
    writeRuntimeState: (state) => {
      Reflect.set(scene, 'currentGameTime', state.currentGameTime);
      Reflect.set(scene, 'timeDispatchAccumulator', state.timeDispatchAccumulator);
      Reflect.set(scene, 'lastAtmosphereRedrawBucket', state.lastAtmosphereRedrawBucket);
    },
  };
};

const createDefaultRuntimeState = (currentGameTime: number): ClockRuntimeState => ({
  currentGameTime,
  timeDispatchAccumulator: 0,
  lastAtmosphereRedrawBucket: Math.floor(currentGameTime / DEFAULT_ATMOSPHERE_BUCKET_SECONDS),
  dispatchCadenceSeconds: DEFAULT_DISPATCH_CADENCE_SECONDS,
  atmosphereBucketSeconds: DEFAULT_ATMOSPHERE_BUCKET_SECONDS,
});

export class ClockModule implements SceneModule<MainScene> {
  readonly key = 'clock';

  readonly dependsOn = ['stateSync', 'worldRender', 'dayNightOverlay'] as const;

  private readonly ports: ClockModulePorts;

  private runtimeState: ClockRuntimeState;

  constructor(scene: MainScene, ports?: ClockModulePorts) {
    this.ports = ports ?? createClockModulePorts(scene);
    this.runtimeState = {
      ...createDefaultRuntimeState(this.ports.getCurrentGameTime()),
      ...this.ports.readRuntimeState?.(),
    };

    if (this.runtimeState.lastAtmosphereRedrawBucket < 0) {
      this.runtimeState.lastAtmosphereRedrawBucket = Math.floor(
        this.runtimeState.currentGameTime / this.runtimeState.atmosphereBucketSeconds
      );
    }

    this.ports.setAtmosphereRedrawBucket(this.runtimeState.lastAtmosphereRedrawBucket);
    this.pushRuntimeStateToPorts();
  }

  init(_context: SceneContext<MainScene>): void {
    void _context;
  }

  onStateChange(_previousState: RootState, nextState: RootState): void {
    const nextTime = nextState.world.currentTime;
    if (Math.abs(nextTime - this.runtimeState.currentGameTime) > 0.0001) {
      this.runtimeState.currentGameTime = nextTime;
      this.pushRuntimeStateToPorts();
    }
  }

  onUpdate(_time: number, delta: number): void {
    const deltaSeconds = delta / 1000;
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
      return;
    }

    this.runtimeState.currentGameTime += deltaSeconds;
    this.runtimeState.timeDispatchAccumulator += deltaSeconds;

    const atmosphereBucket = Math.floor(
      this.runtimeState.currentGameTime / this.runtimeState.atmosphereBucketSeconds
    );
    const trackedBucket = this.ports.getAtmosphereRedrawBucket();
    if (atmosphereBucket !== trackedBucket) {
      this.runtimeState.lastAtmosphereRedrawBucket = atmosphereBucket;
      this.ports.setAtmosphereRedrawBucket(atmosphereBucket);
      this.ports.signalAtmosphereRedraw();
    }

    this.ports.signalOverlayUpdate();
    this.ports.signalOcclusionUpdate();

    if (this.runtimeState.timeDispatchAccumulator >= this.runtimeState.dispatchCadenceSeconds) {
      const elapsedSeconds = this.runtimeState.timeDispatchAccumulator;
      this.ports.dispatchGameTime(elapsedSeconds);
      if (this.ports.shouldApplySuspicionDecay()) {
        this.ports.dispatchSuspicionDecay(elapsedSeconds, this.runtimeState.currentGameTime);
      }
      this.runtimeState.timeDispatchAccumulator = 0;
    }

    this.pushRuntimeStateToPorts();
  }

  getCurrentGameTime(): number {
    return this.runtimeState.currentGameTime;
  }

  private pushRuntimeStateToPorts(): void {
    this.ports.writeRuntimeState?.(this.runtimeState);
  }
}
