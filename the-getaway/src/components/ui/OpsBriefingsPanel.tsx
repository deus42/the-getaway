import React, { CSSProperties } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { getUIStrings } from "../../content/ui";

interface OpsBriefingsPanelProps {
  containerStyle: CSSProperties;
  showCompleted?: boolean;
}

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const mutedText = "rgba(148, 163, 184, 0.78)";

const OpsBriefingsPanel: React.FC<OpsBriefingsPanelProps> = ({
  containerStyle,
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
  const hasCompleted = recentCompleted.length > 0;

  const shouldScroll = showCompleted
    ? activeQuests.length + completedQuests.length > 2
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
      <div className="text-[0.7rem] uppercase tracking-[0.18em] text-[#34d399]">
        {uiStrings.questLog.rewardsHeading}: {rewardLabels.join(" • ")}
      </div>
    );
  };

  const renderActiveQuest = (
    quest: (typeof activeQuests)[number]
  ) => {
    return (
      <div
        key={quest.id}
        className="flex flex-col gap-[0.55rem] rounded-[14px] border p-[0.9rem]"
        style={{
          borderColor: "rgba(96, 165, 250, 0.25)",
          background:
            "linear-gradient(150deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.9))",
        }}
      >
        <div className="text-[0.92rem] font-semibold text-[#f8fafc]">
          {quest.name}
        </div>
        <div className="text-[0.8rem]" style={{ color: mutedText }}>
          {quest.description}
        </div>
        <div className="flex flex-col gap-[0.35rem]">
          {quest.objectives.map((objective) => (
            <div
              key={objective.id}
              className="flex items-center gap-[0.5rem] text-[0.78rem] text-[#cbd5f5]"
            >
              <span
                aria-hidden="true"
                className="flex h-[1rem] w-[1rem] items-center justify-center rounded-[0.3rem] border text-[0.7rem] font-bold transition-colors duration-200"
                style={{
                  borderColor: "rgba(94, 234, 212, 0.6)",
                  background: objective.isCompleted
                    ? "rgba(94, 234, 212, 0.35)"
                    : "transparent",
                  color: objective.isCompleted ? "#0f172a" : "transparent",
                }}
              >
                ✓
              </span>
              <span className="flex-1">{objective.description}</span>
              {objective.count && (
                <span className="text-[0.7rem] text-[#facc15]">
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

  const renderCompletedQuest = (
    quest: (typeof recentCompleted)[number]
  ) => {
    return (
      <div
        key={quest.id}
        className="flex flex-col gap-[0.4rem] rounded-[12px] border p-[0.75rem]"
        style={{
          borderColor: "rgba(167, 139, 250, 0.25)",
          background:
            "linear-gradient(150deg, rgba(76, 29, 149, 0.45), rgba(30, 27, 75, 0.92))",
        }}
      >
        <div className="flex items-center justify-between gap-[0.6rem]">
          <div className="text-[0.85rem] font-semibold text-[#ede9fe]">
            {quest.name}
          </div>
          <span
            aria-hidden="true"
            className="inline-flex h-[1.4rem] w-[1.4rem] items-center justify-center rounded-[0.35rem] border text-[0.85rem] font-bold text-[#0f172a] shadow-[0_8px_18px_-12px_rgba(196,181,253,0.6)]"
            style={{
              borderColor: "rgba(196, 181, 253, 0.65)",
              background: "rgba(196, 181, 253, 0.25)",
            }}
          >
            ✓
          </span>
        </div>
        <div className="text-[0.75rem]" style={{ color: mutedText }}>
          {quest.description}
        </div>
      </div>
    );
  };

  if (!hasActive && !hasCompleted) {
    return (
      <div
        style={{
          ...containerStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: mutedText,
          fontStyle: "italic",
        }}
        className="flex items-center justify-center italic"
      >
        {uiStrings.questLog.empty}
      </div>
    );
  }

  return (
    <div
      style={{
        ...containerStyle,
        display: "flex",
        flexDirection: "column",
        gap: "1.1rem",
        overflowY: shouldScroll ? "auto" : "hidden",
      }}
      className={cx(
        "flex flex-col gap-[1.1rem]",
        shouldScroll ? "overflow-y-auto" : "overflow-y-hidden"
      )}
    >
      {hasActive && (
        <div className="flex flex-col gap-[0.75rem]">
          <div className="text-[0.75rem] uppercase tracking-[0.28em] text-[#93c5fd] drop-shadow-[0_0_6px_rgba(96,165,250,0.4)]">
            {uiStrings.questLog.active}
          </div>
          {activeQuests.map((quest) => renderActiveQuest(quest))}
        </div>
      )}

      {hasCompleted && (
        <div className="flex flex-col gap-[0.5rem]">
          <div className="text-[0.72rem] uppercase tracking-[0.26em] text-[#c4b5fd] drop-shadow-[0_0_6px_rgba(167,139,250,0.4)]">
            {uiStrings.questLog.completed}
          </div>
          {recentCompleted.map((quest) => renderCompletedQuest(quest))}
        </div>
      )}
    </div>
  );
};

export default React.memo(OpsBriefingsPanel);
