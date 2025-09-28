import React, { useCallback } from "react";
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
  Item,
} from "../../game/interfaces/types";

const formatSkillName = (skill: string) => {
  return skill.charAt(0).toUpperCase() + skill.slice(1);
};

const DialogueOverlay: React.FC = () => {
  const dispatch = useDispatch();
  const quests = useSelector((state: RootState) => state.quests.quests);

  const awardQuestRewards = useCallback(
    (questId: string) => {
      const quest = quests.find((entry) => entry.id === questId);

      if (!quest) {
        return;
      }

      quest.rewards.forEach((reward) => {
        switch (reward.type) {
          case "experience":
            if (reward.amount > 0) {
              dispatch(addExperience(reward.amount));
              dispatch(
                addLogMessage(
                  `+${reward.amount} XP from ${quest.name}.`
                )
              );
            }
            break;
          case "currency":
            if (reward.amount > 0) {
              dispatch(addCredits(reward.amount));
              dispatch(
                addLogMessage(
                  `+${reward.amount} credits secured from ${quest.name}.`
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
                  description: `Recovered during ${quest.name}.`,
                  weight: 1,
                  value: 0,
                  isQuestItem: false,
                };
                dispatch(addItem(item));
              }
              dispatch(
                addLogMessage(`Received ${reward.id} from ${quest.name}.`)
              );
            }
            break;
          default:
            break;
        }
      });
    },
    [dispatch, quests]
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
              dispatch(addLogMessage(`Quest accepted: ${quest.name}.`));
            }
          }
          break;
        case "complete":
          {
            const quest = quests.find((entry) => entry.id === questId);
            if (quest && quest.isActive && !quest.isCompleted) {
              dispatch(completeQuest(questId));
              awardQuestRewards(questId);
              dispatch(addLogMessage(`Quest completed: ${quest.name}.`));
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
                  `Objective updated: ${objective.description} (${quest.name}).`
                )
              );
            }
          }
          break;
        default:
          break;
      }
    },
    [dispatch, awardQuestRewards, quests]
  );

  const {
    activeDialogue: { dialogueId, currentNodeId },
    dialogues,
  } = useSelector((state: RootState) => state.quests);
  const playerSkills = useSelector((state: RootState) => state.player.data.skills);

  if (!dialogueId) {
    return null;
  }

  const dialogue = dialogues.find((entry) => entry.id === dialogueId);
  if (!dialogue || dialogue.nodes.length === 0) {
    return null;
  }

  const currentNode: DialogueNode | undefined =
    dialogue.nodes.find((node) => node.id === currentNodeId) ?? dialogue.nodes[0];

  const getQuestLockReason = (option: DialogueOption): string | null => {
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
          return "Quest already completed";
        }
        if (quest.isActive) {
          return "Quest already in progress";
        }
        break;
      case "complete":
        if (quest.isCompleted) {
          return "Quest already completed";
        }
        if (!quest.isActive) {
          return "Quest not active";
        }
        break;
      case "update":
        if (option.questEffect.objectiveId) {
          const objective = quest.objectives.find(
            (entry) => entry.id === option.questEffect?.objectiveId
          );
          if (objective?.isCompleted) {
            return "Objective already complete";
          }
        }
        break;
      default:
        break;
    }

    return null;
  };

  const isOptionLocked = (option: DialogueOption) => {
    const questLock = getQuestLockReason(option);
    if (questLock) {
      return true;
    }

    if (!option.skillCheck) {
      return false;
    }

    const { skill, threshold } = option.skillCheck;
    const playerValue = playerSkills[skill] ?? 0;
    return playerValue < threshold;
  };

  const handleOptionSelect = (option: DialogueOption) => {
    if (isOptionLocked(option)) {
      return;
    }

    handleQuestEffect(option);

    if (option.nextNodeId) {
      dispatch(setDialogueNode(option.nextNodeId));
    } else {
      dispatch(endDialogue());
    }
  };

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
          marginBottom: "2.5rem",
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
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
              {currentNode?.text ?? "..."}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => dispatch(endDialogue())}
            style={{
              border: "1px solid rgba(94, 234, 212, 0.3)",
              borderRadius: "999px",
              padding: "0.45rem 0.85rem",
              background: "rgba(14, 116, 144, 0.15)",
              color: "#5eead4",
              fontSize: "0.72rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {currentNode?.options.map((option, index) => {
            const locked = isOptionLocked(option);
            const requirementLabel = option.skillCheck
              ? `${formatSkillName(option.skillCheck.skill)} ${option.skillCheck.threshold}`
              : null;
            const questReason = getQuestLockReason(option);
            const statusLabel = questReason
              ? questReason
              : requirementLabel
              ? locked
                ? `Requires ${requirementLabel}`
                : `Check ${requirementLabel}`
              : null;

            return (
            <button
              key={`${option.text}-${index}`}
              type="button"
              onClick={() => handleOptionSelect(option)}
              style={{
                border: locked
                  ? "1px solid rgba(148, 163, 184, 0.3)"
                  : "1px solid rgba(96, 165, 250, 0.4)",
                borderRadius: "12px",
                padding: "0.85rem 1rem",
                background:
                  locked
                    ? "linear-gradient(135deg, rgba(15, 23, 42, 0.65), rgba(30, 41, 59, 0.75))"
                    : "linear-gradient(135deg, rgba(37, 99, 235, 0.22), rgba(56, 189, 248, 0.18))",
                color: locked ? "rgba(148, 163, 184, 0.8)" : "#e2e8f0",
                fontSize: "0.9rem",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                gap: "0.6rem",
                alignItems: "center",
                opacity: locked ? 0.75 : 1,
                pointerEvents: locked ? "none" : "auto",
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
          Press Esc to disengage
        </span>
      </div>
    </div>
  );
};

export default DialogueOverlay;
