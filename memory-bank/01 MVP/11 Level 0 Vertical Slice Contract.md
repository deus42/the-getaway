---
status: MVP
type: vertical-slice-contract
level: 0
---

# Level 0 Vertical Slice Contract

This is the authoritative player-experience contract for Level 0. [[13 Level 0 Content and State Matrix]] defines the stable beat IDs, facts, checks, states, and acceptance cases. A technically reachable route is insufficient; the mission must be understandable, intentional, and engaging through normal player controls.

## Player promise

In 15–20 minutes, an American expatriate with a personal RPG build and a private AI companion helps Lira recover confiscated medical supplies, learns how Hidzu Corporation's city watches people, optionally documents a Cold Iron logistics connection, and validates passage toward Miami before midnight. The protagonist seeks Miami to investigate their missing father and Operation Cold Iron; Hidzu Corporation does not consider them a problem when Level 0 begins.

The player must feel vulnerable but capable. Their strength comes from preparation, perception, social understanding, systems knowledge, composure, and movement—not military power or fantasy technology.

## Journey at a glance

| Chapter | Player intention | Authoritative transition | Proof of completion |
|---|---|---|---|
| New Game | Create somebody worth carrying forward. | Valid callsign, appearance, attributes, and skills create the run. | Build summary agrees with the Character screen and persisted identity. |
| Safehouse | Understand the Miami lead and available planning actions. | Explicit world control begins at 18:30 inside the safehouse boundary. | Player can move, inspect, consult George, and see unavailable actions with reasons. |
| Lira | Accept a humane operation with a credible deadline and reward. | Exact dialogue acceptance enters preparation. | Medkits, two timing contexts, midnight, and passage are understood. |
| Preparation | Decide whether more knowledge is worth the time and travel. | Optional Naila/Brant facts are recorded, or consciously skipped. | Both, either, and neither-contact states remain viable. |
| Departure | Commit one deterministic attempt. | George reads back the real departure time, contacts, Health, Paranoia, and restoration meaning; confirmation creates `OperationAttemptBaseline`. | Baseline contains the complete departure state and no later outcome. |
| Infiltration | Read and cross the four-block district. | Explicit route actions move the run into the logistics-site sequence. | Dusk/public and curfew/service routes use normal controls and truthful surveillance. |
| Recovery | Operate the cache and choose whether to investigate. | Explicit terminal use releases medkits; optional manifest inspection can recognize and then copy the evidence. | Mission object and evidence state cannot change through proximity; copying costs exactly five world minutes. |
| Escape | Break the network's evidence chain. | Clear/Suspicious/Pursuit resolves through line of sight, direction, context, or authored interception. | The network searches only observed evidence and never hidden true position; a full return to `Clear` resets recognition. |
| Return | Honor the bargain and make outcomes legible. | Explicit medkit handoff issues the credential. | Lira responds only to actual facts and ledger outcomes. |
| Validation | Secure the route before midnight. | Explicit outbound-terminal validation completes the deadline condition. | Deadline failure is disabled only after handoff and validation are both true. |
| Debrief | Understand cost, evidence, and future consequence. | Factual dossier/debrief reads stable ledgers and opens progression. | Contacts, route, trace, pursuit, Health loss, Paranoia, evidence, and timing are correct. |
| Close | Decide whether to remain or end. | `Continue Exploring` or `End Demo`. | No placeholder Miami load and no second Level 0 mission. |

## Starting state

- Map: outdoor Level 0 Tokyo district.
- Location: inside the authored safehouse boundary.
- Time: 18:30.
- Network: `Clear`.
- Hidzu Corporation concern/recognition: none.
- Health: 100.
- Paranoia: 0.
- Mission: not yet accepted.
- Known locations: safehouse and Lira meeting point.
- Known devices: none unless physically visible from the starting context.
- Save: a new autosave is created after character creation and Level 0 initialization.
- George: available, private, and limited to opening context and controls.

## 1. Character creation

New Game opens character creation before the world begins.

- Choose a callsign.
- Choose one of four authored visual presets.
- Physical, Mental, Social, and Technical begin at 1.
- Distribute four additional attribute points; creation cap 3, long-term cap 5.
- Stealth, Evasion, Awareness, Composure, Insight, Influence, Systems, and OpSec begin at 0.
- Distribute six skill points; creation cap 2, long-term cap 5.
- The screen previews derived Health/Paranoia presentation and the kinds of checks affected, without exposing inactive combat or equipment statistics.
- Confirmation shows a concise build summary and creates the Level 0 run.

There is no fixed name, background choice, class, package, perk tree, loadout selection, faction alignment, or weapon selection.

## 2. Safehouse opening

The player begins inside a clearly readable safehouse boundary at 18:30.

- George identifies the immediate objective: leave the safehouse and meet Lira.
- George states that the current goal is passage to Miami to investigate the protagonist's father and Cold Iron; he does not claim that Hidzu Corporation has already flagged the protagonist.
- Contextual onboarding teaches click-to-move, WASD, interaction, pause ownership, and George access without a separate tutorial screen.
- The safehouse exposes rest, safe waiting, Character, dossier, George consultation, and the outbound terminal. Transit validation is visible but unavailable until Lira supplies the credential.
- The player may inspect these actions before departure; unavailable actions explain why.
- The safehouse is an outdoor-readable planning threshold within the four-block district, not a loading door to an unimplemented interior. Its visual boundary, world collision, surveillance behavior, and action availability must agree.

## 3. Lira briefing

Lira explains:

- Hidzu Corporation seized medical supplies intended for vulnerable people;
- the supplies are held at a nearby Hidzu Corporation logistics site;
- the public delivery entrance remains active before curfew;
- the service side becomes more useful after curfew;
- curfew begins at 22:00;
- outbound transit must be validated before midnight;
- successful return earns passage toward Miami.

The player explicitly accepts the operation. The conversation records exact choices but does not choose a class, grant arbitrary rewards, or start combat.

## 4. Optional preparation

Naila and Brant are optional contacts. Both remain reachable before and after mission acceptance until authored schedule limits say otherwise.

### Naila

- Explains the local camera network topology.
- Identifies the camera-loop terminal relationship.
- Provides the `Naila warning` state in the Cold Iron evidence chain; that warning guarantees recognition if the player later inspects the manifest.
- Does not remotely hack devices or grant a generic bonus.

### Brant

- Explains delivery behavior and service timing.
- Identifies the most credible public delivery window and expected civilian behavior.
- Improves objective precision and blending clarity.
- Does not grant a disguise item, reputation, or arbitrary buff.

The mission remains completable after consulting both, one, or neither.

The mechanical order is fixed—briefing and optional preparation precede the immutable operation-departure snapshot—but the exact physical loop between safehouse, Lira, contacts, and the departure action remains unresolved in `OPEN-LAYOUT-005`. Implementation may not invent a forced backtracking route or create the snapshot before optional preparation is complete.

## 5. Two primary timings

### Dusk/public route

- Available before 22:00.
- Uses the public delivery entrance and authored civilian/service activity.
- Emphasizes observation, dialogue, credible behavior, and social blending.
- Brant's fact identifies the safest window and expected conduct.
- Ordinary visibility in public camera coverage is harmless while the network is `Clear`; concern begins only when a camera or Needle observes a declared rule break.

### Curfew/service route

- Available after 22:00.
- Uses the service alley and discrete hiding positions.
- Emphasizes camera timing, terminal use, the verifier drone, hiding, and last-known-position escape.
- Naila's facts clarify the connected terminal and network layout.
- Curfew itself does not passively increase Paranoia.

Both timings remain viable without their associated contact. Missing information changes clarity or deterministic requirements, never the existence of the route.

## 6. Movement and observation

- Click-to-move is direct movement toward the selected point, not A*.
- WASD is a fully supported equivalent input.
- A new click or keyboard direction immediately replaces the prior movement intent.
- Collision sliding keeps wall and corner movement natural.
- The game never chooses the safest route or steers around threats.
- Invalid destinations provide a short reason and a reachable marker where appropriate.
- Returning focus from any HUD or overlay never consumes a sacrificial movement click.
- Observation is a full pause. The player may pan and inspect known devices, coverage, entrances, contacts, hiding/blending positions, objectives, facts, and one authored George prompt.
- In normal play, discovered camera risk is readable only through subtle status light, IR glint, and authored reflections. Observation shows the exact discovered coverage from the same geometry.
- Observation cannot move the protagonist, operate a device, or change state.

## 7. Surveillance network

All Hidzu Corporation cameras and the single patrol drone share one network with three player-facing states:

1. `Clear`
2. `Suspicious`
3. `Pursuit`

### Clear

- No confirmed concern.
- Known cameras remain on the minimap.
- Ordinary public visibility creates no concern or Paranoia.
- Concern requires visibility plus one observed rule break: restricted-area breach, protected interaction, medkit removal, failed verification, or detected camera-feed change.
- Returning fully to `Clear` resets recognition; later ordinary public visibility is harmless until another observed rule break.

### Suspicious

- Stores source and last-known position.
- Intensifies nearby camera attention.
- May dispatch the verifier drone.
- Raises Paranoia from a communicated cause.
- Remains recoverable by breaking observation and entering a credible authored hiding or blending context.

### Pursuit

- Begins after continued valid visibility paired with active rule-break evidence, failed verification, or Needle verification.
- Searches last-known positions rather than reading true coordinates.
- Requires line-of-sight break, direction change, and an authored hiding or blending recovery.
- Returns to `Suspicious` before `Clear` after a successful escape.

Rendered camera coverage and detection use the same geometry. Ordinary solid geometry and occlusion create blind spots; no special off-grid zone or privacy layer exists. No device detects through solid geometry.

## 8. Cameras, terminal, and drone

- Every camera has readable facing, sweep, coverage, and current network state.
- Discovered coverage is subtly visible and strengthened in observation.
- Unknown cameras are not revealed by opening observation or the minimap.
- Level 0 has one connected camera set. It can be avoided or temporarily looped only through its connected terminal, and the loop action is usable once per attempt.
- Systems enables the loop action.
- Weak OpSec leaves a trace and may move the network to `Suspicious` despite a successful loop.
- The active loop may expire, but its `clean` or `traced` history persists until Restart Attempt; the group cannot return to `unused` during the same attempt.
- A loop cannot open doors, erase identity, disable the district, or affect unrelated devices.
- Exactly one unarmed verifier drone, player-facing name `Needle`, follows one authored patrol and verifies Suspicious events at last-known positions and hiding areas.
- Needle has a recognizable hum plus distinct approach and verification warnings.
- The drone cannot be fought, looted, or disabled by a fantasy gadget.
- Civilians may glance or shift slightly in response to visible camera attention, Needle, or visible player behavior. They never know hidden network state and never report the player.

## 9. Hiding and blending

Hiding uses discrete authored physical contexts such as service recesses, stair shadows, maintenance bays, and transit structures. Blending uses authored social contexts such as delivery activity, waiting civilians, or a public queue.

- Darkness alone is not a universal hiding state.
- A hiding context cannot be entered while directly observed.
- A blending context requires behavior credible for that context.
- Each unavailable state explains why it cannot currently be used.
- Successful recovery is earned through timing and state change, not an invisible cooldown while standing anywhere.

## 10. Medkit cache and optional manifest

- The cache-locker terminal communicates its single function before use.
- The medkits require explicit interaction and become a mission object, not a managed inventory stack.
- The nearby manifest is optional and uses the explicit `ColdIronEvidenceState` chain: `unknown → naila_warning → manifest_recognized → manifest_copied`.
- Naila's warning guarantees recognition of its Cold Iron significance; without the warning, the authored Awareness check is previewed with its exact math.
- Recognition never copies the manifest automatically. Copying is a separate explicit interaction that advances the clock by exactly five world minutes and requires no additional check.
- Failure to recognize the connection changes only evidence and future understanding; it never blocks medkit recovery.
- Copied evidence updates the dossier, George, Lira's debrief, the outcome ledger, and the future Miami handoff. The general `FactLedger` remains binary and does not gain universal rumor/confirmed/leverage grades.

## 11. Interception and noncombat consequence

Level 0 contains no tactical combat mode.

When intercepted, the player receives a short deterministic confrontation. Options appear only when supported by the current build, facts, and fiction. The authored option families are dialogue/Influence, Insight, Composure, Evasion, and Physical escape.

- Requirements and likely costs are visible before selection.
- Success may cost Health, Paranoia, time, or a named consequence.
- Every nonterminal failure commits a declared worse-but-real path through time, Paranoia, Health, position, access, or network state. Only the final failed capture-escape choice may end the attempt.
- There is no attack grid, weapon selection, enemy HP loop, AutoBattle, EMP, takedown ability, or magical gadget.

## 12. Return, transit, and debrief

1. Leave the logistics site.
2. Resolve any Suspicious or Pursuit state.
3. Explicitly return the medkits to Lira.
4. Receive dialogue reflecting contacts, timing, cameras, drone, pursuit, Health loss, Paranoia, and optional evidence.
5. Receive the outbound transit credential.
6. Return to the safehouse.
7. Use the outbound terminal before midnight.
8. Enter debrief, recovery, and any earned level-up.
9. Choose `Continue Exploring` or `End Demo`.

Once the medkits are returned and transit is valid, the operation deadline can no longer fail the completed run. Continue Exploring does not load Miami or create additional Level 0 missions.

The debrief is a deterministic reading of the outcome ledger. It distinguishes contacts consulted or skipped; dusk or curfew timing; camera set unused, active, clean, or traced; peak network state; Needle verification; successful hiding or blending; interception; Health loss; Paranoia peak; Cold Iron evidence state; medkit return; transit validation; and deadline margin. Missing ledger evidence produces omission or an explicit unknown—not invented praise, blame, or narration.

## 13. Health, Paranoia, and recovery

### Health

- Range 0–100; always visible.
- Changes only through authored physical consequences.
- No ambient chip damage or tactical damage simulation.
- Health 0 ends the run.
- Safehouse rest restores Health to 100.
- Health does not create an injury state, limp, movement penalty, or civilian reaction. Consequences remain authored Health changes with factual feedback.

### Paranoia

- Range 0–100; always visible and always named `Paranoia`.
- 0–39: no check penalty.
- 40–69: −1 to all checks.
- 70–89: −2 to all checks.
- 90–99: −3 to all checks.
- 100: fatal medical collapse.
- Rises only from visible authored surveillance, pursuit, physical consequences, dangerous escape/capture outcomes, and story shocks.
- Does not passively rise from curfew.
- Does not passively decay while walking or waiting outside.
- Safehouse rest removes 40 and advances time 30 minutes.
- Vending-machine coffee on Transit Road and the shrine near the Market Ring/Outer Space junction each cost ten world minutes, remove ten Paranoia, and work once per attempt.
- Dialogue does not remove Paranoia. The first qualifying difficult surveillance escape may remove five Paranoia once per attempt.
- George warns once per attempt when Paranoia first crosses 40, 70, and 90.

Every change communicates its source and amount.

## 14. Time and safehouse

- Start: 18:30.
- Normal exploration rate: 30×.
- Curfew: 22:00.
- Idempotent street changes occur at 21:00, 21:30, 22:00, and 23:30 through PA announcements, shutters, thinning crowds, lighting, and the last-train cadence. Each boundary fires once even across pause, save, and restoration.
- Hard deadline: 00:00 while either medkit return or transit validation remains incomplete.
- Dialogue, menus, Character, dossier, observation, terminals, debrief, completion, and failure pause time and autonomous simulation.
- Safe waiting advances in confirmed 30-minute steps.
- Recovery rest advances 30 minutes, restores Health, and removes 40 Paranoia.
- The safehouse is the autosave point, planning hub, recovery location, level-up location, George consultation point, and outbound terminal location.
- Before operation departure, George reads back the actual departure time, contacts consulted or skipped, Health, Paranoia, and exactly what Restart Attempt will restore. The player then confirms or cancels.
- Exact safehouse entry and action availability while directly observed, `Suspicious`, or `Pursuit` is blocked by `OPEN-SAFE-001`. Crossing the boundary may never be implemented as an undocumented surveillance reset.

## 15. Deterministic RPG checks

Every check declares one attribute, one skill, a requirement, relevant facts, situational modifiers, success, and fail-forward result.

`attribute + skill − Paranoia penalty + authored modifier >= requirement`

- No random roll.
- Before every choice, the exact breakdown is visible in the form `needs N — you have M (Attribute A + Skill B − Paranoia P + authored/fact modifiers)`.
- Locked options remain visible with the exact reason.
- Resolution explains which capability, fact, penalty, or condition caused the result.
- Preview and result use the same deterministic breakdown; every nonfatal catalog entry declares and applies a real fail-forward effect.
- A fact may reveal, lower, unlock, or guarantee only a designated authored outcome; facts are not generic currency.
- Exact Level 0 requirements remain acceptance decisions under `OPEN-RPG-001`; exact stable-ID fact and situational modifiers are governed separately by `OPEN-RPG-004`. Only their recorded recommendations may be used as reversible provisional authored data until accepted.

## 16. Failure and Restart Attempt

The run fails when:

- Health reaches 0;
- Paranoia reaches 100;
- the player is captured after an authored confrontation failure;
- midnight arrives while either the medkit return or outbound transit validation is incomplete.

Capture shows a short Hidzu Corporation incident report and map built only from real sightings, detected tampering, Needle verification, and capture evidence. Unseen route gaps remain disconnected. Midnight failure instead lists the unfinished medkit-return and/or transit-validation requirements and never claims capture. Health and Paranoia failures remain simple factual cause explanations.

Each failure offers Restart Attempt only when a compatible `OperationAttemptBaseline` exists. `restartAttempt` restores the deterministic departure state recorded after George's readback and explicit confirmation; `restart_attempt_confirmation` owns that pause surface. New Game clears all Level 0 state. The Level 0 persistence schema is bumped, and stale development saves using the retired contract are rejected explicitly rather than partially migrated.

## 17. HUD and information

The persistent bottom dock is a fixed four-lane layout occupying 16–18% of the viewport:

1. knowledge minimap;
2. protagonist;
3. George;
4. current quest beat.

Health and Paranoia are always visible. The minimap reveals only known information. The current-task and George lanes remain separate. The quest lane shows one current beat; George has one live authored sentence or prompt, not a generic chat box. George always explains why he lacks useful information; silence is never hidden gameplay information, and Level 0 gives him no personal desire or deletion arc. Dialogue, Character, dossier, feed, debrief, failure, and completion overlays share one visual language and pause simulation.

## 18. World and presentation

- Exactly four dense, continuous outdoor Tokyo mission blocks carrying three functional identities and three interlocking loops. This is not the rejected sparse/fenced four-block compound and not the rejected oversized nine-block board.
- Full outer loop target: two to three minutes.
- Normal play uses the requester-approved close street-first frame; maximum manual zoom-out reaches the composed four-block mission overview. Exact numeric values are calibrated and frozen from the accepted same-master GET-204 live candidate.
- Runtime projection: 64×32, 2:1 isometric.
- The requester-owned Neo Tokyo 2 pack is recomposed from named source assets in one Blender 5.0.1 master; project-authored gap fills are limited to public realm and gameplay needs. The approved AI-assisted concept guides composition, camera, and value but never substitutes for production geometry.
- Roads, sidewalks, curbs, alleys, crossings, entrances, public activity, hiding, and surveillance form the district.
- Stable traversal IDs keep localized player-facing names: `loop.public-contact` = **Transit Road**, `loop.logistics-service` = **Market Ring**, and `loop.outer-escape` = **Outer Space**.
- Authored threshold ambience comes from a Transit Road restaurant, Market Ring workshop, and safehouse-side apartment.
- Actors sample authored light regions at the foot anchor and ease a subtle semantic amber/cyan tint. This is presentation-only and never changes detection or movement.
- No decorative clutter.
- Graphic surveillance noir: readable midtones, strong ink silhouettes, cold institutional surfaces, sodium practical light, restrained cyan technology, crimson danger, and no fantasy-Neo styling.
- The accepted Blender master owns detailed visible geometry after its source/render gate. Collision, occlusion, entrances, device/context anchors, and runtime interaction must be back-propagated to agree with that geometry before live acceptance.

## 19. Completion acceptance

Acceptance requires normal-control proof at 1280×720, 1440×900, and 1920×1080 for:

- both primary timings;
- both optional contacts and neither contact;
- fact-guaranteed, check-recognized, and missed manifest;
- all four Cold Iron evidence states and the explicit five-world-minute copy action;
- Clear, Suspicious recovery, Pursuit escape, and drone verification;
- harmless ordinary public observation, every declared rule-break source, solid-geometry blind spots, one camera-set use, persistent clean/traced history, Clear recognition reset, Needle warnings, and presentation-only civilian reactions;
- both one-use grounding actions, the one difficult-escape relief, one George warning at each Paranoia threshold, and all four idempotent street-clock boundaries;
- Health, Paranoia, capture, and midnight failures plus Restart Attempt;
- capture reports with disconnected unseen gaps and cause-specific deadline/Health/Paranoia screens;
- Character creation, Character screen, deterministic checks, level-up, dossier, dialogue, debrief, and both languages;
- preview/result check-math parity and a real fail-forward result for every nonterminal failed check;
- the three named routes, three ambient sound locations, and actor tint transitions;
- no debug-only completion, automatic pickup, teleport, direct state mutation, console/page/save/objective error, visual corruption, fantasy presentation, or oversized HUD.

The exact action/expected-state cases live in [[13 Level 0 Content and State Matrix]].
