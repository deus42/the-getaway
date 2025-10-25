import { store } from '../../store';
import type { ViewportUpdateDetail, PathPreviewDetail } from '../events';
import { PATH_PREVIEW_EVENT } from '../events';
import {
  MINIMAP_VIEWPORT_CLICK_EVENT,
  MINIMAP_OBJECTIVE_FOCUS_EVENT,
  MINIMAP_STATE_EVENT,
  MINIMAP_ZOOM_EVENT,
  MiniMapInteractionDetail,
  MiniMapRenderState,
  MiniMapZoomDetail,
  MINIMAP_PATH_PREVIEW_EVENT,
  MiniMapPathPreviewDetail,
  PLAYER_SCREEN_POSITION_EVENT,
  PlayerScreenPositionDetail,
} from '../events';
import type { MainScene } from '../scenes/MainScene';
import { MiniMapController, normalizeMiniMapViewport } from '../controllers/MiniMapController';

const raf = typeof window !== 'undefined' ? window.requestAnimationFrame.bind(window) : undefined;
const caf = typeof window !== 'undefined' ? window.cancelAnimationFrame.bind(window) : undefined;

const clampValue = (value: number, min: number, max: number): number => {
  if (max < min) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
};

export type MiniMapEventListener = (event: CustomEvent<MiniMapRenderState>) => void;

class MiniMapService extends EventTarget {
  private scene: MainScene | null = null;

  private storeUnsubscribe: (() => void) | null = null;

  private pendingFrame: number | null = null;

  private pendingStoreUpdate = false;

  private pendingViewportUpdate = false;

  private readonly controller = new MiniMapController();

  private lastState: MiniMapRenderState | null = null;

  private userZoom = 1;

  private readonly minZoom = 0.6;

  private readonly maxZoom = 3;

  private lastPath: PathPreviewDetail['path'] | null = null;

  private readonly raf = raf;

  initialize(scene: MainScene) {
    if (this.scene === scene) {
      return;
    }

    this.shutdown();
    this.scene = scene;
    this.controller.bindScene(scene);
    this.storeUnsubscribe = store.subscribe(() => {
      this.pendingStoreUpdate = true;
      this.scheduleBroadcast();
    });

    if (typeof window !== 'undefined') {
      window.addEventListener(PATH_PREVIEW_EVENT, this.handlePathPreview as EventListener);
    }

    this.pendingStoreUpdate = true;
    this.scheduleBroadcast(true);
  }

  shutdown() {
    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
      this.storeUnsubscribe = null;
    }

    if (this.pendingFrame !== null && this.raf && caf) {
      caf(this.pendingFrame);
    }

    this.pendingFrame = null;
    this.controller.bindScene(null);
    this.scene = null;

    if (typeof window !== 'undefined') {
      window.removeEventListener(PATH_PREVIEW_EVENT, this.handlePathPreview as EventListener);
    }
  }

  getState(): MiniMapRenderState | null {
    return this.lastState;
  }

  updateViewport(detail: ViewportUpdateDetail & { zoom: number }) {
    this.controller.setViewport({
      x: detail.x,
      y: detail.y,
      width: detail.width,
      height: detail.height,
      zoom: detail.zoom,
    });

    this.pendingViewportUpdate = true;
    this.scheduleBroadcast();
  }

  emitInteraction(detail: MiniMapInteractionDetail) {
    if (!this.scene) {
      return;
    }

    switch (detail.type) {
      case MINIMAP_VIEWPORT_CLICK_EVENT: {
        const animate = detail.animate ?? true;
        this.scene.focusCameraOnGridPosition(detail.gridX, detail.gridY, animate);
        break;
      }
      case MINIMAP_OBJECTIVE_FOCUS_EVENT: {
        const animate = detail.animate ?? true;
        this.scene.focusCameraOnGridPosition(detail.target.x, detail.target.y, animate);
        break;
      }
      default:
        break;
    }
  }

  setZoom(zoom: number) {
    const clamped = clampValue(zoom, this.minZoom, this.maxZoom);
    if (Math.abs(clamped - this.userZoom) < 0.0001) {
      return;
    }
    this.userZoom = clamped;
    this.pendingStoreUpdate = true;
    this.dispatchEvent(new CustomEvent<MiniMapZoomDetail>(MINIMAP_ZOOM_EVENT, { detail: { zoom: this.userZoom } }));
    this.scheduleBroadcast();
  }

  adjustZoom(delta: number) {
    this.setZoom(this.userZoom + delta);
  }

  getZoom(): number {
    return this.userZoom;
  }

  centerOnPlayer(animate = true) {
    if (!this.scene) {
      return;
    }
    const current = store.getState();
    const position = current.player.data.position;
    this.scene.focusCameraOnGridPosition(position.x, position.y, animate);
  }

  setCanvasBounds(width: number, height: number) {
    const updated = this.controller.setCanvasBounds(width, height);
    if (!updated) {
      return;
    }
    this.pendingStoreUpdate = true;
    this.scheduleBroadcast();
  }

  requestImmediateState() {
    this.pendingStoreUpdate = true;
    this.scheduleBroadcast(true);
  }

  private handlePathPreview = (event: Event) => {
    const detail = (event as CustomEvent<PathPreviewDetail>).detail;
    const state = store.getState();
    const area = state.world.currentMapArea;
    if (!area || detail.areaId !== area.id) {
      return;
    }
    const path = detail.path ?? [];
    this.lastPath = path.length ? path : null;
    this.pendingStoreUpdate = true;
    this.scheduleBroadcast();
  };

  private scheduleBroadcast(forceImmediate = false) {
    if (forceImmediate || !this.raf) {
      this.broadcast();
      return;
    }

    if (this.pendingFrame !== null) {
      return;
    }

    this.pendingFrame = this.raf(() => {
      this.pendingFrame = null;
      this.broadcast();
    });
  }

  private composeState(): MiniMapRenderState | null {
    return this.controller.compose(store.getState(), this.userZoom, this.lastPath);
  }

  private broadcast() {
    if (!this.pendingStoreUpdate && !this.pendingViewportUpdate) {
      return;
    }

    const state = this.composeState();
    this.pendingStoreUpdate = false;
    this.pendingViewportUpdate = false;

    if (!state) {
      return;
    }

    const shouldEmit = this.shouldEmit(state);
    this.lastState = state;

    if (!shouldEmit) {
      return;
    }

    this.dispatchEvent(new CustomEvent(MINIMAP_STATE_EVENT, { detail: state }));
  }

  private shouldEmit(next: MiniMapRenderState): boolean {
    if (!this.lastState) {
      return true;
    }

    const prev = this.lastState;

    if (next.areaId !== prev.areaId) {
      return true;
    }

    const dirty = next.dirtyLayers;
    return dirty.tiles || dirty.entities || dirty.overlays || dirty.viewport || dirty.path;
  }
}

export const miniMapService = new MiniMapService();

declare global {
  interface GlobalEventHandlersEventMap {
    [MINIMAP_STATE_EVENT]: CustomEvent<MiniMapRenderState>;
    [MINIMAP_ZOOM_EVENT]: CustomEvent<MiniMapZoomDetail>;
    [MINIMAP_PATH_PREVIEW_EVENT]: CustomEvent<MiniMapPathPreviewDetail>;
    [PLAYER_SCREEN_POSITION_EVENT]: CustomEvent<PlayerScreenPositionDetail>;
  }
}

export { normalizeMiniMapViewport };
