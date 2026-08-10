import type { GateMode } from './cli.ts';

export interface NewGameReplayProof {
  verified: boolean;
  traceHash: string;
}

export interface CheckpointProvenance {
  checkpointId: string;
  buildHash: string;
  contentHash: string;
  layoutHash: string;
  probeSchemaHash: string;
  newGameReplayProof: NewGameReplayProof;
}

export type CurrentCheckpointHashes = Pick<
  CheckpointProvenance,
  'buildHash' | 'contentHash' | 'layoutHash' | 'probeSchemaHash'
>;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const sha256Pattern = /^[a-f\d]{64}$/i;

export const validateCheckpoint = (
  mode: GateMode,
  checkpoint?: CheckpointProvenance,
  currentHashes?: CurrentCheckpointHashes
): ValidationResult => {
  if (mode === 'closeout') {
    return checkpoint
      ? {
          valid: false,
          errors: ['Closeout mode must start from New Game and cannot use a checkpoint.'],
        }
      : { valid: true, errors: [] };
  }

  if (!checkpoint) {
    return { valid: true, errors: [] };
  }

  const errors: string[] = [];
  if (!checkpoint.checkpointId.trim()) {
    errors.push('checkpointId is required.');
  }

  for (const field of ['buildHash', 'contentHash', 'layoutHash', 'probeSchemaHash'] as const) {
    if (!sha256Pattern.test(checkpoint[field])) {
      errors.push(`${field} must be a SHA-256 hex digest.`);
    }
  }

  if (checkpoint.newGameReplayProof.verified !== true) {
    errors.push('newGameReplayProof.verified must be true.');
  }
  if (!sha256Pattern.test(checkpoint.newGameReplayProof.traceHash)) {
    errors.push('newGameReplayProof.traceHash must be a SHA-256 hex digest.');
  }

  if (!currentHashes) {
    errors.push('Current build, content, layout, and probe-schema hashes are required.');
  } else {
    for (const field of ['buildHash', 'contentHash', 'layoutHash', 'probeSchemaHash'] as const) {
      if (!sha256Pattern.test(currentHashes[field])) {
        errors.push(`Current ${field} must be a SHA-256 hex digest.`);
      } else if (sha256Pattern.test(checkpoint[field]) && checkpoint[field] !== currentHashes[field]) {
        errors.push(`Checkpoint ${field} does not match the current ${field}.`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
};
