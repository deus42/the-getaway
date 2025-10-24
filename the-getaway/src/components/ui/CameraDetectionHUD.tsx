import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { CameraAlertState } from '../../game/interfaces/types';
import { RootState } from '../../store';

type AlertIntent = 'idle' | 'suspicious' | 'alarmed' | 'disabled';

interface AlertTokens {
  label: string;
  intent: AlertIntent;
}

const getAlertTokens = (alertState: CameraAlertState): AlertTokens => {
  switch (alertState) {
    case CameraAlertState.ALARMED:
      return { label: 'ALARMED', intent: 'alarmed' };
    case CameraAlertState.SUSPICIOUS:
      return { label: 'SUSPICIOUS', intent: 'suspicious' };
    case CameraAlertState.DISABLED:
      return { label: 'DISABLED', intent: 'disabled' };
    case CameraAlertState.IDLE:
    default:
      return { label: 'SPY ACTIVITY', intent: 'idle' };
  }
};

const styles = `
  .camera-wafer {
    --accent: rgba(60, 199, 255, 0.75);
    --accent-border: rgba(56, 189, 248, 0.42);
    --accent-shadow: rgba(56, 189, 248, 0.32);
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 14.5rem;
    padding: 0.55rem 0.85rem;
    width: 14.5rem;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(14, 19, 31, 0.96), rgba(17, 24, 39, 0.84));
    border: 1px solid var(--accent-border);
    box-shadow: 0 16px 28px rgba(8, 12, 20, 0.52);
    color: #e2e8f0;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-family: 'DM Mono', 'IBM Plex Mono', monospace;
    pointer-events: none;
    overflow: hidden;
  }

  .camera-wafer::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, rgba(56, 189, 248, 0.12), transparent 42%);
    opacity: 0.45;
    mix-blend-mode: screen;
    pointer-events: none;
  }

  .camera-wafer[data-alert="suspicious"] {
    --accent: rgba(251, 191, 36, 0.82);
    --accent-border: rgba(251, 191, 36, 0.4);
    --accent-shadow: rgba(251, 191, 36, 0.28);
    --accent-spark: rgba(251, 191, 36, 0.6);
  }

  .camera-wafer[data-alert="alarmed"] {
    --accent: rgba(239, 68, 68, 0.78);
    --accent-border: rgba(239, 68, 68, 0.5);
    --accent-shadow: rgba(239, 68, 68, 0.32);
    --accent-spark: rgba(239, 68, 68, 0.64);
  }

  .camera-wafer[data-alert="disabled"] {
    --accent: rgba(148, 163, 184, 0.55);
    --accent-border: rgba(148, 163, 184, 0.35);
    --accent-shadow: rgba(148, 163, 184, 0.24);
    --accent-spark: rgba(148, 163, 184, 0.42);
  }

  .camera-wafer[data-overlay="true"] {
    box-shadow: 0 16px 30px rgba(11, 25, 45, 0.58), 0 0 18px var(--accent-shadow);
  }

  .camera-wafer__icon {
    position: relative;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.7rem;
    background: linear-gradient(140deg, rgba(28, 37, 56, 0.92), rgba(16, 24, 38, 0.86));
    box-shadow: inset 0 0 14px rgba(8, 14, 24, 0.8), 0 0 18px var(--accent-shadow);
  }

  .camera-wafer__icon::before,
  .camera-wafer__icon::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
  }

  .camera-wafer__icon::before {
    border: 1px solid rgba(226, 232, 240, 0.08);
  }

  .camera-wafer__icon::after {
    inset: 0.35rem;
    border-radius: 0.45rem;
    background: radial-gradient(circle at 48% 48%, var(--accent) 0%, rgba(12, 14, 22, 0.75) 72%);
    box-shadow: 0 0 22px var(--accent-shadow);
    opacity: 0.85;
  }

  .camera-wafer__pulse {
    position: absolute;
    inset: 0.3rem;
    border-radius: 0.5rem;
    border: 1px solid var(--accent);
    opacity: 0.35;
    animation: wafer-pulse 1800ms ease-in-out infinite;
  }

  .camera-wafer[data-alert="alarmed"] .camera-wafer__pulse {
    animation-duration: 950ms;
  }

  .camera-wafer[data-alert="suspicious"] .camera-wafer__pulse {
    animation-duration: 1400ms;
  }

  .camera-wafer__glyph {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    color: rgba(226, 232, 240, 0.58);
    letter-spacing: 0.3em;
  }

  @keyframes wafer-pulse {
    0% { transform: scale(0.94); opacity: 0.2; }
    40% { transform: scale(1); opacity: 0.45; }
    100% { transform: scale(1.08); opacity: 0; }
  }

  .camera-wafer__body {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    flex: 1 1 auto;
    min-width: 0;
  }

  .camera-wafer__headline {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    position: relative;
    padding-bottom: 0.15rem;
  }

  .camera-wafer__headline::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2px;
    background: linear-gradient(90deg, rgba(239, 181, 64, 0.6), rgba(249, 189, 88, 0.3));
    opacity: 0;
    transform: scaleX(0.68);
    transform-origin: left;
    transition: opacity 140ms ease, transform 160ms ease;
  }

  .camera-wafer[data-network="true"] .camera-wafer__headline::after {
    opacity: 1;
    transform: scaleX(1);
  }

  .camera-wafer__label {
    font-size: 0.74rem;
    color: rgba(226, 232, 240, 0.82);
  }

  .camera-wafer__exposure {
    display: flex;
    align-items: center;
    gap: 0.55rem;
  }

  .camera-wafer__track {
    position: relative;
    flex: 1 1 auto;
    height: 6px;
    border-radius: 999px;
    background: rgba(12, 18, 30, 0.92);
    border: 1px solid rgba(59, 73, 99, 0.4);
    overflow: hidden;
  }

  .camera-wafer__fill {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0;
    border-radius: inherit;
    background: var(--accent);
    box-shadow: 0 0 14px var(--accent-shadow);
    transition: width 160ms ease-out, background 180ms ease-out, box-shadow 180ms ease-out;
  }

  .camera-wafer__track::after {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      90deg,
      rgba(148, 163, 184, 0.08) 0 8px,
      transparent 8px 16px
    );
    mix-blend-mode: screen;
    opacity: 0.35;
    pointer-events: none;
  }

  @media (max-width: 1080px) {
    .camera-wafer {
      min-width: 12rem;
      width: auto;
    }
  }
`;

const CameraDetectionHUD: React.FC = () => {
  const hud = useSelector((state: RootState) => state.surveillance.hud);
  const zoneHasCameras = useSelector((state: RootState) => {
    const areaId = state.world.currentMapArea?.id;
    if (!areaId) {
      return false;
    }
    const zone = state.surveillance.zones[areaId];
    return zone ? Object.keys(zone.cameras).length > 0 : false;
  });

  const shouldDisplay = zoneHasCameras
    || hud.detectionProgress > 0
    || hud.networkAlertActive
    || hud.overlayEnabled;

  const progress = useMemo(
    () => Math.min(100, Math.max(0, hud.detectionProgress)),
    [hud.detectionProgress],
  );
  const progressPercent = useMemo(() => Math.round(progress), [progress]);
  const alertTokens = useMemo(() => getAlertTokens(hud.alertState), [hud.alertState]);

  const stateLabel = alertTokens.intent === 'idle'
    ? 'spy activity idle state'
    : `${alertTokens.label.toLowerCase()} state`;
  const overlayStateLabel = hud.overlayEnabled ? 'surveillance cones visible' : 'surveillance cones hidden';
  const networkLabel = hud.networkAlertActive ? 'network alert active. ' : '';
  const ariaLabel = `${stateLabel}. ${networkLabel}Exposure ${progressPercent} percent. ${overlayStateLabel}.`;

  if (!shouldDisplay) {
    return null;
  }

  return (
    <>
      <style>{styles}</style>
      <div
        className="camera-wafer"
        role="status"
        aria-live="polite"
        aria-label={ariaLabel}
        data-alert={alertTokens.intent}
        data-network={hud.networkAlertActive || undefined}
        data-overlay={hud.overlayEnabled || undefined}
        data-testid="camera-detection-hud"
      >
        <div className="camera-wafer__icon" aria-hidden>
          <span className="camera-wafer__pulse" aria-hidden />
          <span className="camera-wafer__glyph" aria-hidden>
            ◉
          </span>
        </div>
        <div className="camera-wafer__body">
          <div className="camera-wafer__headline" aria-hidden>
            <span className="camera-wafer__label">{alertTokens.label}</span>
          </div>
          <div className="camera-wafer__exposure" aria-hidden>
            <div className="camera-wafer__track">
              <div
                className="camera-wafer__fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CameraDetectionHUD;
