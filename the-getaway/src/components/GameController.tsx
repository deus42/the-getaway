import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { movePlayer, updateActionPoints } from "../store/playerSlice";
import { RootState } from "../store";
import { isPositionWalkable } from "../game/world/grid";

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
      ];

      if (!gameKeys.includes(event.key)) {
        return;
      }

      // Prevent default only for game keys
      event.preventDefault();
      event.stopPropagation();

      // Only allow movement if player has action points and it's their turn (if in combat)
      if (inCombat && (!isPlayerTurn || player.actionPoints <= 0)) {
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

        // If in combat, movement costs action points
        if (inCombat) {
          dispatch(updateActionPoints(-1)); // Reduce action points by 1
        }
      }
    },
    [
      player.position,
      player.actionPoints,
      currentMapArea,
      dispatch,
      inCombat,
      isPlayerTurn,
    ]
  );

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 focus:outline-none"
      style={{ zIndex: 1 }}
    />
  );
};

export default GameController;
