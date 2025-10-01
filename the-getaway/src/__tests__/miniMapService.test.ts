import { miniMapService } from '../game/services/miniMapService';
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
