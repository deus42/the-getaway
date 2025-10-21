import { createScopedLogger } from '../../../utils/logger';
import type { AppDispatch, RootState } from '../../../store';
import { planAutoBattleAction } from './autoBattlePlanner';
import { getAutoBattleProfile } from './autoBattleProfiles';
import type { AutoBattleProfileId } from './autoBattleProfiles';
import type { Player, Enemy, MapArea } from '../../interfaces/types';
import type { AutoBattlePauseReason } from '../../../store/autoBattleSlice';
import {
  recordAutoBattleDecision,
  setAutoBattleStatus,
} from '../../../store/autoBattleSlice';
import { movePlayer, updateActionPoints, setPlayerData } from '../../../store/playerSlice';
import { updateEnemy, switchTurn } from '../../../store/worldSlice';
import { executeAttack, DEFAULT_ATTACK_COST } from '../combatSystem';
import { addLogMessage } from '../../../store/logSlice';
import { addFloatingNumber } from '../../../store/combatFeedbackSlice';
import { v4 as uuidv4 } from 'uuid';
import type { LogStrings } from '../../../content/system';
import type { AutoBattleDecision } from './autoBattlePlanner';
import { shouldGunFuAttackBeFree } from '../../systems/perks';
import type { AutoBattleDecisionSummary } from '../../../store/autoBattleSlice';
import type { AutoBattleStrings } from '../../../content/ui';
import { getSystemStrings } from '../../../content/system';
import { getUIStrings } from '../../../content/ui';

const logger = createScopedLogger('AutoBattleController');

export interface AutoBattleUpdateContext {
  enabled: boolean;
  profileId: AutoBattleProfileId;
  player: Player;
  enemies: Enemy[];
  mapArea: MapArea | null;
  inCombat: boolean;
  isPlayerTurn: boolean;
  turnCount: number;
  activeDialogueId: string | null;
  logStrings: LogStrings;
  autoBattleStrings: AutoBattleStrings;
}

const mapReasonToUiKey = (
  reason: AutoBattlePauseReason | null,
  strings: AutoBattleStrings
): string => {
  if (!reason) {
    return strings.hudPauseReasons.none;
  }

  switch (reason) {
    case 'manual_input':
      return strings.hudPauseReasons.manualInput;
    case 'dialogue':
      return strings.hudPauseReasons.dialogue;
    case 'objective':
      return strings.hudPauseReasons.objective;
    case 'resources':
      return strings.hudPauseReasons.resources;
    case 'ap':
      return strings.hudPauseReasons.ap;
    case 'settings':
    default:
      return strings.hudPauseReasons.none;
  }
};

export default class AutoBattleController {
  private dispatch: AppDispatch;

  private getState: () => RootState;

  private lastSignature: string | null = null;

  private currentStatus: 'idle' | 'running' | 'paused' = 'idle';

  private currentReason: AutoBattlePauseReason | null = null;

  private manualOverride = false;

  constructor(dispatch: AppDispatch, store: { getState: () => RootState }) {
    this.dispatch = dispatch;
    this.getState = store.getState.bind(store);
  }

  public notifyManualOverride(reason: AutoBattlePauseReason): void {
    this.manualOverride = true;
    this.lastSignature = null;
    const state = this.getState();
    const locale = state.settings.locale;
    const autoBattleStrings = getUIStrings(locale).autoBattle;
    const logStrings = getSystemStrings(locale).logs;
    const reasonText = mapReasonToUiKey(reason, autoBattleStrings);

    this.dispatch(setAutoBattleStatus({ status: 'paused', reason }));
    this.dispatch(addLogMessage(logStrings.autoBattlePaused(reasonText)));
    this.currentStatus = 'paused';
    this.currentReason = reason;
  }

  public update(context: AutoBattleUpdateContext): void {
    if (!context.enabled) {
      this.resetStatus('idle', null, context);
      this.manualOverride = false;
      this.lastSignature = null;
      return;
    }

    if (this.manualOverride) {
      this.resetStatus('paused', 'manual_input', context);
      return;
    }

    const profile = getAutoBattleProfile(context.profileId);
    const profileLabel = profile.label;

    const failSafeReason = this.resolveFailSafe(context);
    if (failSafeReason) {
      this.resetStatus('paused', failSafeReason, context);
      this.lastSignature = null;
      return;
    }

    const signature = this.buildSignature(context);
    if (signature === this.lastSignature) {
      return;
    }

    const decision = planAutoBattleAction({
      player: context.player,
      enemies: context.enemies,
      map: context.mapArea!,
      profile,
    });

    this.dispatch(recordAutoBattleDecision(this.buildDecisionSummary(decision, profile.id)));
    this.resetStatus('running', null, context);

    const decisionDescription = this.buildDecisionDescription(decision);
    this.dispatch(addLogMessage(context.logStrings.autoBattleDecision(profileLabel, decisionDescription)));

    this.executeDecision(decision, context);
    this.lastSignature = signature;
  }

  private resolveFailSafe(context: AutoBattleUpdateContext): AutoBattlePauseReason | null {
    if (!context.inCombat || !context.isPlayerTurn || !context.mapArea) {
      return 'settings';
    }

    if (context.player.actionPoints <= 0) {
      return 'ap';
    }

    if (context.activeDialogueId) {
      return 'dialogue';
    }

    if (!context.enemies.some((enemy) => enemy.health > 0)) {
      return 'settings';
    }

    return null;
  }

  private resetStatus(
    status: 'idle' | 'running' | 'paused',
    reason: AutoBattlePauseReason | null,
    context: AutoBattleUpdateContext
  ): void {
    if (this.currentStatus === status && this.currentReason === reason) {
      return;
    }

    this.currentStatus = status;
    this.currentReason = reason;
    this.dispatch(setAutoBattleStatus({ status, reason }));

    if (status === 'running') {
      this.dispatch(addLogMessage(context.logStrings.autoBattleEngaged(
        getAutoBattleProfile(context.profileId).label
      )));
      return;
    }

    if (status === 'paused') {
      const reasonText = mapReasonToUiKey(reason, context.autoBattleStrings);
      this.dispatch(addLogMessage(context.logStrings.autoBattlePaused(reasonText)));
    }
  }

  private buildSignature(context: AutoBattleUpdateContext): string {
    const { player } = context;
    return [
      context.turnCount,
      player.actionPoints,
      player.position.x,
      player.position.y,
      context.enemies.map((enemy) => `${enemy.id}:${enemy.health}`).join('|'),
    ].join(':');
  }

  private buildDecisionSummary(
    decision: AutoBattleDecision,
    profileId: AutoBattleProfileId
  ): AutoBattleDecisionSummary {
    return {
      profileId,
      action: decision.summary,
      targetId: decision.type === 'attack' ? decision.targetId : undefined,
      targetName: decision.type === 'attack' ? decision.targetName : undefined,
      score: decision.score,
      explanation: decision.rationale.join(', '),
      timestamp: Date.now(),
    };
  }

  private buildDecisionDescription(decision: AutoBattleDecision): string {
    const rationale = decision.rationale.length > 0 ? decision.rationale[0] : '';
    if (rationale) {
      return `${decision.summary} (${rationale})`;
    }
    return decision.summary;
  }

  private executeDecision(
    decision: AutoBattleDecision,
    context: AutoBattleUpdateContext
  ): void {
    switch (decision.type) {
      case 'attack':
        this.executeAttack(decision, context);
        break;
      case 'move':
        this.executeMove(decision, context);
        break;
      case 'wait':
      default:
        this.executeWait(context);
        break;
    }
  }

  private executeAttack(
    decision: Extract<AutoBattleDecision, { type: 'attack' }>,
    context: AutoBattleUpdateContext
  ): void {
    const state = this.getState();
    const latestPlayer = state.player.data;
    const enemy = state.world.currentMapArea.entities.enemies.find(
      (candidate) => candidate.id === decision.targetId
    );
    if (!enemy || enemy.health <= 0) {
      logger.warn('Attack target no longer valid; falling back to wait', {
        targetId: decision.targetId,
      });
      this.executeWait(context);
      return;
    }

    const mapArea = state.world.currentMapArea;
    const targetTile = mapArea.tiles[enemy.position.y]?.[enemy.position.x];
    const isBehindCover = targetTile?.provideCover ?? false;

    const result = executeAttack(latestPlayer, enemy, {
      isBehindCover,
      mapArea,
    });

    this.dispatch(setPlayerData(result.newAttacker as Player));
    this.dispatch(updateEnemy(result.newTarget as Enemy));

    if (result.events) {
      result.events.forEach((event) => this.dispatch(addLogMessage(event.message)));
    }

    if (result.success) {
      this.dispatch(
        addLogMessage(
          context.logStrings.hitEnemy(decision.targetName, Math.round(result.damage ?? decision.expectedDamage))
        )
      );
      this.dispatch(
        addFloatingNumber({
          id: uuidv4(),
          value: Math.round(result.damage ?? decision.expectedDamage),
          gridX: enemy.position.x,
          gridY: enemy.position.y,
          type: result.isCritical ? 'crit' : 'damage',
        })
      );
    } else {
      this.dispatch(addLogMessage(context.logStrings.missedEnemy(decision.targetName)));
    }

    const updatedPlayer = result.newAttacker as Player;
    if (updatedPlayer.actionPoints <= 0) {
      this.dispatch(switchTurn());
    }
  }

  private executeMove(
    decision: Extract<AutoBattleDecision, { type: 'move' }>,
    context: AutoBattleUpdateContext
  ): void {
    this.dispatch(movePlayer(decision.destination));
    this.dispatch(updateActionPoints(-decision.apCost));
    const projectedAp = context.player.actionPoints - decision.apCost;
    if (projectedAp <= 0) {
      this.dispatch(switchTurn());
    }
  }

  private executeWait(context: AutoBattleUpdateContext): void {
    const attackCost = shouldGunFuAttackBeFree(context.player) ? 0 : DEFAULT_ATTACK_COST;
    if (context.player.actionPoints <= attackCost) {
      this.dispatch(switchTurn());
    } else {
      this.dispatch(updateActionPoints(-context.player.actionPoints));
      this.dispatch(switchTurn());
    }
  }
}
