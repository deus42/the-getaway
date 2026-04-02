# Building Positioning Runbook

This runbook defines how to position landmark and parcel buildings so visual fit problems are resolved systematically instead of by repeated guesswork.

Cross-reference:
- Operator workflow: `AGENTS.md`
- System rules and fit modes: `memory-bank/04 Engineering/Architecture.md`

## Purpose

Use this runbook whenever a building sprite, landmark mass, red debug outline, or door marker does not line up with the intended block footprint.

The goals are:
- preserve one source of truth per pass
- measure mismatch explicitly
- avoid retuning already-correct edges
- escalate quickly when the current geometry model cannot represent the art accurately

## Source of Truth Hierarchy

Apply this order when diagnosing fit issues:

1. **Collision footprint**
   - The gameplay obstacle zone. If this is wrong, fix it first.
2. **Debug outline**
   - The visualization of the gameplay obstacle zone. It must match the collision footprint exactly unless the active fit mode explicitly uses a custom visual debug polygon.
3. **Render anchor / origin**
   - The sprite or mass placement reference. Fix this only after the gameplay footprint is trustworthy.
4. **Door anchor**
   - The gameplay interaction point and the visual entrance marker. It must be evaluated after footprint and render placement are stable.
5. **Readability fade / depth**
   - Visual-only adjustments. These must never be used to hide a placement error.

## Supported Fit Modes

### 1. Rectangular / Parallelogram Footprint

Use this by default when the visible building base is close enough to a single tile-aligned footprint.

Choose this mode when:
- the art base is roughly one coherent isometric block
- remaining mismatch can be expressed by moving one edge at a time
- a measured pass lands within the acceptance rubric below

### 2. Rectangular Collision + Custom Visual Debug Polygon

Use this when gameplay should remain a simple rectangle/parallelogram, but the building art base is visually irregular enough that the debug outline would otherwise mislead reviewers.

Choose this mode when:
- collision should stay simple for navigation
- visual review requires an outline that follows the art more closely
- the mismatch is mainly communicative rather than gameplay-critical

### 3. Multi-Region / Custom Polygon Footprint

Use this when the art base cannot be represented accurately enough by one integer-tile rectangle/parallelogram.

Choose this mode when:
- mismatch remains above tolerance after one measured rectangular pass
- the base has stepped corners, cut-ins, or multiple podium masses
- repeated trim passes keep fixing one side while reopening another

## Procedure

1. **Place the building in the target block**
   - Confirm the intended parcel or landmark slot before changing any fit values.
2. **Freeze render angle and origin**
   - Do not rotate or re-anchor the art during footprint diagnosis unless render placement is the specific variable being tested.
3. **Draw the red outline from the active footprint**
   - Use the gameplay footprint as the default overlay.
4. **Capture a baseline screenshot**
   - Save the screenshot path.
   - Record current constants in `progress/<Linear-key>.md`.
   - Write down each mismatching edge in plain language.
5. **Label the mismatching edges**
   - Example: “far sloped edge over by ~1 tile”, “left edge under by ~0.5 tile”.
6. **Adjust exactly one edge or one render variable**
   - Allowed single-variable passes:
     - one footprint edge
     - one render scale/origin/offset change
     - one door-anchor change
     - one readability/depth change
7. **Capture the new screenshot**
   - Compare against the saved baseline, not memory.
   - Verify that only the intended edge or variable moved.
8. **Accept or escalate**
   - If the result meets the rubric, accept it.
   - If it does not, either do one surgical follow-up or change fit mode.

## Measurement Rubric

- `<= 0.5 tile` mismatch on the visible base edge:
  - acceptable for rectangle/parallelogram mode
- `> 0.5 tile` and `<= 1.0 tile` mismatch:
  - one final surgical pass allowed
- `> 1.0 tile` mismatch after one measured rectangular pass:
  - stop trim-chasing
  - escalate to custom visual debug polygon or multi-region/custom polygon footprint

## Troubleshooting Matrix

### Wrong side moved

- Revert to the saved baseline.
- Check whether the changed constant controls `from.x`, `from.y`, `to.x`, or `to.y`.
- Do not stack another correction on top of the mistaken pass.

### Player renders under the building

- Treat this as a depth/readability problem, not a footprint problem.
- Keep footprint constants frozen and adjust only render depth/readability.

### Door marker drifts from the art door

- Freeze footprint and sprite scale first.
- Change only the door anchor.
- Re-evaluate after the building base is stable.

### Outline matches collision but not art

- This is a fit-mode question.
- If mismatch is small, do one measured footprint or render pass.
- If mismatch remains large, escalate to a custom visual debug polygon or custom footprint.

### Opacity / readability appears stuck on

- Treat this as a visual system bug.
- Do not change footprint values to “make it look better”.
- Inspect depth/readability logic separately.

## ESB Case Study: Anti-Patterns to Avoid

GET-172 established the following anti-patterns:

- Do not chase building art with repeated trim guessing.
- Do not retune already-correct edges just because another edge is still wrong.
- Do not fit a landmark from transparent atlas frame bounds.
- Do not combine sprite scale changes and footprint changes in one pass unless the requester explicitly asks for that tradeoff.
- Do not keep forcing a single rectangle/parallelogram if the art is clearly more complex than that model allows.

Near-correct ESB baseline from the final tuning loop:
- `trimLeft = 1`
- `trimFar = 10`
- `trimRight = 8`
- `scale = 0.92`

The main lesson:
- save the near-correct baseline
- move one edge at a time
- if the mismatch stays above tolerance, change fit mode instead of tuning forever
