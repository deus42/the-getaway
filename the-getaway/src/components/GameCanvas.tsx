import React, { useEffect, useRef } from "react";
import Phaser from "phaser";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { MainScene } from "../game/scenes/MainScene";
import { BootScene } from "../game/scenes/BootScene";

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
      scene: [BootScene, MainScene],
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
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        ref={gameContainerRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "0.5rem",
          right: "0.5rem",
          backgroundColor: "rgba(31, 41, 55, 0.75)",
          padding: "0.5rem",
          borderRadius: "0.25rem",
          fontSize: "0.75rem",
          color: "white",
          zIndex: 2,
        }}
      >
        Player Position: x={playerPosition?.x ?? "?"}, y=
        {playerPosition?.y ?? "?"}
      </div>
    </div>
  );
};

export default GameCanvas;
