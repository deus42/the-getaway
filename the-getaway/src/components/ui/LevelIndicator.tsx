import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUIStrings } from '../../content/ui';
import {
  selectMissionPendingAdvance,
  selectMissionProgress,
} from '../../store/selectors/missionSelectors';
import { RootState } from '../../store';
import { showMissionAdvancePrompt } from '../../store/missionSlice';
import type { DangerRating } from '../../game/interfaces/types';

const listBaseStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  listStyle: 'none',
};

const dangerColors: Record<DangerRating, { background: string; text: string; border: string }> = {
  low: {
    background: 'rgba(34, 197, 94, 0.18)',
    text: '#bbf7d0',
    border: 'rgba(34, 197, 94, 0.45)',
  },
  moderate: {
    background: 'rgba(249, 115, 22, 0.18)',
    text: '#fed7aa',
    border: 'rgba(249, 115, 22, 0.55)',
  },
  high: {
    background: 'rgba(250, 204, 21, 0.16)',
    text: '#fef08a',
    border: 'rgba(250, 204, 21, 0.55)',
  },
  critical: {
    background: 'rgba(239, 68, 68, 0.2)',
    text: '#fecaca',
    border: 'rgba(239, 68, 68, 0.55)',
  },
};

interface LevelIndicatorProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const hazardChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.18rem 0.55rem',
  borderRadius: '999px',
  fontSize: '0.62rem',
  letterSpacing: '0.08em',
  color: '#f8fafc',
  background: 'rgba(59, 130, 246, 0.18)',
  border: '1px solid rgba(59, 130, 246, 0.35)',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
};

const LevelIndicator: React.FC<LevelIndicatorProps> = ({ collapsed = false, onToggle }) => {
  const dispatch = useDispatch();
  const locale = useSelector((state: RootState) => state.settings.locale);
  const missionProgress = useSelector(selectMissionProgress);
  const missionAdvancePending = useSelector(selectMissionPendingAdvance);
  const currentArea = useSelector((state: RootState) => state.world.currentMapArea);
  const uiStrings = getUIStrings(locale);

  const zoneName =
    currentArea?.displayName ?? currentArea?.name ?? missionProgress?.name ?? uiStrings.levelIndicator.unknownLevel;
  const zoneSummary = currentArea?.summary;
  const hazards = (currentArea?.hazards ?? []).filter((hazard) => hazard && hazard.trim().length > 0);
  const zoneDirectives = (currentArea?.objectives ?? []).filter((objective) => objective && objective.trim().length > 0);
  const dangerRating = currentArea?.dangerRating ?? null;
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

  const renderDangerPill = () => {
    if (!dangerRating) {
      return (
        <span
          style={{
            fontSize: '0.62rem',
            color: 'rgba(148, 163, 184, 0.7)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          —
        </span>
      );
    }

    const palette = dangerColors[dangerRating];
    const label = uiStrings.levelIndicator.dangerLevels[dangerRating] ?? dangerRating;

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.18rem 0.6rem',
          borderRadius: '999px',
          fontSize: '0.62rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          background: palette.background,
          color: palette.text,
          border: `1px solid ${palette.border}`,
        }}
      >
        {label}
      </span>
    );
  };

  return (
    <div
      style={{
        width: '280px',
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.82))',
        border: '1px solid rgba(148, 163, 184, 0.35)',
        borderRadius: '14px',
        padding: '0.9rem 1.05rem',
        fontFamily: "'DM Mono', 'IBM Plex Mono', monospace",
        color: '#f8fafc',
        letterSpacing: '0.05em',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.45)',
        pointerEvents: 'auto',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', pointerEvents: 'auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', opacity: 0.9 }}>
              {uiStrings.levelIndicator.levelLabel}
            </span>
            <span style={{ fontSize: '0.96rem', fontWeight: 600 }}>{displayedLevel}</span>
          </div>
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
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: missionName && missionName !== zoneName ? '0.25rem' : 0,
            width: '100%',
            cursor: onToggle ? 'pointer' : 'default',
            textTransform: 'uppercase',
            textAlign: 'left',
            transition: 'color 0.2s ease',
            userSelect: 'none',
            pointerEvents: 'auto',
          }}
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
              gap: '0.38rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.68rem', color: '#94a3b8', opacity: 0.85, letterSpacing: '0.1em' }}>
                {uiStrings.levelIndicator.zoneLabel}
              </span>
              {renderDangerPill()}
            </div>
            {zoneSummary && (
              <p
                style={{
                  margin: 0,
                  fontSize: '0.66rem',
                  lineHeight: 1.35,
                  color: 'rgba(209, 213, 219, 0.88)',
                }}
              >
                {zoneSummary}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ fontSize: '0.66rem', color: 'rgba(148, 163, 184, 0.78)', letterSpacing: '0.09em' }}>
                {uiStrings.levelIndicator.hazardsLabel}
              </span>
              {hazards.length === 0 ? (
                <span style={{ fontSize: '0.64rem', color: 'rgba(148, 163, 184, 0.6)' }}>
                  {uiStrings.levelIndicator.hazardsNone}
                </span>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.4rem',
                  }}
                >
                  {hazards.map((hazard) => (
                    <span key={hazard} style={hazardChipStyle}>
                      {hazard}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {zoneDirectives.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.24rem' }}>
                <span style={{ fontSize: '0.66rem', color: 'rgba(148, 163, 184, 0.78)', letterSpacing: '0.09em' }}>
                  {uiStrings.levelIndicator.zoneObjectivesLabel}
                </span>
                <ul
                  style={{
                    ...listBaseStyle,
                    gap: '0.25rem',
                  }}
                >
                  {zoneDirectives.map((directive) => (
                    <li
                      key={directive}
                      style={{
                        fontSize: '0.64rem',
                        color: 'rgba(226, 232, 240, 0.86)',
                        lineHeight: 1.35,
                      }}
                    >
                      {directive}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
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
