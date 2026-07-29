"""Convert an AI-painted chroma-key sheet into the alpha production source.

The generation tool outputs sheets on a flat magenta key. This script keys the
background out with a soft distance ramp and removes magenta fringe spill from
silhouette edges, producing the `-alpha.png` file consumed by
`build_runtime_assets.py`. Previously this normalization was done ad hoc and was
not reproducible from the repository (GET-181); committing it closes that gap.

Usage:
    python3 chroma_to_alpha.py                      # default sheet paths
    python3 chroma_to_alpha.py in.png out.png       # explicit paths
    python3 chroma_to_alpha.py --near 50 --far 120  # tolerance tuning

The key color is auto-detected as the median of the sheet's border pixels
(robust against compression noise); pass --key R,G,B to override.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from statistics import median

from PIL import Image

SOURCE_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = SOURCE_ROOT / "building-block-composites-chroma.png"
DEFAULT_OUTPUT = SOURCE_ROOT / "building-block-composites-alpha.png"

# Distance-to-key thresholds (Euclidean RGB). Below NEAR → fully transparent;
# above FAR → fully opaque; smooth ramp between. Key noise in generated sheets
# reaches ~40 units; painterly content sits above ~150.
DEFAULT_NEAR = 70.0
DEFAULT_FAR = 170.0

# Painterly-noir deliberately excludes saturated purple/magenta. Generated
# antialiasing can skew toward either red or blue as it darkens, so hue cleanup
# must tolerate more imbalance than a bright-key comparison while avoiding the
# authored crimson and teal ranges.
MAGENTA_MAX_RED_BLUE_IMBALANCE = 0.50
MAGENTA_TRANSPARENT_GREEN_RATIO = 0.35
MAGENTA_OPAQUE_GREEN_RATIO = 0.60


def detect_key_color(image: Image.Image) -> tuple[int, int, int]:
    width, height = image.size
    samples: list[tuple[int, int, int]] = []
    for x in range(0, width, 3):
        samples.append(image.getpixel((x, 0)))
        samples.append(image.getpixel((x, height - 1)))
    for y in range(0, height, 3):
        samples.append(image.getpixel((0, y)))
        samples.append(image.getpixel((width - 1, y)))
    return (
        round(median(s[0] for s in samples)),
        round(median(s[1] for s in samples)),
        round(median(s[2] for s in samples)),
    )


def key_to_alpha(
    image: Image.Image,
    key: tuple[int, int, int],
    near: float,
    far: float,
) -> Image.Image:
    width, height = image.size
    source = image.tobytes()
    out = bytearray(width * height * 4)
    ramp = max(1e-6, far - near)
    key_r, key_g, key_b = key

    for index in range(width * height):
        r = source[index * 3]
        g = source[index * 3 + 1]
        b = source[index * 3 + 2]
        distance = ((r - key_r) ** 2 + (g - key_g) ** 2 + (b - key_b) ** 2) ** 0.5
        alpha = min(1.0, max(0.0, (distance - near) / ramp))

        # AI antialiasing darkens the magenta key at silhouette edges. Those
        # pixels can be far from the bright key in Euclidean RGB while keeping
        # the same unmistakable magenta hue, which otherwise leaves a purple
        # halo in-game. The production palette has no saturated magenta, so
        # attenuate that hue independently of brightness.
        magenta_floor = min(r, b)
        if magenta_floor > 24:
            hue_balance = abs(r - b) / max(1, max(r, b))
            green_ratio = g / magenta_floor
            if (
                hue_balance < MAGENTA_MAX_RED_BLUE_IMBALANCE
                and green_ratio < MAGENTA_OPAQUE_GREEN_RATIO
            ):
                hue_ramp = (
                    MAGENTA_OPAQUE_GREEN_RATIO
                    - MAGENTA_TRANSPARENT_GREEN_RATIO
                )
                hue_alpha = min(
                    1.0,
                    max(
                        0.0,
                        (green_ratio - MAGENTA_TRANSPARENT_GREEN_RATIO)
                        / hue_ramp,
                    ),
                )
                alpha *= hue_alpha

        if alpha > 0.0:
            # Despill: magenta fringe shows as R and B jointly exceeding G.
            # Pull the excess toward G so edges read as neutral paint, scaled
            # by how close the pixel sits to the key.
            spill = min(r, b) - g
            if spill > 0:
                correction = spill * (1.0 - alpha)
                r = round(r - correction)
                b = round(b - correction)

        base = index * 4
        out[base] = max(0, min(255, r))
        out[base + 1] = g
        out[base + 2] = max(0, min(255, b))
        out[base + 3] = round(alpha * 255)

    return Image.frombytes("RGBA", (width, height), bytes(out))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", nargs="?", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("output", nargs="?", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--key", type=str, default=None, help="Override key color as R,G,B")
    parser.add_argument("--near", type=float, default=DEFAULT_NEAR)
    parser.add_argument("--far", type=float, default=DEFAULT_FAR)
    args = parser.parse_args()

    image = Image.open(args.input).convert("RGB")
    key = (
        tuple(int(part) for part in args.key.split(","))
        if args.key
        else detect_key_color(image)
    )
    if len(key) != 3:
        raise ValueError("--key must be R,G,B")

    result = key_to_alpha(image, key, args.near, args.far)
    result.save(args.output, optimize=True)

    opaque = sum(1 for a in result.getchannel("A").tobytes() if a > 0)
    total = image.width * image.height
    print(
        f"Keyed {args.input.name} -> {args.output.name} "
        f"(key rgb{key}, {opaque / total:.1%} opaque)"
    )


if __name__ == "__main__":
    main()
