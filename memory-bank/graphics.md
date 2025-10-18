<graphics_guide>
  <depth_pipeline>
    <summary>
      Centralised depth ordering ensures every isometric scene renders with a consistent z-stack and avoids ad-hoc
      `setDepth` calls. `computeDepth` encodes screen-space Y as the dominant axis, X as a 10-bit slice, and reserves a bias
      channel for fine-grained layering.
    </summary>
    <compute_depth>
      <formula>(floor(screenY) &lt;&lt; 10) + (floor(screenX) &amp; 0x3ff) + bias</formula>
      <notes>
        <note>Bias values are clamped to ±1023 to prevent overflow.</note>
        <note>Store pixel coordinates (not grid coordinates) before syncing depth.</note>
      </notes>
    </compute_depth>
    <bias_bands>
      <band name="TILE_BASE" value="0">Ground tiles, static decals baked into map graphics.</band>
      <band name="TILE_OVERLAY" value="48">Floor-bound highlights that should sit above terrain.</band>
      <band name="PROP_LOW" value="96">Short props such as crates, barricades, signage bases.</band>
      <band name="PROP_TALL" value="128">Tall props (street lights, billboards) that must overtake low props.</band>
      <band name="CHARACTER_BASE" value="160">Character base glows and ground rings.</band>
      <band name="CHARACTER" value="192">Primary character containers (player, enemies, NPCs).</band>
      <band name="EFFECT" value="224">Transient FX (AEO pulses, ability telegraphs) that wrap characters.</band>
      <band name="FLOATING_UI" value="256">Vitals bars, nameplates, status widgets.</band>
      <band name="PATH_PREVIEW" value="288">Route previews, targeting overlays, tactical gizmos.</band>
      <band name="OVERLAY" value="960">Full-screen post layers (day/night tint, cut-scene fades).</band>
      <band name="DEBUG" value="992">Instrumentation overlays and dev HUDs.</band>
    </bias_bands>
    <static_layers>
      <layer name="BACKDROP" value="-20">Screen background fill.</layer>
      <layer name="MAP_BASE" value="-5">Map tile batch for `MainScene`.</layer>
      <layer name="VISION_OVERLAY" value="2">Guard vision cones.</layer>
      <layer name="PATH_PREVIEW" value="4">Path preview meshes.</layer>
      <layer name="COVER_DEBUG" value="5">Cover wedge debug rendering.</layer>
      <layer name="DAY_NIGHT_OVERLAY" value="100">Multiply-tint overlay for time-of-day.</layer>
    </static_layers>
    <manager_workflow>
      <implementation file="the-getaway/src/game/utils/depth.ts">
        `DepthManager` owns dynamic registrations, refreshes them once per frame, and exposes `registerStatic` for fixed-band items.
      </implementation>
      <helper file="the-getaway/src/game/utils/depth.ts">`syncDepthPoint(manager, object, pixelX, pixelY, bias)` stores pixel coordinates plus bias and triggers registration.</helper>
      <guidelines>
        <item>Instantiate `DepthManager` once per scene and pass it to `IsoObjectFactory`.</item>
        <item>Never call `setDepth` directly on moving objects; always call `syncDepthPoint` after repositioning.</item>
        <item>When pooling objects, reuse the same `GameObject` but keep calling `syncDepthPoint` so coordinates stay fresh.</item>
        <item>Static batches (tile layers, background fills) should continue to rely on `DepthLayers` constants.</item>
      </guidelines>
    </manager_workflow>
  </depth_pipeline>
  <camera_fx>
    <summary>
      `src/game/settings/visualSettings.ts` centralises camera bloom, vignette, and color grading. Defaults now keep the scene unfiltered to match the pre-change brightness, but the plumbing remains in place if future releases need post FX.
    </summary>
    <defaults>
      <bloom enabled="false" color="0xffffff" offset="0,0" blurStrength="0" strength="0" steps="0" />
      <vignette enabled="false" focus="0.5,0.5" radius="1" strength="0" />
      <color_matrix enabled="false" saturation="0" contrast="0" brightness="1" hue="0" />
    </defaults>
    <api>
      <bind method="bindCameraToVisualSettings(camera)">Apply defaults and subscribe to future updates (call during `Scene.create`).</bind>
      <update method="updateVisualSettings(partial)">Override bloom/vignette/color matrix at runtime.</update>
      <reset method="resetVisualSettings()">Return to the default profile and notify listeners.</reset>
    </api>
    <performance_notes>
      <note>Reducing bloom strength or disabling it yields an immediate GPU cost win on mid-tier hardware.</note>
      <note>`bindCameraToVisualSettings` calls `camera.clearFX()` before applying the latest stack to avoid runaway post-processing.</note>
    </performance_notes>
  </camera_fx>
  <integration_checklist>
    <item>Instantiate `DepthManager` and hand it to any helper that spawns isometric graphics (`IsoObjectFactory`, custom factories).</item>
    <item>Sync every movable object (tokens, bars, HUD overlays) via `syncDepthPoint` after updating pixel coordinates.</item>
    <item>Reserve `DepthLayers` for overlays that must remain fixed regardless of camera motion.</item>
    <item>Bind the main camera with `bindCameraToVisualSettings` so bloom/vignette/color grading stay in sync with global settings.</item>
    <item>Document new bias bands or FX presets in this guide and cross-link from `memory-bank/architecture.md` when architecture changes reference them.</item>
  </integration_checklist>
  <asset_authoring>
    <summary>
      Art resources should remain visually coherent across the isometric 2.5-D presentation. This section tracks palette, lighting, and export conventions for artists and engineers.
    </summary>
    <palette>
      <note>Primary lighting assumes a cool key from the upper-left. Paint top planes with high-value cool hues, right faces mid-value neutrals, and left faces warm shadows to reinforce the noir aesthetic.</note>
      <note>Maintain the neon accent palette defined in `src/content/ui/index.ts` for HUD overlays to match world signage.</note>
    </palette>
    <tile_specs>
      <spec name="base_tile_size" value="64x32px">All tile art (floors, walls, props) should align to the 2:1 projection at 64×32 pixels per grid cell.</spec>
      <spec name="padding" value="2px">Include at least 2px transparent padding around sprites to avoid bleeding when packed into atlases.</spec>
    </tile_specs>
    <export_process>
      <step>Source art is authored in layered files (Aseprite/PSD) with distinct top/side planes to facilitate shading tweaks.</step>
      <step>Use `scripts/pack-environment-atlas.mjs` (or equivalent) to batch sprites into TexturePacker JSON with normal-map variants when lighting effects are reintroduced.</step>
      <step>Record atlas metadata (naming, frame keys) in `src/content/environment/atlasFrames.ts` so factories can reference by semantic keys rather than raw frame names.</step>
    </export_process>
  </asset_authoring>
  <lighting_and_effects>
    <summary>
      Lighting, particle, and shader guidelines for systemic readability.
    </summary>
    <ambient>
      <note>Scene ambient color defaults to `0x1a1a1a` via `MainScene` background. Adjust only through central settings to keep HUD and Phaser backgrounds consistent.</note>
      <note>Reintroduce bloom or vignette selectively for narrative beats by toggling `updateVisualSettings({ bloom: { enabled: true, ... } })` rather than per-object FX.</note>
    </ambient>
    <particle_guidelines>
      <guideline>Use Phaser `ParticleEmitterManager` with additive blend only for high-impact events (explosions, hacking). Keep emission counts low; prefer sprite sheet animations for loops.</guideline>
      <guideline>All particle textures must adhere to the 2:1 projection silhouettes or be radial; otherwise they will break perspective.</guideline>
    </particle_guidelines>
  </lighting_and_effects>
  <performance_notes>
    <summary>
      Rendering performance guardrails to maintain smooth frame pacing.
    </summary>
    <rule>Batch static world props into Phaser `GameObjects.Layer` or `Container` when counts exceed 200 per scene to limit draw calls.</rule>
    <rule>Prefer `setVisible(false)` over `destroy()` for temporary overlays to avoid GC spikes; reuse and re-sync depth via `syncDepthPoint` when toggling back on.</rule>
    <rule>When introducing new shaders or pipelines, profile using Chrome WebGL inspector and log findings under this section with `<profile>` entries.</rule>
  </performance_notes>
  <tooling>
    <summary>
      Diagnostics and tooling references for debugging graphical issues.
    </summary>
    <utility name="Context Loss Harness">Use the guidance in MVP Step 34.8 (`WEBGL_lose_context`) to ensure new rendering features survive context resets.</utility>
    <utility name="Atlas Inspector">`scripts/dump-atlas-metadata.ts` enumerates atlas frames and highlights missing normal maps; update when new atlases are introduced.</utility>
    <future_work>
      <item>Rebuild the SpectorJS walkthrough previously drafted (MVP Step 34.9) once the profiling playbook is reinstated in Post-MVP scope.</item>
    </future_work>
  </tooling>
</graphics_guide>
