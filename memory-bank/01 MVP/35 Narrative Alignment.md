---
status: MVP
type: narrative
canonical: true
---

# Narrative Alignment

## 1. Player fantasy and purpose

Narrative makes the surveillance mechanics personal: a flagged expatriate must decide whom to trust, what to learn, how much risk to impose on others, and whether to carry evidence toward Miami while helping Lira's clinic network.

## 2. Player-visible verbs

Listen; choose exact spoken lines; inspect; infer; ask; record facts; accept or refuse help; return what was promised; acknowledge consequences.

## 3. Starting state and prerequisites

All narrative content follows [[03 Lore/Plot Bible]], [[11 Level 0 Vertical Slice Contract]], the current Decision Register, and the state/fact IDs in [[13 Level 0 Content and State Matrix]]. Exact unresolved biographies and evidence details live in [[14 Specification Review Queue]].

## 4. Complete happy-path behavior

Character creation establishes a personal protagonist. George frames immediate exposure without a lore dump. Lira makes the humanitarian bargain. Optional Naila and Brant conversations provide distinct facts. World messages show Hidzu's public story. The optional manifest reveals the international supply chain. Lira's return and the safehouse debrief interpret only actual outcomes and point toward the father, Cold Iron, and Miami.

## 5. State model and transitions

Narrative follows stable mission states and node families. Each authored choice may change facts, objective precision, checks, time, Health, Paranoia, outcome ledger, or debrief. A line that promises a change must own a concrete state effect or be rewritten as opinion/speculation.

## 6. Rules and tuning values

- English and Ukrainian share semantic node IDs and effects.
- Exact player lines are shown before selection.
- George labels verified fact, reasonable inference, and insufficient evidence distinctly.
- Humor is dry survival behavior, never a joke that erases human cost.
- Surreal imagery is figurative or socially absurd, never supernatural.
- Exposition grants no XP, credits, trust, reputation, or loot.

## 7. Inputs from other systems

Player build; Paranoia; fact ledger; mission state; world time; surveillance outcomes; Health; contacts; social-feed entries; location discovery; outcome ledger.

## 8. Effects on other systems

Narrative activates objectives, grants facts, changes knowledge precision, presents checks, updates George/dossier/debrief, issues the transit credential, and determines Miami continuation data.

## 9. UI, world, audio, and George feedback

Portraits and names match world actors. Dialogue history preserves prior lines. Objective and dossier copy use the same facts. Important state changes receive restrained audio and one concise George interpretation where authored.

## 10. Failure, recovery, and retry behavior

Dialogue failures fail forward unless the node is an explicitly final interception. Retry restores pre-departure conversations/facts and removes post-departure narrative state. Failure/debrief text states observed causes, never hidden logic.

## 11. Content-authoring requirements

For every node record speaker, audience, emotional intent, exact player line, prerequisites, visible requirement, fact inputs, state effects, fail-forward, history text, English/UK copy, Plot Bible anchor, and owning decision IDs.

## 12. Edge cases and prohibited shortcuts

No generic tone labels in place of exact speech; no promises of purchases, routes, gadgets, reputation, combat, or world change that do not occur; no mandatory exposition loops; no procedural generation; no calling the protagonist Trace unless entered as callsign; no Japanese cultural shorthand without review.

## 13. Removed behavior

Ghost/Wire/Force briefing; package dialogue; Lira-only structure; procedural dialogue/tone mixer; personality mirroring; karma/faction reaction; exposition rewards; reputation/trust meters.

## 14. Post-MVP extensions

Long-tail campaign reactivity, additional contacts, relationship arcs, broadcasts, and broader faction consequences—only through authored state and content.

## 15. Human-play acceptance examples

- Each contact changes at least one practical piece of knowledge.
- Two different builds see different but honest options.
- Missing a check changes the route or information without silently dead-ending the mission.
- Lira's debrief never mentions an action the player did not take.
- English and Ukrainian create identical state.

## 16. Owning Linear ticket

`T1` (`GET-201`) owns narrative canon; `T9` (`GET-209`) owns dialogue/fact infrastructure and localization; `T10` (`GET-210`) owns final authored Level 0 content.
