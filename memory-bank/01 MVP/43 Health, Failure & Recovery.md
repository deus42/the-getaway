---
status: MVP
type: system-specification
tags: [health, failure, recovery]
canonical: true
---

# Health, Failure & Recovery

## 1. Player fantasy and purpose

Health makes physical consequences real without turning Level 0 into a damage or injury simulation. Failure is factual and cause-specific: the game names only what its ledgers know, preserves player trust, and restores a deterministic attempt through Restart Attempt. Recovery is an explicit trade of safehouse time rather than passive regeneration or consumable management. This implements `GDR-HLT-001` through `GDR-HLT-003`, `GDR-PAR-002`, `GDR-TIME-003`, `GDR-FAIL-001`, and the failure contract in [[11 Level 0 Vertical Slice Contract]].

## 2. Player-visible verbs

- Read current Health at all times.
- Preview a Health, Paranoia, time, or named consequence before choosing an authored confrontation or escape option.
- Accept or avoid an authored physical consequence.
- Return to the safehouse and Rest.
- Read the exact cause and factual summary on failure.
- Choose Restart Attempt from `OperationAttemptBaseline` or choose New Game.

## 3. Starting state and prerequisites

- A new Level 0 run begins with Health `100` and Paranoia `0`.
- Health and Paranoia are always visible in the protagonist lane of the persistent HUD.
- Health changes only through authored physical consequences. No ambient, movement, curfew, or tactical damage source exists.
- Rest is available only through the safehouse action and uses the time/recovery contract in [[44 Safehouse, Save & Restart Attempt]].
- Restart Attempt becomes available after a normal run failure only when a compatible `OperationAttemptBaseline` exists.

## 4. Complete happy-path behavior

1. Before an authored interception, escape, or other physical consequence, the game shows the supported option, deterministic requirement, and likely Health, Paranoia, time, or named cost.
2. Resolution applies only the authored consequence and immediately communicates its source and amount.
3. Health remains visible throughout the attempt and has no hidden derived penalty.
4. After losing Health and while still alive, the player may reach the safehouse and choose Rest. Rest advances time by 30 world minutes, restores Health to `100`, and removes `40` Paranoia.
5. If a run-level failure occurs, the failure surface names the exact cause and offers deterministic Restart Attempt and New Game actions.
6. Restart Attempt restores `OperationAttemptBaseline` without post-departure damage, stress, time, facts, device state, objectives, or outcomes.

## 5. State model and transitions

- Health ranges from `0` to `100`. An authored physical consequence lowers it by its declared amount; safehouse Rest restores it to `100`.
- Health reaching `0` enters `L0_FAILED` with `failure.health`.
- Paranoia reaching `100` enters `L0_FAILED` with `failure.paranoia`; its threshold model and nonphysical recovery rules remain owned by [[60 Paranoia]].
- Final authored interception failure enters `L0_FAILED` with `failure.capture`.
- Reaching `00:00` while either medkit return or outbound transit validation remains incomplete enters `L0_FAILED` with `failure.deadline`.
- Detecting a retired save schema enters the incompatible-save flow with `failure.save_incompatible`; it does not create a partial run.
- Successful Restart Attempt restores the compatible `L0_OPERATION_DEPARTED` baseline. New Game clears all Level 0 state and returns to `L0_CHARACTER_CREATION`.

## 6. Rules and tuning values

- Health is an integer range of `0–100`, begins at `100`, and is always visible.
- Health changes only from visible authored physical consequences. Health `0` is fatal.
- Health has no injury sub-state, limp, movement penalty, detection modifier, or civilian reaction.
- Safehouse Rest advances `30` world minutes, restores Health to `100`, and removes `40` Paranoia.
- Exact minor, dangerous, and severe Health costs are unresolved in `OPEN-HLT-001`. The isolated provisional authoring table is `minor −10`, `dangerous −25`, and `severe −40`; those values remain replaceable and unaccepted until live encounter review.
- Paranoia recovery follows approved `GDR-PAR-006` and `GDR-PAR-007`: two one-use grounding actions at +10 world minutes/−10 Paranoia, plus the first qualifying difficult surveillance escape at −5 once. Dialogue grants no relief.
- Exact Paranoia event amounts or sustained rates are unresolved in `OPEN-PAR-001`; its recorded recommendation must remain isolated provisional tuning until accepted.
- The exact fiction for capture failure and the narrative reason for the midnight deadline remain unresolved in `OPEN-NAR-012` and `OPEN-NAR-007`; the approved mechanical failure conditions remain in force without invented explanation.
- Failure occurs at midnight unless explicit medkit return and outbound transit validation have both completed. Once both are complete, the operation deadline cannot fail the completed run.
- Failure, completion, debrief, and recovery decision surfaces pause time and autonomous simulation.

## 7. Inputs from other systems

- [[42 Surveillance, Security & Civilian Behavior]] and authored interception nodes supply previewed physical, stress, time, capture, or named consequences.
- [[60 Paranoia]] supplies the current value, threshold penalty, visible cause, and fatal-collapse transition.
- [[80 Day-Night Cycle]] supplies the current time, deadline transition, and pause ownership.
- [[44 Safehouse, Save & Restart Attempt]] supplies Rest eligibility, autosave state, snapshot compatibility, and restoration data.
- [[92 Character & Progression]] supplies deterministic check outcomes; Health itself adds no undeclared check modifier.
- [[91 Quests & Objectives]] and transit state determine whether midnight can still fail the operation.

## 8. Effects on other systems

- Health loss contributes `healthLost` to `Level0OutcomeLedger` and may change Lira, George, dossier, and debrief wording.
- Health `0`, Paranoia `100`, capture, or deadline expiration moves the mission to `L0_FAILED` with a stable failure ID.
- Rest changes Health, Paranoia, and world time together and may therefore alter which infiltration timing remains available.
- Restart Attempt restores the authored departure mission, clock, knowledge, objectives, and resources from `OperationAttemptBaseline`; versioned runtime data reconstructs baseline devices, while post-departure outcomes are discarded rather than restored from an outcome-ledger snapshot.
- Physical consequences grant no XP, loot, consumable, combat state, or generic progression reward.

## 9. UI, world, audio, and George feedback

- The protagonist HUD lane shows Health and Paranoia continuously at every target viewport.
- Every Health and Paranoia change names the source and amount at the moment it occurs.
- Restart Attempt treatment follows when the event occurred: pre-departure events become part of the immutable departure snapshot, while post-departure events are discarded by Restart Attempt. A reusable cost/recovery preset does not own that timing decision.
- A choice with a possible cost previews the likely Health, Paranoia, time, or named consequence before confirmation.
- Failure names the physical cause, medical collapse, confirming actor/system, missed deadline, or incompatible schema rather than showing only a generic mission-failed label.
- Authored Health consequence, safehouse, failure, Restart Attempt, and completion cues come from [[49 Audio]] and must be paired with readable visual/text feedback.
- George may explain verified current Health, Paranoia, the last authored cause, and known recovery options; he cannot heal, remove stress, or choose Restart Attempt.

## 10. Failure, recovery, and Restart Attempt behavior

| Failure ID | Trigger | Required message | Recovery action |
|---|---|---|---|
| `failure.health` | Health reaches `0` | Simple physical cause and final consequence | `OperationAttemptBaseline` or New Game |
| `failure.paranoia` | Paranoia reaches `100` | Simple medical collapse and contributing source | `OperationAttemptBaseline` or New Game |
| `failure.capture` | Final authored capture-escape option fails | Short Hidzu Corporation report/map containing only real sightings, detected tampering, Needle verification, and capture evidence; unseen route gaps stay disconnected | `OperationAttemptBaseline` or New Game |
| `failure.deadline` | `00:00` while either required return or validation is incomplete | Exact unfinished requirements; no capture claim | `OperationAttemptBaseline` or New Game |
| `failure.save_incompatible` | Retired schema detected | Incompatibility and New Game requirement | New Game only; no partial Restart Attempt |

Safehouse Rest is the complete Level 0 Health recovery. The two grounding actions and one qualifying difficult-escape relief are the complete smaller Paranoia-recovery set. Restart Attempt is restoration, not healing of the failed live state.

## 11. Content-authoring requirements

- Every physical consequence needs a stable source, approved amount, pre-choice preview where selectable, immediate source/amount feedback, outcome-ledger effect, and debrief wording.
- Every failure path needs one stable failure ID, its cause-specific read model, compatible Restart Attempt behavior, and New Game behavior. Only capture uses the typed surveillance incident report; deadline, Health, and Paranoia never borrow that presentation.
- Author capture and deadline prose using approved rules or the explicit reversible recommendations from `OPEN-NAR-012` and `OPEN-NAR-007`; unresolved prose remains provisional and blocks final narrative acceptance.
- Author Health costs from approved values or the isolated `OPEN-HLT-001` recommendation; propagate the same provisional/approved source to checks, interception content, UI copy, tests, and T10 evidence.
- Author the Transit Road vending-machine and Market Ring/Outer Space shrine grounding actions plus the qualifying difficult escape exactly once per attempt; dialogue supplies no recovery.
- English and Ukrainian failure, recovery, and consequence nodes must produce identical state changes.

## 12. Edge cases and prohibited shortcuts

- No ambient chip damage, tactical damage ticks, enemy-HP exchange, random damage, or unpreviewed selectable consequence.
- No passive Health regeneration, health consumable, inventory-stack healing, or walking-based recovery in Level 0.
- No injury state, limp, movement penalty, civilian injury reaction, or Health-derived check/detection/combat modifier.
- No hallucination, false clue, fake objective, or dishonest UI at high Paranoia.
- No generic failure message, invented surveillance evidence, connected unseen route segment, capture framing on non-capture failures, silent reset, post-departure baseline overwrite, or failure after transit is valid.
- No partial migration of a retired schema and no corrupted/default-filled Restart Attempt.

## 13. Removed behavior

- `GDR-REM-004`: tactical damage and combat failure loops.
- `GDR-REM-007`: deep inventory, consumables, equipment, durability, crafting, ammo, and hotbar dependencies.
- Recoverable breakdown, `Pressure`, passive curfew gain, and passive outdoor decay are replaced by the approved Paranoia and recovery contract.
- Generic health-at-zero recap without an authored physical cause is not current behavior.

## 14. Post-MVP extensions

- `GDR-POST-001` postpones a small managed inventory and consumables. It does not approve consumable healing or alter Level 0 recovery.
- `GDR-POST-002` postpones an expanded confrontation interface. It does not add combat damage to Level 0.
- No additional Health state, injury simulation, or recovery system is an approved Level 0 or Post-MVP promise without a new decision.

## 15. Human-play acceptance examples

- `AC-L0-011`: choose a supported interception option after reading its exact requirement and likely Health/time/Paranoia cost; confirm only the authored cost occurs.
- `AC-L0-013`: reach Health `0` through normal play, see the exact physical cause, Restart Attempt, and confirm departure Health and all other snapshot fields are restored.
- `AC-L0-014`: reach Paranoia `100`, see fatal medical collapse with a truthful contributing source, and confirm no hallucination framing.
- `AC-L0-015`: reach midnight before validation, see the exact deadline failure, Restart Attempt, and confirm departure time returns.
- Injure the protagonist without reaching `0`, Rest at the safehouse, and confirm `+30` minutes, Health `100`, and Paranoia `-40` occur together.
- `AC-L0-016`: validate transit and confirm later time cannot produce deadline failure.
- `AC-L0-028`: compare capture, deadline, Health, and Paranoia screens; only capture uses real surveillance evidence, route gaps remain disconnected, and each other cause stays simple and factual.

## 16. Owning Linear ticket

`T7` (`GET-207`) owns Health/Paranoia foundations and failure data. `T3A` (`GET-211`) owns the renamed baseline and Restart Attempt contract; `T8A` (`GET-212`) owns surveillance evidence for capture; `T9A` (`GET-213`) owns cause-specific failure presentation; `T10A` (`GET-214`) owns grounding/city content. `T3` (`GET-203`), `T8` (`GET-208`), `T9` (`GET-209`), and `T10` (`GET-210`) retain their existing parent-system ownership.
