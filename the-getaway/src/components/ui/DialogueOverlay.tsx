import React, { useCallback, useEffect, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  endDialogue,
  setDialogueNode,
  startQuest,
  completeQuest,
  updateObjectiveStatus,
} from "../../store/questsSlice";
import {
  addExperience,
  addItem,
  addCredits,
} from "../../store/playerSlice";
import { addLogMessage } from "../../store/logSlice";
import {
  DialogueNode,
  DialogueOption,
  FactionId,
  Item,
  Quest,
  SkillId,
} from "../../game/interfaces/types";
import { dialogueToneManager } from "../../game/narrative/dialogueTone/dialogueToneManager";
import { getSystemStrings } from "../../content/system";
import { getUIStrings } from "../../content/ui";
import { getSkillDefinition } from "../../content/skills";
import { checkSkillRequirement } from "../../game/quests/dialogueSystem";
import { resolveRoleDialogueTemplate } from "../../game/narrative/dialogueTone/templateResolver";
import { DialogueRoleId, RoleDialogueContext } from "../../game/narrative/dialogueTone/roleTemplateTypes";

const fallbackSkillName = (skill: string) =>
  skill.charAt(0).toUpperCase() + skill.slice(1);

type QuestLockReason =
  | "alreadyCompleted"
  | "alreadyActive"
  | "notActive"
  | "objectiveCompleted"
  | "objectivesIncomplete";

const ROLE_TEMPLATE_PATTERN = /^\[roleTemplate:([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\]$/i;
const FALLBACK_FACTION_REPUTATION: Record<FactionId, number> = {
  resistance: 0,
  corpsec: 0,
  scavengers: 0,
};

const hasPendingNonTalkObjectives = (quest: Quest): boolean =>
  quest.objectives.some(
    (objective) => objective.type !== "talk" && !objective.isCompleted
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
  const [hoveredOption, setHoveredOption] = React.useState<number | null>(null);

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

  const awardQuestRewards = useCallback(
    (questId: string) => {
      const quest = quests.find((entry) => entry.id === questId);

      if (!quest) {
        return;
      }

      let experienceGranted = false;

      quest.rewards.forEach((reward) => {
        switch (reward.type) {
          case "experience":
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
          case "currency":
            if (reward.amount > 0) {
              dispatch(addCredits(reward.amount));
              dispatch(
                addLogMessage(
                  logStrings.rewardCredits(reward.amount, quest.name)
                )
              );
            }
            break;
          case "item":
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
        case "start":
          {
            const quest = quests.find((entry) => entry.id === questId);
            if (quest && !quest.isActive && !quest.isCompleted) {
              dispatch(startQuest(questId));
              dispatch(addLogMessage(logStrings.questAccepted(quest.name)));
            }
          }
          break;
        case "complete":
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
        case "update":
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
  } = useSelector((state: RootState) => state.quests);

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
      case "start":
        if (quest.isCompleted) {
          return "alreadyCompleted";
        }
        if (quest.isActive) {
          return "alreadyActive";
        }
        break;
      case "complete":
        if (quest.isCompleted) {
          return "alreadyCompleted";
        }
        if (!quest.isActive) {
          return "notActive";
        }
        if (hasPendingNonTalkObjectives(quest)) {
          return "objectivesIncomplete";
        }
        break;
      case "update":
        if (option.questEffect.objectiveId) {
          const objective = quest.objectives.find(
            (entry) => entry.id === option.questEffect?.objectiveId
          );
          if (objective?.isCompleted) {
            return "objectiveCompleted";
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
      case "start":
        return !quest.isActive && !quest.isCompleted;
      case "complete":
        return quest.isActive && !quest.isCompleted && !hasPendingNonTalkObjectives(quest);
      case "update":
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

  const isOptionLocked = useCallback((option: DialogueOption) => {
    const questLock = getQuestLockReason(option);
    if (questLock) {
      return true;
    }

    if (!option.skillCheck) {
      return false;
    }

    return !checkSkillRequirement(player, option);
  }, [getQuestLockReason, player]);

  const visibleOptions = useMemo(() => {
    if (!currentNode) {
      return [];
    }

    return currentNode.options.filter(isQuestOptionVisible);
  }, [currentNode, isQuestOptionVisible]);

  const handleOptionSelect = useCallback((option: DialogueOption) => {
    if (isOptionLocked(option)) {
      return;
    }

    handleQuestEffect(option);

    if (option.nextNodeId) {
      dispatch(setDialogueNode(option.nextNodeId));
    } else {
      dispatch(endDialogue());
    }
  }, [dispatch, handleQuestEffect, isOptionLocked]);

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

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: "min(620px, 90%)",
          marginBottom: "calc(var(--bottom-panel-height, 0px) + 2.5rem)",
          background:
            "linear-gradient(160deg, rgba(15, 23, 42, 0.94), rgba(15, 23, 42, 0.78))",
          border: "1px solid rgba(148, 163, 184, 0.35)",
          borderRadius: "18px",
          padding: "1.5rem 1.7rem",
          color: "#e2e8f0",
          fontFamily: "'DM Sans', 'Inter', sans-serif",
          boxShadow: "0 28px 48px rgba(15, 23, 42, 0.55)",
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "1.2rem",
        }}
      >
        <div>
          <span
            style={{
              display: "block",
              fontSize: "0.72rem",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(148, 163, 184, 0.85)",
              marginBottom: "0.35rem",
            }}
          >
            {dialogue.npcId}
          </span>
          <h2
            style={{
              fontSize: "1.28rem",
              fontWeight: 700,
              margin: 0,
              color: "#f8fafc",
            }}
          >
            {displayText}
          </h2>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {visibleOptions.map((option, index) => {
            const locked = isOptionLocked(option);
            const requirementLabel = option.skillCheck
              ? `${resolveSkillName(
                  option.skillCheck.skill,
                  option.skillCheck.domain ?? 'attribute'
                )} ${option.skillCheck.threshold}`
              : null;
            const questReason = getQuestLockReason(option);
            const statusLabel = questReason
              ? uiStrings.dialogueOverlay.questLocks[questReason]
              : requirementLabel
              ? locked
                ? uiStrings.dialogueOverlay.requiresSkill(requirementLabel)
                : uiStrings.dialogueOverlay.checkSkill(requirementLabel)
              : null;

            return (
            <button
              key={`${option.text}-${index}`}
              type="button"
              onClick={() => handleOptionSelect(option)}
              onMouseEnter={() => !locked && setHoveredOption(index)}
              onMouseLeave={() => setHoveredOption(null)}
              style={{
                border: locked
                  ? "1px solid rgba(148, 163, 184, 0.3)"
                  : hoveredOption === index
                    ? "1px solid rgba(96, 165, 250, 0.7)"
                    : "1px solid rgba(96, 165, 250, 0.4)",
                borderRadius: "12px",
                padding: "0.85rem 1rem",
                background:
                  locked
                    ? "linear-gradient(135deg, rgba(15, 23, 42, 0.65), rgba(30, 41, 59, 0.75))"
                    : hoveredOption === index
                      ? "linear-gradient(135deg, rgba(37, 99, 235, 0.35), rgba(56, 189, 248, 0.3))"
                      : "linear-gradient(135deg, rgba(37, 99, 235, 0.22), rgba(56, 189, 248, 0.18))",
                color: locked ? "rgba(148, 163, 184, 0.8)" : "#e2e8f0",
                fontSize: "0.9rem",
                textAlign: "left",
                cursor: locked ? "not-allowed" : "pointer",
                display: "flex",
                gap: "0.6rem",
                alignItems: "center",
                opacity: locked ? 0.75 : 1,
                pointerEvents: locked ? "none" : "auto",
                boxShadow: locked
                  ? "none"
                  : hoveredOption === index
                    ? "0 0 20px rgba(56, 189, 248, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)"
                    : "0 0 8px rgba(56, 189, 248, 0.15)",
                transform: hoveredOption === index && !locked ? "translateY(-2px)" : "translateY(0)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "1.25rem",
                  height: "1.25rem",
                  borderRadius: "50%",
                  background: locked
                    ? "rgba(148, 163, 184, 0.25)"
                    : "rgba(96, 165, 250, 0.35)",
                  color: locked ? "#cbd5f5" : "#bfdbfe",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                }}
              >
                {index + 1}
              </span>
              <span style={{ flex: 1 }}>{option.text}</span>
              {statusLabel && (
                <span
                  style={{
                    fontSize: "0.68rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.16em",
                    color: locked ? "#f87171" : "#5eead4",
                  }}
                >
                  {statusLabel}
                </span>
              )}
            </button>
            );
          })}
        </div>
        <span
          style={{
            fontSize: "0.68rem",
            color: "rgba(148, 163, 184, 0.7)",
            textAlign: "right",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          {uiStrings.dialogueOverlay.escHint}
        </span>
      </div>
    </div>
  );
};

export default DialogueOverlay;
