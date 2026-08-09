import {
  acquirePauseOwner,
  advanceWorldClock,
  createWorldClockState,
  crossedStreetMoments,
  jumpWorldClockMinutes,
  processedStreetMomentIdsAt,
  releasePauseOwner,
} from '../worldClock';

describe('Level 0 world clock and pause ownership', () => {
  it('starts at 18:30 and advances normal exploration at 30x', () => {
    const initial = createWorldClockState();

    expect(initial.currentMinute).toBe(18 * 60 + 30);
    expect(initial.phase).toBe('dusk');
    expect(initial.curfewActive).toBe(false);

    const result = advanceWorldClock(initial, {
      realMilliseconds: 2_000,
      activeExploration: true,
      completion: { medkitsReturned: false, transitValidated: false },
    });

    expect(result.state.currentMinute).toBe(18 * 60 + 31);
    expect(result.events).toEqual([]);
  });

  it('requires every additive pause owner to release before simulation resumes', () => {
    const pausedByMenu = acquirePauseOwner(createWorldClockState(), 'menu');
    const pausedByBoth = acquirePauseOwner(pausedByMenu, 'observation');
    const menuReleased = releasePauseOwner(pausedByBoth, 'menu');

    expect(menuReleased.pauseOwners).toEqual(['observation']);
    expect(
      advanceWorldClock(menuReleased, {
        realMilliseconds: 60_000,
        activeExploration: true,
        completion: { medkitsReturned: false, transitValidated: false },
      }).state.currentMinute
    ).toBe(18 * 60 + 30);

    const resumed = releasePauseOwner(menuReleased, 'observation');
    expect(
      advanceWorldClock(resumed, {
        realMilliseconds: 2_000,
        activeExploration: true,
        completion: { medkitsReturned: false, transitValidated: false },
      }).state.currentMinute
    ).toBe(18 * 60 + 31);
  });

  it('emits curfew once when crossing 22:00', () => {
    const beforeCurfew = createWorldClockState(21 * 60 + 59);
    const crossing = advanceWorldClock(beforeCurfew, {
      realMilliseconds: 2_000,
      activeExploration: true,
      completion: { medkitsReturned: false, transitValidated: false },
    });

    expect(crossing.state.currentMinute).toBe(22 * 60);
    expect(crossing.state.curfewActive).toBe(true);
    expect(crossing.state.phase).toBe('curfew');
    expect(crossing.events).toEqual([
      { id: 'clock.2200', boundaryMinute: 22 * 60, kind: 'curfew' },
    ]);

    const later = advanceWorldClock(crossing.state, {
      realMilliseconds: 2_000,
      activeExploration: true,
      completion: { medkitsReturned: false, transitValidated: false },
    });
    expect(later.events).toEqual([]);
  });

  it('processes every crossed boundary in order and names incomplete deadline requirements', () => {
    const beforeBlueHour = createWorldClockState(19 * 60 + 59);
    const result = jumpWorldClockMinutes(
      acquirePauseOwner(beforeBlueHour, 'safehouse_action'),
      241,
      { medkitsReturned: false, transitValidated: false }
    );

    expect(result.state.currentMinute).toBe(24 * 60);
    expect(result.events.map((event) => event.id)).toEqual([
      'clock.blue_hour',
      'clock.2100',
      'clock.2130',
      'clock.2200',
      'clock.2330',
      'clock.deadline',
    ]);
    expect(result.events[result.events.length - 1]).toEqual({
      id: 'clock.deadline',
      boundaryMinute: 24 * 60,
      kind: 'deadline-failure',
      missing: ['medkits-returned', 'transit-validated'],
    });
  });

  it('does not create a deadline failure after both completion requirements are true', () => {
    const result = jumpWorldClockMinutes(
      createWorldClockState(23 * 60 + 59),
      1,
      { medkitsReturned: true, transitValidated: true }
    );

    expect(result.state.deadlineReached).toBe(true);
    expect(result.events).toEqual([]);
  });

  it('fires each street moment exactly once across ticks that land on the boundary', () => {
    const completion = { medkitsReturned: false, transitValidated: false };
    const beforeFirst = createWorldClockState(20 * 60 + 59);
    const crossing = advanceWorldClock(beforeFirst, {
      realMilliseconds: 2_000,
      activeExploration: true,
      completion,
    });

    expect(crossing.state.currentMinute).toBe(21 * 60);
    expect(crossing.events).toEqual([
      { id: 'clock.2100', boundaryMinute: 21 * 60, kind: 'street-moment' },
    ]);
    expect(crossing.state.processedBoundaryIds).toEqual(['clock.2100']);
    expect(crossing.state.lastProcessedScheduleBoundaryId).toBe('clock.2100');

    const afterPauseOnBoundary = releasePauseOwner(
      acquirePauseOwner(crossing.state, 'menu'),
      'menu'
    );
    const later = advanceWorldClock(afterPauseOnBoundary, {
      realMilliseconds: 2_000,
      activeExploration: true,
      completion,
    });
    expect(later.events).toEqual([]);
  });

  it('treats hydration on either side of a street boundary as already-processed history', () => {
    const hydratedPastFirst = createWorldClockState(21 * 60 + 5);
    expect(processedStreetMomentIdsAt(hydratedPastFirst.currentMinute)).toEqual([
      'clock.2100',
    ]);
    expect(hydratedPastFirst.processedBoundaryIds).toEqual(['clock.2100']);
    expect(createWorldClockState(23 * 60 + 45).processedBoundaryIds).toEqual([
      'clock.2100',
      'clock.2130',
      'clock.2200',
      'clock.2330',
    ]);

    const advanced = advanceWorldClock(hydratedPastFirst, {
      realMilliseconds: 10_000,
      activeExploration: true,
      completion: { medkitsReturned: false, transitValidated: false },
    });
    expect(advanced.state.currentMinute).toBe(21 * 60 + 10);
    expect(advanced.events).toEqual([]);
  });

  it('reports no street crossings for equal or rewound minutes (pause and baseline restore)', () => {
    expect(crossedStreetMoments(21 * 60, 21 * 60)).toEqual([]);
    expect(crossedStreetMoments(23 * 60 + 30, 21 * 60 + 30)).toEqual([]);
    expect(
      crossedStreetMoments(20 * 60 + 55, 21 * 60 + 35).map((moment) => moment.id)
    ).toEqual(['clock.2100', 'clock.2130']);
  });
});
