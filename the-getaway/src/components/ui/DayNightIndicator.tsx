import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  DAY_START_HOUR,
  DEFAULT_DAY_NIGHT_CONFIG,
  NIGHT_START_HOUR,
  getClockTime24,
  getPhaseTimingInfo,
} from '../../game/world/dayNightCycle';
import { getUIStrings } from '../../content/ui';

const DISPLAY_STEP_MINUTES = 15;

const formatClockTime = (currentTime: number): string => {
  const { totalMinutes } = getClockTime24(currentTime);
  const quantizedMinutes = Math.floor(totalMinutes / DISPLAY_STEP_MINUTES) * DISPLAY_STEP_MINUTES;
  const hours = Math.floor(quantizedMinutes / 60) % 24;
  const minutes = quantizedMinutes % 60;

  return `${hours
    .toString()
    .padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;
};

const formatHour = (hour: number): string => `${hour.toString().padStart(2, '0')}:00`;

const formatCountdown = (seconds: number): string => {
  const wholeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(wholeSeconds / 60);
  const remainder = wholeSeconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${remainder
    .toString()
    .padStart(2, '0')}`;
};

const DayNightIndicator: React.FC = () => {
  const currentTime = useSelector((state: RootState) => state.world.currentTime);
  const curfewActive = useSelector((state: RootState) => state.world.curfewActive);
  const locale = useSelector((state: RootState) => state.settings.locale);
  const dayNightStrings = getUIStrings(locale).dayNight;
  const clockTime = formatClockTime(currentTime);
  const phaseInfo = getPhaseTimingInfo(currentTime, DEFAULT_DAY_NIGHT_CONFIG);
  const [hours, minutes] = clockTime.split(':');
  const currentPhaseLabel = dayNightStrings.timeOfDay[phaseInfo.currentPhase];
  const nextPhaseLabel = dayNightStrings.timeOfDay[phaseInfo.nextPhase];
  const countdown = formatCountdown(phaseInfo.secondsUntilNextPhase);
  const curfewWindow = dayNightStrings.curfewWindow(
    formatHour(NIGHT_START_HOUR),
    formatHour(DAY_START_HOUR)
  );
  const curfewStatus = curfewActive ? dayNightStrings.curfewEnforced : dayNightStrings.safeToTravel;

  const styles = `
    .day-night-clock {
      position: relative;
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 0.34rem;
      width: min(14rem, calc(100vw - 2.5rem));
      justify-content: center;
      padding: 0.48rem 0.7rem;
      border-radius: 10px;
      border: 1px solid ${curfewActive ? 'rgba(248, 113, 113, 0.5)' : 'rgba(148, 163, 184, 0.25)'};
      background: ${curfewActive
        ? 'linear-gradient(145deg, rgba(35, 12, 18, 0.94), rgba(15, 23, 42, 0.9))'
        : 'rgba(15, 23, 42, 0.9)'};
      box-shadow: ${curfewActive
        ? '0 0 18px rgba(248, 113, 113, 0.22), inset 0 0 18px rgba(127, 29, 29, 0.18)'
        : '0 0 12px rgba(56, 189, 248, 0.16)'};
      color: #e2e8f0;
      font-family: 'DM Mono', 'IBM Plex Mono', monospace;
      font-size: 0.98rem;
      font-weight: 600;
      letter-spacing: 0;
      line-height: 1;
      text-shadow: 0 0 9px rgba(56, 189, 248, 0.32);
      pointer-events: none;
      user-select: none;
    }

    .day-night-clock::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(
        to bottom,
        rgba(148, 163, 184, 0.1),
        rgba(15, 23, 42, 0)
      );
      pointer-events: none;
    }

    .day-night-clock__digit {
      display: inline-flex;
      min-width: 1.55rem;
      justify-content: center;
    }

    .day-night-clock__time {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.28rem;
    }

    .day-night-clock__colon {
      color: rgba(186, 230, 253, 0.9);
    }

    .day-night-clock__meta {
      display: grid;
      width: 100%;
      gap: 0.18rem;
      color: #cbd5e1;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 0.62rem;
      font-weight: 700;
      line-height: 1.15;
      text-align: center;
      text-transform: uppercase;
    }

    .day-night-clock__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.45rem;
      min-width: 0;
    }

    .day-night-clock__label {
      color: ${curfewActive ? '#fbbf24' : '#93c5fd'};
      white-space: nowrap;
    }

    .day-night-clock__value {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .day-night-clock__status {
      color: ${curfewActive ? '#fca5a5' : '#86efac'};
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div
        className="day-night-clock"
        role="status"
        aria-label={`${dayNightStrings.clockLabel}: ${clockTime}. ${currentPhaseLabel}. ${curfewStatus}. ${curfewWindow}.`}
        data-testid="day-night-clock"
      >
        <span className="day-night-clock__time">
          <span className="day-night-clock__digit">{hours}</span>
          <span className="day-night-clock__colon" aria-hidden>
            :
          </span>
          <span className="day-night-clock__digit">{minutes}</span>
        </span>
        <span className="day-night-clock__meta" aria-hidden>
          <span className="day-night-clock__row">
            <span className="day-night-clock__label">{dayNightStrings.phaseLabel}</span>
            <span className="day-night-clock__value">{currentPhaseLabel}</span>
          </span>
          <span className="day-night-clock__row">
            <span className="day-night-clock__label">{dayNightStrings.nextLabel}</span>
            <span className="day-night-clock__value">
              {nextPhaseLabel} {dayNightStrings.nextIn(countdown)}
            </span>
          </span>
          <span className="day-night-clock__row">
            <span className="day-night-clock__label">{curfewWindow}</span>
            <span className="day-night-clock__value day-night-clock__status">{curfewStatus}</span>
          </span>
        </span>
      </div>
    </>
  );
};

export default DayNightIndicator;
