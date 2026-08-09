import { LEVEL0_STREET_MOMENTS } from '../../runtime/worldClock';
import {
  crowdStateAt,
  LEVEL0_STREET_MOMENT_CONTENT,
  lastTrainCadenceActiveAt,
  orderedStreetMomentContent,
  shutterStateAt,
  streetStageAt,
} from '../streetMoments';

describe('Level 0 street-moment content (GDR-TIME-004)', () => {
  it('authors content for exactly the four runtime street boundaries', () => {
    const runtimeIds = LEVEL0_STREET_MOMENTS.map((moment) => moment.id);
    expect(Object.keys(LEVEL0_STREET_MOMENT_CONTENT).sort()).toEqual([...runtimeIds].sort());
    for (const moment of LEVEL0_STREET_MOMENTS) {
      expect(LEVEL0_STREET_MOMENT_CONTENT[moment.id].boundaryMinute).toBe(moment.boundaryMinute);
    }
    expect(orderedStreetMomentContent().map((content) => content.boundaryMinute)).toEqual([
      21 * 60,
      21 * 60 + 30,
      22 * 60,
      23 * 60 + 30,
    ]);
  });

  it('provides distinct bilingual announcements and subtitles for every moment', () => {
    const seen = new Set<string>();
    for (const content of orderedStreetMomentContent()) {
      for (const copy of [content.announcement, content.subtitle]) {
        expect(copy.en.trim().length).toBeGreaterThan(0);
        expect(copy.uk.trim().length).toBeGreaterThan(0);
        expect(copy.en).not.toBe(copy.uk);
      }
      expect(seen.has(content.announcement.en)).toBe(false);
      seen.add(content.announcement.en);
      expect(seen.has(content.cueId)).toBe(false);
      seen.add(content.cueId);
    }
  });

  it('speaks the approved route names in signage language', () => {
    const second = LEVEL0_STREET_MOMENT_CONTENT['street.wind_down_second'];
    expect(second.announcement.en).toContain('Market Ring');
    expect(second.announcement.uk).toContain('Ринков');

    const lastTrain = LEVEL0_STREET_MOMENT_CONTENT['street.last_train'];
    expect(lastTrain.announcement.en).toContain('Transit Road');
    expect(lastTrain.announcement.uk).toContain('Транзитн');

    const curfew = LEVEL0_STREET_MOMENT_CONTENT['street.curfew_lockdown'];
    expect(curfew.announcement.en).toContain('Hidzu Corporation');
    expect(curfew.announcement.uk).toContain('Хідзу');
  });

  it('derives monotone street stages from the world minute', () => {
    expect(streetStageAt(18 * 60 + 30)).toBe('evening');
    expect(streetStageAt(20 * 60 + 59)).toBe('evening');
    expect(streetStageAt(21 * 60)).toBe('wind-down-first');
    expect(streetStageAt(21 * 60 + 29)).toBe('wind-down-first');
    expect(streetStageAt(21 * 60 + 30)).toBe('wind-down-second');
    expect(streetStageAt(22 * 60)).toBe('curfew');
    expect(streetStageAt(23 * 60 + 29)).toBe('curfew');
    expect(streetStageAt(23 * 60 + 30)).toBe('last-train');
    expect(streetStageAt(24 * 60)).toBe('last-train');
  });

  it('derives shutters, crowd, and last-train cadence for scene presentation', () => {
    expect(shutterStateAt(20 * 60)).toBe('open');
    expect(shutterStateAt(21 * 60)).toBe('closing');
    expect(shutterStateAt(22 * 60)).toBe('closed');

    expect(crowdStateAt(19 * 60)).toBe('evening');
    expect(crowdStateAt(21 * 60)).toBe('thinning');
    expect(crowdStateAt(21 * 60 + 45)).toBe('sparse');
    expect(crowdStateAt(22 * 60 + 1)).toBe('cleared');

    expect(lastTrainCadenceActiveAt(23 * 60 + 29)).toBe(false);
    expect(lastTrainCadenceActiveAt(23 * 60 + 30)).toBe(true);
  });
});
