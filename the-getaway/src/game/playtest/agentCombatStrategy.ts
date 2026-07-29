import type {
  GetawayAgentAction,
  GetawayAgentSnapshot,
} from './agentBridge';
import type { PlaytestTraceEntry } from './reporting';

const COMBAT_TRACE_MARKER = 'combatStrategy=resolve-combat';

type SnapshotObjective = GetawayAgentSnapshot['objectives'][number];
type SnapshotEnemy = GetawayAgentSnapshot['enemies'][number];
type SnapshotItem = GetawayAgentSnapshot['items'][number];
const distanceBetween = (
  left: { x: number; y: number },
  right: { x: number; y: number }
): number => Math.abs(left.x - right.x) + Math.abs(left.y - right.y);

const activeObjectiveFromSnapshot = (
  snapshot: GetawayAgentSnapshot
): SnapshotObjective | null =>
  snapshot.objectives.find((objective) => objective.isActive && !objective.isCompleted) ?? null;

const collectRoleByObjectiveId: Record<string, string> = {
  'recover-keycard': 'corporate_keycard',
  'obtain-datapad': 'encrypted_datapad',
  'find-transit-tokens': 'transit_tokens',
};

const resolveCollectAction = (
  objective: SnapshotObjective | null
): GetawayAgentAction | null => {
  if (!objective || objective.type !== 'collect') {
    return null;
  }

  const role = collectRoleByObjectiveId[objective.objectiveId];
  if (role) {
    return { type: 'collectItem', role };
  }

  return objective.target.trim()
    ? { type: 'collectItem', name: objective.target }
    : null;
};

const normalize = (value: string): string => value.trim().toLowerCase();

const findObjectiveItem = (
  snapshot: GetawayAgentSnapshot,
  objective: SnapshotObjective
): SnapshotItem | null => {
  const role = collectRoleByObjectiveId[objective.objectiveId];
  const objectiveTarget = normalize(objective.target);

  return snapshot.items.find((item) => {
    if (!item.position) {
      return false;
    }

    const itemTokens = [
      item.id,
      item.definitionId,
      item.resourceKey,
      item.name,
      ...(item.tags ?? []),
    ]
      .filter((value): value is string => Boolean(value))
      .map(normalize);

    return itemTokens.some((token) =>
      Boolean(role && token.includes(role)) ||
      token === objectiveTarget ||
      token.includes(objectiveTarget)
    );
  }) ?? null;
};

const shouldPrioritizeCombatObjective = (
  snapshot: GetawayAgentSnapshot,
  objective: SnapshotObjective | null
): boolean => {
  if (!objective || objective.type !== 'collect' || objective.objectiveId !== 'recover-keycard') {
    return false;
  }

  return Boolean(findObjectiveItem(snapshot, objective));
};

const chooseNearestHostile = (
  snapshot: GetawayAgentSnapshot
): SnapshotEnemy | null =>
  snapshot.enemies
    .filter((enemy) => enemy.isHostile && enemy.health > 0)
    .sort((left, right) => {
      const distanceDelta =
        distanceBetween(left.position, snapshot.player.position) -
        distanceBetween(right.position, snapshot.player.position);
      if (distanceDelta !== 0) {
        return distanceDelta;
      }

      const healthDelta = left.health - right.health;
      if (healthDelta !== 0) {
        return healthDelta;
      }

      return left.id.localeCompare(right.id);
    })[0] ?? null;

export const chooseAgentCombatAction = (
  snapshot: GetawayAgentSnapshot
): GetawayAgentAction | null => {
  if (!snapshot.world.inCombat) {
    return null;
  }

  if (!snapshot.world.isPlayerTurn || snapshot.player.actionPoints <= 0) {
    return { type: 'wait', ms: 750 };
  }

  const activeObjective = activeObjectiveFromSnapshot(snapshot);
  if (shouldPrioritizeCombatObjective(snapshot, activeObjective)) {
    return resolveCollectAction(activeObjective);
  }

  const hostile = chooseNearestHostile(snapshot);
  if (hostile) {
    return { type: 'clickTile', position: hostile.position };
  }

  return resolveCollectAction(activeObjective) ?? { type: 'wait', ms: 750 };
};

export const buildAgentCombatTraceNote = (
  snapshot: GetawayAgentSnapshot,
  action: GetawayAgentAction
): string | null => {
  if (!snapshot.world.inCombat) {
    return null;
  }

  const hostiles = snapshot.enemies.filter((enemy) => enemy.isHostile && enemy.health > 0);
  const objective = activeObjectiveFromSnapshot(snapshot);
  const selectedHostile = action.type === 'clickTile'
    ? hostiles.find((enemy) =>
      enemy.position.x === action.position.x && enemy.position.y === action.position.y
    ) ?? null
    : null;
  const selected = selectedHostile
    ? `${selectedHostile.name}:${selectedHostile.id}@${selectedHostile.position.x},${selectedHostile.position.y}`
    : action.type === 'collectItem'
      ? `objective:${objective?.objectiveId ?? 'none'}`
      : action.type;

  return [
    COMBAT_TRACE_MARKER,
    `hostiles=${hostiles.length}`,
    `selected=${selected}`,
    `playerAp=${snapshot.player.actionPoints}`,
    `activeObjective=${objective?.objectiveId ?? 'none'}`,
  ].join('; ');
};

export const isAgentCombatTraceResult = (result: string): boolean =>
  result.includes(COMBAT_TRACE_MARKER);

const parseTraceAction = (entry: Pick<PlaytestTraceEntry, 'action'>): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(entry.action);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
};

const objectiveToken = (objective: Pick<SnapshotObjective, 'target'>): string => {
  const tokens = objective.target.toLowerCase().split(/\s+/);
  return tokens[tokens.length - 1] ?? objective.target.toLowerCase();
};

export const isObjectiveStallRetryTrace = (
  entry: Pick<PlaytestTraceEntry, 'action' | 'result'>,
  objective: Pick<SnapshotObjective, 'objectiveId' | 'target'>
): boolean => {
  if (isAgentCombatTraceResult(entry.result)) {
    return false;
  }

  const action = parseTraceAction(entry);
  const type = String(action.type ?? '');
  const role = String(action.role ?? action.name ?? action.id ?? '').toLowerCase();
  const result = entry.result.toLowerCase();
  const sameObjectiveNoProgress =
    entry.result.includes(`beforeObjective=${objective.objectiveId}`) &&
    entry.result.includes(`afterObjective=${objective.objectiveId}`) &&
    (entry.result.includes('stateChanged=false') || type === 'collectItem' || type === 'clickTile');

  return (
    (type === 'collectItem' || type === 'interactNpc' || type === 'clickTile') &&
    (
      role.includes(objectiveToken(objective)) ||
      result.includes(objective.target.toLowerCase()) ||
      sameObjectiveNoProgress
    )
  );
};

export const countNoProgressActionTraces = (
  trace: Pick<PlaytestTraceEntry, 'action' | 'result'>[],
  actionType: GetawayAgentAction['type']
): number =>
  trace.filter((entry) => {
    const action = parseTraceAction(entry);
    return action.type === actionType && entry.result.includes('stateChanged=false');
  }).length;
