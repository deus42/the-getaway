import {
  LEVEL0_SURROUND_ART_MANIFEST,
  resolveLevel0SurroundArt,
} from '../level0SurroundArtManifest';

describe('level0SurroundArtManifest', () => {
  it('defines nine anonymous painterly filler variants', () => {
    expect(LEVEL0_SURROUND_ART_MANIFEST).toHaveLength(9);
    LEVEL0_SURROUND_ART_MANIFEST.forEach((entry, index) => {
      expect(entry.id).toBe(`surround_${index}`);
      expect(entry.textureKey).toBe(`level0-surround:${index}`);
      expect(entry.textureKey).not.toContain('building:');
      expect(entry.imagePath).toBe(`buildings/level0/surround/${index}.png`);
      expect(entry.origin.x).toBeGreaterThan(0);
      expect(entry.origin.x).toBeLessThan(1);
      expect(entry.origin.y).toBeGreaterThan(0.75);
      expect(entry.origin.y).toBeLessThanOrEqual(1);
      expect(entry.basePlateWidthPx).toBeGreaterThan(0);
      expect(resolveLevel0SurroundArt(index)).toBe(entry);
    });
  });

  it('wraps deterministic planner indices across the complete art set', () => {
    expect(resolveLevel0SurroundArt(9)).toBe(LEVEL0_SURROUND_ART_MANIFEST[0]);
    expect(resolveLevel0SurroundArt(-1)).toBe(LEVEL0_SURROUND_ART_MANIFEST[8]);
  });
});
