import React, { useCallback, useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { movePlayer, updateActionPoints } from "../store/playerSlice";
import {
  updateEnemy,
  enterCombat,
  switchTurn,
  addEnemy,
  spawnEnemy,
} from "../store/worldSlice";
import { RootState } from "../store";
import { isPositionWalkable } from "../game/world/grid";
import {
  executeAttack,
  isInAttackRange,
  DEFAULT_ATTACK_COST,
} from "../game/combat/combatSystem";
import { Enemy, Position } from "../game/interfaces/types";
import { determineEnemyMove } from "../game/combat/enemyAI";

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

  // Reference to the div element for focusing
  const controllerRef = useRef<HTMLDivElement>(null);

  // State for movement feedback message
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");

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

    // Spawn a test enemy on component mount if no enemies exist
    if (enemies.length === 0) {
      const testEnemy = spawnEnemy("Test Enemy", { x: 7, y: 4 });
      dispatch(addEnemy(testEnemy));
    }

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [dispatch, enemies.length]);

  // Effect to handle enemy turn
  useEffect(() => {
    // Skip if not in combat or it's player's turn
    if (!inCombat || isPlayerTurn || enemies.length === 0) {
      return;
    }

    // Process each enemy's turn
    const enemyTurnTimer = setTimeout(() => {
      // Get wall positions for obstacle detection
      const walls: Position[] = [];
      for (let y = 0; y < currentMapArea.height; y++) {
        for (let x = 0; x < currentMapArea.width; x++) {
          if (!currentMapArea.tiles[y][x].isWalkable) {
            walls.push({ x, y });
          }
        }
      }

      // Get cover positions
      const coverPositions: Position[] = [];
      for (let y = 0; y < currentMapArea.height; y++) {
        for (let x = 0; x < currentMapArea.width; x++) {
          if (currentMapArea.tiles[y][x].provideCover) {
            coverPositions.push({ x, y });
          }
        }
      }

      // Process each enemy's turn
      let allEnemiesDone = true;

      enemies.forEach((enemy) => {
        if (enemy.actionPoints > 0) {
          allEnemiesDone = false;

          // Determine enemy action
          const result = determineEnemyMove(
            enemy,
            player,
            walls,
            coverPositions
          );

          // Update enemy state
          dispatch(updateEnemy(result.enemy));

          // Show feedback based on action
          if (result.action === "attack") {
            setFeedbackMessage(
              `${enemy.name} attacks for ${
                result.player.health - player.health
              } damage!`
            );
          } else if (result.action === "move") {
            setFeedbackMessage(`${enemy.name} moves closer!`);
          } else if (result.action === "seek_cover") {
            setFeedbackMessage(`${enemy.name} seeks cover!`);
          }
        }
      });

      // If all enemies have used their AP, switch turn back to player
      if (allEnemiesDone) {
        dispatch(switchTurn());
      }
    }, 1000); // 1 second delay for enemy actions

    return () => clearTimeout(enemyTurnTimer);
  }, [inCombat, isPlayerTurn, enemies, player, currentMapArea, dispatch]);

  // Clear feedback message after 2 seconds
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => {
        setFeedbackMessage("");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  // Handle attacking an enemy
  const attackEnemy = useCallback(
    (enemy: Enemy) => {
      // Check if player has enough AP
      if (player.actionPoints < DEFAULT_ATTACK_COST) {
        setFeedbackMessage("Not enough action points to attack!");
        return;
      }

      // Check if enemy is in range
      if (!isInAttackRange(player.position, enemy.position, 1)) {
        setFeedbackMessage("Enemy is out of range!");
        return;
      }

      // Execute attack
      const isBehindCover = false; // TODO: Implement cover detection
      const result = executeAttack(player, enemy, isBehindCover);

      if (result.success) {
        setFeedbackMessage(
          `Hit! Dealt ${result.damage} damage to ${enemy.name}`
        );
      } else {
        setFeedbackMessage(`Missed ${enemy.name}!`);
      }

      // Update player AP
      dispatch(updateActionPoints(-DEFAULT_ATTACK_COST));

      // Update enemy
      dispatch(updateEnemy(result.newTarget as Enemy));

      // If no enemies left with health > 0, exit combat
      const anyEnemiesAlive = enemies.some(
        (e) =>
          e.id !== enemy.id ||
          (e.id === enemy.id && result.newTarget.health > 0)
      );

      if (!anyEnemiesAlive) {
        setFeedbackMessage("All enemies defeated!");
      } else if (player.actionPoints - DEFAULT_ATTACK_COST <= 0) {
        // If player has no more AP, switch turn
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
            setFeedbackMessage("Entered combat mode!");
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
            attackEnemy(nearbyEnemy);
            return;
          } else {
            setFeedbackMessage("No enemies in range to attack!");
            return;
          }
        }

        return;
      }

      // Only allow movement if player has action points and it's their turn (if in combat)
      if (inCombat && (!isPlayerTurn || player.actionPoints <= 0)) {
        if (player.actionPoints <= 0) {
          setFeedbackMessage("Not enough action points to move!");
        } else if (!isPlayerTurn) {
          setFeedbackMessage("It's not your turn!");
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
      if (isPositionWalkable(newPosition, currentMapArea)) {
        dispatch(movePlayer(newPosition));
        setFeedbackMessage(`Moved to (${newPosition.x}, ${newPosition.y})`);

        // If in combat, movement costs action points
        if (inCombat) {
          dispatch(updateActionPoints(-1)); // Reduce action points by 1

          // If player has no more AP, switch turn
          if (player.actionPoints - 1 <= 0) {
            dispatch(switchTurn());
          }

          // Check if moved adjacent to an enemy, and if so, enter combat if not already
          if (!inCombat) {
            const adjacentEnemy = enemies.find(
              (enemy) =>
                Math.abs(enemy.position.x - newPosition.x) +
                  Math.abs(enemy.position.y - newPosition.y) <=
                1
            );

            if (adjacentEnemy) {
              dispatch(enterCombat());
              setFeedbackMessage("Entered combat mode!");
            }
          }
        }
      } else {
        // Show feedback for obstacles
        setFeedbackMessage("Cannot move there! Path is blocked.");
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
      {feedbackMessage && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-75 text-white py-2 px-4 rounded text-sm">
          {feedbackMessage}
        </div>
      )}
      {inCombat && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-900 bg-opacity-75 text-white py-2 px-4 rounded text-sm">
          Combat Mode: {isPlayerTurn ? "Your Turn" : "Enemy Turn"}
        </div>
      )}
      <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-75 text-white py-2 px-4 rounded text-sm">
        Controls: Arrow Keys/WASD to move, Spacebar to attack
      </div>
    </div>
  );
};

export default GameController;
