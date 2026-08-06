import { LEVEL0_LAYOUT_CONTRACT } from '../../../../content/levels/level0/layoutContract';
import type { Level0ArtBundle } from '../types';
import {
  validateLevel0ArtBundle,
  validateLevel0ArtManifest,
  validateLevel0SourceAndRecipe,
} from '../validator';

const SHA256 = 'a'.repeat(64);
const PROP_ANCHOR_IDS = [
  'terminal.camera_loop',
  'terminal.cache_locker',
  'terminal.outbound_transit',
  'hide.service_recess',
  'hide.maintenance_bay',
  'hide.transit_structure',
  'blend.delivery_activity',
  'blend.public_queue',
] as const;
const CANVAS = {
  width: 5120,
  height: 3584,
  tileSize: 2048,
  columns: 3,
  rows: 2,
};
const FIXTURE_LAYOUT_UNIT_METERS = 2;
const FIXTURE_BUILDING_SCALE = 0.8;

const polygonDimensions = (polygon: readonly { x: number; y: number }[]) => {
  const xs = polygon.map((point) => point.x);
  const ys = polygon.map((point) => point.y);
  return {
    width: Math.max(...xs) - Math.min(...xs),
    depth: Math.max(...ys) - Math.min(...ys),
  };
};

const fixtureBuildingBoundsMeters = (
  polygon: readonly { x: number; y: number }[]
) => {
  const footprint = polygonDimensions(polygon);
  const frontageMarginMeters = 0.6;
  return {
    width: (
      footprint.width * FIXTURE_LAYOUT_UNIT_METERS - frontageMarginMeters
    ) / FIXTURE_BUILDING_SCALE,
    depth: (
      footprint.depth * FIXTURE_LAYOUT_UNIT_METERS - frontageMarginMeters
    ) / FIXTURE_BUILDING_SCALE,
    height: 20,
  };
};

const polygonExtents = (polygon: readonly { x: number; y: number }[]) => {
  const xs = polygon.map((point) => point.x);
  const ys = polygon.map((point) => point.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
};

const createTiles = (stem: string, extension: 'webp' | 'png' = 'webp') =>
  Array.from({ length: CANVAS.rows }, (_, row) =>
    Array.from({ length: CANVAS.columns }, (_, column) => ({
      id: `${stem}.${column}.${row}`,
      column,
      row,
      x: column * CANVAS.tileSize,
      y: row * CANVAS.tileSize,
      width: Math.min(CANVAS.tileSize, CANVAS.width - column * CANVAS.tileSize),
      height: Math.min(CANVAS.tileSize, CANVAS.height - row * CANVAS.tileSize),
      imagePath: `environment/level0/t4/${stem}/${column}-${row}.${extension}`,
      sha256: SHA256,
      byteSize: 1024,
    }))
  ).flat();

const createBundle = (): Level0ArtBundle => ({
  source: {
    schemaVersion: 1,
    ticket: 'GET-204',
    vendor: 'KitBash3D',
    kit: 'Neo Tokyo 2',
    sourceRootVariable: 'GETAWAY_NEO_TOKYO_ROOT',
    archiveRelativePath: 'obj.zip',
    archiveSha256: SHA256,
    archiveBytes: 104_163_817,
    format: 'FBX',
    sourceObjectCount: 551,
    geometryMember: {
      path: 'obj/Kitbash3d_NeoTokyo2-Native.FBX',
      sha256: SHA256,
      byteSize: 75_420_256,
      importer: 'bpy.ops.import_scene.fbx',
      globalScale: 1,
      axisForward: '-Z',
      axisUp: 'Y',
    },
    textures: {
      sourceRelativePath: 'c4d/tex',
      sourceFileCount: 66,
      contentSha256: SHA256,
      relinkDirectory: 'KB3DTextures',
    },
    ownership: {
      basis: 'requester-asserted-owned',
      assertedAt: '2026-08-03',
      exactEntitlementEvidence: 'verified',
      evidenceReference: 'test-fixture-entitlement',
      generalTermsUrl: 'https://kitbash3d.com/pages/licenses',
    },
    commitBoundary: {
      permitted: ['recipes', 'manifests', 'metadata', 'validators', 'flattened-derivatives'],
      prohibited: ['raw-geometry', 'source-textures', 'generated-blend'],
    },
    selectedAssets: [
      ...LEVEL0_LAYOUT_CONTRACT.buildingFootprints.map((building, index) => ({
        id: `neo-tokyo-building-${index + 1}`,
        sourcePrefix: `Building${index + 1}`,
        category: (index < 2 ? 'large' : index < 5 ? 'medium' : 'small') as
          | 'large'
          | 'medium'
          | 'small',
        sourceObjectPattern: `Building${index + 1}_*`,
        sourceUpAxis: 'Y' as const,
        normalize: {
          groundContact: 'measured-bounds-min-z' as const,
          center: 'measured-ground-bounds-center' as const,
          sourceUnitsPerMeter: 1,
        },
        measuredStructuralBoundsMeters: fixtureBuildingBoundsMeters(building.polygon),
        excludedObjectSuffixes: ['StoneFloor', 'Asphalt', 'Grass', 'TileDamage'],
      })),
      ...PROP_ANCHOR_IDS.map((_, index) => ({
        id: `neo-tokyo-prop-${index + 1}`,
        sourcePrefix: `Prop${index + 1}`,
        category: 'public-realm' as const,
        sourceObjectPattern: `Prop${index + 1}_*`,
        sourceUpAxis: 'Y' as const,
        normalize: {
          groundContact: 'source-catalog-plane' as const,
          center: 'measured-ground-bounds-center' as const,
          sourceUnitsPerMeter: 1,
          sourceGroundDatumMeters: 0.271386,
        },
        measuredStructuralBoundsMeters: { width: 2, depth: 2, height: 2 },
        excludedObjectSuffixes: ['StoneFloor', 'Asphalt', 'Grass', 'TileDamage'],
      })),
    ],
  },
  recipe: {
    schemaVersion: 1,
    id: 'level0-tokyo-unchanged-kit-v1',
    ticket: 'GET-204',
    phase: 'unchanged-kit-composition',
    layout: {
      contractId: LEVEL0_LAYOUT_CONTRACT.id,
      schemaVersion: LEVEL0_LAYOUT_CONTRACT.schemaVersion,
      contractPath: 'art/iso-assets/contracts/level0-layout-contract.json',
      contractSha256: SHA256,
      bounds: LEVEL0_LAYOUT_CONTRACT.bounds,
      traversalLoopIds: LEVEL0_LAYOUT_CONTRACT.traversalLoops.map((loop) => loop.id),
      buildingFootprintIds: LEVEL0_LAYOUT_CONTRACT.buildingFootprints.map((building) => building.id),
      entranceIds: LEVEL0_LAYOUT_CONTRACT.entrances.map((entrance) => entrance.id),
      anchorIds: LEVEL0_LAYOUT_CONTRACT.anchors.map((anchor) => anchor.id),
      semanticMaskIds: [...LEVEL0_LAYOUT_CONTRACT.semanticMaskIds],
    },
    coordinateSystem: {
      layoutUnitMeters: FIXTURE_LAYOUT_UNIT_METERS,
      blenderUpAxis: 'Z',
      origin: { x: 0, y: 0, z: 0 },
    },
    camera: {
      type: 'orthographic',
      sensorFit: 'vertical',
      azimuthDegrees: 45,
      elevationDegrees: 30,
      tileWidth: 64,
      tileHeight: 32,
      followOffsetScenePixels: 80,
      defaultZoom: 0.78,
      minimumZoom: 0.6,
    },
    lighting: {
      direction: 'upper-left',
      states: ['dusk', 'blue-hour', 'curfew'],
      treatment: 'neutral-unchanged-kit-foundation',
    },
    publicRealm: {
      surfaceIds: LEVEL0_LAYOUT_CONTRACT.surfaces.map((surface) => surface.id),
      authoredKinds: ['road', 'sidewalk', 'crossing', 'alley', 'plaza', 'curb'],
      buildingLotTreatment: 'structure-bounds',
    },
    buildingPlacements: LEVEL0_LAYOUT_CONTRACT.buildingFootprints.map((building, index) => {
      const footprint = polygonDimensions(building.polygon);
      const extents = polygonExtents(building.polygon);
      const assetBounds = fixtureBuildingBoundsMeters(building.polygon);
      const footprintAreaMeters =
        footprint.width * FIXTURE_LAYOUT_UNIT_METERS *
        footprint.depth * FIXTURE_LAYOUT_UNIT_METERS;
      const transformedAssetAreaMeters =
        assetBounds.width * FIXTURE_BUILDING_SCALE *
        assetBounds.depth * FIXTURE_BUILDING_SCALE;
      return {
        id: `placement-${index + 1}`,
        footprintId: building.id,
        assetId: `neo-tokyo-building-${index + 1}`,
        role: index === 3 ? 'logistics-landmark' as const : index === 4
          ? 'safehouse-shell' as const
          : 'street-wall' as const,
        layoutPosition: {
          x: (building.polygon[0]!.x + building.polygon[2]!.x) / 2,
          y: extents.maxY - (
            assetBounds.depth * FIXTURE_BUILDING_SCALE / 2 + 0.3
          ) / FIXTURE_LAYOUT_UNIT_METERS,
        },
        rotationDegrees: 0,
        uniformScale: FIXTURE_BUILDING_SCALE,
        targetHeightMeters: assetBounds.height * FIXTURE_BUILDING_SCALE,
        footprintFill: transformedAssetAreaMeters / footprintAreaMeters,
        frontageEdges: ['south' as const],
      };
    }),
    propPlacements: PROP_ANCHOR_IDS.map((anchorId, index) => {
      const anchor = LEVEL0_LAYOUT_CONTRACT.anchors.find((candidate) => candidate.id === anchorId)!;
      return {
        id: `prop-placement-${index + 1}`,
        assetId: `neo-tokyo-prop-${index + 1}`,
        anchorId,
        role: anchor.kind as 'terminal' | 'hiding' | 'blending',
        layoutPosition: { ...anchor.position },
        rotationDegrees: 0,
        uniformScale: 1,
      };
    }),
    entranceProof: LEVEL0_LAYOUT_CONTRACT.entrances.map((entrance) => ({
      entranceId: entrance.id,
      buildingId: entrance.buildingId,
      position: entrance.position,
      minimumClearWidthMeters: 2.4,
    })),
    actorScaleProof: [
      { id: 'actor.safehouse', anchorId: 'safehouse.spawn', heightMeters: 1.8, minimumSilhouetteWidthMeters: 0.55 },
      { id: 'actor.public', anchorId: 'contact.lira', heightMeters: 1.8, minimumSilhouetteWidthMeters: 0.55 },
      { id: 'actor.logistics', anchorId: 'entrance.logistics.public', heightMeters: 1.8, minimumSilhouetteWidthMeters: 0.55 },
    ],
    alignedExport: {
      canvas: {
        width: CANVAS.width,
        height: CANVAS.height,
        pixelOrigin: { x: 2160, y: 980 },
        tileSize: CANVAS.tileSize,
      },
      budget: {
        maxTotalBytes: 48 * 1024 * 1024,
        maxTileBytes: 2 * 1024 * 1024,
      },
      fallbackProfile: 'level0-greybox',
    },
    layers: [
      { id: 'layer.level0.master.ground', kind: 'ground', fallbackLayerId: 'layer.level0.greybox.ground' },
      { id: 'layer.level0.master.architecture-back', kind: 'architecture-back', fallbackLayerId: 'layer.level0.greybox.architecture' },
      { id: 'layer.level0.master.architecture-front', kind: 'architecture-front', fallbackLayerId: 'layer.level0.greybox.architecture' },
      { id: 'layer.level0.master.lighting-foundation.dusk', kind: 'lighting-foundation', state: 'dusk', fallbackLayerId: 'layer.level0.greybox.atmosphere' },
      {
        id: 'layer.level0.master.lighting-foundation.blue-hour',
        kind: 'lighting-foundation',
        state: 'blue-hour',
        fallbackLayerId: 'layer.level0.greybox.atmosphere',
      },
      {
        id: 'layer.level0.master.lighting-foundation.curfew',
        kind: 'lighting-foundation',
        state: 'curfew',
        fallbackLayerId: 'layer.level0.greybox.atmosphere',
      },
      ...LEVEL0_LAYOUT_CONTRACT.semanticMaskIds.map((maskId) => ({
        id: `layer.level0.master.semantic.${maskId}`,
        kind: 'semantic-mask' as const,
        maskId,
        fallbackLayerId: 'layer.level0.greybox.semantic',
      })),
    ],
    captures: [1280, 1440, 1920].flatMap((width) => {
      const height = width === 1280 ? 720 : width === 1440 ? 900 : 1080;
      return [
        {
          id: `${width}x${height}-default`,
          width,
          height,
          zoom: 0.78,
          framing: 'default' as const,
          targetAnchorId: width === 1280 ? 'safehouse.spawn' : width === 1440 ? 'contact.lira' : 'entrance.logistics.public',
        },
        {
          id: `${width}x${height}-minimum`,
          width,
          height,
          zoom: 0.6,
          framing: 'minimum' as const,
          targetAnchorId: width === 1280 ? 'safehouse.spawn' : width === 1440 ? 'contact.lira' : 'entrance.logistics.public',
        },
      ];
    }),
    exclusions: [
      'hidzu-reskin',
      'propaganda',
      'surveillance-noir-grading',
      'raw-asset-commit',
      'decorative-clutter',
    ],
  },
  art: {
    schemaVersion: 1,
    id: 'level0-tokyo-unchanged-kit-art-v1',
    usage: 'runtime',
    recipeId: 'level0-tokyo-unchanged-kit-v1',
    layoutContractId: LEVEL0_LAYOUT_CONTRACT.id,
    projection: {
      tileWidth: 64,
      tileHeight: 32,
      orientation: 'isometric-2:1',
    },
    worldOrigin: { x: 0, y: 0 },
    canvas: {
      width: CANVAS.width,
      height: CANVAS.height,
      pixelOrigin: { x: 2160, y: 980 },
      tileSize: CANVAS.tileSize,
      columns: CANVAS.columns,
      rows: CANVAS.rows,
    },
    budget: {
      maxTotalBytes: 48 * 1024 * 1024,
      maxTileBytes: 2 * 1024 * 1024,
      measuredTotalBytes: 66 * 1024,
    },
    layers: [
      {
        id: 'layer.level0.master.ground',
        kind: 'ground',
        tiles: createTiles('ground'),
        fallbackLayerId: 'layer.level0.greybox.ground',
      },
      {
        id: 'layer.level0.master.architecture-back',
        kind: 'architecture-back',
        tiles: createTiles('architecture-back'),
        fallbackLayerId: 'layer.level0.greybox.architecture',
      },
      {
        id: 'layer.level0.master.architecture-front',
        kind: 'architecture-front',
        tiles: createTiles('architecture-front'),
        fallbackLayerId: 'layer.level0.greybox.architecture',
      },
      {
        id: 'layer.level0.master.lighting-foundation.dusk',
        kind: 'lighting-foundation',
        state: 'dusk',
        tiles: createTiles('lighting-dusk'),
        fallbackLayerId: 'layer.level0.greybox.atmosphere',
      },
      {
        id: 'layer.level0.master.lighting-foundation.blue-hour',
        kind: 'lighting-foundation',
        state: 'blue-hour',
        tiles: createTiles('lighting-blue-hour'),
        fallbackLayerId: 'layer.level0.greybox.atmosphere',
      },
      {
        id: 'layer.level0.master.lighting-foundation.curfew',
        kind: 'lighting-foundation',
        state: 'curfew',
        tiles: createTiles('lighting-curfew'),
        fallbackLayerId: 'layer.level0.greybox.atmosphere',
      },
      ...LEVEL0_LAYOUT_CONTRACT.semanticMaskIds.map((maskId) => ({
        id: `layer.level0.master.semantic.${maskId}`,
        kind: 'semantic-mask' as const,
        maskId,
        tiles: createTiles(`semantic/${maskId.replace(/\./g, '-')}`, 'png'),
        fallbackLayerId: 'layer.level0.greybox.semantic',
      })),
    ],
    anchorMetadata: {
      path: 'environment/level0/t4/anchors.json',
      sha256: SHA256,
      count: LEVEL0_LAYOUT_CONTRACT.anchors.length,
    },
    fallbackProfile: 'level0-greybox',
  },
});

describe('Level0ArtBundle', () => {
  it('validates the reproducible source and scene plan before runtime derivatives exist', () => {
    const bundle = createBundle();
    bundle.art.layers = [];
    bundle.art.budget.measuredTotalBytes = 0;

    expect(
      validateLevel0SourceAndRecipe(bundle.source, bundle.recipe, LEVEL0_LAYOUT_CONTRACT)
    ).toEqual([]);
  });

  it('accepts an aligned unchanged-kit source, recipe, and runtime manifest', () => {
    expect(validateLevel0ArtBundle(createBundle(), LEVEL0_LAYOUT_CONTRACT)).toEqual([]);
  });

  it('rejects projection, layout, source-selection, and entitlement drift', () => {
    const bundle = createBundle();
    bundle.recipe.camera.elevationDegrees = 35;
    bundle.recipe.layout.traversalLoopIds = ['loop.outer'];
    bundle.source.selectedAssets[1]!.sourcePrefix = bundle.source.selectedAssets[0]!.sourcePrefix;
    delete bundle.source.ownership.evidenceReference;

    const errors = validateLevel0ArtBundle(bundle, LEVEL0_LAYOUT_CONTRACT);
    expect(errors).toContain('camera must remain orthographic 45-degree azimuth / 30-degree elevation for 2:1 output');
    expect(errors).toContain('recipe traversal loops drift from the gameplay layout contract');
    expect(errors).toContain(`duplicate selected source prefix: ${bundle.source.selectedAssets[0]!.sourcePrefix}`);
    expect(errors).toContain('exact entitlement cannot be marked verified without an evidence reference');
  });

  it('rejects runtime derivatives when acquisition-specific entitlement is unavailable', () => {
    const bundle = createBundle();
    bundle.source.ownership.exactEntitlementEvidence = 'unavailable';
    delete bundle.source.ownership.evidenceReference;

    expect(validateLevel0ArtBundle(bundle, LEVEL0_LAYOUT_CONTRACT)).toContain(
      'runtime Level 0 derivatives require verified acquisition-specific entitlement'
    );
  });

  it('allows ignored local export evidence without claiming runtime distribution rights', () => {
    const bundle = createBundle();
    bundle.art.usage = 'local-evidence';
    bundle.source.ownership.exactEntitlementEvidence = 'unavailable';
    delete bundle.source.ownership.evidenceReference;
    bundle.source.commitBoundary.permitted = ['recipes', 'manifests', 'metadata', 'validators'];

    expect(validateLevel0ArtBundle(bundle, LEVEL0_LAYOUT_CONTRACT)).toEqual([]);
  });

  it('rejects Blender sensor-fit drift that corrupts declared capture zoom', () => {
    const bundle = createBundle();
    (bundle.recipe.camera as { sensorFit: string }).sensorFit = 'auto';

    expect(
      validateLevel0SourceAndRecipe(bundle.source, bundle.recipe, LEVEL0_LAYOUT_CONTRACT)
    ).toContain('camera sensor fit must remain vertical so declared zoom matches Phaser');
  });

  it('rejects capture framing that drifts from the runtime follow offset', () => {
    const bundle = createBundle();
    bundle.recipe.camera.followOffsetScenePixels = 0;

    expect(
      validateLevel0SourceAndRecipe(bundle.source, bundle.recipe, LEVEL0_LAYOUT_CONTRACT)
    ).toContain('camera framing must preserve the runtime 80-pixel follow offset');
  });

  it('requires an explicit source plane for mounted and below-grade public-realm assets', () => {
    const bundle = createBundle();
    const prop = bundle.source.selectedAssets.find((asset) => asset.category === 'public-realm')!;
    delete prop.normalize.sourceGroundDatumMeters;

    expect(
      validateLevel0SourceAndRecipe(bundle.source, bundle.recipe, LEVEL0_LAYOUT_CONTRACT)
    ).toContain(`selected asset ${prop.id} requires an explicit source ground datum`);
  });

  it('accepts source-kit entrance fixtures aligned to authored entrance anchors', () => {
    const bundle = createBundle();
    const fixture = {
      ...bundle.source.selectedAssets.find((asset) => asset.category === 'public-realm')!,
      id: 'neo-tokyo-entry-fixture',
      sourcePrefix: 'EntryFixture',
      sourceObjectPattern: 'EntryFixture_*',
    };
    bundle.source.selectedAssets.push(fixture);
    const safehouseEntrance = LEVEL0_LAYOUT_CONTRACT.anchors.find(
      (anchor) => anchor.id === 'entrance.safehouse'
    )!;
    bundle.recipe.propPlacements.push({
      id: 'prop.entrance.safehouse.fixture',
      assetId: fixture.id,
      anchorId: 'entrance.safehouse',
      role: 'entrance',
      layoutPosition: { ...safehouseEntrance.position },
      rotationDegrees: 135,
      uniformScale: 1,
    });

    expect(validateLevel0SourceAndRecipe(
      bundle.source,
      bundle.recipe,
      LEVEL0_LAYOUT_CONTRACT
    )).toEqual([]);
  });

  it('rejects missing footprint, entrance, actor-scale, layer, capture, and commit-boundary proof', () => {
    const bundle = createBundle();
    bundle.recipe.buildingPlacements.pop();
    bundle.recipe.propPlacements = bundle.recipe.propPlacements.filter(
      (placement) => placement.anchorId !== 'hide.transit_structure'
    );
    bundle.recipe.entranceProof.pop();
    bundle.recipe.actorScaleProof = bundle.recipe.actorScaleProof.slice(0, 2);
    bundle.recipe.layers = bundle.recipe.layers.filter((layer) => layer.kind !== 'architecture-front');
    bundle.recipe.captures = bundle.recipe.captures.filter((capture) => capture.width !== 1920);
    bundle.source.commitBoundary.prohibited = bundle.source.commitBoundary.prohibited.filter(
      (entry) => entry !== 'generated-blend'
    );

    const errors = validateLevel0ArtBundle(bundle, LEVEL0_LAYOUT_CONTRACT);
    expect(errors).toContain('building placements drift from gameplay-owned footprints');
    expect(errors).toContain('gameplay prop placements must cover hide.transit_structure');
    expect(errors).toContain('entrance proof drifts from gameplay-owned entrances');
    expect(errors).toContain('actor-scale proof must cover safehouse, public, and logistics contexts');
    expect(errors).toContain('recipe requires exactly one architecture-front layer');
    expect(errors).toContain('captures must cover 1920x1080 at default and 0.60 zoom');
    expect(errors).toContain('commit boundary must prohibit generated-blend');
  });

  it('rejects raw source paths and forbidden T5 treatment in T4 outputs', () => {
    const bundle = createBundle();
    bundle.art.layers[0]!.tiles[0]!.imagePath = '../Neo Tokyo 2/obj/Kitbash3d_NeoTokyo2-Native.obj';
    bundle.recipe.lighting.treatment = 'hidzu-surveillance-noir-final';

    const errors = validateLevel0ArtBundle(bundle, LEVEL0_LAYOUT_CONTRACT);
    expect(errors).toContain('art output paths must be normalized flattened derivatives under environment/level0/t4');
    expect(errors).toContain('GET-204 lighting must remain a neutral unchanged-kit foundation');
  });

  it('accepts a validated treatment derivative prefix without changing recipe semantics', () => {
    const bundle = createBundle();
    bundle.art.layers.forEach((layer) => {
      layer.tiles.forEach((tile) => {
        tile.imagePath = tile.imagePath.replace(
          'environment/level0/t4/',
          'environment/level0/t5/'
        );
      });
    });
    bundle.art.anchorMetadata.path = 'environment/level0/t5/anchors.json';

    expect(validateLevel0ArtManifest(
      bundle.art,
      bundle.recipe,
      LEVEL0_LAYOUT_CONTRACT,
      'environment/level0/t5'
    )).toEqual([]);
  });

  it('rejects shifted canvases and swapped runtime layer semantics', () => {
    const bundle = createBundle();
    bundle.art.worldOrigin.x = 1;
    bundle.art.canvas.pixelOrigin.x += 1;
    bundle.art.layers[0]!.kind = 'architecture-back';
    bundle.art.layers[0]!.fallbackLayerId = 'layer.level0.greybox.wrong';

    const errors = validateLevel0ArtBundle(bundle, LEVEL0_LAYOUT_CONTRACT);
    expect(errors).toContain('runtime art world origin drifts from the scene recipe');
    expect(errors).toContain('runtime art canvas drifts from the aligned export contract');
    expect(errors).toContain(`art layer ${bundle.art.layers[0]!.id} drifts from recipe semantics or fallback`);
  });

  it('rejects an aligned canvas that clips the projected Level 0 bounds', () => {
    const bundle = createBundle();
    bundle.recipe.alignedExport.canvas.pixelOrigin.x = 0;
    bundle.art.canvas.pixelOrigin.x = 0;

    expect(validateLevel0ArtBundle(bundle, LEVEL0_LAYOUT_CONTRACT)).toContain(
      'aligned export canvas clips the projected Level 0 layout bounds'
    );
  });

  it('rejects incomplete import calibration and non-reproducible placement transforms', () => {
    const bundle = createBundle();
    bundle.source.geometryMember.sha256 = 'not-a-hash';
    bundle.source.textures.sourceFileCount = 0;
    bundle.source.textures.contentSha256 = 'not-a-hash';
    bundle.source.selectedAssets[0]!.measuredStructuralBoundsMeters.height = 0;
    bundle.source.selectedAssets[0]!.sourceUpAxis = 'Z';
    bundle.source.selectedAssets[0]!.normalize.sourceUnitsPerMeter = 2;
    bundle.recipe.coordinateSystem.origin.x = 1;
    bundle.recipe.buildingPlacements[0]!.uniformScale = 0;

    const errors = validateLevel0ArtBundle(bundle, LEVEL0_LAYOUT_CONTRACT);
    expect(errors).toContain('source geometry member requires a safe relative path, content hash, and byte size');
    expect(errors).toContain('source texture relink requires an external relative path and positive file count');
    expect(errors).toContain('source texture set requires a deterministic content digest');
    expect(errors).toContain(`selected asset ${bundle.source.selectedAssets[0]!.id} requires positive measured structural bounds`);
    expect(errors).toContain(`selected asset ${bundle.source.selectedAssets[0]!.id} drifts from the verified FBX axis or unit scale`);
    expect(errors).toContain('scene recipe origin must remain aligned to the gameplay layout origin');
    expect(errors).toContain(`building placement ${bundle.recipe.buildingPlacements[0]!.id} has invalid reproducible transform`);
  });

  it('rejects miniature, repeated, overflowing, or falsely measured building placements', () => {
    const bundle = createBundle();
    const first = bundle.recipe.buildingPlacements[0]!;
    const firstAsset = bundle.source.selectedAssets.find(
      (asset) => asset.id === first.assetId
    )!;
    first.uniformScale = 0.5;
    bundle.recipe.buildingPlacements[1]!.assetId = first.assetId;
    firstAsset.measuredStructuralBoundsMeters.width = 200;
    first.targetHeightMeters = 999;
    first.footprintFill = 0.99;

    const errors = validateLevel0ArtBundle(bundle, LEVEL0_LAYOUT_CONTRACT);
    expect(errors).toContain(`building placement ${first.id} falls below the 0.75 native-scale floor`);
    expect(errors).toContain(`duplicate building asset placement: ${first.assetId}`);
    expect(errors).toContain(`building placement ${first.id} does not fit its gameplay footprint`);
    expect(errors).toContain(`building placement ${first.id} has drifted derived scale metadata`);
  });

  it('rejects campus-pad treatment and buildings set back from their declared street edge', () => {
    const bundle = createBundle();
    (bundle.recipe.publicRealm as { buildingLotTreatment: string }).buildingLotTreatment = 'full-footprint';
    const first = bundle.recipe.buildingPlacements[0]!;
    first.layoutPosition.y -= 2;

    const errors = validateLevel0ArtBundle(bundle, LEVEL0_LAYOUT_CONTRACT);
    expect(errors).toContain('building lots must follow structure bounds instead of exposing gameplay footprints');
    expect(errors).toContain(`building placement ${first.id} is set back from declared south frontage`);
  });

  it('rejects actor proofs that can regress into unreadable poles', () => {
    const bundle = createBundle();
    bundle.recipe.actorScaleProof[0]!.minimumSilhouetteWidthMeters = 0.2;

    expect(validateLevel0ArtBundle(bundle, LEVEL0_LAYOUT_CONTRACT)).toContain(
      `actor-scale proof ${bundle.recipe.actorScaleProof[0]!.id} is not a readable human silhouette`
    );
  });
});
