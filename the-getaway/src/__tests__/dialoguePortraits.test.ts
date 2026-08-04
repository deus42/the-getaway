import {
  DIALOGUE_PORTRAITS,
  resolveDialoguePortrait,
} from '../content/dialoguePortraits';
import { CHARACTER_SPRITE_MANIFEST_BY_ID } from '../content/characters/spriteManifest';
import { level0EnglishContent } from '../content/levels/level0/locales/en';
import { level0UkrainianContent } from '../content/levels/level0/locales/uk';

describe('grounded Level 0 identity references', () => {
  it.each([
    ['lira_smuggler', 'contact_lira'],
    ['archivist_naila', 'contact_naila'],
    ['courier_brant', 'contact_brant'],
  ] as const)('binds %s to the current %s portrait', (portraitId, actorId) => {
    expect(resolveDialoguePortrait(portraitId).imagePath).toBe(
      `/${CHARACTER_SPRITE_MANIFEST_BY_ID[actorId]!.portrait.path}`
    );
  });

  it('keeps retired dialogue identities on the text fallback without stale image URLs', () => {
    for (const portraitId of [
      'firebrand_juno',
      'seraph_warden',
      'drone_handler_kesh',
      'medic_yara',
      'captain_reyna',
    ]) {
      expect(DIALOGUE_PORTRAITS[portraitId]?.imagePath).toBeUndefined();
    }
  });

  it.each([level0EnglishContent, level0UkrainianContent])(
    'does not point dormant locale actors at removed sprite sets',
    (content) => {
      for (const npc of content.npcBlueprints) {
        const spriteSetId = npc.visualProfile?.spriteSetId;
        if (spriteSetId) {
          expect(CHARACTER_SPRITE_MANIFEST_BY_ID[spriteSetId]).toBeDefined();
        }
      }
    }
  );
});
