import React, {
  CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getUIStrings } from '../../content/ui';
import {
  DEFAULT_DAY_NIGHT_CONFIG,
  getPhaseTimingInfo,
  getSecondsUntilCycleReset,
} from '../../game/world/dayNightCycle';
import {
  selectMissionPendingAdvance,
  selectMissionProgress,
} from '../../store/selectors/missionSelectors';
import { showMissionAdvancePrompt } from '../../store/missionSlice';
import AnimatedStatBar from './AnimatedStatBar';
import { CameraAlertState } from '../../game/interfaces/types';
import { setOverlayEnabled } from '../../store/surveillanceSlice';

const consoleContainerStyle: CSSProperties = {
  position: 'relative',
  width: 'min(20rem, 48vw)',
  minWidth: '17rem',
  borderRadius: '16px',
  padding: '1.1rem 1.15rem',
  background:
    'linear-gradient(140deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.82))',
  border: '1px solid rgba(148, 163, 184, 0.38)',
  boxShadow: '0 26px 48px rgba(15, 23, 42, 0.55)',
  color: '#f8fafc',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.85rem',
  pointerEvents: 'auto',
  backdropFilter: 'blur(7px)',
  transition: 'opacity 220ms ease, transform 220ms ease',
};

const consoleHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  textTransform: 'uppercase',
  fontSize: '0.66rem',
  letterSpacing: '0.32em',
  color: '#94a3b8',
};

const sectionBaseStyle: CSSProperties = {
  position: 'relative',
  borderRadius: '12px',
  padding: '0.85rem',
  background: 'linear-gradient(160deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.65))',
  border: '1px solid rgba(148, 163, 184, 0.32)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
};

const sectionHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '0.74rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
};

const labelMutedStyle: CSSProperties = {
  fontSize: '0.68rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'rgba(148, 163, 184, 0.88)',
};

const pillBaseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.35rem',
  padding: '0.24rem 0.6rem',
  borderRadius: '999px',
  fontSize: '0.64rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
};

const hazardChipStyle: CSSProperties = {
  ...pillBaseStyle,
  background: 'rgba(59, 130, 246, 0.16)',
  border: '1px solid rgba(59, 130, 246, 0.4)',
  color: '#bae6fd',
};

const objectiveChipStyle: CSSProperties = {
  ...pillBaseStyle,
  background: 'rgba(94, 234, 212, 0.14)',
  border: '1px solid rgba(94, 234, 212, 0.38)',
  color: '#99f6e4',
};

const dangerLevels: Record<string, { background: string; border: string; text: string }> = {
  low: {
    background: 'rgba(34, 197, 94, 0.18)',
    border: 'rgba(34, 197, 94, 0.45)',
    text: '#bbf7d0',
  },
  moderate: {
    background: 'rgba(249, 115, 22, 0.18)',
    border: 'rgba(249, 115, 22, 0.5)',
    text: '#fed7aa',
  },
  high: {
    background: 'rgba(250, 204, 21, 0.16)',
    border: 'rgba(250, 204, 21, 0.5)',
    text: '#fef08a',
  },
  critical: {
    background: 'rgba(239, 68, 68, 0.18)',
    border: 'rgba(239, 68, 68, 0.5)',
    text: '#fecaca',
  },
};

const progressTrackStyle: CSSProperties = {
  width: '100%',
  height: '0.5rem',
  borderRadius: '999px',
  background: 'rgba(15, 23, 42, 0.6)',
  overflow: 'hidden',
  border: '1px solid rgba(59, 130, 246, 0.28)',
  position: 'relative',
};

const progressFillStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  borderRadius: '999px',
  transition: 'width 160ms ease',
};

const surveillanceBadgeTokens = (state: CameraAlertState) => {
  switch (state) {
    case CameraAlertState.ALARMED:
      return {
        label: 'Alarmed',
        background: 'rgba(239, 68, 68, 0.14)',
        border: '1px solid rgba(239, 68, 68, 0.45)',
        color: '#fca5a5',
        glow: '0 0 22px rgba(239, 68, 68, 0.45)',
      };
    case CameraAlertState.SUSPICIOUS:
      return {
        label: 'Suspicious',
        background: 'rgba(251, 191, 36, 0.14)',
        border: '1px solid rgba(251, 191, 36, 0.4)',
        color: '#facc15',
        glow: '0 0 18px rgba(251, 191, 36, 0.3)',
      };
    case CameraAlertState.IDLE:
      return {
        label: 'Idle',
        background: 'rgba(56, 189, 248, 0.14)',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        color: '#bae6fd',
        glow: '0 0 12px rgba(56, 189, 248, 0.25)',
      };
    case CameraAlertState.DISABLED:
    default:
      return {
        label: 'Disabled',
        background: 'rgba(148, 163, 184, 0.16)',
        border: '1px solid rgba(148, 163, 184, 0.32)',
        color: '#e2e8f0',
        glow: '0 0 0 rgba(0, 0, 0, 0)',
      };
  }
};

const getProgressColor = (state: CameraAlertState) => {
  switch (state) {
    case CameraAlertState.ALARMED:
      return 'linear-gradient(90deg, rgba(239, 68, 68, 0.9), rgba(248, 113, 113, 0.9))';
    case CameraAlertState.SUSPICIOUS:
      return 'linear-gradient(90deg, rgba(251, 191, 36, 0.85), rgba(250, 204, 21, 0.9))';
    case CameraAlertState.IDLE:
      return 'linear-gradient(90deg, rgba(56, 189, 248, 0.8), rgba(59, 130, 246, 0.9))';
    case CameraAlertState.DISABLED:
    default:
      return 'linear-gradient(90deg, rgba(148, 163, 184, 0.7), rgba(148, 163, 184, 0.85))';
  }
};

const enemySummaryStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '0.68rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#cbd5f5',
};

const alertButtonStyle: CSSProperties = {
  padding: '0.32rem 0.75rem',
  borderRadius: '999px',
  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.22), rgba(59, 130, 246, 0.34))',
  border: '1px solid rgba(56, 189, 248, 0.45)',
  color: '#e0f2fe',
  fontSize: '0.64rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  cursor: 'pointer',
};

const missionButtonStyle: CSSProperties = {
  padding: '0.32rem 0.75rem',
  borderRadius: '999px',
  background: 'linear-gradient(135deg, rgba(94, 234, 212, 0.2), rgba(45, 212, 191, 0.34))',
  border: '1px solid rgba(94, 234, 212, 0.45)',
  color: '#ccfbf1',
  fontSize: '0.64rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  cursor: 'pointer',
};

const CommandStatusConsole: React.FC = () => {
  const dispatch = useDispatch();
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);

  const missionProgress = useSelector(selectMissionProgress);
  const missionAdvancePending = useSelector(selectMissionPendingAdvance);

  const world = useSelector((state: RootState) => state.world);
  const player = useSelector((state: RootState) => state.player.data);
  const surveillanceHud = useSelector((state: RootState) => state.surveillance.hud);
  const surveillanceZone = useSelector((state: RootState) => {
    const areaId = state.world.currentMapArea?.id;
    if (!areaId) {
      return undefined;
    }
    return state.surveillance.zones[areaId];
  });

  const phaseTiming = useMemo(
    () => getPhaseTimingInfo(world.currentTime, DEFAULT_DAY_NIGHT_CONFIG),
    [world.currentTime],
  );

  const cycleResetSeconds = useMemo(
    () => getSecondsUntilCycleReset(world.currentTime, DEFAULT_DAY_NIGHT_CONFIG),
    [world.currentTime],
  );

  const zoneName = useMemo(() => {
    return (
      world.currentMapArea?.displayName ??
      world.currentMapArea?.name ??
      missionProgress?.name ??
      uiStrings.levelIndicator.unknownLevel
    );
  }, [world.currentMapArea?.displayName, world.currentMapArea?.name, missionProgress?.name, uiStrings.levelIndicator.unknownLevel]);

  const zoneSummary = world.currentMapArea?.summary;
  const hazards = useMemo(
    () => (world.currentMapArea?.hazards ?? []).filter((entry) => entry && entry.trim().length > 0),
    [world.currentMapArea?.hazards],
  );
  const directives = useMemo(
    () => (world.currentMapArea?.objectives ?? []).filter((entry) => entry && entry.trim().length > 0),
    [world.currentMapArea?.objectives],
  );

  const dayNightStrings = uiStrings.dayNight;
  const levelStrings = uiStrings.levelIndicator;

  const dayPhaseLabel = dayNightStrings.timeOfDay[world.timeOfDay];
  const nextPhaseLabel = dayNightStrings.timeOfDay[phaseTiming.nextPhase];
  const phaseCountdown = `${Math.max(0, Math.floor(phaseTiming.secondsUntilNextPhase / 60))
    .toString()
    .padStart(2, '0')}:${Math.max(0, phaseTiming.secondsUntilNextPhase % 60)
    .toString()
    .padStart(2, '0')}`;
  const cycleResetCountdown = `${Math.max(0, Math.floor(cycleResetSeconds / 60))
    .toString()
    .padStart(2, '0')}:${Math.max(0, cycleResetSeconds % 60)
    .toString()
    .padStart(2, '0')}`;

  const surveillanceCameraCount = useMemo(() => {
    if (!surveillanceZone) {
      return 0;
    }
    return Object.keys(surveillanceZone.cameras).length;
  }, [surveillanceZone]);

  const exposure = Math.max(0, Math.min(100, surveillanceHud.detectionProgress));
  const exposureLabel = `${Math.round(exposure)}%`;

  const hostileCount = world.currentMapArea?.entities?.enemies?.length ?? 0;

  const inCombat = world.inCombat;
  const turnLabel = inCombat ? (world.isPlayerTurn ? 'Player Turn' : 'Enemy Turn') : 'Exploration';

  const shouldShowSurveillance =
    surveillanceCameraCount > 0 ||
    exposure > 0 ||
    surveillanceHud.networkAlertActive ||
    surveillanceHud.alertState !== CameraAlertState.DISABLED;

  const shouldShowTurn = inCombat || hostileCount > 0;

  const [isHovered, setIsHovered] = useState(false);
  const [autoHidden, setAutoHidden] = useState(false);
  const hideTimerRef = useRef<number | null>(null);

  const hasHighPriorityAlert =
    surveillanceHud.networkAlertActive ||
    surveillanceHud.alertState === CameraAlertState.ALARMED ||
    inCombat ||
    world.curfewActive ||
    missionAdvancePending;

  const resetHideTimer = () => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (hasHighPriorityAlert || isHovered) {
      resetHideTimer();
      setAutoHidden(false);
      return;
    }

    resetHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setAutoHidden(true);
    }, 6000);

    return () => {
      resetHideTimer();
    };
  }, [
    hasHighPriorityAlert,
    isHovered,
    exposure,
    surveillanceHud.overlayEnabled,
    surveillanceHud.camerasNearby,
    world.curfewActive,
    inCombat,
  ]);

  useEffect(() => {
    setAutoHidden(false);
  }, [
    exposure,
    surveillanceHud.alertState,
    surveillanceHud.networkAlertActive,
    missionAdvancePending,
    world.curfewActive,
    inCombat,
  ]);

  useEffect(() => {
    if (!autoHidden) {
      return;
    }

    const handlePointerMove = () => {
      setAutoHidden(false);
    };

    window.addEventListener('pointermove', handlePointerMove, { once: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [autoHidden]);

  useEffect(() => {
    return () => {
      resetHideTimer();
    };
  }, []);

  const handleMissionAdvance = () => {
    dispatch(showMissionAdvancePrompt());
  };

  const handleToggleCones = () => {
    dispatch(setOverlayEnabled({ enabled: !surveillanceHud.overlayEnabled }));
  };

  const consoleStyle: CSSProperties = {
    ...consoleContainerStyle,
    opacity: autoHidden ? 0 : 1,
    transform: autoHidden ? 'translateY(-10px)' : 'translateY(0)',
    pointerEvents: autoHidden ? 'none' : 'auto',
  };

  return (
    <div
      style={consoleStyle}
      onMouseEnter={() => {
        setIsHovered(true);
        setAutoHidden(false);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
      onFocus={() => {
        setIsHovered(true);
        setAutoHidden(false);
      }}
      onBlur={() => {
        setIsHovered(false);
      }}
    >
      <div style={consoleHeaderStyle}>
        <span>{uiStrings.shell.reconLabel}</span>
        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div style={sectionBaseStyle}>
        <div style={sectionHeaderStyle}>
          <span>{uiStrings.levelIndicator.reconSectionTitle ?? 'Environment'}</span>
          {world.curfewActive ? (
            <span
              style={{
                ...pillBaseStyle,
                background: 'rgba(239, 68, 68, 0.14)',
                border: '1px solid rgba(239, 68, 68, 0.45)',
                color: '#fecaca',
                boxShadow: '0 0 18px rgba(239, 68, 68, 0.35)',
                animation: 'curfewOrbit 1.8s infinite',
              }}
            >
              Curfew Active
            </span>
          ) : (
            <span
              style={{
                ...pillBaseStyle,
                background: 'rgba(34, 197, 94, 0.16)',
                border: '1px solid rgba(34, 197, 94, 0.35)',
                color: '#bbf7d0',
              }}
            >
              Safe Transit
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 600, letterSpacing: '0.04em' }}>
                {zoneName}
              </span>
              {zoneSummary && (
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  {zoneSummary}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
              <span style={{ ...labelMutedStyle, color: '#60a5fa' }}>
                {levelStrings.levelLabel}
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{world.currentMapArea?.level ?? missionProgress?.level ?? 0}</span>
            </div>
          </div>

          {world.currentMapArea?.dangerRating && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={labelMutedStyle}>{levelStrings.dangerLabel}</span>
              {(() => {
                const palette = dangerLevels[world.currentMapArea?.dangerRating ?? ''] ?? dangerLevels.moderate;
                const label = levelStrings.dangerLevels[world.currentMapArea?.dangerRating ?? 'moderate'] ?? world.currentMapArea?.dangerRating;
                return (
                  <span
                    style={{
                      ...pillBaseStyle,
                      background: palette.background,
                      border: `1px solid ${palette.border}`,
                      color: palette.text,
                    }}
                  >
                    {label}
                  </span>
                );
              })()}
            </div>
          )}

          {(hazards.length > 0 || directives.length > 0) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {hazards.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {hazards.slice(0, 2).map((hazard) => (
                    <span key={hazard} style={hazardChipStyle}>
                      {hazard}
                    </span>
                  ))}
                  {hazards.length > 2 && (
                    <span style={{ ...hazardChipStyle, opacity: 0.75 }}>
                      +{hazards.length - 2}
                    </span>
                  )}
                </div>
              )}
              {directives.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {directives.slice(0, 2).map((objective) => (
                    <span key={objective} style={objectiveChipStyle}>
                      {objective}
                    </span>
                  ))}
                  {directives.length > 2 && (
                    <span style={{ ...objectiveChipStyle, opacity: 0.75 }}>
                      +{directives.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.6rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              <span style={labelMutedStyle}>{dayNightStrings.phaseLabel}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{dayPhaseLabel}</span>
              <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
                {dayNightStrings.nextIn(phaseCountdown)} · {nextPhaseLabel}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', alignItems: 'flex-end' }}>
              <span style={labelMutedStyle}>{dayNightStrings.resetLabel}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{cycleResetCountdown}</span>
              {missionAdvancePending && (
                <button type="button" style={missionButtonStyle} onClick={handleMissionAdvance}>
                  Advance Mission
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {shouldShowSurveillance && (
        <div
          style={{
            ...sectionBaseStyle,
            gap: '0.7rem',
          }}
        >
          <div style={sectionHeaderStyle}>
            <span>Surveillance</span>
            <span
              style={{
                ...pillBaseStyle,
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.36)',
                color: '#bfdbfe',
              }}
            >
              {surveillanceCameraCount} Nodes
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.65rem' }}>
            {(() => {
              const badge = surveillanceBadgeTokens(surveillanceHud.alertState);
              return (
                <span
                  style={{
                    ...pillBaseStyle,
                    background: badge.background,
                    border: badge.border,
                    color: badge.color,
                    boxShadow: badge.glow,
                    transition: 'box-shadow 200ms ease',
                  }}
                >
                  {badge.label}
                </span>
              );
            })()}
            {surveillanceHud.networkAlertActive && (
              <span
                style={{
                  ...pillBaseStyle,
                  background: 'rgba(239, 68, 68, 0.14)',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  color: '#fca5a5',
                  animation: 'alertGlow 1.6s infinite',
                }}
              >
                Network Alert
              </span>
            )}
            <button
              type="button"
              style={alertButtonStyle}
              onClick={handleToggleCones}
              aria-pressed={surveillanceHud.overlayEnabled}
              title="Toggle camera cones (Tab)"
            >
              {surveillanceHud.overlayEnabled ? 'Hide Cones' : 'Show Cones'}
            </button>
          </div>
          <div>
            <div style={progressTrackStyle} aria-hidden="true">
              <div
                style={{
                  ...progressFillStyle,
                  width: `${exposure}%`,
                  background: getProgressColor(surveillanceHud.alertState),
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.35rem',
                fontSize: '0.68rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#cbd5f5',
              }}
            >
              <span>Exposure</span>
              <span style={{ fontWeight: 600 }}>{exposureLabel}</span>
            </div>
          </div>
        </div>
      )}

      {shouldShowTurn && (
        <div
          style={{
            ...sectionBaseStyle,
            gap: '0.75rem',
          }}
        >
          <div style={sectionHeaderStyle}>
            <span>Engagement</span>
            <span
              style={{
                ...pillBaseStyle,
                background: inCombat ? 'rgba(56, 189, 248, 0.16)' : 'rgba(148, 163, 184, 0.16)',
                border: `1px solid ${inCombat ? 'rgba(56, 189, 248, 0.35)' : 'rgba(148, 163, 184, 0.32)'}`,
                color: inCombat ? '#bae6fd' : '#e2e8f0',
                transform: inCombat ? 'scale(1.04)' : 'scale(1)',
                transition: 'transform 160ms ease',
              }}
            >
              {turnLabel}
            </span>
          </div>
          <AnimatedStatBar
            label="Action Points"
            current={player.actionPoints}
            max={player.maxActionPoints}
            icon="⚡"
            baseColor="#38bdf8"
            lowThreshold={40}
            criticalThreshold={20}
          />
          {inCombat && (
            <div style={enemySummaryStyle}>
              <span>Hostiles</span>
              <span style={{ fontWeight: 600 }}>{hostileCount}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommandStatusConsole;
