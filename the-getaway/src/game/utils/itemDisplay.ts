import type { Item } from '../interfaces/types';

const SHORT_PICKUP_NAME_BY_RESOURCE_KEY: Record<string, string> = {
  'items.corporate_keycard': 'Keycard',
  'items.encrypted_datapad': 'Datapad',
  'items.transit_tokens': 'Transit Token',
  'items.abandoned_medkit': 'Medkit',
  'items.holo_projector_lens': 'Lens',
  'items.saboteur_charge_kit': 'Charge Kit',
};

const SHORT_PICKUP_NAME_BY_DEFINITION_ID: Record<string, string> = {
  misc_corporate_keycard: 'Keycard',
  misc_encrypted_datapad: 'Datapad',
  misc_transit_tokens: 'Transit Token',
  misc_abandoned_medkit: 'Medkit',
  misc_holo_projector_lens: 'Lens',
  misc_saboteur_charge_kit: 'Charge Kit',
};

type PickupDisplayItem = Pick<Item, 'name' | 'resourceKey' | 'definitionId'>;

export const resolvePickupObjectName = (item: PickupDisplayItem): string => {
  if (item.resourceKey && SHORT_PICKUP_NAME_BY_RESOURCE_KEY[item.resourceKey]) {
    return SHORT_PICKUP_NAME_BY_RESOURCE_KEY[item.resourceKey];
  }

  if (item.definitionId && SHORT_PICKUP_NAME_BY_DEFINITION_ID[item.definitionId]) {
    return SHORT_PICKUP_NAME_BY_DEFINITION_ID[item.definitionId];
  }

  return item.name;
};
