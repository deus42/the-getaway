---
status: MVP
type: system-specification
tags: [actors, portraits, animation, character-appearance]
canonical: true
---

# Actors & Portraits

## 1. Player fantasy and purpose

Actors make the district feel inhabited, watched, and human rather than populated by tactical tokens or fantasy archetypes. The selected cover's authored appearance persists as the protagonist's identity; named contacts, security, civilians, and the verifier network's human presence remain recognizable through grounded silhouettes, facing, motion, interaction, coherent portrait presentation, and subtle integration with authored light. This implements `GDR-PC-006`, `GDR-ART-001`, `GDR-ART-005`, `GDR-ART-011`, and `GDR-SUP-003`.

## 2. Player-visible verbs

- Review four authored cover appearances during cover-select and confirm the one playable Level 0 cover.
- Read an actor's identity, facing, idle state, movement, and interaction state in the world.
- Approach and explicitly interact with Lira, Naila, Brant, human security, and authored civilian contexts where allowed.
- Read the matching authored identity presentation in character, dialogue, George, debrief, or other approved portrait-bearing surfaces.
- Distinguish protagonist, contacts, security, service/public civilians, and the private George AR presence without permanent labels.

## 3. Starting state and prerequisites

- New Game presents four authored cover identities before world initialization; one is playable and three remain visibly disabled. There is no fixed Operative, mandatory Trace appearance, free-text name, numeric build, class, or package.
- Confirmation persists the selected cover and its authored appearance into the Level 0 run and compatible continuation data.
- Level 0 actor content uses the approved grounded actor contract: twelve actor sets, `64x96`, eight directions, `idle`/`move`/`interact`, four frames per state, and shared anchors.
- The twelve-set roster is fixed: four protagonist presets, Lira, Naila, Brant, two Hidzu Corporation security visual archetypes, and three civilian visual archetypes. T6 may define reusable silhouettes and wardrobe-role cues but may not name the archetypes, assign biographies, set counts or schedules, place authoritative actors, change the allocation, or add gameplay roles; T8/T10 own those content decisions.
- Human/world proportion is approved by `GDR-ART-014`; the exact shared runtime scalar is derived from the accepted GET-205 camera/export to reproduce that outcome. Character-creation/menu visual ownership remains unresolved in `OPEN-UI-002`; performance/load budgets remain unresolved in `OPEN-PERF-001`.

## 4. Complete happy-path behavior

1. The player reviews four visually distinct grounded covers, confirms the playable one, and sees the three future covers remain honestly disabled.
2. The selected protagonist identity appears consistently in the world and approved portrait-bearing surfaces.
3. World actors render at a human-readable scale with stable feet/anchor placement, correct facing, and coherent idle, movement, and interaction animation.
4. Lira, Naila, Brant, human security, and authored civilian groups remain visually distinguishable through grounded role/identity treatment rather than floating permanent labels or fantasy equipment.
5. Interaction presentation follows the authoritative actor and dialogue state. Portraits or identity panels, where authored, match the same character rather than creating a second identity.
6. At the requester-approved close normal frame and composed manual overview, actors remain readable against the accepted GET-204 city and dusk, blue-hour, and curfew states without appearing giant relative to architecture. Their foot anchors sample authored light regions and ease a subtle semantic amber/cyan tint without changing gameplay.

## 5. State model and transitions

- Protagonist identity transitions from unselected to one authored cover ID at confirmation; the cover supplies the stable appearance ID for the run, save, Restart Attempt, and continuation data.
- A world actor presents one authoritative locomotion/interaction state at a time: `idle`, `move`, or `interact`, with one of eight facing directions and four frames for the active state.
- Presentation mirrors authoritative gameplay position, facing, movement, interaction, dialogue, and schedule state; sprite/portrait rendering never owns those transitions.
- Dialogue or another approved portrait-bearing surface selects the authored identity presentation for the same stable actor ID.
- Restart Attempt restores actor gameplay state from `OperationAttemptBaseline` while keeping the same protagonist appearance and authored actor identities.

## 6. Rules and tuning values

- Exactly twelve grounded actor sets use `64x96` frames, eight directions, `idle`/`move`/`interact`, four frames, and shared anchors.
- Attack animation is not required because Level 0 contains no active combat loop.
- The protagonist has four authored cover appearances. There is no combinatorial body-part creator, independent appearance picker, or fixed Operative/Trace identity.
- Actor art follows graphic surveillance noir: grounded contemporary clothing and roles, readable midtones, strong ink silhouettes, restrained technology, and no fantasy-Neo styling.
- Keep the canonical `64×96` source frame, origin `(0.50, 0.92)`, measured alpha height `54–64` px, and one shared runtime scale for all twelve actors. Calibrate that scalar only after GET-205 fixes the camera/building relationship. At `1440×900` with the approved `16–18%` dock, the protagonist's visible alpha body targets approximately `68–80 px`, excluding shadow, selection ring, and George, while the human/door/sidewalk/street/building relationship must visually match the locked blend. The earlier `1.15`, `1.30`, `0.64`, and `0.96` values are evidence only; no per-preset, protagonist-only, per-scene, or per-zoom compensation is allowed.
- Actor placement and visual bases must remain aligned with gameplay anchors, walkable surfaces, collision, interaction reachability, and depth ordering.
- `ActorLightRegion` metadata defines authored semantic amber/cyan regions. Runtime samples the strongest eligible region at each actor foot anchor, eases transitions, and applies a restrained tint only. Final strength and feathering remain open under `OPEN-ART-005`; the reversible baseline is strongest-region-only blending, `250 ms` easing, and restrained intensity.
- Lighting is presentation-only. It never changes actor movement, collision, detection, camera visibility, gate verdicts, schedules, or civilian knowledge.
- Cover-select/main-menu presentation may use the recorded `OPEN-UI-002` recommendation provisionally. `OPEN-PERF-001` has no approved target hardware, byte, memory, decode, or frame ceiling, so T6 records exact counts/bytes, estimated decoded texture bytes, requests, cold-load timing, and observed FPS but cannot pass a shipping-performance gate. Neither surface is final while its item remains open.

## 7. Inputs from other systems

- [[92 Character, Covers, Abilities & Research]] supplies the stable cover, authored appearance mapping, held abilities, and research state.
- [[41 Movement, Interaction & Observation]] supplies authoritative position, facing, locomotion, interaction, and focus state.
- [[42 Surveillance, Security & Civilian Behavior]] supplies security/civilian schedules and authoritative network behavior; art does not define detection.
- [[90 Dialogue]] supplies stable speaker IDs and approved portrait-bearing dialogue state.
- [[45 HUD & Information Architecture]] supplies cover-select, Character, dialogue, George, debrief, and target-viewport presentation surfaces.
- [[30 Art Direction (MVP)]] supplies world palette, scale relationship, projection, lighting, and graphic surveillance-noir criteria.
- `Level0LayoutContract` supplies actor anchors and valid ground surfaces.
- The visual manifest supplies `ActorLightRegion` metadata and semantic palette tokens.

## 8. Effects on other systems

- The selected cover appearance persists through autosave, Restart Attempt, debrief, and future compatible continuation; presentation never changes held abilities, gate verdicts, or route eligibility.
- Readable facing and movement let the player interpret human security, civilians, contacts, and public behavior, but visuals never create hidden perception or schedule state.
- Actor identity connects world interaction, dialogue speaker, dossier/debrief reference, and any portrait without adding trust, class, faction meter, or combat role.
- Consistent anchors and scale preserve collision, interaction, occlusion, camera coverage readability, and depth sorting.
- Animation state grants no stealth, movement-speed, gate, or surveillance modifier by itself.
- Light-region membership and tint grant no gameplay modifier and never become surveillance evidence.

## 9. UI, world, audio, and George feedback

- World actors use grounded silhouettes and readable direction/motion at the accepted normal and overview framings, against dusk, blue-hour, and curfew presentation without roof-floating or scale drift.
- Actors ease between neutral, semantic amber, and semantic cyan presentation as their foot anchors cross authored regions; no arbitrary per-actor tint is authored in scene code.
- Cover-select and Character surfaces show the selected authored cover and its appearance/ability identity through the approved or provisionally recorded `OPEN-UI-002` ownership split.
- Named-actor portrait presentation, where required by authored dialogue or debrief, uses the same stable identity and graphic-noir treatment as the world actor. Each identity portrait is a `256×256` PNG with one identity, no text, face/shoulders inside the central 80% safe area, registered provenance/hash/byte metrics, and a neutral diagnostic fallback.
- Movement and interaction animation align with authored movement/interaction audio from [[49 Audio]]; visual events do not fire unrelated gameplay state.
- George remains a private near-character AR presence visually distinct from a physical world actor. T6 supplies one separately registered `256×256` transparent idle/base asset; its proof placement is near the protagonist's upper-right at `28–36` screen pixels, suppressed while a full overlay owns focus, and excluded from collision, occlusion, depth, and world-state ownership. T9 owns final states, HUD/world placement, prompts, and suppression policy. Other actors do not react to him as a visible person.
- Contextual prompts may identify an available interaction, but permanent labels cannot substitute for actor readability.

## 10. Failure, recovery, and Restart Attempt behavior

- Missing, mismatched, misanchored, unreadable, or fantasy-styled actor/portrait presentation is an acceptance failure; it does not justify changing gameplay topology, actor identity, or role.
- If a visual asset cannot satisfy the complete matrix, the content remains unavailable for acceptance until corrected; no attack-capable or rejected fantasy asset silently replaces it.
- Restart Attempt restores authoritative actor positions, schedules, interactions, and protagonist appearance from `OperationAttemptBaseline` without stale dialogue, pursuit, tint transition, or animation ownership.
- Actor presentation cannot cause or resolve mission failure. Breakdown, capture, and deadline systems own failure and exact Restart Attempt state.

## 11. Content-authoring requirements

- Produce twelve coherent actor sets at `64x96`, each with eight directions, `idle`/`move`/`interact`, four frames per state, shared anchor metadata, and stable actor-set IDs.
- Produce four authored protagonist appearance presets and map each to compatible world and portrait/identity presentation.
- Produce matching `256×256` portraits for all twelve actor sets; every portrait maps to the same stable actor/appearance ID and grounded visual direction as its world set and records path, source reference, SHA-256, crop/safe area, compressed/decoded bytes, and fallback.
- Produce one separate `256×256` Takahiro Kobayashi civic-broadcast portrait with no embedded localized copy and one separate `256×256` transparent George AR idle/base asset; neither counts as an additional world actor set.
- Lira presentation may communicate only the approved mission-facing medical-supplies role; T6 may not encode the unresolved identity, relationship, beneficiaries, or passage authority in `OPEN-NAR-004` through `OPEN-NAR-006`. Naila, Brant, and George presentation may use the explicit reversible recommendations for `OPEN-NAR-009`, `OPEN-NAR-010`, and `OPEN-NAR-011` without presenting them as approved biography or hardware.
- Validate anchors, direction naming, frame order, scale, depth, interaction alignment, `ActorLightRegion` metadata, foot-anchor sampling, easing, semantic tokens, and all required lighting states before acceptance.
- Keep the derived shared runtime scalar reproducible and easy to recalibrate if the accepted camera/export changes. Entry-flow layouts and production asset budgets remain reversible while `OPEN-UI-002` and `OPEN-PERF-001` are provisional; resolve them before their final acceptance.

## 12. Edge cases and prohibited shortcuts

- No actor on a roof or outside its gameplay ground anchor; no sliding feet, direction swap, anchor jitter, or portrait/world identity mismatch.
- No permanent labels, oversized sprites, protagonist-only enlargement, strict-perspective unreadability, arbitrary per-scene scaling, or zoom-dependent counter-scaling that violates `GDR-ART-014`.
- No attack animation requirement, weapon pose, combat silhouette, fantasy operative armor, or package/class visual.
- No fixed Trace/Operative, background-dependent appearance, or appearance effect on checks and routes.
- No portrait text baked into assets; English/Ukrainian semantics remain in the content/localization layer.
- No use of actor visuals as authoritative collision, detection, schedule, or mission state.
- No stacked light regions, gameplay effect, hard snap, broad wash, or amber/cyan tint stronger than the accepted restrained presentation.

## 13. Removed behavior

- `GDR-REM-001`: fixed Operative and mandatory Trace identity.
- `GDR-REM-002`: Ghost/Wire/Force packages and loadout-driven appearance.
- `GDR-REM-011`: fantasy-Neo actors, permanent labels, broad glow, and rejected presentation.
- Fourteen attack-capable fantasy sheets; the current contract is twelve grounded noncombat sets.
- Earlier `+18%`, provisional `+15%`, and technical `0.64`/`0.96` scale claims as visual authority; `GDR-ART-014` replaces them with the measured locked-blend relationship.

## 14. Post-MVP extensions

- Future campaign locations may add grounded actor sets, portrait states, or new interaction animation only through a new authored content and performance decision.
- Attack/combat animation is not an approved extension: active combat was removed, while only a broader noncombat confrontation interface is postponed by `GDR-POST-002`.
- Additional appearance/build research is postponed by `GDR-POST-007` and creates no Level 0 dependency.

## 15. Human-play acceptance examples

- T6's current acceptance gate covers assets, manifests, pixel-derived validation, a neutral appearance-selection seam, and live protagonist/contact ground-anchor presentation. Character screen, dialogue/debrief, authoritative Restart Attempt identity, security/civilian schedules, and final entitlement-backed city integration are deferred/not checked until T7/T9/T10 or runtime promotion.
- `AC-L0-001`: review all four appearances through the neutral T6 selection seam, select each across repeat starts, and confirm the chosen identity appears in the safehouse. Final Character-screen and Restart Attempt proof belongs to T7/T9.
- Meet Lira, Naila, and Brant and compare their live world/portrait identity, fixed facing, idle, and interaction readability without permanent labels; inspect their complete movement matrices in the deterministic proof board until T8 owns authored schedules.
- At `1440×900`, compare a clean normal-play crop directly with the locked blend: the protagonist's visible alpha body is approximately `68–80 px`, surrounding human roles share the same base scale, doors and sidewalks retain the reference relationship, and overview zoom changes all world-space elements uniformly.
- Use dusk delivery activity and curfew security movement; distinguish civilian/service/security roles while authoritative schedules and surveillance remain unchanged by art.
- Trigger a live named-contact interaction and confirm both actor presentations return cleanly to idle. Final dialogue, Restart Attempt, and debrief identity continuity remains a T7/T9/T10 acceptance gate rather than evidence claimed by T6.
- Inspect all twelve portraits, Takahiro's broadcast portrait, and George's AR base art for identity, crop, provenance, fallback, and grounded tone.
- `AC-L0-018`: at 1280x720, 1440x900, and 1920x1080, inspect the accepted close normal frame and four-block mission overview across dusk, blue hour, and curfew; actors must remain grounded, readable, correctly anchored, and proportionate to accepted architecture.
- `AC-L0-029`: cross every authored light-region edge at all three viewports and in both languages; tint must follow the foot anchor, ease cleanly, remain subtle, and leave movement/detection unchanged.

## 16. Owning Linear ticket

`T6` (`GET-206`) owns grounded actors, portraits, four protagonist appearances, George/entry-flow visual presentation, and the twelve-set asset contract. `T10B` (`GET-215`) owns `ActorLightRegion` metadata, runtime foot-anchor sampling/tinting, validators, and live visual acceptance under parent `T10` (`GET-210`). `T3` (`GET-203`) supplies runtime/layout anchors; `T8` (`GET-208`) supplies security/civilian state; `T9` (`GET-209`) supplies character/dialogue/HUD integration.
