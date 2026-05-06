import {
  extractFindingsJsonBlock,
  parseCodexAgentDecision,
  type AiPlaytestFinding,
} from '../game/playtest/reportSchema';
import { buildPlaytestMarkdownReport, normalizeAiPlaytestFindings } from '../game/playtest/reporting';

const sampleFinding: AiPlaytestFinding = {
  id: 'finding-1',
  severity: 'medium',
  category: 'progression',
  title: 'Objective guidance stalled',
  reproSteps: ['Start Level 0', 'Follow the current objective'],
  expected: 'The next objective remains clear.',
  observed: 'The current objective was unclear.',
  evidence: ['reports/ai-playtests/run/step-000.png'],
  suspectedOwner: 'Level 0 guidance',
  confidence: 0.74,
  linearSuggestion: {
    title: 'Clarify Level 0 guidance',
    description: 'Objective guidance became unclear during the AI playtest.',
    label: 'Improvement',
    priority: 'Medium',
  },
};

describe('AI playtest schemas', () => {
  it('parses conforming Codex action JSON', () => {
    const parsed = parseCodexAgentDecision(JSON.stringify({
      schema: 'getaway_codex_action_v1',
      action: { type: 'waitForDialogue', timeoutMs: 500 },
      rationale: 'Let UI settle before selecting the next objective.',
      riskNotes: ['No immediate risk.'],
      candidateFindings: [],
    }));

    expect(parsed.action.type).toBe('waitForDialogue');
    expect(parsed.candidateFindings).toEqual([]);
  });

  it('rejects nonconforming Codex action JSON', () => {
    expect(() => parseCodexAgentDecision(JSON.stringify({
      schema: 'getaway_codex_action_v1',
      action: { type: 'deleteSave' },
      rationale: 'bad',
      riskNotes: [],
      candidateFindings: [],
    }))).toThrow('does not match');
  });

  it('embeds a parseable ai_playtest_findings_v1 JSON block in reports', () => {
    const report = buildPlaytestMarkdownReport({
      runId: 'run-1',
      profile: 'guided-level0',
      generatedAt: '2026-05-05T00:00:00.000Z',
      summary: 'One finding recorded.',
      scorecard: {
        findings: 1,
        codexMode: 'disabled',
      },
      findings: [sampleFinding],
      screenshots: ['reports/ai-playtests/run-1/step-000.png'],
      trace: [
        {
          step: 0,
          action: '{"type":"wait","ms":500}',
          result: 'Waited 500ms.',
          screenshot: 'reports/ai-playtests/run-1/step-000.png',
        },
      ],
    });

    const parsed = extractFindingsJsonBlock(report);
    expect(parsed.schema).toBe('ai_playtest_findings_v1');
    expect(parsed.findings).toHaveLength(1);
    expect(parsed.findings[0].linearSuggestion.label).toBe('Improvement');
  });

  it('normalizes duplicate Lira hand-in findings into one canonical finding', () => {
    const duplicate: AiPlaytestFinding = {
      ...sampleFinding,
      id: 'finding-2',
      severity: 'critical',
      title: 'Lira keycard hand-in can remain stuck',
      expected: 'Return to Lira should complete and activate Naila.',
      observed: 'After selecting Lira completion, return-to-lira remains active.',
      evidence: ['reports/ai-playtests/run/step-001.png'],
      confidence: 0.91,
    };
    const liraFinding: AiPlaytestFinding = {
      ...sampleFinding,
      id: 'finding-1',
      severity: 'high',
      title: 'Lira completion option does not advance return-to-lira',
      expected: 'Lira completion should advance to Naila.',
      observed: 'The keycard hand-in leaves return-to-lira incomplete.',
      confidence: 0.77,
    };

    const normalized = normalizeAiPlaytestFindings([liraFinding, duplicate]);

    expect(normalized).toHaveLength(1);
    expect(normalized[0].severity).toBe('critical');
    expect(normalized[0].dedupeKey).toBe('guided-level0:lira-handin-stuck');
    expect(normalized[0].findingType).toBe('gameplay');
    expect(normalized[0].mergedFrom).toEqual(['finding-1', 'finding-2']);
    expect(normalized[0].evidence).toContain('reports/ai-playtests/run/step-001.png');
  });

  it('synthesizes stable ids for normalized Codex findings with empty ids', () => {
    const normalized = normalizeAiPlaytestFindings([{
      ...sampleFinding,
      id: '',
      dedupeKey: 'guided-level0:recover-keycard-stall',
      title: 'Recover keycard stalls',
    }]);

    expect(normalized[0].id).toBe('finding-guided-level0-recover-keycard-stall');
    expect(normalized[0].mergedFrom).toEqual(['finding-guided-level0-recover-keycard-stall']);
  });
});
