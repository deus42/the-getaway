#!/usr/bin/env python3
"""Build and render the ignored GET-204 unchanged-kit Level 0 master scene.

The gameplay-owned Level0LayoutContract supplies topology. The tracked source
manifest supplies exact licensed-source identity and selection. The tracked
scene recipe supplies all transforms, camera, lighting, proof anchors, and
capture definitions. Every generated source-derived artifact remains under the
ignored ``art/blender/get204/.generated`` boundary.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import shutil
import sys
from pathlib import Path
from typing import Any, Iterable, Sequence

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Matrix, Vector


SCRIPT_DIRECTORY = Path(__file__).resolve().parent
if str(SCRIPT_DIRECTORY) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIRECTORY))

from build_level0_source_catalog import (  # noqa: E402
    EXPECTED_BLENDER_VERSION,
    bounds_for,
    group_buildings,
    import_fbx,
    reset_scene,
    stage_source,
    validate_environment,
    world_corners,
)


PIXEL_DENSITY_MARGIN = 1.0
BASE_GROUND_Z = -0.18
ROAD_Z = 0.0
BUILDING_GROUND_Z = 0.09
STRUCTURAL_BOUNDS_TOLERANCE_METERS = 0.08
RENDER_MODES = ("preview", "captures", "exports", "all")
MASTER_COLLECTION = "GET204_MASTER"
GROUND_COLLECTION = "GET204_GROUND"
ARCHITECTURE_BACK_COLLECTION = "GET204_ARCHITECTURE_BACK"
ARCHITECTURE_FRONT_COLLECTION = "GET204_ARCHITECTURE_FRONT"
GAMEPLAY_STRUCTURES_COLLECTION = "GET204_GAMEPLAY_STRUCTURES"
PROOF_COLLECTION = "GET204_SCALE_AND_ENTRANCE_PROOF"
EXPORT_HELPERS_COLLECTION = "GET204_EXPORT_HELPERS"
EXPORT_PIXEL_TOLERANCE = 0.05
COLOR_EXPORT_QUALITY = 85


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the GET-204 unchanged-kit master scene.")
    default_repo_root = Path(__file__).resolve().parents[4]
    parser.add_argument("--repo-root", type=Path, default=default_repo_root)
    parser.add_argument(
        "--source-root",
        type=Path,
        default=os.environ.get("GETAWAY_NEO_TOKYO_ROOT"),
        required=os.environ.get("GETAWAY_NEO_TOKYO_ROOT") is None,
    )
    parser.add_argument("--mode", choices=RENDER_MODES, default="preview")
    parser.add_argument("--preview-width", type=int, default=2048)
    parser.add_argument("--preview-height", type=int, default=1152)
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(argv)


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def collection(name: str, parent: bpy.types.Collection) -> bpy.types.Collection:
    existing = bpy.data.collections.get(name)
    if existing is not None:
        return existing
    created = bpy.data.collections.new(name)
    parent.children.link(created)
    return created


def move_to_collection(obj: bpy.types.Object, target: bpy.types.Collection) -> None:
    if target not in obj.users_collection:
        target.objects.link(obj)
    for current in list(obj.users_collection):
        if current != target:
            current.objects.unlink(obj)


def create_material(
    name: str,
    color: tuple[float, float, float, float],
    roughness: float = 0.9,
    metallic: float = 0.0,
) -> bpy.types.Material:
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF") if material.node_tree else None
    if shader:
        shader.inputs["Base Color"].default_value = color
        shader.inputs["Roughness"].default_value = roughness
        shader.inputs["Metallic"].default_value = metallic
    return material


def polygon_vertices(polygon: Sequence[dict[str, float]], unit: float, z: float) -> list[tuple[float, float, float]]:
    return [(point["x"] * unit, point["y"] * unit, z) for point in polygon]


def create_prism(
    name: str,
    polygon: Sequence[dict[str, float]],
    unit: float,
    bottom_z: float,
    top_z: float,
    material: bpy.types.Material,
    target_collection: bpy.types.Collection,
) -> bpy.types.Object:
    top = polygon_vertices(polygon, unit, top_z)
    bottom = polygon_vertices(polygon, unit, bottom_z)
    count = len(polygon)
    vertices = [*bottom, *top]
    faces: list[tuple[int, ...]] = [tuple(reversed(range(count))), tuple(range(count, count * 2))]
    for index in range(count):
        following = (index + 1) % count
        faces.append((index, following, following + count, index + count))
    mesh = bpy.data.meshes.new(f"{name}.mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    target_collection.objects.link(obj)
    obj.data.materials.append(material)
    obj["get204_role"] = "public-realm"
    return obj


def rectangle_polygon(min_x: float, min_y: float, max_x: float, max_y: float) -> list[dict[str, float]]:
    return [
        {"x": min_x, "y": min_y},
        {"x": max_x, "y": min_y},
        {"x": max_x, "y": max_y},
        {"x": min_x, "y": max_y},
    ]


def create_crossing_stripes(
    surface: dict[str, Any],
    unit: float,
    material: bpy.types.Material,
    target_collection: bpy.types.Collection,
) -> None:
    xs = [point["x"] for point in surface["polygon"]]
    ys = [point["y"] for point in surface["polygon"]]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    stripe_width = 0.42
    gap = 0.58
    cursor = min_x + 0.35
    stripe_index = 0
    while cursor + stripe_width <= max_x - 0.25:
        stripe = rectangle_polygon(cursor, min_y + 0.35, cursor + stripe_width, max_y - 0.35)
        create_prism(
            f"GET204.{surface['id']}.stripe.{stripe_index:02d}",
            stripe,
            unit,
            0.055,
            0.075,
            material,
            target_collection,
        )
        cursor += stripe_width + gap
        stripe_index += 1


def create_road_edge_cues(
    surface: dict[str, Any],
    unit: float,
    material: bpy.types.Material,
    target_collection: bpy.types.Collection,
) -> None:
    xs = [point["x"] for point in surface["polygon"]]
    ys = [point["y"] for point in surface["polygon"]]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    edge_width = 0.05
    edge_inset = 0.16
    if max_x - min_x >= max_y - min_y:
        strips = [
            rectangle_polygon(min_x + edge_inset, min_y + edge_inset, max_x - edge_inset, min_y + edge_inset + edge_width),
            rectangle_polygon(min_x + edge_inset, max_y - edge_inset - edge_width, max_x - edge_inset, max_y - edge_inset),
        ]
    else:
        strips = [
            rectangle_polygon(min_x + edge_inset, min_y + edge_inset, min_x + edge_inset + edge_width, max_y - edge_inset),
            rectangle_polygon(max_x - edge_inset - edge_width, min_y + edge_inset, max_x - edge_inset, max_y - edge_inset),
        ]
    for index, strip in enumerate(strips):
        create_prism(
            f"GET204.{surface['id']}.curb.{index}",
            strip,
            unit,
            0.025,
            0.05,
            material,
            target_collection,
        )


def create_building_lot(
    placement: dict[str, Any],
    asset: dict[str, Any],
    unit: float,
    pad_material: bpy.types.Material,
    target_collection: bpy.types.Collection,
) -> None:
    radians = math.radians(float(placement["rotationDegrees"]))
    cosine = abs(math.cos(radians))
    sine = abs(math.sin(radians))
    bounds = asset["measuredStructuralBoundsMeters"]
    scale = float(placement["uniformScale"])
    width = (bounds["width"] * cosine + bounds["depth"] * sine) * scale / unit
    depth = (bounds["width"] * sine + bounds["depth"] * cosine) * scale / unit
    center = placement["layoutPosition"]
    polygon = rectangle_polygon(
        center["x"] - width / 2,
        center["y"] - depth / 2,
        center["x"] + width / 2,
        center["y"] + depth / 2,
    )
    create_prism(
        f"GET204.sill.{placement['footprintId']}",
        polygon,
        unit,
        0.04,
        BUILDING_GROUND_Z,
        pad_material,
        target_collection,
    )


def build_public_realm(
    layout: dict[str, Any],
    recipe: dict[str, Any],
    source: dict[str, Any],
    target_collection: bpy.types.Collection,
) -> list[bpy.types.Object]:
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    materials = {
        "base": create_material("GET204 district substrate", (0.035, 0.04, 0.047, 1), 0.98),
        "road": create_material("GET204 asphalt", (0.07, 0.075, 0.085, 1), 0.94),
        "alley": create_material("GET204 service asphalt", (0.052, 0.058, 0.067, 1), 0.97),
        "plaza": create_material("GET204 plaza concrete", (0.16, 0.155, 0.15, 1), 0.92),
        "sidewalk": create_material("GET204 sidewalk concrete", (0.19, 0.185, 0.175, 1), 0.9),
        "crossing": create_material("GET204 crossing substrate", (0.085, 0.088, 0.095, 1), 0.94),
        "stripe": create_material("GET204 crossing stripe", (0.54, 0.51, 0.45, 1), 0.82),
        "curb": create_material("GET204 neutral road edge", (0.115, 0.112, 0.105, 1), 0.9),
        "pad": create_material("GET204 structure sill", (0.075, 0.078, 0.082, 1), 0.96),
    }
    created: list[bpy.types.Object] = []
    created.append(
        create_prism(
            "GET204 district substrate",
            layout["bounds"],
            unit,
            BASE_GROUND_Z - 0.12,
            BASE_GROUND_Z,
            materials["base"],
            target_collection,
        )
    )
    z_by_kind = {"road": ROAD_Z, "alley": 0.018, "crossing": 0.045, "plaza": 0.065, "sidewalk": 0.085}
    priority = {"road": 0, "alley": 1, "crossing": 2, "plaza": 3, "sidewalk": 4}
    for surface in sorted(layout["surfaces"], key=lambda item: priority.get(item["kind"], 10)):
        kind = surface["kind"]
        top_z = z_by_kind[kind]
        created.append(
            create_prism(
                f"GET204.{surface['id']}",
                surface["polygon"],
                unit,
                BASE_GROUND_Z,
                top_z,
                materials[kind],
                target_collection,
            )
        )
        if kind == "crossing":
            create_crossing_stripes(surface, unit, materials["stripe"], target_collection)
        elif kind == "road":
            create_road_edge_cues(surface, unit, materials["curb"], target_collection)
    assets = {asset["id"]: asset for asset in source["selectedAssets"]}
    for placement in recipe["buildingPlacements"]:
        create_building_lot(
            placement,
            assets[placement["assetId"]],
            unit,
            materials["pad"],
            target_collection,
        )
    return created


def selected_members(
    members: Sequence[bpy.types.Object],
    source_prefix: str,
    excluded_suffixes: Sequence[str],
) -> list[bpy.types.Object]:
    excluded_names = {f"{source_prefix}_{suffix}" for suffix in excluded_suffixes}
    return [obj for obj in members if obj.name.split(".", 1)[0] not in excluded_names]


def assert_measured_bounds(asset: dict[str, Any], objects: Sequence[bpy.types.Object]) -> None:
    measured = bounds_for(objects).dimensions
    expected = asset["measuredStructuralBoundsMeters"]
    for axis, actual, recorded in zip(("width", "depth", "height"), measured, (expected["width"], expected["depth"], expected["height"])):
        if abs(actual - recorded) > STRUCTURAL_BOUNDS_TOLERANCE_METERS:
            raise RuntimeError(
                f"{asset['sourcePrefix']} {axis} drifted: measured {actual:.4f}m, recorded {recorded:.4f}m"
            )


def transform_buildings(
    imported: Sequence[bpy.types.Object],
    groups: dict[str, list[bpy.types.Object]],
    source: dict[str, Any],
    recipe: dict[str, Any],
    architecture_back: bpy.types.Collection,
    architecture_front: bpy.types.Collection,
) -> tuple[list[dict[str, Any]], set[bpy.types.Object]]:
    assets = {asset["id"]: asset for asset in source["selectedAssets"]}
    keep: set[bpy.types.Object] = set()
    measurements: list[dict[str, Any]] = []
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    for placement in recipe["buildingPlacements"]:
        asset = assets[placement["assetId"]]
        prefix = asset["sourcePrefix"]
        objects = selected_members(groups[prefix], prefix, asset["excludedObjectSuffixes"])
        if not objects:
            raise RuntimeError(f"Selected source root {prefix} has no structural objects")
        assert_measured_bounds(asset, objects)
        source_bounds = bounds_for(objects)
        source_center = Vector((source_bounds.center[0], source_bounds.center[1], source_bounds.minimum[2]))
        target = Vector(
            (
                placement["layoutPosition"]["x"] * unit,
                placement["layoutPosition"]["y"] * unit,
                BUILDING_GROUND_Z,
            )
        )
        scale = float(placement["uniformScale"])
        transform = (
            Matrix.Translation(target)
            @ Matrix.Rotation(math.radians(float(placement["rotationDegrees"])), 4, "Z")
            @ Matrix.Scale(scale, 4)
            @ Matrix.Translation(-source_center)
        )
        target_collection = architecture_back if placement["layoutPosition"]["y"] < 30 else architecture_front
        for obj in objects:
            obj.matrix_world = transform @ obj.matrix_world
            obj["get204_asset_id"] = asset["id"]
            obj["get204_placement_id"] = placement["id"]
            obj["get204_footprint_id"] = placement["footprintId"]
            move_to_collection(obj, target_collection)
            keep.add(obj)
        transformed_bounds = bounds_for(objects)
        measurements.append(
            {
                "placementId": placement["id"],
                "assetId": asset["id"],
                "sourcePrefix": prefix,
                "objectCount": len(objects),
                "sourceStructuralBoundsMeters": {
                    "minimum": list(source_bounds.minimum),
                    "maximum": list(source_bounds.maximum),
                    "dimensions": list(source_bounds.dimensions),
                },
                "transformedBoundsMeters": {
                    "minimum": list(transformed_bounds.minimum),
                    "maximum": list(transformed_bounds.maximum),
                    "dimensions": list(transformed_bounds.dimensions),
                },
                "layoutPosition": placement["layoutPosition"],
                "rotationDegrees": placement["rotationDegrees"],
                "uniformScale": scale,
            }
        )
    return measurements, keep


def transform_gameplay_props(
    imported: Sequence[bpy.types.Object],
    source: dict[str, Any],
    recipe: dict[str, Any],
    target_collection: bpy.types.Collection,
) -> tuple[list[dict[str, Any]], set[bpy.types.Object]]:
    assets = {asset["id"]: asset for asset in source["selectedAssets"]}
    keep: set[bpy.types.Object] = set()
    measurements: list[dict[str, Any]] = []
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    for placement in recipe["propPlacements"]:
        asset = assets[placement["assetId"]]
        prefix = asset["sourcePrefix"]
        members = [
            obj
            for obj in imported
            if obj.name == prefix or obj.name.startswith(f"{prefix}_")
        ]
        objects = selected_members(members, prefix, asset["excludedObjectSuffixes"])
        if not objects:
            raise RuntimeError(f"Selected gameplay source root {prefix} has no structural objects")
        assert_measured_bounds(asset, objects)
        source_bounds = bounds_for(objects)
        normalization = asset["normalize"]
        if normalization["groundContact"] == "source-catalog-plane":
            source_ground_z = float(normalization["sourceGroundDatumMeters"])
        elif normalization["groundContact"] == "measured-bounds-min-z":
            source_ground_z = float(source_bounds.minimum[2])
        else:
            raise RuntimeError(
                f"Unsupported ground normalization for {asset['id']}: "
                f"{normalization['groundContact']}"
            )
        source_center = Vector((source_bounds.center[0], source_bounds.center[1], source_ground_z))
        mount_lift = float(placement.get("mountLiftMeters", 0))
        target = Vector(
            (
                placement["layoutPosition"]["x"] * unit,
                placement["layoutPosition"]["y"] * unit,
                BUILDING_GROUND_Z + mount_lift,
            )
        )
        scale = float(placement["uniformScale"])
        transform = (
            Matrix.Translation(target)
            @ Matrix.Rotation(math.radians(float(placement["rotationDegrees"])), 4, "Z")
            @ Matrix.Scale(scale, 4)
            @ Matrix.Translation(-source_center)
        )
        for obj in objects:
            duplicate = obj.copy()
            duplicate.data = obj.data.copy() if obj.data else None
            duplicate.matrix_world = transform @ obj.matrix_world
            duplicate.name = f"GET204.{placement['id']}.{obj.name}"
            duplicate["get204_asset_id"] = asset["id"]
            duplicate["get204_placement_id"] = placement["id"]
            duplicate["get204_anchor_id"] = placement["anchorId"]
            target_collection.objects.link(duplicate)
            keep.add(duplicate)
        transformed = [obj for obj in target_collection.objects if obj.get("get204_placement_id") == placement["id"]]
        transformed_bounds = bounds_for(transformed)
        measurements.append(
            {
                "placementId": placement["id"],
                "assetId": asset["id"],
                "sourcePrefix": prefix,
                "anchorId": placement["anchorId"],
                "role": placement["role"],
                "objectCount": len(transformed),
                "sourceStructuralBoundsMeters": {
                    "minimum": list(source_bounds.minimum),
                    "maximum": list(source_bounds.maximum),
                    "dimensions": list(source_bounds.dimensions),
                },
                "transformedBoundsMeters": {
                    "minimum": list(transformed_bounds.minimum),
                    "maximum": list(transformed_bounds.maximum),
                    "dimensions": list(transformed_bounds.dimensions),
                },
                "layoutPosition": placement["layoutPosition"],
                "rotationDegrees": placement["rotationDegrees"],
                "uniformScale": scale,
                "sourceGroundDatumMeters": source_ground_z,
                "mountLiftMeters": mount_lift,
            }
        )
    return measurements, keep


def remove_unselected_source_objects(
    imported: Sequence[bpy.types.Object],
    kept_buildings: set[bpy.types.Object],
) -> None:
    for obj in list(imported):
        if obj not in kept_buildings:
            bpy.data.objects.remove(obj, do_unlink=True)


def add_human_proof(
    proof: dict[str, Any],
    anchor: dict[str, Any],
    unit: float,
    material: bpy.types.Material,
    target_collection: bpy.types.Collection,
) -> list[bpy.types.Object]:
    x = anchor["position"]["x"] * unit
    y = anchor["position"]["y"] * unit
    height = float(proof["heightMeters"])
    silhouette_width = float(proof["minimumSilhouetteWidthMeters"])
    leg_height = height * 0.4
    objects: list[bpy.types.Object] = []
    for side in (-1, 1):
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=8,
            radius=height * 0.045,
            depth=leg_height,
            location=(x + side * height * 0.055, y, BUILDING_GROUND_Z + leg_height / 2),
        )
        leg = bpy.context.object
        leg.name = f"GET204.{proof['id']}.leg.{side}"
        leg.data.materials.append(material)
        move_to_collection(leg, target_collection)
        objects.append(leg)
    torso_height = height * 0.43
    bpy.ops.mesh.primitive_cone_add(
        vertices=8,
        radius1=height * 0.1,
        radius2=silhouette_width / 2,
        depth=torso_height,
        location=(x, y, BUILDING_GROUND_Z + leg_height + torso_height / 2),
    )
    torso = bpy.context.object
    torso.name = f"GET204.{proof['id']}.torso"
    torso.data.materials.append(material)
    move_to_collection(torso, target_collection)
    objects.append(torso)
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=2,
        radius=height * 0.1,
        location=(x, y, BUILDING_GROUND_Z + height * 0.9),
    )
    head = bpy.context.object
    head.name = f"GET204.{proof['id']}.head"
    head.data.materials.append(material)
    move_to_collection(head, target_collection)
    objects.append(head)
    for obj in objects:
        obj["get204_role"] = "actor-scale-proof"
        obj["get204_anchor_id"] = anchor["id"]
    return objects


def add_entrance_proof(
    proof: dict[str, Any],
    entrance: dict[str, Any],
    unit: float,
    material: bpy.types.Material,
    target_collection: bpy.types.Collection,
) -> list[bpy.types.Object]:
    center = Vector((proof["position"]["x"] * unit, proof["position"]["y"] * unit, BUILDING_GROUND_Z))
    width = float(proof["minimumClearWidthMeters"])
    height = 2.4
    facing = math.radians(float(entrance["facingDegrees"]))
    tangent = Vector((-math.sin(facing), math.cos(facing), 0))
    normal = Vector((math.cos(facing), math.sin(facing), 0))
    objects: list[bpy.types.Object] = []
    for side in (-1, 1):
        location = center + tangent * side * (width / 2 + 0.12) + normal * 0.18
        bpy.ops.mesh.primitive_cube_add(size=1, location=(location.x, location.y, BUILDING_GROUND_Z + height / 2))
        post = bpy.context.object
        post.name = f"GET204.{proof['entranceId']}.post.{side}"
        post.scale = (0.14, 0.14, height / 2)
        post.data.materials.append(material)
        move_to_collection(post, target_collection)
        objects.append(post)
    lintel_location = center + normal * 0.18
    bpy.ops.mesh.primitive_cube_add(size=1, location=(lintel_location.x, lintel_location.y, BUILDING_GROUND_Z + height))
    lintel = bpy.context.object
    lintel.name = f"GET204.{proof['entranceId']}.lintel"
    lintel.rotation_euler[2] = facing
    lintel.scale = (0.12, width / 2 + 0.26, 0.1)
    lintel.data.materials.append(material)
    move_to_collection(lintel, target_collection)
    objects.append(lintel)
    for obj in objects:
        obj["get204_role"] = "entrance-scale-proof"
        obj["get204_entrance_id"] = proof["entranceId"]
    return objects


def build_scale_and_entrance_proof(
    layout: dict[str, Any],
    recipe: dict[str, Any],
    target_collection: bpy.types.Collection,
) -> list[bpy.types.Object]:
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    anchors = {anchor["id"]: anchor for anchor in layout["anchors"]}
    entrances = {entrance["id"]: entrance for entrance in layout["entrances"]}
    actor_material = create_material("GET204 human scale proof", (0.95, 0.58, 0.12, 1), 0.64)
    entrance_material = create_material("GET204 entrance scale proof", (0.58, 0.54, 0.46, 1), 0.8, 0.08)
    created: list[bpy.types.Object] = []
    for proof in recipe["actorScaleProof"]:
        created.extend(add_human_proof(proof, anchors[proof["anchorId"]], unit, actor_material, target_collection))
    for proof in recipe["entranceProof"]:
        created.extend(add_entrance_proof(proof, entrances[proof["entranceId"]], unit, entrance_material, target_collection))
    return created


def point_object_at(obj: bpy.types.Object, target: Vector) -> None:
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()
    bpy.context.view_layer.update()


def configure_scene(scene: bpy.types.Scene, target: Vector, recipe: dict[str, Any]) -> bpy.types.Object:
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    scene.render.resolution_percentage = 100
    scene.render.image_settings.color_depth = "8"
    scene.view_settings.exposure = 1.05
    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass
    if scene.world is None:
        scene.world = bpy.data.worlds.new("GET204 neutral master world")
    scene.world.use_nodes = True
    background = scene.world.node_tree.nodes.get("Background") if scene.world.node_tree else None
    if background:
        background.inputs["Color"].default_value = (0.03, 0.035, 0.042, 1)
        background.inputs["Strength"].default_value = 0.72

    camera_data = bpy.data.cameras.new("GET204 2:1 master camera")
    camera_data.type = "ORTHO"
    if recipe["camera"]["sensorFit"] != "vertical":
        raise RuntimeError("GET-204 capture camera requires vertical sensor fit")
    camera_data.sensor_fit = "VERTICAL"
    camera = bpy.data.objects.new("GET204 2:1 master camera", camera_data)
    scene.collection.objects.link(camera)
    scene.camera = camera
    elevation = math.radians(30)
    direction = Vector((math.cos(elevation) / math.sqrt(2), math.cos(elevation) / math.sqrt(2), math.sin(elevation)))
    camera.location = target + direction * 650
    point_object_at(camera, target)

    sun_data = bpy.data.lights.new("GET204 neutral upper-left sun", "SUN")
    sun_data.energy = 2.6
    sun_data.angle = math.radians(8)
    sun_data.color = (1.0, 0.88, 0.72)
    sun = bpy.data.objects.new("GET204 neutral upper-left sun", sun_data)
    sun.location = target + Vector((-110, 110, 180))
    point_object_at(sun, target)
    scene.collection.objects.link(sun)

    area_data = bpy.data.lights.new("GET204 neutral sky fill", "AREA")
    area_data.energy = 2200
    area_data.shape = "DISK"
    area_data.size = 90
    area_data.color = (0.54, 0.64, 0.76)
    area = bpy.data.objects.new("GET204 neutral sky fill", area_data)
    area.location = target + Vector((70, -85, 120))
    point_object_at(area, target)
    scene.collection.objects.link(area)
    return camera


def set_camera_target(camera: bpy.types.Object, target: Vector, distance: float = 650) -> None:
    elevation = math.radians(30)
    direction = Vector((math.cos(elevation) / math.sqrt(2), math.cos(elevation) / math.sqrt(2), math.sin(elevation)))
    camera.location = target + direction * distance
    point_object_at(camera, target)


def runtime_follow_target_lift_meters(recipe: dict[str, Any]) -> float:
    """Convert Phaser's vertical follow offset into this camera's Z target lift."""
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    pixels_per_meter = recipe["camera"]["tileWidth"] / 2 / (unit / math.sqrt(2))
    elevation = math.radians(float(recipe["camera"]["elevationDegrees"]))
    return float(recipe["camera"]["followOffsetScenePixels"]) / (
        pixels_per_meter * math.cos(elevation)
    )


def fit_camera_to_objects(
    camera: bpy.types.Object,
    objects: Iterable[bpy.types.Object],
    aspect: float,
    margin: float = 1.08,
) -> float:
    points = world_corners([obj for obj in objects if obj.type == "MESH" and not obj.hide_render])
    inverse = camera.matrix_world.inverted()
    local = [inverse @ point for point in points]
    horizontal_span = max(point.x for point in local) - min(point.x for point in local)
    vertical_span = max(point.y for point in local) - min(point.y for point in local)
    return max(vertical_span, horizontal_span / aspect) * margin


def render_preview(
    scene: bpy.types.Scene,
    camera: bpy.types.Object,
    generated_root: Path,
    width: int,
    height: int,
    target: Vector,
) -> Path:
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    set_camera_target(camera, target)
    camera.data.ortho_scale = fit_camera_to_objects(camera, scene.objects, width / height, margin=1.1)
    output = generated_root / "master" / "overview.png"
    output.parent.mkdir(parents=True, exist_ok=True)
    scene.render.filepath = str(output)
    bpy.ops.render.render(write_still=True)
    return output


def render_captures(
    scene: bpy.types.Scene,
    camera: bpy.types.Object,
    generated_root: Path,
    layout: dict[str, Any],
    recipe: dict[str, Any],
) -> list[Path]:
    anchors = {anchor["id"]: anchor for anchor in layout["anchors"]}
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    pixels_per_meter = recipe["camera"]["tileWidth"] / 2 / (unit / math.sqrt(2))
    target_lift_meters = runtime_follow_target_lift_meters(recipe)
    outputs: list[Path] = []
    capture_root = generated_root / "captures"
    capture_root.mkdir(parents=True, exist_ok=True)
    for capture in recipe["captures"]:
        anchor = anchors[capture["targetAnchorId"]]
        target = Vector((
            anchor["position"]["x"] * unit,
            anchor["position"]["y"] * unit,
            target_lift_meters,
        ))
        set_camera_target(camera, target)
        scene.render.resolution_x = int(capture["width"])
        scene.render.resolution_y = int(capture["height"])
        camera.data.ortho_scale = capture["height"] / (pixels_per_meter * float(capture["zoom"]) * PIXEL_DENSITY_MARGIN)
        output = capture_root / f"{capture['id']}.png"
        scene.render.filepath = str(output)
        bpy.ops.render.render(write_still=True)
        outputs.append(output)
    return outputs


def aligned_pixels_per_meter(recipe: dict[str, Any]) -> float:
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    return (float(recipe["camera"]["tileWidth"]) / 2) * math.sqrt(2) / unit


def aligned_pixel_to_world(
    pixel_x: float,
    pixel_y: float,
    recipe: dict[str, Any],
) -> Vector:
    canvas = recipe["alignedExport"]["canvas"]
    half_tile_width = float(recipe["camera"]["tileWidth"]) / 2
    half_tile_height = float(recipe["camera"]["tileHeight"]) / 2
    horizontal = (pixel_x - float(canvas["pixelOrigin"]["x"])) / half_tile_width
    vertical = (pixel_y - float(canvas["pixelOrigin"]["y"])) / half_tile_height
    layout_x = (vertical + horizontal) / 2
    layout_y = (vertical - horizontal) / 2
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    return Vector((layout_x * unit, layout_y * unit, 0.0))


def layout_to_aligned_pixel(point: dict[str, float], recipe: dict[str, Any]) -> dict[str, float]:
    canvas = recipe["alignedExport"]["canvas"]
    half_tile_width = float(recipe["camera"]["tileWidth"]) / 2
    half_tile_height = float(recipe["camera"]["tileHeight"]) / 2
    return {
        "x": (float(point["x"]) - float(point["y"])) * half_tile_width + float(canvas["pixelOrigin"]["x"]),
        "y": (float(point["x"]) + float(point["y"])) * half_tile_height + float(canvas["pixelOrigin"]["y"]),
    }


def blender_projected_pixel(
    scene: bpy.types.Scene,
    camera: bpy.types.Object,
    point: Vector,
    width: int,
    height: int,
) -> dict[str, float]:
    projected = world_to_camera_view(scene, camera, point)
    return {
        "x": float(projected.x) * width,
        "y": (1 - float(projected.y)) * height,
    }


def verify_aligned_projection(
    scene: bpy.types.Scene,
    camera: bpy.types.Object,
    recipe: dict[str, Any],
) -> dict[str, Any]:
    canvas = recipe["alignedExport"]["canvas"]
    width = int(canvas["width"])
    height = int(canvas["height"])
    center = aligned_pixel_to_world(width / 2, height / 2, recipe)
    set_camera_target(camera, center)
    # The runtime projection's +X axis points screen-right while the capture
    # camera's right-handed local X points screen-left. Mirror only the export
    # camera on local X; render_aligned_exports restores the capture matrix.
    camera.scale.x = -abs(camera.scale.x)
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    camera.data.ortho_scale = height / aligned_pixels_per_meter(recipe)
    bpy.context.view_layer.update()

    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    samples = [
        ("origin", {"x": 0.0, "y": 0.0}, Vector((0.0, 0.0, 0.0))),
        ("layout-x-unit", {"x": 1.0, "y": 0.0}, Vector((unit, 0.0, 0.0))),
        ("layout-y-unit", {"x": 0.0, "y": 1.0}, Vector((0.0, unit, 0.0))),
    ]
    samples.extend(
        (
            f"layout-bound-{index}",
            point,
            Vector((float(point["x"]) * unit, float(point["y"]) * unit, 0.0)),
        )
        for index, point in enumerate(recipe["layout"]["bounds"])
    )
    evidence: list[dict[str, Any]] = []
    maximum_error = 0.0
    for sample_id, layout_point, world_point in samples:
        expected = layout_to_aligned_pixel(layout_point, recipe)
        if not (0 <= expected["x"] <= width and 0 <= expected["y"] <= height):
            raise RuntimeError(
                f"Aligned export canvas clips {sample_id}: "
                f"expected pixel ({expected['x']:.3f}, {expected['y']:.3f})"
            )
        actual = blender_projected_pixel(scene, camera, world_point, width, height)
        error = math.hypot(actual["x"] - expected["x"], actual["y"] - expected["y"])
        maximum_error = max(maximum_error, error)
        evidence.append(
            {
                "id": sample_id,
                "expectedPixel": {axis: round(value, 6) for axis, value in expected.items()},
                "blenderPixel": {axis: round(value, 6) for axis, value in actual.items()},
                "errorPixels": round(error, 6),
            }
        )
    if maximum_error > EXPORT_PIXEL_TOLERANCE:
        raise RuntimeError(
            "Aligned export camera does not reproduce the declared runtime projection: "
            f"maximum error {maximum_error:.6f}px"
        )
    return {
        "tolerancePixels": EXPORT_PIXEL_TOLERANCE,
        "maximumErrorPixels": round(maximum_error, 6),
        "samples": evidence,
    }


def verify_renderable_scene_extents(
    scene: bpy.types.Scene,
    camera: bpy.types.Object,
    recipe: dict[str, Any],
    collections: Sequence[bpy.types.Collection],
) -> dict[str, Any]:
    canvas = recipe["alignedExport"]["canvas"]
    width = int(canvas["width"])
    height = int(canvas["height"])
    minimum_x = float("inf")
    minimum_y = float("inf")
    maximum_x = float("-inf")
    maximum_y = float("-inf")
    sampled_objects = 0
    clipped: list[str] = []
    seen: set[str] = set()
    for target_collection in collections:
        for obj in target_collection.all_objects:
            if obj.name in seen or obj.type != "MESH":
                continue
            seen.add(obj.name)
            sampled_objects += 1
            object_clipped = False
            for corner in obj.bound_box:
                pixel = blender_projected_pixel(
                    scene,
                    camera,
                    obj.matrix_world @ Vector(corner),
                    width,
                    height,
                )
                minimum_x = min(minimum_x, pixel["x"])
                minimum_y = min(minimum_y, pixel["y"])
                maximum_x = max(maximum_x, pixel["x"])
                maximum_y = max(maximum_y, pixel["y"])
                if not (
                    -EXPORT_PIXEL_TOLERANCE <= pixel["x"] <= width + EXPORT_PIXEL_TOLERANCE
                    and -EXPORT_PIXEL_TOLERANCE <= pixel["y"] <= height + EXPORT_PIXEL_TOLERANCE
                ):
                    object_clipped = True
            if object_clipped:
                clipped.append(obj.name)
    if clipped:
        sample = ", ".join(clipped[:5])
        suffix = "" if len(clipped) <= 5 else f" and {len(clipped) - 5} more"
        raise RuntimeError(f"Aligned export canvas clips renderable scene geometry: {sample}{suffix}")
    if sampled_objects == 0:
        raise RuntimeError("Aligned export scene extent proof found no renderable mesh objects")
    return {
        "sampledMeshObjects": sampled_objects,
        "pixelBounds": {
            "minX": round(minimum_x, 6),
            "minY": round(minimum_y, 6),
            "maxX": round(maximum_x, 6),
            "maxY": round(maximum_y, 6),
        },
    }


def create_flat_export_material(
    name: str,
    color: tuple[float, float, float, float],
) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = (*color[:3], 1.0)
    emission.inputs["Strength"].default_value = 1.0
    if color[3] >= 1:
        links.new(emission.outputs["Emission"], output.inputs["Surface"])
    else:
        transparent = nodes.new("ShaderNodeBsdfTransparent")
        mix = nodes.new("ShaderNodeMixShader")
        mix.inputs[0].default_value = color[3]
        links.new(transparent.outputs["BSDF"], mix.inputs[1])
        links.new(emission.outputs["Emission"], mix.inputs[2])
        links.new(mix.outputs["Shader"], output.inputs["Surface"])
        if hasattr(material, "surface_render_method"):
            material.surface_render_method = "BLENDED"
        elif hasattr(material, "blend_method"):
            material.blend_method = "BLEND"
    material.diffuse_color = color
    return material


def create_constant_overlay_compositor(
    scene: bpy.types.Scene,
    state: str,
    color: tuple[float, float, float, float],
) -> bpy.types.NodeTree:
    node_group = bpy.data.node_groups.new(f"GET204 export lighting {state}", "CompositorNodeTree")
    node_group.interface.new_socket(name="Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    color_node = node_group.nodes.new("CompositorNodeRGB")
    color_node.outputs["Color"].default_value = (*color[:3], 1.0)
    alpha_node = node_group.nodes.new("CompositorNodeSetAlpha")
    alpha_node.inputs["Alpha"].default_value = color[3]
    output_node = node_group.nodes.new("NodeGroupOutput")
    node_group.links.new(color_node.outputs["Color"], alpha_node.inputs["Image"])
    node_group.links.new(alpha_node.outputs["Image"], output_node.inputs["Image"])
    scene.compositing_node_group = node_group
    return node_group


def circle_polygon(center: dict[str, float], radius: float, segments: int = 24) -> list[dict[str, float]]:
    return [
        {
            "x": float(center["x"]) + math.cos(index / segments * math.tau) * radius,
            "y": float(center["y"]) + math.sin(index / segments * math.tau) * radius,
        }
        for index in range(segments)
    ]


def build_semantic_mask_geometry(
    mask_id: str,
    layout: dict[str, Any],
    recipe: dict[str, Any],
    target_collection: bpy.types.Collection,
) -> bpy.types.Material:
    material = create_flat_export_material(f"GET204 export {mask_id}", (1.0, 1.0, 1.0, 1.0))
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    polygons: list[tuple[str, Sequence[dict[str, float]]]] = []
    if mask_id == "mask.level0.walkable":
        polygons.extend(
            (surface["id"], surface["polygon"])
            for surface in layout["surfaces"]
            if surface["walkable"]
        )
    elif mask_id == "mask.level0.blocked":
        polygons.extend(
            (footprint["id"], footprint["polygon"])
            for footprint in layout["buildingFootprints"]
        )
    elif mask_id == "mask.level0.occlusion":
        polygons.extend(
            (f"occluder.{index}", polygon)
            for index, polygon in enumerate(layout["occluders"])
        )
    elif mask_id == "mask.level0.interaction":
        interaction_kinds = {"entrance", "contact", "terminal", "hiding", "blending", "objective", "interaction"}
        polygons.extend(
            (
                anchor["id"],
                circle_polygon(anchor["position"], float(anchor["radius"])),
            )
            for anchor in layout["anchors"]
            if anchor["kind"] in interaction_kinds
        )
    elif mask_id == "mask.level0.surveillance":
        polygons.extend(
            (region["id"], region["polygon"])
            for region in layout["droneRegions"]
        )
        polygons.extend(
            (
                anchor["id"],
                circle_polygon(anchor["position"], float(anchor["radius"])),
            )
            for anchor in layout["anchors"]
            if anchor["kind"] in {"camera", "drone-launch"}
        )
    else:
        raise RuntimeError(f"Unsupported aligned semantic mask: {mask_id}")

    for index, (polygon_id, polygon) in enumerate(polygons):
        create_prism(
            f"GET204.export.{mask_id}.{index:02d}.{polygon_id}",
            polygon,
            unit,
            -0.002,
            0.0,
            material,
            target_collection,
        )
    return material


def clear_export_helpers(target_collection: bpy.types.Collection) -> None:
    for obj in list(target_collection.objects):
        mesh = obj.data if isinstance(obj.data, bpy.types.Mesh) else None
        bpy.data.objects.remove(obj, do_unlink=True)
        if mesh is not None and mesh.users == 0:
            bpy.data.meshes.remove(mesh)


def export_layer_stem(layer: dict[str, Any]) -> str:
    if layer["kind"] in {"ground", "architecture-back", "architecture-front"}:
        return str(layer["kind"])
    if layer["kind"] == "lighting-foundation":
        return f"lighting-{layer['state']}"
    if layer["kind"] == "semantic-mask":
        return f"semantic/{str(layer['maskId']).replace('.', '-')}"
    raise RuntimeError(f"Unsupported aligned export layer kind: {layer['kind']}")


def configure_export_image_settings(scene: bpy.types.Scene, extension: str) -> None:
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.use_file_extension = True
    if extension == "webp":
        scene.render.image_settings.file_format = "WEBP"
        scene.render.image_settings.quality = COLOR_EXPORT_QUALITY
    elif extension == "png":
        scene.render.image_settings.file_format = "PNG"
        scene.render.image_settings.compression = 100
    else:
        raise RuntimeError(f"Unsupported aligned export image extension: {extension}")


def render_aligned_layer_tiles(
    scene: bpy.types.Scene,
    camera: bpy.types.Object,
    export_root: Path,
    recipe: dict[str, Any],
    layer: dict[str, Any],
) -> tuple[list[dict[str, Any]], list[Path]]:
    canvas = recipe["alignedExport"]["canvas"]
    budget = recipe["alignedExport"]["budget"]
    width = int(canvas["width"])
    height = int(canvas["height"])
    tile_size = int(canvas["tileSize"])
    columns = math.ceil(width / tile_size)
    rows = math.ceil(height / tile_size)
    extension = "png" if layer["kind"] == "semantic-mask" else "webp"
    configure_export_image_settings(scene, extension)
    stem = export_layer_stem(layer)
    tiles: list[dict[str, Any]] = []
    outputs: list[Path] = []
    pixels_per_meter = aligned_pixels_per_meter(recipe)
    for row in range(rows):
        for column in range(columns):
            x = column * tile_size
            y = row * tile_size
            tile_width = min(tile_size, width - x)
            tile_height = min(tile_size, height - y)
            target = aligned_pixel_to_world(x + tile_width / 2, y + tile_height / 2, recipe)
            set_camera_target(camera, target)
            scene.render.resolution_x = tile_width
            scene.render.resolution_y = tile_height
            camera.data.ortho_scale = tile_height / pixels_per_meter
            relative_path = Path("environment/level0/t4") / stem / f"{column}-{row}.{extension}"
            output = export_root / relative_path
            output.parent.mkdir(parents=True, exist_ok=True)
            scene.render.filepath = str(output)
            bpy.ops.render.render(write_still=True)
            byte_size = output.stat().st_size
            if byte_size > int(budget["maxTileBytes"]):
                raise RuntimeError(
                    f"Aligned export tile exceeds {budget['maxTileBytes']} bytes: "
                    f"{relative_path} ({byte_size} bytes)"
                )
            tiles.append(
                {
                    "id": f"{layer['id']}.{column}.{row}",
                    "column": column,
                    "row": row,
                    "x": x,
                    "y": y,
                    "width": tile_width,
                    "height": tile_height,
                    "imagePath": relative_path.as_posix(),
                    "sha256": sha256_file(output),
                    "byteSize": byte_size,
                }
            )
            outputs.append(output)
    return tiles, outputs


def write_anchor_metadata(
    export_root: Path,
    recipe: dict[str, Any],
    layout: dict[str, Any],
) -> tuple[Path, dict[str, Any]]:
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    anchors = []
    for anchor in layout["anchors"]:
        entry: dict[str, Any] = {
            "id": anchor["id"],
            "kind": anchor["kind"],
            "required": bool(anchor["required"]),
            "radiusLayoutUnits": anchor["radius"],
            "layoutPosition": anchor["position"],
            "worldPositionMeters": {
                "x": float(anchor["position"]["x"]) * unit,
                "y": float(anchor["position"]["y"]) * unit,
                "z": 0,
            },
            "pixelPosition": {
                axis: round(value, 6)
                for axis, value in layout_to_aligned_pixel(anchor["position"], recipe).items()
            },
        }
        if "ownerId" in anchor:
            entry["ownerId"] = anchor["ownerId"]
        if "tags" in anchor:
            entry["tags"] = anchor["tags"]
        anchors.append(entry)
    payload = {
        "schemaVersion": 1,
        "recipeId": recipe["id"],
        "layoutContractId": layout["id"],
        "projection": {
            "tileWidth": recipe["camera"]["tileWidth"],
            "tileHeight": recipe["camera"]["tileHeight"],
            "orientation": "isometric-2:1",
            "pixelOrigin": recipe["alignedExport"]["canvas"]["pixelOrigin"],
        },
        "anchors": anchors,
    }
    relative_path = Path("environment/level0/t4/anchors.json")
    output = export_root / relative_path
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return output, {
        "path": relative_path.as_posix(),
        "sha256": sha256_file(output),
        "count": len(anchors),
    }


def assert_no_source_path_leak(payload: str, label: str) -> None:
    forbidden_markers = ("/Volumes/", "\\Volumes\\", ".fbx", ".obj", ".mtl", ".blend")
    if any(marker.lower() in payload.lower() for marker in forbidden_markers):
        raise RuntimeError(f"{label} leaks a raw source or generated-scene path")


def render_aligned_exports(
    scene: bpy.types.Scene,
    camera: bpy.types.Object,
    generated_root: Path,
    layout: dict[str, Any],
    recipe: dict[str, Any],
    ground_collection: bpy.types.Collection,
    architecture_back: bpy.types.Collection,
    architecture_front: bpy.types.Collection,
    gameplay_structures: bpy.types.Collection,
    proof_collection: bpy.types.Collection,
) -> list[Path]:
    export_root = generated_root / "aligned-export"
    if export_root.exists():
        if export_root.name != "aligned-export" or export_root.parent != generated_root:
            raise RuntimeError(f"Refusing to replace unexpected aligned export root: {export_root}")
        shutil.rmtree(export_root)
    export_root.mkdir(parents=True, exist_ok=True)

    managed_collections = [
        ground_collection,
        architecture_back,
        architecture_front,
        gameplay_structures,
        proof_collection,
    ]
    collection_visibility = {item.name: item.hide_render for item in managed_collections}
    helper_collection = collection(EXPORT_HELPERS_COLLECTION, scene.collection)
    camera_matrix = camera.matrix_world.copy()
    camera_ortho_scale = float(camera.data.ortho_scale)
    original_compositor = scene.compositing_node_group
    temporary_compositors: list[bpy.types.NodeTree] = []
    render_state = {
        "resolution_x": scene.render.resolution_x,
        "resolution_y": scene.render.resolution_y,
        "filepath": scene.render.filepath,
        "film_transparent": scene.render.film_transparent,
        "file_format": scene.render.image_settings.file_format,
        "color_mode": scene.render.image_settings.color_mode,
        "color_depth": scene.render.image_settings.color_depth,
        "quality": scene.render.image_settings.quality,
        "compression": scene.render.image_settings.compression,
        "view_transform": scene.view_settings.view_transform,
        "look": scene.view_settings.look,
        "exposure": scene.view_settings.exposure,
        "gamma": scene.view_settings.gamma,
    }
    outputs: list[Path] = []
    art_layers: list[dict[str, Any]] = []
    projection_evidence: dict[str, Any] = {}
    anchor_registration: dict[str, Any] = {}
    lighting_colors = {
        "dusk": (0.32, 0.22, 0.16, 0.12),
        "blue-hour": (0.12, 0.18, 0.24, 0.14),
        "curfew": (0.04, 0.055, 0.08, 0.20),
    }

    def show_only(visible: set[str]) -> None:
        for item in managed_collections:
            item.hide_render = item.name not in visible
        helper_collection.hide_render = helper_collection.name not in visible
        bpy.context.view_layer.update()

    try:
        scene.render.film_transparent = True
        projection_evidence = verify_aligned_projection(scene, camera, recipe)
        projection_evidence["renderableScene"] = verify_renderable_scene_extents(
            scene,
            camera,
            recipe,
            [ground_collection, architecture_back, architecture_front, gameplay_structures],
        )
        anchor_path, anchor_registration = write_anchor_metadata(export_root, recipe, layout)
        anchor_payload = anchor_path.read_text(encoding="utf-8")
        assert_no_source_path_leak(anchor_payload, "aligned anchor metadata")

        for layer in recipe["layers"]:
            clear_export_helpers(helper_collection)
            helper_material: bpy.types.Material | None = None
            temporary_compositor: bpy.types.NodeTree | None = None
            scene.compositing_node_group = original_compositor
            if layer["kind"] == "ground":
                show_only({ground_collection.name})
            elif layer["kind"] == "architecture-back":
                show_only({architecture_back.name})
            elif layer["kind"] == "architecture-front":
                show_only({architecture_front.name, gameplay_structures.name})
            elif layer["kind"] == "lighting-foundation":
                show_only({helper_collection.name})
                state = str(layer["state"])
                if state not in lighting_colors:
                    raise RuntimeError(f"Unsupported neutral lighting-foundation state: {state}")
                temporary_compositor = create_constant_overlay_compositor(
                    scene,
                    state,
                    lighting_colors[state],
                )
                temporary_compositors.append(temporary_compositor)
                scene.view_settings.view_transform = "Standard"
                scene.view_settings.exposure = 0
                scene.view_settings.gamma = 1
            elif layer["kind"] == "semantic-mask":
                show_only({helper_collection.name})
                helper_material = build_semantic_mask_geometry(
                    str(layer["maskId"]),
                    layout,
                    recipe,
                    helper_collection,
                )
                scene.view_settings.view_transform = "Standard"
                scene.view_settings.exposure = 0
                scene.view_settings.gamma = 1
            else:
                raise RuntimeError(f"Unsupported aligned export layer: {layer['id']}")

            tiles, layer_outputs = render_aligned_layer_tiles(
                scene,
                camera,
                export_root,
                recipe,
                layer,
            )
            art_layer = {
                "id": layer["id"],
                "kind": layer["kind"],
                "tiles": tiles,
                "fallbackLayerId": layer["fallbackLayerId"],
            }
            if "state" in layer:
                art_layer["state"] = layer["state"]
            if "maskId" in layer:
                art_layer["maskId"] = layer["maskId"]
            art_layers.append(art_layer)
            outputs.extend(layer_outputs)
            clear_export_helpers(helper_collection)
            if helper_material is not None and helper_material.users == 0:
                bpy.data.materials.remove(helper_material)
            if temporary_compositor is not None:
                scene.compositing_node_group = original_compositor
                bpy.data.node_groups.remove(temporary_compositor)
                temporary_compositors.remove(temporary_compositor)

            scene.view_settings.view_transform = render_state["view_transform"]
            try:
                scene.view_settings.look = render_state["look"]
            except TypeError:
                pass
            scene.view_settings.exposure = render_state["exposure"]
            scene.view_settings.gamma = render_state["gamma"]

        measured_total_bytes = sum(tile["byteSize"] for layer in art_layers for tile in layer["tiles"])
        budget = recipe["alignedExport"]["budget"]
        if measured_total_bytes > int(budget["maxTotalBytes"]):
            raise RuntimeError(
                f"Aligned export exceeds {budget['maxTotalBytes']} bytes: {measured_total_bytes} bytes"
            )
        canvas = recipe["alignedExport"]["canvas"]
        manifest = {
            "schemaVersion": 1,
            "id": "level0-tokyo-t4-aligned-export-v1",
            "usage": "local-evidence",
            "recipeId": recipe["id"],
            "layoutContractId": layout["id"],
            "projection": {
                "tileWidth": recipe["camera"]["tileWidth"],
                "tileHeight": recipe["camera"]["tileHeight"],
                "orientation": "isometric-2:1",
            },
            "worldOrigin": {
                "x": recipe["coordinateSystem"]["origin"]["x"],
                "y": recipe["coordinateSystem"]["origin"]["y"],
            },
            "canvas": {
                "width": canvas["width"],
                "height": canvas["height"],
                "pixelOrigin": canvas["pixelOrigin"],
                "tileSize": canvas["tileSize"],
                "columns": math.ceil(int(canvas["width"]) / int(canvas["tileSize"])),
                "rows": math.ceil(int(canvas["height"]) / int(canvas["tileSize"])),
            },
            "budget": {
                "maxTotalBytes": budget["maxTotalBytes"],
                "maxTileBytes": budget["maxTileBytes"],
                "measuredTotalBytes": measured_total_bytes,
            },
            "layers": art_layers,
            "anchorMetadata": anchor_registration,
            "fallbackProfile": recipe["alignedExport"]["fallbackProfile"],
            "projectionVerification": projection_evidence,
            "licenseBoundary": "flattened-derivatives-only; raw source and generated scene remain ignored",
        }
        manifest_payload = json.dumps(manifest, indent=2) + "\n"
        assert_no_source_path_leak(manifest_payload, "aligned art manifest")
        manifest_path = export_root / "art-manifest.json"
        manifest_path.write_text(manifest_payload, encoding="utf-8")
    finally:
        clear_export_helpers(helper_collection)
        bpy.data.collections.remove(helper_collection, do_unlink=True)
        scene.compositing_node_group = original_compositor
        for temporary_compositor in list(temporary_compositors):
            bpy.data.node_groups.remove(temporary_compositor)
        for item in managed_collections:
            item.hide_render = collection_visibility[item.name]
        camera.matrix_world = camera_matrix
        camera.data.ortho_scale = camera_ortho_scale
        scene.render.resolution_x = render_state["resolution_x"]
        scene.render.resolution_y = render_state["resolution_y"]
        scene.render.filepath = render_state["filepath"]
        scene.render.film_transparent = render_state["film_transparent"]
        scene.render.image_settings.file_format = render_state["file_format"]
        scene.render.image_settings.color_mode = render_state["color_mode"]
        scene.render.image_settings.color_depth = render_state["color_depth"]
        scene.render.image_settings.quality = render_state["quality"]
        scene.render.image_settings.compression = render_state["compression"]
        scene.view_settings.view_transform = render_state["view_transform"]
        try:
            scene.view_settings.look = render_state["look"]
        except TypeError:
            pass
        scene.view_settings.exposure = render_state["exposure"]
        scene.view_settings.gamma = render_state["gamma"]
        bpy.context.view_layer.update()
    return outputs


def write_metadata(
    generated_root: Path,
    source: dict[str, Any],
    recipe: dict[str, Any],
    layout: dict[str, Any],
    building_measurements: Sequence[dict[str, Any]],
    prop_measurements: Sequence[dict[str, Any]],
    renders: Sequence[Path],
    scene_path: Path,
) -> None:
    metadata = {
        "schemaVersion": 1,
        "ticket": "GET-204",
        "purpose": "Ignored local unchanged-kit composition evidence; not a publish manifest.",
        "blender": {"version": bpy.app.version_string, "buildHash": bpy.app.build_hash.decode("utf-8")},
        "source": {
            "vendor": source["vendor"],
            "kit": source["kit"],
            "archiveSha256": source["archiveSha256"],
            "geometryMemberSha256": source["geometryMember"]["sha256"],
            "exactEntitlementEvidence": source["ownership"]["exactEntitlementEvidence"],
        },
        "recipe": {
            "id": recipe["id"],
            "layoutContractId": recipe["layout"]["contractId"],
            "layoutContractSha256": recipe["layout"]["contractSha256"],
            "camera": recipe["camera"],
            "runtimeFollowTargetLiftMeters": runtime_follow_target_lift_meters(recipe),
            "captureCalibration": [
                {
                    "id": capture["id"],
                    "sensorFit": recipe["camera"]["sensorFit"],
                    "zoom": capture["zoom"],
                    "orthoScaleMeters": capture["height"] / (
                        (recipe["camera"]["tileWidth"] / 2 / (
                            recipe["coordinateSystem"]["layoutUnitMeters"] / math.sqrt(2)
                        )) * float(capture["zoom"]) * PIXEL_DENSITY_MARGIN
                    ),
                }
                for capture in recipe["captures"]
            ],
            "lighting": recipe["lighting"],
        },
        "layout": {
            "bounds": layout["bounds"],
            "traversalLoopIds": [loop["id"] for loop in layout["traversalLoops"]],
            "surfaceCount": len(layout["surfaces"]),
            "footprintCount": len(layout["buildingFootprints"]),
            "anchorCount": len(layout["anchors"]),
        },
        "buildingPlacements": list(building_measurements),
        "gameplayPropPlacements": list(prop_measurements),
        "renders": [str(path.relative_to(generated_root)) for path in renders],
        "scene": str(scene_path.relative_to(generated_root)),
        "commitBoundary": "generated-source-derived-artifacts-remain-ignored",
    }
    (generated_root / "master-scene-metadata.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    args = parse_args()
    if tuple(bpy.app.version) != EXPECTED_BLENDER_VERSION:
        raise RuntimeError(
            f"GET-204 requires Blender {'.'.join(map(str, EXPECTED_BLENDER_VERSION))}; found {bpy.app.version_string}"
        )
    repo_root, source_root, archive = validate_environment(args)
    source_path = repo_root / "art/blender/get204/manifests/source-manifest.json"
    recipe_path = repo_root / "art/blender/get204/manifests/scene-recipe.json"
    layout_path = repo_root / "art/iso-assets/contracts/level0-layout-contract.json"
    source = read_json(source_path)
    recipe = read_json(recipe_path)
    layout_export = read_json(layout_path)
    layout = layout_export["contract"]
    if sha256_file(layout_path) != recipe["layout"]["contractSha256"]:
        raise RuntimeError("Scene recipe references a stale Level 0 layout-contract export")
    if source["archiveSha256"] != "802ec8c3d46afb61493df59c598492b516cec2b02285556dc9e1d0520dd1286f":
        raise RuntimeError("Source manifest drifts from the approved Neo Tokyo archive")
    if any(float(recipe["coordinateSystem"]["origin"][axis]) != 0 for axis in ("x", "y", "z")):
        raise RuntimeError("Scene recipe origin must remain aligned to the gameplay layout origin")
    for asset in source["selectedAssets"]:
        if asset["sourceUpAxis"] != "Y" or float(asset["normalize"]["sourceUnitsPerMeter"]) != 1:
            raise RuntimeError(f"{asset['id']} drifts from the verified FBX axis or unit scale")

    fbx_path = stage_source(repo_root, source_root, archive)
    scene = reset_scene()
    imported = import_fbx(fbx_path)
    groups = group_buildings(imported)

    master = collection(MASTER_COLLECTION, scene.collection)
    ground_collection = collection(GROUND_COLLECTION, master)
    architecture_back = collection(ARCHITECTURE_BACK_COLLECTION, master)
    architecture_front = collection(ARCHITECTURE_FRONT_COLLECTION, master)
    gameplay_structures = collection(GAMEPLAY_STRUCTURES_COLLECTION, master)
    proof_collection = collection(PROOF_COLLECTION, master)

    building_measurements, kept_buildings = transform_buildings(
        imported,
        groups,
        source,
        recipe,
        architecture_back,
        architecture_front,
    )
    prop_measurements, _ = transform_gameplay_props(
        imported,
        source,
        recipe,
        gameplay_structures,
    )
    remove_unselected_source_objects(imported, kept_buildings)
    build_public_realm(layout, recipe, source, ground_collection)
    build_scale_and_entrance_proof(layout, recipe, proof_collection)

    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    target = Vector(
        (
            sum(point["x"] for point in layout["bounds"]) / len(layout["bounds"]) * unit,
            sum(point["y"] for point in layout["bounds"]) / len(layout["bounds"]) * unit,
            6.0,
        )
    )
    camera = configure_scene(scene, target, recipe)
    generated_root = repo_root / "art/blender/get204/.generated"
    generated_root.mkdir(parents=True, exist_ok=True)
    renders: list[Path] = []
    if args.mode in ("preview", "all"):
        renders.append(render_preview(scene, camera, generated_root, args.preview_width, args.preview_height, target))
    if args.mode in ("captures", "all"):
        renders.extend(render_captures(scene, camera, generated_root, layout, recipe))
    if args.mode in ("exports", "all"):
        renders.extend(
            render_aligned_exports(
                scene,
                camera,
                generated_root,
                layout,
                recipe,
                ground_collection,
                architecture_back,
                architecture_front,
                gameplay_structures,
                proof_collection,
            )
        )

    scene_path = generated_root / "get204-level0-master.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(scene_path), compress=True)
    write_metadata(
        generated_root,
        source,
        recipe,
        layout,
        building_measurements,
        prop_measurements,
        renders,
        scene_path,
    )
    print(
        f"GET-204 master scene complete: {len(building_measurements)} buildings, "
        f"{len(prop_measurements)} gameplay structures, {len(layout['surfaces'])} surfaces, "
        f"{len(renders)} renders -> {generated_root}"
    )


if __name__ == "__main__":
    main()
