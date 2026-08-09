import { LEVEL0_LAYOUT_CONTRACT } from '../../../../content/levels/level0/layoutContract';
import {
  getLevel0LoopDisplayName,
  LEVEL0_LOOP_DISPLAY_NAMES,
} from '../routeNames';

describe('Level 0 localized loop display names (GDR-SET-007)', () => {
  it('covers exactly the stable traversal-loop IDs from the locked layout contract', () => {
    const contractLoopIds = LEVEL0_LAYOUT_CONTRACT.traversalLoops.map((loop) => loop.id).sort();
    expect(Object.keys(LEVEL0_LOOP_DISPLAY_NAMES).sort()).toEqual(contractLoopIds);
  });

  it('keeps the approved English display names', () => {
    expect(LEVEL0_LOOP_DISPLAY_NAMES['loop.public-contact'].en).toBe('Transit Road');
    expect(LEVEL0_LOOP_DISPLAY_NAMES['loop.logistics-service'].en).toBe('Market Ring');
    expect(LEVEL0_LOOP_DISPLAY_NAMES['loop.outer-escape'].en).toBe('Outer Space');
  });

  it('keeps the approved Ukrainian display names', () => {
    expect(LEVEL0_LOOP_DISPLAY_NAMES['loop.public-contact'].uk).toBe('Транзитна дорога');
    expect(LEVEL0_LOOP_DISPLAY_NAMES['loop.logistics-service'].uk).toBe('Ринкове кільце');
    expect(LEVEL0_LOOP_DISPLAY_NAMES['loop.outer-escape'].uk).toBe('Відкритий космос');
  });

  it('localizes by locale flag without mutating internal IDs', () => {
    expect(getLevel0LoopDisplayName('loop.public-contact', false)).toBe('Transit Road');
    expect(getLevel0LoopDisplayName('loop.public-contact', true)).toBe('Транзитна дорога');
    expect(
      LEVEL0_LAYOUT_CONTRACT.traversalLoops.find((loop) => loop.id === 'loop.public-contact')?.name
    ).toBe('Public contact loop');
  });
});
