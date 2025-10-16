import { LEVEL_DEFINITIONS } from '../content/levels/index';
import { MISSION_DEFINITIONS } from '../content/missions/index';
import { QUEST_DEFINITIONS } from '../content/quests/index';
import { NPC_REGISTRATIONS } from '../content/npcs';
import { NARRATIVE_LOCALE_BUNDLES, SUPPORTED_LOCALES } from '../content/locales';

describe('narrative locale coverage', () => {
  const levelKeys = LEVEL_DEFINITIONS.map((definition) => definition.resourceKey);
  const missionKeys = MISSION_DEFINITIONS.map((definition) => definition.resourceKey);
  const questKeys = QUEST_DEFINITIONS.map((definition) => definition.resourceKey);
  const npcKeys = NPC_REGISTRATIONS.map((registration) => registration.resourceKey);

  SUPPORTED_LOCALES.forEach((locale) => {
    const bundle = NARRATIVE_LOCALE_BUNDLES[locale];

    describe(locale, () => {
      it('has translations for every level', () => {
        levelKeys.forEach((key) => {
          const entry = bundle.levels[key];
          expect(entry).toBeDefined();
          expect(entry?.name.trim().length).toBeGreaterThan(0);
        });
      });

      it('has translations for every mission', () => {
        missionKeys.forEach((key) => {
          const entry = bundle.missions[key];
          expect(entry).toBeDefined();
          expect(entry?.label.trim().length).toBeGreaterThan(0);
          expect(entry?.summary.trim().length).toBeGreaterThan(0);
        });
      });

      it('has translations for every quest', () => {
        questKeys.forEach((key) => {
          const entry = bundle.quests[key];
          expect(entry).toBeDefined();
          expect(entry?.name.trim().length).toBeGreaterThan(0);
          expect(entry?.description.trim().length).toBeGreaterThan(0);
        });
      });

      it('has translations for every narrative NPC', () => {
        npcKeys.forEach((key) => {
          const entry = bundle.npcs[key];
          expect(entry).toBeDefined();
          expect(entry?.name.trim().length).toBeGreaterThan(0);
        });
      });
    });
  });
});
