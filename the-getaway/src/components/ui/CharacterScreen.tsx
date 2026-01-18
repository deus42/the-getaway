import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import FactionReputationPanel from './FactionReputationPanel';

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
  height: 'min(900px, 92vh)',
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

const headerActionsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
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

const DEFAULT_COLUMNS = 'minmax(320px, 0.85fr) minmax(0, 1.35fr)';

const bodyStyle: React.CSSProperties = {
  flex: 1,
  display: 'grid',
  gridTemplateColumns: DEFAULT_COLUMNS,
  gap: '1rem',
  padding: '1.2rem',
  minHeight: 0,
  height: '100%',
  overflow: 'hidden',
};

const profileColumnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
  minHeight: 0,
  height: '100%',
  overflow: 'hidden',
};

const systemsColumnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
  minHeight: 0,
  height: '100%',
  flex: 1,
};

const tabShellStyle: React.CSSProperties = {
  ...characterPanelSurface,
  display: 'flex',
  flexDirection: 'column',
  padding: '0.6rem',
  gap: '0.8rem',
  minHeight: 0,
  height: '100%',
  flex: 1,
};

const tabListStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center',
  flexWrap: 'wrap',
};

const tabButtonStyle: React.CSSProperties = {
  borderRadius: '999px',
  border: '1px solid rgba(148, 163, 184, 0.35)',
  background: 'rgba(15, 23, 42, 0.6)',
  color: '#e2e8f0',
  fontSize: '0.62rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  padding: '0.32rem 0.9rem',
  cursor: 'pointer',
  transition: 'background 0.2s ease, border-color 0.2s ease',
};

const activeTabButtonStyle: React.CSSProperties = {
  borderColor: 'rgba(56, 189, 248, 0.6)',
  background: 'rgba(37, 99, 235, 0.18)',
  color: '#e0f2fe',
  filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.4))',
};

const tabContentStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  height: '100%',
};

const tabContentInnerStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
};

const skillTreeWrapperStyle: React.CSSProperties = {
  ...characterPanelSurface,
  display: 'flex',
  flexDirection: 'column',
  padding: '0.6rem',
  minHeight: 0,
  flex: 1,
  position: 'relative',
  zIndex: 0,
  overflow: 'hidden',
};

const toggleButtonStyle: React.CSSProperties = {
  borderRadius: '999px',
  border: '1px solid rgba(148, 163, 184, 0.35)',
  background: 'rgba(15, 23, 42, 0.6)',
  color: '#e2e8f0',
  fontSize: '0.6rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  padding: '0.3rem 0.75rem',
  cursor: 'pointer',
  transition: 'background 0.2s ease, border-color 0.2s ease',
};

const activeToggleStyle: React.CSSProperties = {
  borderColor: 'rgba(56, 189, 248, 0.6)',
  background: 'rgba(37, 99, 235, 0.2)',
  color: '#e0f2fe',
};

const hiddenToggleStyle: React.CSSProperties = {
  borderColor: 'rgba(248, 113, 113, 0.55)',
  color: '#fecaca',
};

const hiddenStateStyle: React.CSSProperties = {
  ...characterPanelSurface,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.72rem',
  color: 'rgba(148, 163, 184, 0.8)',
};

const CharacterScreen: React.FC<CharacterScreenProps> = ({ open, onClose }) => {
  const locale = useSelector((state: RootState) => state.settings.locale);
  const reputationSystemsEnabled = useSelector(
    (state: RootState) => Boolean(state.settings.reputationSystemsEnabled)
  );
  const uiStrings = getUIStrings(locale);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'loadout' | 'skills' | 'reputation'>('inventory');
  const [showProfile, setShowProfile] = useState(true);
  const [showSystems, setShowSystems] = useState(true);

  const layoutStyle = useMemo<React.CSSProperties>(() => ({
    ...bodyStyle,
    gridTemplateColumns: showProfile && showSystems ? DEFAULT_COLUMNS : '1fr',
  }), [showProfile, showSystems]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
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

  useEffect(() => {
    if (open) {
      setShowProfile(true);
      setShowSystems(true);
    }
  }, [open]);

  useEffect(() => {
    if (!reputationSystemsEnabled && activeTab === 'reputation') {
      setActiveTab('inventory');
    }
  }, [activeTab, reputationSystemsEnabled]);

  const tabs: Array<{ id: 'inventory' | 'loadout' | 'skills' | 'reputation'; label: string }> = [
    { id: 'inventory', label: uiStrings.character.tabs.inventory },
    { id: 'loadout', label: uiStrings.character.tabs.loadout },
    { id: 'skills', label: uiStrings.character.tabs.skills },
    { id: 'reputation', label: uiStrings.character.tabs.reputation },
  ];
  const visibleTabs = reputationSystemsEnabled
    ? tabs
    : tabs.filter((tab) => tab.id !== 'reputation');

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
          <div style={headerActionsStyle}>
            <button
              type="button"
              style={{
                ...toggleButtonStyle,
                ...(showProfile ? activeToggleStyle : hiddenToggleStyle),
              }}
              aria-pressed={showProfile}
              onClick={() => setShowProfile((current) => !current)}
            >
              {uiStrings.character.profileToggle}
            </button>
            <button
              type="button"
              style={{
                ...toggleButtonStyle,
                ...(showSystems ? activeToggleStyle : hiddenToggleStyle),
              }}
              aria-pressed={showSystems}
              onClick={() => setShowSystems((current) => !current)}
            >
              {uiStrings.character.systemsToggle}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={closeButtonStyle}
              data-testid="close-character"
              ref={closeButtonRef}
            >
              {uiStrings.character.closeLabel}
            </button>
          </div>
        </header>
        <div style={layoutStyle}>
          {showProfile && (
            <div style={profileColumnStyle}>
              <PlayerSummaryPanel showActionButton={false} />
              <PlayerStatsPanel />
            </div>
          )}
          {showSystems && (
            <div style={systemsColumnStyle}>
              <div style={tabShellStyle}>
                <div style={tabListStyle} role="tablist" aria-label={uiStrings.character.tablistAria}>
                  {visibleTabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`character-tab-${tab.id}`}
                      id={`character-tab-trigger-${tab.id}`}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        ...tabButtonStyle,
                        ...(isActive ? activeTabButtonStyle : {}),
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              <div style={tabContentStyle}>
                {activeTab === 'inventory' && (
                  <div
                    id="character-tab-inventory"
                    role="tabpanel"
                    aria-labelledby="character-tab-trigger-inventory"
                    style={tabContentInnerStyle}
                  >
                    <PlayerInventoryPanel />
                  </div>
                )}
                {activeTab === 'loadout' && (
                  <div
                    id="character-tab-loadout"
                    role="tabpanel"
                    aria-labelledby="character-tab-trigger-loadout"
                    style={tabContentInnerStyle}
                  >
                    <PlayerLoadoutPanel />
                  </div>
                )}
                {activeTab === 'skills' && (
                  <div
                    id="character-tab-skills"
                    role="tabpanel"
                    aria-labelledby="character-tab-trigger-skills"
                    style={tabContentInnerStyle}
                  >
                    <div style={skillTreeWrapperStyle}>
                      <ScanlineOverlay opacity={0.04} />
                      <SkillTreePanel />
                    </div>
                  </div>
                )}
                {reputationSystemsEnabled && activeTab === 'reputation' && (
                  <div
                    id="character-tab-reputation"
                    role="tabpanel"
                    aria-labelledby="character-tab-trigger-reputation"
                    style={tabContentInnerStyle}
                  >
                    <FactionReputationPanel />
                  </div>
                )}
              </div>
              </div>
            </div>
          )}
          {!showProfile && !showSystems && (
            <div style={{ ...hiddenStateStyle, gridColumn: '1 / -1' }}>
              {uiStrings.character.hiddenState}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterScreen;
