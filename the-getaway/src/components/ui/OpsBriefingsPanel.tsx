import React, { CSSProperties } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { getUIStrings } from "../../content/ui";
interface OpsBriefingsPanelProps {
  containerStyle: CSSProperties;
  showCompleted?: boolean;
}

const mutedText = "rgba(148, 163, 184, 0.78)";

const OpsBriefingsPanel: React.FC<OpsBriefingsPanelProps> = ({ containerStyle, showCompleted = false }) => {
  const quests = useSelector((state: RootState) => state.quests.quests);
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);

  const activeQuests = quests.filter((quest) => quest.isActive && !quest.isCompleted);
  const completedQuests = quests
    .filter((quest) => quest.isCompleted)
    .sort((a, b) => a.name.localeCompare(b.name));

  const formatReward = (rewardCount: number, label: string) => {
    if (rewardCount <= 0) {
      return null;
    }

    if (locale === 'en') {
      return rewardCount > 1 ? `${rewardCount} ${label}s` : `${rewardCount} ${label}`;
    }

    return `${rewardCount} ${label}`;
  };

  const renderRewards = (questId: string) => {
    const quest = quests.find((entry) => entry.id === questId);
    if (!quest) {
      return null;
    }

    const currency = quest.rewards
      .filter((reward) => reward.type === 'currency')
      .reduce((total, reward) => total + reward.amount, 0);
    const experience = quest.rewards
      .filter((reward) => reward.type === 'experience')
      .reduce((total, reward) => total + reward.amount, 0);
    const itemRewards = quest.rewards.filter((reward) => reward.type === 'item');

    const rewardLabels = [
      currency ? uiStrings.questLog.currencyLabel(currency) : null,
      experience ? uiStrings.questLog.experienceLabel(experience) : null,
      ...itemRewards.map((reward) =>
        formatReward(
          Math.max(1, reward.amount || 1),
          reward.id ?? uiStrings.questLog.supplyFallback
        )
      ),
    ].filter(Boolean);

    if (rewardLabels.length === 0) {
      return null;
    }

    return (
      <div
        style={{
          fontSize: '0.7rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#34d399',
        }}
      >
        {uiStrings.questLog.rewardsHeading}: {rewardLabels.join(' • ')}
      </div>
    );
  };

  const latestCompleted = completedQuests[0] ?? null;
  const questsToRender = showCompleted
    ? [...activeQuests, ...completedQuests]
    : activeQuests.length > 0
      ? activeQuests
      : latestCompleted
        ? [latestCompleted]
        : [];

  const shouldScroll = showCompleted ? questsToRender.length > 2 : activeQuests.length > 1;

  if (questsToRender.length === 0) {
    return (
      <div
        style={{
          ...containerStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: mutedText,
          fontStyle: 'italic',
        }}
      >
        {uiStrings.questLog.empty}
      </div>
    );
  }

  return (
    <div
      style={{
        ...containerStyle,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        overflowY: shouldScroll ? 'auto' : 'hidden',
      }}
    >
      {questsToRender.map((quest) => {
        const isActiveQuest = quest.isActive && !quest.isCompleted;
        return (
          <div
          key={quest.id}
          style={{
            border: '1px solid rgba(96, 165, 250, 0.25)',
            borderRadius: '14px',
            padding: '0.9rem',
            background: isActiveQuest
              ? 'linear-gradient(150deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.9))'
              : 'linear-gradient(150deg, rgba(76, 29, 149, 0.45), rgba(30, 27, 75, 0.92))',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.6rem',
            }}
          >
            <div
              style={{
                fontSize: '0.92rem',
                fontWeight: 600,
                color: isActiveQuest ? '#f8fafc' : '#ede9fe',
              }}
            >
              {quest.name}
            </div>
            {quest.isCompleted && (
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '1.4rem',
                  height: '1.4rem',
                  borderRadius: '0.35rem',
                  border: '1px solid rgba(196, 181, 253, 0.65)',
                  background: 'rgba(196, 181, 253, 0.25)',
                  color: '#0f172a',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  lineHeight: '1.4rem',
                  boxShadow: '0 8px 18px -12px rgba(196, 181, 253, 0.6)',
                }}
              >
                ✓
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              color: mutedText,
            }}
          >
            {quest.description}
          </div>
          {!quest.isCompleted && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {quest.objectives.map((objective) => (
                  <div
                    key={objective.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.78rem',
                      color: isActiveQuest && !objective.isCompleted ? '#cbd5f5' : '#c4b5fd',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: '1rem',
                        height: '1rem',
                        borderRadius: '0.3rem',
                        border: '1px solid rgba(94, 234, 212, 0.6)',
                        background: objective.isCompleted ? 'rgba(94, 234, 212, 0.35)' : 'transparent',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: objective.isCompleted ? '#0f172a' : 'transparent',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        lineHeight: '1rem',
                        transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
                      }}
                    >
                      ✓
                    </span>
                    <span
                      style={{
                        flex: 1,
                      }}
                    >
                      {objective.description}
                    </span>
                  </div>
                ))}
              </div>
              {renderRewards(quest.id)}
            </>
          )}
        </div>
        );
      })}
    </div>
  );
};

export default React.memo(OpsBriefingsPanel);
