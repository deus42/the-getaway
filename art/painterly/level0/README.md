# Level 0 graphic painterly-noir source art

This folder is the retained source-art package for GET-180. Runtime exports are
normalized deterministically from these references; gameplay topology and data
remain authoritative in the application.

## Locked visual language

- Hand-painted gouache and dry-brush texture with heavy, irregular ink masses.
- Upper-left key light; neutral authored buildings receive day/night changes at runtime.
- Palette: charcoal `#0B0D12` / `#1B1F24`, bruised umber `#513B35`, dirty
  crimson `#8E4147`, muted teal `#5B7775`, bone `#D5C8B5`, sodium amber
  `#D99A50`, and scarce technology cyan `#50BFD0`.
- Props must communicate cover, hazard, surveillance, pickup, entrance,
  safehouse, or active-contact state. Decorative route clutter is excluded.

## Sources

- `master-style-board.png`: world, character, material, and HUD thesis.
- `actor-reference-lineup.png`: identity/costume reference for all 14 Level 0 actors.
- `characters/references/`: isolated actor reference crops in manifest order.
- `characters/turnarounds/`: AI-painted eight-view chroma-key source sheets.
- `building-reference-sheet.png`: the original nine Level 0 landmark identities in block order.
- `building-extraction-sheet-alpha.png`: retained alpha source for the original monument-scale exports.
- `building-block-composites-chroma.png`: AI-painted urban compound source on a removable flat key.
- `building-block-composites-alpha.png`: normalized production source for the nine dense city parcels.
- `scripts/build_runtime_assets.py`: deterministic 64×96 sprite-sheet, 256×256 portrait, and block-composite normalization.

Actor order is four hero presets, Lira, Naila, Brant, Juno, Warden, Kesh,
Yara, Reyna, Orn Patrol Sentry, and the CorpSec Sweep Captain. Building order
is `block_1_1` through `block_3_3`, row-major.
