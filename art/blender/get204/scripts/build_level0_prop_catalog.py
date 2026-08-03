#!/usr/bin/env python3
"""Render an ignored, gameplay-scoped Neo Tokyo prop catalog for GET-204."""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Sequence

import bpy
from mathutils import Vector


SCRIPT_DIRECTORY = Path(__file__).resolve().parent
if str(SCRIPT_DIRECTORY) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIRECTORY))

from build_level0_source_catalog import (  # noqa: E402
    EXPECTED_BLENDER_VERSION,
    bounds_for,
    camera_frame_scale,
    create_catalog_stage,
    import_fbx,
    point_camera,
    reset_scene,
    set_visible,
    stage_source,
    validate_environment,
    world_corners,
)


PROP_PREFIXES = (
    "Awning_A",
    "Awning_B",
    "Barriers",
    "Bollard",
    "Door_A",
    "Door_B",
    "Door_C",
    "Door_D",
    "ElectricBox_A",
    "ElectricBox_B",
    "ElectricBox_C",
    "Intercom",
    "Lamp_A",
    "Lamp_B",
    "PowerGenerator_A",
    "PowerGenerator_B",
    "RubbishBin",
    "RumbleStrip",
    "UndergroundEntrance",
    "Vending_A",
    "Vending_B",
    "Vending_C",
    "Vending_D",
)


@dataclass(frozen=True)
class PropCatalogEntry:
    prefix: str
    source_object_count: int
    vertex_count: int
    triangle_count: int
    bounds: dict[str, list[float]]
    render: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render the GET-204 gameplay prop catalog.")
    default_repo_root = Path(__file__).resolve().parents[4]
    parser.add_argument("--repo-root", type=Path, default=default_repo_root)
    parser.add_argument(
        "--source-root",
        type=Path,
        default=os.environ.get("GETAWAY_NEO_TOKYO_ROOT"),
        required=os.environ.get("GETAWAY_NEO_TOKYO_ROOT") is None,
    )
    parser.add_argument("--render-size", type=int, default=512)
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(argv)


def group_props(objects: Sequence[bpy.types.Object]) -> dict[str, list[bpy.types.Object]]:
    groups = {
        prefix: [obj for obj in objects if obj.name == prefix or obj.name.startswith(f"{prefix}_")]
        for prefix in PROP_PREFIXES
    }
    missing = [prefix for prefix, members in groups.items() if not members]
    if missing:
        raise RuntimeError(f"Imported FBX is missing gameplay prop roots: {', '.join(missing)}")
    return groups


def render_props(
    scene: bpy.types.Scene,
    imported: Sequence[bpy.types.Object],
    groups: dict[str, list[bpy.types.Object]],
    generated_root: Path,
    render_size: int,
) -> list[PropCatalogEntry]:
    scene.render.resolution_x = render_size
    scene.render.resolution_y = render_size
    render_root = generated_root / "prop-catalog"
    render_root.mkdir(parents=True, exist_ok=True)
    ground, actor, head = create_catalog_stage(scene)
    camera = scene.camera
    if camera is None:
        raise RuntimeError("Prop catalog camera was not created")
    entries: list[PropCatalogEntry] = []
    for prefix in PROP_PREFIXES:
        members = groups[prefix]
        bounds = bounds_for(members)
        minimum = Vector(bounds.minimum)
        maximum = Vector(bounds.maximum)
        center = Vector(bounds.center)
        ground_z = minimum.z
        footprint_span = max(bounds.dimensions[0], bounds.dimensions[1])
        ground.location = (center.x, center.y, ground_z - 0.025)
        ground.scale = (max(2.5, bounds.dimensions[0] * 0.8), max(2.5, bounds.dimensions[1] * 0.8), 1)
        actor.location = (
            maximum.x + max(0.8, footprint_span * 0.15),
            minimum.y - max(0.8, footprint_span * 0.15),
            ground_z + 0.675,
        )
        head.location = (actor.location.x, actor.location.y, ground_z + 1.57)
        visible = set(members) | {ground, actor, head}
        set_visible([*imported, ground, actor, head], visible)
        point_camera(camera, Vector((center.x, center.y, ground_z + max(0.8, bounds.dimensions[2] * 0.4))))
        camera.data.ortho_scale = camera_frame_scale(
            camera,
            world_corners(members) + world_corners([actor, head]),
            margin=1.22,
        )
        render_path = render_root / f"{prefix}.png"
        scene.render.filepath = str(render_path)
        bpy.ops.render.render(write_still=True)
        vertex_count = sum(len(obj.data.vertices) for obj in members if isinstance(obj.data, bpy.types.Mesh))
        triangle_count = 0
        for obj in members:
            if isinstance(obj.data, bpy.types.Mesh):
                obj.data.calc_loop_triangles()
                triangle_count += len(obj.data.loop_triangles)
        entries.append(
            PropCatalogEntry(
                prefix=prefix,
                source_object_count=len(members),
                vertex_count=vertex_count,
                triangle_count=triangle_count,
                bounds={
                    "minimum": list(bounds.minimum),
                    "maximum": list(bounds.maximum),
                    "dimensions": list(bounds.dimensions),
                    "center": list(bounds.center),
                },
                render=str(render_path.relative_to(generated_root)),
            )
        )
        print(f"GET-204 prop catalog rendered {prefix}: {bounds.dimensions}")
    return entries


def write_inventory(generated_root: Path, source_root: Path, entries: Sequence[PropCatalogEntry]) -> None:
    payload: dict[str, Any] = {
        "schemaVersion": 1,
        "ticket": "GET-204",
        "purpose": "Ignored gameplay-prop selection evidence; not a publish manifest.",
        "sourceRoot": str(source_root),
        "blender": {"version": bpy.app.version_string, "buildHash": bpy.app.build_hash.decode("utf-8")},
        "actorScaleProofMeters": 1.8,
        "entries": [asdict(entry) for entry in entries],
    }
    (generated_root / "prop-catalog-inventory.json").write_text(
        json.dumps(payload, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    args = parse_args()
    if tuple(bpy.app.version) != EXPECTED_BLENDER_VERSION:
        raise RuntimeError(f"GET-204 requires Blender 5.0.1; found {bpy.app.version_string}")
    repo_root, source_root, archive = validate_environment(args)
    fbx_path = stage_source(repo_root, source_root, archive)
    scene = reset_scene()
    imported = import_fbx(fbx_path)
    groups = group_props(imported)
    generated_root = repo_root / "art/blender/get204/.generated"
    generated_root.mkdir(parents=True, exist_ok=True)
    entries = render_props(scene, imported, groups, generated_root, args.render_size)
    write_inventory(generated_root, source_root, entries)
    print(f"GET-204 prop catalog complete: {len(entries)} gameplay candidates -> {generated_root}")


if __name__ == "__main__":
    main()
