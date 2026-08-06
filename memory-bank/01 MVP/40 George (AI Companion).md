---
status: MVP
type: companion
canonical: true
---

# George (AI Companion)

## 1. Player fantasy and purpose

George is a private, persistent AI companion who helps the protagonist think under surveillance. He should feel present, useful, fallible in the honest sense of lacking information, and emotionally familiar—not like a quest tooltip, omniscient narrator, free-text chatbot, or autonomous agent.

His fantasy is shared cognition, not delegated play. The protagonist still notices, chooses, moves, speaks, and acts. George helps organize what the protagonist has already perceived or learned, calls attention to a verified contradiction, and gives uncertainty a clear voice. His most important line is sometimes “I do not know,” because the player must be able to trust everything else he says.

## 2. Player-visible verbs

Ask an authored contextual question; request current objective; review verified facts; compare known route risks; ask why an action is blocked; acknowledge curfew/deadline warning; inspect George's current observation.

The player can also ignore George. Prompts are optional support and cannot become mandatory dialogue gates, hidden tutorials, or the only way to understand a critical action.

## 3. Starting state and prerequisites

George is available from the safehouse opening. The player perceives him through a fourth HUD lane and a floating near-character AR avatar. His exact hardware/origin and exposure model are `OPEN-NAR-009`; provisional content may use only that queue recommendation and may not invent an implant, cloud service, or broader network access.

## 4. Complete happy-path behavior

George introduces immediate controls and Lira without explaining the whole setting. He summarizes facts after Lira/Naila/Brant, distinguishes known and unknown camera risk, warns as curfew/deadline approach, explains terminal/hiding failures, interprets the optional manifest only after recognition, supports return/transit, and contributes one concise factual debrief observation.

Example: after Naila identifies the connected terminal, George may say that the known terminal controls the logistics approach group and that OpSec still matters. Without that fact, he may identify a physically discovered terminal and admit that its network relationship is unknown. After a traced loop, he may explain the successful local effect and the recorded trace; he cannot pretend the failure did not happen or recommend a route he has not learned.

## 5. State model and transitions

George presentation states:

- `quiet` — avatar present, no urgent line;
- `context` — one authored observation/prompt tied to current beat;
- `warning` — curfew, deadline, network escalation, or invalid action;
- `insufficient` — explicitly lacks verified information;
- `debrief` — summarizes outcome ledger facts.

World state never changes merely because George changes presentation state.

| Knowledge class | George wording contract | Permitted action |
|---|---|---|
| Verified fact | State the fact and provenance plainly. | Focus the relevant known dossier/minimap item. |
| Visible current state | Describe what the player and systems currently expose. | Explain a blocker or current risk. |
| Bounded inference | Label it as inference and name the supporting facts. | Compare known possibilities without certainty. |
| Insufficient evidence | Say what is unknown and what observation/contact might clarify it. | No reveal, marker, modifier, or action. |

## 6. Rules and tuning values

- One persistent HUD observation at a time.
- One small set of authored prompts per mission/state context.
- No unrestricted free text.
- No action execution, targeting, hacking, movement, or state mutation.
- No undiscovered device/location/fact reveal.
- Compare risk only from known facts and current visible state.
- Dialogue and major overlays may suppress the floating avatar while retaining George as an available authored participant where specified.

## 7. Inputs from other systems

Current objective; fact ledger; known locations/devices; world time; surveillance state/source/last-known position; blocked-action reason; Health; Paranoia; outcome ledger; language.

George consumes read models, not mutable domain objects. Each authored response declares which facts and state fields justify it, which unknowns suppress it, and whether the response is valid during ordinary play, Observation, safehouse planning, a warning, or debrief.

## 8. Effects on other systems

George can focus an existing dossier section or known minimap item and add authored explanation. He does not create facts, objective state, recovery, surveillance effects, or success modifiers.

Selecting a prompt can record that the response was viewed for UX continuity, but this presentation history cannot complete an objective, award XP, alter time, lower Paranoia, or become evidence that the protagonist learned an otherwise unknown fact.

## 9. UI, world, audio, and George feedback

- HUD lane: avatar/state, one concise line, authored prompt buttons.
- World: private AR avatar near the protagonist, positioned without obscuring feet, interactions, cameras, or hiding contexts.
- Audio: subtle presence/prompt/warning cues; no voice acting required.
- Visual intensity follows semantic state, not ambient animation noise.

## 10. Failure, recovery, and retry behavior

When evidence is insufficient George says so. When an action is impossible he reports the authoritative blocker. Retry restores pre-departure George context and clears post-departure warnings/history derived from discarded state.

If George content is missing or invalid, the safe behavior is a bounded unavailable response plus ordinary game controls—not an invented fallback answer. Failure, Retry, and incompatible-save surfaces remain usable without George. He may explain what Retry restores, but cannot trigger it.

## 11. Content-authoring requirements

Each `GeorgePrompt` needs ID, available states, required facts, prohibited unknowns, player-facing question, answer, fact/inference confidence, permitted UI context, localization, cooldown/suppression behavior, and Plot Bible anchor.

The minimum Level 0 inventory covers: opening controls; Lira; each contact's acquired facts; unknown versus known camera risk; connected terminal; weak-OpSec trace; invalid hiding/blending; first Suspicious; last-known position; drone dispatch; Pursuit; recovery; manifest present/recognized/missed; injury; Paranoia threshold; curfew/deadline warnings; medkit return; transit validation; and debrief. Each state needs a no-spam rule and an equivalent English/Ukrainian meaning.

## 12. Edge cases and prohibited shortcuts

No generic mission-summary answer to every prompt; no personality meter; no adaptive imitation of player tone; no karma/faction judgment; no ambient spam; no spoilers; no claim that George saw an event absent from the ledger; no floating-avatar collision or public NPC reaction.

## 13. Removed behavior

Free-text chat; personality mirroring; reputation/karma commentary; dynamic-event promotion; autonomous world actions; generic reassurance as Paranoia recovery; top-console or objectives-card-only presentation.

## 14. Post-MVP extensions

Deeper relationship arc, hardware compromise, authored George-centered quests, more contextual prompts, and campaign memory—after origin/privacy rules are approved.

Future compromise can make George's channel risky only through explicit evidence and authored rules; it cannot retroactively make his Level 0 information dishonest. Free-text conversation, cloud orchestration, autonomous action, and personality imitation are not implied extensions.

## 15. Human-play acceptance examples

- George correctly answers what is known about a discovered camera and refuses to reveal an unknown one.
- He explains why hiding is invalid while directly observed.
- He warns about the deadline without pausing or moving the player.
- His manifest interpretation differs correctly between recognized and missed evidence.
- Both HUD and AR forms remain readable without duplicating the same sentence unnecessarily.
- Ignoring every optional George prompt leaves the operation completable and understandable through world, HUD, dialogue, and dossier feedback.
- The same prompt in English and Ukrainian cites the same facts, preserves the same confidence class, and produces no state difference.

## 16. Owning Linear ticket

`T6` (`GET-206`) owns George AR art; `T9` (`GET-209`) owns prompt/state/UI infrastructure; `T10` (`GET-210`) owns authored responses and onboarding use.
