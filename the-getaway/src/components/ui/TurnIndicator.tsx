import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

const TurnIndicator: React.FC = () => {
  const { inCombat, isPlayerTurn, turnCount } = useSelector(
    (state: RootState) => state.world
  );
  const player = useSelector((state: RootState) => state.player.data);

  const modeLabel = inCombat ? "COMBAT" : "FREE ROAM";
  const modeAccent = inCombat
    ? "linear-gradient(120deg, rgba(248, 113, 113, 0.9), rgba(239, 68, 68, 0.8))"
    : "linear-gradient(120deg, rgba(52, 211, 153, 0.9), rgba(16, 185, 129, 0.8))";
  const phaseLabel = inCombat
    ? isPlayerTurn
      ? "Your Move"
      : "Enemy Advance"
    : "Awaiting Directives";
  const phaseColor = inCombat
    ? isPlayerTurn
      ? "#38bdf8"
      : "#fbbf24"
    : "#cbd5f5";

  const chipShadow = inCombat
    ? "0 8px 20px rgba(239, 68, 68, 0.35)"
    : "0 8px 20px rgba(16, 185, 129, 0.25)";

  return (
    <div
      style={{
        position: "absolute",
        bottom: "1.5rem",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(420px, 80vw)",
        backdropFilter: "blur(6px)",
        borderRadius: "18px",
        border: "1px solid rgba(148, 163, 184, 0.25)",
        background:
          "linear-gradient(160deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.78))",
        boxShadow: "0 18px 40px rgba(15, 23, 42, 0.45)",
        padding: "1rem 1.25rem",
        color: "#e2e8f0",
        fontFamily: "'DM Sans', 'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: "0.85rem",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.4rem 0.95rem",
              borderRadius: "999px",
              background: modeAccent,
              color: "white",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              boxShadow: chipShadow,
            }}
          >
            <span style={{ fontSize: "0.9rem" }}>
              {inCombat ? "⚔" : "☉"}
            </span>
            {modeLabel}
          </span>
          {inCombat && (
            <span
              style={{
                fontSize: "0.78rem",
                letterSpacing: "0.08em",
                color: "rgba(148, 163, 184, 0.85)",
                textTransform: "uppercase",
              }}
            >
              Round {Math.max(1, turnCount)}
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: "0.86rem",
            color: phaseColor,
            fontWeight: 600,
          }}
        >
          {phaseLabel}
        </span>
      </div>

      {inCombat ? (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(79, 70, 229, 0.2)",
            color: "rgba(196, 181, 253, 0.95)",
            borderRadius: "12px",
            padding: "0.65rem 0.8rem",
            fontSize: "0.78rem",
            letterSpacing: "0.04em",
          }}
        >
          <span>Recon panel tracks current combat readiness.</span>
          <span>{isPlayerTurn ? "⇢" : "☍"}</span>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(79, 70, 229, 0.18)",
            color: "rgba(196, 181, 253, 0.95)",
            borderRadius: "12px",
            padding: "0.65rem 0.8rem",
            fontSize: "0.78rem",
          }}
        >
          <span>District calm. Recon panel lists roaming advisories.</span>
          <span style={{ fontSize: "0.9rem" }}>⇢</span>
        </div>
      )}
    </div>
  );
};

export default TurnIndicator;
