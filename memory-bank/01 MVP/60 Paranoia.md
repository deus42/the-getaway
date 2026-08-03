---
status: MVP
type: mechanic
tags: [paranoia]
canonical: true
---

# Paranoia

## 1. Player fantasy and purpose

Paranoia represents physiological and cognitive stress from being watched, pursued, injured, and forced into dangerous decisions. It makes surveillance consequential while preserving absolute trust in the game's facts and interface.

## 2. Player-visible verbs

Read the current value/threshold/cause; reduce exposure; complete a credible hiding/blending recovery; seek one authored trusted conversation; return to the safehouse and rest; choose whether to continue under penalty.

## 3. Starting state and prerequisites

New Level 0 runs begin at 0/100. Paranoia is always visible in the protagonist lane. The system requires an initialized player, current value, threshold-derived penalty, source ledger, and authored recovery guards.

## 4. Complete happy-path behavior

Visible surveillance concern raises Paranoia with an explicit source. The player breaks contact and recovers through a credible context, possibly earning small authored relief. If stress remains high, checks show the penalty. Safehouse rest costs 30 minutes and removes 40. The debrief records peak value and significant causes/recoveries.

## 5. State model and transitions

| Range | Check penalty | Meaning |
|---:|---:|---|
| 0–39 | 0 | Managed stress |
| 40–69 | −1 | Significant impairment |
| 70–89 | −2 | Severe impairment |
| 90–99 | −3 | Critical medical risk |
| 100 | fatal | Medical collapse |

Threshold transitions are announced once per crossing and remain visible through the numeric bar/penalty.

## 6. Rules and tuning values

- Range 0–100, always named `Paranoia`.
- Approved penalties above apply to every deterministic check.
- Sources: sustained observation, Suspicious, Pursuit, injury, dangerous escape/capture outcome, authored story shock.
- No passive curfew gain.
- No passive outdoor decay.
- Safehouse rest: −40, +30 minutes, once per confirmed action.
- Smaller recovery values remain acceptance decisions under `OPEN-PAR-002`; its recorded recommendation may be trialed as replaceable authored data.
- Event amounts/rates remain acceptance decisions under `OPEN-PAR-001`; its recorded recommendation may be trialed as replaceable authored data.
- Every change stores source, amount, time, and resulting value.

## 7. Inputs from other systems

Surveillance transitions; exposure events; Health changes; interception outcomes; story events; safehouse actions; trusted conversations; successful recovery contexts; Retry.

## 8. Effects on other systems

Applies visible check penalty; can trigger fatal failure; informs George, HUD, dossier timeline, outcome ledger, Lira/debrief, and safehouse decision-making. It never changes camera geometry or creates hidden detection bonuses.

## 9. UI, world, audio, and George feedback

HUD shows value, range, penalty, and latest cause without diagnostic clutter. Changes use restrained color/audio and concise text. George may identify the verified cause and recovery options; he cannot directly lower Paranoia unless an authored conversation owns that effect.

## 10. Failure, recovery, and retry behavior

100 causes an exact fatal medical-collapse failure. Retry restores departure value and discards post-departure changes. Recovery cannot reduce below 0 or be repeatedly farmed from the same authored event.

## 11. Content-authoring requirements

Every source/recovery defines stable event ID, trigger, amount/rate, cap, cooldown/one-shot rule, player-facing reason, audio/visual cue, George response, dossier wording, localization, and Retry treatment.

## 12. Edge cases and prohibited shortcuts

No false clues, hallucinations, fake UI, control inversion, hidden modifiers, random spikes, passive curfew gain, outdoor walking decay, consumable relief, generic reassurance button, or duplicated gain from one event across systems.

## 13. Removed behavior

`Pressure`; Calm/Watched/Panicked labels; accuracy/detection percentages; SPECIAL influence; Street-Tension input; night drift; passive decay; CalmTabs/Nicotine; recoverable breakdown; combat modifiers.

## 14. Post-MVP extensions

Additional authored stressors and recovery relationships may be added. Dishonest perception remains prohibited at every scope.

## 15. Human-play acceptance examples

- Camera exposure raises Paranoia and names the camera/network cause.
- Crossing 40 visibly changes an authored check by exactly −1.
- Curfew passage without observation causes no gain.
- Safehouse rest advances time, restores Health, and subtracts exactly 40.
- Reaching 100 produces the correct failure and Retry state.

## 16. Owning Linear ticket

`T7` (`GET-207`) owns resource/check/save behavior; `T8` (`GET-208`) owns surveillance sources and recovery events; `T9` (`GET-209`) owns HUD/George/dossier feedback; `T10` (`GET-210`) owns authored tuning evidence.
