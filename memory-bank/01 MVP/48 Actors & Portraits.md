---
status: MVP
type: system-specification
tags: [actors, portraits, animation, character-appearance]
canonical: true
---

# Actors & Portraits

## 1. Player fantasy and purpose

Actors make the district feel inhabited, watched, and human rather than populated by tactical tokens or fantasy archetypes. The player's chosen appearance persists as their identity; named contacts, security, civilians, and the verifier network's human presence remain recognizable through grounded silhouettes, facing, motion, interaction, and coherent portrait presentation. This implements `GDR-PC-002`, `GDR-ART-001`, `GDR-ART-005`, and `GDR-SUP-003`.

## 2. Player-visible verbs

- Choose one of four authored protagonist appearance presets during character creation.
- Read an actor's identity, facing, idle state, movement, and interaction state in the world.
- Approach and explicitly interact with Lira, Naila, Brant, human security, and authored civilian contexts where allowed.
- Read the matching authored identity presentation in character, dialogue, George, debrief, or other approved portrait-bearing surfaces.
- Distinguish protagonist, contacts, security, service/public civilians, and the private George AR presence without permanent labels.

## 3. Starting state and prerequisites

- New Game presents four authored visual presets before world initialization; there is no fixed Operative, mandatory Trace appearance, background, class, or package.
- Confirmation persists the selected appearance into the Level 0 run and compatible continuation data.
- Level 0 actor content uses the approved grounded actor contract: twelve actor sets, `64x96`, eight directions, `idle`/`move`/`interact`, four frames per state, and shared anchors.
- The twelve-set roster is fixed: four protagonist presets, Lira, Naila, Brant, two Hidzu security archetypes, and three civilian archetypes. T6 may define the identities of the archetypes but may not change the allocation or add gameplay roles.
- Exact runtime scale is unresolved in `OPEN-ART-003`; character-creation/menu visual ownership is unresolved in `OPEN-UI-002`; performance/load budgets are unresolved in `OPEN-PERF-001`.

## 4. Complete happy-path behavior

1. The player reviews four visually distinct grounded presets, chooses one, and confirms the character build.
2. The selected protagonist identity appears consistently in the world and approved portrait-bearing surfaces.
3. World actors render at a human-readable scale with stable feet/anchor placement, correct facing, and coherent idle, movement, and interaction animation.
4. Lira, Naila, Brant, human security, and authored civilian groups remain visually distinguishable through grounded role/identity treatment rather than floating permanent labels or fantasy equipment.
5. Interaction presentation follows the authoritative actor and dialogue state. Portraits or identity panels, where authored, match the same character rather than creating a second identity.
6. At default zoom and the `0.60` normal floor, actors remain readable against the accepted city and lighting states without appearing giant relative to architecture.

## 5. State model and transitions

- Protagonist appearance transitions from unselected to one of four authored preset IDs at character confirmation and remains stable for the run, save, Retry, and continuation data.
- A world actor presents one authoritative locomotion/interaction state at a time: `idle`, `move`, or `interact`, with one of eight facing directions and four frames for the active state.
- Presentation mirrors authoritative gameplay position, facing, movement, interaction, dialogue, and schedule state; sprite/portrait rendering never owns those transitions.
- Dialogue or another approved portrait-bearing surface selects the authored identity presentation for the same stable actor ID.
- Retry restores actor gameplay state from the operation-departure snapshot while keeping the same protagonist appearance and authored actor identities.

## 6. Rules and tuning values

- Exactly twelve grounded actor sets use `64x96` frames, eight directions, `idle`/`move`/`interact`, four frames, and shared anchors.
- Attack animation is not required because Level 0 contains no active combat loop.
- The protagonist has four authored appearance presets. There is no combinatorial body-part creator or fixed Operative/Trace identity.
- Actor art follows graphic surveillance noir: grounded contemporary clothing and roles, readable midtones, strong ink silhouettes, restrained technology, and no fantasy-Neo styling.
- The approved scale target begins at approximately `15%` above strict architectural perspective, while exact per-preset runtime scale and frame occupancy remain an acceptance decision under `OPEN-ART-003`; its recorded recommendation may be trialed through replaceable manifest values.
- Actor placement and visual bases must remain aligned with gameplay anchors, walkable surfaces, collision, interaction reachability, and depth ordering.
- Character-creation/main-menu presentation may use the recorded `OPEN-UI-002` recommendation provisionally; asset/performance trials must remain measurable against `OPEN-PERF-001`. Neither surface is final while its item remains open.

## 7. Inputs from other systems

- [[92 Character & Progression]] supplies stable protagonist identity, callsign, selected appearance, and persisted build.
- [[41 Movement, Interaction & Observation]] supplies authoritative position, facing, locomotion, interaction, and focus state.
- [[42 Surveillance, Security & Civilian Behavior]] supplies security/civilian schedules and authoritative network behavior; art does not define detection.
- [[90 Dialogue]] supplies stable speaker IDs and approved portrait-bearing dialogue state.
- [[45 HUD & Information Architecture]] supplies character creation, Character, dialogue, George, debrief, and target-viewport presentation surfaces.
- [[30 Art Direction (MVP)]] supplies world palette, scale relationship, projection, lighting, and graphic surveillance-noir criteria.
- `Level0LayoutContract` supplies actor anchors and valid ground surfaces.

## 8. Effects on other systems

- The chosen protagonist appearance persists through autosave, Retry, debrief, and future compatible continuation without changing attributes, skills, checks, or route eligibility.
- Readable facing and movement let the player interpret human security, civilians, contacts, and public behavior, but visuals never create hidden perception or schedule state.
- Actor identity connects world interaction, dialogue speaker, dossier/debrief reference, and any portrait without adding trust, class, faction meter, or combat role.
- Consistent anchors and scale preserve collision, interaction, occlusion, camera coverage readability, and depth sorting.
- Animation state grants no stealth, movement-speed, check, or surveillance modifier by itself.

## 9. UI, world, audio, and George feedback

- World actors use grounded silhouettes and readable direction/motion at default zoom and `0.60`, against dusk, blue-hour, and curfew presentation without roof-floating or scale drift.
- Character creation and Character surfaces show the selected authored preset and callsign/build identity through the approved or provisionally recorded `OPEN-UI-002` ownership split.
- Named-actor portrait presentation, where required by authored dialogue or debrief, uses the same stable identity and graphic-noir treatment as the world actor.
- Movement and interaction animation align with authored movement/interaction audio from [[49 Audio]]; visual events do not fire unrelated gameplay state.
- George remains a private near-character AR presence visually distinct from a physical world actor. Other actors do not react to him as a visible person.
- Contextual prompts may identify an available interaction, but permanent labels cannot substitute for actor readability.

## 10. Failure, recovery, and retry behavior

- Missing, mismatched, misanchored, unreadable, or fantasy-styled actor/portrait presentation is an acceptance failure; it does not justify changing gameplay topology, actor identity, or role.
- If a visual asset cannot satisfy the complete matrix, the content remains unavailable for acceptance until corrected; no attack-capable or rejected fantasy asset silently replaces it.
- Retry restores authoritative actor positions, schedules, interactions, and protagonist appearance from the compatible operation snapshot without stale dialogue, pursuit, or animation ownership.
- Actor presentation cannot cause or resolve mission failure. Capture, Health, Paranoia, and deadline systems own failure and exact Retry state.

## 11. Content-authoring requirements

- Produce twelve coherent actor sets at `64x96`, each with eight directions, `idle`/`move`/`interact`, four frames per state, shared anchor metadata, and stable actor-set IDs.
- Produce four authored protagonist appearance presets and map each to compatible world and portrait/identity presentation.
- Produce matching portraits for all twelve actor sets; every portrait maps to the same stable actor/appearance ID and grounded visual direction as its world set.
- Produce one separate Takahiro Kobayashi propaganda/broadcast portrait and separate George AR presentation art; neither counts as an additional world actor set.
- Named-actor and George presentation must not invent unresolved biography or hardware: it may use only approved rules or the explicit reversible recommendations for `OPEN-NAR-004`, `OPEN-NAR-009`, `OPEN-NAR-010`, and `OPEN-NAR-011`.
- Validate anchors, direction naming, frame order, scale, depth, interaction alignment, and all required lighting states before acceptance.
- Keep runtime scales, entry-flow layouts, and production asset budgets reversible while `OPEN-ART-003`, `OPEN-UI-002`, and `OPEN-PERF-001` are provisional; resolve them before final asset acceptance.

## 12. Edge cases and prohibited shortcuts

- No actor on a roof or outside its gameplay ground anchor; no sliding feet, direction swap, anchor jitter, or portrait/world identity mismatch.
- No permanent labels, oversized sprites, strict-perspective unreadability, or arbitrary per-scene scaling used to compensate for unresolved `OPEN-ART-003`.
- No attack animation requirement, weapon pose, combat silhouette, fantasy operative armor, or package/class visual.
- No fixed Trace/Operative, background-dependent appearance, or appearance effect on checks and routes.
- No portrait text baked into assets; English/Ukrainian semantics remain in the content/localization layer.
- No use of actor visuals as authoritative collision, detection, schedule, or mission state.

## 13. Removed behavior

- `GDR-REM-001`: fixed Operative and mandatory Trace identity.
- `GDR-REM-002`: Ghost/Wire/Force packages and loadout-driven appearance.
- `GDR-REM-011`: fantasy-Neo actors, permanent labels, broad glow, and rejected presentation.
- Fourteen attack-capable fantasy sheets; the current contract is twelve grounded noncombat sets.
- Earlier `+18%` scaling; `GDR-SUP-003` replaces it with an approximate `+15%` starting target pending `OPEN-ART-003` acceptance.

## 14. Post-MVP extensions

- Future campaign locations may add grounded actor sets, portrait states, or new interaction animation only through a new authored content and performance decision.
- Attack/combat animation is not an approved extension: active combat was removed, while only a broader noncombat confrontation interface is postponed by `GDR-POST-002`.
- Additional appearance/build research is postponed by `GDR-POST-007` and creates no Level 0 dependency.

## 15. Human-play acceptance examples

- `AC-L0-001`: review all four appearances, select each across repeat starts, and confirm the chosen identity persists into the safehouse and Character presentation.
- Meet Lira, Naila, and Brant and compare their world/portrait identity, facing, idle, movement, and interaction readability without permanent labels.
- Use dusk delivery activity and curfew security movement; distinguish civilian/service/security roles while authoritative schedules and surveillance remain unchanged by art.
- Trigger a dialogue, interaction, Retry, and debrief; confirm actor identity and protagonist appearance remain coherent with no stale animation or portrait.
- `AC-L0-018`: at 1280x720, 1440x900, and 1920x1080, inspect default zoom and `0.60`; actors must remain grounded, readable, correctly anchored, and proportionate to architecture in required lighting states.

## 16. Owning Linear ticket

`T6` (`GET-206`) owns grounded actors, portraits, four protagonist appearances, George/entry-flow visual presentation, and the twelve-set asset contract. `T3` (`GET-203`) supplies runtime/layout anchors; `T8` (`GET-208`) supplies security/civilian state; `T9` (`GET-209`) supplies character/dialogue/HUD integration; `T10` (`GET-210`) supplies final roster content and end-to-end acceptance.
