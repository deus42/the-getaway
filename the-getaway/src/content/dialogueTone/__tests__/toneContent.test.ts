import { validateToneProfile } from '../../../game/narrative/dialogueTone/toneSchema';
import { TONE_AUTHORS } from '../authors';
import { TONE_PERSONAS } from '../personas';
import { TONE_SCENES } from '../scenes';
import { TONE_TEMPLATES } from '../templates';
import { TONE_PALETTES } from '../palettes';
import { buildToneLibrary } from '../index';

describe('dialogue tone content', () => {
  it('validates author fingerprints against schema', () => {
    for (const author of Object.values(TONE_AUTHORS)) {
      const validation = validateToneProfile(author);
      expect(validation.valid).toBe(true);
    }
  });

  it('validates persona baselines', () => {
    for (const persona of Object.values(TONE_PERSONAS)) {
      const validation = validateToneProfile(persona);
      expect(validation.valid).toBe(true);
    }
  });

  it('validates scene style hints', () => {
    for (const scene of Object.values(TONE_SCENES)) {
      const validation = validateToneProfile(scene);
      expect(validation.valid).toBe(true);
    }
  });

  it('ensures template slots resolve to palettes', () => {
    const paletteIds = new Set(TONE_PALETTES.map((palette) => palette.id));
    for (const template of TONE_TEMPLATES) {
      for (const slot of template.slots) {
        expect(paletteIds.has(slot.paletteId)).toBe(true);
      }
    }
  });

  it('ensures palette entries have positive weight', () => {
    for (const palette of TONE_PALETTES) {
      expect(palette.entries.length).toBeGreaterThan(0);
      for (const entry of palette.entries) {
        expect(entry.weight).toBeGreaterThan(0);
      }
    }
  });

  it('builds a tone library with expected defaults', () => {
    const library = buildToneLibrary();
    expect(Object.keys(library.authors).length).toBeGreaterThan(0);
    expect(Object.keys(library.personas).length).toBeGreaterThan(0);
    expect(Object.keys(library.scenes).length).toBeGreaterThan(0);
    expect(library.templates.map((template) => template.id)).toContain('template.deadpan.reassure');
  });
});
