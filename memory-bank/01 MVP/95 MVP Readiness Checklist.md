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
| Documentation commit | Ready for requester review | GET-201 is committed separately at `b50a4cd5290490cc8ab8c3521a2c22acaa1afdce`; implementation proceeds ticket by ticket while requester polish remains open. |

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
| Direct click-to-move | Implemented; live review pending | The active scene uses direct world intent, immediate replacement, truthful invalid-target reasons, and no route request. Pure movement and entry tests pass; live human feel remains unaccepted. |
| WASD alternative | Implemented; live review pending | Isometric screen-direction input replaces click intent immediately and shares the same collision integrator. Keyboard feel/focus still needs target-viewport play. |
| Collision sliding | Implemented; live review pending | Disc samples and local axis sliding pass deterministic corner/block tests. Narrow-alley and entrance feel still requires human play. |
| Explicit interactions | Partially implemented | One typed resolver proves knowledge, independently derived world ownership, range, solid-geometry occlusion, and authoritative unavailable reasons; automatic discovery cannot leak unknown/wrong-domain targets and safehouse actions require confirmation. Contacts, mission objects, hiding, and terminals remain with T8–T10. |
| Focus ownership | Partially evidenced | Menu, Observation, safehouse confirmation, deadline failure, and Escape use additive pause/focus ownership. Confirmation and terminal overlays make the background inert, disable its controls, and reject hidden safehouse mutations. Autosaves strip transient UI owners and hydration derives only terminal pauses. Later overlays still require integration proof. |
| Full-pause observation | Partially implemented | Observation freezes the clock and movement while allowing camera pan/zoom. Known-device inspection and authored George prompts remain T8/T9. |
| Camera/zoom contract | Implemented provisionally; acceptance blocked | Runtime clamps normal zoom to 0.60–1.25 and restores follow after observation. Start framing/tuning remain open and minimum-zoom live capture is not yet accepted. |

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
| George HUD + private AR avatar | Blocked | Hardware fiction and exact presentation reference remain open; behavior contract is specified. |
| Authored George prompts | Not started | No free text, invention, automation, or undiscovered-content leaks. |
| Operation dossier | Not started | Objectives, facts, people, locations, evidence, timeline, consequences; no rejected systems. |
| Knowledge minimap | Foundation implemented | The shared authored-ID knowledge resolver hides undiscovered cameras, drone, objectives, terminals, hiding, and blending contexts from the scene and diagnostics. District/area/entrance objective knowledge never exposes an exact world anchor; only exact precision does. Final approximate-marker rendering and discovery flows remain T8/T9. |
| Read-only social feed | Not started | Atmospheric Hidzu content only; no posting, messaging, followers, or search risk. |

## World, actors, HUD, and audio readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| Shared outdoor layout contract | Corrected provisionally; approval blocked | Calibrated true-scale T4 captures exposed a second topology defect in v2: four miniature attached buildings inflated density while occluding Lira and leaving an oversized safehouse court. Typed `level0-tokyo-greybox-v3` keeps the 84×60 bounds, three loop paths, 20 semantic surfaces, 27 stable anchor IDs, masks, and art layers, but replaces those micro-masses with nine non-miniature gameplay footprints at 31.2% district coverage, expands the safehouse shell, reduces its outdoor court to 54 square layout units, seats spawn 1.5 units from its entrance, and gives transit one full-scale service block. Footprints are overlap/bounds validated; loops and required anchors are validated with the runtime's 0.32 collision clearance. Exact values remain `OPEN-*`; requester/live route acceptance is still required. |
| Three traversal loops | Technically evidenced; live review pending | Validator proves exactly three interlocking loops and required-anchor reachability without runtime pathfinding. The provisional direct speed yields an approximately 145-second outer loop; route feel remains unaccepted pending human play. |
| Unchanged-kit Blender city gate | Paused for v3 recomposition; requester acceptance blocked | Blender 5.0.1 local generation proves one camera/scene/scale system and records exact source/archive hashes, transforms, and an external-only raw-asset boundary. A vertical-sensor correction made the fixed 0.78/0.60 captures honest, and those views rejected the v2 composition because its miniature attached buildings and oversized courts failed human scale. T4 resumes only against the committed v3 contract; fixed captures, final unchanged-kit composition review, and acquisition-specific entitlement evidence for any committed derivative remain outstanding. Direction B is still a T5 Hidzu-treatment blocker, not a T4 unchanged-kit blocker. |
| Hidzu identity pass | Not started | Begins only after unchanged-kit composition acceptance. |
| No zoom-out corruption | Partially evidenced; runtime acceptance blocked | The vector greybox uses one continuous projection and clamps at 0.60. Ignored Blender overview renders from one master scene show no repeated plates or angle seams, but all fixed default/0.60 captures and the runtime-integrated human-control pass remain hard acceptance gates. |
| Twelve grounded actor sets | Not started | Complete 8-direction `idle/move/interact`, anchors, scale, matching portraits. |
| Four-lane HUD at 16–18% | Blocked | Lane widths/wireframes remain open; height and information contract are fixed. |
| Major overlays | Not started | Character, dialogue, dossier, feed, debrief, failure, retry, completion at 1280×720 minimum. |
| Audio coverage | Blocked | Exact cue list/priority/ducking remains open; required categories are specified. |
| Graphic surveillance noir | Not started | Live human-reviewed frames demonstrate city cohesion, midtone readability, surveillance identity, and no fantasy presentation. |

## Save, Retry, and compatibility readiness

| Gate | State | Acceptance evidence required |
|---|---|---|
| New save schema | Foundation implemented | Exact nested schema/content guards validate attributes, skills, objectives, contacts, map knowledge, clock consistency, pause owners, exact missing deadline requirements, walkable player/last-known positions, normalized facing, and current generation/seed/layout identity; malformed or stale payloads are rejected without default filling. T7–T10 will add final content fields without reusing rewrite state. |
| Autosave | Foundation implemented | Current run uses a separate validated key, writes at start/safe transitions/periodic exit protection, strips transient overlay ownership, and excludes retired package/combat/inventory ownership. Final authored checkpoint policy remains later integration work. |
| Departure Retry snapshot | Foundation implemented | Explicit confirmed departure projects and verifies one identical Retry/autosave state before writing either record, writes Retry first as a recoverable transaction, rejects conflicting sessions/state, requires the authored departure anchor, recreates the scene at that transform, and Retry hydrates the complete snapshot. Full identity/preparation/fact coverage expands with T7/T9/T10. |
| Incompatible rewrite saves | Technically evidenced; live review pending | The active menu never hydrates `the-getaway-state`, leaves it untouched until explicit New Game, explains incompatibility bilingually, and clears it only through that action. |
| Failure causes | Partially implemented | Midnight failure records `failure.deadline`, freezes simulation, names exactly the incomplete completion requirements, and offers departure Retry. Wait/Rest confirmations warn before crossing midnight only when those requirements are incomplete. Health, Paranoia, and capture failures remain T7/T8/T10. |

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
