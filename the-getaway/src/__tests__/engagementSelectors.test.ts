import { configureStore } from '@reduxjs/toolkit';
import { RootState } from '../store';
import playerReducer from '../store/playerSlice';
import worldReducer from '../store/worldSlice';
import hudLayoutReducer from '../store/hudLayoutSlice';
import settingsReducer from '../store/settingsSlice';
import questsReducer from '../store/questsSlice';
import logReducer from '../store/logSlice';
import autoBattleReducer from '../store/autoBattleSlice';
import combatFeedbackReducer from '../store/combatFeedbackSlice';
import missionsReducer from '../store/missionSlice';
import surveillanceReducer from '../store/surveillanceSlice';
import storyletReducer from '../store/storyletSlice';
import suspicionReducer from '../store/suspicionSlice';
import paranoiaReducer from '../store/paranoiaSlice';
import reputationReducer from '../store/reputationSlice';
import { AlertLevel, CameraAlertState } from '../game/interfaces/types';
import {
  selectIsHidden,
  selectIsStealthEligible,
  selectStealthHudModel,
  selectStealthReadability,
} from '../store/selectors/engagementSelectors';

interface SelectorOverrides {
  inCombat?: boolean;
  engagementMode?: RootState['world']['engagementMode'];
  stealthModeEnabled?: boolean;
  stealthCooldownExpiresAt?: number | null;
  movementProfile?: RootState['player']['data']['movementProfile'];
  activeDialogueId?: string | null;
  cameraAlertState?: CameraAlertState;
  cameraDetectionProgress?: number;
  activeCameraId?: string | null;
  enemyAlertLevel?: AlertLevel;
  enemyAlertProgress?: number;
}

const createSelectorState = (overrides: SelectorOverrides = {}): RootState => {
  const baseStore = configureStore({
    reducer: {
      player: playerReducer,
      world: worldReducer,
      hudLayout: hudLayoutReducer,
      settings: settingsReducer,
      quests: questsReducer,
      log: logReducer,
      autoBattle: autoBattleReducer,
      combatFeedback: combatFeedbackReducer,
      missions: missionsReducer,
      surveillance: surveillanceReducer,
      storylets: storyletReducer,
      suspicion: suspicionReducer,
      paranoia: paranoiaReducer,
      reputation: reputationReducer,
    },
  });

  const baseState = baseStore.getState() as RootState;
  const baselineEnemy = baseState.world.currentMapArea.entities.enemies[0];

  const enemy = baselineEnemy
    ? {
        ...baselineEnemy,
        alertLevel: overrides.enemyAlertLevel ?? baselineEnemy.alertLevel ?? AlertLevel.IDLE,
        alertProgress: overrides.enemyAlertProgress ?? baselineEnemy.alertProgress ?? 0,
      }
    : undefined;

  return {
    ...baseState,
    player: {
      ...baseState.player,
      data: {
        ...baseState.player.data,
        stealthModeEnabled:
          overrides.stealthModeEnabled ?? baseState.player.data.stealthModeEnabled,
        stealthCooldownExpiresAt:
          overrides.stealthCooldownExpiresAt ?? baseState.player.data.stealthCooldownExpiresAt,
        movementProfile:
          overrides.movementProfile ?? baseState.player.data.movementProfile,
      },
    },
    world: {
      ...baseState.world,
      inCombat: overrides.inCombat ?? baseState.world.inCombat,
      engagementMode: overrides.engagementMode ?? baseState.world.engagementMode,
      currentMapArea: {
        ...baseState.world.currentMapArea,
        entities: {
          ...baseState.world.currentMapArea.entities,
          enemies: enemy ? [enemy] : baseState.world.currentMapArea.entities.enemies,
        },
      },
    },
    quests: {
      ...baseState.quests,
      activeDialogue: {
        ...baseState.quests.activeDialogue,
        dialogueId:
          overrides.activeDialogueId ?? baseState.quests.activeDialogue.dialogueId,
      },
    },
    surveillance: {
      ...baseState.surveillance,
      hud: {
        ...baseState.surveillance.hud,
        alertState:
          overrides.cameraAlertState ?? baseState.surveillance.hud.alertState,
        detectionProgress:
          overrides.cameraDetectionProgress
          ?? baseState.surveillance.hud.detectionProgress,
        activeCameraId:
          overrides.activeCameraId ?? baseState.surveillance.hud.activeCameraId,
      },
    },
  };
};

describe('engagement selectors', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('marks stealth as ineligible while cooldown is in the future', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
    const state = createSelectorState({
      stealthCooldownExpiresAt: 2_000,
      inCombat: false,
      activeDialogueId: null,
    });

    expect(selectIsStealthEligible(state)).toBe(false);
  });

  it('marks stealth as eligible once cooldown timestamp has passed', () => {
    jest.spyOn(Date, 'now').mockReturnValue(2_000);
    const state = createSelectorState({
      stealthCooldownExpiresAt: 1_500,
      inCombat: false,
      activeDialogueId: null,
    });

    expect(selectIsStealthEligible(state)).toBe(true);
  });

  it('reports hidden when stealth is active and no exposure signals are present', () => {
    jest.spyOn(Date, 'now').mockReturnValue(5_000);
    const state = createSelectorState({
      engagementMode: 'stealth',
      stealthModeEnabled: true,
      stealthCooldownExpiresAt: null,
      cameraAlertState: CameraAlertState.IDLE,
      cameraDetectionProgress: 0,
      activeCameraId: null,
      enemyAlertLevel: AlertLevel.IDLE,
      enemyAlertProgress: 0,
    });

    const readability = selectStealthReadability(state);
    expect(readability.state).toBe('hidden');
    expect(readability.reason).toBe('none');
    expect(selectIsHidden(state)).toBe(true);
  });

  it('prioritizes camera as the exposure reason when camera telemetry is active', () => {
    const state = createSelectorState({
      engagementMode: 'stealth',
      stealthModeEnabled: true,
      cameraAlertState: CameraAlertState.SUSPICIOUS,
      cameraDetectionProgress: 42,
      activeCameraId: 'cam-01',
      enemyAlertLevel: AlertLevel.SUSPICIOUS,
      enemyAlertProgress: 35,
      movementProfile: 'sprint',
    });

    const readability = selectStealthReadability(state);
    expect(readability.state).toBe('exposed');
    expect(readability.reason).toBe('camera');
  });

  it('reports noise as exposure reason when guard pressure exists during sprint', () => {
    const state = createSelectorState({
      engagementMode: 'stealth',
      stealthModeEnabled: true,
      cameraAlertState: CameraAlertState.IDLE,
      cameraDetectionProgress: 0,
      activeCameraId: null,
      enemyAlertLevel: AlertLevel.SUSPICIOUS,
      enemyAlertProgress: 45,
      movementProfile: 'sprint',
    });

    const readability = selectStealthReadability(state);
    expect(readability.state).toBe('exposed');
    expect(readability.reason).toBe('noise');
  });

  it('reports compromised when guard alert reaches alarmed', () => {
    const state = createSelectorState({
      engagementMode: 'stealth',
      stealthModeEnabled: true,
      cameraAlertState: CameraAlertState.IDLE,
      cameraDetectionProgress: 0,
      activeCameraId: null,
      enemyAlertLevel: AlertLevel.ALARMED,
      enemyAlertProgress: 100,
      movementProfile: 'normal',
    });

    const readability = selectStealthReadability(state);
    expect(readability.state).toBe('compromised');
    expect(readability.reason).toBe('vision');
    expect(selectIsHidden(state)).toBe(false);
  });

  it('builds an active HUD model with hidden state when stealth is engaged safely', () => {
    const state = createSelectorState({
      engagementMode: 'stealth',
      stealthModeEnabled: true,
      cameraAlertState: CameraAlertState.IDLE,
      cameraDetectionProgress: 0,
      activeCameraId: null,
      enemyAlertLevel: AlertLevel.IDLE,
      enemyAlertProgress: 0,
    });

    const hudModel = selectStealthHudModel(state);
    expect(hudModel.isActive).toBe(true);
    expect(hudModel.stateLabel).toBe('hidden');
    expect(hudModel.canToggle).toBe(true);
    expect(hudModel.blockedReason).toBeNull();
    expect(hudModel.keyHint).toBe('X');
  });

  it('builds cooldown HUD detail when stealth cannot re-enter yet', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
    const state = createSelectorState({
      stealthModeEnabled: false,
      engagementMode: 'none',
      stealthCooldownExpiresAt: 6_000,
      inCombat: false,
      activeDialogueId: null,
    });

    const hudModel = selectStealthHudModel(state);
    expect(hudModel.blockedReason).toBe('cooldown');
    expect(hudModel.canToggle).toBe(false);
    expect(hudModel.cooldownSeconds).toBe(5);
    expect(hudModel.detailLabel).toBe('cooldown:5');
  });

  it('marks HUD model as blocked in combat when stealth is inactive', () => {
    const state = createSelectorState({
      stealthModeEnabled: false,
      engagementMode: 'combat',
      inCombat: true,
    });

    const hudModel = selectStealthHudModel(state);
    expect(hudModel.blockedReason).toBe('combat');
    expect(hudModel.canToggle).toBe(false);
    expect(hudModel.detailLabel).toBe('combat');
  });
});
