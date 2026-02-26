import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  endDialogue,
  setDialogueNode,
  startQuest,
  completeQuest,
  updateObjectiveStatus,
  claimDialogueReward,
} from '../../store/questsSlice';
import {
  addExperience,
  addItem,
  addCredits,
} from '../../store/playerSlice';
import { addLogMessage } from '../../store/logSlice';
import {
  DialogueNode,
  DialogueOption,
  FactionId,
  Item,
  Quest,
  SkillId,
} from '../../game/interfaces/types';
import { dialogueToneManager } from '../../game/narrative/dialogueTone/dialogueToneManager';
import { getSystemStrings } from '../../content/system';
import { getUIStrings } from '../../content/ui';
import { getSkillDefinition } from '../../content/skills';
import { resolveDialoguePortrait } from '../../content/dialoguePortraits';
import {
  resolveDialogueCheckState,
  resolveDialogueFactionState,
} from '../../game/quests/dialogueSystem';
import { resolveRoleDialogueTemplate } from '../../game/narrative/dialogueTone/templateResolver';
import { DialogueRoleId, RoleDialogueContext } from '../../game/narrative/dialogueTone/roleTemplateTypes';
import './DialogueOverlay.css';

const fallbackSkillName = (skill: string) =>
  skill.charAt(0).toUpperCase() + skill.slice(1);

type QuestLockReason =
  | 'alreadyCompleted'
  | 'alreadyActive'
  | 'notActive'
  | 'objectiveCompleted'
  | 'objectivesIncomplete';

const ROLE_TEMPLATE_PATTERN = /^\[roleTemplate:([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\]$/i;
const FALLBACK_FACTION_REPUTATION: Record<FactionId, number> = {
  resistance: 0,
  corpsec: 0,
  scavengers: 0,
};

const hasPendingNonTalkObjectives = (quest: Quest): boolean =>
  quest.objectives.some(
    (objective) => objective.type !== 'talk' && !objective.isCompleted
  );

const parseRoleTemplateReference = (
  text: string | null | undefined
): { roleId: string; templateKey: string } | null => {
  if (!text) {
    return null;
  }
  const trimmed = text.trim();
  const match = ROLE_TEMPLATE_PATTERN.exec(trimmed);
  if (!match) {
    return null;
  }
  const [, roleId, templateKey] = match;
  return {
    roleId,
    templateKey,
  };
};

const normaliseDisplayValue = (value: number): number => {
  if (Number.isInteger(value)) {
    return value;
  }
  return Number(value.toFixed(1));
};

const getDialogueSkillReward = (threshold: number): { xp: number; credits: number } => {
  return {
    xp: Math.max(0, threshold * 5),
    credits: Math.max(0, threshold * 3),
  };
};

type OptionMetaTone = 'quest' | 'outcome' | 'lock' | 'unlock' | 'reward' | 'neutral';

const DialogueOverlay: React.FC = () => {
  const dispatch = useDispatch();
  const quests = useSelector((state: RootState) => state.quests.quests);
  const locale = useSelector((state: RootState) => state.settings.locale);
  const reputationSystemsEnabled = useSelector(
    (state: RootState) => Boolean(state.settings.reputationSystemsEnabled)
  );
  const systemStrings = getSystemStrings(locale);
  const uiStrings = getUIStrings(locale);
  const { logs: logStrings } = systemStrings;
  const player = useSelector((state: RootState) => state.player.data);
  const world = useSelector((state: RootState) => state.world);
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);

  const resolveSkillName = (skill: string, domain: 'attribute' | 'skill' = 'attribute') => {
    if (domain === 'skill') {
      try {
        return getSkillDefinition(skill as SkillId).name;
      } catch (error) {
        console.warn('[DialogueOverlay] Missing skill definition for', skill, error);
        return fallbackSkillName(skill);
      }
    }

    return (
      uiStrings.skills[skill as keyof typeof uiStrings.skills] ?? fallbackSkillName(skill)
    );
  };

  const resolveFactionName = (factionId: FactionId): string => {
    return uiStrings.playerStatus.factions[factionId] ?? fallbackSkillName(factionId);
  };

  const resolveStandingLabel = (standing: string): string => {
    const labels = uiStrings.dialogueOverlay.standingLabels;
    return labels[standing as keyof typeof labels] ?? fallbackSkillName(standing);
  };

  const awardQuestRewards = useCallback(
    (questId: string) => {
      const quest = quests.find((entry) => entry.id === questId);

      if (!quest) {
        return;
      }

      let experienceGranted = false;

      quest.rewards.forEach((reward) => {
        switch (reward.type) {
          case 'experience':
            if (reward.amount > 0) {
              dispatch(addExperience({ amount: reward.amount, reason: `Quest complete: ${quest.name}` }));
              dispatch(
                addLogMessage(
                  logStrings.rewardExperience(reward.amount, quest.name)
                )
              );
              experienceGranted = true;
            }
            break;
          case 'currency':
            if (reward.amount > 0) {
              dispatch(addCredits(reward.amount));
              dispatch(
                addLogMessage(
                  logStrings.rewardCredits(reward.amount, quest.name)
                )
              );
            }
            break;
          case 'item':
            if (reward.id) {
              const quantity = Math.max(1, reward.amount || 1);
              for (let index = 0; index < quantity; index += 1) {
                const item: Item = {
                  id: uuidv4(),
                  name: reward.id,
                  description: uiStrings.dialogueOverlay.itemRecoveredDescription(
                    quest.name
                  ),
                  weight: 1,
                  value: 0,
                  isQuestItem: false,
                };
                dispatch(addItem(item));
              }
              dispatch(
                addLogMessage(logStrings.rewardItem(reward.id, quest.name))
              );
            }
            break;
          default:
            break;
        }
      });

      if (!experienceGranted) {
        const baseXp = Math.max(40, (quest.objectives.length || 1) * 30);
        dispatch(addExperience({ amount: baseXp, reason: `Quest complete: ${quest.name}` }));
        dispatch(addLogMessage(logStrings.rewardExperience(baseXp, quest.name)));
      }
    },
    [dispatch, quests, logStrings, uiStrings]
  );

  const handleQuestEffect = useCallback(
    (option: DialogueOption) => {
      if (!option.questEffect) {
        return;
      }

      const { questId, effect, objectiveId } = option.questEffect;
      switch (effect) {
        case 'start':
          {
            const quest = quests.find((entry) => entry.id === questId);
            if (quest && !quest.isActive && !quest.isCompleted) {
              dispatch(startQuest(questId));
              dispatch(addLogMessage(logStrings.questAccepted(quest.name)));
            }
          }
          break;
        case 'complete':
          {
            const quest = quests.find((entry) => entry.id === questId);
            if (quest && quest.isActive && !quest.isCompleted) {
              if (hasPendingNonTalkObjectives(quest)) {
                break;
              }
              dispatch(completeQuest(questId));
              awardQuestRewards(questId);
              dispatch(addLogMessage(logStrings.questCompleted(quest.name)));
            }
          }
          break;
        case 'update':
          if (objectiveId) {
            dispatch(
              updateObjectiveStatus({
                questId,
                objectiveId,
                isCompleted: true,
              })
            );
            const quest = quests.find((entry) => entry.id === questId);
            const objective = quest?.objectives.find((o) => o.id === objectiveId);
            if (quest && objective) {
              dispatch(
                addLogMessage(
                  logStrings.objectiveUpdated(objective.description, quest.name)
                )
              );
            }
          }
          break;
        default:
          break;
      }
    },
    [dispatch, awardQuestRewards, quests, logStrings]
  );

  const {
    activeDialogue: { dialogueId, currentNodeId },
    dialogues,
    claimedDialogueRewards,
  } = useSelector((state: RootState) => state.quests);

  const questsById = useMemo(() => {
    return new Map(quests.map((quest) => [quest.id, quest]));
  }, [quests]);

  const dialogue = useMemo(() => {
    if (!dialogueId) {
      return null;
    }
    return dialogues.find((entry) => entry.id === dialogueId) ?? null;
  }, [dialogueId, dialogues]);

  const currentNode: DialogueNode | null = useMemo(() => {
    if (!dialogue) {
      return null;
    }
    if (dialogue.nodes.length === 0) {
      return null;
    }
    const node = dialogue.nodes.find((entry) => entry.id === currentNodeId);
    return node ?? dialogue.nodes[0];
  }, [dialogue, currentNodeId]);

  const toneRequest = useMemo(() => {
    if (!dialogue || !currentNode) {
      return null;
    }

    const resolvedNode =
      dialogue.nodes.find((node) => node.id === currentNode.id) ?? currentNode;

    let fallbackText = resolvedNode.text;
    let toneNode: DialogueNode = resolvedNode;
    let seedOverride: string | undefined;

    const templateReference = parseRoleTemplateReference(resolvedNode.text);

    if (templateReference && player && world) {
      const roleId = templateReference.roleId as DialogueRoleId;
      const { templateKey } = templateReference;
      const playerContext: RoleDialogueContext['player'] = {
        level: player.level,
        perks: player.perks ?? [],
        factionReputation: reputationSystemsEnabled
          ? player.factionReputation ?? FALLBACK_FACTION_REPUTATION
          : FALLBACK_FACTION_REPUTATION,
      };
      const context: RoleDialogueContext = {
        locale,
        reputationSystemsEnabled,
        player: playerContext,
        world: {
          timeOfDay: world.timeOfDay,
          curfewActive: world.curfewActive,
          zoneId: world.currentMapArea?.zoneId ?? 'unknown_zone',
          zoneName: world.currentMapArea?.name,
          hazards: world.currentMapArea?.hazards ?? [],
          environmentFlags: world.environment.flags,
        },
        npc: undefined,
        randomSeed: `${dialogue.id}:${resolvedNode.id}`,
      };

      const resolution = resolveRoleDialogueTemplate({
        roleId,
        templateKey,
        context,
      });

      if (resolution) {
        fallbackText = resolution.text;
        seedOverride = resolution.seed;
        toneNode = {
          ...resolvedNode,
          text: resolution.text,
          tone: {
            ...(resolvedNode.tone ?? {}),
            ...(resolution.toneOverrides ?? {}),
          },
        };
      }
    }

    return {
      dialogue,
      node: toneNode,
      fallbackText,
      seedOverride,
    };
  }, [dialogue, currentNode, locale, player, world, reputationSystemsEnabled]);

  const toneLine = useMemo(() => {
    if (!toneRequest) {
      return null;
    }

    return dialogueToneManager.resolveLine({
      dialogue: toneRequest.dialogue,
      node: toneRequest.node,
      fallbackText: toneRequest.fallbackText,
      seedOverride: toneRequest.seedOverride,
    });
  }, [toneRequest]);

  const getQuestLockReason = useCallback((option: DialogueOption): QuestLockReason | null => {
    if (!option.questEffect) {
      return null;
    }

    const quest = quests.find((entry) => entry.id === option.questEffect?.questId);
    if (!quest) {
      return null;
    }

    switch (option.questEffect.effect) {
      case 'start':
        if (quest.isCompleted) {
          return 'alreadyCompleted';
        }
        if (quest.isActive) {
          return 'alreadyActive';
        }
        break;
      case 'complete':
        if (quest.isCompleted) {
          return 'alreadyCompleted';
        }
        if (!quest.isActive) {
          return 'notActive';
        }
        if (hasPendingNonTalkObjectives(quest)) {
          return 'objectivesIncomplete';
        }
        break;
      case 'update':
        if (option.questEffect.objectiveId) {
          const objective = quest.objectives.find(
            (entry) => entry.id === option.questEffect?.objectiveId
          );
          if (objective?.isCompleted) {
            return 'objectiveCompleted';
          }
        }
        break;
      default:
        break;
    }

    return null;
  }, [quests]);

  const isQuestOptionVisible = useCallback((option: DialogueOption): boolean => {
    if (!option.questEffect) {
      return true;
    }

    const quest = quests.find((entry) => entry.id === option.questEffect?.questId);
    if (!quest) {
      return false;
    }

    switch (option.questEffect.effect) {
      case 'start':
        return !quest.isActive && !quest.isCompleted;
      case 'complete':
        return quest.isActive && !quest.isCompleted && !hasPendingNonTalkObjectives(quest);
      case 'update':
        if (!quest.isActive || quest.isCompleted) {
          return false;
        }
        if (!option.questEffect.objectiveId) {
          return true;
        }
        return !quest.objectives.some(
          (objective) =>
            objective.id === option.questEffect?.objectiveId &&
            objective.isCompleted
        );
      default:
        return true;
    }
  }, [quests]);

  const getOptionCheckState = useCallback((option: DialogueOption) => {
    return resolveDialogueCheckState(player, option);
  }, [player]);

  const getOptionFactionState = useCallback((option: DialogueOption) => {
    return resolveDialogueFactionState(player, option, reputationSystemsEnabled);
  }, [player, reputationSystemsEnabled]);

  const isOptionLocked = useCallback((option: DialogueOption) => {
    const questLock = getQuestLockReason(option);
    if (questLock) {
      return true;
    }

    const checkState = getOptionCheckState(option);
    if (checkState && !checkState.isPassed) {
      return true;
    }

    const factionState = getOptionFactionState(option);
    return Boolean(factionState && !factionState.isPassed);
  }, [getOptionCheckState, getOptionFactionState, getQuestLockReason]);

  const visibleOptions = useMemo(() => {
    if (!currentNode) {
      return [];
    }

    return currentNode.options.filter((option) => {
      if (!isQuestOptionVisible(option)) {
        return false;
      }

      const checkState = getOptionCheckState(option);
      if (checkState && !checkState.isPassed && checkState.visibility === 'hidden') {
        return false;
      }

      const factionState = getOptionFactionState(option);
      if (factionState && !factionState.isPassed && factionState.visibility === 'hidden') {
        return false;
      }

      return true;
    });
  }, [currentNode, getOptionCheckState, getOptionFactionState, isQuestOptionVisible]);

  const awardDialogueOptionReward = useCallback((option: DialogueOption) => {
    if (!option.skillCheck || option.questEffect) {
      return;
    }

    const claimKey = option.outcomePreview?.rewardClaimKey;
    if (!claimKey || claimedDialogueRewards?.[claimKey]) {
      return;
    }

    const { xp, credits } = getDialogueSkillReward(option.skillCheck.threshold);
    if (xp > 0) {
      dispatch(addExperience({ amount: xp, reason: `Dialogue check: ${option.text}` }));
    }
    if (credits > 0) {
      dispatch(addCredits(credits));
    }
    dispatch(claimDialogueReward(claimKey));
  }, [claimedDialogueRewards, dispatch]);

  const handleOptionSelect = useCallback((option: DialogueOption) => {
    if (isOptionLocked(option)) {
      return;
    }

    awardDialogueOptionReward(option);
    handleQuestEffect(option);

    if (option.nextNodeId) {
      dispatch(setDialogueNode(option.nextNodeId));
    } else {
      dispatch(endDialogue());
    }
  }, [awardDialogueOptionReward, dispatch, handleQuestEffect, isOptionLocked]);

  useEffect(() => {
    if (!currentNode) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        (event.target.tagName === 'INPUT' ||
          event.target.tagName === 'TEXTAREA' ||
          event.target.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      let digit: number | null = null;

      if (/^[0-9]$/.test(event.key)) {
        digit = Number(event.key);
      } else if (event.code?.startsWith('Numpad')) {
        const codeDigit = Number(event.code.replace('Numpad', ''));
        digit = Number.isNaN(codeDigit) ? null : codeDigit;
      }

      if (digit === null || digit < 1) {
        return;
      }

      const optionIndex = digit - 1;
      const option = visibleOptions[optionIndex];
      if (!option) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
      }
      handleOptionSelect(option);
    };

    const listenerOptions: AddEventListenerOptions = { capture: true };
    window.addEventListener('keydown', handleKeyDown, listenerOptions);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, listenerOptions);
    };
  }, [currentNode, handleOptionSelect, visibleOptions]);

  if (!dialogueId || !dialogue || !currentNode) {
    return null;
  }

  const displayText = toneLine?.text ?? currentNode?.text ?? '...';
  const fallbackSpeaker = Object.values(dialogue.speakers ?? {})[0];
  const activeSpeakerId = currentNode.speakerId ?? dialogue.defaultSpeakerId;
  const speakerProfile = activeSpeakerId
    ? dialogue.speakers?.[activeSpeakerId] ?? fallbackSpeaker
    : fallbackSpeaker;
  const speakerName =
    speakerProfile?.displayName
    ?? currentNode.speaker
    ?? dialogue.npcId
    ?? uiStrings.dialogueOverlay.speakerFallback;
  const portrait = resolveDialoguePortrait(speakerProfile?.portraitId, speakerName);
  const portraitStyle = {
    '--dialogue-portrait-accent': portrait.accentHex,
    '--dialogue-portrait-from': portrait.gradientFromHex,
    '--dialogue-portrait-to': portrait.gradientToHex,
  } as React.CSSProperties;

  return (
    <div className='dialogue-overlay'>
      <div className='dialogue-overlay__card'>
        <div className='dialogue-overlay__header'>
          <span className='dialogue-overlay__speaker'>{speakerName}</span>
          <div className='dialogue-overlay__line-row'>
            <div className='dialogue-overlay__portrait' style={portraitStyle}>
              {portrait.imagePath ? (
                <img src={portrait.imagePath} alt={speakerName} className='dialogue-overlay__portrait-image' />
              ) : (
                <span className='dialogue-overlay__portrait-initials' aria-hidden='true'>
                  {portrait.initials}
                </span>
              )}
            </div>
            <h2 className='dialogue-overlay__line'>{displayText}</h2>
          </div>
        </div>

        <div className='dialogue-overlay__options'>
          {visibleOptions.map((option, index) => {
            const locked = isOptionLocked(option);
            const checkState = getOptionCheckState(option);
            const factionState = getOptionFactionState(option);
            const questReason = getQuestLockReason(option);
            const rewardClaimKey = option.outcomePreview?.rewardClaimKey;
            const rewardClaimed = Boolean(
              rewardClaimKey && claimedDialogueRewards?.[rewardClaimKey]
            );
            const metaLines: Array<{ text: string; tone: OptionMetaTone }> = [];

            if (option.questEffect) {
              const questName =
                questsById.get(option.questEffect.questId)?.name ?? option.questEffect.questId;
              metaLines.push({
                text: uiStrings.dialogueOverlay.questActionLabel(
                  option.questEffect.effect,
                  questName
                ),
                tone: 'quest',
              });
            }

            if (option.outcomePreview?.summary) {
              metaLines.push({
                text: option.outcomePreview.summary,
                tone: 'outcome',
              });
            }

            if (option.skillCheck && !option.questEffect && rewardClaimKey) {
              if (rewardClaimed) {
                metaLines.push({
                  text: uiStrings.dialogueOverlay.rewardClaimed,
                  tone: 'reward',
                });
              } else {
                const reward = getDialogueSkillReward(option.skillCheck.threshold);
                metaLines.push({
                  text: uiStrings.dialogueOverlay.rewardPreview(reward.xp, reward.credits),
                  tone: 'reward',
                });
              }
            }

            if (questReason) {
              metaLines.push({
                text: uiStrings.dialogueOverlay.questLocks[questReason],
                tone: 'lock',
              });
            }

            if (checkState && option.skillCheck && !checkState.isPassed) {
              const delta = Math.max(
                0,
                checkState.requiredValue - normaliseDisplayValue(checkState.currentValue)
              );
              metaLines.push({
                text: uiStrings.dialogueOverlay.lockedSkillGap(
                  resolveSkillName(option.skillCheck.skill, checkState.domain),
                  normaliseDisplayValue(delta),
                  normaliseDisplayValue(checkState.currentValue),
                  checkState.requiredValue
                ),
                tone: 'lock',
              });

              if (option.outcomePreview?.unlocks) {
                metaLines.push({
                  text: uiStrings.dialogueOverlay.unlocksLabel(option.outcomePreview.unlocks),
                  tone: 'unlock',
                });
              }
            }

            if (factionState && !factionState.isPassed) {
              let required = '';
              switch (factionState.failedRequirement) {
                case 'minimumStanding':
                  required = resolveStandingLabel(factionState.minimumStanding ?? 'neutral');
                  break;
                case 'maximumStanding':
                  required = `≤ ${resolveStandingLabel(factionState.maximumStanding ?? 'allied')}`;
                  break;
                case 'minimumReputation':
                  required = `Rep ${factionState.minimumReputation ?? 0}+`;
                  break;
                case 'maximumReputation':
                  required = `Rep ≤ ${factionState.maximumReputation ?? 0}`;
                  break;
                default:
                  required = resolveStandingLabel(factionState.minimumStanding ?? 'neutral');
                  break;
              }

              metaLines.push({
                text: uiStrings.dialogueOverlay.requiresFactionStanding(
                  resolveFactionName(factionState.factionId),
                  required,
                  resolveStandingLabel(factionState.currentStanding)
                ),
                tone: 'lock',
              });
            }

            return (
              <button
                key={`${option.text}-${index}`}
                type='button'
                onClick={() => handleOptionSelect(option)}
                onMouseEnter={() => !locked && setHoveredOption(index)}
                onMouseLeave={() => setHoveredOption(null)}
                className='dialogue-overlay__option'
                data-locked={locked ? 'true' : 'false'}
                data-hovered={hoveredOption === index && !locked ? 'true' : 'false'}
                style={{ pointerEvents: locked ? 'none' : 'auto' }}
              >
                <span className='dialogue-overlay__option-index'>
                  {index + 1}
                </span>
                <span className='dialogue-overlay__option-content'>
                  <span className='dialogue-overlay__option-text'>{option.text}</span>
                  {metaLines.length > 0 && (
                    <span className='dialogue-overlay__option-meta'>
                      {metaLines.map((line, lineIndex) => (
                        <span
                          key={`${option.text}-meta-${lineIndex}`}
                          className='dialogue-overlay__option-status'
                          data-tone={line.tone}
                          data-locked={locked ? 'true' : 'false'}
                        >
                          {line.text}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <span className='dialogue-overlay__hint'>
          {uiStrings.dialogueOverlay.escHint}
        </span>
      </div>
    </div>
  );
};

export default DialogueOverlay;
