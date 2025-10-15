import { MissionDefinition, MissionResourceKey } from '../../game/narrative/structureTypes';
import { level0RecoverCacheMission } from './level0-recover-cache/missionDefinition';
import { level0DecryptManifestsMission } from './level0-decrypt-manifests/missionDefinition';
import { level0RebuildCourierNetworkMission } from './level0-rebuild-courier-network/missionDefinition';
import { level0BlackoutCameraGridMission } from './level0-blackout-camera-grid/missionDefinition';
import { level0MapDronePatrolsMission } from './level0-map-drone-patrols/missionDefinition';
import { level0RestockRebelClinicMission } from './level0-restock-rebel-clinic/missionDefinition';
import { level0ClearTransitPatrolMission } from './level0-clear-transit-patrol/missionDefinition';
import { level1SeizeGovernanceArchivesMission } from './level1-seize-governance-archives/missionDefinition';
import { level1OverrideCurfewTerminalsMission } from './level1-override-curfew-terminals/missionDefinition';
import { level1ExtractDetainedCouriersMission } from './level1-extract-detained-couriers/missionDefinition';
import { level1HijackCameraResyncMission } from './level1-hijack-camera-resync/missionDefinition';
import { level1DivertSupplyConvoysMission } from './level1-divert-supply-convoys/missionDefinition';
import { level1BroadcastResistancePropagandaMission } from './level1-broadcast-resistance-propaganda/missionDefinition';
import { level2StabiliseRefineryOutpostMission } from './level2-stabilise-refinery-outpost/missionDefinition';
import { level2CrippleConvoyRoutesMission } from './level2-cripple-convoy-routes/missionDefinition';
import { level2RecoverFiltrationCoreMission } from './level2-recover-filtration-core/missionDefinition';
import { level2BrokerScavengerTruceMission } from './level2-broker-scavenger-truce/missionDefinition';
import { level2StabilisePowerGridMission } from './level2-stabilise-power-grid/missionDefinition';
import { level2SecureEvacuationLanesMission } from './level2-secure-evacuation-lanes/missionDefinition';

const definitions: MissionDefinition[] = [
  level0RecoverCacheMission,
  level0DecryptManifestsMission,
  level0RebuildCourierNetworkMission,
  level0BlackoutCameraGridMission,
  level0MapDronePatrolsMission,
  level0RestockRebelClinicMission,
  level0ClearTransitPatrolMission,
  level1SeizeGovernanceArchivesMission,
  level1OverrideCurfewTerminalsMission,
  level1ExtractDetainedCouriersMission,
  level1HijackCameraResyncMission,
  level1DivertSupplyConvoysMission,
  level1BroadcastResistancePropagandaMission,
  level2StabiliseRefineryOutpostMission,
  level2CrippleConvoyRoutesMission,
  level2RecoverFiltrationCoreMission,
  level2BrokerScavengerTruceMission,
  level2StabilisePowerGridMission,
  level2SecureEvacuationLanesMission,
];

export const MISSION_DEFINITIONS: MissionDefinition[] = definitions;

export const MISSION_DEFINITION_BY_KEY: Record<MissionResourceKey, MissionDefinition> =
  definitions.reduce<Record<MissionResourceKey, MissionDefinition>>((acc, definition) => {
    acc[definition.resourceKey] = definition;
    return acc;
  }, {} as Record<MissionResourceKey, MissionDefinition>);
