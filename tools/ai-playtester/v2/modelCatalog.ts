import { CODEX_MODEL } from './worker.ts';

export interface PinnedModelCatalogEvidence {
  slug: typeof CODEX_MODEL;
  displayName: string;
  supportsHigh: true;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export const parsePinnedModelCatalog = (json: string): PinnedModelCatalogEvidence => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new Error(`Codex model catalog is not JSON: ${(error as Error).message}`);
  }
  if (!isRecord(parsed) || !Array.isArray(parsed.models)) {
    throw new Error('Codex model catalog has no models array.');
  }
  const model = parsed.models.find((entry) => isRecord(entry) && entry.slug === CODEX_MODEL);
  if (!isRecord(model)) {
    throw new Error(`Exact model ${CODEX_MODEL} is unavailable in the current Codex catalog.`);
  }
  const reasoning = Array.isArray(model.supported_reasoning_levels)
    ? model.supported_reasoning_levels
    : [];
  const supportsHigh = reasoning.some((entry) => isRecord(entry) && entry.effort === 'high');
  if (!supportsHigh) {
    throw new Error(`Exact model ${CODEX_MODEL} does not advertise high reasoning.`);
  }
  return {
    slug: CODEX_MODEL,
    displayName: typeof model.display_name === 'string' ? model.display_name : CODEX_MODEL,
    supportsHigh: true,
  };
};
