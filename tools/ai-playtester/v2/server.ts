import { execFile, spawn, type ChildProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmod, writeFile } from 'node:fs/promises';
import { request } from 'node:http';
import { createServer } from 'node:net';
import path from 'node:path';
import { promisify } from 'node:util';

import type { CurrentCheckpointHashes } from './checkpoint.ts';
import { computeCurrentCheckpointHashes } from './checkpointRuntime.ts';
import { appRoot, repoRoot } from './paths.ts';

const execFileAsync = promisify(execFile);

export const buildOwnedDevServerLaunch = (port: number): {
  baseUrl: string;
  args: string[];
} => ({
  baseUrl: `http://127.0.0.1:${port}`,
  args: [
    'yarn',
    'dev',
    '--host', '127.0.0.1',
    '--port', String(port),
    '--strictPort',
  ],
});

const selectEphemeralPort = (): Promise<number> => new Promise((resolve, reject) => {
  const reservation = createServer();
  reservation.unref();
  reservation.once('error', reject);
  reservation.listen(0, '127.0.0.1', () => {
    const address = reservation.address();
    if (!address || typeof address === 'string') {
      reservation.close();
      reject(new Error('Could not reserve a localhost port for the AI Gamer server.'));
      return;
    }
    reservation.close((error) => {
      if (error) reject(error);
      else resolve(address.port);
    });
  });
});

interface ProcessRelationship {
  pid: number;
  parentPid: number;
}

export const parseProcessRelationships = (output: string): ProcessRelationship[] =>
  output.split(/\r?\n/).flatMap((line) => {
    const match = line.trim().match(/^(\d+)\s+(\d+)$/);
    if (!match) return [];
    return [{ pid: Number(match[1]), parentPid: Number(match[2]) }];
  });

export const parseLsofListenerPids = (output: string): number[] =>
  [...new Set(output.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^p(\d+)$/);
    return match ? [Number(match[1])] : [];
  }))].sort((left, right) => left - right);

const ownedProcessIds = (
  rootPid: number,
  relationships: readonly ProcessRelationship[]
): Set<number> => {
  const owned = new Set([rootPid]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const process of relationships) {
      if (owned.has(process.parentPid) && !owned.has(process.pid)) {
        owned.add(process.pid);
        changed = true;
      }
    }
  }
  return owned;
};

export const assertOwnedServerListener = (input: {
  rootPid: number;
  processOutput: string;
  lsofOutput: string;
}): number[] => {
  const listeners = parseLsofListenerPids(input.lsofOutput);
  if (listeners.length !== 1) {
    throw new Error(
      `Owned Level 0 server requires exactly one listener process; found ${listeners.length}.`
    );
  }
  const owned = ownedProcessIds(
    input.rootPid,
    parseProcessRelationships(input.processOutput)
  );
  if (!owned.has(listeners[0])) {
    throw new Error('Selected listener is not owned by the launched Level 0 server process tree.');
  }
  return listeners;
};

const readListenerOutput = async (port: number): Promise<string> => {
  try {
    return (await execFileAsync(
      '/usr/sbin/lsof',
      ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-Fp'],
      { maxBuffer: 1024 * 1024 }
    )).stdout;
  } catch (error) {
    const failure = error as { code?: unknown; stdout?: string };
    if (failure.code === '1' || failure.code === 1) return failure.stdout ?? '';
    throw error;
  }
};

const attestOwnedServerListener = async (
  rootPid: number,
  port: number
): Promise<number[]> => {
  const [processes, listeners] = await Promise.all([
    execFileAsync('/bin/ps', ['-axo', 'pid=,ppid='], { maxBuffer: 4 * 1024 * 1024 }),
    readListenerOutput(port),
  ]);
  return assertOwnedServerListener({
    rootPid,
    processOutput: processes.stdout,
    lsofOutput: listeners,
  });
};

const hashLaunchEnvironment = (environment: NodeJS.ProcessEnv): string =>
  createHash('sha256')
    .update(JSON.stringify(Object.entries(environment).sort(([left], [right]) =>
      left.localeCompare(right, 'en')
    )))
    .digest('hex');

const requestOk = (url: string, timeoutMs = 2_000): Promise<boolean> =>
  new Promise((resolve) => {
    const req = request(url, { method: 'GET', timeout: timeoutMs }, (response) => {
      response.resume();
      resolve(Boolean(
        response.statusCode && response.statusCode >= 200 && response.statusCode < 500
      ));
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });

const waitForHttp = async (url: string, timeoutMs: number): Promise<void> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await requestOk(url)) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for the Level 0 dev server at ${url}.`);
};

export interface DevServerHandle {
  owned: true;
  baseUrl: string;
  evidenceRef: string;
  ensureAlive(): Promise<void>;
  close(): Promise<void>;
}

export const assertServedSourceHashes = (
  expected: CurrentCheckpointHashes,
  actual: CurrentCheckpointHashes
): void => {
  for (const key of [
    'buildHash',
    'contentHash',
    'layoutHash',
    'probeSchemaHash',
  ] as const) {
    if (expected[key] !== actual[key]) {
      throw new Error('Level 0 served source hashes changed during the AI Gamer gate.');
    }
  }
};

const stopChild = async (child: ChildProcess): Promise<void> => {
  if (child.exitCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([
    new Promise<void>((resolve) => child.once('exit', () => resolve())),
    new Promise<void>((resolve) => setTimeout(resolve, 5_000)),
  ]);
  if (child.exitCode === null) child.kill('SIGKILL');
};

export const ensureDevServer = async (runDirectory: string): Promise<DevServerHandle> => {
  const sourceHashes = await computeCurrentCheckpointHashes(repoRoot);
  const serverEnvironment = { ...process.env };
  const launchEnvironmentSha256 = hashLaunchEnvironment(serverEnvironment);
  const port = await selectEphemeralPort();
  const launch = buildOwnedDevServerLaunch(port);

  const child = spawn('/usr/bin/env', launch.args, {
    cwd: appRoot,
    env: serverEnvironment,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const output: string[] = [];
  child.stdout.on('data', (chunk: Buffer) => output.push(chunk.toString()));
  child.stderr.on('data', (chunk: Buffer) => output.push(chunk.toString()));

  if (!child.pid) {
    await stopChild(child);
    throw new Error('Owned Level 0 dev server has no process identity.');
  }
  const serverPid = child.pid;

  try {
    await waitForHttp(launch.baseUrl, 20_000);
    if (child.exitCode !== null) {
      throw new Error('Launched Level 0 dev server exited before ownership attestation.');
    }
    await attestOwnedServerListener(serverPid, port);
    assertServedSourceHashes(
      sourceHashes,
      await computeCurrentCheckpointHashes(repoRoot)
    );
  } catch (error) {
    await stopChild(child);
    throw new Error(`${(error as Error).message}\n${output.join('').slice(-4_000)}`);
  }

  const listenerPids = await attestOwnedServerListener(serverPid, port);
  const evidenceRef = 'served-source-hashes.json';
  const evidencePath = path.join(runDirectory, evidenceRef);
  await writeFile(evidencePath, `${JSON.stringify({
    schema: 'served_source_hashes_v1',
    baseUrl: launch.baseUrl,
    appRoot,
    serverPid,
    listenerPids,
    launchEnvironmentSha256,
    hashes: sourceHashes,
  }, null, 2)}\n`, 'utf8');
  await chmod(evidencePath, 0o600);

  return {
    owned: true,
    baseUrl: launch.baseUrl,
    evidenceRef,
    ensureAlive: async () => {
      if (child.exitCode !== null || !await requestOk(launch.baseUrl)) {
        throw new Error(
          `The owned Level 0 dev server stopped during the gate.\n${output.join('').slice(-4_000)}`
        );
      }
      await attestOwnedServerListener(serverPid, port);
      if (hashLaunchEnvironment(serverEnvironment) !== launchEnvironmentSha256) {
        throw new Error('Owned Level 0 server launch environment evidence changed during the gate.');
      }
      assertServedSourceHashes(
        sourceHashes,
        await computeCurrentCheckpointHashes(repoRoot)
      );
    },
    close: () => stopChild(child),
  };
};
