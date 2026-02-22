import Phaser from 'phaser';
import { Enemy, NPC, Position } from '../../../interfaces/types';
import { PLAYER_SCREEN_POSITION_EVENT, PlayerScreenPositionDetail } from '../../../events';
import { computeDepth, DepthBias } from '../../../utils/depth';
import type { CharacterToken } from '../../../utils/IsoObjectFactory';
import type { VisualTheme } from '../../../visual/contracts';
import type { CharacterRigFactory } from '../../../visual/entities/CharacterRigFactory';
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

type MainSceneEntityInternals = {
  add: Phaser.GameObjects.GameObjectFactory;
  cameras: Phaser.Cameras.Scene2D.CameraManager;
  game: Phaser.Game;
  scale: Phaser.Scale.ScaleManager;
  sys: Phaser.Scenes.Systems;
  visualTheme: VisualTheme;
  characterRigFactory?: CharacterRigFactory;
  playerToken?: CharacterToken;
  playerNameLabel?: Phaser.GameObjects.Text;
  playerVitalsIndicator?: Phaser.GameObjects.Graphics;
  enemySprites: Map<string, EnemySpriteRecord>;
  npcSprites: Map<string, NpcSpriteRecord>;
  inCombat: boolean;
  isCameraFollowingPlayer: boolean;
  lastPlayerGridPosition: Position | null;
  lastPlayerScreenDetail?: PlayerScreenPositionDetail;
  isoFactory?: {
    positionCharacterToken(token: CharacterToken, gridX: number, gridY: number): void;
    createCharacterToken(
      gridX: number,
      gridY: number,
      profile: VisualTheme['entityProfiles'][keyof VisualTheme['entityProfiles']]
    ): CharacterToken;
  };
  mapGraphics?: Phaser.GameObjects.Graphics;
  ensureIsoFactory(): void;
  getIsoMetrics(): { tileWidth: number; tileHeight: number };
  calculatePixelPosition(gridX: number, gridY: number): { x: number; y: number };
  syncDepth(target: Phaser.GameObjects.GameObject, pixelX: number, pixelY: number, bias: number): void;
  enablePlayerCameraFollow(): void;
};

export class EntityRenderModule implements SceneModule<MainScene> {
  readonly key = 'entityRender';

  constructor(private readonly scene: MainScene) {}

  init(): void {}

  updatePlayerPosition(position: Position): void {
    const scene = this.getScene();
    if (!scene.playerToken) {
      console.warn('[MainScene] Player token not available for position update.');
      return;
    }

    const hasPlayerMoved =
      !scene.lastPlayerGridPosition ||
      scene.lastPlayerGridPosition.x !== position.x ||
      scene.lastPlayerGridPosition.y !== position.y;

    scene.ensureIsoFactory();
    if (scene.characterRigFactory) {
      scene.characterRigFactory.positionToken(scene.playerToken, position.x, position.y);
    } else {
      scene.isoFactory!.positionCharacterToken(scene.playerToken, position.x, position.y);
    }

    const pixelPos = scene.calculatePixelPosition(position.x, position.y);
    this.dispatchPlayerScreenPosition();
    if (scene.playerNameLabel) {
      const metrics = scene.getIsoMetrics();
      this.positionCharacterLabel(scene.playerNameLabel, pixelPos.x, pixelPos.y, metrics.tileHeight * 1.6);
    }

    if (hasPlayerMoved) {
      scene.lastPlayerGridPosition = { ...position };
      if (!scene.isCameraFollowingPlayer) {
        scene.enablePlayerCameraFollow();
      }
    }
  }

  updatePlayerVitalsIndicator(position: Position, health: number, maxHealth: number): void {
    const scene = this.getScene();
    if (!scene.inCombat) {
      this.destroyPlayerVitalsIndicator();
      return;
    }

    if (!scene.playerToken || !scene.sys.isActive()) {
      return;
    }

    const metrics = scene.getIsoMetrics();
    const pixelPos = scene.calculatePixelPosition(position.x, position.y);
    const barWidth = metrics.tileWidth * 0.38;
    const barHeight = Math.max(4, metrics.tileHeight * 0.08);
    const x = pixelPos.x - barWidth / 2;
    const y = pixelPos.y - metrics.tileHeight * 0.7;
    const percent = maxHealth > 0 ? Math.max(0, Math.min(1, health / maxHealth)) : 0;

    if (!scene.playerVitalsIndicator) {
      scene.playerVitalsIndicator = scene.add.graphics();
    }

    const graphics = scene.playerVitalsIndicator;
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

    scene.syncDepth(graphics, pixelPos.x, pixelPos.y, DepthBias.FLOATING_UI + 9);
  }

  destroyPlayerVitalsIndicator(): void {
    const scene = this.getScene();
    if (scene.playerVitalsIndicator) {
      scene.playerVitalsIndicator.destroy();
      scene.playerVitalsIndicator = undefined;
    }
  }

  updateEnemies(enemies: Enemy[]): void {
    const scene = this.getScene();
    if (!scene.mapGraphics || !scene.sys.isActive()) {
      return;
    }

    scene.ensureIsoFactory();

    scene.enemySprites.forEach((spriteData) => {
      spriteData.markedForRemoval = true;
    });

    const metrics = scene.getIsoMetrics();

    for (const enemy of enemies) {
      const existingSpriteData = scene.enemySprites.get(enemy.id);
      const pixelPos = scene.calculatePixelPosition(enemy.position.x, enemy.position.y);

      if (!existingSpriteData) {
        if (enemy.health <= 0) {
          continue;
        }

        const token = scene.characterRigFactory
          ? scene.characterRigFactory.createToken('hostileNpc', enemy.position.x, enemy.position.y)
          : scene.isoFactory!.createCharacterToken(
              enemy.position.x,
              enemy.position.y,
              scene.visualTheme.entityProfiles.hostileNpc
            );

        const healthBar = scene.add.graphics();
        healthBar.setVisible(false);

        const nameLabel = this.createCharacterNameLabel(enemy.name ?? 'Hostile', 0xef4444);
        this.positionCharacterLabel(nameLabel, pixelPos.x, pixelPos.y, metrics.tileHeight * 1.45);

        scene.enemySprites.set(enemy.id, {
          token,
          healthBar,
          nameLabel,
          markedForRemoval: false,
        });

        const createdData = scene.enemySprites.get(enemy.id);
        if (createdData) {
          this.updateEnemyHealthBar(createdData, pixelPos, metrics, enemy);
        }

        continue;
      }

      if (enemy.health <= 0) {
        existingSpriteData.markedForRemoval = true;
        continue;
      }

      if (scene.characterRigFactory) {
        scene.characterRigFactory.positionToken(existingSpriteData.token, enemy.position.x, enemy.position.y);
      } else {
        scene.isoFactory!.positionCharacterToken(existingSpriteData.token, enemy.position.x, enemy.position.y);
      }
      existingSpriteData.markedForRemoval = false;
      this.positionCharacterLabel(existingSpriteData.nameLabel, pixelPos.x, pixelPos.y, metrics.tileHeight * 1.45);

      this.updateEnemyHealthBar(existingSpriteData, pixelPos, metrics, enemy);
    }

    scene.enemySprites.forEach((spriteData, id) => {
      if (spriteData.markedForRemoval) {
        spriteData.token.container.destroy(true);
        spriteData.healthBar.destroy();
        spriteData.nameLabel.destroy();
        scene.enemySprites.delete(id);
      }
    });
  }

  updateNpcs(npcs: NPC[]): void {
    const scene = this.getScene();
    if (!scene.sys.isActive()) {
      return;
    }

    scene.npcSprites.forEach((spriteData) => {
      spriteData.markedForRemoval = true;
    });

    scene.ensureIsoFactory();
    const metrics = scene.getIsoMetrics();

    for (const npc of npcs) {
      const existingSpriteData = scene.npcSprites.get(npc.id);
      const pixelPos = scene.calculatePixelPosition(npc.position.x, npc.position.y);

      if (!existingSpriteData) {
        const role = npc.isInteractive ? 'interactiveNpc' : 'friendlyNpc';
        const token = scene.characterRigFactory
          ? scene.characterRigFactory.createToken(role, npc.position.x, npc.position.y)
          : scene.isoFactory!.createCharacterToken(
              npc.position.x,
              npc.position.y,
              scene.visualTheme.entityProfiles[role]
            );

        const nameLabel = this.createCharacterNameLabel(npc.name ?? 'Civilian', npc.isInteractive ? 0x22d3ee : 0x94a3b8);
        this.positionCharacterLabel(nameLabel, pixelPos.x, pixelPos.y, metrics.tileHeight * 1.35);

        const npcData: NpcSpriteRecord = {
          token,
          nameLabel,
          markedForRemoval: false,
        };

        scene.npcSprites.set(npc.id, npcData);
        this.updateNpcCombatIndicator(npcData, pixelPos, metrics, npc);
        continue;
      }

      if (scene.characterRigFactory) {
        scene.characterRigFactory.positionToken(existingSpriteData.token, npc.position.x, npc.position.y);
      } else {
        scene.isoFactory!.positionCharacterToken(existingSpriteData.token, npc.position.x, npc.position.y);
      }
      existingSpriteData.markedForRemoval = false;
      this.positionCharacterLabel(existingSpriteData.nameLabel, pixelPos.x, pixelPos.y, metrics.tileHeight * 1.35);
      this.updateNpcCombatIndicator(existingSpriteData, pixelPos, metrics, npc);
    }

    scene.npcSprites.forEach((spriteData, id) => {
      if (spriteData.markedForRemoval) {
        spriteData.token.container.destroy(true);
        spriteData.nameLabel.destroy();
        if (spriteData.indicator) {
          spriteData.indicator.destroy();
        }
        scene.npcSprites.delete(id);
      }
    });
  }

  createCharacterNameLabel(name: string, accentColor: number, fontSize: number = 12): Phaser.GameObjects.Text {
    const scene = this.getScene();
    const label = scene.add.text(0, 0, name.toUpperCase(), {
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
    const scene = this.getScene();
    if (!scene.playerToken || !scene.sys.isActive()) {
      return;
    }

    const camera = scene.cameras.main;
    const container = scene.playerToken.container;

    const worldX = container.x;
    const worldY = container.y;
    const screenX = (worldX - camera.worldView.x) * camera.zoom;
    const screenY = (worldY - camera.worldView.y) * camera.zoom;

    const rect = scene.game.canvas?.getBoundingClientRect();
    const displayWidth = rect?.width ?? scene.scale.width;
    const displayHeight = rect?.height ?? scene.scale.height;

    const detail: PlayerScreenPositionDetail = {
      worldX,
      worldY,
      screenX,
      screenY,
      canvasWidth: scene.scale.width,
      canvasHeight: scene.scale.height,
      canvasDisplayWidth: displayWidth,
      canvasDisplayHeight: displayHeight,
      canvasLeft: rect?.left ?? 0,
      canvasTop: rect?.top ?? 0,
      zoom: camera.zoom,
      timestamp: typeof performance !== 'undefined' ? performance.now() : Date.now(),
    };

    const last = scene.lastPlayerScreenDetail;
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

    scene.lastPlayerScreenDetail = detail;
    if (typeof window !== 'undefined') {
      window.__getawayPlayerScreenPosition = detail;
      window.dispatchEvent(new CustomEvent(PLAYER_SCREEN_POSITION_EVENT, { detail }));
    }
  }

  private updateNpcCombatIndicator(
    data: NpcSpriteRecord,
    pixelPos: { x: number; y: number },
    metrics: { tileWidth: number; tileHeight: number },
    npc: NPC
  ): void {
    const scene = this.getScene();
    if (!scene.inCombat || !npc.isInteractive) {
      if (data.indicator) {
        data.indicator.destroy();
        data.indicator = undefined;
      }
      return;
    }

    if (!data.indicator) {
      data.indicator = scene.add.graphics();
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
    scene.syncDepth(graphics, pixelPos.x, pixelPos.y, DepthBias.FLOATING_UI + 6);
  }

  private updateEnemyHealthBar(
    data: EnemySpriteRecord,
    pixelPos: { x: number; y: number },
    metrics: { tileWidth: number; tileHeight: number },
    enemy: Enemy
  ): void {
    const scene = this.getScene();
    const graphics = data.healthBar;
    if (!scene.inCombat) {
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

    scene.syncDepth(graphics, pixelPos.x, pixelPos.y, DepthBias.FLOATING_UI + 7);
  }

  private colorToHex(color: number): string {
    return `#${color.toString(16).padStart(6, '0')}`;
  }

  private getScene(): MainSceneEntityInternals {
    return this.scene as unknown as MainSceneEntityInternals;
  }
}
