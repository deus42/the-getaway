import fs from 'node:fs';
import path from 'node:path';
import {
  GAME_BIBLE_CATALOG,
  getRenderedBibleText,
  searchGameBible,
  validateGameBibleCatalog,
} from '../content/gameBible/catalog';
import {
  GAME_BIBLE_DECISION_COVERAGE,
  NON_PLAYER_FACING_DECISIONS,
} from '../content/gameBible/traceability';
import { REQUIRED_GAME_BIBLE_TOPICS } from '../content/gameBible/coverage';

const FORBIDDEN_PLAYER_TEXT =
  /OPEN-|GDR-|GET-\d+|Linear|provisional|unresolved|under review|recommended|recommendation|awaiting approval|Removed|Superseded|rejected|historical|implementation owner|delivery process|repository|commit|coverage|\[\[|memory-bank\/|progress\/|src\//i;

const chapterShape = (locale: 'en' | 'uk') =>
  GAME_BIBLE_CATALOG[locale].chapters.map((chapter) => ({
    id: chapter.id,
    sectionIds: chapter.sections.map((section) => section.id),
    blockTypes: chapter.sections.map((section) => section.blocks.map((block) => block.type)),
    topicIds: chapter.sections.map((section) => section.topicIds),
    roles: chapter.sections.map((section) => section.roles),
    relatedChapterIds: chapter.relatedChapterIds,
  }));

describe('in-game Game Design Bible content', () => {
  it('contains sixteen structurally equivalent EN/UK chapters', () => {
    expect(GAME_BIBLE_CATALOG.en.chapters).toHaveLength(16);
    expect(chapterShape('uk')).toEqual(chapterShape('en'));
    expect(validateGameBibleCatalog()).toEqual([]);
  });

  it('keeps governance, uncertainty, implementation, and history out of rendered copy', () => {
    expect(getRenderedBibleText('en')).not.toMatch(FORBIDDEN_PLAYER_TEXT);
    expect(getRenderedBibleText('uk')).not.toMatch(FORBIDDEN_PLAYER_TEXT);
  });

  it('covers every required topic and semantic chapter role in both locales', () => {
    const required = new Set(REQUIRED_GAME_BIBLE_TOPICS.map((topic) => topic.id));
    for (const locale of ['en', 'uk'] as const) {
      const chapters = GAME_BIBLE_CATALOG[locale].chapters;
      const covered = new Set(
        chapters.flatMap((chapter) => chapter.sections.flatMap((section) => section.topicIds))
      );
      expect([...required].filter((id) => !covered.has(id))).toEqual([]);
      for (const chapter of chapters) {
        const roles = new Set(chapter.sections.flatMap((section) => section.roles));
        expect(roles).toEqual(new Set([
          'purpose',
          'player-flow',
          'rules-and-examples',
          'connections',
          'feedback',
          'failure-recovery-persistence-restart',
          'see-also',
        ]));
      }
    }
  });

  it('accounts independently for every Approved canonical decision', () => {
    const registerPath = path.resolve(
      process.cwd(),
      '../memory-bank/01 MVP/12 Game Design Decision Register.md'
    );
    const register = fs.readFileSync(registerPath, 'utf8');
    const approved = [...register.matchAll(
      /^\| (GDR-[A-Z]+-\d+) \|[^\n]+\| Approved \|/gm
    )].map((match) => match[1]);
    const playerFacing = new Set(Object.keys(GAME_BIBLE_DECISION_COVERAGE));
    const internal = new Set(Object.keys(NON_PLAYER_FACING_DECISIONS));
    expect([...approved].filter((id) => !playerFacing.has(id) && !internal.has(id))).toEqual([]);
    expect([...playerFacing].filter((id) => !approved.includes(id))).toEqual([]);
    expect([...internal].filter((id) => !approved.includes(id))).toEqual([]);
  });

  it('resolves every canonical source reference used to author the player-facing projection', () => {
    const refs = new Set(
      GAME_BIBLE_CATALOG.en.chapters.flatMap((chapter) =>
        chapter.sections.flatMap((section) => section.sourceRefs)
      )
    );
    const missing = [...refs].filter((ref) => {
      const sourcePath = ref.split('#')[0];
      return !fs.existsSync(path.resolve(process.cwd(), '..', sourcePath));
    });
    expect(missing).toEqual([]);
  });

  it.each(['en', 'uk'] as const)(
    'searches every indexed field independently in %s',
    (locale) => {
      const fixtures = GAME_BIBLE_CATALOG[locale].searchFixtures;
      for (const field of ['chapterTitle', 'chapterSummary', 'sectionTitle', 'body', 'keyword'] as const) {
        const fixture = fixtures[field];
        const result = searchGameBible(locale, fixture.query);
        expect(result.map((entry) => `${entry.chapterId}/${entry.sectionId}`)).toContain(
          `${fixture.chapterId}/${fixture.sectionId}`
        );
        expect(result[0]?.label).toBeTruthy();
        expect(result[0]?.excerpt).toBeTruthy();
      }
    }
  );
});
