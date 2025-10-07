import React, { CSSProperties, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CameraAlertState } from '../../game/interfaces/types';
import { RootState } from '../../store';
import { setOverlayEnabled } from '../../store/surveillanceSlice';

const containerStyle: CSSProperties = {
  position: 'absolute',
  top: '1.25rem',
  right: '1.25rem',
  minWidth: '16rem',
  padding: '0.85rem 1rem 0.9rem 1rem',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.82))',
  border: '1px solid rgba(148, 163, 184, 0.35)',
  boxShadow: '0 18px 36px rgba(15, 23, 42, 0.48)',
  color: '#e2e8f0',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
  zIndex: 8,
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.85rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#60a5fa',
};

const countStyle: CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 700,
  color: '#f8fafc',
};

const progressWrapperStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.65rem',
};

const progressBarStyle: CSSProperties = {
  position: 'relative',
  flex: 1,
  height: '0.6rem',
  borderRadius: '999px',
  background: 'rgba(15, 23, 42, 0.6)',
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

const progressLabelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  minWidth: '3.2rem',
  textAlign: 'right',
  letterSpacing: '0.06em',
};

const toggleButtonStyle: CSSProperties = {
  alignSelf: 'flex-end',
  fontSize: '0.72rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: '#38bdf8',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '0.2rem 0',
};

const networkBadgeStyle: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '0.25rem 0.55rem',
  borderRadius: '999px',
  fontSize: '0.68rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  background: 'rgba(239, 68, 68, 0.15)',
  border: '1px solid rgba(239, 68, 68, 0.45)',
  color: '#f87171',
};

const crouchStatusStyle: CSSProperties = {
  alignSelf: 'flex-start',
  fontSize: '0.65rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#94a3b8',
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
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

  const handleToggleOverlay = () => {
    dispatch(setOverlayEnabled({ enabled: !hud.overlayEnabled }));
  };

  if (!shouldDisplay) {
    return null;
  }

  return (
    <div style={containerStyle} data-testid="camera-detection-hud">
      <div style={headerStyle}>
        <span>Cameras Nearby</span>
        <span style={countStyle}>{hud.camerasNearby}</span>
      </div>

      <div style={progressWrapperStyle}>
        <div style={progressBarStyle} aria-hidden="true">
          <div
            style={{
              ...progressFillBaseStyle,
              width: `${progress}%`,
              background: progressColor,
            }}
          />
        </div>
        <span style={progressLabelStyle}>{Math.round(progress)}%</span>
      </div>

      {hud.networkAlertActive && (
        <div style={networkBadgeStyle}>Network Alert</div>
      )}

      <div style={crouchStatusStyle}>
        {isCrouching ? 'Crouching · X to Stand' : 'Standing · X to Crouch'}
      </div>

      <button type="button" style={toggleButtonStyle} onClick={handleToggleOverlay}>
        {hud.overlayEnabled ? 'Hide Cones' : 'Show Cones'} · TAB
      </button>
    </div>
  );
};

export default CameraDetectionHUD;
