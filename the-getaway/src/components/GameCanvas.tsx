import React, { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { updateVisualSettings } from "../game/settings/visualSettings";
// Remove useSelector and RootState if no longer needed here
// import { useSelector } from "react-redux";
// import { RootState } from "../store";
import { MainScene } from "../game/scenes/MainScene";
import { BootScene } from "../game/scenes/BootScene";

type RendererMeta = {
  label: string;
  detail: string;
  type?: number;
};

type GameCanvasProps = {
  onRendererInfo?: (info: RendererMeta) => void;
};

const GameCanvas: React.FC<GameCanvasProps> = ({ onRendererInfo }) => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const [rendererInfo, setRendererInfo] = useState<RendererMeta>({
    label: "Detecting…",
    detail: "Negotiating renderer",
  });

  // Remove position selector
  // const playerPosition = useSelector(
  //   (state: RootState) => state.player.data.position
  // );

  const lastResize = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

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

    const describeRenderer = (type?: number): RendererMeta => {
      switch (type) {
        case Phaser.WEBGL:
          return {
            label: "WebGL",
            detail: "GPU accelerated (shaders, batching)",
            type,
          };
        case Phaser.CANVAS:
          return {
            label: "Canvas",
            detail: "CPU rasterization fallback",
            type,
          };
        case Phaser.HEADLESS:
          return {
            label: "Headless",
            detail: "No renderer active",
            type,
          };
        default:
          return {
            label: "Detecting…",
            detail: "Negotiating renderer",
            type,
          };
      }
    };

    const handleRendererUpdate = () => {
      const current = gameInstanceRef.current;
      if (!current || !current.renderer) {
        const info: RendererMeta = {
          label: "Detecting…",
          detail: "Negotiating renderer",
          type: undefined,
        };
        setRendererInfo(info);
        return;
      }

      const info = describeRenderer(current.renderer.type);
      setRendererInfo(info);
    };

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: parentWidth > 0 ? parentWidth : 800,
      height: parentHeight > 0 ? parentHeight : 600,
      backgroundColor: "#1a1a1a",
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

        // Context events not available in this Phaser version
        console.log("[GameCanvas] Phaser game initialized successfully");
      } catch (error) {
        console.error("[GameCanvas] Error initializing Phaser:", error);
      }
    }

    // Simple resize handler - fewer options to avoid blinking
    let containerObserver: ResizeObserver | undefined;
    let resizeTimeout: number | null = null;
    const pendingResize = {
      width: parentWidth,
      height: parentHeight,
    };

    const resizeToContainer = (width: number, height: number) => {
      if (!gameInstanceRef.current) {
        return;
      }

      const clampedWidth = Math.max(0, Math.floor(width));
      const clampedHeight = Math.max(0, Math.floor(height));
      if (clampedWidth === 0 || clampedHeight === 0) {
        return;
      }

      const { width: previousWidth, height: previousHeight } = lastResize.current;
      if (previousWidth === clampedWidth && previousHeight === clampedHeight) {
        return;
      }

      lastResize.current = { width: clampedWidth, height: clampedHeight };

      const game = gameInstanceRef.current;
      game.scale.resize(clampedWidth, clampedHeight);
    };

    const scheduleResize = (width?: number, height?: number) => {
      if (typeof width === "number" && typeof height === "number") {
        pendingResize.width = width;
        pendingResize.height = height;
      } else if (gameContainerRef.current) {
        pendingResize.width = gameContainerRef.current.offsetWidth;
        pendingResize.height = gameContainerRef.current.offsetHeight;
      }

      if (resizeTimeout !== null) {
        window.clearTimeout(resizeTimeout);
      }

      resizeTimeout = window.setTimeout(() => {
        resizeTimeout = null;
        resizeToContainer(pendingResize.width, pendingResize.height);
      }, 40);
    };

    const handleResize = () => {
      scheduleResize();
    };

    if (typeof ResizeObserver !== "undefined" && gameContainerRef.current) {
      containerObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }

        scheduleResize(entry.contentRect.width, entry.contentRect.height);
      });
      containerObserver.observe(gameContainerRef.current);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      console.log("[GameCanvas] Cleanup running");
      window.removeEventListener("resize", handleResize);
      if (resizeTimeout !== null) {
        window.clearTimeout(resizeTimeout);
      }
      if (containerObserver) {
        containerObserver.disconnect();
      }
      if (gameInstanceRef.current) {
        gameInstanceRef.current.events.off(
          Phaser.Core.Events.READY,
          handleRendererUpdate
        );
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
        console.log("[GameCanvas] Phaser game destroyed");
      }
    };
  }, []);

  console.log("[GameCanvas] Rendering component");

  const testMode = useSelector((state: RootState) => state.settings.testMode);
  const lightsEnabled = useSelector((state: RootState) => state.settings.lightsEnabled);

  useEffect(() => {
    updateVisualSettings({ lightsEnabled });
  }, [lightsEnabled]);

  useEffect(() => {
    if (!gameInstanceRef.current) {
      return;
    }
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
  }, [testMode]);

  useEffect(() => {
    if (!onRendererInfo) {
      return;
    }
    onRendererInfo(rendererInfo);
  }, [onRendererInfo, rendererInfo]);

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
        pointerEvents: "none",
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
          minWidth: "400px",
          minHeight: "300px",
          pointerEvents: "auto",
        }}
      />
    </div>
  );
};

export default GameCanvas;
