import Phaser from 'phaser';
import { LEVEL0_LAYOUT_CONTRACT } from '../../../content/levels/level0/layoutContract';
import {
  CHARACTER_SPRITE_MANIFEST_BY_ID,
  NON_WORLD_CHARACTER_PRESENTATIONS,
  getCharacterSpriteAnimationKey,
  getCharacterSpriteTextureKey,
  resolvePlayerSpriteSetId,
  type CharacterSpriteDirection,
  type CharacterSpriteState,
} from '../../../content/characters/spriteManifest';
import {
  areCharacterSpriteSheetRefsLoaded,
  preloadCharacterSpriteSheetRefs,
  registerCharacterSpriteSheetAnimations,
  type CharacterSpriteSheetRef,
} from '../../visual/entities/characterSpriteAssets';
import type { Level0Anchor, WorldPoint, WorldPolygon } from '../layout/types';
import { LEVEL0_PLAYER_CLEARANCE_RADIUS } from '../layout/constants';
import { createLevel0Projection } from '../layout/projection';
import {
  createIdleMovementState,
  resolveClickIntent,
  resolveIsometricKeyboardIntent,
  stepDirectMovement,
  LEVEL0_DIRECT_MOVEMENT_SPEED,
  type DirectMovementState,
  type KeyboardInputState,
} from '../movement/directMovement';
import type { Level0RunState } from '../runtime/types';
import { isLevel0AnchorKnown } from '../runtime/mapKnowledge';
import {
  LEVEL0_AGENT_MOVE_EVENT,
  LEVEL0_AGENT_MOVE_RESULT_EVENT,
} from '../playtest/events';
import type {
  Level0AgentMoveDetail,
  Level0AgentMoveResultDetail,
} from '../playtest/events';
import {
  LEVEL0_CONTACT_ACTOR_PRESENTATIONS,
  LEVEL0_ACTOR_INTERACTION_DURATION_MS,
  LEVEL0_ACTOR_INTERACTION_PRESENTATION_EVENT,
  type Level0ActorInteractionPresentationDetail,
  resolveLevel0GeorgeWorldPresentation,
  resolveLevel0ActorSpriteSheetRefs,
  resolveLevel0PlayerSpriteState,
  resolveLevel0SceneSpriteSheetRefs,
  resolveLevel0SpriteDirection,
} from './level0ActorPresentation';
import {
  GET204_CITY_MOVEMENT_CONTRACT,
  resolveGet204CityInitialZoom,
  resolveGet204CityLayerTopLeft,
  resolveGet204CityOverviewBounds,
  resolveGet204CityOverviewFitZoom,
  resolveGet204CityWorldViewBlend,
} from '../art/get204City';
import {
  GET205_HIDZU_SCHEDULE_TREATMENTS,
  isGet205RuntimeVisual,
  LEVEL0_RUNTIME_VISUAL as activeVisual,
} from '../art/get205HidzuRuntime';
import {
  crowdStateAt,
  LEVEL0_SHUTTER_DOORS,
  shutterOverlayAlphaAt,
  lastTrainCadenceActiveAt,
  STREET_STAGE_ATMOSPHERE_MULTIPLIER,
  streetStageAt,
  type StreetStage,
} from '../city/streetMoments';
import {
  getLevel0LoopDisplayName,
  LEVEL0_LOOP_SIGNAGE,
} from '../city/routeNames';
import { playLevel0FeedbackCue } from '../../feedback/audioCues';
import {
  CIVILIAN_PHASE_PRESENTATION,
  civilianGroupPhaseAt,
  GET204_CROWD_HIDDEN_ACTOR_IDS,
  LEVEL0_CIVILIAN_GROUPS,
} from '../city/civilianSchedules';
import {
  LEVEL0_AMBIENCE_EMITTERS,
  Level0ThresholdAmbience,
  type AmbienceEmitterId,
} from '../audio/thresholdAmbience';

export const LEVEL0_SCENE_KEY = 'Level0RuntimeScene';
export const LEVEL0_MIN_ZOOM = 0.5;
export const LEVEL0_MAX_ZOOM = activeVisual.maxZoom;
const LEVEL0_GEORGE_TEXTURE_KEY = 'level0:george-ar:idle';
const GET205_ATMOSPHERE_COLORS: Record<Level0RunState['worldClock']['phase'], number> = {
  dusk: 0x3b2418,
  'blue-hour': 0x102638,
  curfew: 0x07111c,
};

export interface Level0SceneRuntime {
  getRun(): Level0RunState | null;
  getLocale(): 'en' | 'uk';
  onSceneReady(ready: boolean): void;
  isMovementPaused(): boolean;
  isObservationActive(): boolean;
  isGeorgePresentationVisible(): boolean;
  onPlayerCheckpoint(position: WorldPoint, facing: WorldPoint): void;
  onFeedback(feedbackId: string): void;
  onInteraction(anchorId?: string): void;
  onObservationToggle(): void;
}

interface KeyboardControls {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
  E: Phaser.Input.Keyboard.Key;
  O: Phaser.Input.Keyboard.Key;
}

type AnchorVisual = Phaser.GameObjects.Graphics | Phaser.GameObjects.Text;

interface Level0SceneActorVisual {
  actorId: string;
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite | null;
  directionMarker: Phaser.GameObjects.Triangle | null;
}

const contract = LEVEL0_LAYOUT_CONTRACT;
const movementContract = GET204_CITY_MOVEMENT_CONTRACT;
const origin = {
  x: Math.ceil(Math.max(...contract.bounds.map((point) => point.y))) *
      (contract.projection.tileWidth / 2) +
    240,
  y: 180,
};
const projection = createLevel0Projection(contract.projection, origin);

const project = (point: WorldPoint): Phaser.Math.Vector2 => {
  const scenePoint = projection.layoutToScene(point);
  return new Phaser.Math.Vector2(scenePoint.x, scenePoint.y);
};

const average = (points: readonly Phaser.Math.Vector2[]): Phaser.Math.Vector2 => {
  const count = Math.max(1, points.length);
  return new Phaser.Math.Vector2(
    points.reduce((sum, point) => sum + point.x, 0) / count,
    points.reduce((sum, point) => sum + point.y, 0) / count
  );
};

const labelForAnchor = (anchor: Level0Anchor): string => {
  const labels: Record<string, string> = {
    'safehouse.spawn': 'SAFEHOUSE',
    'safehouse.departure': 'DEPART',
    'contact.lira': 'LIRA',
    'contact.naila': 'NAILA',
    'contact.brant': 'BRANT',
    'entrance.logistics.public': 'PUBLIC ENTRY',
    'entrance.logistics.service': 'SERVICE ENTRY',
    'terminal.camera_loop': 'CAMERA TERMINAL',
    'terminal.cache_locker': 'CACHE TERMINAL',
    'terminal.outbound_transit': 'TRANSIT TERMINAL',
    'objective.medkits': 'MEDKITS',
    'objective.manifest': 'MANIFEST',
    'interaction.safehouse.wait': 'WAIT',
    'interaction.safehouse.rest': 'REST',
  };
  return labels[anchor.id] ?? anchor.kind.toUpperCase();
};

const colorForAnchor = (anchor: Level0Anchor): number => {
  switch (anchor.kind) {
    case 'camera':
    case 'terminal':
      return 0x4eb3bd;
    case 'objective':
    case 'entrance':
      return 0xd59a45;
    case 'contact':
      return 0xcfc4aa;
    case 'hiding':
    case 'blending':
      return 0x5f827c;
    case 'drone-launch':
      return 0xa54343;
    default:
      return 0x9b876d;
  }
};

const polygonMaxY = (polygon: WorldPolygon): number =>
  Math.max(...polygon.map((point) => projection.layoutToScene(point).y));

const getGate1PopulationSpriteSheetRefs = () =>
  activeVisual.population.flatMap((actor) => actor.spriteSetId
    ? [{ spriteSetId: actor.spriteSetId, state: 'idle' as const, direction: actor.facing }]
    : []
  );

const getCityCivilianSpriteSheetRefs = (): CharacterSpriteSheetRef[] =>
  Object.values(LEVEL0_CIVILIAN_GROUPS).flatMap((group) =>
    group.members.map((member) => ({
      spriteSetId: member.spriteSetId,
      state: 'idle' as const,
      direction: member.facing,
    }))
  );

const AMBIENCE_EMITTER_POSITIONS: Array<{
  id: AmbienceEmitterId;
  x: number;
  y: number;
  radius: number;
}> = Object.values(LEVEL0_AMBIENCE_EMITTERS).flatMap((definition) => {
  const anchor = LEVEL0_LAYOUT_CONTRACT.anchors.find(
    (candidate) => candidate.id === definition.anchorId
  );
  return anchor
    ? [{ id: definition.id, x: anchor.position.x, y: anchor.position.y, radius: anchor.radius }]
    : [];
});

export class Level0Scene extends Phaser.Scene {
  private readonly runtime: Level0SceneRuntime;

  private movement: DirectMovementState | null = null;

  private keys: KeyboardControls | null = null;

  private playerMarker: Phaser.GameObjects.Container | null = null;

  private playerSprite: Phaser.GameObjects.Sprite | null = null;

  private playerDirection: Phaser.GameObjects.Triangle | null = null;

  private playerOverviewMarker: Phaser.GameObjects.Graphics | null = null;

  private georgePresentation: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics | null = null;

  private playerInteractionUntil = 0;

  private readonly contactInteractionUntil = new Map<string, number>();

  private targetMarker: Phaser.GameObjects.Graphics | null = null;

  private reachableMarker: Phaser.GameObjects.Graphics | null = null;

  private lastCheckpointAt = 0;

  private lastCheckpoint: { position: WorldPoint; facing: WorldPoint } | null = null;

  private collisionBlocked = false;

  private readonly anchorVisuals = new Map<string, AnchorVisual[]>();

  private readonly contactActors = new Map<string, Level0SceneActorVisual>();

  private readonly gate1PopulationActors = new Map<string, Level0SceneActorVisual>();

  private readonly cityCivilianActors = new Map<string, Level0SceneActorVisual>();

  private ambience: Level0ThresholdAmbience | null = null;

  private readonly get204WorldLayers = new Map<
    'close' | 'overview',
    Phaser.GameObjects.Image[]
  >();

  private scheduleAtmosphere: Phaser.GameObjects.Rectangle | null = null;

  private activeSchedulePhase: Level0RunState['worldClock']['phase'] | null = null;

  private activeStreetStage: StreetStage | null = null;

  private readonly shutterOverlays = new Map<string, Phaser.GameObjects.Graphics>();

  private readonly loopSignageTexts = new Map<string, Phaser.GameObjects.Text>();

  private signageLocaleUkrainian: boolean | null = null;

  private lastTrainCadenceCueAt = 0;

  private minimumZoom = LEVEL0_MIN_ZOOM;

  private pointerDownAt: { x: number; y: number; cameraX: number; cameraY: number } | null = null;

  private pointerDragged = false;

  constructor(runtime: Level0SceneRuntime) {
    super({ key: LEVEL0_SCENE_KEY });
    this.runtime = runtime;
  }

  preload(): void {
    const run = this.runtime.getRun();
    if (!run) return;
    const spriteSheetRefs = [
      ...resolveLevel0SceneSpriteSheetRefs(run.identity.appearancePresetId),
      ...getGate1PopulationSpriteSheetRefs(),
      ...getCityCivilianSpriteSheetRefs(),
    ];
    preloadCharacterSpriteSheetRefs(
      this,
      spriteSheetRefs
    );
    activeVisual.layers.forEach((layer) => {
      this.load.image(layer.textureKey, layer.path);
    });
    this.load.image(
      LEVEL0_GEORGE_TEXTURE_KEY,
      NON_WORLD_CHARACTER_PRESENTATIONS.georgeAr.path
    );
  }

  create(): void {
    const run = this.runtime.getRun();
    if (!run) {
      throw new Error('Level 0 scene cannot start without an active run');
    }

    registerCharacterSpriteSheetAnimations(this, [
      ...resolveLevel0SceneSpriteSheetRefs(run.identity.appearancePresetId),
      ...getGate1PopulationSpriteSheetRefs(),
      ...getCityCivilianSpriteSheetRefs(),
    ]);
    this.movement = createIdleMovementState(run.player.position);
    this.movement.facing = { ...run.player.facing };
    this.drawWorld();
    this.createScheduleTreatment(run);
    this.syncAnchorKnowledge(run);
    this.createPlayerMarker(run);
    this.createContactActors();
    this.createGate1PopulationActors();
    this.createCityCivilianActors();
    this.createLoopSignage();
    this.createShutterOverlays();
    this.createIntentMarkers();
    this.configureCamera(run.player.position);
    this.createGeorgePresentation();
    this.configureInput();
    this.ambience = new Level0ThresholdAmbience();
    this.runtime.onSceneReady(true);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.teardownInput();
      this.ambience?.dispose();
      this.ambience = null;
      this.runtime.onSceneReady(false);
    });
  }

  update(_time: number, delta: number): void {
    if (!this.movement || !this.keys) return;

    const external = this.runtime.getRun()?.player;
    if (
      external &&
      Math.hypot(
        external.position.x - this.movement.position.x,
        external.position.y - this.movement.position.y
      ) > 2
    ) {
      this.movement = {
        position: { ...external.position },
        facing: { ...external.facing },
        intent: { kind: 'idle' },
      };
    }

    const keyboardInput = this.readKeyboardInput();
    const keyboardActive = Object.values(keyboardInput).some(Boolean);
    const interactionActive = this.time.now < this.playerInteractionUntil;
    if (!this.runtime.isMovementPaused() && !interactionActive) {
      if (keyboardActive || this.movement.intent.kind === 'keyboard') {
        this.movement = resolveIsometricKeyboardIntent(this.movement, keyboardInput);
      }
      const step = stepDirectMovement(movementContract, this.movement, Math.min(delta, 50) / 1_000, {
        speed: LEVEL0_DIRECT_MOVEMENT_SPEED,
        collisionRadius: LEVEL0_PLAYER_CLEARANCE_RADIUS,
        arrivalRadius: 0.12,
      });
      this.movement = {
        position: step.position,
        facing: step.facing,
        intent: step.intent,
      };
      const fullyBlocked = Boolean(step.collision?.blockedX && step.collision?.blockedY);
      if (fullyBlocked && !this.collisionBlocked) {
        this.runtime.onFeedback('movement.blocked');
      }
      this.collisionBlocked = fullyBlocked;
    }

    const currentRun = this.runtime.getRun();
    if (currentRun) {
      this.renderCityCivilians(currentRun);
      this.renderCrowdThinning(currentRun);
      this.renderStreetPresentation(currentRun);
    }
    this.renderMovementState();
    this.renderGet204WorldView();
    this.followPlayerUnlessObserving();
    this.renderGeorgePresentation();
    if (currentRun) {
      this.updateThresholdAmbience(currentRun);
      this.renderScheduleTreatment(currentRun);
      this.syncAnchorKnowledge(currentRun);
    }

    this.lastCheckpointAt += delta;
    if (this.lastCheckpointAt >= 250) {
      this.lastCheckpointAt = 0;
      const changed = !this.lastCheckpoint ||
        Math.hypot(
          this.lastCheckpoint.position.x - this.movement.position.x,
          this.lastCheckpoint.position.y - this.movement.position.y
        ) > 0.01 ||
        Math.hypot(
          this.lastCheckpoint.facing.x - this.movement.facing.x,
          this.lastCheckpoint.facing.y - this.movement.facing.y
        ) > 0.01;
      if (changed) {
        this.lastCheckpoint = {
          position: { ...this.movement.position },
          facing: { ...this.movement.facing },
        };
        this.runtime.onPlayerCheckpoint(this.movement.position, this.movement.facing);
      }
    }
  }

  getRuntimeSnapshot(): {
    position: WorldPoint;
    facing: WorldPoint;
    movementIntent: DirectMovementState['intent'];
    camera: { scrollX: number; scrollY: number; zoom: number };
  } | null {
    if (!this.movement) return null;
    return {
      position: { ...this.movement.position },
      facing: { ...this.movement.facing },
      movementIntent: this.movement.intent,
      camera: {
        scrollX: this.cameras.main.scrollX,
        scrollY: this.cameras.main.scrollY,
        zoom: this.cameras.main.zoom,
      },
    };
  }

  private drawWorld(): void {
    if (activeVisual.runtimeEnabled) {
      this.drawGate1Art();
    } else {
      const ground = this.add.graphics().setDepth(0);
      ground.fillStyle(0x17191d, 1);
      ground.fillPoints(contract.bounds.map(project), true);
      ground.lineStyle(5, 0x60594f, 0.9);
      ground.strokePoints(contract.bounds.map(project), true);

      const orderedSurfaces = [...contract.surfaces].sort((a, b) => {
        const priority: Record<string, number> = {
          road: 0,
          alley: 1,
          sidewalk: 2,
          crossing: 3,
          plaza: 4,
        };
        return (priority[a.kind] ?? 5) - (priority[b.kind] ?? 5);
      });
      orderedSurfaces.forEach((surface) => {
        const graphics = this.add.graphics().setDepth(2 + polygonMaxY(surface.polygon) / 10_000);
        const fill = surface.kind === 'road'
          ? 0x25282d
          : surface.kind === 'alley'
            ? 0x202329
            : 0x343337;
        graphics.fillStyle(fill, 1);
        graphics.fillPoints(surface.polygon.map(project), true);
        graphics.lineStyle(1, 0x6e675d, surface.kind === 'plaza' ? 0.65 : 0.3);
        graphics.strokePoints(surface.polygon.map(project), true);
      });

      contract.traversalLoops.forEach((loop, index) => {
        const graphics = this.add.graphics().setDepth(4);
        graphics.lineStyle(3, [0xa0743d, 0x557b76, 0x6f6252][index] ?? 0x6f6252, 0.32);
        graphics.strokePoints(loop.points.map(project), false);
      });

      contract.buildingFootprints.forEach((footprint, index) => {
          this.drawBuilding(footprint.polygon, footprint.height, index);
      });
    }

    contract.anchors.forEach((anchor) => {
      const visuals = this.drawAnchor(anchor);
      if (visuals.length > 0) this.anchorVisuals.set(anchor.id, visuals);
    });
  }

  private drawGate1Art(): void {
    activeVisual.layers.forEach((layer) => {
      if (!this.textures.exists(layer.textureKey)) return;
      const textureKey = layer.view === 'close'
        ? this.createFeatheredCloseTexture(layer.textureKey, layer.width, layer.height)
        : layer.textureKey;
      const targetScene = projection.layoutToScene(layer.targetLayout);
      const topLeft = resolveGet204CityLayerTopLeft(targetScene, layer);
      const image = this.add
        .image(topLeft.x, topLeft.y, textureKey)
        .setOrigin(0, 0)
        .setScale(1 / layer.renderZoom)
        .setDepth(layer.depth)
        .setData('get204CityLayerId', layer.id);
      const viewLayers = this.get204WorldLayers.get(layer.view) ?? [];
      viewLayers.push(image);
      this.get204WorldLayers.set(layer.view, viewLayers);
    });
  }

  private createScheduleTreatment(run: Level0RunState): void {
    if (!isGet205RuntimeVisual(activeVisual)) return;
    this.scheduleAtmosphere = this.add
      .rectangle(0, 0, 1, 1, GET205_ATMOSPHERE_COLORS[run.worldClock.phase], 0)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(7_000);
    this.renderScheduleTreatment(run);
  }

  private renderScheduleTreatment(run: Level0RunState): void {
    if (!this.scheduleAtmosphere || !isGet205RuntimeVisual(activeVisual)) return;
    const phase = run.worldClock.phase;
    const stage = streetStageAt(run.worldClock.currentMinute);
    const treatment = GET205_HIDZU_SCHEDULE_TREATMENTS[phase];
    if (this.activeSchedulePhase !== phase || this.activeStreetStage !== stage) {
      this.get204WorldLayers.forEach((layers) => {
        layers.forEach((layer) => layer.setTint(treatment.tint));
      });
      this.scheduleAtmosphere.setFillStyle(
        GET205_ATMOSPHERE_COLORS[phase],
        Math.min(1, treatment.atmosphereAlpha * STREET_STAGE_ATMOSPHERE_MULTIPLIER[stage])
      );
      this.activeSchedulePhase = phase;
      this.activeStreetStage = stage;
    }
    this.scheduleAtmosphere.setDisplaySize(this.scale.width, this.scale.height);
  }

  private createFeatheredCloseTexture(
    sourceTextureKey: string,
    width: number,
    height: number
  ): string {
    const featheredTextureKey = `${sourceTextureKey}:feathered`;
    if (this.textures.exists(featheredTextureKey)) return featheredTextureKey;

    const texture = this.textures.createCanvas(featheredTextureKey, width, height);
    if (!texture) return sourceTextureKey;

    const context = texture.getContext();
    const sourceImage = this.textures.get(sourceTextureKey).getSourceImage() as CanvasImageSource;
    context.drawImage(sourceImage, 0, 0, width, height);
    context.globalCompositeOperation = 'destination-in';

    const horizontal = context.createLinearGradient(0, 0, width, 0);
    horizontal.addColorStop(0, 'rgba(0, 0, 0, 0)');
    horizontal.addColorStop(0.12, 'rgba(0, 0, 0, 1)');
    horizontal.addColorStop(0.88, 'rgba(0, 0, 0, 1)');
    horizontal.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = horizontal;
    context.fillRect(0, 0, width, height);

    const vertical = context.createLinearGradient(0, 0, 0, height);
    vertical.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vertical.addColorStop(0.12, 'rgba(0, 0, 0, 1)');
    vertical.addColorStop(0.88, 'rgba(0, 0, 0, 1)');
    vertical.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = vertical;
    context.fillRect(0, 0, width, height);

    context.globalCompositeOperation = 'source-over';
    texture.refresh();
    return featheredTextureKey;
  }

  private drawBuilding(polygon: WorldPolygon, height: number, index: number): void {
    const base = polygon.map(project);
    const verticalOffset = Math.max(32, height * 11);
    const roof = base.map((point) => new Phaser.Math.Vector2(point.x, point.y - verticalOffset));
    const depth = 100 + Math.max(...base.map((point) => point.y));
    const graphics = this.add.graphics().setDepth(depth);

    graphics.fillStyle(index % 3 === 0 ? 0x4a433b : index % 3 === 1 ? 0x45484a : 0x3d4145, 1);
    graphics.fillPoints([roof[1]!, base[1]!, base[2]!, roof[2]!], true);
    graphics.fillStyle(index % 3 === 0 ? 0x393632 : 0x34383b, 1);
    graphics.fillPoints([roof[2]!, base[2]!, base[3]!, roof[3]!], true);
    graphics.fillStyle(index % 3 === 0 ? 0x686057 : 0x5b5b58, 1);
    graphics.fillPoints(roof, true);
    graphics.lineStyle(2, 0x18191b, 0.9);
    graphics.strokePoints(roof, true);
    graphics.lineBetween(roof[1]!.x, roof[1]!.y, base[1]!.x, base[1]!.y);
    graphics.lineBetween(roof[2]!.x, roof[2]!.y, base[2]!.x, base[2]!.y);
    graphics.lineBetween(roof[3]!.x, roof[3]!.y, base[3]!.x, base[3]!.y);

    const center = average(roof);
    this.add
      .text(center.x, center.y, index === 3 ? 'HIDZU LOGISTICS' : `BLOCK ${index + 1}`, {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: index === 3 ? '#d1a052' : '#a9a399',
        backgroundColor: '#17191ddd',
        padding: { x: 5, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(depth + 1);
  }

  private drawAnchor(anchor: Level0Anchor): AnchorVisual[] {
    if (anchor.id === 'safehouse.boundary') {
      const center = projection.layoutToScene(anchor.position);
      const graphics = this.add.graphics().setDepth(12);
      graphics.lineStyle(3, 0xc18d4f, 0.55);
      graphics.strokeEllipse(
        center.x,
        center.y,
        anchor.radius * contract.projection.tileWidth,
        anchor.radius * contract.projection.tileHeight
      );
      return [graphics];
    }
    if (anchor.kind === 'contact') return [];
    if (anchor.kind === 'audio') return [];

    const position = projection.layoutToScene(anchor.position);
    const color = colorForAnchor(anchor);
    const graphics = this.add.graphics().setDepth(10_000);
    graphics.fillStyle(0x111317, 0.9);
    graphics.fillCircle(position.x, position.y, 9);
    graphics.lineStyle(3, color, 0.95);
    graphics.strokeCircle(position.x, position.y, 9);

    const shouldLabel = !activeVisual.runtimeEnabled &&
      !['camera', 'hiding', 'blending', 'drone-launch'].includes(anchor.kind);
    const visuals: AnchorVisual[] = [graphics];
    if (shouldLabel) {
      const label = this.add
        .text(position.x, position.y - 18, labelForAnchor(anchor), {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: `#${color.toString(16).padStart(6, '0')}`,
          backgroundColor: '#111317dd',
          padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5, 1)
        .setDepth(10_001);
      visuals.push(label);
    }
    return visuals;
  }

  private syncAnchorKnowledge(run: Level0RunState): void {
    contract.anchors.forEach((anchor) => {
      const visible = isLevel0AnchorKnown(run, anchor);
      this.anchorVisuals.get(anchor.id)?.forEach((visual) => visual.setVisible(visible));
    });
  }

  private createPlayerMarker(run: Level0RunState): void {
    const spriteSetId = resolvePlayerSpriteSetId(run.identity.appearancePresetId);
    const visual = this.createActorVisual(
      run.identity.appearancePresetId,
      spriteSetId,
      resolveLevel0SpriteDirection(run.player.facing)
    );
    this.playerMarker = visual.container;
    this.playerSprite = visual.sprite;
    this.playerDirection = visual.directionMarker;
    this.playerOverviewMarker = this.add.graphics();
    this.playerOverviewMarker.lineStyle(2, 0xd2c6a9, 0.95);
    this.playerOverviewMarker.strokeCircle(0, 0, 14);
    this.playerOverviewMarker.fillStyle(0x5f9da2, 0.95);
    this.playerOverviewMarker.fillCircle(0, 0, 3);
    this.renderMovementState();
  }

  private createContactActors(): void {
    LEVEL0_CONTACT_ACTOR_PRESENTATIONS.forEach((presentation) => {
      const visual = this.createActorVisual(
        presentation.actorId,
        presentation.actorId,
        presentation.facing
      );
      const scenePosition = projection.layoutToScene(presentation.position);
      visual.container
        .setPosition(scenePosition.x, scenePosition.y)
        .setDepth(100 + scenePosition.y);
      this.playActorAnimation(visual.sprite, presentation.actorId, 'idle', presentation.facing);
      this.contactActors.set(presentation.actorId, visual);
    });
  }

  private createGate1PopulationActors(): void {
    activeVisual.population.forEach((presentation) => {
      const visual = presentation.kind === 'drone'
        ? this.createGate1DroneVisual(presentation.id)
        : this.createActorVisual(
            presentation.id,
            presentation.spriteSetId,
            presentation.facing,
            presentation.spriteSetId
              ? [{
                  spriteSetId: presentation.spriteSetId,
                  state: 'idle',
                  direction: presentation.facing,
                }]
              : undefined
          );
      const scenePosition = projection.layoutToScene(presentation.position);
      visual.container
        .setPosition(scenePosition.x, scenePosition.y)
        .setDepth(100 + scenePosition.y)
        .setData('get204WorldScaleMultiplier', presentation.worldScaleMultiplier);
      if (presentation.spriteSetId) {
        this.playActorAnimation(
          visual.sprite,
          presentation.spriteSetId,
          'idle',
          presentation.facing
        );
      }
      this.gate1PopulationActors.set(presentation.id, visual);
    });
  }

  private createCityCivilianActors(): void {
    Object.values(LEVEL0_CIVILIAN_GROUPS).forEach((group) => {
      const anchor = contract.anchors.find(
        (candidate) => candidate.id === group.contextAnchorId
      );
      if (!anchor) return;
      group.members.forEach((member) => {
        const visual = this.createActorVisual(member.id, member.spriteSetId, member.facing, [
          { spriteSetId: member.spriteSetId, state: 'idle', direction: member.facing },
        ]);
        const scenePosition = projection.layoutToScene({
          x: anchor.position.x + member.offset.x,
          y: anchor.position.y + member.offset.y,
        });
        visual.container
          .setPosition(scenePosition.x, scenePosition.y)
          .setDepth(100 + scenePosition.y)
          .setAlpha(0)
          .setData('cityScheduleAlpha', 0)
          .setData('cityScheduleGroupId', group.id);
        this.cityCivilianActors.set(member.id, visual);
      });
    });
  }

  private createLoopSignage(): void {
    const ukrainian = this.runtime.getLocale() === 'uk';
    LEVEL0_LOOP_SIGNAGE.forEach((signage) => {
      const scenePosition = projection.layoutToScene(signage.position);
      const text = this.add
        .text(scenePosition.x, scenePosition.y, getLevel0LoopDisplayName(signage.loopId, ukrainian), {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#d8cfae',
          backgroundColor: '#14161acc',
          padding: { x: 5, y: 2 },
        })
        .setOrigin(0.5, 1)
        .setAlpha(0.85)
        .setDepth(90 + scenePosition.y);
      this.loopSignageTexts.set(signage.loopId, text);
    });
    this.signageLocaleUkrainian = ukrainian;
  }

  private createShutterOverlays(): void {
    LEVEL0_SHUTTER_DOORS.forEach((door) => {
      const scenePosition = projection.layoutToScene(door.position);
      const graphics = this.add.graphics();
      const width = contract.projection.tileWidth * 0.62;
      const height = contract.projection.tileHeight * 1.5;
      graphics.fillStyle(0x0c0f13, 1);
      graphics.fillRoundedRect(-width / 2, -height, width, height, 2);
      graphics.lineStyle(1, 0x2a3038, 1);
      for (let slat = 1; slat < 6; slat += 1) {
        graphics.lineBetween(-width / 2, -height + (height / 6) * slat, width / 2, -height + (height / 6) * slat);
      }
      graphics
        .setPosition(scenePosition.x, scenePosition.y)
        .setAlpha(0)
        .setDepth(100 + scenePosition.y);
      this.shutterOverlays.set(door.id, graphics);
    });
  }

  private renderStreetPresentation(run: Level0RunState): void {
    const minute = run.worldClock.currentMinute;
    const ukrainian = this.runtime.getLocale() === 'uk';
    if (this.signageLocaleUkrainian !== ukrainian) {
      this.signageLocaleUkrainian = ukrainian;
      LEVEL0_LOOP_SIGNAGE.forEach((signage) => {
        this.loopSignageTexts
          .get(signage.loopId)
          ?.setText(getLevel0LoopDisplayName(signage.loopId, ukrainian));
      });
    }
    const shutterTarget = shutterOverlayAlphaAt(minute);
    this.shutterOverlays.forEach((overlay) => {
      overlay.setAlpha(overlay.alpha + (shutterTarget - overlay.alpha) * 0.04);
    });
    if (
      lastTrainCadenceActiveAt(minute) &&
      !run.worldClock.deadlineReached &&
      !this.runtime.isMovementPaused() &&
      this.time.now - this.lastTrainCadenceCueAt > 25_000
    ) {
      this.lastTrainCadenceCueAt = this.time.now;
      playLevel0FeedbackCue('last-train');
    }
  }

  private renderCityCivilians(run: Level0RunState): void {
    const minute = run.worldClock.currentMinute;
    Object.values(LEVEL0_CIVILIAN_GROUPS).forEach((group) => {
      const anchor = contract.anchors.find(
        (candidate) => candidate.id === group.contextAnchorId
      );
      if (!anchor) return;
      const phase = civilianGroupPhaseAt(group, minute);
      const presentation = CIVILIAN_PHASE_PRESENTATION[phase];
      group.members.forEach((member) => {
        const visual = this.cityCivilianActors.get(member.id);
        if (!visual) return;
        const target = projection.layoutToScene({
          x: anchor.position.x + member.offset.x + presentation.offsetShift.x,
          y: anchor.position.y + member.offset.y + presentation.offsetShift.y,
        });
        const container = visual.container;
        const nextX = container.x + (target.x - container.x) * 0.04;
        const nextY = container.y + (target.y - container.y) * 0.04;
        container.setPosition(nextX, nextY).setDepth(100 + nextY);
        const currentAlpha = Number(container.getData('cityScheduleAlpha') ?? 0);
        container.setData(
          'cityScheduleAlpha',
          currentAlpha + (presentation.alpha - currentAlpha) * 0.05
        );
      });
    });
  }

  private renderCrowdThinning(run: Level0RunState): void {
    const hidden = new Set<string>(
      GET204_CROWD_HIDDEN_ACTOR_IDS[crowdStateAt(run.worldClock.currentMinute)]
    );
    this.gate1PopulationActors.forEach((visual, actorId) => {
      const target = hidden.has(actorId) ? 0 : 1;
      const current = Number(visual.container.getData('cityCrowdAlpha') ?? 1);
      visual.container.setData('cityCrowdAlpha', current + (target - current) * 0.05);
    });
  }

  private updateThresholdAmbience(run: Level0RunState): void {
    if (!this.ambience || !this.movement) return;
    this.ambience.updateFrame({
      playerX: this.movement.position.x,
      playerY: this.movement.position.y,
      stage: streetStageAt(run.worldClock.currentMinute),
      paused: this.runtime.isMovementPaused(),
      emitters: AMBIENCE_EMITTER_POSITIONS,
    });
  }

  private createGate1DroneVisual(actorId: string): Level0SceneActorVisual {
    const container = this.add.container(0, 0);
    const shadow = this.add.graphics();
    shadow.fillStyle(0x05070a, 0.4);
    shadow.fillEllipse(0, 1, 42, 11);
    const body = this.add.graphics();
    body.fillStyle(0x202831, 1);
    body.fillEllipse(0, -43, 38, 18);
    body.lineStyle(3, 0x748087, 0.9);
    body.strokeEllipse(0, -43, 42, 21);
    body.fillStyle(0x58afba, 0.95);
    body.fillCircle(0, -42, 4);
    body.fillStyle(0xb4a078, 0.9);
    body.fillCircle(-15, -43, 2);
    body.fillCircle(15, -43, 2);
    body.lineStyle(2, 0x56636a, 0.9);
    body.lineBetween(-24, -43, -17, -43);
    body.lineBetween(17, -43, 24, -43);
    container.add([shadow, body]);
    container.setData('actorId', actorId);
    container.setData('presentationKind', 'unarmed-verifier-drone');
    return { actorId, container, sprite: null, directionMarker: null };
  }

  private renderGet204WorldView(): void {
    const blend = resolveGet204CityWorldViewBlend(this.cameras.main.zoom, activeVisual);
    this.get204WorldLayers.get('overview')?.forEach((layer) =>
      layer.setAlpha(blend.overviewAlpha)
    );
    this.get204WorldLayers.get('close')?.forEach((layer) =>
      layer.setAlpha(blend.closeAlpha)
    );
    this.playerSprite?.setScale(blend.playerWorldScale);
    this.contactActors.forEach((visual) => {
      visual.container
        .setAlpha(blend.actorAlpha)
        .setVisible(blend.actorAlpha > 0.04);
      visual.sprite?.setScale(blend.playerWorldScale);
    });
    this.gate1PopulationActors.forEach((visual) => {
      const multiplier = Number(
        visual.container.getData('get204WorldScaleMultiplier') ?? 1
      );
      const crowdAlpha = Number(visual.container.getData('cityCrowdAlpha') ?? 1);
      const populationAlpha = blend.actorAlpha * crowdAlpha;
      visual.container
        .setAlpha(populationAlpha)
        .setVisible(populationAlpha > 0.04);
      if (visual.sprite) {
        visual.sprite.setScale(blend.playerWorldScale * multiplier);
      } else {
        visual.container.setScale(multiplier);
      }
    });
    this.cityCivilianActors.forEach((visual) => {
      const scheduleAlpha = Number(visual.container.getData('cityScheduleAlpha') ?? 0);
      const civilianAlpha = blend.actorAlpha * scheduleAlpha;
      visual.container.setAlpha(civilianAlpha).setVisible(civilianAlpha > 0.03);
      visual.sprite?.setScale(blend.playerWorldScale);
    });
    this.playerOverviewMarker
      ?.setAlpha(blend.overviewAlpha * 0.9)
      .setScale(1 / Math.max(0.01, this.cameras.main.zoom));
  }

  private createGeorgePresentation(): void {
    if (this.textures.exists(LEVEL0_GEORGE_TEXTURE_KEY)) {
      this.georgePresentation = this.add
        .image(0, 0, LEVEL0_GEORGE_TEXTURE_KEY)
        .setOrigin(0.5)
        .setAlpha(0.82);
    } else {
      const diagnostic = this.add.graphics();
      diagnostic.lineStyle(12, 0x6ba9ae, 0.9);
      diagnostic.strokeCircle(0, 0, 72);
      diagnostic.lineBetween(-52, 0, 52, 0);
      diagnostic.lineBetween(0, -52, 0, 52);
      this.georgePresentation = diagnostic;
    }
    this.georgePresentation.setData('presentationId', 'george_ar_idle');
    this.georgePresentation.setData('interactionOwner', false);
    this.renderGeorgePresentation();
  }

  private renderGeorgePresentation(): void {
    if (!this.georgePresentation || !this.movement || !this.playerMarker) return;
    const playerScenePosition = projection.layoutToScene(this.movement.position);
    const presentation = resolveLevel0GeorgeWorldPresentation(
      playerScenePosition,
      this.cameras.main.zoom
    );
    this.georgePresentation
      .setPosition(presentation.position.x, presentation.position.y)
      .setScale(presentation.scale)
      .setDepth(this.playerMarker.depth + 1)
      .setVisible(
        this.runtime.isGeorgePresentationVisible() &&
        resolveGet204CityWorldViewBlend(this.cameras.main.zoom, activeVisual).actorAlpha >= 0.5
      );
  }

  private createActorVisual(
    actorId: string,
    spriteSetId: string | undefined,
    facing: CharacterSpriteDirection,
    requiredRefsOverride?: CharacterSpriteSheetRef[]
  ): Level0SceneActorVisual {
    const container = this.add.container(0, 0);
    const shadow = this.add.graphics();
    shadow.fillStyle(0x06080a, 0.5);
    shadow.fillEllipse(0, 1, 28, 8);
    container.add(shadow);

    const entry = spriteSetId ? CHARACTER_SPRITE_MANIFEST_BY_ID[spriteSetId] : undefined;
    const requiredRefs = requiredRefsOverride ?? (
      spriteSetId ? resolveLevel0ActorSpriteSheetRefs(spriteSetId) : []
    );
    if (spriteSetId && entry && areCharacterSpriteSheetRefsLoaded(this, requiredRefs)) {
      const sprite = this.add.sprite(
        0,
        0,
        getCharacterSpriteTextureKey(spriteSetId, 'idle', facing),
        0
      );
      sprite.setOrigin(entry.origin.x, entry.origin.y);
      sprite.setScale(entry.worldScale);
      container.add(sprite);
      container.setData('actorId', actorId);
      container.setData('spriteSetId', spriteSetId);
      container.setData('presentationKind', 'sprite');
      this.playActorAnimation(sprite, spriteSetId, 'idle', facing);
      return { actorId, container, sprite, directionMarker: null };
    }

    const diagnostic = this.add.graphics();
    diagnostic.fillStyle(0x31343a, 1);
    diagnostic.fillRoundedRect(-11, -43, 22, 31, 3);
    diagnostic.fillStyle(0xb9b2a4, 1);
    diagnostic.fillCircle(0, -51, 8);
    diagnostic.lineStyle(4, 0xb9b2a4, 1);
    diagnostic.lineBetween(-6, -14, -7, 0);
    diagnostic.lineBetween(6, -14, 7, 0);
    diagnostic.lineStyle(2, 0x70757d, 1);
    diagnostic.strokeRoundedRect(-12, -44, 24, 33, 3);
    const directionMarker = this.add.triangle(
      0,
      -31,
      0,
      -7,
      -4,
      1,
      4,
      1,
      0x78a9ab,
      1
    );
    container.add([diagnostic, directionMarker]);
    container.setData('actorId', actorId);
    container.setData('spriteSetId', spriteSetId ?? null);
    container.setData('presentationKind', 'neutral-diagnostic');
    this.rotateDiagnosticDirection(directionMarker, facing);
    return { actorId, container, sprite: null, directionMarker };
  }

  private playActorAnimation(
    sprite: Phaser.GameObjects.Sprite | null,
    spriteSetId: string,
    state: CharacterSpriteState,
    facing: CharacterSpriteDirection
  ): void {
    if (!sprite) return;
    const animationKey = getCharacterSpriteAnimationKey(spriteSetId, state, facing);
    if (!this.anims.exists(animationKey)) return;
    if (sprite.anims.currentAnim?.key !== animationKey || !sprite.anims.isPlaying) {
      sprite.play(animationKey, true);
    }
  }

  private rotateDiagnosticDirection(
    marker: Phaser.GameObjects.Triangle,
    facing: CharacterSpriteDirection
  ): void {
    const angles: Record<CharacterSpriteDirection, number> = {
      north: 0,
      'north-east': Math.PI / 4,
      east: Math.PI / 2,
      'south-east': (Math.PI * 3) / 4,
      south: Math.PI,
      'south-west': (Math.PI * 5) / 4,
      west: (Math.PI * 3) / 2,
      'north-west': (Math.PI * 7) / 4,
    };
    marker.setRotation(angles[facing]);
  }

  private createIntentMarkers(): void {
    this.targetMarker = this.add.graphics().setDepth(9_000).setVisible(false);
    this.targetMarker.lineStyle(3, 0xd59a45, 0.9);
    this.targetMarker.strokeCircle(0, 0, 12);
    this.targetMarker.lineBetween(-17, 0, -7, 0);
    this.targetMarker.lineBetween(7, 0, 17, 0);
    this.targetMarker.lineBetween(0, -17, 0, -7);
    this.targetMarker.lineBetween(0, 7, 0, 17);

    this.reachableMarker = this.add.graphics().setDepth(8_999).setVisible(false);
    this.reachableMarker.lineStyle(2, 0xa54343, 0.85);
    this.reachableMarker.strokeCircle(0, 0, 9);
  }

  private configureCamera(position: WorldPoint): void {
    const overview = resolveGet204CityOverviewBounds(activeVisual);
    const overviewTarget = projection.layoutToScene(overview.targetLayout);
    this.cameras.main.setBounds(
      overviewTarget.x + overview.left,
      overviewTarget.y + overview.top,
      overview.width,
      overview.height
    );
    this.minimumZoom = resolveGet204CityOverviewFitZoom(
      this.scale.width,
      this.scale.height,
      activeVisual
    );
    this.cameras.main.setZoom(resolveGet204CityInitialZoom(undefined, activeVisual));
    const scenePosition = projection.layoutToScene(position);
    this.cameras.main.centerOn(scenePosition.x, scenePosition.y);
    this.cameras.main.setBackgroundColor('#101215');
    this.renderGet204WorldView();
  }

  private configureInput(): void {
    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.keys = keyboard.addKeys('W,A,S,D,E,O') as KeyboardControls;
      keyboard.on('keydown-E', this.handleInteract, this);
      keyboard.on('keydown-O', this.handleObservationToggle, this);
    }
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    this.input.on('wheel', this.handleWheel, this);
    window.addEventListener(LEVEL0_AGENT_MOVE_EVENT, this.handleAgentMove);
    window.addEventListener(
      LEVEL0_ACTOR_INTERACTION_PRESENTATION_EVENT,
      this.handleActorInteractionPresentation
    );
  }

  private teardownInput(): void {
    this.input.keyboard?.off('keydown-E', this.handleInteract, this);
    this.input.keyboard?.off('keydown-O', this.handleObservationToggle, this);
    this.input.off('pointerdown', this.handlePointerDown, this);
    this.input.off('pointermove', this.handlePointerMove, this);
    this.input.off('pointerup', this.handlePointerUp, this);
    this.input.off('wheel', this.handleWheel, this);
    window.removeEventListener(LEVEL0_AGENT_MOVE_EVENT, this.handleAgentMove);
    window.removeEventListener(
      LEVEL0_ACTOR_INTERACTION_PRESENTATION_EVENT,
      this.handleActorInteractionPresentation
    );
  }

  private readKeyboardInput(): KeyboardInputState {
    return {
      up: this.keys?.W.isDown ?? false,
      down: this.keys?.S.isDown ?? false,
      left: this.keys?.A.isDown ?? false,
      right: this.keys?.D.isDown ?? false,
    };
  }

  private handleInteract(): void {
    if (this.runtime.isMovementPaused()) return;
    this.runtime.onInteraction();
  }

  private readonly handleActorInteractionPresentation = (event: Event): void => {
    const detail = (event as CustomEvent<Level0ActorInteractionPresentationDetail>).detail;
    this.beginActorInteraction(detail?.anchorId);
  };

  private beginActorInteraction(anchorId?: string): void {
    this.playerInteractionUntil = this.time.now + LEVEL0_ACTOR_INTERACTION_DURATION_MS;
    if (this.movement) {
      this.movement = { ...this.movement, intent: { kind: 'idle' } };
      this.targetMarker?.setVisible(false);
    }
    const contact = LEVEL0_CONTACT_ACTOR_PRESENTATIONS.find(
      (presentation) => presentation.anchorId === anchorId
    );
    if (!contact) return;
    const visual = this.contactActors.get(contact.actorId);
    if (!visual) return;

    const interactionUntil = this.time.now + LEVEL0_ACTOR_INTERACTION_DURATION_MS;
    this.contactInteractionUntil.set(contact.actorId, interactionUntil);
    this.playActorAnimation(visual.sprite, contact.actorId, 'interact', contact.facing);
    this.time.delayedCall(LEVEL0_ACTOR_INTERACTION_DURATION_MS, () => {
      if (this.contactInteractionUntil.get(contact.actorId) !== interactionUntil) return;
      this.contactInteractionUntil.delete(contact.actorId);
      this.playActorAnimation(visual.sprite, contact.actorId, 'idle', contact.facing);
    });
  }

  private handleObservationToggle(): void {
    this.runtime.onObservationToggle();
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    this.pointerDownAt = {
      x: pointer.x,
      y: pointer.y,
      cameraX: this.cameras.main.scrollX,
      cameraY: this.cameras.main.scrollY,
    };
    this.pointerDragged = false;
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!pointer.isDown || !this.pointerDownAt || !this.runtime.isObservationActive()) return;
    const deltaX = pointer.x - this.pointerDownAt.x;
    const deltaY = pointer.y - this.pointerDownAt.y;
    if (Math.hypot(deltaX, deltaY) > 4) this.pointerDragged = true;
    this.cameras.main.scrollX = this.pointerDownAt.cameraX - deltaX / this.cameras.main.zoom;
    this.cameras.main.scrollY = this.pointerDownAt.cameraY - deltaY / this.cameras.main.zoom;
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    const wasDragged = this.pointerDragged;
    this.pointerDownAt = null;
    this.pointerDragged = false;
    if (wasDragged || this.runtime.isObservationActive() || this.runtime.isMovementPaused()) return;
    this.acceptSceneClick({ x: pointer.worldX, y: pointer.worldY });
  }

  private handleWheel(
    _pointer: Phaser.Input.Pointer,
    _objects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number
  ): void {
    const next = Phaser.Math.Clamp(
      this.cameras.main.zoom - Math.sign(deltaY) * 0.08,
      this.minimumZoom,
      LEVEL0_MAX_ZOOM
    );
    this.cameras.main.setZoom(next);
  }

  private acceptSceneClick(scenePoint: WorldPoint): void {
    if (!this.movement) return;
    const layoutPoint = projection.sceneToLayout(scenePoint);
    const run = this.runtime.getRun();
    const clickedAnchor = contract.anchors
      .filter((anchor) =>
        run !== null &&
        isLevel0AnchorKnown(run, anchor) &&
        !['audio', 'camera', 'drone-launch'].includes(anchor.kind)
      )
      .map((anchor) => ({
        anchor,
        distance: Math.hypot(
          anchor.position.x - layoutPoint.x,
          anchor.position.y - layoutPoint.y
        ),
      }))
      .filter(({ anchor, distance }) => distance <= Math.max(0.8, anchor.radius))
      .sort((a, b) => a.distance - b.distance)[0]?.anchor;
    if (clickedAnchor) {
      const playerDistance = Math.hypot(
        clickedAnchor.position.x - this.movement.position.x,
        clickedAnchor.position.y - this.movement.position.y
      );
      if (playerDistance <= Math.max(1.25, clickedAnchor.radius + 0.75)) {
        this.runtime.onInteraction(clickedAnchor.id);
        return;
      }
    }

    this.acceptLayoutClick(layoutPoint);
  }

  private readonly handleAgentMove = (event: Event): void => {
    const detail = (event as CustomEvent<Level0AgentMoveDetail>).detail;
    if (!detail || typeof detail.requestId !== 'string') {
      return;
    }
    let result: { accepted: boolean; reason: string };
    if (!Number.isFinite(detail.x) || !Number.isFinite(detail.y)) {
      result = { accepted: false, reason: 'invalid-position' };
    } else if (this.runtime.isMovementPaused()) {
      result = { accepted: false, reason: 'movement-paused' };
    } else {
      result = this.acceptLayoutClick({ x: detail.x, y: detail.y });
    }
    window.dispatchEvent(new CustomEvent<Level0AgentMoveResultDetail>(
      LEVEL0_AGENT_MOVE_RESULT_EVENT,
      { detail: { requestId: detail.requestId, ...result } }
    ));
  };

  private acceptLayoutClick(layoutPoint: WorldPoint): { accepted: boolean; reason: string } {
    if (!this.movement) return { accepted: false, reason: 'scene-not-ready' };
    const result = resolveClickIntent(movementContract, this.movement.position, layoutPoint);
    if (!result.accepted) {
      this.movement = { ...this.movement, intent: { kind: 'idle' } };
      this.targetMarker?.setVisible(false);
      if (result.feedback?.reachableMarker) {
        const marker = projection.layoutToScene(result.feedback.reachableMarker);
        this.reachableMarker?.setPosition(marker.x, marker.y).setVisible(true);
      } else {
        this.reachableMarker?.setVisible(false);
      }
      this.runtime.onFeedback(`movement.invalid.${result.feedback?.reason ?? 'blocked-surface'}`);
      return { accepted: false, reason: result.feedback?.reason ?? 'blocked-surface' };
    }

    this.movement = { ...this.movement, intent: result.intent };
    const target = projection.layoutToScene(layoutPoint);
    this.targetMarker?.setPosition(target.x, target.y).setVisible(true);
    this.reachableMarker?.setVisible(false);
    this.runtime.onFeedback('movement.target.accepted');
    return { accepted: true, reason: 'movement-target-accepted' };
  }

  private renderMovementState(): void {
    if (!this.movement || !this.playerMarker) return;
    const scenePosition = projection.layoutToScene(this.movement.position);
    this.playerMarker.setPosition(scenePosition.x, scenePosition.y);
    this.playerMarker.setDepth(100 + scenePosition.y);
    this.playerOverviewMarker
      ?.setPosition(scenePosition.x, scenePosition.y)
      .setDepth(10_002);
    const spriteSetId = this.playerMarker.getData('spriteSetId') as string | null;
    const spriteFacing = resolveLevel0SpriteDirection(this.movement.facing);
    const spriteState: CharacterSpriteState = resolveLevel0PlayerSpriteState(
      this.movement.intent.kind,
      this.time.now,
      this.playerInteractionUntil
    );
    if (spriteSetId) {
      this.playActorAnimation(this.playerSprite, spriteSetId, spriteState, spriteFacing);
    }
    const projectedFacing = {
      x: (this.movement.facing.x - this.movement.facing.y) * contract.projection.tileWidth / 2,
      y: (this.movement.facing.x + this.movement.facing.y) * contract.projection.tileHeight / 2,
    };
    const facingAngle = Math.atan2(projectedFacing.y, projectedFacing.x);
    this.playerDirection?.setRotation(facingAngle - Math.PI / 2);
    if (this.movement.intent.kind === 'idle') {
      this.targetMarker?.setVisible(false);
    }
  }

  private followPlayerUnlessObserving(): void {
    if (!this.movement || this.runtime.isObservationActive()) return;
    const playerPosition = projection.layoutToScene(this.movement.position);
    if (activeVisual.zoomPresentation.cameraFollowMode === 'player-locked') {
      this.cameras.main.centerOn(playerPosition.x, playerPosition.y - 80);
      return;
    }
    const overview = this.get204WorldLayers.get('overview')?.[0];
    const overviewCenter = overview
      ? { x: overview.x + overview.displayWidth / 2, y: overview.y + overview.displayHeight / 2 }
      : playerPosition;
    const { actorAlpha } = resolveGet204CityWorldViewBlend(
      this.cameras.main.zoom,
      activeVisual
    );
    this.cameras.main.centerOn(
      Phaser.Math.Linear(overviewCenter.x, playerPosition.x, actorAlpha),
      Phaser.Math.Linear(overviewCenter.y, playerPosition.y - 80, actorAlpha)
    );
  }
}
