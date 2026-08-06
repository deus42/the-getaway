---
status: MVP
type: narrative
canonical: true
---

# Narrative Alignment

## 1. Player fantasy and purpose

Narrative makes the surveillance mechanics personal: a flagged expatriate must decide whom to trust, what to learn, how much risk to impose on others, and whether to carry evidence toward Miami while helping Lira's clinic network.

The narrative is not a reward wrapper around systems. It gives every system a human meaning. The clock is Lira's closing route, not an arbitrary timer. The medkits belong to people excluded by identity policy, not a loot objective. The manifest matters because it connects the protagonist's father and future campaign to the same infrastructure harming people nearby. George matters because the protagonist is not completely alone, even when nobody else can perceive him.

## 2. Player-visible verbs

Listen; choose exact spoken lines; inspect; infer; ask; record facts; accept or refuse help; return what was promised; acknowledge consequences.

The player also chooses silence through omission: skip a contact, decline optional evidence, avoid an unnecessary confrontation, or end the demo without exhausting every line. The debrief must respect those omissions rather than treating content consumption as virtue.

## 3. Starting state and prerequisites

All narrative content follows [[03 Lore/Plot Bible]], [[11 Level 0 Vertical Slice Contract]], the current Decision Register, and the state/fact IDs in [[13 Level 0 Content and State Matrix]]. Exact unresolved biographies and evidence details live in [[14 Specification Review Queue]].

## 4. Complete happy-path behavior

Character creation establishes a personal protagonist. George frames immediate exposure without a lore dump. Lira makes the humanitarian bargain. Optional Naila and Brant conversations provide distinct facts. World messages show Hidzu's public story. The optional manifest reveals the international supply chain. Lira's return and the safehouse debrief interpret only actual outcomes and point toward the father, Cold Iron, and Miami.

The emotional arc is `exposure → obligation → preparation → controlled fear → earned escape → accountability → forward purpose`. Lira first asks for action, not allegiance. Naila and Brant reveal different survival literacies. The infiltration demonstrates the gap between Hidzu's public language and its effects. Return makes the player face the costs they accepted. Debrief converts those concrete events into durable self-knowledge and campaign direction.

## 5. State model and transitions

Narrative follows stable mission states and node families. Each authored choice may change facts, objective precision, checks, time, Health, Paranoia, outcome ledger, or debrief. A line that promises a change must own a concrete state effect or be rewritten as opinion/speculation.

| Narrative layer | Authority | Can change | Cannot claim |
|---|---|---|---|
| Spoken dialogue | Authored node/effect record | Facts, objectives, declared costs, contact state, outcomes | Off-screen actions or unstored relationships |
| World/public text | Authored setting content | Atmosphere and explicitly declared public context | Private facts or hidden mission state |
| George | Verified facts plus bounded inference | Explanation and focus only | Undiscovered knowledge or autonomous action |
| Dossier | Fact/objective/outcome ledgers | Presentation of recorded truth | Speculation presented as evidence |
| Debrief | Completed outcome ledger | Persistent consequence summary and progression context | Any action absent from the ledger |

## 6. Rules and tuning values

- English and Ukrainian share semantic node IDs and effects.
- Exact player lines are shown before selection.
- George labels verified fact, reasonable inference, and insufficient evidence distinctly.
- Humor is dry survival behavior, never a joke that erases human cost.
- Surreal imagery is figurative or socially absurd, never supernatural.
- Exposition grants no XP, credits, trust, reputation, or loot.

## 7. Inputs from other systems

Player build; Paranoia; fact ledger; mission state; world time; surveillance outcomes; Health; contacts; social-feed entries; location discovery; outcome ledger.

Every input has a declared narrative use. Paranoia may change available Composure checks or how a cost is described, but not factual truth. A recognized manifest may change interpretation and continuation data, but not whether the medkits were returned. The network peak may change Lira's response, but it cannot imply capture if capture did not occur.

## 8. Effects on other systems

Narrative activates objectives, grants facts, changes knowledge precision, presents checks, updates George/dossier/debrief, issues the transit credential, and determines Miami continuation data.

Narrative never performs the physical action it describes. A line can authorize the operation, issue a credential, or record a fact; the player still has to move, operate the cache, take the medkits, escape, hand them to Lira, and validate transit through the owning systems.

## 9. UI, world, audio, and George feedback

Portraits and names match world actors. Dialogue history preserves prior lines. Objective and dossier copy use the same facts. Important state changes receive restrained audio and one concise George interpretation where authored.

Exact spoken lines appear on choices before selection. Locked choices remain visible when the current node legitimately offers them and state the real missing requirement. World remains visible beneath anchored dialogue so place, speaker, and danger context are retained while shared pause protects reading. English and Ukrainian may differ idiomatically but must preserve speaker intent, information, requirements, effects, and emotional force.

## 10. Failure, recovery, and retry behavior

Dialogue failures fail forward unless the node is an explicitly final interception. Retry restores pre-departure conversations/facts and removes post-departure narrative state. Failure/debrief text states observed causes, never hidden logic.

Fail-forward is not cosmetic failure. It must change a declared cost or route condition—for example time spent, Paranoia gained, a stricter later option, lost objective precision, or an authored confrontation consequence—while keeping a viable mission path. Reopening a resolved node cannot duplicate facts, costs, or emotional beats.

## 11. Content-authoring requirements

For every node record speaker, audience, emotional intent, exact player line, prerequisites, visible requirement, fact inputs, state effects, fail-forward, history text, English/UK copy, Plot Bible anchor, and owning decision IDs.

Every debrief clause also needs an exact ledger predicate and mutually compatible ordering. Content must cover contacts both/one/neither, dusk/curfew, camera loop clean/traced/not used, network peak, drone verification, interception, injury, Paranoia peak, manifest outcome, medkit return, transit validation, and deadline margin without producing contradictory prose.

## 12. Edge cases and prohibited shortcuts

No generic tone labels in place of exact speech; no promises of purchases, routes, gadgets, reputation, combat, or world change that do not occur; no mandatory exposition loops; no procedural generation; no calling the protagonist Trace unless entered as callsign; no Japanese cultural shorthand without review.

## 13. Removed behavior

Ghost/Wire/Force briefing; package dialogue; Lira-only structure; procedural dialogue/tone mixer; personality mirroring; karma/faction reaction; exposition rewards; reputation/trust meters.

## 14. Post-MVP extensions

Long-tail campaign reactivity, additional contacts, relationship arcs, broadcasts, and broader faction consequences—only through authored state and content.

Post-MVP relationship depth may remember conduct and commitments, but it is not permission to introduce a generic affinity meter. Future dialogue generation or free-text input is not promised; it would require a new truth, safety, localization, and authorial-control decision.

## 15. Human-play acceptance examples

- Each contact changes at least one practical piece of knowledge.
- Two different builds see different but honest options.
- Missing a check changes the route or information without silently dead-ending the mission.
- Lira's debrief never mentions an action the player did not take.
- English and Ukrainian create identical state.
- A player who skips both contacts receives a coherent story of acting with limited information rather than dialogue that assumes prior preparation.
- The final emotional reading remains humane when the manifest is missed: helping Lira is still a complete act, while the campaign clue is honestly absent.

## 16. Owning Linear ticket

`T1` (`GET-201`) owns narrative canon; `T9` (`GET-209`) owns dialogue/fact infrastructure and localization; `T10` (`GET-210`) owns final authored Level 0 content.
