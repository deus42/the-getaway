from __future__ import annotations

import json
import random
import shutil
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter


ROOT = Path(__file__).resolve().parents[4]
APP_ROOT = ROOT / "the-getaway"
ATLAS_ROOT = APP_ROOT / "public" / "atlases"
NORMAL_ROOT = APP_ROOT / "public" / "normals"

SOURCE_IMAGE = ATLAS_ROOT / "level0_environment.png"
SOURCE_JSON = ATLAS_ROOT / "level0_environment.json"
SOURCE_NORMAL = NORMAL_ROOT / "level0_environment_n.png"
OUTPUT_IMAGE = ATLAS_ROOT / "level0_painterly_environment.png"
OUTPUT_JSON = ATLAS_ROOT / "level0_painterly_environment.json"
OUTPUT_NORMAL = NORMAL_ROOT / "level0_painterly_environment_n.png"

INK = (11, 13, 18)
SOFT_INK = (27, 31, 36)
UMBER = (81, 59, 53)
MUTED_TEAL = (91, 119, 117)
BONE = (213, 200, 181)
AMBER = (217, 154, 80)
CYAN = (80, 191, 208)
CRIMSON = (142, 65, 71)

FRAME_ACCENTS = {
    "street_lamp": AMBER,
    "vending_kiosk": AMBER,
    "market_stall": UMBER,
    "barricade_cart": CRIMSON,
    "camera_mast": CYAN,
    "neon_panel": AMBER,
    "bollards_cluster": CRIMSON,
    "dumpster_stack": MUTED_TEAL,
    "door_canopy": AMBER,
    "pickup_keypad": AMBER,
    "pickup_datapad": CYAN,
    "pickup_transit_token": AMBER,
    "pickup_medkit": MUTED_TEAL,
}


def mix(left: tuple[int, int, int], right: tuple[int, int, int], amount: float) -> tuple[int, int, int]:
    t = max(0.0, min(1.0, amount))
    return tuple(round(a + (b - a) * t) for a, b in zip(left, right))


def grade_frame(frame: Image.Image, frame_name: str) -> Image.Image:
    source = frame.convert("RGBA")
    result = Image.new("RGBA", source.size, (0, 0, 0, 0))
    accent = FRAME_ACCENTS.get(frame_name, UMBER)
    rng = random.Random(frame_name)

    source_pixels = source.load()
    result_pixels = result.load()
    for y in range(source.height):
        for x in range(source.width):
            red, green, blue, alpha = source_pixels[x, y]
            if alpha == 0:
                continue
            luminance = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255
            saturation = max(red, green, blue) - min(red, green, blue)
            if luminance < 0.3:
                color = mix(INK, SOFT_INK, luminance / 0.3)
            elif luminance < 0.7:
                color = mix(SOFT_INK, accent, (luminance - 0.3) / 0.4)
            else:
                color = mix(accent, BONE, (luminance - 0.7) / 0.3)

            if saturation < 22:
                color = mix(color, UMBER, 0.18)
            noise = rng.randint(-8, 8) if (x + y) % 3 == 0 else rng.randint(-3, 3)
            result_pixels[x, y] = (
                max(0, min(255, color[0] + noise)),
                max(0, min(255, color[1] + noise)),
                max(0, min(255, color[2] + noise)),
                alpha,
            )

    alpha = source.getchannel("A")
    expanded = alpha.filter(ImageFilter.MaxFilter(5))
    outline_mask = ImageChops.subtract(expanded, alpha)
    outline = Image.new("RGBA", source.size, (*INK, 235))
    outline.putalpha(outline_mask)
    outlined = Image.alpha_composite(outline, result)

    dry_brush = outlined.load()
    for _ in range(36):
        x = rng.randrange(8, max(9, outlined.width - 8))
        y = rng.randrange(8, max(9, outlined.height - 8))
        if dry_brush[x, y][3] < 120:
            continue
        length = rng.randrange(2, 8)
        for offset in range(length):
            px = min(outlined.width - 1, x + offset)
            current = dry_brush[px, y]
            dry_brush[px, y] = (*mix(current[:3], BONE, 0.18), max(0, current[3] - 24))

    return outlined


def main() -> None:
    atlas_data = json.loads(SOURCE_JSON.read_text(encoding="utf-8"))
    source = Image.open(SOURCE_IMAGE).convert("RGBA")
    output = Image.new("RGBA", source.size, (0, 0, 0, 0))

    for frame_name, frame_data in atlas_data["frames"].items():
        bounds = frame_data["frame"]
        box = (
            bounds["x"],
            bounds["y"],
            bounds["x"] + bounds["w"],
            bounds["y"] + bounds["h"],
        )
        graded = grade_frame(source.crop(box), frame_name)
        output.alpha_composite(graded, (bounds["x"], bounds["y"]))

    output.save(OUTPUT_IMAGE, optimize=True)
    if "meta" in atlas_data:
        atlas_data["meta"]["image"] = OUTPUT_IMAGE.name
    OUTPUT_JSON.write_text(json.dumps(atlas_data, indent=2) + "\n", encoding="utf-8")
    shutil.copyfile(SOURCE_NORMAL, OUTPUT_NORMAL)
    print(f"Built painterly semantic atlas at {OUTPUT_IMAGE}")


if __name__ == "__main__":
    main()
