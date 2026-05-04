#!/usr/bin/env python3
"""Create the GET-155 Blender noir-isometric template and preview atlas.

Run through Blender:
  blender --background --python create_get155_iso_noir_template.py -- --repo-root /path/to/repo
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path
from typing import Dict, List, Tuple

import bpy
from mathutils import Euler, Vector


CAMERA_ROTATION_DEGREES = {"x": 60.0, "y": 0.0, "z": 45.0}
BLENDER_SOURCE_DIR = Path("art/blender/get155")
APP_ATLAS_DIR = Path("the-getaway/public/atlases")
BLEND_NAME = "get155_iso_noir_template.blend"
ATLAS_IMAGE_NAME = "get155_preview.png"
ATLAS_JSON_NAME = "get155_preview.json"
MANIFEST_NAME = "get155_preview_manifest.json"

ATLAS_WIDTH = 1024
ATLAS_HEIGHT = 512


class AssetSpec(Dict[str, object]):
    pass


ASSETS: Dict[str, AssetSpec] = {
    "building_art_deco_a": AssetSpec(
        collection="building_art_deco_a",
        render_size=(512, 512),
        atlas_frame={"x": 0, "y": 0, "w": 512, "h": 512},
        origin={"x": 0.5, "y": 0.94},
        scale=0.3,
        ortho_scale=7.25,
        grid_anchor="base_center",
    ),
    "prop_crate_a": AssetSpec(
        collection="prop_crate_a",
        render_size=(256, 256),
        atlas_frame={"x": 512, "y": 0, "w": 256, "h": 256},
        origin={"x": 0.5, "y": 0.88},
        scale=0.48,
        ortho_scale=2.7,
        grid_anchor="base_center",
    ),
    "prop_streetlight_a": AssetSpec(
        collection="prop_streetlight_a",
        render_size=(256, 256),
        atlas_frame={"x": 768, "y": 0, "w": 256, "h": 256},
        origin={"x": 0.5, "y": 0.91},
        scale=0.6,
        ortho_scale=4.8,
        grid_anchor="pole_base",
    ),
    "prop_neon_sign_a": AssetSpec(
        collection="prop_neon_sign_a",
        render_size=(256, 256),
        atlas_frame={"x": 512, "y": 256, "w": 256, "h": 256},
        origin={"x": 0.5, "y": 0.9},
        scale=0.55,
        ortho_scale=3.8,
        grid_anchor="post_base",
    ),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate GET-155 Blender template and preview atlas.")
    parser.add_argument("--repo-root", default=str(Path(__file__).resolve().parents[3]))
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(argv)


def ensure_clean_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for collection in list(bpy.data.collections):
        bpy.data.collections.remove(collection)


def set_scene_defaults(scene: bpy.types.Scene) -> None:
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"

    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = "Filmic"
    scene.view_settings.look = "High Contrast"
    scene.view_settings.exposure = 0.0
    scene.view_settings.gamma = 1.0
    scene.world = bpy.data.worlds.new("GET155_Noir_World") if scene.world is None else scene.world
    scene.world.color = (0.009, 0.013, 0.02)

    eevee = getattr(scene, "eevee", None)
    if eevee is not None:
        if hasattr(eevee, "use_gtao"):
            eevee.use_gtao = True
        if hasattr(eevee, "gtao_distance"):
            eevee.gtao_distance = 4
        if hasattr(eevee, "gtao_factor"):
            eevee.gtao_factor = 1.2


def make_material(
    name: str,
    base: Tuple[float, float, float, float],
    emission: Tuple[float, float, float, float] | None = None,
    strength: float = 0.0,
    roughness: float = 0.72,
) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = base
        bsdf.inputs["Roughness"].default_value = roughness
        if emission and "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = emission
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = strength
    return material


def make_materials() -> Dict[str, bpy.types.Material]:
    return {
        "asphalt": make_material("GET155 cracked asphalt blue-black", (0.035, 0.045, 0.055, 1)),
        "concrete": make_material("GET155 cold concrete", (0.22, 0.25, 0.27, 1)),
        "concrete_dark": make_material("GET155 grime concrete", (0.11, 0.125, 0.14, 1)),
        "trim": make_material("GET155 brushed steel trim", (0.55, 0.6, 0.64, 1), roughness=0.46),
        "crate": make_material("GET155 worn crate amber", (0.38, 0.22, 0.11, 1)),
        "crate_edge": make_material("GET155 crate dark edges", (0.16, 0.095, 0.055, 1)),
        "cyan_neon": make_material(
            "GET155 emissive cyan neon",
            (0.06, 0.62, 0.86, 1),
            (0.0, 0.95, 1.0, 1),
            3.8,
            0.34,
        ),
        "warm_neon": make_material(
            "GET155 emissive warm neon",
            (1.0, 0.48, 0.16, 1),
            (1.0, 0.32, 0.08, 1),
            2.7,
            0.36,
        ),
        "window": make_material(
            "GET155 muted window glow",
            (0.18, 0.44, 0.58, 1),
            (0.08, 0.62, 0.9, 1),
            1.2,
            0.4,
        ),
        "shadow": make_material("GET155 matte shadow steel", (0.025, 0.03, 0.04, 1)),
    }


def collection_for(name: str) -> bpy.types.Collection:
    collection = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(collection)
    return collection


def link_to_collection(obj: bpy.types.Object, collection: bpy.types.Collection) -> bpy.types.Object:
    collection.objects.link(obj)
    for current in list(obj.users_collection):
        if current != collection:
            current.objects.unlink(obj)
    return obj


def add_cube(
    name: str,
    collection: bpy.types.Collection,
    location: Tuple[float, float, float],
    scale: Tuple[float, float, float],
    material: bpy.types.Material,
    bevel: float = 0.0,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    if bevel > 0:
        modifier = obj.modifiers.new(f"{name}_bevel", "BEVEL")
        modifier.width = bevel
        modifier.segments = 1
        obj.modifiers.new(f"{name}_weighted_normals", "WEIGHTED_NORMAL")
    link_to_collection(obj, collection)
    return obj


def add_cylinder(
    name: str,
    collection: bpy.types.Collection,
    location: Tuple[float, float, float],
    radius: float,
    depth: float,
    material: bpy.types.Material,
    vertices: int = 20,
    bevel: bool = False,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    if bevel:
        obj.modifiers.new(f"{name}_weighted_normals", "WEIGHTED_NORMAL")
    link_to_collection(obj, collection)
    return obj


def create_building(collection: bpy.types.Collection, materials: Dict[str, bpy.types.Material]) -> None:
    add_cube("building_art_deco_a_core", collection, (0, 0, 2.35), (2.55, 2.55, 4.7), materials["concrete_dark"], 0.035)
    add_cube("building_art_deco_a_front_face", collection, (0, -1.285, 2.45), (2.62, 0.06, 4.5), materials["concrete"], 0.012)
    add_cube("building_art_deco_a_side_face", collection, (1.285, 0, 2.45), (0.06, 2.62, 4.5), materials["concrete"], 0.012)
    add_cube("building_art_deco_a_cap", collection, (0, 0, 4.92), (2.95, 2.95, 0.42), materials["trim"], 0.025)
    add_cube("building_art_deco_a_crown", collection, (0, 0, 5.55), (1.45, 1.45, 0.88), materials["concrete_dark"], 0.025)
    add_cube("building_art_deco_a_spire", collection, (0, 0, 6.18), (0.32, 0.32, 0.52), materials["warm_neon"], 0.018)
    add_cube("building_art_deco_a_door", collection, (0, -1.34, 0.48), (0.52, 0.06, 0.96), materials["shadow"], 0.012)
    add_cube("building_art_deco_a_door_neon", collection, (0, -1.38, 1.06), (0.7, 0.045, 0.08), materials["cyan_neon"], 0.01)

    window_x = [-0.78, -0.26, 0.26, 0.78]
    window_z = [1.45, 2.15, 2.85, 3.55]
    for z in window_z:
        for x in window_x:
            add_cube(f"building_art_deco_a_front_window_{x}_{z}", collection, (x, -1.342, z), (0.22, 0.04, 0.34), materials["window"], 0.006)
        for y in window_x:
            add_cube(f"building_art_deco_a_side_window_{y}_{z}", collection, (1.342, y, z), (0.04, 0.22, 0.34), materials["window"], 0.006)

    add_cube("building_art_deco_a_vertical_neon", collection, (-1.36, -0.48, 2.75), (0.05, 0.08, 2.25), materials["warm_neon"], 0.01)


def create_crate(collection: bpy.types.Collection, materials: Dict[str, bpy.types.Material]) -> None:
    add_cube("prop_crate_a_box", collection, (0, 0, 0.42), (1.18, 1.18, 0.84), materials["crate"], 0.035)
    add_cube("prop_crate_a_front_band", collection, (0, -0.61, 0.55), (1.32, 0.08, 0.13), materials["crate_edge"], 0.008)
    add_cube("prop_crate_a_side_band", collection, (0.61, 0, 0.55), (0.08, 1.32, 0.13), materials["crate_edge"], 0.008)
    add_cube("prop_crate_a_top_slat_a", collection, (-0.24, 0, 0.89), (0.12, 1.26, 0.08), materials["crate_edge"], 0.006)
    add_cube("prop_crate_a_top_slat_b", collection, (0.24, 0, 0.89), (0.12, 1.26, 0.08), materials["crate_edge"], 0.006)
    add_cube("prop_crate_a_diagonal_mark", collection, (0.01, -0.66, 0.46), (0.08, 0.05, 0.86), materials["warm_neon"], 0.006).rotation_euler[1] = math.radians(20)


def create_streetlight(collection: bpy.types.Collection, materials: Dict[str, bpy.types.Material]) -> None:
    add_cylinder("prop_streetlight_a_base", collection, (0, 0, 0.08), 0.2, 0.16, materials["trim"], 24, True)
    add_cylinder("prop_streetlight_a_pole", collection, (0, 0, 1.55), 0.055, 3.1, materials["shadow"], 18, True)
    add_cube("prop_streetlight_a_arm", collection, (0, -0.42, 3.05), (0.08, 0.92, 0.08), materials["trim"], 0.008)
    add_cube("prop_streetlight_a_lamp_housing", collection, (0, -0.94, 2.92), (0.36, 0.22, 0.16), materials["shadow"], 0.025)
    add_cube("prop_streetlight_a_lamp_glow", collection, (0, -1.04, 2.83), (0.28, 0.06, 0.07), materials["cyan_neon"], 0.012)


def create_neon_sign(collection: bpy.types.Collection, materials: Dict[str, bpy.types.Material]) -> None:
    add_cylinder("prop_neon_sign_a_post", collection, (-0.52, 0, 0.9), 0.055, 1.8, materials["shadow"], 16, True)
    add_cube("prop_neon_sign_a_panel", collection, (0, -0.04, 1.55), (1.35, 0.1, 0.62), materials["shadow"], 0.025)
    add_cube("prop_neon_sign_a_cyan_bar", collection, (0, -0.105, 1.72), (1.08, 0.035, 0.08), materials["cyan_neon"], 0.008)
    add_cube("prop_neon_sign_a_warm_bar", collection, (0.08, -0.108, 1.45), (0.82, 0.035, 0.08), materials["warm_neon"], 0.008)
    add_cube("prop_neon_sign_a_feet", collection, (-0.52, 0, 0.05), (0.52, 0.28, 0.1), materials["trim"], 0.008)


def create_lighting(scene: bpy.types.Scene) -> List[Dict[str, object]]:
    specs = [
        {
            "name": "GET155 cool upper-left key",
            "type": "AREA",
            "location": (-5.5, -6.0, 8.5),
            "energy": 520,
            "size": 5.0,
            "color": (0.58, 0.72, 1.0),
        },
        {
            "name": "GET155 low blue fill",
            "type": "AREA",
            "location": (4.6, 4.4, 3.2),
            "energy": 38,
            "size": 7.0,
            "color": (0.18, 0.28, 0.38),
        },
        {
            "name": "GET155 cyan rim",
            "type": "POINT",
            "location": (4.8, -4.8, 4.1),
            "energy": 95,
            "color": (0.0, 0.88, 1.0),
        },
        {
            "name": "GET155 warm neon rim",
            "type": "POINT",
            "location": (-3.6, 3.4, 3.0),
            "energy": 65,
            "color": (1.0, 0.36, 0.12),
        },
    ]

    for spec in specs:
        light_data = bpy.data.lights.new(spec["name"], spec["type"])
        light_data.energy = spec["energy"]
        if spec["type"] == "AREA":
            light_data.size = spec["size"]
        light_data.color = spec["color"]
        light_obj = bpy.data.objects.new(spec["name"], light_data)
        light_obj.location = spec["location"]
        scene.collection.objects.link(light_obj)

    return specs


def create_camera(scene: bpy.types.Scene) -> bpy.types.Object:
    camera_data = bpy.data.cameras.new("GET155_ortho_iso_camera")
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = 7.25
    camera = bpy.data.objects.new("GET155_ortho_iso_camera", camera_data)
    scene.collection.objects.link(camera)
    scene.camera = camera
    frame_camera(camera, Vector((0, 0, 2.4)), 18.0, camera_data.ortho_scale)
    return camera


def camera_rotation() -> Euler:
    return Euler(
        (
            math.radians(CAMERA_ROTATION_DEGREES["x"]),
            math.radians(CAMERA_ROTATION_DEGREES["y"]),
            math.radians(CAMERA_ROTATION_DEGREES["z"]),
        ),
        "XYZ",
    )


def frame_camera(camera: bpy.types.Object, target: Vector, distance: float, ortho_scale: float) -> None:
    rotation = camera_rotation()
    forward = rotation.to_matrix() @ Vector((0, 0, -1))
    camera.rotation_euler = rotation
    camera.location = target - (forward * distance)
    camera.data.ortho_scale = ortho_scale


def collection_objects(collection: bpy.types.Collection) -> List[bpy.types.Object]:
    return [obj for obj in collection.objects if obj.type in {"MESH", "CURVE", "EMPTY"}]


def collection_bounds(collection: bpy.types.Collection) -> Tuple[Vector, Vector]:
    objects = [obj for obj in collection_objects(collection) if obj.type == "MESH"]
    points: List[Vector] = []
    for obj in objects:
        points.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    if not points:
        return Vector((0, 0, 0)), Vector((0, 0, 1))
    min_point = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    max_point = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    return min_point, max_point


def set_collection_visibility(collections: Dict[str, bpy.types.Collection], active_name: str | None) -> None:
    for name, collection in collections.items():
        visible = active_name is None or name == active_name
        for obj in collection.objects:
            obj.hide_render = not visible
            obj.hide_viewport = not visible


def render_asset(
    scene: bpy.types.Scene,
    camera: bpy.types.Object,
    collections: Dict[str, bpy.types.Collection],
    frame_name: str,
    render_dir: Path,
) -> Path:
    spec = ASSETS[frame_name]
    collection = collections[spec["collection"]]
    set_collection_visibility(collections, spec["collection"])
    min_point, max_point = collection_bounds(collection)
    height = max_point.z - min_point.z
    target = Vector(
        (
            (min_point.x + max_point.x) * 0.5,
            (min_point.y + max_point.y) * 0.5,
            min_point.z + height * 0.44,
        )
    )
    frame_camera(camera, target, 18.0, float(spec["ortho_scale"]))

    width, height_px = spec["render_size"]
    scene.render.resolution_x = width
    scene.render.resolution_y = height_px
    output_path = render_dir / f"{frame_name}.png"
    scene.render.filepath = str(output_path)
    bpy.ops.render.render(write_still=True)
    return output_path


def compose_atlas(render_paths: Dict[str, Path], atlas_path: Path) -> None:
    atlas_pixels = [0.0] * (ATLAS_WIDTH * ATLAS_HEIGHT * 4)

    for frame_name, image_path in render_paths.items():
        frame = ASSETS[frame_name]["atlas_frame"]
        source = bpy.data.images.load(str(image_path), check_existing=False)
        source_width = int(source.size[0])
        source_height = int(source.size[1])
        pixels = list(source.pixels[:])
        if source_width != frame["w"] or source_height != frame["h"]:
            raise ValueError(f"{frame_name} render size does not match atlas frame: {source_width}x{source_height}")

        for sy in range(source_height):
            dest_y = ATLAS_HEIGHT - int(frame["y"]) - source_height + sy
            for sx in range(source_width):
                src_index = ((sy * source_width) + sx) * 4
                dest_x = int(frame["x"]) + sx
                dest_index = ((dest_y * ATLAS_WIDTH) + dest_x) * 4
                atlas_pixels[dest_index : dest_index + 4] = pixels[src_index : src_index + 4]

        bpy.data.images.remove(source)

    atlas = bpy.data.images.new("get155_preview_atlas", ATLAS_WIDTH, ATLAS_HEIGHT, alpha=True)
    atlas.pixels.foreach_set(atlas_pixels)
    atlas.filepath_raw = str(atlas_path)
    atlas.file_format = "PNG"
    atlas.save()
    bpy.data.images.remove(atlas)


def atlas_json() -> Dict[str, object]:
    frames = {}
    for frame_name, spec in ASSETS.items():
        frame = spec["atlas_frame"]
        frames[frame_name] = {
            "frame": frame,
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": frame["w"], "h": frame["h"]},
            "sourceSize": {"w": frame["w"], "h": frame["h"]},
            "pivot": spec["origin"],
        }

    return {
        "frames": frames,
        "meta": {
            "app": "GET-155 Blender noir iso template",
            "version": "1.0",
            "image": ATLAS_IMAGE_NAME,
            "format": "RGBA8888",
            "size": {"w": ATLAS_WIDTH, "h": ATLAS_HEIGHT},
            "scale": "1",
        },
    }


def manifest(render_paths: Dict[str, Path], repo_root: Path) -> Dict[str, object]:
    return {
        "ticket": "GET-155",
        "purpose": "Blender-to-Phaser validation slice for noir isometric source art.",
        "sourceBlend": str((repo_root / BLENDER_SOURCE_DIR / BLEND_NAME).relative_to(repo_root)),
        "atlas": {
            "image": str((repo_root / APP_ATLAS_DIR / ATLAS_IMAGE_NAME).relative_to(repo_root)),
            "json": str((repo_root / APP_ATLAS_DIR / ATLAS_JSON_NAME).relative_to(repo_root)),
        },
        "camera": {
            "type": "ORTHO",
            "rotationDegrees": CAMERA_ROTATION_DEGREES,
            "transparentBackground": True,
            "outputFormat": "PNG RGBA",
        },
        "render": {
            "engine": "Eevee",
            "colorManagement": "Filmic / High Contrast",
            "atlasSize": {"w": ATLAS_WIDTH, "h": ATLAS_HEIGHT},
        },
        "lights": [
            "cool upper-left area key",
            "low blue fill",
            "cyan rim",
            "warm neon rim",
            "emissive cyan/warm materials",
        ],
        "frames": {
            frame_name: {
                "render": str(render_paths[frame_name].relative_to(repo_root)),
                "atlasFrame": ASSETS[frame_name]["atlas_frame"],
                "origin": ASSETS[frame_name]["origin"],
                "scale": ASSETS[frame_name]["scale"],
                "gridAnchor": ASSETS[frame_name]["grid_anchor"],
            }
            for frame_name in ASSETS
        },
    }


def write_json(path: Path, data: Dict[str, object]) -> None:
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    args = parse_args()
    repo_root = Path(args.repo_root).resolve()
    source_dir = repo_root / BLENDER_SOURCE_DIR
    render_dir = source_dir / "renders"
    atlas_dir = repo_root / APP_ATLAS_DIR
    render_dir.mkdir(parents=True, exist_ok=True)
    atlas_dir.mkdir(parents=True, exist_ok=True)

    ensure_clean_scene()
    scene = bpy.context.scene
    set_scene_defaults(scene)
    materials = make_materials()

    collections = {
        "building_art_deco_a": collection_for("GET155_building_art_deco_a"),
        "prop_crate_a": collection_for("GET155_prop_crate_a"),
        "prop_streetlight_a": collection_for("GET155_prop_streetlight_a"),
        "prop_neon_sign_a": collection_for("GET155_prop_neon_sign_a"),
    }
    create_building(collections["building_art_deco_a"], materials)
    create_crate(collections["prop_crate_a"], materials)
    create_streetlight(collections["prop_streetlight_a"], materials)
    create_neon_sign(collections["prop_neon_sign_a"], materials)
    create_lighting(scene)
    camera = create_camera(scene)

    set_collection_visibility(collections, None)
    bpy.ops.wm.save_as_mainfile(filepath=str(source_dir / BLEND_NAME))

    render_paths = {
        frame_name: render_asset(scene, camera, collections, frame_name, render_dir)
        for frame_name in ASSETS
    }
    set_collection_visibility(collections, None)
    compose_atlas(render_paths, atlas_dir / ATLAS_IMAGE_NAME)
    write_json(atlas_dir / ATLAS_JSON_NAME, atlas_json())
    write_json(source_dir / MANIFEST_NAME, manifest(render_paths, repo_root))
    backup_blend_path = source_dir / f"{BLEND_NAME}1"
    if backup_blend_path.exists():
        backup_blend_path.unlink()
    print(f"GET-155 assets generated at {source_dir} and {atlas_dir}")


if __name__ == "__main__":
    main()
