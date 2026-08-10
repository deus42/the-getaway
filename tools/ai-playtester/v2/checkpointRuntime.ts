import { createHash } from 'node:crypto';
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import type { PlaytestPacketStartStateV1 } from '../../../the-getaway/src/game/playtest/playtestContractV2.ts';
import { validatePlaytestCommand } from '../../../the-getaway/src/game/playtest/playtestContractV2.ts';
import {
  decodeLevel0Autosave,
  LEVEL0_ATTEMPT_BASELINE_KEY,
  LEVEL0_AUTOSAVE_KEY,
} from '../../../the-getaway/src/game/level0/runtime/persistence.ts';
import { createInitialLevel0RunState } from '../../../the-getaway/src/game/level0/runtime/safehouse.ts';
import {
  validateCheckpoint,
  type CheckpointProvenance,
  type CurrentCheckpointHashes,
} from './checkpoint.ts';

export const PLAYTEST_CHECKPOINT_V1_SCHEMA = 'playtest_checkpoint_v1' as const;

const CHECKPOINT_ROOT = 'tools/ai-playtester/checkpoints';
const ALLOWED_STORAGE_KEYS = new Set([
  LEVEL0_AUTOSAVE_KEY,
  LEVEL0_ATTEMPT_BASELINE_KEY,
]);

export interface CheckpointHashSources {
  build: string[];
  content: string[];
  layout: string[];
  probeSchema: string[];
}

export interface PlaytestCheckpointArtifactV1 {
  schema: typeof PLAYTEST_CHECKPOINT_V1_SCHEMA;
  provenance: CheckpointProvenance;
  replayEvidenceRef: string;
  storageEntries: Record<string, string>;
}

export interface VerifiedPlaytestCheckpoint {
  checkpointId: string;
  storageEntries: Record<string, string>;
  evidenceRefs: string[];
}

interface PlaytestCheckpointReplayV1 {
  schema: 'playtest_checkpoint_replay_v1';
  checkpointId: string;
  startedFrom: 'new-game';
  completedAt: string;
  steps: Array<{
    sequence: number;
    capturedAt: string;
    command: unknown;
    observationSha256: string;
    runtime: { sessionId: string; mission: string };
  }>;
  terminal: {
    sessionId: string;
    mission: string;
    storageSha256: string;
  };
}

export const DEFAULT_CHECKPOINT_HASH_SOURCES: CheckpointHashSources = {
  build: [
    'the-getaway/package.json',
    'the-getaway/yarn.lock',
    'the-getaway/vite.config.ts',
    'the-getaway/index.html',
    'the-getaway/src',
    'the-getaway/public',
  ],
  content: ['the-getaway/src/content'],
  layout: [
    'art/iso-assets/contracts/level0-layout-contract.json',
    'the-getaway/src/content/levels/level0/layoutContract.ts',
  ],
  probeSchema: [
    'the-getaway/src/game/playtest/playtestContractV2.ts',
    'the-getaway/src/game/level0/playtest/level0PlaytestObserverV2.ts',
  ],
};

export const discoverViteEnvironmentSources = async (root: string): Promise<string[]> => {
  const entries = await readdir(path.join(root, 'the-getaway'), { withFileTypes: true });
  const sources: string[] = [];
  for (const entry of entries) {
    if (!/^\.env(?:\.|$)/.test(entry.name)) continue;
    if (entry.isSymbolicLink()) {
      throw new Error(`Vite environment hash source cannot be a symbolic link: ${entry.name}`);
    }
    if (entry.isFile()) sources.push(path.join('the-getaway', entry.name));
  }
  return sources.sort();
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isSha256 = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f\d]{64}$/i.test(value);

const resolveWithin = (root: string, relativePath: string): string => {
  if (path.isAbsolute(relativePath) || !relativePath.trim()) {
    throw new Error('Checkpoint evidence references must be non-empty relative paths.');
  }
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, relativePath);
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error('Checkpoint evidence reference escapes its reviewed root.');
  }
  return resolved;
};

const isIgnoredBuildEntry = (name: string): boolean =>
  name === '__tests__' ||
  /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(name) ||
  name === '.DS_Store';

const collectSourceFiles = async (root: string, sourceRef: string): Promise<string[]> => {
  const absolute = resolveWithin(root, sourceRef);
  const entries = await readdir(absolute, { withFileTypes: true }).catch(async (error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOTDIR') return undefined;
    throw error;
  });
  if (!entries) return [absolute];

  const files: string[] = [];
  for (const entry of entries) {
    if (isIgnoredBuildEntry(entry.name)) continue;
    const childRef = path.join(sourceRef, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Checkpoint hash source cannot be a symbolic link: ${childRef}`);
    }
    if (entry.isDirectory()) files.push(...await collectSourceFiles(root, childRef));
    else if (entry.isFile()) files.push(resolveWithin(root, childRef));
  }
  return files;
};

const hashSources = async (root: string, sourceRefs: readonly string[]): Promise<string> => {
  const files = (await Promise.all(sourceRefs.map((source) => collectSourceFiles(root, source))))
    .flat()
    .sort();
  if (files.length === 0) throw new Error('Checkpoint hash source set is empty.');
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(path.relative(root, file));
    hash.update('\0');
    hash.update(await readFile(file));
    hash.update('\0');
  }
  return hash.digest('hex');
};

export const computeCurrentCheckpointHashes = async (
  repoRoot: string,
  sources: CheckpointHashSources = DEFAULT_CHECKPOINT_HASH_SOURCES
): Promise<CurrentCheckpointHashes> => {
  const buildSources = sources === DEFAULT_CHECKPOINT_HASH_SOURCES
    ? [...sources.build, ...await discoverViteEnvironmentSources(repoRoot)]
    : sources.build;
  return {
    buildHash: await hashSources(repoRoot, buildSources),
    contentHash: await hashSources(repoRoot, sources.content),
    layoutHash: await hashSources(repoRoot, sources.layout),
    probeSchemaHash: await hashSources(repoRoot, sources.probeSchema),
  };
};

const parseCheckpointArtifact = (text: string): PlaytestCheckpointArtifactV1 => {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(`Checkpoint provenance is not JSON: ${(error as Error).message}`);
  }
  if (
    !isRecord(value) ||
    value.schema !== PLAYTEST_CHECKPOINT_V1_SCHEMA ||
    !isRecord(value.provenance) ||
    typeof value.provenance.checkpointId !== 'string' ||
    !isSha256(value.provenance.buildHash) ||
    !isSha256(value.provenance.contentHash) ||
    !isSha256(value.provenance.layoutHash) ||
    !isSha256(value.provenance.probeSchemaHash) ||
    !isRecord(value.provenance.newGameReplayProof) ||
    value.provenance.newGameReplayProof.verified !== true ||
    !isSha256(value.provenance.newGameReplayProof.traceHash) ||
    typeof value.replayEvidenceRef !== 'string' ||
    !value.replayEvidenceRef.trim() ||
    !isRecord(value.storageEntries)
  ) {
    throw new Error('Checkpoint provenance does not match playtest_checkpoint_v1.');
  }
  const storageEntries = value.storageEntries as Record<string, unknown>;
  if (
    !Object.prototype.hasOwnProperty.call(storageEntries, 'the-getaway-level0-autosave-v3') ||
    Object.entries(storageEntries).some(([key, entry]) =>
      !ALLOWED_STORAGE_KEYS.has(key) || typeof entry !== 'string'
    )
  ) {
    throw new Error('Checkpoint contains missing or disallowed browser storage entries.');
  }
  return value as unknown as PlaytestCheckpointArtifactV1;
};

const sha256 = (value: Buffer): string => createHash('sha256').update(value).digest('hex');

export const hashCheckpointStorageEntries = (
  storageEntries: Record<string, string>
): string => sha256(Buffer.from(JSON.stringify(
  Object.entries(storageEntries).sort(([left], [right]) => left.localeCompare(right))
)));

const parseCheckpointReplay = (
  replay: Buffer,
  checkpointId: string,
  storageEntries: Record<string, string>
): PlaytestCheckpointReplayV1 => {
  let value: unknown;
  try {
    value = JSON.parse(replay.toString('utf8')) as unknown;
  } catch (error) {
    throw new Error(`Checkpoint replay proof is not JSON: ${(error as Error).message}`);
  }
  if (
    !isRecord(value) ||
    value.schema !== 'playtest_checkpoint_replay_v1' ||
    value.checkpointId !== checkpointId ||
    value.startedFrom !== 'new-game' ||
    typeof value.completedAt !== 'string' ||
    Number.isNaN(Date.parse(value.completedAt)) ||
    !Array.isArray(value.steps) ||
    value.steps.length === 0 ||
    !isRecord(value.terminal) ||
    typeof value.terminal.sessionId !== 'string' ||
    !value.terminal.sessionId ||
    typeof value.terminal.mission !== 'string' ||
    !value.terminal.mission ||
    !isSha256(value.terminal.storageSha256) ||
    value.terminal.storageSha256 !== hashCheckpointStorageEntries(storageEntries)
  ) {
    throw new Error('Checkpoint replay proof does not match playtest_checkpoint_replay_v1.');
  }

  const steps = value.steps as unknown[];
  if (steps.length !== 1) {
    throw new Error(
      'Only a deterministically replayable New Game initial-state checkpoint is acceptance-eligible.'
    );
  }

  const autosave = decodeLevel0Autosave(storageEntries[LEVEL0_AUTOSAVE_KEY] ?? null);
  if (autosave.status !== 'compatible') {
    throw new Error('Checkpoint autosave is not a compatible canonical Level 0 state.');
  }
  const reconstructed = createInitialLevel0RunState(
    autosave.envelope.payload.sessionId,
    autosave.envelope.payload.identity.coverId
  );
  if (!isDeepStrictEqual(autosave.envelope.payload, reconstructed)) {
    throw new Error(
      'Checkpoint state is not the deterministic New Game state reconstructed by the current runtime.'
    );
  }
  const reconstructedObservationSha256 = sha256(
    Buffer.from(JSON.stringify(reconstructed))
  );

  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    if (
      !isRecord(step) ||
      step.sequence !== index ||
      typeof step.capturedAt !== 'string' ||
      Number.isNaN(Date.parse(step.capturedAt)) ||
      step.observationSha256 !== reconstructedObservationSha256 ||
      !isRecord(step.runtime) ||
      typeof step.runtime.sessionId !== 'string' ||
      step.runtime.sessionId !== value.terminal.sessionId ||
      typeof step.runtime.mission !== 'string' ||
      !validatePlaytestCommand(step.command).ok
    ) {
      throw new Error(`Checkpoint replay step ${index} is malformed or noncanonical.`);
    }
  }
  const firstCommand = (steps[0] as Record<string, unknown>).command;
  if (
    !isDeepStrictEqual(firstCommand, { kind: 'control', control: 'start' })
  ) {
    throw new Error('Checkpoint replay must begin with the visible New Game start control.');
  }
  const terminalStep = steps.at(-1) as Record<string, unknown>;
  const terminalRuntime = terminalStep.runtime as Record<string, unknown>;
  if (terminalRuntime.mission !== value.terminal.mission) {
    throw new Error('Checkpoint replay terminal mission does not match its final observation.');
  }

  if (
    autosave.envelope.payload.sessionId !== value.terminal.sessionId ||
    autosave.envelope.payload.mission !== value.terminal.mission
  ) {
    throw new Error('Checkpoint replay terminal state does not match the injected autosave.');
  }
  if (LEVEL0_ATTEMPT_BASELINE_KEY in storageEntries) {
    throw new Error('Deterministic New Game checkpoints cannot include an attempt baseline.');
  }
  return value as unknown as PlaytestCheckpointReplayV1;
};

export const prepareVerifiedCheckpoint = async (input: {
  repoRoot: string;
  runDirectory: string;
  mode: 'affected' | 'closeout';
  startState: PlaytestPacketStartStateV1;
  hashSources?: CheckpointHashSources;
}): Promise<VerifiedPlaytestCheckpoint | undefined> => {
  if (input.startState.kind === 'new-game') {
    const validation = validateCheckpoint(input.mode);
    if (!validation.valid) throw new Error(validation.errors.join(' '));
    return undefined;
  }
  if (input.mode === 'closeout') {
    throw new Error('Closeout mode must start from New Game and cannot use a checkpoint.');
  }
  if (!input.startState.provenanceRef.startsWith(`${CHECKPOINT_ROOT}/`)) {
    throw new Error(`Checkpoint provenance must live under ${CHECKPOINT_ROOT}/.`);
  }

  const provenancePath = resolveWithin(input.repoRoot, input.startState.provenanceRef);
  const artifact = parseCheckpointArtifact(await readFile(provenancePath, 'utf8'));
  if (artifact.provenance.checkpointId !== input.startState.checkpointId) {
    throw new Error('Checkpoint ID does not match its reviewed packet start state.');
  }
  const currentHashes = await computeCurrentCheckpointHashes(
    input.repoRoot,
    input.hashSources ?? DEFAULT_CHECKPOINT_HASH_SOURCES
  );
  const validation = validateCheckpoint('affected', artifact.provenance, currentHashes);
  if (!validation.valid) throw new Error(validation.errors.join(' '));

  const replayPath = resolveWithin(path.dirname(provenancePath), artifact.replayEvidenceRef);
  const replay = await readFile(replayPath);
  if (sha256(replay) !== artifact.provenance.newGameReplayProof.traceHash) {
    throw new Error('Checkpoint replay evidence hash does not match its provenance.');
  }
  parseCheckpointReplay(replay, artifact.provenance.checkpointId, artifact.storageEntries);

  const evidenceDirectory = path.join(input.runDirectory, 'checkpoint');
  await mkdir(evidenceDirectory, { recursive: true });
  await copyFile(provenancePath, path.join(evidenceDirectory, 'provenance.json'));
  await copyFile(replayPath, path.join(evidenceDirectory, 'new-game-replay.json'));
  await writeFile(
    path.join(evidenceDirectory, 'current-hashes.json'),
    `${JSON.stringify(currentHashes, null, 2)}\n`,
    'utf8'
  );
  return {
    checkpointId: artifact.provenance.checkpointId,
    storageEntries: { ...artifact.storageEntries },
    evidenceRefs: [
      'checkpoint/current-hashes.json',
      'checkpoint/new-game-replay.json',
      'checkpoint/provenance.json',
    ],
  };
};
