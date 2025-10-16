export const TONE_TRAITS = [
  'warmth',
  'melancholy',
  'sarcasm',
  'surrealism',
  'urgency',
  'steadiness',
  'wit',
] as const;

export type ToneTraitId = (typeof TONE_TRAITS)[number];

export type ToneVector = Record<ToneTraitId, number>;

export interface RhetoricalProfile {
  sentenceLengthMean: number;
  sentenceLengthStdDev: number;
  metaphorRate: number;
  fragmentPreference: number;
  motifDensity: number;
}

export interface ToneProfile {
  id: string;
  label: string;
  traits: Partial<ToneVector>;
  rhetoric?: Partial<RhetoricalProfile>;
  motifBias?: string[];
  lexiconOverrides?: Record<string, string[]>;
  templateBias?: string[];
  fallbackTemplates?: string[];
}

export interface ToneAuthorFingerprint extends ToneProfile {
  influences: string[];
}

export interface TonePersonaDefinition extends ToneProfile {
  personaTags?: string[];
  speechRegister?: 'formal' | 'colloquial' | 'broadcast';
}

export interface SceneToneHint extends ToneProfile {
  intent: string;
}

export interface ToneBlendWeights {
  author: number;
  persona: number;
  scene: number;
}

export interface ToneMotifState {
  [motifId: string]: number;
}

export interface TemplateSlot {
  id: string;
  paletteId: string;
  allowFragments?: boolean;
  traitFocus?: ToneTraitId[];
  fallback?: string;
}

export interface TemplateConstraint {
  type: 'requiresTrait' | 'forbidsTrait' | 'maxSentenceLength' | 'requiresMotif';
  trait?: ToneTraitId;
  threshold?: number;
  motifId?: string;
  sentenceCap?: number;
}

export interface ToneTemplate {
  id: string;
  label: string;
  template: string;
  slots: TemplateSlot[];
  supportsFragments?: boolean;
  maxSentenceLength?: number;
  requiredTraits?: Partial<ToneVector>;
  forbiddenTraits?: Partial<ToneVector>;
  constraints?: TemplateConstraint[];
  traitWeightBoost?: Partial<ToneVector>;
}

export interface PaletteEntry {
  id: string;
  text: string;
  weight: number;
  traitInfluence?: Partial<ToneVector>;
  motifId?: string;
}

export interface TonePalette {
  id: string;
  slotId: string;
  entries: PaletteEntry[];
  defaultText?: string;
}

export interface PaletteSelection {
  entryId: string;
  paletteId: string;
  text: string;
}

export interface ToneRenderResult {
  templateId: string;
  text: string;
  slots: Record<string, PaletteSelection>;
  motifsApplied: string[];
}

export interface ToneBlendRequest {
  author: ToneAuthorFingerprint;
  persona: TonePersonaDefinition;
  scene?: SceneToneHint;
  weights?: Partial<ToneBlendWeights>;
  seed?: string;
  requestedTemplateId?: string;
  motifState?: ToneMotifState;
}

export interface ToneBlendResult {
  traits: ToneVector;
  rhetoric: RhetoricalProfile;
  weights: ToneBlendWeights;
  clampLog: Array<{ trait: ToneTraitId; from: number; to: number }>;
  render: ToneRenderResult;
  motifState: ToneMotifState;
  seed: string;
  metadata: {
    authorId: string;
    personaId: string;
    sceneId?: string;
    templateId: string;
  };
}

export interface ToneLibrary {
  authors: Record<string, ToneAuthorFingerprint>;
  personas: Record<string, TonePersonaDefinition>;
  scenes: Record<string, SceneToneHint>;
  templates: ToneTemplate[];
  palettes: TonePalette[];
  motifDefaults?: ToneMotifState;
}

export const DEFAULT_TONE_WEIGHTS: ToneBlendWeights = {
  author: 0.4,
  persona: 0.4,
  scene: 0.2,
};

export const DEFAULT_RHETORIC: RhetoricalProfile = {
  sentenceLengthMean: 14,
  sentenceLengthStdDev: 4,
  metaphorRate: 0.35,
  fragmentPreference: 0.2,
  motifDensity: 0.25,
};

export const BASELINE_TONE_VECTOR: ToneVector = TONE_TRAITS.reduce<ToneVector>((accumulator, trait) => {
  accumulator[trait] = 0.5;
  return accumulator;
}, {} as ToneVector);
