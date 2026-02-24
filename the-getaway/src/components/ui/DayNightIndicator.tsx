import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getClockTime24 } from '../../game/world/dayNightCycle';
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

const DayNightIndicator: React.FC = () => {
  const clockTime = useSelector((state: RootState) =>
    formatClockTime(state.world.currentTime)
  );
  const locale = useSelector((state: RootState) => state.settings.locale);
  const dayNightStrings = getUIStrings(locale).dayNight;
  const [hours, minutes] = clockTime.split(':');

  const styles = `
    .day-night-clock {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 0.28rem;
      width: 7.6rem;
      justify-content: center;
      padding: 0.44rem 0.7rem;
      border-radius: 10px;
      border: 1px solid rgba(148, 163, 184, 0.25);
      background: rgba(15, 23, 42, 0.9);
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.16);
      color: #e2e8f0;
      font-family: 'DM Mono', 'IBM Plex Mono', monospace;
      font-size: 0.98rem;
      font-weight: 600;
      letter-spacing: 0.14em;
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

    .day-night-clock__colon {
      color: rgba(186, 230, 253, 0.9);
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div
        className="day-night-clock"
        role="status"
        aria-label={`${dayNightStrings.clockLabel}: ${clockTime}`}
        data-testid="day-night-clock"
      >
        <span className="day-night-clock__digit">{hours}</span>
        <span className="day-night-clock__colon" aria-hidden>
          :
        </span>
        <span className="day-night-clock__digit">{minutes}</span>
      </div>
    </>
  );
};

export default DayNightIndicator;
