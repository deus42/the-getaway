# Dystopian HUD Styling Notes

The dystopian CRT-inspired presentation we recently introduced is still active in the codebase. No revert was performed—App layout, shared theme tokens, and supporting utilities continue to reference the new design kit (`src/theme/dystopianTokens.ts`, `src/theme/dystopian.css`, and the updated shell styles in `src/App.tsx`/`src/App.css`).

This document clarifies the intent so that future contributors know why the styling remains in place:

- **Readability-first CRT look.** Scanline and bloom treatments are applied to layout containers and overlays (see `ScanlineOverlay` and `.u-scan`) while typography stays crisp with Inter/Space Grotesk + JetBrains Mono as suggested.
- **Token-driven surfaces.** UI panels and rails pull their palette, gradients, and motion timings from the exported token set. Keep additions aligned with those tokens to maintain coherence.
- **Game scenes unaffected.** Phaser scenes still run without full-screen shader passes; only background render textures opt into the CRT pipeline so gameplay readability is preserved.

If the dystopian kit ever needs to be replaced, prefer adjusting the tokens/utilities rather than ripping out the structure so the HUD remains consistent across React and Phaser layers.
