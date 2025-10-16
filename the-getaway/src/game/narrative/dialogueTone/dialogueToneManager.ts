import { mixDialogueTone } from './dialogueToneMixer';
import {
  ToneBlendResult,
  ToneLibrary,
  ToneMotifState,
  TonePersonaDefinition,
} from './toneTypes';
import {
  buildToneLibrary,
  getDefaultAuthor,
  getDefaultPersona,
  getToneSceneHint,
} from '../../../content/dialogueTone';
import { getToneAuthor } from '../../../content/dialogueTone/authors';
import { getTonePersona } from '../../../content/dialogueTone/personas';
import { Dialogue, DialogueNode, DialogueToneConfig } from '../../interfaces/types';

export type ToneResolutionSource = 'generated' | 'fallback';

export interface ToneResolutionResult {
  text: string;
  source: ToneResolutionSource;
  metadata?: ToneBlendResult;
}

export interface ToneResolutionRequest {
  dialogue: Dialogue;
  node: DialogueNode;
  fallbackText: string;
  seedOverride?: string;
}

const mergeToneConfig = (defaults?: DialogueToneConfig, overrides?: DialogueToneConfig): DialogueToneConfig | undefined => {
  if (!defaults) {
    return overrides;
  }
  if (!overrides) {
    return defaults;
  }
  return {
    ...defaults,
    ...overrides,
  };
};

const buildCacheKey = (
  seed: string,
  personaId: string,
  authorId: string,
  sceneId?: string,
  templateId?: string,
) => `${seed}::persona:${personaId}::author:${authorId}::scene:${sceneId ?? 'none'}::template:${templateId ?? 'any'}`;

const cloneMotifState = (state: ToneMotifState | undefined, library: ToneLibrary): ToneMotifState => {
  if (state) {
    return { ...state };
  }
  if (library.motifDefaults) {
    return { ...library.motifDefaults };
  }
  return {};
};

const resolveSeed = (
  dialogue: Dialogue,
  node: DialogueNode,
  tone: DialogueToneConfig | undefined,
  seedOverride?: string,
) => {
  const seedKey = tone?.seedKey ?? seedOverride ?? 'default';
  return `${dialogue.id}:${node.id}:${seedKey}`;
};

const resolvePersonaId = (
  dialogue: Dialogue,
  tone: DialogueToneConfig | undefined,
): string | undefined => {
  if (tone?.personaId) {
    return tone.personaId;
  }
  if (dialogue.toneDefaults?.personaId) {
    return dialogue.toneDefaults.personaId;
  }
  return undefined;
};

class DialogueToneManager {
  private library: ToneLibrary;

  private motifStates: Map<string, ToneMotifState>;

  private cache: Map<string, ToneBlendResult>;

  private defaultAuthor = getDefaultAuthor();

  private defaultPersona = getDefaultPersona();

  constructor() {
    this.library = buildToneLibrary();
    this.motifStates = new Map();
    this.cache = new Map();
  }

  private resolvePersona = (personaId: string | undefined): TonePersonaDefinition => {
    if (!personaId) {
      return this.defaultPersona;
    }
    return getTonePersona(personaId);
  };

  private resolveShouldGenerate = (tone: DialogueToneConfig | undefined): boolean => tone?.useGenerated !== false;

  reset = (): void => {
    this.cache.clear();
    this.motifStates.clear();
  };

  resetDialogue = (dialogueId: string): void => {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${dialogueId}:`)) {
        this.cache.delete(key);
      }
    }
  };

  resolveLine = (request: ToneResolutionRequest): ToneResolutionResult => {
    const { dialogue, node, fallbackText, seedOverride } = request;
    const tone = mergeToneConfig(dialogue.toneDefaults, node.tone);

    if (!tone || !this.resolveShouldGenerate(tone)) {
      return { text: fallbackText, source: 'fallback' };
    }

    const author = tone.authorId ? getToneAuthor(tone.authorId) : this.defaultAuthor;
    const persona = this.resolvePersona(resolvePersonaId(dialogue, tone));
    const scene = tone.sceneId ? getToneSceneHint(tone.sceneId) : undefined;

    const seed = resolveSeed(dialogue, node, tone, seedOverride);
    const cacheKey = buildCacheKey(seed, persona.id, author.id, scene?.id, tone.templateId);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return {
        text: cached.render.text,
        source: 'generated',
        metadata: cached,
      };
    }

    const motifState = cloneMotifState(this.motifStates.get(persona.id), this.library);

    const result = mixDialogueTone(
      {
        author,
        persona,
        scene,
        requestedTemplateId: tone.templateId,
        seed,
        motifState,
      },
      this.library,
    );

    this.cache.set(cacheKey, result);
    this.motifStates.set(persona.id, result.motifState);

    return {
      text: result.render.text,
      source: 'generated',
      metadata: result,
    };
  };
}

export const dialogueToneManager = new DialogueToneManager();
