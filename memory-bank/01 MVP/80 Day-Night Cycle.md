---
status: MVP
type: system-specification
tags: [time, curfew, schedules, pause]
canonical: true
---

# Time, Curfew, and Authored Schedules

## 1. Player fantasy and purpose

Time creates a legible operation deadline and changes how the same city can be crossed. Four authored street moments make the accelerated clock felt through public behavior, sound, shutters, and light while menus and conversations never punish the player for reading. This implements `GDR-TIME-001` through `GDR-TIME-004` and consumes the approved population/display presentation in `GDR-CIV-002`, the bounded GET-205 mission-stage population in `GDR-CIV-003`, `GDR-SOC-003`, and `GDR-ART-015`.

## 2. Player-visible verbs

The player can:

- read current time, curfew status, and the midnight deadline;
- choose to begin infiltration during dusk or remain at the safehouse until curfew;
- wait at the safehouse in explicit 30-minute increments;
- rest at the safehouse for recovery at a declared 30-minute cost;
- inspect known schedule facts from contacts and the dossier;
- pause the simulation through dialogue, menus, character/dossier screens, observation, debrief, and failure overlays.

The player cannot freely scrub time, wait in unsafe public space through a hidden command, or reverse the clock.

## 3. Starting state and prerequisites

- Level 0 begins at `18:30` inside the outdoor safehouse boundary.
- Curfew begins at `22:00`.
- Midnight (`24:00`) is the hard operation deadline.
- Normal exploration advances world time at `30×` real time.
- The safehouse exposes explicit Wait and Rest actions.
- Schedule-sensitive world contexts and NPC states are authored against the shared world clock.
- Idempotent street boundaries are fixed at `21:00`, `21:30`, `22:00`, and `23:30`.

## 4. Complete happy-path behavior

1. The opening presents the current time and tells the player that curfew begins at 22:00 and outbound validation must occur before midnight.
2. After Lira’s briefing, the player may prepare and enter the logistics site while public/service activity is still present. At `18:45`, the transit shelter/public queue, delivery activity, and nearby restaurant edge make the public timing visibly inhabited.
3. If the player prefers the curfew route, they can return to or remain at the safehouse and advance time deliberately.
4. At 21:00 and 21:30, announcements, shutters, crowds, screens, and sound begin the authored wind-down. After `21:30`, the same public corner visibly contrasts with its `18:45` state without changing geometry or camera. At 22:00, curfew schedules and lighting take effect. At 23:30, the last-train/deadline cadence makes the remaining margin legible.
5. The mission clock continues during active exploration and pauses whenever a declared pause owner is active.
6. The player returns medkits to Lira and validates outbound transit before midnight.
7. Safehouse debrief and ending choice occur while simulation is paused and do not consume mission time.

## 5. State model and transitions

`WorldClockState` contains:

- current authored minute;
- phase: `dusk | blue-hour | curfew`;
- `curfewActive`;
- `deadlineReached`;
- active pause-owner set;
- authored schedule-state identifiers;
- last processed schedule boundary.

| Boundary | State effect |
|---|---|
| 18:30 | New run begins; dusk schedules active. |
| 20:00 | Blue-hour environment assets become authoritative after their complete set is ready; the prior dusk set crossfades out over 750 ms. |
| 21:00 | First PA/wind-down event and early shutter/crowd/sound changes fire once. |
| 21:30 | Second street wind-down step and route/civilian schedule changes fire once. |
| 22:00 | Curfew becomes active; curfew schedules, announcement, and aligned lighting state fire once. |
| 23:30 | Last-train/deadline street cadence and final civilian/service schedule step fire once. |
| 24:00 | If Lira hand-in and outbound validation are not both complete, the run fails. |

Pause ownership is additive. Time and autonomous simulation resume only when all pause owners release their reason.

Boundary history is persisted and restored. Advancing across a boundary, pausing on it, or hydrating on either side cannot fire that boundary more than once for the same attempt state.

## 6. Rules and tuning values

- Normal exploration rate: `30×`.
- Safehouse Wait step: `30` in-world minutes, confirmation required.
- Safehouse Rest: `30` in-world minutes, Paranoia `−40`, clamped at `0`.
- Each grounding action advances exactly `10` world minutes and removes `10` Paranoia once per attempt.
- Dialogue, menus, Character screen, dossier, observation, debrief, mission completion, mission failure, and Restart Attempt confirmation pause both clock and autonomous simulation.
- There is no passive Paranoia increase merely because curfew is active.
- Curfew changes authored schedules and legal/social context; it does not make every outdoor tile instantly hostile.
- The midnight check evaluates required completion state at the boundary and reports exactly what was not completed.
- Transition art uses aligned dusk, blue-hour, and curfew Cycles-baked asset sets from one immutable geometry/camera registration; it cannot swap building geometry or interaction anchors.
- Blue hour prefetches at 19:50 and curfew at 21:50. At the 20:00 and 22:00 phase boundaries, the prior complete set remains visible until the target set is complete, then crossfades over 750 ms.
- A direct wait/jump loads the actual target phase rather than replaying skipped art states. Restart Attempt or hydration rewind may request an earlier phase. Stale or failed loads never display partial layers, advance time, or alter schedule state.
- Specific route windows and pacing remain under `OPEN-TIME-001`; the four street boundaries themselves are approved and fixed.

## 7. Inputs from other systems

- [[44 Safehouse, Save & Restart Attempt]] owns Wait, Rest, `OperationAttemptBaseline`, and transit-validation access.
- [[70 Stealth]] consumes public/blending context schedules and curfew state.
- [[42 Surveillance, Security & Civilian Behavior]] consumes schedule states without owning the clock.
- [[46 Facts, Dossier, Minimap & Terminals]] supplies deadline-relevant completion state and known timing facts.
- [[90 Dialogue]] and all overlays acquire and release pause ownership.
- [[30 Art Direction (MVP)]] defines aligned visual states and motivated light behavior.

## 8. Effects on other systems

- Time selects dusk versus curfew infiltration context.
- Schedule boundaries activate or deactivate specific blending contexts, public activities, service access, contact availability, and surveillance behaviors.
- Deadline proximity changes objective copy, George warnings, audio announcements, and HUD urgency.
- Boundaries update route/civilian schedules and the spatial ambience at the Transit Road restaurant, Market Ring workshop, and safehouse-side apartment.
- Wait and Rest affect available mission time and are recorded in the deterministic world-clock event log; the outcome ledger retains only the final timing classification and deadline result.
- The final deadline determines mission failure independently of Paranoia.

## 9. UI, world, audio, and George feedback

- The clock is spatial through a few repeated civic anchors with stable jobs: the transit/bus-shelter departures board owns service/time, the pedestrian verification display owns procedure/verdict/manual review, one Hidzu advisory screen owns sector-scoped notices, and visible public clocks plus the last-train cadence reinforce time. Anchors stay sparse: the city is never an oversized HUD, and the strongest reading is passing the same display twice.

- The persistent HUD shows `HH:MM`, curfew state, and the deadline only when relevant.
- HUD/UI amber communicates time, objective urgency, and curfew. Environment amber remains confined to visible windows, entrances, and lamp falloff under `GDR-ART-012`; crimson is reserved for active danger, not the normal clock.
- Safehouse Wait and Rest previews state the resulting time and recovery before confirmation.
- The world crossfades aligned authored lighting states over 750 ms without moving geometry, showing a partial set, or causing a visible pop.
- 21:00, 21:30, 22:00, and 23:30 each have one distinct readable street change; 22:00 remains the curfew transition.
- At `18:45`, the transit shelter/public queue and delivery edge are visibly populated within authored capacity. After `21:30`, the same-camera corner shows departures, thinning queue/service activity, and changed screens without changing environment geometry or baking people into the plate.
- GET-205 v5 replaces random ambient allocation with the fixed three-person transit group and two seated café patrons. The transit group follows the existing populated/wind-down/inactive schedule and alone may support `blend.public_queue`; café patrons are presentation-only, and the absent delivery group keeps `blend.delivery_activity` unavailable. GET-208/T10 owns broader group behavior and delivery-population acceptance. Environment-state transitions never bake, duplicate, or leave behind people.
- George warns at authored thresholds before curfew and midnight, but does not repeat every minute or create a false emergency when the player is safe.
- A paused screen visibly indicates that time is stopped when ambiguity would otherwise matter.

## 10. Failure, recovery, and Restart Attempt behavior

- Reaching midnight without both returning the medkits to Lira and validating outbound transit causes `failure.deadline`.
- The failure overlay lists the exact unfinished requirement(s), never claims capture, and offers Restart Attempt from operation departure.
- Time spent after departure is discarded on Restart Attempt; `OperationAttemptBaseline` restores the exact departure time, preparation state, and boundary history.
- Safehouse Wait and Rest never bypass confirmation and never silently cross midnight. If the requested action would cross the deadline, the UI warns and requires confirmation or blocks it when completion is already impossible.
- Paused reading time cannot cause a schedule boundary, pursuit movement, or failure.

## 11. Content-authoring requirements

- Author schedule states for Lira, Naila, Brant, civilian groups, service activity, security, cameras, Needle availability, hiding/blending contexts, terminals, and public screens at all four boundaries. `blend.public_queue` uses the shelter's exact two seated plus one standing capacity and cannot remain active after its declared schedule closes. GET-205 displays only that fixed transit group plus two seated café patrons; it exposes explicit absent-population unavailability for `blend.delivery_activity` until GET-208 authors the delivery group.
- Author all four street moments and deadline warnings with equivalent English/Ukrainian semantics.
- Author distinct dusk, blue-hour, and curfew ambience and lighting layers aligned to the same layout and camera. Environment color comes from those authored states rather than a multiplicative full-city tint.
- GET-205 first authors identical-camera people-free environment layers plus separately rendered mission-stage actors: the fixed transit group, café patrons, public guard, and Needle. It records the transit context's active/occupied/closing/inactive states and the delivery context's absent-population state. GET-208/T10 later adds the delivery group, broader reactions/behavior, and complete populated-versus-wind-down acceptance plus the three display-role payloads.
- Author safehouse Wait/Rest copy with resulting time and recovery values.
- Author deterministic world-clock event IDs for waiting, resting, both grounding actions, 21:00, 21:30, 22:00, 23:30, and deadline crossing. `Level0OutcomeLedger` records only final primary timing and any `failure.deadline` result; it does not duplicate the full clock log.

## 12. Edge cases and prohibited shortcuts

- No background simulation while reading, choosing dialogue, selecting research, observing, or viewing a failure/debrief overlay.
- No real-world wall-clock dependence; all mission timing uses deterministic world-clock state.
- No passive curfew Paranoia gain.
- No unannounced time skips, automatic operation launch, or forced curfew transition for dramatic convenience.
- No duplicate boundary event after pause, autosave, hydration, or Restart Attempt restoration.
- No full sandbox calendar, shop hours, day rollover, fatigue, sleep cycle, hunger, or survival clock in Level 0.
- No supernatural night events, night-vision combat layer, or darkness that makes truthful camera geometry unreadable.

## 13. Removed behavior

Removed: accelerated full-day showcase, a briefing action that automatically jumps to curfew, daylight fixed only to setup, free-running simulation behind overlays, survival/fatigue recovery, shop calendars, missed-window day loops, general criminal-night difficulty, and passive curfew stress.

## 14. Post-MVP extensions

Post-MVP may add longer authored schedules, indoor schedule changes, additional days, travel windows, and more complex public activity. A full sandbox economy/calendar or survival simulation is not implied by this postponement.

## 15. Human-play acceptance examples

1. A first-time player begins at 18:30, understands curfew and midnight without opening debug tools, and chooses a timing intentionally.
2. Dialogue is left open for several real minutes; world time, camera sweep, and drone position remain unchanged.
3. The player waits twice at the safehouse and sees exactly one hour advance with the correct schedule update.
4. Cross 21:00, 21:30, 22:00, and 23:30 around pause/save restoration; each public/activity/sound/light change fires exactly once without moving buildings or objectives.
5. Rest previews and applies 30 minutes and 40 Paranoia recovery exactly once.
6. A midnight failure identifies whether Lira hand-in or outbound validation was missing and Restart Attempt restores the departure clock.
7. During GET-205, compare the same public-corner camera across environment states and prove the exact three-person transit group and two-person café group remain runtime-owned, nonstacked, capacity-honest, and correctly wind down; `blend.public_queue` follows actual occupancy and `blend.delivery_activity` remains unavailable. During GET-208/T10 acceptance, repeat it with the authored delivery group and broader behavior while display roles remain stable.

## 16. Owning Linear ticket

- Primary infrastructure: `T3` (`GET-203`) — Level 0 runtime and shared outdoor-layout contract.
- Mission integration: `T10` (`GET-210`) and `T10A` (`GET-214`) — clock moments, route/civilian schedules, grounding time costs, audio, onboarding, and end-to-end acceptance.
- Canonical decisions: `GDR-TIME-001` through `GDR-TIME-004`, `GDR-MIS-006`, `GDR-MIS-009`, `GDR-PAR-004`, `GDR-PAR-006`, and `GDR-AUD-002` in [[12 Game Design Decision Register]].
