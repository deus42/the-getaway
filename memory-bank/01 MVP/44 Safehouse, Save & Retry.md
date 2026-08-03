---
status: MVP
type: system-specification
tags: [safehouse, save, retry, persistence]
canonical: true
---

# Safehouse, Save & Retry

## 1. Player fantasy and purpose

The safehouse is the protagonist's small pocket of control: a readable outdoor planning boundary where they can understand the operation, wait deliberately, recover at a cost, review what they know, and validate escape. Autosave preserves the current compatible run; Retry preserves the fairness of one operation attempt by restoring exactly what was true at departure. This implements `GDR-TIME-003`, `GDR-HLT-002`, `GDR-MIS-009`, and the persistence contract in [[13 Level 0 Content and State Matrix]].

## 2. Player-visible verbs

- Inspect available and blocked safehouse actions.
- Wait in confirmed 30-minute steps.
- Rest for recovery.
- Open Character, the dossier, and George consultation.
- Use the outbound transit terminal when a credential is available.
- Explicitly depart for the operation and confirm creation of the attempt baseline.
- Retry a failed operation from the departure snapshot.
- Start New Game when no compatible restoration exists or when the player wants a fresh run.

## 3. Starting state and prerequisites

- After character creation and Level 0 initialization, the protagonist begins inside the authored safehouse boundary at 18:30 with a new compatible autosave.
- Rest, safe waiting, Character, dossier, George consultation, and the outbound terminal are visible safehouse actions.
- Transit validation begins unavailable because `fact.transit.credential_issued` has not been acquired; the action explains that blocker.
- No operation-departure Retry snapshot exists until the player has accepted Lira's operation and explicitly departs the safehouse for that attempt.
- The exact outdoor boundary and exterior presentation remain unresolved in `OPEN-LAYOUT-004`; Level 0 does not require a full interior.
- Safehouse entry and action availability while directly observed, Suspicious, or in Pursuit is unresolved in `OPEN-SAFE-001`. Until accepted, implementation may not assume that crossing the boundary clears surveillance or makes recovery/planning actions available.

## 4. Complete happy-path behavior

1. The player enters or begins within the safehouse boundary and sees its planning, waiting, recovery, Character, dossier, George, and outbound-terminal affordances.
2. Before operation departure, the player may inspect known information, allocate eligible progression, wait in confirmed 30-minute steps, or Rest.
3. The player accepts Lira's mission, optionally prepares, then explicitly crosses the departure boundary or uses the authored departure action and confirms leaving.
4. The game creates the attempt's operation-departure snapshot exactly once from the current pre-departure state and enters `L0_OPERATION_DEPARTED`.
5. Authored autosave points continue to preserve the current compatible run, but never replace or mutate the Retry snapshot with post-departure state.
6. On failure, Retry restores the departure snapshot deterministically. On successful medkit return, the safehouse outbound terminal becomes available through the issued credential.
7. After the medkits have been returned and Lira has issued the credential, explicit terminal validation before midnight completes the second deadline requirement and opens debrief, recovery, and eligible level-up.

## 5. State model and transitions

- Character confirmation plus valid Level 0 initialization creates a new-schema autosave and enters `L0_SAFEHOUSE_INTRO`.
- Safehouse actions change only their declared state: Wait changes time; Rest changes time, Health, and Paranoia; Character allocates only eligible points; dossier and George are informational; outbound transit validates only an issued credential.
- Explicit confirmed departure from `L0_PREPARATION` creates one attempt snapshot and enters `L0_OPERATION_DEPARTED`.
- Post-departure play may update the live autosave at authored safe points, but the attempt snapshot remains the immutable restoration baseline.
- A normal run failure enters `L0_FAILED`; Retry restores the compatible departure snapshot and resumes at `L0_OPERATION_DEPARTED`.
- New Game clears all Level 0 run, autosave, and Retry state and returns to `L0_CHARACTER_CREATION`.
- A retired or incompatible schema enters `failure.save_incompatible`, explains the incompatibility, and offers New Game only.

## 6. Rules and tuning values

- Safe waiting advances world time only in player-confirmed `30`-minute steps.
- Rest advances `30` world minutes, restores Health to `100`, and removes `40` Paranoia.
- The world starts at `18:30`, curfew begins at `22:00`, and the hard deadline is `00:00` while either medkit return or transit validation remains incomplete.
- The safehouse is the autosave point, planning hub, recovery location, level-up location, George consultation point, and outbound-terminal location.
- Autosave and Retry are different objects with different purposes. Autosave stores the current compatible run at authored safe points; Retry restores the operation-departure baseline.
- The operation-departure snapshot is created exactly once per attempt at explicit confirmed departure, never after later movement, facts, choices, device changes, injury, or time passage.
- Dialogue, Character, dossier, George consultation, terminal UI, debrief, failure, and completion pause time and autonomous simulation while open.
- Exact safehouse geometry/presentation and route time reserves may use only the replaceable recommendations from `OPEN-LAYOUT-004` and `OPEN-TIME-001`; arbitrary waiting assumptions are forbidden.
- The exact physical preparation loop and return/departure action may use only the replaceable `OPEN-LAYOUT-005` recommendation; the snapshot must remain after optional preparation without silently adding a long mandatory backtrack.
- The network-state gate for entry, Wait, Rest, save, level-up, George planning, and terminals is blocked by `OPEN-SAFE-001`. Its recommended baseline is review input, not a current constant.

## 7. Inputs from other systems

- Character creation and [[92 Character & Progression]] supply callsign, appearance, attributes, skills, level, XP, and unspent points.
- [[43 Health, Failure & Recovery]] and [[60 Paranoia]] supply current resources and Rest effects.
- [[80 Day-Night Cycle]] supplies current world time, curfew, deadline, and shared pause ownership.
- [[91 Quests & Objectives]] supplies mission/objective state, operation acceptance, medkit return, credential issuance, transit validity, and completion state.
- [[46 Facts, Dossier, Minimap & Terminals]] supplies facts, known world state, dossier data, and the outbound-terminal contract.
- `Level0LayoutContract` supplies the safehouse boundary, departure anchor/action, and terminal anchor.
- Content and schema version identifiers determine whether restoration is compatible.

## 8. Effects on other systems

- Wait and Rest alter the world clock and may change whether the dusk/public or curfew/service timing is available.
- Rest restores Health, reduces Paranoia, and may change deterministic check penalties.
- Explicit departure activates the running operation phase and freezes the attempt baseline used by all failure paths.
- Retry restores mission/objective state, contacts, facts, known locations/devices/contexts, resources, time, runtime generation, and departure position to the recorded baseline.
- Transit validation records `fact.transit.validated`, sets `transitValidated`, and opens debrief/completion progression because the credential can only be issued after explicit medkit return.
- Safehouse actions themselves grant no generic XP, facts, trust, inventory, or mission completion.

## 9. UI, world, audio, and George feedback

- The safehouse boundary and every action must be readable in the outdoor world at normal zoom without implying an unimplemented interior.
- Each action states its function and current availability before confirmation. Wait and Rest preview their exact time/resource changes.
- Departure confirmation makes clear that the operation attempt is beginning and that Retry returns to this point.
- Save feedback distinguishes current autosave from the Retry baseline without exposing implementation-only data.
- Failure shows the compatible Retry action or, for an incompatible schema, the exact New Game requirement.
- Safehouse, Rest, waiting, save, departure, terminal, failure, and Retry use authored cues from [[49 Audio]] with equivalent visual/text feedback.
- George may summarize verified current time, known mission state, available safehouse actions, and Retry meaning; he cannot save, wait, Rest, validate transit, or retry for the player.

## 10. Failure, recovery, and retry behavior

- Health `0`, Paranoia `100`, capture, or midnight while either medkit return or transit validation remains incomplete enters `L0_FAILED` with the exact cause defined in [[43 Health, Failure & Recovery]].
- Retry restores the recorded departure snapshot, including pre-departure resources, time, facts, objectives, known world state, safehouse actions, anchor, runtime generation, and content versions.
- Retry explicitly excludes post-departure movement, facts, device state, medkit/evidence state, surveillance state, damage, Paranoia changes, time, and outcomes.
- An incompatible save never attempts Retry or partial migration; it explains the schema conflict and offers New Game.
- Once medkits are returned and transit is valid, deadline failure is disabled. `Continue Exploring` may return to the district without creating a second Level 0 operation.
- Safehouse arrival during active surveillance must follow the approved or explicitly provisional `OPEN-SAFE-001` rule; it cannot silently clear last-known state, suppress a search, autosave over unsafe state, or grant recovery.

## 11. Content-authoring requirements

- Author a clear outdoor safehouse boundary with anchors for Rest, Wait, Character, dossier, George consultation, level-up, departure, and `terminal.outbound_transit`; final geometry waits on `OPEN-LAYOUT-004`.
- Give every safehouse action a stable identity, prerequisite, preview, confirmation where consequential, success effect, unavailable reason, world/HUD/audio feedback, and localization node.
- Version autosave and Retry schemas and include enough content-version identity to reject an incompatible restoration safely.
- The operation-departure snapshot must store schema version; callsign and appearance; attributes, skills, level, XP, and unspent points; Health and Paranoia; world time; mission/objective states; pre-departure contacts and facts; known locations/devices/contexts; used safehouse actions; departure anchor; deterministic runtime generation; and required content versions.
- Author exact failure and restoration copy in English and Ukrainian with identical state effects.
- The midnight-cutoff explanation may use only the explicit reversible `OPEN-NAR-007` recommendation until accepted; the approved 00:00 mechanic remains authoritative.

## 12. Edge cases and prohibited shortcuts

- No Retry snapshot before explicit operation departure and no overwrite from any post-departure autosave or checkpoint.
- No snapshot after medkit recovery, evidence inspection, pursuit, damage, time expenditure, or other later choice.
- No silent migration, partial restoration, stale objective/device state, or default-filled incompatible field.
- No real-time idling requirement for safe waiting; each 30-minute advance requires confirmation.
- No automatic transit validation, proximity departure, proximity Rest, or invisible mission completion.
- No full interior, fake door, or placeholder Miami transition attached to the Level 0 safehouse.
- Continue Exploring cannot reactivate the completed deadline or create additional Level 0 missions.
- No magical safehouse escape: boundary entry cannot be used as an undocumented `Suspicious`/`Pursuit` reset or as access to blocked safehouse actions.

## 13. Removed behavior

- Accelerated waiting as the only way to reach curfew; confirmed 30-minute safe waiting is current.
- Partial or silent migration of retired rewrite saves.
- Retry from a checkpoint captured after later choices or from a stale live autosave.
- Automatic operation departure, automatic medkit handoff, automatic transit validation, and placeholder `Next Level` loading.
- Survival-rest dependencies such as fatigue, hunger, thirst, consumables, or a full interior.

## 14. Post-MVP extensions

- `GDR-POST-004` postpones complex interiors. Any future safehouse interior must preserve the same explicit action, pause, save, and restoration contracts and cannot be inferred into Level 0 now.
- `GDR-POST-007` postpones full Miami production; the compatible continuation data may be stored, but Level 0 cannot load a placeholder destination.
- No cloud sync, multi-slot save browser, manual quicksave, or alternate checkpoint system is currently approved.

## 15. Human-play acceptance examples

- From a new character, verify the run starts at 18:30 inside the safehouse with one compatible autosave and no Retry snapshot.
- Wait one confirmed step and Rest once; verify `+30` minutes per action, Health `100` after Rest, and Paranoia `-40` without real-time idling.
- Depart after optional preparation, change facts/time/resources during the operation, fail, Retry, and confirm only the pre-departure values return.
- `AC-L0-012` through `AC-L0-015`: verify capture, Health, Paranoia, and deadline failures all restore the same deterministic attempt boundary.
- `AC-L0-016`: return medkits, receive the credential, explicitly validate transit, and verify the deadline is disabled before debrief.
- `AC-L0-019`: approach/cross the safehouse boundary while observed, Suspicious, and in Pursuit; verify the accepted action gates, continued network state, explicit unavailable reasons, and recovery route without a free reset.
- Load a retired schema and verify an exact incompatibility explanation plus New Game, with no partial world entry.

## 16. Owning Linear ticket

`T7` (`GET-207`) owns save schema and Retry data. `T3` (`GET-203`) owns safehouse boundary, time, runtime, departure, and persistence primitives. `T9` (`GET-209`) owns dossier/George/terminal/HUD presentation; `T10` (`GET-210`) owns authored safehouse content, localization, audio, and end-to-end acceptance.
