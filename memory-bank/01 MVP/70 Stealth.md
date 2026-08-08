---
status: MVP
type: system-specification
tags: [stealth, hiding, blending, pursuit]
canonical: true
---

# Stealth, Hiding, and Pursuit

## 1. Player fantasy and purpose

Stealth is the practical art of surviving an observed city without becoming a commando. The protagonist reads coverage, uses ordinary urban behavior, breaks surveillance continuity, and chooses when to wait, hide, blend, or leave. The system exists to make institutional observation understandable, tense, and recoverable.

## 2. Player-visible verbs

The player can:

- read subtle known-camera light/reflection warnings in play and exact discovered coverage in Observation;
- observe Needle's authored patrol and warnings;
- walk directly, stop, reverse direction, and choose another route;
- enter an authored hiding place;
- blend into an authored social context;
- break line of sight and move away from a last-known position;
- use the connected terminal to loop a camera when their build permits it;
- inspect why hiding, blending, or an interaction is currently invalid;
- resolve interception through an authored dialogue, Composure, Evasion, or Physical option.

There is no generic stealth-mode toggle, crouch stance, noise-lure power, takedown command, or universal darkness-as-invisibility rule in Level 0.

## 3. Starting state and prerequisites

- The surveillance network starts `Clear`.
- Hidzu Corporation begins with no concern or recognition; ordinary public visibility while `Clear` is harmless.
- Cameras are not automatically known. Their world presence is visible when the player can see them; once discovered, they remain recorded on the knowledge minimap.
- Authored hiding and blending contexts exist in the shared Level 0 layout contract.
- A hiding or blending context declares its physical boundary, entry anchor, permitted surveillance states, invalidation rules, and readable fiction.
- The player needs no specific build to avoid cameras, break line of sight, or use a valid hiding context.
- `ability.terminal_craft` and `ability.trace_discipline` matter only to the grounded terminal-based camera loop.

## 4. Complete happy-path behavior

1. The player observes the street and identifies a known camera, route exposure, and at least one credible recovery context.
2. They move through the route while camera and Needle geometry remains visually truthful and solid geometry creates ordinary blind spots.
3. Only when valid visibility coincides with an observed restricted breach, protected interaction, medkit removal, failed verification, or detected feed change can the world/HUD communicate concern and move to `Suspicious` after the authored confirmation window.
4. The network records a last-known position. The player breaks line of sight, changes direction, and enters a valid hiding or blending context away from that position.
5. Cameras stop updating the player location. The drone investigates the last-known area rather than the player’s true coordinates.
6. After the authored search and recovery conditions are satisfied, the network steps from `Pursuit` to `Suspicious`, then from `Suspicious` to `Clear`.
7. The first qualifying difficult surveillance recovery removes exactly five Paranoia once per attempt and is recorded in the outcome ledger.

The dusk route should make blending the most legible recovery tool. The curfew route should make physical hiding and camera topology the most legible recovery tools. Neither route is locked behind its associated contact.

## 5. State model and transitions

The player-facing network states are:

| State | Meaning | Entry | Exit |
|---|---|---|---|
| `Clear` | No confirmed active concern; public visibility is harmless. | New run or completed recovery, which resets recognition. | Valid observation plus a declared rule break enters `Suspicious`. |
| `Suspicious` | The network has concern and a last-known position but has not confirmed identity. | Observed rule break, detected feed change, or authored verification event. | Credible recovery returns to `Clear`; continued rule-breaking evidence or Needle verification enters `Pursuit`. |
| `Pursuit` | Identity or presence is confirmed and active interception is underway. | Continued valid visibility paired with active rule-break evidence, failed verification, or Needle verification. | Successful line-of-sight break plus valid recovery returns to `Suspicious`; interception may resolve or fail the run. |

The authoritative transition table and unresolved timing values live in [[13 Level 0 Content and State Matrix]] and [[14 Specification Review Queue]]. Implementations may not invent intermediate public states or hide state changes behind generic alert labels.

## 6. Rules and tuning values

- Cameras, the drone, and any authored observer use the same occlusion-aware geometry for rendering and detection.
- Surveillance never detects through solid geometry.
- Normal solid geometry and occlusion are the complete blind-spot rule; no special off-grid zone exists.
- `ObservationEvidence` alone never creates concern or Paranoia. A typed `SurveillanceRuleBreakEvidence` must also be valid.
- Pursuit follows last-known positions and observed updates, not the protagonist’s hidden true coordinates.
- A valid hiding point cannot be entered while the protagonist is directly observed.
- A hiding or blending context is discrete and authored; arbitrary dark tiles, building corners, or civilian proximity do not grant concealment.
- Blending requires a credible active social context, such as a delivery flow, queue, waiting group, or service activity.
- Level 0 uses authored noise events only. Doors, terminals, collisions, alarms, and scripted environmental events may create an investigation source. Walking and sprinting do not feed a universal radial noise meter.
- Level 0 has one camera set. Its connected-terminal loop is usable once per attempt; history persists as `active`, then `clean` or `traced`, until Restart Attempt. It cannot disable the district, open doors, erase identity, or affect unrelated terminals.
- A successful camera loop requires a lit `ability.terminal_craft`. A subsequent trace gate uses lit `ability.trace_discipline`, `fact.naila.camera_topology`, or the declared trace-risk path; a traced success moves the network to `Suspicious`.
- The exact observation, confirmation, search/recovery, and camera-loop timings remain acceptance decisions under `OPEN-SUR-001` through `OPEN-SUR-004`; their recorded recommendations may be trialed only as isolated reversible tuning.

## 7. Inputs from other systems

- [[41 Movement, Interaction & Observation]] supplies movement intent, collision, interaction range, and pause ownership.
- [[42 Surveillance, Security & Civilian Behavior]] owns device geometry, network state, last-known position, and drone behavior.
- [[60 Paranoia]] supplies the current named tier, fragile-ability locks, and authored surveillance stress effects.
- [[80 Day-Night Cycle]] supplies public-activity and curfew schedule state.
- [[92 Character, Covers, Abilities & Research]] supplies held/lit abilities and the shared gate resolver.
- [[46 Facts, Dossier, Minimap & Terminals]] supplies discovered routes, facts, and current mission state.
- The Level 0 layout contract supplies hiding, blending, entrance, terminal, and line-of-sight semantics.

## 8. Effects on other systems

- Network transitions raise Paranoia only through declared authored effects.
- Recovery changes route availability, George prompts, objective copy, and the outcome ledger.
- A camera loop may create a fact, terminal event, trace, or debrief consequence.
- Interception can cost Paranoia, time, a fact, or a named route consequence; final failure can cause capture.
- Dusk blending and curfew hiding become distinct debrief facts rather than interchangeable stealth scores.
- Discovered cameras become persistent minimap knowledge for the current run.

## 9. UI, world, audio, and George feedback

- Known coverage is subtly visible during normal play and strengthened in paused observation.
- Current sweep direction, detection source, last-known position, and state transition must be readable without debug overlays.
- The HUD uses amber for caution/objective context and crimson only for confirmed danger or Pursuit.
- Invalid hiding or blending states explain the concrete reason: directly observed, context inactive, occupied, out of range, or wrong approach.
- Audio distinguishes camera sweep, focus, Suspicious transition, Needle hum/approach/verification, Pursuit, recovery, and lost contact.
- George may identify a known risk, compare known recovery options, or say that the available evidence is insufficient. He may not reveal an undiscovered camera or direct the protagonist automatically.

## 10. Failure, recovery, and Restart Attempt behavior

- `Suspicious` is always recoverable without combat when the player has not crossed an authored point of no return.
- `Pursuit` is recoverable by breaking line of sight, changing direction, and using a valid recovery context; it does not clear by waiting in open space.
- If intercepted, deterministic options appear with visible requirements and consequences.
- Each nonterminal failed check applies its declared worse-but-real route; only the final failed capture-escape option causes capture and mission failure.
- Restart Attempt restores `OperationAttemptBaseline`, including known facts and preparation state at departure, and clears all post-departure surveillance/camera-group history.
- A recovery context may not create a permanent safe zone or allow the player to wait out the midnight deadline without time advancing.

## 11. Content-authoring requirements

- Author at least one hiding and one blending context that teach different recovery logic.
- Author enough contexts across all three traversal loops that each route has a viable recovery plan without forming an obvious breadcrumb trail.
- Each context needs world art, interaction bounds, visibility rules, activation schedule, invalid-state copy, audio treatment, and test anchors.
- Author one-use camera-loop active, clean, traced, already-spent, unavailable, and interrupted outcomes.
- Author interception options and costs for at least social/Composure, Evasion, and Physical escape approaches where the protagonist’s build supports them.
- Author George lines for first observed rule break, Suspicious, last-known position, Needle dispatch, Pursuit, invalid hiding, recovery, and the explicit reason for insufficient knowledge.

## 12. Edge cases and prohibited shortcuts

- Do not reveal unknown surveillance through observation mode, minimap initialization, or George.
- Do not use separate geometry for a rendered cone and actual detection.
- Do not let cameras or the drone update the protagonist’s hidden position without a valid observation.
- Do not add concern or Paranoia for ordinary public visibility, hidden rule breaks, or an off-grid flag.
- Do not let a contact fact become a universal stealth bonus.
- Do not turn every pedestrian cluster, shadow, or doorway into a hiding context.
- Do not auto-enter hiding, auto-loop cameras, auto-pick routes, or auto-resolve pursuit.
- Do not reset recognition anywhere except a full return to `Clear`, and do not reset camera-use history before Restart Attempt.
- Do not use permanent labels, giant floor cones, screen-wide crimson grading, or false `CLEAR` messaging to compensate for unreadable world design.
- Do not introduce EMPs, invisibility, magical hacking, takedowns, or combat rewards.

## 13. Removed behavior

Removed from the current Level 0 design: Ghost stealth package, stealth toggle, silent/walk/sprint noise simulation, universal movement-noise radii, noise-lure ability, EMP camera disable, ambush bonuses, threat-aware routing, AutoStealth, guard-combat fallback, attack animations, and the old `Unseen → Suspicious → Searching → Alarmed` combat-oriented state chain.

## 14. Post-MVP extensions

Post-MVP may deepen security behavior, add more credible hiding/blending contexts, extend indoor surveillance, and add additional verifier types. It may not silently restore fantasy gadgets or tactical-combat ownership; any expansion requires a new decision and system-specification update.

## 15. Human-play acceptance examples

1. A player unfamiliar with debug tools identifies a camera, reads its sweep, crosses safely, and explains why they were not detected.
2. The player deliberately enters `Suspicious`, breaks observation, hides credibly, watches the drone search the last-known area, and returns to `Clear`.
3. During dusk, the player uses Brant’s information to recognize a blending window, but a second run without Brant can still infer and use it.
4. During curfew, the player loops the connected camera; a weak-OpSec build succeeds but leaves a visible trace.
5. The player is pursued, changes direction after breaking sight, uses a valid hiding point, and confirms that the network did not track through geometry.
6. A caught player sees understandable deterministic interception choices and either escapes with declared costs or receives a precise capture failure.
7. Public visibility without a rule break remains harmless; each declared rule break escalates only when observed; returning to `Clear` resets recognition.
8. Use the camera set once, let the loop expire clean/traced, and prove the result persists until Restart Attempt.

## 16. Owning Linear ticket

- Primary: `T8` (`GET-208`) — base surveillance, security, civilians, hiding, drone, and noncombat escape; `T8A` (`GET-212`) — rule-break evidence, harmless public visibility, camera history, Needle, recognition reset, and civilian reactions.
- Integration: `T10` (`GET-210`) — Tokyo escape content, audio, onboarding, and end-to-end acceptance.
- Canonical decisions: `GDR-SUR-001` through `GDR-SUR-010`, `GDR-CIV-001`, `GDR-STL-001` through `GDR-STL-003`, `GDR-MOV-001` through `GDR-MOV-003`, `GDR-OBS-001`, `GDR-OBS-002`, `GDR-ESC-001`, `GDR-ESC-002`, and `GDR-REM-003` through `GDR-REM-005` in [[12 Game Design Decision Register]].
