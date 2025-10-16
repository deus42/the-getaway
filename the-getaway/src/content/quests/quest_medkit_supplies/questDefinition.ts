import { QuestDefinition } from '../../../game/narrative/structureTypes';

export const questMedkitSuppliesDefinition: QuestDefinition = {
  id: 'quest_medkit_supplies',
  resourceKey: 'quests.medkit_supplies',
  levelKey: 'levels.slums_command_grid',
  missionKey: 'missions.level0.restock_rebel_clinic',
  kind: 'side',
  objectives: [
    {
      id: 'collect-medkits',
      type: 'collect',
      targetResourceKey: 'items.abandoned_medkit',
      count: 2,
    },
  ],
  rewards: [
    { type: 'experience', resourceKey: 'experience.base', amount: 80 },
    { type: 'currency', resourceKey: 'currency.credits', amount: 50 },
  ],
  relatedNpcKeys: ['npcs.medic_yara'],
  status: 'implemented',
};
