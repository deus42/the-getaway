import { CHARACTER_SPRITE_MANIFEST } from '../../../../content/characters/spriteManifest';
import { LEVEL0_LAYOUT_CONTRACT } from '../../../../content/levels/level0/layoutContract';
import { GET204_CITY_RUNTIME } from '../../art/get204City';
import {
  CIVILIAN_PHASE_PRESENTATION,
  civilianGroupPhaseAt,
  GET204_CROWD_HIDDEN_ACTOR_IDS,
  LEVEL0_CIVILIAN_GROUPS,
} from '../civilianSchedules';

describe('Level 0 civilian schedules (OPEN-CIV-001 trial)', () => {
  const delivery = LEVEL0_CIVILIAN_GROUPS['civilians.delivery_activity'];
  const queue = LEVEL0_CIVILIAN_GROUPS['civilians.public_queue'];

  it('authors exactly three service workers and four queue civilians', () => {
    expect(delivery.members).toHaveLength(3);
    expect(queue.members).toHaveLength(4);
    const ids = [...delivery.members, ...queue.members].map((member) => member.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('binds each group to a real blending context anchor near its members', () => {
    for (const group of [delivery, queue]) {
      const anchor = LEVEL0_LAYOUT_CONTRACT.anchors.find(
        (candidate) => candidate.id === group.contextAnchorId
      );
      expect(anchor).toBeDefined();
      expect(anchor?.kind).toBe('blending');
      for (const member of group.members) {
        expect(Math.hypot(member.offset.x, member.offset.y)).toBeLessThanOrEqual(1.2);
      }
    }
  });

  it('uses only committed civilian sprite sets', () => {
    const validIds = new Set(CHARACTER_SPRITE_MANIFEST.map((entry) => entry.spriteSetId));
    for (const member of [...delivery.members, ...queue.members]) {
      expect(validIds.has(member.spriteSetId)).toBe(true);
    }
  });

  it('ties phases to the 21:00, 21:30, and 22:00 street boundaries', () => {
    expect(civilianGroupPhaseAt(delivery, 18 * 60 + 30)).toBe('arriving');
    expect(civilianGroupPhaseAt(delivery, 19 * 60)).toBe('holding');
    expect(civilianGroupPhaseAt(delivery, 21 * 60 - 1)).toBe('holding');
    expect(civilianGroupPhaseAt(delivery, 21 * 60)).toBe('departing');
    expect(civilianGroupPhaseAt(delivery, 21 * 60 + 30)).toBe('inactive');

    expect(civilianGroupPhaseAt(queue, 19 * 60 + 15)).toBe('holding');
    expect(civilianGroupPhaseAt(queue, 21 * 60 + 30)).toBe('departing');
    expect(civilianGroupPhaseAt(queue, 22 * 60)).toBe('inactive');
  });

  it('keeps both groups inactive through the whole curfew window', () => {
    for (const minute of [22 * 60, 22 * 60 + 45, 23 * 60 + 30, 24 * 60]) {
      expect(civilianGroupPhaseAt(delivery, minute)).toBe('inactive');
      expect(civilianGroupPhaseAt(queue, minute)).toBe('inactive');
    }
  });

  it('fades presentation monotonically from holding to inactive', () => {
    expect(CIVILIAN_PHASE_PRESENTATION.holding.alpha).toBe(1);
    expect(CIVILIAN_PHASE_PRESENTATION.departing.alpha).toBeLessThan(
      CIVILIAN_PHASE_PRESENTATION.holding.alpha
    );
    expect(CIVILIAN_PHASE_PRESENTATION.inactive.alpha).toBe(0);
  });

  it('hides only real GET-204 civilian dressing actors as the crowd thins', () => {
    const populationIds = new Set(GET204_CITY_RUNTIME.population.map((actor) => actor.id));
    const civilianIds = new Set(
      GET204_CITY_RUNTIME.population
        .filter((actor) => actor.kind === 'civilian')
        .map((actor) => actor.id)
    );
    let previous: readonly string[] = [];
    for (const state of ['evening', 'thinning', 'sparse', 'cleared'] as const) {
      const hidden = GET204_CROWD_HIDDEN_ACTOR_IDS[state];
      for (const id of hidden) {
        expect(populationIds.has(id)).toBe(true);
        expect(civilianIds.has(id)).toBe(true);
      }
      for (const id of previous) {
        expect(hidden).toContain(id);
      }
      previous = hidden;
    }
    expect(GET204_CROWD_HIDDEN_ACTOR_IDS.cleared.length).toBe(civilianIds.size);
  });
});
