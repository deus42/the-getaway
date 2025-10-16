import { dialogueToneManager } from '../dialogueToneManager';
import { Dialogue } from '../../../interfaces/types';

describe('DialogueToneManager', () => {
  beforeEach(() => {
    dialogueToneManager.reset();
  });

  it('generates tone-aware text and caches the result', () => {
    const dialogue: Dialogue = {
      id: 'test.dialogue',
      npcId: 'Amara Velez',
      toneDefaults: {
        personaId: 'persona.amara_velez',
        authorId: 'author.vonnegut_brautigan_core',
        sceneId: 'scene.post_ambush_reassurance',
        seedKey: 'test',
      },
      nodes: [
        {
          id: 'intro',
          text: 'Fallback reassurance line.',
          options: [],
          tone: {
            sceneId: 'scene.share_scarce_food',
            templateId: 'template.deadpan.reassure',
            seedKey: 'intro',
          },
        },
      ],
    };

    const node = dialogue.nodes[0];

    const generated = dialogueToneManager.resolveLine({
      dialogue,
      node,
      fallbackText: node.text,
    });

    expect(generated.source).toBe('generated');
    expect(generated.text).not.toBe(node.text);
    expect(generated.metadata?.render.templateId).toBe('template.deadpan.reassure');

    const repeated = dialogueToneManager.resolveLine({
      dialogue,
      node,
      fallbackText: node.text,
    });

    expect(repeated.text).toBe(generated.text);
  });

  it('respects useGenerated=false and returns fallback copy', () => {
    const dialogue: Dialogue = {
      id: 'test.dialogue.fallback',
      npcId: 'Theo Anders',
      nodes: [
        {
          id: 'intro',
          text: 'Manual copy survives.',
          options: [],
          tone: {
            personaId: 'persona.theo_anders',
            sceneId: 'scene.pre_heist_briefing',
            useGenerated: false,
          },
        },
      ],
    };

    const node = dialogue.nodes[0];

    const result = dialogueToneManager.resolveLine({
      dialogue,
      node,
      fallbackText: node.text,
    });

    expect(result.source).toBe('fallback');
    expect(result.text).toBe(node.text);
  });
});
