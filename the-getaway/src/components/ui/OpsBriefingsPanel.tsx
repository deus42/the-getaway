import React from 'react';
import { useSelector } from 'react-redux';
import { getUIStrings } from '../../content/ui';
import { RootState } from '../../store';
import {
  OpsBriefingQuestModel,
  selectOpsBriefingModel,
} from '../../store/selectors/opsBriefingSelectors';
import '../../styles/hud-ops-panel.css';

interface OpsBriefingsPanelProps {
  showCompleted?: boolean;
}

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const OpsBriefingsPanel: React.FC<OpsBriefingsPanelProps> = ({
  showCompleted = false,
}) => {
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = getUIStrings(locale);
  const briefing = useSelector(selectOpsBriefingModel);

  const formatReward = (rewardCount: number, label: string) => {
    if (rewardCount <= 0) {
      return null;
    }

    if (locale === 'en') {
      return rewardCount > 1 ? `${rewardCount} ${label}s` : `${rewardCount} ${label}`;
    }

    return `${rewardCount} ${label}`;
  };

  const renderRewards = (quest: OpsBriefingQuestModel) => {
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
      <div className='text-[0.66rem] uppercase tracking-[0.18em] text-[#34d399]'>
        {uiStrings.questLog.rewardsHeading}: {rewardLabels.join(' • ')}
      </div>
    );
  };

  const renderSectionLabel = (copy: string) => (
    <h4 className='hud-ops-section-label text-[0.62rem] font-semibold text-[#93c5fd]'>
      {copy}
    </h4>
  );

  const renderPrimaryObjectives = () => {
    if (briefing.primaryObjectives.length === 0) {
      return (
        <div className='hud-ops-empty text-[0.7rem]'>{uiStrings.questLog.primaryEmpty}</div>
      );
    }

    return (
      <div className='flex flex-col gap-2.5'>
        {briefing.primaryObjectives.map((objective) => (
          <div
            key={objective.id}
            className='hud-ops-card hud-ops-card--active flex items-start justify-between gap-3 p-[0.8rem]'
          >
            <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
              <div className='text-[0.76rem] font-semibold tracking-[0.04em] text-slate-100'>
                {objective.label}
              </div>
              {objective.summary ? (
                <p className='hud-ops-text-muted text-[0.68rem] leading-[1.45]'>{objective.summary}</p>
              ) : null}
            </div>
            <div className='flex min-w-[4.6rem] flex-col items-end gap-1'>
              <span
                className='text-[0.62rem] uppercase tracking-[0.16em]'
                style={{
                  color: objective.isComplete ? '#86efac' : '#facc15',
                }}
              >
                {objective.isComplete
                  ? uiStrings.questLog.primaryComplete
                  : uiStrings.questLog.primaryInProgress}
              </span>
              <span className='text-[0.66rem] text-[#e2e8f0]'>
                {objective.completedQuests}/{objective.totalQuests}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderActiveSideQuests = () => {
    if (briefing.activeSideQuests.length === 0) {
      return (
        <div className='hud-ops-empty text-[0.7rem]'>{uiStrings.questLog.activeSideEmpty}</div>
      );
    }

    return (
      <div className='flex flex-col gap-2.5'>
        {briefing.activeSideQuests.map((quest) => (
          <div key={quest.id} className='hud-ops-card hud-ops-card--active flex flex-col gap-2.5 p-[0.88rem]'>
            <div className='text-[0.84rem] font-semibold tracking-[0.05em] text-slate-50'>
              {quest.name}
            </div>
            <p className='hud-ops-text-muted text-[0.72rem] leading-[1.5]'>
              {quest.description}
            </p>
            <div className='flex flex-col gap-2.5'>
              {quest.objectives.map((objective) => (
                <div
                  key={objective.id}
                  className='flex items-start gap-[0.52rem] text-[0.72rem] text-[#cbd5f5]'
                >
                  <span
                    aria-hidden='true'
                    className='hud-ops-objective-check mt-[1px]'
                    data-completed={objective.isCompleted}
                  >
                    ✓
                  </span>
                  <span className='flex-1 leading-tight'>{objective.description}</span>
                  {objective.count ? (
                    <span className='text-[0.62rem] uppercase tracking-[0.14em] text-[#facc15]'>
                      {(objective.currentCount ?? 0)}/{objective.count}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
            {renderRewards(quest)}
          </div>
        ))}
      </div>
    );
  };

  const renderAvailableSideQuests = () => {
    if (briefing.availableSideQuests.length === 0) {
      return (
        <div className='hud-ops-empty text-[0.7rem]'>{uiStrings.questLog.availableSideEmpty}</div>
      );
    }

    return (
      <div className='flex flex-col gap-2.5'>
        {briefing.availableSideQuests.map((quest) => (
          <div key={quest.id} className='hud-ops-card flex flex-col gap-2.5 p-[0.84rem]'>
            <div className='text-[0.78rem] font-semibold tracking-[0.05em] text-[#e2e8f0]'>
              {quest.name}
            </div>
            {quest.missionSummary ? (
              <p className='hud-ops-text-muted text-[0.7rem] leading-[1.5]'>{quest.missionSummary}</p>
            ) : (
              <p className='hud-ops-text-muted text-[0.7rem] leading-[1.5]'>{quest.description}</p>
            )}
            <div className='text-[0.64rem] uppercase tracking-[0.14em] text-[#93c5fd]'>
              {quest.giverName
                ? uiStrings.questLog.giverLabel(quest.giverName)
                : uiStrings.questLog.giverUnknown}
            </div>
            <div className='flex flex-col gap-2'>
              {quest.objectives.map((objective) => (
                <div
                  key={objective.id}
                  className='flex items-start gap-[0.52rem] text-[0.69rem] text-[#b7c3df]'
                >
                  <span
                    aria-hidden='true'
                    className='hud-ops-objective-check mt-[1px]'
                    data-completed={objective.isCompleted}
                  >
                    ✓
                  </span>
                  <span className='flex-1 leading-tight'>{objective.description}</span>
                  {objective.count ? (
                    <span className='text-[0.62rem] uppercase tracking-[0.14em] text-[#facc15]'>
                      {(objective.currentCount ?? 0)}/{objective.count}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
            {renderRewards(quest)}
          </div>
        ))}
      </div>
    );
  };

  const renderCompletedQuests = () => {
    if (briefing.completedQuests.length === 0) {
      return (
        <div className='hud-ops-empty text-[0.72rem]'>{uiStrings.questLog.completedEmpty}</div>
      );
    }

    return (
      <div className='flex flex-col gap-2.5'>
        {briefing.completedQuests.map((quest) => (
          <div
            key={quest.id}
            className='hud-ops-card hud-ops-card--completed flex flex-col gap-2.5 p-[0.84rem]'
          >
            <div className='flex items-center justify-between gap-2'>
              <div className='text-[0.78rem] font-semibold tracking-[0.05em] text-[#ede9fe]'>
                {quest.name}
              </div>
              <span
                aria-hidden='true'
                className='hud-ops-complete-badge inline-flex h-[1.15rem] w-[1.15rem] items-center justify-center rounded-[0.35rem] text-[0.72rem] font-bold'
              >
                ✓
              </span>
            </div>
            <p className='hud-ops-text-muted text-[0.7rem] leading-[1.5]'>{quest.description}</p>
          </div>
        ))}
      </div>
    );
  };

  if (showCompleted) {
    return (
      <div className='flex flex-col gap-3.5 overflow-y-auto pr-1'>
        <section className='flex flex-col gap-2.5'>
          {renderSectionLabel(uiStrings.questLog.completed)}
          {renderCompletedQuests()}
        </section>
      </div>
    );
  }

  const shouldScroll =
    briefing.primaryObjectives.length +
      briefing.activeSideQuests.length +
      briefing.availableSideQuests.length >
    4;

  return (
    <div
      className={cx(
        'flex flex-col gap-4 pr-1',
        shouldScroll ? 'overflow-y-auto' : 'overflow-y-hidden'
      )}
    >
      <section className='flex flex-col gap-2.5'>
        {renderSectionLabel(uiStrings.questLog.primaryProgress)}
        {renderPrimaryObjectives()}
      </section>

      <section className='flex flex-col gap-2.5'>
        {renderSectionLabel(uiStrings.questLog.activeSideQuests)}
        {renderActiveSideQuests()}
      </section>

      <section className='flex flex-col gap-2.5'>
        {renderSectionLabel(uiStrings.questLog.availableSideQuests)}
        {renderAvailableSideQuests()}
      </section>
    </div>
  );
};

export default React.memo(OpsBriefingsPanel);
