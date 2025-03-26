import React, { useEffect, useRef } from "react";
import Phaser from "phaser";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { MainScene } from "../game/scenes/MainScene";

const GameCanvas: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);

  // Connect to Redux store to get player position
  const playerPosition = useSelector(
    (state: RootState) => state.player.data.position
  );

  useEffect(() => {
    if (!gameContainerRef.current) return;

    // Basic Phaser configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      backgroundColor: "#2d2d2d",
      parent: gameContainerRef.current,
      scene: [MainScene],
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      pixelArt: true,
      roundPixels: true,
    };

    // Initialize Phaser game only if it doesn't exist yet
    if (!gameInstanceRef.current) {
      gameInstanceRef.current = new Phaser.Game(config);
      console.log("Phaser game initialized");
    }

    // Cleanup function
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
        console.log("Phaser game destroyed");
      }
    };
  }, []);

  return (
    <div className="relative w-full" style={{ zIndex: 0 }}>
      <div ref={gameContainerRef} className="w-full h-screen" />
      <div
        className="absolute top-2 right-2 bg-gray-800 bg-opacity-75 p-2 rounded text-white text-xs"
        style={{ zIndex: 2 }}
      >
        Player Position: x={playerPosition.x}, y={playerPosition.y}
      </div>
    </div>
  );
};

export default GameCanvas;
