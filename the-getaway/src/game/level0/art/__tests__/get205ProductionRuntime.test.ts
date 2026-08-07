import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { GET204_CITY_RUNTIME } from '../get204City';
import * as get205Runtime from '../get205HidzuRuntime';

const repositoryRoot = resolve(__dirname, '../../../../../..');
const productionManifestPath = resolve(
  repositoryRoot,
  'the-getaway/public/environment/level0/get205-hidzu-production-v1/manifest.json'
);
const blenderManifestPath = resolve(
  repositoryRoot,
  'art/blender/get205/manifests/four-block-baked-treatment.json'
);
const runtimeShellPath = resolve(
  repositoryRoot,
  'the-getaway/src/components/level0/Level0RuntimeShell.tsx'
);
const level0ScenePath = resolve(
  repositoryRoot,
  'the-getaway/src/game/level0/scene/Level0Scene.ts'
);
const gitignorePath = resolve(repositoryRoot, '.gitignore');
const strayListingArtifactPath = resolve(repositoryRoot, '-l');

interface ProductionAsset {
  path: string;
  width: number;
  height: number;
  sha256: string;
  bytes: number;
}

interface ProductionProfile {
  id: 'desktop' | 'mobile';
  renderZoom: number;
  assets: ProductionAsset[];
}

interface ProductionManifest {
  schemaVersion: number;
  id: string;
  source: {
    pack: string;
    scene: string;
    stablePlateSha256: string;
    peopleBakedIntoPlate: false;
  };
  profiles: ProductionProfile[];
}

interface RuntimeProfile {
  id: string;
  defaultZoom: number;
  layers: ReadonlyArray<{
    kind: string;
    path: string;
    width: number;
    height: number;
  }>;
}

const sha256 = (path: string): string =>
  createHash('sha256').update(readFileSync(path)).digest('hex');

describe('GET-205 production runtime', () => {
  it('promotes the accepted Hidzu city to the normal Level 0 path with an explicit GET-204 fallback', () => {
    const resolveRuntime = get205Runtime.resolveLevel0RuntimeVisual as unknown as (
      search?: string,
      viewportWidth?: number
    ) => unknown;
    expect(resolveRuntime('', 1440)).toBe(
      Reflect.get(get205Runtime, 'GET205_HIDZU_RUNTIME_PROFILES')?.desktop
    );
    expect(resolveRuntime('?fresh=1', 390)).toBe(
      Reflect.get(get205Runtime, 'GET205_HIDZU_RUNTIME_PROFILES')?.mobile
    );
    expect(
      resolveRuntime('?visualTreatment=get204-1', 1440)
    ).toBe(GET204_CITY_RUNTIME);
  });

  it('owns one page-level visual selection shared by the shell and Phaser scene', () => {
    const pageVisual = Reflect.get(get205Runtime, 'LEVEL0_RUNTIME_VISUAL');
    const shellSource = readFileSync(runtimeShellPath, 'utf8');
    const sceneSource = readFileSync(level0ScenePath, 'utf8');

    expect(pageVisual).toBeDefined();
    expect(shellSource).toContain('LEVEL0_RUNTIME_VISUAL');
    expect(sceneSource).toContain('LEVEL0_RUNTIME_VISUAL');
    expect(shellSource).not.toMatch(/resolveLevel0RuntimeVisual\(\)/);
    expect(sceneSource).not.toMatch(/resolveLevel0RuntimeVisual\(\)/);
  });

  it('keeps superseded art trials out of the production staging surface', () => {
    const ignoreRules = readFileSync(gitignorePath, 'utf8');
    const supersededPaths = [
      'the-getaway/public/environment/level0/get205-hidzu-four-block-baked-v1/',
      'the-getaway/public/environment/level0/get205-hidzu-four-block-baked-v2/',
      'the-getaway/public/environment/level0/get205-hidzu-v1/',
      'the-getaway/public/environment/level0/get204-gate1/',
      'the-getaway/public/environment/level0/get204-street-v2/',
      'the-getaway/public/environment/level0/get204-city-v2/close.png',
      'the-getaway/public/environment/level0/get204-city-v2/overview.png',
      'the-getaway/public/environment/level0/get204-city-v2/overview-16x10-v2.png',
      'the-getaway/public/environment/level0/get204-city/overview-people-free-v1.png',
      'the-getaway/artifacts/',
    ];

    supersededPaths.forEach((path) => expect(ignoreRules).toContain(path));
    expect(ignoreRules).not.toContain(
      'the-getaway/public/environment/level0/get205-hidzu-production-v1/'
    );
    expect(existsSync(strayListingArtifactPath)).toBe(false);
  });

  it('ships desktop and mobile profiles that preserve quality without exceeding a 4096 texture edge', () => {
    const profiles = Reflect.get(
      get205Runtime,
      'GET205_HIDZU_RUNTIME_PROFILES'
    ) as Record<'desktop' | 'mobile', RuntimeProfile> | undefined;

    expect(profiles).toBeDefined();
    if (!profiles) return;

    expect(profiles.desktop.layers.filter(({ kind }) => kind === 'architecture-back')).toHaveLength(4);
    expect(profiles.mobile.layers.filter(({ kind }) => kind === 'architecture-back')).toHaveLength(1);
    expect(profiles.desktop.defaultZoom).toBe(2);
    expect(profiles.mobile.defaultZoom).toBe(1.05);

    Object.values(profiles).forEach((profile) => {
      expect(profile.layers.length).toBeGreaterThan(1);
      profile.layers.forEach((layer) => {
        expect(Math.max(layer.width, layer.height)).toBeLessThanOrEqual(4096);
        expect(layer.path).toMatch(
          /^environment\/level0\/get205-hidzu-production-v1\/(?:desktop|mobile)\/.+\.webp$/
        );
      });
    });

    const decodedMobileBytes = profiles.mobile.layers.reduce(
      (total, layer) => total + layer.width * layer.height * 4,
      0
    );
    expect(decodedMobileBytes).toBeLessThanOrEqual(48 * 1024 * 1024);
  });

  it('publishes a hash-checked, bounded production asset manifest', () => {
    expect(existsSync(productionManifestPath)).toBe(true);
    if (!existsSync(productionManifestPath)) return;

    const manifest = JSON.parse(
      readFileSync(productionManifestPath, 'utf8')
    ) as ProductionManifest;
    expect(manifest).toMatchObject({
      schemaVersion: 1,
      id: 'get205-hidzu-production-v1',
      source: {
        pack: 'KitBash3D Neo Tokyo 2',
        peopleBakedIntoPlate: false,
      },
    });
    expect(manifest.profiles.map(({ id }) => id)).toEqual(['desktop', 'mobile']);

    manifest.profiles.forEach((profile) => {
      profile.assets.forEach((asset) => {
        const absolute = resolve(repositoryRoot, 'the-getaway/public', asset.path);
        expect(existsSync(absolute)).toBe(true);
        if (!existsSync(absolute)) return;
        expect(statSync(absolute).size).toBe(asset.bytes);
        expect(asset.bytes).toBeLessThanOrEqual(2 * 1024 * 1024);
        expect(sha256(absolute)).toBe(asset.sha256);
        expect(Math.max(asset.width, asset.height)).toBeLessThanOrEqual(4096);
      });
    });
  });

  it('owns a noninteractive atmospheric surround and aligned runtime schedule treatment', () => {
    const blenderManifest = JSON.parse(
      readFileSync(blenderManifestPath, 'utf8')
    ) as {
      treatment?: {
        environmentMatte?: {
          kind: string;
          gameplayCollision: boolean;
          geometryOwner: string;
        };
      };
    };
    const scheduleTreatments = Reflect.get(
      get205Runtime,
      'GET205_HIDZU_SCHEDULE_TREATMENTS'
    ) as Record<string, { tint: number; atmosphereAlpha: number }> | undefined;

    expect(blenderManifest.treatment?.environmentMatte).toMatchObject({
      kind: 'noninteractive-atmospheric-surround',
      gameplayCollision: false,
      geometryOwner: 'GET-205-atmosphere-only',
    });
    expect(scheduleTreatments).toEqual({
      dusk: { tint: 0xfff4e8, atmosphereAlpha: 0.012 },
      'blue-hour': { tint: 0xeaf2f7, atmosphereAlpha: 0.035 },
      curfew: { tint: 0xb8cbd8, atmosphereAlpha: 0.12 },
    });
  });
});
