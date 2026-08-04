import {
  ATTRIBUTE_KEYS,
  SKILL_KEYS,
  createLevel0CreationDraft,
  createLevel0SampleCharacter,
  isValidLevel0Callsign,
  normalizeLevel0Callsign,
  validateLevel0CreationDraft,
} from '../creation';

describe('Level 0 character creation contract', () => {
  it('normalizes a Unicode callsign without assigning a fixed identity', () => {
    expect(normalizeLevel0Callsign('  Київ   Runner  ')).toBe('Київ Runner');
    expect(normalizeLevel0Callsign('ＯＬＥＫＳ')).toBe('ＯＬＥＫＳ');
  });

  it('accepts only already-normalized callsigns at persistence boundaries', () => {
    expect(isValidLevel0Callsign('Київ Runner')).toBe(true);
    expect(isValidLevel0Callsign("Mara_O'Neil-2.0")).toBe(true);
    expect(isValidLevel0Callsign('  Mara  ')).toBe(false);
    expect(isValidLevel0Callsign('bad/callsign')).toBe(false);
    expect(isValidLevel0Callsign('-Agent')).toBe(false);
    expect(isValidLevel0Callsign('Agent-')).toBe(false);
    expect(isValidLevel0Callsign('Agent.')).toBe(false);
    expect(isValidLevel0Callsign('Agent_')).toBe(false);
    expect(isValidLevel0Callsign('x'.repeat(25))).toBe(false);
  });

  it('requires exact creation budgets and caps', () => {
    const draft = createLevel0CreationDraft('player_civilian_04');
    draft.callsign = 'Mara';
    draft.attributes.mental = 3;
    draft.attributes.social = 3;
    draft.skills.composure = 2;
    draft.skills.insight = 2;
    draft.skills.influence = 2;

    const result = validateLevel0CreationDraft(draft);
    expect(result).toMatchObject({
      valid: true,
      errors: [],
      remainingAttributePoints: 0,
      remainingSkillPoints: 0,
      identity: { callsign: 'Mara', appearancePresetId: 'player_civilian_04' },
    });
    expect(result.build?.attributes).toEqual({
      physical: 1,
      mental: 3,
      social: 3,
      technical: 1,
    });
  });

  it('rejects invalid callsigns, presets, over-cap values, and unspent points', () => {
    const draft = createLevel0CreationDraft('player_civilian_01');
    draft.callsign = 'bad/callsign';
    draft.appearancePresetId = 'retired-operative';
    draft.attributes.physical = 4;
    draft.skills.systems = 3;

    const result = validateLevel0CreationDraft(draft);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      'callsign.invalid',
      'appearance.invalid',
      'attributes.over_cap',
      'attributes.unspent',
      'skills.over_cap',
      'skills.unspent',
    ]));
    expect(result.identity).toBeNull();
    expect(result.build).toBeNull();
  });

  it('provides two exact, differently capable sample characters without packages', () => {
    const social = createLevel0SampleCharacter('social_mental', 'Mara');
    const technical = createLevel0SampleCharacter('technical_evasion', 'Sora');

    expect(validateLevel0CreationDraft(social).valid).toBe(true);
    expect(validateLevel0CreationDraft(technical).valid).toBe(true);
    expect(social.attributes).not.toEqual(technical.attributes);
    expect(social.skills).not.toEqual(technical.skills);
    expect(Object.keys(social.attributes).sort()).toEqual([...ATTRIBUTE_KEYS].sort());
    expect(Object.keys(social.skills).sort()).toEqual([...SKILL_KEYS].sort());
    expect(JSON.stringify({ social, technical })).not.toMatch(/ghost|wire|force|background|package/i);
  });
});
