---
status: MVP
type: content-state-specification
level: 0
---

# Level 0 Content and State Matrix

This document turns [[11 Level 0 Vertical Slice Contract]] into stable authored identifiers, state transitions, facts, checks, outcomes, and human-play scenarios. Values marked with an `OPEN-*` reference block final acceptance of their affected surface. Their recorded queue recommendation may be implemented only as an explicit reversible provisional trial; no untracked value may be guessed.

## 1. Mission state machine

| State ID | Entry condition | Required player-visible state | Valid next states | Invalid shortcuts |
|---|---|---|---|---|
| `L0_CHARACTER_CREATION` | New Game | Callsign, appearance, attributes, skills, confirmation | `L0_SAFEHOUSE_INTRO` | Direct fixed-character entry |
| `L0_SAFEHOUSE_INTRO` | Valid new character initialized | 18:30, safehouse actions, George opening, Lira objective | `L0_LIRA_BRIEFING` | Operation departure, transit validation |
| `L0_LIRA_BRIEFING` | Explicit interaction with Lira | Mission stakes, two timings, curfew/deadline, passage bargain | `L0_PREPARATION` | Automatic acceptance, package choice |
| `L0_PREPARATION` | Mission accepted | Naila/Brant optional, waiting/rest available, entrances discoverable | `L0_OPERATION_DEPARTED` | Mandatory contact sequence |
| `L0_OPERATION_DEPARTED` | Explicitly cross safehouse departure boundary/action with confirmation | Retry snapshot, running clock, current approach objective | `L0_INFILTRATION`, `L0_FAILED` | Snapshot after later choices |
| `L0_INFILTRATION` | Enter operation space | Public/service routes, surveillance, terminals, hiding/blending | `L0_MEDKITS_SECURED`, `L0_FAILED` | Proximity pickup, debug objective mutation |
| `L0_MEDKITS_SECURED` | Explicit cache interaction succeeds | Medkits mission object, optional manifest, escape objective | `L0_ESCAPE`, `L0_FAILED` | Immediate mission completion |
| `L0_ESCAPE` | Leave cache interaction context | Resolve Suspicious/Pursuit to Clear, then return-to-Lira objective | `L0_LIRA_RETURN`, `L0_FAILED` | Invisible exit trigger while surveillance remains unresolved |
| `L0_LIRA_RETURN` | Explicit Lira interaction with medkits while the network is Clear | Factual return dialogue, medkit handoff, transit credential | `L0_TRANSIT_VALIDATION`, `L0_FAILED` | Proximity handoff or return during active surveillance |
| `L0_TRANSIT_VALIDATION` | Credential issued | Safehouse outbound terminal enabled, deadline active | `L0_DEBRIEF`, `L0_FAILED` | Automatic validation |
| `L0_DEBRIEF` | Explicit valid terminal use before deadline | Transit valid, failure clock disabled, recovery/level-up/debrief | `L0_COMPLETE` | Miami load |
| `L0_COMPLETE` | Debrief acknowledged | `Continue Exploring`, `End Demo` | terminal/free-roam states only | Placeholder Level 1 |
| `L0_FAILED` | Health 0, Paranoia 100, capture, or midnight failure | Exact cause, factual summary, Retry, New Game | restored `L0_OPERATION_DEPARTED` or `L0_CHARACTER_CREATION` | Silent reset, stale partial state |

## 2. Objective contract

| Objective ID | Player-facing intent | Activates | Completes | Failure behavior |
|---|---|---|---|---|
| `l0.meet_lira` | Meet Lira outside the safehouse | Level initialization | Lira briefing opened | Cannot fail independently |
| `l0.accept_bargain` | Hear Lira's offer and decide | Lira briefing | Explicit acceptance | Declining keeps conversation available; no run failure |
| `l0.prepare_or_depart` | Consult contacts or begin the operation | Mission accepted | Operation departure | Optional contacts never block |
| `l0.recover_medkits` | Enter the logistics site and recover the supplies | Operation departure | Explicit cache recovery | Run-level failures only |
| `l0.inspect_manifest` | Optional: inspect Hidzu shipping data | Cache area discovered | Recognized or intentionally left/missed | Never blocks primary objective |
| `l0.escape_network` | Leave the site and resolve surveillance | Medkits secured | Network Clear permits Lira return | Capture/deadline/medical failures |
| `l0.return_medkits` | Return the supplies to Lira | Escape begins | Explicit handoff dialogue | Deadline remains active |
| `l0.validate_transit` | Validate outbound passage at the safehouse | Credential issued | Explicit terminal validation | Midnight failure until completion |
| `l0.debrief` | Review consequences and progression | Transit valid | Debrief acknowledged | Cannot fail after valid transit |

Only the highest-priority incomplete primary objective appears in the persistent quest lane. Optional preparation and evidence appear as compact indicators and in the dossier.

## 3. Beat and pacing matrix

These beat ranges decompose the reversible `OPEN-TIME-001` trial baseline for observation and tuning; they are not Approved values and their maxima are not intended to stack into one run.

| Beat ID | Target duration | Clock | Required content | Decision or skill expression | Exit proof |
|---|---:|---|---|---|---|
| `beat.create` | 1–2 min | Paused | Callsign, four appearances, allocation, build summary | Build identity | Character persisted |
| `beat.safehouse` | 1 min | 18:30, paused in overlays | George opening, safehouse affordances | Inspect or leave | Lira objective understood |
| `beat.lira` | 1–2 min | Paused | Bargain, medkits, timings, deadline, passage | Dialogue tone/check only where authored | Mission accepted |
| `beat.prepare` | 0–4 min | Mixed | Naila, Brant, wait/rest | Consult both/one/neither; choose timing | Departure snapshot |
| `beat.approach` | 2–3 min | Running | Three-loop city reading, entrances, public/service contexts | Observation and route choice | Site boundary entered |
| `beat.infiltrate` | 3–4 min | Mixed | Camera, terminal, drone risk, hiding/blending | Systems/OpSec or avoidance | Cache reached |
| `beat.cache` | 1–2 min | Paused in terminal | Medkits, optional manifest | Naila fact or Awareness | Mission object secured |
| `beat.escape` | 2–3 min | Running | Clear/Suspicious/Pursuit response | Evasion, composure, hiding/blending | Lira safely reachable |
| `beat.return` | 1–2 min | Paused | Handoff, factual reaction, credential | Consequence acknowledgment | Credential issued |
| `beat.validate` | 1 min | Mixed | Safehouse return and terminal | Time management | Transit valid |
| `beat.debrief` | 1–2 min | Paused | Dossier summary, level-up, Miami bridge | Progress allocation | Complete state |

The unpaused operation budget must fit within eleven real minutes at 30×. `OPEN-TIME-001` must validate route-specific budgets before final pacing acceptance; its recorded route budget may be trialed provisionally.

## 4. Fact ledger

| Fact key | Source | Provenance stored | Direct effects | Debrief/continuation effect |
|---|---|---|---|---|
| `fact.lira.medkits_seized` | Lira briefing | dialogue node and timestamp | Activates mission | Establishes humanitarian outcome |
| `fact.lira.public_entrance` | Lira briefing | Lira | District-level public-route marker | Records route knowledge |
| `fact.lira.curfew_service_side` | Lira briefing | Lira | District-level service-route marker | Records route knowledge |
| `fact.lira.midnight_deadline` | Lira briefing | Lira | Shows deadline in quest lane | Failure/debrief context |
| `fact.lira.passage_bargain` | Lira briefing | Lira | Enables future credential objective | Miami handoff provenance |
| `fact.naila.camera_topology` | Naila | contact and node | Reveals known camera relationships | Notes technical preparation |
| `fact.naila.connected_terminal` | Naila | contact and node | Exact camera-loop terminal marker | Notes technical preparation |
| `fact.naila.cold_iron_pattern` | Naila | contact and node | Guarantees `check.manifest_recognition` | Strong evidence interpretation |
| `fact.brant.delivery_window` | Brant | contact and node | Exact public blending window/objective precision | Notes social preparation |
| `fact.brant.delivery_protocol` | Brant | contact and node | Reveals expected blending behavior | Notes social preparation |
| `fact.world.camera.<id>` | Physical discovery or Naila | source, position, time | Device on minimap/observation | Camera awareness summary |
| `fact.world.hiding.<id>` | Physical discovery, contact, or authored observation | source, position, time | Hiding context on minimap/observation | No generic reward |
| `fact.cache.manifest_present` | Cache context | explicit inspection | Opens recognition result | Evidence attempted |
| `fact.cache.cold_iron_recognized` | Naila guarantee or Awareness success | exact cause | Updates dossier and George | Changes Lira/Miami handoff |
| `fact.transit.credential_issued` | Lira return | Lira return node | Enables outbound terminal | Confirms bargain honored |
| `fact.transit.validated` | Outbound terminal after medkit return | terminal ID and time | Completes second deadline requirement | Complete outcome |

Facts never increment a generic score. Duplicate acquisition may update provenance but cannot duplicate effects or rewards.

## 5. Deterministic check catalog

Exact requirements marked `OPEN-RPG-001` are proposed defaults and block final check acceptance until resolved. Exact fact and situational-modifier behavior is separately governed by `OPEN-RPG-004`. Implementers may use only those recorded recommendations as reversible provisional data; they may not choose among alternatives or infer a modifier from prose.

| Check ID | Context | Attribute + skill | Proposed requirement | Fact effect | Success | Fail-forward |
|---|---|---|---:|---|---|---|
| `check.lira_read_stakes` | Lira briefing | Social + Insight | 3 | None | Reveals Lira's immediate personal risk | Mission remains available without private inference |
| `check.naila_opsec` | Naila preparation | Technical + OpSec | 4 | Proposed: no fact modifier; Naila is the source (`OPEN-RPG-004`) | Naila shares trace-risk detail | Core topology fact still available; trace detail withheld |
| `check.brant_credibility` | Brant preparation | Social + Influence | 4 | Proposed: no fact modifier; any authored node-visibility prerequisite is separate from the calculation (`OPEN-RPG-004`) | Exact behavior phrase and window | Broader timing fact only |
| `check.public_blend` | Dusk entrance | Social + Insight | 4 | Proposed: `fact.brant.delivery_protocol` lowers by 1 and never guarantees (`OPEN-RPG-004`) | Enter blending context cleanly | Suspicion increases; route remains recoverable |
| `check.camera_loop` | Connected terminal | Technical + Systems | 4 | Proposed: `fact.naila.camera_topology` lowers by 1 (`OPEN-RPG-004`) | Camera loop begins | Terminal explains missing capability; avoidance remains |
| `check.camera_trace` | Successful loop | Mental + OpSec | 4 | `fact.naila.connected_terminal` does not bypass OpSec | No trace | Loop succeeds but network becomes Suspicious |
| `check.manifest_recognition` | Optional manifest | Mental + Awareness | 4 | `fact.naila.cold_iron_pattern` guarantees success | Cold Iron fact recorded | Manifest presence recorded; significance missed |
| `check.intercept_influence` | Authored interception | Social + Influence | 5 | Proposed: `fact.brant.delivery_protocol` lowers by 1 only in a named public-route interception (`OPEN-RPG-004`) | Escape with time/Paranoia cost | Option fails into capture or alternate choice per node |
| `check.intercept_composure` | Authored interception | Mental + Composure | 5 | Low Paranoia provides no bonus; thresholds apply normally | Maintain cover story or controlled withdrawal | Health/Paranoia cost or capture per node |
| `check.intercept_evasion` | Authored interception | Physical + Evasion | 5 | Proposed: the node's named nearby `fact.world.hiding.<id>` lowers by 1 (`OPEN-RPG-004`) | Break contact with Health/time cost | Capture on final failed option |
| `check.pursuit_hide` | Pursuit recovery | Mental + Stealth | 4 | Authored hiding context is prerequisite, not a bonus | Network falls to Suspicious | Drone verifies the context; Pursuit continues |

Every displayed calculation lists base attribute, skill, Paranoia penalty, authored modifier, fact effect, requirement, and result.

## 6. Surveillance transition matrix

Exact exposure rates and durations remain acceptance decisions under `OPEN-SUR-001` through `OPEN-SUR-004`; only their recorded recommendations may be used as reversible provisional data.

| From | Trigger | To | Stored evidence | Player feedback | Recovery |
|---|---|---|---|---|---|
| Clear | Sustained camera/guard observation or authored suspicious behavior | Suspicious | source, last-known position, time | Amber network change, source direction, Paranoia cause | Break observation and use credible context |
| Suspicious | Concern decays after unobserved credible recovery | Clear | cleared source plus history | Calm confirmation, small authored Paranoia relief when earned | Complete |
| Suspicious | Continued exposure, identity confirmation, verifier confirmation, failed checkpoint | Pursuit | confirmed source, last-known position, confidence | Crimson Pursuit, drone/security warning | Break sight, change direction, hide/blend |
| Pursuit | Sight broken but search unresolved | Pursuit | updated last-known evidence only when observed | Search focuses old position | Keep moving/prepare context |
| Pursuit | Successful authored hiding/blending recovery | Suspicious | cleared true position; retained last-known history | Search continues at prior location | Remain credible until concern clears |
| Any | Terminal loop with weak OpSec | Suspicious minimum | terminal/camera trace | Successful loop plus explicit trace warning | Normal Suspicious recovery |

No transition may originate from hidden coordinates, pass through solid geometry, or skip from Clear to capture without an authored instant-confirmation event clearly telegraphed in advance.

## 7. Hiding and blending context schema

Every context has:

- stable ID and world anchor;
- type: `hiding` or `blending`;
- discovery source;
- occupancy bounds;
- line-of-sight entry rule;
- valid network states;
- required behavior/fact/check;
- drone verification behavior;
- exit behavior;
- world, HUD, audio, and George feedback;
- failure result.

Minimum authored content:

| Context ID | Type | Route | Required fiction |
|---|---|---|---|
| `hide.service_recess` | hiding | Curfew/service | Recess blocks camera sight and has a readable entrance |
| `hide.maintenance_bay` | hiding | Curfew/service | Bay supports verifier search behavior |
| `hide.transit_structure` | hiding | Shared return | Structure supports direction-change recovery |
| `blend.delivery_activity` | blending | Dusk/public | Civilians/service workers create credible movement pattern |
| `blend.public_queue` | blending | Dusk/public | Queue has visible start, behavior, and exit |

Final count and placement remain acceptance decisions under `OPEN-LAYOUT-003` and `OPEN-CIV-001`; their recorded recommendations may be tested in reversible layout/content data.

## 8. Terminal contract

| Terminal ID | Location | Single function | Prerequisite | Success | Failure/unavailable feedback |
|---|---|---|---|---|---|
| `terminal.camera_loop` | Logistics network access point | Temporarily loop connected camera set | Range, Systems action, connected topology | Loop plus OpSec resolution | Names missing range/capability/network state |
| `terminal.cache_locker` | Medkit cache | Open/release mission object | Range and authored access condition | Explicit medkit recovery | Names blocker; never controls cameras or transit |
| `terminal.outbound_transit` | Safehouse | Validate issued credential | Credential, before midnight, range | Transit valid; deadline disabled | Names missing credential, expiry, or already-valid state |

Terminal UI pauses simulation while open. Each terminal states its function before confirmation and cannot operate unrelated systems.

## 9. Dialogue node map

Exact prose is authored under T10; infrastructure and state effects are owned by T9.

| Node family | Required content | State effects | Required variants |
|---|---|---|---|
| `lira.intro` | Recognition, immediate exposure, meeting purpose | none | First meeting / repeat |
| `lira.briefing` | Medkits, Hidzu site, dusk/curfew, deadline, passage | mission accepted; core facts | Build-sensitive optional lines |
| `lira.return` | Explicit handoff and outcome reading | medkits returned; credential issued | Contacts, route, camera, drone, pursuit, Health, Paranoia, evidence |
| `naila.preparation` | Camera topology, terminal, shipping pattern | Naila facts | Check success/fail-forward; repeat summary |
| `brant.preparation` | Delivery window, protocol, public behavior | Brant facts | Check success/fail-forward; repeat summary |
| `interception.<context>` | Short grounded confrontation | cost, escape, or capture | Only supported check options |
| `george.context.<state>` | Authored question and bounded answer | no world mutation | Unknown/insufficient-evidence response |
| `debrief.level0` | Factual run summary and Miami bridge | XP/level-up availability; completion | Evidence found/missed and major outcome combinations |

English and Ukrainian use identical node IDs, check requirements, fact effects, and state transitions.

## 10. Outcome ledger

`Level0OutcomeLedger` records only authored facts needed by Lira, George, dossier, debrief, Retry diagnostics, and Miami continuation:

| Field | Values |
|---|---|
| `acceptedAt` | world timestamp |
| `departedAt` | world timestamp |
| `completedAt` | world timestamp or null |
| `primaryTiming` | `dusk_public`, `curfew_service`, `mixed` |
| `contactsConsulted` | set of `lira`, `naila`, `brant` |
| `factsAcquired` | stable fact-key set whose entries reference acquisition IDs in `FactLedger`; provenance remains canonical in the ledger rather than being copied into strings |
| `cameraLoop` | `not_used`, `clean`, `traced` |
| `networkPeak` | `clear`, `suspicious`, `pursuit` |
| `droneVerified` | boolean |
| `hidingContextsUsed` | stable ID set |
| `blendingContextsUsed` | stable ID set |
| `interceptionOutcome` | stable outcome ID or null |
| `healthLost` | integer |
| `paranoiaPeak` | integer 0–100 |
| `medkitsRecovered` | boolean |
| `medkitsReturned` | boolean |
| `manifestInspected` | boolean |
| `manifestRecognizedBy` | `naila_fact`, `awareness`, `missed`, `not_inspected` |
| `transitValidated` | boolean |
| `failureCause` | stable failure ID or null |

The ledger does not contain reputation, karma, trust, violence, kills, loot value, package, combat, or procedural storylet fields.

## 11. Failure and recovery matrix

| Failure ID | Trigger | Message must name | Retry restoration | Prohibited behavior |
|---|---|---|---|---|
| `failure.health` | Health reaches 0 | Physical cause and final consequence | Departure snapshot | Generic “mission failed” only |
| `failure.paranoia` | Paranoia reaches 100 | Medical collapse and contributing source | Departure snapshot | Hallucination framing |
| `failure.capture` | Final authored interception option fails | Confirming actor/system and decision | Departure snapshot | Tactical battle fallback |
| `failure.deadline` | 00:00 while either medkit return or transit validation is incomplete | Missed credential/transit deadline | Departure snapshot | Failure after transit is valid |
| `failure.save_incompatible` | Retired schema detected | Incompatibility and New Game requirement | No partial Retry | Silent migration or corrupted defaults |

## 12. Safehouse and snapshot matrix

### Autosave

Stores the current new-schema run at authored safe points. It is not the same object as Retry.

### Operation-departure Retry snapshot

Created exactly once per attempt when the player explicitly departs the safehouse for the operation. It stores:

- schema version;
- callsign and appearance;
- attributes, skills, level, XP, and unspent points;
- Health and Paranoia;
- world time;
- mission and objective states;
- contacts visited and facts acquired before departure;
- known locations/devices/contexts;
- safehouse actions already taken;
- departure anchor and deterministic runtime generation;
- content version identifiers required to reject incompatible restoration.

It excludes all post-departure movement, facts, device state, medkit/evidence state, pursuit state, damage, time, and outcomes.

## 13. World semantic contract

The approved mission skeleton first defines the required places and route purposes. During GET-204, the complete master scene exports candidate semantic metadata for live proof; after requester acceptance, that exact geometry is back-propagated into the `Level0LayoutContract`, which then becomes the single shared runtime/Blender source for:

- district boundary and three traversal loops;
- walkable and blocked surfaces;
- roads, sidewalks, alleys, crossings, plazas, and service zones;
- building footprints and entrances;
- safehouse boundary and actions;
- Lira, Naila, and Brant anchors;
- public and service infiltration entrances;
- three terminal anchors and ownership;
- camera anchors, orientation, network relationships, and discovery rules;
- drone launch/search regions;
- hiding and blending contexts;
- objective, medkit, and manifest anchors;
- runtime/Blender semantic masks and projection metadata.

The previous exact `84×60` nine-block geometry is superseded and is not a preservation constraint. Coordinates, dimensions, widths, and counts beyond the approved mission skeleton remain acceptance decisions under `OPEN-LAYOUT-001` through `OPEN-LAYOUT-004`; GET-204 resolves them through the complete live candidate before they are frozen in the contract. The exact pre-operation planning/departure topology is separately governed by `OPEN-LAYOUT-005`. Their recorded recommendations may be trialed through replaceable layout data and diagnostics, but a rejected greybox or partial prototype may not override an accepted city composition.

## 14. Human-play acceptance matrix

| Case ID | Start/build | Required actions | Expected proof |
|---|---|---|---|
| `AC-L0-001` | New Game | Create character; enter safehouse; meet Lira | First decision <3 min; build and mission state correct |
| `AC-L0-002` | Social/Insight build | Consult Brant; use dusk public route | Fact changes objective precision/blending; completion succeeds |
| `AC-L0-003` | Technical/OpSec build | Consult Naila; wait for curfew; loop camera | Connected terminal only; clean trace outcome possible |
| `AC-L0-004` | Any viable build | Skip both contacts; complete either route | Mission remains possible with less clarity/stricter checks |
| `AC-L0-005` | Naila fact | Inspect manifest | Recognition guaranteed and attributed to fact |
| `AC-L0-006` | Awareness-capable build | Skip Naila; inspect manifest | Visible deterministic check recognizes evidence |
| `AC-L0-007` | Low Awareness/no fact | Inspect or skip manifest | Evidence may be missed; medkit mission still completes |
| `AC-L0-008` | Any | Trigger Suspicious; recover through context | Last-known position and Paranoia cause visible; returns Clear |
| `AC-L0-009` | Any | Trigger Pursuit; break sight/change direction/hide | Network searches old position and returns through Suspicious |
| `AC-L0-010` | Any | Allow drone verification | Strong warning; Pursuit transition is understandable |
| `AC-L0-011` | Supported build | Resolve authored interception successfully | Visible requirement/cost; no combat mode |
| `AC-L0-012` | Unsupported/failed options | Fail interception | Exact capture failure; deterministic Retry |
| `AC-L0-013` | Injured attempt | Reach Health 0 | Exact cause; Retry restores departure Health |
| `AC-L0-014` | High-stress attempt | Reach Paranoia 100 | Fatal medical collapse; no dishonest perception |
| `AC-L0-015` | Late attempt | Reach midnight while medkit return or validation remains incomplete | Deadline failure; Retry restores departure time |
| `AC-L0-016` | Completed attempt | Return medkits; validate transit; debrief | Actual facts/outcomes shown; deadline disabled; level-up available |
| `AC-L0-017` | English then Ukrainian | Repeat equivalent path | Identical state changes and checks |
| `AC-L0-018` | All target viewports | Exercise opening, dialogue, HUD, observation, Pursuit, Character, dossier, failure, debrief | No overflow/corruption; dock 16–18%; world and actors readable |
| `AC-L0-019` | Active surveillance near safehouse | Reach/cross the safehouse boundary while observed, Suspicious, and in Pursuit; attempt every safehouse action | Entry never clears the network; availability, search behavior, and recovery match the approved or explicitly provisional `OPEN-SAFE-001` rule with explicit reasons and no magical escape. Provisional evidence informs review but cannot close final acceptance. |

All cases use visible controls. Debug bridges may prepare diagnostics but cannot satisfy a player-flow step.
