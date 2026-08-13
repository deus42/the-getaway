# GET-205 Reference-Native V6 Rebuild Plan

> Status: authority draft. Production execution starts only after the documentation package is explicitly authorized, committed, read back, and `OPEN-LAYOUT-007` is exercised through the plan/greybox gate.

**Goal:** Replace the inherited four-block geography with the literal Reference 2 mission plan, extended into the complete Level 0 neighborhood, while retaining stable mission semantics and the existing runtime/art-delivery machinery.

**Architecture:** One versioned plan manifest generated from [[32 GET-205 Reference-Native Layout Contract]] owns bounds, streets, parcels, dynamic gate, semantic anchors, proof starts, camera constraints, and probes. The v6 Blender builder, `Level0LayoutContract`, collision, surveillance/occlusion geometry, renderer, profiles, and tests consume or verify that manifest. Historical GET-204/v4/v5 sources remain recoverable and never resolve automatically as v6.

**Toolchain:** Blender 5.0.1 Cycles/Metal, Python scene builder, TypeScript/Phaser layout/runtime, Node publication validators, Jest, fixed live browser evidence.

## Frozen authority

- Current decision: `GDR-ART-019`.
- Exact reversible seed: [[32 GET-205 Reference-Native Layout Contract]] sections 6.1–6.9.
- Pending requester freeze: `OPEN-LAYOUT-007`.
- Plan identity: `get205-reference-native-v6`.
- Runtime identity after acceptance: `get205-reference-native-production-v3`.
- Historic only: `58×44` grid, four-block invariant, v4/v5 route/footprint/anchor coordinates, `{29,22}` camera target, `x=36` landmark mandate, v5 `0.95–1.05` density ratio, and recovered 24-point fixture.
- Preserved: semantic IDs, route-loop IDs/names, mission flow, direct movement, gate verification semantics, objectives/facts/dialogue, HUD, actors, clock/schedules, tiled plates, per-identity occlusion, desktop/mobile profiles, schema-v2 three-state delivery, preload/prefetch/crossfade/generation-token behavior, wet-look and proportion gates.

## Task 1 — Commit the authority package

1. Run contradiction, decision-ID, wiki-link, removed-current-intent, and Linear semantic-parity checks.
2. Inspect the exact docs-only diff and exclude every production/runtime/generated/research file.
3. Obtain explicit requester authorization for the documentation commit.
4. Commit only the authorized file list with `docs(GET-205): authorize reference-native layout`.
5. Read back the commit, verify the exact file set, then confirm GET-205 remains `In Progress`.

## Task 2 — Generate one v6 plan manifest red-first

Planned production files (exact names finalized only after Task 1):

- `art/blender/get205/manifests/reference-native-v6.json`
- `the-getaway/scripts/get205-reference-native-plan.test.mjs`
- `the-getaway/scripts/validate-get205-reference-native-plan.mjs`

1. Write failing tests for identity, `44×38` bounds, every named street polygon, all parcel footprints/heights, gate/booth/beacons/fence, every anchor including the proof point, stable loop IDs/names, camera boxes, 22 static probes, and four dynamic probes.
2. Generate the manifest literally from the canonical seed; do not transform old coordinates.
3. Validate route/parcel/fixture intersections with `0.32` clearance, required-anchor connectivity, direct-gate conditional reachability, sneak-bypass reachability, and restart closure.
4. Keep the v4/v5 manifests untouched and identifiable as historical.

## Task 3 — Build and gate the raw plan/greybox

1. Build only neutral parcel masses, roads, sidewalks, gate, low booth, shelter/bench, café awning/tables, three terminal kiosks, guard/Needle/mission figure placeholders, and source-scale door/human markers.
2. Render a dimensioned top-down plan and parcel/anchor overlay.
3. Solve one 45°/30° hero camera from the normalized composition boxes; record exact target/scale in the v6 recipe. Do not move geometry to compensate for a failed crop.
4. Render raw `1440×900` greybox, complete-neighborhood overview, identity masks, and a hidden answer key.
5. Run all plan, route, anchor, clearance, static/dynamic probe, camera-box, and identity-contribution checks.
6. Present raw reference/candidate first. The requester must point to destination, obstacle, blend, hack, and sneak before seeing the answer key and confirm “this is Reference 2's plan, extended.”
7. If rejected, revise the canonical plan seed with the pointable reason; do not start facades.
8. If accepted, resolve `OPEN-LAYOUT-007`, freeze the plan/greybox/camera baselines atomically, and request authorization for any resulting authority commit.

## Task 4 — Build the source-derived blue-hour hero

1. Derive a v6 scene from recoverable named Neo Tokyo 2 source assets without overwriting any prior source.
2. Realize each parcel as a separate source/provenance identity and independent future depth slice. A continuous wall is never one merged cutout.
3. Build the real dynamic barrier, guard booth, beacons, fence, shelter, café, terminals, hide recesses, and Needle launch at the accepted plan anchors.
4. Add detailed warm and cold windows, richer labels, controlled cool-white/cyan devices/identity accents, one dominant HIDZU face, sparse red warning/threat sources, readable cool fill, continuous wet road response, and reflections under every emitter.
5. Use Cycles on Metal with adaptive samples and denoising; inspect the `200%` road/reflection crop for sparkle or smearing and raise sampling when needed.
6. Render only the blue-hour `1440×900` hero from the frozen v6 camera. Present `reference | candidate | delta notes`, the crop, and two-sided visual metrics. Stop for requester hero approval.

## Task 5 — Regenerate three states and runtime artifacts

1. From the immutable accepted v6 geometry/camera, render people-free dusk, blue-hour, and curfew masters at `6400×3600`.
2. Regenerate desktop tiles, mobile background, independent identity foregrounds/depth anchors, collision, occlusion, placement, stable-plate hashes, camera/profile metadata, and regression frames for every state.
3. Keep random ambient NPC allocation removed. Place only two seated plus one standing transit passenger, two seated café patrons, one public guard, and Needle in their exact nonblocking runtime slots. Keep `blend.delivery_activity` unavailable.
4. Retain schema-v2 state paths/hashes/bytes, page-stable profile selection, current-phase preload, 19:50/21:50 prefetch, 20:00/22:00 boundaries, 750 ms complete-set crossfade, generation-token stale rejection, retained-current-state failure, and post-transition disposal.
5. Build and validate in staging, then atomically swap the bounded public root. Failure leaves current production intact.
6. Measure total transfer, each profile/state payload, one-set decoded residency, two-set transition peak, first load, and stable frame behavior; obtain a new budget instead of inheriting v4 ceilings.

## Task 6 — Live acceptance and closeout

1. Prove the real closed gate blocks the direct route, authorized state opens it, the sneak seam reaches the service entrance while closed, and Restart Attempt restores the closed gate and new spawn.
2. Inspect clean-world/current-HUD, Reference A/B, aligned three-state strip, complete-neighborhood overview, desktop/mobile, three occlusion sites, actor feet, and accepted v6 zoom sweep at `1280×720`, `1440×900`, `1920×1080`, and `390×844`.
3. Inspect initial phase, both prefetches/boundaries, direct jumps, rewinds, stale completions, failed loads, texture disposal, and single/double-set residency.
4. Stop for requester live visual/behavior acceptance.
5. After acceptance, run relevant asset validators, `yarn lint`, `yarn build`, `yarn test --runInBand`, `yarn test --coverage --runInBand`, and `yarn playtest:agent -- --ticket GET-205 --mode closeout`; coverage remains above 80%.
6. Review and stage only coherent GET-205 files, obtain explicit implementation-commit authorization, commit, comment Linear, move only to `In Review`, and wait for requester verification before `Done`.

## Stop conditions

- Stop before production if the authority package is not committed/read back.
- Stop before facade work if `OPEN-LAYOUT-007` is open or the blind greybox read fails.
- Stop before states/runtime if the blue-hour hero is not accepted.
- Stop before closeout/commit if live visual/behavior acceptance is absent.
- Never weaken the plan, route, dynamic-gate, probe, source/provenance, wet-look, proportion, manifest, or live-evidence gates to manufacture a pass.
