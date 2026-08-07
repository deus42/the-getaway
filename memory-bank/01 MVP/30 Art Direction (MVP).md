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

- The mission skeleton is authoritative: safehouse, contacts, logistics objective, public/service approaches, three-loop intent, and required gameplay semantics must survive. The rejected `84×60` nine-block geometry and the old sparse/fenced four-block compound are not authoritative.
- The requester identifies Neo Tokyo 2 at `/Volumes/Elements/Backup/Downloads/Game/Neo Tokyo 2` as owned; the repository records that assertion but does not contain acquisition-specific entitlement evidence.
- Blender `5.0.1` is the authoring environment.
- Level 0 uses one outdoor master scene, one fixed 2:1 isometric camera, and a runtime 64×32 projection contract.
- Raw licensed geometry is never committed.
- Generated `.blend` files remain untracked.
- The requester has confirmed ownership and explicitly authorized Neo Tokyo 2 as the production base. Raw vendor geometry and textures remain outside Git. Versioned recipes, manifests, transforms, original gap-fill assets, semantic metadata, validators, and flattened game derivatives may be committed through the normal visual-acceptance gate.
- [[31 GET-204 Visual Rebuild Quality Contract]] is the binding visual acceptance specification.
- Four durable references divide authority. `art/references/get205/kitbash-reference2-blend-concept-v1.png` is the approved AI-assisted composition north star and owns the mission-sized four-block relationship, but never production geometry. `art/references/get204/canvas-quality-target.png` owns render/material/light quality; `art/references/get204/street-play-target.png` (Reference 2) owns normal camera, protagonist prominence, street scale, and inhabited composition; `art/references/get204/dense-city-target.png` is a secondary overview-density check only. They define visual relationships rather than exact geography or exact objects.

## 4. Complete happy-path behavior

1. GET-204 rebuilds one mission-sized four-block master scene around the quest skeleton, using named Neo Tokyo 2 geometry plus only the project-owned public-realm gap fills needed to make the streets believable and playable.
2. The four-block composition establishes the production camera, actor/building relationship, road and sidewalk materials, street-wall rhythm, practical lighting, and selective foreground-fade rule before any runtime promotion.
3. The four blocks distribute three functional identities: safehouse/backstreet, public/transit/contact street, and controlled logistics/service approach.
4. The city uses mostly low/mid-rise continuous street walls, resolved corners, compact ordinary streets and service alleys, no oversized plaza, and at most one restrained Hidzu Corporation landmark.
5. Roads, sidewalks, curbs, crossings, alleys, setbacks, entrances, drainage, public furniture, utilities, and service details are authored as part of the city rather than a flat board beneath freestanding objects.
6. Accepted visual geometry is back-propagated into the shared layout contract so collision, entrances, occlusion, masks, anchors, and rendered streets agree before each gate is committed.
7. Blue-hour dusk is the primary look. Daylight and curfew remain coherent schedule variants of the same geometry; wet-surface response, warm practicals, cold institutional fill, and readable midtones remain motivated.
8. Runtime actors, camera indicators, interaction feedback, George, and the current HUD remain live layers above the environment. GET-204 does not redesign HUD behavior or information architecture.
9. The first gate is an actual Blender close frame and four-block overview from the same named-source master. Only after that visual approval is the rebuild proven live through a clean city frame, the same scene with the current HUD, and the minimum-zoom composition.
10. Fixed-viewport screenshots and human play—not asset counts, validators, offline composites, or internal ratings—determine visual acceptance.

## 5. State model and transitions

The GET-204 world-art lifecycle is:

`MISSION_SKELETON → REFERENCES_LOCKED → FULL_DISTRICT_MASTER_COMPOSITION → QUALITY_LOOKDEV → LIVE_RUNTIME_INTEGRATION → REQUESTER_ACCEPTANCE → GET_204_CLOSEOUT`

- Composition, lookdev, and integration use internal review captures but are not separately accepted products.
- The next requester-facing candidate must prove Reference-2-style normal play, Canvas-target visual quality, and a complete minimum-zoom district together.
- Failure at any stage returns to the responsible variable class. It does not unlock downstream tickets or get hidden with labels, fog, grading, or checklist evidence.
- No visual checkpoint is committed before the requester accepts the complete live evidence.

Presentation states are aligned environment layers:

- `dusk`: public life and readable material separation;
- `blue-hour`: transitional ambience without geometry change;
- `curfew`: reduced public activity, stronger surveillance presence, and motivated practical light without crushed values.

## 6. Rules and tuning values

### City structure

- Level 0 is a compact continuous four-block outdoor Tokyo mission district, not nine isolated landmarks, the rejected sparse/fenced four-block compound, a large decorative city, or buildings arranged on an empty board.
- Preserve three interlocking traversal loops and the mission skeleton, but replace the exact rejected `84×60` block geometry when city composition requires it.
- Four blocks distribute three functional identities: safehouse/backstreets, public transit/contact street, and controlled logistics/service approach.
- Building rhythm is mostly low/mid-rise continuous street walls with one restrained landmark maximum. Corners close the streets without dwarfing the player.
- Street hierarchy combines compact ordinary streets, crossings, sidewalks, and tight service alleys. Large plazas and monumental boulevards are excluded.
- Curated lived-in detail is required where it makes scale and place credible: awnings, restrained planters, bins, civic signs, kiosks, utilities, drainage, barriers, and parked service vehicles. Random filler, repetition, and navigation-obscuring clutter are rejected.
- Ordinary public life appears through small authored civilian/service groups and restrained ambient motion rather than a simulated crowd.

### Color and value

- Core palette: charcoal, bruised umber, muted teal, bone, and sodium amber.
- Technology cyan identifies active Hidzu Corporation devices and connections; it is scarce.
- Dirty crimson identifies confirmed threat and Pursuit, not neutral architecture.
- Lighting direction remains consistently upper-left for baked assets.
- Midtones remain readable. Curfew cannot collapse actors, road edges, entrances, and building bases into one black band.
- Practical lights must be anchored to visible sources and respect the aligned environment state.

### Active GET-205 production path

- GET-205 opens the accepted GET-204 Neo Tokyo 2 master as a derivative rather than rebuilding or replacing the four-block city. Its tracked treatment manifest adds only facade-scale Hidzu identity and a noninteractive atmospheric surround below the gameplay surface; all sixteen building transforms, the `58×44` topology, anchors, masks, collision, and actor ownership remain GET-204-owned.
- The authoritative people-free environment source is one `6400×3600` Blender render with no hidden source clusters. Runtime zoom never swaps or crossfades a second architectural composition.
- The desktop profile preserves that native render through four registered overlapping WebP background tiles plus sixteen same-source hard-occlusion foreground crops. Every texture edge is at most `3202` pixels, so the profile does not depend on an unsupported `6400`-pixel WebGL texture.
- The mobile profile uses one `3200×1800` WebP background plus sixteen half-resolution foreground crops, approximately `39.46 MiB` estimated decoded RGBA and `1.01 MiB` compressed. Its initial zoom is `1.05`; desktop remains `2.00`.
- `get205-hidzu-production-v1` is the normal Level 0 visual path. `?visualTreatment=get204-1` is the explicit diagnostic fallback, while `?visualProfile=desktop|mobile` is a diagnostic profile override. Normal profile selection uses viewport width, with mobile selected at `820` pixels or below.
- Dusk, blue hour, and curfew apply restrained, geometry-stable tint/atmosphere treatments to the same environment layers. They never change collision, camera target, architecture, actor scale, occlusion depth, device geometry, or schedule rules.
- Flattened derivatives, hashes, dimensions, source crops, depth anchors, profile budgets, and Neo Tokyo 2 provenance are versioned. Raw vendor geometry/textures and generated `.blend` files remain outside Git.

### Historical GET-205 pipeline evidence

The following records describe the earlier pre-four-block GET-205 generator and remain useful for selective salvage. They are not the active runtime, do not constrain the accepted GET-204 composition, and do not satisfy current visual acceptance.

- `art/blender/get205/manifests/hidzu-visual-grammar.json` is the single palette, semantic-role, device-shape, civic-message, and color-independent-cue grammar consumed by validation and Blender generation.
- `art/blender/get205/manifests/hidzu-treatment.json` hash-locks the committed GET-204 source manifest, scene recipe, layout contract, master-scene metadata, base transforms, camera, canvas, anchors, and semantic-mask inventory before applying treatment.
- The base `level0-tokyo-unchanged-kit-v2` recipe ID and its eleven semantic layer IDs remain stable. `level0-tokyo-hidzu-treatment-v1` is separate treatment identity rather than a replacement gameplay or layout recipe.
- The provisional treatment declares nine placement-scoped material overrides, 24 gameplay/civic additions, six practical-light sites with visible emitters, three geometry-identical schedule states, and a fixed 17-capture review matrix.
- Semantic masks and exported anchors are immutable T4 inputs. GET-205 copies the validated T4 mask derivatives byte-for-byte and validates every anchor value rather than repainting gameplay topology.
- The treatment pins the exact T4 art-manifest hash and a canonical semantic registration digest. T5 validation compares mask identity, path, cell, pixel origin, dimensions, bytes, and content hash to T4 rather than accepting matching mask names alone.
- Palette tokens, schedule values, material transforms, public-message assignments, grammar identities, and surveillance-state cues are Blender inputs rather than descriptive metadata. Generated evidence records their canonical digests, object bindings, visible text ownership and actual wrapped font-body hashes, color-independent state silhouettes, measured palette coverage, material ownership, and per-addition world bounds; anchor additions must remain inside their declared semantic clearance, while facade additions must remain on their measured source placement.
- The Node runner holds a generation lock and renders only into an ignored run-scoped staging root. A complete `all` run is validated as one directory, moved into an immutable version directory, validated again, and exposed through an atomically replaced `current` symlink. A post-swap readback is part of publication and restores the prior pointer before rejecting the new run. Partial runs are retained as noncanonical trials and cannot replace `current`; any prerequisite, Blender, validation, publication, or readback failure leaves the prior complete pointer intact unless the filesystem itself rejects rollback, in which case the new immutable run is retained rather than leaving a dangling pointer.
- Generated `.blend` files remain ignored. Earlier tiled layers, captures, and `runtimeReady: false` evidence remain historical diagnostics; accepted GET-204 flattened derivatives must enter the complete live runtime and may be versioned after requester approval.
- Suspicious and Pursuit captures in this ticket are visual presentation hooks, not proof of the GET-208 surveillance mechanics.

### Projection and runtime

- Runtime base projection: `64×32`, `2:1` isometric.
- Normal play uses a close 2:1 isometric frame with the protagonist in the lower-center lead area and actor/building relationships comparable to the approved street reference. The exact default zoom is calibrated from the complete live candidate.
- Maximum manual zoom-out reaches a deliberately composed four-block mission overview. The dense-city reference supplies only the coherence/density relationship and does not expand the level scope.
- Building, collision, entrance, mask, and depth anchors derive from the shared layout contract and export metadata.
- Generated environment layers must not be upscaled blurry composites, mismatched-angle plates, or per-building collage assembled independently in Phaser.
- Normal play hides the district boundary. Manual minimum zoom may reveal the whole authored composition, but never missing city edges, repeated plates, floating bases, clipping, voids, or corruption.
- Foreground buildings use selective fade only when they occlude the protagonist or a required interaction; broad translucency and x-ray duplication remain prohibited.

### Actors and portraits

- Twelve grounded actor identities: four protagonists, Lira, Naila, Brant, two Hidzu Corporation security archetypes, and three civilian archetypes.
- World contract: `64×96`, eight directions, four frames, `idle`, `move`, and `interact`; no attack animation is required.
- Foot anchors remain stable within two pixels.
- Actor presentation is calibrated with the four-block mission camera so the protagonist, nearby civilians, contacts, and security have the human presence shown in the approved street reference. A global sprite multiplier is secondary to the camera/building relationship and remains adjustable until the live frame is accepted.
- Actors sample authored `ActorLightRegion` metadata at their foot anchor and ease a subtle semantic amber/cyan tint. `OPEN-ART-005` owns final tint strength/feathering; its reversible baseline is strongest-region-only blending, `250 ms` easing, and restrained intensity.
- World sprite, portrait, dialogue identity, and role silhouette must match.
- Takahiro Kobayashi receives a propaganda/broadcast portrait; George receives separate AR presentation art.

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
- George’s floating AR avatar is private, light, and subordinate to the protagonist; it cannot resemble an armed companion or obscure route geometry.

## 10. Failure, recovery, and Restart Attempt behavior

- Missing or invalid art manifests use an explicit fallback and diagnostics; required production acceptance cannot rely on fallback assets.
- Zoom corruption, seam exposure, anchor drift, detached shadows, unreadable curfew values, or required-object occlusion fails the visual gate.
- The pipeline must reproduce a known export from versioned recipe/manifests without committing raw licensed geometry.
- Restart Attempt and New Game must select the correct aligned visual state from world-clock state without stale layers from a previous run.
- Restart Attempt and scene rebuild clear transient actor-tint interpolation and resample the restored foot anchors deterministically.
- If visual and gameplay geometry disagree, preserve the mission skeleton, identify the accepted visual geometry, and back-propagate it into the single layout/collision/mask/anchor contract. Neither hidden collision nor a visually weak legacy block may remain authoritative by accident.

## 11. Content-authoring requirements

- Maintain a source/provenance manifest for every Neo Tokyo asset used and keep all raw vendor files outside Git. Record requester-confirmed ownership honestly; do not invent a receipt or license tier.
- Maintain the Level 0 master-scene recipe, camera/projection settings, transforms, material treatment, light rig, export layers, masks, anchors, and validation checks.
- For GET-204, first produce an actual Blender close frame and four-block overview from the same named-source master. After that gate is approved, produce a clean live frame, the same frame with the current HUD, and a four-block overview at `1440×900` and `1920×1080`; verify `1280×720` compatibility before final closeout.
- For GET-205, regenerate the production manifest and both runtime profiles with `yarn art:level0:t5:production` whenever the accepted stable plate or foreground silhouettes change. Hash-check every published derivative and inspect normal desktop, minimum overview, automatic mobile, dusk, blue-hour, and curfew states in the live Level 0 runtime before acceptance.
- Produce live captures for safehouse opening, dusk street, Lira, Naila, Brant, public route, curfew route, camera observation, Suspicious, Pursuit/drone, cache/manifest, minimum zoom, Character screen, dossier, failure, Restart Attempt, debrief, and completion.
- Maintain actor manifests, deterministic generation recipes, pixel-derived metrics, integrity hashes, neutral fallback evidence, and matching portrait references for all required identities.
- Author signage and public-screen copy in the approved cultural/language policy once that open decision is resolved.

## 12. Edge cases and prohibited shortcuts

- No synthetic regeneration of owned architecture into unrelated fantasy or generic cyberpunk buildings.
- No raw licensed geometry in Git.
- No independent building sprites arranged as a city collage, opaque parcel slabs, floating bases, empty board, or decorative perimeter.
- No protecting rejected greybox geometry merely because it already exists. A topology change must preserve the mission skeleton, update the shared contract, and prove reachability/collision against the accepted city.
- No giant permanent labels, x-ray actors, universal building transparency, broad path lines, debug outlines, or glow as a substitute for composition.
- No baked light that contradicts the upper-left rig or visible practical source.
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
3. The public route and curfew route feel like different uses of the same district rather than different map scripts.
4. A camera, its connected terminal, and its current coverage read as one system without debug overlays.
5. Curfew changes atmosphere and surveillance tension while actors, road edges, hiding places, and objectives remain readable.
6. The bottom HUD stays within 18% at target viewports and preserves four clear information lanes.
7. A clean city frame and the same live frame under the current HUD preserve the same world hierarchy; GET-204 does not fake quality by hiding the HUD or redesigning it.
8. The requester accepts the complete rebuilt live district; automated validators and internal stage captures are green but are not treated as visual proof.
9. At 1280×720, 1440×900, and 1920×1080, actors cross authored light regions with subtle eased amber/cyan integration and no gameplay change.

## 16. Owning Linear ticket

- City baseline: `T4` (`GET-204`) — four-block named-KitBash Tokyo rebuild, Blender proof before runtime promotion.
- Hidzu Corporation treatment: `T5` (`GET-205`) — Hidzu Corporation identity and graphic-surveillance-noir world art.
- Actors: `T6` (`GET-206`) — Grounded actors, portraits, and entry-flow presentation.
- Actor lighting: `T10B` (`GET-215`) — `ActorLightRegion` metadata, runtime foot-anchor sampling/tinting, validators, and live visual acceptance under `T10` (`GET-210`).
- HUD: `T9` (`GET-209`) — Dialogue, George, facts, dossier, social feed, and four-lane HUD.
- Canonical decisions: `GDR-ART-001` through `GDR-ART-011`, `GDR-UI-001`, `GDR-UI-002`, `GDR-GEO-001`, `GDR-REM-011`, and `GDR-SUP-001` through `GDR-SUP-004` in [[12 Game Design Decision Register]].
