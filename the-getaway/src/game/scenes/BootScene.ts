import Phaser from 'phaser';
import { store } from '../../store';
import { RootState } from '../../store'; // Import RootState
import { getLevel0Content } from '../../content/levels/level0';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    console.log('[BootScene] create: Fetching initial state and starting MainScene...');
    const initialState: RootState = store.getState();
    const initialMapArea = initialState.world.currentMapArea;
    const initialPlayerPosition = initialState.player.data.position;

    if (!initialMapArea) {
        console.error('[BootScene] Error: initialMapArea is null or undefined in Redux state!');
        // Handle this error appropriately - maybe load a default map or show an error message
        // For now, we'll log the error and attempt to proceed, which might fail in MainScene
    }
    if (!initialPlayerPosition) {
        console.error('[BootScene] Error: initialPlayerPosition is null or undefined in Redux state!');
        // Handle this error - maybe use a default position
    }

    // Get building definitions from level content
    const locale = initialState.settings.locale;
    const levelContent = getLevel0Content(locale);
    const buildings = levelContent.buildingDefinitions;

    // Start the MainScene, passing the initial data to its init method
    this.scene.start('MainScene', {
        mapArea: initialMapArea,
        playerPosition: initialPlayerPosition,
        buildings: buildings
    });
  }
} 
