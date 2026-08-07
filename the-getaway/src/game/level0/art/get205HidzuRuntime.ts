import productionManifestJson from '../../../../../art/blender/get205/manifests/four-block-runtime-production.json';
import { LEVEL0_ACTOR_WORLD_SCALE } from '../../../content/characters/spriteManifest';
import {
  GET204_CITY_RUNTIME,
  resolveGet204CityRenderFocusPixel,
  type Get204CityRuntimeLayer,
  type Get204CityRuntimeVisual,
} from './get204City';

interface Get205ProductionAsset {
  readonly id: string;
  readonly role: 'architecture-back' | 'architecture-front';
  readonly path: string;
  readonly sha256: string;
  readonly bytes: number;
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly clusterId?: string;
  readonly depthAnchor?: { readonly x: number; readonly y: number };
}

interface Get205ProductionProfile {
  readonly id: 'desktop' | 'mobile';
  readonly fullPlate: { readonly width: number; readonly height: number };
  readonly renderZoom: number;
  readonly initialZoom: number;
  readonly assets: readonly Get205ProductionAsset[];
}

interface Get205ProductionManifest {
  readonly id: string;
  readonly source: {
    readonly pack: string;
    readonly scene: string;
    readonly stablePlateSha256: string;
    readonly peopleBakedIntoPlate: false;
    readonly authoring: 'blender-baked-kitbash-master';
  };
  readonly profiles: readonly Get205ProductionProfile[];
}

const productionManifest = productionManifestJson as unknown as Get205ProductionManifest;

const createProfileLayers = (
  profile: Get205ProductionProfile
): readonly Get204CityRuntimeLayer[] => {
  const fullFocus = resolveGet204CityRenderFocusPixel(
    profile.fullPlate.width,
    profile.fullPlate.height,
    profile.renderZoom
  );

  return profile.assets.map((asset) => {
    const clusterId = asset.clusterId;
    const depthAnchor = asset.depthAnchor;
    if (asset.role === 'architecture-front' && (!clusterId || !depthAnchor)) {
      throw new Error(`GET-205 foreground metadata is incomplete for ${asset.id}`);
    }

    return {
      id: `layer.get205-hidzu.${profile.id}.${asset.id}`,
      kind: asset.role,
      view: 'overview',
      textureKey: `level0:get205-hidzu-production:${profile.id}:${asset.id}`,
      path: asset.path,
      depth: asset.role === 'architecture-back'
        ? 39
        : 280 + (depthAnchor!.x + depthAnchor!.y) * 16,
      width: asset.width,
      height: asset.height,
      renderZoom: profile.renderZoom,
      targetLayout: { x: 29, y: 22 },
      focusPixel: {
        x: fullFocus.x - asset.left,
        y: fullFocus.y - asset.top,
      },
      peopleBakedIntoPlate: false,
      colorSource: asset.role === 'architecture-front'
        ? 'registered-stable-runtime-plate'
        : undefined,
      sha256: asset.sha256,
      sourceCrop: {
        left: asset.left,
        top: asset.top,
      },
      occlusion: clusterId
        ? {
            clusterId,
            mode: 'hard',
          }
        : undefined,
    } satisfies Get204CityRuntimeLayer;
  });
};

const createRuntimeProfile = (
  profile: Get205ProductionProfile
): Get204CityRuntimeVisual => ({
  ...GET204_CITY_RUNTIME,
  id: `${productionManifest.id}-${profile.id}`,
  overviewCanvas: { ...profile.fullPlate },
  defaultZoom: profile.initialZoom,
  zoomPresentation: {
    geometryMode: 'single-registered-plate',
    actorScaleMode: 'world-locked',
    actorWorldScale: LEVEL0_ACTOR_WORLD_SCALE,
    actorVisibility: 'always',
    cameraFollowMode: 'player-locked',
  },
  layers: createProfileLayers(profile),
});

const desktopProfile = productionManifest.profiles.find(({ id }) => id === 'desktop');
const mobileProfile = productionManifest.profiles.find(({ id }) => id === 'mobile');
if (!desktopProfile || !mobileProfile) {
  throw new Error('GET-205 production manifest must contain desktop and mobile profiles');
}

export const GET205_HIDZU_RUNTIME_PROFILES = {
  desktop: createRuntimeProfile(desktopProfile),
  mobile: createRuntimeProfile(mobileProfile),
} as const;

/** Desktop remains the canonical quality profile for imports and diagnostics. */
export const GET205_HIDZU_RUNTIME_VISUAL = GET205_HIDZU_RUNTIME_PROFILES.desktop;

export const GET205_HIDZU_SCHEDULE_TREATMENTS = {
  dusk: { tint: 0xfff4e8, atmosphereAlpha: 0.012 },
  'blue-hour': { tint: 0xeaf2f7, atmosphereAlpha: 0.035 },
  curfew: { tint: 0xb8cbd8, atmosphereAlpha: 0.12 },
} as const;

export const GET205_HIDZU_RUNTIME_TREATMENT = {
  id: 'get205-hidzu-production-treatment-v1',
  baseVisualId: GET204_CITY_RUNTIME.id,
  geometryOwner: 'GET-204',
  populationOwner: GET204_CITY_RUNTIME.populationOwnership,
  scheduleState: 'blue-hour',
  scheduleTreatments: GET205_HIDZU_SCHEDULE_TREATMENTS,
  identityPresentation: 'blender-baked-facade-scale',
  sourcePack: productionManifest.source.pack,
  sourceScene: productionManifest.source.scene,
  semanticColor: {
    technology: 'restrained-cyan',
    civicTime: 'amber',
    confirmedDanger: 'crimson',
    neutral: 'bone-muted-teal',
  },
  profiles: productionManifest.profiles.map((profile) => ({
    id: profile.id,
    assets: profile.assets.map((asset) => ({
      id: asset.id,
      path: asset.path,
      width: asset.width,
      height: asset.height,
      sha256: asset.sha256,
      bytes: asset.bytes,
      peopleBakedIntoPlate: false as const,
      geometryEffect: 'facade-treatment-only' as const,
      authoring: productionManifest.source.authoring,
    })),
  })),
  prohibited: [
    'baked-people',
    'topology-change',
    'freestanding-obstacle',
    'broad-cyan-glow',
    'broad-crimson-glow',
    'generic-neon-cyberpunk',
    'oversized-facade-banner',
    'floating-post-render-panel',
  ],
} as const;

export const isGet205RuntimeVisual = (visual: Get204CityRuntimeVisual): boolean =>
  visual.id.startsWith(`${productionManifest.id}-`);

export const resolveLevel0RuntimeVisual = (
  search?: string,
  viewportWidth?: number
): Get204CityRuntimeVisual => {
  const source = search ?? (typeof window === 'undefined' ? '' : window.location.search);
  const parameters = new URLSearchParams(source);
  if (parameters.get('visualTreatment') === 'get204-1') return GET204_CITY_RUNTIME;

  const forcedProfile = parameters.get('visualProfile');
  if (forcedProfile === 'desktop' || forcedProfile === 'mobile') {
    return GET205_HIDZU_RUNTIME_PROFILES[forcedProfile];
  }

  const width = viewportWidth ?? (
    typeof window === 'undefined' ? 1440 : window.innerWidth
  );
  return width <= 820
    ? GET205_HIDZU_RUNTIME_PROFILES.mobile
    : GET205_HIDZU_RUNTIME_PROFILES.desktop;
};

/**
 * One stable visual selection for the lifetime of the current page.
 * Shell copy and Phaser asset loading must consume the same object so a
 * viewport change during startup cannot select different profiles.
 */
export const LEVEL0_RUNTIME_VISUAL = resolveLevel0RuntimeVisual();
