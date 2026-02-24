import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import { AlertLevel, CameraAlertState } from '../../game/interfaces/types';

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

const getGuardAlertRank = (level: AlertLevel | undefined): number => {
  switch (level) {
    case AlertLevel.ALARMED:
      return 3;
    case AlertLevel.INVESTIGATING:
      return 2;
    case AlertLevel.SUSPICIOUS:
      return 1;
    case AlertLevel.IDLE:
    default:
      return 0;
  }
};

const getCameraAlertRank = (level: CameraAlertState): number => {
  switch (level) {
    case CameraAlertState.ALARMED:
      return 3;
    case CameraAlertState.INVESTIGATING:
      return 2;
    case CameraAlertState.SUSPICIOUS:
      return 1;
    case CameraAlertState.IDLE:
    case CameraAlertState.DISABLED:
    default:
      return 0;
  }
};

export type StealthReadabilityState =
  | 'hidden'
  | 'exposed'
  | 'compromised'
  | 'standby';

export type StealthReadabilityReason =
  | 'camera'
  | 'vision'
  | 'noise'
  | 'combat'
  | 'dialogue'
  | 'cooldown'
  | 'none';

export interface StealthReadabilitySummary {
  state: StealthReadabilityState;
  reason: StealthReadabilityReason;
  severity: number;
  stealthActive: boolean;
  onCooldown: boolean;
  cooldownExpiresAt: number | null;
}

export type StealthHudBlockedReason = 'combat' | 'dialogue' | 'cooldown' | null;

export interface StealthHudModel {
  isActive: boolean;
  stateLabel: StealthReadabilityState;
  detailLabel: string;
  canToggle: boolean;
  blockedReason: StealthHudBlockedReason;
  severity: number;
  keyHint: string;
  reason: StealthReadabilityReason;
  cooldownSeconds: number;
}

const selectGuardAlertSummary = createSelector(
  [(state: RootState) => state.world.currentMapArea.entities.enemies],
  (enemies) => {
    let maxRank = 0;
    let maxProgress = 0;

    enemies.forEach((enemy) => {
      const rank = getGuardAlertRank(enemy.alertLevel);
      if (rank > maxRank) {
        maxRank = rank;
      }
      const progress = enemy.alertProgress ?? 0;
      if (progress > maxProgress) {
        maxProgress = progress;
      }
    });

    return {
      maxRank,
      maxProgress: Math.max(0, Math.min(100, Math.round(maxProgress))),
    };
  }
);

export const selectStealthReadability = createSelector(
  [
    selectStealthModeEnabled,
    selectEngagementMode,
    selectIsStealthEligible,
    selectStealthCooldownExpiresAt,
    (state: RootState) => state.world.inCombat,
    selectActiveDialogueId,
    (state: RootState) => state.surveillance.hud,
    selectGuardAlertSummary,
    (state: RootState) => state.player.data.movementProfile,
  ],
  (
    stealthModeEnabled,
    engagementMode,
    stealthEligible,
    cooldownExpiresAt,
    inCombat,
    activeDialogueId,
    surveillanceHud,
    guardAlertSummary,
    movementProfile
  ): StealthReadabilitySummary => {
    const now = Date.now();
    const onCooldown =
      typeof cooldownExpiresAt === 'number' && cooldownExpiresAt > now;
    const normalizedCooldown = typeof cooldownExpiresAt === 'number'
      ? cooldownExpiresAt
      : null;

    const cameraRank = getCameraAlertRank(surveillanceHud.alertState);
    const guardRank = guardAlertSummary.maxRank;
    const cameraExposureActive =
      cameraRank > 0 ||
      surveillanceHud.detectionProgress > 0 ||
      Boolean(surveillanceHud.activeCameraId);
    const guardExposureActive = guardRank > 0;
    const stealthActive = stealthModeEnabled && engagementMode === 'stealth';

    const severity = Math.max(
      Math.round(surveillanceHud.detectionProgress ?? 0),
      guardAlertSummary.maxProgress
    );

    if (inCombat) {
      return {
        state: 'compromised',
        reason: 'combat',
        severity: Math.max(severity, 100),
        stealthActive,
        onCooldown,
        cooldownExpiresAt: normalizedCooldown,
      };
    }

    if (activeDialogueId) {
      return {
        state: stealthActive ? 'exposed' : 'standby',
        reason: 'dialogue',
        severity,
        stealthActive,
        onCooldown,
        cooldownExpiresAt: normalizedCooldown,
      };
    }

    if (stealthActive) {
      if (cameraRank >= 3 || guardRank >= 3) {
        return {
          state: 'compromised',
          reason: cameraRank >= 3
            ? 'camera'
            : movementProfile === 'sprint'
            ? 'noise'
            : 'vision',
          severity: Math.max(severity, 80),
          stealthActive,
          onCooldown,
          cooldownExpiresAt: normalizedCooldown,
        };
      }

      if (cameraExposureActive || guardExposureActive || severity >= 30) {
        return {
          state: 'exposed',
          reason: cameraExposureActive
            ? 'camera'
            : movementProfile === 'sprint'
            ? 'noise'
            : 'vision',
          severity: Math.max(severity, 30),
          stealthActive,
          onCooldown,
          cooldownExpiresAt: normalizedCooldown,
        };
      }

      return {
        state: 'hidden',
        reason: 'none',
        severity,
        stealthActive,
        onCooldown,
        cooldownExpiresAt: normalizedCooldown,
      };
    }

    if (onCooldown || !stealthEligible) {
      return {
        state: 'compromised',
        reason: 'cooldown',
        severity,
        stealthActive,
        onCooldown,
        cooldownExpiresAt: normalizedCooldown,
      };
    }

    return {
      state: 'standby',
      reason: 'none',
      severity,
      stealthActive,
      onCooldown,
      cooldownExpiresAt: normalizedCooldown,
    };
  }
);

export const selectIsHidden = createSelector(
  [selectStealthReadability],
  (readability) => readability.stealthActive && readability.state === 'hidden'
);

export const selectStealthHudModel = createSelector(
  [
    selectStealthReadability,
    (state: RootState) => state.world.inCombat,
    selectActiveDialogueId,
  ],
  (
    readability,
    inCombat,
    activeDialogueId
  ): StealthHudModel => {
    const now = Date.now();
    const cooldownSeconds = readability.onCooldown && readability.cooldownExpiresAt
      ? Math.max(1, Math.ceil((readability.cooldownExpiresAt - now) / 1000))
      : 0;

    const blockedReason: StealthHudBlockedReason = inCombat
      ? 'combat'
      : activeDialogueId
      ? 'dialogue'
      : readability.onCooldown || readability.reason === 'cooldown'
      ? 'cooldown'
      : null;

    const isActive = readability.stealthActive;
    const canToggle = isActive || blockedReason === null;

    let detailLabel = 'ready';
    if (blockedReason === 'combat') {
      detailLabel = 'combat';
    } else if (blockedReason === 'dialogue') {
      detailLabel = 'dialogue';
    } else if (blockedReason === 'cooldown') {
      detailLabel = cooldownSeconds > 0
        ? `cooldown:${cooldownSeconds}`
        : 'cooldown';
    } else if (isActive && readability.reason !== 'none') {
      detailLabel = `${readability.reason}:${Math.max(0, Math.min(100, Math.round(readability.severity)))}`;
    }

    return {
      isActive,
      stateLabel: readability.state,
      detailLabel,
      canToggle,
      blockedReason,
      severity: Math.max(0, Math.min(100, Math.round(readability.severity))),
      keyHint: 'X',
      reason: readability.reason,
      cooldownSeconds,
    };
  }
);

export const selectStealthAvailability = createSelector(
  [selectStealthModeEnabled, selectIsStealthEligible, selectStealthCooldownExpiresAt],
  (enabled, eligible, cooldownExpiresAt) => {
    return {
      enabled,
      eligible,
      cooldownExpiresAt: typeof cooldownExpiresAt === 'number' ? cooldownExpiresAt : null,
      onCooldown:
        typeof cooldownExpiresAt === 'number' && cooldownExpiresAt > Date.now(),
    };
  }
);
