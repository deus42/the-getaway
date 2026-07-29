from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw


SOURCE_ROOT = Path(__file__).resolve().parent.parent
FOOTPRINTS = json.loads(
    (SOURCE_ROOT / "level0-building-footprints.json").read_text(encoding="utf-8")
)
BUILDING_IDS = (
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

CANVAS_SIZE = 1536
CELL_SIZE = CANVAS_SIZE // 3
PLATE_SPAN = 400
PLATE_LEFT_INSET = 56
SOUTH_Y_INSET = 470
BACKGROUND = "#F204F3"


def main() -> None:
    image = Image.new("RGB", (CANVAS_SIZE, CANVAS_SIZE), BACKGROUND)
    draw = ImageDraw.Draw(image, "RGBA")
    guide_metrics: dict[str, dict[str, object]] = {}

    for index, building_id in enumerate(BUILDING_IDS):
        row = index // 3
        column = index % 3
        cell_x = column * CELL_SIZE
        cell_y = row * CELL_SIZE
        footprint = FOOTPRINTS[building_id]
        width_tiles = footprint["widthTiles"]
        depth_tiles = footprint["depthTiles"]
        total_tiles = width_tiles + depth_tiles
        left_x = cell_x + PLATE_LEFT_INSET
        south_y = cell_y + SOUTH_Y_INSET
        south_x = left_x + PLATE_SPAN * width_tiles / total_tiles
        points = {
            "north": (
                left_x + PLATE_SPAN * depth_tiles / total_tiles,
                south_y - PLATE_SPAN / 2,
            ),
            "east": (
                left_x + PLATE_SPAN,
                south_y - PLATE_SPAN * depth_tiles / (2 * total_tiles),
            ),
            "south": (south_x, south_y),
            "west": (
                left_x,
                south_y - PLATE_SPAN * width_tiles / (2 * total_tiles),
            ),
        }
        polygon = [points[name] for name in ("north", "east", "south", "west")]
        draw.polygon(polygon, fill=(102, 25, 100, 110), outline=(228, 214, 192, 245), width=4)
        for name, color in (
            ("north", (64, 204, 220, 255)),
            ("east", (232, 166, 70, 255)),
            ("south", (255, 255, 255, 255)),
            ("west", (80, 145, 138, 255)),
        ):
            x, y = points[name]
            draw.ellipse((x - 6, y - 6, x + 6, y + 6), fill=color)
        draw.rectangle(
            (cell_x + 6, cell_y + 6, cell_x + CELL_SIZE - 7, cell_y + CELL_SIZE - 7),
            outline=(116, 31, 112, 150),
            width=2,
        )
        guide_metrics[building_id] = {
            "cell": {"column": column, "row": row},
            "sourceFootprint": footprint,
            "normalizedCorners": {
                name: {
                    "x": round((point[0] - cell_x) / CELL_SIZE, 6),
                    "y": round((point[1] - cell_y) / CELL_SIZE, 6),
                }
                for name, point in points.items()
            },
        }

    image.save(SOURCE_ROOT / "building-footprint-guide.png", optimize=True)
    (SOURCE_ROOT / "building-footprint-guide.json").write_text(
        json.dumps(guide_metrics, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
