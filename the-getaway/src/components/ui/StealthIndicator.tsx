import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  selectActiveDialogueId,
  selectStealthReadability,
} from "../../store/selectors/engagementSelectors";
import { getUIStrings } from "../../content/ui";

const styles = `
  .stealth-wafer {
    --accent: rgba(45, 212, 191, 0.78);
    --accent-border: rgba(45, 212, 191, 0.45);
    --accent-shadow: rgba(13, 148, 136, 0.38);
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.55rem 0.9rem;
    min-width: 14.5rem;
    width: 14.5rem;
    border-radius: 12px;
    background: linear-gradient(140deg, rgba(11, 20, 29, 0.92), rgba(7, 14, 22, 0.88));
    border: 1px solid var(--accent-border);
    box-shadow: 0 18px 32px rgba(8, 15, 27, 0.48);
    color: #e2e8f0;
    font-family: 'DM Mono', 'IBM Plex Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 0.14em;
  }

  .stealth-wafer__icon {
    width: 2.2rem;
    height: 2.2rem;
    border-radius: 0.7rem;
    background: linear-gradient(135deg, rgba(12, 23, 32, 0.88), rgba(8, 16, 26, 0.86));
    position: relative;
    box-shadow: inset 0 0 18px rgba(7, 16, 24, 0.85), 0 0 18px var(--accent-shadow);
  }

  .stealth-wafer__icon::before {
    content: '';
    position: absolute;
    inset: 0.35rem;
    border-radius: 0.5rem;
    background: radial-gradient(circle at 48% 52%, var(--accent) 0%, rgba(9, 19, 30, 0.8) 70%);
  }

  .stealth-wafer__icon::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    border: 1px solid rgba(148, 163, 184, 0.12);
  }

  .stealth-wafer__glyph {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    color: rgba(226, 232, 240, 0.75);
    letter-spacing: 0.24em;
  }

  .stealth-wafer__body {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
  }

  .stealth-wafer__headline {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .stealth-wafer__label {
    font-size: 0.66rem;
    color: rgba(203, 213, 225, 0.86);
  }

  .stealth-wafer__state {
    font-size: 0.6rem;
    padding: 0.15rem 0.45rem;
    border-radius: 999px;
    border: 1px solid rgba(148, 163, 184, 0.3);
    background: rgba(15, 23, 42, 0.66);
    letter-spacing: 0.18em;
  }

  .stealth-wafer__meta {
    font-size: 0.54rem;
    letter-spacing: 0.12em;
    color: rgba(148, 163, 184, 0.78);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .stealth-wafer[data-state='exposed'] {
    --accent: rgba(251, 191, 36, 0.82);
    --accent-border: rgba(251, 191, 36, 0.38);
    --accent-shadow: rgba(217, 119, 6, 0.35);
  }

  .stealth-wafer[data-state='compromised'] {
    --accent: rgba(248, 113, 113, 0.78);
    --accent-border: rgba(248, 113, 113, 0.42);
    --accent-shadow: rgba(220, 38, 38, 0.36);
  }

  .stealth-wafer[data-state='standby'] {
    --accent: rgba(148, 163, 184, 0.7);
    --accent-border: rgba(148, 163, 184, 0.35);
    --accent-shadow: rgba(99, 102, 241, 0.24);
  }
`;

const StealthIndicator: React.FC = () => {
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = useMemo(() => getUIStrings(locale), [locale]);
  const stealthStrings = uiStrings.stealthIndicator;

  const readability = useSelector(selectStealthReadability);
  const cooldownExpiresAt = readability.cooldownExpiresAt;
  const onCooldown = readability.onCooldown;
  const cooldownRemaining = onCooldown
    ? Math.max(0, cooldownExpiresAt! - Date.now())
    : 0;
  const inCombat = useSelector((state: RootState) => state.world.inCombat);
  const activeDialogueId = useSelector(selectActiveDialogueId);
  const detectionSeverity = Math.max(0, Math.min(100, readability.severity));
  const stealthActive = readability.stealthActive;

  let indicatorState = readability.state;
  let supportingText = stealthStrings.keyHint;

  if (inCombat) {
    indicatorState = "compromised";
    supportingText = stealthStrings.unavailableReasons.combat;
  } else if (activeDialogueId) {
    indicatorState = stealthActive ? "exposed" : readability.state;
    supportingText = stealthStrings.unavailableReasons.dialogue;
  } else if (stealthActive) {
    const reasonLabel = readability.reason === "camera"
      ? stealthStrings.reasonLabels.camera
      : readability.reason === "noise"
      ? stealthStrings.reasonLabels.noise
      : readability.reason === "vision"
      ? stealthStrings.reasonLabels.vision
      : null;

    supportingText = reasonLabel
      ? `${reasonLabel} · Detection ${detectionSeverity}%`
      : `Detection ${detectionSeverity}%`;
  } else if (onCooldown && cooldownRemaining > 0) {
    indicatorState = "compromised";
    supportingText = stealthStrings.cooldown(
      Math.max(1, Math.ceil(cooldownRemaining / 1000))
    );
  } else if (readability.reason === "cooldown") {
    indicatorState = "compromised";
    supportingText = stealthStrings.unavailableReasons.cooldown;
  } else {
    indicatorState = readability.state;
    supportingText = stealthStrings.keyHint;
  }

  const stateLabel = stealthStrings.states[indicatorState];

  return (
    <div className="pointer-events-none select-none">
      <style>{styles}</style>
      <div className="stealth-wafer" data-state={indicatorState}>
        <div className="stealth-wafer__icon">
          <div className="stealth-wafer__glyph">S</div>
        </div>
        <div className="stealth-wafer__body">
          <div className="stealth-wafer__headline">
            <span className="stealth-wafer__label">{stealthStrings.label}</span>
            <span className="stealth-wafer__state">{stateLabel}</span>
          </div>
          <div className="stealth-wafer__meta">{supportingText}</div>
        </div>
      </div>
    </div>
  );
};

export default StealthIndicator;
