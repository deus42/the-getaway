import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  movePlayer,
  updateActionPoints,
  setPlayerData,
  resetActionPoints,
  beginPlayerTurn,
  consumeStamina,
  regenerateStamina,
  setCrouching,
} from "../store/playerSlice";
import {
  updateEnemy,
  enterCombat,
  switchTurn,
  exitCombat,
  addEnemy,
  updateNPC,
  setGlobalAlertLevel,
  scheduleReinforcements,
  clearReinforcementsSchedule,
} from "../store/worldSlice";
import { addLogMessage } from "../store/logSlice";
import { addFloatingNumber, triggerHitFlash } from "../store/combatFeedbackSlice";
import { RootState } from "../store";
import { isPositionWalkable } from "../game/world/grid";
import {
  executeAttack,
  isInAttackRange,
  DEFAULT_ATTACK_COST,
} from "../game/combat/combatSystem";
import {
  Enemy,
  Player,
  Position,
  MapArea,
  TileType,
  NPC,
  AlertLevel,
  SurveillanceZoneState,
} from "../game/interfaces/types";
import {
  CurfewStateMachine,
  CurfewTimeoutHandle,
  createCurfewStateMachine,
} from "../game/systems/curfewStateMachine";
import { determineEnemyMove } from "../game/combat/enemyAI";
import { setMapArea } from "../store/worldSlice";
import { v4 as uuidv4 } from "uuid";
import { findPath } from "../game/world/pathfinding";
import { TILE_CLICK_EVENT, TileClickDetail, PATH_PREVIEW_EVENT, MINIMAP_PATH_PREVIEW_EVENT, MiniMapPathPreviewDetail } from "../game/events";
import { startDialogue, endDialogue } from "../store/questsSlice";
import { getSystemStrings } from "../content/system";
import { getUIStrings } from "../content/ui";
import { processPerceptionUpdates, getAlertMessageKey, shouldSpawnReinforcements, getReinforcementDelay } from "../game/combat/perceptionManager";
import { shouldGunFuAttackBeFree } from "../game/systems/perks";
import { getStandingForValue, getStandingRank, getLocalizedStandingLabel } from "../game/systems/factions";
import { STAMINA_COSTS } from "../game/systems/stamina";
import {
  initializeZoneSurveillance,
  teardownZoneSurveillance,
  handleTimeOfDayForSurveillance,
  updateSurveillance,
} from "../game/systems/surveillance/cameraSystem";
import { setOverlayEnabled } from "../store/surveillanceSlice";
import { createScopedLogger } from "../utils/logger";

const GameController: React.FC = () => {
  const log = useMemo(() => createScopedLogger("GameController"), []);
  const dispatch = useDispatch();
  const player = useSelector((state: RootState) => state.player.data);
  const encumbranceLevel = player.encumbrance.level;
  const encumbranceWarning = player.encumbrance.warning;
  const encumbrancePercentage = player.encumbrance.percentage;
  const currentMapArea = useSelector(
    (state: RootState) => state.world.currentMapArea
  );
  const mapAreaId = currentMapArea?.id;
  const mapAreaIsInterior = currentMapArea?.isInterior ?? false;
  const inCombat = useSelector((state: RootState) => state.world.inCombat);
  const isPlayerTurn = useSelector(
    (state: RootState) => state.world.isPlayerTurn
  );
  const timeOfDay = useSelector((state: RootState) => state.world.timeOfDay);
  const curfewActive = useSelector(
    (state: RootState) => state.world.curfewActive
  );
  const enemies = useSelector(
    (state: RootState) => state.world.currentMapArea.entities.enemies
  );
  const mapDirectory = useSelector(
    (state: RootState) => state.world.mapAreas
  );
  const mapConnections = useSelector(
    (state: RootState) => state.world.mapConnections
  );
  const dialogues = useSelector((state: RootState) => state.quests.dialogues);
  const activeDialogueId = useSelector(
    (state: RootState) => state.quests.activeDialogue.dialogueId
  );
  const locale = useSelector((state: RootState) => state.settings.locale);
  const globalAlertLevel = useSelector((state: RootState) => state.world.globalAlertLevel);
  const reinforcementsScheduled = useSelector((state: RootState) => state.world.reinforcementsScheduled);
  const surveillanceZone = useSelector((state: RootState) => (mapAreaId ? state.surveillance.zones[mapAreaId] : undefined));
  const overlayEnabled = useSelector((state: RootState) => state.surveillance.hud.overlayEnabled);
  const logStrings = useMemo(() => getSystemStrings(locale).logs, [locale]);
  const uiStrings = useMemo(() => getUIStrings(locale), [locale]);
  const prevInCombat = useRef(inCombat); // Ref to track previous value
  const previousTimeOfDay = useRef(timeOfDay);
  const previousGlobalAlertLevel = useRef(globalAlertLevel);
  const surveillanceZoneRef = useRef<SurveillanceZoneState | undefined>(undefined);
  const playerRef = useRef<Player>(player);
  const mapAreaRef = useRef<MapArea | null>(currentMapArea ?? null);
  const reinforcementsScheduledRef = useRef(reinforcementsScheduled);
  const curfewStateMachineRef = useRef<CurfewStateMachine>(createCurfewStateMachine());
  const reinforcementTimeoutRef = useRef<CurfewTimeoutHandle | null>(null);
  const globalAlertLevelRef = useRef(globalAlertLevel);
  const timeOfDayRef = useRef(timeOfDay);
  const overlayEnabledRef = useRef(overlayEnabled);
  const previousSurveillanceAreaId = useRef<string | null>(null);

  // State to track current enemy turn processing
  const [currentEnemyTurnIndex, setCurrentEnemyTurnIndex] = useState<number>(0);
  const enemyActionTimeoutRef = useRef<number | null>(null);
  const processingEnemyIdRef = useRef<string | null>(null);
  const movementStepTimeoutRef = useRef<number | null>(null);
  type CurfewAlertState = "clear" | "warning" | "spawned";
  const [curfewAlertState, setCurfewAlertState] =
    useState<CurfewAlertState>("clear");
  const [queuedPath, setQueuedPath] = useState<Position[]>([]);
  const activeNpcMovements = useRef<Set<string>>(new Set());
  const npcMovementTimeouts = useRef<number[]>([]);
  const npcReservedDestinations = useRef<Map<string, Position>>(new Map());
  const previousEncumbranceWarning = useRef<string | null>(null);
  const [pendingNpcInteractionId, setPendingNpcInteractionId] = useState<string | null>(null);
  const [pendingEnemyEngagementId, setPendingEnemyEngagementId] = useState<string | null>(null);
  const beginDialogueWithNpc = useCallback(
    (npc: NPC): boolean => {
      if (!npc.isInteractive || !npc.dialogueId) {
        dispatch(addLogMessage(logStrings.npcNotReady(npc.name)));
        return false;
      }

      if (activeDialogueId === npc.dialogueId) {
        return true;
      }

      const dialogue = dialogues.find((entry) => entry.id === npc.dialogueId);

      if (!dialogue || dialogue.nodes.length === 0) {
        dispatch(addLogMessage(logStrings.npcNoNewInfo(npc.name)));
        return false;
      }

      const initialNodeId = dialogue.nodes[0]?.id;

      if (!initialNodeId) {
        dispatch(addLogMessage(logStrings.npcChannelEmpty(npc.name)));
        return false;
      }

      dispatch(startDialogue({ dialogueId: dialogue.id, nodeId: initialNodeId }));
      dispatch(addLogMessage(logStrings.npcChannelOpened(npc.name)));
      return true;
    },
    [dispatch, dialogues, activeDialogueId, logStrings]
  );


  const attemptMovementStamina = useCallback(
    (options: { sprint?: boolean } = {}) => {
      const { sprint = false } = options;

      if (inCombat) {
        return true;
      }

      if (sprint && player.isExhausted) {
        dispatch(addLogMessage(logStrings.tooTiredToSprint));
        return false;
      }

      const encumbranceDrain = encumbrancePercentage >= 80
        ? STAMINA_COSTS.strenuousInteraction
        : 0;

      let staminaCost = encumbranceDrain;

      if (sprint) {
        staminaCost += STAMINA_COSTS.sprintTile;
      }

      if (staminaCost <= 0) {
        if (player.stamina < player.maxStamina) {
          dispatch(regenerateStamina(undefined));
        }
        return true;
      }

      if (player.stamina < staminaCost) {
        dispatch(addLogMessage(logStrings.notEnoughStamina(staminaCost, player.stamina)));
        return false;
      }

      dispatch(consumeStamina(staminaCost));
      return true;
    },
    [
      encumbrancePercentage,
      dispatch,
      inCombat,
      logStrings,
      player.isExhausted,
      player.stamina,
      player.maxStamina,
    ]
  );

  const cancelPendingEnemyAction = useCallback((shouldClearTimer: boolean = true) => {
    if (shouldClearTimer && enemyActionTimeoutRef.current !== null) {
      window.clearTimeout(enemyActionTimeoutRef.current);
    }
    enemyActionTimeoutRef.current = null;
    processingEnemyIdRef.current = null;
  }, []);

  // Reference to the div element for focusing
  const controllerRef = useRef<HTMLDivElement>(null);

  const getNow = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  useEffect(() => {
    surveillanceZoneRef.current = surveillanceZone;
  }, [surveillanceZone]);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    mapAreaRef.current = currentMapArea ?? null;
  }, [currentMapArea]);

  useEffect(() => {
    reinforcementsScheduledRef.current = reinforcementsScheduled;
  }, [reinforcementsScheduled]);

  useEffect(() => {
    if (!reinforcementsScheduled && reinforcementTimeoutRef.current !== null) {
      curfewStateMachineRef.current.cancel(reinforcementTimeoutRef.current);
      reinforcementTimeoutRef.current = null;
    }
  }, [reinforcementsScheduled]);

  useEffect(() => {
    globalAlertLevelRef.current = globalAlertLevel;
  }, [globalAlertLevel]);

  useEffect(() => {
    timeOfDayRef.current = timeOfDay;
  }, [timeOfDay]);

  useEffect(() => {
    overlayEnabledRef.current = overlayEnabled;
  }, [overlayEnabled]);

  // Auto-focus when component mounts
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.focus();
    }

    // Re-focus when clicked anywhere on the document
    const handleClick = () => {
      if (controllerRef.current) {
        controllerRef.current.focus();
      }
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  useEffect(() => {
    const area = mapAreaRef.current;
    if (!area || !mapAreaId) {
      return;
    }

    const zoneState = surveillanceZoneRef.current;
    if (!zoneState || zoneState.areaId !== mapAreaId) {
      initializeZoneSurveillance({
        area,
        timeOfDay: timeOfDayRef.current,
        dispatch,
        timestamp: getNow(),
      });
    }

    previousSurveillanceAreaId.current = mapAreaId;

    return () => {
      const previousId = previousSurveillanceAreaId.current;
      if (previousId) {
        teardownZoneSurveillance({ areaId: previousId, dispatch });
        previousSurveillanceAreaId.current = null;
      }
    };
  }, [mapAreaId, dispatch]);

  useEffect(() => {
    if (!currentMapArea || !mapAreaId) {
      return;
    }

    const zoneState = surveillanceZoneRef.current ?? surveillanceZone;
    if (!zoneState) {
      return;
    }

    handleTimeOfDayForSurveillance({
      zone: zoneState,
      area: currentMapArea,
      timeOfDay,
      dispatch,
      timestamp: getNow(),
      showBanner: true,
    });
  }, [timeOfDay, mapAreaId, surveillanceZone, currentMapArea, dispatch]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      if (event.key === 'Tab') {
        event.preventDefault();
        if (event.repeat) {
          return;
        }
        dispatch(setOverlayEnabled({ enabled: !overlayEnabledRef.current }));
        return;
      }

      if (event.key.toLowerCase() === 'x') {
        if (event.repeat) {
          return;
        }
        const currentPlayer = playerRef.current;
        if (!currentPlayer) {
          return;
        }
        dispatch(setCrouching(!currentPlayer.isCrouching));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch]);

  useEffect(() => {
    if (!mapAreaId || typeof window === "undefined") {
      return;
    }

    let frameId: number | null = null;
    let lastFrameTime = getNow();

    const tick = () => {
      const zoneState = surveillanceZoneRef.current;
      const area = mapAreaRef.current;
      const playerState = playerRef.current;

      if (zoneState && area && playerState) {
        const currentTime = getNow();
        const deltaMs = currentTime - lastFrameTime;
        lastFrameTime = currentTime;

        updateSurveillance({
          zone: zoneState,
          mapArea: area,
          player: playerState,
          deltaMs,
          timestamp: currentTime,
          dispatch,
          logStrings,
          reinforcementsScheduled: reinforcementsScheduledRef.current ?? false,
          globalAlertLevel: globalAlertLevelRef.current ?? AlertLevel.IDLE,
        });
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [mapAreaId, dispatch, logStrings]);

  useEffect(() => {
    const handleTileClick = (event: Event) => {
      const customEvent = event as CustomEvent<TileClickDetail>;
      const detail = customEvent.detail;

      if (!detail || !currentMapArea) {
        return;
      }

      if (detail.areaId !== currentMapArea.id) {
        return;
      }

      if (inCombat) {
        return;
      }

      const target = detail.position;

      setPendingNpcInteractionId(null);
      setPendingEnemyEngagementId(null);

      if (
        target.x === player.position.x &&
        target.y === player.position.y
      ) {
        setQueuedPath([]);
        setPendingEnemyEngagementId(null);
        return;
      }

      const npcAtTarget = currentMapArea.entities.npcs.find(
        (npc) => npc.position.x === target.x && npc.position.y === target.y
      );

      if (npcAtTarget) {
        if (inCombat) {
          dispatch(addLogMessage(logStrings.combatChatterOverrides));
          return;
        }

        const distance =
          Math.abs(npcAtTarget.position.x - player.position.x) +
          Math.abs(npcAtTarget.position.y - player.position.y);

        if (distance <= 1) {
          beginDialogueWithNpc(npcAtTarget);
          return;
        }

        const approachOffsets: Position[] = [
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 },
        ];

        let selectedPath: Position[] | null = null;

        for (const offset of approachOffsets) {
          const candidate = {
            x: npcAtTarget.position.x + offset.x,
            y: npcAtTarget.position.y + offset.y,
          };

          if (
            candidate.x === player.position.x &&
            candidate.y === player.position.y
          ) {
            continue;
          }

          if (
            candidate.x < 0 ||
            candidate.y < 0 ||
            candidate.x >= currentMapArea.width ||
            candidate.y >= currentMapArea.height
          ) {
            continue;
          }

          if (
            !isPositionWalkable(candidate, currentMapArea, player, enemies, {
              npcs: currentMapArea.entities.npcs,
            })
          ) {
            continue;
          }

          const pathToCandidate = findPath(
            player.position,
            candidate,
            currentMapArea,
            {
              player,
              enemies,
              npcs: currentMapArea.entities.npcs,
            }
          );

          if (pathToCandidate.length > 0) {
            selectedPath = pathToCandidate;
            break;
          }
        }

        if (selectedPath) {
          setPendingNpcInteractionId(npcAtTarget.id);
          setQueuedPath(selectedPath);
        } else {
          dispatch(addLogMessage(logStrings.npcBoxedIn(npcAtTarget.name)));
        }

        return;
      }

      const enemyAtTarget = currentMapArea.entities.enemies.find(
        (enemy) =>
          enemy.position.x === target.x &&
          enemy.position.y === target.y &&
          enemy.health > 0
      );

      if (enemyAtTarget) {
        const distanceToEnemy =
          Math.abs(enemyAtTarget.position.x - player.position.x) +
          Math.abs(enemyAtTarget.position.y - player.position.y);

        if (distanceToEnemy <= 1) {
          if (!inCombat) {
            dispatch(enterCombat());
            dispatch(addLogMessage(logStrings.enteredCombat));
          }
          return;
        }

        const approachOffsets: Position[] = [
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 },
        ];

        let selectedPath: Position[] | null = null;

        for (const offset of approachOffsets) {
          const candidate = {
            x: enemyAtTarget.position.x + offset.x,
            y: enemyAtTarget.position.y + offset.y,
          };

          if (
            candidate.x === player.position.x &&
            candidate.y === player.position.y
          ) {
            continue;
          }

          if (
            candidate.x < 0 ||
            candidate.y < 0 ||
            candidate.x >= currentMapArea.width ||
            candidate.y >= currentMapArea.height
          ) {
            continue;
          }

          if (
            !isPositionWalkable(candidate, currentMapArea, player, enemies, {
              npcs: currentMapArea.entities.npcs,
            })
          ) {
            continue;
          }

          const pathToCandidate = findPath(
            player.position,
            candidate,
            currentMapArea,
            {
              player,
              enemies,
              npcs: currentMapArea.entities.npcs,
            }
          );

          if (pathToCandidate.length > 0) {
            selectedPath = pathToCandidate;
            break;
          }
        }

        if (selectedPath) {
          setPendingEnemyEngagementId(enemyAtTarget.id);
          setQueuedPath(selectedPath);
        } else {
          dispatch(addLogMessage(logStrings.enemyOutOfRange));
        }

        return;
      }

      const path = findPath(player.position, target, currentMapArea, {
        player,
        enemies,
        npcs: currentMapArea.entities.npcs,
      });

      if (path.length === 0) {
        window.dispatchEvent(
          new CustomEvent(PATH_PREVIEW_EVENT, {
            detail: { areaId: currentMapArea.id, path: [] },
          })
        );
        setPendingEnemyEngagementId(null);
        return;
      }

      setQueuedPath(path);
    };

    window.addEventListener(
      TILE_CLICK_EVENT,
      handleTileClick as EventListener
    );

    return () => {
      window.removeEventListener(
        TILE_CLICK_EVENT,
        handleTileClick as EventListener
      );
    };
  }, [currentMapArea, player, enemies, inCombat, dispatch, beginDialogueWithNpc, mapConnections, logStrings]);

  useEffect(() => {
    if (!currentMapArea) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent(PATH_PREVIEW_EVENT, {
        detail: { areaId: currentMapArea.id, path: queuedPath },
      })
    );
  }, [queuedPath, currentMapArea]);

  useEffect(() => {
    if (!currentMapArea) {
      return undefined;
    }

    const handleMinimapPreview = (event: Event) => {
      const detail = (event as CustomEvent<MiniMapPathPreviewDetail>).detail;
      if (!detail || detail.areaId !== currentMapArea.id) {
        return;
      }

      const path = findPath(player.position, detail.target, currentMapArea, {
        player,
        enemies,
        npcs: currentMapArea.entities.npcs,
      });

      setQueuedPath(path);
      window.dispatchEvent(new CustomEvent(PATH_PREVIEW_EVENT, {
        detail: { areaId: currentMapArea.id, path },
      }));
    };

    window.addEventListener(MINIMAP_PATH_PREVIEW_EVENT, handleMinimapPreview as EventListener);
    return () => {
      window.removeEventListener(MINIMAP_PATH_PREVIEW_EVENT, handleMinimapPreview as EventListener);
    };
  }, [currentMapArea, player, enemies]);

  useEffect(() => {
    setQueuedPath((previous) => (previous.length > 0 ? [] : previous));
    setPendingNpcInteractionId(null);
    setPendingEnemyEngagementId(null);
  }, [currentMapArea?.id]);

  useEffect(() => {
    if (mapAreaIsInterior) {
      setCurfewAlertState("clear");
    }
  }, [mapAreaId, mapAreaIsInterior]);

  useEffect(() => {
    const movements = activeNpcMovements.current;
    const timeouts = npcMovementTimeouts.current;
    const reserved = npcReservedDestinations.current;

    movements.clear();
    timeouts.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    timeouts.length = 0;
    reserved.clear();
  }, [currentMapArea?.id]);

  const scheduleNpcMovement = useCallback(
    (npc: NPC, path: Position[]) => {
      if (path.length === 0) {
        npcReservedDestinations.current.delete(npc.id);
        return;
      }

      if (activeNpcMovements.current.has(npc.id)) {
        return;
      }

      const destination = path[path.length - 1];
      npcReservedDestinations.current.set(npc.id, destination);

      activeNpcMovements.current.add(npc.id);

      const stepDelayMs = 320;
      let stepIndex = 0;
      let currentNpcState = npc;

      const step = () => {
        if (stepIndex >= path.length) {
          activeNpcMovements.current.delete(npc.id);
          npcReservedDestinations.current.delete(npc.id);
          return;
        }

        const nextPosition = path[stepIndex];
        stepIndex += 1;
        currentNpcState = { ...currentNpcState, position: nextPosition };
        dispatch(updateNPC(currentNpcState));

        if (stepIndex < path.length) {
          const timeoutId = window.setTimeout(() => {
            // Remove this timeout from the tracking array after it fires
            const index = npcMovementTimeouts.current.indexOf(timeoutId);
            if (index > -1) {
              npcMovementTimeouts.current.splice(index, 1);
            }
            step();
          }, stepDelayMs);
          npcMovementTimeouts.current.push(timeoutId);
        } else {
          activeNpcMovements.current.delete(npc.id);
          npcReservedDestinations.current.delete(npc.id);
        }
      };

      step();
    },
    [dispatch]
  );

  useEffect(() => {
    if (!currentMapArea) {
      return;
    }

    currentMapArea.entities.npcs.forEach((npc) => {
      const targetPoint = npc.routine.find(
        (point) => point.timeOfDay === timeOfDay
      );

      if (!targetPoint) {
        return;
      }

      if (
        npc.position.x === targetPoint.position.x &&
        npc.position.y === targetPoint.position.y
      ) {
        return;
      }

      const otherNpcPositions = currentMapArea.entities.npcs
        .filter((otherNpc) => otherNpc.id !== npc.id)
        .map((otherNpc) => otherNpc.position);

      const reservedPositions = Array.from(
        npcReservedDestinations.current.entries()
      )
        .filter(([reservedNpcId]) => reservedNpcId !== npc.id)
        .map(([, position]) => position);

      const path = findPath(npc.position, targetPoint.position, currentMapArea, {
        player,
        enemies,
        blockedPositions: [...otherNpcPositions, ...reservedPositions],
      });

      if (path.length > 0) {
        scheduleNpcMovement(npc, path);
      }
    });
  }, [currentMapArea, timeOfDay, player, enemies, scheduleNpcMovement]);

  useEffect(() => {
    const timeoutIds = npcMovementTimeouts.current;
    const movements = activeNpcMovements.current;
    const reserved = npcReservedDestinations.current;

    return () => {
      timeoutIds.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      timeoutIds.length = 0;
      movements.clear();
      reserved.clear();
    };
  }, []);

  useEffect(() => {
    if (queuedPath.length === 0) {
      return;
    }

    if (inCombat) {
      setQueuedPath([]);
      setPendingNpcInteractionId(null);
      return;
    }

    if (player.encumbrance.level === 'immobile') {
      if (player.encumbrance.warning) {
        dispatch(addLogMessage(player.encumbrance.warning));
      }
      setQueuedPath([]);
      setPendingNpcInteractionId(null);
      setPendingEnemyEngagementId(null);
      return;
    }

    const nextStep = queuedPath[0];
    const playerX = player.position.x;
    const playerY = player.position.y;

    if (playerX === nextStep.x && playerY === nextStep.y) {
      setQueuedPath((prev) => prev.slice(1));
      return;
    }

    if (
      !isPositionWalkable(nextStep, currentMapArea, player, enemies, {
        npcs: currentMapArea.entities.npcs,
      })
    ) {
      setQueuedPath([]);
      setPendingNpcInteractionId(null);
      setPendingEnemyEngagementId(null);
      return;
    }

    const tile = currentMapArea.tiles[nextStep.y][nextStep.x];
    const connection = mapConnections.find(
      (candidate) =>
        candidate.fromAreaId === currentMapArea.id &&
        candidate.fromPosition.x === nextStep.x &&
        candidate.fromPosition.y === nextStep.y
    );

    if (connection) {
      if (curfewActive && tile.type === TileType.DOOR) {
      dispatch(addLogMessage(logStrings.checkpointSealed));
        setQueuedPath([]);
        setPendingNpcInteractionId(null);
        setPendingEnemyEngagementId(null);
        return;
      }

      const targetArea = mapDirectory[connection.toAreaId];

      if (targetArea) {
        if (targetArea.factionRequirement) {
          const requirement = targetArea.factionRequirement;
          const factionName = uiStrings.playerStatus.factions[requirement.factionId] ?? requirement.factionId;
          const reputationValue = player.factionReputation?.[requirement.factionId] ?? 0;
          const standing = getStandingForValue(reputationValue);

          let allowed = true;

          if (requirement.minimumStanding) {
            const currentRank = getStandingRank(standing.id);
            const requiredRank = getStandingRank(requirement.minimumStanding);
            if (currentRank < requiredRank) {
              allowed = false;
            }
          }

          if (allowed && typeof requirement.minimumReputation === 'number') {
            if (reputationValue < requirement.minimumReputation) {
              allowed = false;
            }
          }

          if (!allowed) {
            const requirementFragments: string[] = [];
            if (requirement.minimumStanding) {
              requirementFragments.push(
                getLocalizedStandingLabel(locale, requirement.minimumStanding)
              );
            }
            if (typeof requirement.minimumReputation === 'number') {
              requirementFragments.push(
                `${uiStrings.factionPanel.reputationLabel} ${requirement.minimumReputation}+`
              );
            }

            const requirementText = requirementFragments.join(' • ') ||
              getLocalizedStandingLabel(locale, standing.id);

            dispatch(addLogMessage(logStrings.factionAccessDenied(factionName, requirementText)));
            setQueuedPath([]);
            setPendingNpcInteractionId(null);
            setPendingEnemyEngagementId(null);
            return;
          }
        }

        if (!attemptMovementStamina()) {
          setQueuedPath([]);
          setPendingNpcInteractionId(null);
          setPendingEnemyEngagementId(null);
          return;
        }
        dispatch(setMapArea(targetArea));
        dispatch(movePlayer(connection.toPosition));
      } else {
        log.warn(
          `Missing target area in state for ${connection.toAreaId}`
        );
      }

      setQueuedPath([]);
      setPendingNpcInteractionId(null);
      setPendingEnemyEngagementId(null);
      return;
    }

    if (!attemptMovementStamina()) {
      setQueuedPath([]);
      setPendingNpcInteractionId(null);
      setPendingEnemyEngagementId(null);
      return;
    }

    const delayMs = player.isCrouching ? 180 : 0;

    if (delayMs > 0) {
      if (movementStepTimeoutRef.current !== null) {
        return;
      }

      movementStepTimeoutRef.current = window.setTimeout(() => {
        movementStepTimeoutRef.current = null;
        dispatch(movePlayer(nextStep));
      }, delayMs);

      return;
    }

    dispatch(movePlayer(nextStep));
  }, [
    queuedPath,
    player,
    currentMapArea,
    enemies,
    inCombat,
    curfewActive,
    dispatch,
    mapDirectory,
    mapConnections,
    log,
    logStrings,
    attemptMovementStamina,
    locale,
    uiStrings,
  ]);

  useEffect(() => {
    if (queuedPath.length === 0 && movementStepTimeoutRef.current !== null) {
      window.clearTimeout(movementStepTimeoutRef.current);
      movementStepTimeoutRef.current = null;
    }
  }, [queuedPath.length]);

  useEffect(() => {
    return () => {
      if (movementStepTimeoutRef.current !== null) {
        window.clearTimeout(movementStepTimeoutRef.current);
        movementStepTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const warning = encumbranceWarning ?? null;

    if (warning && warning !== previousEncumbranceWarning.current) {
      dispatch(addLogMessage(warning));
    }

    if (!warning && previousEncumbranceWarning.current && encumbranceLevel === 'normal') {
      previousEncumbranceWarning.current = null;
      return;
    }

    previousEncumbranceWarning.current = warning;
  }, [encumbranceLevel, encumbranceWarning, dispatch]);

  useEffect(() => {
    if (!pendingNpcInteractionId || !currentMapArea) {
      return;
    }

    const npc = currentMapArea.entities.npcs.find(
      (entry) => entry.id === pendingNpcInteractionId
    );

    if (!npc) {
      setPendingNpcInteractionId(null);
      return;
    }

    const distance =
      Math.abs(npc.position.x - player.position.x) +
      Math.abs(npc.position.y - player.position.y);

    if (distance <= 1) {
      if (!inCombat) {
        const started = beginDialogueWithNpc(npc);
        setPendingNpcInteractionId(null);

        if (started) {
          setQueuedPath([]);
        }
      } else {
        setPendingNpcInteractionId(null);
      }

      return;
    }

    if (queuedPath.length === 0) {
      dispatch(addLogMessage(logStrings.npcOutOfReach(npc.name)));
      setPendingNpcInteractionId(null);
    }
  }, [
    pendingNpcInteractionId,
    currentMapArea,
    player,
    inCombat,
    queuedPath.length,
    dispatch,
    mapConnections,
    beginDialogueWithNpc,
    logStrings,
  ]);

  useEffect(() => {
    if (!pendingEnemyEngagementId || !currentMapArea) {
      return;
    }

    const enemy = currentMapArea.entities.enemies.find(
      (entry) => entry.id === pendingEnemyEngagementId
    );

    if (!enemy || enemy.health <= 0) {
      setPendingEnemyEngagementId(null);
      return;
    }

    const distance =
      Math.abs(enemy.position.x - player.position.x) +
      Math.abs(enemy.position.y - player.position.y);

    if (distance <= 1) {
      setPendingEnemyEngagementId(null);
      setQueuedPath([]);

      if (!inCombat) {
        dispatch(enterCombat());
        dispatch(addLogMessage(logStrings.enteredCombat));
      }

      return;
    }

    if (queuedPath.length === 0) {
      setPendingEnemyEngagementId(null);
    }
  }, [
    pendingEnemyEngagementId,
    currentMapArea,
    player,
    inCombat,
    queuedPath.length,
    dispatch,
    logStrings,
    enemies,
  ]);

  useEffect(() => {
    if (previousTimeOfDay.current !== timeOfDay) {
      if (timeOfDay === "night") {
        dispatch(addLogMessage(logStrings.nightFalls));
        setCurfewAlertState("clear");
      } else if (previousTimeOfDay.current === "night") {
        dispatch(addLogMessage(logStrings.dawnBreaks));
        setCurfewAlertState("clear");
      }

      previousTimeOfDay.current = timeOfDay;
    }
  }, [timeOfDay, dispatch, logStrings]);

  // --- Perception Processing ---
  useEffect(() => {
    if (!player || enemies.length === 0 || !currentMapArea) {
      return;
    }

    // Process perception updates for all enemies
    const { updatedEnemies, maxAlertLevel } = processPerceptionUpdates(
      enemies,
      player,
      currentMapArea
    );

    // Update enemies with new alert states
    updatedEnemies.forEach((updatedEnemy, index) => {
      const originalEnemy = enemies[index];
      if (
        originalEnemy &&
        (updatedEnemy.alertLevel !== originalEnemy.alertLevel ||
          updatedEnemy.alertProgress !== originalEnemy.alertProgress)
      ) {
        dispatch(updateEnemy(updatedEnemy));
      }
    });

    // Update global alert level if changed
    if (maxAlertLevel !== previousGlobalAlertLevel.current) {
      const messageKey = getAlertMessageKey(previousGlobalAlertLevel.current, maxAlertLevel);
      if (messageKey) {
        dispatch(addLogMessage(logStrings[messageKey as keyof typeof logStrings] as string));
      }
      dispatch(setGlobalAlertLevel(maxAlertLevel));
      previousGlobalAlertLevel.current = maxAlertLevel;

      // Check if reinforcements should be spawned
      if (shouldSpawnReinforcements(maxAlertLevel, reinforcementsScheduled)) {
        dispatch(scheduleReinforcements());
        dispatch(addLogMessage(logStrings.reinforcementsIncoming));

        if (reinforcementTimeoutRef.current !== null) {
          curfewStateMachineRef.current.cancel(reinforcementTimeoutRef.current);
        }

        reinforcementTimeoutRef.current = curfewStateMachineRef.current.schedule(() => {
          reinforcementTimeoutRef.current = null;
          if (!inCombat) {
            dispatch(enterCombat());
          }

          // If spawning during enemy turn, set AP to 0 so they don't act until next round
          const spawnDuringEnemyTurn = inCombat && !isPlayerTurn;

          const reinforcementEnemy: Enemy = {
            id: uuidv4(),
            name: logStrings.curfewPatrolName,
            position: { x: player.position.x + 5, y: player.position.y + 2 },
            health: 25,
            maxHealth: 25,
            actionPoints: spawnDuringEnemyTurn ? 0 : 6,
            maxActionPoints: 6,
            damage: 5,
            attackRange: 1,
            isHostile: true,
            visionCone: {
              range: 8,
              angle: 90,
              direction: 180,
            },
            alertLevel: AlertLevel.ALARMED,
            alertProgress: 100,
          };

          dispatch(addEnemy(reinforcementEnemy));
          dispatch(resetActionPoints());
          if (spawnDuringEnemyTurn && !isPlayerTurn) {
            dispatch(switchTurn());
            dispatch(resetActionPoints());
          }
          cancelPendingEnemyAction();
          setCurrentEnemyTurnIndex(0);
          dispatch(clearReinforcementsSchedule());
        }, getReinforcementDelay());
      }
    }
  }, [player, enemies, currentMapArea, dispatch, logStrings, inCombat, isPlayerTurn, reinforcementsScheduled, cancelPendingEnemyAction]);

  // --- Enemy Turn Logic ---
  useEffect(() => {
    log.debug(
      `=== useEffect RUNNING === Turn: ${
        isPlayerTurn ? "Player" : "Enemy"
      }, Combat: ${inCombat}, Processing: ${processingEnemyIdRef.current ? "true" : "false"}, EnemyIdx: ${currentEnemyTurnIndex}`
    );

    if (!inCombat || isPlayerTurn || enemies.length === 0) {
      cancelPendingEnemyAction();
      if (!inCombat || isPlayerTurn) {
        setCurrentEnemyTurnIndex(0);
      }
      return;
    }

    const livingEnemies = enemies.filter((enemy) => enemy.health > 0);
    if (livingEnemies.length === 0) {
      cancelPendingEnemyAction();
      log.warn(
        "Enemy turn effect running but no living enemies found."
      );
      return;
    }

    if (currentEnemyTurnIndex >= enemies.length) {
      log.debug(
        `Enemy index ${currentEnemyTurnIndex} out of bounds (length: ${enemies.length}). Ending enemy turn.`
      );
      cancelPendingEnemyAction();
      dispatch(switchTurn());
      dispatch(resetActionPoints());
      setCurrentEnemyTurnIndex(0);
      return;
    }

    const currentEnemy = enemies[currentEnemyTurnIndex];

    if (!currentEnemy || currentEnemy.health <= 0 || currentEnemy.actionPoints <= 0) {
      log.debug(
        `Enemy ${
          currentEnemy?.id ?? `at index ${currentEnemyTurnIndex}`
        } cannot act (Dead or 0 AP). Checking next.`
      );

      cancelPendingEnemyAction();

      let nextIndex = currentEnemyTurnIndex + 1;
      let foundValidEnemy = false;

      while (nextIndex < enemies.length) {
        const nextEnemy = enemies[nextIndex];
        if (nextEnemy && nextEnemy.health > 0 && nextEnemy.actionPoints > 0) {
          foundValidEnemy = true;
          break;
        }
        nextIndex += 1;
      }

      if (!foundValidEnemy) {
        log.debug("All enemies processed, switching back to player.");
        dispatch(switchTurn());
        dispatch(resetActionPoints());
        setCurrentEnemyTurnIndex(0);
      } else {
        log.debug(`Moving to next valid enemy at index ${nextIndex}`);
        setCurrentEnemyTurnIndex(nextIndex);
      }
      return;
    }

    if (processingEnemyIdRef.current) {
      return;
    }

    log.debug(
      `Scheduling action for enemy index ${currentEnemyTurnIndex}: ${currentEnemy.id} (AP: ${currentEnemy.actionPoints})`
    );

    processingEnemyIdRef.current = currentEnemy.id;
    enemyActionTimeoutRef.current = window.setTimeout(() => {
      log.debug(
        `>>> setTimeout CALLBACK for index ${currentEnemyTurnIndex}`
      );

      if (!inCombat) {
        log.debug('Combat ended, skipping enemy action');
        cancelPendingEnemyAction(false);
        return;
      }

      try {
        log.debug(
          `Enemy Turn AI: START for ${currentEnemy.id}`
        );

        const coverPositions: Position[] = [];
        for (let y = 0; y < currentMapArea.height; y += 1) {
          for (let x = 0; x < currentMapArea.width; x += 1) {
            if (currentMapArea.tiles[y][x].provideCover) {
              coverPositions.push({ x, y });
            }
          }
        }
        log.debug(
          `Enemy Turn AI: Got cover positions for ${currentEnemy.id}`
        );

        const result = determineEnemyMove(
          currentEnemy,
          player,
          currentMapArea,
          enemies,
          coverPositions,
          currentMapArea.entities.npcs
        );
        log.debug(
          `Enemy ${currentEnemy.id} action: ${result.action}, AP left: ${result.enemy.actionPoints}`
        );

        // Combat feedback for enemy attacks
        if (result.action === 'attack' || result.action === 'attack_missed') {
          const damageTaken = player.health - result.player.health;

          if (damageTaken > 0) {
            // Player took damage
            dispatch(addFloatingNumber({
              id: uuidv4(),
              value: damageTaken,
              gridX: player.position.x,
              gridY: player.position.y,
              type: result.isCritical ? 'crit' : 'damage',
            }));

            // Trigger hit flash
            dispatch(triggerHitFlash({
              id: uuidv4(),
              type: result.isCritical ? 'crit' : 'damage',
              intensity: 0.6,
              duration: 300,
            }));
          } else if (result.action === 'attack_missed') {
            // Attack missed
            dispatch(addFloatingNumber({
              id: uuidv4(),
              value: 0,
              gridX: player.position.x,
              gridY: player.position.y,
              type: 'miss',
            }));
          }
        }

        log.debug(
          `Enemy Turn AI: BEFORE dispatching updates for ${currentEnemy.id}`
        );
        dispatch(updateEnemy(result.enemy));
        log.debug(
          `Enemy Turn AI: AFTER dispatch(updateEnemy) for ${currentEnemy.id}`
        );

        if (result.player.id === player.id) {
          log.debug(
            `Enemy Turn AI: BEFORE dispatch(setPlayerData) for ${currentEnemy.id}`
          );
          dispatch(setPlayerData(result.player));
          log.debug(
            `Enemy Turn AI: AFTER dispatch(setPlayerData) for ${currentEnemy.id}`
          );
        }

        log.debug(
          `Enemy Turn AI: END AI & Dispatches for ${currentEnemy.id}`
        );
      } catch (error) {
        log.error("Error during enemy turn AI:", {
          enemyId: currentEnemy?.id,
          error,
        });
      } finally {
        log.debug(
          `Enemy Turn FINALLY for index ${currentEnemyTurnIndex}. Advancing to next enemy.`
        );
        setCurrentEnemyTurnIndex((prev) => prev + 1);
        cancelPendingEnemyAction(false);
      }
    }, 500);
  }, [
    inCombat,
    isPlayerTurn,
    currentEnemyTurnIndex,
    enemies,
    dispatch,
    player,
    currentMapArea,
    cancelPendingEnemyAction,
    log,
  ]);

  useEffect(() => {
    return () => {
      cancelPendingEnemyAction();
    };
  }, [cancelPendingEnemyAction]);

  useEffect(() => {
    const curfewStateMachine = curfewStateMachineRef.current;
    return () => {
      curfewStateMachine.dispose();
      reinforcementTimeoutRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!inCombat) {
      return;
    }

    if (isPlayerTurn) {
      dispatch(beginPlayerTurn());
    }
  }, [dispatch, inCombat, isPlayerTurn]);

  // --- End Enemy Turn Logic ---

  // Effect to show feedback when combat ends
  useEffect(() => {
    // Check if the value changed from true to false
    if (prevInCombat.current && !inCombat) {
      dispatch(addLogMessage(logStrings.combatOver));
      log.debug(
        "Combat ended (detected via useEffect watching inCombat)."
      );
      // Explicitly reset player AP when combat ends.
      dispatch(resetActionPoints());
    }
    // Update the ref *after* the check for the next render
    prevInCombat.current = inCombat;
  }, [inCombat, dispatch, log, logStrings]); // Run whenever inCombat changes (add dispatch if used inside)

  // Handle attacking an enemy
  const attackEnemy = useCallback(
    (enemy: Enemy, mapArea: MapArea) => {
      const baseAttackCost = player.equipped.weapon?.apCost ?? DEFAULT_ATTACK_COST;
      const encumbranceAttackMultiplier = Number.isFinite(player.encumbrance.attackApMultiplier)
        ? Math.max(player.encumbrance.attackApMultiplier, 0)
        : Number.POSITIVE_INFINITY;
      const attackCost = shouldGunFuAttackBeFree(player)
        ? 0
        : Math.ceil(Math.max(0, baseAttackCost) * encumbranceAttackMultiplier);

      // Check if player has enough AP
      if (!Number.isFinite(attackCost) || player.actionPoints < attackCost) {
        dispatch(addLogMessage(logStrings.notEnoughAp));
        return;
      }

      // Check if enemy is in range
      const weaponRange = player.equipped.weapon?.range ?? 1;
      if (!isInAttackRange(player.position, enemy.position, weaponRange)) {
        dispatch(addLogMessage(logStrings.enemyOutOfRange));
        return;
      }

      // Determine if the enemy is behind cover
      const isBehindCover =
        mapArea.tiles[enemy.position.y][enemy.position.x].provideCover;

      // Log cover status before attacking
      log.debug("attackEnemy: PRE-ATTACK", {
        enemyId: enemy.id,
        enemyPosition: enemy.position,
        isBehindCover: isBehindCover,
        playerAP_before: player.actionPoints,
        attackCost,
      });

      // Execute attack
      const result = executeAttack(player, enemy, isBehindCover);

      const updatedPlayer = result.newAttacker as Player;
      dispatch(setPlayerData(updatedPlayer));

      if (result.events) {
        result.events.forEach((event) => dispatch(addLogMessage(event.message)));
      }

      log.debug("attackEnemy: POST-ATTACK", {
        apCost: attackCost,
        playerAP_after: updatedPlayer.actionPoints,
      });

      if (result.success) {
        dispatch(addLogMessage(logStrings.hitEnemy(enemy.name, result.damage)));

        // Combat feedback: floating damage number on enemy
        dispatch(addFloatingNumber({
          id: uuidv4(),
          value: result.damage,
          gridX: enemy.position.x,
          gridY: enemy.position.y,
          type: result.isCritical ? 'crit' : 'damage',
        }));
      } else {
        dispatch(addLogMessage(logStrings.missedEnemy(enemy.name)));

        // Combat feedback: show miss
        dispatch(addFloatingNumber({
          id: uuidv4(),
          value: 0,
          gridX: enemy.position.x,
          gridY: enemy.position.y,
          type: 'miss',
        }));
      }

      // Update enemy
      const updatedEnemyTarget = result.newTarget as Enemy;
      log.debug("attackEnemy: PRE-DISPATCH updateEnemy", {
        enemyId: updatedEnemyTarget.id,
        healthBeforeUpdate: enemy.health, // Health of original enemy object passed to function
        healthInNewTarget: updatedEnemyTarget.health, // Health in the object to be dispatched
      });
      dispatch(updateEnemy(updatedEnemyTarget));

      // If no enemies left with health > 0, exit combat
      const anyEnemiesAlive = enemies.some(
        (e) =>
          e.id !== enemy.id ||
          (e.id === enemy.id && result.newTarget.health > 0)
      );

      if (!anyEnemiesAlive) {
        dispatch(addLogMessage(logStrings.allEnemiesDefeated));
      } else if (updatedPlayer.actionPoints <= 0) {
        // If player has no more AP or exactly enough for this attack, switch turn
        log.debug(
          "attackEnemy: Player out of AP after attack, switching turn."
        );
        dispatch(switchTurn());
      }
    },
    [player, enemies, dispatch, log, logStrings]
  );

  // Find the closest enemy to a position
  const findClosestEnemy = useCallback(
    (position: Position): Enemy | null => {
      if (enemies.length === 0) return null;

      return enemies.reduce((closest, current) => {
        const currentDistance =
          Math.abs(current.position.x - position.x) +
          Math.abs(current.position.y - position.y);
        const closestDistance =
          Math.abs(closest.position.x - position.x) +
          Math.abs(closest.position.y - position.y);

        return currentDistance < closestDistance ? current : closest;
      });
    },
    [enemies]
  );

  const findPatrolSpawnPosition = useCallback(
    (center: Position): Position | null => {
      if (!currentMapArea) {
        return null;
      }

      const offsets: Position[] = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
        { x: 1, y: 1 },
        { x: -1, y: -1 },
        { x: -1, y: 1 },
        { x: 1, y: -1 },
      ];

      for (const offset of offsets) {
        const candidate: Position = {
          x: center.x + offset.x,
          y: center.y + offset.y,
        };

        if (
          candidate.x < 0 ||
          candidate.y < 0 ||
          candidate.x >= currentMapArea.width ||
          candidate.y >= currentMapArea.height
        ) {
          continue;
        }

        const tileRow = currentMapArea.tiles[candidate.y];
        const tile = tileRow ? tileRow[candidate.x] : undefined;
        if (!tile || !tile.isWalkable) {
          continue;
        }

        const occupied = enemies.some(
          (enemy) =>
            enemy.position.x === candidate.x &&
            enemy.position.y === candidate.y
        );

        if (!occupied) {
          return candidate;
        }
      }

      return null;
    },
    [currentMapArea, enemies]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const key = event.key;
      const areaIsInterior = currentMapArea?.isInterior ?? false;

      if (activeDialogueId) {
        event.preventDefault();
        event.stopPropagation();

        if (key === "Escape") {
          dispatch(endDialogue());
          dispatch(addLogMessage(logStrings.conversationEnded));
        }
        return;
      }

      if (key === "e" || key === "E") {
        event.preventDefault();
        event.stopPropagation();

        if (!currentMapArea) {
          return;
        }

        const interactiveNpc = currentMapArea.entities.npcs.find((npc) => {
          if (!npc.isInteractive || !npc.dialogueId) {
            return false;
          }

          const distance =
            Math.abs(npc.position.x - player.position.x) +
            Math.abs(npc.position.y - player.position.y);
          return distance <= 1;
        });

        if (!interactiveNpc) {
          dispatch(addLogMessage(logStrings.noFriendlyContact));
          return;
        }

        const dialogue = dialogues.find(
          (entry) => entry.id === interactiveNpc.dialogueId
        );

        if (!dialogue || dialogue.nodes.length === 0) {
          dispatch(addLogMessage(logStrings.npcNoNewInfo(interactiveNpc.name)));
          return;
        }

        const initialNodeId = dialogue.nodes[0].id;
        dispatch(startDialogue({ dialogueId: dialogue.id, nodeId: initialNodeId }));
        dispatch(addLogMessage(logStrings.npcChannelOpened(interactiveNpc.name)));
        return;
      }

      // Tab key: End turn in combat
      if (key === "Tab" && inCombat && isPlayerTurn) {
        event.preventDefault();
        event.stopPropagation();
        dispatch(addLogMessage(logStrings.endingTurn ?? "Ending turn..."));
        dispatch(switchTurn());
        return;
      }

      if (key === " ") {
        event.preventDefault();
        event.stopPropagation();

        if (queuedPath.length > 0) {
          setQueuedPath([]);
          setPendingNpcInteractionId(null);
          setPendingEnemyEngagementId(null);
        }
        // If not in combat and enemies nearby, enter combat
        if (!inCombat) {
          const nearbyEnemy = findClosestEnemy(player.position);
          const weaponRange = player.equipped.weapon?.range ?? 1;
          if (
            nearbyEnemy &&
            isInAttackRange(player.position, nearbyEnemy.position, weaponRange)
          ) {
            dispatch(enterCombat());
            dispatch(addLogMessage(logStrings.enteredCombat));
            return;
          }
        }

        // If in combat and it's player's turn, attack closest enemy in range
        if (inCombat && isPlayerTurn) {
          const nearbyEnemy = findClosestEnemy(player.position);
          const weaponRange = player.equipped.weapon?.range ?? 1;
          if (nearbyEnemy && isInAttackRange(player.position, nearbyEnemy.position, weaponRange)) {
            attackEnemy(nearbyEnemy, currentMapArea);
            return;
          }

          dispatch(addLogMessage(logStrings.noEnemiesInRange));
          return;
        }

        return;
      }

      // Only allow movement if player has action points and it's their turn (if in combat)
      if (inCombat && (!isPlayerTurn || player.actionPoints <= 0)) {
        const livingEnemies = enemies.filter((enemy) => enemy.health > 0);

        if (livingEnemies.length === 0) {
          dispatch(exitCombat());
          dispatch(resetActionPoints());
          dispatch(addLogMessage(logStrings.zoneSecured));
          return;
        }

        if (!isPlayerTurn) {
          dispatch(addLogMessage(logStrings.notYourTurn));
          return;
        }

        if (player.actionPoints <= 0) {
          dispatch(addLogMessage(logStrings.actionPointsDepleted));
          dispatch(switchTurn());
          return;
        }
      }

      if (queuedPath.length > 0) {
        setQueuedPath([]);
        setPendingNpcInteractionId(null);
        setPendingEnemyEngagementId(null);
      }

      const newPosition = { ...player.position };

      switch (key) {
        case "ArrowUp":
        case "w":
        case "W":
          newPosition.y -= 1;
          break;
        case "ArrowDown":
        case "s":
        case "S":
          newPosition.y += 1;
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          newPosition.x -= 1;
          break;
        case "ArrowRight":
        case "d":
        case "D":
          newPosition.x += 1;
          break;
        default:
          return; // Exit if not a movement key
      }

      event.preventDefault();
      event.stopPropagation();

      // Check if the new position is walkable
      if (
        isPositionWalkable(newPosition, currentMapArea, player, enemies, {
          npcs: currentMapArea.entities.npcs,
        })
      ) {
        const tile = currentMapArea.tiles[newPosition.y][newPosition.x];
        const connection = mapConnections.find(
          (candidate) =>
            candidate.fromAreaId === currentMapArea.id &&
            candidate.fromPosition.x === newPosition.x &&
            candidate.fromPosition.y === newPosition.y
        );
        const isSprinting = !inCombat && event.shiftKey;

        if (connection) {
          const targetArea = mapDirectory[connection.toAreaId];

          if (curfewActive && tile.type === TileType.DOOR && targetArea && !targetArea.isInterior) {
            dispatch(addLogMessage(logStrings.checkpointSealed));
            return;
          }

          if (targetArea) {
            if (!attemptMovementStamina({ sprint: isSprinting })) {
              return;
            }
            dispatch(setMapArea(targetArea));
            dispatch(movePlayer(connection.toPosition));

            if (targetArea.isInterior) {
              dispatch(addLogMessage(logStrings.slipInsideStructure));
              setCurfewAlertState("clear");
            }
          } else {
            log.warn(
              `Missing target area in state for ${connection.toAreaId}`
            );
          }

          setQueuedPath([]);
          setPendingNpcInteractionId(null);

          return;
        }

        if (!attemptMovementStamina({ sprint: isSprinting })) {
          return;
        }

        dispatch(movePlayer(newPosition));

        if (curfewActive && !areaIsInterior) {
          if (curfewAlertState === "clear") {
            dispatch(addLogMessage(logStrings.searchlightsWarning));
            setCurfewAlertState("warning");
          } else if (curfewAlertState === "warning") {
            const spawnPosition = findPatrolSpawnPosition(newPosition);

            if (spawnPosition) {
              const patrol: Enemy = {
                id: uuidv4(),
              name: logStrings.curfewPatrolName,
                position: spawnPosition,
                maxHealth: 30,
                health: 30,
                actionPoints: 6,
                maxActionPoints: 6,
                damage: 6,
                attackRange: 1,
                isHostile: true,
              };

              dispatch(addEnemy(patrol));

              if (!inCombat) {
                dispatch(enterCombat());
                dispatch(addLogMessage(logStrings.curfewOpenFire));
              } else {
                dispatch(addLogMessage(logStrings.curfewReinforcement));
              }
            } else {
              dispatch(addLogMessage(logStrings.curfewFootsteps));
            }

            setCurfewAlertState("spawned");
          }
        } else if (curfewAlertState !== "clear") {
          setCurfewAlertState("clear");
        }
        // dispatch(addLogMessage({ type: "info", message: `Moved to (${newPosition.x}, ${newPosition.y})` })); // COMMENTED OUT
        if (inCombat) {
          log.debug("handleKeyDown: PRE-MOVE AP DEDUCTION", {
            apCost: 1,
            playerAP_before: player.actionPoints,
          });
          dispatch(updateActionPoints(-1)); // Reduce action points by 1
          log.debug(
            "handleKeyDown: POST-MOVE AP DEDUCTION",
            {
              apCost: 1,
              playerAP_after: player.actionPoints - 1, // Simulate state update for logging
            }
          );

          // If player has no more AP, switch turn
          if (player.actionPoints <= 1) {
            log.debug(
              "handleKeyDown: Player out of AP after move, switching turn."
            );
            dispatch(switchTurn());
          }
        }
      } else {
        // Show feedback for obstacles
        // dispatch(addLogMessage({ type: "warning", message: "Cannot move there! Path is blocked." })); // COMMENTED OUT
      }
    },
    [
      player,
      currentMapArea,
      inCombat,
      isPlayerTurn,
      dispatch,
      enemies,
      attackEnemy,
      findClosestEnemy,
      curfewActive,
      curfewAlertState,
      findPatrolSpawnPosition,
      mapDirectory,
      queuedPath,
      setQueuedPath,
      setPendingNpcInteractionId,
      activeDialogueId,
      mapConnections,
      dialogues,
      log,
      logStrings,
      attemptMovementStamina,
    ]
  );

  const handleKeyUp = useCallback((event: React.KeyboardEvent) => {
    if (event.key === " ") {
      // Handle key up events if needed
    }
  }, []);

  return (
    <div
      ref={controllerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      className="fixed inset-0 focus:outline-none"
      style={{ zIndex: 1 }}
      data-testid="game-controller"
    >
      {/* Remove the combat turn indicator UI from here */}
      {/* {inCombat && ( ... )} */}
    </div>
  );
};

export default GameController;
