---
status: MVP
type: system-specification
tags: [character-creation, attributes, skills, xp, progression]
canonical: true
---

# Character Creation and Progression

## 1. Player fantasy and purpose

The protagonist is a player-authored expatriate with a personal history, uneven competence, and room to grow—not a fixed operative or fantasy archetype. Character creation must produce practical differences in dialogue, observation, systems use, emotional control, and escape while remaining small enough to understand in two minutes.

## 2. Player-visible verbs

The player can:

- choose a callsign;
- choose one of four authored appearance presets;
- distribute attribute and skill points;
- inspect what every capability affects;
- review the complete build before starting;
- open the Character screen during paused play;
- see visible check requirements and why a result succeeded or failed;
- earn authored milestone XP;
- spend level-up points only at a safehouse or debrief.

## 3. Starting state and prerequisites

- New Game opens character creation before Level 0.
- Callsign is player-chosen and validated for display; no fixed `Trace` or `Operative` identity is assigned. Exact normalization/display validation remains `OPEN-RPG-005`; its recorded Unicode-safe rule may be trialed reversibly until accepted.
- Four authored appearances are available and use grounded dystopian civilian/exile presentation.
- All four attributes begin at `1`.
- All eight skills begin at `0`.
- The player must complete valid allocation and confirm before entering the safehouse opening.
- The game stores character identity separately from build/progression state.

## 4. Complete happy-path behavior

1. The player enters a callsign and selects one of four appearances.
2. They distribute four additional attribute points among Physical, Mental, Social, and Technical, respecting the creation cap.
3. They distribute six skill points among Stealth, Evasion, Awareness, Composure, Insight, Influence, Systems, and OpSec, respecting the creation cap.
4. The summary previews the resulting totals and the practical situations each capability supports.
5. Confirmation creates `PlayerIdentity` and `PlayerBuild`, then begins Level 0 at the safehouse.
6. During play, authored checks use the build and current Paranoia penalty. The UI explains the requirement before selection and the resolved contributors afterward.
7. Authored mission milestones award XP once.
8. When a level is earned, allocation waits until the player reaches the safehouse or debrief.
9. Each level grants two skill points; every third level also grants one attribute point.
10. The Level 0 debrief demonstrates one meaningful progression event and carries the resulting build into future Level 1 data.

## 5. State model and transitions

`PlayerIdentity` contains:

- callsign;
- appearance preset ID.

`PlayerBuild` contains:

- Physical, Mental, Social, Technical;
- Stealth, Evasion, Awareness, Composure, Insight, Influence, Systems, OpSec;
- level;
- current XP; the next-level threshold is derived from versioned progression content rather than persisted inside the build;
- unspent skill points;
- unspent attribute points.

Creation states:

`IDENTITY → ATTRIBUTES → SKILLS → REVIEW → CONFIRMED`

Progression states:

`ACTIVE → LEVEL_PENDING → ALLOCATION_AVAILABLE → ALLOCATED`

XP may move the build to `LEVEL_PENDING` anywhere, but allocation becomes available only in a safehouse/debrief context.

## 6. Rules and tuning values

### Attributes

| Attribute | Start | Creation budget/cap | Long-term cap | Level 0 meaning |
|---|---:|---:|---:|---|
| Physical | 1 | Shared +4 / max 3 | 5 | Endurance, force, and grounded physical escape. |
| Mental | 1 | Shared +4 / max 3 | 5 | Awareness, Insight, Composure, and interpretation. |
| Social | 1 | Shared +4 / max 3 | 5 | Reading people, credibility, and Influence. |
| Technical | 1 | Shared +4 / max 3 | 5 | Systems use and operational security. |

### Skills

| Skill | Start | Creation budget/cap | Long-term cap | Level 0 meaning |
|---|---:|---:|---:|---|
| Stealth | 0 | Shared +6 / max 2 | 5 | Using authored concealment and low-profile movement contexts. |
| Evasion | 0 | Shared +6 / max 2 | 5 | Breaking pursuit and physical interception. |
| Awareness | 0 | Shared +6 / max 2 | 5 | Noticing surveillance, routes, and evidence. |
| Composure | 0 | Shared +6 / max 2 | 5 | Functioning under pressure and interrogation. |
| Insight | 0 | Shared +6 / max 2 | 5 | Reading motives and contradictions. |
| Influence | 0 | Shared +6 / max 2 | 5 | Persuasion and social positioning. |
| Systems | 0 | Shared +6 / max 2 | 5 | Operating terminals and understanding connected devices. |
| OpSec | 0 | Shared +6 / max 2 | 5 | Avoiding trace and recognizing operational exposure. |

### Checks and progression

- Deterministic check: `attribute + skill − Paranoia penalty + authored situational modifier ≥ visible requirement`.
- Each check declares exactly one attribute and one skill.
- Facts can reveal, lower, or guarantee only declared checks.
- No random roll, critical success, critical failure, or hidden percentage exists.
- Each level grants `2` skill points.
- Every third level grants `1` attribute point.
- No attribute or skill may exceed its long-term cap.
- XP comes only from authored milestones and is awarded once.
- The Level 0 XP threshold and milestone award table remain `OPEN-RPG-002` in [[14 Specification Review Queue]]. Its reversible recommendation trials a `100 XP` Level 2 threshold with one `50 XP` medkit-return award and one `50 XP` transit-validation award; these are not Approved tuning while the item remains open. Thresholds are versioned authored content and are never duplicated into persisted `PlayerBuild` data.

## 7. Inputs from other systems

- [[60 Paranoia]] supplies the current all-check penalty.
- [[90 Dialogue]] requests deterministic checks and displays requirements/results.
- [[70 Stealth]] consumes Stealth, Evasion, Composure, Systems, OpSec, and Awareness where declared.
- [[46 Facts, Dossier, Minimap & Terminals]] supplies fact modifiers and XP milestones.
- [[44 Safehouse, Save & Retry]] controls level-up allocation context and persistence.
- [[48 Actors & Portraits]] maps appearance preset IDs to validated actor/portrait manifests.

## 8. Effects on other systems

- Build differences alter available dialogue, recognition, camera looping, trace risk, pursuit recovery, and interception options.
- Level and XP appear in the protagonist HUD lane and Character screen.
- Unspent points enable a safehouse/debrief progression action.
- Callsign appears in HUD, dialogue, debrief, and save metadata.
- Appearance selects the protagonist world sprite and portrait consistently.
- Progression persists into future Miami Level 1 data.

## 9. UI, world, audio, and George feedback

- Character creation explains capabilities in concrete Level 0 language, not abstract genre roles.
- Budget, caps, invalid allocation, and remaining points are always visible.
- The Character screen shows only callsign, appearance, level, XP, four attributes, eight skills, Health, Paranoia, unspent points, important facts, and long-term consequence summaries.
- Check UI shows the named attribute, skill, requirement, Paranoia penalty, known fact modifier, localized authored situational reason, exact signed math, and final outcome explanation.
- Level-up feedback is restrained and becomes actionable only at the safehouse/debrief.
- George may explain a capability or known consequence, but does not recommend a “best build,” spend points, or reveal hidden checks.

## 10. Failure, recovery, and retry behavior

- Character creation cannot confirm an empty callsign, invalid preset, unspent required creation points, over-cap value, or malformed build.
- Leaving creation before confirmation discards the draft. After confirmation, the persisted identity/build is authoritative for the run; replacing it requires New Game.
- Retry restores identity, build, level, XP, and unspent points exactly as of operation departure.
- New Game clears all identity/build state and begins creation.
- Retired rewrite saves with fixed Operative/package state are rejected; they are never partially mapped into the new build.
- A failed check commits its authored fail-forward result and cannot be rerolled by reopening the same interaction.

## 11. Content-authoring requirements

- Create four grounded protagonist sprite/portrait identities with stable preset IDs.
- Provide concise localized descriptions for every attribute and skill, including representative Level 0 uses.
- Author at least two deliberately different viable sample builds and acceptance routes.
- Catalog every Level 0 check with attribute, skill, requirement, exact stable-ID fact behavior, situational modifiers with authored localization keys, success, and fail-forward effects. Requirements and modifier semantics use approved values or the isolated reversible recommendations from `OPEN-RPG-001` and `OPEN-RPG-004` until accepted.
- Define XP milestones and the Level 0 progression demonstration in approved or explicitly provisional authored data before encoding rewards.
- Author Character-screen consequence summaries from stable outcome fields rather than raw logs.

## 12. Edge cases and prohibited shortcuts

- No fixed Trace/Operative name, backgrounds, Courier/Cadet/Medic origin, or Ghost/Wire/Force package.
- No hidden derived combat stats, empty equipment slots, perk tree, weapon modifiers, encumbrance, crafting, faction meter, or nonfunctional statistics.
- No XP for dialogue exhaustion, repeated interaction, enemy defeat, walking, decorative discovery, or grinding.
- No automatic point spending or build recommendation presented as canonical.
- No fact converted into a permanent skill bonus.
- No save migration that guesses how old packages map to new attributes/skills.
- No fantasy costume or unexplained military competence implied by appearance or build text.

## 13. Removed behavior

Removed: fixed protagonist, mandatory Trace name, backgrounds, six-attribute variants, Ghost/Wire/Force packages, large perk trees, combat skill trees, package gadgets, enemy-kill XP, inventory/equipment-derived stats, capstone perks, and automatic level allocation.

## 14. Post-MVP extensions

Post-MVP may add more identity presentation, Level 1 checks, additional authored consequences, and later progression milestones. Additional skills, attributes, perks, backgrounds, or respec systems require explicit design approval and cannot be inferred from the current caps.

## 15. Human-play acceptance examples

1. A first-time player creates a valid protagonist in no more than two minutes without needing genre-package knowledge.
2. At T7 delivery, a Social/Mental build and a Technical/Evasion build are created through normal New Game controls and produce materially different results in the reusable visible check-breakdown component for the same canonical requirement. T9/T10 must expose and re-prove those differences inside authored dialogue, evidence, terminal, and escape contexts while both remain able to finish Level 0.
3. Requirements are visible before a check; the result explains exact build, fact, situational, and Paranoia contributions.
4. Naila’s designated fact guarantees only the manifest recognition it names and does not raise Awareness globally.
5. Repeated dialogue or interaction cannot duplicate XP.
6. Level 0 grants enough authored XP to demonstrate one safehouse/debrief allocation event once the open threshold is approved.
7. Retry returns the exact departure build; New Game opens creation with no stale package or progression state.

## 16. Owning Linear ticket

- Primary: `T7` (`GET-207`) — Protagonist RPG identity, progression, Health, and Paranoia.
- Actor identity dependency: `T6` (`GET-206`) — Grounded actors, portraits, and entry-flow presentation.
- Canonical decisions: `GDR-PC-001` through `GDR-PC-003`, `GDR-RPG-001` through `GDR-RPG-006`, `GDR-HLT-001`, `GDR-HLT-002`, `GDR-PAR-001` through `GDR-PAR-004`, `GDR-TIME-003`, `GDR-REM-001`, `GDR-REM-002`, and `GDR-REM-006` in [[12 Game Design Decision Register]].
