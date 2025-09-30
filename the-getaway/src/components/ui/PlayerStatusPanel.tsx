import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { calculateExperienceForNextLevel } from "../../game/interfaces/player";

const PlayerStatusPanel: React.FC = () => {
  const player = useSelector((state: RootState) => state.player.data);
  const inCombat = useSelector((state: RootState) => state.world.inCombat);
  const turnCount = useSelector((state: RootState) => state.world.turnCount);
  const isPlayerTurn = useSelector((state: RootState) => state.world.isPlayerTurn);
  const hostileCount = useSelector((state: RootState) => {
    const enemies = state.world.currentMapArea?.entities?.enemies ?? [];
    return enemies.reduce((count, enemy) => (enemy.health > 0 ? count + 1 : count), 0);
  });
  const healthRatio = player.maxHealth > 0 ? player.health / player.maxHealth : 0;
  const healthPercent = Math.max(0, Math.min(1, healthRatio)) * 100;

  const apRatio = player.maxActionPoints
    ? Math.max(0, Math.min(1, player.actionPoints / player.maxActionPoints))
    : 0;
  const apPercent = apRatio * 100;

  const experienceTarget = calculateExperienceForNextLevel(player.level);

  const healthColor = healthPercent > 60 ? '#22c55e' : healthPercent > 30 ? '#f59e0b' : '#ef4444';

  const { inventory } = player;
  const itemCount = inventory.items.length;

  return (
    <div
      style={{
        background: "linear-gradient(182deg, rgba(30, 41, 59, 0.82), rgba(15, 23, 42, 0.92))",
        borderRadius: "12px",
        border: "1px solid rgba(148, 163, 184, 0.2)",
        padding: "0.75rem 0.85rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
        fontFamily: "'DM Sans', 'Inter', sans-serif",
        color: "#e2e8f0",
        fontSize: "0.7rem",
      }}
    >
      {/* Health Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(148, 163, 184, 0.8)", minWidth: "32px" }}>HP</span>
        <div style={{ flex: 1, position: "relative", height: "0.5rem", borderRadius: "999px", background: "rgba(71, 85, 105, 0.3)" }}>
          <div style={{ width: `${healthPercent}%`, height: "100%", background: healthColor, borderRadius: "999px", transition: "width 0.25s ease" }} />
        </div>
        <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#f8fafc", minWidth: "48px", textAlign: "right" }}>{player.health}/{player.maxHealth}</span>
      </div>

      {/* Compact Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem 0.6rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "rgba(148, 163, 184, 0.85)" }}>Level</span>
          <span style={{ fontWeight: 600, color: "#fbbf24" }}>{player.level}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "rgba(148, 163, 184, 0.85)" }}>AP</span>
          <span style={{ fontWeight: 600, color: "#38bdf8" }}>{player.actionPoints}/{player.maxActionPoints}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "rgba(148, 163, 184, 0.85)" }}>XP</span>
          <span style={{ fontSize: "0.65rem", color: "#cbd5e1" }}>{player.experience}/{experienceTarget}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "rgba(148, 163, 184, 0.85)" }}>₵</span>
          <span style={{ fontSize: "0.65rem", color: "#cbd5e1" }}>{player.credits}</span>
        </div>
      </div>

      {/* AP Progress Bar */}
      <div style={{ position: "relative", height: "0.35rem", borderRadius: "999px", background: "rgba(148, 163, 184, 0.25)" }}>
        <div style={{ width: `${apPercent}%`, height: "100%", background: "linear-gradient(90deg, #38bdf8, #3b82f6)", borderRadius: "999px", transition: "width 0.3s ease" }} />
      </div>

      {/* Combat Status */}
      {inCombat && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.4rem 0.5rem", borderRadius: "6px", background: "rgba(79, 70, 229, 0.16)", border: "1px solid rgba(129, 140, 248, 0.18)", fontSize: "0.65rem" }}>
          <span style={{ color: "#a5b4fc" }}>T{turnCount}</span>
          <span style={{ color: "#ef4444" }}>⚠ {hostileCount}</span>
          <span style={{ color: isPlayerTurn ? "#22c55e" : "#f59e0b" }}>{isPlayerTurn ? "YOUR" : "WAIT"}</span>
        </div>
      )}

      {/* Inventory */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.3rem", borderTop: "1px solid rgba(148, 163, 184, 0.15)" }}>
        <span style={{ fontSize: "0.65rem", color: "rgba(148, 163, 184, 0.85)" }}>Items: {itemCount}</span>
        <span style={{ fontSize: "0.65rem", color: "rgba(148, 163, 184, 0.85)" }}>{inventory.currentWeight}/{inventory.maxWeight} kg</span>
      </div>
    </div>
  );
};

export default PlayerStatusPanel;

