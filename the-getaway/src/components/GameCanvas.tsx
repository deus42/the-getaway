import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

const GameCanvas: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameContainerRef.current) return;

    // Basic Phaser configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      backgroundColor: "#2d2d2d",
      parent: gameContainerRef.current,
      scene: {
        create: function () {
          this.add
            .text(400, 300, "The Getaway", {
              font: "32px Arial",
              color: "#ffffff",
            })
            .setOrigin(0.5);
          console.log("Phaser initialized successfully");
        },
      },
    };

    // Initialize Phaser game
    const game = new Phaser.Game(config);

    // Cleanup function
    return () => {
      game.destroy(true);
    };
  }, []);

  return <div ref={gameContainerRef} className="w-full h-screen" />;
};

export default GameCanvas;
