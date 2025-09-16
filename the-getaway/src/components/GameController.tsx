import React, { useCallback, useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  movePlayer,
  updateActionPoints,
  setPlayerData,
  resetActionPoints,
} from "../store/playerSlice";
import { updateEnemy, enterCombat, switchTurn } from "../store/worldSlice";
import { addLogMessage } from "../store/logSlice";
import { RootState } from "../store";
import { isPositionWalkable } from "../game/world/grid";
import {
  executeAttack,
  isInAttackRange,
  DEFAULT_ATTACK_COST,
} from "../game/combat/combatSystem";
import { Enemy, Position, MapArea, TileType } from "../game/interfaces/types";
import { determineEnemyMove } from "../game/combat/enemyAI";
import { mapAreas, getConnectionForPosition } from "../game/world/worldMap";
import { setMapArea } from "../store/worldSlice";

const GameController: React.FC = () => {
  const dispatch = useDispatch();
  const player = useSelector((state: RootState) => state.player.data);
  const currentMapArea = useSelector(
    (state: RootState) => state.world.currentMapArea
  );
  const inCombat = useSelector((state: RootState) => state.world.inCombat);
  const isPlayerTurn = useSelector(
    (state: RootState) => state.world.isPlayerTurn
  );
  const enemies = useSelector(
    (state: RootState) => state.world.currentMapArea.entities.enemies
  );
  const prevInCombat = useRef(inCombat); // Ref to track previous value

  // State to track current enemy turn processing
  const [currentEnemyTurnIndex, setCurrentEnemyTurnIndex] = useState<number>(0);
  const [isProcessingEnemyAction, setIsProcessingEnemyAction] =
    useState<boolean>(false);

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
      dispatch(addLogMessage("Combat Over!"));
      console.log(
        "[GameController] Combat ended (detected via useEffect watching inCombat)."
      );
      // Explicitly reset player AP when combat ends.
      dispatch(resetActionPoints());
    }
    // Update the ref *after* the check for the next render
    prevInCombat.current = inCombat;
  }, [inCombat, dispatch]); // Run whenever inCombat changes (add dispatch if used inside)

  // Handle attacking an enemy
  const attackEnemy = useCallback(
    (enemy: Enemy, mapArea: MapArea) => {
      // Check if player has enough AP
      if (player.actionPoints < DEFAULT_ATTACK_COST) {
        dispatch(addLogMessage("Not enough AP to attack!"));
        return;
      }

      // Check if enemy is in range
      if (!isInAttackRange(player.position, enemy.position, 1)) {
        dispatch(addLogMessage("Enemy out of range!"));
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
        dispatch(
          addLogMessage(`You hit ${enemy.name} for ${result.damage} damage.`)
        );
      } else {
        dispatch(addLogMessage(`You missed ${enemy.name}.`));
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
        dispatch(addLogMessage("All enemies defeated!"));
      } else if (player.actionPoints <= DEFAULT_ATTACK_COST) {
        // If player has no more AP or exactly enough for this attack, switch turn
        console.log(
          "[GameController] attackEnemy: Player out of AP after attack, switching turn."
        );
        dispatch(switchTurn());
      }
    },
    [player, enemies, dispatch]
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

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const gameKeys = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "w",
        "a",
        "s",
        "d",
        " ", // Spacebar for attacking
      ];

      if (!gameKeys.includes(event.key)) {
        return;
      }

      // Prevent default only for game keys
      event.preventDefault();
      event.stopPropagation();

      // Handle spacebar for attacking
      if (event.key === " ") {
        // If not in combat and enemies nearby, enter combat
        if (!inCombat) {
          const nearbyEnemy = findClosestEnemy(player.position);
          if (
            nearbyEnemy &&
            isInAttackRange(player.position, nearbyEnemy.position, 1)
          ) {
            dispatch(enterCombat());
            dispatch(addLogMessage("Entered combat mode!"));
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
            dispatch(addLogMessage("No enemies in range to attack!"));
            return;
          }
        }

        return;
      }

      // Only allow movement if player has action points and it's their turn (if in combat)
      if (inCombat && (!isPlayerTurn || player.actionPoints <= 0)) {
        if (player.actionPoints <= 0) {
          dispatch(addLogMessage("Not enough action points to move!"));
        } else if (!isPlayerTurn) {
          dispatch(addLogMessage("It's not your turn!"));
        }
        return;
      }

      const newPosition = { ...player.position };

      switch (event.key) {
        case "ArrowUp":
        case "w":
          newPosition.y -= 1;
          break;
        case "ArrowDown":
        case "s":
          newPosition.y += 1;
          break;
        case "ArrowLeft":
        case "a":
          newPosition.x -= 1;
          break;
        case "ArrowRight":
        case "d":
          newPosition.x += 1;
          break;
        default:
          return; // Exit if not a movement key
      }

      // Check if the new position is walkable
      if (isPositionWalkable(newPosition, currentMapArea, player, enemies)) {
        const tile = currentMapArea.tiles[newPosition.y][newPosition.x];
        const connection = getConnectionForPosition(
          currentMapArea.id,
          newPosition
        );

        if (tile.type === TileType.DOOR && connection) {
          const targetArea = mapAreas[connection.toAreaId];
          dispatch(setMapArea(targetArea));
          dispatch(movePlayer(connection.toPosition));
        } else {
          dispatch(movePlayer(newPosition));
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
