import type { Level0LightingState } from './types';

export type Level0HidzuSemanticRole =
  | 'surface'
  | 'neutral-information'
  | 'practical-light'
  | 'objective-time-curfew'
  | 'active-technology'
  | 'caution'
  | 'confirmed-danger';

export type Level0HidzuGrammarKind =
  | 'camera'
  | 'terminal'
  | 'identity-checkpoint'
  | 'public-screen'
  | 'controlled-entrance'
  | 'transit-wayfinding'
  | 'service-wayfinding'
  | 'hiding-context'
  | 'blending-context'
  | 'threat-hook';

export interface Level0HidzuPaletteToken {
  id: string;
  role: Level0HidzuSemanticRole;
  hex: string;
  maximumCoverageRatio: number;
}

export interface Level0HidzuGrammarEntry {
  id: string;
  kind: Level0HidzuGrammarKind;
  semanticRole: Level0HidzuSemanticRole;
  colorTokenId: string;
  silhouette: string;
  glyph: string;
  nonColorCues: string[];
}

export interface Level0HidzuVisualGrammar {
  schemaVersion: 1;
  id: string;
  ticket: 'GET-205';
  palette: Level0HidzuPaletteToken[];
  valueHierarchy: Array<{
    role:
      | 'objective-action'
      | 'actor-placeholder'
      | 'observation-threat'
      | 'entrance-traversal'
      | 'architecture'
      | 'atmosphere';
    rank: number;
    luminanceRange: [number, number];
  }>;
  entries: Level0HidzuGrammarEntry[];
  surveillanceStates: Array<{
    id: 'clear' | 'suspicious' | 'pursuit';
    colorTokenId: string;
    glyph: string;
    silhouette: string;
    motionCue: string;
  }>;
}

export type Level0HidzuAdditionKind =
  | 'camera-fixture'
  | 'terminal-marker'
  | 'identity-frame'
  | 'public-screen'
  | 'controlled-entrance'
  | 'transit-wayfinding'
  | 'service-wayfinding'
  | 'hiding-structure'
  | 'blending-context'
  | 'threat-hook'
  | 'practical-light-source';

export type Level0HidzuAdditionPurpose =
  | 'navigation'
  | 'surveillance'
  | 'hiding'
  | 'blending'
  | 'cover'
  | 'hazard'
  | 'entrance'
  | 'contact'
  | 'mission-interaction'
  | 'safehouse'
  | 'objective-readability'
  | 'required-civic-atmosphere';

export interface Level0HidzuTreatmentManifest {
  schemaVersion: 1;
  id: string;
  ticket: 'GET-205';
  phase: 'hidzu-identity-pass';
  usage: 'local-evidence' | 'runtime';
  base: {
    sourceManifest: {
      path: string;
      sha256: string;
    };
    sceneRecipe: {
      id: string;
      path: string;
      sha256: string;
    };
    layoutContract: {
      id: string;
      path: string;
      sha256: string;
    };
    masterScene: {
      path: string;
      sha256: string;
      metadataPath: string;
      metadataSha256: string;
    };
    alignedExport: {
      manifestPath: string;
      manifestSha256: string;
      semanticMaskRegistrationDigest: string;
    };
    immutable: {
      geometrySignature: string;
      buildingPlacementIds: string[];
      propPlacementIds: string[];
      anchorIds: string[];
      semanticMaskIds: string[];
      buildingTransformDigest: string;
      propTransformDigest: string;
      cameraDigest: string;
      canvasDigest: string;
      anchorDigest: string;
      semanticMaskDigest: string;
    };
  };
  reference: {
    status: 'provisional-local-reference' | 'approved';
    path: string;
    sha256: string;
    sourcePath: string;
    sourceSha256: string;
    generatedBy: string;
    prompt: string;
    promptTerminology: string;
    rubric: {
      required: string[];
      rejected: string[];
      hierarchy: string[];
    };
  };
  grammar: {
    id: string;
    path: string;
    sha256: string;
  };
  surfaceTreatment: {
    window: {
      colorTokenId: string;
      roughness: number;
      metallic: number;
      emissionStrength: number;
    };
    ground: Array<{
      sourceMaterial: string;
      color: string;
      roughness: number;
    }>;
    families: Array<{
      materialFamily: 'cold-institutional' | 'hidzu-controlled-access' | 'worn-civilian-edge';
      mixFactor: number;
      roughnessFloor: number;
      metallicCeiling: number;
    }>;
  };
  materialOverrides: Array<{
    placementId: string;
    materialFamily: 'cold-institutional' | 'hidzu-controlled-access' | 'worn-civilian-edge';
    surfaceColorTokenIds: string[];
    provenance: 'procedural-override';
  }>;
  additions: Array<{
    id: string;
    target: {
      kind: 'placement' | 'anchor';
      id: string;
    };
    kind: Level0HidzuAdditionKind;
    purpose: Level0HidzuAdditionPurpose;
    collisionEffect: 'none';
    grammarId: string;
    messageTemplateIds: string[];
    provenance: 'procedural-original';
  }>;
  practicalLights: Array<{
    id: string;
    sourceAdditionId: string;
    anchorId: string;
    visibleSource: boolean;
    colorTokenId: string;
    direction: 'upper-left';
    stateIntensity: Record<Level0LightingState, number>;
  }>;
  publicMessageTemplates: Array<{
    id: string;
    theme:
      | 'safety'
      | 'efficiency'
      | 'transit'
      | 'identity-continuity'
      | 'civic-sentiment'
      | 'suppression'
      | 'controlled-access';
    copy: string;
    scope: 'visual-template';
    revealsFactIds: string[];
  }>;
  scheduleStates: Array<{
    id: Level0LightingState;
    geometrySignature: string;
    ambientColorTokenId: string;
    practicalLightMultiplier: number;
    atmosphereOpacity: number;
    architectureMidtoneFloor: number;
  }>;
  captures: Array<{
    id: string;
    width: number;
    height: number;
    zoom: number;
    framing: 'default' | 'minimum' | 'proof';
    targetId: string;
    schedule: Level0LightingState;
    evidence: 'live-art' | 'simulated-t8-hook';
  }>;
  output: {
    pathPrefix: 'environment/level0/t5';
    fallbackProfile: 'level0-greybox';
    budget: {
      maxTotalBytes: number;
      maxTileBytes: number;
    };
  };
  exclusions: string[];
  provenance: {
    sourceTicket: 'GET-204';
    treatmentTicket: 'GET-205';
    generatedOutputsIgnored: boolean;
    rawLicensedGeometryCommitted: boolean;
  };
}

export interface Level0HidzuTreatmentEvidence {
  sourceManifestSha256: string;
  sceneRecipeSha256: string;
  layoutContractSha256: string;
  masterSceneSha256: string;
  masterSceneMetadataSha256: string;
  baseArtManifestSha256: string;
  semanticMaskRegistrationDigest: string;
  referenceSha256: string;
  visualGrammarSha256: string;
  geometrySignature: string;
  buildingTransformDigest: string;
  propTransformDigest: string;
  cameraDigest: string;
  canvasDigest: string;
  anchorDigest: string;
  semanticMaskDigest: string;
  exactEntitlementEvidence: 'unavailable' | 'verified';
}

export interface Level0HidzuTreatmentBundle {
  treatment: Level0HidzuTreatmentManifest;
  grammar: Level0HidzuVisualGrammar;
  evidence: Level0HidzuTreatmentEvidence;
}
