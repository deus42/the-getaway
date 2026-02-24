import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import { FactionId } from '../../game/interfaces/types';
import {
  getFactionMetadata,
  getFactionStandingSummary,
  getFactionDefinitions,
  FactionStandingId,
} from '../../game/systems/factions';

const selectReputationSystemsEnabled = (state: RootState) =>
  Boolean(state.settings.reputationSystemsEnabled);
const DEFAULT_FACTION_REPUTATION: Record<FactionId, number> = {
  resistance: 0,
  corpsec: 0,
  scavengers: 0,
};
const EMPTY_FACTION_EVENTS: RootState['player']['pendingFactionEvents'] = [];
const EMPTY_FACTION_STANDINGS: FactionStandingWithMetadata[] = [];

const selectPlayerFactionMap = (state: RootState) => state.player.data.factionReputation;
const selectFactionEventsRoot = (state: RootState) => state.player.pendingFactionEvents;

export const selectFactionDefinitions = () => getFactionDefinitions();

export const selectFactionReputationMap = createSelector(
  selectPlayerFactionMap,
  selectReputationSystemsEnabled,
  (map, enabled) => (enabled ? map : DEFAULT_FACTION_REPUTATION)
);

export const selectPendingFactionEvents = createSelector(
  selectFactionEventsRoot,
  selectReputationSystemsEnabled,
  (events, enabled) => {
    if (!enabled || events.length === 0) {
      return EMPTY_FACTION_EVENTS;
    }
    return events;
  }
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
  createSelector(selectPlayerFactionMap, selectReputationSystemsEnabled, (map, enabled): FactionStandingWithMetadata => {
    const metadata = getFactionMetadata(factionId);
    const value = enabled ? map[factionId] ?? metadata.definition.defaultReputation : metadata.definition.defaultReputation;
    const summary = getFactionStandingSummary(factionId, value);
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

export const selectAllFactionStandings = createSelector(
  selectPlayerFactionMap,
  selectReputationSystemsEnabled,
  (map, enabled) => {
    if (!enabled) {
      return EMPTY_FACTION_STANDINGS;
    }

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
  }
);
