export const MISSION_ACCOMPLISHED_EVENT = 'MISSION_ACCOMPLISHED';
export const LEVEL_ADVANCE_REQUESTED_EVENT = 'LEVEL_ADVANCE_REQUESTED';

export interface MissionEventDetail {
  level: number;
  levelId: string;
  name: string;
}

export interface LevelAdvanceEventDetail extends MissionEventDetail {
  nextLevel: number;
  nextLevelId?: string;
}

export const emitMissionAccomplishedEvent = (detail: MissionEventDetail): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<MissionEventDetail>(MISSION_ACCOMPLISHED_EVENT, {
      detail,
    })
  );
};

export const emitLevelAdvanceRequestedEvent = (detail: LevelAdvanceEventDetail): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<LevelAdvanceEventDetail>(LEVEL_ADVANCE_REQUESTED_EVENT, {
      detail,
    })
  );
};
