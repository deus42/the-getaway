---
status: MVP
type: system-specification
tags: [art-direction, city, blender, hud, actors]
canonical: true
---

# Art Direction and Blender World Pipeline

## 1. Player fantasy and purpose

Level 0 should feel like a real Tokyo district whose ordinary public life has been reorganized around corporate identity control. The visual fantasy is not neon spectacle or fantasy noir; it is the unease of being a recognizable human body in a beautiful, legible, comprehensively watched city.

The locked direction is **graphic surveillance noir**: strong ink silhouettes, readable midtones, cold institutional surfaces, sodium practical lighting, restrained technology cyan, and crimson reserved for real danger. Art must serve navigation, surveillance, hiding, blending, dialogue, and escape before atmosphere.

## 2. Player-visible verbs

The art must make it possible to:

- distinguish walkable street, sidewalk, alley, entrance, obstacle, and inaccessible mass;
- identify cameras, current coverage, connected terminals, and the verifier drone;
- recognize contacts, security, civilians, hiding contexts, and blending contexts without permanent labels;
- read the two timing approaches and three traversal loops from urban form;
- find the medkit cache, optional manifest, safehouse, and outbound terminal through knowledge-appropriate landmarks;
- understand day/curfew changes without losing actors, geometry, or interaction readability;
- use the four-lane HUD and major overlays without surrendering the world to interface chrome.

## 3. Starting state and prerequisites

- The authoritative gameplay topology is the approved `Level0LayoutContract`, not painted pixels or licensed geometry.
- The requester identifies Neo Tokyo 2 at `/Volumes/Elements/Backup/Downloads/Game/Neo Tokyo 2` as owned; the repository records that assertion but does not contain acquisition-specific entitlement evidence.
- Blender `5.0.1` is the authoring environment.
- Level 0 uses one outdoor master scene, one fixed 2:1 isometric camera, and a runtime 64×32 projection contract.
- Raw licensed geometry is never committed.
- Generated `.blend` files remain untracked.
- The repository may commit versioned scene recipes, source manifests, transforms, semantic metadata, and validators. Flattened derivatives remain ignored `local-evidence` until acquisition-specific entitlement is verified and runtime promotion is explicitly reviewed.
- The exact approved Direction B comparison artifact and source/license inventory remain open items in [[14 Specification Review Queue]] and must be resolved before art production acceptance.

## 4. Complete happy-path behavior

1. Runtime/layout work defines the outdoor topology, semantic surfaces, anchors, and three traversal loops.
2. The Blender pipeline imports the requester-asserted-owned pack without stylistic regeneration and composes the entire district in one master scene.
3. The first visual gate judges unchanged-kit composition: human scale, continuous street walls, public realm, loops, landmarks, actor legibility, and fixed-camera projection.
4. Only after that composition is accepted does the second gate add Hidzu identity: surveillance hardware, identity scanning, public screens, propaganda, controlled wayfinding, and institutional lighting.
5. Roads, sidewalks, curbs, crossings, alleys, plazas, setbacks, and entrance aprons are authored as part of the city rather than a flat runtime board beneath freestanding sprites.
6. T4 exports aligned neutral dusk, blue-hour, and curfew lighting foundations from the same geometry and camera as ignored local evidence. T5 owns final atmosphere; entitlement-backed runtime promotion and crossfade must not move collision, doors, devices, or interaction anchors.
7. Semantic masks and anchors flow back into validation against the same layout contract.
8. Runtime actors, camera indicators, interaction feedback, and the HUD remain live layers above flattened environment derivatives.
9. Fixed-viewport screenshots and human play—not asset counts or validators—determine visual acceptance.

## 5. State model and transitions

The world-art lifecycle is:

`LAYOUT_CONTRACT → UNCHANGED_KIT_COMPOSITION → LOCAL_EVIDENCE_EXPORT → COMPOSITION_ACCEPTED → HIDZU_IDENTITY_PASS → ENTITLEMENT_BACKED_RUNTIME_PROMOTION → LIVE_VISUAL_ACCEPTANCE`

- Failure at the unchanged-kit gate returns to composition and scale; it cannot be hidden with signage, fog, or post-processing.
- Failure at the Hidzu gate returns to identity/lighting treatment without reopening accepted topology unless measured evidence reveals a topology defect.
- Local evidence is technically valid only when projection, masks, anchors, layer registration, byte budgets, and fallback metadata pass validation. Runtime promotion additionally requires acquisition-specific entitlement evidence and explicit review.
- Live acceptance is separate from technical validation and remains pending until the requester verifies representative play states.

Presentation states are aligned environment layers:

- `dusk`: public life and readable material separation;
- `blue-hour`: transitional ambience without geometry change;
- `curfew`: reduced public activity, stronger surveillance presence, and motivated practical light without crushed values.

## 6. Rules and tuning values

### City structure

- Level 0 is a continuous outdoor Tokyo district, not nine isolated landmarks, a four-block compound, or buildings arranged on an empty board.
- The layout contains three interlocking traversal loops.
- A full outer loop targets roughly two to three minutes of ordinary movement; exact dimensions and movement speed remain open until the layout prototype is measured.
- Buildings form street walls, intersections, setbacks, alleys, entrances, and recognizable subareas at human scale.
- Every placed object must support navigation, surveillance, hiding/blending, line-of-sight cover, hazard, entrance, contact, mission interaction, safehouse, objective readability, or required civic atmosphere. Decorative clutter is rejected.

### Color and value

- Core palette: charcoal, bruised umber, muted teal, bone, and sodium amber.
- Technology cyan identifies active Hidzu devices and connections; it is scarce.
- Dirty crimson identifies confirmed threat and Pursuit, not neutral architecture.
- Lighting direction remains consistently upper-left for baked assets.
- Midtones remain readable. Curfew cannot collapse actors, road edges, entrances, and building bases into one black band.
- Practical lights must be anchored to visible sources and respect the aligned environment state.

### Projection and runtime

- Runtime base projection: `64×32`, `2:1` isometric.
- Normal outdoor zoom floor: `0.60`.
- Building, collision, entrance, mask, and depth anchors derive from the shared layout contract and export metadata.
- Generated environment layers must not be upscaled blurry composites, mismatched-angle plates, or per-building collage assembled independently in Phaser.
- Overview zoom must not reveal seams, missing tiles, repeated city plates, floating bases, clipping, or corruption.

### Actors and portraits

- Twelve grounded actor identities: four protagonists, Lira, Naila, Brant, two Hidzu security archetypes, and three civilian archetypes.
- World contract: `64×96`, eight directions, four frames, `idle`, `move`, and `interact`; no attack animation is required.
- Foot anchors remain stable within two pixels.
- Actor presentation is approximately 15% larger than strict architectural perspective so bodies remain readable.
- World sprite, portrait, dialogue identity, and role silhouette must match.
- Takahiro Kobayashi receives a propaganda/broadcast portrait; George receives separate AR presentation art.

### HUD

- Persistent bottom dock uses four lanes: knowledge minimap, protagonist, George, current quest beat.
- Target height is `16–18%` of viewport height at supported desktop viewports.
- Matte ink panels, angular edges, fine bone/brass rules, restrained shadows.
- No broad glow, glossy glassmorphism, heavy blur, oversized cards, decorative scanlines, or world-obscuring chrome.

## 7. Inputs from other systems

- [[11 Level 0 Vertical Slice Contract]] defines mission flow and player-facing priority.
- [[41 Movement, Interaction & Observation]] defines camera, zoom, focus, interaction, and occlusion needs.
- [[42 Surveillance, Security & Civilian Behavior]] defines truthful surveillance geometry and device states.
- [[45 HUD & Information Architecture]] defines persistent and modal information.
- [[48 Actors & Portraits]] owns actor-specific art/content requirements.
- [[49 Audio]] defines audiovisual transition pairing.
- [[95 MVP Readiness Checklist]] defines evidence states and fixed captures.
- [[04 Engineering/Building Positioning Runbook]] governs measured alignment after the new layout is accepted; it does not preserve rejected topology.

## 8. Effects on other systems

- Semantic masks define runtime walkable/blocked classification, device/entrance/hiding anchors, and validation evidence without overriding authored gameplay rules.
- Urban composition makes route, line-of-sight, hiding, and blending decisions readable.
- Actor scale and value hierarchy determine whether surveillance play is human-centered.
- Lighting layers select schedule atmosphere but do not change detection geometry.
- HUD styling communicates objective, neutral information, technology, time, and danger consistently.
- Prop and landmark selection determines what the minimap and dossier can reference credibly.

## 9. UI, world, audio, and George feedback

- Current objective/action has strongest local emphasis; actors and active observation/threat come next; traversal and entrances next; architecture next; ambience last.
- Camera coverage is a restrained ground/world layer and never paints whole buildings cyan.
- Foreground treatment may temporarily clarify a required actor or interaction but cannot make the city broadly translucent or lift duplicate actors over roofs.
- Known devices share a repeated Hidzu visual grammar across world, minimap, terminal, and HUD.
- Propaganda, screens, transit notices, and civic messaging express institutional control without replacing playable information.
- Audio cues are anchored to visible camera, drone, terminal, curfew, entrance, and interaction sources.
- George’s floating AR avatar is private, light, and subordinate to the protagonist; it cannot resemble an armed companion or obscure route geometry.

## 10. Failure, recovery, and retry behavior

- Missing or invalid art manifests use an explicit fallback and diagnostics; required production acceptance cannot rely on fallback assets.
- Zoom corruption, seam exposure, anchor drift, detached shadows, unreadable curfew values, or required-object occlusion fails the visual gate.
- The pipeline must reproduce a known export from versioned recipe/manifests without committing raw licensed geometry.
- Retry and New Game must select the correct aligned visual state from world-clock state without stale layers from a previous run.
- If visual and gameplay geometry disagree, gameplay remains authoritative while the art/export is corrected; the runtime may not silently move collision to fit a render.

## 11. Content-authoring requirements

- Maintain a source/provenance manifest for every Neo Tokyo asset used. Record acquisition-specific entitlement for any derivative proposed for commit or runtime promotion; never infer it from requester assertion or general vendor terms.
- Maintain the Level 0 master-scene recipe, camera/projection settings, transforms, material treatment, light rig, export layers, masks, anchors, and validation checks.
- Produce unchanged-kit and Hidzu-gate comparison captures at `1280×720`, `1440×900`, and `1920×1080`.
- Produce live captures for safehouse opening, dusk street, Lira, Naila, Brant, public route, curfew route, camera observation, Suspicious, Pursuit/drone, cache/manifest, minimum zoom, Character screen, dossier, failure, Retry, debrief, and completion.
- Maintain actor manifests and matching portrait references for all required identities.
- Author signage and public-screen copy in the approved cultural/language policy once that open decision is resolved.

## 12. Edge cases and prohibited shortcuts

- No synthetic regeneration of owned architecture into unrelated fantasy or generic cyberpunk buildings.
- No raw licensed geometry in Git.
- No independent building sprites arranged as a city collage, opaque parcel slabs, floating bases, empty board, or decorative perimeter.
- No correcting visual mismatch by changing gameplay topology after the layout contract is accepted without a documented design decision.
- No giant permanent labels, x-ray actors, universal building transparency, broad path lines, debug outlines, or glow as a substitute for composition.
- No baked light that contradicts the upper-left rig or visible practical source.
- No tiny actors against monumental buildings, fantasy-Neo costumes, attack poses, military loadouts, or magical gadgets.
- No claim of visual success based on checklist completion, generated asset count, configuration, validator output, or an AI rating without live inspected frames.

## 13. Removed behavior

Removed from the active visual direction: painterly-fantasy Neo characters, four-block compound, sparse nine-building board, isolated landmark collage, generated replacement architecture, blurry upscaled composites, flat procedural road board as final presentation, three-lane HUD, attack-sheet requirement, permanent labels, tactical-combat hierarchy, city-wide translucent buildings, decorative clutter, broad cyan glow, and the previous claim that Blender/kit assets were optional experiments rather than the approved city source.

Historic GET-155 and GET-180 assets remain recoverable evidence/fallback only. They are not current production direction.

## 14. Post-MVP extensions

Post-MVP may add complex interiors, additional Tokyo districts, Miami art production, more actor/civilian variation, and advanced weather or security presentation. New districts must reuse the projection, semantic-export, visual-hierarchy, and human-acceptance discipline unless a later approved decision supersedes it.

## 15. Human-play acceptance examples

1. At maximum normal zoom-out, the scene reads as one continuous city with no seams, floating buildings, sparse board, or corruption.
2. At normal zoom, a player distinguishes protagonist, contact, civilian, and Hidzu security without labels and can read entrances and walkable space.
3. The public route and curfew route feel like different uses of the same district rather than different map scripts.
4. A camera, its connected terminal, and its current coverage read as one system without debug overlays.
5. Curfew changes atmosphere and surveillance tension while actors, road edges, hiding places, and objectives remain readable.
6. The bottom HUD stays within 18% at target viewports and preserves four clear information lanes.
7. Side-by-side unchanged-kit and Hidzu captures show that the second pass adds institutional identity without hiding weak composition.
8. The requester accepts live screenshots and play at all target viewports; automated validators are green but are not treated as visual proof.

## 16. Owning Linear ticket

- City baseline: `T4` (`GET-204`) — Unchanged-kit Tokyo Blender master scene.
- Hidzu treatment: `T5` (`GET-205`) — Hidzu identity and graphic-surveillance-noir world art.
- Actors: `T6` (`GET-206`) — Grounded actors, portraits, and entry-flow presentation.
- HUD: `T9` (`GET-209`) — Dialogue, George, facts, dossier, social feed, and four-lane HUD.
- Canonical decisions: `GDR-ART-001` through `GDR-ART-005`, `GDR-UI-001`, `GDR-UI-002`, `GDR-GEO-001`, `GDR-REM-011`, and `GDR-SUP-001` through `GDR-SUP-004` in [[12 Game Design Decision Register]].
