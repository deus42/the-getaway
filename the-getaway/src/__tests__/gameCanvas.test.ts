// Mock Phaser
jest.mock('phaser', () => ({
  Scene: class MockScene {
    constructor() {}
  },
  GameObjects: {
    Graphics: class {},
    Rectangle: class {}
  }
}));

// Import after mocking
import { store } from '../store';
import { setMapArea } from '../store/worldSlice';
import { movePlayer } from '../store/playerSlice';
import { createBasicMapArea } from '../game/world/grid';

describe('Game Engine Integration', () => {
  test('Redux store can update the game state', () => {
    // Create a test map
    const testMap = createBasicMapArea('Test Map', 15, 15);
    
    // Update the store
    store.dispatch(setMapArea(testMap));
    
    // Verify that the store was updated correctly
    const state = store.getState();
    expect(state.world.currentMapArea.name).toBe('Test Map');
    expect(state.world.currentMapArea.width).toBe(15);
    expect(state.world.currentMapArea.height).toBe(15);
  });

  test('Player movement updates Redux state', () => {
    // Get initial position
    const initialState = store.getState();
    const initialPosition = initialState.player.data.position;
    
    // Move player to a new position
    const newPosition = { x: 5, y: 5 };
    store.dispatch(movePlayer(newPosition));
    
    // Verify that the player position was updated
    const newState = store.getState();
    expect(newState.player.data.position).toEqual(newPosition);
    expect(newState.player.data.position).not.toEqual(initialPosition);
  });
}); 