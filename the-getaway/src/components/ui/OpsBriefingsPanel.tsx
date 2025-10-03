import { CSSProperties } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { getUIStrings } from "../../content/ui";
import NotificationBadge from "./NotificationBadge";
import { gradientTextStyle } from "./theme";

interface OpsBriefingsPanelProps {
  containerStyle: CSSProperties;
}

const mutedText = "rgba(148, 163, 184, 0.78)";

const OpsBriefingsPanel: React.FC<OpsBriefingsPanelProps> = ({ containerStyle }) => {
  const quests = useSelector((state: RootState) => state.quests.quests);
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);

  const activeQuests = quests.filter((quest) => quest.isActive && !quest.isCompleted);
  const completedQuests = quests
    .filter((quest) => quest.isCompleted)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 3);

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

  if (activeQuests.length === 0 && completedQuests.length === 0) {
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
        gap: '1.1rem',
        overflowY: 'auto',
      }}
    >
      {activeQuests.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div
            style={{
              fontSize: '0.75rem',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              ...gradientTextStyle('#93c5fd', '#60a5fa'),
              filter: 'drop-shadow(0 0 6px rgba(96, 165, 250, 0.4))',
            }}
          >
            {uiStrings.questLog.active}
            <NotificationBadge count={activeQuests.length} color="#60a5fa" size={18} pulse={activeQuests.length > 0} />
          </div>
          {activeQuests.map((quest) => (
            <div
              key={quest.id}
              style={{
                border: '1px solid rgba(96, 165, 250, 0.25)',
                borderRadius: '14px',
                padding: '0.9rem',
                background: 'linear-gradient(150deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.9))',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.55rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: '#f8fafc',
                }}
              >
                {quest.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: mutedText }}>{quest.description}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {quest.objectives.map((objective) => (
                  <div
                    key={objective.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.78rem',
                      color: objective.isCompleted ? '#5eead4' : '#cbd5f5',
                    }}
                  >
                    <span
                      style={{
                        width: '0.65rem',
                        height: '0.65rem',
                        borderRadius: '50%',
                        border: '1px solid rgba(94, 234, 212, 0.45)',
                        background: objective.isCompleted ? 'rgba(94, 234, 212, 0.35)' : 'transparent',
                      }}
                    />
                    <span style={{ flex: 1 }}>{objective.description}</span>
                    {objective.count && (
                      <span style={{ fontSize: '0.7rem', color: '#facc15' }}>
                        {(objective.currentCount ?? 0)}/{objective.count}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {renderRewards(quest.id)}
            </div>
          ))}
        </div>
      )}

      {completedQuests.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div
            style={{
              fontSize: '0.72rem',
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              ...gradientTextStyle('#c4b5fd', '#a78bfa'),
              filter: 'drop-shadow(0 0 6px rgba(167, 139, 250, 0.4))',
            }}
          >
            {uiStrings.questLog.completed}
            <NotificationBadge count={completedQuests.length} color="#a78bfa" size={18} pulse={false} />
          </div>
          {completedQuests.map((quest) => (
            <div
              key={quest.id}
              style={{
                border: '1px solid rgba(167, 139, 250, 0.25)',
                borderRadius: '12px',
                padding: '0.75rem',
                background: 'linear-gradient(145deg, rgba(76, 29, 149, 0.22), rgba(30, 41, 59, 0.65))',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ede9fe' }}>{quest.name}</div>
              <div style={{ fontSize: '0.75rem', color: mutedText }}>{quest.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OpsBriefingsPanel;