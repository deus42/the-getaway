import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  DEFAULT_DAY_NIGHT_CONFIG,
  TimeOfDay,
  getPhaseTimingInfo,
  getSecondsUntilCycleReset,
} from "../../game/world/dayNightCycle";

const timeOfDayLabels: Record<TimeOfDay, string> = {
  morning: "Morning",
  day: "Day",
  evening: "Evening",
  night: "Night",
};

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
};

const DayNightIndicator: React.FC = () => {
  const { currentTime, timeOfDay, curfewActive } = useSelector(
    (state: RootState) => state.world
  );

  const label = timeOfDayLabels[timeOfDay];
  const phaseTiming = getPhaseTimingInfo(currentTime, DEFAULT_DAY_NIGHT_CONFIG);
  const cycleResetSeconds = getSecondsUntilCycleReset(
    currentTime,
    DEFAULT_DAY_NIGHT_CONFIG
  );

  const nextPhaseLabel = timeOfDayLabels[phaseTiming.nextPhase];
  const phaseCountdown = formatDuration(phaseTiming.secondsUntilNextPhase);
  const cycleResetCountdown = formatDuration(cycleResetSeconds);
  const phaseProgressPercent = Math.round(phaseTiming.phaseProgress * 100);

  return (
    <div
      style={{
        position: "absolute",
        top: "1.25rem",
        right: "1.25rem",
        minWidth: "172px",
        background:
          "linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.8))",
        border: "1px solid rgba(148, 163, 184, 0.35)",
        borderRadius: "14px",
        padding: "0.85rem 1.05rem",
        fontFamily: "'DM Mono', 'IBM Plex Mono', monospace",
        color: "#f8fafc",
        letterSpacing: "0.05em",
        display: "flex",
        flexDirection: "column",
        gap: "0.45rem",
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
          PHASE
        </span>
        <span style={{ fontSize: "0.92rem", fontWeight: 600 }}>{label}</span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "0.7rem", color: "#94a3b8", opacity: 0.85 }}>
          NEXT
        </span>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            lineHeight: 1.05,
          }}
        >
          <span style={{ fontSize: "0.86rem", fontWeight: 600 }}>
            {nextPhaseLabel}
          </span>
          <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
            in {phaseCountdown}
          </span>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "0.2rem",
        }}
      >
        <span style={{ fontSize: "0.7rem", color: "#94a3b8", opacity: 0.85 }}>
          RESET
        </span>
        <span style={{ fontSize: "0.84rem", fontWeight: 600 }}>
          {cycleResetCountdown}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.7rem",
          color: "#94a3b8",
          opacity: 0.85,
        }}
      >
        <span>PROGRESS</span>
        <span>{phaseProgressPercent}%</span>
      </div>
      <div
        style={{
          width: "100%",
          height: "0.4rem",
          borderRadius: "9999px",
          background: "rgba(148, 163, 184, 0.25)",
          overflow: "hidden",
          position: "relative",
        }}
        aria-hidden="true"
      >
        <div
          style={{
            width: `${Math.min(100, Math.max(0, phaseTiming.phaseProgress * 100))}%`,
            height: "100%",
            background:
              "linear-gradient(90deg, rgba(96, 165, 250, 0.75), rgba(59, 130, 246, 0.95))",
            transition: "width 0.25s ease-out",
          }}
        />
      </div>
      <div
        style={{
          borderTop: "1px solid rgba(148, 163, 184, 0.22)",
          paddingTop: "0.4rem",
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          color: curfewActive ? "#f87171" : "#34d399",
          fontSize: "0.75rem",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "0.6rem",
            height: "0.6rem",
            borderRadius: "9999px",
            backgroundColor: curfewActive ? "#ef4444" : "#22c55e",
            boxShadow: curfewActive
              ? "0 0 8px rgba(239, 68, 68, 0.6)"
              : "0 0 8px rgba(34, 197, 94, 0.45)",
            transform: "translateY(1px)",
          }}
        />
        {curfewActive ? "CURFEW ENFORCED" : "SAFE TO TRAVEL"}
      </div>
    </div>
  );
};

export default DayNightIndicator;
