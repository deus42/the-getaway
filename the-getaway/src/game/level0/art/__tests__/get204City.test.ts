import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LEVEL0_LAYOUT_CONTRACT } from '../../../../content/levels/level0/layoutContract';
import * as artValidator from '../validator';
import { validateLevel0LayoutContract } from '../../layout/validator';
import type { Level0LayoutContract } from '../../layout/types';
import type { Get204FullDistrictRecipe } from '../types';

const repositoryRoot = resolve(__dirname, '../../../../../..');
const candidateManifestPath = resolve(
  repositoryRoot,
  'art/blender/get204/manifests/mission-district-rebuild.json'
);
const rejectedManifestPath = resolve(
  repositoryRoot,
  'art/blender/get204/manifests/full-district-rebuild.json'
);
const runtimeContractPath = resolve(__dirname, '../get204City.ts');
const blenderBuilderPath = resolve(
  repositoryRoot,
  'art/blender/get204/scripts/build_full_district_rebuild.py'
);
const packageJsonPath = resolve(repositoryRoot, 'the-getaway/package.json');

type CandidateManifest = Get204FullDistrictRecipe & {
  populationStaging: Get204FullDistrictRecipe['populationStaging'] & {
    bakedEnvironmentActorCount: number;
    runtimeActorPolicy: string;
    proofScaleFigures: number;
  };
};

const readJson = <T,>(path: string): T | null => existsSync(path)
  ? JSON.parse(readFileSync(path, 'utf8')) as T
  : null;

const readCandidate = (): CandidateManifest | null =>
  readJson<CandidateManifest>(candidateManifestPath);

const validateCandidate = (candidate: Get204FullDistrictRecipe): string[] => {
  const validator = Reflect.get(artValidator, 'validateGet204MissionDistrictRecipe');
  return typeof validator === 'function'
    ? validator(candidate) as string[]
    : ['validateGet204MissionDistrictRecipe is not implemented'];
};

const loadCityRuntime = (): Record<string, unknown> =>
  jest.requireActual<Record<string, unknown>>('../get204City');

const polygonBounds = (polygon: Array<{ x: number; y: number }>) => ({
  left: Math.min(...polygon.map(({ x }) => x)),
  right: Math.max(...polygon.map(({ x }) => x)),
  top: Math.min(...polygon.map(({ y }) => y)),
  bottom: Math.max(...polygon.map(({ y }) => y)),
});

describe('GET-204 four-block named-KitBash source candidate', () => {
  it('owns one canonical mission-district manifest and source builder', () => {
    expect(existsSync(candidateManifestPath)).toBe(true);
    expect(existsSync(runtimeContractPath)).toBe(true);
    expect(existsSync(blenderBuilderPath)).toBe(true);
  });

  it('owns explicit mission-district Blender proof commands', () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(packageJson.scripts['art:level0:t4:mission:massing']).toBe(
      'node scripts/run-get204-blender.mjs --mission-district --mode massing'
    );
    expect(packageJson.scripts['art:level0:t4:mission:preview']).toBe(
      'node scripts/run-get204-blender.mjs --mission-district --mode preview'
    );
    expect(packageJson.scripts['art:level0:t4:mission:export']).toBe(
      'node scripts/run-get204-blender.mjs --mission-district --mode exports'
    );
  });

  it('locks the approved composition previsualization without treating it as geometry', () => {
    const candidate = readCandidate();
    expect(candidate).not.toBeNull();
    if (!candidate) return;

    expect(candidate.references).toEqual([
      {
        role: 'approved-composition-previsualization',
        path: 'art/references/get205/kitbash-reference2-blend-concept-v1.png',
        sha256: 'b8e69fcbb4839cf2fb70fa80e03c42ff321e6a5ee00c2287f1f824f08e951c5d',
        authority: expect.stringContaining('composition'),
      },
      {
        role: 'close-play-target',
        path: 'art/references/get204/street-play-target.png',
        sha256: '66cc72f0ec09b928cf2d95f0fe3db61881776ba87f48c99c83852cf47583c9a9',
        authority: expect.stringContaining('camera'),
      },
      {
        role: 'quality-look-target',
        path: 'art/references/get204/canvas-quality-target.png',
        sha256: 'ff53c06f9b03966c2468b9bf22e13449421b16f20101573929fcbbcc20083e6d',
        authority: expect.stringContaining('Material'),
      },
      {
        role: 'overview-density-target',
        path: 'art/references/get204/dense-city-target.png',
        sha256: '3cca77d4f57d7960b6b58869f8b3a4ddeb5589f2c46dbf7015e1e4c4d9860cd0',
        authority: expect.stringContaining('overview'),
      },
    ]);
  });

  it('defines exactly four mission blocks across three functional identities', () => {
    const candidate = readCandidate();
    expect(candidate).not.toBeNull();
    if (!candidate) return;

    expect(candidate.schemaVersion).toBe(3);
    expect(candidate.id).toBe('get204-four-block-kitbash-mission-v1');
    expect(candidate.acceptanceState).toBe('FOUR_BLOCK_BLENDER_SOURCE_CANDIDATE');
    expect(candidate.composition.subdistricts.map(({ id }) => id)).toEqual([
      'safehouse-backstreets',
      'public-transit-commercial',
      'logistics-civic-control',
    ]);
    expect(candidate.composition.urbanBlocks).toHaveLength(4);
    expect(candidate.composition.urbanBlocks.map(({ id }) => id)).toEqual([
      'block.safehouse-backstreet',
      'block.public-transit-contact',
      'block.controlled-logistics',
      'block.service-seam',
    ]);
    expect(candidate.composition.traversalLoops).toHaveLength(3);
  });

  it('keeps the city mission-sized and excludes monumental street structure', () => {
    const candidate = readCandidate();
    expect(candidate).not.toBeNull();
    if (!candidate) return;

    const bounds = polygonBounds(candidate.coordinateSystem.bounds);
    expect(bounds.right - bounds.left).toBeLessThanOrEqual(60);
    expect(bounds.bottom - bounds.top).toBeLessThanOrEqual(46);
    expect(candidate.streetHierarchy.controlledBoulevards).toHaveLength(0);
    expect(candidate.streetHierarchy.ordinaryStreets.length).toBeGreaterThanOrEqual(2);
    expect(candidate.streetHierarchy.serviceAlleys.length).toBeGreaterThanOrEqual(2);
    expect(candidate.composition.openSpaces.every(({ gameplayOwner, areaLayoutUnits }) => (
      gameplayOwner !== 'decorative' && areaLayoutUnits <= 36
    ))).toBe(true);
  });

  it('uses only named, uncropped Neo Tokyo 2 building roots', () => {
    const candidate = readCandidate();
    expect(candidate).not.toBeNull();
    if (!candidate) return;

    expect(candidate.architecturalClusters.length).toBeGreaterThanOrEqual(12);
    expect(candidate.architecturalClusters.length).toBeLessThanOrEqual(16);
    expect(candidate.composition.density).toEqual({
      minimumVisibleBuildingInstances: 12,
      maximumVisibleBuildingInstances: 16,
      blockClusterPolicy: 'four-mission-blocks-with-named-kit-provenance',
      croppedKitHeroFrontageCount: 0,
      minimumBuiltFootprintRatio: 0.46,
      minimumDistinctSourceRoots: 10,
      maximumSourceReuse: 2,
      maximumTallLandmarks: 1,
    });

    const sourceRoots = candidate.architecturalClusters.map(({ sourcePrefix }) => sourcePrefix);
    expect(new Set(sourceRoots).size).toBeGreaterThanOrEqual(10);
    candidate.architecturalClusters.forEach((cluster) => {
      expect(cluster.artSource).toBe('owned-kit');
      expect(cluster.sourcePrefix).toMatch(/^(?:Small|Medium)[A-J]$/);
      expect(cluster.sourceCollection).toBe(`KB3D.${cluster.sourcePrefix}`);
      expect(cluster.verticalCropMeters).toBeUndefined();
      expect(cluster.role).not.toBe('isolated-lot');
      expect(cluster.footprint.length).toBeGreaterThanOrEqual(4);
      expect(cluster.localOcclusionPolygon.length).toBeGreaterThanOrEqual(4);
      expect(cluster.runtimePath).toMatch(
        /^environment\/level0\/get204-city\/cluster-[a-z0-9-]+\.webp$/
      );
    });
    expect(candidate.architecturalClusters.filter(
      ({ role }) => role === 'district-landmark'
    )).toHaveLength(1);

    const allowedStreetAnchors = new Set([
      'north-west', 'north-east', 'south-west', 'south-east',
    ]);
    candidate.architecturalClusters.forEach((cluster) => {
      expect(allowedStreetAnchors.has(
        String(Reflect.get(cluster, 'placementAnchor'))
      )).toBe(true);
      expect(Number(Reflect.get(cluster, 'streetWallInsetMeters'))).toBeGreaterThanOrEqual(0.35);
      expect(Number(Reflect.get(cluster, 'streetWallInsetMeters'))).toBeLessThanOrEqual(1.25);
    });
  });

  it('centres close play on the public-contact seam and keeps streets human-scaled', () => {
    const candidate = readCandidate();
    expect(candidate).not.toBeNull();
    if (!candidate) return;

    const publicProof = candidate.camera.proofStarts['public-transit-commercial'];
    expect(publicProof.x).toBeGreaterThanOrEqual(24);
    expect(publicProof.x).toBeLessThanOrEqual(28);
    expect(publicProof.y).toBeGreaterThanOrEqual(20);
    expect(publicProof.y).toBeLessThanOrEqual(24);
    expect(candidate.streetHierarchy.ordinaryStreets.every(
      ({ widthLayoutUnits }) => widthLayoutUnits <= 3
    )).toBe(true);
  });

  it('keeps all people separate from the environment art', () => {
    const candidate = readCandidate();
    expect(candidate).not.toBeNull();
    if (!candidate) return;

    expect(candidate.populationStaging).toMatchObject({
      bakedEnvironmentActorCount: 0,
      runtimeActorPolicy: 'separate-runtime-actors',
      proofScaleFigures: 4,
      unarmedVerifierDrones: 1,
    });
  });

  it('locks the close actor relationship and same-master overview', () => {
    const candidate = readCandidate();
    expect(candidate).not.toBeNull();
    if (!candidate) return;

    expect(candidate.camera.runtimeDefaultZoom).toBeGreaterThan(candidate.camera.manualOverviewZoom);
    expect(candidate.camera.runtimeMaximumZoom).toBeGreaterThanOrEqual(
      candidate.camera.runtimeDefaultZoom
    );
    expect(candidate.camera.actorScreenHeightTargetPx).toEqual({
      viewport: '1440x900',
      min: 95,
      max: 115,
    });
    expect(Object.keys(candidate.camera.proofStarts).sort()).toEqual([
      'logistics-civic-control',
      'public-transit-commercial',
      'safehouse-backstreets',
    ]);
  });

  it('promotes the approved source candidate onto the normal Level 0 path', () => {
    const runtimeModule = loadCityRuntime();
    const recipe = Reflect.get(runtimeModule, 'GET204_CITY_RECIPE') as CandidateManifest | undefined;
    const runtime = Reflect.get(runtimeModule, 'GET204_CITY_RUNTIME') as {
      id?: string;
      runtimeEnabled?: boolean;
      defaultZoom?: number;
      actorScreenHeightTargetPx?: { min: number; max: number };
      clusters?: unknown[];
      layers?: Array<{ view: string; path: string; peopleBakedIntoPlate: boolean }>;
      population?: Array<{ kind: string; path?: string }>;
    } | undefined;

    expect(recipe?.id).toBe('get204-four-block-kitbash-mission-v1');
    expect(validateCandidate(recipe as CandidateManifest)).toEqual([]);
    expect(runtime).toMatchObject({
      id: 'get204-four-block-source-candidate-v1',
      runtimeEnabled: true,
      defaultZoom: 2,
      actorScreenHeightTargetPx: { min: 95, max: 115 },
    });
    expect(runtime?.layers?.map(({ view }) => view)).toEqual(['overview', 'close']);
    expect(runtime?.layers?.every(({ path, peopleBakedIntoPlate }) => (
      path.startsWith('environment/level0/get204-city/') && peopleBakedIntoPlate === false
    ))).toBe(true);
    runtime?.layers?.forEach(({ path }) => {
      expect(path).toBeDefined();
      if (path) {
        expect(existsSync(resolve(repositoryRoot, 'the-getaway/public', path))).toBe(true);
      }
    });
    expect(runtime?.population).toHaveLength(7);
    expect(runtime?.population?.filter(({ kind }) => kind !== 'drone')).toHaveLength(6);
    expect(recipe).toBeDefined();
    if (!recipe) return;
    expect(runtime?.clusters).toHaveLength(recipe.architecturalClusters.length);
  });

  it('keeps registered city geometry stable when the player crosses treatment bounds', () => {
    const runtimeModule = loadCityRuntime();
    const resolveBlend = Reflect.get(runtimeModule, 'resolveGet204CityWorldViewBlend');

    expect(typeof resolveBlend).toBe('function');
    if (typeof resolveBlend !== 'function') return;

    const inside = resolveBlend(2, { x: 32.7, y: 22 }) as { closeAlpha: number };
    const outside = resolveBlend(2, { x: 33.4, y: 22 }) as { closeAlpha: number };

    expect(inside.closeAlpha).toBe(1);
    expect(outside.closeAlpha).toBe(inside.closeAlpha);
  });

  it('derives a coherent four-block candidate layout', () => {
    const runtimeModule = loadCityRuntime();
    const layout = Reflect.get(runtimeModule, 'GET204_CITY_LAYOUT') as Level0LayoutContract | undefined;

    expect(layout).toBeDefined();
    if (!layout) return;
    expect(layout.id).toBe('level0-get204-four-block-source-candidate-v1');
    expect(validateLevel0LayoutContract(layout)).toEqual([]);
    expect(layout.buildingFootprints.length).toBeGreaterThanOrEqual(12);
    expect(layout.buildingFootprints.length).toBeLessThanOrEqual(16);
    expect(layout.traversalLoops).toHaveLength(3);
  });

  it('makes the approved four-block layout canonical for gameplay and art', () => {
    const runtimeModule = loadCityRuntime();
    const layout = Reflect.get(runtimeModule, 'GET204_CITY_LAYOUT') as Level0LayoutContract;

    expect(LEVEL0_LAYOUT_CONTRACT.id).toBe('level0-get204-four-block-source-candidate-v1');
    expect(LEVEL0_LAYOUT_CONTRACT).toBe(layout);
    expect(LEVEL0_LAYOUT_CONTRACT.bounds).toEqual([
      { x: 0, y: 0 },
      { x: 58, y: 0 },
      { x: 58, y: 44 },
      { x: 0, y: 44 },
    ]);
  });

  it('passes the mission-district validator and rejects the old oversized recipe', () => {
    const candidate = readCandidate();
    const rejected = readJson<Get204FullDistrictRecipe>(rejectedManifestPath);
    expect(candidate).not.toBeNull();
    expect(rejected).not.toBeNull();
    if (!candidate || !rejected) return;

    expect(validateCandidate(candidate)).toEqual([]);
    expect(validateCandidate(rejected)).toEqual(expect.arrayContaining([
      'GET-204 mission district requires exactly four unique urban blocks',
      'GET-204 source candidate prohibits cropped or generated architecture',
    ]));
  });

  it('rejects source drift, baked actors, excess landmarks, and scope expansion', () => {
    const candidate = readCandidate();
    expect(candidate).not.toBeNull();
    if (!candidate) return;

    const unsafe = JSON.parse(JSON.stringify(candidate)) as CandidateManifest;
    Reflect.set(unsafe.architecturalClusters[0], 'artSource', 'owned-kit-cropped');
    unsafe.architecturalClusters[0].verticalCropMeters = 12;
    unsafe.architecturalClusters[1].role = 'district-landmark';
    Reflect.set(unsafe.populationStaging, 'bakedEnvironmentActorCount', 1);
    unsafe.coordinateSystem.bounds[1].x = 90;

    expect(validateCandidate(unsafe)).toEqual(expect.arrayContaining([
      'GET-204 source candidate prohibits cropped or generated architecture',
      'GET-204 four-block skyline allows one restrained landmark maximum',
      'GET-204 environment art must contain zero baked actors',
      'GET-204 mission district exceeds the approved compact bounds',
    ]));
  });
});
