import React, { useCallback, useEffect, useRef } from 'react';
import PlayerSummaryPanel from './PlayerSummaryPanel';
import PlayerStatsPanel from './PlayerStatsPanel';
import SkillTreePanel from './SkillTreePanel';
import PlayerLoadoutPanel from './PlayerLoadoutPanel';
import PlayerInventoryPanel from './PlayerInventoryPanel';
import CornerAccents from './CornerAccents';
import ScanlineOverlay from './ScanlineOverlay';
import { characterPanelSurface } from './theme';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getUIStrings } from '../../content/ui';

interface CharacterScreenProps {
  open: boolean;
  onClose: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'radial-gradient(circle at top, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 0.9))',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 10000,
  padding: '2vh 3vw',
};

const shellStyle: React.CSSProperties = {
  position: 'relative',
  width: 'min(1400px, 95%)',
  maxHeight: '92vh',
  background: 'linear-gradient(160deg, rgba(15, 23, 42, 0.98), rgba(8, 14, 30, 0.92))',
  borderRadius: '18px',
  border: '1px solid rgba(56, 189, 248, 0.25)',
  boxShadow: '0 40px 80px rgba(2, 6, 23, 0.65)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  padding: '1.2rem 1.5rem',
  borderBottom: '1px solid rgba(56, 189, 248, 0.18)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  color: '#e2e8f0',
};

const titleGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.35rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  background: 'linear-gradient(135deg, #bfdbfe, #38bdf8)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  filter: 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.5))',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'rgba(148, 163, 184, 0.85)',
};

const closeButtonStyle: React.CSSProperties = {
  border: '1px solid rgba(148, 163, 184, 0.4)',
  background: 'rgba(15, 23, 42, 0.6)',
  color: '#f8fafc',
  padding: '0.5rem 0.9rem',
  borderRadius: '999px',
  fontSize: '0.75rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const bodyStyle: React.CSSProperties = {
  flex: 1,
  display: 'grid',
  gridTemplateColumns: 'minmax(320px, 0.85fr) minmax(0, 1.35fr)',
  gap: '1rem',
  padding: '1.2rem',
  minHeight: 0,
  overflow: 'hidden',
};

const profileColumnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
  minHeight: 0,
  overflow: 'hidden',
};

const systemsColumnStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateRows: 'minmax(0, 0.55fr) minmax(0, 1fr)',
  gap: '1rem',
  minHeight: 0,
};

const skillTreeWrapperStyle: React.CSSProperties = {
  ...characterPanelSurface,
  display: 'flex',
  flexDirection: 'column',
  padding: '0.6rem',
  minHeight: 0,
  position: 'relative',
  zIndex: 0,
  overflow: 'hidden',
};

const CharacterScreen: React.FC<CharacterScreenProps> = ({ open, onClose }) => {
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    // Focus the close button when modal opens
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) {
    return null;
  }

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      style={overlayStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby="character-screen-title"
      data-testid="character-screen"
      onClick={handleOverlayClick}
    >
      <div style={shellStyle}>
        <CornerAccents color="#38bdf8" size={24} thickness={2} />
        <ScanlineOverlay opacity={0.05} />
        <header style={headerStyle}>
          <div style={titleGroupStyle}>
            <span style={titleStyle} id="character-screen-title">
              {uiStrings.shell.characterTitle}
            </span>
            <span style={subtitleStyle}>{uiStrings.shell.characterSubtitle}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={closeButtonStyle}
            data-testid="close-character"
            ref={closeButtonRef}
          >
            Close
          </button>
        </header>
        <div style={bodyStyle}>
          <div style={profileColumnStyle}>
            <PlayerSummaryPanel showActionButton={false} />
            <PlayerStatsPanel />
          </div>
          <div style={systemsColumnStyle}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
                gap: '0.85rem',
                minHeight: 0,
              }}
            >
              <PlayerInventoryPanel />
              <PlayerLoadoutPanel />
            </div>
            <div style={skillTreeWrapperStyle}>
              <ScanlineOverlay opacity={0.04} />
              <SkillTreePanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterScreen;
