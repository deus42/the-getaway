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
| Content/state matrices | Ready for requester review | 13 mission states, 9 objectives, 17 facts, 11 gates (catalog per `OPEN-ABL-001`), 3 terminals, 4 failure IDs, 30 acceptance cases (`AC-L0-013` retired; `AC-L0-030` and `AC-L0-031` added), the end-to-end transition ledger, and 48 explicit unresolved `OPEN-*` blockers validate; the two removed queue items resolve atomically through approved decisions. |
| Plot Bible alignment | Ready for requester review | Tokyo/Hidzu Corporation and preserved Cold Iron continuity align; undecided narrative facts remain visible under stable `OPEN-NAR-*` IDs. |
| Architecture and Roadmap alignment | Ready for requester review | Typed ownership, provenance/idempotency, sequence, and gates align with the canonical design and no removed runtime path is current authority. |
| Linear program alignment | Ready for requester review | GET-139 and GET-201–GET-210 were rewritten from the complete canonical program; GET-179 was expanded; GET-211–GET-215 were created as `Improvement`/`Todo` children under the requested parents. All 17 descriptions pass normalized semantic parity, requested dependency relations pass live readback, and existing parent states remain unchanged. |
| AGENTS governance | Ready for requester review | Specification precedence, OPEN lifecycle, Linear copy/readback, implementation stop conditions, recovery protection, and acceptance gates are explicit. |
| Documentation commit | Blocked on requester authorization | The original GET-201 package is committed separately at `b50a4cd5290490cc8ab8c3521a2c22acaa1afdce`. This validated Fable-alignment specification/Linear package is intentionally uncommitted. No GET-211–GET-215 or GET-179 modernization gameplay work may begin until the requester explicitly authorizes the separate documentation commit. |

The original program entry gate opened with its reviewed documentation commit, but this Fable-alignment package creates a new documentation gate for GET-211–GET-215 and GET-179 modernization. Existing delivered evidence remains historical foundation; no newly specified gameplay starts until this package is separately authorized and committed. Open decisions follow [[14 Specification Review Queue]]: they block final acceptance of affected surfaces, while documented reversible provisional trials may be built for live evaluation only after the documentation gate opens.

## Level 0 player-flow readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| Cover-select in under one minute | GET-216 implementation complete; live requester acceptance pending | New Game presents The Neighbor as the only playable cover and The Technician, The Commuter, and The Archivist as visibly disabled future covers. The selection contains no free-text name, allocation, or number. Focused component/domain proof covers disabled and confirm behavior plus exact version-3 identity state; fixed-viewport timing and visual acceptance remain required. |
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
| Four covers (historic: appearances and callsign) | GET-216 implementation complete; live acceptance pending | Cover ID owns the authored appearance throughout the safehouse actor, HUD, Character panel, autosave, and `OperationAttemptBaseline`. There is no free-text callsign or independent appearance picker. Three covers remain honestly disabled content; `OPEN-RPG-005` and requester review still block final acceptance. |
| Binary abilities (historic: four attributes and eight skills) | GET-216 foundation implemented; provisional catalog acceptance pending | The nine-ID authored catalog, held-ability state, fragile/hardened tags, named-tier lock derivation, bilingual labels, strict version-3 persistence, and no-number player surfaces have focused proof. Practical mission consequences remain T8A/T9A/T10 integration; `OPEN-ABL-001` remains provisional. |
| Deterministic gates (historic: checks) | GET-216 resolver and shared verdict implemented; content integration pending | The pure catalog/resolver and reusable met/not-met verdict show the exact ability, fact, costed path, or missing reason with no arithmetic or roll. Every catalogued nonterminal gate has another real path. T9A/T10 must mount the same preview/result verdict on final dialogue and mission choices. |
| Character screen | GET-216 cover/ability panel implemented; live viewport review pending | The paused panel shows cover, named Paranoia tier, lit/locked abilities, known facts, research state, and factual consequences. It contains no callsign field, level, XP, attribute, skill, Health, point allocation, package, perk, equipment, combat, or faction surface. |
| Safehouse research (historic: milestone XP) | GET-216 domain/UI implemented; live fact-acquisition proof pending | Naila's topology fact plus 20 world minutes grants `ability.terminal_craft`; Brant's protocol fact plus 15 grants `ability.steady_voice`. Each consumes its declared fact, grants once, persists one event, and rejects missing-fact/repeat use. Values remain provisional under `OPEN-ABL-002`; T9A/T10 own normal-flow fact acquisition. |
| Safehouse/debrief level-up | Removed | No level, XP, point, allocation, or level-up state remains in the current version-3 Level 0 contract or player UI. Safehouse research is the only progression verb. |
| Health removal | GET-216 current Level 0 contract and UI converted; live scan pending | Physical consequence is now time, Paranoia, or capture. The active runtime, persistence, Character/HUD, Bible, and failure flow contain no Health state or failure. A temporary constant `health: 100` exists only inside the explicitly named legacy agent-bridge compatibility shim until GET-179. |
| Paranoia tiers and ability locks | GET-216 tier/lock foundation plus GET-214 recovery integration implemented; surveillance integration pending | Internal 0–100 derives Calm/Uneasy/Shaken/Breaking and terminal Breakdown; the number is absent from normal UI. One George entry is recorded per newly crossed tier, fragile abilities lock at declared tiers, hardened abilities stay lit, and 100 stages surrender as `failure.breakdown`. GET-214 adds two persisted one-use grounding actions at +10 world minutes/−10 Paranoia, the one-use −5 difficult-escape reducer, and authored 40/70/90 George lines. Normal-flow difficult-escape and threshold-source proof still depends on T8A; both grounding actions and the reducers have focused proof, while the Transit Road coffee has human-control confirmation, time-cost, repeat-block, and reload evidence. `OPEN-PAR-001` still owns observation tuning. |

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
| Civilian surveillance reactions | Not started | Small glances/movement respond only to visible camera, Needle, or player behavior; civilians never know hidden network state, report the player, or react to the protagonist's hidden internal condition value. |
| Deterministic interception | Blocked | Exact capture fiction, requirements, and costs remain open. |
| Safehouse under active surveillance | Blocked | `OPEN-SAFE-001` must freeze boundary/action behavior; acceptance must prove no automatic network clear or magical recovery. |
| No tactical combat path | Technically evidenced; human proof pending | Ordinary New Game and agent entry now mount only the canonical Level 0 runtime island. `GameController`, `BootScene`, `MainScene`, AutoBattle, and combat UI remain dormant source and cannot initialize through the active App entry. |

## Dialogue, George, facts, and information readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| Lira scenes | Blocked | Character/medkit/deadline fiction must be frozen before final content. |
| Naila and Brant scenes | Blocked | Biographies and relationships must be frozen before final content. |
| Exact spoken choices and locked reasons | Not started | Every gated choice shows its met/not-met verdict with exact reason, result parity, and a declared fail-forward consequence before the player commits. |
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
| Tokyo city foundation | Collision correction closed out; committed-build verification pending | One Blender 5.0.1 master uses 16 registered clusters from 10 named Neo Tokyo 2 building roots across exactly four mission blocks and three loops. The approved treatment renders on the normal Phaser route with separate actors and a people-free registered city. The movement-triggered plate-swap regression remains corrected. The collision follow-up replaces private parcel padding with measured named-source structural footprints without changing visual placement, entrances, camera, art, or tuning; fresh live evidence covers 1280×720, 1440×900, and 1920×1080 with accepted direct movement. The final closeout packet passed on 2026-08-10 with two independent valid workers, exact `gpt-5.6-sol` / high runtime attestation, no findings or warnings, and all required probes/invariants met; both visible runs completed the source-measured 14-step route through all four blocks (`reports/ai-playtests/2026-08-10T16-09-51-265Z-get-204-closeout-6a5b7ab3/report.md`). GET-204 remains non-terminal until the requester verifies the committed build. |
| Hidzu Corporation identity pass | Correction contract locked; documentation commit authorized | GET-205 commit `c1f7cda` remains a recoverable technical baseline for the four-block KitBash publication path, transforms/topology/anchors, page-stable profiles, and runtime integration, but its warm beige/ochre, comparatively dry/flat presentation and oversized player relationship are rejected. `GDR-ART-012`/`GDR-ART-013` require a versioned source-level Cycles Metal rebake into aligned wet blue-black dusk, blue-hour, and curfew sets, complete-set prefetch, and a 750 ms crossfade. `GDR-ART-014` requires one shared human scale that reproduces the locked blend's human/door/sidewalk/street/building proportions. The first production gate is only the fixed `1440×900` blue-hour hero with direct reference/delta comparison and a verified `200%` road/reflection crop. |
| Street-first camera and composed overview | Production profiles evidenced; requester freeze open | Desktop opens at `2.00`, mobile at `1.05`, maximum zoom remains `3.25`, and minimum zoom uses adaptive viewport cover-fit over one unchanged four-block composition. Zoom no longer swaps buildings, recentres between plates, or counter-scales actors. The desktop background is tiled below the `4096` texture limit; the mobile profile is approximately `39.46 MiB` decoded RGBA. Exact framing remains a requester visual judgment rather than an automated acceptance claim. |
| Twelve grounded actor sets | Technically implemented; visual acceptance pending | GET-206 generates and independently validates exactly 12 actor sets, 288 `64×96` sheets, 1,152 frames, eight directions, `idle`/`move`/`interact`, origin `(0.50, 0.92)`, pixel-derived 54–64 px occupancy, foot contact within two pixels, 12 matching `256×256` portraits, Takahiro broadcast art, George AR base art, integrity/provenance, exact inventory, and neutral diagnostic fallback. The live scene loads exactly 30 required sheets: all 24 leaves for the chosen protagonist and fixed-facing `idle`/`interact` leaves for Lira/Naila/Brant. Fixed captures prove all four protagonist IDs, projected eight-way facing, normal movement, the Lira interaction state, George near-character presentation/suppression, and ground anchors. The initial `1.15` scale failed minimum-zoom legibility; `1.30` is the current reversible trial. Portrait identity is strong, but world sprites remain procedurally simple, initial safehouse markers can visually compete with the protagonist, final T5 city/schedule art is not runtime-promoted, and security/civilian schedules belong to T8/T10. Requester visual acceptance and `OPEN-ART-003`/`OPEN-PERF-001` decisions remain pending. |
| Actor light-region tint | Not started | Authored regions sample at actor foot anchors and apply presentation-only semantic amber/cyan tint. Inspect 250 ms strongest-region-only baseline at all target viewports; `OPEN-ART-005` keeps final intensity/feather provisional. |
| Four-lane HUD at 16–18% | Blocked | Lane widths/wireframes remain open; height and information contract are fixed. |
| Major overlays | GET-216 cover/Character/failure surfaces implemented; live viewport review pending | Cover-select, Character, safehouse research confirmation, incompatible-save notice, and breakdown/Restart Attempt surfaces use the numberless cover/ability/tier model with bilingual copy. Dialogue, dossier, social feed, evidence-limited failure report, debrief, completion, and final shared treatment remain T9A/T10. |
| Street clock and audio | Partially evidenced; environment transition specified, not implemented | The runtime persists exactly `clock.2100`, `clock.2130`, `clock.2200`, and `clock.2330`; ordered presentation survives large jumps and announces again after Restart Attempt while hydration does not replay history. `GDR-ART-013` separately fixes environment prefetch at 19:50/21:50, phase changes at 20:00/22:00, and a complete-set 750 ms crossfade, but no corrective runtime implementation or live transition proof exists yet. Human-control desktop proof covers the four street moments, bilingual PA copy, existing non-emissive Transit Road/Market Ring/Outer Space signage, ambience captions, civilian thinning, and a clean reload/console. Final source/mix/priority, caption, civilian, and layout values remain provisional under their named open decisions, and all three threshold sources still need one accepted human route. |
| Graphic surveillance noir | Locked correction; visual candidate not started | Every state must share a source-authored wet blue-black surveillance-noir baseline. Amber stays in windows/entrances/lamp pools; cyan stays on declared devices and a small named set of non-directional building-integrated accents; red stays sparse and threat-specific. Cyan wayfinding, route-marker/street-edge light, floating panels, generic cyberpunk neon, post-render reflections, and tint-led state authority are prohibited. The accepted four-block geometry, camera, topology, actors, HUD, profiles, occlusion, and provenance remain fixed. Broader surveillance-device state semantics remain GET-208-owned. |

## Save, Restart Attempt, and compatibility readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| New save schema | Version 3 implemented; full live hydration acceptance pending | The schema persists cover, abilities, research, gate verdicts, Paranoia/tier history, and independent autosave/`OperationAttemptBaseline` envelopes. Version 2, malformed, and future records are rejected without migration or partial hydration. |
| Autosave | Version-3 cover/ability/recovery payload implemented; final checkpoint cadence deferred | New Game and Continue round-trip exact cover, ability, research, Paranoia, fact, four-ID street-boundary history, grounding/difficult-escape recovery ledger, clock, and runtime state through the independent validated key. Transient UI pause owners are stripped; retired numeric/package/combat/inventory ownership is excluded. Live reload preserves the used Transit Road grounding action and does not replay a street announcement. |
| OperationAttemptBaseline and Restart Attempt | GET-216 implementation complete; live departure/restart proof pending | Departure creates the immutable complete baseline before later mutation; George reads actual departure time, consulted contacts, named Paranoia tier, held abilities, and restoration meaning. `restartAttempt` restores it under `restart_attempt_confirmation`; no current public/persisted `retry*` alias remains. |
| Incompatible rewrite saves | Version-3 rejection implemented; live review pending | The active menu never partially hydrates version 2 or malformed state, explains incompatibility bilingually, and offers New Game. Cover/appearance ownership and all ability/research IDs are strictly validated; no field is guessed or migrated. |
| Failure causes | Breakdown implemented; final capture/deadline report integration deferred | Paranoia 100 stages factual surrender and enters `failure.breakdown`. Capture and midnight remain distinct exact causes; Restart Attempt appears only with a valid `OperationAttemptBaseline`. T9A owns the evidence-limited report/map and final deadline requirements. |

## Required end-to-end evidence

Before the program can become **Ready for requester review**, capture and inspect at `1280×720`, `1440×900`, and `1920×1080`:

1. safehouse opening and cover-select result;
2. dusk street and Lira briefing;
3. Naila and Brant conversations;
4. public delivery/blending route;
5. curfew service/hiding route;
6. subtle normal-play camera warnings, exact Observation coverage, solid-geometry blind spots, and the single-use terminal loop with persistent history;
7. Suspicious recovery;
8. Pursuit, Needle warnings/verification, Clear recognition reset, and presentation-only civilian reactions;
9. medkits and all four Cold Iron evidence states including the five-minute copy;
10. minimum zoom;
11. Character screen, dossier, and research;
12. breakdown surrender, evidence-limited capture report, and unfinished-requirements deadline failure;
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

Historical GET-205 technical evidence (2026-08-07, visually superseded 2026-08-09): the deterministic production publisher emitted and validated 37 registered assets; the exact staged candidate passed `yarn lint`, `yarn build`, `146/146` Jest suites with `1041/1041` tests, and coverage at `81.36%` statements/lines. The guided 20-step Level 0 regression recorded zero console/page/network errors, and inspected frames covered `1440×900`, fixed `1920×1080`, and automatic `390×844`. This remains evidence for the recoverable publication/profile/runtime baseline only; it is not acceptance evidence for the wet blue-black correction. Fresh hero approval, three-state live evidence, validators, closeout checks, and requester acceptance are all pending.

Current GET-207 evidence (2026-08-04): lint and production build pass; Jest passes 138 suites / 987 tests / 2 snapshots; statement and line coverage are 81.44%. The guided runner completed 20 screenshots with zero console, page, or network errors, but correctly failed to reach `lira-started` because initial Lira objective guidance and `focusObjective` remain T9/T10-owned content. This is regression evidence for the RPG foundation, not route acceptance.

## Historical readiness record

Readiness claims made before the 2026-08-02 Tokyo escape specification are superseded. Their detailed implementation and validation history remains preserved in `progress/`, Git history, and Linear. Those records may guide recovery or regression analysis, but they do not satisfy this checklist unless replayed against the current contract.
