# GET-155 Blender Noir-Isometric Template

This folder owns the source-art validation slice for GET-155. It uses only procedural Blender primitives so the preview assets are CC0-safe and repeatable.

## Command

Run from `the-getaway/`:

```sh
yarn graphics:get155
```

The command uses `/Applications/Blender.app/Contents/MacOS/Blender` by default. Override with `BLENDER_BIN=/path/to/blender` if needed.

## Generated Outputs

- `art/blender/get155/get155_iso_noir_template.blend`
- `art/blender/get155/renders/building_art_deco_a.png`
- `art/blender/get155/renders/prop_crate_a.png`
- `art/blender/get155/renders/prop_streetlight_a.png`
- `art/blender/get155/renders/prop_neon_sign_a.png`
- `art/blender/get155/get155_preview_manifest.json`
- `the-getaway/public/atlases/get155_preview.png`
- `the-getaway/public/atlases/get155_preview.json`

## Template Constants

- Camera: orthographic, X `60deg`, Y `0deg`, Z `45deg`
- Output: transparent RGBA PNG
- Render engine: Eevee
- Color management: Filmic / High Contrast
- Light rig: cool upper-left key, low blue fill, cyan rim, warm neon rim
- Runtime placement: normal Level 0 ESB approach
- Collision terminology: shared collision footprint / navigation blocker / non-walkable floor tiles
