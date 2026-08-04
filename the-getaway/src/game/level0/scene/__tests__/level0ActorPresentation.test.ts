import { LEVEL0_LAYOUT_CONTRACT } from '../../../../content/levels/level0/layoutContract';
import {
  LEVEL0_CONTACT_ACTOR_PRESENTATIONS,
  LEVEL0_ACTOR_INTERACTION_DURATION_MS,
  LEVEL0_DEFAULT_PLAYER_APPEARANCE_ID,
  LEVEL0_GEORGE_PRESENTATION,
  LEVEL0_PLAYER_APPEARANCE_IDS,
  isLevel0PlayerAppearanceId,
  resolveLevel0GeorgeWorldPresentation,
  resolveLevel0PlayerSpriteState,
  resolveLevel0SceneSpriteSetIds,
  resolveLevel0SpriteDirection,
} from '../level0ActorPresentation';

describe('Level 0 actor presentation bindings', () => {
  it('exposes exactly four neutral protagonist selections', () => {
    expect(LEVEL0_DEFAULT_PLAYER_APPEARANCE_ID).toBe('player_civilian_01');
    expect(LEVEL0_PLAYER_APPEARANCE_IDS).toEqual([
      'player_civilian_01',
      'player_civilian_02',
      'player_civilian_03',
      'player_civilian_04',
    ]);
    expect(LEVEL0_PLAYER_APPEARANCE_IDS.every(isLevel0PlayerAppearanceId)).toBe(true);
    expect(isLevel0PlayerAppearanceId('hero_operative')).toBe(false);
  });

  it('binds the three named contacts to their authoritative ground anchors', () => {
    expect(LEVEL0_CONTACT_ACTOR_PRESENTATIONS.map((entry) => ({
      actorId: entry.actorId,
      anchorId: entry.anchorId,
      position: entry.position,
    }))).toEqual([
      {
        actorId: 'contact_lira',
        anchorId: 'contact.lira',
        position: LEVEL0_LAYOUT_CONTRACT.anchors.find((anchor) => anchor.id === 'contact.lira')!.position,
      },
      {
        actorId: 'contact_naila',
        anchorId: 'contact.naila',
        position: LEVEL0_LAYOUT_CONTRACT.anchors.find((anchor) => anchor.id === 'contact.naila')!.position,
      },
      {
        actorId: 'contact_brant',
        anchorId: 'contact.brant',
        position: LEVEL0_LAYOUT_CONTRACT.anchors.find((anchor) => anchor.id === 'contact.brant')!.position,
      },
    ]);
  });

  it('selects only one protagonist and the three named contacts for the canonical scene', () => {
    expect(resolveLevel0SceneSpriteSetIds('player_civilian_03')).toEqual([
      'player_civilian_03',
      'contact_lira',
      'contact_naila',
      'contact_brant',
    ]);
    expect(resolveLevel0SceneSpriteSetIds('unknown-appearance')).toEqual([
      'contact_lira',
      'contact_naila',
      'contact_brant',
    ]);
  });

  it.each([
    [{ x: 0, y: -1 }, 'north-east'],
    [{ x: 1, y: -1 }, 'east'],
    [{ x: 1, y: 0 }, 'south-east'],
    [{ x: 1, y: 1 }, 'south'],
    [{ x: 0, y: 1 }, 'south-west'],
    [{ x: -1, y: 1 }, 'west'],
    [{ x: -1, y: 0 }, 'north-west'],
    [{ x: -1, y: -1 }, 'north'],
    [{ x: 0, y: 0 }, 'south'],
  ] as const)('quantizes projected screen facing %o to %s', (facing, expected) => {
    expect(resolveLevel0SpriteDirection(facing)).toBe(expected);
  });

  it('keeps the bounded interaction presentation ahead of movement', () => {
    expect(LEVEL0_ACTOR_INTERACTION_DURATION_MS).toBe(800);
    expect(resolveLevel0PlayerSpriteState('idle', 1_000, 1_800)).toBe('interact');
    expect(resolveLevel0PlayerSpriteState('idle', 1_800, 1_800)).toBe('idle');
    expect(resolveLevel0PlayerSpriteState('click', 1_000, 1_800)).toBe('interact');
    expect(resolveLevel0PlayerSpriteState('keyboard', 1_000, 1_800)).toBe('interact');
    expect(resolveLevel0PlayerSpriteState('click', 1_800, 1_800)).toBe('move');
    expect(resolveLevel0PlayerSpriteState('keyboard', 1_800, 1_800)).toBe('move');
  });

  it('keeps George at a stable 32 screen pixels beside the protagonist across zooms', () => {
    expect(LEVEL0_GEORGE_PRESENTATION.screenHeightPx).toBe(32);
    for (const zoom of [0.6, 0.78, 1.25]) {
      const result = resolveLevel0GeorgeWorldPresentation({ x: 100, y: 200 }, zoom);
      expect(result.position).toEqual({
        x: 100 + LEVEL0_GEORGE_PRESENTATION.screenOffsetPx.x / zoom,
        y: 200 + LEVEL0_GEORGE_PRESENTATION.screenOffsetPx.y / zoom,
      });
      expect(
        result.scale * LEVEL0_GEORGE_PRESENTATION.visibleAlphaHeightPx * zoom
      ).toBeCloseTo(32);
    }
  });
});
