import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  endDialogue,
  setDialogueNode,
  startQuest,
  completeQuest,
  updateObjectiveStatus,
} from "../../store/questsSlice";
import { DialogueNode, DialogueOption } from "../../game/interfaces/types";

const formatSkillName = (skill: string) => {
  return skill.charAt(0).toUpperCase() + skill.slice(1);
};

const DialogueOverlay: React.FC = () => {
  const dispatch = useDispatch();
  const handleQuestEffect = useCallback(
    (option: DialogueOption) => {
      if (!option.questEffect) {
        return;
      }

      const { questId, effect, objectiveId } = option.questEffect;
      switch (effect) {
        case "start":
          dispatch(startQuest(questId));
          break;
        case "complete":
          dispatch(completeQuest(questId));
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
          }
          break;
        default:
          break;
      }
    },
    [dispatch]
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

  const isOptionLocked = (option: DialogueOption) => {
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
              {requirementLabel && (
                <span
                  style={{
                    fontSize: "0.68rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.16em",
                    color: locked ? "#f87171" : "#5eead4",
                  }}
                >
                  {locked ? `Requires ${requirementLabel}` : `Check ${requirementLabel}`}
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
