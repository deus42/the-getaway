import {
  BASELINE_TONE_VECTOR,
  DEFAULT_RHETORIC,
  DEFAULT_TONE_WEIGHTS,
  PaletteEntry,
  PaletteSelection,
  SceneToneHint,
  TemplateConstraint,
  ToneAuthorFingerprint,
  ToneBlendRequest,
  ToneBlendResult,
  ToneBlendWeights,
  ToneLibrary,
  ToneMotifState,
  TonePersonaDefinition,
  ToneRenderResult,
  ToneTemplate,
  ToneTraitId,
  ToneVector,
  TONE_TRAITS,
} from './toneTypes';
import { mergeWithDefaultRhetoric } from './toneSchema';
import { createSeededRng } from './seededRng';

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const normalizeWeights = (weights: Partial<ToneBlendWeights> | undefined, hasScene: boolean): ToneBlendWeights => {
  const merged = {
    ...DEFAULT_TONE_WEIGHTS,
    ...weights,
  };

  if (!hasScene) {
    const total = merged.author + merged.persona;
    if (total === 0) {
      return { author: 0.5, persona: 0.5, scene: 0 };
    }
    return {
      author: merged.author / total,
      persona: merged.persona / total,
      scene: 0,
    };
  }

  const total = merged.author + merged.persona + merged.scene;
  if (total === 0) {
    return { author: 0.4, persona: 0.4, scene: 0.2 };
  }

  return {
    author: merged.author / total,
    persona: merged.persona / total,
    scene: merged.scene / total,
  };
};

const expandTraits = (profile: ToneAuthorFingerprint | TonePersonaDefinition | SceneToneHint | undefined): ToneVector => {
  if (!profile) {
    return { ...BASELINE_TONE_VECTOR };
  }

  return TONE_TRAITS.reduce<ToneVector>((accumulator, trait) => {
    const value = profile.traits?.[trait];
    if (typeof value === 'number' && !Number.isNaN(value)) {
      accumulator[trait] = clamp(value, 0, 1);
    } else {
      accumulator[trait] = BASELINE_TONE_VECTOR[trait];
    }
    return accumulator;
  }, {} as ToneVector);
};

const blendVectors = (
  weights: ToneBlendWeights,
  author: ToneVector,
  persona: ToneVector,
  scene?: ToneVector,
): ToneVector => {
  return TONE_TRAITS.reduce<ToneVector>((accumulator, trait) => {
    const authorValue = author[trait] ?? 0.5;
    const personaValue = persona[trait] ?? 0.5;
    const sceneValue = scene ? scene[trait] ?? 0.5 : 0.5;

    const weighted =
      authorValue * weights.author +
      personaValue * weights.persona +
      sceneValue * weights.scene;

    accumulator[trait] = clamp(weighted, 0, 1);
    return accumulator;
  }, {} as ToneVector);
};

const blendRhetoric = (
  weights: ToneBlendWeights,
  author: ToneAuthorFingerprint,
  persona: TonePersonaDefinition,
  scene?: SceneToneHint,
) => {
  const authorRhetoric = mergeWithDefaultRhetoric(author);
  const personaRhetoric = mergeWithDefaultRhetoric(persona);
  const sceneRhetoric = scene ? mergeWithDefaultRhetoric(scene) : DEFAULT_RHETORIC;

  return {
    sentenceLengthMean:
      authorRhetoric.sentenceLengthMean * weights.author +
      personaRhetoric.sentenceLengthMean * weights.persona +
      sceneRhetoric.sentenceLengthMean * weights.scene,
    sentenceLengthStdDev:
      authorRhetoric.sentenceLengthStdDev * weights.author +
      personaRhetoric.sentenceLengthStdDev * weights.persona +
      sceneRhetoric.sentenceLengthStdDev * weights.scene,
    metaphorRate:
      authorRhetoric.metaphorRate * weights.author +
      personaRhetoric.metaphorRate * weights.persona +
      sceneRhetoric.metaphorRate * weights.scene,
    fragmentPreference:
      authorRhetoric.fragmentPreference * weights.author +
      personaRhetoric.fragmentPreference * weights.persona +
      sceneRhetoric.fragmentPreference * weights.scene,
    motifDensity:
      authorRhetoric.motifDensity * weights.author +
      personaRhetoric.motifDensity * weights.persona +
      sceneRhetoric.motifDensity * weights.scene,
  };
};

const applyTraitInfluenceToRhetoric = (traits: ToneVector, rhetoric: ReturnType<typeof blendRhetoric>) => {
  const clampLog: Array<{ trait: ToneTraitId; from: number; to: number }> = [];

  const targetSentenceLength =
    DEFAULT_RHETORIC.sentenceLengthMean +
    traits.melancholy * 4 -
    traits.urgency * 5 +
    traits.surrealism * 3 +
    traits.wit * 1 -
    traits.sarcasm * 1;

  const sentenceLength = clamp(
    (rhetoric.sentenceLengthMean + targetSentenceLength) / 2,
    6,
    28,
  );

  if (Math.abs(sentenceLength - rhetoric.sentenceLengthMean) > 0.01) {
    clampLog.push({
      trait: 'urgency',
      from: rhetoric.sentenceLengthMean,
      to: sentenceLength,
    });
    rhetoric.sentenceLengthMean = sentenceLength;
  }

  const fragmentBaseline = 0.15 + traits.sarcasm * 0.25 + traits.urgency * 0.3 - traits.steadiness * 0.2;
  const fragmentPreference = clamp(
    (rhetoric.fragmentPreference + fragmentBaseline) / 2,
    0,
    0.85,
  );

  if (Math.abs(fragmentPreference - rhetoric.fragmentPreference) > 0.01) {
    clampLog.push({
      trait: 'sarcasm',
      from: rhetoric.fragmentPreference,
      to: fragmentPreference,
    });
    rhetoric.fragmentPreference = fragmentPreference;
  }

  const metaphorTarget =
    DEFAULT_RHETORIC.metaphorRate +
    traits.surrealism * 0.4 +
    traits.melancholy * 0.2 -
    traits.urgency * 0.25;

  const metaphorRate = clamp(
    (rhetoric.metaphorRate + metaphorTarget) / 2,
    0,
    0.9,
  );

  if (Math.abs(metaphorRate - rhetoric.metaphorRate) > 0.01) {
    clampLog.push({
      trait: 'surrealism',
      from: rhetoric.metaphorRate,
      to: metaphorRate,
    });
    rhetoric.metaphorRate = metaphorRate;
  }

  return clampLog;
};

const motifDecay = (state: ToneMotifState): ToneMotifState =>
  Object.entries(state).reduce<ToneMotifState>((accumulator, [motifId, count]) => {
    const nextCount = Math.max(0, count - 1);
    if (nextCount > 0) {
      accumulator[motifId] = nextCount;
    }
    return accumulator;
  }, {});

const passesConstraint = (
  constraint: TemplateConstraint,
  traits: ToneVector,
  motifState: ToneMotifState,
) => {
  switch (constraint.type) {
    case 'requiresTrait':
      if (!constraint.trait || typeof constraint.threshold !== 'number') {
        return true;
      }
      return traits[constraint.trait] >= constraint.threshold;
    case 'forbidsTrait':
      if (!constraint.trait || typeof constraint.threshold !== 'number') {
        return true;
      }
      return traits[constraint.trait] <= constraint.threshold;
    case 'maxSentenceLength':
      return true;
    case 'requiresMotif':
      if (!constraint.motifId) {
        return true;
      }
      return (motifState[constraint.motifId] ?? 0) > 0;
    default:
      return true;
  }
};

const templateMatches = (
  template: ToneTemplate,
  traits: ToneVector,
  motifState: ToneMotifState,
): boolean => {
  if (template.requiredTraits) {
    const requiredEntries = Object.entries(template.requiredTraits) as Array<[ToneTraitId, number]>;
    if (requiredEntries.some(([trait, value]) => traits[trait] < value)) {
      return false;
    }
  }

  if (template.forbiddenTraits) {
    const forbiddenEntries = Object.entries(template.forbiddenTraits) as Array<[ToneTraitId, number]>;
    if (forbiddenEntries.some(([trait, value]) => traits[trait] > value)) {
      return false;
    }
  }

  if (template.constraints) {
    return template.constraints.every((constraint) => passesConstraint(constraint, traits, motifState));
  }

  return true;
};

const scoreTemplate = (
  template: ToneTemplate,
  traits: ToneVector,
  author: ToneAuthorFingerprint,
  persona: TonePersonaDefinition,
): number => {
  let score = 1;

  if (template.traitWeightBoost) {
    for (const [traitKey, weight] of Object.entries(template.traitWeightBoost) as Array<[ToneTraitId, number]>) {
      score += (traits[traitKey] ?? 0.5) * weight;
    }
  }

  if (author.templateBias?.includes(template.id)) {
    score += 0.75;
  }

  if (persona.templateBias?.includes(template.id)) {
    score += 0.75;
  }

  return Math.max(score, 0.1);
};

const pickTemplate = (
  request: ToneBlendRequest,
  library: ToneLibrary,
  traits: ToneVector,
  motifState: ToneMotifState,
): ToneTemplate => {
  if (request.requestedTemplateId) {
    const forced = library.templates.find((entry) => entry.id === request.requestedTemplateId);
    if (forced) {
      return forced;
    }
  }

  const candidates = library.templates.filter((template) =>
    templateMatches(template, traits, motifState),
  );

  if (candidates.length === 0) {
    const fallbackId =
      request.persona.fallbackTemplates?.[0] ??
      request.author.fallbackTemplates?.[0];
    const fallbackTemplate = fallbackId
      ? library.templates.find((entry) => entry.id === fallbackId)
      : undefined;
    if (fallbackTemplate) {
      return fallbackTemplate;
    }
    if (library.templates.length === 0) {
      throw new Error('No dialogue tone templates defined.');
    }
    return library.templates[0];
  }

  const rng = createSeededRng(`${request.seed ?? 'tone'}::template`);
  const scored = candidates.map((template) => ({
    template,
    weight: scoreTemplate(template, traits, request.author, request.persona),
  }));

  const total = scored.reduce((accumulator, entry) => accumulator + entry.weight, 0);
  let roll = rng.next() * total;

  for (const entry of scored) {
    if (roll <= entry.weight) {
      return entry.template;
    }
    roll -= entry.weight;
  }

  return scored[scored.length - 1].template;
};

const findPalette = (library: ToneLibrary, paletteId: string) => {
  const palette = library.palettes.find((entry) => entry.id === paletteId);
  if (!palette) {
    throw new Error(`Missing palette ${paletteId} referenced by tone template.`);
  }
  return palette;
};

const applyLexiconOverrides = (
  persona: TonePersonaDefinition,
  slotId: string,
): string[] | undefined => {
  return persona.lexiconOverrides?.[slotId];
};

const scorePaletteEntry = (
  entry: PaletteEntry,
  traits: ToneVector,
  persona: TonePersonaDefinition,
  motifState: ToneMotifState,
): number => {
  let score = entry.weight;

  if (entry.traitInfluence) {
    for (const [traitKey, weight] of Object.entries(entry.traitInfluence) as Array<[ToneTraitId, number]>) {
      score += (traits[traitKey] ?? 0.5) * weight;
    }
  }

  if (entry.motifId) {
    const motifCount = motifState[entry.motifId] ?? 0;
    score -= motifCount * 0.35;
    if (persona.motifBias?.includes(entry.motifId)) {
      score += 0.5;
    }
  }

  return Math.max(score, 0);
};

const selectPaletteEntry = (
  paletteId: string,
  slotId: string,
  traits: ToneVector,
  request: ToneBlendRequest,
  library: ToneLibrary,
  motifState: ToneMotifState,
  rngSeed: string,
): PaletteSelection => {
  const overrides = applyLexiconOverrides(request.persona, slotId);
  if (overrides && overrides.length > 0) {
    const rng = createSeededRng(`${rngSeed}::override::${slotId}`);
    const text = overrides[rng.nextInt(overrides.length)];
    return {
      paletteId,
      entryId: 'override',
      text,
    };
  }

  const palette = findPalette(library, paletteId);
  const rng = createSeededRng(`${rngSeed}::palette::${paletteId}`);

  const scored = palette.entries.map((entry) => ({
    entry,
    weight: scorePaletteEntry(entry, traits, request.persona, motifState),
  }));

  const total = scored.reduce((accumulator, item) => accumulator + item.weight, 0);

  if (total <= 0) {
    const fallbackText = palette.defaultText ?? palette.entries[0]?.text;
    if (!fallbackText) {
      throw new Error(`Palette ${paletteId} has no viable entries.`);
    }
    return {
      paletteId,
      entryId: 'fallback',
      text: fallbackText,
    };
  }

  let roll = rng.next() * total;
  for (const { entry, weight } of scored) {
    if (roll <= weight) {
      return {
        paletteId,
        entryId: entry.id,
        text: entry.text,
      };
    }
    roll -= weight;
  }

  const last = scored[scored.length - 1].entry;
  return {
    paletteId,
    entryId: last.id,
    text: last.text,
  };
};

const fillTemplate = (
  template: ToneTemplate,
  selections: Record<string, PaletteSelection>,
): string => {
  return template.template.replace(/\{\{(.*?)\}\}/g, (_, rawSlot) => {
    const slotId = rawSlot.trim();
    const selection = selections[slotId];
    if (!selection) {
      return template.slots.find((slot) => slot.id === slotId)?.fallback ?? '';
    }
    return selection.text;
  });
};

export const mixDialogueTone = (
  request: ToneBlendRequest,
  library: ToneLibrary,
): ToneBlendResult => {
  const weights = normalizeWeights(request.weights, Boolean(request.scene));
  const authorTraits = expandTraits(request.author);
  const personaTraits = expandTraits(request.persona);
  const sceneTraits = request.scene ? expandTraits(request.scene) : undefined;

  const blendedTraits = blendVectors(weights, authorTraits, personaTraits, sceneTraits);
  const rhetoric = blendRhetoric(weights, request.author, request.persona, request.scene);
  const clampLog = applyTraitInfluenceToRhetoric(blendedTraits, rhetoric);

  const motifState = motifDecay(request.motifState ?? {});

  const template = pickTemplate(request, library, blendedTraits, motifState);

  if (!template.supportsFragments && rhetoric.fragmentPreference > 0.55) {
    clampLog.push({
      trait: 'steadiness',
      from: rhetoric.fragmentPreference,
      to: 0.45,
    });
    rhetoric.fragmentPreference = 0.45;
  }

  if (template.maxSentenceLength && rhetoric.sentenceLengthMean > template.maxSentenceLength) {
    clampLog.push({
      trait: 'steadiness',
      from: rhetoric.sentenceLengthMean,
      to: template.maxSentenceLength,
    });
    rhetoric.sentenceLengthMean = template.maxSentenceLength;
  }

  const motifUpdates: ToneMotifState = { ...motifState };
  const selections = template.slots.reduce<Record<string, PaletteSelection>>((accumulator, slot) => {
    const selection = selectPaletteEntry(
      slot.paletteId,
      slot.id,
      blendedTraits,
      request,
      library,
      motifUpdates,
      request.seed ?? 'tone',
    );
    accumulator[slot.id] = selection;
    const paletteEntry = library.palettes
      .find((palette) => palette.id === slot.paletteId)?.entries
      .find((entry) => entry.id === selection.entryId);

    const entryMotifId = paletteEntry?.motifId;
    if (entryMotifId) {
      motifUpdates[entryMotifId] = (motifUpdates[entryMotifId] ?? 0) + 2;
    }
    return accumulator;
  }, {});

  const text = fillTemplate(template, selections);
  const previousMotifState = request.motifState ?? {};

  const render: ToneRenderResult = {
    templateId: template.id,
    text,
    slots: selections,
    motifsApplied: Object.keys(motifUpdates).filter(
      (motifId) => (motifUpdates[motifId] ?? 0) > (previousMotifState[motifId] ?? 0),
    ),
  };

  return {
    traits: blendedTraits,
    rhetoric,
    weights,
    clampLog,
    render,
    motifState: motifUpdates,
    seed: request.seed ?? 'tone',
    metadata: {
      authorId: request.author.id,
      personaId: request.persona.id,
      sceneId: request.scene?.id,
      templateId: template.id,
    },
  };
};
