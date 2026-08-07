"""Bake restrained Hidzu identity into the accepted GET-204 KitBash scene.

This script opens the accepted four-block scene supplied on Blender's command
line, removes the rejected inherited black identity card in the derivative
scene, mounts project-owned 3D identity directly to real facades, and renders
one full-district runtime plate whose geometry remains immutable at every zoom.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import shutil
import struct
import subprocess
import sys
from pathlib import Path
from typing import Any, Iterable

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector


REPO_ROOT = Path(__file__).resolve().parents[4]
DEFAULT_MANIFEST = REPO_ROOT / "art/blender/get205/manifests/four-block-baked-treatment.json"
FONT_PATH = Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument(
        "--view",
        choices=("all", "stable-runtime", "logistics-proof", "foregrounds"),
        default="all",
    )
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(argv)


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def png_dimensions(path: Path) -> tuple[int, int]:
    with path.open("rb") as handle:
        signature = handle.read(8)
        if signature != b"\x89PNG\r\n\x1a\n":
            raise RuntimeError(f"Expected PNG output: {path}")
        handle.read(8)  # IHDR length and chunk type.
        return struct.unpack(">II", handle.read(8))


def ensure_collection(name: str, parent: bpy.types.Collection) -> bpy.types.Collection:
    existing = bpy.data.collections.get(name)
    if existing is not None:
        return existing
    created = bpy.data.collections.new(name)
    parent.children.link(created)
    return created


def move_to_collection(obj: bpy.types.Object, target: bpy.types.Collection) -> None:
    for owner in list(obj.users_collection):
        owner.objects.unlink(obj)
    target.objects.link(obj)


def principled_material(
    name: str,
    base_color: Iterable[float],
    roughness: float,
    metallic: float,
    emission_color: Iterable[float] | None = None,
    emission_strength: float = 0.0,
) -> bpy.types.Material:
    result = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    result.use_nodes = True
    nodes = result.node_tree.nodes
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Base Color"].default_value = tuple(base_color)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    if emission_color is not None:
        shader.inputs["Emission Color"].default_value = tuple(emission_color)
        shader.inputs["Emission Strength"].default_value = emission_strength
    result.node_tree.links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    return result


def cube(
    name: str,
    location: tuple[float, float, float],
    dimensions: tuple[float, float, float],
    target: bpy.types.Collection,
    surface: bpy.types.Material,
    rotation_y: float = 0.0,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    obj.rotation_euler[1] = rotation_y
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(surface)
    move_to_collection(obj, target)
    return obj


def add_hex_mark(
    name: str,
    x: float,
    facade_y: float,
    z: float,
    radius: float,
    target: bpy.types.Collection,
    surface: bpy.types.Material,
) -> list[bpy.types.Object]:
    created: list[bpy.types.Object] = []
    points = [
        (
            x + math.cos(math.radians(30 + index * 60)) * radius,
            z + math.sin(math.radians(30 + index * 60)) * radius,
        )
        for index in range(6)
    ]
    for index, (start_x, start_z) in enumerate(points):
        end_x, end_z = points[(index + 1) % len(points)]
        delta_x = end_x - start_x
        delta_z = end_z - start_z
        length = math.hypot(delta_x, delta_z)
        angle = math.atan2(delta_z, delta_x)
        created.append(
            cube(
                f"{name}.edge.{index}",
                ((start_x + end_x) / 2, facade_y, (start_z + end_z) / 2),
                (length + 0.018, 0.065, 0.075),
                target,
                surface,
                rotation_y=-angle,
            )
        )
    created.append(
        cube(
            f"{name}.core",
            (x, facade_y, z),
            (radius * 0.82, 0.075, 0.075),
            target,
            surface,
        )
    )
    return created


def add_text(
    name: str,
    body: str,
    location: tuple[float, float, float],
    max_width: float,
    size: float,
    target: bpy.types.Collection,
    surface: bpy.types.Material,
    character_spacing: float = 1.0,
) -> bpy.types.Object:
    curve = bpy.data.curves.new(f"{name}.curve", type="FONT")
    curve.body = body
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    curve.size = size
    curve.space_character = character_spacing
    curve.extrude = 0.025
    curve.bevel_depth = 0.006
    if FONT_PATH.is_file():
        curve.font = bpy.data.fonts.load(str(FONT_PATH), check_existing=True)
    curve.materials.append(surface)
    obj = bpy.data.objects.new(name, curve)
    obj.location = location
    obj.rotation_euler[0] = math.radians(90)
    target.objects.link(obj)
    bpy.context.view_layer.update()
    if obj.dimensions.x > max_width:
        scale = max_width / obj.dimensions.x
        obj.scale = (scale, scale, scale)
        bpy.context.view_layer.update()
    return obj


def add_facade_wordmark(
    entry: dict[str, Any],
    unit: float,
    target: bpy.types.Collection,
    mount: bpy.types.Material,
    bone: bpy.types.Material,
    technology: bpy.types.Material,
    civic: bpy.types.Material,
) -> list[str]:
    sign_id = str(entry["id"])
    name = f"GET205.IDENTITY.{sign_id}"
    center_x = float(entry["layoutPosition"]["x"]) * unit
    facade_y = float(entry["layoutPosition"]["y"]) * unit + 0.11
    center_z = float(entry["elevationMeters"])
    width = float(entry["widthMeters"])
    height = float(entry["heightMeters"])
    accent = technology if entry["accent"] == "technology" else civic
    created: list[bpy.types.Object] = []

    # Real mounting rail and end caps keep the wordmark architectural without a
    # billboard-sized backing card.
    created.append(
        cube(
            f"{name}.mount-rail",
            (center_x, facade_y - 0.035, center_z - height * 0.54),
            (width, 0.08, 0.055),
            target,
            mount,
        )
    )
    for side in (-1, 1):
        created.append(
            cube(
                f"{name}.mount-cap.{side}",
                (center_x + side * width / 2, facade_y - 0.02, center_z - height * 0.28),
                (0.055, 0.09, height * 0.62),
                target,
                mount,
            )
        )

    mark_radius = height * 0.38
    mark_x = center_x - width / 2 + mark_radius + 0.12
    created.extend(
        add_hex_mark(
            f"{name}.mark",
            mark_x,
            facade_y,
            center_z + height * 0.08,
            mark_radius,
            target,
            accent,
        )
    )
    text_space_left = mark_x + mark_radius + 0.18
    text_space_right = center_x + width / 2 - 0.08
    text_center_x = (text_space_left + text_space_right) / 2
    text_width = max(0.8, text_space_right - text_space_left)
    created.append(
        add_text(
            f"{name}.wordmark",
            str(entry["mainText"]),
            (text_center_x, facade_y + 0.012, center_z + height * 0.15),
            text_width,
            height * 0.65,
            target,
            bone,
            1.08,
        )
    )
    created.append(
        add_text(
            f"{name}.descriptor",
            str(entry["subText"]),
            (text_center_x, facade_y + 0.014, center_z - height * 0.34),
            text_width,
            height * 0.20,
            target,
            accent,
            1.12,
        )
    )
    cluster_id = str(entry["clusterId"])
    for obj in created:
        obj["get204_cluster_id"] = cluster_id
    return [obj.name for obj in created]


def add_environment_matte(
    entry: dict[str, Any],
    unit: float,
    target: bpy.types.Collection,
    scene: bpy.types.Scene,
) -> list[str]:
    """Hide the finite diorama edge without changing playable geometry."""
    material = principled_material(
        "GET205 atmospheric surround",
        entry["surfaceColor"],
        1.0,
        0.0,
    )
    center = entry["centerLayout"]
    bpy.ops.mesh.primitive_plane_add(
        size=float(entry["sizeMeters"]),
        location=(
            float(center["x"]) * unit,
            float(center["y"]) * unit,
            float(entry["elevationMeters"]),
        ),
    )
    matte = bpy.context.object
    matte.name = "GET205.ATMOSPHERE.noninteractive-surround"
    matte.data.materials.append(material)
    matte["get205_environment_matte"] = True
    matte["gameplay_collision"] = False
    move_to_collection(matte, target)

    world = scene.world
    if world is not None:
        world.color = tuple(entry["worldColor"][:3])
        if world.use_nodes and world.node_tree is not None:
            background = next(
                (node for node in world.node_tree.nodes if node.type == "BACKGROUND"),
                None,
            )
            if background is not None:
                background.inputs["Color"].default_value = tuple(entry["worldColor"])
    return [matte.name]


def point_at(obj: bpy.types.Object, target: Vector) -> None:
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def aim_camera(
    scene: bpy.types.Scene,
    camera: bpy.types.Object,
    source_recipe: dict[str, Any],
    target_layout: dict[str, float],
    width: int,
    height: int,
    zoom: float,
) -> None:
    coordinate_system = source_recipe["coordinateSystem"]
    unit = float(coordinate_system["layoutUnitMeters"])
    tile_width = float(coordinate_system["projection"]["tileWidth"])
    pixels_per_meter = (tile_width / 2) * math.sqrt(2) / unit
    elevation = math.radians(float(coordinate_system["projection"]["elevationDegrees"]))
    follow_offset_pixels = float(source_recipe["camera"]["followOffsetScenePixels"])
    layout_follow_offset = follow_offset_pixels / (
        pixels_per_meter * zoom * math.sin(elevation) * math.sqrt(2) * unit
    )
    target = Vector(
        (
            (float(target_layout["x"]) - layout_follow_offset) * unit,
            (float(target_layout["y"]) - layout_follow_offset) * unit,
            4.0,
        )
    )
    direction = Vector(
        (
            math.cos(elevation) / math.sqrt(2),
            math.cos(elevation) / math.sqrt(2),
            math.sin(elevation),
        )
    )
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = height / (pixels_per_meter * zoom)
    camera.location = target + direction * 780
    point_at(camera, target)
    camera.scale.x = -abs(camera.scale.x)
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    bpy.context.view_layer.update()


def render_view(
    scene: bpy.types.Scene,
    camera: bpy.types.Object,
    source_recipe: dict[str, Any],
    entry: dict[str, Any],
    output_root: Path,
) -> Path:
    output = output_root / str(entry["output"])
    output.parent.mkdir(parents=True, exist_ok=True)
    hidden_objects = [
        obj
        for obj in scene.objects
        if any(collection.name == "GET204_MISSION_DISTRICT_SCALE_PROOF" for collection in obj.users_collection)
        or obj.get("get204_cluster_id") in set(entry.get("hideClusterIds", []))
    ]
    prior_hidden = {obj.name: bool(obj.hide_render) for obj in hidden_objects}
    for obj in hidden_objects:
        obj.hide_render = True
    aim_camera(
        scene,
        camera,
        source_recipe,
        entry["targetLayout"],
        int(entry["width"]),
        int(entry["height"]),
        float(entry["renderZoom"]),
    )
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.render.filepath = str(output)
    try:
        bpy.ops.render.render(write_still=True)
    finally:
        for obj in hidden_objects:
            obj.hide_render = prior_hidden[obj.name]
    return output


def projected_crop(
    scene: bpy.types.Scene,
    camera: bpy.types.Object,
    objects: list[bpy.types.Object],
    width: int,
    height: int,
    padding: int = 24,
) -> dict[str, int]:
    depsgraph = bpy.context.evaluated_depsgraph_get()
    projected: list[Vector] = []
    for source in objects:
        evaluated = source.evaluated_get(depsgraph)
        if not evaluated.bound_box:
            continue
        projected.extend(
            world_to_camera_view(
                scene,
                camera,
                evaluated.matrix_world @ Vector(corner),
            )
            for corner in evaluated.bound_box
        )
    if not projected:
        raise RuntimeError("Cannot derive a camera crop for an empty cluster")

    left = max(0, math.floor(min(point.x for point in projected) * width) - padding)
    right = min(width, math.ceil(max(point.x for point in projected) * width) + padding)
    top = max(
        0,
        math.floor((1.0 - max(point.y for point in projected)) * height) - padding,
    )
    bottom = min(
        height,
        math.ceil((1.0 - min(point.y for point in projected)) * height) + padding,
    )
    if right <= left or bottom <= top:
        raise RuntimeError(
            f"Invalid projected crop: left={left}, top={top}, right={right}, bottom={bottom}"
        )
    return {
        "left": left,
        "top": top,
        "width": right - left,
        "height": bottom - top,
    }


def compose_registered_foreground(
    full_plate: Path,
    rendered_mask: Path,
    output: Path,
    crop: dict[str, int],
) -> None:
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg is None:
        raise RuntimeError("ffmpeg is required to register foreground colours to the stable plate")
    filter_graph = (
        f"[0:v]crop={crop['width']}:{crop['height']}:{crop['left']}:{crop['top']},"
        "format=rgba[base];"
        "[1:v]alphaextract[alpha];"
        "[base][alpha]alphamerge[out]"
    )
    subprocess.run(
        [
            ffmpeg,
            "-y",
            "-loglevel",
            "error",
            "-i",
            str(full_plate),
            "-i",
            str(rendered_mask),
            "-filter_complex",
            filter_graph,
            "-map",
            "[out]",
            "-frames:v",
            "1",
            str(output),
        ],
        check=True,
    )


def render_foreground_layers(
    scene: bpy.types.Scene,
    camera: bpy.types.Object,
    source_recipe: dict[str, Any],
    stable_view: dict[str, Any],
    output_root: Path,
    manifest: dict[str, Any],
) -> list[dict[str, Any]]:
    width = int(stable_view["width"])
    height = int(stable_view["height"])
    render_zoom = float(stable_view["renderZoom"])
    aim_camera(
        scene,
        camera,
        source_recipe,
        stable_view["targetLayout"],
        width,
        height,
        render_zoom,
    )

    renderable_types = {
        "MESH",
        "CURVE",
        "SURFACE",
        "META",
        "FONT",
        "VOLUME",
        "POINTCLOUD",
        "CURVES",
    }
    renderable = [obj for obj in scene.objects if obj.type in renderable_types]
    original_hidden = {obj.name: bool(obj.hide_render) for obj in renderable}
    original_settings = {
        "film_transparent": bool(scene.render.film_transparent),
        "use_border": bool(scene.render.use_border),
        "use_crop_to_border": bool(scene.render.use_crop_to_border),
        "border_min_x": float(scene.render.border_min_x),
        "border_max_x": float(scene.render.border_max_x),
        "border_min_y": float(scene.render.border_min_y),
        "border_max_y": float(scene.render.border_max_y),
        "color_mode": scene.render.image_settings.color_mode,
    }
    foreground_root = output_root / str(manifest["output"]["foregroundRoot"])
    foreground_root.mkdir(parents=True, exist_ok=True)
    full_plate = output_root / str(stable_view["output"])
    if not full_plate.is_file():
        raise RuntimeError(
            f"Stable registered plate is required before foreground export: {full_plate}"
        )
    entries: list[dict[str, Any]] = []

    try:
        scene.render.film_transparent = True
        scene.render.use_border = True
        scene.render.use_crop_to_border = True
        scene.render.image_settings.file_format = "PNG"
        scene.render.image_settings.color_mode = "RGBA"
        scene.render.image_settings.color_depth = "8"

        for cluster in source_recipe["architecturalClusters"]:
            cluster_id = str(cluster["id"])
            target_objects = [
                obj for obj in renderable if obj.get("get204_cluster_id") == cluster_id
            ]
            if not target_objects:
                raise RuntimeError(f"No renderable source objects found for {cluster_id}")
            crop = projected_crop(scene, camera, target_objects, width, height)

            for obj in renderable:
                obj.hide_render = obj not in target_objects

            scene.render.border_min_x = crop["left"] / width
            scene.render.border_max_x = (crop["left"] + crop["width"]) / width
            scene.render.border_min_y = 1.0 - (crop["top"] + crop["height"]) / height
            scene.render.border_max_y = 1.0 - crop["top"] / height

            file_name = cluster_id.replace(".", "-") + ".png"
            output = foreground_root / file_name
            rendered_mask = foreground_root / (output.stem + "-mask.png")
            scene.render.filepath = str(rendered_mask)
            bpy.ops.render.render(write_still=True)
            actual_width, actual_height = png_dimensions(rendered_mask)
            crop["width"] = actual_width
            crop["height"] = actual_height
            compose_registered_foreground(full_plate, rendered_mask, output, crop)
            rendered_mask.unlink()
            entries.append(
                {
                    "clusterId": cluster_id,
                    "path": str(output.relative_to(REPO_ROOT)),
                    "sha256": sha256(output),
                    "bytes": output.stat().st_size,
                    "crop": crop,
                    "depthAnchor": cluster["depthAnchor"],
                    "targetLayout": stable_view["targetLayout"],
                    "renderZoom": render_zoom,
                    "colorSource": "registered-stable-runtime-plate",
                    "fullPlate": {"width": width, "height": height},
                }
            )
    finally:
        for obj in renderable:
            obj.hide_render = original_hidden[obj.name]
        scene.render.film_transparent = original_settings["film_transparent"]
        scene.render.use_border = original_settings["use_border"]
        scene.render.use_crop_to_border = original_settings["use_crop_to_border"]
        scene.render.border_min_x = original_settings["border_min_x"]
        scene.render.border_max_x = original_settings["border_max_x"]
        scene.render.border_min_y = original_settings["border_min_y"]
        scene.render.border_max_y = original_settings["border_max_y"]
        scene.render.image_settings.color_mode = original_settings["color_mode"]

    metadata_path = output_root / str(manifest["output"]["foregroundMetadata"])
    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    metadata_path.write_text(json.dumps(entries, indent=2) + "\n", encoding="utf-8")
    return entries


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    args = parse_args()
    manifest_path = args.manifest.resolve()
    manifest = load_json(manifest_path)
    source_recipe = load_json(REPO_ROOT / manifest["source"]["recipe"])
    expected_source = (REPO_ROOT / manifest["source"]["scene"]).resolve()
    current_source = Path(bpy.data.filepath).resolve()
    if current_source != expected_source:
        raise RuntimeError(f"Open the accepted GET-204 scene first: {expected_source}")

    for object_name in manifest["treatment"]["removeObjects"]:
        existing = bpy.data.objects.get(object_name)
        if existing is not None:
            bpy.data.objects.remove(existing, do_unlink=True)

    root_collection = bpy.data.collections.get("GET204_MISSION_DISTRICT")
    if root_collection is None:
        raise RuntimeError("Accepted GET-204 master collection is missing")
    treatment_collection = ensure_collection("GET205_HIDZU_BAKED_TREATMENT", root_collection)

    palette = manifest["treatment"]["palette"]
    mount = principled_material("GET205 identity mount", palette["mount"], 0.48, 0.68)
    bone = principled_material(
        "GET205 identity bone lettering",
        palette["bone"],
        0.38,
        0.34,
        palette["bone"],
        0.28,
    )
    technology = principled_material(
        "GET205 identity technology cyan",
        palette["technology"],
        0.32,
        0.22,
        palette["technology"],
        0.9,
    )
    civic = principled_material(
        "GET205 identity civic amber",
        palette["civic"],
        0.38,
        0.18,
        palette["civic"],
        0.7,
    )

    unit = float(source_recipe["coordinateSystem"]["layoutUnitMeters"])
    created_objects: dict[str, list[str]] = {}
    for entry in manifest["treatment"]["facadeSigns"]:
        created_objects[str(entry["id"])] = add_facade_wordmark(
            entry,
            unit,
            treatment_collection,
            mount,
            bone,
            technology,
            civic,
        )

    scene = bpy.context.scene
    created_objects["environment-matte"] = add_environment_matte(
        manifest["treatment"]["environmentMatte"],
        unit,
        treatment_collection,
        scene,
    )
    camera = bpy.data.objects.get("GET204 City registered camera")
    if camera is None or camera.type != "CAMERA":
        raise RuntimeError("Registered GET-204 camera is missing")
    output_root = REPO_ROOT / manifest["output"]["root"]
    requested_views = [
        entry
        for entry in manifest["camera"]["views"]
        if args.view == "all" or entry["id"] == args.view
    ]
    if args.view == "foregrounds":
        requested_views = []
    outputs = [render_view(scene, camera, source_recipe, entry, output_root) for entry in requested_views]
    stable_view = next(
        entry for entry in manifest["camera"]["views"] if entry["id"] == "stable-runtime"
    )
    foreground_layers = render_foreground_layers(
        scene,
        camera,
        source_recipe,
        stable_view,
        output_root,
        manifest,
    ) if args.view in {"all", "foregrounds"} else []

    scene_path = output_root / manifest["output"]["scene"]
    scene_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(scene_path), compress=True)

    metadata = {
        "schemaVersion": 1,
        "id": manifest["id"],
        "sourceScene": str(expected_source.relative_to(REPO_ROOT)),
        "sourceSceneSha256": sha256(expected_source),
        "sourcePack": manifest["source"]["sourcePack"],
        "geometryOwner": manifest["source"]["geometryOwner"],
        "geometryChanges": manifest["source"]["geometryChanges"],
        "identityPresentation": manifest["treatment"]["identityPresentation"],
        "environmentMatte": manifest["treatment"]["environmentMatte"],
        "removedObjects": manifest["treatment"]["removeObjects"],
        "createdObjects": created_objects,
        "peopleBakedIntoPlate": manifest["output"]["peopleBakedIntoPlate"],
        "outputs": [
            {
                "path": str(path.relative_to(REPO_ROOT)),
                "sha256": sha256(path),
                "bytes": path.stat().st_size,
            }
            for path in outputs
        ],
        "foregroundLayers": foreground_layers,
        "scene": str(scene_path.relative_to(REPO_ROOT)),
        "sceneSha256": sha256(scene_path),
        "prohibited": manifest["prohibited"],
    }
    metadata_path = output_root / manifest["output"]["metadata"]
    metadata_path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print(
        f"GET-205 Blender-baked treatment complete: {len(created_objects)} facade signs, "
        f"{len(outputs)} full renders, {len(foreground_layers)} foreground layers -> {output_root}"
    )


if __name__ == "__main__":
    main()
