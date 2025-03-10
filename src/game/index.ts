import { createGame } from './gameConfig';

let game: Phaser.Game | null = null;

export const initGame = (): Phaser.Game => {
  if (game) {
    return game;
  }
  
  game = createGame();
  return game;
};

export const destroyGame = (): void => {
  if (game) {
    game.destroy(true);
    game = null;
  }
}; 