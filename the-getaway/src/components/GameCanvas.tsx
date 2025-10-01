import React, { useEffect, useRef } from "react";
import Phaser from "phaser";
// Remove useSelector and RootState if no longer needed here
// import { useSelector } from "react-redux";
// import { RootState } from "../store";
import { MainScene } from "../game/scenes/MainScene";
import { BootScene } from "../game/scenes/BootScene";

const GameCanvas: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);

  // Remove position selector
  // const playerPosition = useSelector(
  //   (state: RootState) => state.player.data.position
  // );

  useEffect(() => {
    console.log("[GameCanvas] useEffect running");
    console.log(
      "[GameCanvas] gameContainerRef.current:",
      gameContainerRef.current
    );

    if (!gameContainerRef.current) {
      console.error("[GameCanvas] No container ref available");
      return;
    }

    // Make config width/height potentially dynamic based on parent
    const parentWidth = gameContainerRef.current.offsetWidth;
    const parentHeight = gameContainerRef.current.offsetHeight;

    console.log("[GameCanvas] Container dimensions:", {
      parentWidth,
      parentHeight,
    });

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: parentWidth > 0 ? parentWidth : 800,
      height: parentHeight > 0 ? parentHeight : 600,
      backgroundColor: "#1a1a1a",
      backgroundAlpha: 1,
      parent: gameContainerRef.current,
      scene: [BootScene, MainScene],
      scale: {
        mode: Phaser.Scale.FIT, // Use FIT mode to avoid constant resizing
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: parentWidth > 0 ? parentWidth : 800,
        height: parentHeight > 0 ? parentHeight : 600,
      },
      render: {
        antialias: false,
        pixelArt: true,
        roundPixels: true,
        transparent: false,
        powerPreference: "high-performance",
      },
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      pixelArt: true,
      roundPixels: true,
      transparent: false,
    };

    console.log("[GameCanvas] Phaser config:", config);

    if (!gameInstanceRef.current) {
      try {
        gameInstanceRef.current = new Phaser.Game(config);
        console.log("[GameCanvas] Phaser game initialized successfully");
      } catch (error) {
        console.error("[GameCanvas] Error initializing Phaser:", error);
      }
    }

    // Simple resize handler - fewer options to avoid blinking
    const handleResize = () => {
      if (gameInstanceRef.current && gameContainerRef.current) {
        const newWidth = gameContainerRef.current.offsetWidth;
        const newHeight = gameContainerRef.current.offsetHeight;

        // Simple resize without too many options
        gameInstanceRef.current.scale.resize(newWidth, newHeight);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      console.log("[GameCanvas] Cleanup running");
      window.removeEventListener("resize", handleResize);
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
        console.log("[GameCanvas] Phaser game destroyed");
      }
    };
  }, []);

  console.log("[GameCanvas] Rendering component");

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "#1a1a1a",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        ref={gameContainerRef}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1a1a1a",
          minWidth: "400px", // Ensure minimum width to prevent extreme squishing
          minHeight: "300px", // Ensure minimum height
        }}
      />
      {/* Remove position display overlay */}
      {/* <div ... > ... </div> */}
    </div>
  );
};

export default GameCanvas;
