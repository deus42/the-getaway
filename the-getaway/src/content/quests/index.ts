import { QuestDefinition, QuestResourceKey } from '../../game/narrative/structureTypes';
import { questMarketCacheDefinition } from './quest_market_cache/questDefinition';
import { questDatapadTruthDefinition } from './quest_datapad_truth/questDefinition';
import { questCourierNetworkDefinition } from './quest_courier_network/questDefinition';
import { questEquipmentSabotageDefinition } from './quest_equipment_sabotage/questDefinition';
import { questDroneReconDefinition } from './quest_drone_recon/questDefinition';
import { questMedkitSuppliesDefinition } from './quest_medkit_supplies/questDefinition';
import { questCombatPatrolDefinition } from './quest_combat_patrol/questDefinition';
import { questGovernmentArchivesDefinition } from './quest_government_archives/questDefinition';
import { questCurfewOverrideDefinition } from './quest_curfew_override/questDefinition';
import { questPrisonBreakDefinition } from './quest_prison_break/questDefinition';
import { questCameraResyncDefinition } from './quest_camera_resync/questDefinition';
import { questSupplyDiversionDefinition } from './quest_supply_diversion/questDefinition';
import { questPlazaBroadcastDefinition } from './quest_plaza_broadcast/questDefinition';
import { questRefineryStabilizationDefinition } from './quest_refinery_stabilization/questDefinition';
import { questConvoyAmbushDefinition } from './quest_convoy_ambush/questDefinition';
import { questFiltrationRecoveryDefinition } from './quest_filtration_recovery/questDefinition';
import { questScavengerTruceDefinition } from './quest_scavenger_truce/questDefinition';
import { questPowerGridDefinition } from './quest_power_grid/questDefinition';
import { questIndustrialEvacDefinition } from './quest_industrial_evac/questDefinition';

const definitions: QuestDefinition[] = [
  questMarketCacheDefinition,
  questDatapadTruthDefinition,
  questCourierNetworkDefinition,
  questEquipmentSabotageDefinition,
  questDroneReconDefinition,
  questMedkitSuppliesDefinition,
  questCombatPatrolDefinition,
  questGovernmentArchivesDefinition,
  questCurfewOverrideDefinition,
  questPrisonBreakDefinition,
  questCameraResyncDefinition,
  questSupplyDiversionDefinition,
  questPlazaBroadcastDefinition,
  questRefineryStabilizationDefinition,
  questConvoyAmbushDefinition,
  questFiltrationRecoveryDefinition,
  questScavengerTruceDefinition,
  questPowerGridDefinition,
  questIndustrialEvacDefinition,
];

export const QUEST_DEFINITIONS: QuestDefinition[] = definitions;

export const QUEST_DEFINITION_BY_KEY: Record<QuestResourceKey, QuestDefinition> =
  definitions.reduce<Record<QuestResourceKey, QuestDefinition>>((acc, definition) => {
    acc[definition.resourceKey] = definition;
    return acc;
  }, {} as Record<QuestResourceKey, QuestDefinition>);

export const QUEST_DEFINITION_BY_ID: Record<string, QuestDefinition> =
  definitions.reduce<Record<string, QuestDefinition>>((acc, definition) => {
    acc[definition.id] = definition;
    return acc;
  }, {});
