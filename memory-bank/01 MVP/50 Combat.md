---
status: MVP
type: disposition
canonical: true
---

# Combat Disposition

## 1. Player fantasy and purpose

Level 0 is about avoiding confirmation and escaping institutional custody, not defeating enemies. Physical danger exists as authored consequence, but the game never changes into a tactical battle.

The protagonist may be brave, persuasive, composed, technically capable, or physically resourceful, but they are not equipped to dominate Hidzu security. The tension of interception comes from making one legible decision under institutional pressure and living with its cost. Avoidance is success; violence is neither the default fantasy nor a hidden optimal route.

## 2. Player-visible verbs

Read the confrontation; speak; hold composure; evade; make a physical escape attempt; accept a previewed cost; Retry after capture or fatal consequence.

The player may also back away before an interception becomes final when the surveillance/stealth state still permits ordinary movement. Once the authored confrontation begins, world simulation pauses and only its declared choices are accepted.

## 3. Starting state and prerequisites

No combat mode, weapon, AP pool, combat HUD, enemy HP, cover state, attack animation requirement, or combat skill initializes in Level 0. Interception options appear only after an authored security encounter and only when supported by build/facts/context.

## 4. Complete happy-path behavior

The player avoids interception through observation, hiding, blending, and pursuit escape. If intercepted, a concise grounded confrontation presents visible deterministic options. A supported success creates escape with an authored Health, Paranoia, time, or consequence cost. Final failure creates capture and mission failure.

Example: a security verifier corners the protagonist after confirmed pursuit. An Influence option may exploit a known delivery protocol, a Composure option may endure verification long enough to create a departure opening, Evasion may take a physically costly route, and Physical may force a dangerous civilian-scale escape. Each option is an authored outcome with exact visible math and cost; none enters an attack animation or enemy damage exchange.

## 5. State model and transitions

`Free movement → Interception overlay (paused) → Resolved escape with costs → Suspicious/Pursuit or Free movement`

or

`Free movement → Interception overlay → Failed final option → Captured → Failure overlay`

No transition enters a combat scene or turn loop.

| Interception state | Player information | Allowed transition |
|---|---|---|
| `approaching` | Source, reason, escape context, warning | Continue ordinary escape if the world state still permits it |
| `engaged` | Exact authored choices, requirements, and likely costs | Select one choice or remain in the paused overlay |
| `resolved_escape` | Applied cost, placement, network state, named consequence | Resume world play under the declared state |
| `captured` | Exact failed option and custody cause | Enter factual failure and deterministic Retry/New Game |

## 6. Rules and tuning values

- Options draw from Influence, Insight, Composure, Evasion, and Physical escape.
- Requirements use [[92 Character & Progression]].
- Costs are shown before confirmation and tuned through `OPEN-HLT-001` and `OPEN-PAR-001`.
- An option may be absent when fiction/build does not support it.
- Capture is terminal for the attempt.
- There is no initiative, turn order, action point, attack range, hit chance, damage roll, armor, weapon, ammunition, enemy morale, loot, or combat XP.
- A successful option cannot silently erase Pursuit unless that option explicitly resolves the network evidence and says so before selection.
- The confrontation is short: it exists to resolve one interception state, not to form a repeatable encounter loop or farmable progression source.

## 7. Inputs from other systems

Security context; surveillance state; player build; Paranoia penalty; Health; facts; time; hiding/blending state; authored interception node.

Layout and actor presentation provide the credible physical context; dialogue/check infrastructure provides exact choices and math; the outcome ledger provides debrief truth. No combat-specific parallel copies of those values exist.

## 8. Effects on other systems

May change Health, Paranoia, time, network state, outcome ledger, objective reachability, debrief, failure cause, and Retry availability.

An outcome declares each effect atomically. For example, a dangerous Evasion escape may reduce Health, advance time, preserve Pursuit at a new authored position, and record `interceptionOutcome`; a social success may step the network down only if the fiction and node explicitly support that change. No generic victory reward is emitted.

## 9. UI, world, audio, and George feedback

World remains visible under a short anchored overlay. Requirements and costs are explicit. Security confirmation uses grounded audio; George may explain known stakes before selection but never recommends a guaranteed option without evidence.

Choice text is the protagonist's exact intended action or line, not an abstract “Aggressive” or “Clever” label. Locked choices name the missing capability or fact. Critical state remains text/shape readable without relying only on crimson or sound.

## 10. Failure, recovery, and retry behavior

Failed non-final options fail forward only where authored; the final failed outcome is capture. Retry restores departure state and removes confrontation costs/outcomes. Health 0 and Paranoia 100 use their own exact failures.

A fail-forward outcome must keep one authored path alive and state its cost. A terminal capture never launches an unimplemented custody level. The failure surface names the confirming actor/system and chosen failed option, then restores the same pre-operation attempt if Retry is selected.

## 11. Content-authoring requirements

Each confrontation defines context, security actor, reason for interception, available option families, exact requirements, costs, success placement/state, fail-forward ordering, capture text, localization, and outcome-ledger ID.

Content must cover at least one readable successful noncombat resolution and one factual terminal failure without implying police brutality, weapons, or military skill that the game does not implement. Exact capture fiction remains `OPEN-NAR-012`; exact costs remain `OPEN-HLT-001` and `OPEN-PAR-001` until resolved.

## 12. Edge cases and prohibited shortcuts

No tactical grid, AP, weapons, attacks, takedowns, enemy HP, loot, cover, AutoBattle, EMP, magic escape, repeated farmable confrontation, or unexplained military competence. A click outside the overlay cannot bypass it.

## 13. Removed behavior

Turn-based combat; manual action strip; Move/Attack/Takedown/End Turn; combat cover; captain encounter; package weapons; AutoBattle; reinforcement loop; attack sprite states.

## 14. Post-MVP extensions

A richer manual confrontation interface may be researched after the slice. Tactical combat is not an assumed future commitment.

“Richer” may mean more authored negotiation, escape staging, group pressure, consequence continuity, or multi-step noncombat choice. It does not automatically mean weapons, attack commands, enemy HP, or a combat subsystem; those were Removed and require a new product-direction decision to return.

## 15. Human-play acceptance examples

- An Influence build sees a supported option with exact math and cost.
- An Evasion build escapes with previewed Health/time cost.
- An unsupported option is absent or visibly locked for a concrete reason.
- Final failure produces capture and deterministic Retry without flashing a combat HUD.
- A player can explain the physical fiction, exact requirement, and likely cost of every reached option before choosing.
- The debrief names the actual interception outcome and cost without using victory, kill, damage-dealt, or combat terminology.

## 16. Owning Linear ticket

`T7` (`GET-207`) owns check/cost data; `T8` (`GET-208`) owns interception mechanics and security integration; `T10` (`GET-210`) owns authored confrontation content.
