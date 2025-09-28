import React, { useCallback, useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  movePlayer,
  updateActionPoints,
  setPlayerData,
  resetActionPoints,
} from "../store/playerSlice";
import {
  updateEnemy,
  enterCombat,
  switchTurn,
  exitCombat,
  addEnemy,
  updateNPC,
} from "../store/worldSlice";
import { addLogMessage } from "../store/logSlice";
import { RootState } from "../store";
import { isPositionWalkable } from "../game/world/grid";
import {
  executeAttack,
  isInAttackRange,
  DEFAULT_ATTACK_COST,
} from "../game/combat/combatSystem";
import { Enemy, Position, MapArea, TileType, NPC } from "../game/interfaces/types";
import { determineEnemyMove } from "../game/combat/enemyAI";
import { setMapArea } from "../store/worldSlice";
import { v4 as uuidv4 } from "uuid";
import { findPath } from "../game/world/pathfinding";
import { TILE_CLICK_EVENT, TileClickDetail, PATH_PREVIEW_EVENT } from "../game/events";
import { startDialogue, endDialogue } from "../store/questsSlice";
import { getSystemStrings } from "../content/system";

const GameController: React.FC = () => {
  const dispatch = useDispatch();
  const player = useSelector((state: RootState) => state.player.data);
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
  const logStrings = getSystemStrings(locale).logs;
  const prevInCombat = useRef(inCombat); // Ref to track previous value
  const previousTimeOfDay = useRef(timeOfDay);

  // State to track current enemy turn processing
  const [currentEnemyTurnIndex, setCurrentEnemyTurnIndex] = useState<number>(0);
  const [isProcessingEnemyAction, setIsProcessingEnemyAction] =
    useState<boolean>(false);
  type CurfewAlertState = "clear" | "warning" | "spawned";
  const [curfewAlertState, setCurfewAlertState] =
    useState<CurfewAlertState>("clear");
  const [queuedPath, setQueuedPath] = useState<Position[]>([]);
  const activeNpcMovements = useRef<Set<string>>(new Set());
  const npcMovementTimeouts = useRef<number[]>([]);
  const npcReservedDestinations = useRef<Map<string, Position>>(new Map());
  const [pendingNpcInteractionId, setPendingNpcInteractionId] = useState<string | null>(null);
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

  // Reference to the div element for focusing
  const controllerRef = useRef<HTMLDivElement>(null);

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

      if (
        target.x === player.position.x &&
        target.y === player.position.y
      ) {
        setQueuedPath([]);
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
    setQueuedPath((previous) => (previous.length > 0 ? [] : previous));
    setPendingNpcInteractionId(null);
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
          const timeoutId = window.setTimeout(step, stepDelayMs);
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
        return;
      }

      const targetArea = mapDirectory[connection.toAreaId];

      if (targetArea) {
        dispatch(setMapArea(targetArea));
        dispatch(movePlayer(connection.toPosition));
      } else {
        console.warn(
          `[GameController] Missing target area in state for ${connection.toAreaId}`
        );
      }

      setQueuedPath([]);
      setPendingNpcInteractionId(null);
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
    logStrings,
  ]);

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

  // --- Enemy Turn Logic ---
  useEffect(() => {
    console.log(
      `[GameController] === useEffect RUNNING === Turn: ${
        isPlayerTurn ? "Player" : "Enemy"
      }, Combat: ${inCombat}, Processing: ${isProcessingEnemyAction}, EnemyIdx: ${currentEnemyTurnIndex}`
    );

    // Exit conditions
    if (
      !inCombat ||
      isPlayerTurn ||
      enemies.length === 0 ||
      isProcessingEnemyAction
    ) {
      if (!inCombat || isPlayerTurn) {
        setCurrentEnemyTurnIndex(0); // Reset index if combat ends or player turn starts
      }
      return;
    }

    const livingEnemies = enemies.filter((e) => e.health > 0);
    if (livingEnemies.length === 0) {
      // Should be handled by exitCombat in reducer, but as safety check:
      console.warn(
        "[GameController] Enemy turn effect running but no living enemies found."
      );
      // dispatch(exitCombat()); // Let reducer handle this via updateEnemy
      return;
    }

    const currentEnemy = enemies[currentEnemyTurnIndex];

    // --- Check if current enemy can act ---
    if (
      !currentEnemy ||
      currentEnemy.health <= 0 ||
      currentEnemy.actionPoints <= 0
    ) {
      console.log(
        `[GameController] Enemy ${
          currentEnemy?.id ?? `at index ${currentEnemyTurnIndex}`
        } cannot act (Dead or 0 AP). Checking next.`
      );
      const nextIndex = currentEnemyTurnIndex + 1;
      if (nextIndex >= enemies.length) {
        // All enemies processed for this turn cycle, end enemy phase
        console.log(
          "[GameController] All enemies processed, switching back to player."
        );
        dispatch(switchTurn());
        dispatch(resetActionPoints());
        setCurrentEnemyTurnIndex(0); // Reset index for next player turn
      } else {
        // Move to the next enemy for the next effect run
        setCurrentEnemyTurnIndex(nextIndex);
      }
      return; // Exit effect, it will re-run for the next index or end the turn
    }

    // --- Process Current Enemy Action ---
    console.log(
      `[GameController] Scheduling action for enemy index ${currentEnemyTurnIndex}: ${currentEnemy.id} (AP: ${currentEnemy.actionPoints})`
    );

    const enemyActionTimer = setTimeout(() => {
      // SET FLAG HERE, right before processing starts
      setIsProcessingEnemyAction(true);
      console.log(
        `[GameController] >>> setTimeout CALLBACK for index ${currentEnemyTurnIndex}`
      );
      try {
        console.log(
          `[GameController] Enemy Turn AI: START for ${currentEnemy.id}`
        );

        // Get cover positions
        const coverPositions: Position[] = [];
        for (let y = 0; y < currentMapArea.height; y++) {
          for (let x = 0; x < currentMapArea.width; x++) {
            if (currentMapArea.tiles[y][x].provideCover) {
              coverPositions.push({ x, y });
            }
          }
        }
        console.log(
          `[GameController] Enemy Turn AI: Got cover positions for ${currentEnemy.id}`
        );

        // Determine and execute action
        console.log(
          `[GameController] Enemy Turn AI: BEFORE determineEnemyMove for ${currentEnemy.id}`
        );
        const result = determineEnemyMove(
          currentEnemy,
          player,
          currentMapArea,
          enemies,
          coverPositions
        );
        console.log(
          `[GameController] Enemy ${currentEnemy.id} action: ${result.action}, AP left: ${result.enemy.actionPoints}`
        );

        console.log(
          `[GameController] Enemy Turn AI: BEFORE dispatching updates for ${currentEnemy.id}`
        );

        // Dispatch updates based on the result
        console.log(
          `[GameController] Enemy Turn AI: BEFORE dispatch(updateEnemy) for ${currentEnemy.id}`
        );
        dispatch(updateEnemy(result.enemy));
        console.log(
          `[GameController] Enemy Turn AI: AFTER dispatch(updateEnemy) for ${currentEnemy.id}`
        );

        console.log(
          `[GameController] Enemy Turn AI: BEFORE player update check for ${currentEnemy.id}`
        );
        if (result.player.id === player.id) {
          console.log(
            `[GameController] Enemy Turn AI: BEFORE dispatch(setPlayerData) for ${currentEnemy.id}`
          );
          dispatch(setPlayerData(result.player));
          console.log(
            `[GameController] Enemy Turn AI: AFTER dispatch(setPlayerData) for ${currentEnemy.id}`
          );
        }

        console.log(
          `[GameController] Enemy Turn AI: END AI & Dispatches for ${currentEnemy.id}`
        );
      } catch (error) {
        console.error("[GameController] Error during enemy turn AI:", {
          enemyId: currentEnemy?.id,
          error: error,
        });
        // Optionally add more error handling here if needed
      } finally {
        console.log(
          `[GameController] Enemy Turn FINALLY for index ${currentEnemyTurnIndex}. Setting processing=false`
        );
        // Reset flag HERE. This state change should trigger useEffect re-run.
        setIsProcessingEnemyAction(false);
      }
    }, 500); // Delay for visibility

    // Cleanup timeout if effect re-runs before timeout finishes
    return () => {
      console.log(
        `[GameController] <<< useEffect CLEANUP running. Clearing timeout for index ${currentEnemyTurnIndex}.`
      );
      clearTimeout(enemyActionTimer);
    };
  }, [
    inCombat,
    isPlayerTurn,
    currentEnemyTurnIndex,
    enemies,
    isProcessingEnemyAction,
    dispatch,
    player,
    currentMapArea,
  ]);

  // --- End Enemy Turn Logic ---

  // Effect to show feedback when combat ends
  useEffect(() => {
    // Check if the value changed from true to false
    if (prevInCombat.current && !inCombat) {
      dispatch(addLogMessage(logStrings.combatOver));
      console.log(
        "[GameController] Combat ended (detected via useEffect watching inCombat)."
      );
      // Explicitly reset player AP when combat ends.
      dispatch(resetActionPoints());
    }
    // Update the ref *after* the check for the next render
    prevInCombat.current = inCombat;
  }, [inCombat, dispatch, logStrings]); // Run whenever inCombat changes (add dispatch if used inside)

  // Handle attacking an enemy
  const attackEnemy = useCallback(
    (enemy: Enemy, mapArea: MapArea) => {
      // Check if player has enough AP
      if (player.actionPoints < DEFAULT_ATTACK_COST) {
        dispatch(addLogMessage(logStrings.notEnoughAp));
        return;
      }

      // Check if enemy is in range
      if (!isInAttackRange(player.position, enemy.position, 1)) {
        dispatch(addLogMessage(logStrings.enemyOutOfRange));
        return;
      }

      // Determine if the enemy is behind cover
      const isBehindCover =
        mapArea.tiles[enemy.position.y][enemy.position.x].provideCover;

      // Log cover status before attacking
      console.log("[GameController] attackEnemy: PRE-ATTACK", {
        enemyId: enemy.id,
        enemyPosition: enemy.position,
        isBehindCover: isBehindCover,
        playerAP_before: player.actionPoints,
      });

      // Execute attack
      const result = executeAttack(player, enemy, isBehindCover);

      // Update player AP
      dispatch(updateActionPoints(-DEFAULT_ATTACK_COST));

      console.log("[GameController] attackEnemy: POST-ATTACK AP DEDUCTION", {
        apCost: DEFAULT_ATTACK_COST,
        playerAP_after: player.actionPoints - DEFAULT_ATTACK_COST, // Simulate state update for logging
      });

      if (result.success) {
        dispatch(addLogMessage(logStrings.hitEnemy(enemy.name, result.damage)));
      } else {
        dispatch(addLogMessage(logStrings.missedEnemy(enemy.name)));
      }

      // Update enemy
      const updatedEnemyTarget = result.newTarget as Enemy;
      console.log("[GameController] attackEnemy: PRE-DISPATCH updateEnemy", {
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
      } else if (player.actionPoints <= DEFAULT_ATTACK_COST) {
        // If player has no more AP or exactly enough for this attack, switch turn
        console.log(
          "[GameController] attackEnemy: Player out of AP after attack, switching turn."
        );
        dispatch(switchTurn());
      }
    },
    [player, enemies, dispatch, logStrings]
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

      if (key === " ") {
        event.preventDefault();
        event.stopPropagation();

        if (queuedPath.length > 0) {
          setQueuedPath([]);
          setPendingNpcInteractionId(null);
        }
        // If not in combat and enemies nearby, enter combat
        if (!inCombat) {
          const nearbyEnemy = findClosestEnemy(player.position);
          if (
            nearbyEnemy &&
            isInAttackRange(player.position, nearbyEnemy.position, 1)
          ) {
            dispatch(enterCombat());
            dispatch(addLogMessage(logStrings.enteredCombat));
            return;
          }
        }

        // If in combat and it's player's turn, attack closest enemy in range
        if (inCombat && isPlayerTurn) {
          const nearbyEnemy = findClosestEnemy(player.position);
          if (
            nearbyEnemy &&
            isInAttackRange(player.position, nearbyEnemy.position, 1)
          ) {
            attackEnemy(nearbyEnemy, currentMapArea);
            return;
          } else {
            dispatch(addLogMessage(logStrings.noEnemiesInRange));
            return;
          }
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

        return;
      }

      if (queuedPath.length > 0) {
        setQueuedPath([]);
        setPendingNpcInteractionId(null);
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

        if (connection) {
          const targetArea = mapDirectory[connection.toAreaId];

          if (curfewActive && tile.type === TileType.DOOR && targetArea && !targetArea.isInterior) {
            dispatch(addLogMessage(logStrings.checkpointSealed));
            return;
          }

          if (targetArea) {
            dispatch(setMapArea(targetArea));
            dispatch(movePlayer(connection.toPosition));

            if (targetArea.isInterior) {
              dispatch(addLogMessage(logStrings.slipInsideStructure));
              setCurfewAlertState("clear");
            }
          } else {
            console.warn(
              `[GameController] Missing target area in state for ${connection.toAreaId}`
            );
          }

          setQueuedPath([]);
          setPendingNpcInteractionId(null);

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
          console.log("[GameController] handleKeyDown: PRE-MOVE AP DEDUCTION", {
            apCost: 1,
            playerAP_before: player.actionPoints,
          });
          dispatch(updateActionPoints(-1)); // Reduce action points by 1
          console.log(
            "[GameController] handleKeyDown: POST-MOVE AP DEDUCTION",
            {
              apCost: 1,
              playerAP_after: player.actionPoints - 1, // Simulate state update for logging
            }
          );

          // If player has no more AP, switch turn
          if (player.actionPoints <= 1) {
            console.log(
              "[GameController] handleKeyDown: Player out of AP after move, switching turn."
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
      logStrings,
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
