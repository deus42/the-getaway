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
  borderRadius: '18px',
  background: 'rgba(15, 23, 42, 0.85)',
  border: '1px solid rgba(248, 250, 252, 0.35)',
  boxShadow: '0 40px 60px rgba(15, 23, 42, 0.55)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.6rem',
  textAlign: 'center',
  color: '#f8fafc',
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
      <div style={bannerStyle} role="alert">
        <span style={titleStyle}>Curfew Active</span>
        <span style={subtitleStyle}>Surveillance Engaged</span>
      </div>
    </div>
  );
};

export default CurfewWarning;
