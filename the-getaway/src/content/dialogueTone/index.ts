import { ToneLibrary, ToneAuthorFingerprint, TonePersonaDefinition, SceneToneHint } from '../../game/narrative/dialogueTone/toneTypes';
import { TONE_AUTHORS, DEFAULT_AUTHOR_ID, getToneAuthor, listToneAuthors } from './authors';
import { TONE_PERSONAS, DEFAULT_PERSONA_ID, getTonePersona, listTonePersonas } from './personas';
import { TONE_SCENES, getToneScene, listToneScenes } from './scenes';
import { TONE_TEMPLATES } from './templates';
import { TONE_PALETTES } from './palettes';

export const buildToneLibrary = (): ToneLibrary => ({
  authors: TONE_AUTHORS,
  personas: TONE_PERSONAS,
  scenes: TONE_SCENES,
  templates: TONE_TEMPLATES,
  palettes: TONE_PALETTES,
  motifDefaults: {
    'motif.streetlight': 0,
    'motif.rain_hum': 0,
    'motif.compass': 0,
    'motif.glowsticks': 0,
  },
});

export const getDefaultAuthor = (): ToneAuthorFingerprint => getToneAuthor(DEFAULT_AUTHOR_ID);

export const getDefaultPersona = (): TonePersonaDefinition => getTonePersona(DEFAULT_PERSONA_ID);

export const listToneAuthorsContent = listToneAuthors;
export const listTonePersonasContent = listTonePersonas;
export const listToneScenesContent = listToneScenes;
export const getToneSceneHint = (id: string): SceneToneHint | undefined => getToneScene(id);
