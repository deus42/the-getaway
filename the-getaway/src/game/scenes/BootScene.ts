import Phaser from 'phaser';
import {
  preloadCharacterSpriteSheets,
  registerCharacterSpriteAnimations,
} from '../visual/entities/characterSpriteAssets';
import {
  GET155_PREVIEW_ATLAS_IMAGE_PATH,
  GET155_PREVIEW_ATLAS_JSON_PATH,
  GET155_PREVIEW_ATLAS_KEY,
  LEVEL0_ENVIRONMENT_ATLAS_IMAGE_PATH,
  LEVEL0_ENVIRONMENT_ATLAS_JSON_PATH,
  LEVEL0_ENVIRONMENT_ATLAS_KEY,
  LEVEL0_ENVIRONMENT_NORMAL_KEY,
  LEVEL0_ENVIRONMENT_NORMAL_PATH,
  PAINTERLY_LEVEL0_ENVIRONMENT_ATLAS_IMAGE_PATH,
  PAINTERLY_LEVEL0_ENVIRONMENT_ATLAS_JSON_PATH,
  PAINTERLY_LEVEL0_ENVIRONMENT_ATLAS_KEY,
  PAINTERLY_LEVEL0_ENVIRONMENT_NORMAL_KEY,
  PAINTERLY_LEVEL0_ENVIRONMENT_NORMAL_PATH,
} from '../../content/environment/atlasFrames';
import { store } from '../../store';
import { RootState } from '../../store'; // Import RootState
import { getLevel0Content } from '../../content/levels/level0';
import { LEVEL0_BUILDING_ART_MANIFEST } from '../../content/environment/level0BuildingArtManifest';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.load.atlas('props', 'atlases/props.png', 'atlases/props.json');
    this.load.atlas('esb', 'atlases/esb_iso_trim_pad.png', 'atlases/esb_iso_trim_pad.json');
    this.load.atlas(
      LEVEL0_ENVIRONMENT_ATLAS_KEY,
      LEVEL0_ENVIRONMENT_ATLAS_IMAGE_PATH,
      LEVEL0_ENVIRONMENT_ATLAS_JSON_PATH
    );
    this.load.atlas(
      PAINTERLY_LEVEL0_ENVIRONMENT_ATLAS_KEY,
      PAINTERLY_LEVEL0_ENVIRONMENT_ATLAS_IMAGE_PATH,
      PAINTERLY_LEVEL0_ENVIRONMENT_ATLAS_JSON_PATH
    );
    this.load.atlas(
      GET155_PREVIEW_ATLAS_KEY,
      GET155_PREVIEW_ATLAS_IMAGE_PATH,
      GET155_PREVIEW_ATLAS_JSON_PATH
    );
    this.load.image('lamp_slim_a_n', 'normals/lamp_slim_a_n.png');
    this.load.image(LEVEL0_ENVIRONMENT_NORMAL_KEY, LEVEL0_ENVIRONMENT_NORMAL_PATH);
    this.load.image(PAINTERLY_LEVEL0_ENVIRONMENT_NORMAL_KEY, PAINTERLY_LEVEL0_ENVIRONMENT_NORMAL_PATH);
    LEVEL0_BUILDING_ART_MANIFEST.forEach((entry) => {
      this.load.image(entry.textureKey, entry.imagePath);
    });
    preloadCharacterSpriteSheets(this);
  }

  create() {
    console.log('[BootScene] create: Fetching initial state and starting MainScene...');
    const initialState: RootState = store.getState();
    const initialMapArea = initialState.world.currentMapArea;
    const initialPlayerPosition = initialState.player.data.position;

    const propsTexture = this.textures.get('props');
    const normalTexture = this.textures.get('lamp_slim_a_n');
    if (propsTexture && normalTexture && propsTexture.dataSource.length === 0) {
      const normalSource = normalTexture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      propsTexture.setDataSource(normalSource);
      this.textures.remove('lamp_slim_a_n');
    }

    const level0EnvironmentTexture = this.textures.get(LEVEL0_ENVIRONMENT_ATLAS_KEY);
    const level0EnvironmentNormal = this.textures.get(LEVEL0_ENVIRONMENT_NORMAL_KEY);
    if (
      level0EnvironmentTexture &&
      level0EnvironmentNormal &&
      level0EnvironmentTexture.dataSource.length === 0
    ) {
      const normalSource = level0EnvironmentNormal.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      level0EnvironmentTexture.setDataSource(normalSource);
      this.textures.remove(LEVEL0_ENVIRONMENT_NORMAL_KEY);
    }

    const painterlyEnvironmentTexture = this.textures.get(PAINTERLY_LEVEL0_ENVIRONMENT_ATLAS_KEY);
    const painterlyEnvironmentNormal = this.textures.get(PAINTERLY_LEVEL0_ENVIRONMENT_NORMAL_KEY);
    if (
      painterlyEnvironmentTexture &&
      painterlyEnvironmentNormal &&
      painterlyEnvironmentTexture.dataSource.length === 0
    ) {
      const normalSource = painterlyEnvironmentNormal.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      painterlyEnvironmentTexture.setDataSource(normalSource);
      this.textures.remove(PAINTERLY_LEVEL0_ENVIRONMENT_NORMAL_KEY);
    }

    registerCharacterSpriteAnimations(this);

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
