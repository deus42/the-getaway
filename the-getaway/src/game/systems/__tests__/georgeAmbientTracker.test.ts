import { GeorgeAmbientTracker } from '../georgeAssistant';
import type { GeorgeAmbientSnapshot } from '../../interfaces/georgeAssistant';
import { createNeutralImpact } from '../../world/environment/environmentMatrix';

const buildSnapshot = (overrides: Partial<GeorgeAmbientSnapshot> = {}): GeorgeAmbientSnapshot => ({
  flags: {
    gangHeat: 'low',
    curfewLevel: 0,
    supplyScarcity: 'norm',
    blackoutTier: 'none',
  },
  impacts: overrides.impacts
    ? {
        behavior: { ...overrides.impacts.behavior },
        faction: { ...overrides.impacts.faction },
        travel: { ...overrides.impacts.travel },
      }
    : createNeutralImpact(),
  rumor: overrides.rumor ?? null,
  signage: overrides.signage ?? null,
  weather: overrides.weather ?? {
    presetId: null,
    description: '',
    storyFunction: undefined,
    updatedAt: 0,
    rainIntensity: 0,
    thunderActive: false,
    timeOfDay: 'day',
  },
  zone: {
    zoneId: overrides.zone?.zoneId ?? 'zone-1',
    zoneName: overrides.zone?.zoneName ?? 'Test Zone',
    dangerRating: overrides.zone?.dangerRating ?? 'low',
    hazards: overrides.zone?.hazards ?? [],
    summary: overrides.zone?.summary ?? null,
    directives: overrides.zone?.directives ?? [],
  },
});

describe('GeorgeAmbientTracker', () => {
  it('returns no events after priming with initial snapshot', () => {
    const tracker = new GeorgeAmbientTracker();
    tracker.prime(buildSnapshot());
    const events = tracker.collect(buildSnapshot(), 1000);
    expect(events).toHaveLength(0);
  });

  it('emits rumor events when the latest rumor changes', () => {
    const tracker = new GeorgeAmbientTracker({ cooldowns: { rumor: 0 } });
    tracker.prime(buildSnapshot());

    const events = tracker.collect(
      buildSnapshot({
        rumor: {
          groupId: 'gossip',
          lines: ['The courier vanished near Dock 8.'],
          storyFunction: 'world-building',
          updatedAt: 42,
        },
      }),
      2000
    );

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      category: 'rumor',
      groupId: 'gossip',
      lines: ['The courier vanished near Dock 8.'],
    });
  });

  it('honors per-category cooldowns for weather events', () => {
    const tracker = new GeorgeAmbientTracker({ cooldowns: { weather: 5000 } });
    tracker.prime(buildSnapshot());

    const first = tracker.collect(
      buildSnapshot({
        weather: {
          presetId: 'rain',
          description: 'Acidic drizzle coats the rooftops.',
          storyFunction: 'foreshadow',
          updatedAt: 100,
          rainIntensity: 3,
          thunderActive: false,
          timeOfDay: 'morning',
        },
      }),
      1000
    );

    const second = tracker.collect(
      buildSnapshot({
        weather: {
          presetId: 'storm',
          description: 'Static storm rolling in from the docks.',
          storyFunction: 'payoff',
          updatedAt: 200,
          rainIntensity: 5,
          thunderActive: true,
          timeOfDay: 'day',
        },
      }),
      4000
    );

    const third = tracker.collect(
      buildSnapshot({
        weather: {
          presetId: 'storm',
          description: 'Static storm rolling in from the docks.',
          storyFunction: 'payoff',
          updatedAt: 300,
          rainIntensity: 6,
          thunderActive: true,
          timeOfDay: 'evening',
        },
      }),
      7000
    );

    expect(first).toHaveLength(1);
    expect(first[0].category).toBe('weather');
    expect(second).toHaveLength(0);
    expect(third).toHaveLength(1);
    expect(third[0]).toMatchObject({
      category: 'weather',
      presetId: 'storm',
      rainIntensity: 6,
    });
  });

  it('emits weather event when only time of day changes', () => {
    const tracker = new GeorgeAmbientTracker({ cooldowns: { weather: 0 } });
    tracker.prime(
      buildSnapshot({
        weather: {
          presetId: 'overcast',
          description: 'Overcast skyline',
          storyFunction: 'world-building',
          updatedAt: 400,
          rainIntensity: 1,
          thunderActive: false,
          timeOfDay: 'day',
        },
      })
    );

    const events = tracker.collect(
      buildSnapshot({
        weather: {
          presetId: 'overcast',
          description: 'Overcast skyline',
          storyFunction: 'world-building',
          updatedAt: 400,
          rainIntensity: 1,
          thunderActive: false,
          timeOfDay: 'night',
        },
      }),
      600
    );

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      category: 'weather',
      presetId: 'overcast',
      timeOfDay: 'night',
    });
  });

  it('aggregates hazard additions and removals into a single event', () => {
    const tracker = new GeorgeAmbientTracker({ cooldowns: { hazardChange: 0 } });
    tracker.prime(
      buildSnapshot({
        zone: {
          zoneId: 'zone-1',
          zoneName: 'Test Zone',
          dangerRating: 'low',
          hazards: ['Lingering Tear Gas'],
          summary: null,
          directives: [],
        },
      })
    );

    const events = tracker.collect(
      buildSnapshot({
        zone: {
          zoneId: 'zone-1',
          zoneName: 'Test Zone',
          dangerRating: 'moderate',
          hazards: ['Lingering Tear Gas', 'Rooftop Snipers'],
          summary: null,
          directives: [],
        },
      }),
      9000
    );

    expect(events).toHaveLength(2);
    const hazardEvent = events.find((event) => event.category === 'hazardChange');
    const dangerEvent = events.find((event) => event.category === 'zoneDanger');

    expect(dangerEvent).toBeDefined();
    expect(hazardEvent).toBeDefined();
    expect(hazardEvent?.added).toEqual(['Rooftop Snipers']);
    expect(hazardEvent?.removed).toEqual([]);
  });

  it('emits zone brief when zone metadata changes', () => {
    const tracker = new GeorgeAmbientTracker({ cooldowns: { zoneBrief: 0 } });
    tracker.prime(buildSnapshot());

    const events = tracker.collect(
      buildSnapshot({
        zone: {
          zoneId: 'zone-2',
          zoneName: 'Neon Docks',
          dangerRating: 'moderate',
          hazards: ['Static Storm'],
          summary: 'Dockhands are striking; patrols lean corporate.',
          directives: ['Secure fuel lines', 'Protect picket leaders'],
        },
      }),
      12000
    );

    const zoneBrief = events.find((event) => event.category === 'zoneBrief');
    expect(zoneBrief).toBeDefined();
    expect(zoneBrief).toMatchObject({
      zoneName: 'Neon Docks',
      hazards: ['Static Storm'],
      directives: ['Secure fuel lines', 'Protect picket leaders'],
    });
  });
});
