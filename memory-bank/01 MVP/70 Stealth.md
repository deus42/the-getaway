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

- observe known camera coverage and the patrol drone;
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
- Cameras are not automatically known. Their world presence is visible when the player can see them; once discovered, they remain recorded on the knowledge minimap.
- Authored hiding and blending contexts exist in the shared Level 0 layout contract.
- A hiding or blending context declares its physical boundary, entry anchor, permitted surveillance states, invalidation rules, and readable fiction.
- The player needs no specific build to avoid cameras, break line of sight, or use a valid hiding context.
- Systems and OpSec matter only to the grounded terminal-based camera loop.

## 4. Complete happy-path behavior

1. The player observes the street and identifies a known camera, route exposure, and at least one credible recovery context.
2. They move through the route while camera and drone geometry remains visually truthful.
3. If observation begins to accumulate, the world and HUD communicate the source and the network moves to `Suspicious` only after the authored confirmation window.
4. The network records a last-known position. The player breaks line of sight, changes direction, and enters a valid hiding or blending context away from that position.
5. Cameras stop updating the player location. The drone investigates the last-known area rather than the player’s true coordinates.
6. After the authored search and recovery conditions are satisfied, the network steps from `Pursuit` to `Suspicious`, then from `Suspicious` to `Clear`.
7. A successful difficult recovery may remove a small authored amount of Paranoia and is recorded in the outcome ledger.

The dusk route should make blending the most legible recovery tool. The curfew route should make physical hiding and camera topology the most legible recovery tools. Neither route is locked behind its associated contact.

## 5. State model and transitions

The player-facing network states are:

| State | Meaning | Entry | Exit |
|---|---|---|---|
| `Clear` | No confirmed active concern. | New run or completed recovery. | Sustained credible observation or an authored suspicious act enters `Suspicious`. |
| `Suspicious` | The network has concern and a last-known position but has not confirmed identity. | Observation threshold, trace-producing camera loop, or authored event. | Credible recovery returns to `Clear`; continued exposure or drone verification enters `Pursuit`. |
| `Pursuit` | Identity or presence is confirmed and active interception is underway. | Confirmed camera observation, continued exposure, drone verification, or failed checkpoint outcome. | Successful line-of-sight break plus valid recovery returns to `Suspicious`; interception may resolve or fail the run. |

The authoritative transition table and unresolved timing values live in [[13 Level 0 Content and State Matrix]] and [[14 Specification Review Queue]]. Implementations may not invent intermediate public states or hide state changes behind generic alert labels.

## 6. Rules and tuning values

- Cameras, the drone, and any authored observer use the same occlusion-aware geometry for rendering and detection.
- Surveillance never detects through solid geometry.
- Pursuit follows last-known positions and observed updates, not the protagonist’s hidden true coordinates.
- A valid hiding point cannot be entered while the protagonist is directly observed.
- A hiding or blending context is discrete and authored; arbitrary dark tiles, building corners, or civilian proximity do not grant concealment.
- Blending requires a credible active social context, such as a delivery flow, queue, waiting group, or service activity.
- Level 0 uses authored noise events only. Doors, terminals, collisions, alarms, and scripted environmental events may create an investigation source. Walking and sprinting do not feed a universal radial noise meter.
- Camera looping is local to the connected camera or explicitly declared small camera group. It cannot disable the district, open doors, erase identity, or affect unrelated terminals.
- A successful camera loop requires Systems. OpSec determines whether the successful action leaves a trace that moves the network to `Suspicious`.
- The exact observation, confirmation, search/recovery, and camera-loop timings remain acceptance decisions under `OPEN-SUR-001` through `OPEN-SUR-004`; their recorded recommendations may be trialed only as isolated reversible tuning.

## 7. Inputs from other systems

- [[41 Movement, Interaction & Observation]] supplies movement intent, collision, interaction range, and pause ownership.
- [[42 Surveillance, Security & Civilian Behavior]] owns device geometry, network state, last-known position, and drone behavior.
- [[60 Paranoia]] supplies the current check penalty and authored surveillance stress effects.
- [[80 Day-Night Cycle]] supplies public-activity and curfew schedule state.
- [[92 Character & Progression]] supplies Systems, OpSec, Evasion, Composure, Awareness, and relevant attributes.
- [[46 Facts, Dossier, Minimap & Terminals]] supplies discovered routes, facts, and current mission state.
- The Level 0 layout contract supplies hiding, blending, entrance, terminal, and line-of-sight semantics.

## 8. Effects on other systems

- Network transitions raise Paranoia only through declared authored effects.
- Recovery changes route availability, George prompts, objective copy, and the outcome ledger.
- A camera loop may create a fact, terminal event, trace, or debrief consequence.
- Interception can cost Health, Paranoia, or time; failure can cause capture.
- Dusk blending and curfew hiding become distinct debrief facts rather than interchangeable stealth scores.
- Discovered cameras become persistent minimap knowledge for the current run.

## 9. UI, world, audio, and George feedback

- Known coverage is subtly visible during normal play and strengthened in paused observation.
- Current sweep direction, detection source, last-known position, and state transition must be readable without debug overlays.
- The HUD uses amber for caution/objective context and crimson only for confirmed danger or Pursuit.
- Invalid hiding or blending states explain the concrete reason: directly observed, context inactive, occupied, out of range, or wrong approach.
- Audio distinguishes camera sweep, focus, Suspicious transition, drone approach, verification, Pursuit, recovery, and lost contact.
- George may identify a known risk, compare known recovery options, or say that the available evidence is insufficient. He may not reveal an undiscovered camera or direct the protagonist automatically.

## 10. Failure, recovery, and retry behavior

- `Suspicious` is always recoverable without combat when the player has not crossed an authored point of no return.
- `Pursuit` is recoverable by breaking line of sight, changing direction, and using a valid recovery context; it does not clear by waiting in open space.
- If intercepted, deterministic options appear with visible requirements and consequences.
- Failed interception causes capture and mission failure; it does not open tactical combat.
- Retry restores the operation-departure snapshot, including known facts and preparation state at departure, and clears all post-departure surveillance state.
- A recovery context may not create a permanent safe zone or allow the player to wait out the midnight deadline without time advancing.

## 11. Content-authoring requirements

- Author at least one hiding and one blending context that teach different recovery logic.
- Author enough contexts across all three traversal loops that each route has a viable recovery plan without forming an obvious breadcrumb trail.
- Each context needs world art, interaction bounds, visibility rules, activation schedule, invalid-state copy, audio treatment, and test anchors.
- Author camera-loop success, success-with-trace, unavailable, and interrupted outcomes.
- Author interception options and costs for at least social/Composure, Evasion, and Physical escape approaches where the protagonist’s build supports them.
- Author George lines for first observation, Suspicious, last-known position, drone dispatch, Pursuit, invalid hiding, recovery, and insufficient knowledge.

## 12. Edge cases and prohibited shortcuts

- Do not reveal unknown surveillance through observation mode, minimap initialization, or George.
- Do not use separate geometry for a rendered cone and actual detection.
- Do not let cameras or the drone update the protagonist’s hidden position without a valid observation.
- Do not let a contact fact become a universal stealth bonus.
- Do not turn every pedestrian cluster, shadow, or doorway into a hiding context.
- Do not auto-enter hiding, auto-loop cameras, auto-pick routes, or auto-resolve pursuit.
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

## 16. Owning Linear ticket

- Primary: `T8` (`GET-208`) — Surveillance, security, civilians, hiding, drone, and noncombat escape.
- Integration: `T10` (`GET-210`) — Tokyo escape content, audio, onboarding, and end-to-end acceptance.
- Canonical decisions: `GDR-SUR-001` through `GDR-SUR-005`, `GDR-STL-001` through `GDR-STL-003`, `GDR-MOV-001` through `GDR-MOV-003`, `GDR-OBS-001`, `GDR-OBS-002`, `GDR-ESC-001`, `GDR-ESC-002`, and `GDR-REM-003` through `GDR-REM-005` in [[12 Game Design Decision Register]].
