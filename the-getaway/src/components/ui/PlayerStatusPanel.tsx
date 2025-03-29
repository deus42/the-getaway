import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

const PlayerStatusPanel: React.FC = () => {
  const player = useSelector((state: RootState) => state.player.data);
  // Get position directly here
  const position = useSelector(
    (state: RootState) => state.player.data.position
  );
  // Get combat status and turn count
  const inCombat = useSelector((state: RootState) => state.world.inCombat);
  const turnCount = useSelector((state: RootState) => state.world.turnCount);

  // Calculate health percentage for potential bar display
  const healthPercent =
    player.maxHealth > 0 ? (player.health / player.maxHealth) * 100 : 0;
  // Calculate AP percentage
  const apPercent =
    player.maxActionPoints > 0
      ? (player.actionPoints / player.maxActionPoints) * 100
      : 0;

  const renderBar = (
    label: string,
    value: number,
    maxValue: number,
    color: string
  ) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    return (
      <div style={{ marginBottom: "1rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "0.25rem",
          }}
        >
          <span>{label}</span>
          <span>
            {value}
            &nbsp;/&nbsp; {/* Added non-breaking space for clarity */}
            {maxValue}
          </span>
        </div>
        <div
          style={{
            height: "10px",
            backgroundColor: "#555",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: "100%",
              backgroundColor: color,
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div style={{ color: "white", fontSize: "0.9rem" }}>
      {renderBar("Health", player.health, player.maxHealth, "#ef4444")}
      {renderBar(
        "Action Points",
        player.actionPoints,
        player.maxActionPoints,
        "#3b82f6"
      )}
      {/* Position Display */}
      <div style={{ marginTop: "1rem" }}>
        <span>
          Position: ({position?.x ?? "?"}, {position?.y ?? "?"})
        </span>
      </div>
      {/* Turn Counter Display (only in combat) */}
      {inCombat && (
        <div style={{ marginTop: "1rem" }}>
          <span>Turn: {turnCount}</span>
        </div>
      )}
      {/* Add other stats as needed */}
    </div>
  );
};

export default PlayerStatusPanel;
