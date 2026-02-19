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

Reference Sheets & Production Workflow
	•	Produce a one-page style sheet per district outlining palette swatches, texture callouts, signage exemplars, and “do/don’t” mini-comparisons.
	•	Each sheet should cite relevant narrative beats from [[03 Lore/Plot Bible]] so faction tone and environmental storytelling stay aligned.
	•	Store sheets under `the-getaway/src/assets/style-guides/` (or equivalent) with versioned filenames (`districtName_style_v###.mdx/png`) and log updates in [[04 Engineering/Roadmap]] when districts evolve.
	•	All outsourced or generated art must reference the applicable sheet to ensure external collaborators hit the noir constraints without guesswork.
	•	Maintain a reusable SDXL prompt library in `/art/prompts/` (tiles, props, characters). Every brief must reiterate “painterly brush grain, clean albedo, no baked shadows” so runtime lights, not renders, supply depth.
	•	Export atlas-ready sprites at 2:1 ratios (64×32 base tiles, 128px hero props). Place diffuse PNGs in `public/atlases/` with matching JSON (`props.json`) and keep normal maps in `public/normals/` using the `_n` suffix (`lamp_slim_a` → `lamp_slim_a_n`).
	•	Verify normals in Level 0 by enabling the Game Menu lighting toggle (pipes into `visualSettings.lightsEnabled`) then stepping into Waterfront Commons: the indoor validation lamp + point light exposes inverted green channels immediately.

See also: [[03 Lore/Art Direction]]
