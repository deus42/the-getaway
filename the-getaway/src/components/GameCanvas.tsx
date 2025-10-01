import React, { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
// Remove useSelector and RootState if no longer needed here
// import { useSelector } from "react-redux";
// import { RootState } from "../store";
import { MainScene } from "../game/scenes/MainScene";
import { BootScene } from "../game/scenes/BootScene";

const GameCanvas: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const [rendererInfo, setRendererInfo] = useState({
    label: "Detecting…",
    detail: "Negotiating renderer",
  });

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

    const describeRenderer = (type?: number) => {
      switch (type) {
        case Phaser.WEBGL:
          return {
            label: "WebGL",
            detail: "GPU accelerated (shaders, batching)",
          };
        case Phaser.CANVAS:
          return {
            label: "Canvas",
            detail: "CPU rasterization fallback",
          };
        case Phaser.HEADLESS:
          return {
            label: "Headless",
            detail: "No renderer active",
          };
        default:
          return {
            label: "Detecting…",
            detail: "Negotiating renderer",
          };
      }
    };

    const handleRendererUpdate = () => {
      const current = gameInstanceRef.current;
      if (!current || !current.renderer) {
        setRendererInfo({
          label: "Detecting…",
          detail: "Negotiating renderer",
        });
        return;
      }

      setRendererInfo(describeRenderer(current.renderer.type));
    };

    const handleContextLost = () => {
      setRendererInfo({
        label: "Context lost",
        detail: "Attempting to restore GPU access",
      });
    };


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
        const game = gameInstanceRef.current;

        if (game.isBooted) {
          handleRendererUpdate();
        } else {
          game.events.once(Phaser.Core.Events.READY, handleRendererUpdate);
        }

        game.events.on(Phaser.Core.Events.CONTEXT_RESTORED, handleRendererUpdate);
        game.events.on(Phaser.Core.Events.CONTEXT_LOST, handleContextLost);
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
        gameInstanceRef.current.events.off(
          Phaser.Core.Events.READY,
          handleRendererUpdate
        );
        gameInstanceRef.current.events.off(
          Phaser.Core.Events.CONTEXT_RESTORED,
          handleRendererUpdate
        );
        gameInstanceRef.current.events.off(
          Phaser.Core.Events.CONTEXT_LOST,
          handleContextLost
        );
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
      <div
        data-testid="renderer-debug"
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          backgroundColor: "rgba(15, 23, 42, 0.85)",
          color: "#e2e8f0",
          borderRadius: 8,
          padding: "8px 12px",
          fontFamily: "'DM Mono', 'IBM Plex Mono', monospace",
          fontSize: 12,
          lineHeight: 1.4,
          letterSpacing: 0.4,
          backdropFilter: "blur(4px)",
          border: "1px solid rgba(148, 163, 184, 0.35)",
          pointerEvents: "none",
        }}
      >
        <div style={{ fontWeight: 600 }}>Renderer: {rendererInfo.label}</div>
        <div>{rendererInfo.detail}</div>
        <div style={{ marginTop: 4 }}>Phaser {Phaser.VERSION}</div>
      </div>
    </div>
  );
};

export default GameCanvas;
