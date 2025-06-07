// This file exists to test imports from the world directory
export const worldTest = 'World module loaded successfully';

test('world module placeholder', () => {
  expect(worldTest).toBe('World module loaded successfully');
});
