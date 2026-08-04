import type { Level0LayoutContract } from '../layout/types';
import type { Level0SceneRecipe } from './types';
import type {
  Level0HidzuGrammarEntry,
  Level0HidzuGrammarKind,
  Level0HidzuTreatmentBundle,
  Level0HidzuTreatmentManifest,
} from './hidzuTypes';

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const HEX_COLOR_PATTERN = /^#[a-f0-9]{6}$/i;

const REQUIRED_PALETTE = new Map([
  ['ink', { role: 'surface', hex: '#0b0d12' }],
  ['bone', { role: 'neutral-information', hex: '#d5c8b5' }],
  ['bruised-umber', { role: 'surface', hex: '#513b35' }],
  ['muted-teal', { role: 'neutral-information', hex: '#5b7775' }],
  ['sodium-amber', { role: 'practical-light', hex: '#d99a50' }],
  ['technology-cyan', { role: 'active-technology', hex: '#50bfd0' }],
  ['threat-crimson', { role: 'confirmed-danger', hex: '#8e4147' }],
] as const);

const REQUIRED_GRAMMAR_KINDS: readonly Level0HidzuGrammarKind[] = [
  'camera',
  'terminal',
  'identity-checkpoint',
  'public-screen',
  'controlled-entrance',
  'transit-wayfinding',
  'service-wayfinding',
  'hiding-context',
  'blending-context',
  'threat-hook',
];

const REQUIRED_GRAMMAR_IDENTITIES: ReadonlyMap<string, {
  kind: Level0HidzuGrammarKind;
  semanticRole: Level0HidzuGrammarEntry['semanticRole'];
  colorTokenId: string;
  silhouette: string;
  glyph: string;
  nonColorCues: readonly string[];
}> = new Map([
  ['hidzu.camera', {
    kind: 'camera',
    semanticRole: 'active-technology',
    colorTokenId: 'technology-cyan',
    silhouette: 'hooded-lens',
    glyph: 'ring-connection',
    nonColorCues: ['directional-lens', 'connection-ring'],
  }],
  ['hidzu.terminal', {
    kind: 'terminal',
    semanticRole: 'active-technology',
    colorTokenId: 'technology-cyan',
    silhouette: 'waist-high-console',
    glyph: 'ring-connection',
    nonColorCues: ['screen-frame', 'connection-ring'],
  }],
  ['hidzu.identity-frame', {
    kind: 'identity-checkpoint',
    semanticRole: 'caution',
    colorTokenId: 'sodium-amber',
    silhouette: 'twin-post-frame',
    glyph: 'single-chevron',
    nonColorCues: ['twin-post-frame', 'single-chevron'],
  }],
  ['hidzu.public-screen', {
    kind: 'public-screen',
    semanticRole: 'neutral-information',
    colorTokenId: 'muted-teal',
    silhouette: 'landscape-panel',
    glyph: 'horizontal-rule',
    nonColorCues: ['landscape-panel', 'horizontal-rule'],
  }],
  ['hidzu.controlled-entrance', {
    kind: 'controlled-entrance',
    semanticRole: 'caution',
    colorTokenId: 'sodium-amber',
    silhouette: 'bracketed-threshold',
    glyph: 'single-chevron',
    nonColorCues: ['bracketed-threshold', 'single-chevron'],
  }],
  ['hidzu.transit-wayfinding', {
    kind: 'transit-wayfinding',
    semanticRole: 'neutral-information',
    colorTokenId: 'bone',
    silhouette: 'low-direction-plinth',
    glyph: 'split-arrow',
    nonColorCues: ['low-direction-plinth', 'split-arrow'],
  }],
  ['hidzu.service-wayfinding', {
    kind: 'service-wayfinding',
    semanticRole: 'neutral-information',
    colorTokenId: 'muted-teal',
    silhouette: 'vertical-service-marker',
    glyph: 'bar-code-stripes',
    nonColorCues: ['vertical-service-marker', 'bar-code-stripes'],
  }],
  ['hidzu.hiding-context', {
    kind: 'hiding-context',
    semanticRole: 'surface',
    colorTokenId: 'ink',
    silhouette: 'recessed-service-bay',
    glyph: 'deep-shadow-notch',
    nonColorCues: ['recessed-service-bay', 'deep-shadow-notch'],
  }],
  ['hidzu.blending-context', {
    kind: 'blending-context',
    semanticRole: 'neutral-information',
    colorTokenId: 'bone',
    silhouette: 'queue-rail',
    glyph: 'parallel-floor-bars',
    nonColorCues: ['queue-rail', 'parallel-floor-bars'],
  }],
  ['hidzu.threat-hook', {
    kind: 'threat-hook',
    semanticRole: 'confirmed-danger',
    colorTokenId: 'threat-crimson',
    silhouette: 'solid-alarm-block',
    glyph: 'double-chevron',
    nonColorCues: ['solid-alarm-block', 'double-chevron'],
  }],
] as const);

const GRAMMAR_KIND_BY_ADDITION_KIND = new Map<
  Level0HidzuTreatmentManifest['additions'][number]['kind'],
  Level0HidzuGrammarKind
>([
  ['camera-fixture', 'camera'],
  ['terminal-marker', 'terminal'],
  ['identity-frame', 'identity-checkpoint'],
  ['public-screen', 'public-screen'],
  ['controlled-entrance', 'controlled-entrance'],
  ['transit-wayfinding', 'transit-wayfinding'],
  ['service-wayfinding', 'service-wayfinding'],
  ['hiding-structure', 'hiding-context'],
  ['blending-context', 'blending-context'],
  ['threat-hook', 'threat-hook'],
]);

const REQUIRED_VALUE_HIERARCHY = [
  'objective-action',
  'actor-placeholder',
  'observation-threat',
  'entrance-traversal',
  'architecture',
  'atmosphere',
] as const;

const REQUIRED_RUBRIC = [
  'readable-midtones',
  'cold-institutional-surfaces',
  'motivated-sodium-practicals',
  'scarce-technology-cyan',
  'crimson-only-confirmed-danger',
  'repeated-hidzu-surveillance-grammar',
  'human-scale-traversal-readability',
] as const;

const REQUIRED_REJECTIONS = [
  'generic-neon-cyberpunk',
  'fantasy-ornament',
  'crushed-blacks',
  'broad-glow',
  'decorative-clutter',
  'geometry-drift',
  'hidden-fact-leakage',
] as const;

const REQUIRED_MESSAGE_THEMES: readonly Level0HidzuTreatmentManifest['publicMessageTemplates'][number]['theme'][] = [
  'safety',
  'efficiency',
  'transit',
  'identity-continuity',
  'civic-sentiment',
  'suppression',
  'controlled-access',
];

const REQUIRED_CAPTURE_IDS = [
  '1280x720-default',
  '1280x720-minimum',
  '1440x900-default',
  '1440x900-minimum',
  '1920x1080-default',
  '1920x1080-minimum',
  'proof.safehouse',
  'proof.dusk-street',
  'proof.lira',
  'proof.naila',
  'proof.brant',
  'proof.public-route',
  'proof.curfew-route',
  'proof.camera-terminal',
  'proof.cache-manifest',
  'proof.suspicious-hook',
  'proof.pursuit-hook',
] as const;

const REQUIRED_EXCLUSIONS = [
  'topology-changes',
  'gameplay-mechanics',
  'raw-licensed-geometry',
  'procedural-social-content',
  'decorative-clutter',
] as const;

const REQUIRED_SURVEILLANCE_STATE_TOKENS = new Map([
  ['clear', 'technology-cyan'],
  ['suspicious', 'sodium-amber'],
  ['pursuit', 'threat-crimson'],
] as const);

const REQUIRED_SURVEILLANCE_STATE_CUES = new Map([
  ['clear', { glyph: 'ring-connection', silhouette: 'open-ring' }],
  ['suspicious', { glyph: 'single-chevron', silhouette: 'bracketed-focus' }],
  ['pursuit', { glyph: 'double-chevron', silhouette: 'solid-alarm-block' }],
] as const);

const REQUIRED_GROUND_MATERIALS = [
  'GET204 district substrate',
  'GET204 asphalt',
  'GET204 service asphalt',
  'GET204 crossing substrate',
  'GET204 crossing stripe',
  'GET204 neutral road edge',
  'GET204 plaza concrete',
  'GET204 sidewalk concrete',
  'GET204 structure sill',
] as const;

const REQUIRED_MATERIAL_FAMILIES = [
  'cold-institutional',
  'hidzu-controlled-access',
  'worn-civilian-edge',
] as const;

const HIDDEN_FACT_COPY_PATTERN = /\b(?:cold\s*iron|harrow|lira|naila|brant|medkits?|manifest|missing father)\b/i;

const exactSet = (actual: readonly string[], expected: readonly string[]): boolean => {
  if (actual.length !== expected.length || new Set(actual).size !== actual.length) return false;
  const expectedSet = new Set(expected);
  return actual.every((value) => expectedSet.has(value));
};

const includesAll = (actual: readonly string[], required: readonly string[]): boolean => {
  const actualSet = new Set(actual);
  return required.every((value) => actualSet.has(value));
};

const hasText = (value: string): boolean => value.trim().length > 0;

const inUnitRange = (value: number): boolean => Number.isFinite(value) && value >= 0 && value <= 1;

const exposesRawSourcePath = (value: string): boolean => {
  const normalized = value.toLowerCase();
  return normalized.startsWith('/') ||
    /^[a-z]:/i.test(value) ||
    ['.fbx', '.obj', '.3ds', '.max', '.c4d'].some((extension) => normalized.endsWith(extension));
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

const validateHeaderAndReferences = (
  bundle: Level0HidzuTreatmentBundle,
  recipe: Level0SceneRecipe,
  layout: Level0LayoutContract,
  errors: string[]
): void => {
  const { treatment, evidence, grammar } = bundle;
  if (
    treatment.schemaVersion !== 1 ||
    treatment.ticket !== 'GET-205' ||
    treatment.phase !== 'hidzu-identity-pass' ||
    treatment.usage !== 'local-evidence' ||
    treatment.base.sceneRecipe.id !== recipe.id ||
    treatment.base.layoutContract.id !== layout.id ||
    treatment.grammar.id !== grammar.id ||
    treatment.base.alignedExport.manifestPath !==
      'art/blender/get204/.generated/aligned-export/art-manifest.json'
  ) {
    errors.push('treatment header drifts from GET-205, GET-204, or the Level 0 layout');
  }

  const treatmentHashes = [
    treatment.base.sourceManifest.sha256,
    treatment.base.sceneRecipe.sha256,
    treatment.base.layoutContract.sha256,
    treatment.base.masterScene.sha256,
    treatment.base.masterScene.metadataSha256,
    treatment.base.alignedExport.manifestSha256,
    treatment.base.alignedExport.semanticMaskRegistrationDigest,
    treatment.reference.sha256,
    treatment.grammar.sha256,
  ];
  const evidenceHashes = [
    evidence.sourceManifestSha256,
    evidence.sceneRecipeSha256,
    evidence.layoutContractSha256,
    evidence.masterSceneSha256,
    evidence.masterSceneMetadataSha256,
    evidence.baseArtManifestSha256,
    evidence.semanticMaskRegistrationDigest,
    evidence.referenceSha256,
    evidence.visualGrammarSha256,
  ];
  if (
    treatmentHashes.some((hash) => !SHA256_PATTERN.test(hash)) ||
    evidenceHashes.some((hash) => !SHA256_PATTERN.test(hash)) ||
    treatmentHashes.some((hash, index) => hash !== evidenceHashes[index])
  ) {
    errors.push('treatment references drift from verified source artifacts');
  }
};

const validateImmutableBase = (
  bundle: Level0HidzuTreatmentBundle,
  recipe: Level0SceneRecipe,
  layout: Level0LayoutContract,
  errors: string[]
): void => {
  const { immutable } = bundle.treatment.base;
  const { evidence } = bundle;
  const digestPairs: Array<[string, string]> = [
    [immutable.geometrySignature, evidence.geometrySignature],
    [immutable.buildingTransformDigest, evidence.buildingTransformDigest],
    [immutable.propTransformDigest, evidence.propTransformDigest],
    [immutable.cameraDigest, evidence.cameraDigest],
    [immutable.canvasDigest, evidence.canvasDigest],
    [immutable.anchorDigest, evidence.anchorDigest],
    [immutable.semanticMaskDigest, evidence.semanticMaskDigest],
  ];
  if (
    !exactSet(
      immutable.buildingPlacementIds,
      recipe.buildingPlacements.map((placement) => placement.id)
    ) ||
    !exactSet(
      immutable.propPlacementIds,
      recipe.propPlacements.map((placement) => placement.id)
    ) ||
    !exactSet(immutable.anchorIds, layout.anchors.map((anchor) => anchor.id)) ||
    !exactSet(immutable.semanticMaskIds, layout.semanticMaskIds) ||
    digestPairs.some(([recorded, measured]) => !hasText(recorded) || recorded !== measured)
  ) {
    errors.push('treatment changes immutable GET-204 geometry or registration');
  }
};

const validateReference = (
  bundle: Level0HidzuTreatmentBundle,
  errors: string[]
): void => {
  const { reference, usage } = bundle.treatment;
  if (
    !hasText(reference.path) ||
    !hasText(reference.sourcePath) ||
    !SHA256_PATTERN.test(reference.sourceSha256) ||
    !hasText(reference.generatedBy) ||
    !hasText(reference.prompt) ||
    !hasText(reference.promptTerminology) ||
    !includesAll(reference.rubric.required, REQUIRED_RUBRIC) ||
    !includesAll(reference.rubric.rejected, REQUIRED_REJECTIONS) ||
    !exactSet(reference.rubric.hierarchy, REQUIRED_VALUE_HIERARCHY)
  ) {
    errors.push('treatment reference requires provenance, prompt, and complete visual rubric');
  }
  if (usage === 'runtime' && reference.status !== 'approved') {
    errors.push('runtime treatment requires an approved visual reference');
  }
};

const validateGrammar = (
  bundle: Level0HidzuTreatmentBundle,
  errors: string[]
): void => {
  const { grammar } = bundle;
  if (grammar.schemaVersion !== 1 || grammar.ticket !== 'GET-205') {
    errors.push('Hidzu visual grammar header is invalid');
  }
  const paletteById = new Map(grammar.palette.map((token) => [token.id, token]));
  if (
    !exactSet([...paletteById.keys()], [...REQUIRED_PALETTE.keys()]) ||
    [...REQUIRED_PALETTE].some(([id, expected]) => {
      const token = paletteById.get(id);
      return !token || token.role !== expected.role || token.hex.toLowerCase() !== expected.hex;
    }) ||
    grammar.palette.some((token) => !inUnitRange(token.maximumCoverageRatio))
  ) {
    errors.push('Hidzu palette drifts from the canonical semantic tokens');
  }
  if (
    (paletteById.get('technology-cyan')?.maximumCoverageRatio ?? 1) > 0.03 ||
    (paletteById.get('threat-crimson')?.maximumCoverageRatio ?? 1) > 0.01
  ) {
    errors.push('technology cyan and threat crimson must remain scarce semantic accents');
  }

  const hierarchy = [...grammar.valueHierarchy].sort((left, right) => left.rank - right.rank);
  if (
    !exactSet(hierarchy.map((entry) => entry.role), REQUIRED_VALUE_HIERARCHY) ||
    hierarchy.some((entry, index) => entry.rank !== index + 1) ||
    hierarchy.some(({ luminanceRange }) =>
      !inUnitRange(luminanceRange[0]) ||
      !inUnitRange(luminanceRange[1]) ||
      luminanceRange[0] >= luminanceRange[1]
    )
  ) {
    errors.push('Hidzu value hierarchy is incomplete or invalid');
  }

  if (!exactSet(grammar.entries.map((entry) => entry.kind), REQUIRED_GRAMMAR_KINDS)) {
    errors.push('Hidzu visual grammar is missing required environmental identities');
  }
  if (
    duplicateValues(grammar.entries.map((entry) => entry.id)).length > 0 ||
    grammar.entries.some((entry) =>
      !paletteById.has(entry.colorTokenId) ||
      !hasText(entry.silhouette) ||
      !hasText(entry.glyph) ||
      entry.nonColorCues.length === 0 ||
      entry.nonColorCues.some((cue) => !hasText(cue))
    )
  ) {
    errors.push('Hidzu grammar entries require non-color cues');
  }
  if (
    !exactSet(grammar.entries.map((entry) => entry.id), [...REQUIRED_GRAMMAR_IDENTITIES.keys()]) ||
    grammar.entries.some((entry) => {
      const expected = REQUIRED_GRAMMAR_IDENTITIES.get(entry.id);
      return !expected ||
        entry.kind !== expected.kind ||
        entry.semanticRole !== expected.semanticRole ||
        entry.colorTokenId !== expected.colorTokenId ||
        entry.silhouette !== expected.silhouette ||
        entry.glyph !== expected.glyph ||
        !exactSet(entry.nonColorCues, expected.nonColorCues);
    })
  ) {
    errors.push('Hidzu grammar entries drift from the registered visual identities');
  }

  if (
    !exactSet(grammar.surveillanceStates.map((state) => state.id), ['clear', 'suspicious', 'pursuit']) ||
    grammar.surveillanceStates.some((state) =>
      !paletteById.has(state.colorTokenId) ||
      REQUIRED_SURVEILLANCE_STATE_TOKENS.get(state.id) !== state.colorTokenId ||
      REQUIRED_SURVEILLANCE_STATE_CUES.get(state.id)?.glyph !== state.glyph ||
      REQUIRED_SURVEILLANCE_STATE_CUES.get(state.id)?.silhouette !== state.silhouette ||
      !hasText(state.glyph) ||
      !hasText(state.silhouette) ||
      !hasText(state.motionCue)
    )
  ) {
    errors.push('surveillance states require color-independent glyph, silhouette, and motion cues');
  }
};

const validateTreatmentContent = (
  bundle: Level0HidzuTreatmentBundle,
  recipe: Level0SceneRecipe,
  layout: Level0LayoutContract,
  errors: string[]
): void => {
  const { treatment, grammar } = bundle;
  const placementIds = recipe.buildingPlacements.map((placement) => placement.id);
  const anchorIds = layout.anchors.map((anchor) => anchor.id);
  const grammarIds = new Set(grammar.entries.map((entry) => entry.id));
  const paletteIds = new Set(grammar.palette.map((token) => token.id));

  const { surfaceTreatment } = treatment;
  if (
    surfaceTreatment.window.colorTokenId !== 'sodium-amber' ||
    !inUnitRange(surfaceTreatment.window.roughness) ||
    !inUnitRange(surfaceTreatment.window.metallic) ||
    !Number.isFinite(surfaceTreatment.window.emissionStrength) ||
    surfaceTreatment.window.emissionStrength < 0 ||
    !exactSet(
      surfaceTreatment.ground.map((entry) => entry.sourceMaterial),
      REQUIRED_GROUND_MATERIALS
    ) ||
    surfaceTreatment.ground.some((entry) =>
      !HEX_COLOR_PATTERN.test(entry.color) || !inUnitRange(entry.roughness)
    ) ||
    !exactSet(
      surfaceTreatment.families.map((entry) => entry.materialFamily),
      REQUIRED_MATERIAL_FAMILIES
    ) ||
    surfaceTreatment.families.some((entry) =>
      !inUnitRange(entry.mixFactor) ||
      !inUnitRange(entry.roughnessFloor) ||
      !inUnitRange(entry.metallicCeiling)
    )
  ) {
    errors.push('surface treatment requires complete bounded material transforms');
  }

  if (
    !exactSet(treatment.materialOverrides.map((entry) => entry.placementId), placementIds) ||
    treatment.materialOverrides.some((entry) =>
      entry.provenance !== 'procedural-override' ||
      entry.surfaceColorTokenIds.length === 0 ||
      entry.surfaceColorTokenIds.some((id) => !paletteIds.has(id))
    )
  ) {
    errors.push('material treatment must cover each immutable building placement with known tokens');
  }

  if (
    duplicateValues(treatment.additions.map((addition) => addition.id)).length > 0 ||
    treatment.additions.some((addition) =>
      !grammarIds.has(addition.grammarId) ||
      !hasText(addition.id)
    )
  ) {
    errors.push('treatment additions require unique IDs and registered Hidzu grammar');
  }
  const grammarById = new Map(grammar.entries.map((entry) => [entry.id, entry]));
  if (
    treatment.additions.some((addition) => {
      if (addition.kind === 'practical-light-source') return false;
      return grammarById.get(addition.grammarId)?.kind !==
        GRAMMAR_KIND_BY_ADDITION_KIND.get(addition.kind);
    })
  ) {
    errors.push('treatment addition kinds must match registered Hidzu grammar');
  }
  if (
    treatment.additions.some((addition) =>
      addition.target.kind === 'anchor'
        ? !anchorIds.includes(addition.target.id)
        : !placementIds.includes(addition.target.id)
    )
  ) {
    errors.push('treatment additions must target known T4 placements or Level 0 anchors');
  }
  if (
    treatment.additions.some((addition) =>
      addition.collisionEffect !== 'none' ||
      addition.provenance !== 'procedural-original' ||
      ![
        'navigation',
        'surveillance',
        'hiding',
        'blending',
        'cover',
        'hazard',
        'entrance',
        'contact',
        'mission-interaction',
        'safehouse',
        'objective-readability',
        'required-civic-atmosphere',
      ].includes(addition.purpose)
    )
  ) {
    errors.push('treatment additions must be gameplay-serving and collision-neutral');
  }
  if (
    treatment.additions.some((addition) =>
      addition.provenance !== 'procedural-original' ||
      exposesRawSourcePath(String(addition.provenance))
    )
  ) {
    errors.push('treatment metadata must not expose raw or absolute source paths');
  }

  const additionsById = new Map(treatment.additions.map((addition) => [addition.id, addition]));
  if (
    treatment.practicalLights.length === 0 ||
    treatment.practicalLights.some((light) => {
      const source = additionsById.get(light.sourceAdditionId);
      return !source ||
        source.kind !== 'practical-light-source' ||
        source.target.kind !== 'anchor' ||
        source.target.id !== light.anchorId ||
        !anchorIds.includes(light.anchorId) ||
        !light.visibleSource ||
        light.colorTokenId !== 'sodium-amber' ||
        light.direction !== 'upper-left' ||
        !exactSet(Object.keys(light.stateIntensity), ['dusk', 'blue-hour', 'curfew']) ||
        Object.values(light.stateIntensity).some((value) => !inUnitRange(value));
    })
  ) {
    errors.push('practical lights require visible registered sources and upper-left direction');
  }

  if (
    !exactSet(treatment.publicMessageTemplates.map((message) => message.theme), REQUIRED_MESSAGE_THEMES) ||
    duplicateValues(treatment.publicMessageTemplates.map((message) => message.id)).length > 0 ||
    treatment.publicMessageTemplates.some((message) =>
      message.scope !== 'visual-template' ||
      message.revealsFactIds.length > 0 ||
      !hasText(message.copy) ||
      HIDDEN_FACT_COPY_PATTERN.test(message.copy)
    )
  ) {
    errors.push('public-message treatment must remain fact-safe visual templates');
  }
  const publicMessageIds = treatment.publicMessageTemplates.map((message) => message.id);
  const assignedMessageIds = treatment.additions.flatMap(
    (addition) => addition.messageTemplateIds
  );
  if (
    !exactSet(assignedMessageIds, publicMessageIds) ||
    duplicateValues(assignedMessageIds).length > 0 ||
    treatment.additions.some((addition) =>
      addition.kind === 'public-screen'
        ? addition.messageTemplateIds.length === 0
        : addition.messageTemplateIds.length > 0
    )
  ) {
    errors.push('public-message templates must be visibly assigned exactly once to public screens');
  }
};

const validateStatesAndCaptures = (
  bundle: Level0HidzuTreatmentBundle,
  recipe: Level0SceneRecipe,
  layout: Level0LayoutContract,
  errors: string[]
): void => {
  const { treatment, grammar } = bundle;
  const paletteIds = new Set(grammar.palette.map((token) => token.id));
  if (
    !exactSet(treatment.scheduleStates.map((state) => state.id), ['dusk', 'blue-hour', 'curfew']) ||
    treatment.scheduleStates.some((state) =>
      state.geometrySignature !== treatment.base.immutable.geometrySignature ||
      !paletteIds.has(state.ambientColorTokenId) ||
      !inUnitRange(state.practicalLightMultiplier) ||
      !inUnitRange(state.atmosphereOpacity) ||
      !inUnitRange(state.architectureMidtoneFloor)
    )
  ) {
    errors.push('dusk, blue-hour, and curfew require one immutable geometry signature');
  }

  const captureIds = treatment.captures.map((capture) => capture.id);
  const knownTargets = new Set([
    ...layout.anchors.map((anchor) => anchor.id),
    ...recipe.buildingPlacements.map((placement) => placement.id),
  ]);
  const expectedFixed = new Map([
    ['1280x720-default', { width: 1280, height: 720, zoom: recipe.camera.defaultZoom, framing: 'default' }],
    ['1280x720-minimum', { width: 1280, height: 720, zoom: recipe.camera.minimumZoom, framing: 'minimum' }],
    ['1440x900-default', { width: 1440, height: 900, zoom: recipe.camera.defaultZoom, framing: 'default' }],
    ['1440x900-minimum', { width: 1440, height: 900, zoom: recipe.camera.minimumZoom, framing: 'minimum' }],
    ['1920x1080-default', { width: 1920, height: 1080, zoom: recipe.camera.defaultZoom, framing: 'default' }],
    ['1920x1080-minimum', { width: 1920, height: 1080, zoom: recipe.camera.minimumZoom, framing: 'minimum' }],
  ]);
  const fixedCaptureMismatch = [...expectedFixed].some(([id, expected]) => {
    const capture = treatment.captures.find((candidate) => candidate.id === id);
    return !capture ||
      capture.width !== expected.width ||
      capture.height !== expected.height ||
      capture.zoom !== expected.zoom ||
      capture.framing !== expected.framing;
  });
  const simulatedMismatch = ['proof.suspicious-hook', 'proof.pursuit-hook'].some((id) =>
    treatment.captures.find((capture) => capture.id === id)?.evidence !== 'simulated-t8-hook'
  );
  if (
    !exactSet(captureIds, REQUIRED_CAPTURE_IDS) ||
    duplicateValues(captureIds).length > 0 ||
    fixedCaptureMismatch ||
    simulatedMismatch ||
    treatment.captures.some((capture) =>
      !/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(capture.id) ||
      !knownTargets.has(capture.targetId) ||
      capture.width <= 0 ||
      capture.height <= 0 ||
      capture.zoom < recipe.camera.minimumZoom
    )
  ) {
    errors.push('treatment capture matrix is incomplete');
  }
};

const validateOutputAndPromotion = (
  bundle: Level0HidzuTreatmentBundle,
  recipe: Level0SceneRecipe,
  errors: string[]
): void => {
  const { treatment, evidence } = bundle;
  if (
    treatment.output.pathPrefix !== 'environment/level0/t5' ||
    treatment.output.fallbackProfile !== 'level0-greybox' ||
    treatment.output.budget.maxTotalBytes !== recipe.alignedExport.budget.maxTotalBytes ||
    treatment.output.budget.maxTileBytes !== recipe.alignedExport.budget.maxTileBytes ||
    !includesAll(treatment.exclusions, REQUIRED_EXCLUSIONS) ||
    treatment.provenance.sourceTicket !== 'GET-204' ||
    treatment.provenance.treatmentTicket !== 'GET-205' ||
    !treatment.provenance.generatedOutputsIgnored ||
    treatment.provenance.rawLicensedGeometryCommitted
  ) {
    errors.push('treatment output must retain the T4 budget, safe T5 path, and greybox fallback');
  }
  if (treatment.usage !== 'local-evidence' || evidence.exactEntitlementEvidence !== 'unavailable') {
    errors.push('GET-205 treatment must remain local evidence while entitlement is unavailable');
  }
};

/**
 * Validates the additive GET-205 treatment without allowing it to redefine
 * GET-203 gameplay geometry or GET-204 composition. File hashes and Blender
 * matrix digests are supplied independently by the CLI validator.
 */
export const validateLevel0HidzuTreatmentBundle = (
  bundle: Level0HidzuTreatmentBundle,
  recipe: Level0SceneRecipe,
  layout: Level0LayoutContract
): string[] => {
  const errors: string[] = [];
  validateHeaderAndReferences(bundle, recipe, layout, errors);
  validateImmutableBase(bundle, recipe, layout, errors);
  validateReference(bundle, errors);
  validateGrammar(bundle, errors);
  validateTreatmentContent(bundle, recipe, layout, errors);
  validateStatesAndCaptures(bundle, recipe, layout, errors);
  validateOutputAndPromotion(bundle, recipe, errors);
  return [...new Set(errors)];
};
