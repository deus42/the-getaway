import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUIStrings } from '../../content/ui';
import {
  selectMissionPendingAdvance,
  selectMissionProgress,
} from '../../store/selectors/missionSelectors';
import { RootState } from '../../store';
import { showMissionAdvancePrompt } from '../../store/missionSlice';

const listBaseStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  listStyle: 'none',
};

interface LevelIndicatorProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const LevelIndicator: React.FC<LevelIndicatorProps> = ({
  collapsed = false,
  onToggle,
}) => {
  const dispatch = useDispatch();
  const locale = useSelector((state: RootState) => state.settings.locale);
  const missionProgress = useSelector(selectMissionProgress);
  const missionAdvancePending = useSelector(selectMissionPendingAdvance);
  const currentArea = useSelector((state: RootState) => state.world.currentMapArea);
  const uiStrings = getUIStrings(locale);

  const zoneName =
    currentArea?.displayName ?? currentArea?.name ?? missionProgress?.name ?? uiStrings.levelIndicator.unknownLevel;
  const displayedLevel = currentArea?.level ?? missionProgress?.level ?? 0;
  const missionName = missionProgress?.name;

  const primaryObjectives = missionProgress?.primary ?? [];
  const sideObjectives = missionProgress?.side ?? [];
  const allPrimaryComplete = missionProgress?.allPrimaryComplete ?? false;

  const handleMissionAdvanceClick = () => {
    dispatch(showMissionAdvancePrompt());
  };

  const handleToggleClick = () => {
    if (onToggle) {
      onToggle();
    }
  };

  const rootStyle: React.CSSProperties = {
    width: collapsed ? 'min(90vw, 240px)' : 'min(92vw, 320px)',
    background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.82))',
    border: '1px solid rgba(148, 163, 184, 0.35)',
    borderRadius: '14px',
    padding: collapsed ? '0.7rem 0.85rem' : '0.9rem 1.05rem',
    fontFamily: "'DM Mono', 'IBM Plex Mono', monospace",
    color: '#f8fafc',
    letterSpacing: '0.05em',
    display: 'flex',
    flexDirection: 'column',
    gap: collapsed ? '0.2rem' : '0.4rem',
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.45)',
    pointerEvents: 'auto',
    backdropFilter: 'blur(4px)',
    transition: 'width 0.2s ease, padding 0.2s ease',
  };

  const infoStackStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: missionName && missionName !== zoneName ? '0.25rem' : 0,
    flex: 1,
    minWidth: 0,
    width: '100%',
    cursor: onToggle ? 'pointer' : 'default',
    textTransform: 'uppercase',
    textAlign: 'left',
    transition: 'color 0.2s ease',
    userSelect: 'none',
    pointerEvents: 'auto',
  };

  return (
    <div style={rootStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', pointerEvents: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', opacity: 0.9 }}>
              {uiStrings.levelIndicator.levelLabel}
            </span>
            <span style={{ fontSize: '0.96rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {displayedLevel}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minHeight: '1.25rem' }}>
            {missionAdvancePending && (
              <button
                type="button"
                onClick={handleMissionAdvanceClick}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  fontSize: '0.66rem',
                  color: '#5eead4',
                  border: '1px solid rgba(94, 234, 212, 0.38)',
                  borderRadius: '999px',
                  padding: '0.18rem 0.55rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  transition: 'all 0.2s ease',
                  pointerEvents: 'auto',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(15, 118, 110, 0.22)';
                  e.currentTarget.style.borderColor = 'rgba(94, 234, 212, 0.55)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(94, 234, 212, 0.38)';
                }}
              >
                {uiStrings.levelIndicator.missionReadyBadge}
              </button>
            )}
          </div>
        </div>
        <div
          onClick={handleToggleClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (onToggle && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              handleToggleClick();
            }
          }}
          style={infoStackStyle}
          onMouseEnter={(e) => {
            if (onToggle) {
              e.currentTarget.style.color = 'rgba(226, 232, 240, 0.92)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'inherit';
          }}
        >
          <span
            style={{
              fontSize: '0.72rem',
              color: 'rgba(148, 163, 184, 0.82)',
              letterSpacing: '0.12em',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
            }}
          >
            {zoneName} {onToggle && <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{collapsed ? '▸' : '▾'}</span>}
          </span>
          {missionName && missionName !== zoneName && (
            <span
              style={{
                fontSize: '0.62rem',
                color: 'rgba(148, 163, 184, 0.6)',
                letterSpacing: '0.14em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {missionName}
            </span>
          )}
        </div>
      </div>
      {!collapsed && (
        <>
          <div
            style={{
              borderTop: '1px solid rgba(148, 163, 184, 0.22)',
              paddingTop: '0.45rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3rem',
            }}
          >
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', opacity: 0.85 }}>
              {uiStrings.levelIndicator.objectivesLabel}
            </span>
            {primaryObjectives.length === 0 ? (
              <span style={{ fontSize: '0.72rem', color: '#cbd5f5', opacity: 0.85 }}>
                {uiStrings.levelIndicator.emptyObjectives}
              </span>
            ) : (
              <ul
                style={{
                  ...listBaseStyle,
                  gap: '0.32rem',
                }}
              >
                {primaryObjectives.map((objective, index) => (
                  <li
                    key={objective.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontSize: '0.74rem',
                      lineHeight: 1.2,
                      color: objective.isComplete ? 'rgba(148, 163, 184, 0.7)' : 'rgba(226, 232, 240, 0.92)',
                      textDecoration: objective.isComplete ? 'line-through' : 'none',
                      textDecorationThickness: '1px',
                      textDecorationColor: 'rgba(94, 234, 212, 0.75)',
                      transition: 'color 0.18s ease',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '0.85rem',
                        height: '0.85rem',
                        borderRadius: '999px',
                        border: '1px solid rgba(94, 234, 212, 0.45)',
                        background: objective.isComplete
                          ? 'linear-gradient(135deg, rgba(94, 234, 212, 0.45), rgba(56, 189, 248, 0.35))'
                          : 'rgba(14, 165, 233, 0.14)',
                        color: objective.isComplete ? '#0f172a' : '#5eead4',
                        fontSize: '0.64rem',
                        fontWeight: 600,
                      }}
                      aria-hidden
                    >
                      {objective.isComplete ? '✓' : index + 1}
                    </span>
                    <span style={{ flex: 1 }}>{objective.label}</span>
                    {objective.totalQuests > 1 && (
                      <span
                        style={{
                          fontSize: '0.62rem',
                          color: 'rgba(148, 163, 184, 0.75)',
                          fontFamily: "'DM Mono', 'IBM Plex Mono', monospace",
                        }}
                      >
                        {objective.completedQuests}/{objective.totalQuests}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div
            style={{
              borderTop: '1px solid rgba(148, 163, 184, 0.16)',
              paddingTop: '0.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.24rem',
            }}
          >
            <span style={{ fontSize: '0.68rem', color: 'rgba(148, 163, 184, 0.7)' }}>
              {uiStrings.levelIndicator.sideObjectivesLabel}
            </span>
            {sideObjectives.length === 0 ? (
              <span style={{ fontSize: '0.68rem', color: 'rgba(148, 163, 184, 0.55)' }}>
                {uiStrings.levelIndicator.noSideObjectives}
              </span>
            ) : (
              <ul
                style={{
                  ...listBaseStyle,
                  gap: '0.22rem',
                }}
              >
                {sideObjectives.map((objective) => (
                  <li
                    key={objective.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.68rem',
                      color: objective.isComplete ? 'rgba(148, 163, 184, 0.6)' : 'rgba(226, 232, 240, 0.78)',
                      textDecoration: objective.isComplete ? 'line-through' : 'none',
                      textDecorationThickness: '1px',
                      textDecorationColor: 'rgba(99, 102, 241, 0.6)',
                    }}
                  >
                    <span
                      style={{
                        width: '0.5rem',
                        height: '0.5rem',
                        borderRadius: '999px',
                        background: objective.isComplete
                          ? 'linear-gradient(135deg, rgba(129, 140, 248, 0.6), rgba(99, 102, 241, 0.45))'
                          : 'rgba(99, 102, 241, 0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0f172a',
                        fontSize: '0.55rem',
                      }}
                      aria-hidden
                    >
                      {objective.isComplete ? '✓' : ''}
                    </span>
                    <span style={{ flex: 1 }}>{objective.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {allPrimaryComplete && !missionAdvancePending && (
            <span
              style={{
                marginTop: '0.3rem',
                fontSize: '0.66rem',
                color: 'rgba(94, 234, 212, 0.76)',
                fontFamily: "'DM Mono', 'IBM Plex Mono', monospace",
              }}
            >
              {uiStrings.levelIndicator.primaryCompleteFootnote}
            </span>
          )}
        </>
      )}
    </div>
  );
};

export default LevelIndicator;
