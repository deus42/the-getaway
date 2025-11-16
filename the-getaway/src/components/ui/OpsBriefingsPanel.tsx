import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { getUIStrings } from "../../content/ui";
import "../../styles/hud-ops-panel.css";

interface OpsBriefingsPanelProps {
  showCompleted?: boolean;
}

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const OpsBriefingsPanel: React.FC<OpsBriefingsPanelProps> = ({
  showCompleted = false,
}) => {
  const quests = useSelector((state: RootState) => state.quests.quests);
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);

  const activeQuests = quests.filter(
    (quest) => quest.isActive && !quest.isCompleted
  );
  const completedQuests = quests
    .filter((quest) => quest.isCompleted)
    .sort((a, b) => a.name.localeCompare(b.name));
  const recentCompleted = showCompleted
    ? completedQuests
    : completedQuests.slice(0, 1);

  const hasActive = activeQuests.length > 0;
  const hasCompleted = showCompleted ? recentCompleted.length > 0 : false;

  const shouldScroll = showCompleted
    ? activeQuests.length + recentCompleted.length > 2
    : activeQuests.length > 1;

  const formatReward = (rewardCount: number, label: string) => {
    if (rewardCount <= 0) {
      return null;
    }

    if (locale === "en") {
      return rewardCount > 1
        ? `${rewardCount} ${label}s`
        : `${rewardCount} ${label}`;
    }

    return `${rewardCount} ${label}`;
  };

  const renderRewards = (questId: string) => {
    const quest = quests.find((entry) => entry.id === questId);
    if (!quest) {
      return null;
    }

    const currency = quest.rewards
      .filter((reward) => reward.type === "currency")
      .reduce((total, reward) => total + reward.amount, 0);
    const experience = quest.rewards
      .filter((reward) => reward.type === "experience")
      .reduce((total, reward) => total + reward.amount, 0);
    const itemRewards = quest.rewards.filter(
      (reward) => reward.type === "item"
    );

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
      <div className="text-[0.68rem] uppercase tracking-[0.18em] text-[#34d399]">
        {uiStrings.questLog.rewardsHeading}: {rewardLabels.join(" • ")}
      </div>
    );
  };

  const renderActiveQuest = (quest: (typeof activeQuests)[number]) => {
    return (
      <div
        key={quest.id}
        className="hud-ops-card hud-ops-card--active flex flex-col gap-3.5 p-[0.95rem]"
      >
        <div className="text-[0.92rem] font-semibold tracking-[0.08em] text-slate-50">
          {quest.name}
        </div>
        <p className="hud-ops-text-muted text-[0.78rem] leading-[1.55]">
          {quest.description}
        </p>
        <div className="flex flex-col gap-3">
          {quest.objectives.map((objective) => (
            <div
              key={objective.id}
              className="flex items-start gap-[0.55rem] text-[0.76rem] text-[#cbd5f5]"
            >
              <span
                aria-hidden="true"
                className="hud-ops-objective-check mt-[2px]"
                data-completed={objective.isCompleted}
              >
                ✓
              </span>
              <span className="flex-1 leading-tight">{objective.description}</span>
              {objective.count && (
                <span className="text-[0.65rem] uppercase tracking-[0.16em] text-[#facc15]">
                  {(objective.currentCount ?? 0)}/{objective.count}
                </span>
              )}
            </div>
          ))}
        </div>
        {renderRewards(quest.id)}
      </div>
    );
  };

  const renderCompletedQuest = (quest: (typeof recentCompleted)[number]) => {
    return (
      <div
        key={quest.id}
        className="hud-ops-card hud-ops-card--completed flex flex-col gap-3.5 p-[0.9rem]"
      >
        <div className="flex items-center justify-between gap-[0.75rem]">
          <div className="text-[0.85rem] font-semibold tracking-[0.05em] text-[#ede9fe]">
            {quest.name}
          </div>
          <span
            aria-hidden="true"
            className="hud-ops-complete-badge inline-flex h-[1.25rem] w-[1.25rem] items-center justify-center rounded-[0.35rem] text-[0.78rem] font-bold"
          >
            ✓
          </span>
        </div>
        <p className="hud-ops-text-muted text-[0.74rem] leading-[1.6]">
          {quest.description}
        </p>
      </div>
    );
  };

  if (!hasActive && !hasCompleted) {
    return (
      <div className="hud-ops-empty flex flex-1 items-center justify-center text-xs italic">
        {uiStrings.questLog.empty}
      </div>
    );
  }

  return (
    <div
      className={cx(
        "flex flex-col gap-3.5 pr-1",
        shouldScroll ? "overflow-y-auto" : "overflow-y-hidden"
      )}
    >
      {hasActive &&
        activeQuests.map((quest) => renderActiveQuest(quest))}
      {showCompleted &&
        hasCompleted &&
        recentCompleted.map((quest) => renderCompletedQuest(quest))}
    </div>
  );
};

export default React.memo(OpsBriefingsPanel);
