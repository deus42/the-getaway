---
status: MVP
type: mechanic
tags: [paranoia]
canonical: true
---

# Paranoia

## 1. Player fantasy and purpose

Paranoia represents physiological and cognitive stress from being watched, pursued, physically harmed, and forced into dangerous decisions. It makes surveillance consequential while preserving absolute trust in the game's facts and interface.

The player fantasy is not “my perception is unreliable.” It is “I can feel the cost of remaining functional while the threat is real.” Paranoia narrows the protagonist's practical margin by locking `fragile` abilities tier by tier (stress made legible, in the tradition of Darkest Dungeon — without its randomness). It never alters truth, secretly changes surveillance geometry, or punishes the player for failing to distinguish authored reality from deception.

## 2. Player-visible verbs

Read the current tier and latest cause; reduce exposure; complete a credible difficult surveillance escape; use vending-machine coffee on Transit Road; use the shrine near the Market Ring/Outer Space junction; return to the safehouse and rest; choose whether to continue with part of the ability set locked.

The player cannot consume a generic calming item, wait in open space for passive decay, click a reassurance button, or exploit repeatable conversation. Recovery is attached to a named safe action or a one-shot authored event.

## 3. Starting state and prerequisites

New Level 0 runs begin at internal 0 — the Calm tier. The named tier is always visible in the protagonist lane; the underlying 0–100 value is internal and never shown as a number. The system requires an initialized player, current internal value, tier derivation, source ledger, and authored recovery guards.

The current internal value, tier, latest communicated source, and any tier-entry announcements are persisted. The presentation derives from this authoritative record; it does not keep a second animated “stress” value that could disagree with gates or failure.

## 4. Complete happy-path behavior

Observed rule-breaking surveillance concern raises Paranoia with an explicit source; ordinary public visibility does not. The player breaks contact and recovers through a credible context, and the first qualifying difficult escape may remove five. If stress climbs a tier, the tier's `fragile` abilities lock with the tier named as the reason; `hardened` abilities hold. The two grounding actions each cost ten world minutes and remove ten once; safehouse Rest costs 30 minutes and removes 40. The debrief records the peak tier and significant causes/recoveries.

Example: while shared surveillance evidence says a camera, verifier, or pursuer is validly observing the protagonist, Paranoia rises over time and names that source. The surveillance state owns the deterministic exposure window; the render loop does not apply stress. When evidence breaks, gain stops immediately. Exact rate, overlap, sampling, and caps remain `OPEN-PAR-001`. After the player completes a difficult authored recovery, the approved or provisional recovery event applies once. A later gate that names a locked ability shows the tier as its exact reason.

## 5. State model and transitions

| Tier | Internal range | Effect on abilities | Meaning |
|---|---:|---|---|
| Calm | 0–39 | Full ability set lit | Managed stress |
| Uneasy | 40–69 | Abilities tagged `fragile: uneasy` lock | Composure starts to slip |
| Shaken | 70–89 | All `fragile` abilities lock | Only trained, rote capability holds |
| Breaking | 90–99 | `fragile` abilities stay locked; George's warnings shorten | One step from the end |
| — | 100 | Breakdown: staged surrender, freeze, or bolt; `failure.breakdown` | The character gives themselves up |

George announces the first entry into Uneasy, Shaken, and Breaking once per attempt; repeated movement around a boundary does not repeat that line. The read-only slider remains continuously truthful to the exact internal value, and its threshold ticks use the approved internal cuts of the superseded penalty model exactly (`GDR-PAR-008`, `GDR-UI-005`).

| Event class | Valid source example | Ledger behavior | Invalid shortcut |
|---|---|---|---|
| Surveillance exposure | Valid visibility plus an observed restricted breach, protected interaction, medkit removal, failed verification, or detected feed change; or Pursuit evidence | Deterministic source-owned deltas with stable observation/rule-break identity | Gain from ordinary public visibility, every render frame, an unseen source, or after evidence breaks |
| Physical consequence | Dangerous escape or authored interception outcome | Apply alongside the named world-minute cost | Generic combat damage or ambient chip stress |
| Story shock | Explicit authored revelation | One event with visible cause | Random spike or false information |
| Difficult escape | First qualifying surveillance escape | `−5` once per attempt | Waiting in open space or farming one context |
| Transit Road coffee | Explicit vending-machine grounding action | `−10`, `+10` world minutes, once per attempt | Proximity, repeat use, or dialogue substitute |
| Junction shrine | Explicit shrine grounding action | `−10`, `+10` world minutes, once per attempt | Proximity, repeat use, or dialogue substitute |
| Safehouse Rest | Confirmed safe action | `−40`, clamped, plus `+30` minutes | Boundary crossing or passive safe-zone decay |

## 6. Rules and tuning values

- Internal range 0–100, always named `Paranoia`, always presented as the named tier.
- The approved tier locks above apply to every ability tagged `fragile`; `hardened` abilities never lock. Each `fragile` ability declares the tier at which it locks (`OPEN-ABL-001` owns the exact catalog).
- Sources: a valid observed surveillance rule break or Pursuit evidence, dangerous escape/capture outcome, and authored story shock. Ordinary public visibility and Suspicious/Pursuit labels alone do not create an unowned duplicate gain.
- No passive curfew gain.
- No passive outdoor decay.
- Safehouse rest: −40, +30 minutes, once per confirmed action.
- Vending-machine coffee on Transit Road and the shrine near the Market Ring/Outer Space junction each cost `10` world minutes, remove `10` Paranoia, and work once per attempt. Dialogue never removes Paranoia.
- The first qualifying difficult surveillance escape removes `5` Paranoia once per attempt.
- Event amounts/rates remain acceptance decisions under `OPEN-PAR-001`; its recorded recommendation may be trialed as replaceable authored data.
- Every change stores stable event/source IDs, signed amount, before/after values, world minute, feedback key, Restart Attempt treatment derived from whether `OperationAttemptBaseline` exists, and any newly entered tiers.

## 7. Inputs from other systems

Surveillance rule-break evidence; Pursuit events; interception outcomes; story events; safehouse actions; the two grounding definitions; the qualifying difficult escape; Restart Attempt.

Every producer supplies a stable event ID, source, signed amount, world minute, feedback key, and Restart Attempt treatment. Paranoia does not infer events by polling camera overlap, HUD animation, curfew phase, or dialogue text.

## 8. Effects on other systems

Locks `fragile` abilities by tier; can end the attempt in breakdown; informs George, HUD, dossier timeline, outcome ledger, Lira/debrief, and safehouse decision-making. It never changes camera geometry or creates hidden detection bonuses.

Gates consult the current tier at resolution and record the exact tier used as the lock reason. The outcome ledger stores the peak tier and significant authored causes/recoveries for debrief; it does not treat a high tier as moral failure. At 100 the resource owner emits `failure.breakdown`, the ending stages the surrender/freeze/bolt of `GDR-PAR-009`, and no later system may convert that attempt into completion or recovery.

## 9. UI, world, audio, and George feedback

HUD and Character screen show the same continuous read-only slider, threshold ticks, named tier, ability lock states, and latest cause without diagnostic clutter or a printed number (`GDR-UI-005`). Changes use restrained color/audio and concise text. George may identify the verified cause and recovery options and speaks once at each first entry into Uneasy, Shaken, and Breaking; his dialogue never directly lowers Paranoia.

## 10. Failure, recovery, and Restart Attempt behavior

100 causes breakdown: the protagonist stages an in-fiction surrender, freeze, or bolt appropriate to the current context, the attempt ends as `failure.breakdown`, and the ending screen receives the same factual, evidence-limited treatment as every failure (`GDR-FAIL-001`). Restart Attempt restores the internal value, source history, one-use grounding/escape guards, and tier-announcement history in `OperationAttemptBaseline` and discards later changes. Recovery cannot reduce below 0 or be repeatedly farmed from the same authored event.

If a single event crosses multiple tiers, feedback reports the applied change and final tier without firing contradictory repeated banners. If Restart Attempt restores a value already inside a higher tier, the HUD shows the correct tier and locks but does not replay historical entry feedback. New Game resets value, source history, peak, and one-shot recovery guards.

## 11. Content-authoring requirements

Every source/recovery defines stable event ID, trigger, amount/rate, cap, cooldown/one-shot rule, player-facing reason, audio/visual cue, George response, dossier wording, localization, and Restart Attempt treatment.

Authors must also declare whether the event can coincide with a world-minute cost, which system emits it, and how duplicate dispatch is rejected. Exact gain assignments for `OPEN-PAR-001` remain provisional until human pacing review; approved recovery amounts/locations and tier announcements are not provisional.

## 12. Edge cases and prohibited shortcuts

No false clues, hallucinations, fake UI, control inversion, hidden modifiers, random spikes, passive curfew gain, outdoor walking decay, consumable relief, dialogue relief, generic reassurance button, ordinary-visibility gain, or duplicated gain from one event across systems.

No percentage accuracy/detection modifier, camera concern multiplier, actor-speed change, color-only critical warning, negative value, value above 100, duplicate tier announcement, numeric readout in normal play, hidden tier math, or debrief inference from the final tier alone.

## 13. Removed behavior

`Pressure`; Calm/Watched/Panicked labels — the single label `Calm` returns as an approved tier name under `GDR-PAR-008`, while `Watched` and `Panicked` stay removed; accuracy/detection percentages; SPECIAL influence; Street-Tension input; night drift; passive decay; CalmTabs/Nicotine; recoverable breakdown — *recoverable* breakdown stays removed, and the terminal breakdown ending is `GDR-PAR-009`; numeric check penalties (−1/−2/−3) per the superseded `GDR-PAR-002`; combat modifiers.

## 14. Post-MVP extensions

Additional authored stressors and recovery relationships may be added. Dishonest perception remains prohibited at every scope.

Future campaign content may make recovery socially or materially costly and may remember significant stress history. It may not restore `Pressure`, hallucination mechanics, hidden penalties, consumable farming, or a generic mental-health morality score without a new explicit design decision.

## 15. Human-play acceptance examples

- Ordinary public camera visibility causes no gain; an observed declared rule break raises Paranoia and names both sources.
- Entering Uneasy visibly locks exactly the abilities tagged `fragile: uneasy`, each with the tier named as its reason.
- Curfew passage without observation causes no gain.
- Safehouse rest advances time and subtracts exactly 40.
- Each grounding action advances ten minutes, subtracts exactly ten once, and cannot be repeated; the first qualifying difficult escape subtracts exactly five once.
- George speaks exactly once per attempt at each first entry into Uneasy, Shaken, and Breaking.
- Reaching 100 stages the surrender and produces the correct `failure.breakdown` ending and Restart Attempt state.
- One Suspicious transition cannot double-charge Paranoia through camera, network, HUD, and audio listeners.
- A gate consulted just below a tier boundary and again just above it shows exactly the newly locked ability with its tier reason, and a `hardened` control ability passes in both cases.
- Restart Attempt from a high-stress failed attempt restores the departure value, source history, tier, and locks exactly and clears later events.

## 16. Owning Linear ticket

`T7A` (`GET-216`) owns resource/tier/lock/save behavior; `T8A` (`GET-212`) owns surveillance-source gating and the difficult-escape event; `T9A` (`GET-213`) owns exact gate/George presentation; `T10A` (`GET-214`) owns the two grounding actions and tier-moment content under `T10` (`GET-210`).
