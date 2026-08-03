---
status: MVP
type: companion
canonical: true
---

# George (AI Companion)

## 1. Player fantasy and purpose

George is a private, persistent AI companion who helps the protagonist think under surveillance. He should feel present, useful, fallible in the honest sense of lacking information, and emotionally familiar—not like a quest tooltip, omniscient narrator, free-text chatbot, or autonomous agent.

## 2. Player-visible verbs

Ask an authored contextual question; request current objective; review verified facts; compare known route risks; ask why an action is blocked; acknowledge curfew/deadline warning; inspect George's current observation.

## 3. Starting state and prerequisites

George is available from the safehouse opening. The player perceives him through a fourth HUD lane and a floating near-character AR avatar. His exact hardware/origin and exposure model are `OPEN-NAR-009`; provisional content may use only that queue recommendation and may not invent an implant, cloud service, or broader network access.

## 4. Complete happy-path behavior

George introduces immediate controls and Lira without explaining the whole setting. He summarizes facts after Lira/Naila/Brant, distinguishes known and unknown camera risk, warns as curfew/deadline approach, explains terminal/hiding failures, interprets the optional manifest only after recognition, supports return/transit, and contributes one concise factual debrief observation.

## 5. State model and transitions

George presentation states:

- `quiet` — avatar present, no urgent line;
- `context` — one authored observation/prompt tied to current beat;
- `warning` — curfew, deadline, network escalation, or invalid action;
- `insufficient` — explicitly lacks verified information;
- `debrief` — summarizes outcome ledger facts.

World state never changes merely because George changes presentation state.

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

## 8. Effects on other systems

George can focus an existing dossier section or known minimap item and add authored explanation. He does not create facts, objective state, recovery, surveillance effects, or success modifiers.

## 9. UI, world, audio, and George feedback

- HUD lane: avatar/state, one concise line, authored prompt buttons.
- World: private AR avatar near the protagonist, positioned without obscuring feet, interactions, cameras, or hiding contexts.
- Audio: subtle presence/prompt/warning cues; no voice acting required.
- Visual intensity follows semantic state, not ambient animation noise.

## 10. Failure, recovery, and retry behavior

When evidence is insufficient George says so. When an action is impossible he reports the authoritative blocker. Retry restores pre-departure George context and clears post-departure warnings/history derived from discarded state.

## 11. Content-authoring requirements

Each `GeorgePrompt` needs ID, available states, required facts, prohibited unknowns, player-facing question, answer, fact/inference confidence, permitted UI context, localization, cooldown/suppression behavior, and Plot Bible anchor.

## 12. Edge cases and prohibited shortcuts

No generic mission-summary answer to every prompt; no personality meter; no adaptive imitation of player tone; no karma/faction judgment; no ambient spam; no spoilers; no claim that George saw an event absent from the ledger; no floating-avatar collision or public NPC reaction.

## 13. Removed behavior

Free-text chat; personality mirroring; reputation/karma commentary; dynamic-event promotion; autonomous world actions; generic reassurance as Paranoia recovery; top-console or objectives-card-only presentation.

## 14. Post-MVP extensions

Deeper relationship arc, hardware compromise, authored George-centered quests, more contextual prompts, and campaign memory—after origin/privacy rules are approved.

## 15. Human-play acceptance examples

- George correctly answers what is known about a discovered camera and refuses to reveal an unknown one.
- He explains why hiding is invalid while directly observed.
- He warns about the deadline without pausing or moving the player.
- His manifest interpretation differs correctly between recognized and missed evidence.
- Both HUD and AR forms remain readable without duplicating the same sentence unnecessarily.

## 16. Owning Linear ticket

`T6` (`GET-206`) owns George AR art; `T9` (`GET-209`) owns prompt/state/UI infrastructure; `T10` (`GET-210`) owns authored responses and onboarding use.
