jest.mock('phaser', () => ({
  __esModule: true,
  default: {
    Math: {
      Clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
    },
  },
}));

import { HUD_SAFE_AREA_CHANGE_EVENT } from '../../../../events';
import { CameraModule, resolveResponsiveInitialZoomFloor } from '../CameraModule';
import type { CameraModulePorts, CameraRuntimeState } from '../../contracts/ModulePorts';

const createCamera = () => {
  const bounds = { x: -1000, y: -1000, width: 4000, height: 4000 };
  return {
    width: 800,
    height: 600,
    zoom: 1,
    scrollX: 0,
    scrollY: 0,
    startFollow: jest.fn(),
    stopFollow: jest.fn(),
    setDeadzone: jest.fn(),
    setFollowOffset: jest.fn(),
    setZoom: jest.fn(function setZoom(this: { zoom: number }, zoom: number) {
      this.zoom = zoom;
      return this;
    }),
    setBounds: jest.fn(function setBounds(
      this: unknown,
      x: number,
      y: number,
      width: number,
      height: number
    ) {
      Object.assign(bounds, { x, y, width, height });
      return this;
    }),
    centerOn: jest.fn(function centerOn(this: { scrollX: number; scrollY: number }, x: number, y: number) {
      this.scrollX = x - 400;
      this.scrollY = y - 300;
    }),
    getBounds: jest.fn(() => bounds),
  };
};

const createPorts = (
  overrides: Partial<CameraModulePorts> = {},
  runtimeOverrides: Partial<CameraRuntimeState> = {}
): CameraModulePorts & { writtenStates: CameraRuntimeState[] } => {
  const camera = createCamera();
  const writtenStates: CameraRuntimeState[] = [];
  const ports = {
    cameras: { main: camera } as never,
    scale: { width: 800, height: 600 } as never,
    sys: { isActive: () => true } as never,
    tweens: { add: jest.fn() } as never,
    getCurrentMapArea: () => ({ width: 20, height: 20, tiles: [] } as never),
    getPlayerInitialPosition: () => ({ x: 4, y: 5 }),
    getPlayerTokenContainer: () => ({ x: 640, y: 480 } as never),
    getTileSize: () => 64,
    setIsoOrigin: jest.fn(),
    ensureIsoFactory: jest.fn(),
    ensureVisualPipeline: jest.fn(),
    getIsoMetrics: () => ({ tileWidth: 64, tileHeight: 32, halfTileWidth: 32, halfTileHeight: 16 }),
    calculatePixelPosition: (gridX: number, gridY: number) => ({ x: gridX * 64, y: gridY * 32 }),
    computeIsoBounds: () => ({ minX: 0, maxX: 1280, minY: 0, maxY: 960 }),
    renderStaticProps: jest.fn(),
    drawBackdrop: jest.fn(),
    drawMap: jest.fn(),
    drawBuildingMasses: jest.fn(),
    drawBuildingLabels: jest.fn(),
    clearPathPreview: jest.fn(),
    resizeDayNightOverlay: jest.fn(),
    applyOverlayZoom: jest.fn(),
    emitViewportUpdate: jest.fn(),
    dispatchPlayerScreenPosition: jest.fn(),
    isInCombat: () => false,
    readRuntimeState: () => runtimeOverrides,
    writeRuntimeState: (state: CameraRuntimeState) => {
      writtenStates.push({ ...state });
    },
    writtenStates,
    ...overrides,
  };

  return ports as CameraModulePorts & { writtenStates: CameraRuntimeState[] };
};

describe('CameraModule', () => {
  it('caps the opening floor responsively without changing the configured desktop target', () => {
    expect(
      resolveResponsiveInitialZoomFloor({
        viewportWidth: 1920,
        viewportHeight: 1080,
        hudInsetPx: 244,
        configuredFloor: 1.1,
      })
    ).toBeCloseTo(1.1, 6);
    expect(
      resolveResponsiveInitialZoomFloor({
        viewportWidth: 804,
        viewportHeight: 1195,
        hudInsetPx: 440,
        configuredFloor: 1.1,
      })
    ).toBeCloseTo(1.05, 6);
    expect(
      resolveResponsiveInitialZoomFloor({
        viewportWidth: 1280,
        viewportHeight: 1195,
        hudInsetPx: 440,
        configuredFloor: 1.1,
      })
    ).toBeCloseTo(1.05, 6);
    expect(
      resolveResponsiveInitialZoomFloor({
        viewportWidth: 1360,
        viewportHeight: 1195,
        hudInsetPx: 304,
        configuredFloor: 1.1,
      })
    ).toBeCloseTo(1.1, 6);
  });

  it('rebinds player follow and emits viewport updates when follow is already marked active', () => {
    const ports = createPorts({}, { isCameraFollowingPlayer: true, hasInitialZoomApplied: true });
    const module = new CameraModule({} as never, ports);

    module.enablePlayerCameraFollow();

    expect(ports.cameras.main.startFollow).toHaveBeenCalledWith(
      ports.getPlayerTokenContainer(),
      false,
      1,
      1
    );
    expect(ports.cameras.main.centerOn).toHaveBeenCalledWith(640, 480);
    expect(ports.emitViewportUpdate).toHaveBeenCalled();
    expect(ports.writtenStates[ports.writtenStates.length - 1]?.isCameraFollowingPlayer).toBe(true);
  });

  it('keeps recentring for a few startup frames after enabling follow', () => {
    const ports = createPorts();
    const module = new CameraModule({} as never, ports);

    module.enablePlayerCameraFollow();
    const immediateViewportUpdates = (ports.emitViewportUpdate as jest.Mock).mock.calls.length;

    module.onUpdate();
    module.onUpdate();

    expect(ports.cameras.main.centerOn).toHaveBeenCalledTimes(3);
    expect((ports.emitViewportUpdate as jest.Mock).mock.calls.length).toBe(immediateViewportUpdates + 2);
  });

  it('stops stale follow state on map or same-scene new-game resets', () => {
    const ports = createPorts({}, { isCameraFollowingPlayer: true, hasInitialZoomApplied: true });
    const module = new CameraModule({} as never, ports);

    module.resetForMapTransition();

    expect(ports.cameras.main.stopFollow).toHaveBeenCalled();
    const finalState = ports.writtenStates[ports.writtenStates.length - 1];
    expect(finalState?.isCameraFollowingPlayer).toBe(false);
    expect(finalState?.hasInitialZoomApplied).toBe(false);
  });

  it('uses one padded envelope for surround bounds and zoom coverage', () => {
    const ports = createPorts({
      getCurrentMapArea: () => ({
        level: 0,
        zoneId: 'downtown_checkpoint',
        isInterior: false,
        width: 96,
        height: 72,
        tiles: [],
      } as never),
      computeIsoBounds: () => ({ minX: -2272, maxX: 3040, minY: 0, maxY: 2656 }),
    });
    const module = new CameraModule({} as never, ports);

    module.setupCameraAndMap();

    expect(ports.cameras.main.setBounds).toHaveBeenLastCalledWith(
      -3040,
      -768,
      6848,
      4192
    );
    const bounds = ports.cameras.main.getBounds();
    expect(bounds.width * ports.cameras.main.zoom).toBeGreaterThanOrEqual(ports.cameras.main.width);
    expect(bounds.height * ports.cameras.main.zoom).toBeGreaterThanOrEqual(ports.cameras.main.height);
  });

  it('raises a manual zoom to the recomputed coverage floor after a wide resize', () => {
    const staleTween = { remove: jest.fn() };
    const ports = createPorts({
      getCurrentMapArea: () => ({
        level: 0,
        zoneId: 'downtown_checkpoint',
        isInterior: false,
        width: 96,
        height: 72,
        tiles: [],
      } as never),
      computeIsoBounds: () => ({ minX: -2272, maxX: 3040, minY: 0, maxY: 2656 }),
    }, {
      hasInitialZoomApplied: true,
      userAdjustedZoom: true,
      cameraZoomTween: staleTween as never,
    });
    ports.cameras.main.zoom = 0.38;
    Object.assign(ports.cameras.main, { width: 3840 });
    Object.assign(ports.scale, { width: 3840 });
    const module = new CameraModule({} as never, ports);

    module.onResize();

    const expectedCoverageFloor = 3840 / 6848;
    expect(staleTween.remove).toHaveBeenCalledTimes(1);
    expect(ports.cameras.main.zoom).toBeCloseTo(expectedCoverageFloor, 6);
    expect(ports.cameras.main.zoom).toBeGreaterThanOrEqual(expectedCoverageFloor);
    expect(ports.writtenStates[ports.writtenStates.length - 1]?.userAdjustedZoom).toBe(true);
  });

  it('resumes a post-combat restore tween after resize without losing its manual intent', () => {
    const staleTween = { remove: jest.fn() };
    const resumedTween = { remove: jest.fn() };
    let resumedConfig: { zoom: number; onComplete: () => void } | undefined;
    const tweenAdd = jest.fn((config: { zoom: number; onComplete: () => void }) => {
      resumedConfig = config;
      return resumedTween;
    });
    const ports = createPorts({
      tweens: { add: tweenAdd } as never,
    }, {
      hasInitialZoomApplied: true,
      userAdjustedZoom: true,
      pendingCameraRestore: true,
      preCombatZoom: 0.72,
      preCombatUserAdjusted: true,
      pendingRestoreUserAdjusted: true,
      baselineCameraZoom: 1.1,
      cameraZoomTween: staleTween as never,
    });
    ports.cameras.main.zoom = 0.9;
    const module = new CameraModule({} as never, ports);

    module.onResize();

    expect(staleTween.remove).toHaveBeenCalledTimes(1);
    expect(tweenAdd).toHaveBeenCalledTimes(1);
    expect(resumedConfig?.zoom).toBeCloseTo(0.72, 6);
    let finalState = ports.writtenStates[ports.writtenStates.length - 1];
    expect(finalState?.pendingCameraRestore).toBe(true);
    expect(finalState?.preCombatZoom).toBeCloseTo(0.72, 6);
    expect(finalState?.pendingRestoreUserAdjusted).toBe(true);

    ports.cameras.main.zoom = 0.72;
    resumedConfig?.onComplete();

    finalState = ports.writtenStates[ports.writtenStates.length - 1];
    expect(finalState?.pendingCameraRestore).toBe(false);
    expect(finalState?.preCombatZoom).toBeNull();
    expect(finalState?.userAdjustedZoom).toBe(true);
  });

  it('refreshes follow offset and minimap viewport when the HUD safe area changes', () => {
    const ports = createPorts();
    const module = new CameraModule({} as never, ports);
    let safeAreaListener: EventListenerOrEventListenerObject | undefined;
    module.init({
      listenInput: jest.fn(),
      listenWindow: (event: string, listener: EventListenerOrEventListenerObject) => {
        if (event === HUD_SAFE_AREA_CHANGE_EVENT) {
          safeAreaListener = listener;
        }
      },
    } as never);
    module.onCreate();
    module.enablePlayerCameraFollow();
    (ports.cameras.main.setFollowOffset as jest.Mock).mockClear();
    (ports.emitViewportUpdate as jest.Mock).mockClear();

    if (safeAreaListener && 'handleEvent' in safeAreaListener) {
      safeAreaListener.handleEvent(new Event(HUD_SAFE_AREA_CHANGE_EVENT));
    } else {
      (safeAreaListener as EventListener | undefined)?.(new Event(HUD_SAFE_AREA_CHANGE_EVENT));
    }

    expect(ports.cameras.main.setFollowOffset).toHaveBeenCalled();
    expect(ports.emitViewportUpdate).toHaveBeenCalled();
  });
});
