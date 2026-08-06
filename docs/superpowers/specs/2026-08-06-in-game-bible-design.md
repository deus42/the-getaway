# In-Game Game Design Bible

Date: 2026-08-06
Owner: GET-201
Status: requester-approved and independently reviewed; implementation authorized
Commit state: standalone documentation checkpoint authorized

## 1. Outcome

The Getaway exposes the fullest practical version of its finalized game design inside the running game. The surface is called **Game Design Bible** and is available:

- before New Game from the start menu;
- from the paused menu during a run;
- directly during play with `F1`;
- in English and Ukrainian, following the active game locale.

This is not a tutorial tooltip, short controls page, development dashboard, or raw repository browser. It is a polished, exhaustive reference manual explaining what the game is, how Level 0 unfolds, how every system behaves, how systems affect each other, what feedback the player receives, how failure and Retry work, and how the MVP connects to the wider campaign.

The Bible presents only the **finalized end-state design**. It never exposes unresolved questions, provisional recommendations, tracker state, ticket ownership, implementation uncertainty, rejected alternatives, or archival discussion.

## 2. Authority and content boundary

Current explicit requester direction is the feature authority. GET-201 is reused because this is a direct correction to its documentation deliverable; no new Linear ticket is created.

The in-game Bible is a player-visible projection of the canonical Game Design Bible. Canonical design documents remain the authoring authority, but the runtime does **not** render their Markdown directly because those documents also carry governance and implementation context that must not leak into the game.

The runtime content catalog contains finalized design prose only. Each section retains non-rendered `sourceRefs` and `decisionRefs` metadata pointing to its canonical owning documents and Approved decision rows, enabling maintainers to audit individual claims without showing repository paths or governance data to players.

Completeness is not self-certified by the content catalogs. A separate test-only traceability inventory accounts for every current Approved decision and required canonical topic as one of:

- player-visible and mapped to one or more Bible section/topic IDs;
- deliberately not player-facing, with a bounded reason such as delivery governance or repository ownership;
- represented by shared language-neutral state/tuning data referenced by both locales.

The inventory is checked against the current Decision Register and required-topic registry. A new Approved decision or required topic therefore fails the Bible gate until it is either mapped into the player-visible end state or explicitly classified as non-player-facing. The English and Ukrainian catalogs cannot jointly omit the same rule without this independent gate failing.

Forbidden player-visible material includes:

- `OPEN-*`, `GDR-*`, and GET ticket identifiers;
- Linear status, labels, dependency or blocker information;
- words that frame rules as provisional, recommended, unresolved, awaiting approval, or under review;
- Removed, Superseded, rejected, or historical designs;
- implementation class/file/module ownership;
- test, build, coverage, commit, and delivery-process state;
- raw wiki links and repository paths.

Unresolved exact values are not invented. The in-game Bible explains the finalized behavior at the approved level of precision and omits undecided constants. For example, it can explain that attributable observation increases Paranoia while evidence remains active without inventing an unapproved per-second rate.

## 3. Considered approaches

### A. Curated typed bilingual catalog — selected

Final prose is represented as typed chapters, sections, and semantic blocks under `src/content/gameBible/`. This provides exact control over finality, localization parity, search, accessibility, and tests. It is the only approach that can guarantee that internal uncertainty never leaks while still providing detailed structured content.

Tradeoff: canonical changes require an explicit Bible-content update. This is acceptable because game-design changes already require atomic documentation and Linear reconciliation.

### B. Direct canonical Markdown rendering — rejected

This would minimize mirroring but would expose OPEN decisions, governance, historical sections, ticket identifiers, wiki syntax, and implementation context. Runtime filtering could also leave malformed tables or misleading fragments.

### C. Automatically generated filtered snapshot — deferred

A generator could reduce manual work, but semantic filtering cannot safely decide whether a paragraph contains a final rule plus an unresolved constant. A parser that silently deletes or retains the wrong clause would be more dangerous than an explicit curated projection.

## 4. Information architecture

The Bible has sixteen top-level chapters. Together they cover the complete product and all systems named in the canonical audit:

1. **What The Getaway Is** — fantasy, identity, player experience, pillars, content boundaries.
2. **Setting and Campaign** — Tokyo, Hidzu, Cold Iron, expatriate protagonist, Miami continuation.
3. **The Complete Level 0 Journey** — chronological New Game through `End Demo`, including optional paths.
4. **Character, Builds, Checks, and Progression** — callsign, appearance, attributes, skills, deterministic checks, XP, level-up.
5. **Health, Paranoia, Failure, and Recovery** — thresholds, sources, penalties, recovery, capture, Retry.
6. **Movement, Interaction, Camera, and Observation** — direct movement, collision slide, explicit interaction, close camera, overview, full pause.
7. **Time, Schedules, Safehouse, Save, and Retry** — 18:30 start, 30× clock, curfew, deadline, waiting, rest, persistence.
8. **Surveillance, Cameras, Security, Civilians, and Drone** — Clear/Suspicious/Pursuit, evidence, last-known position, schedules, verifier behavior.
9. **Stealth, Hiding, Blending, Interception, and Escape** — authored contexts, recovery sequence, noncombat disposition.
10. **Narrative, Dialogue, George, and Contacts** — Lira, Naila, Brant, deterministic dialogue, bounded George, truthful feedback.
11. **Facts, Dossier, Objectives, Minimap, Terminals, and Social Feed** — knowledge provenance, discovery, one-function terminals, read-only atmosphere.
12. **HUD and Information Architecture** — four lanes, Health/Paranoia visibility, overlays, state meaning, accessibility equivalence.
13. **World, District, Routes, and Mission Geometry** — exact four-block mission envelope, three identities, three loops, entrances and anchors.
14. **Art, Blender Production, Actors, Portraits, and Lighting** — surveillance noir, named Neo Tokyo source identity, human scale, actor and portrait contracts.
15. **Audio, Localization, Accessibility, and Performance** — semantic audio families, bilingual equivalence, non-color/non-audio alternatives, performance intent.
16. **Content Boundaries and Continuation** — combat and inventory disposition, authored scope, completion, exploration, Miami handoff.

Each chapter contains:

- a one-paragraph purpose and player promise;
- a navigable section outline;
- detailed explanatory prose;
- concrete Level 0 examples;
- state or comparison tables where they improve understanding;
- inputs from and effects on other systems;
- world, HUD, dialogue, audio, and George feedback;
- failure, recovery, persistence, and Retry behavior;
- a final “See also” list connecting related chapters.

Coverage is enforced by stable topic IDs in a non-rendered coverage registry. Acceptance depends on topic coverage and semantic depth, not an arbitrary word count.

## 5. Layout and responsive behavior

The selected layout is **A — Reference Manual**.

### Desktop, 1200 px and wider

The overlay fills the viewport and uses a restrained surveillance-noir shell:

- sticky top bar: Bible title, current chapter breadcrumb, search, locale indicator, close button;
- left chapter rail: 264 px, independently scrollable, grouped chapter list with active state;
- central grid column: `minmax(0, 1fr)`; its article body is centered with an 820 px maximum and 68–76 character line length;
- right on-page outline: 196 px, independently scrollable, current section highlighted;
- 24–32 px gutters that keep the manual readable without creating a narrow modal inside a large screen.

The three columns must never overlap or cause horizontal scrolling at 1280×720, 1440×900, or 1920×1080.

### Medium, 841–1199 px

The right on-page outline is removed. The chapter rail contracts to 224 px and the reading column uses the remaining width with a maximum readable line length. Section navigation remains available through the article heading list below the chapter summary.

### Narrow, 840 px and below

The layout becomes one reading column:

- the chapter rail becomes a modal drawer opened from the sticky top bar;
- the on-page outline becomes an expandable “On this page” section;
- search occupies a full-width row below the title controls;
- body padding scales from 24 px to 16 px;
- tables may scroll inside their own bounded region, while the page itself never scrolls horizontally;
- touch targets are at least 44 px;
- the design is explicitly inspected at 390×844.

### Visual hierarchy

- Background and surfaces use existing semantic surveillance-noir theme tokens.
- Warm practical gold identifies navigation and selected reading context.
- Cyan remains device/action support, not the dominant reading color.
- Crimson is reserved for genuine failure/danger examples.
- Body text maintains strong contrast and comfortable line height.
- Headings, callouts, tables, and state flows have distinct but quiet hierarchy; the Bible must feel authored, not like raw Markdown or a debug panel.
- No dense full-width prose, clipped heading, floating close button, or permanently visible three-column layout on narrow screens is acceptable.

## 6. Interaction model

### Entry points

- Start menu: visible `Game Design Bible` button with `F1` hint.
- Paused menu: the same button and hint.
- During active play: `F1` opens the Bible directly.

`F1` eligibility is explicit:

| Current surface | `F1` result |
|---|---|
| Start menu, no run | Open Bible; create no run or pause state |
| Active gameplay | Open Bible; acquire `bible` pause once |
| Paused menu | Open Bible above menu; retain `menu` and acquire `bible` once |
| Bible already open | No-op; do not double-acquire or toggle unexpectedly |
| Character creation, Character, safehouse confirmation, dialogue, terminal, debrief, failure/completion, or another modal owner | No-op; the current modal remains authoritative |
| Editable text input outside the Bible | No-op; do not steal typing focus |

For eligible openings the handler prevents the browser's default F1 help action and stops propagation before Phaser or other controls can receive the event.

### Opening and closing

- Opening with an active run acquires a dedicated `bible` pause owner.
- If the menu already owns pause, both owners may coexist. Closing the Bible releases only `bible`, leaving the menu paused.
- If no run exists, the Bible opens without creating runtime state.
- `Escape` handling follows a strict inner-to-outer order: close the narrow chapter drawer if open; otherwise clear a non-empty focused search query; otherwise close the Bible before it affects menu or gameplay layers.
- The close button is always reachable and has an explicit localized accessible name.
- Closing restores focus to the invoking button. When invoked by `F1` from gameplay, focus returns to the gameplay shell/canvas focus target.

### Navigation and reading

- Selecting a chapter resets article scroll to the top and focuses the chapter heading without causing an unexpected page jump.
- Selecting an on-page section scrolls within the article region and updates the URL-independent current section state.
- Previous/next chapter controls appear at the end of each article.
- The active chapter is remembered for the current browser session only; it never enters the game save or Retry snapshot.
- Search matches localized chapter titles, summaries, section titles, body text, and keywords.
- Results show chapter, section, and a short matching excerpt.
- Selecting a result opens the correct chapter and section.
- Empty search provides a calm localized message and preserves the query for editing.
- `/` focuses search while the Bible is open; `Escape` clears an active query first only when focus is in search, otherwise it closes the Bible.

Selecting a search result or on-page link closes the narrow drawer when necessary, opens the chapter, scrolls the article region to the section, focuses the section heading through a temporary `tabIndex={-1}`, announces it, and updates both chapter and section `aria-current` state. Manual article scrolling updates the highlighted on-page section through an observer bounded to the article scroller. Previous is disabled in the first chapter; Next is disabled in the last chapter; neither wraps.

### Narrow chapter drawer

The drawer is a navigation panel inside the single Bible dialog, not a second modal dialog. When open:

- the article/search region is inert and `aria-hidden`, while the top bar and drawer remain interactive;
- focus moves to the drawer close button, then stays inside the drawer with Tab/Shift+Tab;
- closing returns focus to the chapter-menu trigger;
- `Escape`, the drawer close button, backdrop click, or selecting a chapter closes it;
- selecting a chapter then moves focus to that chapter heading in the article;
- outside pointer input never reaches the underlying game.

These behaviors are tested at the 840 px breakpoint and 390×844, including long Ukrainian chapter names.

### Pause-owner reentrancy and teardown

Opening is idempotent: if `bibleOpen` is already true, no state or pause dispatch occurs. A ref records whether this component instance actually acquired `bible`; closing releases it exactly once. Unmount, run replacement, New Game reset, and shell teardown release only an owner acquired by this instance. Repeated `F1`, close-button/Escape races, and nested `menu` + `bible` sequences cannot leak `bible` or prematurely release `menu`.

## 7. Accessibility and focus ownership

The Bible is a modal dialog with an accessible localized name. While open:

- the underlying start menu, gameplay, or creation screen is inert and `aria-hidden`;
- Tab and Shift+Tab remain inside the Bible;
- initial focus goes to the close button for predictable dismissal;
- chapter and section navigation expose current state through `aria-current`;
- search results announce their count through a polite live region;
- headings preserve a semantic hierarchy;
- tables use captions and header cells;
- state is never communicated by color alone;
- English and Ukrainian catalogs have identical chapter IDs, section IDs, block types, topic coverage, navigation order, and gameplay meaning.

Structural tests cannot prove translation meaning. Every paired section therefore receives a recorded bilingual semantic review against the same finalized source rules. Review covers prose, examples, tables, state flows, keywords, numbers, and cause/effect direction; a back-translation spot check is recorded for every chapter, and every shared gameplay identifier or numeric rule is supplied from language-neutral data rather than retyped independently. Missing semantic-review evidence blocks acceptance even when structure tests pass.

The overlay blocks pointer, keyboard, and controller input from reaching movement or world interactions. The clock and autonomous simulation remain paused until all pause owners are released.

## 8. Content model

The content is data rather than component-specific JSX.

```ts
type GameBibleLocale = 'en' | 'uk';

interface GameBibleChapter {
  id: string;
  group: string;
  title: string;
  summary: string;
  keywords: string[];
  sections: GameBibleSection[];
  relatedChapterIds: string[];
}

interface GameBibleSection {
  id: string;
  title: string;
  blocks: GameBibleBlock[];
  topicIds: string[];
  sourceRefs: string[];
  decisionRefs: string[];
}

type GameBibleBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'steps'; items: string[] }
  | { type: 'callout'; tone: 'principle' | 'example' | 'failure'; title: string; body: string }
  | { type: 'table'; caption: string; columns: string[]; rows: string[][] }
  | { type: 'state-flow'; states: Array<{ label: string; description: string }> };
```

`sourceRefs` and `decisionRefs` are audit metadata and are never sent to the renderer. A separate test-only traceability inventory reads the canonical decision/topic authorities and verifies that every current in-scope finalized rule is classified and every player-visible mapping resolves. The catalog module validates chapter relations and exposes locale-specific content plus a plain-text search index.

The renderer has one component per block type and no game-state mutation capability.

## 9. Component and file boundaries

New runtime files:

- `src/content/gameBible/types.ts` — public content types.
- `src/content/gameBible/coverage.ts` — required finalized topic registry.
- `src/content/gameBible/traceability.ts` — test-only Approved-decision/topic accounting and section mappings; never rendered or included in search.
- `src/content/gameBible/en.ts` — complete English content.
- `src/content/gameBible/uk.ts` — semantically identical Ukrainian content.
- `src/content/gameBible/catalog.ts` — locale lookup, validation helpers, search-text extraction.
- `src/components/level0/Level0GameBible.tsx` — modal shell, navigation, search, semantic rendering, focus trap.
- `src/components/level0/Level0GameBible.css` — component-owned responsive styles.
- `src/__tests__/level0GameBibleContent.test.ts` — completeness, parity, graph, forbidden-content tests.
- `src/__tests__/level0GameBible.test.tsx` — access, navigation, search, focus, keyboard, and pause behavior.

Minimal existing-file edits:

- `Level0RuntimeShell.tsx` — entry buttons, `F1`, overlay ownership, pause acquire/release, focus restoration, text-state surface.
- `Level0RuntimeShell.css` — only the start/pause-menu Bible trigger if existing button styles cannot be reused; all Bible layout stays in its own CSS file.
- Level 0 runtime pause-owner type — add `bible` to the existing closed union if required.
- `runtime/persistence.ts` plus pause-owner tests — recognize `bible` as a valid transient owner while preserving the existing rule that UI pause owners are stripped from autosave/hydration and never enter Retry state.
- Agent/text bridge — accept a shell-owned `getUiState` callback backed by a current ref and report that the Bible overlay is open, its chapter, query, drawer, visible results, and active section so live automation can verify the same state the player sees without putting UI state in Redux.

Canonical documentation edits:

- Game Design Bible entry point — make the player-visible Bible part of the game experience.
- HUD & Information Architecture — define access, pause, focus, search, and final-only content rules.
- Architecture — document content ownership and one-way rendering flow.
- Decision Register — add the approved player-visible Bible rule.
- MVP Readiness — record implementation and evidence.
- GET-201 progress record — preserve the correction and validation.
- Linear Implementation Program T1 plus complete GET-201 description readback — remove the prior F1/codex exclusion and embed the new runtime acceptance contract.

The review queue is not modified because this directive resolves the existence, scope, access, and final-only presentation of the in-game Bible; it does not answer unrelated tuning questions.

## 10. State and data flow

```text
active locale
    ↓
localized typed Bible catalog
    ↓
catalog validation + in-memory search index
    ↓
Level0GameBible renderer
    ↓
chapter / section / query session state only

F1 or menu button
    ↓
open overlay + acquire bible pause owner
    ↓
trap focus + mark underlying surface inert
    ↓
close overlay + release only bible owner + restore focus
```

There is no fetch, network dependency, Markdown execution, HTML injection, save-schema field, Redux domain state, outcome-ledger write, or Retry mutation.

## 11. Error handling

- Catalog validation fails tests when a locale is missing a chapter/section/topic, relations point to unknown chapters, table shapes differ, or forbidden internal markers occur.
- Rendering treats an unknown block type as a development-time exhaustive-switch failure; it does not silently drop content.
- Search over an empty catalog returns a localized empty result rather than throwing.
- A missing remembered chapter falls back to the first chapter.
- Focus restoration falls back to the gameplay shell if the original trigger no longer exists.
- The feature has no runtime network failure mode.

## 12. Test-first implementation order

1. Add failing catalog tests for 16 chapters, required topic coverage, EN/UK structural parity, known relations, and forbidden markers.
2. Add the independent Approved-decision/topic traceability inventory and fail when a canonical finalized item is unclassified, mapped to no section, or mapped to an unknown section.
3. Implement types, coverage registry, and the smallest bilingual catalog slice until the tests pass; then fill every chapter while keeping the gate green.
4. Add failing component tests for desktop semantic structure, chapter selection, deterministic on-page scrolling/focus, search results, no-results state, localized content, narrow drawer behavior, and previous/next boundaries.
5. Implement the standalone Bible component and responsive CSS.
6. Add failing integration tests for the complete F1 eligibility matrix, Escape precedence, idempotent `bible` pause ownership, nested menu pause ownership, teardown cleanup, inert background, focus traps, and focus restoration.
7. Integrate the component into `Level0RuntimeShell`, transient persistence validation, and the callback-driven text-state bridge.
8. Complete and record the bilingual semantic review and per-chapter back-translation checks.
9. Update canonical documentation and the complete GET-201 Linear description; read it back for semantic and metadata parity.
10. Run focused tests after each meaningful pass, then live browser/game verification.

## 13. Verification targets

Automated:

- every required finalized topic appears in both locales;
- every current Approved decision and required topic is independently classified, every player-visible rule maps to a known section, and every non-player-facing classification has a bounded reason;
- all 16 chapter and section structures match between EN and UK;
- no forbidden governance/uncertainty markers occur in player-visible content;
- chapter relations and section targets resolve;
- search finds titles, body text, and cross-system keywords in both locales;
- no-results behavior is localized;
- start menu, paused menu, and `F1` all open the same Bible;
- the complete F1 eligibility table passes, including default-browser suppression only for eligible states;
- `Escape`, close button, narrow drawer, backdrop, chapter navigation, deterministic section scrolling/focus, observer-driven active-section updates, previous/next boundaries, `/`, Tab, and Shift+Tab meet the explicit transitions above;
- `bible` pause ownership is idempotent, composes with `menu`, survives close races, cleans up on teardown, and releases without leaking or releasing another owner;
- the Bible never mutates autosave, Retry, mission, world clock value, player position, or outcome state;
- render-to-text exposes the active overlay and reading context;
- recorded bilingual semantic review proves equivalent examples, tables, state flows, keywords, numbers, and cause/effect meaning beyond structural parity.

Live visual and behavioral evidence:

- 1920×1080, 1440×900, and 1280×720 desktop captures with long chapter titles, a table, search results, and deep article scrolling;
- 840 px narrow-side breakpoint check;
- 841 px and 1199 px medium-layout checks proving the 224 px rail, hidden right outline, readable article width, and no overlap/overflow;
- 1200 px desktop-side breakpoint check proving the right outline appears without compressing or overlapping the article;
- 390×844 narrow capture with chapter drawer, full-width search, bounded table scroll, and no horizontal page overflow;
- English and Ukrainian captures of equivalent chapter/section states;
- live `F1` from active gameplay proves the clock and movement stop;
- closing returns to the same world state and correct focus target;
- browser console contains no new warnings or errors;
- latest screenshot is opened and inspected after every meaningful visual correction.

Full closeout checks and commit remain gated by requester acceptance and explicit commit authorization under project policy.

All implementation begins from a fresh dirty-tree snapshot. Only the explicitly listed GET-201 runtime, test, canonical-documentation, and Linear surfaces may change. Existing GET-204/GET-205/GET-208 runtime, art, manifests, generated evidence, and unrelated untracked work remain protected; no reset, checkout, cleanup, or broad formatter may cross that boundary.

## 14. Acceptance

The feature is acceptable when a player can enter the Bible before or during play and understand the complete finalized design without reading repository Markdown, chat history, tests, or Linear. Every major system explains its purpose, complete behavior, transitions, dependencies, feedback, failure/recovery, concrete examples, and Level 0 role in both languages.

The layout must remain comfortable and navigable at all required viewports. “Everything is technically present” is insufficient if the reading column is too wide, navigation overlaps, long Ukrainian headings clip, search obscures content, tables break the viewport, focus escapes, or the game continues behind the Bible.

The in-game surface must contain no open question, provisional decision, tracker detail, implementation uncertainty, historical alternative, or invented tuning constant.
