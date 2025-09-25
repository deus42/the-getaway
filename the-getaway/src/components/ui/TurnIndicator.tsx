import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

const TurnIndicator: React.FC = () => {
  const { inCombat, isPlayerTurn, turnCount } = useSelector(
    (state: RootState) => state.world
  );
  const player = useSelector((state: RootState) => state.player.data);

  const apPercent = player.maxActionPoints
    ? Math.max(0, Math.min(1, player.actionPoints / player.maxActionPoints))
    : 0;

  const modeLabel = inCombat ? "COMBAT" : "FREE ROAM";
  const modeAccent = inCombat
    ? "linear-gradient(120deg, rgba(248, 113, 113, 0.9), rgba(239, 68, 68, 0.8))"
    : "linear-gradient(120deg, rgba(52, 211, 153, 0.9), rgba(16, 185, 129, 0.8))";
  const phaseLabel = inCombat
    ? isPlayerTurn
      ? "Your Move"
      : "Enemy Advance"
    : "Explore the district";
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
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.78rem",
              color: "rgba(226, 232, 240, 0.9)",
            }}
          >
            <span>Action Points</span>
            <span>
              {player.actionPoints}/{player.maxActionPoints}
            </span>
          </div>
          <div
            style={{
              height: "0.55rem",
              width: "100%",
              background: "rgba(148, 163, 184, 0.2)",
              borderRadius: "999px",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                width: `${apPercent * 100}%`,
                height: "100%",
                background:
                  "linear-gradient(90deg, rgba(129, 212, 250, 0.95), rgba(59, 130, 246, 0.95))",
                boxShadow: "0 6px 14px rgba(59, 130, 246, 0.35)",
                transition: "width 0.25s ease-out",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  "radial-gradient(circle at 15% 30%, rgba(255, 255, 255, 0.25), transparent)",
                pointerEvents: "none",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.72rem",
              color: "rgba(148, 163, 184, 0.8)",
              letterSpacing: "0.05em",
            }}
          >
            <span>Plan moves before AP runs dry.</span>
            <span>{isPlayerTurn ? "Waiting on you" : "Hold position"}</span>
          </div>
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
          <span>District calm. Free movement enabled.</span>
          <span style={{ fontSize: "0.9rem" }}>⇢</span>
        </div>
      )}
    </div>
  );
};

export default TurnIndicator;
