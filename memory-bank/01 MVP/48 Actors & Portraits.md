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
- The twelve-set roster is fixed: four protagonist presets, Lira, Naila, Brant, two Hidzu security visual archetypes, and three civilian visual archetypes. T6 may define reusable silhouettes and wardrobe-role cues but may not name the archetypes, assign biographies, set counts or schedules, place authoritative actors, change the allocation, or add gameplay roles; T8/T10 own those content decisions.
- Exact runtime scale is unresolved in `OPEN-ART-003`; character-creation/menu visual ownership is unresolved in `OPEN-UI-002`; performance/load budgets are unresolved in `OPEN-PERF-001`.

## 4. Complete happy-path behavior

1. The player reviews four visually distinct grounded presets, chooses one, and confirms the character build.
2. The selected protagonist identity appears consistently in the world and approved portrait-bearing surfaces.
3. World actors render at a human-readable scale with stable feet/anchor placement, correct facing, and coherent idle, movement, and interaction animation.
4. Lira, Naila, Brant, human security, and authored civilian groups remain visually distinguishable through grounded role/identity treatment rather than floating permanent labels or fantasy equipment.
5. Interaction presentation follows the authoritative actor and dialogue state. Portraits or identity panels, where authored, match the same character rather than creating a second identity.
6. At the requester-approved close normal frame and composed manual overview, actors remain readable against the accepted GET-204 city and dusk, blue-hour, and curfew states without appearing giant relative to architecture. Exact numeric zoom and scale are frozen from the complete live candidate rather than the rejected greybox.

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
- The provisional `OPEN-ART-003` oracle keeps the canonical `64×96` source frame, origin `(0.50, 0.92)`, measured alpha height `54–64` px, and one replaceable manifest scale for all twelve actors. The earlier `1.15` and `1.30` greybox trials are evidence only. The complete GET-204 candidate first calibrates camera/building relationship to the approved street frame, then adjusts one shared actor scale if needed; revisions never use arbitrary per-scene scaling.
- Actor placement and visual bases must remain aligned with gameplay anchors, walkable surfaces, collision, interaction reachability, and depth ordering.
- Character-creation/main-menu presentation may use the recorded `OPEN-UI-002` recommendation provisionally. `OPEN-PERF-001` has no approved target hardware, byte, memory, decode, or frame ceiling, so T6 records exact counts/bytes, estimated decoded texture bytes, requests, cold-load timing, and observed FPS but cannot pass a shipping-performance gate. Neither surface is final while its item remains open.

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

- World actors use grounded silhouettes and readable direction/motion at the accepted normal and overview framings, against dusk, blue-hour, and curfew presentation without roof-floating or scale drift.
- Character creation and Character surfaces show the selected authored preset and callsign/build identity through the approved or provisionally recorded `OPEN-UI-002` ownership split.
- Named-actor portrait presentation, where required by authored dialogue or debrief, uses the same stable identity and graphic-noir treatment as the world actor. Each identity portrait is a `256×256` PNG with one identity, no text, face/shoulders inside the central 80% safe area, registered provenance/hash/byte metrics, and a neutral diagnostic fallback.
- Movement and interaction animation align with authored movement/interaction audio from [[49 Audio]]; visual events do not fire unrelated gameplay state.
- George remains a private near-character AR presence visually distinct from a physical world actor. T6 supplies one separately registered `256×256` transparent idle/base asset; its proof placement is near the protagonist's upper-right at `28–36` screen pixels, suppressed while a full overlay owns focus, and excluded from collision, occlusion, depth, and world-state ownership. T9 owns final states, HUD/world placement, prompts, and suppression policy. Other actors do not react to him as a visible person.
- Contextual prompts may identify an available interaction, but permanent labels cannot substitute for actor readability.

## 10. Failure, recovery, and retry behavior

- Missing, mismatched, misanchored, unreadable, or fantasy-styled actor/portrait presentation is an acceptance failure; it does not justify changing gameplay topology, actor identity, or role.
- If a visual asset cannot satisfy the complete matrix, the content remains unavailable for acceptance until corrected; no attack-capable or rejected fantasy asset silently replaces it.
- Retry restores authoritative actor positions, schedules, interactions, and protagonist appearance from the compatible operation snapshot without stale dialogue, pursuit, or animation ownership.
- Actor presentation cannot cause or resolve mission failure. Capture, Health, Paranoia, and deadline systems own failure and exact Retry state.

## 11. Content-authoring requirements

- Produce twelve coherent actor sets at `64x96`, each with eight directions, `idle`/`move`/`interact`, four frames per state, shared anchor metadata, and stable actor-set IDs.
- Produce four authored protagonist appearance presets and map each to compatible world and portrait/identity presentation.
- Produce matching `256×256` portraits for all twelve actor sets; every portrait maps to the same stable actor/appearance ID and grounded visual direction as its world set and records path, source reference, SHA-256, crop/safe area, compressed/decoded bytes, and fallback.
- Produce one separate `256×256` Takahiro Kobayashi civic-broadcast portrait with no embedded localized copy and one separate `256×256` transparent George AR idle/base asset; neither counts as an additional world actor set.
- Lira presentation may communicate only the approved mission-facing medical-supplies role; T6 may not encode the unresolved identity, relationship, beneficiaries, or passage authority in `OPEN-NAR-004` through `OPEN-NAR-006`. Naila, Brant, and George presentation may use the explicit reversible recommendations for `OPEN-NAR-009`, `OPEN-NAR-010`, and `OPEN-NAR-011` without presenting them as approved biography or hardware.
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

- T6's current acceptance gate covers assets, manifests, pixel-derived validation, a neutral appearance-selection seam, and live protagonist/contact ground-anchor presentation. Character screen, dialogue/debrief, authoritative Retry identity, security/civilian schedules, and final entitlement-backed city integration are deferred/not checked until T7/T9/T10 or runtime promotion.
- `AC-L0-001`: review all four appearances through the neutral T6 selection seam, select each across repeat starts, and confirm the chosen identity appears in the safehouse. Final Character-screen and Retry proof belongs to T7/T9.
- Meet Lira, Naila, and Brant and compare their live world/portrait identity, fixed facing, idle, and interaction readability without permanent labels; inspect their complete movement matrices in the deterministic proof board until T8 owns authored schedules.
- Use dusk delivery activity and curfew security movement; distinguish civilian/service/security roles while authoritative schedules and surveillance remain unchanged by art.
- Trigger a live named-contact interaction and confirm both actor presentations return cleanly to idle. Final dialogue, Retry, and debrief identity continuity remains a T7/T9/T10 acceptance gate rather than evidence claimed by T6.
- Inspect all twelve portraits, Takahiro's broadcast portrait, and George's AR base art for identity, crop, provenance, fallback, and grounded tone.
- `AC-L0-018`: at 1280x720, 1440x900, and 1920x1080, inspect the accepted close normal frame and full-city manual overview across dusk, blue hour, and curfew; actors must remain grounded, readable, correctly anchored, and proportionate to accepted architecture.

## 16. Owning Linear ticket

`T6` (`GET-206`) owns grounded actors, portraits, four protagonist appearances, George/entry-flow visual presentation, and the twelve-set asset contract. `T3` (`GET-203`) supplies runtime/layout anchors; `T8` (`GET-208`) supplies security/civilian state; `T9` (`GET-209`) supplies character/dialogue/HUD integration; `T10` (`GET-210`) supplies final roster content and end-to-end acceptance.
