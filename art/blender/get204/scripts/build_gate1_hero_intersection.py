#!/usr/bin/env python3
"""Build GET-204 Gate 1 as registered, flattened live-runtime layers.

Neo Tokyo 2 source geometry is imported only inside Blender and remains under
the ignored .generated boundary. The tracked outputs are a deterministic
recipe/script plus flattened WebP derivatives created from these PNG layers.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
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
)


GROUND_Z = 0.0
BUILDING_Z = 0.12
OUTPUT_NAMES = (
    "ground",
    "architecture-back",
    "front-south-west",
    "front-south-east",
    "front-far-west",
    "front-far-east",
)
BUILDING_EXCLUSIONS = {"StoneFloor", "Asphalt", "Grass", "TileDamage"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the GET-204 Gate 1 hero intersection.")
    parser.add_argument("--repo-root", type=Path, default=Path(__file__).resolve().parents[4])
    parser.add_argument(
        "--source-root",
        type=Path,
        default=os.environ.get("GETAWAY_NEO_TOKYO_ROOT"),
        required=os.environ.get("GETAWAY_NEO_TOKYO_ROOT") is None,
    )
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
    result = bpy.data.collections.new(name)
    parent.children.link(result)
    return result


def move_to_collection(obj: bpy.types.Object, target: bpy.types.Collection) -> None:
    if target not in obj.users_collection:
        target.objects.link(obj)
    for current in list(obj.users_collection):
        if current != target:
            current.objects.unlink(obj)


def material(
    name: str,
    color: tuple[float, float, float, float],
    roughness: float = 0.7,
    metallic: float = 0.0,
    emission: tuple[float, float, float, float] | None = None,
    emission_strength: float = 0.0,
) -> bpy.types.Material:
    result = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    result.use_nodes = True
    shader = result.node_tree.nodes.get("Principled BSDF") if result.node_tree else None
    if shader:
        shader.inputs["Base Color"].default_value = color
        shader.inputs["Roughness"].default_value = roughness
        shader.inputs["Metallic"].default_value = metallic
        if "Coat Weight" in shader.inputs:
            shader.inputs["Coat Weight"].default_value = 0.22 if roughness < 0.4 else 0.04
        if emission is not None and "Emission Color" in shader.inputs:
            shader.inputs["Emission Color"].default_value = emission
            shader.inputs["Emission Strength"].default_value = emission_strength
    return result


def cube(
    name: str,
    location: tuple[float, float, float],
    dimensions: tuple[float, float, float],
    target: bpy.types.Collection,
    surface: bpy.types.Material,
    rotation_degrees: float = 0,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    result = bpy.context.object
    result.name = name
    result.dimensions = dimensions
    result.rotation_euler[2] = math.radians(rotation_degrees)
    result.data.materials.append(surface)
    move_to_collection(result, target)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return result


def cylinder(
    name: str,
    location: tuple[float, float, float],
    radius: float,
    depth: float,
    target: bpy.types.Collection,
    surface: bpy.types.Material,
    vertices: int = 16,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    result = bpy.context.object
    result.name = name
    result.data.materials.append(surface)
    move_to_collection(result, target)
    return result


def layout_xy(point: dict[str, float], unit: float) -> tuple[float, float]:
    return float(point["x"]) * unit, float(point["y"]) * unit


def add_rect(
    name: str,
    bounds: tuple[float, float, float, float],
    z: float,
    height: float,
    unit: float,
    target: bpy.types.Collection,
    surface: bpy.types.Material,
) -> bpy.types.Object:
    min_x, min_y, max_x, max_y = bounds
    return cube(
        name,
        ((min_x + max_x) * unit / 2, (min_y + max_y) * unit / 2, z + height / 2),
        ((max_x - min_x) * unit, (max_y - min_y) * unit, height),
        target,
        surface,
    )


def add_street_light(
    name: str,
    x: float,
    y: float,
    target: bpy.types.Collection,
    pole_material: bpy.types.Material,
    glow_material: bpy.types.Material,
    lights: bpy.types.Collection,
) -> None:
    cylinder(f"{name}.pole", (x, y, 2.25), 0.08, 4.5, target, pole_material, 12)
    cube(f"{name}.arm", (x + 0.45, y, 4.35), (0.9, 0.08, 0.08), target, pole_material)
    cube(f"{name}.fixture", (x + 0.87, y, 4.25), (0.32, 0.24, 0.15), target, glow_material)
    light_data = bpy.data.lights.new(f"{name}.warm-light", "POINT")
    light_data.energy = 760
    light_data.color = (1.0, 0.52, 0.24)
    light_data.shadow_soft_size = 2.2
    light = bpy.data.objects.new(f"{name}.warm-light", light_data)
    light.location = (x + 0.87, y, 4.05)
    lights.objects.link(light)


def add_practical_light(
    name: str,
    x: float,
    y: float,
    z: float,
    energy: float,
    lights: bpy.types.Collection,
    color: tuple[float, float, float] = (1.0, 0.46, 0.19),
    radius: float = 2.4,
) -> None:
    light_data = bpy.data.lights.new(name, "POINT")
    light_data.energy = energy
    light_data.color = color
    light_data.shadow_soft_size = radius
    light = bpy.data.objects.new(name, light_data)
    light.location = (x, y, z)
    lights.objects.link(light)


def add_camera(
    name: str,
    x: float,
    y: float,
    rotation_degrees: float,
    target: bpy.types.Collection,
    dark: bpy.types.Material,
    tech: bpy.types.Material,
) -> None:
    cylinder(f"{name}.mast", (x, y, 2.2), 0.09, 4.4, target, dark, 12)
    cube(f"{name}.head", (x, y, 4.35), (0.52, 0.35, 0.28), target, dark, rotation_degrees)
    radians = math.radians(rotation_degrees)
    lens_x = x + math.cos(radians) * 0.27
    lens_y = y + math.sin(radians) * 0.27
    cylinder(f"{name}.lens", (lens_x, lens_y, 4.35), 0.085, 0.1, target, tech, 16)


def add_transit_shelter(
    x: float,
    y: float,
    target: bpy.types.Collection,
    dark: bpy.types.Material,
    glass: bpy.types.Material,
    bone: bpy.types.Material,
) -> None:
    cube("GET204.G1.transit.roof", (x, y, 2.65), (5.8, 2.2, 0.18), target, dark)
    for side in (-1, 1):
        cube(
            f"GET204.G1.transit.post.{side}",
            (x + side * 2.65, y, 1.35),
            (0.12, 0.12, 2.7),
            target,
            bone,
        )
    cube("GET204.G1.transit.glass", (x, y + 0.94, 1.4), (5.3, 0.05, 2.35), target, glass)
    cube("GET204.G1.transit.bench", (x, y + 0.25, 0.55), (3.5, 0.5, 0.12), target, bone)


def add_verifier_booth(
    x: float,
    y: float,
    target: bpy.types.Collection,
    shell: bpy.types.Material,
    glass: bpy.types.Material,
    tech: bpy.types.Material,
) -> None:
    cube("GET204.G1.booth.shell", (x, y, 1.45), (3.1, 2.45, 2.9), target, shell)
    cube("GET204.G1.booth.window.south", (x, y + 1.231, 1.75), (2.3, 0.035, 0.95), target, glass)
    cube("GET204.G1.booth.window.west", (x - 1.551, y, 1.75), (0.035, 1.6, 0.95), target, glass)
    cube("GET204.G1.booth.tech", (x - 1.57, y - 0.7, 1.45), (0.05, 0.46, 0.7), target, tech)
    cube("GET204.G1.booth.roof", (x, y, 2.98), (3.45, 2.8, 0.18), target, shell)


def add_service_van(
    x: float,
    y: float,
    target: bpy.types.Collection,
    shell: bpy.types.Material,
    dark: bpy.types.Material,
    glass: bpy.types.Material,
) -> None:
    cube("GET204.G1.van.body", (x, y, 1.15), (4.6, 1.9, 1.8), target, shell)
    cube("GET204.G1.van.cab", (x + 1.65, y, 1.3), (1.15, 1.86, 1.45), target, shell)
    cube("GET204.G1.van.windshield", (x + 2.245, y, 1.55), (0.04, 1.5, 0.64), target, glass)
    for wheel_x in (-1.45, 1.5):
        for wheel_y in (-0.96, 0.96):
            cylinder(
                f"GET204.G1.van.wheel.{wheel_x}.{wheel_y}",
                (x + wheel_x, y + wheel_y, 0.5),
                0.38,
                0.16,
                target,
                dark,
                16,
            ).rotation_euler[0] = math.pi / 2


def add_planter(
    name: str,
    x: float,
    y: float,
    target: bpy.types.Collection,
    concrete: bpy.types.Material,
    foliage: bpy.types.Material,
) -> None:
    cube(f"{name}.box", (x, y, 0.38), (1.4, 0.72, 0.75), target, concrete)
    for index, offset in enumerate((-0.4, 0, 0.4)):
        cylinder(f"{name}.plant.{index}", (x + offset, y, 1.0), 0.28, 0.75, target, foliage, 8)


def add_bench(
    name: str,
    x: float,
    y: float,
    target: bpy.types.Collection,
    frame: bpy.types.Material,
    seat: bpy.types.Material,
    rotation_degrees: float = 0,
) -> None:
    cube(f"{name}.seat", (x, y, 0.58), (2.0, 0.52, 0.12), target, seat, rotation_degrees)
    cube(f"{name}.back", (x, y + 0.22, 1.0), (2.0, 0.1, 0.86), target, seat, rotation_degrees)
    for offset in (-0.72, 0.72):
        cube(f"{name}.leg.{offset}", (x + offset, y, 0.3), (0.1, 0.42, 0.6), target, frame, rotation_degrees)


def add_bike_rack(
    name: str,
    x: float,
    y: float,
    target: bpy.types.Collection,
    frame: bpy.types.Material,
) -> None:
    for index, offset in enumerate((-0.65, 0.0, 0.65)):
        cylinder(f"{name}.post.{index}.a", (x + offset, y - 0.22, 0.48), 0.035, 0.95, target, frame, 10)
        cylinder(f"{name}.post.{index}.b", (x + offset, y + 0.22, 0.48), 0.035, 0.95, target, frame, 10)
        cube(f"{name}.rail.{index}", (x + offset, y, 0.91), (0.07, 0.48, 0.07), target, frame)


def add_bollard_row(
    name: str,
    start: tuple[float, float],
    end: tuple[float, float],
    count: int,
    target: bpy.types.Collection,
    frame: bpy.types.Material,
    warning: bpy.types.Material,
) -> None:
    for index in range(count):
        factor = index / max(1, count - 1)
        x = start[0] + (end[0] - start[0]) * factor
        y = start[1] + (end[1] - start[1]) * factor
        cylinder(f"{name}.{index}.post", (x, y, 0.58), 0.11, 1.16, target, frame, 12)
        cylinder(f"{name}.{index}.band", (x, y, 0.82), 0.116, 0.12, target, warning, 12)


def add_low_rise_gapfill(
    name: str,
    x: float,
    y: float,
    width: float,
    depth: float,
    height: float,
    target: bpy.types.Collection,
    shell: bpy.types.Material,
    frame: bpy.types.Material,
    glass: bpy.types.Material,
    warm: bpy.types.Material,
) -> None:
    cube(f"{name}.shell", (x, y, height / 2), (width, depth, height), target, shell)
    cube(f"{name}.roof", (x, y, height + 0.12), (width + 0.25, depth + 0.25, 0.24), target, frame)
    cube(f"{name}.plinth", (x, y + depth / 2 + 0.035, 0.52), (width + 0.12, 0.09, 1.04), target, frame)
    for side in (-1, 1):
        cube(
            f"{name}.corner.{side}",
            (x + side * (width / 2 - 0.14), y + depth / 2 + 0.06, height / 2),
            (0.28, 0.12, height - 0.35),
            target,
            frame,
        )
    floor_count = max(2, int(height // 2.5))
    for floor in range(floor_count):
        z = 1.45 + floor * 2.25
        if z > height - 0.45:
            break
        north_modules = max(2, int(width // 2.0))
        for module in range(north_modules):
            offset = (module - (north_modules - 1) / 2) * min(1.55, width / north_modules)
            cube(
                f"{name}.window.north.{floor}.{module}",
                (x + offset, y + depth / 2 + 0.055, z),
                (max(0.58, width / north_modules - 0.32), 0.07, 0.86),
                target,
                warm if (floor + module) % 4 == 0 else glass,
            )
        east_modules = max(2, int(depth // 2.4))
        for module in range(east_modules):
            offset = (module - (east_modules - 1) / 2) * min(1.75, depth / east_modules)
            cube(
                f"{name}.window.east.{floor}.{module}",
                (x + width / 2 + 0.055, y + offset, z),
                (0.07, max(0.58, depth / east_modules - 0.36), 0.86),
                target,
                warm if (floor + module) % 5 == 0 else glass,
            )
    cube(f"{name}.door", (x + width * 0.18, y + depth / 2 + 0.025, 1.1), (0.92, 0.05, 2.15), target, frame)
    cube(f"{name}.shopfront", (x - width * 0.16, y + depth / 2 + 0.06, 1.15), (width * 0.48, 0.08, 1.68), target, glass)
    cube(f"{name}.awning", (x, y + depth / 2 + 0.52, 2.55), (width * 0.86, 0.98, 0.12), target, frame)
    cube(f"{name}.sign", (x - width * 0.27, y + depth / 2 + 0.055, 3.25), (0.5, 0.06, 0.9), target, warm)
    cube(f"{name}.roof-unit", (x + width * 0.18, y - depth * 0.08, height + 0.55), (1.15, 1.35, 0.82), target, frame)
    cylinder(f"{name}.roof-vent", (x - width * 0.22, y - depth * 0.18, height + 0.55), 0.28, 0.9, target, frame, 14)
    cylinder(f"{name}.service-pipe", (x - width / 2 - 0.08, y + depth * 0.12, height * 0.44), 0.07, height * 0.78, target, frame, 10)


def build_ground(
    recipe: dict[str, Any],
    target: bpy.types.Collection,
) -> list[bpy.types.Object]:
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    asphalt = material("GET204 G1 wet asphalt", (0.028, 0.038, 0.052, 1), 0.2, 0.04)
    concrete = material("GET204 G1 damp concrete", (0.125, 0.135, 0.145, 1), 0.58)
    curb = material("GET204 G1 curb", (0.23, 0.22, 0.205, 1), 0.58)
    lot = material("GET204 G1 lot", (0.04, 0.048, 0.06, 1), 0.48)
    marking = material("GET204 G1 road marking", (0.62, 0.57, 0.43, 1), 0.5)
    crossing = material("GET204 G1 crossing", (0.72, 0.68, 0.58, 1), 0.48)
    puddle = material("GET204 G1 puddle", (0.025, 0.055, 0.075, 1), 0.08, 0.08)
    shadow = material("GET204 G1 contact shadow", (0.018, 0.02, 0.025, 1), 0.98)
    region = recipe["region"]
    created = [
        add_rect("GET204.G1.substrate", (region["minX"], region["minY"], region["maxX"], region["maxY"]), -0.14, 0.14, unit, target, lot),
        add_rect("GET204.G1.road.public", (35, 28.5, 82, 31.5), 0.0, 0.06, unit, target, asphalt),
        add_rect("GET204.G1.road.controlled", (57.8, 8, 60.8, 28.5), 0.0, 0.06, unit, target, asphalt),
        add_rect("GET204.G1.road.south-link", (57.4, 31.5, 61.0, 43.0), 0.0, 0.06, unit, target, asphalt),
        add_rect("GET204.G1.road.background", (35, 12.0, 82, 15.0), 0.0, 0.055, unit, target, asphalt),
        add_rect("GET204.G1.road.west-link", (38.2, 15.0, 41.1, 28.5), 0.0, 0.055, unit, target, asphalt),
        add_rect("GET204.G1.road.east-link", (76.1, 15.0, 79.0, 28.5), 0.0, 0.055, unit, target, asphalt),
        add_rect("GET204.G1.road.foreground", (35, 43.0, 82, 46.0), 0.0, 0.055, unit, target, asphalt),
        add_rect("GET204.G1.alley.service", (70.8, 19, 82, 28.5), 0.0, 0.055, unit, target, asphalt),
        add_rect("GET204.G1.sidewalk.public.north", (35, 26.55, 82, 28.5), 0.0, 0.14, unit, target, concrete),
        add_rect("GET204.G1.sidewalk.public.south", (35, 31.5, 82, 33.45), 0.0, 0.14, unit, target, concrete),
        add_rect("GET204.G1.sidewalk.controlled.west", (55.9, 8, 57.8, 28.5), 0.0, 0.14, unit, target, concrete),
        add_rect("GET204.G1.sidewalk.controlled.east", (60.8, 8, 62.7, 28.5), 0.0, 0.14, unit, target, concrete),
        add_rect("GET204.G1.sidewalk.south-link.west", (55.55, 31.5, 57.4, 43.0), 0.0, 0.14, unit, target, concrete),
        add_rect("GET204.G1.sidewalk.south-link.east", (61.0, 31.5, 62.85, 43.0), 0.0, 0.14, unit, target, concrete),
        add_rect("GET204.G1.sidewalk.background.north", (35, 10.2, 82, 12.0), 0.0, 0.14, unit, target, concrete),
        add_rect("GET204.G1.sidewalk.background.south", (35, 15.0, 82, 16.8), 0.0, 0.14, unit, target, concrete),
        add_rect("GET204.G1.sidewalk.foreground.north", (35, 41.2, 82, 43.0), 0.0, 0.14, unit, target, concrete),
        add_rect("GET204.G1.sidewalk.foreground.south", (35, 46.0, 82, 47.8), 0.0, 0.14, unit, target, concrete),
        add_rect("GET204.G1.sidewalk.service", (70.8, 26.6, 82, 28.5), 0.0, 0.14, unit, target, concrete),
    ]
    for y in (28.5, 31.5):
        created.append(add_rect(f"GET204.G1.curb.public.{y}", (35, y - 0.04, 82, y + 0.04), 0.06, 0.17, unit, target, curb))
    for x in (57.8, 60.8):
        created.append(add_rect(f"GET204.G1.curb.controlled.{x}", (x - 0.04, 8, x + 0.04, 28.5), 0.06, 0.17, unit, target, curb))
    for y in (12.0, 15.0, 43.0, 46.0):
        created.append(add_rect(f"GET204.G1.curb.secondary.{y}", (35, y - 0.04, 82, y + 0.04), 0.06, 0.17, unit, target, curb))
    for index in range(7):
        x0 = 58.02 + index * 0.38
        created.append(add_rect(f"GET204.G1.crossing.{index}", (x0, 28.75, x0 + 0.18, 31.25), 0.07, 0.02, unit, target, crossing))
    for start_x in (36.0, 39.6, 43.2, 46.8, 50.4, 54.0, 62.0, 65.6, 69.2, 72.8, 76.4, 80.0):
        created.append(add_rect(f"GET204.G1.lane.{start_x}", (start_x, 29.94, min(start_x + 1.7, 81.5), 30.06), 0.07, 0.018, unit, target, marking))
    # Repeated curb seams and asphalt repairs provide material scale without decorative noise.
    for index, x in enumerate((36.5, 41.5, 46.5, 51.5, 66.5, 71.5, 76.5)):
        created.append(add_rect(f"GET204.G1.sidewalk-seam.north.{index}", (x, 26.6, x + 0.025, 28.45), 0.145, 0.012, unit, target, curb))
        created.append(add_rect(f"GET204.G1.sidewalk-seam.south.{index}", (x, 31.55, x + 0.025, 33.4), 0.145, 0.012, unit, target, curb))
    road_repairs = [
        (40.2, 29.0, 44.0, 29.42),
        (50.0, 30.6, 53.5, 31.0),
        (64.0, 28.9, 68.8, 29.28),
        (74.0, 30.55, 78.8, 30.92),
        (58.15, 19.1, 58.55, 23.8),
    ]
    for index, bounds in enumerate(road_repairs):
        created.append(add_rect(f"GET204.G1.asphalt-repair.{index}", bounds, 0.061, 0.01, unit, target, lot))
    puddles = [
        (45.2, 28.9, 49.3, 29.35),
        (63.0, 30.7, 67.1, 31.15),
        (58.15, 17.5, 58.6, 21.2),
        (70.9, 24.4, 72.8, 25.0),
    ]
    for index, bounds in enumerate(puddles):
        created.append(add_rect(f"GET204.G1.puddle.{index}", bounds, 0.065, 0.009, unit, target, puddle))
    shadows = [
        (46.8, 19.4, 56.1, 26.9),
        (61.0, 19.7, 71.2, 26.8),
        (47.0, 32.0, 55.9, 40.1),
        (61.6, 32.1, 71.0, 40.0),
    ]
    for index, bounds in enumerate(shadows):
        shifted = (bounds[0] - 0.35, bounds[1] + 0.35, bounds[2] - 0.15, bounds[3] + 0.75)
        created.append(add_rect(f"GET204.G1.shadow.{index}", shifted, 0.068, 0.012, unit, target, shadow))
    return created


def selected_building_members(objects: Sequence[bpy.types.Object], prefix: str) -> list[bpy.types.Object]:
    return [
        obj
        for obj in objects
        if obj.name == prefix or obj.name.startswith(f"{prefix}_")
        if obj.name.split(".", 1)[0].removeprefix(f"{prefix}_") not in BUILDING_EXCLUSIONS
    ]


def place_buildings(
    imported: Sequence[bpy.types.Object],
    groups: dict[str, list[bpy.types.Object]],
    recipe: dict[str, Any],
    targets: dict[str, bpy.types.Collection],
) -> tuple[set[bpy.types.Object], list[dict[str, Any]]]:
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    kept: set[bpy.types.Object] = set()
    evidence: list[dict[str, Any]] = []
    for placement in recipe["buildingPlacements"]:
        prefix = placement["sourcePrefix"]
        objects = selected_building_members(groups[prefix], prefix)
        if not objects:
            raise RuntimeError(f"Missing structural source objects for {prefix}")
        source_bounds = bounds_for(objects)
        source_center = Vector((source_bounds.center[0], source_bounds.center[1], source_bounds.minimum[2]))
        x, y = layout_xy(placement["position"], unit)
        scale = float(placement["uniformScale"])
        transform = (
            Matrix.Translation(Vector((x, y, BUILDING_Z)))
            @ Matrix.Rotation(math.radians(float(placement["rotationDegrees"])), 4, "Z")
            @ Matrix.Scale(scale, 4)
            @ Matrix.Translation(-source_center)
        )
        target = targets[placement["layer"]]
        for obj in objects:
            obj.matrix_world = transform @ obj.matrix_world
            obj["get204_gate1_placement"] = placement["id"]
            move_to_collection(obj, target)
            kept.add(obj)
        placed_bounds = bounds_for(objects)
        evidence.append({
            "id": placement["id"],
            "sourcePrefix": prefix,
            "objectCount": len(objects),
            "uniformScale": scale,
            "rotationDegrees": placement["rotationDegrees"],
            "sourceDimensionsMeters": list(source_bounds.dimensions),
            "placedBoundsMeters": {
                "minimum": list(placed_bounds.minimum),
                "maximum": list(placed_bounds.maximum),
                "dimensions": list(placed_bounds.dimensions),
            },
        })
    return kept, evidence


def place_source_props(
    imported: Sequence[bpy.types.Object],
    recipe: dict[str, Any],
    targets: dict[str, bpy.types.Collection],
) -> list[dict[str, Any]]:
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    evidence: list[dict[str, Any]] = []
    for placement in recipe["sourcePropPlacements"]:
        prefix = placement["sourcePrefix"]
        sources = [obj for obj in imported if obj.name == prefix or obj.name.startswith(f"{prefix}_")]
        if not sources:
            raise RuntimeError(f"Missing source prop objects for {prefix}")
        source_bounds = bounds_for(sources)
        source_center = Vector((source_bounds.center[0], source_bounds.center[1], source_bounds.minimum[2]))
        x, y = layout_xy(placement["position"], unit)
        scale = float(placement["uniformScale"])
        transform = (
            Matrix.Translation(Vector((x, y, BUILDING_Z + float(placement["mountLiftMeters"]))))
            @ Matrix.Rotation(math.radians(float(placement["rotationDegrees"])), 4, "Z")
            @ Matrix.Scale(scale, 4)
            @ Matrix.Translation(-source_center)
        )
        created: list[bpy.types.Object] = []
        for source in sources:
            duplicate = source.copy()
            duplicate.data = source.data.copy() if source.data else None
            duplicate.matrix_world = transform @ source.matrix_world
            duplicate.name = f"GET204.G1.{placement['id']}.{source.name}"
            duplicate["get204_gate1_prop"] = placement["id"]
            targets[placement["layer"]].objects.link(duplicate)
            created.append(duplicate)
        placed_bounds = bounds_for(created)
        evidence.append({
            "id": placement["id"],
            "sourcePrefix": prefix,
            "objectCount": len(created),
            "placedBoundsMeters": {
                "minimum": list(placed_bounds.minimum),
                "maximum": list(placed_bounds.maximum),
                "dimensions": list(placed_bounds.dimensions),
            },
        })
    return evidence


def remove_unused_imports(imported: Sequence[bpy.types.Object], kept: set[bpy.types.Object]) -> None:
    for obj in list(imported):
        if obj not in kept:
            bpy.data.objects.remove(obj, do_unlink=True)


def build_original_gap_fills(
    unit: float,
    back: bpy.types.Collection,
    front_sw: bpy.types.Collection,
    front_se: bpy.types.Collection,
    lights: bpy.types.Collection,
) -> None:
    dark = material("GET204 G1 ink metal", (0.025, 0.033, 0.044, 1), 0.52, 0.12)
    shell = material("GET204 G1 institutional shell", (0.075, 0.085, 0.1, 1), 0.68)
    bone = material("GET204 G1 bone metal", (0.3, 0.285, 0.255, 1), 0.6, 0.05)
    glass = material("GET204 G1 dark glass", (0.025, 0.065, 0.085, 0.82), 0.16, 0.08)
    tech = material("GET204 G1 technology cyan", (0.02, 0.18, 0.22, 1), 0.32, 0.08, (0.08, 0.62, 0.72, 1), 2.2)
    warm = material("GET204 G1 sodium practical", (0.17, 0.07, 0.022, 1), 0.38, 0.04, (1.0, 0.28, 0.065, 1), 1.75)
    van = material("GET204 G1 service van", (0.13, 0.2, 0.21, 1), 0.46, 0.08)
    concrete = material("GET204 G1 planter concrete", (0.2, 0.2, 0.18, 1), 0.85)
    foliage = material("GET204 G1 restrained foliage", (0.08, 0.13, 0.1, 1), 0.78)

    add_transit_shelter(54.0 * unit, 27.5 * unit, back, dark, glass, bone)
    add_verifier_booth(60.95 * unit, 26.75 * unit, back, shell, glass, tech)
    add_service_van(67.5 * unit, 29.35 * unit, back, van, dark, glass)

    for index, (lx, ly) in enumerate(((46.1, 27.6), (57.0, 26.9), (62.2, 27.3), (73.2, 27.2), (57.0, 32.6), (72.8, 32.5))):
        add_street_light(f"GET204.G1.lamp.{index}", lx * unit, ly * unit, back, dark, warm, lights)

    add_camera("GET204.G1.camera.public", 60.55 * unit, 26.1 * unit, 205, back, dark, tech)
    add_camera("GET204.G1.camera.service", 71.2 * unit, 25.6 * unit, 160, back, dark, tech)

    for index, (lx, ly) in enumerate(((56.4, 27.2), (62.0, 27.2), (56.2, 32.4), (71.8, 32.5))):
        add_planter(f"GET204.G1.planter.{index}", lx * unit, ly * unit, back, concrete, foliage)

    add_bench("GET204.G1.bench.transit", 52.4 * unit, 27.7 * unit, back, dark, bone)
    add_bench("GET204.G1.bench.public", 64.0 * unit, 32.55 * unit, back, dark, bone)
    add_bike_rack("GET204.G1.bike-rack.public", 50.0 * unit, 32.55 * unit, back, dark)
    add_bollard_row(
        "GET204.G1.bollards.threshold",
        (59.0 * unit, 27.25 * unit),
        (60.25 * unit, 27.25 * unit),
        5,
        back,
        dark,
        warm,
    )

    # Practical pools must be sourced by visible street, threshold, or frontage fixtures.
    for index, (lx, ly, lz, energy) in enumerate(
        (
            (51.7, 27.1, 3.0, 900),
            (55.8, 26.5, 3.2, 980),
            (61.0, 26.1, 3.0, 1150),
            (66.5, 26.7, 3.1, 900),
            (71.5, 26.5, 3.0, 860),
            (51.6, 32.7, 3.0, 840),
            (66.3, 32.7, 3.0, 840),
        )
    ):
        add_practical_light(
            f"GET204.G1.frontage-light.{index}",
            lx * unit,
            ly * unit,
            lz,
            energy,
            lights,
        )

    # Detailed project-owned low rises close the kit frontage without blank slabs.
    add_low_rise_gapfill("GET204.G1.frontage.north-west", 56.25 * unit, 24.0 * unit, 5.8, 12.0, 10.2, back, shell, dark, glass, warm)
    add_low_rise_gapfill("GET204.G1.frontage.north-east", 71.45 * unit, 23.5 * unit, 6.0, 12.5, 10.8, back, shell, dark, glass, warm)
    add_low_rise_gapfill("GET204.G1.frontage.south-west", 56.25 * unit, 36.0 * unit, 5.8, 12.5, 10.5, front_sw, shell, dark, glass, warm)
    add_low_rise_gapfill("GET204.G1.frontage.south-east", 71.45 * unit, 36.0 * unit, 6.0, 12.5, 11.0, front_se, shell, dark, glass, warm)


def point_at(obj: bpy.types.Object, target: Vector) -> None:
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()
    bpy.context.view_layer.update()


def configure_scene(
    scene: bpy.types.Scene,
    recipe: dict[str, Any],
    lights: bpy.types.Collection,
) -> bpy.types.Object:
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.film_transparent = True
    scene.render.resolution_percentage = 100
    scene.render.resolution_x = int(recipe["canvas"]["width"])
    scene.render.resolution_y = int(recipe["canvas"]["height"])
    scene.render.image_settings.compression = 45
    scene.render.use_file_extension = True
    scene.render.engine = "BLENDER_EEVEE"
    if hasattr(scene, "eevee"):
        scene.eevee.taa_render_samples = 64
    scene.view_settings.exposure = 1.45
    scene.view_settings.gamma = 1.0
    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass

    if scene.world is None:
        scene.world = bpy.data.worlds.new("GET204 Gate 1 blue-hour world")
    scene.world.use_nodes = True
    background = scene.world.node_tree.nodes.get("Background") if scene.world.node_tree else None
    if background:
        background.inputs["Color"].default_value = (0.035, 0.055, 0.09, 1)
        background.inputs["Strength"].default_value = 0.62

    width = int(recipe["canvas"]["width"])
    height = int(recipe["canvas"]["height"])
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    tile_width = float(recipe["coordinateSystem"]["projection"]["tileWidth"])
    pixels_per_meter = (tile_width / 2) * math.sqrt(2) / unit
    target_layout = recipe["canvas"]["targetLayoutPosition"]
    target = Vector((float(target_layout["x"]) * unit, float(target_layout["y"]) * unit, 0))

    camera_data = bpy.data.cameras.new("GET204 Gate 1 registered camera")
    camera_data.type = "ORTHO"
    camera_data.sensor_fit = "VERTICAL"
    camera_data.ortho_scale = height / pixels_per_meter
    camera = bpy.data.objects.new("GET204 Gate 1 registered camera", camera_data)
    scene.collection.objects.link(camera)
    scene.camera = camera
    elevation = math.radians(float(recipe["coordinateSystem"]["projection"]["elevationDegrees"]))
    direction = Vector((math.cos(elevation) / math.sqrt(2), math.cos(elevation) / math.sqrt(2), math.sin(elevation)))
    camera.location = target + direction * 650
    point_at(camera, target)
    camera.scale.x = -abs(camera.scale.x)

    sun_data = bpy.data.lights.new("GET204 Gate 1 upper-left sodium sun", "SUN")
    sun_data.energy = 1.95
    sun_data.angle = math.radians(10)
    sun_data.color = (1.0, 0.72, 0.48)
    sun = bpy.data.objects.new("GET204 Gate 1 upper-left sodium sun", sun_data)
    sun.location = target + Vector((-130, 110, 190))
    point_at(sun, target)
    lights.objects.link(sun)

    area_data = bpy.data.lights.new("GET204 Gate 1 blue-hour fill", "AREA")
    area_data.energy = 2800
    area_data.shape = "DISK"
    area_data.size = 120
    area_data.color = (0.4, 0.56, 0.82)
    area = bpy.data.objects.new("GET204 Gate 1 blue-hour fill", area_data)
    area.location = target + Vector((85, -95, 120))
    point_at(area, target)
    lights.objects.link(area)

    return camera


def projected_pixel(
    scene: bpy.types.Scene,
    camera: bpy.types.Object,
    point: Vector,
    width: int,
    height: int,
) -> dict[str, float]:
    projected = world_to_camera_view(scene, camera, point)
    return {"x": float(projected.x) * width, "y": (1 - float(projected.y)) * height}


def verify_registration(
    scene: bpy.types.Scene,
    camera: bpy.types.Object,
    recipe: dict[str, Any],
) -> dict[str, Any]:
    width = int(recipe["canvas"]["width"])
    height = int(recipe["canvas"]["height"])
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    tile_width = float(recipe["coordinateSystem"]["projection"]["tileWidth"])
    tile_height = float(recipe["coordinateSystem"]["projection"]["tileHeight"])
    origin = recipe["canvas"]["pixelOrigin"]
    samples = [(0, 0), (1, 0), (0, 1), (59, 30), (43, 14), (75, 44)]
    evidence: list[dict[str, Any]] = []
    max_error = 0.0
    for x, y in samples:
        expected = {
            "x": origin["x"] + (x - y) * tile_width / 2,
            "y": origin["y"] + (x + y) * tile_height / 2,
        }
        actual = projected_pixel(scene, camera, Vector((x * unit, y * unit, 0)), width, height)
        error = math.hypot(expected["x"] - actual["x"], expected["y"] - actual["y"])
        max_error = max(max_error, error)
        evidence.append({"layout": {"x": x, "y": y}, "expected": expected, "actual": actual, "errorPixels": error})
    if max_error > 0.05:
        raise RuntimeError(f"Gate 1 art registration drifted by {max_error:.6f}px")
    return {"maximumErrorPixels": max_error, "samples": evidence}


def set_visible(visible: set[str], managed: Iterable[bpy.types.Collection]) -> None:
    for item in managed:
        item.hide_render = item.name not in visible
    bpy.context.view_layer.update()


def render_layers(
    scene: bpy.types.Scene,
    generated_root: Path,
    ground: bpy.types.Collection,
    back: bpy.types.Collection,
    front_sw: bpy.types.Collection,
    front_se: bpy.types.Collection,
    front_far_west: bpy.types.Collection,
    front_far_east: bpy.types.Collection,
) -> list[Path]:
    generated_root.mkdir(parents=True, exist_ok=True)
    managed = [ground, back, front_sw, front_se, front_far_west, front_far_east]
    layer_visibility = {
        "ground": {ground.name},
        "architecture-back": {back.name},
        "front-south-west": {front_sw.name},
        "front-south-east": {front_se.name},
        "front-far-west": {front_far_west.name},
        "front-far-east": {front_far_east.name},
    }
    outputs: list[Path] = []
    try:
        for name in OUTPUT_NAMES:
            set_visible(layer_visibility[name], managed)
            output = generated_root / f"{name}.png"
            scene.render.filepath = str(output)
            bpy.ops.render.render(write_still=True)
            outputs.append(output)
    finally:
        set_visible({item.name for item in managed}, managed)
    return outputs


def main() -> None:
    args = parse_args()
    if tuple(bpy.app.version) != EXPECTED_BLENDER_VERSION:
        raise RuntimeError(f"Expected Blender 5.0.1; found {bpy.app.version_string}")
    repo_root, source_root, archive = validate_environment(args)
    recipe_path = repo_root / "art/blender/get204/manifests/gate1-hero-intersection.json"
    recipe = read_json(recipe_path)
    for reference in recipe["references"]:
        path = repo_root / reference["path"]
        if not path.is_file() or sha256_file(path) != reference["sha256"]:
            raise RuntimeError(f"Gate 1 reference drifted: {reference['path']}")

    scene = reset_scene()
    fbx_path = stage_source(repo_root, source_root, archive)
    imported = import_fbx(fbx_path)
    groups = group_buildings(imported)

    master = collection("GET204_GATE1", scene.collection)
    ground = collection("GET204_GATE1_GROUND", master)
    back = collection("GET204_GATE1_ARCHITECTURE_BACK", master)
    front_sw = collection("GET204_GATE1_FRONT_SOUTH_WEST", master)
    front_se = collection("GET204_GATE1_FRONT_SOUTH_EAST", master)
    front_far_west = collection("GET204_GATE1_FRONT_FAR_WEST", master)
    front_far_east = collection("GET204_GATE1_FRONT_FAR_EAST", master)
    lights = collection("GET204_GATE1_LIGHTS", master)
    targets = {
        "architecture-back": back,
        "front-south-west": front_sw,
        "front-south-east": front_se,
        "front-far-west": front_far_west,
        "front-far-east": front_far_east,
    }

    build_ground(recipe, ground)
    kept_buildings, building_evidence = place_buildings(imported, groups, recipe, targets)
    prop_evidence = place_source_props(imported, recipe, targets)
    remove_unused_imports(imported, kept_buildings)
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    build_original_gap_fills(unit, back, front_sw, front_se, lights)
    camera = configure_scene(scene, recipe, lights)
    registration = verify_registration(scene, camera, recipe)

    generated_root = repo_root / "art/blender/get204/.generated/gate1"
    outputs = render_layers(
        scene,
        generated_root,
        ground,
        back,
        front_sw,
        front_se,
        front_far_west,
        front_far_east,
    )
    scene_path = generated_root / "get204-gate1-hero-intersection.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(scene_path), compress=True)

    metadata = {
        "schemaVersion": 1,
        "id": recipe["id"],
        "ticket": "GET-204",
        "purpose": "Gate 1 live-art candidate; requester acceptance remains pending.",
        "blender": {"version": bpy.app.version_string, "buildHash": bpy.app.build_hash.decode("utf-8")},
        "recipe": {"path": str(recipe_path.relative_to(repo_root)), "sha256": sha256_file(recipe_path)},
        "registration": registration,
        "buildings": building_evidence,
        "sourceProps": prop_evidence,
        "outputs": [
            {"path": str(path.relative_to(repo_root)), "sha256": sha256_file(path), "bytes": path.stat().st_size}
            for path in outputs
        ],
        "scene": str(scene_path.relative_to(repo_root)),
        "candidateGeometry": {
            "proofPathRoles": recipe["runtime"]["proofPathRoles"],
            "promoteAfterRequesterAcceptance": True,
        },
        "commitBoundary": recipe["commitBoundary"],
    }
    metadata_path = generated_root / "metadata.json"
    metadata_path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print(
        f"GET-204 Gate 1 built: {len(building_evidence)} kit buildings, "
        f"{len(prop_evidence)} kit prop placements, {len(outputs)} registered layers -> {generated_root}"
    )


if __name__ == "__main__":
    main()
