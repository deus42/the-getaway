import { miniMapService, normalizeMiniMapViewport } from '../game/services/miniMapService';
import { MINIMAP_VIEWPORT_CLICK_EVENT } from '../game/events';

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
