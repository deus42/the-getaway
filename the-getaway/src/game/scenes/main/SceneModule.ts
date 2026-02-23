import Phaser from 'phaser';
import { RootState } from '../../../store';
import { SceneContext } from './SceneContext';

export interface SceneModule<TScene extends Phaser.Scene = Phaser.Scene> {
  readonly key: string;
  readonly dependsOn?: readonly string[];
  init(context: SceneContext<TScene>): void;
  onCreate?(): void;
  onStateChange?(previousState: RootState, nextState: RootState): void;
  onResize?(): void;
  onUpdate?(time: number, delta: number): void;
  onShutdown?(): void;
}
