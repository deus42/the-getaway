import React, { CSSProperties, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CameraAlertState } from '../../game/interfaces/types';
import { RootState } from '../../store';
import { setOverlayEnabled } from '../../store/surveillanceSlice';

const containerStyle: CSSProperties = {
  position: 'relative',
  width: 'min(18.5rem, 46vw)',
  minWidth: '16.5rem',
  padding: '1rem 1.1rem 1.1rem',
  borderRadius: '14px',
  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.82))',
  border: '1px solid rgba(148, 163, 184, 0.35)',
  boxShadow: '0 20px 38px rgba(15, 23, 42, 0.5)',
  color: '#e2e8f0',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  pointerEvents: 'auto',
  backdropFilter: 'blur(6px)',
};

const headerRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  alignItems: 'center',
  gap: '0.75rem',
};

const titleStackStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '0.35rem',
};

const titleLabelStyle: CSSProperties = {
  fontSize: '0.78rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: '#60a5fa',
};

const badgeGroupStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.35rem',
};

const countStackStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '0.1rem',
  lineHeight: 1.05,
};

const countStyle: CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 700,
  color: '#f8fafc',
  letterSpacing: '0.08em',
};

const countCaptionStyle: CSSProperties = {
  fontSize: '0.68rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: '#94a3b8',
};

const progressSectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.45rem',
};

const progressTrackStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '0.55rem',
  borderRadius: '999px',
  background: 'rgba(15, 23, 42, 0.65)',
  overflow: 'hidden',
  border: '1px solid rgba(59, 130, 246, 0.25)',
};

const progressFillBaseStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  borderRadius: '999px',
  transition: 'width 140ms ease',
};

const progressMetaStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.72rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#94a3b8',
};

const progressValueStyle: CSSProperties = {
  fontWeight: 600,
  color: '#f8fafc',
};

const footerRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '0.65rem',
  flexWrap: 'wrap',
};

const crouchStatusStyle: CSSProperties = {
  fontSize: '0.68rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: '#cbd5f5',
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
};

const toggleButtonStyle: CSSProperties = {
  fontSize: '0.68rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: '#38bdf8',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '0.25rem 0',
  transition: 'opacity 0.2s ease',
};

const badgeBaseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.25rem',
  padding: '0.22rem 0.65rem',
  borderRadius: '999px',
  fontSize: '0.66rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
};

const networkBadgeStyle: CSSProperties = {
  ...badgeBaseStyle,
  background: 'rgba(239, 68, 68, 0.12)',
  border: '1px solid rgba(239, 68, 68, 0.45)',
  color: '#f87171',
};

const getAlertBadgeTokens = (alertState: CameraAlertState) => {
  switch (alertState) {
    case CameraAlertState.ALARMED:
      return {
        label: 'Alarmed',
        background: 'rgba(239, 68, 68, 0.12)',
        border: '1px solid rgba(239, 68, 68, 0.45)',
        color: '#fca5a5',
      };
    case CameraAlertState.SUSPICIOUS:
      return {
        label: 'Suspicious',
        background: 'rgba(251, 191, 36, 0.14)',
        border: '1px solid rgba(251, 191, 36, 0.4)',
        color: '#facc15',
      };
    case CameraAlertState.IDLE:
      return {
        label: 'Idle',
        background: 'rgba(56, 189, 248, 0.12)',
        border: '1px solid rgba(56, 189, 248, 0.45)',
        color: '#bae6fd',
      };
    case CameraAlertState.DISABLED:
    default:
      return {
        label: 'Disabled',
        background: 'rgba(148, 163, 184, 0.12)',
        border: '1px solid rgba(148, 163, 184, 0.35)',
        color: '#e2e8f0',
      };
  }
};

const getProgressColor = (alertState: CameraAlertState): string => {
  switch (alertState) {
    case CameraAlertState.ALARMED:
      return '#ef4444';
    case CameraAlertState.SUSPICIOUS:
      return '#fbbf24';
    case CameraAlertState.IDLE:
      return '#38bdf8';
    case CameraAlertState.DISABLED:
    default:
      return '#94a3b8';
  }
};

const CameraDetectionHUD: React.FC = () => {
  const dispatch = useDispatch();
  const hud = useSelector((state: RootState) => state.surveillance.hud);
  const isCrouching = useSelector((state: RootState) => state.player.data.isCrouching);
  const zoneHasCameras = useSelector((state: RootState) => {
    const areaId = state.world.currentMapArea?.id;
    if (!areaId) {
      return false;
    }
    const zone = state.surveillance.zones[areaId];
    return zone ? Object.keys(zone.cameras).length > 0 : false;
  });

  const shouldDisplay = zoneHasCameras || hud.detectionProgress > 0 || hud.networkAlertActive || isCrouching;

  const progress = useMemo(() => Math.min(100, Math.max(0, hud.detectionProgress)), [hud.detectionProgress]);
  const progressColor = useMemo(() => getProgressColor(hud.alertState), [hud.alertState]);
  const alertTokens = useMemo(() => getAlertBadgeTokens(hud.alertState), [hud.alertState]);
  const nodeCaption = useMemo(
    () => (hud.camerasNearby === 1 ? 'Active Node' : 'Active Nodes'),
    [hud.camerasNearby],
  );

  const handleToggleOverlay = () => {
    dispatch(setOverlayEnabled({ enabled: !hud.overlayEnabled }));
  };

  if (!shouldDisplay) {
    return null;
  }

  return (
    <div style={containerStyle} data-testid="camera-detection-hud">
      <div style={headerRowStyle}>
        <div style={titleStackStyle}>
          <span style={titleLabelStyle}>Cameras Nearby</span>
          <div style={badgeGroupStyle}>
            <span
              style={{
                ...badgeBaseStyle,
                background: alertTokens.background,
                border: alertTokens.border,
                color: alertTokens.color,
              }}
            >
              {alertTokens.label}
            </span>
            {hud.networkAlertActive && (
              <span style={networkBadgeStyle}>Network Alert</span>
            )}
          </div>
        </div>
        <div style={countStackStyle}>
          <span style={countStyle}>{hud.camerasNearby}</span>
          <span style={countCaptionStyle}>{nodeCaption}</span>
        </div>
      </div>

      <div style={progressSectionStyle}>
        <div style={progressTrackStyle} aria-hidden="true">
          <div
            style={{
              ...progressFillBaseStyle,
              width: `${progress}%`,
              background: progressColor,
            }}
          />
        </div>
        <div style={progressMetaStyle}>
          <span>Exposure</span>
          <span style={progressValueStyle}>{Math.round(progress)}%</span>
        </div>
      </div>

      <div style={footerRowStyle}>
        <span style={crouchStatusStyle}>
          {isCrouching ? 'Crouching · X to Stand' : 'Standing · X to Crouch'}
        </span>
        <button
          type="button"
          style={toggleButtonStyle}
          onClick={handleToggleOverlay}
          aria-pressed={hud.overlayEnabled}
        >
          {hud.overlayEnabled ? 'Hide Cones' : 'Show Cones'} · TAB
        </button>
      </div>
    </div>
  );
};

export default CameraDetectionHUD;
