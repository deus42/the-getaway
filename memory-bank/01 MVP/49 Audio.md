---
status: MVP
type: system-specification
tags: [audio, feedback, accessibility]
canonical: true
---

# Audio

## 1. Player fantasy and purpose

Audio makes the watched city, passing time, and every important state transition legible without asking the player to stare at the HUD. It grounds movement and place through three authored spatial sound leaks, distinguishes network concern from pursuit and Needle verification, and gives interaction, consequence, safehouse, failure, and completion their own authored weight. Level 0 audio is required feedback, not optional polish. This implements `GDR-AUD-001` and `GDR-AUD-002`.

## 2. Player-visible verbs

- Hear the outdoor city and safehouse contexts.
- Hear protagonist movement and explicit interaction responses.
- Hear distinct camera/network, Needle, four street-clock moments, consequence, objective, UI, failure, and completion cues.
- Use the approved volume controls once the accessibility baseline is resolved.
- Read equivalent visual/text feedback for every critical audio event.

There is no voice acting in Level 0.

## 3. Starting state and prerequisites

- Audio begins from the authored safehouse/city context after valid Level 0 initialization and reflects the canonical running or paused state.
- Cue playback is driven only by authoritative semantic events; audio does not infer or own mission, surveillance, movement, or resource state.
- Source/licensing, loudness budget, priority/mixing, and the distinctness of drone, network, objective, and dialogue UI cues remain open under `OPEN-AUD-001`; semantic events and temporary original or cleared placeholder cues may be implemented as reversible trials using its recorded recommendation.
- Volume controls, subtitle policy, reduced-motion/flash counterparts, and color-independent feedback remain open under `OPEN-ACC-001`; implementation may use only its recorded provisional baseline until human acceptance resolves it.
- No placeholder or provisional mix may be treated as production-accepted until both OPEN items that affect it are resolved.

## 4. Complete happy-path behavior

1. The safehouse opening establishes the grounded city/safehouse sound context, including the safehouse-side apartment leak, without masking George, UI, or critical operation cues.
2. Movement and explicit interactions produce authored feedback aligned with the visible action.
3. Lira dialogue, objective changes, and operation departure use distinct UI/mission cues without voice acting.
4. Cameras and public/security behavior remain readable in the world; `Suspicious`, `Pursuit`, Needle's hum/approach, and Needle verification each provide clearly differentiated authored warnings.
5. The 21:00, 21:30, 22:00, and 23:30 street moments; connected-terminal use; cache release; medkit recovery; consequences; safehouse return; Rest; and outbound validation each trigger only their declared cue family.
6. Failure names its exact cause with matching feedback. Successful return, transit validation, debrief, progression, Continue Exploring, and End Demo receive distinct closure cues.
7. Paused reading/decision surfaces do not allow simulation-owned audio to imply that world time or autonomous state has advanced.

## 5. State model and transitions

- Audio presentation listens to authoritative semantic transitions for city context, movement, interaction, surveillance, consequence, curfew, safehouse, UI, failure, and completion.
- `Clear`, `Suspicious`, `Pursuit`, Needle approach, Needle verification, and recovery each remain distinct event states; audio cannot collapse or reorder the network state machine.
- The Transit Road restaurant, Market Ring workshop, and safehouse-side apartment are stable spatial ambience emitters whose threshold behavior follows the authoritative clock.
- Overlay opening/closing follows shared focus/pause ownership. Exact ambience continuation, ducking, tail, and mixing behavior must be decided under `OPEN-AUD-001` rather than guessed.
- Failure and completion cues occur only after their authoritative state transition and do not cause that transition.
- Restart Attempt restores the `OperationAttemptBaseline` semantic state and clears post-departure audio ownership so no stale alarm, Needle, interaction, clock-boundary, or completion cue persists.

## 6. Rules and tuning values

- Required Level 0 cue families are city, movement, interaction, surveillance, consequence, curfew, safehouse, UI, failure, and completion.
- Needle, network transitions, four clock boundaries, three spatial sound leaks, objectives, and dialogue UI are separate required cue contexts; their provisional differentiation, priority, and mix follow `OPEN-AUD-001` until human acceptance resolves it.
- Level 0 has no voice acting. Spoken dialogue remains authored text with the approved subtitle/localization treatment.
- Critical information is never audio-only; matching world, HUD, text, shape, or animation feedback is required.
- Audio never changes a check, fact, objective, surveillance state, Health, Paranoia, time, or mission result.
- No loudness, duration, loop, priority, ducking, spatialization, file format, or source value is approved here. Recorded recommendations in `OPEN-AUD-001` may be implemented only as explicit replaceable trial data.
- Player-facing volume and accessibility behavior uses the recorded `OPEN-ACC-001` recommendation provisionally and remains unaccepted until human review.

## 7. Inputs from other systems

- [[41 Movement, Interaction & Observation]] supplies authoritative movement, collision, interaction, and Observation transitions.
- [[42 Surveillance, Security & Civilian Behavior]] supplies camera, network, security, civilian, drone, hiding/blending, and interception transitions.
- [[43 Health, Failure & Recovery]] supplies physical consequence, Paranoia threshold, failure, recovery, and Restart Attempt events.
- [[44 Safehouse, Save & Restart Attempt]] supplies waiting, Rest, save, departure, terminal validation, and restoration events.
- [[45 HUD & Information Architecture]] supplies UI/overlay focus, prompt, objective, dialogue, dossier, feed, debrief, failure, and completion events.
- [[80 Day-Night Cycle]] supplies dusk/curfew/deadline and shared pause state.
- [[91 Quests & Objectives]] supplies stable beat and completion transitions; `Level0OutcomeLedger` supplies factual debrief context.

## 8. Effects on other systems

- Audio reinforces an already-authoritative event but produces no gameplay mutation.
- Distinct warnings improve the player's ability to identify source, urgency, current network state, Needle verification, curfew, objective transition, and exact consequence.
- UI and reading-surface audio confirms focus/selection without issuing movement or interaction beneath an overlay.
- Restart Attempt and New Game clear stale audio presentation so restored state is not contradicted by a previous attempt's alarm, drone, deadline, failure, or completion sound.
- Audio availability and quality contribute to human-play acceptance but cannot substitute for visual/text state or normal-control proof.

## 9. UI, world, audio, and George feedback

- City and safehouse beds establish grounded place; movement and interaction cues align to visible actor/world action.
- Camera concern, `Suspicious`, `Pursuit`, recovery, Needle hum/approach, and Needle verification use distinct authored feedback paired with truthful world/HUD state.
- Transit Road restaurant, Market Ring workshop, and safehouse-side apartment sound leak from their authored thresholds rather than playing as a flat global bed.
- Curfew, terminal availability/use, medkit recovery, objective advance, resource consequence, Rest, transit validation, failure, and completion each use their declared semantic cue family.
- Dialogue/George/feed/dossier/UI sounds remain distinct from surveillance warnings and cannot mask them under the unresolved priority budget.
- George has no voice acting. His authored HUD/AR prompt changes use readable text/presentation and any approved UI cue only.
- Exact mix, loudness, spatialization, and accessibility treatment remain explicitly unresolved in `OPEN-AUD-001` and `OPEN-ACC-001`.

## 10. Failure, recovery, and Restart Attempt behavior

- `failure.breakdown`, `failure.capture`, `failure.deadline`, and `failure.save_incompatible` require distinguishable authored failure feedback paired with the exact text cause.
- Missing audio cannot hide or alter Restart Attempt/New Game actions; visual/text feedback remains complete.
- Restart Attempt stops or clears post-departure presentation and restarts only the ambience/cues appropriate to the restored departure state.
- Recovery from `Pursuit` must audibly follow the real `Pursuit` to `Suspicious` to `Clear` transitions; no early calm cue may claim recovery before state changes.
- Audio playback failure is an acceptance defect, not permission to auto-resolve a state or represent the cue as tested.

## 11. Content-authoring requirements

- Author a cue inventory covering city, movement, interaction, surveillance, consequence, curfew, safehouse, UI, failure, and completion.
- Map every cue to a stable semantic event, required world/HUD/text companion, pause behavior, Restart Attempt/New Game cleanup, localization/subtitle need, and the source/licensing evidence required by the approved or explicitly provisional `OPEN-AUD-001` baseline. Allowed overlap and priority remain provisional until that decision is accepted; provisional cues cannot close production-audio acceptance.
- Provide distinct authored cues for camera concern/network transitions, Needle hum/approach/verification, the 21:00/21:30/22:00/23:30 street moments, three spatial ambience locations, objectives, dialogue UI, terminals, medkit recovery, Health/Paranoia consequence, Rest, failure causes, transit validation, debrief/progression, and demo closure.
- Resolve `OPEN-AUD-001` before selecting production sources or locking loudness/mixing; resolve `OPEN-ACC-001` before locking volume/subtitle and non-audio parity.
- Do not select or commit production sources until `OPEN-AUD-001` resolves source/licensing and provenance requirements. No voice-acting inventory is required for Level 0.

## 12. Edge cases and prohibited shortcuts

- No critical state conveyed only through sound and no visual-only fallback represented as complete audio acceptance.
- No cue fired from speculative, stale, presentation-owned, or hidden state.
- No calm/recovery cue before the authoritative network recovery, no completion cue before transit validation/debrief, and no failure cue after transit has made deadline failure impossible.
- No stale alarm, drone, curfew, movement, dialogue, failure, or completion loop after pause, Restart Attempt, New Game, or state restoration.
- No flat nonspatial substitute for the three authored threshold sound locations and no clock-boundary cue firing twice after pause/save restoration.
- No source represented as cleared before `OPEN-AUD-001` is accepted and its required evidence is recorded; no guessed loudness value or placeholder sound treated as production-complete.
- No voice acting, fantasy weapon/EMP sound, combat mix, or audio that implies removed mechanics.

## 13. Removed behavior

- Audio as an optional basic polish pass; the current contract makes authored feedback mandatory.
- Voice acting for Level 0.
- Combat, weapon, EMP, takedown, magic-hacking, vehicle, survival-meter, and fantasy-Neo cue requirements.
- Any audio-owned gameplay transition or audio-only surveillance/failure information.

## 14. Post-MVP extensions

- No voice acting, adaptive score, additional language audio, combat mix, or advanced spatial-audio system is an approved Post-MVP promise.
- Future campaign audio may extend the same semantic-event, provenance, licensing, priority, accessibility, and Restart Attempt cleanup contract only after a new recorded decision.

## 15. Human-play acceptance examples

- Traverse safehouse, public street, service alley, and cache area and distinguish city, movement, interaction, and safehouse contexts without masking critical cues.
- Trigger `Suspicious`, `Pursuit`, drone approach, drone verification, recovery to `Suspicious`, and recovery to `Clear`; identify each transition without relying only on HUD color.
- Cross all four clock boundaries and visit the Transit Road restaurant, Market Ring workshop, and safehouse-side apartment; each boundary is idempotent and each source reads spatially.
- Operate all three terminals, recover medkits, take one authored consequence, Rest, validate transit, fail an attempt, Restart Attempt, and complete the demo; each required event has distinct synchronized feedback and no stale cue.
- Open dialogue, Observation, dossier, feed, terminal, failure, and debrief while simulation is active; no audio implies unobserved world advancement during pause.
- `AC-L0-017` and `AC-L0-018`: verify equivalent state feedback in both text languages and at all viewports, with approved volume/accessibility controls after the OPEN gates close.

## 16. Owning Linear ticket

`T10` (`GET-210`) owns the base authored Level 0 audio system, source/licensing, integration, localization/subtitle completion, and end-to-end acceptance. `T10A` (`GET-214`) owns the four clock moments and three spatial sound locations; `T8A` (`GET-212`) owns Needle events. `T3` (`GET-203`), `T7` (`GET-207`), and `T9` (`GET-209`) supply authoritative runtime events; `T5` (`GET-205`) and `T6` (`GET-206`) supply world/actor presentation that audio must reinforce.
