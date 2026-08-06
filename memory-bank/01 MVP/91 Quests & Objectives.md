---
status: MVP
type: system-specification
tags: [objectives, facts, dossier, minimap, outcomes]
canonical: true
---

# Objectives, Facts, and Operation Dossier

## 1. Player fantasy and purpose

The operation layer lets the protagonist build a truthful picture of the mission instead of following omniscient markers. Objectives express what must be done; facts express what the protagonist actually knows; the dossier shows how those pieces connect and what consequences have already been established.

## 2. Player-visible verbs

The player can:

- read one current main beat in the persistent HUD;
- open the operation dossier;
- review completed beats, optional preparation contacts, evidence, people, locations, timeline, and consequences;
- inspect discovered locations and cameras on the knowledge minimap;
- acquire facts through dialogue, observation, explicit interaction, and deterministic recognition;
- explicitly recover medkits, inspect/recognize/copy the manifest, return to Lira, and validate transit;
- continue exploring or end the demo after completion.

## 3. Starting state and prerequisites

- A new run begins at mission state `L0_CHARACTER_CREATION`, then enters `L0_SAFEHOUSE_INTRO`.
- The first world objective is to leave the safehouse boundary and speak with Lira.
- The Fact Ledger contains only facts justified by the opening premise; it does not pre-populate optional route or surveillance knowledge.
- The minimap initially knows the protagonist, safehouse, the immediate Lira contact area, and only the level of objective precision justified by the briefing.
- Every objective, fact, location, person, evidence item, and consequence uses a stable authored key.

## 4. Complete happy-path behavior

1. Character creation transitions to the safehouse opening objective.
2. Speaking with Lira establishes the primary mission: recover confiscated medkits, return them to her, and validate outbound transit before midnight.
3. Naila and Brant appear as optional preparation contacts, not mandatory primary beats.
4. Facts from contacts refine route descriptions, terminal knowledge, and objective/minimap precision.
5. The player explicitly interacts with the medkit cache; proximity alone cannot complete it.
6. The optional manifest follows `ColdIronEvidenceState`: Naila provides the warning, the warning or Awareness can recognize it, and a separate explicit five-world-minute action copies it. Missing or leaving it never blocks medkits or completion.
7. If the network is Suspicious or in Pursuit, the player must resolve that state before the return/escape beat can complete.
8. The player explicitly returns the medkits to Lira, receives the transit credential, returns to the safehouse, and validates outbound passage before midnight.
9. Debrief reads the Fact Ledger and outcome ledger; the ending presents `Continue Exploring` and `End Demo`.

## 5. State model and transitions

The authoritative mission states are defined in [[13 Level 0 Content and State Matrix]]:

`L0_CHARACTER_CREATION → L0_SAFEHOUSE_INTRO → L0_LIRA_BRIEFING → L0_PREPARATION → L0_OPERATION_DEPARTED → L0_INFILTRATION → L0_MEDKITS_SECURED → L0_ESCAPE → L0_LIRA_RETURN → L0_TRANSIT_VALIDATION → L0_DEBRIEF → L0_COMPLETE`

Any authored run failure transitions to `L0_FAILED` with a stable `failure.*` cause. Save incompatibility uses `failure.save_incompatible` before mission hydration and offers New Game rather than partial migration.

Objective states are:

- `hidden`: not yet justified by protagonist knowledge;
- `available`: known but not the current required beat;
- `active`: the one current main beat or an explicitly tracked optional beat;
- `completed`: satisfied once through an authoritative explicit action or state transition;
- `failed`: impossible because of a declared mission failure;
- `superseded`: replaced by a later, more precise authored objective without being presented as failure.

Facts are append-only and binary within a run. Acquisition stores fact key, provenance, timestamp, source actor/object, and any designated effect. `ColdIronEvidenceState` is a separate monotonic chain, not universal fact grading. Restart Attempt restores `OperationAttemptBaseline` rather than attempting to reverse facts individually.

## 6. Rules and tuning values

- The persistent quest lane shows exactly one current main beat, deadline when relevant, optional-contact availability, and dossier access.
- Optional preparation may be tracked, but it cannot visually outrank the current main objective.
- Facts are binary authored knowledge, not a generic score. A fact’s allowed effects are declared per fact.
- Only Cold Iron uses `unknown → naila_warning → manifest_recognized → manifest_copied`; copying costs five world minutes and no extra check.
- Objective precision is knowledge-based: unknown district-level target, known area, known entrance, or exact anchor.
- The minimap never reveals undiscovered cameras, terminals, hiding positions, or exact objectives.
- The minimap never issues movement commands or draws an automatic route.
- Medkits and manifest require explicit interaction within authoritative range and visibility.
- Mission objects are objective state, not a player-managed inventory stack.
- Completed objectives cannot increment twice through proximity, repeated dialogue, save hydration, or overlapping event handlers.
- XP comes from declared milestones, not from each objective event or dialogue branch.

## 7. Inputs from other systems

- [[90 Dialogue]] adds contact facts and changes objectives through declared effects.
- [[41 Movement, Interaction & Observation]] validates explicit world interaction.
- [[42 Surveillance, Security & Civilian Behavior]] supplies network resolution requirements and discovered device state.
- [[44 Safehouse, Save & Restart Attempt]] owns transit validation, autosave, and snapshot restoration.
- [[92 Character & Progression]] resolves the manifest Awareness check and milestone XP.
- [[45 HUD & Information Architecture]] renders the current beat, minimap, and dossier access.
- [[13 Level 0 Content and State Matrix]] defines objective IDs, fact keys, mission transitions, and outcome fields.

## 8. Effects on other systems

- New facts refine dialogue choices, George prompts, minimap knowledge, objectives, check resolution, and debrief.
- Objective transitions select onboarding prompts, contact availability, mission audio, autosave moments, and acceptance checkpoints.
- Optional evidence changes Lira’s response, George’s interpretation, the dossier, outcome ledger, and future Miami handoff state.
- Contact consultation changes route clarity without mutating unrelated character stats.
- Final completion enables safehouse debrief, progression allocation, and the temporary ending choices.

## 9. UI, world, audio, and George feedback

- The persistent lane states one current action in concrete language.
- World markers scale in precision with knowledge and disappear or change when completed.
- Required interactions use readable, forgiving targets and states: usable, too far, blocked, unavailable, or completed.
- The dossier separates confirmed facts from objectives and consequences; it never presents speculation as verified evidence.
- Minimap symbols distinguish protagonist, safehouse, known contact, known camera, objective area, and known exit without permanent labels over actors.
- Objective updates use restrained audio and concise HUD feedback.
- George may summarize the current beat, confirmed facts, or known route differences; he must say when location or risk remains unknown.

## 10. Failure, recovery, and Restart Attempt behavior

- Each run failure uses an exact cause: `failure.health`, `failure.paranoia`, `failure.capture`, or `failure.deadline`.
- A failed optional recognition marks the evidence as unrecognized or missed and leaves the medkit path intact.
- If an objective interaction is blocked, the prompt explains the current range, visibility, occlusion, ownership, network, or prerequisite issue.
- Restart Attempt restores objective state, facts, `ColdIronEvidenceState`, contacts visited, time, Health, Paranoia, and preparation exactly as recorded in `OperationAttemptBaseline`.
- New Game clears all mission, fact, outcome, and minimap knowledge state.
- Completion cannot occur through a debug bridge, proximity trigger, teleport, automatic pickup, or hidden state mutation.

## 11. Content-authoring requirements

- Maintain stable IDs for all mission states, objectives, facts, contacts, locations, evidence, consequences, and failure causes.
- Author objective copy at district, area, entrance, and exact-anchor precision where applicable.
- Author facts for Brant’s delivery window, Naila’s camera topology, connected terminal location and Cold Iron warning, manifest recognition/copy, medkit requirement, and outbound validation.
- Author dossier entries for people, locations, evidence, timeline, and established consequences.
- Author debrief mappings for every outcome-ledger field in [[13 Level 0 Content and State Matrix]].
- Author English and Ukrainian equivalents with identical keys and state effects.

## 12. Edge cases and prohibited shortcuts

- No mandatory Naila/Brant errands.
- No procedural contracts, storylet feed, faction reputation, trust meters, crafting tasks, or unrelated backlog content in the dossier.
- No fact may silently become currency, reputation, XP, or a universal modifier.
- No universal rumor/confirmed/leverage layer and no automatic manifest copy on inspection or recognition.
- No unknown camera, entrance, evidence, or objective anchor may leak through minimap initialization, debug defaults, George, or save migration.
- No automatic pickup or proximity completion.
- No objective state may be inferred from decorative asset visibility.
- No required interaction may be hidden behind a building without the approved foreground readability treatment.

## 13. Removed behavior

Removed: broad quest-journal lists of every available side quest, Lira→Naila→Brant mandatory chain, procedural contracts, quest trust/currency rewards, automatic cache collection, faction/reputation objectives, generic discovered-object XP, hidden exact markers, route lines, and debug-only progression.

## 14. Post-MVP extensions

Post-MVP may add campaign-level dossiers, more evidence relationships, additional contacts, and multi-level consequence callbacks. Procedural quests, faction contracts, or reputation are not promised by this extension and require separate approval.

## 15. Human-play acceptance examples

1. At boot, the player sees one immediate objective and no leaked optional route knowledge.
2. Naila’s facts change terminal/camera information and advance only the Cold Iron warning; Brant’s fact changes delivery timing clarity.
3. Skipping both contacts leaves both infiltration timings possible but less explicit.
4. Walking over the medkits does nothing; explicit interaction completes the cache beat once.
5. Missing the optional manifest still permits Lira return, transit validation, and completion.
6. Returning medkits while Pursuit remains active does not complete escape until the network is resolved.
7. Debrief and dossier accurately reflect route, contacts, binary facts, camera history, pursuit, Health loss, Paranoia peak, `ColdIronEvidenceState`, and transit.

## 16. Owning Linear ticket

- System infrastructure: `T9` (`GET-209`) plus `T9A` (`GET-213`) — dialogue, George, binary facts, Cold Iron chain, dossier, copy action, failure/departure legibility, and four-lane HUD.
- Authored mission and acceptance: `T10` (`GET-210`) — Tokyo escape content, audio, onboarding, and end-to-end acceptance.
- Canonical decisions: `GDR-MIS-001` through `GDR-MIS-010`, `GDR-FACT-001`, `GDR-FACT-002`, `GDR-UI-003`, `GDR-TIME-001`, and `GDR-INT-001` in [[12 Game Design Decision Register]].
