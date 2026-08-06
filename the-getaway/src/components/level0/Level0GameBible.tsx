import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import {
  GAME_BIBLE_CATALOG,
  searchGameBible,
} from '../../content/gameBible/catalog';
import type {
  GameBibleBlock,
  GameBibleLocale,
  GameBibleUiState,
} from '../../content/gameBible/types';
import './Level0GameBible.css';

const MEMORY_KEY = 'the-getaway.game-bible.last-section';
const NARROW_MAX = 840;

const COPY = {
  en: {
    manual: 'Hidzu Intelligence Archive',
    contents: 'Contents',
    onPage: 'In this chapter',
    search: 'Search the archive',
    searchHint: 'Press / to search',
    noResults: 'No passages match this search.',
    results: 'Search results',
    previous: 'Previous chapter',
    next: 'Next chapter',
    close: 'Close',
    openContents: 'Open contents',
    closeContents: 'Close contents',
    related: 'Related chapters',
    paused: 'Reference open · simulation paused',
    startContext: 'Reference open · start menu remains unchanged',
  },
  uk: {
    manual: 'Архів розвідки Хідзу',
    contents: 'Зміст',
    onPage: 'У цій главі',
    search: 'Пошук в архіві',
    searchHint: 'Натисніть / для пошуку',
    noResults: 'За цим запитом нічого не знайдено.',
    results: 'Результати пошуку',
    previous: 'Попередня глава',
    next: 'Наступна глава',
    close: 'Закрити',
    openContents: 'Відкрити зміст',
    closeContents: 'Закрити зміст',
    related: 'Пов’язані глави',
    paused: 'Довідник відкрито · симуляцію призупинено',
    startContext: 'Довідник відкрито · стан головного меню не змінюється',
  },
} as const;

const isNarrowViewport = (): boolean =>
  typeof window !== 'undefined' && window.innerWidth <= NARROW_MAX;

const focusableElements = (root: HTMLElement): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>(
    'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
  )).filter((element) => !element.closest('[aria-hidden="true"]'));

const renderBlock = (block: GameBibleBlock, key: string): ReactNode => {
  switch (block.type) {
    case 'paragraph':
      return <p key={key}>{block.text}</p>;
    case 'bullets':
      return <ul key={key}>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
    case 'steps':
      return <ol key={key}>{block.items.map((item) => <li key={item}>{item}</li>)}</ol>;
    case 'callout':
      return (
        <aside key={key} className={`game-bible__callout game-bible__callout--${block.tone}`}>
          <strong>{block.title}</strong>
          <p>{block.body}</p>
        </aside>
      );
    case 'table':
      return (
        <div key={key} className="game-bible__table-wrap" tabIndex={0}>
          <table>
            <caption>{block.caption}</caption>
            <thead><tr>{block.columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={`${key}-${rowIndex}`}>
                  {row.map((cell, cellIndex) => cellIndex === 0
                    ? <th key={cellIndex} scope="row">{cell}</th>
                    : <td key={cellIndex}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'state-flow':
      return (
        <ol key={key} className="game-bible__state-flow">
          {block.states.map((state) => (
            <li key={state.label}><strong>{state.label}</strong><span>{state.description}</span></li>
          ))}
        </ol>
      );
  }
};

interface Level0GameBibleProps {
  locale: GameBibleLocale;
  onClose: () => void;
  simulationPaused?: boolean;
  onUiStateChange?: (state: GameBibleUiState) => void;
}

const Level0GameBible = ({
  locale,
  onClose,
  simulationPaused = false,
  onUiStateChange,
}: Level0GameBibleProps) => {
  const catalog = GAME_BIBLE_CATALOG[locale];
  const copy = COPY[locale];
  const firstChapter = catalog.chapters[0];
  const restored = useMemo(() => {
    const remembered = typeof window === 'undefined' ? null : window.sessionStorage.getItem(MEMORY_KEY);
    const [chapterId, sectionId] = remembered?.split('/') ?? [];
    const chapter = catalog.chapters.find((candidate) => candidate.id === chapterId) ?? firstChapter;
    const section = chapter.sections.find((candidate) => candidate.id === sectionId) ?? chapter.sections[0];
    return { chapterId: chapter.id, sectionId: section.id };
  }, [catalog.chapters, firstChapter]);
  const [chapterId, setChapterId] = useState(restored.chapterId);
  const [activeSectionId, setActiveSectionId] = useState(restored.sectionId);
  const [query, setQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [narrow, setNarrow] = useState(isNarrowViewport);
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerToggleRef = useRef<HTMLButtonElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);

  const currentChapter = catalog.chapters.find((chapter) => chapter.id === chapterId) ?? firstChapter;
  const currentIndex = catalog.chapters.findIndex((chapter) => chapter.id === currentChapter.id);
  const results = useMemo(() => searchGameBible(locale, query), [locale, query]);

  const selectTarget = useCallback((nextChapterId: string, nextSectionId?: string) => {
    const nextChapter = catalog.chapters.find((chapter) => chapter.id === nextChapterId) ?? firstChapter;
    const nextSection = nextChapter.sections.find((section) => section.id === nextSectionId) ?? nextChapter.sections[0];
    setChapterId(nextChapter.id);
    setActiveSectionId(nextSection.id);
    setQuery('');
    setDrawerOpen(false);
    window.sessionStorage.setItem(MEMORY_KEY, `${nextChapter.id}/${nextSection.id}`);
    window.requestAnimationFrame(() => {
      const heading = document.getElementById(`game-bible-heading-${nextSection.id}`);
      heading?.scrollIntoView({ block: 'start' });
      heading?.focus({ preventScroll: true });
    });
  }, [catalog.chapters, firstChapter]);

  useEffect(() => {
    const handleResize = () => {
      const nextNarrow = isNarrowViewport();
      setNarrow(nextNarrow);
      if (!nextNarrow) setDrawerOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    drawerCloseRef.current?.focus();
  }, [drawerOpen]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      const nextSection = visible?.target.getAttribute('data-section-id');
      if (nextSection) {
        setActiveSectionId(nextSection);
        window.sessionStorage.setItem(MEMORY_KEY, `${currentChapter.id}/${nextSection}`);
      }
    }, { root: document.querySelector('.game-bible__article-scroll'), rootMargin: '-12% 0px -72% 0px' });
    currentChapter.sections.forEach((section) => {
      const element = document.querySelector(`[data-section-id="${section.id}"]`);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [currentChapter]);

  useEffect(() => {
    onUiStateChange?.({
      open: true,
      chapterId: currentChapter.id,
      sectionId: activeSectionId,
      query,
      drawerOpen,
      resultCount: results.length,
      visibleResults: results.slice(0, 12).map(({ chapterId: resultChapter, sectionId, label, excerpt }) => ({
        chapterId: resultChapter,
        sectionId,
        label,
        excerpt,
      })),
    });
  }, [activeSectionId, currentChapter.id, drawerOpen, onUiStateChange, query, results]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === '/' && document.activeElement !== searchRef.current) {
      event.preventDefault();
      searchRef.current?.focus();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (drawerOpen) {
        setDrawerOpen(false);
        drawerToggleRef.current?.focus();
      } else if (document.activeElement === searchRef.current && query) {
        setQuery('');
      } else {
        onClose();
      }
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = focusableElements(dialogRef.current);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => {
    setDrawerOpen(false);
    drawerToggleRef.current?.focus();
  };

  return (
    <div
      className="game-bible"
      data-testid="game-bible-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="game-bible__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-bible-title"
        onKeyDown={handleKeyDown}
      >
        <header className="game-bible__masthead">
          <div className="game-bible__brand">
            <span className="game-bible__seal" aria-hidden="true">G/B</span>
            <div>
              <p>{copy.manual}</p>
              <h1 id="game-bible-title">{catalog.title}</h1>
            </div>
          </div>
          <div className="game-bible__searchbar">
            {narrow ? (
              <button
                ref={drawerToggleRef}
                type="button"
                className="game-bible__drawer-toggle"
                data-testid="game-bible-drawer-toggle"
                aria-expanded={drawerOpen}
                onClick={openDrawer}
              >
                <span aria-hidden="true">☰</span>{copy.contents}
              </button>
            ) : null}
            <label>
              <span className="sr-only">{copy.search}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4 4" /></svg>
              <input
                ref={searchRef}
                type="search"
                value={query}
                placeholder={copy.search}
                onChange={(event) => setQuery(event.target.value)}
              />
              <kbd>/</kbd>
            </label>
          </div>
          <div className="game-bible__masthead-actions">
            <span className="game-bible__pause-state">
              <i aria-hidden="true" />{simulationPaused ? copy.paused : copy.startContext}
            </span>
            <button ref={closeRef} type="button" data-testid="game-bible-close" onClick={onClose}>
              <span>{copy.close}</span><kbd>Esc</kbd>
            </button>
          </div>
        </header>

        <div className="game-bible__workspace">
          <nav
            className={`game-bible__rail${drawerOpen ? ' is-open' : ''}`}
            data-testid={narrow ? 'game-bible-chapter-drawer' : 'game-bible-chapter-rail'}
            data-open={drawerOpen ? 'true' : 'false'}
            aria-label={copy.contents}
          >
            <div className="game-bible__rail-head">
              <span>{copy.contents}</span>
              {narrow ? <button ref={drawerCloseRef} type="button" onClick={closeDrawer} aria-label={copy.closeContents}>×</button> : null}
            </div>
            <div className="game-bible__chapters">
              {catalog.chapters.map((chapter, index) => {
                const groupChanged = index === 0 || catalog.chapters[index - 1]?.group !== chapter.group;
                return (
                  <div key={chapter.id}>
                    {groupChanged ? <p>{chapter.group}</p> : null}
                    <button
                      type="button"
                      className={chapter.id === currentChapter.id ? 'is-active' : ''}
                      aria-current={chapter.id === currentChapter.id ? 'page' : undefined}
                      onClick={() => selectTarget(chapter.id)}
                    >
                      <span>{String(index + 1).padStart(2, '0')}</span>{chapter.title}
                    </button>
                  </div>
                );
              })}
            </div>
          </nav>

          <main className="game-bible__article-scroll" aria-hidden={drawerOpen && narrow ? true : undefined}>
            {query.trim() ? (
              <section className="game-bible__results" data-testid="game-bible-search-results">
                <div className="game-bible__chapter-kicker">{copy.results} / {results.length}</div>
                <h2>{query}</h2>
                {results.length ? (
                  <div className="game-bible__result-list">
                    {results.map((result) => (
                      <button key={result.id} type="button" onClick={() => selectTarget(result.chapterId, result.sectionId)}>
                        <strong>{result.label}</strong><span>{result.excerpt}</span>
                      </button>
                    ))}
                  </div>
                ) : <p className="game-bible__empty">{copy.noResults}</p>}
              </section>
            ) : (
              <article className="game-bible__article">
                <header className="game-bible__chapter-head">
                  <p className="game-bible__chapter-kicker">
                    <span className="game-bible__chapter-number">{String(currentIndex + 1).padStart(2, '0')}</span>
                    {currentChapter.group}
                  </p>
                  <h2 tabIndex={-1}>{currentChapter.title}</h2>
                  <p className="game-bible__chapter-summary">{currentChapter.summary}</p>
                </header>
                <nav className="game-bible__toc" aria-label={copy.onPage}>
                  <p>{copy.onPage}</p>
                  <div className="game-bible__toc-list">
                    {currentChapter.sections.map((section) => (
                      <button
                        key={section.id}
                        type="button"
                        className={activeSectionId === section.id ? 'is-active' : ''}
                        onClick={() => selectTarget(currentChapter.id, section.id)}
                      >{section.title}</button>
                    ))}
                  </div>
                </nav>
                {currentChapter.sections.map((section) => (
                  <section key={section.id} data-section-id={section.id} className="game-bible__section">
                    <h3 id={`game-bible-heading-${section.id}`} tabIndex={-1}>{section.title}</h3>
                    {section.blocks.map((block, index) => renderBlock(block, `${section.id}-${index}`))}
                  </section>
                ))}
                <section className="game-bible__related">
                  <p>{copy.related}</p>
                  <div>{currentChapter.relatedChapterIds.map((relatedId) => {
                    const related = catalog.chapters.find((chapter) => chapter.id === relatedId);
                    return related ? <button key={related.id} type="button" onClick={() => selectTarget(related.id)}>{related.title}<span>→</span></button> : null;
                  })}</div>
                </section>
                <footer className="game-bible__pager">
                  <button type="button" disabled={currentIndex === 0} onClick={() => selectTarget(catalog.chapters[currentIndex - 1]?.id ?? currentChapter.id)}>
                    <span>← {copy.previous}</span><strong>{catalog.chapters[currentIndex - 1]?.title ?? '—'}</strong>
                  </button>
                  <button type="button" disabled={currentIndex === catalog.chapters.length - 1} onClick={() => selectTarget(catalog.chapters[currentIndex + 1]?.id ?? currentChapter.id)}>
                    <span>{copy.next} →</span><strong>{catalog.chapters[currentIndex + 1]?.title ?? '—'}</strong>
                  </button>
                </footer>
              </article>
            )}
          </main>
        </div>
        <div className="game-bible__live-region sr-only" aria-live="polite">
          {query ? `${results.length} ${copy.results}` : currentChapter.title}
        </div>
      </div>
    </div>
  );
};

export default Level0GameBible;
