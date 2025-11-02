import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';

export const selectEngagementMode = (state: RootState) => state.world.engagementMode;

export const selectStealthModeEnabled = (state: RootState) =>
  state.player.data.stealthModeEnabled;

export const selectStealthCooldownExpiresAt = (state: RootState) =>
  state.player.data.stealthCooldownExpiresAt;

export const selectActiveDialogueId = (state: RootState) =>
  state.quests.activeDialogue.dialogueId;

export const selectIsStealthEligible = createSelector(
  [
    (state: RootState) => state.world.inCombat,
    selectActiveDialogueId,
    selectStealthCooldownExpiresAt,
  ],
  (inCombat, activeDialogueId, cooldownExpiresAt) => {
    if (inCombat || Boolean(activeDialogueId)) {
      return false;
    }

    if (typeof cooldownExpiresAt === 'number' && cooldownExpiresAt > Date.now()) {
      return false;
    }

    return true;
  }
);

export const selectStealthAvailability = createSelector(
  [selectStealthModeEnabled, selectIsStealthEligible, selectStealthCooldownExpiresAt],
  (enabled, eligible, cooldownExpiresAt) => {
    return {
      enabled,
      eligible,
      cooldownExpiresAt: typeof cooldownExpiresAt === 'number' ? cooldownExpiresAt : null,
      onCooldown: typeof cooldownExpiresAt === 'number',
    };
  }
);
