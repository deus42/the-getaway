import type { Position } from '../../game/interfaces/types';
import type { Level0GuidedStage } from '../../game/quests/level0GuidedSlice';
import type {
  Level0EnvironmentPropFrameId,
  Level0EnvironmentSurfaceFrameId,
} from './atlasFrames';

export interface Level0RouteSetPiece {
  readonly id: string;
  readonly frameId: Level0EnvironmentPropFrameId;
  readonly position: Position;
}

export interface Level0RouteSurfaceDecal {
  readonly id: string;
  readonly frameId: Level0EnvironmentSurfaceFrameId;
  readonly position: Position;
}

export interface Level0GuidedRouteBeacon {
  readonly id: string;
  readonly stages: readonly Level0GuidedStage[];
  readonly position: Position;
}

export const LEVEL0_ROUTE_SET_PIECES: readonly Level0RouteSetPiece[] = [];

export const LEVEL0_ROUTE_SURFACE_DECALS: readonly Level0RouteSurfaceDecal[] = [];

export const LEVEL0_GUIDED_ROUTE_BEACONS: readonly Level0GuidedRouteBeacon[] = [];

export const resolveLevel0RouteBeaconsForStage = (
  stage: Level0GuidedStage
): readonly Level0GuidedRouteBeacon[] =>
  LEVEL0_GUIDED_ROUTE_BEACONS.filter((beacon) => beacon.stages.includes(stage));
