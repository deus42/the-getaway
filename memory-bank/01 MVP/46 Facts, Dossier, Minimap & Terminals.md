---
status: MVP
type: system-specification
tags: [facts, dossier, minimap, terminals]
canonical: true
---

# Facts, Dossier, Minimap & Terminals

## 1. Player fantasy and purpose

Knowledge is practical leverage with an exact source. The general fact ledger remains binary, while only Cold Iron has a separate four-state evidence chain. The dossier preserves that evidence, the minimap visualizes only known space, and each terminal performs one grounded function. This implements `GDR-FACT-001`, `GDR-FACT-002`, `GDR-UI-003`, `GDR-MIS-004` through `GDR-MIS-008`, and `GDR-SUR-005` through `GDR-SUR-009`.

## 2. Player-visible verbs

- Acquire a fact through authored dialogue, physical discovery, observation, or explicit inspection.
- Open the dossier and review facts with their provenance and designated effects.
- Open the knowledge minimap and inspect known locations, devices, contexts, and objective precision.
- Explicitly inspect the optional manifest, attempt or bypass recognition, and optionally spend five world minutes to copy recognized evidence.
- Operate `terminal.camera_loop`, `terminal.cache_locker`, and `terminal.outbound_transit` when their declared prerequisites are met.
- Read a terminal's single function, requirement, gate status, result, or exact unavailable reason before returning to the world.

## 3. Starting state and prerequisites

- At `L0_SAFEHOUSE_INTRO`, the safehouse and Lira meeting point are known.
- No device is known unless it is physically visible from the starting context. Opening the minimap, dossier, Observation, or George cannot reveal unknown content.
- The fact ledger is empty except for initialization knowledge explicitly represented by the safehouse/Lira starting state.
- `terminal.outbound_transit` is visible at the safehouse but unavailable until `fact.transit.credential_issued` exists and remains deadline-bound until successful validation.
- The camera-loop and cache-locker terminals require physical discovery, range, and their authored capability/access prerequisites.

## 4. Complete happy-path behavior

1. Lira's authored briefing records mission facts for the seized medkits, two route timings, midnight deadline, and passage bargain, each with source provenance.
2. Optional Naila and Brant conversations add only their designated camera, terminal, shipping-pattern, delivery-window, and public-behavior facts.
3. Physical discovery adds stable location, camera, hiding, or blending facts. The minimap and Observation update only from those known facts.
4. The player reaches a terminal, explicitly opens it, reads its single function and prerequisites, and confirms an available action while simulation is paused.
5. The camera terminal applies the designated technical ability and the supporting operational fact to the single Level 0 camera set once per attempt; the cache terminal explicitly releases the medkits as a mission object.
6. The player optionally inspects the manifest. `naila_warning` guarantees recognition; otherwise the visible authored recognition gate, passed by the designated perception ability or its declared costed path, resolves success or fail-forward.
7. Recognition advances `ColdIronEvidenceState` but does not copy the manifest. A separate explicit copy action costs five world minutes, adds no gate, and advances to `manifest_copied`. Missing or leaving evidence never blocks medkit recovery.
8. After explicit medkit return, Lira issues the transit credential. The player explicitly validates it at the safehouse terminal before midnight, disabling deadline failure and updating debrief/continuation state.

## 5. State model and transitions

- A fact key transitions from unknown to known only through its declared authored source. Acquisition stores stable key, source/provenance, and acquisition context.
- Duplicate acquisition may add or refine provenance but cannot reapply effects, rewards, gate outcomes, or objective transitions.
- A designated fact may reveal, clarify, unlock, or guarantee only its named outcome. It never increments a generic knowledge score.
- Known locations/devices/contexts derive the minimap and Observation state; New Game and Restart Attempt restore the appropriate ledger rather than leaving presentation-owned knowledge behind.
- `ColdIronEvidenceState` transitions monotonically `unknown → naila_warning → manifest_recognized → manifest_copied`. Naila can advance only the warning step; inspection plus the warning or the designated perception ability advances recognition; explicit copying advances the final step after five world minutes.
- A terminal is unavailable until its range and authored prerequisite are satisfied, available for its single function when satisfied, and complete/idempotent after its declared success. It cannot transition another terminal's state.
- `fact.transit.credential_issued` enables the outbound terminal only after medkit return; `fact.transit.validated` completes the second deadline requirement and enters debrief.

## 6. Rules and tuning values

- Facts use stable keys and acquisition provenance and have only designated authored effects.
- There is no generic intel, trust, reputation, evidence score, or fact currency.
- There is no universal rumor/confirmed/leverage grading. `ColdIronEvidenceState` is a dedicated mission chain and does not change `FactLedger` semantics.
- The minimap shows only discovered locations and cameras. It never issues movement, reveals the safest route, or exposes unknown surveillance.
- Terminal UI pauses time and autonomous simulation while open. Every terminal states its function before confirmation and names range, capability, network, credential, expiry, or already-complete blockers.
- `terminal.camera_loop` affects the one Level 0 camera set once per attempt and applies the designated technical ability plus the supporting operational fact. Its history is `unused | active | clean | traced`; exact active duration follows `OPEN-SUR-004`, while clean/traced persists until Restart Attempt.
- `terminal.cache_locker` only opens/releases the medkit mission object. `terminal.outbound_transit` only validates an issued, unexpired credential.
- Manifest recognition is guaranteed only by `naila_warning`; otherwise the visible deterministic recognition gate (`gate.manifest_recognition`) applies and fails forward. Copying requires explicit confirmation, costs exactly five world minutes, and has no second gate.
- Exact gate keys — the designated ability, designated fact, or declared costed path per gate — follow `GDR-RPG-009`; a fact affects a gate only by unlocking its designated path.
- Exact dossier and related overlay wireframes remain non-final under `OPEN-UI-003`; its recorded wireframe recommendation may drive a reversible implementation pass.

## 7. Inputs from other systems

- Authored dialogue supplies Lira, Naila, Brant, interception, George, and debrief fact sources.
- [[41 Movement, Interaction & Observation]] supplies physical discovery, range, explicit interaction, and the known-state inspection boundary.
- [[92 Character & Progression]] supplies the held abilities and Paranoia tier that gates consult.
- [[42 Surveillance, Security & Civilian Behavior]] supplies camera/network relationships, connected-loop effects, trace outcome, and context discovery.
- [[91 Quests & Objectives]] supplies the current objective, medkit-return state, credential issuance, deadline, debrief, and completion transitions.
- [[44 Safehouse, Save & Restart Attempt]] supplies persistence, restoration, safehouse terminal location, and compatibility rules.
- `Level0LayoutContract` supplies stable world anchors and ownership for known locations, contexts, objectives, and all three terminals.

## 8. Effects on other systems

- Facts may change exact objective precision, known map markers, supported dialogue/gate options, terminal understanding, blending clarity, manifest recognition, George answers, Lira response, debrief, and Miami continuation only as declared.
- Naila's facts reveal camera relationships, the connected terminal, and the Cold Iron pattern; Brant's facts reveal delivery timing, protocol, and public-route behavior.
- Camera discovery updates minimap/Observation without changing camera behavior. Terminal operation may change the connected camera state or mission object state through its one function.
- Manifest outcome sets `coldIronEvidenceState`, recognition provenance, and optional copy timestamp in `Level0OutcomeLedger` and changes factual debrief/continuation content without blocking completion.
- Transit validation records `transitValidated` and enables debrief/completion after the already-required medkit return.
- Facts grant no generic reward; progression remains safehouse research.

## 9. UI, world, audio, and George feedback

- Fact acquisition names the fact, its source, and its direct designated effect without presenting a generic score increase.
- The dossier groups current run facts and outcomes factually and preserves acquisition provenance.
- The minimap distinguishes known from unknown locations, devices, and contexts; discovered coverage is subtle in play and stronger in Observation.
- Every terminal has a readable world anchor and a focused UI that states one function, current prerequisites, visible met/not-met gate status where applicable, result, and unavailable reason.
- Manifest presentation explains the current chain state, whether Naila's warning or the designated perception ability caused recognition, and that copying costs five world minutes before confirmation.
- George may summarize verified ledger facts and compare only known risk. He must answer unknown state as unknown and cannot acquire, invent, or apply a fact.
- Fact, dossier, minimap, terminal, objective, and completion cues use [[49 Audio]] families with equivalent visual/text feedback.

## 10. Failure, recovery, and Restart Attempt behavior

- Missing a contact, fact, or manifest recognition never blocks medkit recovery or primary mission completion; it produces less clarity, fewer open gate paths, or a factual missed-evidence outcome.
- A terminal unavailable state names the blocker and leaves its state unchanged. It never performs a fallback action on another system.
- A traced camera loop succeeds at its declared function but persists the trace and moves the network to at least `Suspicious`; the one camera use remains spent until Restart Attempt.
- Missing or expired transit validation can contribute to `failure.deadline`; the failure surface names the credential/transit deadline.
- Restart Attempt restores only pre-departure facts, `ColdIronEvidenceState`, and known world state recorded in `OperationAttemptBaseline`; all post-departure facts, terminal states, camera history, medkits, manifest outcomes, and transit state are removed.

## 11. Content-authoring requirements

The Level 0 fact ledger must implement these current fact families and only their declared effects:

| Fact key | Required source | Designated direct effect |
|---|---|---|
| `fact.lira.medkits_seized` | Lira briefing | Activates mission |
| `fact.lira.public_entrance` | Lira | District-level public-route marker |
| `fact.lira.curfew_service_side` | Lira | District-level service-route marker |
| `fact.lira.midnight_deadline` | Lira | Deadline in quest lane |
| `fact.lira.passage_bargain` | Lira | Future credential objective |
| `fact.naila.camera_topology` | Naila | Known camera relationships; designated gate effect |
| `fact.naila.connected_terminal` | Naila | Exact camera-loop terminal marker |
| `fact.naila.cold_iron_pattern` | Naila | Advances `ColdIronEvidenceState` to `naila_warning`; guarantees later recognition |
| `fact.brant.delivery_window` | Brant | Exact public blending window/objective precision |
| `fact.brant.delivery_protocol` | Brant | Expected blending behavior; designated gate effect |
| `fact.world.camera.<id>` | Physical discovery or Naila | Known device on minimap/Observation |
| `fact.world.hiding.<id>` | Discovery, contact, or authored observation | Known context on minimap/Observation |
| `fact.cache.manifest_present` | Explicit cache inspection | Opens recognition result |
| `fact.cache.cold_iron_recognized` | Naila warning or designated perception ability | Advances to `manifest_recognized`; exposes explicit copy action |
| `fact.cache.cold_iron_copied` | Explicit five-world-minute copy action | Advances to `manifest_copied`; dossier, George, Lira, and continuation evidence |
| `fact.transit.credential_issued` | Lira return | Enables outbound terminal |
| `fact.transit.validated` | Outbound terminal after medkit return | Completes the second deadline requirement and enables debrief |

Each authored fact needs a stable key, source node/world anchor, provenance payload, acquisition rule, duplicate rule, designated effect, dossier/minimap/George/debrief text, Restart Attempt behavior, and equivalent English/Ukrainian semantics. Each terminal needs a stable ID, one function, world anchor, range/prerequisites, visible gate status where applicable, success state, idempotent repeat state, unavailable reasons, and world/UI/audio feedback.

Narrative prose must not resolve pending fiction by implication. Lira's identity, beneficiary, seizure, and deadline explanations remain in `OPEN-NAR-004` through `OPEN-NAR-007`; exact manifest contents remain in `OPEN-NAR-008`; Naila and Brant provenance remains in `OPEN-NAR-010` and `OPEN-NAR-011`; diegetic language remains in `OPEN-NAR-014`.

## 12. Edge cases and prohibited shortcuts

- No opening a knowledge surface to reveal an unknown camera, route, entrance, context, manifest significance, or objective location.
- No fact as a generic score, currency, buff, relationship meter, or permission to skip an unrelated gate.
- No universal rumor/confirmed/leverage status and no automatic copy on recognition.
- No duplicate acquisition reapplying an effect or reward.
- No minimap click issuing movement, route preview selecting a safe path, or full-map omniscience.
- No terminal operating an unrelated camera, door, cache, identity record, district network, or transit state.
- No automatic medkit pickup, manifest recognition, credential issuance, or transit validation through proximity.
- No procedural, LLM-invented, or presentation-derived fact key or effect.

## 13. Removed behavior

- `GDR-REM-009`: procedural dialogue/quests, storylets, runtime LLM facts, and witness/gossip simulation.
- `GDR-REM-010`: generic trust, karma, and faction-reputation meters.
- Deep inventory/evidence stacks, generic intel currency, automatic pickup, and proximity mission completion.
- Remote magic hacking, district-wide disable, EMP, automatic door control, and unrelated terminal functions.
- Full minimap route planning and unknown-device reveal.

## 14. Post-MVP extensions

- Future campaign facts may extend the same stable-key, provenance, designated-effect, persistence, and factual-debrief model, but no additional Level 0 fact category is implied.
- `GDR-POST-007` allows compatible continuation data toward Miami only after Level 1 exists.
- Deep inventory, broader reputation, procedural narrative, and unrestricted AI-generated knowledge are not approved extensions of this system.

## 15. Human-play acceptance examples

- `AC-L0-002`: acquire Brant's facts and verify only public-route precision/blending changes.
- `AC-L0-003`: acquire Naila's facts, find the connected terminal, and verify camera loop/trace behavior affects only the connected network group.
- `AC-L0-004`: skip both contacts and complete the mission with less map precision and fewer open gate paths, not a blocked route.
- `AC-L0-005` through `AC-L0-007` and `AC-L0-025`: prove all four `ColdIronEvidenceState` values, Naila/ability recognition provenance, explicit five-minute no-gate copying, and missed/uninspected outcomes while medkit completion remains possible.
- `AC-L0-016`: return medkits, receive the credential, validate transit explicitly, and see actual facts and outcomes in the dossier/debrief.
- Restart Attempt after acquiring post-departure facts and operating terminals; confirm only pre-departure knowledge and terminal state return.

## 16. Owning Linear ticket

`T9` (`GET-209`) owns facts, dossier, minimap, terminal UI/infrastructure, George integration, and localization infrastructure. `T9A` (`GET-213`) owns the Cold Iron chain, copy action, and legible gate/evidence presentation. `T7` (`GET-207`) owns deterministic gates and persisted ledger/schema data; `T8A` (`GET-212`) owns camera-group history; `T10` (`GET-210`) owns authored fact/dialogue/terminal content and end-to-end acceptance.
