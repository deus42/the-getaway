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

  const briefingItems = dialogues.filter((dialogue) => dialogue.nodes.length > 0);

  return (
    <div
      style={{
        ...containerStyle,
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        color: mutedText,
      }}
    >
      {briefingItems.map((dialogue) => {
        const firstNode = dialogue.nodes[0];

        return (
          <div
            key={dialogue.id}
            style={{
              padding: "0.75rem 0",
              borderBottom: "1px solid rgba(71, 85, 105, 0.35)",
            }}
          >
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#f0abfc", marginBottom: "0.4rem" }}>
              {dialogue.npcId}
            </div>
            <p style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
              {firstNode.text}
            </p>
          </div>
        );
      })}
      {briefingItems.length === 0 && (
        <div style={{ fontStyle: "italic" }}>No active briefings available.</div>
      )}
    </div>
  );
};

export default OpsBriefingsPanel;
