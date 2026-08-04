import { createLevel0SampleCharacter, validateLevel0CreationDraft } from '../creation';
import {
  activatePendingLevelUp,
  allocateLevel0AttributePoint,
  allocateLevel0SkillPoint,
  awardLevel0Milestone,
  getNextLevelThreshold,
} from '../progression';
import { createInitialLevel0RunState } from '../../runtime/safehouse';

const makeRun = () => {
  const confirmed = validateLevel0CreationDraft(
    createLevel0SampleCharacter('technical_evasion', 'Sora')
  );
  if (!confirmed.identity || !confirmed.build) throw new Error('sample must validate');
  return createInitialLevel0RunState('progression-run', confirmed.identity, confirmed.build);
};

describe('Level 0 authored milestone progression', () => {
  it('uses versioned threshold content rather than persisting it in PlayerBuild', () => {
    expect(getNextLevelThreshold(1)).toBe(100);
    expect(makeRun().build).not.toHaveProperty('nextLevelThreshold');
  });

  it('awards each milestone once and makes Level 2 pending at exactly 100 XP', () => {
    let run = makeRun();
    run = awardLevel0Milestone(run, 'milestone.medkits_returned').run;
    expect(run.build.xp).toBe(50);
    expect(run.rpg.pendingLevelUps).toBe(0);

    run = awardLevel0Milestone(run, 'milestone.medkits_returned').run;
    expect(run.build.xp).toBe(50);

    run = awardLevel0Milestone(run, 'milestone.transit_validated').run;
    expect(run.build.xp).toBe(100);
    expect(run.rpg.pendingLevelUps).toBe(1);
    expect(run.rpg.awardedMilestoneIds).toEqual([
      'milestone.medkits_returned',
      'milestone.transit_validated',
    ]);
  });

  it('rejects level activation outside safehouse/debrief and grants exact points inside', () => {
    let run = makeRun();
    run = awardLevel0Milestone(run, 'milestone.medkits_returned').run;
    run = awardLevel0Milestone(run, 'milestone.transit_validated').run;
    const outside = {
      ...run,
      safehouse: { ...run.safehouse, insideBoundary: false },
      mission: 'L0_OPERATION_DEPARTED' as const,
    };
    expect(activatePendingLevelUp(outside).applied).toBe(false);

    const activated = activatePendingLevelUp(run);
    expect(activated.applied).toBe(true);
    expect(activated.run.build).toMatchObject({
      level: 2,
      unspentSkillPoints: 2,
      unspentAttributePoints: 0,
    });
  });

  it('allocates within caps and awards one attribute point every third level', () => {
    let run = makeRun();
    run = {
      ...run,
      build: { ...run.build, level: 2 },
      rpg: { ...run.rpg, pendingLevelUps: 1 },
    };
    run = activatePendingLevelUp(run).run;
    expect(run.build).toMatchObject({
      level: 3,
      unspentSkillPoints: 2,
      unspentAttributePoints: 1,
    });

    run = allocateLevel0SkillPoint(run, 'awareness').run;
    run = allocateLevel0AttributePoint(run, 'mental').run;
    expect(run.build.skills.awareness).toBe(1);
    expect(run.build.attributes.mental).toBe(2);

    const capped = {
      ...run,
      build: {
        ...run.build,
        skills: { ...run.build.skills, awareness: 5 },
        unspentSkillPoints: 1,
      },
    };
    expect(allocateLevel0SkillPoint(capped, 'awareness').applied).toBe(false);
    expect(allocateLevel0SkillPoint(capped, 'awareness').run.build.unspentSkillPoints).toBe(1);
  });

  it('does not award new milestones after failure or completion', () => {
    const run = makeRun();
    const failed = {
      ...run,
      mission: 'L0_FAILED' as const,
      failureCause: 'failure.capture' as const,
      failureSourceId: 'interception.identity_gate',
    };
    const completed = { ...run, mission: 'L0_COMPLETE' as const };

    expect(awardLevel0Milestone(failed, 'milestone.medkits_returned')).toMatchObject({
      run: failed,
      applied: false,
      blockedReasonId: 'progression.blocked.terminal',
    });
    expect(awardLevel0Milestone(completed, 'milestone.medkits_returned')).toMatchObject({
      run: completed,
      applied: false,
      blockedReasonId: 'progression.blocked.terminal',
    });
  });
});
