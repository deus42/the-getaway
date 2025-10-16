import { validateNarrativeContent } from '../game/narrative/validateContent';

describe('narrative content validation', () => {
  it('detects no validation errors', () => {
    const report = validateNarrativeContent();
    expect(report.errors).toHaveLength(0);
  });
});
