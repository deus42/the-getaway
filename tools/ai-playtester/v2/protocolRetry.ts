export interface ProtocolRetryCandidate {
  outcome: 'pass' | 'fail' | 'blocked';
  supervisorViolation?: string;
  transcriptBlockingReasons: readonly string[];
  responsePresent: boolean;
  responseSummary?: string;
  responseError?: string;
  timedOut: boolean;
}

const precededPattern =
  /^Computer Use action (click|press_key) must be preceded by get_app_state\.$/;

export type RecoverableWorkerBlockKind =
  | 'capture-sequence'
  | 'transport-disconnect'
  | 'tool-startup-empty';

const terminalResponseIsUnavailable = (responseError: string | undefined): boolean =>
  responseError === undefined ||
  /ENOENT:.*response\.json|Unexpected end of JSON input/i.test(responseError);

const responseProvesEmptyComputerUseStartup = (summary: string | undefined): boolean => {
  if (!summary) return false;
  const configuredToolUnavailable =
    /no configured Computer Use tools? (?:was|were) available/i.test(summary) ||
    /configured Computer Use tools? (?:was|were) not exposed/i.test(summary);
  return configuredToolUnavailable &&
    /initial (?:get_app_state|marker verification)/i.test(summary);
};

export const recoverableWorkerBlockKind = (
  candidate: ProtocolRetryCandidate
): RecoverableWorkerBlockKind | undefined => {
  if (candidate.outcome !== 'blocked' || candidate.timedOut) return undefined;

  if (candidate.responsePresent) {
    const exactEmptyStartupReasons = new Set([
      'Transcript contains no Computer Use observation.',
      'Computer Use supervisor ledger contains no external tool calls.',
    ]);
    return candidate.supervisorViolation === undefined &&
      candidate.responseError === undefined &&
      candidate.transcriptBlockingReasons.length === exactEmptyStartupReasons.size &&
      candidate.transcriptBlockingReasons.every((reason) => exactEmptyStartupReasons.has(reason)) &&
      responseProvesEmptyComputerUseStartup(candidate.responseSummary)
      ? 'tool-startup-empty'
      : undefined;
  }
  if (!terminalResponseIsUnavailable(candidate.responseError)) return undefined;

  const supervisorMatch = candidate.supervisorViolation?.match(precededPattern);
  if (supervisorMatch) {
    const action = supervisorMatch[1];
    const reasons = candidate.transcriptBlockingReasons;
    if (reasons.length !== 3 || new Set(reasons).size !== 3) return undefined;

    const expectedSequenceReasons = [
      new RegExp(`^Computer Use call ${action} \\(\\S+\\) has no completion evidence\\.$`),
      new RegExp(`^Computer Use action ${action} must be preceded by get_app_state\\.$`),
      new RegExp(`^Computer Use action ${action} must be followed by get_app_state\\.$`),
    ];
    return expectedSequenceReasons.every((pattern) =>
      reasons.some((reason) => pattern.test(reason))
    ) ? 'capture-sequence' : undefined;
  }

  if (candidate.supervisorViolation !== undefined) return undefined;
  const reasons = candidate.transcriptBlockingReasons;
  if (reasons.length !== 2 || new Set(reasons).size !== 2) return undefined;
  const exactTransportFailure =
    /^Worker event failed: Reconnecting\.\.\. \d+\/\d+ \(stream disconnected before completion: websocket closed by server before response\.completed\)\.$/;
  const missingCaptureAfterAction =
    /^Computer Use action (click|press_key) must be followed by get_app_state\.$/;
  return reasons.some((reason) => exactTransportFailure.test(reason)) &&
    reasons.some((reason) => missingCaptureAfterAction.test(reason))
    ? 'transport-disconnect'
    : undefined;
};

export const isRecoverableProtocolBlock = (candidate: ProtocolRetryCandidate): boolean =>
  recoverableWorkerBlockKind(candidate) === 'capture-sequence';

export interface ProtocolReplacement<T> {
  slotIndex: number;
  attempt: number;
  superseded: T;
  replacement: T;
}

export interface ProtocolReplacementResult<T> {
  activeRecords: T[];
  supersededRecords: T[];
  replacements: ProtocolReplacement<T>[];
}

export const replaceRecoverableProtocolBlocks = async <T>(
  initialRecords: readonly T[],
  isRecoverable: (record: T) => boolean,
  launchReplacement: (record: T, slotIndex: number, attempt: number) => Promise<T>,
  maxReplacementsPerSlot = 1
): Promise<ProtocolReplacementResult<T>> => {
  if (!Number.isSafeInteger(maxReplacementsPerSlot) || maxReplacementsPerSlot < 1) {
    throw new Error('Worker replacement limit must be a positive safe integer.');
  }
  const activeRecords = [...initialRecords];
  const supersededRecords: T[] = [];
  const replacements: ProtocolReplacement<T>[] = [];

  for (let slotIndex = 0; slotIndex < initialRecords.length; slotIndex += 1) {
    for (let attempt = 1; attempt <= maxReplacementsPerSlot; attempt += 1) {
      const superseded = activeRecords[slotIndex];
      if (!isRecoverable(superseded)) break;
      const replacement = await launchReplacement(superseded, slotIndex, attempt);
      activeRecords[slotIndex] = replacement;
      supersededRecords.push(superseded);
      replacements.push({ slotIndex, attempt, superseded, replacement });
    }
  }

  return { activeRecords, supersededRecords, replacements };
};
