import { store } from '../../store';
import type { RootState } from '../../store';
import type { MapArea, Enemy, NPC } from '../interfaces/types';
import type { ViewportUpdateDetail } from '../events';
import {
  MINIMAP_VIEWPORT_CLICK_EVENT,
  MINIMAP_STATE_EVENT,
  MiniMapInteractionDetail,
  MiniMapStateDetail,
} from '../events';
import type { MainScene } from '../scenes/MainScene';

const raf = typeof window !== 'undefined' ? window.requestAnimationFrame.bind(window) : undefined;
const caf = typeof window !== 'undefined' ? window.cancelAnimationFrame.bind(window) : undefined;

const DEFAULT_TILE_SCALE = 2;
const MAX_CANVAS_WIDTH = 180;
const MAX_CANVAS_HEIGHT = 160;

const clampScale = (area: Pick<MapArea, 'width' | 'height'>): number => {
  const widthScale = MAX_CANVAS_WIDTH / area.width;
  const heightScale = MAX_CANVAS_HEIGHT / area.height;
  const rawScale = Math.min(widthScale, heightScale);
  const clamped = Math.max(0.6, Math.min(4, Math.floor(rawScale * 10) / 10 || DEFAULT_TILE_SCALE));
  return Number.isFinite(clamped) && clamped > 0 ? clamped : DEFAULT_TILE_SCALE;
};

const createEntitySignature = (enemies: Enemy[], npcs: NPC[], playerId: string | undefined, playerX: number, playerY: number): string => {
  const enemySig = enemies
    .map((enemy) => `${enemy.id}:${enemy.position.x}:${enemy.position.y}:${enemy.health}`)
    .join('|');
  const npcSig = npcs
    .map((npc) => `${npc.id}:${npc.position.x}:${npc.position.y}`)
    .join('|');
  return `${playerId ?? 'player'}:${playerX}:${playerY}::${enemySig}::${npcSig}`;
};

const getDevicePixelRatio = (): number => {
  if (typeof window === 'undefined') {
    return 1;
  }
  return window.devicePixelRatio || 1;
};

export type MiniMapEventListener = (event: CustomEvent<MiniMapStateDetail>) => void;

class MiniMapService extends EventTarget {
  private scene: MainScene | null = null;

  private storeUnsubscribe: (() => void) | null = null;

  private pendingFrame: number | null = null;

  private pendingStoreUpdate = false;

  private pendingViewportUpdate = false;

  private lastState: MiniMapStateDetail | null = null;

  private tileSignature: { areaId: string; ref: TileType[][]; version: number } | null = null;

  private viewport: MiniMapStateDetail['viewport'] | null = null;

  private readonly raf = raf;

  initialize(scene: MainScene) {
    if (this.scene === scene) {
      return;
    }

    this.shutdown();
    this.scene = scene;
    this.storeUnsubscribe = store.subscribe(() => {
      this.pendingStoreUpdate = true;
      this.scheduleBroadcast();
    });

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
    this.scene = null;
  }

  getState(): MiniMapStateDetail | null {
    return this.lastState;
  }

  updateViewport(detail: ViewportUpdateDetail & { zoom: number }) {
    this.viewport = {
      x: detail.x,
      y: detail.y,
      width: detail.width,
      height: detail.height,
      zoom: detail.zoom,
    };

    this.pendingViewportUpdate = true;
    this.scheduleBroadcast();
  }

  emitInteraction(detail: MiniMapInteractionDetail) {
    if (!this.scene) {
      return;
    }

    if (detail.type === MINIMAP_VIEWPORT_CLICK_EVENT) {
      this.scene.focusCameraOnGridPosition(detail.gridX, detail.gridY, true);
    }
  }

  requestImmediateState() {
    this.pendingStoreUpdate = true;
    this.scheduleBroadcast(true);
  }

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

    const shouldEmit = !this.lastState || this.hasStateChanged(state, this.lastState);
    this.lastState = state;

    if (!shouldEmit) {
      return;
    }

    this.dispatchEvent(new CustomEvent(MINIMAP_STATE_EVENT, { detail: state }));
  }

  private composeState(): MiniMapStateDetail | null {
    const current: RootState = store.getState();
    const area = current.world.currentMapArea;

    if (!area) {
      return null;
    }

    const tileScale = clampScale(area);
    const logicalWidth = Math.ceil(area.width * tileScale);
    const logicalHeight = Math.ceil(area.height * tileScale);
    const dpr = getDevicePixelRatio();

    const player = current.player.data;
    const enemies = current.world.currentMapArea.entities.enemies;
    const npcs = current.world.currentMapArea.entities.npcs;

    const entitySig = createEntitySignature(enemies, npcs, player.id, player.position.x, player.position.y);
    const tilesRef = area.tiles;
    let tileVersion = this.tileSignature?.version ?? 0;

    if (!this.tileSignature || this.tileSignature.areaId !== area.id || this.tileSignature.ref !== tilesRef) {
      tileVersion += 1;
      this.tileSignature = {
        areaId: area.id,
        ref: tilesRef,
        version: tileVersion,
      };
    }

    const viewport = this.viewport ?? {
      x: 0,
      y: 0,
      width: Math.min(area.width, Math.ceil(area.width * 0.4)),
      height: Math.min(area.height, Math.ceil(area.height * 0.4)),
      zoom: this.scene ? this.scene.cameras.main.zoom : 1,
    };

    return {
      version: (this.lastState?.version ?? 0) + 1,
      areaId: area.id,
      areaName: area.name,
      mapWidth: area.width,
      mapHeight: area.height,
      logicalWidth,
      logicalHeight,
      tileScale,
      devicePixelRatio: dpr,
      tileVersion,
      tiles: tilesRef,
      entities: this.buildEntities(player.id ?? 'player', player.position.x, player.position.y, enemies, npcs),
      entitiesSignature: entitySig,
      viewport,
      curfewActive: current.world.curfewActive,
      timestamp: Date.now(),
    };
  }

  private buildEntities(
    playerId: string,
    playerX: number,
    playerY: number,
    enemies: Enemy[],
    npcs: NPC[],
  ): MiniMapStateDetail['entities'] {
    const entities: MiniMapStateDetail['entities'] = [
      {
        id: playerId,
        kind: 'player',
        x: playerX,
        y: playerY,
        status: 'active',
      },
    ];

    enemies.forEach((enemy) => {
      entities.push({
        id: enemy.id,
        kind: 'enemy',
        x: enemy.position.x,
        y: enemy.position.y,
        status: enemy.health > 0 ? 'active' : 'inactive',
      });
    });

    npcs.forEach((npc) => {
      entities.push({
        id: npc.id,
        kind: 'npc',
        x: npc.position.x,
        y: npc.position.y,
        status: 'active',
      });
    });

    return entities;
  }

  private hasStateChanged(next: MiniMapStateDetail, prev: MiniMapStateDetail) {
    if (!prev) {
      return true;
    }

    return (
      next.areaId !== prev.areaId ||
      next.areaName !== prev.areaName ||
      next.tileVersion !== prev.tileVersion ||
      next.logicalWidth !== prev.logicalWidth ||
      next.logicalHeight !== prev.logicalHeight ||
      next.tileScale !== prev.tileScale ||
      next.devicePixelRatio !== prev.devicePixelRatio ||
      next.curfewActive !== prev.curfewActive ||
      next.viewport.x !== prev.viewport.x ||
      next.viewport.y !== prev.viewport.y ||
      next.viewport.width !== prev.viewport.width ||
      next.viewport.height !== prev.viewport.height ||
      next.viewport.zoom !== prev.viewport.zoom ||
      next.entitiesSignature !== prev.entitiesSignature
    );
  }
}

export const miniMapService = new MiniMapService();

declare global {
  interface GlobalEventHandlersEventMap {
    [MINIMAP_STATE_EVENT]: CustomEvent<MiniMapStateDetail>;
  }
}
