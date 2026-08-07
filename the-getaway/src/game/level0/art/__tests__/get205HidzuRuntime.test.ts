import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  GET204_CITY_RUNTIME,
  resolveGet204CityOverviewBounds,
  resolveGet204CityOverviewFitZoom,
  resolveGet204CityRenderFocusPixel,
  resolveGet204CityWorldViewBlend,
} from '../get204City';
import {
  GET205_HIDZU_RUNTIME_PROFILES,
  GET205_HIDZU_RUNTIME_TREATMENT,
  GET205_HIDZU_RUNTIME_VISUAL,
  resolveLevel0RuntimeVisual,
} from '../get205HidzuRuntime';

const repositoryRoot = resolve(__dirname, '../../../../../..');
const blenderTreatmentManifest = JSON.parse(
  readFileSync(
    resolve(
      repositoryRoot,
      'art/blender/get205/manifests/four-block-baked-treatment.json'
    ),
    'utf8'
  )
) as {
  source: {
    scene: string;
    recipe: string;
    geometryOwner: string;
    sourcePack: string;
    geometryChanges: string;
  };
  treatment: {
    identityPresentation: string;
    environmentMatte: {
      kind: string;
      gameplayCollision: boolean;
    };
    facadeSigns: Array<{
      id: string;
      widthMeters: number;
      gameplayPurpose: string;
    }>;
  };
  output: {
    peopleBakedIntoPlate: boolean;
  };
  camera: {
    views: Array<{
      id: string;
      width: number;
      height: number;
      renderZoom: number;
      targetLayout: { x: number; y: number };
      hideClusterIds: string[];
    }>;
  };
  prohibited: string[];
};

const readAsset = (assetPath: string): Buffer =>
  readFileSync(resolve(process.cwd(), 'public', assetPath));

describe('GET-205 four-block Hidzu treatment', () => {
  it('inherits the accepted GET-204 geometry, camera, and runtime population', () => {
    expect(GET205_HIDZU_RUNTIME_VISUAL).toMatchObject({
      id: 'get205-hidzu-production-v1-desktop',
      runtimeEnabled: true,
      projection: GET204_CITY_RUNTIME.projection,
      canvas: GET204_CITY_RUNTIME.canvas,
      overviewCanvas: { width: 6400, height: 3600 },
      defaultZoom: GET204_CITY_RUNTIME.defaultZoom,
      maxZoom: GET204_CITY_RUNTIME.maxZoom,
      populationOwnership: GET204_CITY_RUNTIME.populationOwnership,
    });
    expect(GET205_HIDZU_RUNTIME_VISUAL.population).toBe(GET204_CITY_RUNTIME.population);
  });

  it('tiles the high-resolution people-free Blender plate without changing its registration', () => {
    const backgroundLayers = GET205_HIDZU_RUNTIME_VISUAL.layers.filter(
      ({ kind }) => kind === 'architecture-back'
    );
    expect(backgroundLayers).toHaveLength(4);
    expect(resolveGet204CityOverviewBounds(GET205_HIDZU_RUNTIME_VISUAL)).toMatchObject({
      width: 3200,
      height: 1800,
    });

    backgroundLayers.forEach((layer) => {
      expect(layer).toMatchObject({
        kind: 'architecture-back',
        renderZoom: 2,
        targetLayout: { x: 29, y: 22 },
        peopleBakedIntoPlate: false,
      });
      expect(layer.path).toMatch(
        /get205-hidzu-production-v1\/desktop\/background-.+\.webp$/
      );
      expect(layer.path).not.toMatch(/\.svg$/);

      const treatmentAsset = GET205_HIDZU_RUNTIME_TREATMENT.profiles
        .find(({ id }) => id === 'desktop')!
        .assets.find(({ path }) => path === layer.path)!;
      expect(createHash('sha256').update(readAsset(layer.path)).digest('hex')).toBe(
        treatmentAsset.sha256
      );
      expect(treatmentAsset).toMatchObject({
        peopleBakedIntoPlate: false,
        geometryEffect: 'facade-treatment-only',
        authoring: 'blender-baked-kitbash-master',
      });
    });
  });

  it('registers one same-master transparent foreground cutout per KitBash cluster', () => {
    const foregroundLayers = GET205_HIDZU_RUNTIME_VISUAL.layers.filter(
      ({ kind }) => kind === 'architecture-front'
    );
    const expectedClusterIds = GET204_CITY_RUNTIME.clusters.map(({ id }) => id).sort();

    expect(foregroundLayers).toHaveLength(16);
    expect(
      foregroundLayers.map((layer) => layer.occlusion?.clusterId).sort()
    ).toEqual(expectedClusterIds);

    foregroundLayers.forEach((layer) => {
      const stableFocus = resolveGet204CityRenderFocusPixel(6400, 3600, 2);
      expect(layer).toMatchObject({
        view: 'overview',
        renderZoom: 2,
        targetLayout: { x: 29, y: 22 },
        peopleBakedIntoPlate: false,
        colorSource: 'registered-stable-runtime-plate',
        occlusion: {
          mode: 'hard',
        },
      });
      expect(layer.width).toBeGreaterThan(0);
      expect(layer.height).toBeGreaterThan(0);
      expect(layer.width).toBeLessThan(3200);
      expect(layer.height).toBeLessThan(2400);
      expect(layer.depth).toBeGreaterThan(100);
      expect(layer.sourceCrop).toBeDefined();
      expect(layer.focusPixel).toEqual({
        x: stableFocus.x - layer.sourceCrop!.left,
        y: stableFocus.y - layer.sourceCrop!.top,
      });
      expect(layer.path).toMatch(
        /get205-hidzu-production-v1\/desktop\/foreground\/.+\.webp$/
      );

      const asset = readAsset(layer.path);
      expect(createHash('sha256').update(asset).digest('hex')).toBe(layer.sha256);
    });
  });

  it('locks architecture, actor scale, and camera follow across zoom levels', () => {
    expect(GET205_HIDZU_RUNTIME_VISUAL.zoomPresentation).toEqual({
      geometryMode: 'single-registered-plate',
      actorScaleMode: 'world-locked',
      actorWorldScale: 0.64,
      actorVisibility: 'always',
      cameraFollowMode: 'player-locked',
    });

    const resolveBlend = resolveGet204CityWorldViewBlend as unknown as (
      zoom: number,
      visual: typeof GET205_HIDZU_RUNTIME_VISUAL
    ) => {
      overviewAlpha: number;
      closeAlpha: number;
      actorAlpha: number;
      playerWorldScale: number;
    };
    const close = resolveBlend(2, GET205_HIDZU_RUNTIME_VISUAL);
    const transition = resolveBlend(1.6, GET205_HIDZU_RUNTIME_VISUAL);
    const overview = resolveBlend(1.44, GET205_HIDZU_RUNTIME_VISUAL);

    expect(close).toEqual({
      overviewAlpha: 1,
      closeAlpha: 0,
      actorAlpha: 1,
      playerWorldScale: 0.64,
    });
    expect(transition).toEqual(close);
    expect(overview).toEqual(close);
    expect(resolveGet204CityOverviewFitZoom(1280, 540, GET205_HIDZU_RUNTIME_VISUAL)).toBe(0.6);
  });

  it('keeps the transit crowd on an unobstructed street-facing composition', () => {
    const transitB = GET205_HIDZU_RUNTIME_VISUAL.population.find(
      ({ id }) => id === 'get204.civilian.transit-b'
    );
    const delivery = GET205_HIDZU_RUNTIME_VISUAL.population.find(
      ({ id }) => id === 'get204.civilian.delivery'
    );
    expect(transitB?.position).toEqual({ x: 26.2, y: 21.3 });
    expect(delivery?.position).toEqual({ x: 27, y: 21 });
    expect(
      GET205_HIDZU_RUNTIME_VISUAL.population
        .filter(({ kind }) => kind === 'civilian')
        .every(({ blocksMovement }) => !blocksMovement)
    ).toBe(true);
  });

  it('makes GET-205 normal while retaining an explicit GET-204 diagnostic fallback', () => {
    expect(resolveLevel0RuntimeVisual('', 1440)).toBe(
      GET205_HIDZU_RUNTIME_PROFILES.desktop
    );
    expect(resolveLevel0RuntimeVisual('', 390)).toBe(
      GET205_HIDZU_RUNTIME_PROFILES.mobile
    );
    expect(resolveLevel0RuntimeVisual('?visualTreatment=get204-1', 1440)).toBe(
      GET204_CITY_RUNTIME
    );
    expect(GET205_HIDZU_RUNTIME_TREATMENT).toMatchObject({
      baseVisualId: GET204_CITY_RUNTIME.id,
      geometryOwner: 'GET-204',
      populationOwner: 'separate-runtime-actors',
      scheduleState: 'blue-hour',
      semanticColor: {
        technology: 'restrained-cyan',
        civicTime: 'amber',
        confirmedDanger: 'crimson',
        neutral: 'bone-muted-teal',
      },
      identityPresentation: 'blender-baked-facade-scale',
    });
    expect(GET205_HIDZU_RUNTIME_TREATMENT.prohibited).toEqual(
      expect.arrayContaining([
        'baked-people',
        'topology-change',
        'freestanding-obstacle',
        'broad-cyan-glow',
        'broad-crimson-glow',
        'generic-neon-cyberpunk',
        'oversized-facade-banner',
        'floating-post-render-panel',
      ])
    );
  });

  it('keeps identity authored in the accepted KitBash Blender master', () => {
    expect(blenderTreatmentManifest.source).toEqual({
      scene: 'art/blender/get204/.generated/mission-district/master/get204-mission-district.blend',
      recipe: 'art/blender/get204/manifests/mission-district-rebuild.json',
      geometryOwner: 'GET-204',
      sourcePack: 'KitBash3D Neo Tokyo 2',
      geometryChanges: 'none',
    });
    expect(blenderTreatmentManifest.treatment.identityPresentation).toBe(
      'blender-baked-facade-scale'
    );
    expect(blenderTreatmentManifest.treatment.environmentMatte).toEqual({
      kind: 'noninteractive-atmospheric-surround',
      gameplayCollision: false,
      geometryOwner: 'GET-205-atmosphere-only',
      centerLayout: { x: 29, y: 22 },
      sizeMeters: 720,
      elevationMeters: -0.45,
      surfaceColor: [0.012, 0.016, 0.019, 1],
      worldColor: [0.004, 0.007, 0.011, 1],
    });
    expect(blenderTreatmentManifest.treatment.facadeSigns).toHaveLength(4);
    blenderTreatmentManifest.treatment.facadeSigns.forEach((sign) => {
      expect(sign.widthMeters).toBeLessThanOrEqual(8);
      expect(sign.gameplayPurpose).not.toHaveLength(0);
    });
    expect(
      blenderTreatmentManifest.treatment.facadeSigns.find(
        ({ id }) => id === 'public-transit'
      )?.widthMeters
    ).toBeGreaterThanOrEqual(5.5);
    const stableRuntimeView = blenderTreatmentManifest.camera.views.find(
      ({ id }) => id === 'stable-runtime'
    );
    expect(stableRuntimeView).toMatchObject({
      id: 'stable-runtime',
      width: 6400,
      height: 3600,
      targetLayout: { x: 29, y: 22 },
      renderZoom: 2,
      hideClusterIds: [],
    });
    expect(blenderTreatmentManifest.output.peopleBakedIntoPlate).toBe(false);
    expect(blenderTreatmentManifest.prohibited).toEqual(
      expect.arrayContaining([
        'oversized-facade-banner',
        'floating-post-render-panel',
        'post-render-svg-identity',
        'baked-environment-actors',
        'topology-change',
        'collision-change',
        'camera-change',
      ])
    );
  });
});
