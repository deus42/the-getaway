---
status: MVP
type: system-specification
tags: [movement, interaction, observation, input]
canonical: true
---

# Movement, Interaction & Observation

## 1. Player fantasy and purpose

The player moves through a continuous, human-scale district by reading streets, obstacles, entrances, people, and surveillance for themselves. Movement is immediate and physical rather than delegated to a route planner; interaction makes every consequential state change deliberate; observation gives the player a safe moment to understand only what they have actually learned. This implements `GDR-MOV-001`, `GDR-MOV-002`, `GDR-INT-001`, `GDR-OBS-001`, and `GDR-OBS-002`.

## 2. Player-visible verbs

- Move directly toward a clicked world point.
- Move with WASD as a fully supported equivalent input.
- Replace the current movement intent with a new click or keyboard direction.
- Slide along solid walls and corners when movement meets collision.
- Explicitly interact with contacts, mission objects, terminals, entrances, hiding or blending contexts, and safehouse actions.
- Enter Observation, pan the camera, and inspect known devices, coverage, entrances, contacts, contexts, objectives, and facts.
- Ask the one authored George question available for the observed context.
- Exit Observation and resume control without spending a movement click.

## 3. Starting state and prerequisites

- Level 0 begins inside the authored safehouse boundary at 18:30 with no movement intent active.
- Contextual onboarding exposes click-to-move, WASD, interaction, pause ownership, and George access in the playable opening; there is no separate F1 tutorial. The in-game Game Design Bible remains a reference surface and does not replace onboarding.
- The safehouse and Lira meeting point are known. Devices and contexts are known only when the starting view or an authored fact legitimately reveals them.
- Observation is available from normal outdoor play. Any overlay that owns simulation pause must release input cleanly before world control resumes.

## 4. Complete happy-path behavior

1. The player clicks a visible point or holds a WASD direction; the protagonist moves directly under that intent.
2. A new click or keyboard direction immediately replaces the prior intent. Collision preserves physical boundaries and slides movement along walls or corners where possible.
3. The player approaches an authored contact, terminal, mission object, entrance, hiding or blending context, or safehouse action and uses explicit interaction.
4. The interaction surface states its purpose or current blocker before applying any consequential state transition.
5. When route reading is needed, the player enters Observation. World time and autonomous simulation pause while the player pans and inspects known information.
6. Closing Observation restores world focus and input without moving the protagonist or requiring a sacrificial click.
7. The player uses these same normal controls throughout approach, infiltration, escape, return, and safehouse validation.

## 5. State model and transitions

- With no current input, the protagonist is stationary.
- A valid click creates direct movement intent toward that point; WASD creates directional movement intent. Either input replaces the other immediately.
- Arrival, collision, or replacement input ends or changes the current intent according to the final direct-movement contract; exact blocked-click and arrival behavior remains governed by `OPEN-MOV-001`.
- Explicit interaction may transition only the authored target's own state. Proximity alone never completes the interaction.
- Entering Observation adds a full simulation pause and suspends protagonist movement and autonomous state changes. Exiting Observation removes that ownership and restores the prior running or otherwise-paused state.
- Observation changes no mission, fact, device, surveillance, inventory, or protagonist state by itself. It can reveal the exact coverage of an already-discovered camera because that is inspection of known geometry, not a state mutation.

## 6. Rules and tuning values

- Click movement is direct intent, never A*, a queued path, or a threat-aware route.
- WASD and click movement are equivalent supported control paths; new input overrides current intent immediately.
- Collision sliding is required for natural wall and corner movement.
- Invalid destinations provide a short reason and a reachable marker where appropriate, but the game does not navigate to that marker automatically.
- Observation fully pauses time and autonomous simulation. It may inspect only known state and may not move, interact, operate terminals, or reveal unknown surveillance.
- Normal-play status lights, IR glints, and authored reflections provide subtle camera warnings. Observation draws exact discovered coverage from the same `ObservationEvidence` geometry.
- Solid geometry and occlusion are the only spatial blind-spot contract. No special off-grid zone changes George, minimap, surveillance, or Paranoia behavior.
- Normal play uses a close street-first camera with the protagonist in the lower-center lead area. Manual minimum zoom reaches the composed four-block mission overview. Exact numeric zooms and follow offset remain the only unresolved values in `OPEN-MOV-003` and are frozen from the accepted same-master GET-204 live candidate.
- Exact direct-click arrival and blocked-click behavior is unresolved in `OPEN-MOV-001`; movement speed and isometric WASD mapping are unresolved in `OPEN-MOV-002`.
- The approved topological envelope is exactly four dense mission blocks with three functional identities and three interlocking loops. Exact bounds, widths, anchors, context counts, and safehouse boundary presentation remain acceptance decisions under `OPEN-LAYOUT-001` through `OPEN-LAYOUT-004`; pre-operation planning/departure topology remains an acceptance decision under `OPEN-LAYOUT-005`. Their recorded recommendations may drive reversible layout trials. The old sparse/fenced four-block compound, `54×38`, `84×60` nine-block, and `96×72` experiments are not valid substitutes.

## 7. Inputs from other systems

- [[11 Level 0 Vertical Slice Contract]] supplies the current mission phase, pause ownership, and ordinary-control requirement.
- `Level0LayoutContract` supplies walkable and blocked surfaces, district boundaries, entrances, interaction anchors, terminal ownership, and authored hiding or blending contexts.
- [[46 Facts, Dossier, Minimap & Terminals]] supplies which devices, locations, facts, and coverage are known and therefore inspectable.
- [[42 Surveillance, Security & Civilian Behavior]] supplies truthful coverage and current network state; movement never receives a hidden safest-route answer from it.
- [[45 HUD & Information Architecture]] and authored overlays supply focus ownership and contextual interaction affordances.
- [[80 Day-Night Cycle]] supplies whether the simulation is running or paused.

## 8. Effects on other systems

- World position and facing determine physical discovery, interaction eligibility, line of sight, exposure, entrance use, and authored hiding or blending entry.
- Explicit interaction may advance the mission, acquire a fact or mission object, open one terminal, begin dialogue, enter a context, or perform a safehouse action only through that target's contract.
- Observation exposes known information without advancing time, movement, patrols, cameras, drone behavior, or mission state.
- Movement during unpaused play advances the operation clock normally and may place the protagonist into visible surveillance or civilian contexts.
- Route and context choices contribute authored values to `Level0OutcomeLedger`; movement itself grants no XP or generic reward.

## 9. UI, world, audio, and George feedback

- A valid interaction target has a contextual affordance that names the action; an unavailable target names the blocker.
- Invalid movement gives a short reason and, where appropriate, a reachable marker without implying that a route will be chosen automatically.
- Solid boundaries, entrances, sidewalks, alleys, crossings, and context entrances must be visually readable at normal play zoom.
- Observation strengthens already-discovered coverage into exact known geometry while keeping unknown devices hidden.
- Movement, collision, interaction, and Observation open/close use authored audio families from [[49 Audio]].
- George may explain a blocked action or answer one authored contextual question from verified knowledge. He cannot issue movement, interact, or reveal an unknown route or device.

## 10. Failure, recovery, and Restart Attempt behavior

- A blocked destination is movement feedback, not a run failure. The player recovers by issuing a new direct input; the game does not silently reroute them.
- Returning from HUD or overlay focus restores world input without consuming a click that would also move the protagonist.
- Observation cannot be used to let recovery timers, searches, patrols, cameras, or the deadline advance; all are paused together.
- Movement and interaction may expose the player to authored surveillance, interception, Health, Paranoia, capture, or deadline consequences, but those systems own the resulting failure.
- Restart Attempt restores the operation-departure snapshot and departure anchor defined by [[44 Safehouse, Save & Restart Attempt]], with no post-departure movement or interaction state retained.

## 11. Content-authoring requirements

- Author the `Level0LayoutContract` as the accepted semantic/spatial record for the four-block district boundary, three traversal loops, walkable and blocked surfaces, roads, sidewalks, alleys, crossings, service zones, building footprints, entrances, safehouse boundary, contacts, terminals, surveillance anchors, contexts, and objectives. The mission skeleton owns required functions; detailed geometry must agree with the requester-accepted same-master Blender composition.
- Give every consequential interactable a stable identity, world anchor, eligibility rule, explicit action, unavailable reason, success transition, and player feedback.
- Author only gameplay-serving city structure: traversable mass, cover from observation, hazards, cameras, entrances, pickups or mission objects, safehouse functions, active contacts, and semantic surface treatment.
- Validate both primary timings, a no-contact route, interaction reachability, and camera/actor readability before locking the unresolved layout and movement values.

## 12. Edge cases and prohibited shortcuts

- No A*, click queue, automatic door traversal, path preview that implies execution, threat-aware steering, hidden safest path, or automatic correction around surveillance.
- No automatic pickup, proximity handoff, proximity objective completion, or overlay click leaking into world movement.
- Observation cannot move the player, use a terminal, acquire a fact, change surveillance, or reveal an undiscovered camera or route. It has no authored human vignettes or Paranoia reward.
- Solid geometry must agree across collision, visible world edges, interaction reachability, and surveillance occlusion.
- A focus transition must not require or consume a sacrificial click before WASD or click control works again.
- Retired `54×38` sparse/fenced four-block, `84×60` nine-block, `96×72`, and nine-isolated-building layouts are not valid defaults. The current four-block mission envelope is a later approved replacement, not a restoration of the rejected compound.

## 13. Removed behavior

- `GDR-REM-003`: A*, path preview, threat-aware routing, and automatic door traversal.
- `GDR-MOV-003`: hidden safest-path logic, threat-aware steering, and automatic route choice.
- `GDR-REM-008`: the rejected compound map, vehicles, and parcel-streaming dependencies.
- `GDR-REM-012`: player-facing F1 help or a Level 0 codex.
- Automatic pickups and proximity completion superseded by `GDR-INT-001`.

## 14. Post-MVP extensions

- Complex interiors are postponed by `GDR-POST-004`; Level 0 movement and interaction cannot depend on them or imply that current doors lead to shallow placeholder interiors.
- No A*, automated route planning, vehicle movement, or additional movement mode is approved as a Post-MVP promise. Any such proposal requires a new recorded decision and its own player-agency review.

## 15. Human-play acceptance examples

- `AC-L0-001`: create a character, regain world control, use both click and WASD, interact with Lira, and reach the first decision in under three minutes without a focus-loss click.
- `AC-L0-002` through `AC-L0-004`: traverse dusk, curfew, and no-contact routes through ordinary direct controls, with no hidden routing or automatic interaction.
- Open Observation during an active camera or patrol cycle, pan and inspect known state, then close it; protagonist, clock, patrol, camera, and drone state must remain unchanged.
- Compare a discovered camera in normal play and Observation; subtle light/reflection warnings and exact coverage must derive from the same geometry, including solid-geometry blind spots.
- Recover medkits, hand them to Lira, and validate transit only through explicit in-range interactions.
- `AC-L0-018`: repeat movement, interaction, Observation, dialogue return, and HUD focus transitions at 1280x720, 1440x900, and 1920x1080 with readable world geometry and no input leak.

## 16. Owning Linear ticket

`T3` (`GET-203`) owns outdoor runtime movement, interaction, Observation, layout integration, time, and persistence primitives. `T8` (`GET-208`) and `T8A` (`GET-212`) own surveillance geometry and context eligibility consumed here; `T9` (`GET-209`) owns inspection/HUD/focus presentation; `T10` (`GET-210`) owns authored mission interactions and end-to-end acceptance.
