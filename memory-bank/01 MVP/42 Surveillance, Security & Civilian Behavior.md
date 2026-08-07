---
status: MVP
type: system-specification
tags: [surveillance, security, civilians, drone]
canonical: true
---

# Surveillance, Security & Civilian Behavior

## 1. Player fantasy and purpose

The player survives a visible but fallible institutional network by understanding who and what can see an actual rule break, controlling what the network last knew, and behaving credibly in public space. Ordinary public visibility is harmless while `Clear`. Cameras, human security, civilians, and the named verifier drone Needle create recoverable pressure rather than omniscient pursuit or a combat encounter. This implements `GDR-SUR-001` through `GDR-SUR-010`, `GDR-CIV-001`, `GDR-STL-001` through `GDR-STL-003`, and `GDR-ESC-001` through `GDR-ESC-002`.

## 2. Player-visible verbs

- Observe camera facing, sweep, coverage, and current network state after discovery.
- Read authored human-security positions, verification behavior, and public activity.
- Avoid observation or use a connected terminal to attempt a temporary camera loop.
- Break line of sight, change direction, and enter an eligible authored hiding or blending context.
- Behave credibly within delivery activity or a public queue.
- Respond to Needle's authored hum, approach warning, and verification warning.
- Resolve an authored interception through a supported social, composure, evasion, or physical escape option.

## 3. Starting state and prerequisites

- The Level 0 surveillance network begins `Clear`.
- Hidzu Corporation has no recognition or concern about the protagonist at the start; ordinary public camera visibility alone cannot change that.
- No camera is known unless it is physically visible from the starting context or revealed by an approved fact.
- The protagonist begins in the safehouse boundary, outside active operation pursuit, with Paranoia `0`.
- The district contains exactly one unarmed patrol drone. Exact human-security and civilian counts, schedules, and placements are unresolved by `OPEN-SEC-001`, `OPEN-CIV-001`, and `OPEN-LAYOUT-003`.
- Camera looping requires the connected terminal and the designated technical ability. Hiding and blending require authored contexts and their declared eligibility rules.
- Safehouse entry and action behavior under direct observation, `Suspicious`, or `Pursuit` remains an acceptance decision under `OPEN-SAFE-001`; its recorded recommendation may be implemented provisionally, but the network cannot gain an undocumented boundary reset.

## 4. Complete happy-path behavior

1. The player discovers a camera, public group, security presence, entrance, or context through sight, contact information, or authored observation.
2. The world and knowledge surfaces show only the information legitimately discovered, using the same camera geometry that detection uses.
3. On the dusk/public timing, the player reads delivery activity and uses credible blending behavior; on the curfew/service timing, the player times camera coverage and discrete hiding positions.
4. A technical player may operate the connected terminal once per attempt. The designated technical ability enables a temporary loop; the supporting operational fact determines whether the persistent camera-group history becomes `clean` or `traced` after the active effect expires.
5. If a camera or Needle sees a declared rule break and concern reaches `Suspicious`, the game identifies both the observation and rule-break source, the last-known position, and the Paranoia cause. The player breaks observation and reaches a credible hiding or blending context.
6. If identity becomes confirmed, the network enters `Pursuit`. The player breaks sight, changes direction, and recovers through an authored context while cameras, security, and the drone search last-known evidence rather than true coordinates.
7. Successful Pursuit recovery returns through `Suspicious` before `Clear`. An interception, if reached, resolves through visible deterministic choices rather than combat.

## 5. State model and transitions

| From | Authored trigger | To | Required retained state |
|---|---|---|---|
| `Clear` | Valid camera/Needle visibility plus observed restricted-area breach, protected interaction, medkit removal, failed verification, or detected camera-feed change | `Suspicious` | `ObservationEvidence`, `SurveillanceRuleBreakEvidence`, last-known position, time |
| `Suspicious` | Credible unobserved recovery completes | `Clear` | Cleared source plus retained attempt history; recognition reset |
| `Suspicious` | Continued valid visibility paired with active rule-break evidence, failed verification, or Needle verification | `Pursuit` | Confirmed typed source, last-known position, time/confidence |
| `Pursuit` | Sight breaks but search is unresolved | `Pursuit` | Last-known evidence; update only when observed |
| `Pursuit` | Authored hiding or blending recovery succeeds | `Suspicious` | True position cleared; last-known history retained |
| Any | A valid observer sees a detected camera-feed change after the one-use loop | At least `Suspicious` | Raw observation, terminal source, typed rule break, and camera-group `traced` history |

The network never jumps directly from `Clear` to capture. Capture can occur only through the final failed capture-escape after valid evidence-driven escalation. The network never transitions from hidden true coordinates or through solid geometry.

## 6. Rules and tuning values

- All Hidzu Corporation cameras and the single verifier drone share the three player-facing states `Clear`, `Suspicious`, and `Pursuit`.
- Raw `ObservationEvidence` is geometry truth. Concern and surveillance Paranoia require both valid visibility and typed `SurveillanceRuleBreakEvidence`; public visibility without a rule break has no state/resource effect.
- Cameras and drone share truthful last-known evidence, not live protagonist coordinates.
- Rendered camera coverage and detection use identical geometry and respect solid occlusion. Normal geometry creates blind spots; no special off-grid zone exists.
- Every camera has readable facing, sweep, coverage, and current network state once discovered.
- Normal play uses subtle status LEDs, IR glints, and authored wet-pavement reflections; Observation shows exact discovered coverage.
- The unarmed drone is player-facing `Needle`, follows one authored patrol, and verifies `Suspicious` events at last-known positions and hiding areas. It cannot be fought, looted, or disabled by a fantasy gadget.
- Level 0 has one camera set, temporarily looped only from its connected terminal and usable once per attempt. History transitions `unused → active → clean|traced`; active duration remains unresolved in `OPEN-SUR-004`, but the final history persists until Restart Attempt.
- The designated technical ability enables the loop action. Looping without the supporting operational fact leaves an explicit trace as its declared cost; when a valid observer detects that feed change, the paired typed rule break may set the network to at least `Suspicious` even though the loop succeeds.
- Hiding and blending use discrete authored contexts. Darkness alone is not hiding; hiding cannot begin under direct observation; blending requires behavior credible for that social context.
- Exact concern rate, Pursuit confirmation tuning, search/recovery timings, and loop duration remain acceptance decisions under `OPEN-SUR-001` through `OPEN-SUR-004`; their recorded recommendations may be trialed as replaceable authored state-machine data.
- Paranoia gains must come from communicated authored events; exact event amounts or sustained rates may use only the isolated reversible recommendation from `OPEN-PAR-001` until accepted.
- Capture is an approved failure outcome, but its exact fiction may use only the reversible `OPEN-NAR-012` recommendation until accepted; no alternative is invented in interception content.
- Reaching or crossing the safehouse boundary does not authorize an implicit network transition. Exact availability and continued-search behavior use the approved or explicitly provisional `OPEN-SAFE-001` rule.
- Returning fully to `Clear` resets recognition, so ordinary public visibility becomes harmless again until another observed rule break.
- Civilians react only to visible camera attention, Needle, or visible player behavior with small glances or movement. They never know hidden network state and never report the player.

## 7. Inputs from other systems

- [[41 Movement, Interaction & Observation]] supplies protagonist position, facing, line-of-sight breaks, direction changes, explicit interactions, and full-pause Observation.
- `Level0LayoutContract` supplies camera and security anchors, solid occlusion, network relationships, drone launch/search regions, entrances, and authored hiding or blending contexts.
- [[46 Facts, Dossier, Minimap & Terminals]] supplies camera discovery, network facts, terminal ownership, and the knowledge boundary.
- [[92 Character & Progression]] supplies the held abilities that gates consult.
- [[60 Paranoia]] supplies the current Paranoia tier and records communicated surveillance stress.
- [[80 Day-Night Cycle]] supplies dusk, curfew, clock, and shared pause state.
- Naila and Brant facts supply only their designated topology, terminal, timing, and behavior effects.

## 8. Effects on other systems

- Network transitions may add authored Paranoia with an explicit cause and amount.
- Terminal use records `cameraGroupHistory` as `unused`, `active`, `clean`, or `traced` in attempt/outcome state.
- Surveillance records `networkPeak`, `needleVerified`, typed rule-break sources, used hiding or blending context IDs, and any authored `interceptionOutcome`.
- Known camera, hiding, and blending facts update Observation, minimap, dossier, George, objectives, and debrief only through their designated effects.
- Unresolved `Pursuit` blocks the Lira medkit handoff. Capture enters `L0_FAILED`.
- Public activity and security schedules determine the credibility of dusk blending and curfew service movement without arbitrary bonuses. Civilians are presentation-only mirrors of visible events.

## 9. UI, world, audio, and George feedback

- World rendering shows subtle camera status light/glint/reflection in normal play and exact discovered facing/sweep/coverage in Observation; both use detection geometry.
- `Suspicious` uses an amber network change, names the source direction and last-known event, and communicates the Paranoia cause.
- `Pursuit` uses a crimson state change plus clear camera, security, and drone warnings focused on the last-known position.
- Needle has one recognizable hum and distinct approach and verification warnings before confirmation.
- Hiding or blending prompts name eligibility and explain direct observation, behavior, fact, gate, or state blockers.
- George may summarize verified source, last-known evidence, known context eligibility, and authored recovery choices. He cannot reveal the protagonist's hidden safety, an unknown camera, or the best route.
- Surveillance, drone, transition, consequence, and curfew cues come from [[49 Audio]] and cannot be the only carrier of critical state.

## 10. Failure, recovery, and Restart Attempt behavior

- `Suspicious` is recoverable by breaking observation and entering or maintaining a credible authored hiding or blending context.
- `Pursuit` recovery requires line-of-sight break, direction change, and authored hiding or blending. It returns to `Suspicious`, then `Clear`; no invisible anywhere-cooldown clears it.
- A failed final authored interception option causes `failure.capture`, naming the confirming actor or system and the player's decision.
- Interception options show their deterministic requirement and likely Paranoia, time, or named consequence before selection.
- Restart Attempt restores time, Paranoia, facts, map knowledge, and mission state from `OperationAttemptBaseline`, then reconstructs the baseline `Clear` network/device/context runtime from versioned layout and generation data. No Pursuit, trace, camera use, or other post-departure outcome survives Restart Attempt; within a live attempt, clean/traced camera history never disappears.
- Safehouse arrival during active surveillance follows the approved or explicitly provisional `OPEN-SAFE-001` rule; it cannot silently clear evidence, stop a search, autosave over danger, or grant recovery.

## 11. Content-authoring requirements

- Human-security count, roles, schedules, and verification coverage may use only the replaceable authored recommendation from `OPEN-SEC-001` until accepted; the resulting set must make both timings credible without creating combat.
- Civilian count, schedules, group behavior, and blending cadence may use only the replaceable authored recommendation from `OPEN-CIV-001` until accepted; the resulting content must support public-route blending and small visible-event reactions without reporting or hidden-state knowledge.
- Author at minimum `hide.service_recess`, `hide.maintenance_bay`, `hide.transit_structure`, `blend.delivery_activity`, and `blend.public_queue` using the complete context schema in [[13 Level 0 Content and State Matrix]].
- Every camera needs a stable ID, shared group ID, anchor, facing, sweep, exact shared coverage/detection geometry, discovery rule, normal-play light/reflection treatment, and connected-terminal relation.
- Needle needs one authored patrol plus launch/search regions, last-known search behavior, hiding-area verification behavior, hum, approach/verification warnings, and noncombat exit behavior.
- Every interception node must declare supported options, exact deterministic requirements, previewed costs, success outcome, fail-forward or capture result, and factual debrief effect.
- Capture prose and presentation may use the explicit reversible `OPEN-NAR-012` recommendation; while open, only the mechanical rule that a final failed authored option causes capture and run failure is final.

## 12. Edge cases and prohibited shortcuts

- No device, guard, or drone sees through solid geometry or reads the hidden live player position.
- No concern or Paranoia from ordinary public visibility without a typed observed rule break, and no special off-grid privacy zone.
- No unknown camera appears because Observation, George, or the minimap was opened.
- No direct `Clear`-to-capture transition; only the final failed capture-escape after valid escalation may end the attempt through capture.
- No universal darkness hiding, hiding while directly observed, or blending without context-credible behavior.
- No passive curfew Paranoia, passive outdoor recovery, universal footstep-noise simulation, or noise-lure ability.
- Camera looping cannot be repeated in one attempt, return to `unused` after expiry, open doors, erase identity, disable the district, affect unrelated devices, or bypass the declared trace cost.
- Public space is not immunity from observed rule breaks. Civilians are authored social contexts and presentation-only visible-event mirrors, not reporters, hidden-state sensors, a simulated crowd, or generic cover bonus.
- Security verifies and intercepts; it does not enter a tactical or automatic combat loop.
- No safehouse boundary immunity or undocumented `Suspicious`/`Pursuit` reset.

## 13. Removed behavior

- The prior `Unseen`, `Searching`, `Alarmed`, and `Combat` escalation model; the approved network is only `Clear`, `Suspicious`, and `Pursuit`.
- `GDR-REM-004`: AP combat, AutoBattle, combat cover, overwatch, suppression, targeted shots, weapons, and enemy-HP loops.
- `GDR-REM-005`: EMPs, noise-lure abilities, breaching charges, magic hacking, and unrelated remote-device control.
- `GDR-REM-009`: witness/gossip simulation and procedural storylets.
- Armed or lootable drones, omniscient pursuit, universal stealth toggles, and any-dark-tile hiding.

## 14. Post-MVP extensions

- `GDR-POST-005` postpones advanced drone and security behavior until the one-verifier Level 0 loop is accepted.
- Expanded manual confrontation is postponed by `GDR-POST-002`; Level 0 contains only short authored deterministic outcomes.
- Broader faction or reputation systems are not dependencies of surveillance behavior and remain outside Level 0.

## 15. Human-play acceptance examples

- `AC-L0-002`: consult Brant and use dusk delivery activity; visible civilian behavior must make blending readable without making public space safe by default.
- `AC-L0-003`: consult Naila, use the connected terminal after curfew, and prove both a clean loop and the explicit traced-loop consequence.
- `AC-L0-008`: trigger `Suspicious`, see source and last-known feedback, recover through a credible context, and return to `Clear`.
- `AC-L0-009`: trigger `Pursuit`, break sight, change direction, hide, and confirm the network searches the old position before returning through `Suspicious`.
- `AC-L0-010`: allow drone verification and confirm a strong warning precedes understandable escalation.
- `AC-L0-011` and `AC-L0-012`: resolve one supported interception and fail one unsupported/final choice with visible deterministic logic and no combat mode.
- `AC-L0-019`: exercise the safehouse boundary while observed, Suspicious, and in Pursuit; prove the accepted action gates and continued network behavior without a free reset.
- `AC-L0-020` through `AC-L0-023`: prove harmless public observation, all five rule-break triggers, geometry blind spots, one-use/persistent camera history, recognition reset, Needle warnings, and civilian reactions limited to visible events.
- `AC-L0-018`: inspect `Clear`, `Suspicious`, `Pursuit`, camera coverage, civilians, security, and drone states at every target viewport without visual corruption or HUD dependence.

## 16. Owning Linear ticket

`T8` (`GET-208`) owns the base surveillance, human-security, civilian, hiding, verifier-drone, and noncombat-interception framework. `T8A` (`GET-212`) owns rule-break evidence, harmless public observation, blind spots, camera presentation/history, Needle, recognition reset, civilian reactions, and surveillance Paranoia gating. `T3` (`GET-203`) supplies layout/runtime primitives; `T7` (`GET-207`) supplies gates, Paranoia, and Restart Attempt data; `T9` (`GET-209`) supplies knowledge and feedback surfaces; `T10` (`GET-210`) supplies authored mission content and end-to-end acceptance.
