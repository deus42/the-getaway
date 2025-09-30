import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { getUIStrings } from "../../content/ui";
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
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);

  const healthRatio = player.maxHealth > 0 ? player.health / player.maxHealth : 0;
  const healthPercent = Math.max(0, Math.min(1, healthRatio)) * 100;

  const apRatio = player.maxActionPoints
    ? Math.max(0, Math.min(1, player.actionPoints / player.maxActionPoints))
    : 0;
  const apPercent = apRatio * 100;

  const experienceTarget = calculateExperienceForNextLevel(player.level);
  const xpRatio =
    experienceTarget > 0
      ? Math.max(0, Math.min(1, player.experience / experienceTarget))
      : 0;
  const xpPercent = xpRatio * 100;

  const { inventory } = player;
  const itemCount = inventory.items.length;
  const topItemNames = inventory.items.slice(0, 3).map((item) => item.name);
  const remainingItems = Math.max(0, itemCount - topItemNames.length);

  const statRowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.7rem",
    color: "rgba(226, 232, 240, 0.88)",
  };

  const barBackgroundStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "0.45rem",
    borderRadius: "999px",
    overflow: "hidden",
    background: "rgba(148, 163, 184, 0.25)",
  };

  const summaryCardStyle: React.CSSProperties = {
    background: "linear-gradient(182deg, rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.9))",
    borderRadius: "14px",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    padding: "0.95rem 1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  };

  const headerRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.6rem",
  };

  const badgeStyle: React.CSSProperties = {
    fontSize: "0.64rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "rgba(148, 163, 184, 0.78)",
  };

  const summaryGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "0.55rem",
  };

  const dividerStyle: React.CSSProperties = {
    height: "1px",
    width: "100%",
    background: "linear-gradient(90deg, rgba(148, 163, 184, 0), rgba(148, 163, 184, 0.28), rgba(148, 163, 184, 0))",
  };

  const inventoryChipsStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.4rem",
  };

  const inventoryChipStyle: React.CSSProperties = {
    padding: "0.25rem 0.5rem",
    borderRadius: "999px",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    fontSize: "0.68rem",
    color: "rgba(226, 232, 240, 0.9)",
    background: "rgba(30, 41, 59, 0.6)",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.2rem",
        fontFamily: "'DM Sans', 'Inter', sans-serif",
        color: "#e2e8f0",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(182deg, rgba(30, 41, 59, 0.82), rgba(15, 23, 42, 0.92))",
          borderRadius: "12px",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          boxShadow: "0 12px 22px rgba(15, 23, 42, 0.32)",
          padding: "0.85rem 0.9rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.55rem",
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
              fontSize: "0.64rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(148, 163, 184, 0.82)",
            }}
          >
            {uiStrings.playerStatus.vitalsLabel}
          </span>
          <span
            style={{
              fontSize: "0.74rem",
              color: "rgba(241, 245, 249, 0.9)",
            }}
          >
            {player.health} / {player.maxHealth}
          </span>
        </div>

        <div
          style={{
            position: "relative",
            width: "100%",
            height: "0.55rem",
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
              boxShadow: "0 8px 16px rgba(239, 68, 68, 0.26)",
              transition: "width 0.25s ease",
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
            fontSize: "0.68rem",
            color: "rgba(148, 163, 184, 0.76)",
            letterSpacing: "0.035em",
          }}
        >
          {uiStrings.playerStatus.vitalsHint}
        </span>
      </div>

      <div style={summaryCardStyle}>
        <div style={headerRowStyle}>
          <span style={badgeStyle}>{uiStrings.playerStatus.readinessLabel}</span>
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              letterSpacing: "0.05em",
              color: "rgba(224, 231, 255, 0.9)",
            }}
          >
            {uiStrings.playerStatus.levelLabel} {player.level}
          </span>
        </div>

        <div style={summaryGridStyle}>
          <div style={statRowStyle}>
            <span>{uiStrings.playerStatus.experienceLabel}</span>
            <span>
              {player.experience}/{experienceTarget}
            </span>
          </div>
          <div style={statRowStyle}>
            <span>{uiStrings.playerStatus.creditsLabel}</span>
            <span>{player.credits}</span>
          </div>
          <div style={statRowStyle}>
            <span>{uiStrings.playerStatus.actionPointsLabel}</span>
            <span>
              {player.actionPoints}/{player.maxActionPoints}
            </span>
          </div>
        </div>

        <div style={barBackgroundStyle}>
          <div
            style={{
              width: `${xpPercent}%`,
              height: "100%",
              background:
                "linear-gradient(90deg, rgba(250, 204, 21, 0.9), rgba(245, 158, 11, 0.85))",
              boxShadow: "0 8px 18px rgba(245, 158, 11, 0.32)",
              transition: "width 0.3s ease",
            }}
          />
        </div>
        <div style={barBackgroundStyle}>
          <div
            style={{
              width: `${apPercent}%`,
              height: "100%",
              background:
                "linear-gradient(90deg, rgba(129, 212, 250, 0.95), rgba(59, 130, 246, 0.9))",
              boxShadow: "0 10px 18px rgba(59, 130, 246, 0.32)",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        {inCombat ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.55rem 0.6rem",
              borderRadius: "10px",
              background: "rgba(79, 70, 229, 0.16)",
              border: "1px solid rgba(129, 140, 248, 0.18)",
              fontSize: "0.74rem",
              letterSpacing: "0.05em",
              color: "rgba(196, 181, 253, 0.9)",
            }}
          >
            <span>{uiStrings.playerStatus.roundLabel(Math.max(1, turnCount))}</span>
            <span>{uiStrings.playerStatus.hostilesLabel(hostileCount)}</span>
            <span style={{ color: "rgba(226, 232, 240, 0.88)" }}>
              {isPlayerTurn
                ? uiStrings.playerStatus.yourMove
                : uiStrings.playerStatus.enemyAdvance}
            </span>
          </div>
        ) : (
          <span
            style={{
              fontSize: "0.74rem",
              color: "rgba(148, 163, 184, 0.78)",
              letterSpacing: "0.045em",
            }}
          >
            {uiStrings.playerStatus.readinessHint}
          </span>
        )}

        <div style={dividerStyle} />

        <div style={headerRowStyle}>
          <span style={{ ...badgeStyle, color: "rgba(125, 211, 252, 0.82)" }}>
            {uiStrings.playerStatus.inventoryLabel}
          </span>
          <span style={{ fontSize: "0.72rem", color: "rgba(226, 232, 240, 0.88)" }}>
            {uiStrings.playerStatus.inventoryWeight(
              inventory.currentWeight,
              inventory.maxWeight
            )}
          </span>
        </div>
        <div style={statRowStyle}>
          <span>{uiStrings.playerStatus.inventoryItems(itemCount)}</span>
        </div>

        {topItemNames.length > 0 ? (
          <div style={inventoryChipsStyle}>
            {topItemNames.slice(0, 3).map((itemName, index) => (
              <span key={`${itemName}-${index}`} style={inventoryChipStyle}>
                {itemName}
              </span>
            ))}
            {remainingItems > 0 && (
              <span style={inventoryChipStyle}>
                {uiStrings.playerStatus.inventoryOverflow(remainingItems)}
              </span>
            )}
          </div>
        ) : (
          <span
            style={{
              fontSize: "0.72rem",
              color: "rgba(148, 163, 184, 0.8)",
            }}
          >
            {uiStrings.playerStatus.inventoryEmpty}
          </span>
        )}
      </div>
    </div>
  );
};

export default PlayerStatusPanel;

