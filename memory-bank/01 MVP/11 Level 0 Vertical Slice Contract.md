---
status: MVP
type: vertical-slice-contract
level: 0
---

# Level 0 Vertical Slice Contract

This is the authoritative player-experience contract for Level 0. [[13 Level 0 Content and State Matrix]] defines the stable beat IDs, facts, checks, states, and acceptance cases. A technically reachable route is insufficient; the mission must be understandable, intentional, and engaging through normal player controls.

## Player promise

In 15–20 minutes, an exposed American expatriate with a personal RPG build and a private AI companion helps Lira recover confiscated medical supplies, learns how Hidzu's city watches people, optionally uncovers a Cold Iron logistics connection, escapes the surveillance response, and validates passage toward Miami before midnight.

The player must feel vulnerable but capable. Their strength comes from preparation, perception, social understanding, systems knowledge, composure, and movement—not military power or fantasy technology.

## Starting state

- Map: outdoor Level 0 Tokyo district.
- Location: inside the authored safehouse boundary.
- Time: 18:30.
- Network: `Clear`.
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
- Contextual onboarding teaches click-to-move, WASD, interaction, pause ownership, and George access without a separate tutorial screen.
- The safehouse exposes rest, safe waiting, Character, dossier, George consultation, and the outbound terminal. Transit validation is visible but unavailable until Lira supplies the credential.
- The player may inspect these actions before departure; unavailable actions explain why.

## 3. Lira briefing

Lira explains:

- Hidzu seized medical supplies intended for vulnerable people;
- the supplies are held at a nearby Hidzu logistics site;
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
- Provides the fact that guarantees recognition of the Hidzu–Harrow manifest.
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
- Surveillance remains active; public space is not immunity.

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
- Observation cannot move the protagonist, operate a device, or change state.

## 7. Surveillance network

All Hidzu cameras and the single patrol drone share one network with three player-facing states:

1. `Clear`
2. `Suspicious`
3. `Pursuit`

### Clear

- No confirmed concern.
- Known cameras remain on the minimap.
- Sustained exposure or authored suspicious behavior can build concern.

### Suspicious

- Stores source and last-known position.
- Intensifies nearby camera attention.
- May dispatch the verifier drone.
- Raises Paranoia from a communicated cause.
- Remains recoverable by breaking observation and entering a credible authored hiding or blending context.

### Pursuit

- Begins after identity confirmation, continued exposure, drone verification, or failed checkpoint outcome.
- Searches last-known positions rather than reading true coordinates.
- Requires line-of-sight break, direction change, and an authored hiding or blending recovery.
- Returns to `Suspicious` before `Clear` after a successful escape.

Rendered camera coverage and detection use the same geometry. No device detects through solid geometry.

## 8. Cameras, terminal, and drone

- Every camera has readable facing, sweep, coverage, and current network state.
- Discovered coverage is subtly visible and strengthened in observation.
- Unknown cameras are not revealed by opening observation or the minimap.
- A camera can be avoided or temporarily looped only through its connected terminal.
- Systems enables the loop action.
- Weak OpSec leaves a trace and may move the network to `Suspicious` despite a successful loop.
- A loop cannot open doors, erase identity, disable the district, or affect unrelated devices.
- Exactly one unarmed patrol drone verifies Suspicious events at last-known positions and hiding areas.
- Drone approach and verification have clear audio/visual warnings.
- The drone cannot be fought, looted, or disabled by a fantasy gadget.

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
- The nearby manifest is optional.
- Naila's fact guarantees recognition of its Cold Iron significance.
- Without the fact, the authored Awareness check is shown with its exact requirement.
- Failure to recognize the connection changes only evidence and future understanding; it never blocks medkit recovery.
- Recognized evidence updates the dossier, George, Lira's debrief, the outcome ledger, and the future Miami handoff.

## 11. Interception and noncombat consequence

Level 0 contains no tactical combat mode.

When intercepted, the player receives a short deterministic confrontation. Options appear only when supported by the current build, facts, and fiction. The authored option families are dialogue/Influence, Insight, Composure, Evasion, and Physical escape.

- Requirements and likely costs are visible before selection.
- Success may cost Health, Paranoia, time, or a named consequence.
- Failure causes capture and mission failure.
- There is no attack grid, weapon selection, enemy HP loop, AutoBattle, EMP, takedown ability, or magical gadget.

## 12. Return, transit, and debrief

1. Leave the logistics site.
2. Resolve any Suspicious or Pursuit state.
3. Explicitly return the medkits to Lira.
4. Receive dialogue reflecting contacts, timing, cameras, drone, pursuit, injury, Paranoia, and optional evidence.
5. Receive the outbound transit credential.
6. Return to the safehouse.
7. Use the outbound terminal before midnight.
8. Enter debrief, recovery, and any earned level-up.
9. Choose `Continue Exploring` or `End Demo`.

Once the medkits are returned and transit is valid, the operation deadline can no longer fail the completed run. Continue Exploring does not load Miami or create additional Level 0 missions.

## 13. Health, Paranoia, and recovery

### Health

- Range 0–100; always visible.
- Changes only through authored physical consequences.
- No ambient chip damage or tactical damage simulation.
- Health 0 ends the run.
- Safehouse rest restores Health to 100.

### Paranoia

- Range 0–100; always visible and always named `Paranoia`.
- 0–39: no check penalty.
- 40–69: −1 to all checks.
- 70–89: −2 to all checks.
- 90–99: −3 to all checks.
- 100: fatal medical collapse.
- Rises only from visible authored surveillance, pursuit, injury, dangerous escape/capture outcomes, and story shocks.
- Does not passively rise from curfew.
- Does not passively decay while walking or waiting outside.
- Safehouse rest removes 40 and advances time 30 minutes.
- One trusted conversation and one difficult recovery may provide smaller authored relief.

Every change communicates its source and amount.

## 14. Time and safehouse

- Start: 18:30.
- Normal exploration rate: 30×.
- Curfew: 22:00.
- Hard deadline: 00:00 while either medkit return or transit validation remains incomplete.
- Dialogue, menus, Character, dossier, observation, terminals, debrief, completion, and failure pause time and autonomous simulation.
- Safe waiting advances in confirmed 30-minute steps.
- Recovery rest advances 30 minutes, restores Health, and removes 40 Paranoia.
- The safehouse is the autosave point, planning hub, recovery location, level-up location, George consultation point, and outbound terminal location.
- Exact safehouse entry and action availability while directly observed, `Suspicious`, or `Pursuit` is blocked by `OPEN-SAFE-001`. Crossing the boundary may never be implemented as an undocumented surveillance reset.

## 15. Deterministic RPG checks

Every check declares one attribute, one skill, a requirement, relevant facts, situational modifiers, success, and fail-forward result.

`attribute + skill − Paranoia penalty + authored modifier >= requirement`

- No random roll.
- Requirement is visible before selection.
- Locked options remain visible with the exact reason.
- Resolution explains which capability, fact, penalty, or condition caused the result.
- A fact may reveal, lower, unlock, or guarantee only a designated authored outcome; facts are not generic currency.
- Exact Level 0 requirements remain acceptance decisions under `OPEN-RPG-001`; exact stable-ID fact and situational modifiers are governed separately by `OPEN-RPG-004`. Only their recorded recommendations may be used as reversible provisional authored data until accepted.

## 16. Failure and Retry

The run fails when:

- Health reaches 0;
- Paranoia reaches 100;
- the player is captured after an authored confrontation failure;
- midnight arrives while either the medkit return or outbound transit validation is incomplete.

Failure states the exact cause and offers Retry from the operation-departure snapshot. Retry restores the deterministic state recorded when the player explicitly departed the safehouse for the operation. New Game clears all Level 0 state. Retired rewrite saves are rejected with an explanation and New Game action; they are never partially migrated.

## 17. HUD and information

The persistent bottom dock is a fixed four-lane layout occupying 16–18% of the viewport:

1. knowledge minimap;
2. protagonist;
3. George;
4. current quest beat.

Health and Paranoia are always visible. The minimap reveals only known information. The quest lane shows one current beat. George has authored prompts, not a generic chat box. Dialogue, Character, dossier, feed, debrief, failure, and completion overlays share one visual language and pause simulation.

## 18. World and presentation

- Continuous outdoor Tokyo district with three interlocking loops.
- Full outer loop target: two to three minutes.
- Normal outdoor zoom floor: 0.60.
- Runtime projection: 64×32, 2:1 isometric.
- Owned Neo Tokyo 2 pack is composed unchanged first, then selectively branded as Hidzu.
- Roads, sidewalks, curbs, alleys, crossings, entrances, public activity, hiding, and surveillance form the district.
- No decorative clutter.
- Graphic surveillance noir: readable midtones, strong ink silhouettes, cold institutional surfaces, sodium practical light, restrained cyan technology, crimson danger, and no fantasy-Neo styling.

## 19. Completion acceptance

Acceptance requires normal-control proof at 1280×720, 1440×900, and 1920×1080 for:

- both primary timings;
- both optional contacts and neither contact;
- fact-guaranteed, check-recognized, and missed manifest;
- Clear, Suspicious recovery, Pursuit escape, and drone verification;
- Health, Paranoia, capture, and midnight failures plus Retry;
- Character creation, Character screen, deterministic checks, level-up, dossier, dialogue, debrief, and both languages;
- no debug-only completion, automatic pickup, teleport, direct state mutation, console/page/save/objective error, visual corruption, fantasy presentation, or oversized HUD.

The exact action/expected-state cases live in [[13 Level 0 Content and State Matrix]].
