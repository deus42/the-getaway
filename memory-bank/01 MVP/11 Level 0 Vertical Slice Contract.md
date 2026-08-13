---
status: MVP
type: vertical-slice-contract
level: 0
---

# Level 0 Vertical Slice Contract

This is the authoritative player-experience contract for Level 0. [[13 Level 0 Content and State Matrix]] defines the stable beat IDs, facts, gates, states, and acceptance cases. A technically reachable route is insufficient; the mission must be understandable, intentional, and engaging through normal player controls.

## Player promise

In 15–20 minutes, an American expatriate playing one chosen cover of themselves, with a private AI companion, helps Lira recover confiscated medical supplies, learns how Hidzu Corporation's city watches people, optionally documents a Cold Iron logistics connection, and validates passage toward Miami before midnight. The protagonist seeks Miami to investigate their missing father and Operation Cold Iron; Hidzu Corporation does not consider them a problem when Level 0 begins.

The player must feel vulnerable but capable. Their strength comes from preparation, perception, social understanding, systems knowledge, composure, and movement—not military power or fantasy technology.

## Journey at a glance

| Chapter | Player intention | Authoritative transition | Proof of completion |
|---|---|---|---|
| New Game | Choose who they were before tonight. | Confirming the playable cover creates the run; the three disabled covers cannot confirm. | The cover, its three abilities, and the persisted identity agree with the Character screen. |
| Safehouse | Understand the Miami lead and available planning actions. | Explicit world control begins at 18:30 inside the safehouse boundary. | Player can move, inspect, consult George, and see unavailable actions with reasons. |
| Lira | Accept a humane operation with a credible deadline and reward. | Exact dialogue acceptance enters preparation. | Medkits, two timing contexts, midnight, and passage are understood. |
| Preparation | Decide whether more knowledge is worth the time and travel. | Optional Naila/Brant facts are recorded, or consciously skipped. | Both, either, and neither-contact states remain viable. |
| Departure | Commit one deterministic attempt. | George reads back the real departure time, contacts, the Paranoia tier, held abilities, and restoration meaning; confirmation creates `OperationAttemptBaseline`. | Baseline contains the complete departure state and no later outcome. |
| Infiltration | Read and cross the reference-native mission neighborhood. | Explicit route actions move the run into the logistics-site sequence. | Dusk/public and curfew/service routes use normal controls and truthful surveillance. |
| Recovery | Operate the cache and choose whether to investigate. | Explicit terminal use releases medkits; optional manifest inspection can recognize and then copy the evidence. | Mission object and evidence state cannot change through proximity; copying costs exactly five world minutes. |
| Escape | Break the network's evidence chain. | Clear/Suspicious/Pursuit resolves through line of sight, direction, context, or authored interception. | The network searches only observed evidence and never hidden true position; a full return to `Clear` resets recognition. |
| Return | Honor the bargain and make outcomes legible. | Explicit medkit handoff issues the credential. | Lira responds only to actual facts and ledger outcomes. |
| Validation | Secure the route before midnight. | Explicit outbound-terminal validation completes the deadline condition. | Deadline failure is disabled only after handoff and validation are both true. |
| Debrief | Understand cost, evidence, and future consequence. | Factual dossier/debrief reads stable ledgers and opens progression. | Contacts, route, trace, pursuit, the Paranoia record, evidence, and timing are correct. |
| Close | Decide whether to remain or end. | `Continue Exploring` or `End Demo`. | No placeholder Miami load and no second Level 0 mission. |

## Starting state

- Map: outdoor Level 0 Tokyo district.
- Location: inside the authored safehouse boundary.
- Time: 18:30.
- Network: `Clear`.
- Hidzu Corporation concern/recognition: none.
- Paranoia: 0 — the Calm tier, full ability set lit.
- Mission: not yet accepted.
- Known locations: safehouse and Lira meeting point.
- Known devices: none unless physically visible from the starting context.
- Save: a new autosave is created after cover-select and Level 0 initialization.
- George: available as the recovered private AR orb and limited to opening context and controls.

## 1. Cover-select

New Game opens cover-select before the world begins.

- Four authored covers of the one protagonist are presented with names and one-paragraph fictions.
- The Level 0 playable cover is social-forward; the other three render honestly as disabled future selections.
- Each cover lists its three starting abilities with plain-language meanings and `fragile`/`hardened` tags.
- No number appears anywhere in the flow; there is nothing to allocate and nothing to type.
- Confirmation shows the cover summary and creates the Level 0 run in seconds.

There is no numeric allocation, free-text naming, class, package, perk tree, loadout selection, faction alignment, or weapon selection.

## 2. Safehouse opening

The player begins inside a clearly readable safehouse boundary at 18:30.

- George identifies the immediate objective: leave the safehouse and meet Lira.
- George states that the current goal is passage to Miami to investigate the protagonist's father and Cold Iron; he does not claim that Hidzu Corporation has already flagged the protagonist.
- Contextual onboarding teaches click-to-move, WASD, interaction, pause ownership, and George access without a separate tutorial screen.
- The safehouse exposes rest, safe waiting, Character, dossier, George consultation, and the outbound terminal. Transit validation is visible but unavailable until Lira supplies the credential.
- The player may inspect these actions before departure; unavailable actions explain why.
- The safehouse is an outdoor-readable planning threshold in the quarter behind the hero neighborhood, not a loading door to an unimplemented interior. Its visual boundary, world collision, surveillance behavior, and action availability must agree.

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

The mechanical order is fixed—briefing and optional preparation precede the immutable `OperationAttemptBaseline`. [[32 GET-205 Reference-Native Layout Contract]] fixes the v6 physical seed for the safehouse, Lira, Naila, Brant, and departure anchors; the player may visit either, both, or neither optional contact without forced backtracking. The exact seed remains reversible under `OPEN-LAYOUT-007` until plan/greybox approval, but implementation may not create the baseline before optional preparation is complete.

## 5. Two primary timings

### Dusk/public route

- Available before 22:00.
- Uses the public delivery entrance and authored civilian/service activity.
- Emphasizes observation, dialogue, credible behavior, and social blending.
- Brant's fact identifies the safest window and expected conduct.
- Ordinary visibility in public camera coverage is harmless while the network is `Clear`; concern begins only when a camera or Needle observes a declared rule break.
- At 18:45, the transit shelter/public queue is credibly populated within its visible seated and standing capacity; it winds down after 21:30 and is inactive as a blending context at curfew.

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
- In normal play, discovered camera risk is readable only through subtle status light, IR glint, and restrained authored wet-pavement reflections. Observation shows the exact discovered coverage from the same device state and geometry.
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
- Needle's visible lamp is warm-white or restrained amber during neutral patrol, crimson only during active verification or Pursuit, and returns to neutral when that state ends.
- The drone cannot be fought, looted, or disabled by a fantasy gadget.
- Civilians may glance or shift slightly in response to visible camera attention, Needle, or visible player behavior. They never know hidden network state and never report the player.

## 9. Hiding and blending

Hiding uses discrete authored physical contexts such as service recesses, stair shadows, maintenance bays, and transit structures. Blending uses authored social contexts such as delivery activity, waiting civilians, or a public queue.

- Darkness alone is not a universal hiding state.
- A hiding context cannot be entered while directly observed.
- A blending context requires behavior credible for that context.
- `blend.public_queue` is the transit shelter. Its exact authored bench capacity is two or three visible seats with a separate standing capacity; runtime population never exceeds either envelope or claims an unavailable seat.
- Each unavailable state explains why it cannot currently be used.
- Successful recovery is earned through timing and state change, not an invisible cooldown while standing anywhere.

Level 0 authors exactly one pedestrian verification-lane commitment. Queue rails, floor arrows, and an eye-height illuminated instruction panel explain direction and incomplete-processing consequence before entry. A valid cover receives the exact previewed verdict. Leaving after commitment but before completion creates the previewed `Suspicious` incomplete-verification event and never instant capture. It must not read as a vehicle checkpoint.

## 10. Medkit cache and optional manifest

- The cache-locker terminal communicates its single function before use.
- The medkits require explicit interaction and become a mission object, not a managed inventory stack.
- The nearby manifest is optional and uses the explicit `ColdIronEvidenceState` chain: `unknown → naila_warning → manifest_recognized → manifest_copied`.
- Naila's warning guarantees recognition of its Cold Iron significance; without the warning, the authored recognition gate is previewed with its verdict and exact reason.
- Recognition never copies the manifest automatically. Copying is a separate explicit interaction that advances the clock by exactly five world minutes and requires no additional check.
- Failure to recognize the connection changes only evidence and future understanding; it never blocks medkit recovery.
- Copied evidence updates the dossier, George, Lira's debrief, the outcome ledger, and the future Miami handoff. The general `FactLedger` remains binary and does not gain universal rumor/confirmed/leverage grades.

## 11. Interception and noncombat consequence

Level 0 contains no tactical combat mode.

When intercepted, the player receives a short deterministic confrontation. Options appear only when supported by held lit abilities, facts, and fiction. The authored gate families are social, insight, composure, evasion, and physical escape.

- Requirements and likely costs are visible before selection.
- Success may cost Paranoia, time, or a named consequence.
- Every nonterminal failure commits a declared worse-but-real path through time, Paranoia, position, access, or network state. Only the final failed capture-escape gate may end the attempt.
- There is no attack grid, weapon selection, enemy HP loop, AutoBattle, EMP, takedown ability, or magical gadget.

## 12. Return, transit, and debrief

1. Leave the logistics site.
2. Resolve any Suspicious or Pursuit state.
3. Explicitly return the medkits to Lira.
4. Receive dialogue reflecting contacts, timing, cameras, drone, pursuit, Paranoia, and optional evidence.
5. Receive the outbound transit credential.
6. Return to the safehouse.
7. Use the outbound terminal before midnight.
8. Enter debrief and recovery.
9. Choose `Continue Exploring` or `End Demo`.

Once the medkits are returned and transit is valid, the operation deadline can no longer fail the completed run. Continue Exploring does not load Miami or create additional Level 0 missions.

The debrief is a deterministic reading of the outcome ledger. It distinguishes contacts consulted or skipped; dusk or curfew timing; camera set unused, active, clean, or traced; peak network state; Needle verification; successful hiding or blending; interception; the peak Paranoia tier; Cold Iron evidence state; medkit return; transit validation; and deadline margin. Missing ledger evidence produces omission or an explicit unknown—not invented praise, blame, or narration.

## 13. Paranoia and recovery

There is no Health meter. The single condition resource is Paranoia; authored physical consequences cost world minutes, raise Paranoia, or end in capture (`GDR-HLT-004`).

- Internal range 0–100; always presented as the named tier and always named `Paranoia`.
- Calm (0–39): full ability set lit.
- Uneasy (40–69): abilities tagged `fragile: uneasy` lock, each naming the tier as its reason.
- Shaken (70–89): all `fragile` abilities lock; `hardened` abilities hold.
- Breaking (90–99): locks persist and George's warnings shorten.
- 100: breakdown — the protagonist stages a surrender, freeze, or bolt and the attempt ends (`failure.breakdown`).
- Rises only from visible authored surveillance, pursuit, physical consequences, dangerous escape/capture outcomes, and story shocks.
- Does not passively rise from curfew.
- Does not passively decay while walking or waiting outside.
- Safehouse rest removes 40 and advances time 30 minutes.
- Vending-machine coffee on Transit Road and the shrine near the Market Ring/Outer Space junction each cost ten world minutes, remove ten Paranoia, and work once per attempt.
- Dialogue does not remove Paranoia. The first qualifying difficult surveillance escape may remove five Paranoia once per attempt.
- George warns once per attempt at the first entry into Uneasy, Shaken, and Breaking.

Every change communicates its source; no number is shown in normal play.

## 14. Time and safehouse

- Start: 18:30.
- Normal exploration rate: 30×.
- Curfew: 22:00.
- Idempotent street changes occur at 21:00, 21:30, 22:00, and 23:30 through PA announcements, shutters, thinning crowds, lighting, and the last-train cadence. Each boundary fires once even across pause, save, and restoration.
- The same transit-shelter camera proves the schedule contrast at 18:45, after 21:30, and curfew. Environment plates remain people-free; all occupants are runtime-owned.
- Recurring world screens keep one job each: transit departures/civic time, verification procedure/verdict/manual review, and a two-line normal-zoom Hidzu Corporation sector advisory derived only from eligible known state.
- Hard deadline: 00:00 while either medkit return or transit validation remains incomplete.
- Dialogue, menus, Character, dossier, observation, terminals, debrief, completion, and failure pause time and autonomous simulation.
- Safe waiting advances in confirmed 30-minute steps.
- Recovery rest advances 30 minutes and removes 40 Paranoia.
- The safehouse is the autosave point, planning hub, recovery location, research location, George consultation point, and outbound terminal location.
- Research converts a declared fact plus world minutes into one new ability, once per option (`GDR-RPG-010`).
- Before operation departure, George reads back the actual departure time, contacts consulted or skipped, the Paranoia tier, held abilities, and exactly what Restart Attempt will restore. The player then confirms or cancels.
- Exact safehouse entry and action availability while directly observed, `Suspicious`, or `Pursuit` is blocked by `OPEN-SAFE-001`. Crossing the boundary may never be implemented as an undocumented surveillance reset.

## 15. Deterministic gates

Every gate declares its context, ability path, fact path, costed path, lock interaction, success, and fail-forward result.

A gate passes when the player holds the designated lit ability or the designated fact, or accepts its declared costed path (`GDR-RPG-009`).

- No random roll and no arithmetic anywhere.
- Before every choice, the verdict is visible as met or not met with its exact reason — the missing ability, the locking tier, the missing fact, or the cost.
- Locked options remain visible with the exact reason.
- Resolution explains which ability, fact, tier, or cost caused the result; preview and result use the identical verdict.
- Every authored gate keeps at least two real solutions; every nonfatal catalog entry declares and applies a real fail-forward effect.
- A fact may reveal, clarify, unlock, or guarantee only a designated authored outcome; facts are not generic currency.
- The exact gate catalog and ability mapping remain acceptance decisions under `OPEN-ABL-001`. Only its recorded recommendation may be used as reversible provisional authored data until accepted.

## 16. Failure and Restart Attempt

The run fails when:

- Paranoia reaches 100 and the protagonist breaks down — staging a surrender, freeze, or bolt (`failure.breakdown`);
- the player is captured after an authored confrontation failure;
- midnight arrives while either the medkit return or outbound transit validation is incomplete.

Capture shows a short Hidzu Corporation incident report and map built only from real sightings, detected tampering, Needle verification, and capture evidence. Unseen route gaps remain disconnected. Midnight failure instead lists the unfinished medkit-return and/or transit-validation requirements and never claims capture. Breakdown stages its surrender and remains a simple, factual, evidence-limited explanation.

Each failure offers Restart Attempt only when a compatible `OperationAttemptBaseline` exists. `restartAttempt` restores the deterministic departure state recorded after George's readback and explicit confirmation; `restart_attempt_confirmation` owns that pause surface. New Game clears all Level 0 state. The Level 0 persistence schema is bumped, and stale development saves using the retired contract are rejected explicitly rather than partially migrated.

## 17. HUD and information

The persistent bottom dock is a fixed four-lane layout occupying 16–18% of the viewport:

1. knowledge minimap;
2. protagonist;
3. George;
4. current quest beat.

The continuous read-only Paranoia slider, current named tier, and ability states are always visible with no numeric readout (`GDR-UI-005`). The slider position follows the exact internal value and marks the tier thresholds without becoming a player control. The minimap reveals only known information. The current-task and George lanes remain separate. The quest lane shows one current beat; George uses the canonical orb in both HUD and near-character forms and has one live authored sentence or prompt, not a generic chat box or human portrait bust. George always explains why he lacks useful information; silence is never hidden gameplay information, and Level 0 gives him no personal desire or deletion arc. Dialogue, Character, dossier, feed, debrief, failure, and completion overlays share one visual language and pause simulation.

## 18. World and presentation

- One dense reference-native outdoor Tokyo mission neighborhood: life street up-left, controlled HIDZU street up-right, a real gate and tower, safehouse quarter behind camera, logistics depth beyond the gate, and one service/sneak bypass. [[32 GET-205 Reference-Native Layout Contract]] owns exact v6 geography.
- Full outer loop target: two to three minutes.
- Normal play uses the requester-approved close street-first frame; maximum manual zoom-out reaches the complete mission-neighborhood overview. The v6 camera derives from the accepted reference-native plan greybox rather than inherited GET-204 constants.
- Runtime projection: 64×32, 2:1 isometric.
- The requester-owned Neo Tokyo 2 pack is recomposed from named source assets in one Blender 5.0.1 master; project-authored gap fills are limited to public realm and gameplay needs. The approved AI-assisted concept guides composition, camera, and value but never substitutes for production geometry.
- The locked blend's value/massing/proportion/source relationship is authoritative, but its AI-generated rooftop garnish and baked figures are not. Production roofs may be quieter; every retained prop has named Neo Tokyo 2 or project-authored gameplay/public-realm provenance.
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
- the pedestrian verification lane's readable instruction, valid pass, manual-review state, and premature-exit `Suspicious` result without vehicle framing or instant capture;
- Needle's neutral amber/warm-white state, crimson verification/Pursuit state, and return to neutral;
- same-camera transit-shelter population at 18:45, after 21:30, and curfew with exact visible seated/standing capacity and runtime-owned people;
- transit, verification, and sector-advisory display roles at normal zoom in both languages, including truthful empty/error state and no hidden-fact leak;
- both one-use grounding actions, the one difficult-escape relief, one George announcement at each first tier entry, and all four idempotent street-clock boundaries;
- breakdown, capture, and midnight failures plus Restart Attempt;
- capture reports with disconnected unseen gaps and cause-specific deadline/breakdown screens;
- cover-select with three disabled covers, Character screen, deterministic gates, tier locks, research, dossier, dialogue, debrief, and both languages;
- preview/result verdict parity, at least two proven solutions per authored gate, and a real fail-forward result for every nonterminal failed gate;
- the three named routes, three ambient sound locations, and actor tint transitions;
- no debug-only completion, automatic pickup, teleport, direct state mutation, console/page/save/objective error, visual corruption, fantasy presentation, or oversized HUD.

The exact action/expected-state cases live in [[13 Level 0 Content and State Matrix]].
