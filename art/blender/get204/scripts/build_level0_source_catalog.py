#!/usr/bin/env python3
"""Render an untracked visual catalog of the owned Neo Tokyo 2 building roots.

This script never publishes source-derived files. It extracts the preferred FBX
into the ignored GET-204 staging directory, relinks its legacy textures through
an ignored symlink, renders inspection PNGs under `.generated/`, and records
non-geometric measurements used to choose the eventual master-scene assets.

Run through Blender 5.0.1:

  blender --background --factory-startup \
    --python art/blender/get204/scripts/build_level0_source_catalog.py -- \
    --source-root "/Volumes/Elements/Backup/Downloads/Game/Neo Tokyo 2"
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import re
import sys
import zipfile
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable, Sequence

import bpy
from mathutils import Vector


EXPECTED_BLENDER_VERSION = (5, 0, 1)
SOURCE_ARCHIVE_RELATIVE_PATH = Path("obj.zip")
SOURCE_ARCHIVE_SHA256 = "802ec8c3d46afb61493df59c598492b516cec2b02285556dc9e1d0520dd1286f"
FBX_MEMBER = "obj/Kitbash3d_NeoTokyo2-Native.FBX"
FBX_SHA256 = "a9629dfd68021e46bb91ac665f47b4e3d355fb5eb881b0c09ab1943bce02280c"
BUILDING_PREFIX_PATTERN = re.compile(r"^(Large[A-J]|Medium[A-J]|Small[A-J])(?:_|$)")
CATALOG_PREFIXES = tuple(
    f"{size}{letter}"
    for size in ("Large", "Medium", "Small")
    for letter in "ABCDEFGHIJ"
)
STRUCTURAL_EXCLUDED_SUFFIXES = ("StoneFloor", "Asphalt", "Grass", "TileDamage")
RENDER_SIZE = 512


@dataclass(frozen=True)
class Bounds:
    minimum: tuple[float, float, float]
    maximum: tuple[float, float, float]
    dimensions: tuple[float, float, float]
    center: tuple[float, float, float]


@dataclass(frozen=True)
class CatalogEntry:
    prefix: str
    category: str
    source_object_count: int
    vertex_count: int
    triangle_count: int
    bounds: Bounds
    structural_bounds: Bounds
    render: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render the GET-204 Neo Tokyo source catalog.")
    default_repo_root = Path(__file__).resolve().parents[4]
    parser.add_argument("--repo-root", type=Path, default=default_repo_root)
    parser.add_argument(
        "--source-root",
        type=Path,
        default=os.environ.get("GETAWAY_NEO_TOKYO_ROOT"),
        required=os.environ.get("GETAWAY_NEO_TOKYO_ROOT") is None,
    )
    parser.add_argument("--render-size", type=int, default=RENDER_SIZE)
    parser.add_argument(
        "--inventory-only",
        action="store_true",
        help="Refresh measured metadata without rerendering the existing visual catalog.",
    )
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(argv)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def validate_environment(args: argparse.Namespace) -> tuple[Path, Path, Path]:
    if tuple(bpy.app.version) != EXPECTED_BLENDER_VERSION:
        raise RuntimeError(
            f"GET-204 requires Blender {'.'.join(map(str, EXPECTED_BLENDER_VERSION))}; "
            f"found {bpy.app.version_string}"
        )

    repo_root = args.repo_root.expanduser().resolve()
    source_root = args.source_root.expanduser().resolve()
    if not (repo_root / "art/iso-assets/contracts/level0-layout-contract.json").is_file():
        raise RuntimeError(f"Missing gameplay layout contract under {repo_root}")
    archive = source_root / SOURCE_ARCHIVE_RELATIVE_PATH
    if not archive.is_file():
        raise RuntimeError(f"Missing approved source archive: {archive}")
    if sha256_file(archive) != SOURCE_ARCHIVE_SHA256:
        raise RuntimeError("Neo Tokyo 2 source archive hash does not match the recorded inventory")
    texture_root = source_root / "c4d" / "tex"
    if not texture_root.is_dir():
        raise RuntimeError(f"Missing legacy FBX texture set: {texture_root}")
    return repo_root, source_root, archive


def stage_source(repo_root: Path, source_root: Path, archive: Path) -> Path:
    staging_root = repo_root / "art/blender/get204/.staging"
    staging_root.mkdir(parents=True, exist_ok=True)
    fbx_path = staging_root / Path(FBX_MEMBER).name

    if not fbx_path.is_file() or sha256_file(fbx_path) != FBX_SHA256:
        temporary = staging_root / f"{fbx_path.name}.partial"
        with zipfile.ZipFile(archive) as package:
            with package.open(FBX_MEMBER) as source, temporary.open("wb") as destination:
                for chunk in iter(lambda: source.read(1024 * 1024), b""):
                    destination.write(chunk)
        if sha256_file(temporary) != FBX_SHA256:
            temporary.unlink(missing_ok=True)
            raise RuntimeError("Extracted FBX hash does not match the recorded inventory")
        temporary.replace(fbx_path)

    texture_link = staging_root / "KB3DTextures"
    canonical_texture_root = (source_root / "c4d" / "tex").resolve()
    texture_cache = os.environ.get("GETAWAY_NEO_TOKYO_TEXTURE_CACHE")
    expected_texture_root = (
        (Path(texture_cache).expanduser().resolve() / "Textures")
        if texture_cache
        else canonical_texture_root
    )
    if not expected_texture_root.is_dir():
        raise RuntimeError(f"Missing staged texture root: {expected_texture_root}")
    if texture_link.is_symlink():
        current_texture_root = texture_link.resolve()
        if current_texture_root not in {canonical_texture_root, expected_texture_root}:
            raise RuntimeError(f"Refusing to replace unexpected texture symlink: {texture_link}")
        if current_texture_root != expected_texture_root:
            texture_link.unlink()
            texture_link.symlink_to(expected_texture_root, target_is_directory=True)
    elif texture_link.exists():
        raise RuntimeError(f"Refusing to replace unexpected staging content: {texture_link}")
    else:
        texture_link.symlink_to(expected_texture_root, target_is_directory=True)

    return fbx_path


def reset_scene() -> bpy.types.Scene:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
    ):
        for datablock in list(datablocks):
            datablocks.remove(datablock)

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.resolution_percentage = 100
    scene.render.resolution_x = RENDER_SIZE
    scene.render.resolution_y = RENDER_SIZE
    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass
    scene.view_settings.exposure = 1.15
    scene.view_settings.gamma = 1.0
    scene.world = bpy.data.worlds.new("GET204 neutral catalog world") if scene.world is None else scene.world
    scene.world.use_nodes = True
    background = scene.world.node_tree.nodes.get("Background") if scene.world.node_tree else None
    if background:
        background.inputs["Color"].default_value = (0.11, 0.12, 0.135, 1)
        background.inputs["Strength"].default_value = 0.9
    return scene


def import_fbx(fbx_path: Path) -> list[bpy.types.Object]:
    before = set(bpy.context.scene.objects)
    bpy.ops.import_scene.fbx(
        filepath=str(fbx_path),
        global_scale=1.0,
        use_custom_normals=True,
        use_image_search=False,
        use_anim=False,
        axis_forward="-Z",
        axis_up="Y",
    )
    imported = [
        obj
        for obj in bpy.context.scene.objects
        if obj not in before and obj.type == "MESH"
    ]
    if len(imported) < 551:
        raise RuntimeError(f"FBX import returned only {len(imported)} mesh objects; expected at least 551")
    return imported


def group_buildings(objects: Iterable[bpy.types.Object]) -> dict[str, list[bpy.types.Object]]:
    groups: dict[str, list[bpy.types.Object]] = {prefix: [] for prefix in CATALOG_PREFIXES}
    for obj in objects:
        match = BUILDING_PREFIX_PATTERN.match(obj.name)
        if match:
            groups[match.group(1)].append(obj)
    missing = [prefix for prefix, members in groups.items() if not members]
    if missing:
        raise RuntimeError(f"Imported FBX is missing building roots: {', '.join(missing)}")
    return groups


def world_corners(objects: Sequence[bpy.types.Object]) -> list[Vector]:
    return [obj.matrix_world @ Vector(corner) for obj in objects for corner in obj.bound_box]


def bounds_for(objects: Sequence[bpy.types.Object]) -> Bounds:
    corners = world_corners(objects)
    minimum = tuple(min(point[axis] for point in corners) for axis in range(3))
    maximum = tuple(max(point[axis] for point in corners) for axis in range(3))
    dimensions = tuple(maximum[axis] - minimum[axis] for axis in range(3))
    center = tuple((minimum[axis] + maximum[axis]) / 2 for axis in range(3))
    return Bounds(minimum=minimum, maximum=maximum, dimensions=dimensions, center=center)


def structural_members(prefix: str, objects: Sequence[bpy.types.Object]) -> list[bpy.types.Object]:
    excluded_names = {f"{prefix}_{suffix}" for suffix in STRUCTURAL_EXCLUDED_SUFFIXES}
    return [obj for obj in objects if obj.name.split(".", 1)[0] not in excluded_names]


def create_material(name: str, color: tuple[float, float, float, float], roughness: float) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF") if material.node_tree else None
    if shader:
        shader.inputs["Base Color"].default_value = color
        shader.inputs["Roughness"].default_value = roughness
    return material


def create_catalog_stage(scene: bpy.types.Scene) -> tuple[bpy.types.Object, bpy.types.Object, bpy.types.Object]:
    ground_material = create_material("GET204 catalog ground", (0.11, 0.115, 0.12, 1), 0.92)
    actor_material = create_material("GET204 1.8m actor proof", (0.72, 0.66, 0.52, 1), 0.7)

    bpy.ops.mesh.primitive_plane_add(size=2)
    ground = bpy.context.object
    ground.name = "GET204 catalog ground"
    ground.data.materials.append(ground_material)

    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.28, depth=1.35)
    actor = bpy.context.object
    actor.name = "GET204 1.8m actor proof"
    actor.data.materials.append(actor_material)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=0.23)
    head = bpy.context.object
    head.name = "GET204 actor head proof"
    head.data.materials.append(actor_material)

    camera_data = bpy.data.cameras.new("GET204 2:1 catalog camera")
    camera_data.type = "ORTHO"
    camera = bpy.data.objects.new("GET204 2:1 catalog camera", camera_data)
    scene.collection.objects.link(camera)
    scene.camera = camera

    sun_data = bpy.data.lights.new("GET204 neutral upper-left sun", "SUN")
    sun_data.energy = 3.0
    sun_data.color = (1.0, 0.91, 0.79)
    sun = bpy.data.objects.new("GET204 neutral upper-left sun", sun_data)
    sun.rotation_euler = (math.radians(35), 0, math.radians(-45))
    scene.collection.objects.link(sun)

    area_data = bpy.data.lights.new("GET204 neutral fill", "AREA")
    area_data.energy = 1500
    area_data.shape = "DISK"
    area_data.size = 18
    area_data.color = (0.58, 0.66, 0.74)
    area = bpy.data.objects.new("GET204 neutral fill", area_data)
    area.location = (25, -20, 32)
    scene.collection.objects.link(area)

    return ground, actor, head


def point_camera(camera: bpy.types.Object, target: Vector, distance: float = 1000.0) -> None:
    direction = Vector((math.cos(math.radians(30)) / math.sqrt(2),
                        -math.cos(math.radians(30)) / math.sqrt(2),
                        math.sin(math.radians(30))))
    camera.location = target + direction * distance
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
    bpy.context.view_layer.update()


def camera_frame_scale(camera: bpy.types.Object, points: Sequence[Vector], margin: float = 1.16) -> float:
    inverse = camera.matrix_world.inverted()
    local = [inverse @ point for point in points]
    horizontal_span = max(point.x for point in local) - min(point.x for point in local)
    vertical_span = max(point.y for point in local) - min(point.y for point in local)
    return max(vertical_span, horizontal_span) * margin


def set_visible(all_meshes: Sequence[bpy.types.Object], visible: set[bpy.types.Object]) -> None:
    for obj in all_meshes:
        hidden = obj not in visible
        obj.hide_render = hidden
        obj.hide_viewport = hidden


def render_catalog(
    scene: bpy.types.Scene,
    imported_meshes: Sequence[bpy.types.Object],
    groups: dict[str, list[bpy.types.Object]],
    generated_root: Path,
    render_size: int,
    render_images: bool,
) -> list[CatalogEntry]:
    scene.render.resolution_x = render_size
    scene.render.resolution_y = render_size
    render_root = generated_root / "catalog"
    render_root.mkdir(parents=True, exist_ok=True)
    ground, actor, head = create_catalog_stage(scene)
    camera = scene.camera
    if camera is None:
        raise RuntimeError("Catalog camera was not created")

    entries: list[CatalogEntry] = []
    for prefix in CATALOG_PREFIXES:
        members = groups[prefix]
        bounds = bounds_for(members)
        structural = structural_members(prefix, members)
        if not structural:
            raise RuntimeError(f"Catalog root {prefix} has no structural objects")
        structural_bounds = bounds_for(structural)
        minimum = Vector(bounds.minimum)
        maximum = Vector(bounds.maximum)
        center = Vector(bounds.center)
        ground_z = minimum.z
        footprint_span = max(bounds.dimensions[0], bounds.dimensions[1])

        ground.location = (center.x, center.y, ground_z - 0.025)
        ground.scale = (max(8.0, bounds.dimensions[0] * 0.62), max(8.0, bounds.dimensions[1] * 0.62), 1)
        actor.location = (
            maximum.x + max(1.5, footprint_span * 0.045),
            minimum.y - max(1.5, footprint_span * 0.045),
            ground_z + 0.675,
        )
        head.location = (actor.location.x, actor.location.y, ground_z + 1.57)

        visible = set(members) | {ground, actor, head}
        set_visible([*imported_meshes, ground, actor, head], visible)
        target = Vector((center.x, center.y, ground_z + bounds.dimensions[2] * 0.38))
        point_camera(camera, target)
        framing_points = world_corners(members) + world_corners([actor, head])
        camera.data.ortho_scale = camera_frame_scale(camera, framing_points)

        render_path = render_root / f"{prefix}.png"
        if render_images:
            scene.render.filepath = str(render_path)
            bpy.ops.render.render(write_still=True)

        vertex_count = sum(len(obj.data.vertices) for obj in members if isinstance(obj.data, bpy.types.Mesh))
        triangle_count = 0
        for obj in members:
            if isinstance(obj.data, bpy.types.Mesh):
                obj.data.calc_loop_triangles()
                triangle_count += len(obj.data.loop_triangles)
        entries.append(
            CatalogEntry(
                prefix=prefix,
                category=re.match(r"^(Large|Medium|Small)", prefix).group(1).lower(),
                source_object_count=len(members),
                vertex_count=vertex_count,
                triangle_count=triangle_count,
                bounds=bounds,
                structural_bounds=structural_bounds,
                render=str(render_path.relative_to(generated_root)),
            )
        )
        print(f"GET-204 catalog rendered {prefix}: {bounds.dimensions}")

    return entries


def write_inventory(
    generated_root: Path,
    source_root: Path,
    entries: Sequence[CatalogEntry],
    render_size: int,
) -> None:
    inventory = {
        "schemaVersion": 1,
        "ticket": "GET-204",
        "purpose": "Untracked local visual-selection evidence; not a publish manifest.",
        "source": {
            "vendor": "KitBash3D",
            "kit": "Neo Tokyo 2",
            "root": str(source_root),
            "archive": str(SOURCE_ARCHIVE_RELATIVE_PATH),
            "archiveSha256": SOURCE_ARCHIVE_SHA256,
            "member": FBX_MEMBER,
            "memberSha256": FBX_SHA256,
        },
        "blender": {
            "version": bpy.app.version_string,
            "buildHash": bpy.app.build_hash.decode("utf-8"),
        },
        "camera": {
            "type": "orthographic",
            "azimuthDegrees": 45,
            "elevationDegrees": 30,
            "renderSize": [render_size, render_size],
        },
        "actorScaleProofMeters": 1.8,
        "entries": [asdict(entry) for entry in entries],
    }
    inventory_path = generated_root / "catalog-inventory.json"
    inventory_path.write_text(json.dumps(inventory, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    args = parse_args()
    repo_root, source_root, archive = validate_environment(args)
    fbx_path = stage_source(repo_root, source_root, archive)
    scene = reset_scene()
    imported = import_fbx(fbx_path)
    groups = group_buildings(imported)
    generated_root = repo_root / "art/blender/get204/.generated"
    generated_root.mkdir(parents=True, exist_ok=True)
    entries = render_catalog(
        scene,
        imported,
        groups,
        generated_root,
        args.render_size,
        render_images=not args.inventory_only,
    )
    write_inventory(generated_root, source_root, entries, args.render_size)
    if not args.inventory_only:
        scene_path = generated_root / "get204-source-catalog.blend"
        bpy.ops.wm.save_as_mainfile(filepath=str(scene_path), compress=True)
    print(f"GET-204 source catalog complete: {generated_root}")


if __name__ == "__main__":
    main()
