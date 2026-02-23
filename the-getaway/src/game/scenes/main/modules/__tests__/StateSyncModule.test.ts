import { RootState } from '../../../../../store';
import { StateSyncModule } from '../StateSyncModule';
import type { StateSyncModulePorts } from '../../contracts/ModulePorts';

const createState = (overrides: Partial<RootState> = {}): RootState => {
  return {
    player: {
      data: {
        position: { x: 4, y: 5 },
        health: 80,
        maxHealth: 100,
      },
    },
    world: {
      inCombat: false,
      currentTime: 90,
      curfewActive: false,
      currentMapArea: {
        id: 'level0',
        entities: {
          enemies: [],
          npcs: [],
        },
        tiles: [],
      },
    },
    surveillance: {
      zones: {
        level0: {
          cameras: [],
        },
      },
      hud: {
        overlayEnabled: false,
      },
    },
    ...overrides,
  } as unknown as RootState;
};

const createPorts = (
  overrides: Partial<StateSyncModulePorts> = {}
): StateSyncModulePorts => {
  return {
    sys: { isActive: () => true } as never,
    getCurrentMapArea: () => ({ id: 'level0' } as never),
    setCurrentMapArea: jest.fn(),
    getItemMarkerSignature: jest.fn(() => 'same'),
    renderStaticProps: jest.fn(),
    updateDayNightOverlay: jest.fn(),
    updatePlayerPosition: jest.fn(),
    updatePlayerVitalsIndicator: jest.fn(),
    updateEnemies: jest.fn(),
    updateNpcs: jest.fn(),
    renderVisionCones: jest.fn(),
    updateSurveillanceCameras: jest.fn(),
    zoomCameraForCombat: jest.fn(),
    restoreCameraAfterCombat: jest.fn(),
    destroyPlayerVitalsIndicator: jest.fn(),
    destroyCameraSprites: jest.fn(),
    setupCameraAndMap: jest.fn(),
    clearPathPreview: jest.fn(),
    enablePlayerCameraFollow: jest.fn(),
    resetCameraRuntimeStateForMapTransition: jest.fn(),
    clearEntityRuntimeStateForMapTransition: jest.fn(),
    clearWorldRuntimeStateForMapTransition: jest.fn(),
    resetEntityCombatIndicators: jest.fn(),
    ...overrides,
  };
};

describe('StateSyncModule', () => {
  it('applies regular state updates through module ports', () => {
    const ports = createPorts();
    const module = new StateSyncModule({} as never, ports);
    const nextState = createState();

    module.onStateChange(createState(), nextState);

    expect(ports.updateDayNightOverlay).toHaveBeenCalled();
    expect(ports.updatePlayerPosition).toHaveBeenCalledWith({ x: 4, y: 5 });
    expect(ports.updatePlayerVitalsIndicator).toHaveBeenCalledWith(
      { x: 4, y: 5 },
      80,
      100
    );
    expect(ports.updateEnemies).toHaveBeenCalled();
    expect(ports.updateNpcs).toHaveBeenCalled();
    expect(ports.renderVisionCones).toHaveBeenCalled();
    expect(ports.updateSurveillanceCameras).toHaveBeenCalled();
  });

  it('runs map-transition resets when map id changes', () => {
    const oldMap = { id: 'old-map' } as never;
    const newMap = {
      id: 'new-map',
      entities: { enemies: [], npcs: [] },
      tiles: [],
    } as never;
    const getItemMarkerSignature = jest.fn((area: { id?: string } | null) =>
      area?.id === 'old-map' ? 'sig-old' : 'sig-new'
    );
    const ports = createPorts({
      getCurrentMapArea: () => oldMap,
      getItemMarkerSignature,
    });
    const module = new StateSyncModule({} as never, ports);
    const nextState = createState({
      world: {
        inCombat: false,
        currentTime: 95,
        curfewActive: false,
        currentMapArea: newMap,
      },
      surveillance: {
        zones: { 'new-map': { cameras: [] } },
        hud: { overlayEnabled: true },
      },
    } as unknown as Partial<RootState>);

    module.onStateChange(createState(), nextState);

    expect(ports.resetCameraRuntimeStateForMapTransition).toHaveBeenCalled();
    expect(ports.clearEntityRuntimeStateForMapTransition).toHaveBeenCalled();
    expect(ports.clearWorldRuntimeStateForMapTransition).toHaveBeenCalled();
    expect(ports.destroyCameraSprites).toHaveBeenCalled();
    expect(ports.setCurrentMapArea).toHaveBeenCalledWith(newMap);
    expect(ports.setupCameraAndMap).toHaveBeenCalled();
    expect(ports.clearPathPreview).toHaveBeenCalled();
    expect(ports.enablePlayerCameraFollow).toHaveBeenCalled();
    expect(ports.renderStaticProps).toHaveBeenCalled();
  });
});
