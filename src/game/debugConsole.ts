/**
 * Debug utility to help diagnose issues with Phaser game initialization
 */
export const checkPhaser = (): void => {
  console.log('=== PHASER DEBUG ===');
  
  // Check if Phaser is available
  if (typeof window !== 'undefined') {
    // @ts-ignore
    const phaserAvailable = Boolean(window.Phaser);
    console.log('Phaser globally available:', phaserAvailable);
  }
  
  // Check if game container exists
  const gameContainer = document.getElementById('game-container');
  console.log('Game container exists:', Boolean(gameContainer));
  if (gameContainer) {
    console.log('Game container dimensions:', {
      width: gameContainer.clientWidth,
      height: gameContainer.clientHeight,
      offsetWidth: gameContainer.offsetWidth,
      offsetHeight: gameContainer.offsetHeight,
      style: gameContainer.getAttribute('style')
    });
    
    // Check for canvas within container
    const canvas = gameContainer.querySelector('canvas');
    console.log('Canvas exists in container:', Boolean(canvas));
    if (canvas) {
      console.log('Canvas dimensions:', {
        width: canvas.width,
        height: canvas.height,
        style: canvas.getAttribute('style')
      });
    }
  }
  
  console.log('=== END DEBUG ===');
}; 