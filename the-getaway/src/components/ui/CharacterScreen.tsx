import React, { useCallback, useEffect } from 'react';
import PlayerSummaryPanel from './PlayerSummaryPanel';
import PlayerStatusPanel from './PlayerStatusPanel';
import PlayerStatsPanel from './PlayerStatsPanel';
import SkillTreePanel from './SkillTreePanel';
import PlayerLoadoutPanel from './PlayerLoadoutPanel';
import PlayerInventoryPanel from './PlayerInventoryPanel';
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
  padding: '3vh 4vw',
};

const shellStyle: React.CSSProperties = {
  width: 'min(1200px, 100%)',
  maxHeight: '90vh',
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
  color: '#bfdbfe',
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
  gridTemplateColumns: '320px 1fr',
  gap: '1.5rem',
  padding: '1.5rem',
  minHeight: 0,
};

const leftColumnStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateRows: 'auto auto 1fr',
  gap: '1rem',
};

const rightColumnStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateRows: 'auto 1fr',
  gap: '1rem',
  minHeight: 0,
};

const loadoutRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '1rem',
};

const skillTreeWrapperStyle: React.CSSProperties = {
  borderRadius: '14px',
  border: '1px solid rgba(148, 163, 184, 0.24)',
  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.78))',
  boxShadow: '0 18px 30px rgba(15, 23, 42, 0.35)',
  padding: '1rem',
  overflow: 'hidden',
};

const CharacterScreen: React.FC<CharacterScreenProps> = ({ open, onClose }) => {
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return undefined;
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
        <header style={headerStyle}>
          <div style={titleGroupStyle}>
            <span style={titleStyle} id="character-screen-title">
              {uiStrings.shell.characterTitle}
            </span>
            <span style={subtitleStyle}>{uiStrings.shell.characterSubtitle}</span>
          </div>
          <button type="button" onClick={onClose} style={closeButtonStyle} data-testid="close-character">
            Close
          </button>
        </header>
        <div style={bodyStyle}>
          <div style={leftColumnStyle}>
            <PlayerSummaryPanel showActionButton={false} />
            <PlayerStatusPanel />
            <PlayerStatsPanel />
          </div>
          <div style={rightColumnStyle}>
            <div style={loadoutRowStyle}>
              <PlayerLoadoutPanel />
              <PlayerInventoryPanel />
            </div>
            <div style={skillTreeWrapperStyle}>
              <SkillTreePanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterScreen;
