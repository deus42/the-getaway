import { GeorgeAmbientTracker } from '../georgeAssistant';
import type { GeorgeAmbientSnapshot } from '../../interfaces/georgeAssistant';

const buildSnapshot = (overrides: Partial<GeorgeAmbientSnapshot> = {}): GeorgeAmbientSnapshot => ({
  flags: {
    gangHeat: 'low',
    curfewLevel: 0,
    supplyScarcity: 'norm',
    blackoutTier: 'none',
  },
  rumor: overrides.rumor ?? null,
  signage: overrides.signage ?? null,
  weather: overrides.weather ?? {
    presetId: null,
    description: '',
    storyFunction: undefined,
    updatedAt: 0,
    rainIntensity: 0,
    thunderActive: false,
  },
  zone: overrides.zone ?? {
    zoneId: 'zone-1',
    zoneName: 'Test Zone',
    dangerRating: 'low',
    hazards: [],
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

  it('aggregates hazard additions and removals into a single event', () => {
    const tracker = new GeorgeAmbientTracker({ cooldowns: { hazardChange: 0 } });
    tracker.prime(
      buildSnapshot({
        zone: {
          zoneId: 'zone-1',
          zoneName: 'Test Zone',
          dangerRating: 'low',
          hazards: ['Lingering Tear Gas'],
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
});
