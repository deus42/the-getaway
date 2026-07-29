import type { AppDispatch, RootState } from '../../store';
import {
  DAY_START_SECONDS,
  MIDDAY_SECONDS,
  NIGHT_START_SECONDS,
  requestStealthToggle,
  setCurrentMapAreaZoneMetadata,
  setGameTime,
} from '../../store/worldSlice';
import { advanceToNextLevel } from '../../store/missionSlice';
import { setHealth } from '../../store/playerSlice';
import {
  MINIMAP_OBJECTIVE_FOCUS_EVENT,
  TILE_CLICK_EVENT,
  type MiniMapObjectiveFocusDetail,
  type TileClickDetail,
} from '../events';
import type { DialogueOption, NPC, Position, Quest, QuestObjective } from '../interfaces/types';
import {
  resolveDialogueCheckState,
  resolveDialogueFactionState,
} from '../quests/dialogueSystem';
import { isLevel0GuidedQuestStartAvailable } from '../quests/level0GuidedSlice';

export const GETAWAY_AGENT_VERSION = 'getaway-agent-v1';
export const GETAWAY_AGENT_START_LEVEL0_EVENT = 'getawayAgentStartLevel0';
export const GETAWAY_AGENT_DIALOGUE_OPTION_EVENT = 'getawayAgentDialogueOption';

const QA_SAFE_LOG_LIMIT = 12;
const QA_SAFE_ENTITY_LIMIT = 30;
const NPC_INTERACTION_RANGE = 2;
const MIN_SEMANTIC_MOVE_TIMEOUT_MS = 6_000;
const MAX_SEMANTIC_MOVE_TIMEOUT_MS = 22_000;
const SEMANTIC_MOVE_TIMEOUT_PER_TILE_MS = 420;

export interface GetawayAgentStore {
  getState: () => RootState;
  dispatch: AppDispatch;
}

export type GetawayAgentAction =
  | { type: 'startLevel0'; name?: string }
  | { type: 'clickTile'; position: Position }
  | { type: 'focusObjective'; position?: Position }
  | { type: 'interactNpc'; id?: string; role?: string; name?: string }
  | { type: 'collectItem'; id?: string; role?: string; name?: string; position?: Position }
  | { type: 'toggleStealth' }
  | { type: 'continueMission' }
  | { type: 'advanceMission' }
  | { type: 'triggerMissionFailure' }
  | { type: 'retryMission' }
  | { type: 'chooseDialogueOption'; index: number }
  | { type: 'setClock'; phase: 'day' | 'night' | 'midday' }
  | { type: 'waitForDialogue'; timeoutMs?: number }
  | { type: 'waitForObjectiveChange'; fromId?: string; timeoutMs?: number }
  | { type: 'waitForPlayerIdle'; timeoutMs?: number }
  | { type: 'wait'; ms?: number };

export type GetawayAgentActionStatus = 'ok' | 'rejected' | 'timeout' | 'no-op';

export interface GetawayAgentActionResult {
  ok: boolean;
  action: GetawayAgentAction['type'] | 'unknown';
  message: string;
  status: GetawayAgentActionStatus;
  reason: string;
  beforeObjectiveId: string | null;
  afterObjectiveId: string | null;
  stateChanged: boolean;
  evidenceHint: string;
  snapshot?: GetawayAgentSnapshot;
}

export interface GetawayAgentSnapshot {
  schema: 'getaway_agent_snapshot_v1';
  bridgeVersion: typeof GETAWAY_AGENT_VERSION;
  timestamp: string;
  url: string | null;
  player: {
    id: string;
    name: string;
    health: number;
    maxHealth: number;
    actionPoints: number;
    maxActionPoints: number;
    stamina: number;
    maxStamina: number;
    position: Position;
    facing: string;
    movementProfile: string;
    stealthModeEnabled: boolean;
    stealthCooldownExpiresAt: number | null;
    level: number;
    credits: number;
    inventoryCount: number;
  };
  world: {
    areaId: string;
    areaName: string;
    zoneId: string;
    map: {
      width: number;
      height: number;
      tileCount: number;
      walkableTileCount: number;
      nearbyWalkableTiles: Position[];
    };
    currentTime: number;
    timeOfDay: string;
    curfewActive: boolean;
    inCombat: boolean;
    isPlayerTurn: boolean;
    engagementMode: string;
    globalAlertLevel: string;
    workbenchAvailable: boolean;
  };
  stealth: {
    enabled: boolean;
    curfewActive: boolean;
    camerasNearby: number;
    detectionProgress: number;
    activeCameraId: string | null;
    cameraAlertState: string;
    networkAlertActive: boolean;
  };
  paranoia: {
    value: number;
    tier: string;
    frozen: boolean;
  };
  suspicion: {
    paused: boolean;
    zones: Array<{
      zoneId: string;
      totalHeat: number;
      tier: string;
      memoryCount: number;
    }>;
  };
  objectives: Array<{
    questId: string;
    questName: string;
    objectiveId: string;
    description: string;
    type: QuestObjective['type'];
    target: string;
    currentCount?: number;
    count?: number;
    isCompleted: boolean;
    isActive: boolean;
  }>;
  mission: {
    currentLevelIndex: number;
    pendingAdvance: boolean;
    celebrationAcknowledged: boolean;
    levels: Array<{
      level: number;
      levelId: string;
      name: string;
      zoneId: string;
      objectiveCount: number;
    }>;
  };
  npcs: Array<{
    id: string;
    name: string;
    dialogueId: string;
    isInteractive: boolean;
    factionId?: string;
    socialTags: string[];
    position: Position;
    health: number;
    maxHealth: number;
  }>;
  items: Array<{
    id: string;
    definitionId?: string;
    resourceKey?: string;
    name: string;
    isQuestItem: boolean;
    quantity?: number;
    position: Position | null;
    tags: string[];
  }>;
  enemies: Array<{
    id: string;
    name: string;
    position: Position;
    health: number;
    maxHealth: number;
    alertLevel?: string;
    alertProgress?: number;
    aiState?: string;
    isHostile: boolean;
  }>;
  cameras: Array<{
    id: string;
    type: string;
    position: Position;
    isActive: boolean;
    alertState: string;
    detectionProgress: number;
    range: number;
  }>;
  dialogue: {
    active: boolean;
    dialogueId: string | null;
    currentNodeId: string | null;
    speakerId?: string;
    text?: string;
    options: Array<{
      index: number;
      originalIndex: number;
      text: string;
      nextNodeId: string | null;
      hasSkillCheck: boolean;
      hasQuestEffect: boolean;
    }>;
  };
  overlays: {
    missionFailureOpen: boolean;
    missionCompletionPending: boolean;
    activeDialogue: boolean;
  };
  recentLogs: string[];
}

export interface GetawayAgentBridge {
  version: typeof GETAWAY_AGENT_VERSION;
  snapshot: () => GetawayAgentSnapshot;
  dispatch: (action: GetawayAgentAction) => Promise<GetawayAgentActionResult>;
}

export interface AgentActionValidation {
  ok: boolean;
  message: string;
}

type TargetedAgentAction = Extract<
  GetawayAgentAction,
  { type: 'interactNpc' | 'collectItem' }
>;

const isFiniteInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value);

const isPosition = (value: unknown): value is Position => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Position;
  return isFiniteInteger(candidate.x) && isFiniteInteger(candidate.y);
};

const clonePosition = (position: Position): Position => ({ x: position.x, y: position.y });

const getBrowserUrl = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.location.href;
};

export const resolveAgentMovementTimeoutMs = (distance: number): number => {
  if (!Number.isFinite(distance) || distance <= 0) {
    return MIN_SEMANTIC_MOVE_TIMEOUT_MS;
  }

  return Math.max(
    MIN_SEMANTIC_MOVE_TIMEOUT_MS,
    Math.min(
      MAX_SEMANTIC_MOVE_TIMEOUT_MS,
      MIN_SEMANTIC_MOVE_TIMEOUT_MS + Math.ceil(distance * SEMANTIC_MOVE_TIMEOUT_PER_TILE_MS)
    )
  );
};

const trimList = <T>(entries: T[]): T[] => entries.slice(0, QA_SAFE_ENTITY_LIMIT);

const countWalkableTiles = (state: RootState): number =>
  state.world.currentMapArea.tiles.reduce(
    (total, row) => total + row.filter((tile) => tile.isWalkable).length,
    0
  );

const buildNearbyWalkableTiles = (state: RootState): Position[] => {
  const playerPosition = state.player.data.position;
  const area = state.world.currentMapArea;
  const positions: Position[] = [];

  for (let radius = 1; radius <= 3; radius += 1) {
    for (let y = playerPosition.y - radius; y <= playerPosition.y + radius; y += 1) {
      for (let x = playerPosition.x - radius; x <= playerPosition.x + radius; x += 1) {
        if (x === playerPosition.x && y === playerPosition.y) {
          continue;
        }

        const tile = area.tiles[y]?.[x];
        if (tile?.isWalkable) {
          positions.push({ x, y });
        }
      }
    }
  }

  return positions.slice(0, 12);
};

const resolveCurrentDialogue = (state: RootState) => {
  const { dialogueId, currentNodeId } = state.quests.activeDialogue;
  const dialogue = dialogueId
    ? state.quests.dialogues.find((entry) => entry.id === dialogueId)
    : undefined;
  const currentNode = currentNodeId
    ? dialogue?.nodes.find((entry) => entry.id === currentNodeId)
    : undefined;

  return { dialogueId, currentNodeId, dialogue, currentNode };
};

const hasPendingNonTalkObjectives = (quest: Quest): boolean =>
  quest.objectives.some((objective) => objective.type !== 'talk' && !objective.isCompleted);

const isQuestOptionVisible = (
  option: DialogueOption,
  state: RootState
): boolean => {
  if (!option.questEffect) {
    return true;
  }

  const quest = state.quests.quests.find((entry) => entry.id === option.questEffect?.questId);
  if (!quest) {
    return false;
  }

  switch (option.questEffect.effect) {
    case 'start':
      return (
        !quest.isActive &&
        !quest.isCompleted &&
        isLevel0GuidedQuestStartAvailable(quest.id, state.quests.quests)
      );
    case 'complete':
      return quest.isActive && !quest.isCompleted && !hasPendingNonTalkObjectives(quest);
    case 'update':
      if (!quest.isActive || quest.isCompleted) {
        return false;
      }
      if (!option.questEffect.objectiveId) {
        return true;
      }
      return !quest.objectives.some(
        (objective) =>
          objective.id === option.questEffect?.objectiveId &&
          objective.isCompleted
      );
    default:
      return true;
  }
};

const isQuestOptionLocked = (
  option: DialogueOption,
  state: RootState
): boolean => {
  if (!option.questEffect) {
    return false;
  }

  const quest = state.quests.quests.find((entry) => entry.id === option.questEffect?.questId);
  if (!quest) {
    return true;
  }

  switch (option.questEffect.effect) {
    case 'start':
      return quest.isActive || quest.isCompleted;
    case 'complete':
      return quest.isCompleted || !quest.isActive || hasPendingNonTalkObjectives(quest);
    case 'update':
      if (!option.questEffect.objectiveId) {
        return false;
      }
      return quest.objectives.some(
        (objective) =>
          objective.id === option.questEffect?.objectiveId &&
          objective.isCompleted
      );
    default:
      return false;
  }
};

const getSelectableDialogueOptions = (
  state: RootState,
  options: DialogueOption[]
): Array<{ option: DialogueOption; originalIndex: number }> => {
  const reputationEnabled = Boolean(state.settings.reputationSystemsEnabled);

  return options
    .map((option, originalIndex) => ({ option, originalIndex }))
    .filter(({ option }) => {
      if (!isQuestOptionVisible(option, state) || isQuestOptionLocked(option, state)) {
        return false;
      }

      const checkState = resolveDialogueCheckState(state.player.data, option);
      if (checkState && !checkState.isPassed) {
        return false;
      }

      const factionState = resolveDialogueFactionState(
        state.player.data,
        option,
        reputationEnabled
      );
      return !(factionState && !factionState.isPassed);
    });
};

const mapDialogueOptions = (state: RootState, options: DialogueOption[]) =>
  getSelectableDialogueOptions(state, options).map(({ option, originalIndex }, index) => ({
    index,
    originalIndex,
    text: option.text,
    nextNodeId: option.nextNodeId,
    hasSkillCheck: Boolean(option.skillCheck),
    hasQuestEffect: Boolean(option.questEffect),
  }));

const buildObjectivesSnapshot = (state: RootState): GetawayAgentSnapshot['objectives'] =>
  state.quests.quests.flatMap((quest) => {
    const activeObjectiveId = quest.isActive && !quest.isCompleted
      ? quest.objectives.find((objective) => !objective.isCompleted)?.id ?? null
      : null;

    return quest.objectives.map((objective) => ({
      questId: quest.id,
      questName: quest.name,
      objectiveId: objective.id,
      description: objective.description,
      type: objective.type,
      target: objective.target,
      currentCount: objective.currentCount,
      count: objective.count,
      isCompleted: objective.isCompleted,
      isActive: objective.id === activeObjectiveId,
    }));
  });

const buildCamerasSnapshot = (state: RootState): GetawayAgentSnapshot['cameras'] => {
  const areaId = state.world.currentMapArea.id;
  const zone = state.surveillance.zones[areaId];
  if (!zone) {
    return [];
  }

  return trimList(Object.values(zone.cameras)).map((camera) => ({
    id: camera.id,
    type: camera.type,
    position: clonePosition(camera.position),
    isActive: camera.isActive,
    alertState: camera.alertState,
    detectionProgress: camera.detectionProgress,
    range: camera.range,
  }));
};

export const buildAgentSnapshot = (state: RootState): GetawayAgentSnapshot => {
  const area = state.world.currentMapArea;
  const player = state.player.data;
  const { dialogueId, currentNodeId, currentNode } = resolveCurrentDialogue(state);

  return {
    schema: 'getaway_agent_snapshot_v1',
    bridgeVersion: GETAWAY_AGENT_VERSION,
    timestamp: new Date().toISOString(),
    url: getBrowserUrl(),
    player: {
      id: player.id,
      name: player.name,
      health: player.health,
      maxHealth: player.maxHealth,
      actionPoints: player.actionPoints,
      maxActionPoints: player.maxActionPoints,
      stamina: player.stamina,
      maxStamina: player.maxStamina,
      position: clonePosition(player.position),
      facing: player.facing,
      movementProfile: player.movementProfile,
      stealthModeEnabled: player.stealthModeEnabled,
      stealthCooldownExpiresAt: player.stealthCooldownExpiresAt,
      level: player.level,
      credits: player.credits,
      inventoryCount: player.inventory.items.length,
    },
    world: {
      areaId: area.id,
      areaName: area.displayName ?? area.name,
      zoneId: area.zoneId,
      map: {
        width: area.width,
        height: area.height,
        tileCount: area.width * area.height,
        walkableTileCount: countWalkableTiles(state),
        nearbyWalkableTiles: buildNearbyWalkableTiles(state),
      },
      currentTime: state.world.currentTime,
      timeOfDay: state.world.timeOfDay,
      curfewActive: state.world.curfewActive,
      inCombat: state.world.inCombat,
      isPlayerTurn: state.world.isPlayerTurn,
      engagementMode: state.world.engagementMode,
      globalAlertLevel: state.world.globalAlertLevel,
      workbenchAvailable: state.world.workbenchAvailable,
    },
    stealth: {
      enabled: player.stealthModeEnabled,
      curfewActive: state.world.curfewActive,
      camerasNearby: state.surveillance.hud.camerasNearby,
      detectionProgress: state.surveillance.hud.detectionProgress,
      activeCameraId: state.surveillance.hud.activeCameraId,
      cameraAlertState: state.surveillance.hud.alertState,
      networkAlertActive: state.surveillance.hud.networkAlertActive,
    },
    paranoia: {
      value: state.paranoia.value,
      tier: state.paranoia.tier,
      frozen: state.paranoia.frozen,
    },
    suspicion: {
      paused: state.suspicion.paused,
      zones: Object.values(state.suspicion.zones).map((zone) => ({
        zoneId: zone.zoneId,
        totalHeat: zone.heat.totalHeat,
        tier: zone.heat.tier,
        memoryCount: Object.keys(zone.memories).length,
      })),
    },
    objectives: buildObjectivesSnapshot(state),
    mission: {
      currentLevelIndex: state.missions.currentLevelIndex,
      pendingAdvance: state.missions.pendingAdvance,
      celebrationAcknowledged: state.missions.celebrationAcknowledged,
      levels: state.missions.levels.map((level) => ({
        level: level.level,
        levelId: level.levelId,
        name: level.name,
        zoneId: level.zoneId ?? '',
        objectiveCount: level.objectives.length,
      })),
    },
    npcs: trimList(area.entities.npcs).map((npc) => ({
      id: npc.id,
      name: npc.name,
      dialogueId: npc.dialogueId,
      isInteractive: npc.isInteractive,
      factionId: npc.factionId,
      socialTags: npc.socialTags ?? [],
      position: clonePosition(npc.position),
      health: npc.health,
      maxHealth: npc.maxHealth,
    })),
    items: trimList(area.entities.items).map((item) => ({
      id: item.id,
      definitionId: item.definitionId,
      resourceKey: item.resourceKey,
      name: item.name,
      isQuestItem: item.isQuestItem,
      quantity: item.quantity,
      position: item.position ? clonePosition(item.position) : null,
      tags: item.tags ?? [],
    })),
    enemies: trimList(area.entities.enemies).map((enemy) => ({
      id: enemy.id,
      name: enemy.name,
      position: clonePosition(enemy.position),
      health: enemy.health,
      maxHealth: enemy.maxHealth,
      alertLevel: enemy.alertLevel,
      alertProgress: enemy.alertProgress,
      aiState: enemy.aiState,
      isHostile: enemy.isHostile,
    })),
    cameras: buildCamerasSnapshot(state),
    dialogue: {
      active: Boolean(dialogueId && currentNodeId),
      dialogueId,
      currentNodeId,
      speakerId: currentNode?.speakerId,
      text: currentNode?.text,
      options: currentNode ? mapDialogueOptions(state, currentNode.options) : [],
    },
    overlays: {
      missionFailureOpen: player.health <= 0,
      missionCompletionPending: state.missions.pendingAdvance && !state.missions.celebrationAcknowledged,
      activeDialogue: Boolean(dialogueId && currentNodeId),
    },
    recentLogs: state.log.messages.slice(-QA_SAFE_LOG_LIMIT),
  };
};

export const shouldEnableGetawayAgentBridge = (
  search: string,
  nodeEnv: string | undefined = typeof process !== 'undefined' ? process.env.NODE_ENV : undefined
): boolean => {
  const normalizedSearch = search.startsWith('?') ? search : `?${search}`;
  const params = new URLSearchParams(normalizedSearch);
  return params.get('agent') === '1' && nodeEnv !== 'production';
};

export const validateAgentAction = (action: unknown): AgentActionValidation => {
  if (!action || typeof action !== 'object') {
    return { ok: false, message: 'Action must be an object.' };
  }

  const candidate = action as Partial<GetawayAgentAction>;
  switch (candidate.type) {
    case 'startLevel0':
      return typeof candidate.name === 'undefined' || typeof candidate.name === 'string'
        ? { ok: true, message: 'ok' }
        : { ok: false, message: 'startLevel0.name must be a string when provided.' };
    case 'clickTile':
      return isPosition(candidate.position)
        ? { ok: true, message: 'ok' }
        : { ok: false, message: 'clickTile.position must contain integer x and y.' };
    case 'focusObjective':
      return typeof candidate.position === 'undefined' || isPosition(candidate.position)
        ? { ok: true, message: 'ok' }
        : { ok: false, message: 'focusObjective.position must contain integer x and y when provided.' };
    case 'interactNpc':
      return [candidate.id, candidate.role, candidate.name].every(
        (value) => typeof value === 'undefined' || typeof value === 'string'
      )
        ? { ok: true, message: 'ok' }
        : { ok: false, message: 'interactNpc target fields must be strings when provided.' };
    case 'collectItem':
      if (![candidate.id, candidate.role, candidate.name].every(
        (value) => typeof value === 'undefined' || typeof value === 'string'
      )) {
        return { ok: false, message: 'collectItem target fields must be strings when provided.' };
      }
      return typeof candidate.position === 'undefined' || isPosition(candidate.position)
        ? { ok: true, message: 'ok' }
        : { ok: false, message: 'collectItem.position must contain integer x and y when provided.' };
    case 'toggleStealth':
    case 'continueMission':
    case 'advanceMission':
    case 'triggerMissionFailure':
    case 'retryMission':
      return { ok: true, message: 'ok' };
    case 'chooseDialogueOption':
      return isFiniteInteger(candidate.index) && candidate.index >= 0
        ? { ok: true, message: 'ok' }
        : { ok: false, message: 'chooseDialogueOption.index must be a non-negative integer.' };
    case 'setClock':
      return candidate.phase === 'day' || candidate.phase === 'night' || candidate.phase === 'midday'
        ? { ok: true, message: 'ok' }
        : { ok: false, message: 'setClock.phase must be day, night, or midday.' };
    case 'waitForDialogue':
    case 'waitForPlayerIdle':
      return typeof candidate.timeoutMs === 'undefined'
        || (typeof candidate.timeoutMs === 'number' && Number.isFinite(candidate.timeoutMs))
        ? { ok: true, message: 'ok' }
        : { ok: false, message: `${candidate.type}.timeoutMs must be a finite number when provided.` };
    case 'waitForObjectiveChange':
      if (typeof candidate.fromId !== 'undefined' && typeof candidate.fromId !== 'string') {
        return { ok: false, message: 'waitForObjectiveChange.fromId must be a string when provided.' };
      }
      return typeof candidate.timeoutMs === 'undefined'
        || (typeof candidate.timeoutMs === 'number' && Number.isFinite(candidate.timeoutMs))
        ? { ok: true, message: 'ok' }
        : { ok: false, message: 'waitForObjectiveChange.timeoutMs must be a finite number when provided.' };
    case 'wait':
      return typeof candidate.ms === 'undefined' || (typeof candidate.ms === 'number' && Number.isFinite(candidate.ms))
        ? { ok: true, message: 'ok' }
        : { ok: false, message: 'wait.ms must be a finite number when provided.' };
    default:
      return { ok: false, message: 'Unknown agent action type.' };
  }
};

const isWalkableTile = (state: RootState, position: Position): boolean => {
  const row = state.world.currentMapArea.tiles[position.y];
  const tile = row?.[position.x];
  return Boolean(tile?.isWalkable);
};

const waitFor = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, Math.max(0, Math.min(ms, 5_000)));
  });

const findObjectiveTargetPosition = (state: RootState): Position | null => {
  const activeObjective = buildObjectivesSnapshot(state).find(
    (objective) => objective.isActive && !objective.isCompleted
  );
  if (!activeObjective) {
    return null;
  }

  const target = activeObjective.target.toLowerCase();
  const area = state.world.currentMapArea;

  const npc = area.entities.npcs.find((entry) =>
    [entry.id, entry.name, entry.dialogueId].some((value) => value.toLowerCase() === target)
  );
  if (npc) {
    return clonePosition(npc.position);
  }

  const item = area.entities.items.find((entry) =>
    [entry.id, entry.definitionId, entry.name]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase() === target)
  );
  if (item?.position) {
    return clonePosition(item.position);
  }

  const enemy = area.entities.enemies.find((entry) =>
    [entry.id, entry.name].some((value) => value.toLowerCase() === target)
  );
  return enemy ? clonePosition(enemy.position) : null;
};

const getActiveObjectiveId = (snapshot: GetawayAgentSnapshot): string | null =>
  snapshot.objectives.find((objective) => objective.isActive && !objective.isCompleted)?.objectiveId ?? null;

export const buildAgentStateSignature = (snapshot: GetawayAgentSnapshot): string =>
  JSON.stringify({
    position: snapshot.player.position,
    health: snapshot.player.health,
    actionPoints: snapshot.player.actionPoints,
    movementProfile: snapshot.player.movementProfile,
    stealthModeEnabled: snapshot.player.stealthModeEnabled,
    stealthCooldownExpiresAt: snapshot.player.stealthCooldownExpiresAt,
    inventoryCount: snapshot.player.inventoryCount,
    currentTime: snapshot.world.currentTime,
    timeOfDay: snapshot.world.timeOfDay,
    curfewActive: snapshot.world.curfewActive,
    inCombat: snapshot.world.inCombat,
    isPlayerTurn: snapshot.world.isPlayerTurn,
    engagementMode: snapshot.world.engagementMode,
    globalAlertLevel: snapshot.world.globalAlertLevel,
    paranoiaValue: snapshot.paranoia.value,
    paranoiaTier: snapshot.paranoia.tier,
    activeObjectiveId: getActiveObjectiveId(snapshot),
    completedObjectiveIds: snapshot.objectives
      .filter((objective) => objective.isCompleted)
      .map((objective) => objective.objectiveId)
      .sort(),
    dialogueId: snapshot.dialogue.dialogueId,
    dialogueNodeId: snapshot.dialogue.currentNodeId,
    dialogueActive: snapshot.dialogue.active,
    pendingAdvance: snapshot.mission.pendingAdvance,
  });

const normalizeTargetToken = (value: string): string => value.trim().toLowerCase();

const getTargetTokens = (action: TargetedAgentAction): string[] =>
  [action.id, action.role, action.name]
    .filter((value): value is string => Boolean(value?.trim()))
    .map(normalizeTargetToken);

const matchesAnyToken = (values: Array<string | undefined>, tokens: string[]): boolean => {
  if (tokens.length === 0) {
    return false;
  }

  return values
    .filter((value): value is string => Boolean(value))
    .map(normalizeTargetToken)
    .some((value) => tokens.some((token) => value === token || value.includes(token)));
};

const findActiveObjective = (state: RootState) =>
  state.quests.quests
    .filter((quest) => quest.isActive && !quest.isCompleted)
    .flatMap((quest) => quest.objectives)
    .find((objective) => !objective.isCompleted);

const resolveNpcTarget = (state: RootState, action: TargetedAgentAction) => {
  const tokens = getTargetTokens(action);
  const area = state.world.currentMapArea;
  const objective = findActiveObjective(state);

  return area.entities.npcs.find((npc) => {
    if (!npc.isInteractive || !npc.dialogueId) {
      return false;
    }

    if (matchesAnyToken([npc.id, npc.name, npc.dialogueId, ...(npc.socialTags ?? [])], tokens)) {
      return true;
    }

    return tokens.length === 0 && objective
      ? [npc.id, npc.name, npc.dialogueId].some(
        (value) => normalizeTargetToken(value) === normalizeTargetToken(objective.target)
      )
      : false;
  }) ?? null;
};

const getManhattanDistance = (from: Position, to: Position): number =>
  Math.abs(from.x - to.x) + Math.abs(from.y - to.y);

const findLatestNpc = (state: RootState, npc: NPC): NPC =>
  state.world.currentMapArea.entities.npcs.find((entry) => entry.id === npc.id) ?? npc;

const isDialogueOpenForNpc = (state: RootState, npc: NPC): boolean =>
  Boolean(npc.dialogueId && state.quests.activeDialogue.dialogueId === npc.dialogueId);

const resolveItemTarget = (state: RootState, action: TargetedAgentAction) => {
  const area = state.world.currentMapArea;
  if (action.type === 'collectItem' && action.position) {
    return area.entities.items.find(
      (item) => item.position?.x === action.position?.x && item.position?.y === action.position?.y
    ) ?? null;
  }

  const tokens = getTargetTokens(action);
  const objective = findActiveObjective(state);

  return area.entities.items.find((item) => {
    if (matchesAnyToken(
      [item.id, item.definitionId, item.resourceKey, item.name, ...(item.tags ?? [])],
      tokens
    )) {
      return true;
    }

    return tokens.length === 0 && objective
      ? [item.id, item.definitionId, item.resourceKey, item.name].some(
        (value) => Boolean(value) && normalizeTargetToken(value!) === normalizeTargetToken(objective.target)
      )
      : false;
  }) ?? null;
};

const waitUntil = async (
  predicate: () => boolean,
  timeoutMs = 3_000,
  intervalMs = 100
): Promise<boolean> => {
  const startedAt = Date.now();
  while (Date.now() - startedAt <= Math.max(0, Math.min(timeoutMs, 10_000))) {
    if (predicate()) {
      return true;
    }
    await waitFor(intervalMs);
  }

  return false;
};

const result = (
  beforeSnapshot: GetawayAgentSnapshot,
  afterSnapshot: GetawayAgentSnapshot,
  action: GetawayAgentAction['type'] | 'unknown',
  status: GetawayAgentActionStatus,
  reason: string,
  evidenceHint = reason,
  stateChangedOverride?: boolean
): GetawayAgentActionResult => ({
  ok: status === 'ok' || status === 'no-op',
  action,
  message: reason,
  status,
  reason,
  beforeObjectiveId: getActiveObjectiveId(beforeSnapshot),
  afterObjectiveId: getActiveObjectiveId(afterSnapshot),
  stateChanged: stateChangedOverride ??
    buildAgentStateSignature(beforeSnapshot) !== buildAgentStateSignature(afterSnapshot),
  evidenceHint,
  snapshot: afterSnapshot,
});

const describeBlockedStealthToggle = (snapshot: GetawayAgentSnapshot): string => {
  if (snapshot.world.inCombat) {
    return 'Stealth toggle blocked by active combat.';
  }

  if (snapshot.dialogue.active) {
    return 'Stealth toggle blocked by active dialogue.';
  }

  if (
    snapshot.stealth.cameraAlertState === 'alarmed' &&
    snapshot.stealth.detectionProgress >= 100
  ) {
    return 'Stealth toggle blocked by active camera lock.';
  }

  if (
    typeof snapshot.player.stealthCooldownExpiresAt === 'number' &&
    snapshot.player.stealthCooldownExpiresAt > Date.now()
  ) {
    return 'Stealth toggle blocked by recalibration cooldown.';
  }

  return 'Stealth toggle produced no QA-visible state change.';
};

const currentResult = (
  state: RootState,
  action: GetawayAgentAction['type'] | 'unknown',
  status: GetawayAgentActionStatus,
  reason: string,
  evidenceHint = reason
): GetawayAgentActionResult => {
  const snapshot = buildAgentSnapshot(state);
  return result(snapshot, snapshot, action, status, reason, evidenceHint);
};

const dispatchBridgeAction = async (
  store: GetawayAgentStore,
  action: GetawayAgentAction
): Promise<GetawayAgentActionResult> => {
  const validation = validateAgentAction(action);
  if (!validation.ok) {
    return currentResult(store.getState(), action.type ?? 'unknown', 'rejected', validation.message);
  }

  const state = store.getState();
  const beforeSnapshot = buildAgentSnapshot(state);
  switch (action.type) {
    case 'startLevel0': {
      window.dispatchEvent(new CustomEvent(GETAWAY_AGENT_START_LEVEL0_EVENT, {
        detail: { name: action.name },
      }));
      await waitFor(100);
      return result(
        beforeSnapshot,
        buildAgentSnapshot(store.getState()),
        action.type,
        'ok',
        'Started a fresh Level 0 agent run.',
        'Level 0 restart event dispatched through the agent bridge.'
      );
    }

    case 'clickTile': {
      if (!isWalkableTile(state, action.position)) {
        return currentResult(state, action.type, 'rejected', 'Target tile is outside the map or not walkable.');
      }

      window.dispatchEvent(new CustomEvent<TileClickDetail>(TILE_CLICK_EVENT, {
        detail: {
          areaId: state.world.currentMapArea.id,
          position: action.position,
        },
      }));
      await waitFor(100);
      return result(
        beforeSnapshot,
        buildAgentSnapshot(store.getState()),
        action.type,
        'ok',
        `Clicked tile ${action.position.x},${action.position.y}.`,
        `Tile click dispatched at ${action.position.x},${action.position.y}.`
      );
    }

    case 'focusObjective': {
      const target = action.position ?? findObjectiveTargetPosition(state);
      if (!target) {
        return currentResult(state, action.type, 'rejected', 'No active objective target position could be resolved.');
      }

      window.dispatchEvent(new CustomEvent<MiniMapObjectiveFocusDetail>(MINIMAP_OBJECTIVE_FOCUS_EVENT, {
        detail: {
          areaId: state.world.currentMapArea.id,
          target,
          animate: true,
        },
      }));
      await waitFor(100);
      return result(
        beforeSnapshot,
        buildAgentSnapshot(store.getState()),
        action.type,
        'ok',
        `Focused objective at ${target.x},${target.y}.`,
        `Objective focus dispatched at ${target.x},${target.y}.`
      );
    }

    case 'interactNpc': {
      const npc = resolveNpcTarget(state, action);
      if (!npc) {
        return currentResult(state, action.type, 'rejected', 'No matching interactive NPC could be resolved.');
      }

      const startingDistanceToNpc = getManhattanDistance(state.player.data.position, npc.position);
      const moveTimeoutMs = resolveAgentMovementTimeoutMs(startingDistanceToNpc);

      window.dispatchEvent(new CustomEvent<TileClickDetail>(TILE_CLICK_EVENT, {
        detail: {
          areaId: state.world.currentMapArea.id,
          position: npc.position,
        },
      }));

      await waitUntil(() => {
        const currentState = store.getState();
        const latestNpc = findLatestNpc(currentState, npc);
        return isDialogueOpenForNpc(currentState, latestNpc) ||
          getManhattanDistance(currentState.player.data.position, latestNpc.position) <= NPC_INTERACTION_RANGE;
      }, moveTimeoutMs, 100);

      let nextState = store.getState();
      let latestNpc = findLatestNpc(nextState, npc);
      let dialogueOpened = isDialogueOpenForNpc(nextState, latestNpc);
      let distanceToNpc = getManhattanDistance(nextState.player.data.position, latestNpc.position);

      if (!dialogueOpened && distanceToNpc <= NPC_INTERACTION_RANGE) {
        window.dispatchEvent(new CustomEvent<TileClickDetail>(TILE_CLICK_EVENT, {
          detail: {
            areaId: nextState.world.currentMapArea.id,
            position: latestNpc.position,
          },
        }));

        await waitUntil(() => {
          const currentState = store.getState();
          return isDialogueOpenForNpc(currentState, findLatestNpc(currentState, npc));
        }, 750, 50);

        nextState = store.getState();
        latestNpc = findLatestNpc(nextState, npc);
        dialogueOpened = isDialogueOpenForNpc(nextState, latestNpc);
        distanceToNpc = getManhattanDistance(nextState.player.data.position, latestNpc.position);
      }

      const afterSnapshot = buildAgentSnapshot(nextState);
      if (dialogueOpened) {
        return result(
          beforeSnapshot,
          afterSnapshot,
          action.type,
          'ok',
          `Opened dialogue with NPC ${latestNpc.name}.`,
          `NPC ${latestNpc.id} dialogue opened at ${latestNpc.position.x},${latestNpc.position.y}.`
        );
      }

      return result(
        beforeSnapshot,
        afterSnapshot,
        action.type,
        distanceToNpc <= NPC_INTERACTION_RANGE
          ? 'no-op'
          : distanceToNpc < startingDistanceToNpc
            ? 'ok'
            : 'timeout',
        distanceToNpc <= NPC_INTERACTION_RANGE
          ? afterSnapshot.world.inCombat
            ? `Combat pressure blocks NPC ${latestNpc.name} dialogue; resolve the encounter before talking.`
            : `Reached NPC ${latestNpc.name} interaction range, but dialogue did not open yet.`
          : distanceToNpc < startingDistanceToNpc
            ? `Moved toward NPC ${latestNpc.name}; distance is now ${distanceToNpc}.`
          : `Timed out moving toward NPC ${latestNpc.name}; distance is ${distanceToNpc}.`,
        `NPC ${latestNpc.id} target at ${latestNpc.position.x},${latestNpc.position.y}; player distance ${distanceToNpc}; startDistance=${startingDistanceToNpc}; moveTimeoutMs=${moveTimeoutMs}.`
      );
    }

    case 'collectItem': {
      const item = resolveItemTarget(state, action);
      if (!item?.position) {
        return currentResult(state, action.type, 'rejected', 'No matching collectable map item could be resolved.');
      }

      if (!isWalkableTile(state, item.position)) {
        return currentResult(state, action.type, 'rejected', 'Target item tile is outside the map or not walkable.');
      }

      window.dispatchEvent(new CustomEvent<TileClickDetail>(TILE_CLICK_EVENT, {
        detail: {
          areaId: state.world.currentMapArea.id,
          position: item.position,
        },
      }));
      const beforeObjectiveId = getActiveObjectiveId(beforeSnapshot);
      await waitUntil(() => {
        const currentState = store.getState();
        const currentSnapshot = buildAgentSnapshot(currentState);
        const latestItem = resolveItemTarget(currentState, action);
        return getActiveObjectiveId(currentSnapshot) !== beforeObjectiveId || !latestItem?.position;
      }, 8_000, 100);

      const afterSnapshot = buildAgentSnapshot(store.getState());
      const afterObjectiveId = getActiveObjectiveId(afterSnapshot);
      const latestItem = resolveItemTarget(store.getState(), action);
      const resolved = afterObjectiveId !== beforeObjectiveId || !latestItem?.position;
      return result(
        beforeSnapshot,
        afterSnapshot,
        action.type,
        'ok',
        resolved
          ? `Resolved collectable item ${item.name}.`
          : `Moved toward collectable item ${item.name}.`,
        `Item ${item.id} targeted at ${item.position.x},${item.position.y}.`
      );
    }

    case 'toggleStealth': {
      store.dispatch(requestStealthToggle());
      await waitFor(100);
      const afterSnapshot = buildAgentSnapshot(store.getState());
      const stealthChanged =
        beforeSnapshot.player.stealthModeEnabled !== afterSnapshot.player.stealthModeEnabled ||
        beforeSnapshot.player.movementProfile !== afterSnapshot.player.movementProfile ||
        beforeSnapshot.player.stealthCooldownExpiresAt !== afterSnapshot.player.stealthCooldownExpiresAt ||
        beforeSnapshot.world.engagementMode !== afterSnapshot.world.engagementMode;
      const status: GetawayAgentActionStatus = stealthChanged ? 'ok' : 'no-op';
      return result(
        beforeSnapshot,
        afterSnapshot,
        action.type,
        status,
        stealthChanged ? 'Requested stealth toggle.' : describeBlockedStealthToggle(afterSnapshot),
        'Stealth toggle requested through Redux action.',
        stealthChanged
      );
    }

    case 'advanceMission': {
      if (!state.missions.pendingAdvance) {
        return currentResult(
          state,
          action.type,
          'no-op',
          'No pending mission advance is available.'
        );
      }

      const currentLevel = state.missions.levels[state.missions.currentLevelIndex];
      const nextLevel = state.missions.levels[state.missions.currentLevelIndex + 1];
      store.dispatch(advanceToNextLevel());

      if (nextLevel?.zoneId) {
        store.dispatch(setCurrentMapAreaZoneMetadata({ zoneId: nextLevel.zoneId }));
      }

      await waitFor(100);
      const afterSnapshot = buildAgentSnapshot(store.getState());
      return result(
        beforeSnapshot,
        afterSnapshot,
        action.type,
        'ok',
        `Advanced mission from ${currentLevel?.name ?? 'current level'} to ${nextLevel?.name ?? 'next level'}.`,
        nextLevel
          ? `Mission advanced to ${nextLevel.name}; zone=${nextLevel.zoneId ?? 'unchanged'}.`
          : 'Mission advance acknowledged at the final configured level.'
      );
    }

    case 'continueMission': {
      if (!beforeSnapshot.overlays.missionCompletionPending) {
        return currentResult(
          state,
          action.type,
          'no-op',
          'Mission completion continue is not available because the recap overlay is closed.'
        );
      }

      const continueButton =
        document.querySelector<HTMLButtonElement>('[data-testid="mission-complete-continue"]') ??
        Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
          button.textContent?.toLowerCase().includes('next level')
        );

      if (!continueButton) {
        return currentResult(
          state,
          action.type,
          'rejected',
          'Mission completion continue button could not be found.'
        );
      }

      continueButton.click();
      await waitFor(250);
      return result(
        beforeSnapshot,
        buildAgentSnapshot(store.getState()),
        action.type,
        'ok',
        'Clicked mission completion continue.',
        'Mission completion continue button was clicked through the live DOM.'
      );
    }

    case 'triggerMissionFailure': {
      store.dispatch(setHealth(0));
      await waitFor(100);
      return result(
        beforeSnapshot,
        buildAgentSnapshot(store.getState()),
        action.type,
        'ok',
        'Triggered mission failure state for QA.',
        'Player health set to 0 through the dev-only agent bridge.'
      );
    }

    case 'retryMission': {
      const missionFailureOpen =
        beforeSnapshot.overlays.missionFailureOpen ||
        beforeSnapshot.player.health <= 0;
      if (!missionFailureOpen) {
        return currentResult(
          state,
          action.type,
          'no-op',
          'Mission failure retry is not available because the failure overlay is closed.'
        );
      }

      const retryButton = Array.from(document.querySelectorAll('button')).find((button) =>
        button.textContent?.toLowerCase().includes('restart level 0')
      );
      if (!retryButton) {
        return currentResult(
          state,
          action.type,
          'rejected',
          'Mission failure retry button could not be found.'
        );
      }

      retryButton.click();
      await waitFor(250);
      return result(
        beforeSnapshot,
        buildAgentSnapshot(store.getState()),
        action.type,
        'ok',
        'Clicked mission failure retry.',
        'Mission failure retry button was clicked through the live DOM.'
      );
    }

    case 'chooseDialogueOption': {
      const { currentNode } = resolveCurrentDialogue(state);
      if (!currentNode) {
        return currentResult(state, action.type, 'rejected', 'No active dialogue option can be selected.');
      }

      const selectableOptions = getSelectableDialogueOptions(state, currentNode.options);
      if (action.index >= selectableOptions.length) {
        return currentResult(state, action.type, 'rejected', 'Dialogue option index is out of range.');
      }

      const selected = selectableOptions[action.index];
      window.dispatchEvent(new CustomEvent(GETAWAY_AGENT_DIALOGUE_OPTION_EVENT, {
        detail: {
          index: action.index,
          originalIndex: selected.originalIndex,
        },
      }));
      await waitFor(100);
      return result(
        beforeSnapshot,
        buildAgentSnapshot(store.getState()),
        action.type,
        'ok',
        `Selected dialogue option ${action.index} for '${selected.option.text}'.`,
        selected.option.questEffect
          ? `Dialogue option had quest effect ${selected.option.questEffect.effect}:${selected.option.questEffect.questId}:${selected.option.questEffect.objectiveId ?? ''}.`
          : 'Dialogue option selected through visible option index.'
      );
    }

    case 'setClock': {
      const nextTime =
        action.phase === 'night'
          ? NIGHT_START_SECONDS
          : action.phase === 'midday'
            ? MIDDAY_SECONDS
            : DAY_START_SECONDS;
      store.dispatch(setGameTime(nextTime));
      await waitFor(100);
      return result(
        beforeSnapshot,
        buildAgentSnapshot(store.getState()),
        action.type,
        'ok',
        `Set clock to ${action.phase}.`,
        `World clock set to ${action.phase}.`
      );
    }

    case 'waitForDialogue': {
      const didOpen = await waitUntil(
        () => Boolean(resolveCurrentDialogue(store.getState()).currentNode),
        action.timeoutMs ?? 3_000
      );
      return result(
        beforeSnapshot,
        buildAgentSnapshot(store.getState()),
        action.type,
        didOpen ? 'ok' : 'timeout',
        didOpen ? 'Dialogue opened.' : 'Timed out waiting for dialogue to open.',
        didOpen ? 'Active dialogue node became available.' : 'No active dialogue node before timeout.'
      );
    }

    case 'waitForObjectiveChange': {
      const fromId = action.fromId || getActiveObjectiveId(beforeSnapshot);
      const didChange = await waitUntil(
        () => getActiveObjectiveId(buildAgentSnapshot(store.getState())) !== fromId,
        action.timeoutMs ?? 3_000
      );
      return result(
        beforeSnapshot,
        buildAgentSnapshot(store.getState()),
        action.type,
        didChange ? 'ok' : 'timeout',
        didChange
          ? `Objective changed from ${fromId ?? 'none'}.`
          : `Timed out waiting for objective change from ${fromId ?? 'none'}.`,
        didChange
          ? 'Active objective id changed after the previous action.'
          : 'Active objective id remained unchanged before timeout.'
      );
    }

    case 'waitForPlayerIdle': {
      let lastPosition = clonePosition(store.getState().player.data.position);
      const initialPosition = clonePosition(lastPosition);
      let stableTicks = 0;
      let sawMovement = false;
      const startedAt = Date.now();
      const didSettle = await waitUntil(() => {
        const nextPosition = store.getState().player.data.position;
        const stable = nextPosition.x === lastPosition.x && nextPosition.y === lastPosition.y;
        sawMovement = sawMovement ||
          nextPosition.x !== initialPosition.x ||
          nextPosition.y !== initialPosition.y;
        stableTicks = stable ? stableTicks + 1 : 0;
        lastPosition = clonePosition(nextPosition);
        return stableTicks >= 3 && (sawMovement || Date.now() - startedAt >= 1_200);
      }, action.timeoutMs ?? 5_000, 150);

      return result(
        beforeSnapshot,
        buildAgentSnapshot(store.getState()),
        action.type,
        didSettle ? 'ok' : 'timeout',
        didSettle ? 'Player position settled.' : 'Timed out waiting for player position to settle.',
        didSettle
          ? 'Player position stayed stable across multiple polling intervals.'
          : 'Player position did not settle before timeout.'
      );
    }

    case 'wait': {
      await waitFor(action.ms ?? 500);
      return result(
        beforeSnapshot,
        buildAgentSnapshot(store.getState()),
        action.type,
        'ok',
        `Waited ${action.ms ?? 500}ms.`,
        'Fixed wait completed.'
      );
    }
  }
};

export const installGetawayAgentBridge = (options: {
  store: GetawayAgentStore;
  search?: string;
  nodeEnv?: string;
}): (() => void) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const search = options.search ?? window.location.search;
  if (!shouldEnableGetawayAgentBridge(search, options.nodeEnv)) {
    delete window.__getawayAgent;
    return () => undefined;
  }

  window.__getawayAgent = {
    version: GETAWAY_AGENT_VERSION,
    snapshot: () => buildAgentSnapshot(options.store.getState()),
    dispatch: (action: GetawayAgentAction) => dispatchBridgeAction(options.store, action),
  };

  return () => {
    if (window.__getawayAgent?.version === GETAWAY_AGENT_VERSION) {
      delete window.__getawayAgent;
    }
  };
};

declare global {
  interface Window {
    __getawayAgent?: GetawayAgentBridge;
  }
}
