import { shouldAdvanceLevel0Clock } from '../clockEligibility';

describe('Level 0 live clock eligibility', () => {
  const readyExploration = {
    hasRun: true,
    menuOpen: false,
    sceneReady: true,
    documentHidden: false,
  } as const;

  it('advances only after the player-visible Phaser scene is ready', () => {
    expect(shouldAdvanceLevel0Clock(readyExploration)).toBe(true);
    expect(shouldAdvanceLevel0Clock({ ...readyExploration, sceneReady: false })).toBe(false);
  });

  it('does not advance while the page is hidden or the menu owns the surface', () => {
    expect(shouldAdvanceLevel0Clock({ ...readyExploration, documentHidden: true })).toBe(false);
    expect(shouldAdvanceLevel0Clock({ ...readyExploration, menuOpen: true })).toBe(false);
    expect(shouldAdvanceLevel0Clock({ ...readyExploration, hasRun: false })).toBe(false);
  });
});
