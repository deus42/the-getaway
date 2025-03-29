import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

const PlayerStatusPanel: React.FC = () => {
  const { health, maxHealth, actionPoints, maxActionPoints } = useSelector(
    (state: RootState) => state.player.data
  );

  // Calculate health percentage for potential bar display
  const healthPercent = maxHealth > 0 ? (health / maxHealth) * 100 : 0;
  // Calculate AP percentage
  const apPercent =
    maxActionPoints > 0 ? (actionPoints / maxActionPoints) * 100 : 0;

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
            {value} / {maxValue}
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
      {renderBar("Health", health, maxHealth, "#ef4444")}
      {renderBar("Action Points", actionPoints, maxActionPoints, "#3b82f6")}
    </div>
  );
};

export default PlayerStatusPanel;
