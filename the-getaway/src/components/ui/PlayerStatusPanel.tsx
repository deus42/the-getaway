import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

const PlayerStatusPanel: React.FC = () => {
  const player = useSelector((state: RootState) => state.player.data);
  const position = useSelector(
    (state: RootState) => state.player.data.position
  );
  const inCombat = useSelector((state: RootState) => state.world.inCombat);
  const turnCount = useSelector((state: RootState) => state.world.turnCount);

  const healthRatio =
    player.maxHealth > 0 ? player.health / player.maxHealth : 0;
  const healthPercent = Math.max(0, Math.min(1, healthRatio)) * 100;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        fontFamily: "'DM Sans', 'Inter', sans-serif",
        color: "#e2e8f0",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(182deg, rgba(30, 41, 59, 0.88), rgba(15, 23, 42, 0.96))",
          borderRadius: "16px",
          border: "1px solid rgba(148, 163, 184, 0.22)",
          boxShadow: "0 18px 38px rgba(15, 23, 42, 0.45)",
          padding: "1.25rem 1.1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.85rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "0.74rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(148, 163, 184, 0.88)",
            }}
          >
            Vital Status
          </span>
          <span
            style={{
              fontSize: "0.86rem",
              color: "rgba(241, 245, 249, 0.92)",
            }}
          >
            {player.health} / {player.maxHealth}
          </span>
        </div>

        <div
          style={{
            position: "relative",
            width: "100%",
            height: "0.95rem",
            borderRadius: "999px",
            overflow: "hidden",
            background: "rgba(71, 85, 105, 0.25)",
          }}
        >
          <div
            style={{
              width: `${healthPercent}%`,
              height: "100%",
              background:
                "linear-gradient(90deg, rgba(248, 113, 113, 0.95), rgba(239, 68, 68, 0.88))",
              boxShadow: "0 10px 24px rgba(239, 68, 68, 0.32)",
              transition: "width 0.35s ease",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 25% 40%, rgba(254, 226, 226, 0.45), transparent)",
              pointerEvents: "none",
            }}
          />
        </div>

        <span
          style={{
            fontSize: "0.78rem",
            color: "rgba(148, 163, 184, 0.78)",
            letterSpacing: "0.045em",
          }}
        >
          Keep your vitals stable—the regime rations medkits after curfew.
        </span>
      </div>

      <div
        style={{
          background: "rgba(30, 41, 59, 0.62)",
          borderRadius: "14px",
          border: "1px solid rgba(148, 163, 184, 0.16)",
          padding: "1.05rem 1.1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.65rem",
          fontSize: "0.82rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "rgba(226, 232, 240, 0.88)",
          }}
        >
          <span
            style={{
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Position
          </span>
          <span>
            ({position?.x ?? "?"}, {position?.y ?? "?"})
          </span>
        </div>

        {inCombat ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "rgba(216, 180, 254, 0.92)",
              letterSpacing: "0.055em",
              textTransform: "uppercase",
            }}
          >
            <span>Engagement</span>
            <span>Turn {Math.max(1, turnCount)}</span>
          </div>
        ) : (
          <div
            style={{
              color: "rgba(148, 163, 184, 0.78)",
              letterSpacing: "0.04em",
            }}
          >
            Sector quiet. Free movement authorized.
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerStatusPanel;
