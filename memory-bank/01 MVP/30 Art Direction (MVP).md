---
status: MVP
type: system-specification
tags: [art-direction, city, blender, hud, actors]
canonical: true
---

# Art Direction and Blender World Pipeline

## 1. Player fantasy and purpose

Level 0 should feel like a real Tokyo district whose ordinary public life has been reorganized around corporate identity control. The visual fantasy is not neon spectacle or fantasy noir; it is the unease of being a recognizable human body in a beautiful, legible, comprehensively watched city.

The locked direction is **graphic surveillance noir**: a wet blue-black ambient field, strong ink silhouettes, readable midtones, cold institutional surfaces, localized sodium practicals, restrained technology cyan, and crimson reserved for real danger. Reflections and material response must be authored at source in Blender; a warm beige/ochre grade, dry/matte roads, generic neon spectacle, or tint-led substitute is outside the direction. Art must serve navigation, surveillance, hiding, blending, dialogue, and escape before atmosphere.

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

- Stable mission semantics are authoritative: safehouse, contacts, logistics objective, direct/service approaches, route purposes, and required gameplay behavior survive. `GDR-ART-019` retires the old four-block geometry, routes, coordinates, and camera pin; [[32 GET-205 Reference-Native Layout Contract]] owns the exact v6 seed.
- The requester identifies Neo Tokyo 2 at `/Volumes/Elements/Backup/Downloads/Game/Neo Tokyo 2` as owned; the repository records that assertion but does not contain acquisition-specific entitlement evidence.
- Blender `5.0.1` is the authoring environment.
- Level 0 uses one outdoor master scene, one fixed 2:1 isometric camera, and a runtime 64×32 projection contract.
- Raw licensed geometry is never committed.
- Generated `.blend` files remain untracked.
- The requester has confirmed ownership and explicitly authorized Neo Tokyo 2 as the production base. Raw vendor geometry and textures remain outside Git. Versioned recipes, manifests, transforms, original gap-fill assets, semantic metadata, validators, and flattened game derivatives may be committed through the normal visual-acceptance gate.
- [[31 GET-204 Visual Rebuild Quality Contract]] remains historical GET-204 source-quality evidence; [[32 GET-205 Reference-Native Layout Contract]] is the binding current layout/visual acceptance specification.
- Four durable references divide authority. `art/references/get205/kitbash-reference2-blend-concept-v1.png` is approved AI-assisted previsualization and now owns the literal core street/mission plan, hero composition, and human/door/sidewalk/street/building proportions, but never production geometry or source provenance. `art/references/get204/canvas-quality-target.png` owns render/material/light quality; `art/references/get204/street-play-target.png` owns normal-camera intimacy, inhabited social staging, surveillance readability, and HUD/world balance but not actor size; `art/references/get204/dense-city-target.png` is a secondary overview-density check only. Reference 2's human-head George depiction remains non-authoritative and superseded by `GDR-GEO-005`.
- `GDR-ART-015` governs translation rather than literal tracing: production matches the blend's massing, value hierarchy, source relationship, and proportions, while AI-generated rooftop garnish and baked people carry no authority. A quieter source-traceable roof is preferable to synthetic density.

## 4. Complete happy-path behavior

1. GET-205 v6 reconstructs the reference-native plan in one master scene, using named Neo Tokyo 2 geometry plus only the project-owned public-realm gap fills needed to make its streets believable and playable.
2. The dimensioned plan and raw greybox establish the street skeleton, real gate, parcel rhythm, mission anchors, camera relationship, and actor/building proportion before facade or look work.
3. The neighborhood stages safehouse/backstreet, public life street, controlled HIDZU street, logistics depth, and service/sneak bypass as one readable mission.
4. The city uses mostly low/mid-rise continuous street walls, resolved corners, compact ordinary streets and service alleys, no oversized plaza, and at most one restrained Hidzu Corporation landmark.
5. Roads, sidewalks, curbs, crossings, alleys, setbacks, entrances, drainage, public furniture, utilities, and service details are authored as part of the city rather than a flat board beneath freestanding objects.
6. Accepted visual geometry is back-propagated into the shared layout contract so collision, entrances, occlusion, masks, anchors, and rendered streets agree before each gate is committed.
7. The controlled approach reads as a pedestrian verification lane rather than a vehicle checkpoint: queue rails and ground arrows establish flow, and an eye-height illuminated instruction panel makes the commitment rule readable before entry.
8. Three recurring display fixtures keep distinct jobs: transit departures/civic clock, verification procedure/verdict/manual review, and sector-scoped Hidzu Corporation advisory. The advisory fixture supports two readable lines at normal zoom.
9. Dusk, blue hour, and curfew share one wet blue-black material and ambient baseline. Blue hour is the canonical hero/reference balance; dusk is the least dark with more active windows and localized amber practicals; curfew has fewer lit windows, a darker ambient field, stronger surveillance sources, and sparse red threat accents.
10. Runtime actors, population, Needle, camera indicators, interaction feedback, George, and the current HUD remain live layers above people-free environment exports. GET-204 does not redesign HUD behavior or information architecture.
11. The first gate is the exact dimensioned plan plus raw material-free greybox. After that passes, a source-traceable Blender hero and overview gate precedes live clean-city, current-HUD, and minimum-zoom review.
12. Fixed-viewport screenshots and human play—not asset counts, validators, offline composites, or internal ratings—determine visual acceptance.

## 5. State model and transitions

The GET-204 world-art lifecycle is:

`MISSION_SKELETON → REFERENCES_LOCKED → FULL_DISTRICT_MASTER_COMPOSITION → QUALITY_LOOKDEV → LIVE_RUNTIME_INTEGRATION → REQUESTER_ACCEPTANCE → GET_204_CLOSEOUT`

- Composition, lookdev, and integration use internal review captures but are not separately accepted products.
- The next requester-facing candidate must prove Reference-2-style normal play, Canvas-target visual quality, and a complete minimum-zoom district together.
- Failure at any stage returns to the responsible variable class. It does not unlock downstream tickets or get hidden with labels, fog, grading, or checklist evidence.
- No visual checkpoint is committed before the requester accepts the complete live evidence.

The authorized GET-205 replacement lifecycle is:

`COMMITTED_TECHNICAL_BASELINE → REFERENCE_NATIVE_DOCUMENTATION_COMMIT → DIMENSIONED_PLAN → RAW_GREYBOX_GATE → SOURCE_FACADE_HERO_LOCK → THREE_STATE_EXPORT → CUTOUT_PROFILE_MANIFEST_REGEN → LIVE_SIDE_BY_SIDE_ACCEPTANCE → ACCEPTANCE_COMMIT → COMMITTED_BUILD_VERIFICATION`

- The plan gate is the literal v6 seed from [[32 GET-205 Reference-Native Layout Contract]] plus a people-free, material-free greybox. It must pass the new route/anchor/dynamic-gate/replacement-probe contract, source/proportion feasibility, camera boxes, identity masks, and blind five-question read.
- Facade identity, materials, lighting, state bakes, cutouts, runtime publication, and NPC cleanup do not begin before requester approval of the greybox massing.
- Failure at the massing gate returns to the new recipe while the accepted GET-204 and recoverable GET-205 v4 sources remain intact.

Presentation states are aligned environment asset sets from one immutable geometry and camera registration:

- `dusk`: the least-dark wet blue-black state, with the most active windows and localized amber entrance/lamp pools;
- `blue-hour`: the canonical hero/reference balance, with cool ambient structure, crisp wet-road reflections, restrained cyan devices/accents, and localized amber practicals;
- `curfew`: fewer lit windows, a darker ambient field, stronger declared surveillance sources, and sparse threat-specific red without crushed walkability.

Blue hour becomes authoritative at `20:00` and curfew at `22:00`. Their complete texture sets prefetch at `19:50` and `21:50`. At a boundary the old complete set stays visible until every target texture is ready, aligned replacement layers crossfade over `750 ms`, and only then may the old layers and textures be destroyed. Direct jumps load the actual target state; Restart Attempt and hydration rewinds may load an earlier state. A generation token rejects stale asynchronous completions. Failed transitions discard the partial target and retain the current complete state with an observable diagnostic; an initial-state failure is visibly fatal rather than partial or silently substituted.

## 6. Rules and tuning values

### City structure

- Level 0 is the compact reference-native outdoor Tokyo mission neighborhood in [[32 GET-205 Reference-Native Layout Contract]], not four blocks, nine isolated landmarks, a large decorative city, or buildings arranged on an empty board.
- Preserve stable semantic IDs, mission beats, direct/service route purposes, runtime systems, and the three traversal purposes. Do not preserve old route polygons, footprints, anchors, or coordinates.
- The core is a tight three-arm junction with the life street up-left and controlled HIDZU street up-right; the safehouse extends behind the camera and one service/sneak seam bypasses the real gate.
- Building rhythm is mostly low/mid-rise continuous street walls with one restrained landmark maximum. Corners close the streets without dwarfing the player.
- Street hierarchy combines compact ordinary streets, crossings, sidewalks, and tight service alleys. Large plazas and monumental boulevards are excluded.
- Curated lived-in detail is required where it makes scale and place credible: awnings, restrained planters, bins, civic signs, kiosks, utilities, drainage, barriers, and parked service vehicles. Random filler, repetition, and navigation-obscuring clutter are rejected.
- The v6 hero's bounded clutter layer concentrates on the life street and junction: source-traceable storefront/roof detail plus project-authored stalls, awnings, vending machines, poles, catenary wires, bins, planters, roadside cabinets, small shop boards, and non-emissive district-wayfinding fixtures. Most street-facing parcels carry one restrained identity cue, but authored route-state content remains GET-214-owned. Every object records provenance and a building-identity, navigation, surveillance, human-scale, or civic-atmosphere purpose; no detail may intrude into a protected route or staging sight wedge.
- The long-term city contract uses small authored civilian/service groups rather than a simulated crowd. During the GET-205 v6 rebuild, `GDR-CIV-003` removes random ambient allocation but retains a bounded mission-stage minimum: two seated plus one standing transit passenger, two seated café patrons, one public restricted-area guard, and Needle. These presentations are runtime-owned, occupy the exact plan slots, and never enter environment plates. `blend.public_queue` is valid only while its actual group and schedule are active; `blend.delivery_activity` remains unavailable until GET-208 authors it.

### Color and value

- Core palette: blue-black, charcoal, cold slate, muted teal, bone, and localized sodium amber.
- Amber is confined to visible windows, entrances, and lamp falloff. It cannot carry the frame as a global grade.
- Technology cyan identifies declared screens, cameras, terminals, Hidzu Corporation technology, and a small named set of non-directional building-integrated facade identity seams. It is scarce and never becomes wayfinding, a route marker, street-edge lighting, a floating panel, or generic architectural neon.
- Dirty crimson identifies confirmed threat and Pursuit, not neutral architecture.
- Lighting direction remains consistently upper-left for baked assets.
- Midtones remain readable. Curfew cannot collapse actors, road edges, entrances, and building bases into one black band.
- Roads and sidewalks are rain-darkened source materials with crisp specular response, roughness breakup, and authored puddle masks. Bloom, ripple blur, and post-render reflection compositing cannot supply the wetness contract.
- Camera readability uses the same wet material truth: a small status LED, IR glint, and restrained pavement sheen/reflection indicate nearby discovered hardware without painting a universal cone. Exact discovered geometry remains an Observation layer.
- Needle's neutral patrol lamp is warm-white or restrained amber. Crimson appears on Needle only during active verification or `Pursuit`, then returns visibly to neutral; a red idle lamp is a rejection condition.
- The public transit shelter provides the physical base for `blend.public_queue`. Its bench visibly supports two or three seats and records the exact seat count; a separate standing envelope records its own capacity. Art never implies more occupants than the geometry can honestly hold.
- Practical lights must be anchored to visible sources and respect the aligned environment state.

### Active GET-205 production path

- The accepted GET-204 recipe, recoverable `get205-four-block-baked-v3`, wet-blue-black v4, and rejected v5 assets remain immutable. V6 uses `get205-reference-native-v6` and eventual runtime identity `get205-reference-native-production-v3`; no prior identity is mutated or silently republished.
- The requester-approved frozen baseline is sections 6.1–6.9 of [[32 GET-205 Reference-Native Layout Contract]], including one-floor south/service/workshop roof slivers, `<=0.5u` roof props, taller safehouse masses outside the hero lower band, and three camera-clear staging wedges. `OPEN-LAYOUT-007` is resolved. The hero camera is fixed at target `{21.177121,17.126983,1.621967}` and orthographic scale `25.687085` in the 45°/30° family; implementation has no latitude to retain an old coordinate, retarget, rescale, or improvise beyond the accepted seed.
- V6 preserves mission semantics, IDs, runtime/pipeline interfaces, source/provenance rules, wet-look gates, proportion lock, and state delivery. It replaces the `58×44` grid, all old route/footprint/anchor coordinates, the `{29,22}` camera pin, and the recovered 24-point fixture.
- The dimensioned plan and amended material-free `1440×900` raw greybox are requester-approved. The raw-frame baseline is SHA-256 `ddf5a224da0eec2fe8af5b1c0bf2f7ca8f5e618080ef1d63b4a18c4c72aa7369`; its 22 static/four dynamic probe fixture and mission-legibility reads are frozen.
- V6 uses separate source-traceable parcel identities and independent cutout/depth anchors; continuous walls may not be merged. At least ten identities each contribute `0.5%` of the hero and none more than `15%`; masks remain supporting evidence, never a substitute for the raw-frame read.
- Every one of the 27 parcels must visibly resolve to an actual Neo Tokyo 2 building or kit-bashed source assembly fitted inside its frozen parcel. The manifest names the KB3D source collection, every retained source object/material, resolved transform, source and placed bounds, and authored modifications per parcel. Camera-visible procedural parcel bodies, painted window rectangles, emissive decals, or generated facades cannot satisfy this gate. A non-rendered collision/mask proxy or deeply inset interior closure may remain only when it never replaces or occludes the source architecture in the hero camera.
- Historical GET-204/v4/v5 donor masters remain read-only. The new versioned v6 master may append from them, but it owns the durable repair: remap every used image to the local licensed cache or pack it into the derived scene, save, reopen, and prove zero missing external images before any render. A runtime remap count is diagnostic only; unresolved images or mutation of a donor master fail the gate.
- Real facade relief is compared with the approved greybox silhouette at IoU `>=0.85`. This bounded relaxation admits modeled frames, balconies, ledges, storefronts, crowns, pipes, and roof equipment; it does not permit moving or resizing a frozen parcel, fixture, route, camera, or mission staging wedge.
- The barrier is a real dynamic navigation boundary across the HIDZU-controlled street. Private space lies beyond it. The eastern sneak seam remains permanently traversable; detection/trespass behavior remains GET-208-owned.
- HIDZU identity is built geometry, not a camera cheat. The tower uses a projecting vertical steel sign assembly with facade brackets, mount rails, a dark sign box/returns, the hex mark, and dimensional extruded letters with restrained emissive faces; the checkpoint uses the same construction language for its box sign and small unit plates. Banner planes, image decals, and post-render signs are prohibited. A low-sample parity preview at the frozen camera must prove that every required glyph reads forward before the full hero render.
- After the layout-closure authority commit, source/facade work adds detailed warm and cold windows, controlled cool-white/cyan fixtures, sparse red threat sources, rich labels, one dominant HIDZU tower, the restricted entrance, and authored transit/café presence. Random ambient allocation remains prohibited. Dressing must rerun the mission-legibility masks: keep the sneak mouth unlit and high-contrast against the gate, preserve the transit group's declared bench slots and readable shelter screen, and keep Needle visibly tied to the gate approach.
- The v6 photographic finish is applied only after real source geometry, clutter, materials, lighting, and mission reads pass: restrained depth fog for aerial separation, physically motivated practical falloff, the established AgX/Filmic wet-blue-black grade, and subtle neutral grain. It is not a tint layer, bloom substitute, reflection composite, or concealment method; reference pixels never enter production.
- The blue-hour hero uses the exact frozen v6 camera at `1440×900`, `45°` azimuth, `30°` elevation, target `{21.177121,17.126983,1.621967}`, and scale `25.687085`, then presents `reference | candidate | delta notes` plus a verified `200%` road/reflection crop. No inherited target or zoom is authoritative.
- After hero approval, render aligned people-free dusk, blue-hour, and curfew masters at `6400×3600` from that immutable v6 camera/geometry. Rebuild desktop tiles, mobile background, per-identity foregrounds, collision, placement/depth metadata, hashes, and position tests from the accepted v6 recipe.
- Build every state/profile derivative into staging, validate the complete matrix, then atomically replace the public asset root. A failed render, budget, hash, topology, or publication check leaves current production assets intact. The production manifest remains schema v2 with state-nested file data and one typed phase resolver; no parallel legacy schema is supported.
- Page-stable profile selection, explicit `?visualTreatment=get204-1` diagnostics, current-phase-only preload, `19:50`/`21:50` prefetch, `20:00`/`22:00` boundaries, generation-token stale-load rejection, `750 ms` complete-set crossfade, retained-current-state failure behavior, and post-transition GameObject/texture disposal remain required. Environment tint/atmosphere overlays do not regain color authority.
- The former approximate `3.58 MB` desktop / `1.22 MB` mobile per-state ceiling is invalidated. Before publication acceptance, report and approve a new measured budget covering all three states, each profile, total transfer, one-set decoded residency, two-set transition peak, first load, and stable frame behavior.

Rejected implementation evidence (2026-08-11): the wet-blue-black v4 pipeline and three-state runtime remain recoverable, but the requester rejected the live result as too dark, too sparse, weak in window/facade identity, over-open between buildings, and cluttered by randomly allocated NPCs. The fixed comparison measured `52.05%` near-black pixels and `2.68%` detail-edge coverage in the live blue-hour frame versus `39.93%` and `4.29%` in the locked blend. The v4 assets, state transition work, and validators are technical salvage only; they do not satisfy the new massing or visual gate and do not authorize an implementation commit.

### Historical GET-205 pipeline evidence

The following records describe the earlier pre-four-block GET-205 generator and remain useful for selective salvage. Its manifest, Blender builder, Node runner, validator, mutation runner, and seven package entrypoints were retired from the active tree on 2026-08-10 and remain recoverable from commit `7a6bba7`. They are not the active runtime, do not constrain the accepted GET-204 composition, and do not satisfy current visual acceptance.

- `art/blender/get205/manifests/hidzu-visual-grammar.json` is the single palette, semantic-role, device-shape, civic-message, and color-independent-cue grammar consumed by validation and Blender generation.
- The retired `hidzu-treatment.json` hash-locked the then-current GET-204 source manifest, scene recipe, layout contract, master-scene metadata, base transforms, camera, canvas, anchors, and semantic-mask inventory.
- The historical `level0-tokyo-unchanged-kit-v2` and `level0-tokyo-hidzu-treatment-v1` identities describe that retired nine-block evidence only; neither is an active runtime or validation contract.
- The provisional treatment declares nine placement-scoped material overrides, 24 gameplay/civic additions, six practical-light sites with visible emitters, three geometry-identical schedule states, and a fixed 17-capture review matrix.
- Semantic masks and exported anchors are immutable T4 inputs. GET-205 copies the validated T4 mask derivatives byte-for-byte and validates every anchor value rather than repainting gameplay topology.
- The treatment pins the exact T4 art-manifest hash and a canonical semantic registration digest. T5 validation compares mask identity, path, cell, pixel origin, dimensions, bytes, and content hash to T4 rather than accepting matching mask names alone.
- Palette tokens, schedule values, material transforms, public-message assignments, grammar identities, and surveillance-state cues are Blender inputs rather than descriptive metadata. Generated evidence records their canonical digests, object bindings, visible text ownership and actual wrapped font-body hashes, color-independent state silhouettes, measured palette coverage, material ownership, and per-addition world bounds; anchor additions must remain inside their declared semantic clearance, while facade additions must remain on their measured source placement.
- The Node runner holds a generation lock and renders only into an ignored run-scoped staging root. A complete `all` run is validated as one directory, moved into an immutable version directory, validated again, and exposed through an atomically replaced `current` symlink. A post-swap readback is part of publication and restores the prior pointer before rejecting the new run. Partial runs are retained as noncanonical trials and cannot replace `current`; any prerequisite, Blender, validation, publication, or readback failure leaves the prior complete pointer intact unless the filesystem itself rejects rollback, in which case the new immutable run is retained rather than leaving a dangling pointer.
- Generated `.blend` files remain ignored. Earlier tiled layers, captures, and `runtimeReady: false` evidence remain historical diagnostics; accepted GET-204 flattened derivatives must enter the complete live runtime and may be versioned after requester approval.
- Suspicious and Pursuit captures in this ticket are visual presentation hooks, not proof of the GET-208 surveillance mechanics.

### Projection and runtime

- Runtime base projection: `64×32`, `2:1` isometric.
- Normal play uses a close 2:1 isometric frame with the protagonist in the lower-center lead area. `GDR-ART-014` fixes the human/building relationship to the locked KitBash blend: at `1440×900` with the `16–18%` dock, the protagonist's visible alpha body targets approximately `68–80 px`, excluding shadow, selection ring, and George. The protagonist, contacts, security, and civilians share one base scale; zoom changes the entire world uniformly and never counter-scales actors.
- Maximum manual zoom-out reaches a deliberately composed complete mission-neighborhood overview. The dense-city reference supplies only the coherence/density relationship and does not expand the level scope.
- Building, collision, entrance, mask, and depth anchors derive from the shared layout contract and export metadata.
- Generated environment layers must not be upscaled blurry composites, mismatched-angle plates, or per-building collage assembled independently in Phaser.
- Normal play hides the district boundary. Manual minimum zoom may reveal the whole authored composition, but never missing city edges, repeated plates, floating bases, clipping, voids, or corruption.
- Foreground buildings use selective fade only when they occlude the protagonist or a required interaction; broad translucency and x-ray duplication remain prohibited.

### Actors and portraits

- Twelve grounded actor identities: four protagonists, Lira, Naila, Brant, two Hidzu Corporation security archetypes, and three civilian archetypes.
- World contract: `64×96`, eight directions, four frames, `idle`, `move`, and `interact`; no attack animation is required.
- Foot anchors remain stable within two pixels.
- Actor presentation is calibrated with the reference-native mission camera so the protagonist, nearby civilians, contacts, and security reproduce the human/door/sidewalk/street/building relationship in the locked KitBash blend. One shared runtime scalar may be derived to meet that relationship; it is an implementation value, not a second visual authority.
- Actors sample authored `ActorLightRegion` metadata at their foot anchor and ease a subtle semantic amber/cyan tint. `OPEN-ART-005` owns final tint strength/feathering; its reversible baseline is strongest-region-only blending, `250 ms` easing, and restrained intensity.
- World sprite, portrait, dialogue identity, and role silhouette must match.
- Takahiro Kobayashi receives a propaganda/broadcast portrait; George receives separate AR orb presentation art derived from the recovered pre-rewrite identity, never a human face or bust.

### GET-206 provisional actor implementation inventory

- Source references are versioned under `art/actors/get206/`: the twelve-figure grounded cast board, the matching portrait board, and deterministic recipe `get206-grounded-actor-v2`.
- The tracked generator publishes through an isolated staging/swap boundary and emits 12 actor directories, 288 state/direction sheets, 1,152 frames, 12 identity portraits, Takahiro's broadcast portrait, George's transparent AR base, pixel metrics, integrity hashes, and four proof boards. Exact reproduction is checked separately from publication.
- Runtime identity is manifest-driven. Stable ownership is limited to `player`, `contact`, `security`, or `civilian`; the active Level 0 scene loads only the selected protagonist plus Lira, Naila, and Brant. Missing or corrupt production art uses a neutral diagnostic figure and fails production acceptance; removed fantasy sheets are never fallback.
- Live fixed-viewport evidence proves the four protagonist selections and three contact anchors without permanent labels. The portraits are coherent and readable, while the normalized world sprites remain deliberately simple/provisional and are not accepted production-quality character art merely because their matrix validates.
- Security and civilian records are reusable visual archetypes only. T8/T10 retain names, counts, schedules, placement, detection, and mission ownership.

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
- Actor-light tint is presentation-only and does not change detection, movement, collision, checks, schedules, or civilian behavior.
- HUD styling communicates objective, neutral information, technology, time, and danger consistently.
- Prop and landmark selection determines what the minimap and dossier can reference credibly.

## 9. UI, world, audio, and George feedback

- Current objective/action has strongest local emphasis; actors and active observation/threat come next; traversal and entrances next; architecture next; ambience last.
- Camera coverage is a restrained ground/world layer and never paints whole buildings cyan.
- Foreground treatment may temporarily clarify a required actor or interaction but cannot make the city broadly translucent or lift duplicate actors over roofs.
- Known devices share a repeated Hidzu Corporation visual grammar across world, minimap, terminal, and HUD.
- Propaganda, screens, transit notices, and civic messaging express institutional control without replacing playable information.
- Audio cues are anchored to visible camera, drone, terminal, curfew, entrance, and interaction sources.
- George’s floating AR orb is private, light, and subordinate to the protagonist. World and HUD versions preserve the same dark circular body, cyan concentric core, axial markers, central point, and restrained framing; it cannot become a human portrait/bust, resemble an armed companion, or obscure route geometry.

## 10. Failure, recovery, and Restart Attempt behavior

- A missing/invalid initial production state fails visibly with diagnostics; it cannot show a partial state or silently substitute another state. A transition failure retains the current complete state, discards partial target assets, emits an observable diagnostic, and retries at the next synchronization or reload.
- Zoom corruption, seam exposure, anchor drift, detached shadows, unreadable curfew values, or required-object occlusion fails the visual gate.
- The pipeline must reproduce a known export from versioned recipe/manifests without committing raw licensed geometry.
- Restart Attempt, New Game, direct Wait jumps, and hydration rewinds must select the correct aligned visual state from world-clock state without stale layers from a previous run. A generation token prevents late asynchronous loads from displaying the wrong state.
- Restart Attempt and scene rebuild clear transient actor-tint interpolation and resample the restored foot anchors deterministically.
- If visual and gameplay geometry disagree, preserve the mission skeleton, identify the accepted visual geometry, and back-propagate it into the single layout/collision/mask/anchor contract. Neither hidden collision nor a visually weak legacy block may remain authoritative by accident.

## 11. Content-authoring requirements

- Maintain a source/provenance manifest for every Neo Tokyo asset used and keep all raw vendor files outside Git. Record requester-confirmed ownership honestly; do not invent a receipt or license tier.
- For v6, provenance is parcel-complete rather than count-only: each of the 27 parcel records names its Neo Tokyo 2 source collection, retained mesh objects, source materials, source/placed bounds, transforms, mesh complexity/hash evidence, and any crop/cap/interior-closure work. The validator fails on a missing parcel record, empty retained source geometry, camera-visible procedural envelope, source object outside its declared parcel, or a manifest claim unsupported by the saved Blender scene.
- Record the derived v6 scene's image-dependency inventory and durability mode. The render preflight must reject every unpacked image whose resolved path is absent; after save and reopen the same inventory must report zero missing images. Never repair this by overwriting a recoverable donor master.
- Maintain the Level 0 master-scene recipe, camera/projection settings, transforms, material treatment, light rig, export layers, masks, anchors, and validation checks.
- For GET-205 v6, first produce the dimensioned reference-native plan and raw greybox. After that gate is approved, produce an actual Blender source hero and complete-neighborhood overview from the same named-source master; after source/look approval, produce a clean live frame, the same frame with the current HUD, and a complete-neighborhood overview at `1440×900` and `1920×1080`, with `1280×720` compatibility verified before final closeout. GET-204's four-block frames remain historical evidence only.
- For GET-205 v6, first commit the reference-native authority package, then reproduce the exact section-6 plan seed and approve its dimensioned plan plus raw greybox before facade or lighting work. After plan approval, approve the source-derived blue-hour hero before generating any master/runtime matrix. Then regenerate the schema-v2 assets, per-identity cutouts, both profiles, collision/position contracts, and new measured budgets; validate state completeness, hashes, registration, topology, payload/decode/residency, and atomic publication before exposing the candidate.
- Maintain versioned fixed-frame shadow, road, amber, and cyan masks for the reference-delta validator. Against `canvas-quality-target.png`, require shadow mean Lab `b* < 0` and no more than `+2` warmer, amber fraction no greater than `115%`, cyan/emissive fraction within `85–140%`, road specular coverage at least `85%`, luminance `p95–p05` spread within `90–160%`, and luminance `p05` at least `50%` of reference. The accepted blue-hour hero remains the visual anchor, but its `2.15×` spread and `0.064×` black floor may not propagate into state exports. Freeze requester-approved per-state frames as regression baselines; these metrics support but never replace visual judgment.
- Produce live captures for safehouse opening, dusk street, Lira, Naila, Brant, public route, curfew route, camera observation, Suspicious, Pursuit/drone, cache/manifest, minimum zoom, Character screen, dossier, failure, Restart Attempt, debrief, and completion.
- Maintain actor manifests, deterministic generation recipes, pixel-derived metrics, integrity hashes, neutral fallback evidence, and matching portrait references for all required identities.
- Author the pedestrian verification lane's queue rails, ground arrows, eye-height instruction panel, and procedure/verdict/manual-review display as one readable set-piece; none may be repurposed as vehicle-checkpoint dressing.
- Register the transit departures board, verification display, and Hidzu advisory display as three stable single-job fixtures. The advisory layout must hold two readable lines at normal zoom without becoming an oversized billboard.
- During the T5 v5 rebuild, prove that random ambient allocation is absent; the exact three-person transit and two-person café groups occupy declared runtime slots; `blend.public_queue` follows visible occupancy/schedule; and `blend.delivery_activity` reports unavailable without a false prompt. GET-208 later owns the delivery group, broader behavior, and expanded populated-versus-wind-down acceptance.
- Inventory every retained rooftop/public-realm prop against named Neo Tokyo 2 or project-authored gameplay/public-realm provenance. Do not add or preserve clutter only to imitate the concept's synthetic garnish.
- Record the bounded life-street/junction clutter inventory by role and source. Require varied source roof units/tanks/pipes per parcel, small shop/identity boards across the street wall, and the declared public-realm fixtures, while keeping HIDZU dominant, cyan device-bound, protected circulation clear, and the sneak mouth dark.
- Record the HIDZU tower/gate sign assemblies as project-authored geometry with component bounds and readable-glyph evidence. The tower wordmark, hex mark, gate sign, and unit plates must use modeled depth and mounts; no plane/decal substitute may survive the saved-scene validator.
- Author signage and public-screen copy in the approved cultural/language policy once that open decision is resolved. Until then, `未来は今日つくられる` with George's contextual meaning “the future is made today” is a replaceable `OPEN-NAR-014` candidate, not final copy.

## 12. Edge cases and prohibited shortcuts

- No synthetic regeneration of owned architecture into unrelated fantasy or generic cyberpunk buildings.
- No raw licensed geometry in Git.
- No independent building sprites arranged as a city collage, opaque parcel slabs, floating bases, empty board, or unregistered/reachable decorative perimeter. The declared unreachable background-only v5 backdrop is permitted solely outside gameplay bounds.
- No protecting rejected greybox geometry merely because it already exists. A topology change must preserve the mission skeleton, update the shared contract, and prove reachability/collision against the accepted city.
- No giant permanent labels, x-ray actors, universal building transparency, broad path lines, debug outlines, or glow as a substitute for composition.
- No cyan wayfinding, route marker, street-edge light, floating panel, generic cyberpunk neon, or full-city multiplicative tint. Existing non-emissive GET-214 route signage remains outside the T5 color authority.
- No baked light that contradicts the upper-left rig or visible practical source.
- No unresolved external image, deleted temporary-cache path, production-only basename remap at render time, mutation of a historical donor master, mirrored required glyph, or plane/decal HIDZU identity.
- No tiny actors against monumental buildings, fantasy-Neo costumes, attack poses, military loadouts, or magical gadgets.
- No claim of visual success based on checklist completion, generated asset count, configuration, validator output, offline Blender output alone, or an internal/AI rating without live inspected frames.

## 13. Removed behavior

Removed from the active visual direction: painterly-fantasy Neo characters, the old sparse/fenced four-block compound, exact `84×60` nine-block authority, oversized decorative district scope, sparse nine-building board, isolated landmark collage, generated replacement architecture, blurry upscaled composites, flat procedural road board as final presentation, three-lane HUD, attack-sheet requirement, permanent labels, tactical-combat hierarchy, city-wide translucent buildings, random filler clutter, broad cyan glow, local-evidence-only production, and the previous claim that Blender/kit assets were optional experiments rather than the approved city source.

Historic GET-155 and GET-180 assets remain recoverable evidence/fallback only. They are not current production direction.

## 14. Post-MVP extensions

Post-MVP may add complex interiors, additional Tokyo districts, Miami art production, more actor/civilian variation, and advanced weather or security presentation. New districts must reuse the projection, semantic-export, visual-hierarchy, and human-acceptance discipline unless a later approved decision supersedes it.

## 15. Human-play acceptance examples

1. At normal zoom, the hero intersection reads at street scale: the protagonist occupies the lower-center lead area; nearby civilians, security, entrances, cameras, and public furniture are immediately legible; buildings form a lived-in street canyon rather than monumental objects on a board.
2. At maximum manual zoom-out, the scene reads as one deliberately composed continuous city with no seams, floating buildings, sparse board, empty perimeter, or corruption.
3. The aligned dusk, blue-hour, and curfew strip reads as three uses of the same wet blue-black district: dusk has more localized life, blue hour matches the hero balance, and curfew reduces windows while strengthening surveillance without geometry/crop drift.
4. A camera, its connected terminal, and its current coverage read as one system without debug overlays.
5. Curfew changes atmosphere and surveillance tension while actors, road edges, hiding places, and objectives remain readable. The `19:50`/`21:50` prefetches and `20:00`/`22:00` 750 ms boundaries show no black frame, partial set, stale completion, or leaked old texture.
6. The bottom HUD stays within 18% at target viewports and preserves four clear information lanes.
7. A clean city frame and the same live frame under the current HUD preserve the same world hierarchy; GET-204 does not fake quality by hiding the HUD or redesigning it.
8. The requester first accepts the dimensioned reference-native plan and fixed `1440×900` raw greybox with its five-question read, route/anchor/static/dynamic probe report, camera boxes, and per-identity contribution report; then the blue-hour hero/reference/delta comparison and `200%` crop; then the complete rebuilt live neighborhood. Automated validators and internal captures support but never replace those visual gates.
9. At `1280×720`, `1440×900`, `1920×1080`, and `390×844`, inspect the fixed three-state strip, reference A/B, clean world, current HUD, overview, both profiles, three known occlusion sites, actor feet, and the `0.60→3.25` zoom sweep.
10. Initial selection, both prefetches/boundaries, direct jumps, Restart Attempt, hydration rewind, stale completions, failed loads, texture disposal, and single-/double-set residency match the authored state without changing clock, crowd, shutter, surveillance, audio, or HUD behavior.
11. In the T5 candidate, verify no random or stacked actors; exact nonblocking slots for two seated plus one standing transit passenger and two seated café patrons; one public guard plus Needle; `blend.public_queue` eligibility only while its visible group/schedule is active; and explicit unavailability for `blend.delivery_activity`. GET-208 owns broader schedules, delivery population, reactions, and interception behavior.
12. At normal zoom, the pedestrian verification lane reads its flow and commitment rule before entry; the transit board, verification display, and advisory screen keep distinct jobs; discovered camera cues and Needle's lamp communicate their real state without debug labels.

## 16. Owning Linear ticket

- Historical city baseline: `T4` (`GET-204`) — recoverable four-block named-KitBash source and collision evidence; superseded as current geography by `GDR-ART-019`.
- Hidzu Corporation treatment: `T5` (`GET-205`) — Hidzu Corporation identity and graphic-surveillance-noir world art.
- Actors: `T6` (`GET-206`) — Grounded actors, portraits, and entry-flow presentation.
- Actor lighting: `T10B` (`GET-215`) — `ActorLightRegion` metadata, runtime foot-anchor sampling/tinting, validators, and live visual acceptance under `T10` (`GET-210`).
- HUD: `T9` (`GET-209`) — Dialogue, George, facts, dossier, social feed, and four-lane HUD.
- Canonical current layout decision: `GDR-ART-019`; current look/delivery/proportion decisions: `GDR-ART-001`, `GDR-ART-005`, `GDR-ART-007`, `GDR-ART-011` through `GDR-ART-016`, `GDR-CIV-003`, `GDR-SUR-013`, `GDR-UI-001`, `GDR-UI-002`, `GDR-GEO-001`, `GDR-REM-011`, and current supersession notes in [[12 Game Design Decision Register]].
