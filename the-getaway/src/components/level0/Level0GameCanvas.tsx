import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import type { WorldPoint } from '../../game/level0/layout/types';
import type { Level0RunState } from '../../game/level0/runtime/types';
import { Level0Scene, type Level0SceneRuntime } from '../../game/level0/scene/Level0Scene';

export interface Level0GameCanvasProps {
  run: Level0RunState;
  movementPaused: boolean;
  observationActive: boolean;
  georgePresentationVisible: boolean;
  onPlayerCheckpoint(position: WorldPoint, facing: WorldPoint): void;
  onFeedback(feedbackId: string): void;
  onInteraction(anchorId?: string): void;
  onObservationToggle(): void;
}

const Level0GameCanvas = ({
  run,
  movementPaused,
  observationActive,
  georgePresentationVisible,
  onPlayerCheckpoint,
  onFeedback,
  onInteraction,
  onObservationToggle,
}: Level0GameCanvasProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const runtimeRef = useRef<Level0SceneRuntime | null>(null);

  const latestRef = useRef({
    run,
    movementPaused,
    observationActive,
    georgePresentationVisible,
    onPlayerCheckpoint,
    onFeedback,
    onInteraction,
    onObservationToggle,
  });
  latestRef.current = {
    run,
    movementPaused,
    observationActive,
    georgePresentationVisible,
    onPlayerCheckpoint,
    onFeedback,
    onInteraction,
    onObservationToggle,
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || gameRef.current) return undefined;

    const runtime: Level0SceneRuntime = {
      getRun: () => latestRef.current.run,
      isMovementPaused: () => latestRef.current.movementPaused,
      isObservationActive: () => latestRef.current.observationActive,
      isGeorgePresentationVisible: () => latestRef.current.georgePresentationVisible,
      onPlayerCheckpoint: (position, facing) =>
        latestRef.current.onPlayerCheckpoint(position, facing),
      onFeedback: (feedbackId) => latestRef.current.onFeedback(feedbackId),
      onInteraction: (anchorId) => latestRef.current.onInteraction(anchorId),
      onObservationToggle: () => latestRef.current.onObservationToggle(),
    };
    runtimeRef.current = runtime;

    const width = Math.max(800, container.clientWidth);
    const height = Math.max(540, container.clientHeight);
    const scene = new Level0Scene(runtime);
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container,
      width,
      height,
      backgroundColor: '#101215',
      scene: [scene],
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false,
        powerPreference: 'high-performance',
      },
      scale: {
        mode: Phaser.Scale.NONE,
        width,
        height,
      },
    });
    gameRef.current = game;

    let resizeFrame: number | null = null;
    const resize = () => {
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = null;
        const nextWidth = Math.max(1, container.clientWidth);
        const nextHeight = Math.max(1, container.clientHeight);
        game.scale.resize(nextWidth, nextHeight);
      });
    };
    const observer = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(resize);
    observer?.observe(container);
    window.addEventListener('resize', resize);

    return () => {
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
      observer?.disconnect();
      window.removeEventListener('resize', resize);
      game.destroy(true);
      gameRef.current = null;
      runtimeRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-testid="level0-game-canvas"
      data-runtime="get204-production-district-v2"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#101215' }}
    />
  );
};

export default Level0GameCanvas;
