---
status: MVP
type: mechanic
tags: [paranoia]
canonical: true
---

# Paranoia

## 1. Player fantasy and purpose

Paranoia represents physiological and cognitive stress from being watched, pursued, physically harmed, and forced into dangerous decisions. It makes surveillance consequential while preserving absolute trust in the game's facts and interface.

The player fantasy is not “my perception is unreliable.” It is “I can feel the cost of remaining functional while the threat is real.” Paranoia narrows the protagonist's practical margin through visible deterministic penalties. It never alters truth, secretly changes surveillance geometry, or punishes the player for failing to distinguish authored reality from deception.

## 2. Player-visible verbs

Read the current value/threshold/cause; reduce exposure; complete a credible difficult surveillance escape; use vending-machine coffee on Transit Road; use the shrine near the Market Ring/Outer Space junction; return to the safehouse and rest; choose whether to continue under penalty.

The player cannot consume a generic calming item, wait in open space for passive decay, click a reassurance button, or exploit repeatable conversation. Recovery is attached to a named safe action or a one-shot authored event.

## 3. Starting state and prerequisites

New Level 0 runs begin at 0/100. Paranoia is always visible in the protagonist lane. The system requires an initialized player, current value, threshold-derived penalty, source ledger, and authored recovery guards.

The current value, penalty tier, latest communicated source, and any crossed threshold announcements are persisted. The presentation derives from this authoritative record; it does not keep a second animated “stress” value that could disagree with checks or failure.

## 4. Complete happy-path behavior

Observed rule-breaking surveillance concern raises Paranoia with an explicit source; ordinary public visibility does not. The player breaks contact and recovers through a credible context, and the first qualifying difficult escape may remove five. If stress remains high, checks show the penalty. The two grounding actions each cost ten world minutes and remove ten once; safehouse Rest costs 30 minutes and removes 40. The debrief records peak value and significant causes/recoveries.

Example: while shared surveillance evidence says a camera, verifier, or pursuer is validly observing the protagonist, Paranoia rises over time and names that source. The surveillance state owns the deterministic exposure window; the render loop does not apply stress. When evidence breaks, gain stops immediately. Exact rate, overlap, sampling, and caps remain `OPEN-PAR-001`. After the player completes a difficult authored recovery, the approved or provisional recovery event applies once. A later check displays the resulting threshold penalty as part of its exact math.

## 5. State model and transitions

| Range | Check penalty | Meaning |
|---:|---:|---|
| 0–39 | 0 | Managed stress |
| 40–69 | −1 | Significant impairment |
| 70–89 | −2 | Severe impairment |
| 90–99 | −3 | Critical medical risk |
| 100 | fatal | Medical collapse |

George announces the first crossing of 40, 70, and 90 once per attempt; repeated movement around a threshold does not repeat that line. The numeric bar/penalty remains continuously truthful.

| Event class | Valid source example | Ledger behavior | Invalid shortcut |
|---|---|---|---|
| Surveillance exposure | Valid visibility plus an observed restricted breach, protected interaction, medkit removal, failed verification, or detected feed change; or Pursuit evidence | Deterministic source-owned deltas with stable observation/rule-break identity | Gain from ordinary public visibility, every render frame, an unseen source, or after evidence breaks |
| Physical consequence | Authored Health loss or dangerous escape | Apply alongside the named Health/time consequence | Generic combat damage or ambient chip stress |
| Story shock | Explicit authored revelation | One event with visible cause | Random spike or false information |
| Difficult escape | First qualifying surveillance escape | `−5` once per attempt | Waiting in open space or farming one context |
| Transit Road coffee | Explicit vending-machine grounding action | `−10`, `+10` world minutes, once per attempt | Proximity, repeat use, or dialogue substitute |
| Junction shrine | Explicit shrine grounding action | `−10`, `+10` world minutes, once per attempt | Proximity, repeat use, or dialogue substitute |
| Safehouse Rest | Confirmed safe action | `−40`, clamped, plus `+30` minutes | Boundary crossing or passive safe-zone decay |

## 6. Rules and tuning values

- Range 0–100, always named `Paranoia`.
- Approved penalties above apply to every deterministic check.
- Sources: a valid observed surveillance rule break or Pursuit evidence, Health consequence, dangerous escape/capture outcome, and authored story shock. Ordinary public visibility and Suspicious/Pursuit labels alone do not create an unowned duplicate gain.
- No passive curfew gain.
- No passive outdoor decay.
- Safehouse rest: −40, +30 minutes, once per confirmed action.
- Vending-machine coffee on Transit Road and the shrine near the Market Ring/Outer Space junction each cost `10` world minutes, remove `10` Paranoia, and work once per attempt. Dialogue never removes Paranoia.
- The first qualifying difficult surveillance escape removes `5` Paranoia once per attempt.
- Event amounts/rates remain acceptance decisions under `OPEN-PAR-001`; its recorded recommendation may be trialed as replaceable authored data.
- Every change stores stable event/source IDs, signed amount, before/after values, world minute, feedback key, Restart Attempt treatment derived from whether `OperationAttemptBaseline` exists, and any newly crossed penalty thresholds.

## 7. Inputs from other systems

Surveillance rule-break evidence; Pursuit events; Health changes; interception outcomes; story events; safehouse actions; the two grounding definitions; the qualifying difficult escape; Restart Attempt.

Every producer supplies a stable event ID, source, signed amount, world minute, feedback key, and Restart Attempt treatment. Paranoia does not infer events by polling camera overlap, HUD animation, curfew phase, or dialogue text.

## 8. Effects on other systems

Applies visible check penalty; can trigger fatal failure; informs George, HUD, dossier timeline, outcome ledger, Lira/debrief, and safehouse decision-making. It never changes camera geometry or creates hidden detection bonuses.

Checks consume the current penalty at resolution and record the exact value used. The outcome ledger stores peak Paranoia and significant authored causes/recoveries for debrief; it does not treat a high value as moral failure. At 100 the resource owner emits `failure.paranoia` and no later system may convert that attempt into capture, completion, or recovery.

## 9. UI, world, audio, and George feedback

HUD shows value, range, penalty, and latest cause without diagnostic clutter. Changes use restrained color/audio and concise text. George may identify the verified cause and recovery options and speaks once at 40, 70, and 90; his dialogue never directly lowers Paranoia.

## 10. Failure, recovery, and Restart Attempt behavior

100 causes an exact fatal medical-collapse failure. Restart Attempt restores the value, source history, one-use grounding/escape guards, and threshold-announcement history in `OperationAttemptBaseline` and discards later changes. Recovery cannot reduce below 0 or be repeatedly farmed from the same authored event.

If a single event crosses multiple thresholds, feedback reports the applied amount and final penalty without firing contradictory repeated banners. If Restart Attempt restores a value already above a threshold, the HUD shows the correct penalty but does not replay historical crossing feedback. New Game resets value, source history, peak, and one-shot recovery guards.

## 11. Content-authoring requirements

Every source/recovery defines stable event ID, trigger, amount/rate, cap, cooldown/one-shot rule, player-facing reason, audio/visual cue, George response, dossier wording, localization, and Restart Attempt treatment.

Authors must also declare whether the event can coincide with a Health/time cost, which system emits it, and how duplicate dispatch is rejected. Exact gain assignments for `OPEN-PAR-001` remain provisional until human pacing review; approved recovery amounts/locations and threshold announcements are not provisional.

## 12. Edge cases and prohibited shortcuts

No false clues, hallucinations, fake UI, control inversion, hidden modifiers, random spikes, passive curfew gain, outdoor walking decay, consumable relief, dialogue relief, generic reassurance button, ordinary-visibility gain, or duplicated gain from one event across systems.

No percentage accuracy/detection modifier, camera concern multiplier, actor-speed change, color-only critical warning, negative value, value above 100, duplicate threshold announcement, or debrief inference from the final value alone.

## 13. Removed behavior

`Pressure`; Calm/Watched/Panicked labels; accuracy/detection percentages; SPECIAL influence; Street-Tension input; night drift; passive decay; CalmTabs/Nicotine; recoverable breakdown; combat modifiers.

## 14. Post-MVP extensions

Additional authored stressors and recovery relationships may be added. Dishonest perception remains prohibited at every scope.

Future campaign content may make recovery socially or materially costly and may remember significant stress history. It may not restore `Pressure`, hallucination mechanics, hidden penalties, consumable farming, or a generic mental-health morality score without a new explicit design decision.

## 15. Human-play acceptance examples

- Ordinary public camera visibility causes no gain; an observed declared rule break raises Paranoia and names both sources.
- Crossing 40 visibly changes an authored check by exactly −1.
- Curfew passage without observation causes no gain.
- Safehouse rest advances time, restores Health, and subtracts exactly 40.
- Each grounding action advances ten minutes, subtracts exactly ten once, and cannot be repeated; the first qualifying difficult escape subtracts exactly five once.
- George speaks exactly once per attempt at each first 40/70/90 crossing.
- Reaching 100 produces the correct failure and Restart Attempt state.
- One Suspicious transition cannot double-charge Paranoia through camera, network, HUD, and audio listeners.
- A check at 69 and the same check after crossing to 70 show the exact change from `−1` to `−2`, with no hidden modifier.
- Restart Attempt from a high-stress failed attempt restores the departure value, source history, and penalty exactly and clears later events.

## 16. Owning Linear ticket

`T7` (`GET-207`) owns resource/check/save behavior; `T8A` (`GET-212`) owns surveillance-source gating and the difficult-escape event; `T9A` (`GET-213`) owns exact check/George presentation; `T10A` (`GET-214`) owns the two grounding actions and threshold content under `T10` (`GET-210`).
