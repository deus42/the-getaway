import Phaser from 'phaser';
import type { Enemy, MapArea, MapTile, NPC, Position, SurveillanceZoneState } from '../../../interfaces/types';
import type { PlayerScreenPositionDetail } from '../../../events';
import type { IsoMetrics } from '../../../utils/iso';
import type { CharacterToken, IsoObjectFactory } from '../../../utils/IsoObjectFactory';
import type { BuildingVisualProfile, VisualTheme } from '../../../visual/contracts';
import type { CharacterRigFactory } from '../../../visual/entities/CharacterRigFactory';
import type { TilePainter } from '../../../visual/world/TilePainter';
import type { BuildingPainter } from '../../../visual/world/BuildingPainter';
import type { AtmosphereDirector, AtmosphereProfile } from '../../../visual/world/AtmosphereDirector';
import type {
  OcclusionMassHandle,
  OcclusionReadabilityController,
} from '../../../visual/world/OcclusionReadabilityController';

export type EnemySpriteRecord = {
  token: CharacterToken;
  healthBar: Phaser.GameObjects.Graphics;
  nameLabel: Phaser.GameObjects.Text;
  markedForRemoval: boolean;
};

export type NpcSpriteRecord = {
  token: CharacterToken;
  indicator?: Phaser.GameObjects.Graphics;
  nameLabel: Phaser.GameObjects.Text;
  markedForRemoval: boolean;
};

export type CameraRuntimeState = {
  isCameraFollowingPlayer: boolean;
  hasInitialZoomApplied: boolean;
  userAdjustedZoom: boolean;
  pendingCameraRestore: boolean;
  preCombatZoom: number | null;
  preCombatUserAdjusted: boolean;
  pendingRestoreUserAdjusted: boolean | null;
  baselineCameraZoom: number;
  cameraZoomTween: Phaser.Tweens.Tween | null;
};

export type EntityRenderRuntimeState = {
  playerToken?: CharacterToken;
  playerNameLabel?: Phaser.GameObjects.Text;
  playerVitalsIndicator?: Phaser.GameObjects.Graphics;
  enemySprites: Map<string, EnemySpriteRecord>;
  npcSprites: Map<string, NpcSpriteRecord>;
  lastPlayerGridPosition: Position | null;
  lastPlayerScreenDetail?: PlayerScreenPositionDetail;
};

export type WorldRenderRuntimeState = {
  visualTheme: VisualTheme;
  tilePainter?: TilePainter;
  buildingPainter?: BuildingPainter;
  characterRigFactory?: CharacterRigFactory;
  atmosphereDirector?: AtmosphereDirector;
  occlusionReadabilityController?: OcclusionReadabilityController;
  buildingVisualProfiles: Record<string, BuildingVisualProfile>;
  buildingLabels: Phaser.GameObjects.Container[];
  buildingMassings: Phaser.GameObjects.GameObject[];
  buildingMassingEntries: OcclusionMassHandle[];
  currentAtmosphereProfile?: AtmosphereProfile;
  lastAtmosphereRedrawBucket: number;
  lastItemMarkerSignature: string;
};

export type StateSyncRuntimeState = {
  curfewActive: boolean;
  inCombat: boolean;
  lastMapAreaId: string | null;
  isMapTransitionPending: boolean;
};

export type ClockRuntimeState = {
  currentGameTime: number;
  timeDispatchAccumulator: number;
  lastAtmosphereRedrawBucket: number;
  dispatchCadenceSeconds: number;
  atmosphereBucketSeconds: number;
};

export type CameraModulePorts = {
  cameras: Phaser.Cameras.Scene2D.CameraManager;
  scale: Phaser.Scale.ScaleManager;
  sys: Phaser.Scenes.Systems;
  tweens: Phaser.Tweens.TweenManager;
  getCurrentMapArea(): MapArea | null;
  getPlayerInitialPosition(): Position | undefined;
  getPlayerTokenContainer(): Phaser.GameObjects.Container | undefined;
  getTileSize(): number;
  setIsoOrigin(originX: number, originY: number): void;
  ensureIsoFactory(): void;
  ensureVisualPipeline(): void;
  getIsoMetrics(): IsoMetrics;
  calculatePixelPosition(gridX: number, gridY: number): { x: number; y: number };
  computeIsoBounds(): { minX: number; maxX: number; minY: number; maxY: number };
  renderStaticProps(): void;
  drawBackdrop(): void;
  drawMap(tiles: MapTile[][]): void;
  drawBuildingMasses(): void;
  drawBuildingLabels(): void;
  clearPathPreview(): void;
  resizeDayNightOverlay(): void;
  applyOverlayZoom(): void;
  emitViewportUpdate(): void;
  dispatchPlayerScreenPosition(): void;
  isInCombat(): boolean;
  readRuntimeState?(): Partial<CameraRuntimeState>;
  writeRuntimeState?(state: CameraRuntimeState): void;
};

export type DayNightOverlayModulePorts = {
  add: Phaser.GameObjects.GameObjectFactory;
  cameras: Phaser.Cameras.Scene2D.CameraManager;
  scale: Phaser.Scale.ScaleManager;
  sys: Phaser.Scenes.Systems;
  getCurrentGameTime(): number;
  isInCombat(): boolean;
  resolveAtmosphereProfile(baseOverlayRgba?: string): { overlayColor: number; overlayAlpha: number };
  registerStaticDepth(target: Phaser.GameObjects.GameObject, depth: number): void;
};

export type EntityRenderModulePorts = {
  add: Phaser.GameObjects.GameObjectFactory;
  cameras: Phaser.Cameras.Scene2D.CameraManager;
  game: Phaser.Game;
  scale: Phaser.Scale.ScaleManager;
  sys: Phaser.Scenes.Systems;
  hasMapGraphics(): boolean;
  ensureIsoFactory(): void;
  getIsoMetrics(): { tileWidth: number; tileHeight: number };
  calculatePixelPosition(gridX: number, gridY: number): { x: number; y: number };
  syncDepth(target: Phaser.GameObjects.GameObject, pixelX: number, pixelY: number, bias: number): void;
  enablePlayerCameraFollow(): void;
  isInCombat(): boolean;
  isCameraFollowingPlayer(): boolean;
  createCharacterToken(role: 'player' | 'hostileNpc' | 'interactiveNpc' | 'friendlyNpc', gridX: number, gridY: number): CharacterToken;
  positionCharacterToken(token: CharacterToken, gridX: number, gridY: number): void;
  readRuntimeState?(): Partial<EntityRenderRuntimeState>;
  writeRuntimeState?(state: EntityRenderRuntimeState): void;
};

export type InputModulePorts = {
  cameras: Phaser.Cameras.Scene2D.CameraManager;
  sys: Phaser.Scenes.Systems;
  pathGraphics: Phaser.GameObjects.Graphics;
  getCurrentMapArea(): MapArea | null;
  setCurrentMapArea(area: MapArea | null): void;
  getPlayerInitialPosition(): Position | undefined;
  getLastPlayerGridPosition(): Position | null;
  getCoverDebugGraphics(): Phaser.GameObjects.Graphics | undefined;
  worldToGrid(worldX: number, worldY: number): Position | null;
  getIsoMetrics(): IsoMetrics;
  calculatePixelPosition(gridX: number, gridY: number): { x: number; y: number };
  getDiamondPoints(centerX: number, centerY: number, width: number, height: number): Phaser.Geom.Point[];
  renderStaticProps(): void;
};

export type MinimapBridgeModulePorts = {
  cameras: Phaser.Cameras.Scene2D.CameraManager;
  sys: Phaser.Scenes.Systems;
  getCurrentMapArea(): MapArea | null;
  worldToGridContinuous(worldX: number, worldY: number): { x: number; y: number } | null;
};

export type StateSyncModulePorts = {
  sys: Phaser.Scenes.Systems;
  getCurrentMapArea(): MapArea | null;
  setCurrentMapArea(area: MapArea | null): void;
  getItemMarkerSignature(area: MapArea | null): string;
  renderStaticProps(): void;
  updateDayNightOverlay(): void;
  updatePlayerPosition(position: Position): void;
  updatePlayerVitalsIndicator(position: Position, health: number, maxHealth: number): void;
  updateEnemies(enemies: Enemy[]): void;
  updateNpcs(npcs: NPC[]): void;
  renderVisionCones(): void;
  updateSurveillanceCameras(zone?: SurveillanceZoneState, overlayEnabled?: boolean): void;
  zoomCameraForCombat(): void;
  restoreCameraAfterCombat(): void;
  destroyPlayerVitalsIndicator(): void;
  destroyCameraSprites(): void;
  setupCameraAndMap(): void;
  clearPathPreview(): void;
  enablePlayerCameraFollow(): void;
  resetCameraRuntimeStateForMapTransition?(): void;
  clearEntityRuntimeStateForMapTransition?(): void;
  clearWorldRuntimeStateForMapTransition?(): void;
  resetEntityCombatIndicators?(): void;
  readRuntimeState?(): Partial<StateSyncRuntimeState>;
  writeRuntimeState?(state: StateSyncRuntimeState): void;
};

export type SurveillanceRenderModulePorts = {
  getCurrentMapArea(): MapArea | null;
  getVisionConeGraphics(): Phaser.GameObjects.Graphics | undefined;
  getTileSize(): number;
  getIsoMetrics(): { tileWidth: number; tileHeight: number };
  calculatePixelPosition(gridX: number, gridY: number): { x: number; y: number };
  syncDepth(target: Phaser.GameObjects.GameObject, pixelX: number, pixelY: number, bias: number): void;
};

export type WorldRenderModulePorts = {
  add: Phaser.GameObjects.GameObjectFactory;
  game: Phaser.Game;
  lights: Phaser.GameObjects.LightsManager;
  mapGraphics: Phaser.GameObjects.Graphics;
  getBackdropGraphics(): Phaser.GameObjects.Graphics | undefined;
  getCurrentMapArea(): MapArea | null;
  getCurrentGameTime(): number;
  getTileSize(): number;
  getIsoFactory(): IsoObjectFactory | undefined;
  ensureIsoFactory(): void;
  getIsoMetrics(): { tileWidth: number; tileHeight: number };
  calculatePixelPosition(gridX: number, gridY: number): { x: number; y: number };
  syncDepth(target: Phaser.GameObjects.GameObject, pixelX: number, pixelY: number, bias: number): void;
  renderVisionCones(): void;
  getStaticPropGroup(): Phaser.GameObjects.Group | undefined;
  setStaticPropGroup(group: Phaser.GameObjects.Group | undefined): void;
  getLightsFeatureEnabled(): boolean;
  setLightsFeatureEnabled(enabled: boolean): void;
  getDemoLampGrid(): Position | undefined;
  setDemoLampGrid(position: Position | undefined): void;
  getDemoPointLight(): Phaser.GameObjects.PointLight | undefined;
  setDemoPointLight(light: Phaser.GameObjects.PointLight | undefined): void;
  getLightingAmbientColor(): number;
  readEntityRuntimeState?(): Partial<EntityRenderRuntimeState>;
  readRuntimeState?(): Partial<WorldRenderRuntimeState>;
  writeRuntimeState?(state: WorldRenderRuntimeState): void;
};

export type ClockModulePorts = {
  getCurrentGameTime(): number;
  getAtmosphereRedrawBucket(): number;
  setAtmosphereRedrawBucket(bucket: number): void;
  signalAtmosphereRedraw(): void;
  signalOverlayUpdate(): void;
  signalOcclusionUpdate(): void;
  dispatchGameTime(elapsedSeconds: number): void;
  shouldApplySuspicionDecay(): boolean;
  dispatchSuspicionDecay(elapsedSeconds: number, timestamp: number): void;
  readRuntimeState?(): Partial<ClockRuntimeState>;
  writeRuntimeState?(state: ClockRuntimeState): void;
};
