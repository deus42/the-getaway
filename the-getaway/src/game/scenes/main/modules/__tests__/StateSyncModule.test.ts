import { RootState } from '../../../../../store';
import { MainScene } from '../../../MainScene';
import { StateSyncModule } from '../StateSyncModule';

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

describe('StateSyncModule', () => {
  it('applies regular state updates through scene delegates', () => {
    const updatePlayerPosition = jest.fn();
    const updatePlayerVitalsIndicator = jest.fn();
    const updateEnemies = jest.fn();
    const updateNpcs = jest.fn();
    const renderVisionCones = jest.fn();
    const updateSurveillanceCameras = jest.fn();
    const updateDayNightOverlay = jest.fn();

    const scene = {
      sys: { isActive: () => true },
      currentMapArea: { id: 'level0' },
      inCombat: false,
      currentGameTime: 0,
      curfewActive: false,
      currentAtmosphereProfile: undefined,
      lastAtmosphereRedrawBucket: 0,
      hasInitialZoomApplied: false,
      userAdjustedZoom: false,
      preCombatZoom: null,
      preCombatUserAdjusted: false,
      pendingRestoreUserAdjusted: null,
      enemySprites: new Map(),
      npcSprites: new Map(),
      lastItemMarkerSignature: 'same',
      zoomCameraForCombat: jest.fn(),
      restoreCameraAfterCombat: jest.fn(),
      destroyPlayerVitalsIndicator: jest.fn(),
      destroyCameraSprites: jest.fn(),
      setupCameraAndMap: jest.fn(),
      clearPathPreview: jest.fn(),
      enablePlayerCameraFollow: jest.fn(),
      updateDayNightOverlay,
      getItemMarkerSignature: jest.fn(() => 'same'),
      renderStaticProps: jest.fn(),
      updatePlayerPosition,
      updatePlayerVitalsIndicator,
      updateEnemies,
      updateNpcs,
      renderVisionCones,
      updateSurveillanceCameras,
    } as unknown as MainScene;

    const module = new StateSyncModule(scene);
    const nextState = createState();
    module.onStateChange(createState(), nextState);

    expect(updateDayNightOverlay).toHaveBeenCalled();
    expect(updatePlayerPosition).toHaveBeenCalledWith({ x: 4, y: 5 });
    expect(updatePlayerVitalsIndicator).toHaveBeenCalledWith({ x: 4, y: 5 }, 80, 100);
    expect(updateEnemies).toHaveBeenCalled();
    expect(updateNpcs).toHaveBeenCalled();
    expect(renderVisionCones).toHaveBeenCalled();
    expect(updateSurveillanceCameras).toHaveBeenCalled();
  });

  it('cleans old entity visuals and resets camera/map when map id changes', () => {
    const enemyDestroy = jest.fn();
    const enemyBarDestroy = jest.fn();
    const enemyLabelDestroy = jest.fn();
    const npcDestroy = jest.fn();
    const npcLabelDestroy = jest.fn();
    const npcIndicatorDestroy = jest.fn();

    const enemySprites = new Map([
      [
        'enemy-1',
        {
          token: { container: { destroy: enemyDestroy } },
          healthBar: { destroy: enemyBarDestroy, clear: jest.fn(), setVisible: jest.fn() },
          nameLabel: { destroy: enemyLabelDestroy },
          markedForRemoval: false,
        },
      ],
    ]);
    const npcSprites = new Map([
      [
        'npc-1',
        {
          token: { container: { destroy: npcDestroy } },
          nameLabel: { destroy: npcLabelDestroy },
          indicator: { destroy: npcIndicatorDestroy },
          markedForRemoval: false,
        },
      ],
    ]);

    const scene = {
      sys: { isActive: () => true },
      currentMapArea: { id: 'old-map' },
      inCombat: false,
      currentGameTime: 0,
      curfewActive: false,
      currentAtmosphereProfile: { overlayTintHex: '#000000' },
      lastAtmosphereRedrawBucket: 5,
      hasInitialZoomApplied: true,
      userAdjustedZoom: true,
      preCombatZoom: 1.2,
      preCombatUserAdjusted: true,
      pendingRestoreUserAdjusted: true,
      enemySprites,
      npcSprites,
      lastItemMarkerSignature: 'sig-old',
      zoomCameraForCombat: jest.fn(),
      restoreCameraAfterCombat: jest.fn(),
      destroyPlayerVitalsIndicator: jest.fn(),
      destroyCameraSprites: jest.fn(),
      setupCameraAndMap: jest.fn(),
      clearPathPreview: jest.fn(),
      enablePlayerCameraFollow: jest.fn(),
      updateDayNightOverlay: jest.fn(),
      getItemMarkerSignature: jest.fn(() => 'sig-new'),
      renderStaticProps: jest.fn(),
      updatePlayerPosition: jest.fn(),
      updatePlayerVitalsIndicator: jest.fn(),
      updateEnemies: jest.fn(),
      updateNpcs: jest.fn(),
      renderVisionCones: jest.fn(),
      updateSurveillanceCameras: jest.fn(),
    } as unknown as MainScene;

    const module = new StateSyncModule(scene);
    const nextState = createState({
      world: {
        inCombat: false,
        currentTime: 95,
        curfewActive: false,
        currentMapArea: {
          id: 'new-map',
          entities: { enemies: [], npcs: [] },
          tiles: [],
        },
      },
      surveillance: {
        zones: { 'new-map': { cameras: [] } },
        hud: { overlayEnabled: true },
      },
    } as unknown as Partial<RootState>);

    module.onStateChange(createState(), nextState);

    expect(enemyDestroy).toHaveBeenCalledWith(true);
    expect(enemyBarDestroy).toHaveBeenCalled();
    expect(enemyLabelDestroy).toHaveBeenCalled();
    expect(npcDestroy).toHaveBeenCalledWith(true);
    expect(npcLabelDestroy).toHaveBeenCalled();
    expect(npcIndicatorDestroy).toHaveBeenCalled();
    expect(enemySprites.size).toBe(0);
    expect(npcSprites.size).toBe(0);
    expect((scene as unknown as { destroyCameraSprites: jest.Mock }).destroyCameraSprites).toHaveBeenCalled();
    expect((scene as unknown as { setupCameraAndMap: jest.Mock }).setupCameraAndMap).toHaveBeenCalled();
    expect((scene as unknown as { clearPathPreview: jest.Mock }).clearPathPreview).toHaveBeenCalled();
    expect((scene as unknown as { enablePlayerCameraFollow: jest.Mock }).enablePlayerCameraFollow).toHaveBeenCalled();
  });
});
