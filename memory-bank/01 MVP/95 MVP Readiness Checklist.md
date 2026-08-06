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
| Linear program alignment | Ready for requester review | GET-139 and GET-201–GET-210 passed live 2026-08-03 readback for labels, states, parents, and blocker/dependency graph. GET-207 was fully rewritten from canonical T7 and passed exact semantic readback again on 2026-08-04 after its delivery/integration boundary was corrected. |
| AGENTS governance | Ready for requester review | Specification precedence, OPEN lifecycle, Linear copy/readback, implementation stop conditions, recovery protection, and acceptance gates are explicit. |
| Documentation commit | Ready for requester review | GET-201 is committed separately at `b50a4cd5290490cc8ab8c3521a2c22acaa1afdce`; implementation proceeds ticket by ticket while requester polish remains open. |

The program entry gate opens when this reviewed package is committed separately with requester authorization. Open decisions then follow [[14 Specification Review Queue]]: they block final acceptance of affected surfaces, while documented reversible provisional trials may be built for live evaluation.

## Level 0 player-flow readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| Character creation in two minutes | Implemented; live timing review unavailable | Normal New Game now requires callsign, one of four appearances, exact +4 attribute/+6 skill budgets, caps, practical descriptions, review, and confirmation before creating the run at `L0_SAFEHOUSE_INTRO`. Component proof covers invalid/cancel/confirm paths and exact save state; fixed-viewport human timing/visual review is still unavailable and cannot be inferred from tests. |
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
| Four appearances and callsign | Implemented; final presentation integration pending | Normal creation selects and persists one grounded appearance plus a normalized player callsign; there is no production sample default. The safehouse actor, HUD lane, Character panel, autosave, and Retry payload use the same identity. Final dialogue/debrief identity belongs to T9/T10; `OPEN-RPG-005` and visual requester review still block acceptance. |
| Four attributes and eight skills | Implemented provisionally | Exact budgets, creation caps, long-term caps, localized practical copy, two distinct normal-created builds, and strict hydration validation are evidenced without background/package residue. Player-facing mission consequences remain T8–T10 integration. |
| Deterministic checks | Implemented provisionally; mission integration blocked | The pure catalog/resolver, exact reusable breakdown, Paranoia/fact/context math, designated guarantee, attempt-key anti-reroll behavior, terminal-state rejection, recomputed persistence, signed modifier math, authored modifier localization, and live result announcement are tested. Two builds captured through normal New Game produce different results for the same requirement. `OPEN-RPG-001`/`OPEN-RPG-004` still block acceptance; pre-choice dialogue/terminal/interception controls arrive in T8–T10. |
| Character screen | Implemented; live visual review unavailable | The paused panel shows only callsign/portrait, level/XP, four attributes, eight skills, Health, Paranoia/penalty, points, known facts, and truthful long-term consequences. Raw Rest/resource logs are excluded; cap reasons are visible; modal focus enters, remains contained, and returns to the Character trigger. It hides check-catalog spoilers and dead package/perk/equipment/combat/faction UI; final T9 HUD treatment and live viewport review remain. |
| Authored milestone XP | Implemented provisionally; normal triggers deferred | Stable one-shot IDs and an ordered ledger trial `50 + 50 = 100 XP`, producing one pending Level 2 without grinding or duplication. `OPEN-RPG-002` blocks acceptance; T10 owns medkit/transit trigger integration. |
| Safehouse/debrief level-up | Implemented foundation | Domain and Character UI enforce safehouse/debrief-only activation/allocation, two skill points per level, every-third-level attribute point, caps, localized feedback, exact persistence, and visible disabled/cap explanations. Final debrief trigger/carry proof remains T10. |
| Health | Implemented foundation; encounter tuning blocked | Authored event ledger, idempotency, stable source/feedback/Retry metadata, departure-derived Retry treatment, exact localized source/amount feedback, fatal 0, sourced bilingual failure overlay, Rest-to-100, and provisional 10/25/40 preset table are tested. `OPEN-HLT-001` plus T8/T10 encounter assignment block acceptance. |
| Paranoia | Implemented foundation; network tuning blocked | 0–100, exact all-check thresholds, honest threshold re-arming after recovery, exact localized source/amount feedback, departure-derived Retry treatment, fatal 100, no passive curfew mutation, Rest −40, and provisional −10/−5 recovery presets are tested. `OPEN-PAR-001`/`OPEN-PAR-002` plus T8/T10 source integration block acceptance. |

## Movement, observation, and interaction readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| Direct click-to-move | Implemented; live review pending | The active scene uses direct world intent, immediate replacement, truthful invalid-target reasons, and no route request. Pure movement and entry tests pass; live human feel remains unaccepted. |
| WASD alternative | Implemented; live review pending | Isometric screen-direction input replaces click intent immediately and shares the same collision integrator. Keyboard feel/focus still needs target-viewport play. |
| Collision sliding | Implemented; live review pending | Disc samples and local axis sliding pass deterministic corner/block tests. Narrow-alley and entrance feel still requires human play. |
| Explicit interactions | Partially implemented | One typed resolver proves knowledge, independently derived world ownership, range, solid-geometry occlusion, and authoritative unavailable reasons; automatic discovery cannot leak unknown/wrong-domain targets and safehouse actions require confirmation. A resolved actor interaction cancels the current movement intent and gives the protagonist plus matching named contact one bounded `interact` presentation window, with live Lira proof. Mission objects, hiding, and terminals remain with T8–T10. |
| Focus ownership | Partially evidenced | Menu, Observation, safehouse confirmation, deadline failure, and Escape use additive pause/focus ownership. Confirmation and terminal overlays make the background inert, disable its controls, and reject hidden safehouse mutations. Autosaves strip transient UI owners and hydration derives only terminal pauses. Later overlays still require integration proof. |
| Full-pause observation | Partially implemented | Observation freezes the clock and movement while allowing camera pan/zoom. Known-device inspection and authored George prompts remain T8/T9. |
| Camera/zoom contract | Live four-block trial; requester freeze pending | Follow/observation ownership now opens the normal route at a reversible `2.00`, permits zoom to `3.25`, and derives minimum zoom from viewport cover-fit over the four-block mission overview. The parallel task verified 1440×900 and 1920×1080 without browser errors, but `OPEN-MOV-003` and requester acceptance still own the final numbers/offset. |

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
| No tactical combat path | Technically evidenced; human proof pending | Ordinary New Game and agent entry now mount only the canonical Level 0 runtime island. `GameController`, `BootScene`, `MainScene`, AutoBattle, and combat UI remain dormant source and cannot initialize through the active App entry. |

## Dialogue, George, facts, and information readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| Lira scenes | Blocked | Character/medkit/deadline fiction must be frozen before final content. |
| Naila and Brant scenes | Blocked | Biographies and relationships must be frozen before final content. |
| Exact spoken choices and locked reasons | Not started | Requirement/outcome explanations and fail-forward behavior proven. |
| Bilingual parity | Not started | English and Ukrainian scripted runs commit equivalent state. |
| Fact Ledger | Not started | Stable facts, provenance, designated effects, Retry behavior, and debrief integration. |
| George HUD + private AR avatar | Private AR foundation implemented; final integration blocked | GET-206 registers one transparent George asset and renders a restrained 32-pixel visible-alpha presence near the protagonist, excluded from collision/occlusion/state ownership and suppressed while a full overlay owns focus. `OPEN-NAR-009` hardware fiction and T9 HUD states/prompts/final placement remain unresolved; this provisional proof is not final George integration. |
| Authored George prompts | Not started | No free text, invention, automation, or undiscovered-content leaks. |
| Operation dossier | Not started | Objectives, facts, people, locations, evidence, timeline, consequences; no rejected systems. |
| Knowledge minimap | Foundation implemented | The shared authored-ID knowledge resolver hides undiscovered cameras, drone, objectives, terminals, hiding, and blending contexts from the scene and diagnostics. District/area/entrance objective knowledge never exposes an exact world anchor; only exact precision does. Final approximate-marker rendering and discovery flows remain T8/T9. |
| Read-only social feed | Not started | Atmospheric Hidzu content only; no posting, messaging, followers, or search risk. |

## World, actors, HUD, and audio readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| Shared outdoor layout contract | Mission skeleton implemented; live T4 candidate uses replacement collision | Stable route purposes, required locations, semantic IDs, direct movement, and projection helpers remain useful. The exact `84×60` nine-block geometry is rejected. The current GET-204 live candidate replaces visible-area blockers with city-derived building/prop polygons and runtime-human occupancy, but complete four-block semantic back-propagation from the accepted master scene remains open. |
| Three traversal loops | Technically evidenced; live review pending | Validator proves exactly three interlocking loops and required-anchor reachability without runtime pathfinding. The provisional direct speed yields an approximately 145-second outer loop; route feel remains unaccepted pending human play. |
| Tokyo city foundation | Requester accepted; commit closeout authorized | One Blender 5.0.1 master uses 16 registered clusters from 10 named Neo Tokyo 2 building roots across exactly four mission blocks and three loops. The approved treatment now renders on the normal Phaser route with separate actors, a people-free 4K overview, registered close layer, and desktop proof at 1440×900 and 1920×1080. The movement-triggered plate-swap regression is corrected: architectural blending is camera-zoom-owned, the player no longer selects city art by position, the affected live crossing is stable with no browser warnings/errors, and the focused contract passes 15/15. The requester accepted this live checkpoint and authorized its commit; full semantic export registration and final actor occlusion remain explicit residual work rather than hidden completion claims. |
| Hidzu identity pass | Parked behind the renewed GET-204 source-geometry gate | GET-205 palette/grammar research and its current uncommitted plate candidate remain preserved. GET-205 resumes only after the actual four-block Neo Tokyo 2 master passes visual review; it then adds Hidzu grammar and schedule treatment without replacing the accepted geometry. |
| Street-first camera and composed overview | Live trial evidenced; requester acceptance/freeze open | Normal play now opens at provisional `2.00`, maximum zoom is `3.25`, and minimum zoom uses adaptive viewport cover-fit over the same four-block city. The public-intersection proof changes only start/camera, not art. Desktop evidence is clean at 1440×900 and 1920×1080, but exact framing, follow offset, actor occlusion/scale, 1280×720 compatibility, and current-HUD acceptance remain open. |
| Twelve grounded actor sets | Technically implemented; visual acceptance pending | GET-206 generates and independently validates exactly 12 actor sets, 288 `64×96` sheets, 1,152 frames, eight directions, `idle`/`move`/`interact`, origin `(0.50, 0.92)`, pixel-derived 54–64 px occupancy, foot contact within two pixels, 12 matching `256×256` portraits, Takahiro broadcast art, George AR base art, integrity/provenance, exact inventory, and neutral diagnostic fallback. The live scene loads exactly 30 required sheets: all 24 leaves for the chosen protagonist and fixed-facing `idle`/`interact` leaves for Lira/Naila/Brant. Fixed captures prove all four protagonist IDs, projected eight-way facing, normal movement, the Lira interaction state, George near-character presentation/suppression, and ground anchors. The initial `1.15` scale failed minimum-zoom legibility; `1.30` is the current reversible trial. Portrait identity is strong, but world sprites remain procedurally simple, initial safehouse markers can visually compete with the protagonist, final T5 city/schedule art is not runtime-promoted, and security/civilian schedules belong to T8/T10. Requester visual acceptance and `OPEN-ART-003`/`OPEN-PERF-001` decisions remain pending. |
| Four-lane HUD at 16–18% | Blocked | Lane widths/wireframes remain open; height and information contract are fixed. |
| Major overlays | Partially implemented; live viewport review unavailable | Character creation, Character, safehouse confirmation, incompatible-save notice, and deadline/Health/Paranoia failure surfaces are functional. Creation and Character dialogs have accessible names, initial focus, contained Character focus, trigger restoration on cancel/close, and bilingual failure controls/source copy in component evidence. Dialogue, dossier, social feed, debrief, dedicated Retry confirmation, completion, final shared treatment, and 1280×720 human review remain T9/T10. |
| Audio coverage | Blocked | Exact cue list/priority/ducking remains open; required categories are specified. |
| Graphic surveillance noir | Named-source T4 treatment live; T5 identity layer parked | The current runtime combines the approved close relationship and treatment with named Neo Tokyo 2 four-block geometry rather than generated production architecture. GET-205 still owns final Hidzu grammar, propaganda, schedule-state treatment, and device/state semantics after GET-204 live acceptance and commit. |

## Save, Retry, and compatibility readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| New save schema | RPG schema v2 implemented | Exact nested guards now require normalized identity, valid creation/build totals, full check/resource/XP/allocation ledgers, and recompute their math and final build during hydration in addition to spatial, clock, mission, generation, and layout validation. Malformed, stale, retired-appearance, or forged outcome data is rejected without defaults or migration guesses. T8–T10 add their typed fields through later versions. |
| Autosave | RPG payload implemented; final checkpoint policy pending | New Game and Continue round-trip exact player-created identity/build/RPG state through the independent validated key; safe transitions and exit protection persist it, transient UI pauses are stripped, and retired package/combat/inventory ownership remains excluded. Final authored checkpoint cadence remains later integration work. |
| Departure Retry snapshot | Complete RPG payload implemented; normal departure integration pending | Transactional Retry now includes identity, build, checks, resource/XP/allocation ledgers, Health, and Paranoia exactly at departure and discards later effects. Focused proof covers immutable restoration and rejection; normal Lira/preparation progression to departure is intentionally deferred to T9/T10 rather than faked in T7. |
| Incompatible rewrite saves | Technically evidenced; live review pending | The active menu never hydrates `the-getaway-state`, leaves it untouched until explicit New Game, explains incompatibility bilingually, and clears it only through that action. Current Level 0 records accept exactly one of the four authored appearance IDs and strictly reject the retired provisional placeholder plus arbitrary stale/future IDs; no identity is guessed or silently migrated. |
| Failure causes | Health/Paranoia/deadline implemented; capture deferred | Midnight failure names exact incomplete requirements; Health 0 and Paranoia 100 record their exact `failure.*` cause and contributing source, freeze simulation, and render truthful bilingual failure copy. Retry appears only with a valid departure snapshot. Authored capture remains T8/T10. |

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

Current GET-207 evidence (2026-08-04): lint and production build pass; Jest passes 138 suites / 987 tests / 2 snapshots; statement and line coverage are 81.44%. The guided runner completed 20 screenshots with zero console, page, or network errors, but correctly failed to reach `lira-started` because initial Lira objective guidance and `focusObjective` remain T9/T10-owned content. This is regression evidence for the RPG foundation, not route acceptance.

## Historical readiness record

Readiness claims made before the 2026-08-02 Tokyo escape specification are superseded. Their detailed implementation and validation history remains preserved in `progress/`, Git history, and Linear. Those records may guide recovery or regression analysis, but they do not satisfy this checklist unless replayed against the current contract.
