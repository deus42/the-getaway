import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { getUIStrings } from "../../content/ui";

const LevelIndicator: React.FC = () => {
  const mapArea = useSelector((state: RootState) => state.world.currentMapArea);
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);

  const levelNumber = mapArea?.level ?? 0;
  const objectives = mapArea?.objectives ?? [];

  return (
    <div
      style={{
        position: "absolute",
        top: "1.25rem",
        left: "1.25rem",
        maxWidth: "220px",
        background:
          "linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.82))",
        border: "1px solid rgba(148, 163, 184, 0.35)",
        borderRadius: "14px",
        padding: "0.85rem 1rem",
        fontFamily: "'DM Mono', 'IBM Plex Mono', monospace",
        color: "#f8fafc",
        letterSpacing: "0.05em",
        display: "flex",
        flexDirection: "column",
        gap: "0.35rem",
        boxShadow: "0 12px 32px rgba(15, 23, 42, 0.45)",
        pointerEvents: "none",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "0.7rem", color: "#94a3b8", opacity: 0.9 }}>
          {uiStrings.levelIndicator.levelLabel}
        </span>
        <span style={{ fontSize: "0.94rem", fontWeight: 600 }}>{levelNumber}</span>
      </div>
      <div
        style={{
          borderTop: "1px solid rgba(148, 163, 184, 0.22)",
          paddingTop: "0.45rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
        }}
      >
        <span style={{ fontSize: "0.7rem", color: "#94a3b8", opacity: 0.85 }}>
          {uiStrings.levelIndicator.objectivesLabel}
        </span>
        {objectives.length === 0 ? (
          <span style={{ fontSize: "0.72rem", color: "#cbd5f5", opacity: 0.85 }}>
            {uiStrings.levelIndicator.emptyObjectives}
          </span>
        ) : (
          <ul
            style={{
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.3rem",
              listStyleType: "none",
            }}
          >
            {objectives.map((objective, index) => (
              <li
                key={`${objective}-${index}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  fontSize: "0.74rem",
                  lineHeight: 1.2,
                  color: "rgba(226, 232, 240, 0.9)",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "0.85rem",
                    height: "0.85rem",
                    borderRadius: "999px",
                    background: "rgba(94, 234, 212, 0.22)",
                    color: "#5eead4",
                    fontSize: "0.64rem",
                    fontWeight: 600,
                  }}
                >
                  {index + 1}
                </span>
                <span>{objective}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LevelIndicator;

