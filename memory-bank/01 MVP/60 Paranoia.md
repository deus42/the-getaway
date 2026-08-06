---
status: MVP
type: mechanic
tags: [paranoia]
canonical: true
---

# Paranoia

## 1. Player fantasy and purpose

Paranoia represents physiological and cognitive stress from being watched, pursued, injured, and forced into dangerous decisions. It makes surveillance consequential while preserving absolute trust in the game's facts and interface.

The player fantasy is not “my perception is unreliable.” It is “I can feel the cost of remaining functional while the threat is real.” Paranoia narrows the protagonist's practical margin through visible deterministic penalties. It never alters truth, secretly changes surveillance geometry, or punishes the player for failing to distinguish authored reality from deception.

## 2. Player-visible verbs

Read the current value/threshold/cause; reduce exposure; complete a credible hiding/blending recovery; seek one authored trusted conversation; return to the safehouse and rest; choose whether to continue under penalty.

The player cannot consume a generic calming item, wait in open space for passive decay, click a reassurance button, or exploit repeatable conversation. Recovery is attached to a named safe action or a one-shot authored event.

## 3. Starting state and prerequisites

New Level 0 runs begin at 0/100. Paranoia is always visible in the protagonist lane. The system requires an initialized player, current value, threshold-derived penalty, source ledger, and authored recovery guards.

The current value, penalty tier, latest communicated source, and any crossed threshold announcements are persisted. The presentation derives from this authoritative record; it does not keep a second animated “stress” value that could disagree with checks or failure.

## 4. Complete happy-path behavior

Visible surveillance concern raises Paranoia with an explicit source. The player breaks contact and recovers through a credible context, possibly earning small authored relief. If stress remains high, checks show the penalty. Safehouse rest costs 30 minutes and removes 40. The debrief records peak value and significant causes/recoveries.

Example: while shared surveillance evidence says a camera, verifier, or pursuer is validly observing the protagonist, Paranoia rises over time and names that source. The surveillance state owns the deterministic exposure window; the render loop does not apply stress. When evidence breaks, gain stops immediately. Exact rate, overlap, sampling, and caps remain `OPEN-PAR-001`. After the player completes a difficult authored recovery, the approved or provisional recovery event applies once. A later check displays the resulting threshold penalty as part of its exact math.

## 5. State model and transitions

| Range | Check penalty | Meaning |
|---:|---:|---|
| 0–39 | 0 | Managed stress |
| 40–69 | −1 | Significant impairment |
| 70–89 | −2 | Severe impairment |
| 90–99 | −3 | Critical medical risk |
| 100 | fatal | Medical collapse |

Threshold transitions are announced once per crossing and remain visible through the numeric bar/penalty.

| Event class | Valid source example | Ledger behavior | Invalid shortcut |
|---|---|---|---|
| Surveillance exposure | Sustained valid observation or Pursuit evidence | Deterministic source-owned exposure deltas with stable window/tick identity | Gain every render frame, from an unseen source, or after evidence breaks |
| Physical consequence | Authored injury or dangerous escape | Apply alongside the named Health/time consequence | Generic combat damage or ambient chip stress |
| Story shock | Explicit authored revelation | One event with visible cause | Random spike or false information |
| Difficult recovery | Valid hiding/blending recovery | One eligible recovery event | Waiting in open space or farming one context |
| Trusted conversation | Named authored contact moment | One eligible recovery event | Reopening dialogue repeatedly |
| Safehouse Rest | Confirmed safe action | `−40`, clamped, plus `+30` minutes | Boundary crossing or passive safe-zone decay |

## 6. Rules and tuning values

- Range 0–100, always named `Paranoia`.
- Approved penalties above apply to every deterministic check.
- Sources: sustained valid observation or Pursuit evidence, injury, dangerous escape/capture outcome, and authored story shock. Suspicious/Pursuit labels alone do not create an unowned duplicate gain.
- No passive curfew gain.
- No passive outdoor decay.
- Safehouse rest: −40, +30 minutes, once per confirmed action.
- Smaller recovery values remain acceptance decisions under `OPEN-PAR-002`; the replaceable provisional presets are trusted conversation `−10 once` and difficult successful recovery `−5 once`, enforced by stable event-ID idempotency and not yet attached to final mission content.
- Event amounts/rates remain acceptance decisions under `OPEN-PAR-001`; its recorded recommendation may be trialed as replaceable authored data.
- Every change stores stable event/source IDs, signed amount, before/after values, world minute, feedback key, Retry treatment derived from whether the departure snapshot already exists, and any newly crossed penalty thresholds.

## 7. Inputs from other systems

Surveillance transitions; exposure events; Health changes; interception outcomes; story events; safehouse actions; trusted conversations; successful recovery contexts; Retry.

Every producer supplies a stable event ID, source, signed amount, world minute, feedback key, and Retry treatment. Paranoia does not infer events by polling camera overlap, HUD animation, curfew phase, or dialogue text.

## 8. Effects on other systems

Applies visible check penalty; can trigger fatal failure; informs George, HUD, dossier timeline, outcome ledger, Lira/debrief, and safehouse decision-making. It never changes camera geometry or creates hidden detection bonuses.

Checks consume the current penalty at resolution and record the exact value used. The outcome ledger stores peak Paranoia and significant authored causes/recoveries for debrief; it does not treat a high value as moral failure. At 100 the resource owner emits `failure.paranoia` and no later system may convert that attempt into capture, completion, or recovery.

## 9. UI, world, audio, and George feedback

HUD shows value, range, penalty, and latest cause without diagnostic clutter. Changes use restrained color/audio and concise text. George may identify the verified cause and recovery options; he cannot directly lower Paranoia unless an authored conversation owns that effect.

## 10. Failure, recovery, and retry behavior

100 causes an exact fatal medical-collapse failure. Retry restores departure value and discards post-departure changes. Recovery cannot reduce below 0 or be repeatedly farmed from the same authored event.

If a single event crosses multiple thresholds, feedback reports the applied amount and final penalty without firing contradictory repeated banners. If Retry restores a value already above a threshold, the HUD shows the correct penalty but does not replay historical crossing feedback. New Game resets value, source history, peak, and one-shot recovery guards.

## 11. Content-authoring requirements

Every source/recovery defines stable event ID, trigger, amount/rate, cap, cooldown/one-shot rule, player-facing reason, audio/visual cue, George response, dossier wording, localization, and Retry treatment.

Authors must also declare whether the event can coincide with a Health/time cost, which system emits it, and how duplicate dispatch is rejected. Exact mission assignments for `OPEN-PAR-001` and `OPEN-PAR-002` remain provisional until human pacing review; code or ticket constants do not approve them.

## 12. Edge cases and prohibited shortcuts

No false clues, hallucinations, fake UI, control inversion, hidden modifiers, random spikes, passive curfew gain, outdoor walking decay, consumable relief, generic reassurance button, or duplicated gain from one event across systems.

No percentage accuracy/detection modifier, camera concern multiplier, actor-speed change, color-only critical warning, negative value, value above 100, duplicate threshold announcement, or debrief inference from the final value alone.

## 13. Removed behavior

`Pressure`; Calm/Watched/Panicked labels; accuracy/detection percentages; SPECIAL influence; Street-Tension input; night drift; passive decay; CalmTabs/Nicotine; recoverable breakdown; combat modifiers.

## 14. Post-MVP extensions

Additional authored stressors and recovery relationships may be added. Dishonest perception remains prohibited at every scope.

Future campaign content may make recovery socially or materially costly and may remember significant stress history. It may not restore `Pressure`, hallucination mechanics, hidden penalties, consumable farming, or a generic mental-health morality score without a new explicit design decision.

## 15. Human-play acceptance examples

- Camera exposure raises Paranoia and names the camera/network cause.
- Crossing 40 visibly changes an authored check by exactly −1.
- Curfew passage without observation causes no gain.
- Safehouse rest advances time, restores Health, and subtracts exactly 40.
- Reaching 100 produces the correct failure and Retry state.
- One Suspicious transition cannot double-charge Paranoia through camera, network, HUD, and audio listeners.
- A check at 69 and the same check after crossing to 70 show the exact change from `−1` to `−2`, with no hidden modifier.
- Retry from a high-stress failed attempt restores the departure value, source history, and penalty exactly and clears later events.

## 16. Owning Linear ticket

`T7` (`GET-207`) owns resource/check/save behavior; `T8` (`GET-208`) owns surveillance sources and recovery events; `T9` (`GET-209`) owns HUD/George/dossier feedback; `T10` (`GET-210`) owns authored tuning evidence.
