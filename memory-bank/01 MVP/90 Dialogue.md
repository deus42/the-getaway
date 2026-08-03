---
status: MVP
type: system-specification
tags: [dialogue, checks, contacts, localization]
canonical: true
---

# Dialogue and Deterministic Checks

## 1. Player fantasy and purpose

Dialogue is practical RPG play. The protagonist reads people, exposes what their build and knowledge allow, accepts costs, and changes how the operation can be understood or completed. Conversations are authored dramatic scenes, not vending machines for exposition, trust points, or generic bonuses.

## 2. Player-visible verbs

The player can:

- begin a conversation through explicit interaction;
- read the speaker’s exact line and review recent dialogue history;
- select the exact line the protagonist will say;
- inspect visible deterministic requirements before choosing;
- see locked choices and the concrete capability or fact they require;
- learn facts, clarify routes, spend time, accept consequences, and fail forward;
- leave a conversation when the authored scene allows it;
- revisit contacts when their authored state permits it.

## 3. Starting state and prerequisites

- Lira is the primary Level 0 contact.
- Naila and Brant are optional preparation contacts.
- Each conversation node has a stable ID, speaker, localized line, available choices, conditions, effects, and next-node behavior.
- `PlayerBuild`, `FactLedger`, `WorldClockState`, mission state, and relevant outcome history are available to the resolver.
- Dialogue begins only through explicit interaction in range with a currently available contact.
- Dialogue acquires a full simulation pause before the first line appears.

## 4. Complete happy-path behavior

1. The player explicitly speaks with Lira outside the safehouse.
2. Lira explains the confiscated medical supplies, the Hidzu logistics site, the midnight deadline, and the promised outbound passage.
3. The player’s exact choices can clarify the situation, expose build-specific understanding, and set practical tone without awarding currency or generic relationship points.
4. Optional Naila and Brant conversations provide factual knowledge: camera/terminal topology and delivery/service behavior respectively.
5. During or after infiltration, authored interactions may use deterministic checks with visible requirements and fail-forward results.
6. On return, Lira reads the actual outcome ledger: contacts consulted, timing, camera handling, pursuit, injuries, Paranoia, medkits, and optional evidence.
7. The debrief changes future-facing facts and Miami handoff state without loading Level 1.

## 5. State model and transitions

Each conversation is an authored graph:

`Unavailable → Available → Active → Resolved | Suspended`

- `Unavailable`: prerequisites or schedule do not permit interaction; the world prompt explains why when the contact is otherwise visible.
- `Available`: explicit interaction may open the scene.
- `Active`: simulation is paused; only declared dialogue inputs are accepted.
- `Resolved`: effects are committed atomically and the appropriate return/revisit state is set.
- `Suspended`: used only when an authored external failure or scene transition interrupts safely; reopening resumes from a declared node rather than replaying committed effects.

Each choice resolves in this order:

1. evaluate availability and locked reason;
2. compute the deterministic check if present;
3. choose success or fail-forward effect;
4. apply facts, objective changes, time, Health, Paranoia, and outcome entries atomically;
5. advance to the authored next node;
6. announce material changes.

## 6. Rules and tuning values

- Checks never roll random dice.
- Resolution is `attribute + skill − Paranoia penalty + authored situational modifier` and succeeds when the result meets or exceeds the visible requirement.
- A designated fact may reveal a choice, lower a specific requirement, or guarantee a specific recognition. Facts are never universal numeric currency.
- The selected UI choice is the protagonist’s exact spoken line, not an abstract intent label that produces surprising dialogue.
- Every authored choice in the reached dialogue node remains visible when locked and states the exact missing attribute, skill, fact, or state. Undiscovered content belongs to a later unreached node; it is not hidden as a locked choice in the current node.
- Fail-forward changes the situation and communicates the cost; it does not silently dead-end the mission.
- Optional exposition grants no XP, credits, inventory, or relationship score.
- Dialogue pauses time, cameras, drone, NPC schedules, movement, and pursuit.
- English and Ukrainian must produce equivalent state transitions and effects.
- Current proposed Level 0 check thresholds are catalogued in [[13 Level 0 Content and State Matrix]] under `OPEN-RPG-001`; exact fact and situational modifiers are governed separately by `OPEN-RPG-004`. Their recorded recommendations may drive reversible authored trials, but remain non-final until accepted.

## 7. Inputs from other systems

- [[92 Character & Progression]] supplies attributes, skills, level, and the current Paranoia penalty.
- [[46 Facts, Dossier, Minimap & Terminals]] supplies mission state and the Fact Ledger.
- [[80 Day-Night Cycle]] supplies contact availability and pause ownership.
- [[40 George (AI Companion)]] consumes verified outcomes but does not resolve dialogue.
- [[35 Narrative Alignment]] and [[03 Lore/Plot Bible]] constrain character voice, setting, and disclosed knowledge.
- [[13 Level 0 Content and State Matrix]] owns the dialogue-node and check catalogs.

## 8. Effects on other systems

Dialogue may:

- add an authored fact with acquisition provenance;
- refine an objective or minimap marker;
- open or clarify a route without making it the only valid path;
- advance world time through an explicitly authored consequence while the scene itself remains paused;
- change Health or Paranoia through a clearly communicated event;
- change contact availability and debrief response;
- set route, evidence, or future Miami outcome fields;
- initiate a deterministic interception result.

Dialogue may not directly move the protagonist, operate a terminal, loop a camera, alter unknown surveillance, or fabricate off-screen success.

## 9. UI, world, audio, and George feedback

- Dialogue uses a large anchored overlay while keeping the paused world visible.
- Speaker portrait, speaker name, current line, and choices are visually dominant.
- Important prior lines remain accessible without exposing internal node IDs or condition syntax.
- Requirement explanations use plain player language and show the relevant attribute, skill, fact, modifier, and Paranoia penalty.
- Material outcomes receive concise feedback: fact learned, route clarified, time spent, Health/Paranoia change, objective update, or consequence recorded.
- Portraits and world sprites must represent the same identity.
- Audio uses restrained open/choice/locked/outcome cues; no voice acting is required.
- George does not interject over a contact’s line. After the conversation closes, he may interpret only the verified fact or consequence that was just acquired.

## 10. Failure, recovery, and retry behavior

- Failed checks execute authored fail-forward effects immediately and explain them.
- A conversation cannot leave the player with no mission path unless it is an explicit failure/capture outcome.
- Interrupted dialogue releases pause ownership safely and cannot duplicate committed effects on reopen.
- Retry restores the exact departure-era conversation states, facts, and contact visits from the snapshot; post-departure conversation outcomes are discarded.
- New Game clears all dialogue state.
- Missing localization, portrait, or node targets fail validation and use a development-safe diagnostic fallback; production may not silently skip a required line.

## 11. Content-authoring requirements

- Author the complete Lira briefing, medkit return, route-sensitive debrief, and passage handoff.
- Author optional Naila and Brant conversations with at least one practical fact each and clear skip behavior.
- Author interception dialogue/check options that match the protagonist’s grounded civilian competence.
- Author dialogue variants for optional manifest recognition, pursuit, injury, Paranoia, camera loop/trace, contacts consulted, and deadline pressure.
- Every node and choice needs English and Ukrainian text, portrait/speaker metadata, conditions, effects, and human-readable locked copy.
- Record all factual effects in the stable Fact Ledger rather than burying knowledge in dialogue-history strings.

## 12. Edge cases and prohibited shortcuts

- No procedural dialogue generator, runtime tone mixer, LLM dialogue orchestration, or random response assembly.
- No free-text player input.
- No generic trust meter, persuasion currency, reputation reward, or XP for exhausting branches.
- No hidden RNG, hidden requirements, misleading intent labels, or success copy when the committed state differs.
- No contact can grant an arbitrary stealth/combat buff unrelated to the fact they provided.
- No mandatory Naila/Brant errand chain.
- No dialogue can progress while another pause-owning modal creates ambiguous input ownership.

## 13. Removed behavior

Removed: Ghost/Wire/Force selection in dialogue, mandatory Naila→Brant chain, skill/background exposition rewards, generic trust points, procedural templates, tone palettes, witness gossip, reputation propagation, free-text George-like input in contact scenes, and tactical-combat dialogue handoff.

## 14. Post-MVP extensions

Post-MVP may add more contacts, longer relationship arcs, richer bilingual performance, and consequence callbacks. Any reputation or procedural narrative proposal requires a new design decision and cannot be inferred from the Level 0 fact ledger.

## 15. Human-play acceptance examples

1. A first-time player understands Lira’s request, reward, site, curfew, and midnight deadline from the conversation without external instructions.
2. Two builds see different visible options; the UI explains the difference before selection and the outcome after selection.
3. Naila grants camera-topology knowledge that refines the dossier and can guarantee the designated manifest recognition without becoming a general bonus.
4. Brant reveals a credible delivery context that clarifies the dusk route but is not required to enter it.
5. A failed check changes time, Paranoia, route clarity, or another declared state while keeping completion possible.
6. Lira’s debrief accurately distinguishes contacts skipped, route, camera trace, pursuit, injuries, Paranoia peak, and manifest outcome.
7. English and Ukrainian runs commit identical state changes for the same selections.

## 16. Owning Linear ticket

- System infrastructure: `T9` (`GET-209`) — Dialogue, George, facts, dossier, social feed, and four-lane HUD.
- Authored Level 0 scenes: `T10` (`GET-210`) — Tokyo escape content, audio, onboarding, and end-to-end acceptance.
- Canonical decisions: `GDR-DLG-001` through `GDR-DLG-003`, `GDR-FACT-001`, `GDR-MIS-003` through `GDR-MIS-008`, `GDR-RPG-003`, `GDR-RPG-004`, `GDR-GEO-002`, and `GDR-GEO-003` in [[12 Game Design Decision Register]].
