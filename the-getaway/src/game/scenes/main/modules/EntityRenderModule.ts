import Phaser from 'phaser';
import { Enemy, NPC, Position } from '../../../interfaces/types';
import { PLAYER_SCREEN_POSITION_EVENT, PlayerScreenPositionDetail } from '../../../events';
import { computeDepth, DepthBias } from '../../../utils/depth';
import type { MainScene } from '../../MainScene';
import type {
  EntityRenderModulePorts,
  EntityRenderRuntimeState,
} from '../contracts/ModulePorts';
import { SceneModule } from '../SceneModule';

const readValue = <T>(target: object, key: string): T | undefined => {
  return Reflect.get(target, key) as T | undefined;
};

const readRequiredValue = <T>(target: object, key: string): T => {
  const value = readValue<T>(target, key);
  if (value === undefined || value === null) {
    throw new Error(`[EntityRenderModule] Missing required scene value: ${key}`);
  }
  return value;
};

const callSceneMethod = <TReturn>(target: object, key: string, ...args: unknown[]): TReturn => {
  const value = readValue<unknown>(target, key);
  if (typeof value !== 'function') {
    throw new Error(`[EntityRenderModule] Missing required scene method: ${key}`);
  }

  return (value as (...methodArgs: unknown[]) => TReturn).apply(target, args);
};

const createEntityRenderModulePorts = (scene: MainScene): EntityRenderModulePorts => {
  return {
    add: readRequiredValue(scene, 'add'),
    cameras: readRequiredValue(scene, 'cameras'),
    game: readRequiredValue(scene, 'game'),
    scale: readRequiredValue(scene, 'scale'),
    sys: readRequiredValue(scene, 'sys'),
    hasMapGraphics: () => Boolean(readValue(scene, 'mapGraphics')),
    ensureIsoFactory: () => {
      callSceneMethod(scene, 'ensureIsoFactory');
    },
    getIsoMetrics: () => callSceneMethod(scene, 'getIsoMetrics'),
    calculatePixelPosition: (gridX: number, gridY: number) => callSceneMethod(scene, 'calculatePixelPosition', gridX, gridY),
    syncDepth: (target: Phaser.GameObjects.GameObject, pixelX: number, pixelY: number, bias: number) => {
      callSceneMethod(scene, 'syncDepth', target, pixelX, pixelY, bias);
    },
    enablePlayerCameraFollow: () => {
      callSceneMethod(scene, 'enablePlayerCameraFollow');
    },
    isInCombat: () => Boolean(readValue(scene, 'inCombat')),
    isCameraFollowingPlayer: () => Boolean(readValue(scene, 'isCameraFollowingPlayer')),
    createCharacterToken: (role, gridX, gridY) => {
      const rigFactory = readValue<{
        createToken: (tokenRole: 'player' | 'hostileNpc' | 'interactiveNpc' | 'friendlyNpc', x: number, y: number) => unknown;
      }>(scene, 'characterRigFactory');
      let createdToken: unknown;
      if (rigFactory) {
        createdToken = rigFactory.createToken(role, gridX, gridY);
      } else {
        const isoFactory = readRequiredValue<{
          createCharacterToken: (x: number, y: number, profile: unknown) => unknown;
        }>(scene, 'isoFactory');
        const visualTheme = readRequiredValue<{ entityProfiles: Record<string, unknown> }>(scene, 'visualTheme');
        createdToken = isoFactory.createCharacterToken(
          gridX,
          gridY,
          visualTheme.entityProfiles[role]
        );
      }

      if (!createdToken) {
        throw new Error('[EntityRenderModule] Failed to create character token.');
      }
      return createdToken as NonNullable<EntityRenderRuntimeState['playerToken']>;
    },
    positionCharacterToken: (token, gridX, gridY) => {
      const rigFactory = readValue<{
        positionToken: (tokenArg: NonNullable<EntityRenderRuntimeState['playerToken']>, x: number, y: number) => void;
      }>(scene, 'characterRigFactory');
      if (rigFactory) {
        rigFactory.positionToken(token, gridX, gridY);
        return;
      }

      const isoFactory = readRequiredValue<{
        positionCharacterToken: (tokenArg: NonNullable<EntityRenderRuntimeState['playerToken']>, x: number, y: number) => void;
      }>(scene, 'isoFactory');
      isoFactory.positionCharacterToken(token, gridX, gridY);
    },
    readRuntimeState: () => ({
      playerToken: readValue(scene, 'playerToken'),
      playerNameLabel: readValue(scene, 'playerNameLabel'),
      playerVitalsIndicator: readValue(scene, 'playerVitalsIndicator'),
      enemySprites: readValue(scene, 'enemySprites') ?? new Map(),
      npcSprites: readValue(scene, 'npcSprites') ?? new Map(),
      lastPlayerGridPosition: readValue(scene, 'lastPlayerGridPosition') ?? null,
      lastPlayerScreenDetail: readValue(scene, 'lastPlayerScreenDetail'),
    }),
    writeRuntimeState: (state) => {
      Reflect.set(scene, 'playerToken', state.playerToken);
      Reflect.set(scene, 'playerNameLabel', state.playerNameLabel);
      Reflect.set(scene, 'playerVitalsIndicator', state.playerVitalsIndicator);
      Reflect.set(scene, 'enemySprites', state.enemySprites);
      Reflect.set(scene, 'npcSprites', state.npcSprites);
      Reflect.set(scene, 'lastPlayerGridPosition', state.lastPlayerGridPosition);
      Reflect.set(scene, 'lastPlayerScreenDetail', state.lastPlayerScreenDetail);
    },
  };
};

const createDefaultRuntimeState = (): EntityRenderRuntimeState => ({
  playerToken: undefined,
  playerNameLabel: undefined,
  playerVitalsIndicator: undefined,
  enemySprites: new Map(),
  npcSprites: new Map(),
  lastPlayerGridPosition: null,
  lastPlayerScreenDetail: undefined,
});

export class EntityRenderModule implements SceneModule<MainScene> {
  readonly key = 'entityRender';

  private readonly ports: EntityRenderModulePorts;

  private runtimeState: EntityRenderRuntimeState;

  constructor(scene: MainScene, ports?: EntityRenderModulePorts) {
    this.ports = ports ?? createEntityRenderModulePorts(scene);
    this.runtimeState = createDefaultRuntimeState();
    this.pullRuntimeStateFromPorts();
    this.pushRuntimeStateToPorts();
  }

  init(): void {}

  onUpdate(): void {
    this.dispatchPlayerScreenPosition();
  }

  onShutdown(): void {
    this.pullRuntimeStateFromPorts();
    this.clearEntities();

    if (this.runtimeState.playerToken) {
      this.runtimeState.playerToken.container.destroy(true);
      this.runtimeState.playerToken = undefined;
    }
    if (this.runtimeState.playerNameLabel) {
      this.runtimeState.playerNameLabel.destroy();
      this.runtimeState.playerNameLabel = undefined;
    }
    this.runtimeState.lastPlayerGridPosition = null;
    this.runtimeState.lastPlayerScreenDetail = undefined;
    this.destroyPlayerVitalsIndicator();
    this.pushRuntimeStateToPorts();
  }

  initializePlayer(position: Position | undefined, playerName: string): boolean {
    this.pullRuntimeStateFromPorts();

    if (!position) {
      return false;
    }

    this.ports.ensureIsoFactory();
    this.runtimeState.playerToken = this.ports.createCharacterToken('player', position.x, position.y);

    const metrics = this.ports.getIsoMetrics();
    const pixelPos = this.ports.calculatePixelPosition(position.x, position.y);
    this.runtimeState.playerNameLabel = this.createCharacterNameLabel(playerName, 0x38bdf8, 14);
    this.positionCharacterLabel(this.runtimeState.playerNameLabel, pixelPos.x, pixelPos.y, metrics.tileHeight * 1.6);
    this.runtimeState.lastPlayerGridPosition = { ...position };
    this.pushRuntimeStateToPorts();
    return true;
  }

  getPlayerTokenContainer(): Phaser.GameObjects.Container | undefined {
    this.pullRuntimeStateFromPorts();
    return this.runtimeState.playerToken?.container;
  }

  getLastPlayerGridPosition(): Position | null {
    this.pullRuntimeStateFromPorts();
    return this.runtimeState.lastPlayerGridPosition;
  }

  getRuntimeStateSnapshot(): EntityRenderRuntimeState {
    this.pullRuntimeStateFromPorts();
    return this.runtimeState;
  }

  updatePlayerPosition(position: Position): void {
    this.pullRuntimeStateFromPorts();

    if (!this.runtimeState.playerToken) {
      console.warn('[MainScene] Player token not available for position update.');
      return;
    }

    const hasPlayerMoved =
      !this.runtimeState.lastPlayerGridPosition ||
      this.runtimeState.lastPlayerGridPosition.x !== position.x ||
      this.runtimeState.lastPlayerGridPosition.y !== position.y;

    this.ports.ensureIsoFactory();
    this.ports.positionCharacterToken(this.runtimeState.playerToken, position.x, position.y);

    const pixelPos = this.ports.calculatePixelPosition(position.x, position.y);
    this.dispatchPlayerScreenPosition();

    if (this.runtimeState.playerNameLabel) {
      const metrics = this.ports.getIsoMetrics();
      this.positionCharacterLabel(this.runtimeState.playerNameLabel, pixelPos.x, pixelPos.y, metrics.tileHeight * 1.6);
    }

    if (hasPlayerMoved) {
      this.runtimeState.lastPlayerGridPosition = { ...position };
      if (!this.ports.isCameraFollowingPlayer()) {
        this.ports.enablePlayerCameraFollow();
      }
    }

    this.pushRuntimeStateToPorts();
  }

  updatePlayerVitalsIndicator(position: Position, health: number, maxHealth: number): void {
    this.pullRuntimeStateFromPorts();

    if (!this.ports.isInCombat()) {
      this.destroyPlayerVitalsIndicator();
      return;
    }

    if (!this.runtimeState.playerToken || !this.ports.sys.isActive()) {
      return;
    }

    const metrics = this.ports.getIsoMetrics();
    const pixelPos = this.ports.calculatePixelPosition(position.x, position.y);
    const barWidth = metrics.tileWidth * 0.38;
    const barHeight = Math.max(4, metrics.tileHeight * 0.08);
    const x = pixelPos.x - barWidth / 2;
    const y = pixelPos.y - metrics.tileHeight * 0.7;
    const percent = maxHealth > 0 ? Math.max(0, Math.min(1, health / maxHealth)) : 0;

    if (!this.runtimeState.playerVitalsIndicator) {
      this.runtimeState.playerVitalsIndicator = this.ports.add.graphics();
    }

    const graphics = this.runtimeState.playerVitalsIndicator;
    graphics.clear();
    graphics.fillStyle(0x0f172a, 0.82);
    graphics.fillRoundedRect(x, y, barWidth, barHeight, Math.min(4, barHeight));

    if (percent > 0) {
      graphics.fillStyle(0x38bdf8, 1);
      graphics.fillRoundedRect(
        x + 1,
        y + 1,
        (barWidth - 2) * percent,
        Math.max(1, barHeight - 2),
        Math.max(2, barHeight - 2)
      );
    }

    this.ports.syncDepth(graphics, pixelPos.x, pixelPos.y, DepthBias.FLOATING_UI + 9);
    this.pushRuntimeStateToPorts();
  }

  destroyPlayerVitalsIndicator(): void {
    this.pullRuntimeStateFromPorts();

    if (this.runtimeState.playerVitalsIndicator) {
      this.runtimeState.playerVitalsIndicator.destroy();
      this.runtimeState.playerVitalsIndicator = undefined;
      this.pushRuntimeStateToPorts();
    }
  }

  updateEnemies(enemies: Enemy[]): void {
    this.pullRuntimeStateFromPorts();

    if (!this.ports.hasMapGraphics() || !this.ports.sys.isActive()) {
      return;
    }

    this.ports.ensureIsoFactory();

    this.runtimeState.enemySprites.forEach((spriteData) => {
      spriteData.markedForRemoval = true;
    });

    const metrics = this.ports.getIsoMetrics();

    for (const enemy of enemies) {
      const existingSpriteData = this.runtimeState.enemySprites.get(enemy.id);
      const pixelPos = this.ports.calculatePixelPosition(enemy.position.x, enemy.position.y);

      if (!existingSpriteData) {
        if (enemy.health <= 0) {
          continue;
        }

        const token = this.ports.createCharacterToken('hostileNpc', enemy.position.x, enemy.position.y);
        const healthBar = this.ports.add.graphics();
        healthBar.setVisible(false);

        const nameLabel = this.createCharacterNameLabel(enemy.name ?? 'Hostile', 0xef4444);
        this.positionCharacterLabel(nameLabel, pixelPos.x, pixelPos.y, metrics.tileHeight * 1.45);

        this.runtimeState.enemySprites.set(enemy.id, {
          token,
          healthBar,
          nameLabel,
          markedForRemoval: false,
        });

        const createdData = this.runtimeState.enemySprites.get(enemy.id);
        if (createdData) {
          this.updateEnemyHealthBar(createdData, pixelPos, metrics, enemy);
        }

        continue;
      }

      if (enemy.health <= 0) {
        existingSpriteData.markedForRemoval = true;
        continue;
      }

      this.ports.positionCharacterToken(existingSpriteData.token, enemy.position.x, enemy.position.y);
      existingSpriteData.markedForRemoval = false;
      this.positionCharacterLabel(existingSpriteData.nameLabel, pixelPos.x, pixelPos.y, metrics.tileHeight * 1.45);

      this.updateEnemyHealthBar(existingSpriteData, pixelPos, metrics, enemy);
    }

    this.runtimeState.enemySprites.forEach((spriteData, id) => {
      if (spriteData.markedForRemoval) {
        spriteData.token.container.destroy(true);
        spriteData.healthBar.destroy();
        spriteData.nameLabel.destroy();
        this.runtimeState.enemySprites.delete(id);
      }
    });

    this.pushRuntimeStateToPorts();
  }

  updateNpcs(npcs: NPC[]): void {
    this.pullRuntimeStateFromPorts();

    if (!this.ports.sys.isActive()) {
      return;
    }

    this.runtimeState.npcSprites.forEach((spriteData) => {
      spriteData.markedForRemoval = true;
    });

    this.ports.ensureIsoFactory();
    const metrics = this.ports.getIsoMetrics();

    for (const npc of npcs) {
      const existingSpriteData = this.runtimeState.npcSprites.get(npc.id);
      const pixelPos = this.ports.calculatePixelPosition(npc.position.x, npc.position.y);

      if (!existingSpriteData) {
        const role = npc.isInteractive ? 'interactiveNpc' : 'friendlyNpc';
        const token = this.ports.createCharacterToken(role, npc.position.x, npc.position.y);

        const nameLabel = this.createCharacterNameLabel(npc.name ?? 'Civilian', npc.isInteractive ? 0x22d3ee : 0x94a3b8);
        this.positionCharacterLabel(nameLabel, pixelPos.x, pixelPos.y, metrics.tileHeight * 1.35);

        const npcData = {
          token,
          nameLabel,
          markedForRemoval: false,
        };

        this.runtimeState.npcSprites.set(npc.id, npcData);
        this.updateNpcCombatIndicator(npcData, pixelPos, metrics, npc);
        continue;
      }

      this.ports.positionCharacterToken(existingSpriteData.token, npc.position.x, npc.position.y);
      existingSpriteData.markedForRemoval = false;
      this.positionCharacterLabel(existingSpriteData.nameLabel, pixelPos.x, pixelPos.y, metrics.tileHeight * 1.35);
      this.updateNpcCombatIndicator(existingSpriteData, pixelPos, metrics, npc);
    }

    this.runtimeState.npcSprites.forEach((spriteData, id) => {
      if (spriteData.markedForRemoval) {
        spriteData.token.container.destroy(true);
        spriteData.nameLabel.destroy();
        if (spriteData.indicator) {
          spriteData.indicator.destroy();
        }
        this.runtimeState.npcSprites.delete(id);
      }
    });

    this.pushRuntimeStateToPorts();
  }

  clearForMapTransition(): void {
    this.pullRuntimeStateFromPorts();
    this.clearEntities();

    this.runtimeState.lastPlayerScreenDetail = undefined;
    this.runtimeState.lastPlayerGridPosition = null;
    this.destroyPlayerVitalsIndicator();
    this.pushRuntimeStateToPorts();
  }

  resetCombatIndicators(): void {
    this.pullRuntimeStateFromPorts();
    this.destroyPlayerVitalsIndicator();
    this.runtimeState.enemySprites.forEach((data) => {
      data.healthBar.clear();
      data.healthBar.setVisible(false);
    });
    this.runtimeState.npcSprites.forEach((data) => {
      if (data.indicator) {
        data.indicator.destroy();
        data.indicator = undefined;
      }
    });
    this.pushRuntimeStateToPorts();
  }

  createCharacterNameLabel(name: string, accentColor: number, fontSize: number = 12): Phaser.GameObjects.Text {
    const label = this.ports.add.text(0, 0, name.toUpperCase(), {
      fontFamily: 'Orbitron, "DM Sans", sans-serif',
      fontSize: `${fontSize}px`,
      fontStyle: '700',
      color: this.colorToHex(0xf8fafc),
      align: 'center',
    });
    label.setOrigin(0.5, 1);
    label.setStroke(this.colorToHex(accentColor), 1.4);
    label.setShadow(0, 0, this.colorToHex(accentColor), 8, true, true);
    label.setBlendMode(Phaser.BlendModes.ADD);
    label.setAlpha(0.95);
    return label;
  }

  positionCharacterLabel(
    label: Phaser.GameObjects.Text,
    pixelX: number,
    pixelY: number,
    verticalOffset: number
  ): void {
    label.setPosition(pixelX, pixelY - verticalOffset);
    label.setDepth(computeDepth(pixelX, pixelY, DepthBias.OVERLAY));
  }

  dispatchPlayerScreenPosition(): void {
    this.pullRuntimeStateFromPorts();

    if (!this.runtimeState.playerToken || !this.ports.sys.isActive()) {
      return;
    }

    const camera = this.ports.cameras.main;
    const container = this.runtimeState.playerToken.container;

    const worldX = container.x;
    const worldY = container.y;
    const screenX = (worldX - camera.worldView.x) * camera.zoom;
    const screenY = (worldY - camera.worldView.y) * camera.zoom;

    const rect = this.ports.game.canvas?.getBoundingClientRect();
    const displayWidth = rect?.width ?? this.ports.scale.width;
    const displayHeight = rect?.height ?? this.ports.scale.height;

    const detail: PlayerScreenPositionDetail = {
      worldX,
      worldY,
      screenX,
      screenY,
      canvasWidth: this.ports.scale.width,
      canvasHeight: this.ports.scale.height,
      canvasDisplayWidth: displayWidth,
      canvasDisplayHeight: displayHeight,
      canvasLeft: rect?.left ?? 0,
      canvasTop: rect?.top ?? 0,
      zoom: camera.zoom,
      timestamp: typeof performance !== 'undefined' ? performance.now() : Date.now(),
    };

    const last = this.runtimeState.lastPlayerScreenDetail;
    if (
      last &&
      Math.abs(last.screenX - detail.screenX) < 0.5 &&
      Math.abs(last.screenY - detail.screenY) < 0.5 &&
      Math.abs(last.zoom - detail.zoom) < 0.0001 &&
      last.canvasWidth === detail.canvasWidth &&
      last.canvasHeight === detail.canvasHeight
    ) {
      return;
    }

    this.runtimeState.lastPlayerScreenDetail = detail;
    this.pushRuntimeStateToPorts();

    if (typeof window !== 'undefined') {
      window.__getawayPlayerScreenPosition = detail;
      window.dispatchEvent(new CustomEvent(PLAYER_SCREEN_POSITION_EVENT, { detail }));
    }
  }

  private updateNpcCombatIndicator(
    data: NonNullable<EntityRenderRuntimeState['npcSprites']> extends Map<string, infer TValue> ? TValue : never,
    pixelPos: { x: number; y: number },
    metrics: { tileWidth: number; tileHeight: number },
    npc: NPC
  ): void {
    if (!this.ports.isInCombat() || !npc.isInteractive) {
      if (data.indicator) {
        data.indicator.destroy();
        data.indicator = undefined;
      }
      return;
    }

    if (!data.indicator) {
      data.indicator = this.ports.add.graphics();
    }

    const graphics = data.indicator;
    const barWidth = metrics.tileWidth * 0.26;
    const barHeight = Math.max(3, metrics.tileHeight * 0.06);
    const x = pixelPos.x - barWidth / 2;
    const y = pixelPos.y - metrics.tileHeight * 0.68;

    graphics.clear();
    graphics.fillStyle(0x102a43, 0.82);
    graphics.fillRoundedRect(x, y, barWidth, barHeight, Math.min(3, barHeight));
    graphics.fillStyle(0x22c55e, 1);
    graphics.fillRoundedRect(
      x + 1,
      y + 1,
      barWidth - 2,
      Math.max(1, barHeight - 2),
      Math.max(2, barHeight - 2)
    );
    this.ports.syncDepth(graphics, pixelPos.x, pixelPos.y, DepthBias.FLOATING_UI + 6);
  }

  private updateEnemyHealthBar(
    data: NonNullable<EntityRenderRuntimeState['enemySprites']> extends Map<string, infer TValue> ? TValue : never,
    pixelPos: { x: number; y: number },
    metrics: { tileWidth: number; tileHeight: number },
    enemy: Enemy
  ): void {
    const graphics = data.healthBar;
    if (!this.ports.isInCombat()) {
      graphics.clear();
      graphics.setVisible(false);
      return;
    }

    graphics.setVisible(true);
    const barWidth = metrics.tileWidth * 0.38;
    const barHeight = Math.max(4, metrics.tileHeight * 0.08);
    const x = pixelPos.x - barWidth / 2;
    const y = pixelPos.y - metrics.tileHeight * 0.75;
    const percent = enemy.maxHealth > 0 ? Phaser.Math.Clamp(enemy.health / enemy.maxHealth, 0, 1) : 0;

    graphics.clear();
    graphics.fillStyle(0x3f1d1d, 0.88);
    graphics.fillRoundedRect(x, y, barWidth, barHeight, Math.min(4, barHeight));

    if (percent > 0) {
      graphics.fillStyle(0xef4444, 1);
      graphics.fillRoundedRect(
        x + 1,
        y + 1,
        (barWidth - 2) * percent,
        Math.max(1, barHeight - 2),
        Math.max(2, barHeight - 2)
      );
    }

    this.ports.syncDepth(graphics, pixelPos.x, pixelPos.y, DepthBias.FLOATING_UI + 7);
  }

  private pullRuntimeStateFromPorts(): void {
    const nextState = this.ports.readRuntimeState?.();
    if (!nextState) {
      return;
    }

    if (nextState.playerToken !== undefined) {
      this.runtimeState.playerToken = nextState.playerToken;
    }
    if (nextState.playerNameLabel !== undefined) {
      this.runtimeState.playerNameLabel = nextState.playerNameLabel;
    }

    this.runtimeState.playerVitalsIndicator = nextState.playerVitalsIndicator;

    if (nextState.enemySprites) {
      this.runtimeState.enemySprites = nextState.enemySprites;
    }
    if (nextState.npcSprites) {
      this.runtimeState.npcSprites = nextState.npcSprites;
    }
    if (nextState.lastPlayerGridPosition !== undefined) {
      this.runtimeState.lastPlayerGridPosition = nextState.lastPlayerGridPosition;
    }
    this.runtimeState.lastPlayerScreenDetail = nextState.lastPlayerScreenDetail;
  }

  private pushRuntimeStateToPorts(): void {
    this.ports.writeRuntimeState?.(this.runtimeState);
  }

  private clearEntities(): void {
    this.runtimeState.enemySprites.forEach((data) => {
      data.token.container.destroy(true);
      data.healthBar.destroy();
      data.nameLabel.destroy();
    });
    this.runtimeState.enemySprites.clear();

    this.runtimeState.npcSprites.forEach((data) => {
      data.token.container.destroy(true);
      data.nameLabel.destroy();
      if (data.indicator) {
        data.indicator.destroy();
        data.indicator = undefined;
      }
    });
    this.runtimeState.npcSprites.clear();
  }

  private colorToHex(color: number): string {
    return `#${color.toString(16).padStart(6, '0')}`;
  }
}
