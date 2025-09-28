import { CSSProperties } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

interface OpsBriefingsPanelProps {
  containerStyle: CSSProperties;
}

const mutedText = "rgba(148, 163, 184, 0.78)";

const OpsBriefingsPanel: React.FC<OpsBriefingsPanelProps> = ({ containerStyle }) => {
  const dialogues = useSelector((state: RootState) => state.quests.dialogues);
  const activeDialogue = useSelector((state: RootState) => state.quests.activeDialogue);
  const lastBriefing = useSelector((state: RootState) => state.quests.lastBriefing);

  const currentDialogue = dialogues.find(
    (dialogue) => dialogue.id === activeDialogue.dialogueId
  );
  const currentNode = currentDialogue?.nodes.find(
    (node) => node.id === activeDialogue.currentNodeId
  );

  if (currentDialogue && currentNode) {
    return (
      <div
        style={{
          ...containerStyle,
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#f0abfc" }}>
          {currentDialogue.npcId}
        </div>
        <p style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>{currentNode.text}</p>
        {currentNode.options && currentNode.options.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {currentNode.options.map((option, index) => (
              <div key={`${option.text}-${index}`} style={{ fontSize: "0.85rem", color: mutedText }}>
                {option.text}
                {option.skillCheck && (
                  <span style={{ marginLeft: "0.4rem", color: "#facc15" }}>
                    [Requires {option.skillCheck.skill} {option.skillCheck.threshold}+]
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const lastDialogue = dialogues.find(
    (dialogue) => dialogue.id === lastBriefing.dialogueId
  );
  const lastNode = lastDialogue?.nodes.find(
    (node) => node.id === lastBriefing.nodeId
  );

  if (lastDialogue && lastNode) {
    return (
      <div
        style={{
          ...containerStyle,
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#f0abfc" }}>
          {lastDialogue.npcId}
        </div>
        <p style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>{lastNode.text}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        ...containerStyle,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: mutedText,
        fontStyle: "italic",
      }}
    >
      No active briefings. Establish contact to gather intel.
    </div>
  );
};

export default OpsBriefingsPanel;