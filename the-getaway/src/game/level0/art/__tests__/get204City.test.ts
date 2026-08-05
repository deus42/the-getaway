import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as artValidator from '../validator';
import { validateLevel0LayoutContract } from '../../layout/validator';
import type { Level0LayoutContract } from '../../layout/types';
import type { Get204FullDistrictRecipe } from '../types';

const repositoryRoot = resolve(__dirname, '../../../../../..');
const candidateManifestPath = resolve(
  repositoryRoot,
  'art/blender/get204/manifests/full-district-rebuild.json'
);
const runtimeContractPath = resolve(__dirname, '../get204City.ts');
const blenderBuilderPath = resolve(
  repositoryRoot,
  'art/blender/get204/scripts/build_full_district_rebuild.py'
);
const packageJsonPath = resolve(repositoryRoot, 'the-getaway/package.json');

type CandidateManifest = Get204FullDistrictRecipe;

const readCandidate = (): CandidateManifest | null => existsSync(candidateManifestPath)
  ? JSON.parse(readFileSync(candidateManifestPath, 'utf8')) as CandidateManifest
  : null;

const validateCandidate = (candidate: CandidateManifest): string[] => {
  const maybeValidator = Reflect.get(artValidator, 'validateGet204FullDistrictRecipe');
  return typeof maybeValidator === 'function'
    ? maybeValidator(candidate) as string[]
    : ['validateGet204FullDistrictRecipe is not implemented'];
};

const loadCityRuntime = (): Record<string, unknown> =>
  jest.requireActual<Record<string, unknown>>('../get204City');

describe('GET-204 full-district visual candidate', () => {
  it('owns one canonical full-district rebuild manifest', () => {
    expect(existsSync(candidateManifestPath)).toBe(true);
  });

  it('owns one typed authoring contract for later same-master promotion', () => {
    expect(existsSync(runtimeContractPath)).toBe(true);
  });

  it('owns explicit full-district Blender preview and export commands', () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(existsSync(blenderBuilderPath)).toBe(true);
    expect(packageJson.scripts['art:level0:t4:full:massing']).toBe(
      'node scripts/run-get204-blender.mjs --full-district --mode massing'
    );
    expect(packageJson.scripts['art:level0:t4:full:preview']).toBe(
      'node scripts/run-get204-blender.mjs --full-district --mode preview'
    );
    expect(packageJson.scripts['art:level0:t4:full:export']).toBe(
      'node scripts/run-get204-blender.mjs --full-district --mode exports'
    );
  });

  it('keeps the validated authoring candidate dormant until live promotion', () => {
    const runtimeModule = loadCityRuntime();
    const recipe = Reflect.get(runtimeModule, 'GET204_CITY_RECIPE') as CandidateManifest | undefined;
    const runtime = Reflect.get(runtimeModule, 'GET204_CITY_RUNTIME') as {
      id?: string;
      runtimeEnabled?: boolean;
      defaultZoom?: number;
      manualOverviewZoom?: number;
      actorScreenHeightTargetPx?: { min: number; max: number };
      groundTiles?: unknown[];
      clusters?: unknown[];
    } | undefined;

    expect(recipe?.id).toBe('get204-full-district-rebuild-v1');
    expect(validateCandidate(recipe as CandidateManifest)).toEqual([]);
    expect(runtime).toMatchObject({
      id: 'get204-full-district-live-candidate-v1',
      runtimeEnabled: false,
      defaultZoom: 1.62,
      manualOverviewZoom: 0.46,
      actorScreenHeightTargetPx: { min: 95, max: 115 },
    });
    expect(runtime?.groundTiles).toHaveLength(6);
    expect(runtime?.clusters).toHaveLength(20);
  });

  it('derives a coherent candidate layout with reachable mission anchors', () => {
    const runtimeModule = loadCityRuntime();
    const layout = Reflect.get(runtimeModule, 'GET204_CITY_LAYOUT') as Level0LayoutContract | undefined;

    expect(layout).toBeDefined();
    if (!layout) return;
    expect(layout.id).toBe('level0-get204-full-district-candidate-v1');
    expect(validateLevel0LayoutContract(layout)).toEqual([]);
    expect(layout.buildingFootprints).toHaveLength(20);
    expect(layout.traversalLoops).toHaveLength(3);
  });

  it('registers cluster placement, depth, and local foreground fading without query enablement', () => {
    const runtimeModule = loadCityRuntime();
    const resolveTopLeft = Reflect.get(runtimeModule, 'resolveGet204CityRegisteredTopLeft');
    const resolveDepth = Reflect.get(runtimeModule, 'resolveGet204CityClusterDepth');
    const resolveAlpha = Reflect.get(runtimeModule, 'resolveGet204CityClusterAlpha');

    expect(typeof resolveTopLeft).toBe('function');
    expect(typeof resolveDepth).toBe('function');
    expect(typeof resolveAlpha).toBe('function');
    if (
      typeof resolveTopLeft !== 'function' ||
      typeof resolveDepth !== 'function' ||
      typeof resolveAlpha !== 'function'
    ) return;

    expect(resolveTopLeft({ x: 1200, y: 400 }, { x: 1250, y: 1760 })).toEqual({
      x: -622,
      y: 1600,
    });
    expect(resolveDepth({ x: 9, y: 62 })).toBeGreaterThan(resolveDepth({ x: 9, y: 18 }));
    expect(resolveAlpha('cluster.safehouse.home', { x: 9, y: 47 })).toBe(0.22);
    expect(resolveAlpha('cluster.safehouse.home', { x: 21, y: 47 })).toBe(1);
  });

  it('locks all three approved references to separate responsibilities', () => {
    const candidate = readCandidate();
    expect(candidate).not.toBeNull();
    if (!candidate) return;

    expect(candidate.references).toEqual([
      {
        role: 'quality-look-target',
        path: 'art/references/get204/canvas-quality-target.png',
        sha256: 'ff53c06f9b03966c2468b9bf22e13449421b16f20101573929fcbbcc20083e6d',
        authority: 'Material depth, facade richness, wet-road response, motivated practical light, reflections, atmosphere, and final finish.',
      },
      {
        role: 'close-play-target',
        path: 'art/references/get204/street-play-target.png',
        sha256: '66cc72f0ec09b928cf2d95f0fe3db61881776ba87f48c99c83852cf47583c9a9',
        authority: 'Normal-play camera proximity, readable protagonist scale, street-wall framing, public life, and surveillance embedded in ordinary space.',
      },
      {
        role: 'overview-density-target',
        path: 'art/references/get204/dense-city-target.png',
        sha256: '3cca77d4f57d7960b6b58869f8b3a4ddeb5589f2c46dbf7015e1e4c4d9860cd0',
        authority: 'Compact full-district massing, coherent skyline, distinct subdistricts, complete edges, and corruption-free overview.',
      },
    ]);
  });

  it('defines one complete district with three named subdistricts and loops', () => {
    const candidate = readCandidate();
    expect(candidate).not.toBeNull();
    if (!candidate) return;

    expect(candidate.schemaVersion).toBe(2);
    expect(candidate.ticket).toBe('GET-204');
    expect(candidate.acceptanceState).toBe('FULL_DISTRICT_LIVE_CANDIDATE');
    expect(candidate.composition.subdistricts.map(({ id }) => id)).toEqual([
      'safehouse-backstreets',
      'public-transit-commercial',
      'logistics-civic-control',
    ]);
    expect(candidate.composition.traversalLoops).toHaveLength(3);
  });

  it('uses the complete local texture set before the damaged legacy FBX texture folder', () => {
    const candidate = readCandidate();
    expect(candidate).not.toBeNull();
    if (!candidate) return;

    expect(candidate.source.textureSearchRoots).toEqual([
      'Textures',
      'jpeg images',
      'c4d/tex',
    ]);
  });

  it('requires eight compact perimeter blocks, disciplined landmarks, and no slab infill', () => {
    const candidate = readCandidate();
    expect(candidate).not.toBeNull();
    if (!candidate) return;

    expect(candidate.composition.urbanBlocks).toHaveLength(8);
    expect(candidate.architecturalClusters).toHaveLength(20);
    expect(
      candidate.architecturalClusters.every(
        (cluster) => (cluster as unknown as Record<string, unknown>).role !== 'isolated-lot'
      )
    ).toBe(true);
    expect(candidate.composition.density).toEqual({
      minimumVisibleBuildingInstances: 20,
      maximumVisibleBuildingInstances: 20,
      blockClusterPolicy: 'compact-perimeter-blocks-with-curated-kit-reuse',
      croppedKitHeroFrontageCount: 4,
      minimumBuiltFootprintRatio: 0.42,
      minimumDistinctSourceRoots: 14,
      maximumSourceReuse: 2,
      maximumTallLandmarks: 3,
    });
    const sourceRoots = candidate.architecturalClusters.map(({ sourceCollection }) => sourceCollection);
    expect(new Set(sourceRoots).size).toBeGreaterThanOrEqual(14);
    expect(Math.max(...[...new Set(sourceRoots)].map((source) => (
      sourceRoots.filter((candidateSource) => candidateSource === source).length
    )))).toBeLessThanOrEqual(2);
    expect(candidate.architecturalClusters.filter(({ role }) => role === 'district-landmark')).toHaveLength(2);
    const blockIds = new Set(candidate.composition.urbanBlocks.map(({ id }) => id));
    const heroFrontages = candidate.architecturalClusters.filter(
      ({ artSource }) => artSource === 'owned-kit-cropped'
    );
    expect(heroFrontages.map(({ id }) => id)).toEqual([
      'cluster.public.transit-shops',
      'cluster.public.transit-landmark',
      'cluster.public.south-arcade',
      'cluster.public.south-corner',
    ]);
    expect(heroFrontages.map(({ sourcePrefix }) => sourcePrefix)).toEqual([
      'SmallH',
      'SmallC',
      'SmallE',
      'SmallB',
    ]);
    expect(heroFrontages.every(({ verticalCropMeters }) => (
      verticalCropMeters !== undefined &&
      verticalCropMeters >= 10 &&
      verticalCropMeters <= 16
    ))).toBe(true);
    candidate.architecturalClusters.forEach((cluster) => {
      expect(blockIds.has(cluster.blockId)).toBe(true);
      if (cluster.artSource === 'owned-kit' || cluster.artSource === 'owned-kit-cropped') {
        expect(cluster.sourceCollection).toMatch(/^KB3D\.(?:Small|Medium|Large)[A-J]$/);
      } else {
        throw new Error(`unexpected GET-204 architecture source ${cluster.artSource}`);
      }
      expect(cluster.cropRectangle.width).toBeGreaterThan(0);
      expect(cluster.cropRectangle.height).toBeGreaterThan(0);
      expect(Number.isFinite(cluster.sceneTopLeft.x)).toBe(true);
      expect(Number.isFinite(cluster.sceneTopLeft.y)).toBe(true);
      expect(Number.isFinite(cluster.depthAnchor.x)).toBe(true);
      expect(Number.isFinite(cluster.depthAnchor.y)).toBe(true);
      expect(cluster.footprint.length).toBeGreaterThanOrEqual(4);
      expect(cluster.localOcclusionPolygon.length).toBeGreaterThanOrEqual(4);
      expect(cluster.runtimePath).toMatch(/^environment\/level0\/get204-city\/cluster-[a-z0-9-]+\.webp$/);
    });
    candidate.composition.urbanBlocks.forEach((block) => {
      expect(block.polygon.length).toBeGreaterThanOrEqual(4);
      expect(block.clusterIds.length).toBeGreaterThanOrEqual(1);
      expect(block.streetEdgeIds.length).toBeGreaterThanOrEqual(1);
      expect(new Set(block.clusterIds)).toEqual(new Set(
        candidate.architecturalClusters
          .filter(({ blockId }) => blockId === block.id)
          .map(({ id }) => id)
      ));
    });
  });

  it('owns a full street hierarchy and only gameplay-owned open space', () => {
    const candidate = readCandidate();
    expect(candidate).not.toBeNull();
    if (!candidate) return;

    expect(candidate.streetHierarchy.controlledBoulevards.length).toBe(1);
    expect(candidate.streetHierarchy.ordinaryStreets.length).toBeGreaterThanOrEqual(4);
    expect(candidate.streetHierarchy.serviceAlleys.length).toBeGreaterThanOrEqual(3);
    expect(Math.max(...candidate.streetHierarchy.controlledBoulevards.map(({ widthLayoutUnits }) => widthLayoutUnits))).toBeLessThanOrEqual(4.5);
    expect(Math.max(...candidate.streetHierarchy.ordinaryStreets.map(({ widthLayoutUnits }) => widthLayoutUnits))).toBeLessThanOrEqual(4);
    expect(Math.max(...candidate.streetHierarchy.serviceAlleys.map(({ widthLayoutUnits }) => widthLayoutUnits))).toBeLessThanOrEqual(2.25);
    expect(candidate.streetHierarchy.publicRealmKinds).toEqual(expect.arrayContaining([
      'road',
      'sidewalk',
      'curb',
      'crossing',
      'alley',
      'drainage',
      'entrance-threshold',
    ]));
    candidate.composition.openSpaces.forEach((space) => {
      expect(space.gameplayOwner).not.toBe('decorative');
      expect(space.areaLayoutUnits).toBeLessThanOrEqual(72);
    });
  });

  it('locks the approved close camera and separately declares overview framing', () => {
    const candidate = readCandidate();
    expect(candidate).not.toBeNull();
    if (!candidate) return;

    expect(candidate.camera.runtimeDefaultZoom).toBeGreaterThanOrEqual(1.58);
    expect(candidate.camera.runtimeDefaultZoom).toBeLessThanOrEqual(1.66);
    expect(candidate.camera.runtimeMaximumZoom).toBeGreaterThanOrEqual(candidate.camera.runtimeDefaultZoom);
    expect(candidate.camera.manualOverviewZoom).toBeLessThan(candidate.camera.runtimeDefaultZoom);
    expect(candidate.camera.manualOverviewZoom).toBeGreaterThanOrEqual(0.44);
    expect(candidate.camera.actorScreenHeightTargetPx).toEqual({
      viewport: '1440x900',
      min: 95,
      max: 115,
    });
    expect(candidate.camera.proofStarts['safehouse-backstreets']).toEqual({ x: 17, y: 42.6 });
    expect(Object.keys(candidate.camera.proofOccluderClusterIds).sort()).toEqual([
      'logistics-civic-control',
      'public-transit-commercial',
      'safehouse-backstreets',
    ]);
    expect(Object.values(candidate.camera.proofOccluderClusterIds).every((ids) => ids.length > 0)).toBe(true);
  });

  it('uses source-backed public-realm detail rather than empty procedural streets', () => {
    const candidate = readCandidate();
    expect(candidate).not.toBeNull();
    if (!candidate) return;

    expect(candidate.sourcePropPlacements.length).toBeGreaterThanOrEqual(24);
    expect(new Set(candidate.sourcePropPlacements.map(({ id }) => id)).size).toBe(
      candidate.sourcePropPlacements.length
    );
    candidate.sourcePropPlacements.forEach((placement) => {
      expect(placement.sourcePrefix).toMatch(/^(?:Awning_[AB]|Barriers|Bollard|Door_[A-D]|ElectricBox_[A-C]|Intercom|Lamp_[AB]|PowerGenerator_[AB]|RubbishBin|RumbleStrip|UndergroundEntrance|Vending_[A-D])$/);
      expect(placement.uniformScale).toBeGreaterThan(0);
      expect(placement.layer).toBe('details');
    });
  });

  it('prohibits the rejected proof path, greybox fallback, and unsafe exports', () => {
    const candidate = readCandidate();
    expect(candidate).not.toBeNull();
    if (!candidate) return;

    expect(candidate.export.strategy).toBe('tiled-ground-plus-cropped-registered-master-scene-clusters');
    expect(candidate.export.allowFullCanvasTransparentForegroundLayers).toBe(false);
    expect(candidate.runtime.enablement).toBe('normal-level0-path');
    expect(candidate.runtime.fallbackPolicy).toBe('fail-visible-on-required-candidate-asset');
    expect(candidate.runtime.prohibitedQueryValues).toContain('visualGate=get204-1');
    expect(candidate.runtime.prohibitedFallbackProfiles).toContain('level0-greybox');
    expect(candidate.commitBoundary.prohibited).toEqual(expect.arrayContaining([
      'raw-vendor-geometry',
      'source-textures',
      'generated-blend',
      'full-canvas-transparent-foreground-layer',
      'unregistered-cluster-asset',
    ]));
  });

  it('passes the schema-v2 full-district validator', () => {
    const candidate = readCandidate();
    expect(candidate).not.toBeNull();
    if (!candidate) return;

    expect(validateCandidate(candidate)).toEqual([]);
  });

  it('rejects sparse massing and incomplete registered clusters', () => {
    const candidate = readCandidate();
    expect(candidate).not.toBeNull();
    if (!candidate) return;

    const sparse = JSON.parse(JSON.stringify(candidate)) as CandidateManifest;
    sparse.architecturalClusters = sparse.architecturalClusters.slice(0, 17);
    expect(validateCandidate(sparse)).toEqual(expect.arrayContaining([
      'full-district candidate requires exactly twenty registered architectural clusters',
      'blocked cluster ids must exactly match registered architecture',
    ]));
  });

  it('rejects camera drift and any return to the special proof route', () => {
    const candidate = readCandidate();
    expect(candidate).not.toBeNull();
    if (!candidate) return;

    const drifted = JSON.parse(JSON.stringify(candidate)) as CandidateManifest;
    drifted.camera.runtimeDefaultZoom = 1.1;
    Reflect.set(drifted.runtime, 'enablement', 'query-only');
    expect(validateCandidate(drifted)).toEqual(expect.arrayContaining([
      'default camera zoom must remain within the approved 1.58-1.66 protagonist-led range',
      'full-district art must run on the normal Level 0 path',
    ]));
  });

  it('rejects decorative voids, full-canvas foregrounds, and unregistered output paths', () => {
    const candidate = readCandidate();
    expect(candidate).not.toBeNull();
    if (!candidate) return;

    const unsafe = JSON.parse(JSON.stringify(candidate)) as CandidateManifest;
    unsafe.composition.openSpaces[0] = {
      ...unsafe.composition.openSpaces[0],
      gameplayOwner: 'decorative',
      areaLayoutUnits: 120,
    };
    Reflect.set(unsafe.export, 'allowFullCanvasTransparentForegroundLayers', true);
    unsafe.architecturalClusters[0].runtimePath = '/tmp/unregistered.png';
    expect(validateCandidate(unsafe)).toEqual(expect.arrayContaining([
      'open space space.safehouse-threshold is decorative or oversized',
      'full-canvas transparent foreground layers are prohibited',
      'cluster cluster.safehouse.home runtime path is not registered to get204-city',
    ]));
  });
});
