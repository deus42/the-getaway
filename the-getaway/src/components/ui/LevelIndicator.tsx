import React from 'react';
import { useSelector } from 'react-redux';
import { getUIStrings } from '../../content/ui';
import {
  selectMissionPendingAdvance,
  selectMissionProgress,
} from '../../store/selectors/missionSelectors';
import { RootState } from '../../store';

const listBaseStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  listStyle: 'none',
};

const LevelIndicator: React.FC = () => {
  const locale = useSelector((state: RootState) => state.settings.locale);
  const missionProgress = useSelector(selectMissionProgress);
  const missionAdvancePending = useSelector(selectMissionPendingAdvance);
  const uiStrings = getUIStrings(locale);

  const levelNumber = missionProgress?.level ?? 0;
  const levelName = missionProgress?.name ?? uiStrings.levelIndicator.unknownLevel;
  const primaryObjectives = missionProgress?.primary ?? [];
  const sideObjectives = missionProgress?.side ?? [];
  const allPrimaryComplete = missionProgress?.allPrimaryComplete ?? false;

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
        pointerEvents: 'none',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', opacity: 0.9 }}>
            {uiStrings.levelIndicator.levelLabel}
          </span>
          <span style={{ fontSize: '0.96rem', fontWeight: 600 }}>{levelNumber}</span>
        </div>
        <span
          style={{
            fontSize: '0.72rem',
            color: 'rgba(148, 163, 184, 0.82)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          {levelName}
        </span>
        {missionAdvancePending && (
          <span
            style={{
              fontSize: '0.66rem',
              color: '#5eead4',
              border: '1px solid rgba(94, 234, 212, 0.38)',
              borderRadius: '999px',
              padding: '0.18rem 0.55rem',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              alignSelf: 'flex-start',
            }}
          >
            {uiStrings.levelIndicator.missionReadyBadge}
          </span>
        )}
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
      </div>
    </div>
  );
};

export default LevelIndicator;
