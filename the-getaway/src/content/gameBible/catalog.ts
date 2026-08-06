import { EN_GAME_BIBLE_CHAPTERS } from './en';
import { UK_GAME_BIBLE_CHAPTERS } from './uk';
import { REQUIRED_GAME_BIBLE_TOPICS } from './coverage';
import type {
  GameBibleBlock,
  GameBibleCatalog,
  GameBibleLocale,
  GameBibleSearchResult,
} from './types';

const blockText = (block: GameBibleBlock): string => {
  switch (block.type) {
    case 'paragraph':
      return block.text;
    case 'bullets':
    case 'steps':
      return block.items.join(' ');
    case 'callout':
      return `${block.title} ${block.body}`;
    case 'table':
      return `${block.caption} ${block.columns.join(' ')} ${block.rows.flat().join(' ')}`;
    case 'state-flow':
      return block.states.map((state) => `${state.label} ${state.description}`).join(' ');
  }
};

export const GAME_BIBLE_CATALOG: Record<GameBibleLocale, GameBibleCatalog> = {
  en: {
    locale: 'en',
    title: 'Game Design Bible',
    subtitle: 'The complete guide to The Getaway: its world, journey, systems, rules, feedback, consequences, and continuation.',
    chapters: EN_GAME_BIBLE_CHAPTERS,
    searchFixtures: {
      chapterTitle: { query: 'What The Getaway Is', chapterId: 'identity', sectionId: 'identity.overview' },
      chapterSummary: { query: 'institutional pressure', chapterId: 'identity', sectionId: 'identity.overview' },
      sectionTitle: { query: 'How the whole game fits together', chapterId: 'identity', sectionId: 'identity.system-links' },
      body: { query: 'being ordinary and being evidence', chapterId: 'identity', sectionId: 'identity.overview' },
      keyword: { query: 'surveillance-rpg', chapterId: 'identity', sectionId: 'identity.overview' },
    },
  },
  uk: {
    locale: 'uk',
    title: 'Біблія ігрового дизайну',
    subtitle: 'Повний путівник The Getaway: світ, подорож, системи, правила, зворотний зв’язок, наслідки та продовження.',
    chapters: UK_GAME_BIBLE_CHAPTERS,
    searchFixtures: {
      chapterTitle: { query: 'Що таке The Getaway', chapterId: 'identity', sectionId: 'identity.overview' },
      chapterSummary: { query: 'інституційним тиском', chapterId: 'identity', sectionId: 'identity.overview' },
      sectionTitle: { query: 'Як уся гра працює разом', chapterId: 'identity', sectionId: 'identity.system-links' },
      body: { query: 'бути доказом', chapterId: 'identity', sectionId: 'identity.overview' },
      keyword: { query: 'рольова гра про стеження', chapterId: 'identity', sectionId: 'identity.overview' },
    },
  },
};

const normalized = (value: string): string => value.toLocaleLowerCase().normalize('NFKC');

const excerptFor = (text: string, query: string): string => {
  const clean = text.replace(/\s+/g, ' ').trim();
  const index = normalized(clean).indexOf(normalized(query));
  if (index < 0) return clean.slice(0, 170);
  const start = Math.max(0, index - 54);
  const end = Math.min(clean.length, index + query.length + 112);
  return `${start > 0 ? '…' : ''}${clean.slice(start, end)}${end < clean.length ? '…' : ''}`;
};

export const searchGameBible = (
  locale: GameBibleLocale,
  rawQuery: string
): GameBibleSearchResult[] => {
  const query = rawQuery.trim();
  if (!query) return [];
  const needle = normalized(query);
  const results: GameBibleSearchResult[] = [];

  GAME_BIBLE_CATALOG[locale].chapters.forEach((chapter, chapterIndex) => {
    chapter.sections.forEach((section, sectionIndex) => {
      const body = section.blocks.map(blockText).join(' ');
      const chapterIndexFields = sectionIndex === 0;
      const fields = [
        chapterIndexFields ? chapter.title : '',
        chapterIndexFields ? chapter.summary : '',
        section.title,
        body,
        chapterIndexFields ? chapter.keywords.join(' ') : '',
      ];
      const weights = [120, 75, 100, 55, 85];
      let score = 0;
      fields.forEach((field, index) => {
        const haystack = normalized(field);
        if (haystack === needle) score += weights[index] + 80;
        else if (haystack.includes(needle)) score += weights[index];
      });
      if (!score) return;
      results.push({
        id: `${chapter.id}/${section.id}`,
        chapterId: chapter.id,
        sectionId: section.id,
        label: `${chapter.title} — ${section.title}`,
        excerpt: excerptFor(`${chapter.summary} ${section.title} ${body}`, query),
        score: score - chapterIndex / 100 - sectionIndex / 1000,
      });
    });
  });

  return results.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, 40);
};

export const getRenderedBibleText = (locale: GameBibleLocale): string => {
  const catalog = GAME_BIBLE_CATALOG[locale];
  return [
    catalog.title,
    catalog.subtitle,
    ...catalog.chapters.flatMap((chapter) => [
      chapter.group,
      chapter.title,
      chapter.summary,
      ...chapter.sections.flatMap((section) => [
        section.title,
        ...section.blocks.map(blockText),
      ]),
    ]),
  ].join('\n');
};

export const validateGameBibleCatalog = (): string[] => {
  const errors: string[] = [];
  const topicIds = new Set(REQUIRED_GAME_BIBLE_TOPICS.map((topic) => topic.id));
  const enShape = GAME_BIBLE_CATALOG.en.chapters.map((chapter) => ({
    id: chapter.id,
    sectionIds: chapter.sections.map((section) => section.id),
    blockTypes: chapter.sections.map((section) => section.blocks.map((block) => block.type)),
  }));
  const allChapterIds = new Set(GAME_BIBLE_CATALOG.en.chapters.map((chapter) => chapter.id));

  for (const locale of ['en', 'uk'] as const) {
    const catalog = GAME_BIBLE_CATALOG[locale];
    const chapterIds = new Set<string>();
    const sectionIds = new Set<string>();
    const localeShape = catalog.chapters.map((chapter) => ({
      id: chapter.id,
      sectionIds: chapter.sections.map((section) => section.id),
      blockTypes: chapter.sections.map((section) => section.blocks.map((block) => block.type)),
    }));
    if (JSON.stringify(localeShape) !== JSON.stringify(enShape)) errors.push(`${locale}: catalog shape differs`);

    for (const chapter of catalog.chapters) {
      if (chapterIds.has(chapter.id)) errors.push(`${locale}: duplicate chapter ${chapter.id}`);
      chapterIds.add(chapter.id);
      if (!chapter.title.trim() || !chapter.summary.trim()) errors.push(`${locale}: empty chapter copy ${chapter.id}`);
      chapter.relatedChapterIds.forEach((id) => {
        if (!allChapterIds.has(id)) errors.push(`${locale}: unknown related chapter ${id}`);
      });
      for (const section of chapter.sections) {
        if (sectionIds.has(section.id)) errors.push(`${locale}: duplicate section ${section.id}`);
        sectionIds.add(section.id);
        section.topicIds.forEach((id) => {
          if (!topicIds.has(id)) errors.push(`${locale}: unknown topic ${id}`);
        });
        for (const block of section.blocks) {
          if (block.type === 'table') {
            block.rows.forEach((row) => {
              if (row.length !== block.columns.length) errors.push(`${locale}: invalid table ${section.id}`);
            });
          }
        }
      }
    }
  }
  return errors;
};

export { blockText as getGameBibleBlockText };
