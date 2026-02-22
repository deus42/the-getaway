import Phaser from 'phaser';
import { RootState } from '../../../../store';
import { Enemy, MapArea, NPC, Position, SurveillanceZoneState } from '../../../interfaces/types';
import type { CharacterToken } from '../../../utils/IsoObjectFactory';
import type { AtmosphereProfile } from '../../../visual/world/AtmosphereDirector';
import type { MainScene } from '../../MainScene';
import { SceneModule } from '../SceneModule';

type EnemySpriteRecord = {
  token: CharacterToken;
  healthBar: Phaser.GameObjects.Graphics;
  nameLabel: Phaser.GameObjects.Text;
  markedForRemoval: boolean;
};

type NpcSpriteRecord = {
  token: CharacterToken;
  indicator?: Phaser.GameObjects.Graphics;
  nameLabel: Phaser.GameObjects.Text;
  markedForRemoval: boolean;
};

type MainSceneStateInternals = {
  sys: Phaser.Scenes.Systems;
  currentMapArea: MapArea | null;
  inCombat: boolean;
  currentGameTime: number;
  curfewActive: boolean;
  currentAtmosphereProfile?: AtmosphereProfile;
  lastAtmosphereRedrawBucket: number;
  hasInitialZoomApplied: boolean;
  userAdjustedZoom: boolean;
  preCombatZoom: number | null;
  preCombatUserAdjusted: boolean;
  pendingRestoreUserAdjusted: boolean | null;
  enemySprites: Map<string, EnemySpriteRecord>;
  npcSprites: Map<string, NpcSpriteRecord>;
  lastItemMarkerSignature: string;
  zoomCameraForCombat(): void;
  restoreCameraAfterCombat(): void;
  destroyPlayerVitalsIndicator(): void;
  destroyCameraSprites(): void;
  setupCameraAndMap(): void;
  clearPathPreview(): void;
  enablePlayerCameraFollow(): void;
  updateDayNightOverlay(): void;
  getItemMarkerSignature(area: MapArea | null): string;
  renderStaticProps(): void;
  updatePlayerPosition(position: Position): void;
  updatePlayerVitalsIndicator(position: Position, health: number, maxHealth: number): void;
  updateEnemies(enemies: Enemy[]): void;
  updateNpcs(npcs: NPC[]): void;
  renderVisionCones(): void;
  updateSurveillanceCameras(zone?: SurveillanceZoneState, overlayEnabled?: boolean): void;
};

export class StateSyncModule implements SceneModule<MainScene> {
  readonly key = 'stateSync';

  constructor(private readonly scene: MainScene) {}

  init(): void {}

  onStateChange(_previousState: RootState, nextState: RootState): void {
    const scene = this.getScene();
    if (!scene.sys.isActive() || !scene.currentMapArea) {
      return;
    }

    const playerState = nextState.player.data;
    const worldState = nextState.world;
    const currentEnemies = worldState.currentMapArea.entities.enemies;

    const previousCombatState = scene.inCombat;
    scene.inCombat = worldState.inCombat;

    if (scene.inCombat && !previousCombatState) {
      scene.zoomCameraForCombat();
    }

    if (!scene.inCombat && previousCombatState) {
      scene.restoreCameraAfterCombat();
      scene.destroyPlayerVitalsIndicator();
      scene.enemySprites.forEach((data) => {
        data.healthBar.clear();
        data.healthBar.setVisible(false);
      });
      scene.npcSprites.forEach((data) => {
        if (data.indicator) {
          data.indicator.destroy();
          data.indicator = undefined;
        }
      });
    }

    scene.currentGameTime = worldState.currentTime;
    scene.updateDayNightOverlay();

    if (!worldState.currentMapArea || !scene.currentMapArea) {
      return;
    }

    if (scene.currentMapArea.id !== worldState.currentMapArea.id) {
      scene.hasInitialZoomApplied = false;
      scene.userAdjustedZoom = false;
      scene.preCombatZoom = null;
      scene.preCombatUserAdjusted = false;
      scene.pendingRestoreUserAdjusted = null;
      scene.currentMapArea = worldState.currentMapArea;

      scene.enemySprites.forEach((data) => {
        data.token.container.destroy(true);
        data.healthBar.destroy();
        data.nameLabel.destroy();
      });
      scene.enemySprites.clear();

      scene.npcSprites.forEach((data) => {
        data.token.container.destroy(true);
        data.nameLabel.destroy();
        if (data.indicator) {
          data.indicator.destroy();
        }
      });
      scene.npcSprites.clear();
      scene.destroyCameraSprites();
      scene.currentAtmosphereProfile = undefined;
      scene.lastAtmosphereRedrawBucket = -1;
      scene.setupCameraAndMap();
      scene.clearPathPreview();
      scene.enablePlayerCameraFollow();
    }

    const previousItemMarkerSignature = scene.lastItemMarkerSignature;
    scene.currentMapArea = worldState.currentMapArea;
    const nextItemMarkerSignature = scene.getItemMarkerSignature(scene.currentMapArea);
    if (previousItemMarkerSignature !== nextItemMarkerSignature) {
      scene.renderStaticProps();
    }

    if (scene.curfewActive !== worldState.curfewActive) {
      scene.curfewActive = worldState.curfewActive;
    }

    scene.updatePlayerPosition(playerState.position);
    scene.updatePlayerVitalsIndicator(playerState.position, playerState.health, playerState.maxHealth);
    scene.updateEnemies(currentEnemies);
    scene.updateNpcs(worldState.currentMapArea.entities.npcs);
    scene.renderVisionCones();
    const zoneState = nextState.surveillance?.zones?.[scene.currentMapArea.id];
    const overlayEnabled = nextState.surveillance?.hud?.overlayEnabled ?? false;
    scene.updateSurveillanceCameras(zoneState, overlayEnabled);
  }

  private getScene(): MainSceneStateInternals {
    return this.scene as unknown as MainSceneStateInternals;
  }
}
