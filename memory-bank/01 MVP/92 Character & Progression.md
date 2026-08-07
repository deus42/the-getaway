---
status: MVP
type: system-specification
tags: [cover-select, abilities, gates, research, progression]
canonical: true
---

# Character, Covers, Abilities, and Research

## 1. Player fantasy and purpose

The protagonist is one authored person — an American expatriate with a missing father and a reason to leave — whose identity the player chooses as a *cover*: the life they lived in Tokyo before tonight. Identity is a person, not a budget. Capability is binary: the protagonist either can do a thing or cannot, and the interesting pressure is that stress switches parts of that capability off. This carries identity without numbers, in the tradition of Pentiment's numberless role-playing and Deus Ex's binary enablers, with Disco Elysium's thought cabinet inverted into the progression spine.

## 2. Player-visible verbs

The player can:

- select one of four authored covers at New Game (one playable in Level 0; three visibly disabled);
- read each cover's short fiction and its three starting abilities;
- inspect every held ability, its `fragile`/`hardened` tag, and — when locked — the exact tier reason;
- see every gate as met or not met with its exact reason, before and after choosing;
- research a new ability at the safehouse by spending a declared fact plus world minutes;
- open the Character screen during paused play.

## 3. Starting state and prerequisites

- New Game opens cover-select before Level 0. There is no numeric allocation step and no free-text naming step.
- Four covers of the one protagonist are presented with authored bilingual names and one-paragraph fictions (`OPEN-NAR-016`); the Level 0 playable cover is social-forward, and the other three render honestly as future selections.
- Confirming the cover creates the run identity: cover ID, the cover's authored display presentation, and its three starting abilities.
- The ability catalog, `fragile`/`hardened` tags, and lock tiers are versioned authored content (`OPEN-ABL-001`); they are never persisted as copies inside the run beyond held-ability IDs and research state.
- The game stores cover identity separately from condition (Paranoia) and knowledge (facts) state.

## 4. Complete happy-path behavior

1. The player reads the four covers and selects the playable one.
2. Level 0 begins at the safehouse at Calm with the cover's three abilities lit.
3. During play, authored gates consult held abilities, known facts, and the Paranoia tier; each gate shows met or not met with its exact reason before selection and the same verdict after resolution.
4. When Paranoia enters a higher tier, abilities tagged for that tier lock visibly; `hardened` abilities hold.
5. At the safehouse, the player may research: a listed option consumes its declared fact plus its world-minute cost and grants one new ability, once.
6. The debrief records held abilities, research completed, and the peak Paranoia tier, and carries the resulting identity into future Level 1 data.

## 5. State model and transitions

Run identity contains:

- cover ID;
- held ability IDs (starting plus researched);
- research state (per option: available, consumed).

Cover-select states:

`COVER_SELECT → CONFIRMED`

Ability states (derived, never duplicated into persistence):

`HELD → LIT | LOCKED(tier)` — locking derives from the current Paranoia tier and the ability's authored tag; it is never stored, only computed.

Research states per option:

`UNAVAILABLE(missing fact) → AVAILABLE → CONSUMED(ability granted)`

## 6. Rules and tuning values

### Covers

| Cover | Level 0 state | Starting abilities | Character |
|---|---|---|---|
| Social-forward cover | Playable | Three abilities, mostly `fragile` | The one who talks; strongest with people, most exposed to stress. |
| Technical cover | Visibly disabled | Authored later | The one who understands the network. |
| Movement cover | Visibly disabled | Authored later | The one who was never where you looked. |
| Fourth cover | Visibly disabled | Authored later | Reserved with its fiction (`OPEN-NAR-016`). |

### Abilities

- An ability is a named binary key: held or not held. No ranks, no partial states.
- Every ability is tagged `hardened` (never locks) or `fragile` with a declared lock tier (`fragile: uneasy` locks at Uneasy and above; `fragile: shaken` locks at Shaken and above).
- Each cover starts with exactly three abilities; the Level 0 catalog stays within twelve to sixteen total (`OPEN-ABL-001`).
- Social abilities tag mostly `fragile`; movement and technical abilities tag mostly `hardened` — character expressed as stress response.

### Gates

- A gate passes when the player holds a designated ability that is currently lit, holds a designated fact, or accepts the gate's declared costed path (`GDR-RPG-009`).
- Every authored gate keeps at least two real solutions among ability/fact/costed path.
- Presentation is met/not-met with the exact reason — the missing ability, the locking tier, the missing fact, or the cost — never arithmetic (`GDR-RPG-007`).
- Every nonterminal failed or refused gate commits a declared worse-but-real path (time, Paranoia, exposure, or route change). Only the final failed capture-escape gate may end the attempt.
- No random roll, critical result, or hidden percentage exists.

### Research

- Research happens only at the safehouse under the availability policy of `OPEN-SAFE-001`.
- Each option declares one required fact, a world-minute cost, and the one ability it grants; it can be consumed once.
- One to two options per run, each costing 15–20 world minutes, remain the reversible trial values (`OPEN-ABL-002`).
- Research never uses randomness, never grants facts, and never removes Paranoia.

## 7. Inputs from other systems

- [[60 Paranoia]] supplies the current tier that derives ability locks.
- [[90 Dialogue]] requests gate verdicts and displays reasons/results.
- [[70 Stealth]] consumes designated movement abilities where declared.
- [[46 Facts, Dossier, Minimap & Terminals]] supplies the facts that gates and research consume.
- [[44 Safehouse, Save & Restart Attempt]] controls the research context and persistence.
- [[48 Actors & Portraits]] maps the cover to its validated actor/portrait presentation.

## 8. Effects on other systems

- Cover and held abilities alter available dialogue, recognition, camera looping, trace risk, pursuit recovery, and interception options.
- The Paranoia tier gauge and ability lock states appear in the protagonist HUD lane (`GDR-UI-005`).
- Available research appears as a safehouse action.
- The cover's authored name appears in HUD, dialogue, debrief, and save metadata.
- The cover selects the protagonist world sprite and portrait consistently.
- Identity, abilities, and research history persist into future Miami Level 1 data.

## 9. UI, world, audio, and George feedback

- Cover-select explains each cover in concrete Level 0 language — who they were, what they can do — never in genre-role abstractions and never with numbers.
- The Character screen shows only the cover, held abilities with their lit/locked states and reasons, the Paranoia tier, important facts, and long-term consequence summaries.
- Gate UI shows the verdict and its exact reason where the choice lives, before selection and after resolution.
- Research options show the required fact, the world-minute cost, and the ability granted before confirmation.
- George may explain an ability, a lock, or a known consequence, but does not recommend a cover, spend time, or reveal hidden gates.

## 10. Failure, recovery, and Restart Attempt behavior

- Cover-select cannot confirm a disabled cover or a malformed selection.
- After confirmation, the persisted identity is authoritative for the run; replacing it requires New Game.
- Restart Attempt restores cover, held abilities, and research state exactly from `OperationAttemptBaseline`.
- New Game clears identity, abilities, and research state and reopens cover-select.
- Retired numeric-identity saves (attributes, skills, XP, levels) are rejected; they are never partially mapped into covers or abilities.
- A failed gate commits its authored fail-forward result and cannot be rerolled by reopening the same interaction; validation rejects a nonterminal gate whose failure changes only prose.

## 11. Content-authoring requirements

- Author four covers: bilingual names, one-paragraph fictions, sprite/portrait identities with stable IDs, and the three disabled presentations (`OPEN-NAR-016`).
- Author the ability catalog with stable IDs, bilingual names, one-line concrete meanings, `fragile`/`hardened` tags, and lock tiers (`OPEN-ABL-001`).
- Catalog every Level 0 gate with its context, ability path, fact path, costed path, lock interaction, success, and a concrete fail-forward effect; validator coverage rejects every nonterminal entry whose failure changes only prose.
- Author research options with required facts, world-minute costs, granted abilities, and bilingual descriptions (`OPEN-ABL-002`).
- Author Character-screen consequence summaries from stable outcome fields rather than raw logs.

## 12. Edge cases and prohibited shortcuts

- No numeric attribute, skill, XP, level, point pool, allocation, or respec anywhere — state, UI, save, or copy.
- No fixed Trace/Operative name, free-text naming, Courier/Cadet/Medic origin, or Ghost/Wire/Force package.
- No gate without a mounted verdict-and-reason, no preview/result drift, no nonterminal wall, and no final failure outside the last capture-escape gate.
- No ability granted by anything except cover start or completed research; no fact converted into a permanent ability.
- No hidden lock math: every lock names its tier; every lit ability is genuinely usable.
- No research randomness, chains beyond one step, or options that circumvent `OPEN-SAFE-001` availability.
- No save migration that guesses how numeric builds map to covers or abilities.

## 13. Removed behavior

Removed: fixed protagonist, mandatory Trace name, free-form backgrounds, four-attribute/eight-skill numeric builds with creation budgets and caps (superseded `GDR-RPG-001`/`GDR-RPG-002`), the deterministic check formula (superseded `GDR-RPG-003`), XP milestones and safehouse level-ups (superseded `GDR-RPG-005`/`GDR-RPG-006`), callsign entry and appearance-preset selection (superseded `GDR-PC-002`), six-attribute variants, Ghost/Wire/Force packages, large perk trees, combat skill trees, package gadgets, enemy-kill XP, inventory/equipment-derived stats, capstone perks, and automatic level allocation.

## 14. Post-MVP extensions

Post-MVP may enable the three disabled covers (`GDR-PC-007`), add Level 1 gates, deepen research chains, and extend the ability catalog. New numeric systems, ranks, or respec mechanics require explicit design approval and cannot be inferred from the binary model.

## 15. Human-play acceptance examples

1. A first-time player reads the covers and starts playing in under one minute without needing genre knowledge, and no number appears anywhere in the flow.
2. The three disabled covers render honestly as future selections and cannot be confirmed.
3. Every authored gate shows met/not-met with its exact reason before choice and the identical verdict after resolution, and every authored gate is solvable at least two ways under normal controls.
4. Entering Uneasy locks exactly the declared `fragile: uneasy` abilities with the tier named as the reason, while a `hardened` ability passes its gate at every tier.
5. A research option is unavailable without its fact, consumes exactly its declared fact and world minutes when taken, grants exactly one ability, and cannot be repeated.
6. Naila's designated fact guarantees only the manifest recognition it names.
7. Restart Attempt returns the exact departure cover, abilities, and research state; New Game reopens cover-select with no stale state.

## 16. Owning Linear ticket

- Primary: `T7A` (`GET-216`) — Paranoia tiers, binary abilities, cover-select, and research; historic numeric scope remains with `T7` (`GET-207`) as delivered evidence.
- Integration: `T7A` captures/restores identity in `OperationAttemptBaseline`; `T9A` (`GET-213`) mounts gate verdict/reason presentation and validates fail-forward behavior.
- Actor identity dependency: `T6` (`GET-206`) — Grounded actors, portraits, and entry-flow presentation.
- Canonical decisions: `GDR-PC-003`, `GDR-PC-005`, `GDR-PC-006`, `GDR-PC-007`, `GDR-RPG-004`, `GDR-RPG-007`, `GDR-RPG-008`, `GDR-RPG-009`, `GDR-RPG-010`, `GDR-PAR-008`, `GDR-MIS-008`, `GDR-GOV-009`, `GDR-REM-001`, `GDR-REM-002`, and `GDR-REM-006` in [[12 Game Design Decision Register]].
