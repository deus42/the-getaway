from __future__ import annotations

import json
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


def keep_largest_alpha_component(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    width, height = image.size
    occupied = bytearray(1 if value > 36 else 0 for value in alpha.tobytes())
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


def build_buildings() -> None:
    source = Image.open(BUILDING_SOURCE).convert("RGBA")
    BUILDING_OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    metrics: dict[str, dict[str, int]] = {}

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
        padding = 6
        output = Image.new(
            "RGBA",
            (building.width + padding * 2, building.height + padding * 2),
            (0, 0, 0, 0),
        )
        output.alpha_composite(building, (padding, padding))
        output.save(BUILDING_OUTPUT_ROOT / f"{building_id}.png", optimize=True)
        metrics[building_id] = {
            "width": output.width,
            "height": output.height,
            "sourceFootprintWidthPx": output.width,
        }

    (SOURCE_ROOT / "building-export-metrics.json").write_text(
        json.dumps(metrics, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> None:
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

    print(
        f"Built {len(ACTORS)} painterly sprite sets, "
        f"{len(PORTRAITS)} portraits, and {len(BUILDINGS)} buildings"
    )


if __name__ == "__main__":
    main()
