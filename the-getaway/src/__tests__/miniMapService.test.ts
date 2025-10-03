import { miniMapService, normalizeMiniMapViewport } from '../game/services/miniMapService';
import { MiniMapController } from '../game/controllers/MiniMapController';
import { MINIMAP_VIEWPORT_CLICK_EVENT } from '../game/events';
import { store } from '../store';

const cloneRootState = () => {
  const snapshot = store.getState();
  if (typeof structuredClone === 'function') {
    return structuredClone(snapshot);
  }
  return JSON.parse(JSON.stringify(snapshot));
};

describe('MiniMapController', () => {
  it('marks all layers dirty on the first compose call and clears thereafter', () => {
    const controller = new MiniMapController({ maxCanvasWidth: 200, maxCanvasHeight: 160 });
    const initial = controller.compose(store.getState(), 1, null);
    expect(initial).not.toBeNull();
    expect(initial?.dirtyLayers.tiles).toBe(true);
    expect(initial?.dirtyLayers.entities).toBe(true);
    expect(initial?.dirtyLayers.overlays).toBe(true);
    expect(initial?.dirtyLayers.viewport).toBe(true);

    const second = controller.compose(store.getState(), 1, null);
    expect(second?.dirtyLayers.tiles).toBe(false);
    expect(second?.dirtyLayers.entities).toBe(false);
    expect(second?.dirtyLayers.overlays).toBe(false);
    expect(second?.dirtyLayers.viewport).toBe(false);
  });

  it('flags entity and path layers when player position or path changes', () => {
    const controller = new MiniMapController();
    controller.compose(store.getState(), 1, null);

    const mutated = cloneRootState();
    mutated.player.data.position.x = Math.max(0, mutated.player.data.position.x - 1);

    const next = controller.compose(mutated, 1, null);
    expect(next?.dirtyLayers.entities).toBe(true);

    const withPath = controller.compose(store.getState(), 1, [
      { x: mutated.player.data.position.x, y: mutated.player.data.position.y },
      { x: mutated.player.data.position.x + 1, y: mutated.player.data.position.y },
    ]);
    expect(withPath?.dirtyLayers.path).toBe(true);
  });
});

describe('miniMapService', () => {
  afterEach(() => {
    miniMapService.shutdown();
  });

  it('provides an initial minimap state snapshot', () => {
    const stubScene = {
      cameras: { main: { zoom: 1 } },
      focusCameraOnGridPosition: jest.fn(),
    } as unknown as import('../game/scenes/MainScene').MainScene;

    miniMapService.initialize(stubScene);
    miniMapService.requestImmediateState();

    const state = miniMapService.getState();

    expect(state).not.toBeNull();
    expect(state?.mapWidth).toBeGreaterThan(0);
    expect(state?.mapHeight).toBeGreaterThan(0);
    expect(state?.entities.length).toBeGreaterThan(0);
    expect(state?.dirtyLayers.tiles).toBeDefined();
  });

  it('routes minimap interactions to the active scene', () => {
    const focusSpy = jest.fn();
    const stubScene = {
      cameras: { main: { zoom: 1 } },
      focusCameraOnGridPosition: focusSpy,
    } as unknown as import('../game/scenes/MainScene').MainScene;

    miniMapService.initialize(stubScene);
    miniMapService.emitInteraction({
      type: MINIMAP_VIEWPORT_CLICK_EVENT,
      gridX: 5,
      gridY: 7,
    });

    expect(focusSpy).toHaveBeenCalledWith(5, 7, true);
  });
});

describe('normalizeMiniMapViewport', () => {
  it('preserves the viewport center while keeping dimensions close to the original values', () => {
    const viewport = { x: 40, y: 30, width: 30, height: 18, zoom: 1 };
    const area = { width: 200, height: 150 };

    const normalized = normalizeMiniMapViewport(viewport, area);

    const originalCenterX = viewport.x + viewport.width / 2;
    const originalCenterY = viewport.y + viewport.height / 2;
    const normalizedCenterX = normalized.x + normalized.width / 2;
    const normalizedCenterY = normalized.y + normalized.height / 2;

    expect(normalizedCenterX).toBeCloseTo(originalCenterX, 4);
    expect(normalizedCenterY).toBeCloseTo(originalCenterY, 4);
    expect(normalized.width).toBeCloseTo(viewport.width, 4);
    expect(normalized.height).toBeCloseTo(viewport.height, 4);
  });

  it('clamps the viewport inside map bounds', () => {
    const viewport = { x: -10, y: -5, width: 60, height: 40, zoom: 1 };
    const area = { width: 50, height: 45 };

    const normalized = normalizeMiniMapViewport(viewport, area);

    expect(normalized.x).toBeGreaterThanOrEqual(0);
    expect(normalized.y).toBeGreaterThanOrEqual(0);
    expect(normalized.x + normalized.width).toBeLessThanOrEqual(area.width);
    expect(normalized.y + normalized.height).toBeLessThanOrEqual(area.height);
  });

  it('enforces a minimum viewport footprint so dimensions never collapse to zero', () => {
    const viewport = { x: 10, y: 10, width: 0.00005, height: 0.00005, zoom: 1 };
    const area = { width: 200, height: 200 };

    const normalized = normalizeMiniMapViewport(viewport, area);

    expect(normalized.width).toBeGreaterThanOrEqual(0.001);
    expect(normalized.height).toBeGreaterThanOrEqual(0.001);
  });
});
