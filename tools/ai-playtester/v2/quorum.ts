export interface WorkerVerdict {
  workerId: string;
  outcome: 'pass' | 'fail' | 'blocked';
  evidenceValid: boolean;
  integrityValid: boolean;
}

type EvidenceValidVerdict = WorkerVerdict & {
  outcome: 'pass' | 'fail';
  evidenceValid: true;
  integrityValid: true;
};

export type QuorumDecision =
  | {
      state: 'resolved';
      outcome: 'pass' | 'fail';
      runTieBreaker: false;
    }
  | {
      state: 'tie-break-required';
      runTieBreaker: true;
      tieBreaker: { count: 1; blind: true; fresh: true };
    }
  | {
      state: 'blocked';
      outcome: 'blocked';
      runTieBreaker: false;
      reason: string;
    };

const blocked = (reason: string): QuorumDecision => ({
  state: 'blocked',
  outcome: 'blocked',
  runTieBreaker: false,
  reason,
});

const isEvidenceValidVerdict = (verdict: WorkerVerdict): verdict is EvidenceValidVerdict =>
  verdict.evidenceValid && verdict.integrityValid && verdict.outcome !== 'blocked';

export const decideQuorum = (
  initialWorkerCount: 1 | 2,
  initialVerdicts: readonly WorkerVerdict[],
  tieBreaker?: WorkerVerdict
): QuorumDecision => {
  if (initialVerdicts.length !== initialWorkerCount) {
    return blocked(
      `Expected ${initialWorkerCount} initial verdict(s), received ${initialVerdicts.length}.`
    );
  }

  if (new Set(initialVerdicts.map((verdict) => verdict.workerId)).size !== initialVerdicts.length) {
    return blocked('Initial worker identities must be unique.');
  }

  const validInitialVerdicts = initialVerdicts.filter(isEvidenceValidVerdict);
  if (validInitialVerdicts.length !== initialVerdicts.length) {
    return blocked('Initial worker evidence or integrity validation failed.');
  }

  if (initialWorkerCount === 1) {
    if (tieBreaker) {
      return blocked('A one-worker packet cannot run a tie-breaker.');
    }
    return {
      state: 'resolved',
      outcome: validInitialVerdicts[0].outcome,
      runTieBreaker: false,
    };
  }

  const [first, second] = validInitialVerdicts;
  if (first.outcome === second.outcome) {
    if (tieBreaker) {
      return blocked('A tie-breaker is forbidden when initial workers agree.');
    }
    return { state: 'resolved', outcome: first.outcome, runTieBreaker: false };
  }

  if (!tieBreaker) {
    return {
      state: 'tie-break-required',
      runTieBreaker: true,
      tieBreaker: { count: 1, blind: true, fresh: true },
    };
  }

  if (
    tieBreaker.workerId === first.workerId ||
    tieBreaker.workerId === second.workerId ||
    !isEvidenceValidVerdict(tieBreaker)
  ) {
    return blocked('Tie-breaker freshness, evidence, or integrity validation failed.');
  }

  const matchingInitial = tieBreaker.outcome === first.outcome ? first : second;
  return {
    state: 'resolved',
    outcome: matchingInitial.outcome,
    runTieBreaker: false,
  };
};

export const resolveQuorumWithTieBreaker = async <T>(
  initialWorkerCount: 1 | 2,
  initialVerdicts: readonly WorkerVerdict[],
  launchTieBreaker: () => Promise<{ record: T; verdict: WorkerVerdict }>
): Promise<{ decision: QuorumDecision; tieBreakerRecord?: T }> => {
  const initialDecision = decideQuorum(initialWorkerCount, initialVerdicts);
  if (initialDecision.state !== 'tie-break-required') {
    return { decision: initialDecision };
  }
  const tieBreaker = await launchTieBreaker();
  return {
    decision: decideQuorum(initialWorkerCount, initialVerdicts, tieBreaker.verdict),
    tieBreakerRecord: tieBreaker.record,
  };
};
