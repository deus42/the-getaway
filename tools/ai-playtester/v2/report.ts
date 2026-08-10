import { chmod, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  validatePlaytestGateReportV2,
  type PlaytestGateFindingV2,
  type PlaytestGateReportV2,
} from '../../../the-getaway/src/game/playtest/playtestContractV2.ts';

export const normalizeGateEvidenceRefs = (refs: readonly string[]): string[] =>
  [...new Set(refs.map((ref) => ref.trim()).filter(Boolean))].sort();

const findingKey = (finding: PlaytestGateFindingV2): string =>
  [finding.kind, finding.title, finding.summary]
    .map((value) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en'))
    .join('\0');

export const normalizeGateFindings = (
  findings: readonly PlaytestGateFindingV2[]
): PlaytestGateFindingV2[] => {
  const normalized = new Map<string, PlaytestGateFindingV2>();
  for (const finding of findings) {
    const key = findingKey(finding);
    const existing = normalized.get(key);
    if (existing) {
      existing.evidenceRefs = normalizeGateEvidenceRefs([
        ...existing.evidenceRefs,
        ...finding.evidenceRefs,
      ]);
    } else {
      normalized.set(key, {
        ...finding,
        evidenceRefs: normalizeGateEvidenceRefs(finding.evidenceRefs),
      });
    }
  }
  return [...normalized.values()];
};

const isConciseWorkerEvidence = (ref: string): boolean =>
  ref === 'trace.zip' ||
  ref === 'probe-timeline.json' ||
  ref === 'browser-target-attestation.json' ||
  ref === 'computer-use-ledger.jsonl' ||
  ref === 'worker-runtime-attestation.json' ||
  ref === 'worker-transcript-summary.json' ||
  ref.startsWith('screenshots/milestone-');

export const selectWorkerEvidenceRefs = (
  outcome: 'pass' | 'fail' | 'blocked',
  refs: readonly string[]
): string[] => normalizeGateEvidenceRefs(
  outcome === 'pass' ? refs.filter(isConciseWorkerEvidence) : refs
);

export const pruneConciseWorkerArtifacts = async (workerDirectory: string): Promise<void> => {
  await Promise.all([
    { ref: 'worker.jsonl' },
    { ref: 'worker.stderr.log' },
    { ref: 'observer-diagnostics.json' },
    { ref: 'action-cycles.json' },
    { ref: 'action-cycles', recursive: true },
    { ref: 'screenshots/initial.png' },
    { ref: 'screenshots/final.png' },
  ].map(({ ref, recursive }) => rm(path.join(workerDirectory, ref), {
    force: true,
    recursive: recursive ?? false,
  })));
};

export const collectRunEvidenceRefs = async (
  runDirectory: string,
  currentDirectory = runDirectory
): Promise<string[]> => {
  const entries = await readdir(currentDirectory, { withFileTypes: true }).catch(() => []);
  const refs: string[] = [];
  for (const entry of entries) {
    const absolute = path.join(currentDirectory, entry.name);
    if (entry.isDirectory()) refs.push(...await collectRunEvidenceRefs(runDirectory, absolute));
    else if (entry.isFile() && entry.name !== 'report.json' && entry.name !== 'report.md') {
      refs.push(path.relative(runDirectory, absolute));
    }
  }
  return normalizeGateEvidenceRefs(refs);
};

const markdownList = (values: readonly string[]): string =>
  values.length === 0 ? '- none' : values.map((value) => `- ${value}`).join('\n');

export const renderGateReportMarkdown = (report: PlaytestGateReportV2): string => [
  `# AI Gamer Gate: ${report.ticket} / ${report.mode}`,
  '',
  `- Outcome: **${report.outcome}**`,
  `- Exit code: ${report.exitCode}`,
  `- Packet: ${report.packetId}`,
  `- Packet revision: ${report.packetRevision ?? 'unavailable'}`,
  `- Packet SHA-256: ${report.packetSha256 ?? 'unavailable'}`,
  `- Run: ${report.runId}`,
  `- Quorum: ${report.quorum.valid} valid / ${report.quorum.required} required`,
  `- Retention: ${report.retention}`,
  '',
  '## Deciding workers',
  markdownList(report.quorum.decidingWorkerIds),
  '',
  '## Required probes',
  report.probeResults.length === 0
    ? '- unavailable'
    : report.probeResults.map((probe) =>
      `- ${probe.probeId}: ${probe.state}${probe.acceptanceEligible ? '' : ' (not acceptance-eligible)'}`
    ).join('\n'),
  '',
  '## Derived required invariants',
  'These results are derived from the primary gate checks; they are not independent corroboration.',
  '',
  report.invariantResults.length === 0
    ? '- unavailable'
    : report.invariantResults.map((invariant) =>
      `- ${invariant.invariantId}: ${invariant.state}${invariant.acceptanceEligible ? '' : ' (not acceptance-eligible)'}`
    ).join('\n'),
  '',
  '## Findings',
  report.findings.length === 0
    ? '- none'
    : report.findings.map((finding) =>
      `- [${finding.kind}] ${finding.title}: ${finding.summary}`
    ).join('\n'),
  '',
  '## Warnings',
  markdownList(report.warnings),
  '',
  '## Evidence',
  markdownList(report.evidenceRefs),
  '',
  '## Structured report',
  '```json',
  JSON.stringify(report, null, 2),
  '```',
  '',
].join('\n');

export const writeGateReport = async (
  runDirectory: string,
  report: PlaytestGateReportV2
): Promise<{ jsonPath: string; markdownPath: string }> => {
  const validation = validatePlaytestGateReportV2(report);
  if (!validation.ok) {
    throw new Error(`Refusing to write invalid PlaytestGateReportV2: ${validation.reason}`);
  }
  await mkdir(runDirectory, { recursive: true });
  const jsonPath = path.join(runDirectory, 'report.json');
  const markdownPath = path.join(runDirectory, 'report.md');
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await writeFile(markdownPath, renderGateReportMarkdown(report), 'utf8');
  await Promise.all([chmod(jsonPath, 0o600), chmod(markdownPath, 0o600)]);
  return { jsonPath, markdownPath };
};
