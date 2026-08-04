import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  CHARACTER_SPRITE_MANIFEST,
  NON_WORLD_CHARACTER_PRESENTATIONS,
} from '../content/characters/spriteManifest';
import {
  decodeRgbaPng,
  encodeRgbaPng,
  extractRgbaRegion,
  sha256Hex,
  type RgbaImage,
} from '../../scripts/lib/rgbaPng';

const APP_ROOT = path.resolve(process.cwd());
const REPOSITORY_ROOT = path.resolve(APP_ROOT, '..');
const VALIDATOR_PATH = path.join(APP_ROOT, 'scripts', 'validate-character-sprites.ts');
const TSX_PATH = path.join(APP_ROOT, 'node_modules', '.bin', 'tsx');

interface FixturePaths {
  root: string;
  repositoryRoot: string;
  appRoot: string;
}

const copyFileWithParents = async (source: string, target: string): Promise<void> => {
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.copyFile(source, target);
};

const createCanonicalFixture = async (): Promise<FixturePaths> => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'get206-character-assets-'));
  const repositoryRoot = path.join(root, 'repo');
  const appRoot = path.join(repositoryRoot, 'the-getaway');

  for (const entry of CHARACTER_SPRITE_MANIFEST) {
    await fs.cp(
      path.join(APP_ROOT, 'public', 'characters', entry.spriteSetId),
      path.join(appRoot, 'public', 'characters', entry.spriteSetId),
      { recursive: true }
    );
    await copyFileWithParents(
      path.join(APP_ROOT, 'public', entry.portrait.path),
      path.join(appRoot, 'public', entry.portrait.path)
    );
  }

  await fs.cp(
    path.join(APP_ROOT, 'public', 'characters', 'george'),
    path.join(appRoot, 'public', 'characters', 'george'),
    { recursive: true }
  );
  await copyFileWithParents(
    path.join(APP_ROOT, 'public', NON_WORLD_CHARACTER_PRESENTATIONS.takahiroBroadcast.path),
    path.join(appRoot, 'public', NON_WORLD_CHARACTER_PRESENTATIONS.takahiroBroadcast.path)
  );
  await copyFileWithParents(
    path.join(APP_ROOT, 'public', 'characters', 'actor-asset-integrity.json'),
    path.join(appRoot, 'public', 'characters', 'actor-asset-integrity.json')
  );

  for (const filename of [
    'grounded-cast-board-v1.png',
    'grounded-cast-board-v1.json',
    'grounded-portrait-board-v1.png',
    'grounded-portrait-board-v1.json',
  ]) {
    await copyFileWithParents(
      path.join(REPOSITORY_ROOT, 'art', 'actors', 'get206', 'references', filename),
      path.join(repositoryRoot, 'art', 'actors', 'get206', 'references', filename)
    );
  }
  await copyFileWithParents(
    path.join(REPOSITORY_ROOT, 'art', 'actors', 'get206', 'manifests', 'grounded-actor-recipe.json'),
    path.join(repositoryRoot, 'art', 'actors', 'get206', 'manifests', 'grounded-actor-recipe.json')
  );
  await fs.cp(
    path.join(REPOSITORY_ROOT, 'art', 'actors', 'get206', 'proof'),
    path.join(repositoryRoot, 'art', 'actors', 'get206', 'proof'),
    { recursive: true }
  );
  await copyFileWithParents(
    path.join(APP_ROOT, 'scripts', 'generate-grounded-character-assets.ts'),
    path.join(appRoot, 'scripts', 'generate-grounded-character-assets.ts')
  );
  await copyFileWithParents(
    path.join(APP_ROOT, 'scripts', 'lib', 'rgbaPng.ts'),
    path.join(appRoot, 'scripts', 'lib', 'rgbaPng.ts')
  );

  return { root, repositoryRoot, appRoot };
};

const runValidator = (fixture: FixturePaths) =>
  spawnSync(
    TSX_PATH,
    [
      VALIDATOR_PATH,
      '--app-root',
      fixture.appRoot,
      '--repository-root',
      fixture.repositoryRoot,
    ],
    { cwd: APP_ROOT, encoding: 'utf8' }
  );

interface MutableIntegrity {
  schemaVersion: number;
  provenance: {
    recipeId: string;
    recipe: { path: string; sha256: string };
    generator: { path: string; sha256: string };
    pngLibrary: { path: string; sha256: string };
    spriteReference: { id: string; path: string; sha256: string };
    portraitReference: { id: string; path: string; sha256: string };
  };
  actors: Record<
    string,
    {
      portrait: { sha256: string; compressedBytes: number; decodedBytes: number };
      sheets: Record<
        string,
        { sha256: string; compressedBytes: number; decodedBytes: number }
      >;
      metrics: { sha256: string; compressedBytes: number; decodedBytes: number };
    }
  >;
  nonWorldPresentations: Record<
    string,
    { sha256: string; compressedBytes: number; decodedBytes: number }
  >;
  proof: {
    images: Record<
      string,
      { sha256: string; compressedBytes: number; decodedBytes: number }
    >;
    manifest: { sha256: string; compressedBytes: number; decodedBytes: number };
  };
}

const integrityPath = (fixture: FixturePaths): string =>
  path.join(fixture.appRoot, 'public', 'characters', 'actor-asset-integrity.json');

const readIntegrity = async (fixture: FixturePaths): Promise<MutableIntegrity> =>
  JSON.parse(await fs.readFile(integrityPath(fixture), 'utf8')) as MutableIntegrity;

const writeIntegrity = async (
  fixture: FixturePaths,
  integrity: MutableIntegrity
): Promise<void> => {
  await fs.writeFile(integrityPath(fixture), `${JSON.stringify(integrity, null, 2)}\n`);
};

const updateSheetIntegrity = async (
  fixture: FixturePaths,
  actorId: string,
  sheetKey: string,
  png: Buffer
): Promise<void> => {
  const integrity = await readIntegrity(fixture);
  integrity.actors[actorId].sheets[sheetKey].sha256 = sha256Hex(png);
  integrity.actors[actorId].sheets[sheetKey].compressedBytes = png.length;
  await writeIntegrity(fixture, integrity);
};

const updatePngRecord = (
  record: { sha256: string; compressedBytes: number; decodedBytes: number },
  png: Buffer,
  image: RgbaImage
): void => {
  record.sha256 = sha256Hex(png);
  record.compressedBytes = png.length;
  record.decodedBytes = image.data.length;
};

const expectRejected = (fixture: FixturePaths, message: string | RegExp): void => {
  const result = runValidator(fixture);
  expect({ stdout: result.stdout, stderr: result.stderr, status: result.status }).toEqual(
    expect.objectContaining({ status: 1 })
  );
  expect(result.stderr).toEqual(expect.stringMatching(message));
};

describe('GET-206 character asset validator', () => {
  let fixture: FixturePaths;

  beforeEach(async () => {
    fixture = await createCanonicalFixture();
  });

  afterEach(async () => {
    await fs.rm(fixture.root, { recursive: true, force: true });
  });

  it('accepts the exact generated 12 actor contract', () => {
    const result = runValidator(fixture);

    expect({ status: result.status, stdout: result.stdout, stderr: result.stderr }).toEqual(
      expect.objectContaining({ status: 0 })
    );
    expect(result.stdout).toContain('12 actors');
    expect(result.stdout).toContain('1152 frames');
  });

  it('rejects a PNG with a corrupt chunk CRC even when inventory hash and bytes are updated', async () => {
    const actorId = CHARACTER_SPRITE_MANIFEST[0].actorId;
    const sheetKey = 'idle-north';
    const sheetPath = path.join(
      fixture.appRoot,
      'public',
      'characters',
      actorId,
      `${sheetKey}.png`
    );
    const png = Buffer.from(await fs.readFile(sheetPath));
    let offset = 8;
    let crcOffset = -1;
    while (offset + 12 <= png.length) {
      const length = png.readUInt32BE(offset);
      const type = png.subarray(offset + 4, offset + 8).toString('ascii');
      const dataEnd = offset + 8 + length;
      if (type === 'IDAT') {
        crcOffset = dataEnd;
        break;
      }
      offset = dataEnd + 4;
    }
    expect(crcOffset).toBeGreaterThan(0);
    png[crcOffset] ^= 0x01;
    await fs.writeFile(sheetPath, png);
    await updateSheetIntegrity(fixture, actorId, sheetKey, png);

    const result = runValidator(fixture);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('CRC');
  });

  it('rejects a missing sheet from the 12×3×8 contract', async () => {
    await fs.unlink(
      path.join(
        fixture.appRoot,
        'public',
        'characters',
        CHARACTER_SPRITE_MANIFEST[0].actorId,
        'idle-north.png'
      )
    );

    expectRejected(fixture, /missing \[idle-north\.png\]|cannot read/);
  });

  it('rejects stale attack assets that are outside the three-state contract', async () => {
    const actorDirectory = path.join(
      fixture.appRoot,
      'public',
      'characters',
      CHARACTER_SPRITE_MANIFEST[0].actorId
    );
    await fs.copyFile(
      path.join(actorDirectory, 'idle-north.png'),
      path.join(actorDirectory, 'attack-north.png')
    );

    expectRejected(fixture, /extra \[attack-north\.png\]/);
  });

  it('rejects unsafe sheet inventory keys', async () => {
    const actorId = CHARACTER_SPRITE_MANIFEST[0].actorId;
    const integrity = await readIntegrity(fixture);
    integrity.actors[actorId].sheets['../attack'] = {
      ...integrity.actors[actorId].sheets['idle-north'],
    };
    await writeIntegrity(fixture, integrity);

    expectRejected(fixture, /unsafe sheet inventory key/);
  });

  it('rejects a sheet whose pixels do not match its integrity hash', async () => {
    const actorId = CHARACTER_SPRITE_MANIFEST[0].actorId;
    const actorDirectory = path.join(fixture.appRoot, 'public', 'characters', actorId);
    await fs.copyFile(
      path.join(actorDirectory, 'idle-east.png'),
      path.join(actorDirectory, 'idle-north.png')
    );

    expectRejected(fixture, /idle-north: SHA-256 mismatch/);
  });

  it('rejects a decodable sheet with the wrong dimensions even after integrity is updated', async () => {
    const actorId = CHARACTER_SPRITE_MANIFEST[0].actorId;
    const sheetKey = 'idle-north';
    const sheetPath = path.join(
      fixture.appRoot,
      'public',
      'characters',
      actorId,
      `${sheetKey}.png`
    );
    const original = decodeRgbaPng(await fs.readFile(sheetPath));
    const cropped = extractRgbaRegion(original, 0, 0, original.width - 1, original.height);
    const png = encodeRgbaPng(cropped);
    await fs.writeFile(sheetPath, png);
    const integrity = await readIntegrity(fixture);
    updatePngRecord(integrity.actors[actorId].sheets[sheetKey], png, cropped);
    await writeIntegrity(fixture, integrity);

    expectRejected(fixture, /expected 256x96, got 255x96/);
  });

  it('recomputes per-frame alpha bounds, count, height, and foot row from pixels', async () => {
    const actorId = CHARACTER_SPRITE_MANIFEST[0].actorId;
    const sheetKey = 'idle-north';
    const sheetPath = path.join(
      fixture.appRoot,
      'public',
      'characters',
      actorId,
      `${sheetKey}.png`
    );
    const sheet = decodeRgbaPng(await fs.readFile(sheetPath));
    const shifted = new Uint8Array(sheet.data);
    const frameWidth = 64;
    const frameHeight = 96;
    for (let y = 0; y < frameHeight; y += 1) {
      shifted.fill(0, y * sheet.width * 4, y * sheet.width * 4 + frameWidth * 4);
    }
    for (let y = 0; y < frameHeight - 3; y += 1) {
      const sourceStart = y * sheet.width * 4;
      const targetStart = (y + 3) * sheet.width * 4;
      shifted.set(sheet.data.subarray(sourceStart, sourceStart + frameWidth * 4), targetStart);
    }
    const mutated = { ...sheet, data: shifted };
    const png = encodeRgbaPng(mutated);
    await fs.writeFile(sheetPath, png);
    const integrity = await readIntegrity(fixture);
    updatePngRecord(integrity.actors[actorId].sheets[sheetKey], png, mutated);
    await writeIntegrity(fixture, integrity);

    expectRejected(fixture, /alpha bounds mismatch|alpha pixel count mismatch|foot row mismatch/);
  });

  it('rejects metrics edited to disagree with decoded frame pixels', async () => {
    const actorId = CHARACTER_SPRITE_MANIFEST[0].actorId;
    const metricsPath = path.join(
      fixture.appRoot,
      'public',
      'characters',
      actorId,
      'sheet-metrics.json'
    );
    const metrics = JSON.parse(await fs.readFile(metricsPath, 'utf8')) as {
      states: { idle: { north: { frames: Array<{ alphaPixelCount: number }> } } };
    };
    metrics.states.idle.north.frames[0].alphaPixelCount += 1;
    const metricsBuffer = Buffer.from(`${JSON.stringify(metrics, null, 2)}\n`);
    await fs.writeFile(metricsPath, metricsBuffer);
    const integrity = await readIntegrity(fixture);
    integrity.actors[actorId].metrics.sha256 = sha256Hex(metricsBuffer);
    integrity.actors[actorId].metrics.compressedBytes = metricsBuffer.length;
    integrity.actors[actorId].metrics.decodedBytes = metricsBuffer.length;
    await writeIntegrity(fixture, integrity);

    expectRejected(fixture, /alpha pixel count mismatch/);
  });

  it('rejects transparency introduced into an opaque actor portrait', async () => {
    const actor = CHARACTER_SPRITE_MANIFEST[0];
    const portraitPath = path.join(fixture.appRoot, 'public', actor.portrait.path);
    const portrait = decodeRgbaPng(await fs.readFile(portraitPath));
    portrait.data[3] = 0;
    const png = encodeRgbaPng(portrait);
    await fs.writeFile(portraitPath, png);
    const integrity = await readIntegrity(fixture);
    updatePngRecord(integrity.actors[actor.actorId].portrait, png, portrait);
    await writeIntegrity(fixture, integrity);

    expectRejected(fixture, /expected an opaque background/);
  });

  it('rejects actor portrait integrity that is stale in generated runtime metadata', async () => {
    const actor = CHARACTER_SPRITE_MANIFEST[0];
    const portraitPath = path.join(fixture.appRoot, 'public', actor.portrait.path);
    const portrait = decodeRgbaPng(await fs.readFile(portraitPath));
    portrait.data[0] ^= 0x01;
    const png = encodeRgbaPng(portrait);
    await fs.writeFile(portraitPath, png);
    const integrity = await readIntegrity(fixture);
    updatePngRecord(integrity.actors[actor.actorId].portrait, png, portrait);
    await writeIntegrity(fixture, integrity);

    expectRejected(
      fixture,
      /portrait: generated TypeScript sha256 does not match central integrity/
    );
  });

  it('rejects an opaque George AR presentation', async () => {
    const georgePath = path.join(
      fixture.appRoot,
      'public',
      NON_WORLD_CHARACTER_PRESENTATIONS.georgeAr.path
    );
    const george = decodeRgbaPng(await fs.readFile(georgePath));
    for (let index = 3; index < george.data.length; index += 4) george.data[index] = 255;
    const png = encodeRgbaPng(george);
    await fs.writeFile(georgePath, png);
    const integrity = await readIntegrity(fixture);
    updatePngRecord(integrity.nonWorldPresentations.georgeAr, png, george);
    await writeIntegrity(fixture, integrity);

    expectRejected(fixture, /must contain both transparent and visible pixels/);
  });

  it('rejects non-world integrity that is stale in generated runtime metadata', async () => {
    const presentation = NON_WORLD_CHARACTER_PRESENTATIONS.takahiroBroadcast;
    const presentationPath = path.join(fixture.appRoot, 'public', presentation.path);
    const image = decodeRgbaPng(await fs.readFile(presentationPath));
    image.data[0] ^= 0x01;
    const png = encodeRgbaPng(image);
    await fs.writeFile(presentationPath, png);
    const integrity = await readIntegrity(fixture);
    updatePngRecord(integrity.nonWorldPresentations.takahiroBroadcast, png, image);
    await writeIntegrity(fixture, integrity);

    expectRejected(
      fixture,
      /takahiroBroadcast: presentation: generated TypeScript sha256 does not match central integrity/
    );
  });

  it('rejects recipe provenance drift', async () => {
    const integrity = await readIntegrity(fixture);
    integrity.provenance.recipeId = 'unreviewed-recipe';
    await writeIntegrity(fixture, integrity);

    expectRejected(fixture, /expected recipeId get206-grounded-actor-v2/);
  });

  it('rejects reference paths that escape the repository', async () => {
    const integrity = await readIntegrity(fixture);
    integrity.provenance.spriteReference.path = '../../outside-reference.png';
    await writeIntegrity(fixture, integrity);

    expectRejected(fixture, /unsafe (runtime|provenance) path/);
  });

  it('rejects provenance when the generator source no longer matches its recorded hash', async () => {
    const generatorPath = path.join(
      fixture.appRoot,
      'scripts',
      'generate-grounded-character-assets.ts'
    );
    await fs.appendFile(generatorPath, '\n// fault injection\n');

    expectRejected(fixture, /generator: SHA-256 mismatch/);
  });

  it('rejects proof images whose bytes no longer match the proof manifest', async () => {
    const proofPath = path.join(
      fixture.repositoryRoot,
      'art',
      'actors',
      'get206',
      'proof',
      'actor-roster-board.png'
    );
    const png = Buffer.from(await fs.readFile(proofPath));
    png[png.length - 1] ^= 0x01;
    await fs.writeFile(proofPath, png);

    expectRejected(fixture, /proof\.actorRoster: SHA-256 mismatch|CRC mismatch|trailing bytes/);
  });

  it('rejects missing or extra actors in the central integrity inventory', async () => {
    const integrity = await readIntegrity(fixture);
    delete integrity.actors[CHARACTER_SPRITE_MANIFEST[0].actorId];
    integrity.actors.unapproved_actor = integrity.actors[CHARACTER_SPRITE_MANIFEST[1].actorId];
    await writeIntegrity(fixture, integrity);

    expectRejected(fixture, /central actor inventory mismatch/);
  });
});
