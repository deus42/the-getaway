import {
  AI_PLAYTEST_FINDINGS_SCHEMA_ID,
  type AiPlaytestFinding,
  type AiPlaytestFindingType,
  type AiPlaytestFindingsDocument,
} from './reportSchema';

export interface PlaytestTraceEntry {
  step: number;
  action: string;
  result: string;
  rationale?: string;
  screenshot?: string;
  riskNotes?: string[];
}

export interface BuildPlaytestReportInput {
  runId: string;
  profile: string;
  generatedAt: string;
  summary: string;
  scorecard: Record<string, number | string>;
  findings: AiPlaytestFinding[];
  screenshots: string[];
  trace: PlaytestTraceEntry[];
}

const formatList = (entries: string[]): string =>
  entries.length === 0 ? '- none' : entries.map((entry) => `- ${entry}`).join('\n');

const formatFindings = (findings: AiPlaytestFinding[]): string => {
  if (findings.length === 0) {
    return 'No findings recorded.';
  }

  return findings
    .map((finding) => [
      `### ${finding.id}: ${finding.title}`,
      `- Severity: ${finding.severity}`,
      `- Category: ${finding.category}`,
      `- Finding type: ${finding.findingType ?? inferFindingType(finding)}`,
      finding.blockingMilestone ? `- Blocking milestone: ${finding.blockingMilestone}` : null,
      `- Confidence: ${finding.confidence}`,
      finding.agentConfidenceNotes ? `- Agent confidence notes: ${finding.agentConfidenceNotes}` : null,
      `- Suspected owner: ${finding.suspectedOwner}`,
      `- Expected: ${finding.expected}`,
      `- Observed: ${finding.observed}`,
      `- Evidence: ${finding.evidence.join('; ')}`,
      '- Repro steps:',
      ...finding.reproSteps.map((step, index) => `  ${index + 1}. ${step}`),
      `- Linear suggestion: ${finding.linearSuggestion.label} / ${finding.linearSuggestion.priority} / ${finding.linearSuggestion.title}`,
    ].filter((line): line is string => Boolean(line)).join('\n'))
    .join('\n\n');
};

const formatScorecard = (scorecard: Record<string, number | string>): string =>
  Object.entries(scorecard)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');

const formatTrace = (trace: PlaytestTraceEntry[]): string =>
  trace
    .map((entry) => {
      const details = [
        `- Step ${entry.step}: ${entry.action}`,
        `  - Result: ${entry.result}`,
      ];
      if (entry.rationale) {
        details.push(`  - Rationale: ${entry.rationale}`);
      }
      if (entry.riskNotes?.length) {
        details.push(`  - Risk notes: ${entry.riskNotes.join('; ')}`);
      }
      if (entry.screenshot) {
        details.push(`  - Screenshot: ${entry.screenshot}`);
      }
      return details.join('\n');
    })
    .join('\n');

export const buildFindingsDocument = (
  input: BuildPlaytestReportInput
): AiPlaytestFindingsDocument => ({
  schema: AI_PLAYTEST_FINDINGS_SCHEMA_ID,
  runId: input.runId,
  profile: input.profile,
  generatedAt: input.generatedAt,
  summary: input.summary,
  scorecard: input.scorecard,
  findings: input.findings,
  trace: input.trace.map((entry) => ({
    step: entry.step,
    action: entry.action,
    result: entry.result,
    screenshot: entry.screenshot,
  })),
});

const severityRank: Record<AiPlaytestFinding['severity'], number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

const normalizeText = (value: string): string =>
  value.toLowerCase().replace(/[`'"]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

const fallbackFindingId = (dedupeKey: string): string =>
  `finding-${normalizeText(dedupeKey).replace(/\s+/g, '-').slice(0, 72) || 'ai-playtest'}`;

const mergeUnique = (left: string[], right: string[]): string[] => {
  const seen = new Set<string>();
  return [...left, ...right].filter((entry) => {
    const key = entry.trim();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const chooseMoreSevere = (left: AiPlaytestFinding, right: AiPlaytestFinding): AiPlaytestFinding =>
  severityRank[right.severity] > severityRank[left.severity] ? right : left;

export const inferFindingType = (finding: AiPlaytestFinding): AiPlaytestFindingType => {
  if (finding.findingType) {
    return finding.findingType;
  }
  if (finding.category === 'tooling') {
    return 'tooling';
  }

  const text = normalizeText(`${finding.title} ${finding.observed} ${finding.suspectedOwner}`);
  return text.includes('agent') || text.includes('planner') || text.includes('playtest harness')
    ? 'agent-strategy'
    : 'gameplay';
};

export const inferDedupeKey = (finding: AiPlaytestFinding): string => {
  if (finding.dedupeKey?.trim()) {
    return finding.dedupeKey.trim();
  }

  const text = normalizeText(`${finding.title} ${finding.expected} ${finding.observed}`);
  if (
    text.includes('lira') &&
    (text.includes('hand in') ||
      text.includes('handin') ||
      text.includes('completion') ||
      text.includes('return to lira') ||
      text.includes('returntolira') ||
      text.includes('keycard'))
  ) {
    return 'guided-level0:lira-handin-stuck';
  }

  return `${finding.category}:${normalizeText(finding.title).slice(0, 80)}`;
};

export const normalizeAiPlaytestFindings = (findings: AiPlaytestFinding[]): AiPlaytestFinding[] => {
  const grouped = new Map<string, AiPlaytestFinding>();

  findings.forEach((finding) => {
    const dedupeKey = inferDedupeKey(finding);
    const findingType = inferFindingType(finding);
    const existing = grouped.get(dedupeKey);
    if (!existing) {
      grouped.set(dedupeKey, {
        ...finding,
        id: finding.id.trim() || fallbackFindingId(dedupeKey),
        dedupeKey,
        findingType,
        mergedFrom: finding.mergedFrom?.length ? finding.mergedFrom : [finding.id.trim() || fallbackFindingId(dedupeKey)],
      });
      return;
    }

    const preferred = chooseMoreSevere(existing, finding);
    const mergedFrom = mergeUnique(existing.mergedFrom ?? [existing.id], finding.mergedFrom ?? [finding.id]);
    grouped.set(dedupeKey, {
      ...preferred,
      id: existing.id,
      dedupeKey,
      findingType: existing.findingType ?? findingType,
      reproSteps: mergeUnique(existing.reproSteps, finding.reproSteps),
      evidence: mergeUnique(existing.evidence, finding.evidence),
      confidence: Math.max(existing.confidence, finding.confidence),
      mergedFrom,
      blockingMilestone: existing.blockingMilestone ?? finding.blockingMilestone,
      agentConfidenceNotes: mergeUnique(
        [
          existing.agentConfidenceNotes,
          finding.agentConfidenceNotes,
        ].filter((entry): entry is string => Boolean(entry)),
        mergedFrom.length > 1 ? [`Merged ${mergedFrom.length} related candidate findings.`] : []
      ).join(' '),
    });
  });

  return [...grouped.values()].sort((left, right) => {
    const severityDelta = severityRank[right.severity] - severityRank[left.severity];
    return severityDelta === 0 ? right.confidence - left.confidence : severityDelta;
  });
};

export const buildPlaytestMarkdownReport = (input: BuildPlaytestReportInput): string => {
  const normalizedInput = {
    ...input,
    findings: normalizeAiPlaytestFindings(input.findings),
  };
  const document = buildFindingsDocument(normalizedInput);

  return [
    `# AI Playtest Report: ${normalizedInput.runId}`,
    '',
    '## Summary',
    normalizedInput.summary,
    '',
    '## Scorecard',
    formatScorecard(normalizedInput.scorecard),
    '',
    '## Findings',
    formatFindings(normalizedInput.findings),
    '',
    '## Repro Steps',
    normalizedInput.findings.length === 0
      ? 'No defect repro steps recorded.'
      : normalizedInput.findings
        .flatMap((finding) => finding.reproSteps.map((step, index) => `${finding.id}.${index + 1}. ${step}`))
        .join('\n'),
    '',
    '## Screenshots',
    formatList(normalizedInput.screenshots),
    '',
    '## Trace',
    formatTrace(normalizedInput.trace),
    '',
    '## Findings JSON',
    '```json',
    JSON.stringify(document, null, 2),
    '```',
    '',
  ].join('\n');
};
