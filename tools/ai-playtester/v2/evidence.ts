export type EvidenceKind = 'gameplay-defect' | 'integrity-failure' | 'environment-blocker';

export interface EvidenceSignal {
  kind: EvidenceKind;
  evidenceValid: boolean;
  message: string;
}

export interface EvidenceClassification {
  outcome: 'pass' | 'fail' | 'blocked';
  retention: 'concise' | 'diagnostic';
  reasons: string[];
}

export const classifyEvidence = (
  signals: readonly EvidenceSignal[]
): EvidenceClassification => {
  if (signals.length === 0) {
    return { outcome: 'pass', retention: 'concise', reasons: [] };
  }

  const mustBlock = signals.some(
    (signal) =>
      !signal.evidenceValid ||
      signal.kind === 'integrity-failure' ||
      signal.kind === 'environment-blocker'
  );

  return {
    outcome: mustBlock ? 'blocked' : 'fail',
    retention: 'diagnostic',
    reasons: signals.map((signal) => signal.message),
  };
};
