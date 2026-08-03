import { LEVEL0_LAYOUT_CONTRACT } from '../../../../content/levels/level0/layoutContract';
import { resolveLevel0Interaction } from '../interactionResolver';

describe('resolveLevel0Interaction', () => {
  it('returns an authored interaction in forgiving range', () => {
    const result = resolveLevel0Interaction(
      LEVEL0_LAYOUT_CONTRACT,
      { x: 15.5, y: 47 },
      { preferredAnchorId: 'interaction.safehouse.rest' }
    );

    expect(result.status).toBe('available');
    expect(result.anchor?.id).toBe('interaction.safehouse.rest');
  });

  it('explains when a preferred target is too far away', () => {
    const result = resolveLevel0Interaction(
      LEVEL0_LAYOUT_CONTRACT,
      { x: 40, y: 30 },
      { preferredAnchorId: 'terminal.cache_locker' }
    );

    expect(result.status).toBe('too-far');
    expect(result.reasonId).toBe('interaction.too_far');
    expect(result.distance).toBeGreaterThan(20);
  });

  it('does not surface cameras or audio anchors as direct interactions', () => {
    const result = resolveLevel0Interaction(
      LEVEL0_LAYOUT_CONTRACT,
      { x: 58, y: 21 },
      { maximumSearchRadius: 1 }
    );

    expect(result.status).toBe('none');
    expect(result.anchor).toBeNull();
  });

  it('rejects undiscovered and wrong-domain preferred targets', () => {
    const unknown = resolveLevel0Interaction(
      LEVEL0_LAYOUT_CONTRACT,
      { x: 67, y: 29 },
      {
        preferredAnchorId: 'terminal.cache_locker',
        knownAnchorIds: ['interaction.safehouse.rest'],
      }
    );
    expect(unknown).toMatchObject({
      status: 'unavailable',
      reasonId: 'interaction.undiscovered',
    });

    const wrongOwner = resolveLevel0Interaction(
      LEVEL0_LAYOUT_CONTRACT,
      { x: 15, y: 47 },
      {
        preferredAnchorId: 'interaction.safehouse.rest',
        knownAnchorIds: ['interaction.safehouse.rest'],
        worldOwnedAnchorIds: [],
      }
    );
    expect(wrongOwner).toMatchObject({
      status: 'unavailable',
      reasonId: 'interaction.wrong_owner',
    });
  });

  it('prefers a usable target over a nearer unavailable target', () => {
    const result = resolveLevel0Interaction(
      LEVEL0_LAYOUT_CONTRACT,
      { x: 16.5, y: 47 },
      {
        knownAnchorIds: ['interaction.safehouse.rest', 'interaction.safehouse.wait'],
        unavailableReasonByAnchorId: {
          'interaction.safehouse.rest': 'safehouse.blocked.observed',
        },
      }
    );

    expect(result.status).toBe('available');
    expect(result.anchor?.id).toBe('interaction.safehouse.wait');
  });

  it('does not reveal undiscovered or wrong-owner targets during automatic discovery', () => {
    const undiscovered = resolveLevel0Interaction(
      LEVEL0_LAYOUT_CONTRACT,
      { x: 67, y: 29 },
      { knownAnchorIds: ['interaction.safehouse.rest'] }
    );
    expect(undiscovered).toEqual({
      status: 'none',
      anchor: null,
      distance: null,
      reasonId: null,
    });

    const wrongOwner = resolveLevel0Interaction(
      LEVEL0_LAYOUT_CONTRACT,
      { x: 15, y: 47 },
      {
        knownAnchorIds: ['interaction.safehouse.rest'],
        worldOwnedAnchorIds: [],
      }
    );
    expect(wrongOwner).toEqual({
      status: 'none',
      anchor: null,
      distance: null,
      reasonId: null,
    });
  });

  it('reports an authored target as occluded when solid geometry blocks line of use', () => {
    const contract = {
      ...LEVEL0_LAYOUT_CONTRACT,
      occluders: [
        ...LEVEL0_LAYOUT_CONTRACT.occluders,
        [
          { x: 15.2, y: 46.8 },
          { x: 15.4, y: 46.8 },
          { x: 15.4, y: 47.2 },
          { x: 15.2, y: 47.2 },
        ],
      ],
    };
    const result = resolveLevel0Interaction(
      contract,
      { x: 15.5, y: 47 },
      { preferredAnchorId: 'interaction.safehouse.rest' }
    );

    expect(result).toMatchObject({
      status: 'blocked',
      reasonId: 'interaction.occluded',
    });
  });
});
