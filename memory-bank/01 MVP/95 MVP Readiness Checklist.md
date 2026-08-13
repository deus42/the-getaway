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
| Camera/zoom contract | Historical live trial; v6 derivation pending | Follow/observation ownership and uniform world/actor zoom remain useful. The old `2.00`/`3.25` trial and `{29,22}` framing do not own v6. The reference-native plan solver must satisfy the exact composition boxes in [[32 GET-205 Reference-Native Layout Contract]]; requester greybox/live acceptance then freezes the v6 constants while `OPEN-MOV-003` retains player-follow tuning. |

## Surveillance and escape readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| Clear/Suspicious/Pursuit | Not started | Ordinary public visibility remains harmless; concern requires one of five observed rule breaks; full `Clear` resets recognition so public visibility is harmless again. |
| Shared render/detection geometry | Not started | Camera status LED, IR glint, restrained wet-pavement cue, exact discovered Observation coverage, and actual detection share raw `ObservationEvidence`, respect solid geometry/occlusion blind spots, and define no special off-grid zone. |
| Last-known-position pursuit | Not started | Drone/security search last known area, not hidden true coordinates. |
| Discrete hiding | Not started | Valid/invalid entry, direct-observation lockout, and recovery proven. |
| Discrete blending | Not started | The transit-shelter context declares two or three visible seats plus a separate standing capacity, never overfills or claims an unavailable seat, is populated at 18:45, winds down after 21:30, and becomes inactive at curfew. All occupants are runtime-owned. |
| Connected camera terminal | Not started | Exactly one camera group is usable once per attempt; active looping may expire but `clean`/`traced` history persists until Restart Attempt. |
| Needle verifier drone | Not started | One authored patrol, hum, approach warning, verification warning, valid last-known behavior, search, and recovery proven without combat; its lamp is amber/warm-white while neutral and crimson only during verification/Pursuit. |
| Pedestrian verification lane | Not started | Queue rails, floor arrows, and an eye-height lit panel explain direction/commitment before entry; valid-cover passage and premature-exit `Suspicious` incomplete processing are proven without vehicle-checkpoint framing or instant capture. |
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
| George HUD + canonical private orb | Identity recovered; replacement implementation pending | `GDR-GEO-005` restores the pre-rewrite dark circular orb with cyan concentric core, four axial ticks, central point, and angular framing as George's only valid world/HUD identity. The committed GET-206 human-bust presentation is rejected historical evidence and cannot be a fallback. `OPEN-NAR-009` remains open only for origin/hardware/channel exposure. GET-206 must publish the recovered orb after the GET-205 rebake is accepted; GET-209/GET-213 then own synchronized HUD state, prompts, limits, departure, and failure presentation. |
| Authored George prompts | Not started | No free text, invention, automation, undiscovered-content leaks, hidden-information silence, or personal deletion arc; every useful-information limit gets a truthful authored reason. |
| Capture/deadline failure reports | Not started | Capture shows only real ledger sightings, detected tampering, Needle verification, and capture evidence with disconnected unseen gaps. Deadline lists unfinished requirements; Health/Paranoia stay factual. |
| Operation dossier | Not started | Objectives, facts, people, locations, evidence, timeline, consequences; no rejected systems. |
| Knowledge minimap | Foundation implemented | The shared authored-ID knowledge resolver hides undiscovered cameras, drone, objectives, terminals, hiding, and blending contexts from the scene and diagnostics. District/area/entrance objective knowledge never exposes an exact world anchor; only exact precision does. Final approximate-marker rendering and discovery flows remain T8/T9. |
| Read-only social feed and civic displays | Not started | Atmospheric Hidzu Corporation content only; no posting, messaging, followers, or search risk. Transit departures/civic time, verification procedure/verdict/manual review, and a two-line sector advisory remain three stable knowledge-filtered roles with truthful empty/error states. |

## World, actors, HUD, and audio readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| Shared outdoor layout contract | Reference-native v6 authority drafted; docs commit and plan gate pending | `GDR-ART-019` identifies frozen topology as the repeated failure and retires the `58×44` grid, old routes/footprints/anchors, `{29,22}` camera pin, v5 density-ratio authority, and 24-point invariant. [[32 GET-205 Reference-Native Layout Contract]] supplies the exact `44×38` reversible seed, three-arm street skeleton, real gate, parcel strips, safehouse/logistics/service extensions, relocated semantic anchors, camera boxes, and 22 static plus four dynamic probes. `OPEN-LAYOUT-007` blocks facade work until the requester approves the dimensioned plan and raw greybox. |
| Three traversal loops | Technically evidenced; live review pending | Validator proves exactly three interlocking loops and required-anchor reachability without runtime pathfinding. Stable internal IDs must display bilingually as Transit Road, Market Ring, and Outer Space. The provisional direct speed yields an approximately 145-second outer loop; route feel remains unaccepted pending human play. |
| Tokyo city foundation | GET-204 baseline recoverable; current geography superseded | The four-block Blender 5.0.1 master, named Neo Tokyo 2 roots, source-measured blockers, live evidence, and collision lessons remain recoverable history. They no longer own current geography. V6 must rebuild from the reference-native plan while keeping named source provenance, visible/collision agreement, direct movement, and player-scale proof. |
| Hidzu Corporation identity pass | Reference-native plan gate pending | Wet-blue-black v4 and rejected v5 remain technical/failure evidence. The next candidate is not another lighting or repack pass: it must literally stage the reference-derived life street, HIDZU street, real checkpoint, tower, transit/café presence, terminals, and sneak/service seam from the new plan. Facade work remains blocked until the blind five-question greybox read passes. |
| Street-first camera and composed overview | V6 solver pending requester freeze | Uniform actor/world zoom and page-stable profiles survive. V6 derives the hero and overview from its plan composition boxes; no old zoom, target, crop, or profile registration is silently inherited. Exact framing remains a requester visual judgment. |
| Twelve grounded actor sets | Human cast committed; proportion and George corrections pending | GET-206 commit `450f662` preserves the validated 12-set, 288-sheet, 1,152-frame grounded human cast, 12 portraits, Takahiro art, clean alpha components, anchors, integrity, and provenance. That useful human work remains recoverable, but its `0.96` scale is not visually accepted: `GDR-ART-014` requires one smaller shared scale derived against the accepted GET-205 rebake and locked blend. The generated George human bust is superseded and must be replaced by the recovered orb under `GDR-GEO-005`. Security/civilian schedules remain owned by T8/T10; `OPEN-PERF-001` retains its acceptance boundary. |
| Actor light-region tint | Not started | Authored regions sample at actor foot anchors and apply presentation-only semantic amber/cyan tint. Inspect 250 ms strongest-region-only baseline at all target viewports; `OPEN-ART-005` keeps final intensity/feather provisional. |
| Four-lane HUD at 16–18% | Blocked | Lane widths/wireframes remain open; height and information contract are fixed. |
| Major overlays | GET-216 cover/Character/failure surfaces implemented; live viewport review pending | Cover-select, Character, safehouse research confirmation, incompatible-save notice, and breakdown/Restart Attempt surfaces use the numberless cover/ability/tier model with bilingual copy. Dialogue, dossier, social feed, evidence-limited failure report, debrief, completion, and final shared treatment remain T9A/T10. |
| Street clock and audio | Environment transition salvage evidenced; v6 revalidation pending | The current runtime proves the `19:50`/`21:50` prefetch, `20:00`/`22:00` selection, 750 ms generation-safe transition, and retained-current-state failure seam. V6 must revalidate that behavior against regenerated assets and relocated semantic audio anchors. T5 retains the exact three-person transit group and two-person café group; GET-208 owns delivery population and broader behavior. |
| Graphic surveillance noir | Look family established; reference-native plan gate pending | The wet-blue-black family, two-sided luminance/cyan gates, continuous wetness contract, and semantic amber/cyan/red boundaries remain authoritative. V4 is rejected for crushed darkness/sparse identity and v5 for reference-incompatible geography. V6 must pass its exact plan/greybox gate, then a brighter detailed source hero, then aligned three-state live proof. |

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
8a. pedestrian verification-lane instruction, valid pass, premature-exit `Suspicious` consequence, and Needle neutral/crimson lamp truth;
8b. same-camera transit-shelter population at 18:45, after 21:30, and curfew with exact seated/standing capacity and three stable civic-display roles;
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
- `yarn playtest:agent -- --ticket GET-XXX --mode closeout` for Features and Improvements; `--mode affected` is the normal development gate.

Passing automation does not move a visual or player-experience row to Accepted.

Historical GET-205 technical evidence: the 2026-08-07 publication and 2026-08-10 v4 three-state work prove recoverable publication, profile, fixed-frame, and generation-safe transition seams only. On 2026-08-11 the live v4 candidate measured `52.05%` near-black pixels and `2.68%` detail-edge coverage versus the locked blend's `39.93%` and `4.29%`; the requester rejected its massing, light distribution, facade/window identity, and NPC presentation. It is not acceptance evidence for v5. The new route/probe greybox, density band, hero, three-state live evidence, closeout checks, and requester acceptance are pending.

Current GET-207 evidence (2026-08-04): lint and production build pass; Jest passes 138 suites / 987 tests / 2 snapshots; statement and line coverage are 81.44%. The guided runner completed 20 screenshots with zero console, page, or network errors, but correctly failed to reach `lira-started` because initial Lira objective guidance and `focusObjective` remain T9/T10-owned content. This is regression evidence for the RPG foundation, not route acceptance.

## Historical readiness record

Readiness claims made before the 2026-08-02 Tokyo escape specification are superseded. Their detailed implementation and validation history remains preserved in `progress/`, Git history, and Linear. Those records may guide recovery or regression analysis, but they do not satisfy this checklist unless replayed against the current contract.
