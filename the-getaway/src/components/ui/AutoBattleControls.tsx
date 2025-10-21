import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUIStrings } from '../../content/ui';
import { RootState, AppDispatch } from '../../store';
import { setAutoBattleEnabled, setAutoBattleProfile } from '../../store/settingsSlice';
import { AUTO_BATTLE_PROFILE_IDS } from '../../game/combat/automation/autoBattleProfiles';
import type { AutoBattleProfileId } from '../../game/combat/automation/autoBattleProfiles';
import type { AutoBattlePauseReason, AutoBattleStatus } from '../../store/autoBattleSlice';
import AutoBattleProfileSelect from './AutoBattleProfileSelect';

const panelStyle: React.CSSProperties = {
  minWidth: '240px',
  maxWidth: '300px',
  padding: '1rem 1.1rem',
  borderRadius: '14px',
  background: 'linear-gradient(160deg, rgba(15,23,42,0.94), rgba(15,23,42,0.82))',
  border: '1px solid rgba(56,189,248,0.28)',
  boxShadow: '0 18px 34px rgba(15,23,42,0.45)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  pointerEvents: 'auto',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: '#38bdf8',
  fontWeight: 600,
};

const statusBadgeStyle = (status: AutoBattleStatus): React.CSSProperties => {
  const palette =
    status === 'running'
      ? { bg: 'rgba(34,197,94,0.16)', border: 'rgba(34,197,94,0.45)', text: '#34d399' }
      : status === 'paused'
      ? { bg: 'rgba(249,115,22,0.16)', border: 'rgba(249,115,22,0.4)', text: '#f97316' }
      : { bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.35)', text: '#94a3b8' };

  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.3rem 0.55rem',
    borderRadius: '999px',
    background: palette.bg,
    border: `1px solid ${palette.border}`,
    color: palette.text,
    fontSize: '0.7rem',
  };
};

const hintStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  color: '#64748b',
  lineHeight: 1.5,
};

const AutoBattleControls: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const locale = useSelector((state: RootState) => state.settings.locale);
  const autoBattleEnabled = useSelector(
    (state: RootState) => state.settings.autoBattleEnabled
  );
  const autoBattleProfile = useSelector(
    (state: RootState) => state.settings.autoBattleProfile
  );
  const inCombat = useSelector((state: RootState) => state.world.inCombat);
  const autoBattleState = useSelector((state: RootState) => state.autoBattle);

  const strings = getUIStrings(locale).autoBattle;
  const profileOptions = useMemo(
    () =>
      AUTO_BATTLE_PROFILE_IDS.map((profileId) => ({
        id: profileId,
        name: strings.profiles[profileId].name,
        summary: strings.profiles[profileId].summary,
      })),
    [strings]
  );

  const mapPauseReason = (reason: AutoBattlePauseReason | null): string | null => {
    if (!reason) {
      return null;
    }
    const table: Record<AutoBattlePauseReason, keyof typeof strings.hudPauseReasons> = {
      manual_input: 'manualInput',
      dialogue: 'dialogue',
      objective: 'objective',
      resources: 'resources',
      ap: 'ap',
      settings: 'none',
    };
    const key = table[reason];
    return strings.hudPauseReasons[key] ?? null;
  };

  const status = autoBattleState.status;
  const reasonLabel = mapPauseReason(autoBattleState.reason);
  let statusText: string;

  if (status === 'running') {
    statusText = strings.hudStatusEngaged;
  } else if (status === 'paused') {
    statusText = reasonLabel ? `${strings.hudStatusPaused} · ${reasonLabel}` : strings.hudStatusPaused;
  } else {
    statusText = strings.hudStatusIdle;
  }

  if (!autoBattleEnabled) {
    statusText = `${strings.hudStatusIdle} · ${strings.hudPauseReasons.none}`;
  } else if (!inCombat && status === 'running') {
    statusText = `${strings.hudStatusIdle} · ${strings.hudPauseReasons.none}`;
  }

  const handleToggle = () => {
    dispatch(setAutoBattleEnabled(!autoBattleEnabled));
  };

  const handleProfileChange = (nextProfile: AutoBattleProfileId) => {
    if (nextProfile === autoBattleProfile) {
      return;
    }
    dispatch(setAutoBattleProfile(nextProfile));
  };

  return (
    <div style={panelStyle} data-controller-focus-ignore="true">
      <span style={labelStyle}>{strings.hudTitle}</span>

      <div style={statusBadgeStyle(autoBattleEnabled ? status : 'idle')}>
        <span style={{ fontSize: '0.55rem' }}>●</span>
        <span>{statusText}</span>
      </div>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.55rem',
          padding: '0.45rem 0.6rem',
          borderRadius: '8px',
          backgroundColor: 'rgba(15,23,42,0.75)',
          border: '1px solid rgba(148,163,184,0.25)',
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={autoBattleEnabled}
          onChange={handleToggle}
          style={{
            width: '18px',
            height: '18px',
            cursor: 'pointer',
            accentColor: '#38bdf8',
          }}
        />
        <span style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>{strings.toggleLabel}</span>
      </label>

      <div>
        <label
          htmlFor="hud-autobattle-profile"
          style={{ fontSize: '0.68rem', color: '#9eaec6', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}
        >
          {strings.profileLabel}
        </label>
        <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
          {strings.profileDescription}
        </div>
        <AutoBattleProfileSelect
          value={autoBattleProfile}
          onChange={handleProfileChange}
          options={profileOptions}
          variant="hud"
          dataFocusIgnore
          fullWidth
          triggerId="hud-autobattle-profile"
        />
        <div style={{ marginTop: '0.6rem', fontSize: '0.76rem', color: '#a5b4d5', lineHeight: 1.45 }}>
          {strings.profiles[autoBattleProfile].summary}
        </div>
      </div>

      <div style={hintStyle}>
        <div>{strings.hudToggleHint}</div>
        <div>{strings.hudProfileCycleHint}</div>
      </div>

      {autoBattleState.lastDecision && (
        <div
          style={{
            marginTop: '0.2rem',
            padding: '0.45rem 0.55rem',
            borderRadius: '8px',
            background: 'rgba(15,23,42,0.6)',
            border: '1px solid rgba(148,163,184,0.2)',
            fontSize: '0.7rem',
            color: '#94a3b8',
            lineHeight: 1.4,
          }}
        >
          <div style={{ color: '#e2e8f0' }}>
            {strings.profiles[autoBattleState.lastDecision.profileId].name}
          </div>
          <div>
            {autoBattleState.lastDecision.action}
            {autoBattleState.lastDecision.targetName
              ? ` · ${autoBattleState.lastDecision.targetName}`
              : ''}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoBattleControls;
