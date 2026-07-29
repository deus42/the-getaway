---
status: MVP
type: art
---

# Art Direction (MVP)

Painterly Noir Art Direction

The Getaway’s visual identity leans into a painterly noir aesthetic—thick atmospheric mood, imperfect brushwork, and deliberate grime that mirrors the city’s moral rot.

Color Language & Palette Guardrails
	•	Primary palette draws from desaturated crimsons, bruised umbers, muted teals, sodium ambers, and electric cyan accents reserved for interactables or faction tech.
	•	Value structure favors high-contrast silhouettes against hazy midtones; brightest highlights are scarce and purposeful (siren lights, HUD callouts, corporate signage).
	•	Weathering layers (soot streaks, rain wash, chipped enamel) should be hand-painted or overlaid with visible brush grain to avoid sterile gradients.

Material & Edge Treatment Rules
	•	Metals: cold base tones with warm edge catches; add micro-scratches and oil bloom to break up flat planes.
	•	Concrete & masonry: mottled texture passes with charcoal edging; drift grime vertically to imply runoff.
	•	Fabric & leather: softened edges, frayed seams, and occasional stitch highlights to keep silhouettes readable.
	•	Hard vs. soft edges: reserve razor-sharp cuts for weapons and corporate hardware; diffuse edges elsewhere to maintain painterly cohesion.

Signage, UI Diegesis & Lighting Motifs
	•	District signage should riff on period noir typography (condensed sans-serifs, deco ligatures) while integrating glitched neon or flicker passes for lived-in decay.
	•	Diegetic displays (billboards, kiosks, George’s overlays) glow with cool cyan/teal, contrasted by warmer street lighting to frame interactable spaces.
	•	Use motivated pools of light (overhead lamps, leaking neon, vehicle headlights) to sculpt scenes and reinforce cover silhouettes in gameplay spaces.
	•	Level 0 route art must earn its place through gameplay: cover, hazards, cameras, pickups, entrances, safehouses, and active contacts are allowed; ambient prop clusters, route clutter, and decorative beacons are not.
	•	Long Level 0 travel lanes stay legible through authored surface value masses, walkable/blocked/cover contrast, active objective markers, and the minimap route. Do not compensate for weak composition with repeated freestanding decoration or permanent actor labels.

Level 0 Graphic Painterly-Noir Production Contract (GET-180)
	•	Outdoor Level 0 is the first production slice for `graphic-painterly-noir`; interiors, other maps, and invalid/missing assets retain the vector presentation as fallback.
	•	Palette: charcoal, bruised umber, dirty crimson, muted teal, bone, and sodium amber. Technology cyan is scarce and semantic; crimson is reserved for active threats. Authored light direction is consistently upper-left.
	•	Actors use complete `64×96` eight-direction sheets with four frames each for `idle`, `move`, `attack`, and `interact`. Hero, contact, guard, and hostile references must share silhouette language with their dialogue portraits; runtime scale does not replace correct frame occupancy.
	•	Named buildings use neutral authored albedo art over an exact runtime footprint plate. Generated landmarks remain unwarped, register their measured base center to the parcel centroid, and use a per-asset safe fill derived from decoded pixels with alpha greater than `36` at or below the measured base-corner row; the validator permits no such ground-contact pixel outside the footprint polygon and rejects saturated magenta key-color fringe or non-semantic cyan/purple lower-podium washes. Day, curfew, alarm, and practical-light shifts come from runtime atmosphere rather than duplicate baked day/night exports.
	•	Level 0 reads as one city district: nine gameplay parcels retain distinct landmarks and road cores, while a dedicated anonymous low/mid-rise surround continues urban mass beyond every map edge. Surround art never reuses named landmarks, enters the playable map, becomes translucent, or participates in gameplay depth/input/minimap systems.
	•	Normal gameplay framing presents a local neighborhood rather than the whole tactical board. The painterly view suppresses perimeter wall volumes and permanent building labels, blends the map edge into continuous urban mass, and preserves the `0.38` manual overview behind a map-aware coverage floor that prevents exposed void.
	•	The HUD preserves its information architecture but uses matte ink panels, angular edges, fine bone/brass rules, restrained shadows, and semantic amber/crimson/cyan/teal accents. Broad cyan bloom, heavy blur, glossy glass, and rounded-card repetition are outside this slice.
	•	Compact Level 0 HUD framing uses a measured two-by-two dock through `1359px`, caps at `min(440px, 52svh)`, keeps the quest archive above the dock, and reserves the remaining playfield as the camera-safe area. No lane may depend on content overflow to fit.
	•	The master board, actor/building references, deterministic normalization scripts, and export notes live under `art/painterly/level0`; runtime assets remain manifest-driven and validator-friendly.

Reference Sheets & Production Workflow
	•	Produce a one-page style sheet per district outlining palette swatches, texture callouts, signage exemplars, and “do/don’t” mini-comparisons.
	•	Each sheet should cite relevant narrative beats from [[03 Lore/Plot Bible]] so faction tone and environmental storytelling stay aligned.
	•	Store sheets under `the-getaway/src/assets/style-guides/` (or equivalent) with versioned filenames (`districtName_style_v###.mdx/png`) and log updates in [[04 Engineering/Roadmap]] when districts evolve.
	•	All outsourced or generated art must reference the applicable sheet to ensure external collaborators hit the noir constraints without guesswork.
	•	Maintain a reusable SDXL prompt library in `/art/prompts/` (tiles, props, characters). Every brief must reiterate “painterly brush grain, clean albedo, no baked shadows” so runtime lights, not renders, supply depth.
	•	Export atlas-ready sprites at 2:1 ratios (64×32 base tiles, 128px hero props). Place diffuse PNGs in `public/atlases/` with matching JSON (`props.json`) and keep normal maps in `public/normals/` using the `_n` suffix (`lamp_slim_a` → `lamp_slim_a_n`).
	•	Verify normals in Level 0 by enabling the Game Menu lighting toggle (pipes into `visualSettings.lightsEnabled`) then stepping into Waterfront Commons: the indoor validation lamp + point light exposes inverted green channels immediately.

See also: [[03 Lore/Art Direction]]
