---
status: MVP
type: companion
canonical: true
---

# George (AI Companion)

## 1. Player fantasy and purpose

George is a private, persistent AI companion who helps the protagonist think under surveillance. His canonical embodiment is the recovered non-human orb the player recognizes across the world and HUD. He should feel present, useful, fallible in the honest sense of lacking information, and emotionally familiar—not like a quest tooltip, generic holographic person, omniscient narrator, free-text chatbot, or autonomous agent.

His fantasy is shared cognition, not delegated play. The protagonist still notices, chooses, moves, speaks, and acts. George helps organize what the protagonist has already perceived or learned, calls attention to a verified contradiction, and gives uncertainty a clear voice. His most important line is sometimes “I do not know,” because the player must be able to trust everything else he says.

## 2. Player-visible verbs

Ask an authored contextual question; request current objective; review verified facts; compare known route risks; ask why an action is blocked; acknowledge curfew/deadline warning; inspect George's current observation.

The player can also ignore George. Prompts are optional support and cannot become mandatory dialogue gates, hidden tutorials, or the only way to understand a critical action.

## 3. Starting state and prerequisites

George is available from the safehouse opening. The player perceives him through a fourth HUD lane and a floating near-character AR orb. The orb form is approved and not provisional. His exact hardware/origin and exposure model remain `OPEN-NAR-009`; that open item may not change the orb identity or be used to invent an implant, cloud service, broader network access, human face, bust, or body.

## 4. Complete happy-path behavior

George introduces immediate controls, the Miami/father/Cold Iron goal, and Lira without explaining the whole setting or claiming that Hidzu Corporation already suspects the protagonist. He summarizes facts after Lira/Naila/Brant, distinguishes known and unknown camera risk, warns as curfew/deadline approach, explains terminal/hiding failures, interprets the optional manifest only after recognition, supports return/transit, reads the departure plan back before confirmation, and contributes one concise factual debrief observation.

Example: after Naila identifies the connected terminal, George may say that the known terminal controls the logistics approach group and that OpSec still matters. Without that fact, he may identify a physically discovered terminal and admit that its network relationship is unknown. After a traced loop, he may explain the successful local effect and the recorded trace; he cannot pretend the failure did not happen or recommend a route he has not learned.

## 5. State model and transitions

George presentation states:

- `quiet` — avatar present, no urgent line and no hidden gameplay meaning;
- `context` — one authored observation/prompt tied to current beat;
- `warning` — curfew, deadline, network escalation, or invalid action;
- `insufficient` — explicitly lacks verified information;
- `debrief` — summarizes outcome ledger facts.

World state never changes merely because George changes presentation state.

All five states preserve the same orb silhouette and visual grammar. `quiet` uses the least motion and intensity; `context` adds one restrained core/ring emphasis; `warning` is sharper but never strobes or becomes a danger marker; `insufficient` visibly settles or dims without implying secret information; `debrief` returns to a calm, legible presentation. State treatment never turns George into a portrait, body, emoji, or unrelated icon.

| Knowledge class | George wording contract | Permitted action |
|---|---|---|
| Verified fact | State the fact and provenance plainly. | Focus the relevant known dossier/minimap item. |
| Visible current state | Describe what the player and systems currently expose. | Explain a blocker or current risk. |
| Bounded inference | Label it as inference and name the supporting facts. | Compare known possibilities without certainty. |
| Insufficient evidence | Say what is unknown and what observation/contact might clarify it. | No reveal, marker, modifier, or action. |

## 6. Rules and tuning values

- One persistent HUD observation at a time.
- One small set of authored prompts per mission/state context.
- The canonical orb keeps a dark circular body, cyan concentric core, four axial markers, central point, and restrained angular/framing marks. Refinement may improve material, edge quality, restrained glow, depth, or motion without replacing this grammar.
- World and HUD forms use the same orb identity. The HUD may render it larger and crisper; the world form may use restrained transparency and hover motion.
- No unrestricted free text.
- No action execution, targeting, hacking, movement, or state mutation.
- No undiscovered device/location/fact reveal.
- Compare risk only from known facts and current visible state.
- Every unavailable or insufficient response states why useful information is missing. Absence or silence never encodes hidden gameplay information.
- Emit at most one authored Paranoia warning per attempt on first entry into Uneasy, Shaken, and Breaking.
- Before departure, read the actual departure time, consulted/skipped contacts, cover, held abilities, completed research, named Paranoia tier, and `OperationAttemptBaseline` restoration meaning; never substitute planned values for real state.
- Level 0 gives George no personal want, deletion/freedom request, or secret agenda.
- Dialogue and major overlays may suppress the floating avatar while retaining George as an available authored participant where specified.

## 7. Inputs from other systems

Current objective; cover; held/lit/locked abilities; research state; fact ledger; `ColdIronEvidenceState`; known locations/devices; world time; surveillance state/source/last-known position; blocked-action reason; named Paranoia tier and latest source; tier-announcement history; departure-readback model; outcome ledger; language.

George consumes read models, not mutable domain objects. Each authored response declares which facts and state fields justify it, which unknowns suppress it, and whether the response is valid during ordinary play, Observation, safehouse planning, a warning, or debrief.

## 8. Effects on other systems

George can focus an existing dossier section or known minimap item and add authored explanation. He does not create facts, objective state, recovery, surveillance effects, or success modifiers.

Selecting a prompt can record that the response was viewed for UX continuity, but this presentation history cannot complete an objective, grant an ability, alter time, lower Paranoia, or become evidence that the protagonist learned an otherwise unknown fact.

## 9. UI, world, audio, and George feedback

- HUD lane: the canonical orb, its current presentation state, one concise line, and authored prompt buttons.
- World: the same private AR orb near the protagonist, positioned without obscuring feet, interactions, cameras, or hiding contexts.
- Audio: subtle presence/prompt/warning cues; no voice acting required.
- Visual intensity follows semantic state, not ambient animation noise.

## 10. Failure, recovery, and Restart Attempt behavior

When evidence is insufficient George says why. When an action is impossible he reports the authoritative blocker. Restart Attempt restores the George context and threshold-announcement history captured in `OperationAttemptBaseline` and clears later warnings/history.

If George content is missing or invalid, the safe behavior is a bounded unavailable response plus ordinary game controls—not an invented fallback answer. Failure, Restart Attempt, and incompatible-save surfaces remain usable without George. He may explain what Restart Attempt restores, but cannot trigger it.

## 11. Content-authoring requirements

Each `GeorgePrompt` needs ID, available states, required facts, prohibited unknowns, player-facing question, answer, fact/inference confidence, permitted UI context, localization, cooldown/suppression behavior, and Plot Bible anchor.

George visual authoring uses the recovered `GeorgeOrbLogo` geometry from pre-rewrite commit `49a4da7` as the identity source. Production assets may redraw it cleanly for world and HUD use, but must retain the approved silhouette and marks, record source/provenance, and include side-by-side proof against the recovered form. The current human-bust source and derivative remain historical evidence only and are not valid production fallback.

The minimum Level 0 inventory covers: opening controls and Miami purpose; Lira; each contact's acquired facts; unknown versus known camera risk; connected terminal; traced camera work; invalid hiding/blending; first Suspicious; last-known position; Needle dispatch/approach/verification; Pursuit; recovery; manifest present/recognized/copied/missed; one line for first entry into each Uneasy/Shaken/Breaking tier; ability locks; research availability/completion; four street-clock moments; exact departure readback; curfew/deadline warnings; medkit return; transit validation; and debrief. Each state needs a no-spam rule and an equivalent English/Ukrainian meaning.

## 12. Edge cases and prohibited shortcuts

No generic mission-summary answer to every prompt; no meaningful silence; no personal deletion/freedom arc; no personality meter; no adaptive imitation of player tone; no karma/faction judgment; no ambient spam; no spoilers; no claim that George saw an event absent from the ledger; no floating-avatar collision or public NPC reaction; no human face, portrait bust, body, party-member silhouette, or alternate assistant logo replacing the orb.

## 13. Removed behavior

Free-text chat; personality mirroring; reputation/karma commentary; dynamic-event promotion; autonomous world actions; generic reassurance as Paranoia recovery; top-console or objectives-card-only presentation; the generated human-bust AR replacement.

## 14. Post-MVP extensions

Deeper relationship arc, hardware compromise, authored George-centered quests, more contextual prompts, and campaign memory—after origin/privacy rules are approved.

Future compromise can make George's channel risky only through explicit evidence and authored rules; it cannot retroactively make his Level 0 information dishonest or turn Level 0 silence into a hidden signal. Free-text conversation, cloud orchestration, autonomous action, and personality imitation are not implied extensions.

## 15. Human-play acceptance examples

- George correctly answers what is known about a discovered camera and refuses to reveal an unknown one.
- He explains why hiding is invalid while directly observed.
- He warns about the deadline without pausing or moving the player.
- He explains each missing-information case, speaks once at each 40/70/90 Paranoia threshold, and reads the real departure state before confirmation.
- His manifest interpretation differs correctly between recognized and missed evidence.
- Both HUD and AR forms remain readable without duplicating the same sentence unnecessarily.
- Side-by-side comparison against the recovered pre-rewrite orb confirms the same silhouette and core marks in the world and HUD; no human-face/bust presentation appears on any Level 0 surface or fallback.
- Ignoring every optional George prompt leaves the operation completable and understandable through world, HUD, dialogue, and dossier feedback.
- The same prompt in English and Ukrainian cites the same facts, preserves the same confidence class, and produces no state difference.

## 16. Owning Linear ticket

`T6` (`GET-206`) owns George AR art; `T9` (`GET-209`) and `T9A` (`GET-213`) own prompt/state/UI and departure/failure legibility; `T10` (`GET-210`) and `T10A` (`GET-214`) own authored responses and onboarding use.
