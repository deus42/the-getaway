jest.mock('phaser', () => ({
  __esModule: true,
  default: {
    Math: {
      Clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
    },
  },
}));

import { CameraModule } from '../CameraModule';
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
});
