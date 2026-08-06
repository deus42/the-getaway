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
| Canonical Game Design Bible hub and MVP Spine | Ready for requester review | The canonical authoring package provides the whole-game reading experience, concise product contract, chronological journey, and 21 detailed system chapters. The forensic audit covers all 214 original structured rounds, 45 later structured clarifications, and later prose corrections. The requester-approved correction defines a separate finalized-only in-game projection rather than exposing raw canonical Markdown. |
| Player-facing in-game Game Design Bible | Not started | Approved contract: sixteen exhaustive finalized-only chapters; equivalent English/Ukrainian catalogs; start-menu, paused-menu, and eligible `F1` access; responsive reference-manual layout; localized search/navigation; accessible focus/input ownership; composable transient `bible` pause; no run/save/Restart Attempt mutation; independent Approved-decision/topic traceability; live proof at all specified breakpoints. Runtime work waits for the separately reviewed/committed corrected specification and single-active-ticket gate. |
| Level 0 vertical-slice contract | Ready for requester review | Complete 15–20 minute contract is traceable; unresolved choices are blocked explicitly in the review queue rather than guessed. |
| Decision Register | Ready for requester review | 130 unique current/removed/postponed/superseded decisions map to canonical documents and exact owning tickets, including GET-211–GET-215; unresolved choices retain explicit acceptance gates and never render in the player reference. |
| Per-system specifications | Ready for requester review | All 21 canonical system specifications pass the exact 16-section template and ticket-ownership checks. |
| Content/state matrices | Ready for requester review | 13 mission states, 9 objectives, 17 facts, 11 checks, 3 terminals, 5 failure IDs, 29 acceptance cases, the end-to-end transition ledger, and 47 explicit unresolved `OPEN-*` blockers validate; the two removed queue items resolve atomically through approved decisions. |
| Plot Bible alignment | Ready for requester review | Tokyo/Hidzu Corporation and preserved Cold Iron continuity align; undecided narrative facts remain visible under stable `OPEN-NAR-*` IDs. |
| Architecture and Roadmap alignment | Ready for requester review | Typed ownership, provenance/idempotency, sequence, and gates align with the canonical design and no removed runtime path is current authority. |
| Linear program alignment | Ready for requester review | GET-139 and GET-201–GET-210 were rewritten from the complete canonical program; GET-179 was expanded; GET-211–GET-215 were created as `Improvement`/`Todo` children under the requested parents. All 17 descriptions pass normalized semantic parity, requested dependency relations pass live readback, and existing parent states remain unchanged. |
| AGENTS governance | Ready for requester review | Specification precedence, OPEN lifecycle, Linear copy/readback, implementation stop conditions, recovery protection, and acceptance gates are explicit. |
| Documentation commit | Blocked on requester authorization | The original GET-201 package is committed separately at `b50a4cd5290490cc8ab8c3521a2c22acaa1afdce`. This validated Fable-alignment specification/Linear package is intentionally uncommitted. No GET-211–GET-215 or GET-179 modernization gameplay work may begin until the requester explicitly authorizes the separate documentation commit. |

The original program entry gate opened with its reviewed documentation commit, but this Fable-alignment package creates a new documentation gate for GET-211–GET-215 and GET-179 modernization. Existing delivered evidence remains historical foundation; no newly specified gameplay starts until this package is separately authorized and committed. Open decisions follow [[14 Specification Review Queue]]: they block final acceptance of affected surfaces, while documented reversible provisional trials may be built for live evaluation only after the documentation gate opens.

## Level 0 player-flow readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| Character creation in two minutes | Implemented; live timing review unavailable | Normal New Game now requires callsign, one of four appearances, exact +4 attribute/+6 skill budgets, caps, practical descriptions, review, and confirmation before creating the run at `L0_SAFEHOUSE_INTRO`. Component proof covers invalid/cancel/confirm paths and exact save state; fixed-viewport human timing/visual review is still unavailable and cannot be inferred from tests. |
| First story decision within three minutes | Not started | Fresh first-run capture and timing from New Game through meaningful Lira choice. |
| Optional preparation | Not started | Runs with both contacts, one contact, and neither; all remain completable and knowledge differs correctly. |
| Dusk infiltration | Not started | Human-control run proves observation, service/public behavior, blending, cache recovery, and escape. |
| Curfew infiltration | Not started | Human-control run proves schedule shift, cameras, terminal, drone, hiding, cache recovery, and escape. |
| Medkit recovery and Lira return | Not started | Explicit interactions only; no proximity or debug completion. |
| Optional Cold Iron evidence | Not started | The dedicated chain reaches `unknown → Naila warning → manifest recognized → manifest copied`; the explicit copy action costs five world minutes, has no extra check, and remains optional/nonblocking. |
| Transit validation before midnight | Not started | Credential is issued/validated through one-function terminal; exact deadline failure proven. |
| Debrief and ending | Not started | Outcome-ledger-driven debrief plus Continue Exploring / End Demo; no placeholder Miami load. |
| 15–20 minute first-run target | Not started | Representative human runs recorded without debug shortcuts or long-read clock leakage. |

## RPG readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| Four appearances and callsign | Implemented; final presentation integration pending | Normal creation selects and persists one grounded appearance plus a normalized player callsign; there is no production sample default. The safehouse actor, HUD lane, Character panel, autosave, and Restart Attempt payload use the same identity. Final dialogue/debrief identity belongs to T9/T10; `OPEN-RPG-005` and visual requester review still block acceptance. |
| Four attributes and eight skills | Implemented provisionally | Exact budgets, creation caps, long-term caps, localized practical copy, two distinct normal-created builds, and strict hydration validation are evidenced without background/package residue. Player-facing mission consequences remain T8–T10 integration. |
| Deterministic checks | Implemented provisionally; exact choice integration blocked | The pure catalog/resolver and reusable result breakdown are tested. Acceptance now also requires the identical exact math mounted as `preview` before every checked choice and `result` afterward, a validated real worse path for every nonterminal failure, and terminal failure only for the final failed capture escape. `OPEN-RPG-001`/`OPEN-RPG-004` still block numeric acceptance. |
| Character screen | Implemented; live visual review unavailable | The paused panel shows only callsign/portrait, level/XP, four attributes, eight skills, Health, Paranoia/penalty, points, known facts, and truthful long-term consequences. Raw Rest/resource logs are excluded; cap reasons are visible; modal focus enters, remains contained, and returns to the Character trigger. It hides check-catalog spoilers and dead package/perk/equipment/combat/faction UI; final T9 HUD treatment and live viewport review remain. |
| Authored milestone XP | Implemented provisionally; normal triggers deferred | Stable one-shot IDs and an ordered ledger trial `50 + 50 = 100 XP`, producing one pending Level 2 without grinding or duplication. `OPEN-RPG-002` blocks acceptance; T10 owns medkit/transit trigger integration. |
| Safehouse/debrief level-up | Implemented foundation | Domain and Character UI enforce safehouse/debrief-only activation/allocation, two skill points per level, every-third-level attribute point, caps, localized feedback, exact persistence, and visible disabled/cap explanations. Final debrief trigger/carry proof remains T10. |
| Health | Implemented foundation; encounter tuning blocked | Authored event ledger, idempotency, stable source/feedback/attempt metadata, exact localized source/amount feedback, fatal 0, sourced bilingual failure overlay, Rest-to-100, and provisional 10/25/40 preset table are tested. Acceptance explicitly excludes injury states, limps, movement penalties, detection changes, and civilian reaction to Health. `OPEN-HLT-001` plus encounter assignment still block tuning. |
| Paranoia | Foundation implemented; approved recovery/source integration blocked | 0–100 and exact all-check penalties are implemented. Acceptance now requires surveillance-origin gain only from paired valid observation plus rule-break evidence; one-use Transit Road coffee and junction shrine actions at ten minutes/−10 each; one qualifying difficult-escape −5; no dialogue-based relief; and one George warning per attempt at 40/70/90. `OPEN-PAR-001` still owns unresolved rate/overlap/sampling/caps. |

## Movement, observation, and interaction readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| Direct click-to-move | Implemented; live review pending | The active scene uses direct world intent, immediate replacement, truthful invalid-target reasons, and no route request. Pure movement and entry tests pass; live human feel remains unaccepted. |
| WASD alternative | Implemented; live review pending | Isometric screen-direction input replaces click intent immediately and shares the same collision integrator. Keyboard feel/focus still needs target-viewport play. |
| Collision sliding | Implemented; live review pending | Disc samples and local axis sliding pass deterministic corner/block tests. Narrow-alley and entrance feel still requires human play. |
| Explicit interactions | Partially implemented | One typed resolver proves knowledge, independently derived world ownership, range, solid-geometry occlusion, and authoritative unavailable reasons; automatic discovery cannot leak unknown/wrong-domain targets and safehouse actions require confirmation. A resolved actor interaction cancels the current movement intent and gives the protagonist plus matching named contact one bounded `interact` presentation window, with live Lira proof. Mission objects, hiding, and terminals remain with T8–T10. |
| Focus ownership | Partially evidenced | Menu, Observation, safehouse confirmation, deadline failure, and Escape use additive pause/focus ownership. Confirmation and terminal overlays make the background inert, disable its controls, and reject hidden safehouse mutations. Autosaves strip transient UI owners and hydration derives only terminal pauses. Later overlays still require integration proof. |
| Full-pause observation | Partially implemented | Observation freezes the clock and movement while allowing camera pan/zoom. Acceptance adds exact discovered camera coverage while normal play shows only subtle authored light/reflection warnings; no vignette or observation reward is included. |
| Camera/zoom contract | Live four-block trial; requester freeze pending | Follow/observation ownership now opens the normal route at a reversible `2.00`, permits zoom to `3.25`, and derives minimum zoom from viewport cover-fit over the four-block mission overview. The parallel task verified 1440×900 and 1920×1080 without browser errors, but `OPEN-MOV-003` and requester acceptance still own the final numbers/offset. |

## Surveillance and escape readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| Clear/Suspicious/Pursuit | Not started | Ordinary public visibility remains harmless; concern requires one of five observed rule breaks; full `Clear` resets recognition so public visibility is harmless again. |
| Shared render/detection geometry | Not started | Camera coverage and actual detection share raw `ObservationEvidence`, respect solid geometry/occlusion blind spots, and define no special off-grid zone. |
| Last-known-position pursuit | Not started | Drone/security search last known area, not hidden true coordinates. |
| Discrete hiding | Not started | Valid/invalid entry, direct-observation lockout, and recovery proven. |
| Discrete blending | Not started | Authored civilian/service context and schedule behavior proven. |
| Connected camera terminal | Not started | Exactly one camera group is usable once per attempt; active looping may expire but `clean`/`traced` history persists until Restart Attempt. |
| Needle verifier drone | Not started | One authored patrol, hum, approach warning, verification warning, valid last-known behavior, search, and recovery proven without combat. |
| Civilian surveillance reactions | Not started | Small glances/movement respond only to visible camera, Needle, or player behavior; civilians never know hidden network state, report the player, or react to Health. |
| Deterministic interception | Blocked | Exact capture fiction, requirements, and costs remain open. |
| Safehouse under active surveillance | Blocked | `OPEN-SAFE-001` must freeze boundary/action behavior; acceptance must prove no automatic network clear or magical recovery. |
| No tactical combat path | Technically evidenced; human proof pending | Ordinary New Game and agent entry now mount only the canonical Level 0 runtime island. `GameController`, `BootScene`, `MainScene`, AutoBattle, and combat UI remain dormant source and cannot initialize through the active App entry. |

## Dialogue, George, facts, and information readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| Lira scenes | Blocked | Character/medkit/deadline fiction must be frozen before final content. |
| Naila and Brant scenes | Blocked | Biographies and relationships must be frozen before final content. |
| Exact spoken choices and locked reasons | Not started | Every checked choice shows exact preview math, exact result parity, and a declared fail-forward consequence before the player commits. |
| Bilingual parity | Not started | English and Ukrainian scripted runs commit equivalent state. |
| Fact Ledger and Cold Iron chain | Not started | General facts remain binary; only Cold Iron has four explicit states. Provenance, five-minute copy action, Restart Attempt behavior, and debrief integration are exact. |
| George HUD + private AR avatar | Private AR foundation implemented; final integration blocked | GET-206 registers one transparent George asset and renders a restrained 32-pixel visible-alpha presence near the protagonist, excluded from collision/occlusion/state ownership and suppressed while a full overlay owns focus. `OPEN-NAR-009` hardware fiction and T9 HUD states/prompts/final placement remain unresolved; this provisional proof is not final George integration. |
| Authored George prompts | Not started | No free text, invention, automation, undiscovered-content leaks, hidden-information silence, or personal deletion arc; every useful-information limit gets a truthful authored reason. |
| Capture/deadline failure reports | Not started | Capture shows only real ledger sightings, detected tampering, Needle verification, and capture evidence with disconnected unseen gaps. Deadline lists unfinished requirements; Health/Paranoia stay factual. |
| Operation dossier | Not started | Objectives, facts, people, locations, evidence, timeline, consequences; no rejected systems. |
| Knowledge minimap | Foundation implemented | The shared authored-ID knowledge resolver hides undiscovered cameras, drone, objectives, terminals, hiding, and blending contexts from the scene and diagnostics. District/area/entrance objective knowledge never exposes an exact world anchor; only exact precision does. Final approximate-marker rendering and discovery flows remain T8/T9. |
| Read-only social feed | Not started | Atmospheric Hidzu Corporation content only; no posting, messaging, followers, or search risk. |

## World, actors, HUD, and audio readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| Shared outdoor layout contract | Mission skeleton implemented; live T4 candidate uses replacement collision | Stable route purposes, required locations, semantic IDs, direct movement, and projection helpers remain useful. The exact `84×60` nine-block geometry is rejected. The current GET-204 live candidate replaces visible-area blockers with city-derived building/prop polygons and runtime-human occupancy, but complete four-block semantic back-propagation from the accepted master scene remains open. |
| Three traversal loops | Technically evidenced; live review pending | Validator proves exactly three interlocking loops and required-anchor reachability without runtime pathfinding. Stable internal IDs must display bilingually as Transit Road, Market Ring, and Outer Space. The provisional direct speed yields an approximately 145-second outer loop; route feel remains unaccepted pending human play. |
| Tokyo city foundation | Requester accepted; commit closeout authorized | One Blender 5.0.1 master uses 16 registered clusters from 10 named Neo Tokyo 2 building roots across exactly four mission blocks and three loops. The approved treatment now renders on the normal Phaser route with separate actors, a people-free 4K overview, registered close layer, and desktop proof at 1440×900 and 1920×1080. The movement-triggered plate-swap regression is corrected: architectural blending is camera-zoom-owned, the player no longer selects city art by position, the affected live crossing is stable with no browser warnings/errors, and the focused contract passes 15/15. The requester accepted this live checkpoint and authorized its commit; full semantic export registration and final actor occlusion remain explicit residual work rather than hidden completion claims. |
| Hidzu Corporation identity pass | Parked behind the renewed GET-204 source-geometry gate | GET-205 palette/grammar research and its current uncommitted plate candidate remain preserved. GET-205 resumes only after the actual four-block Neo Tokyo 2 master passes visual review; it then adds Hidzu Corporation grammar and schedule treatment without replacing the accepted geometry. |
| Street-first camera and composed overview | Live trial evidenced; requester acceptance/freeze open | Normal play now opens at provisional `2.00`, maximum zoom is `3.25`, and minimum zoom uses adaptive viewport cover-fit over the same four-block city. The public-intersection proof changes only start/camera, not art. Desktop evidence is clean at 1440×900 and 1920×1080, but exact framing, follow offset, actor occlusion/scale, 1280×720 compatibility, and current-HUD acceptance remain open. |
| Twelve grounded actor sets | Technically implemented; visual acceptance pending | GET-206 generates and independently validates exactly 12 actor sets, 288 `64×96` sheets, 1,152 frames, eight directions, `idle`/`move`/`interact`, origin `(0.50, 0.92)`, pixel-derived 54–64 px occupancy, foot contact within two pixels, 12 matching `256×256` portraits, Takahiro broadcast art, George AR base art, integrity/provenance, exact inventory, and neutral diagnostic fallback. The live scene loads exactly 30 required sheets: all 24 leaves for the chosen protagonist and fixed-facing `idle`/`interact` leaves for Lira/Naila/Brant. Fixed captures prove all four protagonist IDs, projected eight-way facing, normal movement, the Lira interaction state, George near-character presentation/suppression, and ground anchors. The initial `1.15` scale failed minimum-zoom legibility; `1.30` is the current reversible trial. Portrait identity is strong, but world sprites remain procedurally simple, initial safehouse markers can visually compete with the protagonist, final T5 city/schedule art is not runtime-promoted, and security/civilian schedules belong to T8/T10. Requester visual acceptance and `OPEN-ART-003`/`OPEN-PERF-001` decisions remain pending. |
| Actor light-region tint | Not started | Authored regions sample at actor foot anchors and apply presentation-only semantic amber/cyan tint. Inspect 250 ms strongest-region-only baseline at all target viewports; `OPEN-ART-005` keeps final intensity/feather provisional. |
| Four-lane HUD at 16–18% | Blocked | Lane widths/wireframes remain open; height and information contract are fixed. |
| Major overlays | Partially implemented; live viewport review unavailable | Character creation, Character, safehouse confirmation, incompatible-save notice, and deadline/Health/Paranoia failure surfaces are functional. Creation and Character dialogs have accessible names, initial focus, contained Character focus, trigger restoration on cancel/close, and bilingual failure controls/source copy in component evidence. Dialogue, dossier, social feed, debrief, dedicated Restart Attempt confirmation, completion, final shared treatment, and 1280×720 human review remain T9/T10. |
| Street clock and audio | Not started; tuning blocked | Street changes at 21:00, 21:30, 22:00, and 23:30 must fire once across pause/save restoration. Required spatial ambience comes from the Transit Road restaurant, Market Ring workshop, and safehouse-side apartment; `OPEN-AUD-*` items retain final content/priority tuning. |
| Graphic surveillance noir | Named-source T4 treatment live; T5 identity layer parked | The current runtime combines the approved close relationship and treatment with named Neo Tokyo 2 four-block geometry rather than generated production architecture. GET-205 still owns final Hidzu Corporation grammar, propaganda, schedule-state treatment, and device/state semantics after GET-204 live acceptance and commit. |

## Save, Restart Attempt, and compatibility readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| New save schema | RPG schema v2 implemented; v3 contract not started | The approved next schema replaces shared/persisted `retry*` names, adds `OperationAttemptBaseline`, camera/grounding/threshold/Cold Iron/boundary history, and explicitly rejects stale development saves. Current v2 evidence is foundation only, not proof of v3. |
| Autosave | RPG payload implemented; final checkpoint policy pending | New Game and Continue round-trip exact player-created identity/build/RPG state through the independent validated key; safe transitions and exit protection persist it, transient UI pauses are stripped, and retired package/combat/inventory ownership remains excluded. Final authored checkpoint cadence remains later integration work. |
| OperationAttemptBaseline and Restart Attempt | Rename/schema integration not started | `OperationAttemptBaseline` must capture the complete approved departure state; George must read actual departure time, contacts, Health, Paranoia, and restoration meaning; `restartAttempt` must restore it under `restart_attempt_confirmation`. Current snapshot-shaped foundation is superseded terminology, not acceptance. |
| Incompatible rewrite saves | Technically evidenced; live review pending | The active menu never hydrates `the-getaway-state`, leaves it untouched until explicit New Game, explains incompatibility bilingually, and clears it only through that action. Current Level 0 records accept exactly one of the four authored appearance IDs and strictly reject the retired provisional placeholder plus arbitrary stale/future IDs; no identity is guessed or silently migrated. |
| Failure causes | Health/Paranoia/deadline foundation implemented; new reports deferred | Midnight must list exact incomplete requirements without implying capture. Health 0 and Paranoia 100 remain factual. Capture requires the evidence-limited Hidzu Corporation report/map. Restart Attempt appears only with a valid `OperationAttemptBaseline`. |

## Required end-to-end evidence

Before the program can become **Ready for requester review**, capture and inspect at `1280×720`, `1440×900`, and `1920×1080`:

1. safehouse opening and character creation result;
2. dusk street and Lira briefing;
3. Naila and Brant conversations;
4. public delivery/blending route;
5. curfew service/hiding route;
6. subtle normal-play camera warnings, exact Observation coverage, solid-geometry blind spots, and the single-use terminal loop with persistent history;
7. Suspicious recovery;
8. Pursuit, Needle warnings/verification, Clear recognition reset, and presentation-only civilian reactions;
9. medkits and all four Cold Iron evidence states including the five-minute copy;
10. minimum zoom;
11. Character screen, dossier, and level-up;
12. Health, Paranoia, evidence-limited capture report, and unfinished-requirements deadline failure;
13. George's departure readback plus `OperationAttemptBaseline` restoration through Restart Attempt;
14. Lira debrief, completion, and both ending actions;
15. equivalent English and Ukrainian state changes.
16. safehouse boundary and action availability while observed, Suspicious, and in Pursuit;
17. both one-use grounding actions, one difficult-escape relief, and one George line at 40/70/90;
18. 21:00/21:30/22:00/23:30 street changes plus all three spatial sound sources;
19. actor amber/cyan tint transitions at the foot anchor with identical gameplay outcomes;
20. exact preview/result math and every declared nonterminal fail-forward path.

Human control must prove the required routes and failure paths. The guided AI playtest is regression evidence only and must use `move`, `observe`, `interact`, `choose`, `useContext`, and `consultGeorge`, with typed start/wait/Restart Attempt controls and no legacy shortcut vocabulary.

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
