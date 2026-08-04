import sceneRecipeJson from '../../../../../../art/blender/get204/manifests/scene-recipe.json';
import { LEVEL0_LAYOUT_CONTRACT } from '../../../../content/levels/level0/layoutContract';
import type { Level0SceneRecipe } from '../types';
import type {
  Level0HidzuTreatmentBundle,
  Level0HidzuTreatmentEvidence,
  Level0HidzuTreatmentManifest,
  Level0HidzuVisualGrammar,
} from '../hidzuTypes';
import { validateLevel0HidzuTreatmentBundle } from '../hidzuValidator';

const SHA256 = 'a'.repeat(64);
const BASE_RECIPE = sceneRecipeJson as unknown as Level0SceneRecipe;
const GEOMETRY_SIGNATURE = 'geometry-' + 'b'.repeat(55);

const REQUIRED_GRAMMAR = [
  {
    id: 'hidzu.camera',
    kind: 'camera' as const,
    semanticRole: 'active-technology' as const,
    colorTokenId: 'technology-cyan',
    silhouette: 'hooded-lens',
    glyph: 'ring-connection',
    nonColorCues: ['directional-lens', 'connection-ring'],
  },
  {
    id: 'hidzu.terminal',
    kind: 'terminal' as const,
    semanticRole: 'active-technology' as const,
    colorTokenId: 'technology-cyan',
    silhouette: 'waist-high-console',
    glyph: 'ring-connection',
    nonColorCues: ['screen-frame', 'connection-ring'],
  },
  {
    id: 'hidzu.identity-frame',
    kind: 'identity-checkpoint' as const,
    semanticRole: 'caution' as const,
    colorTokenId: 'sodium-amber',
    silhouette: 'twin-post-frame',
    glyph: 'single-chevron',
    nonColorCues: ['twin-post-frame', 'single-chevron'],
  },
  {
    id: 'hidzu.public-screen',
    kind: 'public-screen' as const,
    semanticRole: 'neutral-information' as const,
    colorTokenId: 'muted-teal',
    silhouette: 'landscape-panel',
    glyph: 'horizontal-rule',
    nonColorCues: ['landscape-panel', 'horizontal-rule'],
  },
  {
    id: 'hidzu.controlled-entrance',
    kind: 'controlled-entrance' as const,
    semanticRole: 'caution' as const,
    colorTokenId: 'sodium-amber',
    silhouette: 'bracketed-threshold',
    glyph: 'single-chevron',
    nonColorCues: ['bracketed-threshold', 'single-chevron'],
  },
  {
    id: 'hidzu.transit-wayfinding',
    kind: 'transit-wayfinding' as const,
    semanticRole: 'neutral-information' as const,
    colorTokenId: 'bone',
    silhouette: 'low-direction-plinth',
    glyph: 'split-arrow',
    nonColorCues: ['low-direction-plinth', 'split-arrow'],
  },
  {
    id: 'hidzu.service-wayfinding',
    kind: 'service-wayfinding' as const,
    semanticRole: 'neutral-information' as const,
    colorTokenId: 'muted-teal',
    silhouette: 'vertical-service-marker',
    glyph: 'bar-code-stripes',
    nonColorCues: ['vertical-service-marker', 'bar-code-stripes'],
  },
  {
    id: 'hidzu.hiding-context',
    kind: 'hiding-context' as const,
    semanticRole: 'surface' as const,
    colorTokenId: 'ink',
    silhouette: 'recessed-service-bay',
    glyph: 'deep-shadow-notch',
    nonColorCues: ['recessed-service-bay', 'deep-shadow-notch'],
  },
  {
    id: 'hidzu.blending-context',
    kind: 'blending-context' as const,
    semanticRole: 'neutral-information' as const,
    colorTokenId: 'bone',
    silhouette: 'queue-rail',
    glyph: 'parallel-floor-bars',
    nonColorCues: ['queue-rail', 'parallel-floor-bars'],
  },
  {
    id: 'hidzu.threat-hook',
    kind: 'threat-hook' as const,
    semanticRole: 'confirmed-danger' as const,
    colorTokenId: 'threat-crimson',
    silhouette: 'solid-alarm-block',
    glyph: 'double-chevron',
    nonColorCues: ['solid-alarm-block', 'double-chevron'],
  },
] as const;

const createGrammar = (): Level0HidzuVisualGrammar => ({
  schemaVersion: 1,
  id: 'level0-hidzu-visual-grammar-v1',
  ticket: 'GET-205',
  palette: [
    { id: 'ink', role: 'surface', hex: '#0b0d12', maximumCoverageRatio: 0.55 },
    { id: 'bone', role: 'neutral-information', hex: '#d5c8b5', maximumCoverageRatio: 0.12 },
    { id: 'bruised-umber', role: 'surface', hex: '#513b35', maximumCoverageRatio: 0.25 },
    { id: 'muted-teal', role: 'neutral-information', hex: '#5b7775', maximumCoverageRatio: 0.08 },
    { id: 'sodium-amber', role: 'practical-light', hex: '#d99a50', maximumCoverageRatio: 0.06 },
    { id: 'technology-cyan', role: 'active-technology', hex: '#50bfd0', maximumCoverageRatio: 0.03 },
    { id: 'threat-crimson', role: 'confirmed-danger', hex: '#8e4147', maximumCoverageRatio: 0.01 },
  ],
  valueHierarchy: [
    { role: 'objective-action', rank: 1, luminanceRange: [0.62, 0.82] },
    { role: 'actor-placeholder', rank: 2, luminanceRange: [0.48, 0.72] },
    { role: 'observation-threat', rank: 3, luminanceRange: [0.42, 0.68] },
    { role: 'entrance-traversal', rank: 4, luminanceRange: [0.34, 0.58] },
    { role: 'architecture', rank: 5, luminanceRange: [0.2, 0.52] },
    { role: 'atmosphere', rank: 6, luminanceRange: [0.08, 0.32] },
  ],
  entries: REQUIRED_GRAMMAR.map((entry) => ({ ...entry, nonColorCues: [...entry.nonColorCues] })),
  surveillanceStates: [
    {
      id: 'clear',
      colorTokenId: 'technology-cyan',
      glyph: 'ring-connection',
      silhouette: 'open-ring',
      motionCue: 'slow-sweep',
    },
    {
      id: 'suspicious',
      colorTokenId: 'sodium-amber',
      glyph: 'single-chevron',
      silhouette: 'bracketed-focus',
      motionCue: 'tightening-pulse',
    },
    {
      id: 'pursuit',
      colorTokenId: 'threat-crimson',
      glyph: 'double-chevron',
      silhouette: 'solid-alarm-block',
      motionCue: 'urgent-strobe',
    },
  ],
});

const createEvidence = (): Level0HidzuTreatmentEvidence => ({
  sourceManifestSha256: SHA256,
  sceneRecipeSha256: SHA256,
  layoutContractSha256: SHA256,
  masterSceneSha256: SHA256,
  masterSceneMetadataSha256: SHA256,
  baseArtManifestSha256: SHA256,
  semanticMaskRegistrationDigest: SHA256,
  referenceSha256: SHA256,
  visualGrammarSha256: SHA256,
  geometrySignature: GEOMETRY_SIGNATURE,
  buildingTransformDigest: SHA256,
  propTransformDigest: SHA256,
  cameraDigest: SHA256,
  canvasDigest: SHA256,
  anchorDigest: SHA256,
  semanticMaskDigest: SHA256,
  exactEntitlementEvidence: 'unavailable',
});

const createTreatment = (): Level0HidzuTreatmentManifest => ({
  schemaVersion: 1,
  id: 'level0-tokyo-hidzu-treatment-v1',
  ticket: 'GET-205',
  phase: 'hidzu-identity-pass',
  usage: 'local-evidence',
  base: {
    sourceManifest: {
      path: 'art/blender/get204/manifests/source-manifest.json',
      sha256: SHA256,
    },
    sceneRecipe: {
      id: BASE_RECIPE.id,
      path: 'art/blender/get204/manifests/scene-recipe.json',
      sha256: SHA256,
    },
    layoutContract: {
      id: LEVEL0_LAYOUT_CONTRACT.id,
      path: 'art/iso-assets/contracts/level0-layout-contract.json',
      sha256: SHA256,
    },
    masterScene: {
      path: 'art/blender/get204/.generated/get204-level0-master.blend',
      sha256: SHA256,
      metadataPath: 'art/blender/get204/.generated/master-scene-metadata.json',
      metadataSha256: SHA256,
    },
    alignedExport: {
      manifestPath: 'art/blender/get204/.generated/aligned-export/art-manifest.json',
      manifestSha256: SHA256,
      semanticMaskRegistrationDigest: SHA256,
    },
    immutable: {
      geometrySignature: GEOMETRY_SIGNATURE,
      buildingPlacementIds: BASE_RECIPE.buildingPlacements.map((placement) => placement.id),
      propPlacementIds: BASE_RECIPE.propPlacements.map((placement) => placement.id),
      anchorIds: LEVEL0_LAYOUT_CONTRACT.anchors.map((anchor) => anchor.id),
      semanticMaskIds: [...LEVEL0_LAYOUT_CONTRACT.semanticMaskIds],
      buildingTransformDigest: SHA256,
      propTransformDigest: SHA256,
      cameraDigest: SHA256,
      canvasDigest: SHA256,
      anchorDigest: SHA256,
      semanticMaskDigest: SHA256,
    },
  },
  reference: {
    status: 'provisional-local-reference',
    path: 'art/blender/get205/.generated/reference/hidzu-direction-concept-v1.png',
    sha256: SHA256,
    sourcePath: 'art/blender/get204/.generated/master/overview.png',
    sourceSha256: SHA256,
    generatedBy: 'OpenAI image generation',
    prompt: 'Preserve the accepted isometric composition and apply the canonical Hidzu surveillance-noir treatment.',
    promptTerminology: "The historical prompt used 'accepted' for a technically validated comparison baseline, not requester acceptance.",
    rubric: {
      required: [
        'readable-midtones',
        'cold-institutional-surfaces',
        'motivated-sodium-practicals',
        'scarce-technology-cyan',
        'crimson-only-confirmed-danger',
        'repeated-hidzu-surveillance-grammar',
        'human-scale-traversal-readability',
      ],
      rejected: [
        'generic-neon-cyberpunk',
        'fantasy-ornament',
        'crushed-blacks',
        'broad-glow',
        'decorative-clutter',
        'geometry-drift',
        'hidden-fact-leakage',
      ],
      hierarchy: [
        'objective-action',
        'actor-placeholder',
        'observation-threat',
        'entrance-traversal',
        'architecture',
        'atmosphere',
      ],
    },
  },
  grammar: {
    id: 'level0-hidzu-visual-grammar-v1',
    path: 'art/blender/get205/manifests/hidzu-visual-grammar.json',
    sha256: SHA256,
  },
  surfaceTreatment: {
    window: {
      colorTokenId: 'sodium-amber',
      roughness: 0.42,
      metallic: 0.08,
      emissionStrength: 1.25,
    },
    ground: [
      ['GET204 district substrate', '#0e0f11', 0.98],
      ['GET204 asphalt', '#121416', 0.96],
      ['GET204 service asphalt', '#181412', 0.96],
      ['GET204 crossing substrate', '#1b1c1e', 0.94],
      ['GET204 crossing stripe', '#4d463c', 0.82],
      ['GET204 neutral road edge', '#26292a', 0.9],
      ['GET204 plaza concrete', '#292421', 0.9],
      ['GET204 sidewalk concrete', '#212224', 0.9],
      ['GET204 structure sill', '#161719', 0.92],
    ].map(([sourceMaterial, color, roughness]) => ({
      sourceMaterial: sourceMaterial as string,
      color: color as string,
      roughness: roughness as number,
    })),
    families: [
      ['cold-institutional', 0.36, 0.62, 0.28],
      ['hidzu-controlled-access', 0.42, 0.62, 0.28],
      ['worn-civilian-edge', 0.28, 0.62, 0.28],
    ].map(([materialFamily, mixFactor, roughnessFloor, metallicCeiling]) => ({
      materialFamily: materialFamily as Level0HidzuTreatmentManifest['surfaceTreatment']['families'][number]['materialFamily'],
      mixFactor: mixFactor as number,
      roughnessFloor: roughnessFloor as number,
      metallicCeiling: metallicCeiling as number,
    })),
  },
  materialOverrides: BASE_RECIPE.buildingPlacements.map((placement) => ({
    placementId: placement.id,
    materialFamily: placement.role === 'logistics-landmark'
      ? 'hidzu-controlled-access'
      : placement.role === 'safehouse-shell'
        ? 'worn-civilian-edge'
        : 'cold-institutional',
    surfaceColorTokenIds: ['ink', 'bruised-umber', 'bone'],
    provenance: 'procedural-override',
  })),
  additions: [
    ['add.camera.public-approach', 'camera.public_approach', 'camera-fixture', 'surveillance', 'hidzu.camera'],
    ['add.camera.public-gate', 'camera.public_gate', 'camera-fixture', 'surveillance', 'hidzu.camera'],
    ['add.camera.service-gate', 'camera.service_gate', 'camera-fixture', 'surveillance', 'hidzu.camera'],
    ['add.camera.service-alley', 'camera.service_alley', 'camera-fixture', 'surveillance', 'hidzu.camera'],
    ['add.terminal.camera-loop', 'terminal.camera_loop', 'terminal-marker', 'mission-interaction', 'hidzu.terminal'],
    ['add.terminal.cache', 'terminal.cache_locker', 'terminal-marker', 'mission-interaction', 'hidzu.terminal'],
    ['add.terminal.transit', 'terminal.outbound_transit', 'terminal-marker', 'mission-interaction', 'hidzu.terminal'],
    ['add.identity.public', 'entrance.logistics.public', 'identity-frame', 'entrance', 'hidzu.identity-frame'],
    ['add.screen.civic', 'placement.hidzu-offices.small-i', 'public-screen', 'required-civic-atmosphere', 'hidzu.public-screen'],
    ['add.entrance.controlled', 'entrance.logistics.service', 'controlled-entrance', 'entrance', 'hidzu.controlled-entrance'],
    ['add.wayfinding.transit', 'terminal.outbound_transit', 'transit-wayfinding', 'navigation', 'hidzu.transit-wayfinding'],
    ['add.wayfinding.service', 'entrance.logistics.service', 'service-wayfinding', 'navigation', 'hidzu.service-wayfinding'],
    ['add.hide.service', 'hide.service_recess', 'hiding-structure', 'hiding', 'hidzu.hiding-context'],
    ['add.blend.queue', 'blend.public_queue', 'blending-context', 'blending', 'hidzu.blending-context'],
    ['add.threat.logistics', 'drone.launch', 'threat-hook', 'hazard', 'hidzu.threat-hook'],
    ['add.light.lira', 'contact.lira', 'practical-light-source', 'contact', 'hidzu.public-screen'],
    ['add.light.logistics', 'entrance.logistics.public', 'practical-light-source', 'entrance', 'hidzu.controlled-entrance'],
    ['add.light.safehouse', 'entrance.safehouse', 'practical-light-source', 'safehouse', 'hidzu.public-screen'],
  ].map(([id, targetId, kind, purpose, grammarId]) => ({
    id: id!,
    target: {
      kind: targetId!.startsWith('placement.') ? 'placement' as const : 'anchor' as const,
      id: targetId!,
    },
    kind: kind as Level0HidzuTreatmentManifest['additions'][number]['kind'],
    purpose: purpose as Level0HidzuTreatmentManifest['additions'][number]['purpose'],
    collisionEffect: 'none' as const,
    grammarId: grammarId!,
    messageTemplateIds: kind === 'public-screen'
      ? [
          'message.safety',
          'message.efficiency',
          'message.transit',
          'message.identity',
          'message.sentiment',
          'message.suppression',
          'message.access',
        ]
      : [],
    provenance: 'procedural-original' as const,
  })),
  practicalLights: [
    {
      id: 'light.lira',
      sourceAdditionId: 'add.light.lira',
      anchorId: 'contact.lira',
      visibleSource: true,
      colorTokenId: 'sodium-amber',
      direction: 'upper-left',
      stateIntensity: { dusk: 0.8, 'blue-hour': 1, curfew: 0.72 },
    },
    {
      id: 'light.logistics',
      sourceAdditionId: 'add.light.logistics',
      anchorId: 'entrance.logistics.public',
      visibleSource: true,
      colorTokenId: 'sodium-amber',
      direction: 'upper-left',
      stateIntensity: { dusk: 0.72, 'blue-hour': 1, curfew: 0.86 },
    },
    {
      id: 'light.safehouse',
      sourceAdditionId: 'add.light.safehouse',
      anchorId: 'entrance.safehouse',
      visibleSource: true,
      colorTokenId: 'sodium-amber',
      direction: 'upper-left',
      stateIntensity: { dusk: 0.65, 'blue-hour': 0.9, curfew: 0.7 },
    },
  ],
  publicMessageTemplates: [
    ['message.safety', 'safety', 'A safer district begins with verified access.'],
    ['message.efficiency', 'efficiency', 'Clear routes. Predictable service.'],
    ['message.transit', 'transit', 'Transit continuity desk — west concourse.'],
    ['message.identity', 'identity-continuity', 'Keep your civic identity current.'],
    ['message.sentiment', 'civic-sentiment', 'Order makes opportunity visible.'],
    ['message.suppression', 'suppression', 'Unverified notices are removed for public safety.'],
    ['message.access', 'controlled-access', 'Authorized logistics personnel beyond this point.'],
  ].map(([id, theme, copy]) => ({
    id: id!,
    theme: theme as Level0HidzuTreatmentManifest['publicMessageTemplates'][number]['theme'],
    copy: copy!,
    scope: 'visual-template' as const,
    revealsFactIds: [],
  })),
  scheduleStates: [
    {
      id: 'dusk',
      geometrySignature: GEOMETRY_SIGNATURE,
      ambientColorTokenId: 'bruised-umber',
      practicalLightMultiplier: 0.72,
      atmosphereOpacity: 0.08,
      architectureMidtoneFloor: 0.22,
    },
    {
      id: 'blue-hour',
      geometrySignature: GEOMETRY_SIGNATURE,
      ambientColorTokenId: 'muted-teal',
      practicalLightMultiplier: 1,
      atmosphereOpacity: 0.12,
      architectureMidtoneFloor: 0.2,
    },
    {
      id: 'curfew',
      geometrySignature: GEOMETRY_SIGNATURE,
      ambientColorTokenId: 'ink',
      practicalLightMultiplier: 0.82,
      atmosphereOpacity: 0.16,
      architectureMidtoneFloor: 0.18,
    },
  ],
  captures: [
    ...([1280, 1440, 1920] as const).flatMap((width) => {
      const height = width === 1280 ? 720 : width === 1440 ? 900 : 1080;
      return [
        { id: `${width}x${height}-default`, width, height, zoom: 0.78, framing: 'default' as const, targetId: 'safehouse.spawn', schedule: 'dusk' as const, evidence: 'live-art' as const },
        { id: `${width}x${height}-minimum`, width, height, zoom: 0.6, framing: 'minimum' as const, targetId: 'safehouse.spawn', schedule: 'blue-hour' as const, evidence: 'live-art' as const },
      ];
    }),
    { id: 'proof.safehouse', width: 1440, height: 900, zoom: 0.78, framing: 'proof', targetId: 'safehouse.spawn', schedule: 'dusk', evidence: 'live-art' },
    { id: 'proof.dusk-street', width: 1440, height: 900, zoom: 0.78, framing: 'proof', targetId: 'contact.lira', schedule: 'dusk', evidence: 'live-art' },
    { id: 'proof.lira', width: 1440, height: 900, zoom: 0.78, framing: 'proof', targetId: 'contact.lira', schedule: 'dusk', evidence: 'live-art' },
    { id: 'proof.naila', width: 1440, height: 900, zoom: 0.78, framing: 'proof', targetId: 'contact.naila', schedule: 'dusk', evidence: 'live-art' },
    { id: 'proof.brant', width: 1440, height: 900, zoom: 0.78, framing: 'proof', targetId: 'contact.brant', schedule: 'blue-hour', evidence: 'live-art' },
    { id: 'proof.public-route', width: 1440, height: 900, zoom: 0.78, framing: 'proof', targetId: 'entrance.logistics.public', schedule: 'dusk', evidence: 'live-art' },
    { id: 'proof.curfew-route', width: 1440, height: 900, zoom: 0.78, framing: 'proof', targetId: 'entrance.logistics.service', schedule: 'curfew', evidence: 'live-art' },
    { id: 'proof.camera-terminal', width: 1440, height: 900, zoom: 0.78, framing: 'proof', targetId: 'terminal.camera_loop', schedule: 'blue-hour', evidence: 'live-art' },
    { id: 'proof.cache-manifest', width: 1440, height: 900, zoom: 0.78, framing: 'proof', targetId: 'objective.medkits', schedule: 'curfew', evidence: 'live-art' },
    { id: 'proof.suspicious-hook', width: 1440, height: 900, zoom: 0.78, framing: 'proof', targetId: 'camera.public_gate', schedule: 'blue-hour', evidence: 'simulated-t8-hook' },
    { id: 'proof.pursuit-hook', width: 1440, height: 900, zoom: 0.78, framing: 'proof', targetId: 'drone.launch', schedule: 'curfew', evidence: 'simulated-t8-hook' },
  ],
  output: {
    pathPrefix: 'environment/level0/t5',
    fallbackProfile: 'level0-greybox',
    budget: {
      maxTotalBytes: BASE_RECIPE.alignedExport.budget.maxTotalBytes,
      maxTileBytes: BASE_RECIPE.alignedExport.budget.maxTileBytes,
    },
  },
  exclusions: [
    'topology-changes',
    'gameplay-mechanics',
    'raw-licensed-geometry',
    'procedural-social-content',
    'decorative-clutter',
  ],
  provenance: {
    sourceTicket: 'GET-204',
    treatmentTicket: 'GET-205',
    generatedOutputsIgnored: true,
    rawLicensedGeometryCommitted: false,
  },
});

const createBundle = (): Level0HidzuTreatmentBundle => ({
  treatment: createTreatment(),
  grammar: createGrammar(),
  evidence: createEvidence(),
});

describe('Level0HidzuTreatmentBundle', () => {
  it('accepts an immutable local-evidence treatment over the exact GET-204 recipe', () => {
    expect(
      validateLevel0HidzuTreatmentBundle(createBundle(), BASE_RECIPE, LEVEL0_LAYOUT_CONTRACT)
    ).toEqual([]);
  });

  it.each([
    ['source manifest', 'sourceManifestSha256'],
    ['scene recipe', 'sceneRecipeSha256'],
    ['layout contract', 'layoutContractSha256'],
    ['master scene', 'masterSceneSha256'],
    ['master-scene metadata', 'masterSceneMetadataSha256'],
    ['base art manifest', 'baseArtManifestSha256'],
    ['semantic-mask registration', 'semanticMaskRegistrationDigest'],
    ['reference', 'referenceSha256'],
    ['visual grammar', 'visualGrammarSha256'],
  ] as const)('rejects %s hash drift', (_label, evidenceKey) => {
    const bundle = createBundle();
    bundle.evidence[evidenceKey] = 'c'.repeat(64);

    expect(
      validateLevel0HidzuTreatmentBundle(bundle, BASE_RECIPE, LEVEL0_LAYOUT_CONTRACT)
    ).toContain('treatment references drift from verified source artifacts');
  });

  it.each([
    'buildingTransformDigest',
    'propTransformDigest',
    'cameraDigest',
    'canvasDigest',
    'anchorDigest',
    'semanticMaskDigest',
    'geometrySignature',
  ] as const)('rejects immutable %s drift', (evidenceKey) => {
    const bundle = createBundle();
    bundle.evidence[evidenceKey] = evidenceKey === 'geometrySignature'
      ? 'geometry-' + 'c'.repeat(55)
      : 'c'.repeat(64);

    expect(
      validateLevel0HidzuTreatmentBundle(bundle, BASE_RECIPE, LEVEL0_LAYOUT_CONTRACT)
    ).toContain('treatment changes immutable GET-204 geometry or registration');
  });

  it('rejects incomplete or unapproved reference metadata for runtime use', () => {
    const bundle = createBundle();
    bundle.treatment.reference.promptTerminology = '';

    expect(
      validateLevel0HidzuTreatmentBundle(bundle, BASE_RECIPE, LEVEL0_LAYOUT_CONTRACT)
    ).toContain('treatment reference requires provenance, prompt, and complete visual rubric');

    bundle.treatment.reference.promptTerminology = 'recorded terminology qualification';
    bundle.treatment.usage = 'runtime';
    bundle.evidence.exactEntitlementEvidence = 'verified';

    expect(
      validateLevel0HidzuTreatmentBundle(bundle, BASE_RECIPE, LEVEL0_LAYOUT_CONTRACT)
    ).toContain('runtime treatment requires an approved visual reference');
  });

  it('rejects unknown targets, decorative additions, collision changes, and raw paths', () => {
    const bundle = createBundle();
    bundle.treatment.additions[0]!.target.id = 'camera.unknown';
    bundle.treatment.additions[1]!.purpose = 'decorative' as never;
    bundle.treatment.additions[2]!.collisionEffect = 'blocking' as never;
    bundle.treatment.additions[3]!.provenance = '/Volumes/Elements/raw-camera.fbx' as never;

    const errors = validateLevel0HidzuTreatmentBundle(
      bundle,
      BASE_RECIPE,
      LEVEL0_LAYOUT_CONTRACT
    );
    expect(errors).toEqual(expect.arrayContaining([
      'treatment additions must target known T4 placements or Level 0 anchors',
      'treatment additions must be gameplay-serving and collision-neutral',
      'treatment metadata must not expose raw or absolute source paths',
    ]));
  });

  it('rejects unmotivated practical lights', () => {
    const bundle = createBundle();
    bundle.treatment.practicalLights[0]!.visibleSource = false;
    bundle.treatment.practicalLights[1]!.sourceAdditionId = 'add.light.missing';
    bundle.treatment.practicalLights[2]!.direction = 'lower-right' as never;

    expect(
      validateLevel0HidzuTreatmentBundle(bundle, BASE_RECIPE, LEVEL0_LAYOUT_CONTRACT)
    ).toContain('practical lights require visible registered sources and upper-left direction');
  });

  it('requires complete bounded surface transforms', () => {
    const bundle = createBundle();
    bundle.treatment.surfaceTreatment.ground.pop();
    bundle.treatment.surfaceTreatment.window.roughness = 1.2;
    bundle.treatment.surfaceTreatment.families[0]!.mixFactor = -0.1;

    expect(
      validateLevel0HidzuTreatmentBundle(bundle, BASE_RECIPE, LEVEL0_LAYOUT_CONTRACT)
    ).toContain('surface treatment requires complete bounded material transforms');
  });

  it('binds every public message template exactly once to public screens', () => {
    const bundle = createBundle();
    const screen = bundle.treatment.additions.find((addition) => addition.kind === 'public-screen')!;
    const camera = bundle.treatment.additions.find((addition) => addition.kind === 'camera-fixture')!;
    screen.messageTemplateIds.pop();
    camera.messageTemplateIds = ['message.access'];

    expect(
      validateLevel0HidzuTreatmentBundle(bundle, BASE_RECIPE, LEVEL0_LAYOUT_CONTRACT)
    ).toContain('public-message templates must be visibly assigned exactly once to public screens');
  });

  it('rejects grammar identity drift and addition-kind mismatch', () => {
    const bundle = createBundle();
    const cameraGrammar = bundle.grammar.entries.find((entry) => entry.id === 'hidzu.camera')!;
    cameraGrammar.silhouette = 'waist-high-console';
    cameraGrammar.glyph = 'horizontal-rule';
    cameraGrammar.colorTokenId = 'bone';
    bundle.treatment.additions.find((addition) => addition.kind === 'camera-fixture')!.grammarId =
      'hidzu.terminal';

    const errors = validateLevel0HidzuTreatmentBundle(
      bundle,
      BASE_RECIPE,
      LEVEL0_LAYOUT_CONTRACT
    );
    expect(errors).toEqual(expect.arrayContaining([
      'Hidzu grammar entries drift from the registered visual identities',
      'treatment addition kinds must match registered Hidzu grammar',
    ]));
  });

  it('rejects broad semantic accent colors and color-only surveillance cues', () => {
    const bundle = createBundle();
    bundle.grammar.palette.find((token) => token.id === 'technology-cyan')!.maximumCoverageRatio = 0.2;
    bundle.grammar.palette.find((token) => token.id === 'threat-crimson')!.maximumCoverageRatio = 0.2;
    bundle.grammar.surveillanceStates[1]!.glyph = '';
    bundle.grammar.surveillanceStates[1]!.motionCue = '';
    bundle.grammar.surveillanceStates[0]!.colorTokenId = 'threat-crimson';

    const errors = validateLevel0HidzuTreatmentBundle(
      bundle,
      BASE_RECIPE,
      LEVEL0_LAYOUT_CONTRACT
    );
    expect(errors).toEqual(expect.arrayContaining([
      'technology cyan and threat crimson must remain scarce semantic accents',
      'surveillance states require color-independent glyph, silhouette, and motion cues',
    ]));
  });

  it('rejects incomplete identity grammar and missing non-color cues', () => {
    const bundle = createBundle();
    bundle.grammar.entries = bundle.grammar.entries.filter((entry) => entry.kind !== 'controlled-entrance');
    bundle.grammar.entries[0]!.nonColorCues = [];

    const errors = validateLevel0HidzuTreatmentBundle(
      bundle,
      BASE_RECIPE,
      LEVEL0_LAYOUT_CONTRACT
    );
    expect(errors).toEqual(expect.arrayContaining([
      'Hidzu visual grammar is missing required environmental identities',
      'Hidzu grammar entries require non-color cues',
    ]));
  });

  it('rejects public messaging that leaks operational facts or exceeds visual-template scope', () => {
    const bundle = createBundle();
    bundle.treatment.publicMessageTemplates[0]!.revealsFactIds = ['fact.cold-iron-link'];
    bundle.treatment.publicMessageTemplates[1]!.copy = 'Lira hid the medkits beside the manifest.';
    bundle.treatment.publicMessageTemplates[2]!.scope = 'social-feed-entry' as never;

    expect(
      validateLevel0HidzuTreatmentBundle(bundle, BASE_RECIPE, LEVEL0_LAYOUT_CONTRACT)
    ).toContain('public-message treatment must remain fact-safe visual templates');
  });

  it('requires three aligned schedule states and the complete capture matrix', () => {
    const bundle = createBundle();
    bundle.treatment.scheduleStates[1]!.geometrySignature = 'geometry-' + 'd'.repeat(55);
    bundle.treatment.scheduleStates[0]!.ambientColorTokenId = 'unknown-ambient';
    bundle.treatment.scheduleStates = bundle.treatment.scheduleStates.filter((state) => state.id !== 'curfew');
    bundle.treatment.captures = bundle.treatment.captures.filter((capture) => capture.id !== 'proof.camera-terminal');

    const errors = validateLevel0HidzuTreatmentBundle(
      bundle,
      BASE_RECIPE,
      LEVEL0_LAYOUT_CONTRACT
    );
    expect(errors).toEqual(expect.arrayContaining([
      'dusk, blue-hour, and curfew require one immutable geometry signature',
      'treatment capture matrix is incomplete',
    ]));
  });

  it('rejects extra or path-unsafe capture IDs', () => {
    const bundle = createBundle();
    bundle.treatment.captures.push({
      ...bundle.treatment.captures[0]!,
      id: '../../outside-get205',
    });

    expect(
      validateLevel0HidzuTreatmentBundle(bundle, BASE_RECIPE, LEVEL0_LAYOUT_CONTRACT)
    ).toContain('treatment capture matrix is incomplete');
  });

  it('requires a bounded local output and greybox fallback', () => {
    const bundle = createBundle();
    bundle.treatment.output.pathPrefix = '../raw/get205' as never;
    bundle.treatment.output.fallbackProfile = 'none' as never;
    bundle.treatment.output.budget.maxTotalBytes += 1;

    expect(
      validateLevel0HidzuTreatmentBundle(bundle, BASE_RECIPE, LEVEL0_LAYOUT_CONTRACT)
    ).toContain('treatment output must retain the T4 budget, safe T5 path, and greybox fallback');
  });

  it('rejects runtime promotion without approved reference and verified entitlement', () => {
    const bundle = createBundle();
    bundle.treatment.usage = 'runtime';

    const errors = validateLevel0HidzuTreatmentBundle(
      bundle,
      BASE_RECIPE,
      LEVEL0_LAYOUT_CONTRACT
    );
    expect(errors).toEqual(expect.arrayContaining([
      'runtime treatment requires an approved visual reference',
      'GET-205 treatment must remain local evidence while entitlement is unavailable',
    ]));
  });
});
