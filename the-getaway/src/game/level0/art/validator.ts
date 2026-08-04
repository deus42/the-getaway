import type { Level0LayoutContract, WorldPoint, WorldPolygon } from '../layout/types';
import type {
  Level0ArtManifest,
  Level0ArtBundle,
  Level0ArtLayer,
  Level0ArtLayerKind,
  Level0ArtTile,
  Level0LightingState,
  Level0RecipeLayer,
  Level0SceneRecipe,
  Level0SourceManifest,
} from './types';

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const EPSILON = 0.0001;
const DERIVED_METADATA_TOLERANCE = 0.01;
const MIN_NATIVE_BUILDING_SCALE = 0.75;
const MAX_FRONTAGE_SETBACK_METERS = 1;
const FRONTAGE_EDGES = ['north', 'south', 'east', 'west'] as const;
const REQUIRED_COMMIT_BOUNDARY = ['raw-geometry', 'source-textures', 'generated-blend'];
const REQUIRED_AUTHORED_KINDS = ['road', 'sidewalk', 'crossing', 'alley', 'plaza', 'curb'];
const REQUIRED_LIGHTING_STATES: Level0LightingState[] = ['dusk', 'blue-hour', 'curfew'];
const REQUIRED_CAPTURE_SIZES = [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];
const REQUIRED_EXCLUSIONS = [
  'hidzu-reskin',
  'propaganda',
  'surveillance-noir-grading',
  'raw-asset-commit',
  'decorative-clutter',
];
const REQUIRED_PROP_ANCHORS = [
  'terminal.camera_loop',
  'terminal.cache_locker',
  'terminal.outbound_transit',
  'hide.service_recess',
  'hide.maintenance_bay',
  'hide.transit_structure',
  'blend.delivery_activity',
  'blend.public_queue',
];

const exactSetMatch = (actual: readonly string[], expected: readonly string[]): boolean => {
  if (actual.length !== expected.length) return false;
  const actualSet = new Set(actual);
  return actualSet.size === actual.length && expected.every((entry) => actualSet.has(entry));
};

const duplicateValues = (values: readonly string[]): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  values.forEach((value) => {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });
  return [...duplicates];
};

const pointsEqual = (left: WorldPoint, right: WorldPoint): boolean =>
  Math.abs(left.x - right.x) <= EPSILON && Math.abs(left.y - right.y) <= EPSILON;

const polygonsEqual = (left: WorldPolygon, right: WorldPolygon): boolean =>
  left.length === right.length && left.every((point, index) => {
    const candidate = right[index];
    return candidate !== undefined && pointsEqual(point, candidate);
  });

const polygonBounds = (polygon: WorldPolygon) => {
  const xs = polygon.map((point) => point.x);
  const ys = polygon.map((point) => point.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
};

const layoutFitsAlignedCanvas = (
  recipe: Level0SceneRecipe,
  layout: Level0LayoutContract
): boolean => {
  const { canvas } = recipe.alignedExport;
  const halfTileWidth = recipe.camera.tileWidth / 2;
  const halfTileHeight = recipe.camera.tileHeight / 2;
  return layout.bounds.every((point) => {
    const x = (point.x - point.y) * halfTileWidth + canvas.pixelOrigin.x;
    const y = (point.x + point.y) * halfTileHeight + canvas.pixelOrigin.y;
    return x >= -EPSILON && x <= canvas.width + EPSILON &&
      y >= -EPSILON && y <= canvas.height + EPSILON;
  });
};

const normalizedDerivativePath = (value: string, derivativePrefix: string): boolean => {
  if (!value.startsWith(`${derivativePrefix}/`)) return false;
  if (value.startsWith('/') || value.includes('\\') || value.split('/').includes('..')) return false;
  return /\.(?:png|webp|json)$/.test(value) && !/\.(?:obj|fbx|mtl|blend\d*)$/i.test(value);
};

const countRecipeLayers = (
  layers: readonly Level0RecipeLayer[],
  kind: Level0ArtLayerKind,
  state?: Level0LightingState
): number => layers.filter((layer) => layer.kind === kind && layer.state === state).length;

const countArtLayers = (
  layers: readonly Level0ArtLayer[],
  kind: Level0ArtLayerKind,
  state?: Level0LightingState
): number => layers.filter((layer) => layer.kind === kind && layer.state === state).length;

const validateLayerCounts = (
  layers: readonly Level0RecipeLayer[] | readonly Level0ArtLayer[],
  count: typeof countRecipeLayers | typeof countArtLayers,
  prefix: 'recipe' | 'art',
  errors: string[]
): void => {
  (['ground', 'architecture-back', 'architecture-front'] as const).forEach((kind) => {
    if (count(layers as never, kind) !== 1) {
      errors.push(`${prefix} requires exactly one ${kind} layer`);
    }
  });
  REQUIRED_LIGHTING_STATES.forEach((state) => {
    if (count(layers as never, 'lighting-foundation', state) !== 1) {
      errors.push(`${prefix} requires exactly one ${state} lighting-foundation layer`);
    }
  });
};

const validateTileGrid = (
  tiles: readonly Level0ArtTile[],
  art: Level0ArtManifest,
  layerId: string,
  errors: string[]
): void => {
  const { canvas } = art;
  if (tiles.length !== canvas.columns * canvas.rows) {
    errors.push(`art layer ${layerId} does not cover the declared tile grid`);
    return;
  }

  const expectedCells = new Set<string>();
  for (let row = 0; row < canvas.rows; row += 1) {
    for (let column = 0; column < canvas.columns; column += 1) {
      expectedCells.add(`${column}:${row}`);
    }
  }

  tiles.forEach((tile) => {
    const cell = `${tile.column}:${tile.row}`;
    expectedCells.delete(cell);
    const expectedX = tile.column * canvas.tileSize;
    const expectedY = tile.row * canvas.tileSize;
    const expectedWidth = Math.min(canvas.tileSize, canvas.width - expectedX);
    const expectedHeight = Math.min(canvas.tileSize, canvas.height - expectedY);
    if (
      tile.x !== expectedX ||
      tile.y !== expectedY ||
      tile.width !== expectedWidth ||
      tile.height !== expectedHeight ||
      tile.width <= 0 ||
      tile.height <= 0
    ) {
      errors.push(`art tile ${tile.id} is not registered to the declared canvas grid`);
    }
    if (!SHA256_PATTERN.test(tile.sha256) || tile.byteSize <= 0) {
      errors.push(`art tile ${tile.id} requires a content hash and positive byte size`);
    }
    if (tile.byteSize > art.budget.maxTileBytes) {
      errors.push(`art tile ${tile.id} exceeds the per-tile byte budget`);
    }
  });

  if (expectedCells.size > 0 || new Set(tiles.map((tile) => `${tile.column}:${tile.row}`)).size !== tiles.length) {
    errors.push(`art layer ${layerId} does not cover the declared tile grid`);
  }
};

export const validateLevel0SourceAndRecipe = (
  source: Level0SourceManifest,
  recipe: Level0SceneRecipe,
  layout: Level0LayoutContract
): string[] => {
  const errors: string[] = [];

  if (source.schemaVersion !== 1 || source.ticket !== 'GET-204') {
    errors.push('source manifest must use GET-204 schema version 1');
  }
  if (
    source.vendor !== 'KitBash3D' ||
    source.kit !== 'Neo Tokyo 2' ||
    source.format !== 'FBX' ||
    source.sourceRootVariable !== 'GETAWAY_NEO_TOKYO_ROOT'
  ) {
    errors.push('source manifest must identify the approved external Neo Tokyo 2 FBX source');
  }
  if (
    source.archiveRelativePath.startsWith('/') ||
    source.archiveRelativePath.includes('\\') ||
    source.archiveRelativePath.split('/').includes('..')
  ) {
    errors.push('source archive path must remain relative to the approved external root');
  }
  if (!SHA256_PATTERN.test(source.archiveSha256) || source.sourceObjectCount <= 0) {
    errors.push('source manifest requires archive content hash and object count');
  }
  if (source.archiveBytes <= 0) {
    errors.push('source manifest requires the exact archive byte size');
  }
  if (
    source.geometryMember.path.startsWith('/') ||
    source.geometryMember.path.includes('\\') ||
    source.geometryMember.path.split('/').includes('..') ||
    !SHA256_PATTERN.test(source.geometryMember.sha256) ||
    source.geometryMember.byteSize <= 0
  ) {
    errors.push('source geometry member requires a safe relative path, content hash, and byte size');
  }
  if (
    source.geometryMember.importer !== 'bpy.ops.import_scene.fbx' ||
    source.geometryMember.globalScale !== 1 ||
    source.geometryMember.axisForward !== '-Z' ||
    source.geometryMember.axisUp !== 'Y'
  ) {
    errors.push('source geometry import calibration drifts from the verified Blender FBX trial');
  }
  if (
    source.textures.sourceRelativePath.startsWith('/') ||
    source.textures.sourceRelativePath.includes('\\') ||
    source.textures.sourceRelativePath.split('/').includes('..') ||
    source.textures.sourceFileCount <= 0 ||
    source.textures.relinkDirectory !== 'KB3DTextures'
  ) {
    errors.push('source texture relink requires an external relative path and positive file count');
  }
  if (!SHA256_PATTERN.test(source.textures.contentSha256)) {
    errors.push('source texture set requires a deterministic content digest');
  }
  if (
    source.ownership.exactEntitlementEvidence === 'verified' &&
    !source.ownership.evidenceReference
  ) {
    errors.push('exact entitlement cannot be marked verified without an evidence reference');
  }
  REQUIRED_COMMIT_BOUNDARY.forEach((entry) => {
    if (!source.commitBoundary.prohibited.includes(entry)) {
      errors.push(`commit boundary must prohibit ${entry}`);
    }
  });
  duplicateValues(source.selectedAssets.map((asset) => asset.id)).forEach((id) => {
    errors.push(`duplicate selected asset id: ${id}`);
  });
  duplicateValues(source.selectedAssets.map((asset) => asset.sourcePrefix)).forEach((prefix) => {
    errors.push(`duplicate selected source prefix: ${prefix}`);
  });
  source.selectedAssets.forEach((asset) => {
    if (asset.sourceUpAxis !== 'Y' || asset.normalize.sourceUnitsPerMeter !== 1) {
      errors.push(`selected asset ${asset.id} drifts from the verified FBX axis or unit scale`);
    }
    if (
      asset.normalize.sourceUnitsPerMeter <= 0 ||
      asset.normalize.center !== 'measured-ground-bounds-center'
    ) {
      errors.push(`selected asset ${asset.id} requires measured coordinate normalization`);
    }
    if (
      asset.category !== 'public-realm' &&
      asset.normalize.groundContact !== 'measured-bounds-min-z'
    ) {
      errors.push(`selected building asset ${asset.id} requires measured ground contact`);
    }
    if (
      asset.category === 'public-realm' &&
      asset.normalize.groundContact !== 'source-catalog-plane'
    ) {
      errors.push(`selected public-realm asset ${asset.id} must preserve the source catalog plane`);
    }
    if (
      asset.normalize.groundContact === 'source-catalog-plane' &&
      !Number.isFinite(asset.normalize.sourceGroundDatumMeters)
    ) {
      errors.push(`selected asset ${asset.id} requires an explicit source ground datum`);
    }
    if (
      asset.measuredStructuralBoundsMeters.width <= 0 ||
      asset.measuredStructuralBoundsMeters.depth <= 0 ||
      asset.measuredStructuralBoundsMeters.height <= 0
    ) {
      errors.push(`selected asset ${asset.id} requires positive measured structural bounds`);
    }
    ['StoneFloor', 'Asphalt', 'Grass', 'TileDamage'].forEach((suffix) => {
      if (!asset.excludedObjectSuffixes.includes(suffix)) {
        errors.push(`selected asset ${asset.id} must exclude source base suffix ${suffix}`);
      }
    });
  });

  if (
    recipe.schemaVersion !== 1 ||
    recipe.ticket !== 'GET-204' ||
    recipe.phase !== 'unchanged-kit-composition'
  ) {
    errors.push('scene recipe must remain the GET-204 unchanged-kit composition');
  }
  if (
    recipe.coordinateSystem.origin.x !== 0 ||
    recipe.coordinateSystem.origin.y !== 0 ||
    recipe.coordinateSystem.origin.z !== 0
  ) {
    errors.push('scene recipe origin must remain aligned to the gameplay layout origin');
  }
  if (
    recipe.layout.contractId !== layout.id ||
    recipe.layout.schemaVersion !== layout.schemaVersion ||
    !polygonsEqual(recipe.layout.bounds, layout.bounds) ||
    !SHA256_PATTERN.test(recipe.layout.contractSha256)
  ) {
    errors.push('scene recipe drifts from the gameplay layout identity, bounds, or hash');
  }
  if (!exactSetMatch(recipe.layout.traversalLoopIds, layout.traversalLoops.map((loop) => loop.id))) {
    errors.push('recipe traversal loops drift from the gameplay layout contract');
  }
  if (!exactSetMatch(recipe.layout.buildingFootprintIds, layout.buildingFootprints.map((building) => building.id))) {
    errors.push('recipe building footprints drift from the gameplay layout contract');
  }
  if (!exactSetMatch(recipe.layout.entranceIds, layout.entrances.map((entrance) => entrance.id))) {
    errors.push('recipe entrances drift from the gameplay layout contract');
  }
  if (!exactSetMatch(recipe.layout.anchorIds, layout.anchors.map((anchor) => anchor.id))) {
    errors.push('recipe anchors drift from the gameplay layout contract');
  }
  if (!exactSetMatch(recipe.layout.semanticMaskIds, layout.semanticMaskIds)) {
    errors.push('recipe semantic masks drift from the gameplay layout contract');
  }
  if (
    recipe.camera.type !== 'orthographic' ||
    recipe.camera.azimuthDegrees !== 45 ||
    recipe.camera.elevationDegrees !== 30
  ) {
    errors.push('camera must remain orthographic 45-degree azimuth / 30-degree elevation for 2:1 output');
  }
  if (recipe.camera.sensorFit !== 'vertical') {
    errors.push('camera sensor fit must remain vertical so declared zoom matches Phaser');
  }
  if (recipe.camera.followOffsetScenePixels !== 80) {
    errors.push('camera framing must preserve the runtime 80-pixel follow offset');
  }
  if (
    recipe.camera.tileWidth !== 64 ||
    recipe.camera.tileHeight !== 32 ||
    recipe.camera.minimumZoom !== 0.6 ||
    recipe.camera.defaultZoom < recipe.camera.minimumZoom
  ) {
    errors.push('camera scale must preserve 64x32 projection, 0.60 floor, and valid default zoom');
  }
  if (!Number.isFinite(recipe.coordinateSystem.layoutUnitMeters) || recipe.coordinateSystem.layoutUnitMeters <= 0) {
    errors.push('scene recipe requires a positive layout-unit meter scale');
  }
  if (
    recipe.lighting.direction !== 'upper-left' ||
    !exactSetMatch(recipe.lighting.states, REQUIRED_LIGHTING_STATES)
  ) {
    errors.push('lighting must provide aligned dusk, blue-hour, and curfew states from upper-left');
  }
  if (recipe.lighting.treatment !== 'neutral-unchanged-kit-foundation') {
    errors.push('GET-204 lighting must remain a neutral unchanged-kit foundation');
  }
  if (!exactSetMatch(recipe.publicRealm.surfaceIds, layout.surfaces.map((surface) => surface.id))) {
    errors.push('public-realm surfaces drift from the gameplay layout contract');
  }
  REQUIRED_AUTHORED_KINDS.forEach((kind) => {
    if (!recipe.publicRealm.authoredKinds.includes(kind)) {
      errors.push(`public realm must author ${kind}`);
    }
  });
  if (recipe.publicRealm.buildingLotTreatment !== 'structure-bounds') {
    errors.push('building lots must follow structure bounds instead of exposing gameplay footprints');
  }
  if (!exactSetMatch(recipe.buildingPlacements.map((placement) => placement.footprintId), layout.buildingFootprints.map((footprint) => footprint.id))) {
    errors.push('building placements drift from gameplay-owned footprints');
  }
  const selectedAssetIds = new Set(source.selectedAssets.map((asset) => asset.id));
  const selectedBuildingAssetIds = source.selectedAssets
    .filter((asset) => asset.category !== 'public-realm')
    .map((asset) => asset.id);
  if (!exactSetMatch(
    recipe.buildingPlacements.map((placement) => placement.assetId),
    selectedBuildingAssetIds
  )) {
    errors.push('selected building assets drift from recipe placements');
  }
  duplicateValues(recipe.buildingPlacements.map((placement) => placement.assetId)).forEach((id) => {
    errors.push(`duplicate building asset placement: ${id}`);
  });
  recipe.buildingPlacements.forEach((placement) => {
    const asset = source.selectedAssets.find((candidate) => candidate.id === placement.assetId);
    const footprint = layout.buildingFootprints.find(
      (candidate) => candidate.id === placement.footprintId
    );
    if (!selectedAssetIds.has(placement.assetId) || !asset || asset.category === 'public-realm') {
      errors.push(`building placement ${placement.id} references an unselected asset`);
    }
    if (
      placement.footprintFill <= 0 ||
      placement.footprintFill > 1 ||
      placement.targetHeightMeters <= 0
    ) {
      errors.push(`building placement ${placement.id} has invalid scale targets`);
    }
    if (placement.uniformScale < MIN_NATIVE_BUILDING_SCALE) {
      errors.push(
        `building placement ${placement.id} falls below the ${MIN_NATIVE_BUILDING_SCALE} native-scale floor`
      );
    }
    if (
      placement.frontageEdges.length === 0 ||
      new Set(placement.frontageEdges).size !== placement.frontageEdges.length ||
      placement.frontageEdges.some((edge) => !FRONTAGE_EDGES.includes(edge))
    ) {
      errors.push(`building placement ${placement.id} requires unique declared frontage edges`);
    }
    if (
      placement.uniformScale <= 0 ||
      placement.uniformScale > 1.25 ||
      !Number.isFinite(placement.rotationDegrees) ||
      !Number.isFinite(placement.layoutPosition.x) ||
      !Number.isFinite(placement.layoutPosition.y)
    ) {
      errors.push(`building placement ${placement.id} has invalid reproducible transform`);
    }
    if (
      asset &&
      asset.category !== 'public-realm' &&
      footprint &&
      placement.uniformScale > 0 &&
      Number.isFinite(placement.rotationDegrees) &&
      recipe.coordinateSystem.layoutUnitMeters > 0
    ) {
      const radians = placement.rotationDegrees * Math.PI / 180;
      const cosine = Math.abs(Math.cos(radians));
      const sine = Math.abs(Math.sin(radians));
      const transformedWidth = (
        asset.measuredStructuralBoundsMeters.width * cosine +
        asset.measuredStructuralBoundsMeters.depth * sine
      ) * placement.uniformScale;
      const transformedDepth = (
        asset.measuredStructuralBoundsMeters.width * sine +
        asset.measuredStructuralBoundsMeters.depth * cosine
      ) * placement.uniformScale;
      const layoutUnitMeters = recipe.coordinateSystem.layoutUnitMeters;
      const footprintExtents = polygonBounds(footprint.polygon);
      const footprintMeters = {
        minX: footprintExtents.minX * layoutUnitMeters,
        maxX: footprintExtents.maxX * layoutUnitMeters,
        minY: footprintExtents.minY * layoutUnitMeters,
        maxY: footprintExtents.maxY * layoutUnitMeters,
      };
      const centerMeters = {
        x: placement.layoutPosition.x * layoutUnitMeters,
        y: placement.layoutPosition.y * layoutUnitMeters,
      };
      if (
        centerMeters.x - transformedWidth / 2 < footprintMeters.minX - EPSILON ||
        centerMeters.x + transformedWidth / 2 > footprintMeters.maxX + EPSILON ||
        centerMeters.y - transformedDepth / 2 < footprintMeters.minY - EPSILON ||
        centerMeters.y + transformedDepth / 2 > footprintMeters.maxY + EPSILON
      ) {
        errors.push(`building placement ${placement.id} does not fit its gameplay footprint`);
      }

      const transformedBounds = {
        minX: centerMeters.x - transformedWidth / 2,
        maxX: centerMeters.x + transformedWidth / 2,
        minY: centerMeters.y - transformedDepth / 2,
        maxY: centerMeters.y + transformedDepth / 2,
      };
      const setbackByEdge = {
        north: transformedBounds.minY - footprintMeters.minY,
        south: footprintMeters.maxY - transformedBounds.maxY,
        west: transformedBounds.minX - footprintMeters.minX,
        east: footprintMeters.maxX - transformedBounds.maxX,
      };
      placement.frontageEdges.forEach((edge) => {
        if (
          FRONTAGE_EDGES.includes(edge) &&
          setbackByEdge[edge] > MAX_FRONTAGE_SETBACK_METERS + EPSILON
        ) {
          errors.push(`building placement ${placement.id} is set back from declared ${edge} frontage`);
        }
      });

      const footprintArea =
        (footprintMeters.maxX - footprintMeters.minX) *
        (footprintMeters.maxY - footprintMeters.minY);
      const derivedHeight = asset.measuredStructuralBoundsMeters.height * placement.uniformScale;
      const derivedFill = transformedWidth * transformedDepth / footprintArea;
      if (
        Math.abs(placement.targetHeightMeters - derivedHeight) > DERIVED_METADATA_TOLERANCE ||
        Math.abs(placement.footprintFill - derivedFill) > DERIVED_METADATA_TOLERANCE
      ) {
        errors.push(`building placement ${placement.id} has drifted derived scale metadata`);
      }
    }
  });
  const propAnchors = new Set(recipe.propPlacements.map((placement) => placement.anchorId));
  REQUIRED_PROP_ANCHORS.forEach((anchorId) => {
    if (!propAnchors.has(anchorId)) {
      errors.push(`gameplay prop placements must cover ${anchorId}`);
    }
  });
  duplicateValues(recipe.propPlacements.map((placement) => placement.id)).forEach((id) => {
    errors.push(`duplicate gameplay prop placement id: ${id}`);
  });
  recipe.propPlacements.forEach((placement) => {
    const anchor = layout.anchors.find((candidate) => candidate.id === placement.anchorId);
    const asset = source.selectedAssets.find((candidate) => candidate.id === placement.assetId);
    if (
      !anchor ||
      !['terminal', 'hiding', 'blending', 'entrance'].includes(anchor.kind) ||
      anchor.kind !== placement.role
    ) {
      errors.push(`gameplay prop placement ${placement.id} references an incompatible anchor`);
    }
    if (!asset || asset.category !== 'public-realm') {
      errors.push(`gameplay prop placement ${placement.id} references an unselected public-realm asset`);
    }
    if (
      !anchor ||
      Math.hypot(
        placement.layoutPosition.x - anchor.position.x,
        placement.layoutPosition.y - anchor.position.y
      ) > anchor.radius + 0.5 ||
      placement.uniformScale <= 0 ||
      placement.uniformScale > 1.5 ||
      !Number.isFinite(placement.rotationDegrees) ||
      (placement.mountLiftMeters !== undefined &&
        (!Number.isFinite(placement.mountLiftMeters) || placement.mountLiftMeters < 0))
    ) {
      errors.push(`gameplay prop placement ${placement.id} has an invalid anchor-aligned transform`);
    }
  });
  if (!exactSetMatch(recipe.entranceProof.map((proof) => proof.entranceId), layout.entrances.map((entrance) => entrance.id))) {
    errors.push('entrance proof drifts from gameplay-owned entrances');
  }
  recipe.entranceProof.forEach((proof) => {
    const entrance = layout.entrances.find((candidate) => candidate.id === proof.entranceId);
    if (
      !entrance ||
      entrance.buildingId !== proof.buildingId ||
      !pointsEqual(entrance.position, proof.position) ||
      proof.minimumClearWidthMeters < 1.8
    ) {
      errors.push(`entrance proof ${proof.entranceId} is not aligned or human-scale`);
    }
  });
  const actorContexts = new Set(recipe.actorScaleProof.map((proof) => proof.anchorId));
  if (
    recipe.actorScaleProof.length < 3 ||
    !actorContexts.has('safehouse.spawn') ||
    !actorContexts.has('contact.lira') ||
    !actorContexts.has('entrance.logistics.public')
  ) {
    errors.push('actor-scale proof must cover safehouse, public, and logistics contexts');
  }
  recipe.actorScaleProof.forEach((proof) => {
    if (!layout.anchors.some((anchor) => anchor.id === proof.anchorId) || proof.heightMeters < 1.6 || proof.heightMeters > 2.1) {
      errors.push(`actor-scale proof ${proof.id} is not aligned to a plausible human anchor`);
    }
    if (
      proof.minimumSilhouetteWidthMeters < 0.5 ||
      proof.minimumSilhouetteWidthMeters > proof.heightMeters * 0.5
    ) {
      errors.push(`actor-scale proof ${proof.id} is not a readable human silhouette`);
    }
  });
  if (
    recipe.alignedExport.canvas.width <= 0 ||
    recipe.alignedExport.canvas.height <= 0 ||
    recipe.alignedExport.canvas.tileSize <= 0 ||
    !Number.isFinite(recipe.alignedExport.canvas.pixelOrigin.x) ||
    !Number.isFinite(recipe.alignedExport.canvas.pixelOrigin.y) ||
    recipe.alignedExport.budget.maxTotalBytes <= 0 ||
    recipe.alignedExport.budget.maxTileBytes <= 0 ||
    recipe.alignedExport.fallbackProfile !== 'level0-greybox'
  ) {
    errors.push('aligned export contract requires a valid canvas, budget, and greybox fallback');
  }
  if (!layoutFitsAlignedCanvas(recipe, layout)) {
    errors.push('aligned export canvas clips the projected Level 0 layout bounds');
  }

  validateLayerCounts(recipe.layers, countRecipeLayers, 'recipe', errors);
  REQUIRED_EXCLUSIONS.forEach((entry) => {
    if (!recipe.exclusions.includes(entry)) errors.push(`GET-204 recipe must exclude ${entry}`);
  });
  layout.semanticMaskIds.forEach((maskId) => {
    if (recipe.layers.filter((layer) => layer.kind === 'semantic-mask' && layer.maskId === maskId).length !== 1) {
      errors.push(`recipe requires exactly one semantic layer for ${maskId}`);
    }
  });
  REQUIRED_CAPTURE_SIZES.forEach(({ width, height }) => {
    const defaultCapture = recipe.captures.some(
      (capture) => capture.width === width && capture.height === height && capture.framing === 'default'
    );
    const minimumCapture = recipe.captures.some(
      (capture) => capture.width === width && capture.height === height && capture.framing === 'minimum' && capture.zoom === 0.6
    );
    if (!defaultCapture || !minimumCapture) {
      errors.push(`captures must cover ${width}x${height} at default and 0.60 zoom`);
    }
  });
  recipe.captures.forEach((capture) => {
    if (!layout.anchors.some((anchor) => anchor.id === capture.targetAnchorId)) {
      errors.push(`capture ${capture.id} references an unknown framing anchor`);
    }
  });

  return [...new Set(errors)];
};

export const validateLevel0ArtManifest = (
  art: Level0ArtManifest,
  recipe: Level0SceneRecipe,
  layout: Level0LayoutContract,
  derivativePrefix = 'environment/level0/t4'
): string[] => {
  const errors: string[] = [];

  if (
    art.schemaVersion !== 1 ||
    !['local-evidence', 'runtime'].includes(art.usage) ||
    art.recipeId !== recipe.id ||
    art.layoutContractId !== layout.id ||
    art.projection.tileWidth !== 64 ||
    art.projection.tileHeight !== 32 ||
    art.projection.orientation !== 'isometric-2:1'
  ) {
    errors.push('runtime art manifest drifts from recipe, layout, or projection');
  }
  if (
    art.canvas.width <= 0 ||
    art.canvas.height <= 0 ||
    art.canvas.tileSize <= 0 ||
    art.canvas.columns !== Math.ceil(art.canvas.width / art.canvas.tileSize) ||
    art.canvas.rows !== Math.ceil(art.canvas.height / art.canvas.tileSize)
  ) {
    errors.push('runtime art canvas and tile grid are inconsistent');
  }
  if (!pointsEqual(art.worldOrigin, recipe.coordinateSystem.origin)) {
    errors.push('runtime art world origin drifts from the scene recipe');
  }
  const exportCanvas = recipe.alignedExport.canvas;
  if (
    art.canvas.width !== exportCanvas.width ||
    art.canvas.height !== exportCanvas.height ||
    art.canvas.tileSize !== exportCanvas.tileSize ||
    !pointsEqual(art.canvas.pixelOrigin, exportCanvas.pixelOrigin) ||
    art.canvas.columns !== Math.ceil(exportCanvas.width / exportCanvas.tileSize) ||
    art.canvas.rows !== Math.ceil(exportCanvas.height / exportCanvas.tileSize)
  ) {
    errors.push('runtime art canvas drifts from the aligned export contract');
  }
  if (
    art.budget.maxTotalBytes <= 0 ||
    art.budget.maxTileBytes <= 0 ||
    art.budget.measuredTotalBytes <= 0 ||
    art.budget.measuredTotalBytes > art.budget.maxTotalBytes
  ) {
    errors.push('runtime art byte budget is missing or exceeded');
  }
  if (
    art.budget.maxTotalBytes !== recipe.alignedExport.budget.maxTotalBytes ||
    art.budget.maxTileBytes !== recipe.alignedExport.budget.maxTileBytes
  ) {
    errors.push('runtime art byte budget drifts from the aligned export contract');
  }
  validateLayerCounts(art.layers, countArtLayers, 'art', errors);
  layout.semanticMaskIds.forEach((maskId) => {
    if (art.layers.filter((layer) => layer.kind === 'semantic-mask' && layer.maskId === maskId).length !== 1) {
      errors.push(`art manifest requires exactly one semantic layer for ${maskId}`);
    }
  });
  if (!exactSetMatch(art.layers.map((layer) => layer.id), recipe.layers.map((layer) => layer.id))) {
    errors.push('runtime art layers drift from the deterministic scene recipe');
  }
  art.layers.forEach((layer) => {
    const recipeLayer = recipe.layers.find((candidate) => candidate.id === layer.id);
    if (
      !recipeLayer ||
      layer.kind !== recipeLayer.kind ||
      layer.state !== recipeLayer.state ||
      layer.maskId !== recipeLayer.maskId ||
      layer.fallbackLayerId !== recipeLayer.fallbackLayerId
    ) {
      errors.push(`art layer ${layer.id} drifts from recipe semantics or fallback`);
    }
  });
  duplicateValues(art.layers.map((layer) => layer.id)).forEach((id) => {
    errors.push(`duplicate art layer id: ${id}`);
  });
  const allTiles = art.layers.flatMap((layer) => layer.tiles);
  duplicateValues(allTiles.map((tile) => tile.id)).forEach((id) => {
    errors.push(`duplicate art tile id: ${id}`);
  });
  art.layers.forEach((layer) => {
    validateTileGrid(layer.tiles, art, layer.id, errors);
    layer.tiles.forEach((tile) => {
      if (!normalizedDerivativePath(tile.imagePath, derivativePrefix)) {
        errors.push(`art output paths must be normalized flattened derivatives under ${derivativePrefix}`);
      }
    });
  });
  const measuredTileBytes = allTiles.reduce((sum, tile) => sum + tile.byteSize, 0);
  if (measuredTileBytes !== art.budget.measuredTotalBytes) {
    errors.push('runtime art measured byte total drifts from tile metadata');
  }
  if (
    !normalizedDerivativePath(art.anchorMetadata.path, derivativePrefix) ||
    !SHA256_PATTERN.test(art.anchorMetadata.sha256) ||
    art.anchorMetadata.count !== layout.anchors.length
  ) {
    errors.push('anchor metadata path, hash, or count drifts from the gameplay contract');
  }
  if (art.fallbackProfile !== recipe.alignedExport.fallbackProfile) {
    errors.push('runtime art manifest must retain the Level 0 greybox fallback');
  }

  return [...new Set(errors)];
};

export const validateLevel0ArtBundle = (
  bundle: Level0ArtBundle,
  layout: Level0LayoutContract
): string[] => {
  const errors = [
    ...validateLevel0SourceAndRecipe(bundle.source, bundle.recipe, layout),
    ...validateLevel0ArtManifest(bundle.art, bundle.recipe, layout),
  ];
  if (
    bundle.art.usage === 'runtime' &&
    (
    bundle.source.ownership.exactEntitlementEvidence !== 'verified' ||
    !bundle.source.ownership.evidenceReference ||
    !bundle.source.commitBoundary.permitted.includes('flattened-derivatives')
    )
  ) {
    errors.push('runtime Level 0 derivatives require verified acquisition-specific entitlement');
  }
  return [...new Set(errors)];
};
