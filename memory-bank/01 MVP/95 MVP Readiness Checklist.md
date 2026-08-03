---
status: MVP
type: readiness-ledger
canonical: true
---

# MVP Readiness Checklist

This ledger reports evidence against the current Tokyo escape specification. It does not treat the rejected rewrite, green legacy tests, generated assets, or earlier completion claims as proof of the new slice.

Detailed acceptance scenarios live in [[13 Level 0 Content and State Matrix]] and this ledger. Current product rules live in [[Game Design]], [[10 MVP Spine]], [[11 Level 0 Vertical Slice Contract]], and the per-system specifications.

## Evidence states

- **Not started:** no current implementation evidence exists.
- **Partially evidenced:** some relevant behavior or asset exists, but the complete current contract has not been demonstrated.
- **Ready for requester review:** automated and human-control internal evidence is complete; requester acceptance is pending.
- **Accepted:** requester has verified the committed build against the current contract.
- **Blocked:** a named unresolved decision or external dependency prevents final acceptance or complete proof. It does not prevent a reversible provisional trial unless the row says so explicitly.

Percent-complete estimates are not used. Every row names the evidence required to change state.

## Documentation and governance

| Gate | State | Required evidence / current note |
|---|---|---|
| Canonical Game Design hub and MVP Spine | Ready for requester review | Current identity, pillars, loop, authority, and links passed contradiction/reference review; requester polish remains. |
| Level 0 vertical-slice contract | Ready for requester review | Complete 15–20 minute contract is traceable; unresolved choices are blocked explicitly in the review queue rather than guessed. |
| Decision Register | Ready for requester review | 103 unique current/removed/postponed/superseded decisions map to canonical documents and GET-201–GET-210; unresolved choices retain explicit acceptance gates. |
| Per-system specifications | Ready for requester review | All 21 canonical system specifications pass the exact 16-section template and ticket-ownership checks. |
| Content/state matrices | Ready for requester review | 13 mission states, 5 failure IDs, 19 acceptance cases, fact/check/surveillance/outcome/Retry contracts, and 49 explicit `OPEN-*` blockers validate without unknown references. |
| Plot Bible alignment | Ready for requester review | Tokyo/Hidzu and preserved Cold Iron continuity align; undecided narrative facts remain visible under stable `OPEN-NAR-*` IDs. |
| Architecture and Roadmap alignment | Ready for requester review | Typed ownership, provenance/idempotency, sequence, and gates align with the canonical design and no removed runtime path is current authority. |
| Linear program alignment | Ready for requester review | GET-139 and GET-201–GET-210 passed live 2026-08-03 readback for labels, states, parents, blocker/dependency graph, and semantic description parity after the provisional-gate update. |
| AGENTS governance | Ready for requester review | Specification precedence, OPEN lifecycle, Linear copy/readback, implementation stop conditions, recovery protection, and acceptance gates are explicit. |
| Documentation commit | Ready for commit | The requester authorized one-by-one implementation on 2026-08-03; record the resulting GET-201 commit in progress and Linear before GET-202 changes the protected runtime worktree. |

The program entry gate opens when this reviewed package is committed separately with requester authorization. Open decisions then follow [[14 Specification Review Queue]]: they block final acceptance of affected surfaces, while documented reversible provisional trials may be built for live evaluation.

## Level 0 player-flow readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| Character creation in two minutes | Not started | Human run creates callsign, appearance, legal attribute/skill build, and reaches safehouse with no stale identity. |
| First story decision within three minutes | Not started | Fresh first-run capture and timing from New Game through meaningful Lira choice. |
| Optional preparation | Not started | Runs with both contacts, one contact, and neither; all remain completable and knowledge differs correctly. |
| Dusk infiltration | Not started | Human-control run proves observation, service/public behavior, blending, cache recovery, and escape. |
| Curfew infiltration | Not started | Human-control run proves schedule shift, cameras, terminal, drone, hiding, cache recovery, and escape. |
| Medkit recovery and Lira return | Not started | Explicit interactions only; no proximity or debug completion. |
| Optional manifest | Not started | Naila fact, Awareness success, and missed evidence all produce correct nonblocking outcomes. |
| Transit validation before midnight | Not started | Credential is issued/validated through one-function terminal; exact deadline failure proven. |
| Debrief and ending | Not started | Outcome-ledger-driven debrief plus Continue Exploring / End Demo; no placeholder Miami load. |
| 15–20 minute first-run target | Not started | Representative human runs recorded without debug shortcuts or long-read clock leakage. |

## RPG readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| Four appearances and callsign | Not started | All identities validate across creation, world sprite, portrait, HUD, dialogue, Retry, and save. |
| Four attributes and eight skills | Not started | Budgets/caps enforced; no background/package residue. |
| Deterministic checks | Blocked | `OPEN-RPG-001` must freeze requirements and `OPEN-RPG-004` must freeze every stable-ID fact/situational modifier before two-build proof. |
| Character screen | Not started | Shows only active identity, progression, Health, Paranoia, facts, and consequences; no dead systems. |
| Authored milestone XP | Blocked | `OPEN-RPG-002` must freeze thresholds and awards before final progression proof and acceptance; provisional authored values may be trialed reversibly. |
| Safehouse/debrief level-up | Not started | Correct skill/attribute points, caps, persistence, and future-Level-1 carry state. |
| Health | Blocked | Exact authored damage costs remain open; fatal 0 and safehouse restore rules are specified. |
| Paranoia | Blocked | Range, penalties, honesty rules, and Rest are specified, but `OPEN-PAR-001` and `OPEN-PAR-002` block complete implementation evidence. |

## Movement, observation, and interaction readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| Direct click-to-move | Not started | No A*, immediate override, direct intent, stable arrival, and invalid-destination feedback. |
| WASD alternative | Not started | Equivalent collision/focus behavior and immediate cancellation. |
| Collision sliding | Not started | Corners, walls, narrow alleys, and entrances work without route planning. |
| Explicit interactions | Not started | Contacts, objects, terminals, hiding, and safehouse require input with truthful range/occlusion. |
| Focus ownership | Not started | HUD, modal, dialogue, and pause exits never require a sacrificial movement click. |
| Full-pause observation | Not started | Camera pan/inspection/George prompt available; movement and world mutation impossible; all simulation frozen. |
| Camera/zoom contract | Blocked | Normal floor is 0.60; default/start framing and exact movement/camera tuning remain open. |

## Surveillance and escape readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| Clear/Suspicious/Pursuit | Not started | Transitions are visible, deterministic, and recoverable as specified. |
| Shared render/detection geometry | Not started | Camera coverage and actual detection match and respect solid geometry. |
| Last-known-position pursuit | Not started | Drone/security search last known area, not hidden true coordinates. |
| Discrete hiding | Not started | Valid/invalid entry, direct-observation lockout, and recovery proven. |
| Discrete blending | Not started | Authored civilian/service context and schedule behavior proven. |
| Connected camera terminal | Not started | Systems/OpSec outcomes and trace behavior; no unrelated device control. |
| One verifier drone | Not started | Dispatch, warning, verification, search, and recovery proven without combat. |
| Deterministic interception | Blocked | Exact capture fiction, requirements, and costs remain open. |
| Safehouse under active surveillance | Blocked | `OPEN-SAFE-001` must freeze boundary/action behavior; acceptance must prove no automatic network clear or magical recovery. |
| No tactical combat path | Not started | Human run and production UI contain no AutoBattle, AP grid, weapon menu, enemy-HP loop, EMP, or magic gadget. |

## Dialogue, George, facts, and information readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| Lira scenes | Blocked | Character/medkit/deadline fiction must be frozen before final content. |
| Naila and Brant scenes | Blocked | Biographies and relationships must be frozen before final content. |
| Exact spoken choices and locked reasons | Not started | Requirement/outcome explanations and fail-forward behavior proven. |
| Bilingual parity | Not started | English and Ukrainian scripted runs commit equivalent state. |
| Fact Ledger | Not started | Stable facts, provenance, designated effects, Retry behavior, and debrief integration. |
| George HUD + private AR avatar | Blocked | Hardware fiction and exact presentation reference remain open; behavior contract is specified. |
| Authored George prompts | Not started | No free text, invention, automation, or undiscovered-content leaks. |
| Operation dossier | Not started | Objectives, facts, people, locations, evidence, timeline, consequences; no rejected systems. |
| Knowledge minimap | Not started | Discovery precision and no routing/unknown-camera leak. |
| Read-only social feed | Not started | Atmospheric Hidzu content only; no posting, messaging, followers, or search risk. |

## World, actors, HUD, and audio readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| Shared outdoor layout contract | Blocked | Exact dimensions, widths, district zones, anchors, and semantics remain open. |
| Three traversal loops | Not started | All required locations reachable without pathfinding; outer loop measured at target movement speed. |
| Unchanged-kit Blender city gate | Blocked | Exact asset/license inventory and logistics-site identity must be frozen; Direction B is a T5 Hidzu-treatment blocker, not a T4 unchanged-kit blocker. |
| Hidzu identity pass | Not started | Begins only after unchanged-kit composition acceptance. |
| No zoom-out corruption | Not started | Live captures at all target viewports and minimum zoom show no seams/clipping/repetition. |
| Twelve grounded actor sets | Not started | Complete 8-direction `idle/move/interact`, anchors, scale, matching portraits. |
| Four-lane HUD at 16–18% | Blocked | Lane widths/wireframes remain open; height and information contract are fixed. |
| Major overlays | Not started | Character, dialogue, dossier, feed, debrief, failure, retry, completion at 1280×720 minimum. |
| Audio coverage | Blocked | Exact cue list/priority/ducking remains open; required categories are specified. |
| Graphic surveillance noir | Not started | Live human-reviewed frames demonstrate city cohesion, midtone readability, surveillance identity, and no fantasy presentation. |

## Save, Retry, and compatibility readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| New save schema | Not started | Explicit schema version and hydration validation. |
| Autosave | Not started | Current-run persistence at declared safe points without stale rewrite fields. |
| Departure Retry snapshot | Not started | Exact identity/build/preparation/fact/time/Health/Paranoia/mission restoration. |
| Incompatible rewrite saves | Not started | Honest explanation and New Game path; no partial package/combat/inventory migration. |
| Failure causes | Not started | Health, Paranoia, capture, and deadline each proven with exact reason and Retry. |

## Required end-to-end evidence

Before the program can become **Ready for requester review**, capture and inspect at `1280×720`, `1440×900`, and `1920×1080`:

1. safehouse opening and character creation result;
2. dusk street and Lira briefing;
3. Naila and Brant conversations;
4. public delivery/blending route;
5. curfew service/hiding route;
6. known-camera observation and terminal loop;
7. Suspicious recovery;
8. Pursuit and drone verification;
9. medkits and optional manifest;
10. minimum zoom;
11. Character screen, dossier, and level-up;
12. Health, Paranoia, capture, and deadline failures;
13. Retry restoration;
14. Lira debrief, completion, and both ending actions;
15. equivalent English and Ukrainian state changes.
16. safehouse boundary and action availability while observed, Suspicious, and in Pursuit.

Human control must prove the required routes and failure paths. The guided AI playtest is regression evidence only.

## Automated closeout gate

After live behavior and visual acceptance for each implementation ticket, run the relevant asset/layout validators and, from `the-getaway/`:

- `yarn sprites:validate` when actors change;
- `yarn lint`;
- `yarn build`;
- `yarn test --runInBand`;
- `yarn test --coverage --runInBand` with statement and line coverage above 80%;
- `yarn playtest:agent -- --profile guided-level0 --max-steps 20 --codex` for Features and Improvements.

Passing automation does not move a visual or player-experience row to Accepted.

## Historical readiness record

Readiness claims made before the 2026-08-02 Tokyo escape specification are superseded. Their detailed implementation and validation history remains preserved in `progress/`, Git history, and Linear. Those records may guide recovery or regression analysis, but they do not satisfy this checklist unless replayed against the current contract.
