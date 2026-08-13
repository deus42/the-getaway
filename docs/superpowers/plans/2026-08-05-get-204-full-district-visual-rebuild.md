# GET-204 Four-Block KitBash City Rebuild Plan

**Goal:** Replace the generated-plate shortcut with one mission-sized, four-block Tokyo district authored from named Neo Tokyo 2 assets, while preserving the accepted close-play relationship and leaving the live game untouched until the real Blender result is visually approved.

**Primary acceptance:** The requester approves an actual Blender close frame and overview that materially match the approved KitBash + Reference 2 concept. Validators, asset counts, and internal ratings support this gate but cannot pass it.

**Runtime boundary:** This plan does not redesign the HUD, Menu, characters, movement, quests, dialogue, surveillance logic, or other gameplay systems. Those return to their owning tickets after the city source-geometry gate.

## Locked references and authority

- `art/references/get205/kitbash-reference2-blend-concept-v1.png`
  - SHA-256: `b8e69fcbb4839cf2fb70fa80e03c42ff321e6a5ee00c2287f1f824f08e951c5d`
  - AI-assisted previsualization only.
  - Owns the four-block composition, close playable camera, protagonist/building relationship, warm/cold value balance, restrained Hidzu landmark, and street-wall density.
  - Does not authorize generated architecture or satisfy production provenance.
- `art/references/get204/street-play-target.png`
  - Owns normal-play intimacy, actor prominence, social readability, and the amount of street context around the protagonist.
- `art/references/get204/canvas-quality-target.png`
  - Owns material depth, lighting quality, facade richness, and restrained wet response.
- `art/references/get204/dense-city-target.png`
  - Secondary overview check only. It does not authorize a larger city than the mission requires.

## Locked city shape

- Exactly four dense urban blocks in one Blender master scene.
- Three functional identities distributed across them:
  1. safehouse/backstreet;
  2. public/transit/contact street;
  3. controlled logistics/service approach.
- Three interlocking traversal loops may cross the four blocks, but their topology remains gameplay-owned and is not invented from visual convenience.
- One restrained Hidzu landmark; no tower cluster or skyline competition.
- Mostly low/mid-rise source buildings that form street walls and resolved corners.
- Compact crossings, sidewalks, curbs, alleys, entrances, and service seams; no empty board or oversized plaza.
- A few intentional scale figures may appear in offline proof renders, but no person is baked into runtime environment layers.
- Every visible production building records its exact Neo Tokyo 2 source prefix. Synthetic or AI-generated buildings are prohibited.

## Protected workspace

Do not reset, stash, delete, overwrite, or stage unrelated work. In particular preserve `.claude/`, `memory-bank/01 MVP/14 Specification Review Queue.md`, partial GET-208 surveillance files, the uncommitted GET-205 candidate, and the current accepted live GET-204 runtime. No commit is authorized by this plan.

## Phase 1 — Governance and source lock

1. Reopen GET-204 and park GET-205.
2. Attach the approved concept to GET-204 and record its hash/provenance.
3. Align the quality contract, Art Direction, Decision Register, Roadmap, MVP Readiness, AGENTS rule, and progress notes.
4. Replace prior active language that requires a large complete district, 18–24 building clusters, or two/three skyline landmarks.

**Proof:** Linear, canonical documents, and the active plan all describe the same four-block source-geometry gate.

## Phase 2 — Test-first composition contract

1. Write a failing GET-204 contract test for:
   - exactly four urban blocks;
   - the three functional identities;
   - a compact mission-sized extent;
   - named Neo Tokyo 2 provenance for every building;
   - no generated architecture and no cropped synthetic frontage;
   - one restrained landmark maximum;
   - close-play actor target of approximately 95–115 visible pixels at 1440×900;
   - separate close and overview cameras from the same scene;
   - runtime actors excluded from baked environment art.
2. Create a new mission-district manifest rather than mutating the rejected large-city recipe into another ambiguous state.
3. Make the focused contract pass before production rendering.

**Proof:** Focused tests reject the old eight-block/20-cluster recipe and accept only the new four-block source-bound manifest.

## Phase 3 — Actual Neo Tokyo 2 Blender master

1. Reuse the proven archive validation, import, material relink, bounds, camera, and registration helpers from GET-204.
2. Import only the selected named kit roots and compose them at credible scale.
3. Build roads, sidewalks, curbs, crossings, alleys, thresholds, and service space in Blender around mission topology.
4. Preserve recognizable KitBash geometry and materials; improve seating, midtones, and ground contact without regenerating architecture.
5. Establish the fixed 2:1 camera family, cool blue-hour fill, visible sodium practicals, restrained wet response, and a few non-baked scale proxies.
6. Save the generated `.blend` and renders only under ignored `.generated/` evidence.

**Proof:** Source inventory maps every visible building to a named pack root, and Blender renders the same four-block master from close and overview cameras.

## Phase 4 — Internal visual rejection loop

Judge the actual render in this order:

1. protagonist/building/camera relationship;
2. street-wall density and resolved corners;
3. route and entrance readability;
4. road, curb, sidewalk, and facade material depth;
5. motivated light and readable midtones;
6. professional KitBash identity;
7. restrained Hidzu presence;
8. coherent overview without a sparse-board silhouette.

Change one variable class per pass. Do not use fog, bloom, labels, glare, or grading to conceal weak massing. Do not show the requester an obviously incomplete render merely because Blender finished.

**Requester gate:** Present the best actual Blender close frame and overview together. Stop for visual judgment. Runtime integration remains blocked until explicit approval.

## Phase 5 — Same-master runtime integration after approval

Only after the Blender gate passes:

1. export registered ground, architectural, foreground-occluder, and semantic layers from the accepted master;
2. derive collision, entrances, masks, occlusion, and anchors from the same geometry;
3. promote through a reversible manifest path without overwriting the accepted runtime fallback;
4. keep all people, the protagonist, George, devices with live state, and interaction feedback as runtime-owned layers;
5. validate close play, zoom range, collision, selective fade, and minimum zoom in the actual Phaser scene;
6. capture 1440×900 and 1920×1080 live evidence with the current HUD plus a clean-world comparison.

**Requester gate:** The live result must be approved separately. HUD/Menu redesign remains out of scope and returns to its own ticket.

## Phase 6 — Closeout only after live acceptance

Run the relevant art/layout validators, lint, build, tests, coverage, and guided Level 0 playtest; inspect the diff and evidence; update Linear and canonical docs. Commit only after explicit requester authorization, and leave GET-204 non-terminal until the committed build is verified.
