import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  DEFAULT_DAY_NIGHT_CONFIG,
  TimeOfDay,
} from "../../game/world/dayNightCycle";
import { getUIStrings } from "../../content/ui";

type HalfSegment = "day" | "night";

const DAY_PHASES: ReadonlySet<TimeOfDay> = new Set(["morning", "day"]);

const formatDuration = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
};

interface HalfCycleTiming {
  progress: number;
  secondsUntilChange: number;
}

const getHalfCycleTiming = (
  currentTime: number,
  segment: HalfSegment
): HalfCycleTiming => {
  const config = DEFAULT_DAY_NIGHT_CONFIG;
  const { cycleDuration, morningStartTime, eveningStartTime } = config;

  if (cycleDuration <= 0) {
    return { progress: 1, secondsUntilChange: 0 };
  }

  const cycleSeconds = ((currentTime % cycleDuration) + cycleDuration) % cycleDuration;
  const cycleProgress = cycleSeconds / cycleDuration;

  const segmentStart = segment === "day" ? morningStartTime : eveningStartTime;
  const segmentEnd = segment === "day"
    ? eveningStartTime
    : morningStartTime + 1;

  let adjustedProgress = cycleProgress;
  if (adjustedProgress < segmentStart) {
    adjustedProgress += 1;
  }

  const durationFraction = segmentEnd - segmentStart;
  const durationSeconds = Math.max(durationFraction * cycleDuration, 0);
  const secondsIntoSegment = Math.min(
    durationSeconds,
    Math.max(0, (adjustedProgress - segmentStart) * cycleDuration)
  );
  const secondsUntilChange = Math.max(0, durationSeconds - secondsIntoSegment);
  const progress = durationSeconds > 0 ? secondsIntoSegment / durationSeconds : 1;

  return {
    progress: Math.min(1, Math.max(0, progress)),
    secondsUntilChange,
  };
};

const DayNightIndicator: React.FC = () => {
  const { currentTime, timeOfDay, curfewActive } = useSelector(
    (state: RootState) => state.world
  );
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);
  const dayNightStrings = uiStrings.dayNight;

  const segment: HalfSegment = DAY_PHASES.has(timeOfDay) ? "day" : "night";
  const { progress, secondsUntilChange } = getHalfCycleTiming(
    currentTime,
    segment
  );

  const segmentLabel = segment === "day"
    ? dayNightStrings.timeOfDay.day
    : dayNightStrings.timeOfDay.night;
  const nextSegmentLabel = segment === "day"
    ? dayNightStrings.timeOfDay.night
    : dayNightStrings.timeOfDay.day;

  const fillPercent = Math.min(100, Math.max(4, progress * 100));
  const progressPercent = Math.round(progress * 100);
  const countdown = formatDuration(secondsUntilChange);

  const ariaLabel = `${segmentLabel} phase; ${progressPercent}% complete; ${nextSegmentLabel} in ${countdown}.`;

  const styles = `
    .day-night-wafer {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.55rem 0.85rem;
      min-width: 14.5rem;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(12, 18, 30, 0.94), rgba(16, 24, 38, 0.78));
      border: 1px solid rgba(56, 189, 248, 0.32);
      box-shadow: 0 18px 34px rgba(6, 11, 21, 0.55);
      color: #e2e8f0;
      font-family: 'DM Mono', 'IBM Plex Mono', monospace;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      overflow: hidden;
      pointer-events: auto;
    }

    .day-night-wafer::before,
    .day-night-wafer::after {
      content: '';
      position: absolute;
      width: 18px;
      height: 2px;
      background: rgba(56, 189, 248, 0.28);
      pointer-events: none;
    }

    .day-night-wafer::before {
      top: 9px;
      left: 12px;
      transform: rotate(-14deg);
      box-shadow: 0 0 8px rgba(56, 189, 248, 0.4);
    }

    .day-night-wafer::after {
      bottom: 10px;
      right: 14px;
      transform: rotate(18deg);
      box-shadow: 0 0 8px rgba(56, 189, 248, 0.28);
    }

    .day-night-wafer[data-phase="day"] {
      border-color: rgba(251, 191, 36, 0.35);
      background: linear-gradient(135deg, rgba(17, 23, 35, 0.92), rgba(21, 28, 44, 0.78));
    }

    .day-night-wafer[data-phase="night"] {
      border-color: rgba(99, 102, 241, 0.45);
      background: linear-gradient(135deg, rgba(10, 12, 24, 0.96), rgba(16, 20, 36, 0.78));
    }

    .day-night-wafer[data-curfew="true"] {
      border-color: rgba(248, 113, 113, 0.6);
      box-shadow: 0 0 26px rgba(127, 29, 29, 0.35);
    }

    .day-night-wafer__scanline {
      position: absolute;
      inset: 0;
      left: -120%;
      width: 120%;
      background: linear-gradient(90deg, transparent 0%, rgba(94, 234, 212, 0.18) 45%, transparent 85%);
      mix-blend-mode: screen;
      opacity: 0;
      animation: hud-wafer-scan 12s linear infinite;
      pointer-events: none;
    }

    @keyframes hud-wafer-scan {
      0% { transform: translateX(-35%); opacity: 0; }
      10% { opacity: 0.35; }
      22% { transform: translateX(55%); opacity: 0; }
      100% { transform: translateX(55%); opacity: 0; }
    }

    .day-night-wafer__icon {
      position: relative;
      width: 2.4rem;
      height: 2.4rem;
      border-radius: 0.7rem;
      background: linear-gradient(140deg, rgba(32, 45, 63, 0.9), rgba(20, 28, 44, 0.84));
      box-shadow: inset 0 0 12px rgba(8, 12, 20, 0.7), 0 0 14px rgba(56, 189, 248, 0.12);
      transition: transform 180ms ease-out, box-shadow 240ms ease-out;
    }

    .day-night-wafer[data-phase="day"] .day-night-wafer__icon {
      transform: rotate(2deg);
      box-shadow: inset 0 0 14px rgba(15, 23, 42, 0.72), 0 0 18px rgba(245, 158, 11, 0.28);
    }

    .day-night-wafer[data-phase="night"] .day-night-wafer__icon {
      transform: rotate(-3deg);
      box-shadow: inset 0 0 16px rgba(10, 12, 24, 0.82), 0 0 18px rgba(99, 102, 241, 0.32);
    }

    .day-night-wafer__icon::before,
    .day-night-wafer__icon::after {
      content: '';
      position: absolute;
      pointer-events: none;
    }

    .day-night-wafer[data-phase="day"] .day-night-wafer__icon::before {
      top: 50%;
      left: 50%;
      width: 1.35rem;
      height: 1.35rem;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: radial-gradient(circle at 40% 35%, rgba(255, 237, 179, 0.95) 0%, rgba(251, 191, 36, 0.85) 55%, rgba(217, 119, 6, 0.2) 100%);
      box-shadow: 0 0 16px rgba(245, 158, 11, 0.35);
    }

    .day-night-wafer[data-phase="day"] .day-night-wafer__icon::after {
      top: 50%;
      left: 50%;
      width: 2rem;
      height: 2rem;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: conic-gradient(
        from 0deg,
        rgba(251, 191, 36, 0.45) 0deg 18deg,
        transparent 18deg 45deg
      );
      filter: blur(0.35px);
    }

    .day-night-wafer[data-phase="night"] .day-night-wafer__icon::before {
      top: 50%;
      left: 50%;
      width: 1.45rem;
      height: 1.45rem;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: radial-gradient(circle at 45% 40%, rgba(199, 210, 254, 0.9) 0%, rgba(129, 140, 248, 0.88) 55%, rgba(79, 70, 229, 0.25) 100%);
      box-shadow: 0 0 16px rgba(99, 102, 241, 0.38);
    }

    .day-night-wafer[data-phase="night"] .day-night-wafer__icon::after {
      top: 50%;
      left: 58%;
      width: 1.45rem;
      height: 1.45rem;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: rgba(14, 21, 35, 0.95);
      box-shadow: -6px 0 12px rgba(53, 63, 91, 0.38);
    }

    .day-night-wafer[data-curfew="true"] .day-night-wafer__icon::before {
      box-shadow: 0 0 18px rgba(239, 68, 68, 0.45);
    }

    .day-night-wafer__content {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .day-night-wafer__tag {
      font-size: 0.8rem;
      letter-spacing: 0.28em;
      color: rgba(226, 232, 240, 0.78);
    }

    .day-night-wafer[data-phase="night"] .day-night-wafer__tag {
      color: rgba(209, 213, 255, 0.75);
    }

    .day-night-wafer__bar {
      position: relative;
      width: 8.9rem;
      height: 6px;
      border-radius: 999px;
      background: rgba(11, 17, 28, 0.92);
      border: 1px solid rgba(94, 107, 139, 0.45);
      overflow: hidden;
    }

    .day-night-wafer__bar-fill {
      position: relative;
      height: 100%;
      width: 50%;
      background: rgba(251, 191, 36, 0.75);
      box-shadow: 0 0 12px rgba(245, 158, 11, 0.24);
      transition: width 240ms ease-out, background 200ms ease-out, box-shadow 200ms ease-out;
    }

    .day-night-wafer[data-phase="night"] .day-night-wafer__bar-fill {
      background: rgba(99, 102, 241, 0.78);
      box-shadow: 0 0 14px rgba(99, 102, 241, 0.28);
    }

    .day-night-wafer[data-curfew="true"] .day-night-wafer__bar-fill {
      background: rgba(239, 68, 68, 0.82);
      box-shadow: 0 0 18px rgba(185, 28, 28, 0.42);
    }

    .day-night-wafer__bar-noise {
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        90deg,
        rgba(148, 163, 184, 0.06) 0px 7px,
        transparent 7px 14px
      );
      mix-blend-mode: overlay;
      opacity: 0.35;
      pointer-events: none;
    }

    @media (max-width: 1260px) {
      .day-night-wafer {
        min-width: 12rem;
      }
    }

    @media (max-width: 1120px) {
      .day-night-wafer {
        min-width: auto;
        padding: 0.5rem;
      }

      .day-night-wafer__content {
        display: none;
      }
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div
        className="day-night-wafer"
        data-phase={segment}
        data-curfew={curfewActive || undefined}
        role="status"
        aria-label={ariaLabel}
      >
        <span className="day-night-wafer__scanline" aria-hidden />
        <div className="day-night-wafer__icon" aria-hidden />
        <div className="day-night-wafer__content" aria-hidden>
          <span className="day-night-wafer__tag">
            {segment === "day" ? "DAY" : "NIGHT"}
          </span>
          <div className="day-night-wafer__bar">
            <div
              className="day-night-wafer__bar-fill"
              style={{ width: `${fillPercent}%` }}
            />
            <div className="day-night-wafer__bar-noise" />
          </div>
        </div>
      </div>
    </>
  );
};

export default DayNightIndicator;
