import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmod, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { COMPUTER_USE_MCP_COMMAND } from './worker.ts';

const execFileAsync = promisify(execFile);

export const COMPUTER_USE_SIGNATURE = {
  identifier: 'com.openai.sky.CUAService.cli',
  teamIdentifier: '2DC432GLL2',
  authority: 'Developer ID Application: OpenAI OpCo, LLC (2DC432GLL2)',
} as const;

export interface ComputerUseCodeSignature {
  identifier: typeof COMPUTER_USE_SIGNATURE.identifier;
  teamIdentifier: typeof COMPUTER_USE_SIGNATURE.teamIdentifier;
  authority: typeof COMPUTER_USE_SIGNATURE.authority;
}

export interface ComputerUseBinaryAttestation extends ComputerUseCodeSignature {
  schema: 'computer_use_binary_attestation_v1';
  executableSha256: string;
  mode: string;
  ownerUid: number;
  evidenceRef: string;
}

const lineValue = (text: string, name: string): string | undefined =>
  text.split(/\r?\n/)
    .find((line) => line.startsWith(`${name}=`))
    ?.slice(name.length + 1)
    .trim();

export const parseComputerUseCodeSignature = (text: string): ComputerUseCodeSignature => {
  const identifier = lineValue(text, 'Identifier');
  const teamIdentifier = lineValue(text, 'TeamIdentifier');
  const authorities = text.split(/\r?\n/)
    .filter((line) => line.startsWith('Authority='))
    .map((line) => line.slice('Authority='.length).trim());
  if (
    identifier !== COMPUTER_USE_SIGNATURE.identifier ||
    teamIdentifier !== COMPUTER_USE_SIGNATURE.teamIdentifier ||
    !authorities.includes(COMPUTER_USE_SIGNATURE.authority)
  ) {
    throw new Error('Computer Use binary does not match the reviewed OpenAI signature identity.');
  }
  return {
    identifier: COMPUTER_USE_SIGNATURE.identifier,
    teamIdentifier: COMPUTER_USE_SIGNATURE.teamIdentifier,
    authority: COMPUTER_USE_SIGNATURE.authority,
  };
};

export const attestComputerUseBinary = async (
  runDirectory: string
): Promise<ComputerUseBinaryAttestation> => {
  const resolved = await realpath(COMPUTER_USE_MCP_COMMAND);
  if (resolved !== COMPUTER_USE_MCP_COMMAND) {
    throw new Error('Computer Use launcher resolved through an unreviewed path.');
  }
  const metadata = await stat(resolved);
  const currentUid = process.getuid?.();
  if (
    !metadata.isFile() ||
    (metadata.mode & 0o022) !== 0 ||
    currentUid === undefined ||
    metadata.uid !== currentUid
  ) {
    throw new Error('Computer Use launcher ownership or file mode is not acceptance-safe.');
  }

  await execFileAsync('/usr/bin/codesign', [
    '--verify',
    '--strict',
    '--verbose=2',
    resolved,
  ], { maxBuffer: 1024 * 1024 });
  const display = await execFileAsync('/usr/bin/codesign', [
    '-dv',
    '--verbose=4',
    resolved,
  ], { maxBuffer: 1024 * 1024 });
  const signatureText = `${display.stdout}\n${display.stderr}`;
  const signature = parseComputerUseCodeSignature(signatureText);
  const executable = await readFile(resolved);
  const evidenceRef = 'computer-use-binary-attestation.json';
  const attestation: ComputerUseBinaryAttestation = {
    schema: 'computer_use_binary_attestation_v1',
    ...signature,
    executableSha256: createHash('sha256').update(executable).digest('hex'),
    mode: (metadata.mode & 0o777).toString(8).padStart(3, '0'),
    ownerUid: metadata.uid,
    evidenceRef,
  };
  const evidencePath = path.join(runDirectory, evidenceRef);
  await writeFile(evidencePath, `${JSON.stringify(attestation, null, 2)}\n`, 'utf8');
  await chmod(evidencePath, 0o600);
  return attestation;
};
