---
category: lore
format: markdown
---

# Art Direction

This note captures the visual + rendering-facing art direction guidance for The Getaway.

See also:
- [[04 Engineering/Architecture]] (render/tech pipeline)
- [[01 MVP/30 Art Direction (MVP)]] (player-facing art direction)

## Depth pipeline

### Goal
Centralised depth ordering ensures every isometric scene renders with a consistent z-stack and avoids ad-hoc `setDepth` calls.

### Compute depth
**Formula**

```
(floor(screenY) << 10) + (floor(screenX) & 0x3ff) + bias
```

**Notes**
- Bias values are clamped to ±1023 to prevent overflow.
- Store **pixel coordinates** (not grid coordinates) before syncing depth.

### Bias bands (dynamic)

| Band | Bias | Use |
|---|---:|---|
| TILE_BASE | 0 | Ground tiles, static decals baked into map graphics |
| TILE_OVERLAY | 48 | Floor-bound highlights that should sit above terrain |
| PROP_LOW | 96 | Short props such as crates, barricades, signage bases |
| PROP_TALL | 128 | Tall props (street lights, billboards) that must overtake low props |
| CHARACTER_BASE | 160 | Character base glows and ground rings |
| CHARACTER | 192 | Primary character containers (player, enemies, NPCs) |
| EFFECT | 224 | Transient FX (AOE pulses, ability telegraphs) that wrap characters |
| FLOATING_UI | 256 | Vitals bars, nameplates, status widgets |
| PATH_PREVIEW | 288 | Route previews, targeting overlays, tactical gizmos |
| OVERLAY | 960 | Full-screen post layers (day/night tint, cut-scene fades) |
| DEBUG | 992 | Instrumentation overlays and dev HUDs |

### Static layers (fixed)

| Layer | Depth | Use |
|---|---:|---|
| BACKDROP | -20 | Screen background fill |
| MAP_BASE | -5 | Map tile batch for `MainScene` |
| VISION_OVERLAY | 2 | Guard vision cones |
| PATH_PREVIEW | 4 | Path preview meshes |
| COVER_DEBUG | 5 | Cover wedge debug rendering |
| DAY_NIGHT_OVERLAY | 100 | Multiply-tint overlay for time-of-day |

### Manager workflow
- Implementation: `the-getaway/src/game/utils/depth.ts`
  - `DepthManager` owns dynamic registrations, refreshes them once per frame, and exposes `registerStatic` for fixed-band items.
- Helper: `the-getaway/src/game/utils/depth.ts`
  - `syncDepthPoint(manager, object, pixelX, pixelY, bias)` stores pixel coordinates plus bias and triggers registration.

Guidelines:
- Instantiate `DepthManager` once per scene and pass it to `IsoObjectFactory`.
- Never call `setDepth` directly on moving objects; always call `syncDepthPoint` after repositioning.
- When pooling objects, reuse the same `GameObject` but keep calling `syncDepthPoint` so coordinates stay fresh.
- Static batches (tile layers, background fills) should continue to rely on `DepthLayers` constants.

## Camera FX

Summary:
- `src/game/settings/visualSettings.ts` centralises camera bloom, vignette, and color grading.
- Defaults keep the scene unfiltered to match pre-change brightness, but plumbing remains for future post-FX.

Defaults:
- Bloom: `enabled=false`, `color=0xffffff`, `offset=0,0`, `blurStrength=0`, `strength=0`, `steps=0`
- Vignette: `enabled=false`, `focus=0.5,0.5`, `radius=1`, `strength=0`
- Color matrix: `enabled=false`, `saturation=0`, `contrast=0`, `brightness=1`, `hue=0`

API:
- `bindCameraToVisualSettings(camera)`: apply defaults and subscribe to updates (call during `Scene.create`).
- `updateVisualSettings(partial)`: override bloom/vignette/color matrix at runtime.
- `resetVisualSettings()`: return to default profile and notify listeners.

Performance notes:
- Disabling bloom yields immediate GPU savings on mid-tier hardware.
- `bindCameraToVisualSettings` calls `camera.clearFX()` before applying the stack to avoid runaway post-processing.

## Integration checklist
- Instantiate `DepthManager` and hand it to any helper that spawns isometric graphics (`IsoObjectFactory`, custom factories).
- Sync every movable object (tokens, bars, HUD overlays) via `syncDepthPoint` after updating pixel coordinates.
- Reserve `DepthLayers` for overlays that must remain fixed regardless of camera motion.
- Bind the main camera with `bindCameraToVisualSettings` so bloom/vignette/color grading stay in sync with global settings.
- Document new bias bands or FX presets here and cross-link from [[04 Engineering/Architecture]] when architecture changes reference them.

## Asset authoring

Summary: art resources should remain visually coherent across the isometric 2.5-D presentation.

Palette:
- Primary lighting assumes a cool key from the upper-left. Paint top planes with high-value cool hues, right faces mid-value neutrals, and left faces warm shadows to reinforce the noir aesthetic.
- Maintain the neon accent palette defined in `src/content/ui/index.ts` for HUD overlays to match world signage.

Tile specs:
- Base tile size: 64×32px (2:1 projection) per grid cell.
- Padding: at least 2px transparent padding around sprites to avoid bleeding when packed into atlases.

Export process:
- Source art in layered files (Aseprite/PSD) with distinct top/side planes.
- Use `scripts/pack-environment-atlas.mjs` (or equivalent) to batch sprites into TexturePacker JSON (optionally normal-map variants).
- Record atlas metadata (naming, frame keys) in `src/content/environment/atlasFrames.ts` so factories can reference semantic keys.

## Lighting & effects

Ambient:
- Scene ambient defaults to `0x1a1a1a` via `MainScene` background. Adjust only through central settings.
- Reintroduce bloom/vignette selectively for narrative beats by toggling `updateVisualSettings({ bloom: { enabled: true, ... } })` rather than per-object FX.

Particle guidelines:
- Use Phaser `ParticleEmitterManager` with additive blend only for high-impact events (explosions, hacking). Keep emission counts low.
- Particle textures must adhere to the 2:1 projection silhouettes or be radial; otherwise they break perspective.

## Performance notes
Rendering guardrails:
- Batch static props into Phaser `GameObjects.Layer` or `Container` when counts exceed ~200 per scene to limit draw calls.
- Prefer `setVisible(false)` over `destroy()` for temporary overlays to avoid GC spikes; reuse and re-sync depth via `syncDepthPoint` when toggling back on.
- When introducing new shaders or pipelines, profile using Chrome WebGL inspector and log findings using:
  - **Profile (YYYY-MM-DD):** change, what was measured, and result (FPS/draw calls/VRAM), plus rollback notes.

## Tooling
- Context Loss Harness: use MVP Step 34.8 (`WEBGL_lose_context`) to ensure new rendering features survive context resets.
- Atlas Inspector: `scripts/dump-atlas-metadata.ts` enumerates atlas frames and highlights missing normal maps.

Future work:
- Rebuild the SpectorJS walkthrough previously drafted (MVP Step 34.9) once the profiling playbook is reinstated in Post-MVP scope.

## Level 0 revamp foundation (2026-02-07)

Summary:
Level 0 uses an assetless noir-vector rendering foundation. Tiles, buildings, characters, and environmental props are generated procedurally so production sprite work can be layered in later without rewriting scene logic.

Modules:
- `the-getaway/src/game/visual/contracts.ts`: defines `VisualTheme`, `BuildingVisualProfile`, `EntityVisualProfile`, `VisualQualityPreset`.
- `the-getaway/src/game/visual/theme/noirVectorTheme.ts`: resolves palettes + budgets (`performance`, `balanced`, `cinematic`).
- `the-getaway/src/game/visual/world/TilePainter.ts`: tile rendering (`drawGround`, `drawCover`, `drawWallVolume`, `drawDoorPortal`, `drawHazardVariant`) + seam breaking.
- `the-getaway/src/game/visual/world/BuildingPainter.ts`: lot slabs, building massing prisms, facade grammar, signage chrome.
- `the-getaway/src/game/visual/world/DistrictComposer.ts`: deterministic facade/lot/massing composition + seeded accent shifts.
- `the-getaway/src/game/visual/world/AtmosphereDirector.ts`: deterministic atmosphere profiles (gradient, fog bands, emissive intensity, wet reflection, overlay tint).
- `the-getaway/src/game/visual/world/OcclusionReadabilityController.ts`: per-frame readability compensation (fade nearby masses, boost halos/nameplates).
- `the-getaway/src/game/visual/world/PropScatter.ts`: deterministic scenic prop scattering (district-aware, respects walkability + buffers).
- `the-getaway/src/game/visual/entities/CharacterRigFactory.ts`: silhouette-v2 procedural rigs with role cues + movement direction hints.

Preset budgets:

| Preset | decor_per_building | animated_hazards | label_density | fog_bands | emissive_zones | wet_reflection_alpha | occlusion_fade_floor | Notes |
|---|---:|---|---|---:|---:|---:|---:|---|
| performance | 2 | false | reduced | 2 | 6 | 0.08 | 0.56 | Prioritise frame pacing and readability |
| balanced | 4 | true | standard | 4 | 10 | 0.14 | 0.48 | Default production target for Level 0 |
| cinematic | 6 | true | high | 6 | 14 | 0.20 | 0.38 | Highest density; retain fallback toggles |

Atmosphere grammar:
- Backdrop gradients, skyline tint, fog-band count, and horizon haze are resolved by `AtmosphereDirector` from district mix and current world time.
- Day/night overlay color inherits the same profile output so atmosphere and visibility tint stay coherent during time transitions.
- Tile wet-surface streaks render only on walkable road-like floor diamonds and clamp by the wet-reflection budget.
- Occlusion readability pass never changes collision/pathing; it only adjusts visual alpha/halo emphasis around dense overlap.

Fallback policy:
- Canvas and WebGL both render the vector kit; no sprite dependency is required for baseline readability.
- Lighting and post FX are budget-gated by quality preset so expensive effects can be downshifted without breakage.
- Entity/building contracts remain stable to support future sprite swap-in behind the same render hooks.
