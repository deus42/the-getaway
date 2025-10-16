import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  DEFAULT_DAY_NIGHT_CONFIG,
  getPhaseTimingInfo,
  getSecondsUntilCycleReset,
} from "../../game/world/dayNightCycle";
import { getUIStrings } from "../../content/ui";
import { selectEnvironmentSystemImpacts } from "../../store/selectors/worldSelectors";

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
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);
  const dayNightStrings = uiStrings.dayNight;
  const environmentImpacts = useSelector(selectEnvironmentSystemImpacts);
  const advisoryLevel = environmentImpacts.travel.advisoryLevel;
  const advisoryTheme = {
    clear: {
      text: "#34d399",
      badge: "rgba(16, 185, 129, 0.22)",
      badgeBorder: "rgba(16, 185, 129, 0.55)",
      glow: "rgba(16, 185, 129, 0.35)",
    },
    caution: {
      text: "#facc15",
      badge: "rgba(234, 179, 8, 0.22)",
      badgeBorder: "rgba(234, 179, 8, 0.55)",
      glow: "rgba(234, 179, 8, 0.35)",
    },
    severe: {
      text: "#f87171",
      badge: "rgba(239, 68, 68, 0.22)",
      badgeBorder: "rgba(239, 68, 68, 0.55)",
      glow: "rgba(239, 68, 68, 0.38)",
    },
  } as const;
  const advisoryPalette = advisoryTheme[advisoryLevel];
  const travelStatsLine = dayNightStrings.travelAdvisory.stats({
    stamina: Math.max(0, Math.round(environmentImpacts.travel.staminaDrainPerMinute)),
    encounters: Number(environmentImpacts.travel.encounterRiskModifier.toFixed(2)),
  });
  const showAdvisoryPanel = advisoryLevel !== "clear";

  const label = dayNightStrings.timeOfDay[timeOfDay];
  const phaseTiming = getPhaseTimingInfo(currentTime, DEFAULT_DAY_NIGHT_CONFIG);
  const cycleResetSeconds = getSecondsUntilCycleReset(
    currentTime,
    DEFAULT_DAY_NIGHT_CONFIG
  );

  const nextPhaseLabel = dayNightStrings.timeOfDay[phaseTiming.nextPhase];
  const phaseCountdown = formatDuration(phaseTiming.secondsUntilNextPhase);
  const cycleResetCountdown = formatDuration(cycleResetSeconds);
  const phaseProgressPercent = Math.round(phaseTiming.phaseProgress * 100);

  return (
    <div
      style={{
        position: "relative",
        width: "min(18.5rem, 46vw)",
        minWidth: "16.5rem",
        background:
          "linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.82))",
        border: "1px solid rgba(148, 163, 184, 0.35)",
        borderRadius: "14px",
        padding: "1rem 1.1rem 1.1rem",
        fontFamily: "'DM Mono', 'IBM Plex Mono', monospace",
        color: "#f8fafc",
        letterSpacing: "0.06em",
        display: "flex",
        flexDirection: "column",
        gap: "0.55rem",
        boxShadow: "0 20px 38px rgba(15, 23, 42, 0.45)",
        pointerEvents: "auto",
        backdropFilter: "blur(6px)",
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
          {dayNightStrings.phaseLabel}
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
          {dayNightStrings.nextLabel}
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
            {dayNightStrings.nextIn(phaseCountdown)}
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
          {dayNightStrings.resetLabel}
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
        <span>{dayNightStrings.progressLabel}</span>
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
      {showAdvisoryPanel ? (
        <div
          style={{
            borderTop: "1px solid rgba(148, 163, 184, 0.22)",
            paddingTop: "0.45rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.3rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: advisoryPalette.text,
              fontSize: "0.72rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                padding: "0.1rem 0.5rem",
                borderRadius: "999px",
                border: `1px solid ${advisoryPalette.badgeBorder}`,
                background: advisoryPalette.badge,
                boxShadow: `0 0 10px ${advisoryPalette.glow}`,
              }}
            >
              {dayNightStrings.travelAdvisory.label}
            </span>
            <span style={{ fontWeight: 600 }}>
              {dayNightStrings.travelAdvisory.levels[advisoryLevel]}
            </span>
          </div>
          <div
            style={{
              fontSize: "0.64rem",
              color: "rgba(226, 232, 240, 0.82)",
              fontFamily: "'DM Mono', 'IBM Plex Mono', monospace",
            }}
          >
            {travelStatsLine}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              color: curfewActive ? "#f87171" : "#34d399",
              fontSize: "0.72rem",
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
            {curfewActive
              ? dayNightStrings.curfewEnforced
              : dayNightStrings.safeToTravel}
          </div>
        </div>
      ) : (
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
          {curfewActive
            ? dayNightStrings.curfewEnforced
            : dayNightStrings.safeToTravel}
        </div>
      )}
    </div>
  );
};

export default DayNightIndicator;
