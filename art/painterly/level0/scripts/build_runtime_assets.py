from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[4]
SOURCE_ROOT = ROOT / "art" / "painterly" / "level0"
APP_ROOT = ROOT / "the-getaway"
TURNAROUND_ROOT = SOURCE_ROOT / "characters" / "turnarounds-alpha"
REFERENCE_ROOT = SOURCE_ROOT / "characters" / "references"
CHARACTER_OUTPUT_ROOT = APP_ROOT / "public" / "characters"
PORTRAIT_OUTPUT_ROOT = APP_ROOT / "public" / "portraits" / "level0"
BUILDING_SOURCE = SOURCE_ROOT / "building-block-composites-alpha.png"
BUILDING_OUTPUT_ROOT = APP_ROOT / "public" / "buildings" / "level0"
BUILDING_METRICS_PATH = SOURCE_ROOT / "building-export-metrics.json"
BUILDING_FOOTPRINTS_PATH = SOURCE_ROOT / "level0-building-footprints.json"
RUNTIME_METRICS_PATH = APP_ROOT / "src" / "content" / "environment" / "level0BuildingArtMetrics.json"
SURROUND_SOURCE = SOURCE_ROOT / "building-surround-composites-alpha.png"
SURROUND_OUTPUT_ROOT = BUILDING_OUTPUT_ROOT / "surround"
SURROUND_METRICS_PATH = SOURCE_ROOT / "surround-export-metrics.json"
RUNTIME_SURROUND_METRICS_PATH = (
    APP_ROOT / "src" / "content" / "environment" / "level0SurroundArtMetrics.json"
)

# Alpha values above this count as opaque content — shared by blob keeping and
# base-plate registration so both operate on the same silhouette.
ALPHA_THRESHOLD = 36

# Fraction of the content height (measured up from the south tip) scanned for
# the base-plate corner row. The plate of a 2:1 iso block always sits in this
# band; scanning higher would catch roof masses on tall towers.
BASE_PLATE_SCAN_BAND = 0.40

# The generated civic-center cell contains a dark cyan/purple ground wash at
# the lower podium. Preserve its architecture and alpha geometry, but fold that
# non-semantic color cast into the neutral pavement value used by the runtime
# footprint plate. The validator independently gates future colored washes.
GROUND_CONTACT_NEUTRALIZE = {"block_2_2"}
GROUND_CAST_MAX_CHANNEL = 120
GROUND_CAST_MIN_CHANNEL = 16

ACTORS = (
    "hero_operative",
    "hero_survivor",
    "hero_tech",
    "hero_scavenger",
    "npc_lira_vendor",
    "npc_archivist_naila",
    "npc_courier_brant",
    "npc_firebrand_juno",
    "npc_seraph_warden",
    "npc_drone_handler_kesh",
    "npc_medic_yara",
    "npc_captain_reyna",
    "npc_orn_patrol_sentry",
    "enemy_corpsec_sweep_captain",
)

DIRECTIONS = (
    "north",
    "north-east",
    "east",
    "south-east",
    "south",
    "south-west",
    "west",
    "north-west",
)

# Source order is south, south-west, west, north-west, north, north-east,
# east, south-east. Mirroring the authored west-facing views keeps paired
# directions consistent and avoids edge-crop drift in generated contact sheets.
SOURCE_DIRECTION = {
    "south": (0, False),
    "south-west": (1, False),
    "west": (2, False),
    "north-west": (3, False),
    "north": (4, False),
    "north-east": (3, True),
    "east": (2, True),
    "south-east": (1, True),
}

STATES = ("idle", "move", "attack", "interact")
FRAME_WIDTH = 64
FRAME_HEIGHT = 96
FRAME_COUNT = 4
FOOT_ANCHOR_Y = round(FRAME_HEIGHT * 0.92)
MAX_ACTOR_WIDTH = 52
MAX_ACTOR_HEIGHT = 80

PORTRAITS = {
    "npc_lira_vendor": "lira_smuggler.png",
    "npc_archivist_naila": "archivist_naila.png",
    "npc_courier_brant": "courier_brant.png",
    "npc_firebrand_juno": "firebrand_juno.png",
    "npc_seraph_warden": "seraph_warden.png",
    "npc_drone_handler_kesh": "drone_handler_kesh.png",
    "npc_medic_yara": "medic_yara.png",
    "npc_captain_reyna": "captain_reyna.png",
}

BUILDINGS = (
    "block_1_1",
    "block_1_2",
    "block_1_3",
    "block_2_1",
    "block_2_2",
    "block_2_3",
    "block_3_1",
    "block_3_2",
    "block_3_3",
)

SURROUND_VARIANTS = tuple(f"surround_{index}" for index in range(9))


def crop_direction(sheet: Image.Image, column: int, mirror: bool) -> Image.Image:
    cell_width = sheet.width / 8
    left = round(column * cell_width)
    right = round((column + 1) * cell_width)
    cell = sheet.crop((left, 0, right, sheet.height))
    alpha_bbox = cell.getchannel("A").getbbox()
    if alpha_bbox is None:
        raise ValueError(f"Empty turnaround cell {column}")
    actor = cell.crop(alpha_bbox)
    if mirror:
        actor = actor.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    actor.thumbnail((MAX_ACTOR_WIDTH, MAX_ACTOR_HEIGHT), Image.Resampling.LANCZOS)
    return ImageEnhance.Contrast(actor).enhance(1.06)


def transform_actor(
    actor: Image.Image,
    state: str,
    frame_index: int,
    horizontal_facing: int,
) -> tuple[Image.Image, int]:
    if state == "idle":
        scales = (1.0, 0.99, 1.0, 1.01)
        angles = (0.0, -0.35, 0.0, 0.35)
        offsets = (0, 0, 0, 0)
    elif state == "move":
        scales = (1.0, 0.98, 1.0, 0.98)
        angles = (-1.2, 0.8, 1.2, -0.8)
        offsets = (-1, 0, 1, 0)
    elif state == "attack":
        scales = (1.0, 1.03, 1.07, 1.02)
        angles = (0.0, -2.0 * horizontal_facing, -3.0 * horizontal_facing, -1.0 * horizontal_facing)
        offsets = (0, horizontal_facing, horizontal_facing * 3, horizontal_facing)
    else:
        scales = (1.0, 1.01, 1.01, 1.0)
        angles = (0.0, 0.6 * horizontal_facing, -0.6 * horizontal_facing, 0.0)
        offsets = (0, horizontal_facing, horizontal_facing, 0)

    scale = scales[frame_index]
    resized = actor.resize(
        (max(1, round(actor.width * scale)), max(1, round(actor.height * scale))),
        Image.Resampling.LANCZOS,
    )
    rotated = resized.rotate(
        angles[frame_index],
        resample=Image.Resampling.BICUBIC,
        expand=True,
    )
    return rotated, offsets[frame_index]


def draw_interaction_mark(frame: Image.Image, actor_box: tuple[int, int, int, int], frame_index: int) -> None:
    if frame_index not in (1, 2):
        return
    left, top, right, _ = actor_box
    draw = ImageDraw.Draw(frame, "RGBA")
    x = min(FRAME_WIDTH - 7, right + 1)
    y = top + max(10, (right - left) // 3)
    ink = (11, 13, 18, 230)
    cyan = (80, 191, 208, 205 if frame_index == 1 else 150)
    draw.rounded_rectangle((x, y, x + 5, y + 7), radius=1, fill=ink, outline=(213, 200, 181, 210))
    draw.rectangle((x + 1, y + 2, x + 4, y + 4), fill=cyan)


def build_character_sheets(actor_id: str) -> None:
    source_path = TURNAROUND_ROOT / f"{actor_id}.png"
    sheet = Image.open(source_path).convert("RGBA")
    output_dir = CHARACTER_OUTPUT_ROOT / actor_id
    output_dir.mkdir(parents=True, exist_ok=True)

    metrics = {
        "frameWidth": FRAME_WIDTH,
        "frameHeight": FRAME_HEIGHT,
        "origin": {"x": 0.5, "y": 0.92},
        "footAnchorTolerancePx": 2,
        "states": {},
    }

    for state in STATES:
        metrics["states"][state] = {}
        for direction in DIRECTIONS:
            source_column, mirror = SOURCE_DIRECTION[direction]
            actor = crop_direction(sheet, source_column, mirror)
            horizontal_facing = 1 if "east" in direction else -1 if "west" in direction else 0
            output_sheet = Image.new("RGBA", (FRAME_WIDTH * FRAME_COUNT, FRAME_HEIGHT), (0, 0, 0, 0))

            for frame_index in range(FRAME_COUNT):
                frame = Image.new("RGBA", (FRAME_WIDTH, FRAME_HEIGHT), (0, 0, 0, 0))
                transformed, x_offset = transform_actor(actor, state, frame_index, horizontal_facing)
                paste_x = round((FRAME_WIDTH - transformed.width) / 2) + x_offset
                paste_y = FOOT_ANCHOR_Y - transformed.height
                frame.alpha_composite(transformed, (paste_x, paste_y))
                if state == "interact":
                    draw_interaction_mark(
                        frame,
                        (paste_x, paste_y, paste_x + transformed.width, paste_y + transformed.height),
                        frame_index,
                    )
                output_sheet.alpha_composite(frame, (frame_index * FRAME_WIDTH, 0))

            output_sheet.save(output_dir / f"{state}-{direction}.png", optimize=True)
            metrics["states"][state][direction] = {
                "frameFootAnchorsPx": [FOOT_ANCHOR_Y] * FRAME_COUNT,
            }

    (output_dir / "sheet-metrics.json").write_text(
        json.dumps(metrics, indent=2) + "\n",
        encoding="utf-8",
    )


def build_portrait(actor_id: str, filename: str) -> None:
    source = Image.open(REFERENCE_ROOT / f"{actor_id}.png").convert("RGB")
    crop = source.crop((18, 12, source.width - 18, min(source.height, 292)))
    target_ratio = 1.0
    if crop.width / crop.height < target_ratio:
        target_height = round(crop.width / target_ratio)
        top = max(0, round((crop.height - target_height) * 0.08))
        crop = crop.crop((0, top, crop.width, top + target_height))
    else:
        target_width = round(crop.height * target_ratio)
        left = max(0, round((crop.width - target_width) / 2))
        crop = crop.crop((left, 0, left + target_width, crop.height))

    portrait = crop.resize((256, 256), Image.Resampling.LANCZOS)
    portrait = ImageEnhance.Contrast(portrait).enhance(1.08)
    portrait = ImageEnhance.Color(portrait).enhance(0.82)

    vignette = Image.new("L", portrait.size, 0)
    vignette_draw = ImageDraw.Draw(vignette)
    vignette_draw.ellipse((-52, -42, 308, 330), fill=225)
    vignette = vignette.filter(ImageFilter.GaussianBlur(28))
    ink = Image.new("RGB", portrait.size, (11, 13, 18))
    portrait = Image.composite(portrait, ink, vignette)

    draw = ImageDraw.Draw(portrait, "RGBA")
    draw.line((0, 2, 256, 2), fill=(213, 200, 181, 210), width=3)
    draw.line((2, 0, 2, 256), fill=(213, 200, 181, 150), width=2)
    draw.line((255, 0, 255, 256), fill=(11, 13, 18, 255), width=5)
    draw.line((0, 254, 256, 254), fill=(11, 13, 18, 255), width=5)

    PORTRAIT_OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    portrait.save(PORTRAIT_OUTPUT_ROOT / filename, optimize=True)


def measure_base_plate(image: Image.Image) -> dict[str, float | int]:
    """Register the painted iso base plate of a padded building composite.

    Returns pixel-space registration used by the runtime manifest to anchor and
    scale the sprite: the south tip of the silhouette, a stable wide row in the
    bottom scan band, and the visible span at that row. Aspect is retained as a
    diagnostic only; Level 0 parcels are non-square projected parallelograms.
    """
    alpha = image.getchannel("A")
    width, height = image.size
    data = alpha.tobytes()

    row_extents: list[tuple[int, int] | None] = []
    for y in range(height):
        row = data[y * width:(y + 1) * width]
        left = None
        right = None
        for x, value in enumerate(row):
            if value > ALPHA_THRESHOLD:
                if left is None:
                    left = x
                right = x
        row_extents.append((left, right) if left is not None else None)

    opaque_rows = [y for y, extent in enumerate(row_extents) if extent is not None]
    if not opaque_rows:
        raise ValueError("Cannot measure base plate of a fully transparent image")

    top_y = opaque_rows[0]
    tip_y = opaque_rows[-1]
    tip_left, tip_right = row_extents[tip_y]
    tip_x = (tip_left + tip_right) / 2

    content_height = tip_y - top_y + 1
    band_start = max(top_y, tip_y - int(content_height * BASE_PLATE_SCAN_BAND))
    spans = {
        y: row_extents[y][1] - row_extents[y][0]
        for y in range(band_start, tip_y + 1)
        if row_extents[y] is not None
    }
    max_span = max(spans.values())
    # The corner row is where the plate diamond first reaches (near) full width
    # scanning top-down — compound blocks plateau at max span across the plate
    # belt, so take the topmost row within 2% of the maximum.
    corner_y = min(y for y, span in spans.items() if span >= max_span * 0.98)

    left_x, right_x = row_extents[corner_y]
    width_px = right_x - left_x
    aspect = width_px / max(1, tip_y - corner_y)

    return {
        "tipX": round(tip_x, 2),
        "tipY": tip_y,
        "cornerY": corner_y,
        "leftX": left_x,
        "rightX": right_x,
        "widthPx": width_px,
        "aspect": round(aspect, 3),
    }


def centered_runtime_footprint(
    width_tiles: int,
    depth_tiles: int,
    tile_width: float = 64.0,
) -> tuple[tuple[float, float], ...]:
    half_width = tile_width / 2
    half_height = tile_width / 4
    points = (
        (0.0, -half_height),
        (width_tiles * half_width, (width_tiles - 1) * half_height),
        (
            (width_tiles - depth_tiles) * half_width,
            (width_tiles + depth_tiles - 1) * half_height,
        ),
        (-depth_tiles * half_width, (depth_tiles - 1) * half_height),
    )
    center_x = sum(point[0] for point in points) / len(points)
    center_y = sum(point[1] for point in points) / len(points)
    return tuple((x - center_x, y - center_y) for x, y in points)


def point_inside_convex_footprint(
    point: tuple[float, float],
    footprint: tuple[tuple[float, float], ...],
) -> bool:
    orientation = 0
    for index, start in enumerate(footprint):
        end = footprint[(index + 1) % len(footprint)]
        cross = (
            (end[0] - start[0]) * (point[1] - start[1])
            - (end[1] - start[1]) * (point[0] - start[0])
        )
        if abs(cross) <= 1e-12:
            continue
        edge_orientation = 1 if cross > 0 else -1
        if orientation == 0:
            orientation = edge_orientation
        elif edge_orientation != orientation:
            return False
    return True


def derive_contained_footprint_fill(
    image: Image.Image,
    registration: dict[str, object],
    width_tiles: int,
    depth_tiles: int,
) -> float:
    """Return a 0.01-quantized fill whose visible front base stays in parcel."""
    footprint = centered_runtime_footprint(width_tiles, depth_tiles)
    base_center_x = (float(registration["leftX"]) + float(registration["rightX"])) / 2
    base_center_y = int(registration["cornerY"])
    alpha = image.getchannel("A")
    alpha_data = alpha.tobytes()
    source_points = [
        (x + 0.5 - base_center_x, y + 0.5 - base_center_y)
        for y in range(base_center_y, image.height)
        for x in range(image.width)
        if alpha_data[y * image.width + x] > ALPHA_THRESHOLD
    ]
    if not source_points:
        raise ValueError("Cannot derive contained fill without a visible base")

    containing_span = min(width_tiles, depth_tiles) * 64.0

    def fits(fill: float) -> bool:
        scale = containing_span * fill / max(1, image.width)
        return all(
            point_inside_convex_footprint((x * scale, y * scale), footprint)
            for x, y in source_points
        )

    low = 0.0
    high = 1.0
    for _ in range(60):
        middle = (low + high) / 2
        if fits(middle):
            low = middle
        else:
            high = middle

    contained_fill = math.floor((low + 1e-9) * 100) / 100
    if not fits(contained_fill):
        contained_fill = max(0.0, contained_fill - 0.01)
    return round(contained_fill, 2)


def keep_largest_alpha_component(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    width, height = image.size
    occupied = bytearray(1 if value > ALPHA_THRESHOLD else 0 for value in alpha.tobytes())
    visited = bytearray(width * height)
    largest: list[int] = []

    for start in range(width * height):
        if not occupied[start] or visited[start]:
            continue
        stack = [start]
        visited[start] = 1
        component: list[int] = []
        while stack:
            index = stack.pop()
            component.append(index)
            x = index % width
            y = index // width
            for ny in range(max(0, y - 1), min(height, y + 2)):
                for nx in range(max(0, x - 1), min(width, x + 2)):
                    neighbor = ny * width + nx
                    if occupied[neighbor] and not visited[neighbor]:
                        visited[neighbor] = 1
                        stack.append(neighbor)
        if len(component) > len(largest):
            largest = component

    if not largest:
        return image

    mask = Image.new("L", image.size, 0)
    mask_pixels = mask.load()
    alpha_pixels = alpha.load()
    for index in largest:
        x = index % width
        y = index // width
        mask_pixels[x, y] = alpha_pixels[x, y]
    cleaned = Image.new("RGBA", image.size, (0, 0, 0, 0))
    cleaned.paste(image, (0, 0), mask)
    return cleaned


def neutralize_ground_contact_color(
    image: Image.Image,
    building_id: str,
    corner_y: int,
) -> Image.Image:
    if building_id not in GROUND_CONTACT_NEUTRALIZE:
        return image

    normalized = image.copy()
    pixels = normalized.load()
    for y in range(corner_y, normalized.height):
        for x in range(normalized.width):
            red, green, blue, alpha = pixels[x, y]
            if alpha <= ALPHA_THRESHOLD or max(red, green, blue) >= GROUND_CAST_MAX_CHANNEL:
                continue
            purple_cast = (
                blue > green * 1.25
                and red > green * 1.12
                and min(red, blue) > GROUND_CAST_MIN_CHANNEL
            )
            cyan_cast = (
                green > red * 1.22
                and blue > red * 1.22
                and min(green, blue) > GROUND_CAST_MIN_CHANNEL
            )
            if not purple_cast and not cyan_cast:
                continue

            luminance = round(red * 0.2126 + green * 0.7152 + blue * 0.0722)
            pixels[x, y] = (
                luminance,
                round(luminance * 0.94),
                round(luminance * 0.86),
                alpha,
            )
    return normalized


def build_buildings() -> None:
    source = Image.open(BUILDING_SOURCE).convert("RGBA")
    footprint_contract = json.loads(BUILDING_FOOTPRINTS_PATH.read_text(encoding="utf-8"))
    BUILDING_OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    metrics: dict[str, dict[str, object]] = {}

    for index, building_id in enumerate(BUILDINGS):
        column = index % 3
        row = index // 3
        left = round(column * source.width / 3)
        right = round((column + 1) * source.width / 3)
        top = round(row * source.height / 3)
        bottom = round((row + 1) * source.height / 3)
        cell = keep_largest_alpha_component(source.crop((left, top, right, bottom)))
        alpha_bbox = cell.getchannel("A").getbbox()
        if alpha_bbox is None:
            raise ValueError(f"Empty building source cell for {building_id}")

        building = cell.crop(alpha_bbox)
        footprint = footprint_contract.get(building_id)
        if not footprint:
            raise ValueError(f"Missing runtime footprint contract for {building_id}")
        padding = 6
        output = Image.new(
            "RGBA",
            (building.width + padding * 2, building.height + padding * 2),
            (0, 0, 0, 0),
        )
        output.alpha_composite(building, (padding, padding))
        registration = measure_base_plate(output)
        output = neutralize_ground_contact_color(
            output,
            building_id,
            int(registration["cornerY"]),
        )
        registration["sourceFootprint"] = {
            "widthTiles": int(footprint["widthTiles"]),
            "depthTiles": int(footprint["depthTiles"]),
        }
        registration["containedFootprintFill"] = derive_contained_footprint_fill(
            output,
            registration,
            int(footprint["widthTiles"]),
            int(footprint["depthTiles"]),
        )
        output.save(BUILDING_OUTPUT_ROOT / f"{building_id}.png", optimize=True)
        metrics[building_id] = {
            "width": output.width,
            "height": output.height,
            "sourceFootprintWidthPx": output.width,
            "basePlate": registration,
        }

    serialized = json.dumps(metrics, indent=2) + "\n"
    BUILDING_METRICS_PATH.write_text(serialized, encoding="utf-8")
    # Byte-identical runtime copy so the manifest reads measured registration
    # instead of hand-copied numbers; the art validator asserts the two match.
    RUNTIME_METRICS_PATH.write_text(serialized, encoding="utf-8")


def build_surround_buildings() -> None:
    """Slice the generated anonymous 3×3 filler sheet into runtime sprites."""
    source = Image.open(SURROUND_SOURCE).convert("RGBA")
    SURROUND_OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    metrics: dict[str, dict[str, object]] = {}

    for index, variant_id in enumerate(SURROUND_VARIANTS):
        column = index % 3
        row = index // 3
        left = round(column * source.width / 3)
        right = round((column + 1) * source.width / 3)
        top = round(row * source.height / 3)
        bottom = round((row + 1) * source.height / 3)
        cell = keep_largest_alpha_component(source.crop((left, top, right, bottom)))
        alpha_bbox = cell.getchannel("A").getbbox()
        if alpha_bbox is None:
            raise ValueError(f"Empty surround source cell for {variant_id}")

        building = cell.crop(alpha_bbox)
        padding = 4
        output = Image.new(
            "RGBA",
            (building.width + padding * 2, building.height + padding * 2),
            (0, 0, 0, 0),
        )
        output.alpha_composite(building, (padding, padding))
        output.save(SURROUND_OUTPUT_ROOT / f"{index}.png", optimize=True)
        metrics[variant_id] = {
            "width": output.width,
            "height": output.height,
            "basePlate": measure_base_plate(output),
        }

    serialized = json.dumps(metrics, indent=2) + "\n"
    SURROUND_METRICS_PATH.write_text(serialized, encoding="utf-8")
    RUNTIME_SURROUND_METRICS_PATH.write_text(serialized, encoding="utf-8")


def main(surround_only: bool = False, buildings_only: bool = False) -> None:
    if surround_only:
        if not SURROUND_SOURCE.exists():
            raise FileNotFoundError(f"Missing alpha surround source: {SURROUND_SOURCE}")
        build_surround_buildings()
        print(f"Built {len(SURROUND_VARIANTS)} anonymous surround buildings")
        return
    if buildings_only:
        if not BUILDING_SOURCE.exists():
            raise FileNotFoundError(f"Missing alpha building source: {BUILDING_SOURCE}")
        if not BUILDING_FOOTPRINTS_PATH.exists():
            raise FileNotFoundError(
                f"Missing exported footprint contract: {BUILDING_FOOTPRINTS_PATH}"
            )
        build_buildings()
        print(f"Built {len(BUILDINGS)} registered painterly landmarks")
        return

    if not SURROUND_SOURCE.exists():
        raise FileNotFoundError(f"Missing alpha surround source: {SURROUND_SOURCE}")

    missing = [actor_id for actor_id in ACTORS if not (TURNAROUND_ROOT / f"{actor_id}.png").exists()]
    if missing:
        raise FileNotFoundError(f"Missing alpha turnarounds: {', '.join(missing)}")

    for actor_id in ACTORS:
        build_character_sheets(actor_id)
    for actor_id, filename in PORTRAITS.items():
        build_portrait(actor_id, filename)
    if not BUILDING_SOURCE.exists():
        raise FileNotFoundError(f"Missing alpha building source: {BUILDING_SOURCE}")
    build_buildings()
    build_surround_buildings()

    print(
        f"Built {len(ACTORS)} painterly sprite sets, "
        f"{len(PORTRAITS)} portraits, {len(BUILDINGS)} landmarks, "
        f"and {len(SURROUND_VARIANTS)} surround buildings"
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--surround-only",
        action="store_true",
        help="slice only the anonymous city-surround sheet",
    )
    parser.add_argument(
        "--buildings-only",
        action="store_true",
        help="normalize and export only the nine Level 0 landmark buildings",
    )
    args = parser.parse_args()
    main(surround_only=args.surround_only, buildings_only=args.buildings_only)
