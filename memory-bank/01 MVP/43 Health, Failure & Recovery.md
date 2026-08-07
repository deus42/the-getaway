---
status: MVP
type: system-specification
tags: [failure, surrender, recovery]
canonical: true
---

# Failure, Surrender & Recovery

## 1. Player fantasy and purpose

Failure is factual and cause-specific: the game names only what its ledgers know, preserves player trust, and restores a deterministic attempt through Restart Attempt. There is no Health meter — physical consequence lands as world-minute costs, Paranoia, or capture (`GDR-HLT-004`), so the player reads exactly two pressures all evening: the clock and their own composure. Breakdown at 100 Paranoia is a person surrendering, not a bar emptying (`GDR-PAR-009`). Recovery is an explicit trade of safehouse time rather than passive regeneration or consumable management. The capture and breakdown endings read as the watcher's own file — the desk side of Papers Please and Orwell, inverted onto the watched (design lineage per `GDR-GOV-009`). This implements `GDR-HLT-004`, `GDR-PAR-008`, `GDR-PAR-009`, `GDR-TIME-003`, `GDR-FAIL-001`, and the failure contract in [[11 Level 0 Vertical Slice Contract]].

## 2. Player-visible verbs

- Preview a Paranoia, time, or named consequence before choosing an authored confrontation or escape option.
- Accept or avoid an authored physical consequence.
- Return to the safehouse and Rest.
- Read the exact cause and factual summary on failure.
- Choose Restart Attempt from `OperationAttemptBaseline` or choose New Game.

## 3. Starting state and prerequisites

- A new Level 0 run begins at the Calm tier (internal Paranoia `0`).
- The Paranoia tier is always visible in the protagonist lane of the persistent HUD.
- Physical consequences exist only as authored events that cost world minutes, raise Paranoia, or end in capture. No ambient, movement, curfew, or tactical damage source exists.
- Rest is available only through the safehouse action and uses the time/recovery contract in [[44 Safehouse, Save & Restart Attempt]].
- Restart Attempt becomes available after a normal run failure only when a compatible `OperationAttemptBaseline` exists.

## 4. Complete happy-path behavior

1. Before an authored interception, escape, or other physical consequence, the game shows the supported option, its gate verdict with reason, and the likely Paranoia, time, or named cost.
2. Resolution applies only the authored consequence and immediately communicates its source and amount.
3. The Paranoia tier remains visible throughout the attempt and has no hidden derived effect beyond its declared ability locks.
4. After a costly consequence, the player may reach the safehouse and choose Rest. Rest advances time by 30 world minutes and removes `40` Paranoia.
5. If a run-level failure occurs, the failure surface names the exact cause and offers deterministic Restart Attempt and New Game actions.
6. Restart Attempt restores `OperationAttemptBaseline` without post-departure stress, time, facts, device state, objectives, or outcomes.

## 5. State model and transitions

- Paranoia reaching `100` stages the surrender/freeze/bolt of `GDR-PAR-009` and enters `L0_FAILED` with `failure.breakdown`; the tier model and recovery rules remain owned by [[60 Paranoia]].
- Final authored interception failure enters `L0_FAILED` with `failure.capture`.
- Reaching `00:00` while either medkit return or outbound transit validation remains incomplete enters `L0_FAILED` with `failure.deadline`.
- Detecting a retired save schema enters the incompatible-save flow with `failure.save_incompatible`; it does not create a partial run.
- Successful Restart Attempt restores the compatible `L0_OPERATION_DEPARTED` baseline. New Game clears all Level 0 state and returns to cover-select.

## 6. Rules and tuning values

- The three normal run failures are breakdown, capture, and deadline (`GDR-HLT-004`); `failure.save_incompatible` is the one technical screen.
- Authored physical consequences declare a world-minute cost, a Paranoia amount, a capture path, or a named combination; every selectable consequence is previewed.
- Safehouse Rest advances `30` world minutes and removes `40` Paranoia.
- Paranoia recovery follows approved `GDR-PAR-006` and `GDR-PAR-007`: two one-use grounding actions at +10 world minutes/−10 Paranoia, plus the first qualifying difficult surveillance escape at −5 once. Dialogue grants no relief.
- Exact Paranoia event amounts or sustained rates are unresolved in `OPEN-PAR-001`; its recorded recommendation must remain isolated provisional tuning until accepted.
- The exact fiction for capture failure and the narrative reason for the midnight deadline remain unresolved in `OPEN-NAR-012` and `OPEN-NAR-007`; the approved mechanical failure conditions remain in force without invented explanation. Breakdown staging (surrender, freeze, or bolt) is chosen per context by authored content under `GDR-PAR-009`.
- Failure occurs at midnight unless explicit medkit return and outbound transit validation have both completed. Once both are complete, the operation deadline cannot fail the completed run.
- Failure, completion, debrief, and recovery decision surfaces pause time and autonomous simulation.

## 7. Inputs from other systems

- [[42 Surveillance, Security & Civilian Behavior]] and authored interception nodes supply previewed stress, time, capture, or named consequences.
- [[60 Paranoia]] supplies the current tier, visible cause, and the breakdown transition.
- [[80 Day-Night Cycle]] supplies the current time, deadline transition, and pause ownership.
- [[44 Safehouse, Save & Restart Attempt]] supplies Rest eligibility, autosave state, baseline compatibility, and restoration data.
- [[92 Character & Progression]] supplies gate outcomes; failure adds no undeclared gate modifier.
- [[91 Quests & Objectives]] and transit state determine whether midnight can still fail the operation.

## 8. Effects on other systems

- Consequences contribute their world-minute costs and Paranoia deltas to `Level0OutcomeLedger` and may change Lira, George, dossier, and debrief wording.
- Breakdown, capture, or deadline expiration moves the mission to `L0_FAILED` with a stable failure ID.
- Rest changes Paranoia and world time together and may therefore alter which infiltration timing remains available.
- Restart Attempt restores the authored departure mission, clock, knowledge, objectives, and resources from `OperationAttemptBaseline`; versioned runtime data reconstructs baseline devices, while post-departure outcomes are discarded rather than restored from an outcome-ledger snapshot.
- Physical consequences grant no reward of any kind.

## 9. UI, world, audio, and George feedback

- The protagonist HUD lane shows the Paranoia tier and ability states continuously at every target viewport (`GDR-UI-005`).
- Every Paranoia change names the source and amount category at the moment it occurs; every time cost is visible on the clock.
- Restart Attempt treatment follows when the event occurred: pre-departure events become part of the immutable departure baseline, while post-departure events are discarded by Restart Attempt.
- A choice with a possible cost previews the likely Paranoia, time, or named consequence before confirmation.
- Failure names the staged surrender, confirming actor/system, missed deadline, or incompatible schema rather than showing only a generic mission-failed label.
- Authored consequence, safehouse, failure, Restart Attempt, and completion cues come from [[49 Audio]] and must be paired with readable visual/text feedback.
- George may explain the verified current tier, the last authored cause, and known recovery options; he cannot calm the protagonist, remove stress, or choose Restart Attempt.

## 10. Failure, recovery, and Restart Attempt behavior

| Failure ID | Trigger | Required message | Recovery action |
|---|---|---|---|
| `failure.breakdown` | Paranoia reaches `100` | Staged surrender/freeze/bolt per context, then a factual, evidence-limited summary naming the contributing source; no hallucination framing | `OperationAttemptBaseline` or New Game |
| `failure.capture` | Final authored capture-escape gate fails | Short Hidzu Corporation report/map containing only real sightings, detected tampering, Needle verification, and capture evidence; unseen route gaps stay disconnected | `OperationAttemptBaseline` or New Game |
| `failure.deadline` | `00:00` while either required return or validation is incomplete | Exact unfinished requirements; no capture claim | `OperationAttemptBaseline` or New Game |
| `failure.save_incompatible` | Retired schema detected | Incompatibility and New Game requirement | New Game only; no partial Restart Attempt |

The two grounding actions, safehouse Rest, and the one qualifying difficult-escape relief are the complete recovery set. Restart Attempt is restoration, not healing of the failed live state.

## 11. Content-authoring requirements

- Every physical consequence needs a stable source, an approved cost expressed in time/Paranoia/capture, a pre-choice preview where selectable, immediate source feedback, an outcome-ledger effect, and debrief wording.
- Every failure path needs one stable failure ID, its cause-specific read model, compatible Restart Attempt behavior, and New Game behavior. Only capture uses the typed surveillance incident report; deadline and breakdown never borrow that presentation, though breakdown's summary stays equally evidence-limited.
- Author breakdown staging variants (surrender, freeze, bolt) per context class with bilingual parity.
- Author capture and deadline prose using approved rules or the explicit reversible recommendations from `OPEN-NAR-012` and `OPEN-NAR-007`; unresolved prose remains provisional and blocks final narrative acceptance.
- Author the Transit Road vending-machine and Market Ring/Outer Space shrine grounding actions plus the qualifying difficult escape exactly once per attempt; dialogue supplies no recovery.
- English and Ukrainian failure, recovery, and consequence nodes must produce identical state changes.

## 12. Edge cases and prohibited shortcuts

- No damage meter, ambient chip damage, tactical damage ticks, enemy-HP exchange, random damage, or unpreviewed selectable consequence.
- No passive recovery, consumable relief, or walking-based recovery in Level 0.
- No injury state, limp, movement penalty, civilian injury reaction, or condition-derived detection/gate modifier beyond the declared tier locks.
- No hallucination, false clue, fake objective, or dishonest UI at any tier.
- No generic failure message, invented surveillance evidence, connected unseen route segment, capture framing on non-capture failures, silent reset, post-departure baseline overwrite, or failure after transit is valid.
- No partial migration of a retired schema and no corrupted/default-filled Restart Attempt.

## 13. Removed behavior

- `GDR-REM-004`: tactical damage and combat failure loops.
- `GDR-REM-007`: deep inventory, consumables, equipment, durability, crafting, ammo, and hotbar dependencies.
- The Health meter, `failure.health`, Health-restoring Rest, and authored Health costs per the superseded `GDR-HLT-001` through `GDR-HLT-003`; physical consequence now expresses as time, Paranoia, or capture under `GDR-HLT-004`.
- Recoverable breakdown, `Pressure`, passive curfew gain, and passive outdoor decay are replaced by the approved Paranoia and recovery contract; the terminal breakdown ending is `GDR-PAR-009`.
- Generic fatal-collapse recap without staged surrender is not current behavior.

## 14. Post-MVP extensions

- `GDR-POST-001` postpones a small managed inventory and consumables. It does not approve consumable relief or alter Level 0 recovery.
- `GDR-POST-002` postpones an expanded confrontation interface. It does not add combat damage to Level 0.
- No Health system, injury simulation, or additional condition resource is an approved Level 0 or Post-MVP promise without a new decision.

## 15. Human-play acceptance examples

- `AC-L0-011`: choose a supported interception option after reading its gate verdict and likely time/Paranoia cost; confirm only the authored cost occurs.
- `AC-L0-014`: reach Paranoia `100` through normal play, watch the staged surrender, read a truthful contributing source with no hallucination framing, Restart Attempt, and confirm the departure state returns exactly.
- `AC-L0-015`: reach midnight before validation, see the exact deadline failure, Restart Attempt, and confirm departure time returns.
- `AC-L0-016`: validate transit and confirm later time cannot produce deadline failure.
- `AC-L0-028`: compare capture, deadline, and breakdown screens; only capture uses the surveillance report/map, route gaps remain disconnected, and each other cause stays simple and factual.
- `AC-L0-030`: at the Breaking tier, confirm every declared fragile ability shows locked with its tier reason while hardened abilities pass, then recover below the boundary and confirm unlock.
- Take a costly consequence, Rest at the safehouse, and confirm `+30` minutes and Paranoia `−40` occur together.

## 16. Owning Linear ticket

`T7A` (`GET-216`) owns condition/failure data, the breakdown ending, and the renamed baseline/Restart Attempt contract (absorbing `T3A`/`GET-211`). `T8A` (`GET-212`) owns surveillance evidence for capture; `T9A` (`GET-213`) owns cause-specific failure presentation; `T10A` (`GET-214`) owns grounding/city content. `T3` (`GET-203`), `T8` (`GET-208`), `T9` (`GET-209`), and `T10` (`GET-210`) retain their existing parent-system ownership. Historic Health-era scope remains with `T7` (`GET-207`) as delivered evidence.
