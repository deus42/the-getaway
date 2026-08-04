import type { Level0RunState } from '../runtime/types';
import { LEVEL0_LONG_TERM_CAP } from './creation';
import type { AttributeKey, SkillKey } from './types';

export const LEVEL0_PROVISIONAL_PROGRESSION = {
  levelThresholds: { 2: 100 } as Record<number, number>,
  milestones: {
    'milestone.medkits_returned': {
      amount: 50,
      feedbackId: 'progression.medkits_returned',
    },
    'milestone.transit_validated': {
      amount: 50,
      feedbackId: 'progression.transit_validated',
    },
  },
} as const;

export type Level0MilestoneId = keyof typeof LEVEL0_PROVISIONAL_PROGRESSION.milestones;

export const getNextLevelThreshold = (currentLevel: number): number | null =>
  LEVEL0_PROVISIONAL_PROGRESSION.levelThresholds[currentLevel + 1] ?? null;

export interface Level0AllocationAvailability {
  available: boolean;
  blockedReasonId?: 'level_up.safehouse_or_debrief_only';
}

export const evaluateLevel0AllocationContext = (
  run: Level0RunState
): Level0AllocationAvailability => {
  const available = run.mission === 'L0_DEBRIEF' || (
    run.safehouse.insideBoundary &&
    run.surveillance.level === 'clear' &&
    !run.surveillance.directlyObserved &&
    run.mission !== 'L0_FAILED' &&
    run.mission !== 'L0_COMPLETE'
  );
  return available
    ? { available: true }
    : { available: false, blockedReasonId: 'level_up.safehouse_or_debrief_only' };
};

export const awardLevel0Milestone = (
  run: Level0RunState,
  milestoneId: Level0MilestoneId
): { run: Level0RunState; applied: boolean; blockedReasonId?: string } => {
  if (run.mission === 'L0_FAILED' || run.mission === 'L0_COMPLETE') {
    return { run, applied: false, blockedReasonId: 'progression.blocked.terminal' };
  }
  if (run.rpg.awardedMilestoneIds.includes(milestoneId)) return { run, applied: false };
  const milestone = LEVEL0_PROVISIONAL_PROGRESSION.milestones[milestoneId];
  const before = run.build.xp;
  const after = before + milestone.amount;
  const threshold = getNextLevelThreshold(run.build.level);
  const pendingLevelUps = threshold !== null && before < threshold && after >= threshold
    ? run.rpg.pendingLevelUps + 1
    : run.rpg.pendingLevelUps;
  return {
    applied: true,
    run: {
      ...run,
      build: { ...run.build, xp: after },
      rpg: {
        ...run.rpg,
        awardedMilestoneIds: [...run.rpg.awardedMilestoneIds, milestoneId],
        pendingLevelUps,
        xpEvents: [
          ...run.rpg.xpEvents,
          {
            milestoneId,
            amount: milestone.amount,
            before,
            after,
            worldMinute: run.worldClock.currentMinute,
            feedbackId: milestone.feedbackId,
          },
        ],
      },
    },
  };
};

export const activatePendingLevelUp = (
  run: Level0RunState
): { run: Level0RunState; applied: boolean; blockedReasonId?: string } => {
  if (run.rpg.pendingLevelUps <= 0) {
    return { run, applied: false, blockedReasonId: 'level_up.none_pending' };
  }
  if (!evaluateLevel0AllocationContext(run).available) {
    return { run, applied: false, blockedReasonId: 'level_up.safehouse_or_debrief_only' };
  }
  const before = run.build.level;
  const after = before + 1;
  return {
    applied: true,
    run: {
      ...run,
      build: {
        ...run.build,
        level: after,
        unspentSkillPoints: run.build.unspentSkillPoints + 2,
        unspentAttributePoints: run.build.unspentAttributePoints + (after % 3 === 0 ? 1 : 0),
      },
      rpg: {
        ...run.rpg,
        pendingLevelUps: run.rpg.pendingLevelUps - 1,
        allocationEvents: [
          ...run.rpg.allocationEvents,
          {
            eventId: `level-up.${after}`,
            kind: 'level',
            before,
            after,
            worldMinute: run.worldClock.currentMinute,
          },
        ],
      },
    },
  };
};

export const allocateLevel0SkillPoint = (
  run: Level0RunState,
  skill: SkillKey
): { run: Level0RunState; applied: boolean; blockedReasonId?: string } => {
  if (!evaluateLevel0AllocationContext(run).available) {
    return { run, applied: false, blockedReasonId: 'level_up.safehouse_or_debrief_only' };
  }
  if (run.build.unspentSkillPoints <= 0) {
    return { run, applied: false, blockedReasonId: 'level_up.no_skill_points' };
  }
  const before = run.build.skills[skill];
  if (before >= LEVEL0_LONG_TERM_CAP) {
    return { run, applied: false, blockedReasonId: 'level_up.skill_cap' };
  }
  return {
    applied: true,
    run: {
      ...run,
      build: {
        ...run.build,
        skills: { ...run.build.skills, [skill]: before + 1 },
        unspentSkillPoints: run.build.unspentSkillPoints - 1,
      },
      rpg: {
        ...run.rpg,
        allocationEvents: [
          ...run.rpg.allocationEvents,
          {
            eventId: `skill.${skill}.${run.rpg.allocationEvents.length + 1}`,
            kind: 'skill',
            key: skill,
            before,
            after: before + 1,
            worldMinute: run.worldClock.currentMinute,
          },
        ],
      },
    },
  };
};

export const allocateLevel0AttributePoint = (
  run: Level0RunState,
  attribute: AttributeKey
): { run: Level0RunState; applied: boolean; blockedReasonId?: string } => {
  if (!evaluateLevel0AllocationContext(run).available) {
    return { run, applied: false, blockedReasonId: 'level_up.safehouse_or_debrief_only' };
  }
  if (run.build.unspentAttributePoints <= 0) {
    return { run, applied: false, blockedReasonId: 'level_up.no_attribute_points' };
  }
  const before = run.build.attributes[attribute];
  if (before >= LEVEL0_LONG_TERM_CAP) {
    return { run, applied: false, blockedReasonId: 'level_up.attribute_cap' };
  }
  return {
    applied: true,
    run: {
      ...run,
      build: {
        ...run.build,
        attributes: { ...run.build.attributes, [attribute]: before + 1 },
        unspentAttributePoints: run.build.unspentAttributePoints - 1,
      },
      rpg: {
        ...run.rpg,
        allocationEvents: [
          ...run.rpg.allocationEvents,
          {
            eventId: `attribute.${attribute}.${run.rpg.allocationEvents.length + 1}`,
            kind: 'attribute',
            key: attribute,
            before,
            after: before + 1,
            worldMinute: run.worldClock.currentMinute,
          },
        ],
      },
    },
  };
};
