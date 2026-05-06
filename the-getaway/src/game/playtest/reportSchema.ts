import type { GetawayAgentAction } from './agentBridge';

export const CODEX_ACTION_SCHEMA_ID = 'getaway_codex_action_v1';
export const AI_PLAYTEST_FINDINGS_SCHEMA_ID = 'ai_playtest_findings_v1';

export type AiPlaytestSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AiPlaytestCategory =
  | 'progression'
  | 'stealth'
  | 'combat'
  | 'ui'
  | 'performance'
  | 'accessibility'
  | 'stability'
  | 'content'
  | 'tooling';
export type AiPlaytestFindingType = 'gameplay' | 'tooling' | 'agent-strategy';

export interface AiPlaytestFinding {
  id: string;
  severity: AiPlaytestSeverity;
  category: AiPlaytestCategory;
  title: string;
  reproSteps: string[];
  expected: string;
  observed: string;
  evidence: string[];
  suspectedOwner: string;
  confidence: number;
  dedupeKey?: string;
  findingType?: AiPlaytestFindingType;
  mergedFrom?: string[];
  blockingMilestone?: string;
  agentConfidenceNotes?: string;
  linearSuggestion: {
    title: string;
    description: string;
    label: 'Bug' | 'Improvement' | 'Feature';
    priority: 'Urgent' | 'High' | 'Medium' | 'Low' | 'No priority';
  };
}

export interface CodexAgentDecision {
  schema: typeof CODEX_ACTION_SCHEMA_ID;
  action: GetawayAgentAction;
  rationale: string;
  riskNotes: string[];
  candidateFindings: AiPlaytestFinding[];
}

export interface AiPlaytestFindingsDocument {
  schema: typeof AI_PLAYTEST_FINDINGS_SCHEMA_ID;
  runId: string;
  profile: string;
  generatedAt: string;
  summary: string;
  scorecard: Record<string, number | string>;
  findings: AiPlaytestFinding[];
  trace: Array<{
    step: number;
    action: string;
    result: string;
    screenshot?: string;
  }>;
}

const severities = new Set<AiPlaytestSeverity>(['critical', 'high', 'medium', 'low', 'info']);
const categories = new Set<AiPlaytestCategory>([
  'progression',
  'stealth',
  'combat',
  'ui',
  'performance',
  'accessibility',
  'stability',
  'content',
  'tooling',
]);
const linearLabels = new Set(['Bug', 'Improvement', 'Feature']);
const priorities = new Set(['Urgent', 'High', 'Medium', 'Low', 'No priority']);
const actionTypes = new Set([
  'startLevel0',
  'clickTile',
  'focusObjective',
  'interactNpc',
  'collectItem',
  'toggleStealth',
  'chooseDialogueOption',
  'setClock',
  'waitForDialogue',
  'waitForObjectiveChange',
  'waitForPlayerIdle',
  'wait',
]);
const findingTypes = new Set<AiPlaytestFindingType>(['gameplay', 'tooling', 'agent-strategy']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string');

const hasFiniteConfidence = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;

export const isAiPlaytestFinding = (value: unknown): value is AiPlaytestFinding => {
  if (!isRecord(value)) {
    return false;
  }

  const linearSuggestion = value.linearSuggestion;
  if (!isRecord(linearSuggestion)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    severities.has(value.severity as AiPlaytestSeverity) &&
    categories.has(value.category as AiPlaytestCategory) &&
    typeof value.title === 'string' &&
    isStringArray(value.reproSteps) &&
    typeof value.expected === 'string' &&
    typeof value.observed === 'string' &&
    isStringArray(value.evidence) &&
    typeof value.suspectedOwner === 'string' &&
    hasFiniteConfidence(value.confidence) &&
    (typeof value.dedupeKey === 'undefined' || typeof value.dedupeKey === 'string') &&
    (typeof value.findingType === 'undefined' || findingTypes.has(value.findingType as AiPlaytestFindingType)) &&
    (typeof value.mergedFrom === 'undefined' || isStringArray(value.mergedFrom)) &&
    (typeof value.blockingMilestone === 'undefined' || typeof value.blockingMilestone === 'string') &&
    (typeof value.agentConfidenceNotes === 'undefined' || typeof value.agentConfidenceNotes === 'string') &&
    typeof linearSuggestion.title === 'string' &&
    typeof linearSuggestion.description === 'string' &&
    linearLabels.has(linearSuggestion.label as string) &&
    priorities.has(linearSuggestion.priority as string)
  );
};

export const isCodexAgentDecision = (value: unknown): value is CodexAgentDecision => {
  if (!isRecord(value) || value.schema !== CODEX_ACTION_SCHEMA_ID) {
    return false;
  }

  if (!isRecord(value.action) || !actionTypes.has(value.action.type as string)) {
    return false;
  }

  return (
    typeof value.rationale === 'string' &&
    isStringArray(value.riskNotes) &&
    Array.isArray(value.candidateFindings) &&
    value.candidateFindings.every(isAiPlaytestFinding)
  );
};

export const isAiPlaytestFindingsDocument = (value: unknown): value is AiPlaytestFindingsDocument => {
  if (!isRecord(value) || value.schema !== AI_PLAYTEST_FINDINGS_SCHEMA_ID) {
    return false;
  }

  return (
    typeof value.runId === 'string' &&
    typeof value.profile === 'string' &&
    typeof value.generatedAt === 'string' &&
    typeof value.summary === 'string' &&
    isRecord(value.scorecard) &&
    Array.isArray(value.findings) &&
    value.findings.every(isAiPlaytestFinding) &&
    Array.isArray(value.trace)
  );
};

const stripJsonFence = (text: string): string => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced?.[1] ?? text).trim();
};

export const parseCodexAgentDecision = (text: string): CodexAgentDecision => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFence(text));
  } catch (error) {
    throw new Error(`Codex action response is not valid JSON: ${(error as Error).message}`);
  }

  if (!isCodexAgentDecision(parsed)) {
    throw new Error('Codex action response does not match getaway_codex_action_v1.');
  }

  return parsed;
};

export const extractFindingsJsonBlock = (markdown: string): AiPlaytestFindingsDocument => {
  const fencedBlocks = [...markdown.matchAll(/```json\s*([\s\S]*?)```/gi)];
  for (const block of fencedBlocks) {
    try {
      const parsed = JSON.parse(block[1].trim());
      if (isAiPlaytestFindingsDocument(parsed)) {
        return parsed;
      }
    } catch {
      // Try the next JSON block.
    }
  }

  throw new Error('No ai_playtest_findings_v1 JSON block found in report.');
};
