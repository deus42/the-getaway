---
category: engineering
type: guide
status: MVP
---

# 3D → 2D Sprite Pipeline (Blender POC)

Goal: **prove the pipeline** (Blender → PNG sprite → Phaser) with one “building” sprite **before buying KitBash3D**.

This POC answers:
- Can we render assets that match the game’s **2:1 isometric grid** (tile 64×32)?
- Do sprites **anchor + depth-sort** correctly in Phaser?
- Does the look survive **day/night overlays** and stealth UI overlays?

If this works for one building, it scales.

---

## 0) Choose a sample building (no purchase required)

Recommended for POC (zero license risk):
- Model a simple **art-deco/noir tower** in Blender using cubes + bevels + a few emissive windows.

Alternative (if you want realism fast):
- Download **one free/CC0 building** model (be careful with licensing/attribution). For the POC, it’s fine if the model is ugly as long as it tests the pipeline.

---

## 1) Blender scene setup (repeatable template)

### 1.1 Camera (2:1 isometric-friendly)
In Blender:
1. Add a camera.
2. Set **Type = Orthographic**.
3. Set rotation to match 2:1 iso art convention:
   - **Z = 45°**
   - **X = 60°**
   - **Y = 0°**
4. Set **Orthographic Scale** so the building fills the frame nicely.

Notes:
- The game grid is 2:1 (tile 64×32). This camera setup produces a compatible “classic isometric” look.
- Don’t fight “true isometric vs dimetric” too hard for the POC. Consistency matters more than math purity.

### 1.2 Lighting (noir rig)
Keep it simple and repeatable:
- Key light: cool, upper-left
- Fill: very low
- Rim: subtle, warm or neon accent
- Optional: emissive windows/signage material

### 1.3 Render settings
- Engine: **Eevee** (fast iteration)
- Output:
  - Format: **PNG**
  - Color: **RGBA**
  - Enable **Transparent background** (Render Properties → Film → Transparent)
- Color management: Filmic / Medium-High Contrast (optional but often helps)

---

## 2) Model a “POC building” fast (5–10 minutes)

Suggested build:
- Start with a cube → scale tall.
- Bevel edges slightly.
- Add a smaller top “cap” volume.
- Add window strips (either inset faces, or just an emissive material on selected faces).
- Add one neon sign plane with emissive material.

Keep polygon count low; this is for **rendering** to 2D anyway.

---

## 3) Render output spec (what to export)

For the first POC, export just one file:
- `building_poc.png` (beauty/color with alpha)

Recommended resolution:
- Start with **512×512** or **1024×1024**.
- If it looks blurry in-game, increase res and/or render with sharper sampling.

Important: leave padding around the sprite so you can adjust anchors without re-rendering.

---

## 4) Make a minimal Phaser atlas (single-frame)

The game currently loads a Phaser atlas in:
- `the-getaway/public/atlases/` (see `BootScene.ts`)

For the POC, create a new atlas key rather than touching existing `props`:

### Files
Put these in:
- `the-getaway/public/atlases/poc_buildings.png`  (your render)
- `the-getaway/public/atlases/poc_buildings.json` (frame metadata)

### Minimal JSON template
Create `poc_buildings.json`:

```json
{
  "frames": {
    "building_poc_a": {
      "frame": { "x": 0, "y": 0, "w": 1024, "h": 1024 },
      "rotated": false,
      "trimmed": false,
      "spriteSourceSize": { "x": 0, "y": 0, "w": 1024, "h": 1024 },
      "sourceSize": { "w": 1024, "h": 1024 },
      "pivot": { "x": 0.5, "y": 0.95 }
    }
  },
  "meta": {
    "app": "POC",
    "version": "1.0",
    "image": "poc_buildings.png",
    "format": "RGBA8888",
    "size": { "w": 1024, "h": 1024 },
    "scale": "1"
  }
}
```

Adjust `w/h` to match your render.

Pivot guidance:
- Start with `y ≈ 0.95` so the **feet/base** of the building sits on the tile.
- You will tune this in-game.

---

## 5) Wire into the game (fastest test)

### 5.1 Load the atlas in `BootScene`
In `the-getaway/src/game/scenes/BootScene.ts` add:

```ts
this.load.atlas('poc_buildings', 'atlases/poc_buildings.png', 'atlases/poc_buildings.json');
```

### 5.2 Spawn the sprite in Level 0
In `MainScene` after `isoFactory` is created (any safe place in `create()`), spawn:

```ts
const sprite = this.isoFactory!.createSpriteProp(12, 12, 'building_poc_a', {
  textureKey: 'poc_buildings',
  origin: { x: 0.5, y: 0.95 },
});
```

Test steps:
- Walk the player around it (in front/behind) and confirm **depth sorting** looks right.
- Toggle night/curfew overlays and confirm the sprite stays readable.

---

## 6) Troubleshooting (90% of problems)

### Sprite “floats” above the ground
- Increase origin Y (e.g. 0.97)

### Sprite sinks into the ground
- Decrease origin Y (e.g. 0.90)

### Depth sorting looks wrong
- Ensure you are creating via `isoFactory.createSpriteProp` (it assigns depth using pixel coords + bias).
- Try a different bias (PROP_LOW vs PROP_TALL) if needed.

### Looks blurry / mushy
- Render at higher resolution.
- Avoid heavy denoise for Eevee.
- Ensure Phaser isn’t scaling the sprite unexpectedly.

### UI overlays become unreadable over the art
- That’s a success signal: you need a consistent palette/contrast rule.
- Solve with either (a) HUD overlay colors, or (b) slightly darker base art + brighter overlay accents.

---

## 7) What “success” looks like

POC is a success if:
- One building sprite renders with the intended noir vibe.
- It anchors correctly on the grid.
- It depth-sorts correctly relative to the player.
- It remains readable in day/night/stealth overlay states.

Once this is true, you can safely buy KitBash3D and scale the pipeline.
