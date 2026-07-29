# Level 0 Building Sheet — Regeneration Spec (GET-181)

Purpose: replace `building-block-composites-chroma.png` with a higher-resolution
sheet of nine contained landmark superstructures whose ESB reads as a true
tower. Runtime owns the exact parcel plate; generated art is never stretched or
warped to counterfeit a footprint match.

## Sheet contract (must-follow)

- **Canvas**: 4096×4096 (preferred) or 3072×3072. Even 3×3 grid — each cell is
  exactly one ninth; the slicer cuts by thirds with no registration marks.
- **Background**: flat magenta `#F204F3` everywhere outside silhouettes
  (`chroma_to_alpha.py` auto-detects the key; keep it uniform, no gradients).
- **One city block per cell**, row-major:

  | Cell | Block | Identity |
  |---|---|---|
  | 1,1 | block_1_1 | **Empire State tower** — deco setback spire rising from a low courtyard compound. USE THE FULL CELL HEIGHT: tower ≥ 2.5× the plate span tall. |
  | 1,2 | block_1_2 | Mercantile Exchange — glass-vaulted trading hall with attached row wings |
  | 1,3 | block_1_3 | Arcology Plaza — stacked terraces, roof gardens gone feral |
  | 2,1 | block_2_1 | Market Hub — awninged market hall, red canvas, street stalls fused to facade |
  | 2,2 | block_2_2 | Waterfront Commons — low civic dome, colonnade, flooded courtyard |
  | 2,3 | block_2_3 | Corporate Plaza — brass-trimmed slab towers on a shared podium |
  | 3,1 | block_3_1 | Industrial Yards — factory sheds, smokestack, gantry cranes |
  | 3,2 | block_3_2 | Transit Node — vaulted rail hall, elevated platform stubs |
  | 3,3 | block_3_3 | Research Quadrant — domed observatory block, service annexes |

- **Base geometry (the critical rule)**: author each cell against its actual
  runtime `width × depth` tile parallelogram, not a universal 2:1 diamond:

  | Cells | Runtime footprint |
  |---|---|
  | `1,1` | `16 × 12` |
  | `1,2`, `1,3` | `29 × 12` |
  | `2,1`, `3,1` | `16 × 18` |
  | `2,2`, `2,3`, `3,2`, `3,3` | `29 × 18` |

  These are exported from `getLevel0Content('en')` into
  `level0-building-footprints.json`; do not hand-maintain a second footprint
  table in the pipeline. Keep the complete podium visible and paint no cast
  shadow outside the silhouette. Runtime draws the exact projected footprint
  plate, registers the measured source-base center to its centroid, and derives
  a conservative per-cell scale from every decoded pixel with alpha greater
  than `36` at or below the measured base-corner row. The build rounds each
  maximum safe fill down to two decimals and the validator independently proves
  zero such ground-contact pixels outside the runtime footprint polygon. This
  `contained-superstructure` rule preserves
  architectural verticals and prevents street-level intrusion without
  pretending that an AI-authored near-square podium is a four-corner match.
- **Camera/light**: same axonometric angle as the current sheet; key light
  upper-left, neutral white; NO colored rim light; ambient occlusion only
  inside the silhouette — no cast shadows onto the magenta.
- **Palette**: production contract in
  `memory-bank/01 MVP/30 Art Direction (MVP).md` — charcoal, bruised umber,
  dirty crimson, muted teal, bone, sodium amber. Cyan only as scarce semantic
  technology accents. Lit windows warm amber, sparse by day logic.
- **Silhouette**: one connected mass per cell (the pipeline keeps only the
  largest alpha blob — detached antennas/drones will be dropped).

## Suggested master prompt

> Painterly noir isometric city-block sprite sheet, 3×3 grid on flat magenta
> #F204F3. Nine dense dystopian city compounds, each standing on its specified
> non-square isometric parcel, fully contained inside its cell with a clean
> centered podium base. Muted palette: charcoal, bruised umber, bone, sodium amber window glow,
> rare teal accents. Hand-painted texture, hard paper-cut edges, upper-left
> neutral key light, no cast shadows outside each block's diamond, no text.
> [Insert the nine cell identities from the table.]
> Cell 1 is a monumental Empire State-style deco tower using the full cell
> height. Consistent scale: door heights identical across all nine blocks.

Generate at the highest available resolution; upscale to 4096 before export if
the tool caps lower. Iterate per-cell with inpainting rather than regenerating
the whole sheet when one block misses its plate geometry.

## After generation

```bash
cd the-getaway
yarn art:level0:footprints
cd ../art/painterly/level0/scripts
uv run --with pillow python chroma_to_alpha.py path/to/new-sheet.png ../building-block-composites-alpha.png
cp path/to/new-sheet.png ../building-block-composites-chroma.png
cd ../../../../the-getaway
yarn art:level0:build
yarn art:level0:validate
```

The validator independently re-measures alpha sanity, verifies the runtime
metrics copy, checks the exported footprints against live Level 0 content, and
recomputes the maximum safe fill from decoded runtime alpha to prove every
pixel with alpha greater than `36` at or below the measured base-corner row
stays inside the actual footprint polygon at the manifest's declared per-asset
fill. It also rejects saturated magenta key-color fringe in the generated
landmarks and non-semantic cyan/purple color washes in their lower podiums;
the civic-center normalization folds its generated ground cast back into the
neutral pavement value without changing alpha geometry. `uv` supplies Pillow
for the deterministic build.

## Optional follow-up sheet (GET-182 surround)

The runtime uses the dedicated `building-surround-composites-*` 3×3 anonymous
tenement/warehouse sheet for the city surround. Missing variants fall back to
seeded matte massing; named landmarks must never be used as surround fallback
art.
