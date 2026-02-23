import { RootState } from '../../../../store';
import type { MainScene } from '../../MainScene';
import type { StateSyncModulePorts, StateSyncRuntimeState } from '../contracts/ModulePorts';
import { SceneModule } from '../SceneModule';

const readValue = <T>(target: object, key: string): T | undefined => {
  return Reflect.get(target, key) as T | undefined;
};

const readRequiredValue = <T>(target: object, key: string): T => {
  const value = readValue<T>(target, key);
  if (value === undefined || value === null) {
    throw new Error(`[StateSyncModule] Missing required scene value: ${key}`);
  }
  return value;
};

const callSceneMethod = <TReturn>(target: object, key: string, ...args: unknown[]): TReturn => {
  const value = readValue<unknown>(target, key);
  if (typeof value !== 'function') {
    throw new Error(`[StateSyncModule] Missing required scene method: ${key}`);
  }

  return (value as (...methodArgs: unknown[]) => TReturn).apply(target, args);
};

const createStateSyncModulePorts = (scene: MainScene): StateSyncModulePorts => {
  return {
    sys: readRequiredValue(scene, 'sys'),
    getCurrentMapArea: () => readValue(scene, 'currentMapArea') ?? null,
    setCurrentMapArea: (area) => {
      Reflect.set(scene, 'currentMapArea', area);
    },
    getItemMarkerSignature: (area) => callSceneMethod(scene, 'getItemMarkerSignature', area),
    renderStaticProps: () => {
      callSceneMethod(scene, 'renderStaticProps');
    },
    updateDayNightOverlay: () => {
      callSceneMethod(scene, 'updateDayNightOverlay');
    },
    updatePlayerPosition: (position) => {
      callSceneMethod(scene, 'updatePlayerPosition', position);
    },
    updatePlayerVitalsIndicator: (position, health, maxHealth) => {
      callSceneMethod(scene, 'updatePlayerVitalsIndicator', position, health, maxHealth);
    },
    updateEnemies: (enemies) => {
      callSceneMethod(scene, 'updateEnemies', enemies);
    },
    updateNpcs: (npcs) => {
      callSceneMethod(scene, 'updateNpcs', npcs);
    },
    renderVisionCones: () => {
      callSceneMethod(scene, 'renderVisionCones');
    },
    updateSurveillanceCameras: (zone, overlayEnabled) => {
      callSceneMethod(scene, 'updateSurveillanceCameras', zone, overlayEnabled);
    },
    zoomCameraForCombat: () => {
      callSceneMethod(scene, 'zoomCameraForCombat');
    },
    restoreCameraAfterCombat: () => {
      callSceneMethod(scene, 'restoreCameraAfterCombat');
    },
    destroyPlayerVitalsIndicator: () => {
      callSceneMethod(scene, 'destroyPlayerVitalsIndicator');
    },
    destroyCameraSprites: () => {
      callSceneMethod(scene, 'destroyCameraSprites');
    },
    setupCameraAndMap: () => {
      callSceneMethod(scene, 'setupCameraAndMap');
    },
    clearPathPreview: () => {
      callSceneMethod(scene, 'clearPathPreview');
    },
    enablePlayerCameraFollow: () => {
      callSceneMethod(scene, 'enablePlayerCameraFollow');
    },
    resetCameraRuntimeStateForMapTransition: () => {
      const cameraModule = readValue<{ resetForMapTransition?: () => void }>(scene, 'cameraModule');
      cameraModule?.resetForMapTransition?.();
    },
    clearEntityRuntimeStateForMapTransition: () => {
      const entityRenderModule = readValue<{ clearForMapTransition?: () => void }>(scene, 'entityRenderModule');
      entityRenderModule?.clearForMapTransition?.();
    },
    clearWorldRuntimeStateForMapTransition: () => {
      const worldRenderModule = readValue<{ clearForMapTransition?: () => void }>(scene, 'worldRenderModule');
      worldRenderModule?.clearForMapTransition?.();
    },
    resetEntityCombatIndicators: () => {
      const entityRenderModule = readValue<{ resetCombatIndicators?: () => void }>(scene, 'entityRenderModule');
      entityRenderModule?.resetCombatIndicators?.();
    },
    readRuntimeState: () => {
      const currentMapArea = readValue<{ id?: string }>(scene, 'currentMapArea');
      return {
        curfewActive: Boolean(readValue(scene, 'curfewActive')),
        inCombat: Boolean(readValue(scene, 'inCombat')),
        lastMapAreaId: currentMapArea?.id ?? null,
        isMapTransitionPending: false,
      };
    },
    writeRuntimeState: (state) => {
      Reflect.set(scene, 'curfewActive', state.curfewActive);
      Reflect.set(scene, 'inCombat', state.inCombat);
    },
  };
};

const createDefaultRuntimeState = (): StateSyncRuntimeState => ({
  curfewActive: false,
  inCombat: false,
  lastMapAreaId: null,
  isMapTransitionPending: false,
});

export class StateSyncModule implements SceneModule<MainScene> {
  readonly key = 'stateSync';

  private readonly ports: StateSyncModulePorts;

  private runtimeState: StateSyncRuntimeState;

  constructor(scene: MainScene, ports?: StateSyncModulePorts) {
    this.ports = ports ?? createStateSyncModulePorts(scene);
    this.runtimeState = {
      ...createDefaultRuntimeState(),
      ...this.ports.readRuntimeState?.(),
    };
    this.pushRuntimeStateToPorts();
  }

  init(): void {}

  isInCombat(): boolean {
    return this.runtimeState.inCombat;
  }

  isCurfewActive(): boolean {
    return this.runtimeState.curfewActive;
  }

  onStateChange(_previousState: RootState, nextState: RootState): void {
    const currentMapArea = this.ports.getCurrentMapArea();
    if (!this.ports.sys.isActive() || !currentMapArea) {
      return;
    }

    const playerState = nextState.player.data;
    const worldState = nextState.world;
    const currentEnemies = worldState.currentMapArea.entities.enemies;

    const previousCombatState = this.runtimeState.inCombat;
    this.runtimeState.inCombat = worldState.inCombat;

    if (this.runtimeState.inCombat && !previousCombatState) {
      this.ports.zoomCameraForCombat();
    }

    if (!this.runtimeState.inCombat && previousCombatState) {
      this.ports.restoreCameraAfterCombat();
      this.ports.destroyPlayerVitalsIndicator();
      this.ports.resetEntityCombatIndicators?.();
    }

    this.ports.updateDayNightOverlay();

    if (!worldState.currentMapArea || !currentMapArea) {
      this.pushRuntimeStateToPorts();
      return;
    }

    const nextMapArea = worldState.currentMapArea;
    const previousMapId = this.runtimeState.lastMapAreaId ?? currentMapArea.id;
    const nextMapId = nextMapArea.id;

    this.runtimeState.isMapTransitionPending = previousMapId !== nextMapId;

    if (this.runtimeState.isMapTransitionPending) {
      this.ports.resetCameraRuntimeStateForMapTransition?.();
      this.ports.clearEntityRuntimeStateForMapTransition?.();
      this.ports.clearWorldRuntimeStateForMapTransition?.();
      this.ports.destroyCameraSprites();

      this.ports.setCurrentMapArea(nextMapArea);
      this.ports.setupCameraAndMap();
      this.ports.clearPathPreview();
      this.ports.enablePlayerCameraFollow();

      this.runtimeState.lastMapAreaId = nextMapId;
      this.runtimeState.isMapTransitionPending = false;
    }

    const previousItemMarkerSignature = this.ports.getItemMarkerSignature(currentMapArea);
    this.ports.setCurrentMapArea(nextMapArea);
    const nextItemMarkerSignature = this.ports.getItemMarkerSignature(nextMapArea);
    if (previousItemMarkerSignature !== nextItemMarkerSignature) {
      this.ports.renderStaticProps();
    }

    this.runtimeState.curfewActive = worldState.curfewActive;

    this.ports.updatePlayerPosition(playerState.position);
    this.ports.updatePlayerVitalsIndicator(playerState.position, playerState.health, playerState.maxHealth);
    this.ports.updateEnemies(currentEnemies);
    this.ports.updateNpcs(nextMapArea.entities.npcs);
    this.ports.renderVisionCones();
    const zoneState = nextState.surveillance?.zones?.[nextMapArea.id];
    const overlayEnabled = nextState.surveillance?.hud?.overlayEnabled ?? false;
    this.ports.updateSurveillanceCameras(zoneState, overlayEnabled);

    this.runtimeState.lastMapAreaId = nextMapId;
    this.pushRuntimeStateToPorts();
  }

  private pushRuntimeStateToPorts(): void {
    this.ports.writeRuntimeState?.(this.runtimeState);
  }
}
