export type GameBibleLocale = 'en' | 'uk';

export type GameBibleSectionRole =
  | 'purpose'
  | 'player-flow'
  | 'rules-and-examples'
  | 'connections'
  | 'feedback'
  | 'failure-recovery-persistence-retry'
  | 'see-also';

export type GameBibleBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'steps'; items: string[] }
  | {
      type: 'callout';
      tone: 'principle' | 'example' | 'failure';
      title: string;
      body: string;
    }
  | { type: 'table'; caption: string; columns: string[]; rows: string[][] }
  | { type: 'state-flow'; states: Array<{ label: string; description: string }> };

export interface GameBibleSection {
  id: string;
  title: string;
  roles: GameBibleSectionRole[];
  blocks: GameBibleBlock[];
  topicIds: string[];
  sourceRefs: string[];
  decisionRefs: string[];
}

export interface GameBibleChapter {
  id: string;
  group: string;
  title: string;
  summary: string;
  keywords: string[];
  sections: GameBibleSection[];
  relatedChapterIds: string[];
}

export interface GameBibleSearchFixture {
  query: string;
  chapterId: string;
  sectionId: string;
}

export interface GameBibleCatalog {
  locale: GameBibleLocale;
  title: string;
  subtitle: string;
  chapters: GameBibleChapter[];
  searchFixtures: Record<
    'chapterTitle' | 'chapterSummary' | 'sectionTitle' | 'body' | 'keyword',
    GameBibleSearchFixture
  >;
}

export interface GameBibleSearchResult {
  id: string;
  chapterId: string;
  sectionId: string;
  label: string;
  excerpt: string;
  score: number;
}

export interface GameBibleVisibleResultState {
  chapterId: string;
  sectionId: string;
  label: string;
  excerpt: string;
}

export interface GameBibleUiState {
  open: boolean;
  chapterId: string | null;
  sectionId: string | null;
  query: string;
  drawerOpen: boolean;
  resultCount: number;
  visibleResults: GameBibleVisibleResultState[];
}

export interface GameBibleChapterCopy {
  overviewTitle: string;
  overviewText: string;
  principleTitle: string;
  principleBody: string;
  flowTitle: string;
  flowSteps: string[];
  exampleText: string;
  tableCaption: string;
  tableColumns: string[];
  tableRows: string[][];
  connectionsTitle: string;
  connections: string[];
  feedbackText: string;
  recoveryTitle: string;
  recoveryText: string;
  recoveryPoints: string[];
  seeAlsoTitle: string;
  seeAlsoLabels: string[];
  closingTitle: string;
  closingBody: string;
}

export interface GameBibleChapterDraft {
  id: string;
  group: string;
  title: string;
  summary: string;
  keywords: string[];
  topicIdsBySection: [string[], string[], string[], string[], string[]];
  sourceRefs: string[];
  decisionRefs: string[];
  relatedChapterIds: string[];
  copy: GameBibleChapterCopy;
}

export const defineGameBibleChapter = (draft: GameBibleChapterDraft): GameBibleChapter => ({
  id: draft.id,
  group: draft.group,
  title: draft.title,
  summary: draft.summary,
  keywords: draft.keywords,
  relatedChapterIds: draft.relatedChapterIds,
  sections: [
    {
      id: `${draft.id}.overview`,
      title: draft.copy.overviewTitle,
      roles: ['purpose'],
      blocks: [
        { type: 'paragraph', text: draft.copy.overviewText },
        {
          type: 'callout',
          tone: 'principle',
          title: draft.copy.principleTitle,
          body: draft.copy.principleBody,
        },
      ],
      topicIds: draft.topicIdsBySection[0],
      sourceRefs: draft.sourceRefs,
      decisionRefs: draft.decisionRefs,
    },
    {
      id: `${draft.id}.in-play`,
      title: draft.copy.flowTitle,
      roles: ['player-flow', 'rules-and-examples'],
      blocks: [
        { type: 'steps', items: draft.copy.flowSteps },
        { type: 'paragraph', text: draft.copy.exampleText },
        {
          type: 'table',
          caption: draft.copy.tableCaption,
          columns: draft.copy.tableColumns,
          rows: draft.copy.tableRows,
        },
      ],
      topicIds: draft.topicIdsBySection[1],
      sourceRefs: draft.sourceRefs,
      decisionRefs: draft.decisionRefs,
    },
    {
      id: `${draft.id}.system-links`,
      title: draft.copy.connectionsTitle,
      roles: ['connections', 'feedback'],
      blocks: [
        { type: 'bullets', items: draft.copy.connections },
        { type: 'paragraph', text: draft.copy.feedbackText },
      ],
      topicIds: draft.topicIdsBySection[2],
      sourceRefs: draft.sourceRefs,
      decisionRefs: draft.decisionRefs,
    },
    {
      id: `${draft.id}.recovery`,
      title: draft.copy.recoveryTitle,
      roles: ['failure-recovery-persistence-retry'],
      blocks: [
        { type: 'paragraph', text: draft.copy.recoveryText },
        { type: 'bullets', items: draft.copy.recoveryPoints },
      ],
      topicIds: draft.topicIdsBySection[3],
      sourceRefs: draft.sourceRefs,
      decisionRefs: draft.decisionRefs,
    },
    {
      id: `${draft.id}.see-also`,
      title: draft.copy.seeAlsoTitle,
      roles: ['see-also'],
      blocks: [
        { type: 'bullets', items: draft.copy.seeAlsoLabels },
        {
          type: 'callout',
          tone: 'example',
          title: draft.copy.closingTitle,
          body: draft.copy.closingBody,
        },
      ],
      topicIds: draft.topicIdsBySection[4],
      sourceRefs: draft.sourceRefs,
      decisionRefs: draft.decisionRefs,
    },
  ],
});
