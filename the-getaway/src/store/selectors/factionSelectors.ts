import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import { FactionId } from '../../game/interfaces/types';
import {
  getFactionMetadata,
  getFactionStandingSummary,
  getFactionDefinitions,
  FactionStandingId,
} from '../../game/systems/factions';

const selectPlayerFactionMap = (state: RootState) => state.player.data.factionReputation;
const selectFactionEventsRoot = (state: RootState) => state.player.pendingFactionEvents;

export const selectFactionDefinitions = () => getFactionDefinitions();

export const selectFactionReputationMap = createSelector(
  selectPlayerFactionMap,
  (map) => ({ ...map })
);

export const selectPendingFactionEvents = createSelector(
  selectFactionEventsRoot,
  (events) => [...events]
);

export interface FactionStandingWithMetadata {
  factionId: FactionId;
  name: string;
  description: string;
  value: number;
  standingId: FactionStandingId;
  standingLabel: string;
  color: string;
  icon: string;
  effects: string[];
  nextThreshold: ReturnType<typeof getFactionStandingSummary>['nextThreshold'];
}

export const makeSelectFactionStanding = (factionId: FactionId) =>
  createSelector(selectPlayerFactionMap, (map): FactionStandingWithMetadata => {
    const metadata = getFactionMetadata(factionId);
    const summary = getFactionStandingSummary(factionId, map[factionId] ?? metadata.definition.defaultReputation);
    return {
      factionId,
      name: metadata.definition.name,
      description: metadata.definition.description,
      value: summary.value,
      standingId: summary.standing.id,
      standingLabel: summary.standing.label,
      color: summary.standing.color,
      icon: summary.standing.icon,
      effects: summary.effects,
      nextThreshold: summary.nextThreshold,
    };
  });

export const selectAllFactionStandings = createSelector(selectPlayerFactionMap, (map) => {
  const orderedDefinitions = getFactionDefinitions();

  return orderedDefinitions.map(({ id }) => {
    const metadata = getFactionMetadata(id);
    const summary = getFactionStandingSummary(id, map[id] ?? metadata.definition.defaultReputation);
    return {
      factionId: id,
      name: metadata.definition.name,
      description: metadata.definition.description,
      value: summary.value,
      standingId: summary.standing.id,
      standingLabel: summary.standing.label,
      color: summary.standing.color,
      icon: summary.standing.icon,
      effects: summary.effects,
      nextThreshold: summary.nextThreshold,
    } as FactionStandingWithMetadata;
  });
});
