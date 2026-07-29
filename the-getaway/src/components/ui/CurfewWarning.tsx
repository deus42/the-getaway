import React, { CSSProperties, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setCurfewBanner } from '../../store/surveillanceSlice';

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
  zIndex: 20,
};

const bannerStyle: CSSProperties = {
  padding: '1.8rem 3rem',
  borderRadius: 'var(--hud-radius-lg)',
  background: 'var(--hud-color-surface-strong)',
  border: '1px solid var(--hud-color-rule-active)',
  boxShadow: 'var(--shadow-overlay)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.6rem',
  textAlign: 'center',
  color: 'var(--hud-color-bone)',
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
};

const titleStyle: CSSProperties = {
  fontSize: '1.6rem',
  fontWeight: 800,
};

const subtitleStyle: CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 600,
  opacity: 0.8,
};

const CurfewWarning: React.FC = () => {
  const dispatch = useDispatch();
  const visible = useSelector((state: RootState) => state.surveillance.curfewBanner.visible);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dispatch(setCurfewBanner({ visible: false, timestamp: Date.now() }));
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [visible, dispatch]);

  if (!visible) {
    return null;
  }

  return (
    <div style={overlayStyle} aria-live="assertive" aria-atomic="true">
      <div className="curfew-warning__banner" style={bannerStyle} role="alert">
        <span style={titleStyle}>Curfew Active</span>
        <span style={subtitleStyle}>Surveillance Engaged</span>
      </div>
    </div>
  );
};

export default CurfewWarning;
