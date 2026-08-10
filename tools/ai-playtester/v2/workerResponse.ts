export const AI_GAMER_WORKER_RESPONSE_SCHEMA = 'ai_gamer_worker_response_v1' as const;

export type WorkerRegressionKind =
  | 'crash'
  | 'softlock'
  | 'incorrect-transition'
  | 'visible-input-failure';

export interface WorkerRegressionReproductionV1 {
  tool: 'click' | 'press_key';
  target: string;
}

export interface AiGamerWorkerResponseV1 {
  schema: typeof AI_GAMER_WORKER_RESPONSE_SCHEMA;
  outcome: 'pass' | 'fail' | 'blocked';
  visibleGoalMet: boolean;
  summary: string;
  warnings: string[];
  regression: null | {
    kind: WorkerRegressionKind;
    title: string;
    observed: string;
    attempts: number;
    reproduction: WorkerRegressionReproductionV1 | null;
  };
  blocker: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isNonEmpty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const regressionKinds = new Set<WorkerRegressionKind>([
  'crash',
  'softlock',
  'incorrect-transition',
  'visible-input-failure',
]);

const hasExactKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
};

const isReproduction = (value: unknown): value is WorkerRegressionReproductionV1 => {
  if (!isRecord(value) || !hasExactKeys(value, ['tool', 'target']) || !isNonEmpty(value.target)) {
    return false;
  }
  return (
    value.tool === 'click' && /^element:[^\s]+$/.test(value.target)
  ) || (
    value.tool === 'press_key' && /^key:[^\s]+$/.test(value.target)
  );
};

const isRegression = (value: unknown): value is NonNullable<AiGamerWorkerResponseV1['regression']> => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['kind', 'title', 'observed', 'attempts', 'reproduction']) ||
    !regressionKinds.has(value.kind as WorkerRegressionKind) ||
    !isNonEmpty(value.title) ||
    !isNonEmpty(value.observed) ||
    typeof value.attempts !== 'number' ||
    !Number.isInteger(value.attempts) ||
    value.attempts < 1 ||
    !(value.reproduction === null || isReproduction(value.reproduction))
  ) {
    return false;
  }
  return value.kind === 'crash'
    ? value.reproduction === null
    : isReproduction(value.reproduction);
};

export const parseWorkerResponse = (text: string): AiGamerWorkerResponseV1 => {
  let value: unknown;
  try {
    value = JSON.parse(text.trim());
  } catch (error) {
    throw new Error(`AI Gamer worker response is not JSON: ${(error as Error).message}`);
  }
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      'schema',
      'outcome',
      'visibleGoalMet',
      'summary',
      'warnings',
      'regression',
      'blocker',
    ]) ||
    value.schema !== AI_GAMER_WORKER_RESPONSE_SCHEMA ||
    !['pass', 'fail', 'blocked'].includes(value.outcome as string) ||
    typeof value.visibleGoalMet !== 'boolean' ||
    !isNonEmpty(value.summary) ||
    !Array.isArray(value.warnings) ||
    !value.warnings.every(isNonEmpty) ||
    !(value.regression === null || isRegression(value.regression)) ||
    !(value.blocker === null || isNonEmpty(value.blocker))
  ) {
    throw new Error('AI Gamer worker response does not match ai_gamer_worker_response_v1.');
  }
  if (
    (value.outcome === 'pass' && (!value.visibleGoalMet || value.regression !== null || value.blocker !== null)) ||
    (value.outcome === 'fail' && (value.regression === null || value.blocker !== null)) ||
    (value.outcome === 'blocked' && (value.regression !== null || !isNonEmpty(value.blocker)))
  ) {
    throw new Error('AI Gamer worker response does not match outcome evidence rules.');
  }
  return value as unknown as AiGamerWorkerResponseV1;
};
