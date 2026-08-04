import { randomUUID } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readlinkSync,
  renameSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path';

const isStrictlyInside = (parent, candidate) => {
  const fromParent = relative(resolve(parent), resolve(candidate));
  return Boolean(fromParent) && fromParent !== '..' && !fromParent.startsWith(`..${sep}`) &&
    !isAbsolute(fromParent);
};

const requireOwnedDirectory = (path, label) => {
  if (!existsSync(path) || !lstatSync(path).isDirectory()) {
    throw new Error(`${label} is not a directory: ${path}`);
  }
};

export const resolvePublishedRoot = (generatedRoot) => {
  const ownedRoot = resolve(generatedRoot);
  const runsRoot = resolve(ownedRoot, 'runs');
  const pointerPath = resolve(ownedRoot, 'current');
  if (!existsSync(pointerPath) || !lstatSync(pointerPath).isSymbolicLink()) {
    throw new Error(`GET-205 publication pointer is missing or is not a symlink: ${pointerPath}`);
  }
  const target = readlinkSync(pointerPath);
  const publishedRoot = resolve(dirname(pointerPath), target);
  if (!isStrictlyInside(runsRoot, publishedRoot)) {
    throw new Error(`GET-205 publication pointer escapes its runs root: ${target}`);
  }
  requireOwnedDirectory(publishedRoot, 'GET-205 published run');
  return publishedRoot;
};

export const publishValidatedRun = ({
  generatedRoot,
  stagingParent,
  stagingRoot,
  validatePublished,
  validateCurrent = () => undefined,
}) => {
  const ownedGeneratedRoot = resolve(generatedRoot);
  const ownedStagingParent = resolve(stagingParent);
  const ownedStagingRoot = resolve(stagingRoot);
  if (!isStrictlyInside(ownedStagingParent, ownedStagingRoot)) {
    throw new Error(`GET-205 run is outside GET-205 staging: ${ownedStagingRoot}`);
  }
  requireOwnedDirectory(ownedStagingRoot, 'GET-205 staged run');

  const runId = basename(ownedStagingRoot);
  if (!/^run-[a-zA-Z0-9._-]+$/.test(runId)) {
    throw new Error(`GET-205 staged run has an unsafe identity: ${runId}`);
  }
  const runsRoot = resolve(ownedGeneratedRoot, 'runs');
  const publishedRoot = resolve(runsRoot, runId);
  if (!isStrictlyInside(runsRoot, publishedRoot) || existsSync(publishedRoot)) {
    throw new Error(`GET-205 published run already exists or is unsafe: ${publishedRoot}`);
  }

  mkdirSync(runsRoot, { recursive: true });
  renameSync(ownedStagingRoot, publishedRoot);
  try {
    validatePublished(publishedRoot);
  } catch (error) {
    rmSync(publishedRoot, { recursive: true, force: true });
    throw error;
  }

  const pointerPath = resolve(ownedGeneratedRoot, 'current');
  const previousPointerTarget = existsSync(pointerPath)
    ? (() => {
        resolvePublishedRoot(ownedGeneratedRoot);
        return readlinkSync(pointerPath);
      })()
    : undefined;
  const temporaryPointer = resolve(
    ownedGeneratedRoot,
    `.current-${process.pid}-${randomUUID()}`
  );
  let pointerReplaced = false;
  try {
    symlinkSync(relative(ownedGeneratedRoot, publishedRoot), temporaryPointer, 'dir');
    renameSync(temporaryPointer, pointerPath);
    pointerReplaced = true;
    validateCurrent(publishedRoot);
  } catch (error) {
    rmSync(temporaryPointer, { force: true });
    let rollbackError;
    if (pointerReplaced) {
      const rollbackPointer = resolve(
        ownedGeneratedRoot,
        `.current-rollback-${process.pid}-${randomUUID()}`
      );
      try {
        if (previousPointerTarget === undefined) {
          rmSync(pointerPath, { force: true });
        } else {
          symlinkSync(previousPointerTarget, rollbackPointer, 'dir');
          renameSync(rollbackPointer, pointerPath);
        }
      } catch (caught) {
        rollbackError = caught;
      } finally {
        rmSync(rollbackPointer, { force: true });
      }
    }
    if (!rollbackError) {
      rmSync(publishedRoot, { recursive: true, force: true });
    }
    if (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        'GET-205 publication readback failed and the prior pointer could not be restored.'
      );
    }
    throw error;
  }
  return publishedRoot;
};
