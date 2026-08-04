import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, resolve } from 'node:path';
import test from 'node:test';
import {
  publishValidatedRun,
  resolvePublishedRoot,
} from './get205-publication.mjs';

const createFixture = () => {
  const root = mkdtempSync(resolve(tmpdir(), 'get205-publication-'));
  const generatedRoot = resolve(root, '.generated');
  const stagingParent = resolve(root, '.staging');
  const oldRun = resolve(generatedRoot, 'runs/run-old');
  mkdirSync(oldRun, { recursive: true });
  mkdirSync(stagingParent, { recursive: true });
  writeFileSync(resolve(oldRun, 'marker.txt'), 'old');
  symlinkSync('runs/run-old', resolve(generatedRoot, 'current'), 'dir');
  return { root, generatedRoot, stagingParent, oldRun };
};

test('publishes one complete run through an atomic current pointer', () => {
  const fixture = createFixture();
  try {
    const stagingRoot = resolve(fixture.stagingParent, 'run-new');
    mkdirSync(stagingRoot);
    writeFileSync(resolve(stagingRoot, 'marker.txt'), 'new');

    const published = publishValidatedRun({
      generatedRoot: fixture.generatedRoot,
      stagingParent: fixture.stagingParent,
      stagingRoot,
      validatePublished: (root) => {
        assert.equal(readFileSync(resolve(root, 'marker.txt'), 'utf8'), 'new');
      },
    });

    assert.equal(resolvePublishedRoot(fixture.generatedRoot), published);
    assert.equal(basename(published), 'run-new');
    assert.equal(readFileSync(resolve(published, 'marker.txt'), 'utf8'), 'new');
    assert.equal(readFileSync(resolve(fixture.oldRun, 'marker.txt'), 'utf8'), 'old');
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('keeps the previous pointer when final validation rejects a run', () => {
  const fixture = createFixture();
  try {
    const stagingRoot = resolve(fixture.stagingParent, 'run-bad');
    mkdirSync(stagingRoot);
    writeFileSync(resolve(stagingRoot, 'marker.txt'), 'bad');

    assert.throws(
      () => publishValidatedRun({
        generatedRoot: fixture.generatedRoot,
        stagingParent: fixture.stagingParent,
        stagingRoot,
        validatePublished: () => {
          throw new Error('invalid run');
        },
      }),
      /invalid run/
    );

    assert.equal(resolvePublishedRoot(fixture.generatedRoot), fixture.oldRun);
    assert.equal(existsSync(resolve(fixture.generatedRoot, 'runs/run-bad')), false);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('restores the previous pointer when post-swap readback rejects a run', () => {
  const fixture = createFixture();
  try {
    const stagingRoot = resolve(fixture.stagingParent, 'run-bad-readback');
    mkdirSync(stagingRoot);
    writeFileSync(resolve(stagingRoot, 'marker.txt'), 'bad-readback');

    assert.throws(
      () => publishValidatedRun({
        generatedRoot: fixture.generatedRoot,
        stagingParent: fixture.stagingParent,
        stagingRoot,
        validatePublished: () => undefined,
        validateCurrent: () => {
          throw new Error('pointer readback failed');
        },
      }),
      /pointer readback failed/
    );

    assert.equal(resolvePublishedRoot(fixture.generatedRoot), fixture.oldRun);
    assert.equal(existsSync(resolve(fixture.generatedRoot, 'runs/run-bad-readback')), false);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('rejects publication from outside the owned staging parent', () => {
  const fixture = createFixture();
  try {
    const outside = resolve(fixture.root, 'outside');
    mkdirSync(outside);
    assert.throws(
      () => publishValidatedRun({
        generatedRoot: fixture.generatedRoot,
        stagingParent: fixture.stagingParent,
        stagingRoot: outside,
        validatePublished: () => undefined,
      }),
      /outside GET-205 staging/
    );
    assert.equal(resolvePublishedRoot(fixture.generatedRoot), fixture.oldRun);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});
