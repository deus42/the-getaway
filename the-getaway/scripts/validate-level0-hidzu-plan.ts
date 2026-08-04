import { createHash } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  readFileSync,
  readlinkSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import { LEVEL0_LAYOUT_CONTRACT } from '../src/content/levels/level0/layoutContract';
import type {
  Level0ArtManifest,
  Level0SceneRecipe,
  Level0SourceManifest,
} from '../src/game/level0/art/types';
import type {
  Level0HidzuTreatmentBundle,
  Level0HidzuTreatmentEvidence,
  Level0HidzuTreatmentManifest,
  Level0HidzuVisualGrammar,
} from '../src/game/level0/art/hidzuTypes';
import { validateLevel0HidzuTreatmentBundle } from '../src/game/level0/art/hidzuValidator';
import {
  validateLevel0ArtManifest,
  validateLevel0SourceAndRecipe,
} from '../src/game/level0/art/validator';
import { validateLevel0LayoutContract } from '../src/game/level0/layout/validator';
import {
  createLevel0HidzuTreatmentEvidence,
  semanticMaskRegistrationDigest,
  sha256CanonicalJson,
  sha256File,
  type Get204MasterSceneMetadata,
} from './level0-hidzu-integrity';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..', '..');
const treatmentPath = resolve(
  repositoryRoot,
  'art/blender/get205/manifests/hidzu-treatment.json'
);
const verifyLocal = process.argv.includes('--verify-local');
const verifyExport = process.argv.includes('--verify-export');
const verifyCaptures = process.argv.includes('--verify-captures');
const generatedRootIndex = process.argv.indexOf('--generated-root');
const requestedGeneratedRoot = generatedRootIndex >= 0
  ? process.argv[generatedRootIndex + 1]
  : undefined;
if (generatedRootIndex >= 0 && !requestedGeneratedRoot) {
  throw new Error('GET-205 --generated-root requires a run-scoped staging path.');
}
const defaultGeneratedRoot = resolve(repositoryRoot, 'art/blender/get205/.generated');
const stagingParent = resolve(repositoryRoot, 'art/blender/get205/.staging');
const publishedRunsParent = resolve(defaultGeneratedRoot, 'runs');
const trialRunsParent = resolve(defaultGeneratedRoot, 'trials');
const isStrictlyInside = (parent: string, candidate: string): boolean => {
  const fromParent = relative(resolve(parent), resolve(candidate));
  return Boolean(fromParent) && fromParent !== '..' && !fromParent.startsWith(`..${sep}`) &&
    !isAbsolute(fromParent);
};
const resolveCurrentPublishedRoot = (): string => {
  const pointer = resolve(defaultGeneratedRoot, 'current');
  if (!existsSync(pointer) || !lstatSync(pointer).isSymbolicLink()) {
    throw new Error(`GET-205 complete publication pointer is unavailable: ${pointer}`);
  }
  const target = resolve(defaultGeneratedRoot, readlinkSync(pointer));
  if (!isStrictlyInside(publishedRunsParent, target) || !statSync(target).isDirectory()) {
    throw new Error('GET-205 complete publication pointer escapes or targets an invalid run.');
  }
  return target;
};
const generatedRoot = requestedGeneratedRoot
  ? resolve(requestedGeneratedRoot)
  : verifyExport || verifyCaptures
    ? resolveCurrentPublishedRoot()
    : defaultGeneratedRoot;
if (requestedGeneratedRoot) {
  if (
    !isStrictlyInside(stagingParent, generatedRoot) &&
    !isStrictlyInside(publishedRunsParent, generatedRoot) &&
    !isStrictlyInside(trialRunsParent, generatedRoot)
  ) {
    throw new Error(
      `GET-205 generated root is outside staging, published runs, or ignored trials: ${generatedRoot}`
    );
  }
}

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;

interface Level0HidzuArtManifest extends Level0ArtManifest {
  treatmentId: string;
  baseRecipeId: string;
  geometrySignature: string;
  projectionVerification: {
    tolerancePixels: number;
    maximumErrorPixels: number;
    samples: Array<{ id: string; errorPixels: number }>;
    renderableScene: {
      sampledMeshObjects: number;
      pixelBounds: { minX: number; minY: number; maxX: number; maxY: number };
    };
  };
  licenseBoundary: string;
}

interface Level0HidzuRunEvidence {
  schemaVersion: number;
  ticket: string;
  generationMode: 'preview' | 'captures' | 'exports' | 'all';
  requestedCaptureId: string | null;
  treatmentId: string;
  usage: string;
  baseGeometrySignature: string;
  referenceSha256: string;
  visualGrammarId: string;
  visualGrammarSha256: string;
  surfaceTreatmentDigest: string;
  grammarBindings: Array<{
    additionId: string;
    grammarId: string;
    kind: string;
    colorTokenId: string;
    silhouette: string;
    glyph: string;
    objectCount: number;
  }>;
  publicMessages: Array<{
    id: string;
    additionId: string;
    copySha256: string;
    renderedBodySha256: string;
    objectName: string;
    objectCount: number;
    renderVisible: boolean;
    fontSize: number;
    emissionStrength: number;
  }>;
  surveillanceStateCues: Array<{
    id: string;
    colorTokenId: string;
    glyph: string;
    silhouette: string;
    motionCue: string;
    objectCount: number;
  }>;
  paletteCoverage: null | {
    sourcePath: string;
    sourceSha256: string;
    width: number;
    height: number;
    sampleStride: number;
    sampleScope: string;
    backgroundRgb: [number, number, number];
    minimumBackgroundRgbDistance: number;
    sampledPixels: number;
    maximumRgbDistance: number;
    colorSpace: string;
    tokens: Array<{
      id: string;
      matchedPixels: number;
      coverageRatio: number;
      maximumCoverageRatio: number;
    }>;
  };
  beforeMatrixDigest: string;
  afterMatrixDigest: string;
  cameraBeforeDigest: string;
  cameraAfterDigest: string;
  addedObjectCount: number;
  registeredAdditionIds: string[];
  additionBounds: Array<{
    id: string;
    targetKind: 'anchor' | 'placement';
    targetId: string;
    objectCount: number;
    collisionEffect: 'none';
    minimum: { x: number; y: number; z: number };
    maximum: { x: number; y: number; z: number };
  }>;
  generatedObjectCount: number;
  practicalLightCount: number;
  practicalLightIds: string[];
  materialOverrideCount: number;
  materialOverrideIds: string[];
  scheduleStates: string[];
  requiredCaptures: Array<{ id: string; evidence: string }>;
  generatedCaptures: Array<{
    id: string;
    path: string;
    sha256: string;
    byteSize: number;
    width: number;
    height: number;
    schedule: string;
    evidence: string;
  }>;
  outputs: Array<{ path: string; sha256: string; byteSize: number }>;
  generatedOutputsIgnored: boolean;
  runtimeReady: boolean;
  entitlementBoundary: string;
}

const approximatelyEqual = (left: number, right: number): boolean =>
  Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) <= 0.000_001;

const exactSet = (actual: readonly string[], expected: readonly string[]): boolean =>
  actual.length === expected.length &&
  new Set(actual).size === actual.length &&
  actual.every((entry) => expected.includes(entry));

const wrapPublicMessage = (copy: string, width = 28): string => {
  const lines: string[] = [];
  let current = '';
  for (const word of copy.trim().split(/\s+/u)) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && candidate.length > width) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.join('\n');
};

const listFilesRecursively = (root: string): string[] => {
  const visit = (current: string): string[] => readdirSync(current, { withFileTypes: true })
    .flatMap((entry) => {
      const path = resolve(current, entry.name);
      return entry.isDirectory() ? visit(path) : [path];
    });
  return visit(root)
    .map((path) => relative(root, path).split(sep).join('/'))
    .sort();
};

const readPngSize = (path: string): { width: number; height: number } => {
  const header = readFileSync(path).subarray(0, 24);
  const signature = '89504e470d0a1a0a';
  if (header.length < 24 || header.subarray(0, 8).toString('hex') !== signature) {
    throw new Error(`GET-205 capture is not a PNG: ${path}`);
  }
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
};

const paethPredictor = (left: number, above: number, upperLeft: number): number => {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  return aboveDistance <= upperLeftDistance ? above : upperLeft;
};

const decodePngRgba = (path: string): { width: number; height: number; pixels: Uint8Array } => {
  const payload = readFileSync(path);
  if (payload.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error(`GET-205 palette source is not PNG: ${path}`);
  }
  let cursor = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = -1;
  let interlace = -1;
  const compressed: Buffer[] = [];
  while (cursor < payload.length) {
    const length = payload.readUInt32BE(cursor);
    const type = payload.subarray(cursor + 4, cursor + 8).toString('ascii');
    const chunk = payload.subarray(cursor + 8, cursor + 8 + length);
    cursor += 12 + length;
    if (type === 'IHDR') {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      bitDepth = chunk[8] ?? 0;
      colorType = chunk[9] ?? -1;
      interlace = chunk[12] ?? -1;
    } else if (type === 'IDAT') {
      compressed.push(chunk);
    } else if (type === 'IEND') {
      break;
    }
  }
  if (
    width <= 0 || height <= 0 || bitDepth !== 8 ||
    ![2, 6].includes(colorType) || interlace !== 0
  ) {
    throw new Error(`GET-205 palette measurement requires noninterlaced 8-bit RGB/RGBA: ${path}`);
  }
  const channels = colorType === 6 ? 4 : 3;
  const rowSize = width * channels;
  const inflated = inflateSync(Buffer.concat(compressed));
  if (inflated.length !== height * (rowSize + 1)) {
    throw new Error(`GET-205 PNG scanline size drifted: ${path}`);
  }
  const pixels = new Uint8Array(width * height * 4);
  let sourceCursor = 0;
  let targetCursor = 0;
  let previous = new Uint8Array(rowSize);
  for (let y = 0; y < height; y += 1) {
    const filterType = inflated[sourceCursor] ?? -1;
    sourceCursor += 1;
    const raw = inflated.subarray(sourceCursor, sourceCursor + rowSize);
    sourceCursor += rowSize;
    const current = new Uint8Array(rowSize);
    for (let index = 0; index < rowSize; index += 1) {
      const value = raw[index] ?? 0;
      const left = index >= channels ? current[index - channels] ?? 0 : 0;
      const above = previous[index] ?? 0;
      const upperLeft = index >= channels ? previous[index - channels] ?? 0 : 0;
      let reconstructed: number;
      if (filterType === 0) reconstructed = value;
      else if (filterType === 1) reconstructed = value + left;
      else if (filterType === 2) reconstructed = value + above;
      else if (filterType === 3) reconstructed = value + Math.floor((left + above) / 2);
      else if (filterType === 4) {
        reconstructed = value + paethPredictor(left, above, upperLeft);
      } else {
        throw new Error(`Unsupported GET-205 PNG filter ${filterType}: ${path}`);
      }
      current[index] = reconstructed & 0xff;
    }
    for (let x = 0; x < width; x += 1) {
      const sourceIndex = x * channels;
      pixels[targetCursor] = current[sourceIndex] ?? 0;
      pixels[targetCursor + 1] = current[sourceIndex + 1] ?? 0;
      pixels[targetCursor + 2] = current[sourceIndex + 2] ?? 0;
      pixels[targetCursor + 3] = channels === 4 ? current[sourceIndex + 3] ?? 0 : 255;
      targetCursor += 4;
    }
    previous = current;
  }
  return { width, height, pixels };
};

const measurePaletteCoverage = (
  path: string,
  grammar: Level0HidzuVisualGrammar,
  sampleStride: number,
  maximumRgbDistance: number,
  minimumBackgroundRgbDistance: number
): {
  backgroundRgb: [number, number, number];
  sampledPixels: number;
  matchedById: Map<string, number>;
} => {
  const { width, height, pixels } = decodePngRgba(path);
  const palette = grammar.palette.map((token) => ({
    id: token.id,
    rgb: [1, 3, 5].map((offset) => Number.parseInt(token.hex.slice(offset, offset + 2), 16)),
  }));
  const matchedById = new Map(palette.map((token) => [token.id, 0]));
  const cornerIndices = [
    0,
    (width - 1) * 4,
    (height - 1) * width * 4,
    (width * height - 1) * 4,
  ];
  const backgroundRgb = [0, 1, 2].map((channel) =>
    Math.floor((cornerIndices.reduce(
      (sum, index) => sum + (pixels[index + channel] ?? 0),
      0
    ) + 2) / 4)
  ) as [number, number, number];
  let sampledPixels = 0;
  for (let y = 0; y < height; y += sampleStride) {
    for (let x = 0; x < width; x += sampleStride) {
      const index = (y * width + x) * 4;
      if ((pixels[index + 3] ?? 0) < 128) continue;
      const backgroundDistance = backgroundRgb.reduce(
        (sum, channel, channelIndex) =>
          sum + ((pixels[index + channelIndex] ?? 0) - channel) ** 2,
        0
      );
      if (backgroundDistance <= minimumBackgroundRgbDistance ** 2) continue;
      sampledPixels += 1;
      const nearest = palette
        .map((token) => ({
          id: token.id,
          distance: token.rgb.reduce(
            (sum, channel, channelIndex) =>
              sum + ((pixels[index + channelIndex] ?? 0) - channel) ** 2,
            0
          ),
        }))
        .sort((left, right) => left.distance - right.distance)[0];
      if (nearest && nearest.distance <= maximumRgbDistance ** 2) {
        matchedById.set(nearest.id, (matchedById.get(nearest.id) ?? 0) + 1);
      }
    }
  }
  return { backgroundRgb, sampledPixels, matchedById };
};

const resolveRepositoryPath = (relativePath: string): string => {
  const absolutePath = resolve(repositoryRoot, relativePath);
  if (absolutePath !== repositoryRoot && !absolutePath.startsWith(`${repositoryRoot}${sep}`)) {
    throw new Error(`GET-205 path escapes the repository: ${relativePath}`);
  }
  return absolutePath;
};

const requireFile = (path: string, description: string): void => {
  if (!existsSync(path) || !statSync(path).isFile()) {
    throw new Error(`Missing ${description}: ${path}`);
  }
};

const resolveWithin = (root: string, relativePath: string, label: string): string => {
  const path = resolve(root, relativePath);
  if (path === root || !path.startsWith(`${root}${sep}`)) {
    throw new Error(`${label} escapes its ignored root: ${relativePath}`);
  }
  return path;
};

const validateRunEvidence = (
  exported: Level0HidzuRunEvidence,
  treatment: Level0HidzuTreatmentManifest,
  grammar: Level0HidzuVisualGrammar,
  measured: Level0HidzuTreatmentEvidence,
  recipe: Level0SceneRecipe,
  metadata: Get204MasterSceneMetadata,
  generatedRoot: string
): void => {
  const expectedCapturePairs = treatment.captures.map(
    (entry) => `${entry.id}:${entry.evidence}`
  );
  const actualCapturePairs = exported.requiredCaptures.map(
    (entry) => `${entry.id}:${entry.evidence}`
  );
  if (
    exported.schemaVersion !== 1 ||
    exported.ticket !== 'GET-205' ||
    exported.treatmentId !== treatment.id ||
    exported.usage !== treatment.usage ||
    exported.baseGeometrySignature !== measured.geometrySignature ||
    exported.referenceSha256 !== measured.referenceSha256 ||
    exported.visualGrammarId !== grammar.id ||
    exported.visualGrammarSha256 !== measured.visualGrammarSha256 ||
    !exported.beforeMatrixDigest ||
    exported.beforeMatrixDigest !== exported.afterMatrixDigest ||
    !exported.cameraBeforeDigest ||
    exported.cameraBeforeDigest !== exported.cameraAfterDigest ||
    exported.addedObjectCount !== treatment.additions.length ||
    !exactSet(
      exported.registeredAdditionIds,
      treatment.additions.map((entry) => entry.id)
    ) ||
    !exactSet(
      exported.additionBounds.map((entry) => entry.id),
      treatment.additions.map((entry) => entry.id)
    ) ||
    !Number.isInteger(exported.generatedObjectCount) ||
    exported.generatedObjectCount < treatment.additions.length ||
    exported.practicalLightCount !== treatment.practicalLights.length ||
    !exactSet(
      exported.practicalLightIds,
      treatment.practicalLights.map((entry) => entry.id)
    ) ||
    exported.materialOverrideCount !== treatment.materialOverrides.length ||
    !exactSet(
      exported.materialOverrideIds,
      treatment.materialOverrides.map((entry) => entry.placementId)
    ) ||
    !exactSet(exported.scheduleStates, treatment.scheduleStates.map((entry) => entry.id)) ||
    !exactSet(actualCapturePairs, expectedCapturePairs) ||
    exported.generatedOutputsIgnored !== true ||
    exported.runtimeReady !== false ||
    exported.entitlementBoundary !== 'acquisition-specific-evidence-unavailable'
  ) {
    throw new Error('GET-205 Blender evidence does not prove the registered additive treatment.');
  }
  if (exported.surfaceTreatmentDigest !== sha256CanonicalJson(treatment.surfaceTreatment)) {
    throw new Error('GET-205 surface treatment evidence drifted.');
  }
  const grammarById = new Map(grammar.entries.map((entry) => [entry.id, entry]));
  const bindingByAddition = new Map(
    exported.grammarBindings.map((entry) => [entry.additionId, entry])
  );
  if (
    !exactSet(
      exported.grammarBindings.map((entry) => entry.additionId),
      treatment.additions.map((entry) => entry.id)
    ) ||
    treatment.additions.some((addition) => {
      const expected = grammarById.get(addition.grammarId);
      const measured = bindingByAddition.get(addition.id);
      return !expected || !measured || measured.grammarId !== addition.grammarId ||
        measured.kind !== expected.kind || measured.colorTokenId !== expected.colorTokenId ||
        measured.silhouette !== expected.silhouette || measured.glyph !== expected.glyph ||
        !Number.isInteger(measured.objectCount) || measured.objectCount < 1;
    })
  ) {
    throw new Error('GET-205 generated grammar bindings drifted from the visual manifest.');
  }
  const publicMessageById = new Map(exported.publicMessages.map((entry) => [entry.id, entry]));
  if (
    !exactSet(
      exported.publicMessages.map((entry) => entry.id),
      treatment.publicMessageTemplates.map((entry) => entry.id)
    ) ||
    treatment.publicMessageTemplates.some((message) => {
      const measured = publicMessageById.get(message.id);
      const owner = treatment.additions.find((addition) =>
        addition.messageTemplateIds.includes(message.id)
      );
      return !measured || !owner || measured.additionId !== owner.id ||
        measured.copySha256 !== createHash('sha256').update(message.copy).digest('hex') ||
        measured.renderedBodySha256 !== createHash('sha256')
          .update(wrapPublicMessage(message.copy))
          .digest('hex') ||
        measured.objectCount !== 1 || !measured.objectName || measured.renderVisible !== true ||
        measured.fontSize < 0.3 || measured.emissionStrength < 1.25;
    })
  ) {
    throw new Error('GET-205 public-message render evidence drifted from the treatment manifest.');
  }
  const cueById = new Map(exported.surveillanceStateCues.map((entry) => [entry.id, entry]));
  if (
    !exactSet(
      exported.surveillanceStateCues.map((entry) => entry.id),
      grammar.surveillanceStates.map((entry) => entry.id)
    ) ||
    grammar.surveillanceStates.some((state) => {
      const measured = cueById.get(state.id);
      return !measured || measured.colorTokenId !== state.colorTokenId ||
        measured.glyph !== state.glyph || measured.silhouette !== state.silhouette ||
        measured.motionCue !== state.motionCue || !Number.isInteger(measured.objectCount) ||
        measured.objectCount < 1;
    })
  ) {
    throw new Error('GET-205 surveillance-state cue evidence drifted from the visual grammar.');
  }
  const anchorById = new Map(LEVEL0_LAYOUT_CONTRACT.anchors.map((anchor) => [anchor.id, anchor]));
  const placementBoundsById = new Map(
    metadata.buildingPlacements.map((placement) => [
      placement.placementId,
      placement.transformedBoundsMeters,
    ])
  );
  const additionById = new Map(treatment.additions.map((addition) => [addition.id, addition]));
  const finitePoint = (point: { x: number; y: number; z: number }): boolean =>
    Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z);
  exported.additionBounds.forEach((record) => {
    const definition = additionById.get(record.id);
    if (
      !definition ||
      definition.target.kind !== record.targetKind ||
      definition.target.id !== record.targetId ||
      record.objectCount < 1 ||
      record.collisionEffect !== 'none' ||
      !finitePoint(record.minimum) ||
      !finitePoint(record.maximum) ||
      record.minimum.x >= record.maximum.x ||
      record.minimum.y >= record.maximum.y ||
      record.minimum.z >= record.maximum.z
    ) {
      throw new Error(`GET-205 measured addition bounds are invalid: ${record.id}`);
    }
    if (record.targetKind === 'anchor') {
      const anchor = anchorById.get(record.targetId);
      if (!anchor) {
        throw new Error(`GET-205 addition lacks a declared anchor target: ${record.id}`);
      }
      const targetX = anchor.position.x * recipe.coordinateSystem.layoutUnitMeters;
      const targetY = anchor.position.y * recipe.coordinateSystem.layoutUnitMeters;
      const allowedRadius = anchor.radius * recipe.coordinateSystem.layoutUnitMeters + 0.5;
      const cornerDistances = [
        [record.minimum.x, record.minimum.y],
        [record.minimum.x, record.maximum.y],
        [record.maximum.x, record.minimum.y],
        [record.maximum.x, record.maximum.y],
      ].map(([x, y]) => Math.hypot(x! - targetX, y! - targetY));
      if (cornerDistances.some((distance) => distance > allowedRadius)) {
        throw new Error(`GET-205 addition escapes its semantic anchor clearance: ${record.id}`);
      }
      return;
    }
    const targetBounds = placementBoundsById.get(record.targetId);
    const toleranceMeters = 0.5;
    if (
      !targetBounds ||
      record.minimum.x < targetBounds.minimum[0] - toleranceMeters ||
      record.minimum.y < targetBounds.minimum[1] - toleranceMeters ||
      record.minimum.z < targetBounds.minimum[2] - toleranceMeters ||
      record.maximum.x > targetBounds.maximum[0] + toleranceMeters ||
      record.maximum.y > targetBounds.maximum[1] + toleranceMeters ||
      record.maximum.z > targetBounds.maximum[2] + toleranceMeters
    ) {
      throw new Error(`GET-205 addition escapes its measured placement target: ${record.id}`);
    }
  });
  const outputPaths = exported.outputs.map((entry) => entry.path);
  if (
    new Set(outputPaths).size !== outputPaths.length ||
    exported.outputs.some((entry) =>
      !entry.path || !/^[a-f0-9]{64}$/.test(entry.sha256) || entry.byteSize <= 0
    )
  ) {
    throw new Error('GET-205 Blender evidence output inventory is invalid.');
  }
  if (
    ['preview', 'all'].includes(exported.generationMode) &&
    !outputPaths.includes('master/overview.png')
  ) {
    throw new Error('GET-205 Blender evidence omits the master overview.');
  }
  if (!outputPaths.includes('get205-level0-hidzu.blend')) {
    throw new Error('GET-205 Blender evidence omits the authoring scene.');
  }
  exported.outputs.forEach((entry) => {
    const path = resolveWithin(generatedRoot, entry.path, 'GET-205 output evidence path');
    requireFile(path, 'GET-205 output evidence artifact');
    if (statSync(path).size !== entry.byteSize || sha256File(path) !== entry.sha256) {
      throw new Error(`GET-205 output evidence drifted: ${entry.path}`);
    }
  });
  if (['preview', 'all'].includes(exported.generationMode)) {
    const coverage = exported.paletteCoverage;
    if (
      !coverage || coverage.sourcePath !== 'master/overview.png' ||
      coverage.sourceSha256 !== sha256File(resolveWithin(
        generatedRoot,
        coverage.sourcePath,
        'GET-205 palette coverage source'
      )) ||
      coverage.sampleStride !== 4 || coverage.maximumRgbDistance !== 24 ||
      coverage.sampleScope !== 'foreground-difference' ||
      coverage.minimumBackgroundRgbDistance !== 12 ||
      !Array.isArray(coverage.backgroundRgb) || coverage.backgroundRgb.length !== 3 ||
      coverage.colorSpace !== 'srgb-euclidean' ||
      !exactSet(coverage.tokens.map((entry) => entry.id), grammar.palette.map((entry) => entry.id))
    ) {
      throw new Error('GET-205 palette coverage evidence is incomplete or detached from its image.');
    }
    const sourcePath = resolveWithin(
      generatedRoot,
      coverage.sourcePath,
      'GET-205 palette coverage source'
    );
    const dimensions = readPngSize(sourcePath);
    const measuredCoverage = measurePaletteCoverage(
      sourcePath,
      grammar,
      coverage.sampleStride,
      coverage.maximumRgbDistance,
      coverage.minimumBackgroundRgbDistance
    );
    const tokenById = new Map(coverage.tokens.map((entry) => [entry.id, entry]));
    if (
      coverage.width !== dimensions.width || coverage.height !== dimensions.height ||
      JSON.stringify(coverage.backgroundRgb) !==
        JSON.stringify(measuredCoverage.backgroundRgb) ||
      coverage.sampledPixels !== measuredCoverage.sampledPixels ||
      grammar.palette.some((token) => {
        const measured = tokenById.get(token.id);
        const matchedPixels = measuredCoverage.matchedById.get(token.id) ?? -1;
        const expectedRatio = matchedPixels / measuredCoverage.sampledPixels;
        return !measured || measured.matchedPixels !== matchedPixels ||
          !approximatelyEqual(measured.coverageRatio, expectedRatio) ||
          measured.maximumCoverageRatio !== token.maximumCoverageRatio ||
          measured.coverageRatio > token.maximumCoverageRatio;
      })
    ) {
      throw new Error('GET-205 palette coverage evidence drifted or exceeds registered maxima.');
    }
  } else if (exported.paletteCoverage !== null) {
    throw new Error('GET-205 partial run reports palette coverage without a rendered overview.');
  }
};

const verifyAnchorPayload = (
  path: string,
  art: Level0HidzuArtManifest,
  recipe: Level0SceneRecipe
): void => {
  const anchorPayload = readJson<{
    recipeId?: string;
    layoutContractId?: string;
    projection?: {
      tileWidth?: number;
      tileHeight?: number;
      orientation?: string;
      pixelOrigin?: { x?: number; y?: number };
    };
    anchors?: Array<{
      id?: string;
      kind?: string;
      required?: boolean;
      radiusLayoutUnits?: number;
      layoutPosition?: { x?: number; y?: number };
      worldPositionMeters?: { x?: number; y?: number; z?: number };
      pixelPosition?: { x?: number; y?: number };
      ownerId?: string;
      tags?: string[];
    }>;
  }>(path);
  const projection = anchorPayload.projection;
  if (
    anchorPayload.recipeId !== recipe.id ||
    anchorPayload.layoutContractId !== LEVEL0_LAYOUT_CONTRACT.id ||
    projection?.tileWidth !== recipe.camera.tileWidth ||
    projection?.tileHeight !== recipe.camera.tileHeight ||
    projection?.orientation !== 'isometric-2:1' ||
    !approximatelyEqual(
      projection?.pixelOrigin?.x ?? Number.NaN,
      recipe.alignedExport.canvas.pixelOrigin.x
    ) ||
    !approximatelyEqual(
      projection?.pixelOrigin?.y ?? Number.NaN,
      recipe.alignedExport.canvas.pixelOrigin.y
    )
  ) {
    throw new Error('GET-205 anchor projection metadata drifts from the stable T4 recipe.');
  }
  if (anchorPayload.anchors?.length !== art.anchorMetadata.count) {
    throw new Error('GET-205 anchor metadata count drifts from the art manifest.');
  }
  const anchorsById = new Map(anchorPayload.anchors?.map((anchor) => [anchor.id, anchor]));
  if (anchorsById.size !== LEVEL0_LAYOUT_CONTRACT.anchors.length || anchorsById.has(undefined)) {
    throw new Error('GET-205 anchor IDs drift from the Level 0 layout contract.');
  }
  const unit = recipe.coordinateSystem.layoutUnitMeters;
  const halfTileWidth = recipe.camera.tileWidth / 2;
  const halfTileHeight = recipe.camera.tileHeight / 2;
  LEVEL0_LAYOUT_CONTRACT.anchors.forEach((expected) => {
    const actual = anchorsById.get(expected.id);
    const expectedPixel = {
      x:
        (expected.position.x - expected.position.y) * halfTileWidth +
        recipe.alignedExport.canvas.pixelOrigin.x,
      y:
        (expected.position.x + expected.position.y) * halfTileHeight +
        recipe.alignedExport.canvas.pixelOrigin.y,
    };
    if (
      !actual ||
      actual.kind !== expected.kind ||
      actual.required !== expected.required ||
      !approximatelyEqual(actual.radiusLayoutUnits ?? Number.NaN, expected.radius) ||
      !approximatelyEqual(actual.layoutPosition?.x ?? Number.NaN, expected.position.x) ||
      !approximatelyEqual(actual.layoutPosition?.y ?? Number.NaN, expected.position.y) ||
      !approximatelyEqual(actual.worldPositionMeters?.x ?? Number.NaN, expected.position.x * unit) ||
      !approximatelyEqual(actual.worldPositionMeters?.y ?? Number.NaN, expected.position.y * unit) ||
      !approximatelyEqual(actual.worldPositionMeters?.z ?? Number.NaN, 0) ||
      !approximatelyEqual(actual.pixelPosition?.x ?? Number.NaN, expectedPixel.x) ||
      !approximatelyEqual(actual.pixelPosition?.y ?? Number.NaN, expectedPixel.y) ||
      actual.ownerId !== expected.ownerId ||
      JSON.stringify(actual.tags ?? []) !== JSON.stringify(expected.tags ?? [])
    ) {
      throw new Error(`GET-205 anchor metadata drifts for ${expected.id}.`);
    }
  });
};

const verifyAlignedExport = (
  generatedRoot: string,
  treatment: Level0HidzuTreatmentManifest,
  recipe: Level0SceneRecipe,
  exported: Level0HidzuRunEvidence
): void => {
  const exportRoot = resolve(generatedRoot, 'aligned-export');
  const artManifestPath = resolve(exportRoot, 'art-manifest.json');
  requireFile(artManifestPath, 'GET-205 aligned art manifest');
  const art = readJson<Level0HidzuArtManifest>(artManifestPath);
  const manifestErrors = validateLevel0ArtManifest(
    art,
    recipe,
    LEVEL0_LAYOUT_CONTRACT,
    treatment.output.pathPrefix
  );
  if (manifestErrors.length > 0) {
    throw new Error(`Invalid GET-205 aligned export:\n${manifestErrors.join('\n')}`);
  }
  if (
    art.id !== 'level0-tokyo-t5-hidzu-aligned-export-v1' ||
    art.treatmentId !== treatment.id ||
    art.baseRecipeId !== recipe.id ||
    art.recipeId !== recipe.id ||
    art.geometrySignature !== treatment.base.immutable.geometrySignature ||
    art.usage !== treatment.usage ||
    art.licenseBoundary !== 'ignored-local-evidence; no runtime promotion without entitlement'
  ) {
    throw new Error('GET-205 art manifest changes stable recipe identity or license boundaries.');
  }

  const allTiles = art.layers.flatMap((layer) => layer.tiles);
  let measuredTotalBytes = 0;
  allTiles.forEach((tile) => {
    const path = resolveWithin(exportRoot, tile.imagePath, 'GET-205 aligned tile path');
    requireFile(path, 'GET-205 aligned tile');
    const byteSize = statSync(path).size;
    if (
      byteSize !== tile.byteSize ||
      byteSize > art.budget.maxTileBytes ||
      sha256File(path) !== tile.sha256
    ) {
      throw new Error(`GET-205 aligned tile content drifted: ${path}`);
    }
    measuredTotalBytes += byteSize;
  });
  if (measuredTotalBytes !== art.budget.measuredTotalBytes) {
    throw new Error('GET-205 aligned byte total drifts from the art manifest.');
  }

  const anchorPath = resolveWithin(exportRoot, art.anchorMetadata.path, 'GET-205 anchor path');
  requireFile(anchorPath, 'GET-205 anchor metadata');
  if (sha256File(anchorPath) !== art.anchorMetadata.sha256) {
    throw new Error('GET-205 anchor metadata hash drifted.');
  }
  verifyAnchorPayload(anchorPath, art, recipe);

  const baseExportRoot = resolve(repositoryRoot, 'art/blender/get204/.generated/aligned-export');
  const baseArtPath = resolve(baseExportRoot, 'art-manifest.json');
  requireFile(baseArtPath, 'GET-204 aligned art manifest used by T5');
  const baseArt = readJson<Level0ArtManifest>(baseArtPath);
  if (
    sha256File(baseArtPath) !== treatment.base.alignedExport.manifestSha256 ||
    semanticMaskRegistrationDigest(baseArt) !==
      treatment.base.alignedExport.semanticMaskRegistrationDigest
  ) {
    throw new Error('GET-204 aligned export drifted from the pinned T5 prerequisite.');
  }
  const baseErrors = validateLevel0ArtManifest(baseArt, recipe, LEVEL0_LAYOUT_CONTRACT);
  if (baseErrors.length > 0) {
    throw new Error(`Invalid immutable GET-204 export used by T5:\n${baseErrors.join('\n')}`);
  }
  art.layers.filter((layer) => layer.kind === 'semantic-mask').forEach((layer) => {
    const baseLayer = baseArt.layers.find((candidate) => candidate.id === layer.id);
    if (
      !baseLayer ||
      baseLayer.kind !== 'semantic-mask' ||
      baseLayer.maskId !== layer.maskId ||
      baseLayer.fallbackLayerId !== layer.fallbackLayerId
    ) {
      throw new Error(`GET-205 semantic layer lacks an immutable T4 source: ${layer.id}`);
    }
    const baseById = new Map(baseLayer.tiles.map((tile) => [tile.id, tile]));
    layer.tiles.forEach((tile) => {
      const baseTile = baseById.get(tile.id);
      const expectedImagePath = baseTile?.imagePath.replace(
        /^environment\/level0\/t4\//,
        `${treatment.output.pathPrefix}/`
      );
      if (
        !baseTile ||
        baseTile.sha256 !== tile.sha256 ||
        baseTile.byteSize !== tile.byteSize ||
        baseTile.column !== tile.column ||
        baseTile.row !== tile.row ||
        baseTile.x !== tile.x ||
        baseTile.y !== tile.y ||
        baseTile.width !== tile.width ||
        baseTile.height !== tile.height ||
        expectedImagePath !== tile.imagePath
      ) {
        throw new Error(`GET-205 semantic tile is not the immutable T4 derivative: ${tile.id}`);
      }
      const basePath = resolveWithin(baseExportRoot, baseTile.imagePath, 'GET-204 semantic path');
      requireFile(basePath, 'immutable GET-204 semantic tile');
      if (sha256File(basePath) !== baseTile.sha256) {
        throw new Error(`Immutable GET-204 semantic tile content drifted: ${basePath}`);
      }
    });
  });

  const projection = art.projectionVerification;
  const requiredSampleIds = [
    'origin',
    'layout-x-unit',
    'layout-y-unit',
    'layout-bound-0',
    'layout-bound-1',
    'layout-bound-2',
    'layout-bound-3',
  ];
  const bounds = projection?.renderableScene?.pixelBounds;
  if (
    !projection ||
    projection.tolerancePixels <= 0 ||
    projection.tolerancePixels > 0.05 ||
    projection.maximumErrorPixels < 0 ||
    projection.maximumErrorPixels > projection.tolerancePixels ||
    !exactSet(projection.samples.map((sample) => sample.id), requiredSampleIds) ||
    projection.samples.some((sample) =>
      !Number.isFinite(sample.errorPixels) || sample.errorPixels > projection.tolerancePixels
    ) ||
    projection.renderableScene.sampledMeshObjects <= 0 ||
    !bounds ||
    bounds.minX < 0 ||
    bounds.minY < 0 ||
    bounds.maxX > art.canvas.width ||
    bounds.maxY > art.canvas.height
  ) {
    throw new Error('GET-205 projection verification is incomplete, clipped, or outside tolerance.');
  }

  const expectedFiles = [
    'art-manifest.json',
    art.anchorMetadata.path,
    ...allTiles.map((tile) => tile.imagePath),
  ].sort();
  const actualFiles = listFilesRecursively(exportRoot);
  if (!exactSet(actualFiles, expectedFiles)) {
    throw new Error('GET-205 aligned export contains missing or unregistered files.');
  }
  const evidenceExportPaths = exported.outputs
    .map((entry) => entry.path)
    .filter((path) => path.startsWith('aligned-export/'))
    .map((path) => path.slice('aligned-export/'.length));
  if (!exactSet(evidenceExportPaths, expectedFiles)) {
    throw new Error('GET-205 Blender evidence omits aligned export artifacts.');
  }
  const evidenceByPath = new Map(exported.outputs.map((entry) => [entry.path, entry]));
  expectedFiles.forEach((relativePath) => {
    const evidencePath = `aligned-export/${relativePath}`;
    const evidence = evidenceByPath.get(evidencePath);
    const artifactPath = resolveWithin(
      exportRoot,
      relativePath,
      'GET-205 aligned export evidence path'
    );
    if (
      !evidence ||
      evidence.byteSize !== statSync(artifactPath).size ||
      evidence.sha256 !== sha256File(artifactPath)
    ) {
      throw new Error(`GET-205 aligned export evidence drifted: ${relativePath}`);
    }
  });
};

const verifyCaptureMatrix = (
  generatedRoot: string,
  treatment: Level0HidzuTreatmentManifest,
  exported: Level0HidzuRunEvidence
): void => {
  if (
    !['captures', 'all'].includes(exported.generationMode) ||
    exported.requestedCaptureId !== null
  ) {
    throw new Error('GET-205 full capture verification requires an unfiltered capture/all run.');
  }
  const expectedById = new Map(treatment.captures.map((capture) => [capture.id, capture]));
  if (!exactSet(exported.generatedCaptures.map((capture) => capture.id), [...expectedById.keys()])) {
    throw new Error('GET-205 generated capture matrix is incomplete.');
  }
  const captureRoot = resolve(generatedRoot, 'captures');
  exported.generatedCaptures.forEach((capture) => {
    const expected = expectedById.get(capture.id);
    const path = resolveWithin(generatedRoot, capture.path, 'GET-205 capture path');
    requireFile(path, 'GET-205 capture');
    const dimensions = readPngSize(path);
    if (
      !expected ||
      capture.path !== `captures/${capture.id}.png` ||
      capture.width !== expected.width ||
      capture.height !== expected.height ||
      dimensions.width !== expected.width ||
      dimensions.height !== expected.height ||
      capture.schedule !== expected.schedule ||
      capture.evidence !== expected.evidence ||
      capture.byteSize !== statSync(path).size ||
      capture.sha256 !== sha256File(path)
    ) {
      throw new Error(`GET-205 capture evidence drifted: ${capture.id}`);
    }
  });
  const actualCaptures = listFilesRecursively(captureRoot);
  const expectedCaptures = treatment.captures.map((capture) => `${capture.id}.png`).sort();
  if (!exactSet(actualCaptures, expectedCaptures)) {
    throw new Error('GET-205 capture directory contains missing or unregistered images.');
  }
  const evidenceCapturePaths = exported.outputs
    .map((entry) => entry.path)
    .filter((path) => path.startsWith('captures/'));
  if (!exactSet(
    evidenceCapturePaths,
    treatment.captures.map((capture) => `captures/${capture.id}.png`)
  )) {
    throw new Error('GET-205 Blender evidence omits required capture artifacts.');
  }
};

requireFile(treatmentPath, 'GET-205 treatment manifest');
const treatment = readJson<Level0HidzuTreatmentManifest>(treatmentPath);
const sourceManifestPath = resolveRepositoryPath(treatment.base.sourceManifest.path);
const sceneRecipePath = resolveRepositoryPath(treatment.base.sceneRecipe.path);
const layoutContractPath = resolveRepositoryPath(treatment.base.layoutContract.path);
const masterScenePath = resolveRepositoryPath(treatment.base.masterScene.path);
const masterSceneMetadataPath = resolveRepositoryPath(treatment.base.masterScene.metadataPath);
const baseArtManifestPath = resolveRepositoryPath(treatment.base.alignedExport.manifestPath);
const referencePath = resolveRepositoryPath(treatment.reference.path);
const referenceSourcePath = resolveRepositoryPath(treatment.reference.sourcePath);
const visualGrammarPath = resolveRepositoryPath(treatment.grammar.path);

[sourceManifestPath, sceneRecipePath, layoutContractPath, visualGrammarPath].forEach((path) =>
  requireFile(path, 'tracked GET-205 input')
);

const source = readJson<Level0SourceManifest>(sourceManifestPath);
const recipe = readJson<Level0SceneRecipe>(sceneRecipePath);
const layoutExport = readJson<{ contract: unknown }>(layoutContractPath);
const grammar = readJson<Level0HidzuVisualGrammar>(visualGrammarPath);

const layoutErrors = validateLevel0LayoutContract(LEVEL0_LAYOUT_CONTRACT);
if (layoutErrors.length > 0) {
  throw new Error(`Invalid runtime Level 0 layout:\n${layoutErrors.join('\n')}`);
}
const sourceRecipeErrors = validateLevel0SourceAndRecipe(source, recipe, LEVEL0_LAYOUT_CONTRACT);
if (sourceRecipeErrors.length > 0) {
  throw new Error(`Invalid GET-204 source/recipe prerequisite:\n${sourceRecipeErrors.join('\n')}`);
}
if (sha256CanonicalJson(layoutExport.contract) !== sha256CanonicalJson(LEVEL0_LAYOUT_CONTRACT)) {
  throw new Error('Tracked Level 0 layout export drifts from the runtime contract.');
}

let evidence: Level0HidzuTreatmentEvidence = {
  sourceManifestSha256: sha256File(sourceManifestPath),
  sceneRecipeSha256: sha256File(sceneRecipePath),
  layoutContractSha256: sha256File(layoutContractPath),
  masterSceneSha256: treatment.base.masterScene.sha256,
  masterSceneMetadataSha256: treatment.base.masterScene.metadataSha256,
  baseArtManifestSha256: treatment.base.alignedExport.manifestSha256,
  semanticMaskRegistrationDigest: treatment.base.alignedExport.semanticMaskRegistrationDigest,
  referenceSha256: treatment.reference.sha256,
  visualGrammarSha256: sha256File(visualGrammarPath),
  geometrySignature: treatment.base.immutable.geometrySignature,
  buildingTransformDigest: treatment.base.immutable.buildingTransformDigest,
  propTransformDigest: treatment.base.immutable.propTransformDigest,
  cameraDigest: treatment.base.immutable.cameraDigest,
  canvasDigest: treatment.base.immutable.canvasDigest,
  anchorDigest: treatment.base.immutable.anchorDigest,
  semanticMaskDigest: treatment.base.immutable.semanticMaskDigest,
  exactEntitlementEvidence: source.ownership.exactEntitlementEvidence,
};

let metadata: Get204MasterSceneMetadata | undefined;
if (verifyLocal || verifyExport || verifyCaptures) {
  [
    masterScenePath,
    masterSceneMetadataPath,
    baseArtManifestPath,
    referencePath,
    referenceSourcePath,
  ].forEach((path) =>
    requireFile(path, 'ignored local GET-205 prerequisite')
  );
  metadata = readJson<Get204MasterSceneMetadata>(masterSceneMetadataPath);
  evidence = createLevel0HidzuTreatmentEvidence(
    {
      sourceManifest: sourceManifestPath,
      sceneRecipe: sceneRecipePath,
      layoutContract: layoutContractPath,
      masterScene: masterScenePath,
      masterSceneMetadata: masterSceneMetadataPath,
      baseArtManifest: baseArtManifestPath,
      reference: referencePath,
      visualGrammar: visualGrammarPath,
    },
    recipe,
    LEVEL0_LAYOUT_CONTRACT,
    metadata
  );
  if (sha256File(referenceSourcePath) !== treatment.reference.sourceSha256) {
    throw new Error('GET-205 reference source image drifted from its recorded hash.');
  }
  const baseArt = readJson<Level0ArtManifest>(baseArtManifestPath);
  if (
    sha256File(baseArtManifestPath) !== treatment.base.alignedExport.manifestSha256 ||
    semanticMaskRegistrationDigest(baseArt) !==
      treatment.base.alignedExport.semanticMaskRegistrationDigest
  ) {
    throw new Error('GET-204 aligned art manifest or semantic-mask registration drifted.');
  }
  if (
    metadata.schemaVersion !== 1 ||
    metadata.ticket !== 'GET-204' ||
    metadata.recipe.id !== recipe.id ||
    metadata.recipe.layoutContractId !== LEVEL0_LAYOUT_CONTRACT.id ||
    metadata.recipe.layoutContractSha256 !== treatment.base.layoutContract.sha256 ||
    metadata.layout.anchorCount !== LEVEL0_LAYOUT_CONTRACT.anchors.length ||
    metadata.layout.footprintCount !== LEVEL0_LAYOUT_CONTRACT.buildingFootprints.length ||
    metadata.layout.surfaceCount !== LEVEL0_LAYOUT_CONTRACT.surfaces.length
  ) {
    throw new Error('GET-204 master metadata drifts from the immutable T5 base.');
  }
}

const bundle: Level0HidzuTreatmentBundle = { treatment, grammar, evidence };
const errors = validateLevel0HidzuTreatmentBundle(bundle, recipe, LEVEL0_LAYOUT_CONTRACT);
if (errors.length > 0) {
  throw new Error(`Invalid GET-205 Hidzu treatment:\n${errors.join('\n')}`);
}

if (verifyExport || verifyCaptures) {
  const exportEvidencePath = resolve(generatedRoot, 'treatment-evidence.json');
  requireFile(exportEvidencePath, 'GET-205 Blender treatment evidence');
  const exported = readJson<Level0HidzuRunEvidence>(exportEvidencePath);
  validateRunEvidence(exported, treatment, grammar, evidence, recipe, metadata!, generatedRoot);
  if (verifyExport) {
    if (!['exports', 'all'].includes(exported.generationMode)) {
      throw new Error('GET-205 export verification requires an exports/all Blender run.');
    }
    verifyAlignedExport(generatedRoot, treatment, recipe, exported);
  }
  if (verifyCaptures) {
    verifyCaptureMatrix(generatedRoot, treatment, exported);
  }
}

const mode = verifyExport && verifyCaptures
  ? 'export+capture'
  : verifyExport
    ? 'export'
    : verifyCaptures
      ? 'capture'
      : verifyLocal
        ? 'local'
        : 'plan';
console.log(
  `GET-205 ${mode} validation passed: ${treatment.materialOverrides.length} material overrides, ` +
  `${treatment.additions.length} semantic additions, ${treatment.practicalLights.length} practical lights, ` +
  `${treatment.captures.length} required captures, usage=${treatment.usage}.`
);
