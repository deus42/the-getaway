---
status: MVP
type: content-state-specification
level: 0
---

# Level 0 Content and State Matrix

This document turns [[11 Level 0 Vertical Slice Contract]] into stable authored identifiers, state transitions, facts, gates, outcomes, and human-play scenarios. Values marked with an `OPEN-*` reference block final acceptance of their affected surface. Their recorded queue recommendation may be implemented only as an explicit reversible provisional trial; no untracked value may be guessed.

## 1. Mission state machine

| State ID | Entry condition | Required player-visible state | Valid next states | Invalid shortcuts |
|---|---|---|---|---|
| `L0_COVER_SELECT` | New Game | Cover fiction, three starting abilities, playable-cover confirmation | `L0_SAFEHOUSE_INTRO` | Direct fixed-character entry |
| `L0_SAFEHOUSE_INTRO` | Valid new character initialized | 18:30, safehouse actions, George opening, Lira objective | `L0_LIRA_BRIEFING` | Operation departure, transit validation |
| `L0_LIRA_BRIEFING` | Explicit interaction with Lira | Mission stakes, two timings, curfew/deadline, passage bargain | `L0_PREPARATION` | Automatic acceptance, package choice |
| `L0_PREPARATION` | Mission accepted | Naila/Brant optional, waiting/rest available, entrances discoverable | `L0_OPERATION_DEPARTED` | Mandatory contact sequence |
| `L0_OPERATION_DEPARTED` | Confirm George's departure readback and explicitly cross the departure boundary/action | `OperationAttemptBaseline`, running clock, current approach objective | `L0_INFILTRATION`, `L0_FAILED` | Baseline after later choices |
| `L0_INFILTRATION` | Enter operation space | Public/service routes, surveillance, terminals, hiding/blending | `L0_MEDKITS_SECURED`, `L0_FAILED` | Proximity pickup, debug objective mutation |
| `L0_MEDKITS_SECURED` | Explicit cache interaction succeeds | Medkits mission object, optional manifest, escape objective | `L0_ESCAPE`, `L0_FAILED` | Immediate mission completion |
| `L0_ESCAPE` | Leave cache interaction context | Resolve Suspicious/Pursuit to Clear, then return-to-Lira objective | `L0_LIRA_RETURN`, `L0_FAILED` | Invisible exit trigger while surveillance remains unresolved |
| `L0_LIRA_RETURN` | Explicit Lira interaction with medkits while the network is Clear | Factual return dialogue, medkit handoff, transit credential | `L0_TRANSIT_VALIDATION`, `L0_FAILED` | Proximity handoff or return during active surveillance |
| `L0_TRANSIT_VALIDATION` | Credential issued | Safehouse outbound terminal enabled, deadline active | `L0_DEBRIEF`, `L0_FAILED` | Automatic validation |
| `L0_DEBRIEF` | Explicit valid terminal use before deadline | Transit valid, failure clock disabled, recovery/research/debrief | `L0_COMPLETE` | Miami load |
| `L0_COMPLETE` | Debrief acknowledged | `Continue Exploring`, `End Demo` | terminal/free-roam states only | Placeholder Level 1 |
| `L0_FAILED` | Breakdown at Paranoia 100, capture, or midnight failure | Cause-specific factual screen, Restart Attempt, New Game | restored `L0_OPERATION_DEPARTED` or `L0_COVER_SELECT` | Silent reset, stale partial state, invented capture evidence |

## 1A. Cross-system transition ledger

This ledger reconciles the complete player journey. “Feedback” always includes equivalent readable meaning; audio and color may reinforce but never exclusively carry a required state.

| Transition | State owner | Triggering player action | Prerequisites / blockers | Facts or gates | Required feedback | Persistence / Restart Attempt | Outcome-ledger write | Specification / ticket |
|---|---|---|---|---|---|---|---|---|
| New Game → Cover-select | Application + identity domain | Select New Game | No incompatible hydration in progress | None | Four authored covers, one playable and three visibly disabled; no numeric allocation | Selection is not persisted; New Game clears prior Level 0 state | None | [[92 Character, Covers, Abilities & Research]] / T7A |
| Cover-select → Safehouse | Identity + lifecycle | Confirm the playable cover | Cover valid and enabled | No gate | Cover purpose, starting abilities, world load, George opening, current beat | Create version-3 autosave; Restart Attempt absent | None | [[92 Character, Covers, Abilities & Research]], [[44 Safehouse, Save & Restart Attempt]] / T3, T7A |
| Safehouse → Lira briefing | Mission + dialogue | Move and explicitly interact with Lira | Lira available/in range; overlay focus valid | Optional authored Lira gate only where catalogued | Exact dialogue, pause, objective context, George quiet | Autosave may record current safehouse run; Restart Attempt absent | Contact interaction only after authored effect | [[90 Dialogue]], [[91 Quests & Objectives]] / T9, T10 |
| Briefing → Preparation | Mission | Explicitly accept Lira's bargain | Stakes, two timings, deadline, passage stated | Lira facts acquired with provenance | Current beat, dossier facts, route-level markers, mission cue | Pre-departure state persists; Restart Attempt absent | `acceptedAt`, `contactsConsulted += lira`, facts | [[90 Dialogue]], [[46 Facts, Dossier, Minimap & Terminals]] / T9, T10 |
| Preparation → Departure | Safehouse + persistence | Consult any contacts or neither, review George's exact readback, then confirm departure | Mission accepted; departure topology under `OPEN-LAYOUT-005`; unsafe actions under `OPEN-SAFE-001` | Naila/Brant facts and optional gates completed or skipped | Real departure time, contacts, the Paranoia tier, held abilities, and Restart Attempt meaning | Immutable `OperationAttemptBaseline` created before later world mutation | `departedAt`, contacts/facts, primary timing begins | [[44 Safehouse, Save & Restart Attempt]], [[80 Day-Night Cycle]] / T3, T7, T10, GET-211 |
| Departure → Infiltration | Mission + movement | Cross into operation space through public or service approach | Route active for time/context; movement/collision/interaction valid | Known route facts refine clarity; no contact is mandatory | World route identity, camera/context discovery, objective precision, ambience | Running state checkpointed; Restart Attempt remains immutable | `primaryTiming`, facts discovered | [[41 Movement, Interaction & Observation]], [[80 Day-Night Cycle]] / T3, T8, T10 |
| Infiltration → Medkits secured | Mission + terminal | Reach and explicitly operate cache locker, then explicitly take medkits | Range/access; not captured/broken-down/deadline-failed | Visible authored access gate if defined | One-function terminal result, mission-object acquisition, escape beat | Post-departure state saved normally but excluded from Restart Attempt | `medkitsRecovered = true` | [[46 Facts, Dossier, Minimap & Terminals]], [[93 Inventory (MVP)]] / T9, T10 |
| Cache → Manifest outcome | Facts + gates | Explicitly inspect or intentionally leave the manifest; after recognition, explicitly copy or leave it | Manifest present; inspection in range | Naila's warning, `ability.spot_patterns`, or the visible five-minute study path resolves `gate.manifest_recognition`; copying adds no gate | Exact recognition/miss reason; explicit copy confirmation and five-world-minute cost; George only after known result | Post-departure evidence/gate outcome discarded on Restart Attempt | `coldIronEvidenceState`, `manifestCopyCompletedAt` | [[46 Facts, Dossier, Minimap & Terminals]], [[92 Character, Covers, Abilities & Research]] / T7A, T9, T10, GET-213 |
| Medkits secured → Escape resolved | Surveillance network | Leave cache, break sight, change direction, use valid hiding/blending or resolve interception | `ObservationEvidence` plus a valid `SurveillanceRuleBreakEvidence`; context eligibility; Paranoia below breakdown | Context/gate requirements visible; contact facts only designated effects | Source, last-known position, network transition, Paranoia cause, Needle/security/audio/George | All post-departure network/resource state discarded on Restart Attempt | network peak, camera-group history, Needle, contexts, interception, Paranoia | [[42 Surveillance, Security & Civilian Behavior]], [[70 Stealth]] / T8, GET-212 |
| Escape → Lira return | Mission + dialogue | Reach Lira while eligible and explicitly hand over medkits | Medkits held; network Clear; before deadline | Debrief predicates read current facts/outcomes | Factual return dialogue, handoff, credential issuance, objective update | Handoff persists in autosave but Restart Attempt stays departure | `medkitsReturned = true`; credential fact | [[90 Dialogue]], [[91 Quests & Objectives]] / T9, T10 |
| Lira return → Transit validation | Safehouse + terminal | Return to safehouse and explicitly operate outbound terminal | Credential issued, unexpired, eligible safehouse action, before midnight | No unrelated check; terminal validates one credential function | Expiry/result, objective completion, deadline disabled, validation cue | Transit result persists; Restart Attempt remains departure until run ends | `transitValidated = true`, `completedAt` candidate | [[44 Safehouse, Save & Restart Attempt]], [[46 Facts, Dossier, Minimap & Terminals]] / T3, T9, T10 |
| Validation → Debrief | Mission + identity | Enter and acknowledge factual debrief | Medkits returned and transit valid | Ledger predicates; research recap only | Actual route/facts/costs, dossier, George observation, research recap | Completed autosave stores final cover/ability/outcome state | `completedAt`; no invented outcome | [[91 Quests & Objectives]], [[92 Character, Covers, Abilities & Research]] / T7A, T9, T10 |
| Debrief → Continue / End | Lifecycle | Select `Continue Exploring` or `End Demo` | Debrief acknowledged | None | Exact terminal choice and consequence | Completed run persists; no new Restart Attempt attempt or Miami scene | No new mission outcome | [[11 Level 0 Vertical Slice Contract]] / T10 |
| Any active run → Failure → Restart Attempt | Paranoia, surveillance, clock, persistence | Failure trigger, then explicit Restart Attempt or New Game | Exact failure cause; compatible `OperationAttemptBaseline` required for Restart Attempt | No reroll or hidden override | Cause, contributing action/system, restoration meaning | Restart Attempt restores the full immutable baseline; New Game clears all | `failureCause` belongs to failed-attempt evidence only | [[43 Failure, Surrender & Recovery]], [[44 Safehouse, Save & Restart Attempt]] / T3, T7A, T8, T10 |

## 2. Objective contract

| Objective ID | Player-facing intent | Activates | Completes | Failure behavior |
|---|---|---|---|---|
| `l0.meet_lira` | Meet Lira outside the safehouse | Level initialization | Lira briefing opened | Cannot fail independently |
| `l0.accept_bargain` | Hear Lira's offer and decide | Lira briefing | Explicit acceptance | Declining keeps conversation available; no run failure |
| `l0.prepare_or_depart` | Consult contacts or begin the operation | Mission accepted | Operation departure | Optional contacts never block |
| `l0.recover_medkits` | Enter the logistics site and recover the supplies | Operation departure | Explicit cache recovery | Run-level failures only |
| `l0.inspect_manifest` | Optional: inspect Hidzu Corporation shipping data | Cache area discovered | Recognized or intentionally left/missed | Never blocks primary objective |
| `l0.escape_network` | Leave the site and resolve surveillance | Medkits secured | Network Clear permits Lira return | Capture, breakdown, or deadline failure |
| `l0.return_medkits` | Return the supplies to Lira | Escape begins | Explicit handoff dialogue | Deadline remains active |
| `l0.validate_transit` | Validate outbound passage at the safehouse | Credential issued | Explicit terminal validation | Midnight failure until completion |
| `l0.debrief` | Review consequences and research outcomes | Transit valid | Debrief acknowledged | Cannot fail after valid transit |

Only the highest-priority incomplete primary objective appears in the persistent quest lane. Optional preparation and evidence appear as compact indicators and in the dossier.

## 3. Beat and pacing matrix

These beat ranges decompose the reversible `OPEN-TIME-001` trial baseline for observation and tuning; they are not Approved values and their maxima are not intended to stack into one run.

| Beat ID | Target duration | Clock | Required content | Decision or ability expression | Exit proof |
|---|---:|---|---|---|---|
| `beat.cover_select` | Under 1 min | Paused | Four authored covers; The Neighbor playable; three future covers visibly disabled | Cover identity and starting ability preview, with no numbers | Cover persisted |
| `beat.safehouse` | 1 min | 18:30, paused in overlays | George opening, safehouse affordances | Inspect or leave | Lira objective understood |
| `beat.lira` | 1–2 min | Paused | Bargain, medkits, timings, deadline, passage | Dialogue gate only where authored | Mission accepted |
| `beat.prepare` | 0–4 min | Mixed | Naila, Brant, wait/rest/research | Consult both/one/neither; choose timing or complete an eligible research option | `OperationAttemptBaseline` readback ready |
| `beat.approach` | 2–3 min | Running | Three-loop city reading, entrances, public/service contexts | Observation and route choice | Site boundary entered |
| `beat.infiltrate` | 3–4 min | Mixed | Camera, terminal, drone risk, hiding/blending | Declared ability, fact, costed path, or avoidance | Cache reached |
| `beat.cache` | 1–2 min | Paused in terminal | Medkits, optional manifest | Naila fact, `ability.spot_patterns`, or five-minute study | Mission object secured |
| `beat.escape` | 2–3 min | Running | Clear/Suspicious/Pursuit response | Declared ability/fact/cost path, hiding, or blending | Lira safely reachable |
| `beat.return` | 1–2 min | Paused | Handoff, factual reaction, credential | Consequence acknowledgment | Credential issued |
| `beat.validate` | 1 min | Mixed | Safehouse return and terminal | Time management | Transit valid |
| `beat.debrief` | 1–2 min | Paused | Dossier summary, research recap, Miami bridge | Outcome reading | Complete state |

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
| `fact.naila.cold_iron_pattern` | Naila | contact and node | Advances `ColdIronEvidenceState` from `unknown` to `naila_warning`; guarantees manifest recognition when inspected | Strong evidence interpretation |
| `fact.brant.delivery_window` | Brant | contact and node | Exact public blending window/objective precision | Notes social preparation |
| `fact.brant.delivery_protocol` | Brant | contact and node | Reveals expected blending behavior | Notes social preparation |
| `fact.world.camera.<id>` | Physical discovery or Naila | source, position, time | Device on minimap/observation | Camera awareness summary |
| `fact.world.hiding.<id>` | Physical discovery, contact, or authored observation | source, position, time | Hiding context on minimap/observation | No generic reward |
| `fact.cache.manifest_present` | Cache context | explicit inspection | Opens recognition result without grading the general fact | Evidence attempted |
| `fact.cache.cold_iron_recognized` | Naila warning, `ability.spot_patterns`, or the five-minute study path | exact gate-resolution cause | Advances `ColdIronEvidenceState` to `manifest_recognized` | Explains recognized but undocumented evidence |
| `fact.cache.cold_iron_copied` | Explicit five-world-minute copy action | terminal/interaction ID and timestamp | Advances `ColdIronEvidenceState` to `manifest_copied` | Changes Lira/Miami handoff |
| `fact.transit.credential_issued` | Lira return | Lira return node | Enables outbound terminal | Confirms bargain honored |
| `fact.transit.validated` | Outbound terminal after medkit return | terminal ID and time | Completes second deadline requirement | Complete outcome |

Facts never increment a generic score and remain binary acquired/not-acquired entries. Duplicate acquisition may update provenance but cannot duplicate effects or rewards. `ColdIronEvidenceState` is a separate monotonic four-state chain—`unknown → naila_warning → manifest_recognized → manifest_copied`—not a universal rumor/confirmed/leverage layer.

## 5. Deterministic gate catalog

The exact ability catalog, `fragile`/`hardened` tags, lock tiers, and per-gate key mapping are governed by `OPEN-ABL-001`; the ability IDs below are its recorded reversible recommendation, not approved tuning. Implementers may use only these recorded recommendations as reversible provisional data; they may not choose among alternatives or infer a key from prose. Every authored gate keeps at least two real solutions among its ability, fact, and costed paths (`GDR-RPG-009`); for interception nodes the second solution may be a sibling gate family offered by the same node.

Provisional ability set (social-forward cover starts with the first three): `ability.read_people` (`fragile: uneasy`), `ability.negotiate` (`fragile: uneasy`), `ability.blend_in` (`fragile: uneasy`), `ability.steady_voice` (`fragile: shaken`), `ability.spot_patterns` (`fragile: shaken`), `ability.terminal_craft` (`hardened`), `ability.trace_discipline` (`hardened`), `ability.slip_away` (`hardened`), `ability.quiet_feet` (`hardened`).

| Gate ID | Context | Ability path | Fact path | Costed path | Success | Fail-forward |
|---|---|---|---|---|---|---|
| `gate.lira_read_stakes` | Lira briefing | `ability.read_people` | None | Listen longer: +5 world minutes | Reveals Lira's immediate personal risk | Mission remains available without private inference |
| `gate.naila_opsec` | Naila preparation | `ability.trace_discipline` | None | Press her: small declared Paranoia cost | Naila shares trace-risk detail | Core topology fact still available; trace detail withheld |
| `gate.brant_credibility` | Brant preparation | `ability.negotiate` | None | Buy time with him: +10 world minutes | Exact behavior phrase and window | Broader timing fact only |
| `gate.public_blend` | Dusk entrance | `ability.blend_in` | `fact.brant.delivery_protocol` | Wait for a busier window: +10 world minutes | Enter blending context cleanly | Suspicion increases; route remains recoverable |
| `gate.camera_loop` | Connected terminal | `ability.terminal_craft` | None | On-foot avoidance remains the declared alternative route | Camera loop begins | Terminal explains the missing ability; avoidance remains |
| `gate.camera_trace` | Successful loop | `ability.trace_discipline` | `fact.naila.camera_topology` | Accept declared trace risk | No trace | Loop succeeds but traced; network becomes Suspicious |
| `gate.manifest_recognition` | Optional manifest | `ability.spot_patterns` | `naila_warning` guarantees | Study it: +5 world minutes | `manifest_recognized`; explicit copy becomes available | Manifest presence recorded; significance missed; medkits and escape remain available |
| `gate.intercept_social` | Authored interception | `ability.negotiate` | `fact.brant.delivery_protocol` in the named public-route interception only | Sibling family per node | Escape with time/Paranoia cost | Option fails into capture or alternate choice per node |
| `gate.intercept_composure` | Authored interception | `ability.steady_voice` | None | Sibling family per node | Maintain cover story or controlled withdrawal | Paranoia cost or capture per node |
| `gate.intercept_evasion` | Authored interception | `ability.slip_away` | The node's named nearby `fact.world.hiding.<id>` | Sibling family per node | Break contact with time cost | Capture on final failed option |
| `gate.pursuit_hide` | Pursuit recovery | `ability.quiet_feet` | Authored hiding context is prerequisite, not a key | None | Network falls to Suspicious | Needle verifies the context; Pursuit continues |

Before selection, every displayed gate shows met or not met with its exact reason — the missing ability, the locking tier, the missing fact, or the declared cost. Result presentation reuses the identical verdict and inputs. A locked `fragile` ability names its tier; `hardened` abilities never lock. Every nonfatal catalog failure must commit its declared worse-but-real effect; only the final failed capture-escape option may terminate the attempt.

## 6. Surveillance transition matrix

Exact exposure rates and durations remain acceptance decisions under `OPEN-SUR-001` through `OPEN-SUR-004`; only their recorded recommendations may be used as reversible provisional data.

| From | Trigger | To | Stored evidence | Player feedback | Recovery |
|---|---|---|---|---|---|
| Clear | A camera or Needle has valid visibility **and** observes restricted-area breach, protected interaction, medkit removal, failed verification, or detected camera-feed change | Suspicious | raw observation plus typed rule-break source, last-known position, time | Amber network change, attributable source direction, Paranoia cause | Break observation and use credible context |
| Suspicious | Concern decays after unobserved credible recovery | Clear | cleared source plus retained attempt history | Calm confirmation; first qualifying difficult escape may grant −5 Paranoia once | Recognition resets; ordinary public visibility is harmless again |
| Suspicious | Continued valid visibility paired with active rule-break evidence, failed verification, or Needle verification | Pursuit | confirmed typed source, last-known position, time/confidence | Crimson Pursuit, Needle/security warning | Break sight, change direction, hide/blend |
| Pursuit | Sight broken but search unresolved | Pursuit | updated last-known evidence only when observed | Search focuses old position | Keep moving/prepare context |
| Pursuit | Successful authored hiding/blending recovery | Suspicious | cleared true position; retained last-known history | Search continues at prior location | Remain credible until concern clears |
| Any | A valid observer sees a detected camera-feed change after the one-use loop | Suspicious minimum | raw observation, camera-group `traced` history, and typed rule break | Successful loop plus explicit trace warning | Normal Suspicious recovery; trace history persists until Restart Attempt |

Ordinary public camera visibility with no rule break leaves `Clear` unchanged and causes no Paranoia. Normal solid geometry and occlusion create blind spots; no special off-grid zones exist. No transition may originate from hidden coordinates, pass through solid geometry, or enter capture except through the final failed capture-escape after valid evidence-driven escalation.

## 7. Hiding and blending context schema

Every context has:

- stable ID and world anchor;
- type: `hiding` or `blending`;
- discovery source;
- occupancy bounds;
- line-of-sight entry rule;
- valid network states;
- required behavior/fact/gate;
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
| `blend.public_queue` | blending | Dusk/public | Transit/bus shelter has a visible queue start and exit, a bench with an exact authored two- or three-seat capacity, and a separate standing envelope; occupancy never exceeds visible capacity, the context is populated at 18:45, winds down after 21:30, and is inactive at curfew |

Final count and placement remain acceptance decisions under `OPEN-LAYOUT-003` and `OPEN-CIV-001`; their recorded recommendations may be tested in reversible layout/content data.

GET-205 v5 does not populate either blending context. Under `GDR-CIV-003`, every ambient civilian is removed from the T5 candidate and both `blend.delivery_activity` and `blend.public_queue` must resolve as unavailable with the explicit absent-population reason. The context IDs, geometry/capacity contract, and eventual time-state behavior remain canonical for GET-208; an empty context cannot grant blending eligibility. Under `GDR-SUR-013`, T5 retains only the public restricted-area guard and Needle, removes the static service-entrance guard, and adds no trespass/detection behavior.

## 8. Terminal contract

| Terminal ID | Location | Single function | Prerequisite | Success | Failure/unavailable feedback |
|---|---|---|---|---|---|
| `terminal.camera_loop` | Logistics network access point | Temporarily loop the single Level 0 camera set once per attempt | Range, Systems action, connected topology, camera-group history `unused` | History becomes `active`, then persists as `clean` or `traced` after expiry | Names missing range/capability/network state or already-spent attempt use |
| `terminal.cache_locker` | Medkit cache | Open/release mission object | Range and authored access condition | Explicit medkit recovery | Names blocker; never controls cameras or transit |
| `terminal.outbound_transit` | Safehouse | Validate issued credential | Credential, before midnight, range | Transit valid; deadline disabled | Names missing credential, expiry, or already-valid state |

Terminal UI pauses simulation while open. Each terminal states its function before confirmation and cannot operate unrelated systems.

## 9. Dialogue node map

Exact prose is authored under T10; infrastructure and state effects are owned by T9.

| Node family | Required content | State effects | Required variants |
|---|---|---|---|
| `lira.intro` | Recognition, immediate exposure, meeting purpose | none | First meeting / repeat |
| `lira.briefing` | Medkits, Hidzu Corporation site, dusk/curfew, deadline, passage | mission accepted; core facts | Cover- and fact-sensitive optional lines |
| `lira.return` | Explicit handoff and outcome reading | medkits returned; credential issued | Contacts, route, camera, drone, pursuit, Paranoia, evidence |
| `naila.preparation` | Camera topology, terminal, shipping pattern | Naila facts | Gate outcomes where authored; repeat summary |
| `brant.preparation` | Delivery window, protocol, public behavior | Brant facts | Gate outcomes where authored; repeat summary |
| `interception.<context>` | Short grounded confrontation | cost, escape, or capture | Only supported gate options |
| `george.context.<state>` | Authored question and bounded answer | no world mutation | Unknown/insufficient-evidence response |
| `debrief.level0` | Factual run summary and Miami bridge | Research recap; completion | Evidence found/missed and major outcome combinations |

English and Ukrainian use identical node IDs, gate requirements, fact effects, and state transitions.

## 10. Outcome ledger

`Level0OutcomeLedger` records only authored facts needed by Lira, George, dossier, debrief, Restart Attempt diagnostics, and Miami continuation:

| Field | Values |
|---|---|
| `acceptedAt` | world timestamp |
| `departedAt` | world timestamp |
| `completedAt` | world timestamp or null |
| `primaryTiming` | `dusk_public`, `curfew_service`, `mixed` |
| `contactsConsulted` | set of `lira`, `naila`, `brant` |
| `factsAcquired` | stable fact-key set whose entries reference acquisition IDs in `FactLedger`; provenance remains canonical in the ledger rather than being copied into strings |
| `cameraGroupHistory` | `unused`, `active`, `clean`, `traced` |
| `networkPeak` | `clear`, `suspicious`, `pursuit` |
| `needleVerified` | boolean |
| `hidingContextsUsed` | stable ID set |
| `blendingContextsUsed` | stable ID set |
| `interceptionOutcome` | stable outcome ID or null |
| `paranoiaTierPeak` | tier name |
| `researchCompleted` | ability ID list |
| `paranoiaPeak` | integer 0–100 |
| `medkitsRecovered` | boolean |
| `medkitsReturned` | boolean |
| `coldIronEvidenceState` | `unknown`, `naila_warning`, `manifest_recognized`, `manifest_copied` |
| `manifestRecognizedBy` | `naila_warning`, `spot_patterns`, `studied`, `missed`, `not_inspected` |
| `manifestCopyCompletedAt` | world timestamp or null |
| `transitValidated` | boolean |
| `failureCause` | stable failure ID or null |

The ledger does not contain reputation, karma, trust, violence, kills, loot value, package, combat, or procedural storylet fields.

## 11. Failure and recovery matrix

| Failure ID | Trigger | Message must name | Restart Attempt restoration | Prohibited behavior |
|---|---|---|---|---|
| `failure.breakdown` | Paranoia reaches 100 | Staged surrender/freeze/bolt per context, then a truthful contributing source | `OperationAttemptBaseline` | Hallucination framing or surveillance dossier |
| `failure.capture` | Final authored capture-escape option fails | Short Hidzu Corporation incident report/map using only real sightings, detected tampering, Needle verification, and capture evidence | `OperationAttemptBaseline` | Complete reconstructed path, joined unseen gaps, unknown content, tactical battle fallback |
| `failure.deadline` | 00:00 while either medkit return or transit validation is incomplete | Exact unfinished requirements | `OperationAttemptBaseline` | Pretended capture or failure after transit is valid |
| `failure.save_incompatible` | Retired schema detected | Incompatibility and New Game requirement | No partial Restart Attempt | Silent migration or corrupted defaults |

## 12. Safehouse and Operation Attempt Baseline matrix

### Autosave

Stores the current new-schema run at authored safe points. It is not the same object as Restart Attempt.

### `OperationAttemptBaseline`

Created exactly once per attempt after George reads back the real departure time, contacts, the Paranoia tier, held abilities, and restoration meaning and the player confirms departure. It stores:

- schema version;
- cover identity and its authored appearance;
- held abilities and research state;
- Paranoia and tier-announcement history;
- world time;
- mission and objective states;
- contacts visited and facts acquired before departure;
- known locations/devices/contexts;
- safehouse actions already taken;
- departure anchor and deterministic runtime generation;
- content version identifiers required to reject incompatible restoration.

It excludes all post-departure movement, facts, device state, medkit/evidence state, pursuit state, Paranoia changes, time, and outcomes.

The player action is **Restart Attempt**, the code action is `restartAttempt`, and the confirmation pause owner is `restart_attempt_confirmation`. The Level 0 schema is bumped for this contract; stale development saves using retired `retry*` fields are rejected explicitly rather than guessed into the new baseline.

## 13. World semantic contract

The approved mission skeleton first defines required places, route purposes, stable semantic IDs, exactly four dense mission blocks, three functional identities, and three interlocking loops. During GET-204, one named-source Neo Tokyo 2 Blender master exports candidate semantic metadata after its close/overview source gate; after live requester acceptance, that reconciled geometry becomes the accepted `Level0LayoutContract` for:

- district boundary and three traversal loops with stable localized names: `loop.public-contact` / **Transit Road**, `loop.logistics-service` / **Market Ring**, and `loop.outer-escape` / **Outer Space**;
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
- one-use grounding anchors: vending-machine coffee on Transit Road and shrine near the Market Ring/Outer Space junction;
- threshold ambience anchors: Transit Road restaurant, Market Ring workshop, and safehouse-side apartment;
- `ActorLightRegion` metadata sampled at actor foot anchors for presentation-only semantic amber/cyan tint;
- runtime/Blender semantic masks and projection metadata.

The previous sparse/fenced four-block compound, exact `54×38`, exact `84×60` nine-block geometry, `96×72` experiment, and oversized full-district expansion are superseded and are not preservation constraints. GET-204's accepted recipe remains immutable and recoverable. `GDR-ART-017` authorizes GET-205 v5 to replace its massing through a new recipe/runtime identity while preserving an executable invariant dataset: the two roads, three alleys, crossing, safehouse threshold/court, traversal loops, and every required anchor clearance disc. Formerly walkable dead gaps inside blocks may become building mass only when the route/anchor validator keeps the recovered probe table's 14 Class A geometry/bounds outcomes unchanged and records fresh v5 outcomes for all 10 Class B actor/interstitial/guard-dependent points. Exact accepted bounds, widths, anchors, and counts remain governed by `OPEN-LAYOUT-001` through `OPEN-LAYOUT-006`; the exact pre-operation planning/departure topology is separately governed by `OPEN-LAYOUT-005`.

## 14. Human-play acceptance matrix

| Case ID | Start/build | Required actions | Expected proof |
|---|---|---|---|
| `AC-L0-001` | New Game | Select the playable cover; enter safehouse; meet Lira | First decision <3 min; cover and mission state correct |
| `AC-L0-002` | Social-forward cover | Consult Brant; use dusk public route | Fact changes objective precision/blending; completion succeeds |
| `AC-L0-003` | Research-expanded cover | Consult Naila; research the technical ability; wait for curfew; loop camera | Connected terminal only; clean trace outcome possible |
| `AC-L0-004` | The playable cover | Skip both contacts; complete either route | Mission remains possible with less clarity and fewer open gate paths |
| `AC-L0-005` | Naila fact | Inspect manifest | Recognition guaranteed and attributed to fact |
| `AC-L0-006` | Perception ability held | Skip Naila; inspect manifest | The visible recognition gate passes through the ability path |
| `AC-L0-007` | No perception ability or fact | Inspect or skip manifest | Evidence may be missed; medkit mission still completes |
| `AC-L0-008` | Any | Trigger Suspicious; recover through context | Last-known position and Paranoia cause visible; returns Clear |
| `AC-L0-009` | Any | Trigger Pursuit; break sight/change direction/hide | Network searches old position and returns through Suspicious |
| `AC-L0-010` | Any | Allow drone verification | Strong warning; Pursuit transition is understandable |
| `AC-L0-011` | Supported option | Resolve authored interception successfully | Visible requirement/cost; no combat mode |
| `AC-L0-012` | Unsupported/failed options | Fail interception | Exact capture failure; deterministic Restart Attempt |
| `AC-L0-014` | High-stress attempt | Reach Paranoia 100 | Staged surrender into `failure.breakdown` with a truthful contributing source; no dishonest perception; Restart Attempt restores the departure state |
| `AC-L0-015` | Late attempt | Reach midnight while medkit return or validation remains incomplete | Deadline failure; Restart Attempt restores departure time |
| `AC-L0-016` | Completed attempt | Return medkits; validate transit; debrief | Actual facts/outcomes shown; deadline disabled; research recap shown |
| `AC-L0-017` | English then Ukrainian | Repeat equivalent path | Identical state changes and gates |
| `AC-L0-018` | All target viewports | Exercise opening, dialogue, HUD, observation, Pursuit, Character, dossier, failure, debrief | No overflow/corruption; dock 16–18%; world and actors readable |
| `AC-L0-019` | Active surveillance near safehouse | Reach/cross the safehouse boundary while observed, Suspicious, and in Pursuit; attempt every safehouse action | Entry never clears the network; availability, search behavior, and recovery match the approved or explicitly provisional `OPEN-SAFE-001` rule with explicit reasons and no magical escape. Provisional evidence informs review but cannot close final acceptance. |
| `AC-L0-020` | Clear/public | Remain visibly in ordinary public camera coverage without a rule break; leave and re-enter after recovery to Clear | No concern or Paranoia from visibility alone; recognition reset makes later ordinary visibility harmless |
| `AC-L0-021` | Clear | Trigger each declared rule break while visibly observed, one at a time | Each transition is attributable to restricted breach, protected interaction, medkit removal, failed verification, or detected feed change; occluded attempts do not count |
| `AC-L0-022` | Camera set unused | Loop once; allow expiry; repeat with clean and traced outcomes; Restart Attempt | State is `unused → active → clean|traced`, cannot be reused in-attempt, and resets only with Restart Attempt |
| `AC-L0-023` | Needle patrol | Hear approach; receive verification warning; observe civilian reaction | Named hum/warnings are distinct; civilians only mirror visible events and never report hidden state |
| `AC-L0-024` | Fresh and research-expanded runs | Preview and resolve every catalog gate through each of its paths, including each nonfatal failure | Preview/result verdicts are identical; every nonterminal failure commits its declared worse path; only final capture escape can end the attempt |
| `AC-L0-025` | Cold Iron paths | Skip/consult Naila; miss/recognize manifest; copy recognized manifest | All four states are reachable as authored, copying costs five world minutes and no second check, general facts remain binary |
| `AC-L0-026` | Rising Paranoia | Use both grounding actions, qualifying escape, and enter Uneasy, Shaken, and Breaking | Each grounding is once/attempt for +10 min/−10; escape relief is once for −5; George speaks once per tier entry; each tier's declared locks apply and lift exactly |
| `AC-L0-027` | Running clock with pause/save restoration | Cross 21:00, 21:30, 22:00, and 23:30; reload around boundaries | Every street event fires exactly once and reflects the correct crowd/light/audio state |
| `AC-L0-028` | Capture/deadline/breakdown failures | Produce all three cause families | Capture report contains only ledger evidence with disconnected gaps; other failures remain cause-specific and never imply capture |
| `AC-L0-029` | All target viewports/languages | Traverse all three named routes, three sound thresholds, and authored actor-light regions | English/Ukrainian route names are stable; ambience is spatial; restrained tint eases without changing movement or detection |
| `AC-L0-030` | Breaking-tier attempt | Hold Breaking (90–99); attempt gates through fragile and hardened ability paths; recover below the boundary | Every declared fragile ability shows locked with its exact tier reason; hardened abilities pass; recovery relights exactly the declared set |
| `AC-L0-031` | Representative tension run | At ~21:26, watch the delivery group prepare to leave; enter the verification lane past its posted exit rule; hold as Needle's hum crosses the queue; pass deterministically on a valid cover; confirm a committed cache extraction and watch the mechanism cycle while a camera observes the protected interaction; escape; return via Transit Road | The window visibly degrades into an alternative rather than vanishing; lane exit rules are previewed and exact; the extraction contract snapshots at commitment; `Suspicious` names both sources; one camera holds last-known; a sector advisory appears after its authored latency; the returning street reads differently because of what the network now knows |

All cases use visible controls. Debug bridges may prepare diagnostics but cannot satisfy a player-flow step. `AC-L0-013` is retired together with the Health system; its ID is never reused.
