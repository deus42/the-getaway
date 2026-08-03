---
status: MVP
type: disposition
canonical: true
---

# Combat Disposition

## 1. Player fantasy and purpose

Level 0 is about avoiding confirmation and escaping institutional custody, not defeating enemies. Physical danger exists as authored consequence, but the game never changes into a tactical battle.

## 2. Player-visible verbs

Read the confrontation; speak; hold composure; evade; make a physical escape attempt; accept a previewed cost; Retry after capture or fatal consequence.

## 3. Starting state and prerequisites

No combat mode, weapon, AP pool, combat HUD, enemy HP, cover state, attack animation requirement, or combat skill initializes in Level 0. Interception options appear only after an authored security encounter and only when supported by build/facts/context.

## 4. Complete happy-path behavior

The player avoids interception through observation, hiding, blending, and pursuit escape. If intercepted, a concise grounded confrontation presents visible deterministic options. A supported success creates escape with an authored Health, Paranoia, time, or consequence cost. Final failure creates capture and mission failure.

## 5. State model and transitions

`Free movement → Interception overlay (paused) → Resolved escape with costs → Suspicious/Pursuit or Free movement`

or

`Free movement → Interception overlay → Failed final option → Captured → Failure overlay`

No transition enters a combat scene or turn loop.

## 6. Rules and tuning values

- Options draw from Influence, Insight, Composure, Evasion, and Physical escape.
- Requirements use [[92 Character & Progression]].
- Costs are shown before confirmation and tuned through `OPEN-HLT-001` and `OPEN-PAR-001`.
- An option may be absent when fiction/build does not support it.
- Capture is terminal for the attempt.

## 7. Inputs from other systems

Security context; surveillance state; player build; Paranoia penalty; Health; facts; time; hiding/blending state; authored interception node.

## 8. Effects on other systems

May change Health, Paranoia, time, network state, outcome ledger, objective reachability, debrief, failure cause, and Retry availability.

## 9. UI, world, audio, and George feedback

World remains visible under a short anchored overlay. Requirements and costs are explicit. Security confirmation uses grounded audio; George may explain known stakes before selection but never recommends a guaranteed option without evidence.

## 10. Failure, recovery, and retry behavior

Failed non-final options fail forward only where authored; the final failed outcome is capture. Retry restores departure state and removes confrontation costs/outcomes. Health 0 and Paranoia 100 use their own exact failures.

## 11. Content-authoring requirements

Each confrontation defines context, security actor, reason for interception, available option families, exact requirements, costs, success placement/state, fail-forward ordering, capture text, localization, and outcome-ledger ID.

## 12. Edge cases and prohibited shortcuts

No tactical grid, AP, weapons, attacks, takedowns, enemy HP, loot, cover, AutoBattle, EMP, magic escape, repeated farmable confrontation, or unexplained military competence. A click outside the overlay cannot bypass it.

## 13. Removed behavior

Turn-based combat; manual action strip; Move/Attack/Takedown/End Turn; combat cover; captain encounter; package weapons; AutoBattle; reinforcement loop; attack sprite states.

## 14. Post-MVP extensions

A richer manual confrontation interface may be researched after the slice. Tactical combat is not an assumed future commitment.

## 15. Human-play acceptance examples

- An Influence build sees a supported option with exact math and cost.
- An Evasion build escapes with previewed Health/time cost.
- An unsupported option is absent or visibly locked for a concrete reason.
- Final failure produces capture and deterministic Retry without flashing a combat HUD.

## 16. Owning Linear ticket

`T7` (`GET-207`) owns check/cost data; `T8` (`GET-208`) owns interception mechanics and security integration; `T10` (`GET-210`) owns authored confrontation content.
