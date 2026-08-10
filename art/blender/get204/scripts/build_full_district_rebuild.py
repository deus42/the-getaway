#!/usr/bin/env python3
"""Build the GET-204 four-block Tokyo mission district from one master scene.

The owned Neo Tokyo 2 FBX remains external. This script duplicates selected
source collections into one coherent city, adds project-owned public realm and
surveillance grammar, and writes only ignored authoring evidence. Runtime
publication is a separate validated step.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import sys
from pathlib import Path
from typing import Any, Iterable, Sequence

import bmesh
import bpy
from mathutils import Matrix, Vector


SCRIPT_DIRECTORY = Path(__file__).resolve().parent
if str(SCRIPT_DIRECTORY) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIRECTORY))

from build_gate1_hero_intersection import (  # noqa: E402
    BUILDING_EXCLUSIONS,
    add_bench,
    add_bike_rack,
    add_bollard_row,
    add_camera,
    add_planter,
    add_practical_light,
    add_service_van,
    add_street_light,
    add_verifier_booth,
    collection,
    cube,
    cylinder,
    material,
    move_to_collection,
    place_source_props,
    point_at,
    read_json,
    sha256_file,
)
from build_level0_source_catalog import (  # noqa: E402
    EXPECTED_BLENDER_VERSION,
    bounds_for,
    group_buildings,
    import_fbx,
    reset_scene,
    stage_source,
    validate_environment,
)


BUILDING_Z = 0.16
GROUND_Z = 0.0
GENERATED_RELATIVE_ROOT = Path("art/blender/get204/.generated/mission-district")
RECIPE_RELATIVE_PATH = Path("art/blender/get204/manifests/mission-district-rebuild.json")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the GET-204 four-block Tokyo mission district.")
    parser.add_argument("--repo-root", type=Path, default=Path(__file__).resolve().parents[4])
    parser.add_argument(
        "--source-root",
        type=Path,
        default=os.environ.get("GETAWAY_NEO_TOKYO_ROOT"),
        required=os.environ.get("GETAWAY_NEO_TOKYO_ROOT") is None,
    )
    parser.add_argument(
        "--mode",
        choices=("massing", "preview", "exports", "all"),
        default="preview",
    )
    parser.add_argument(
        "--view",
        choices=("all", "overview", "safehouse-backstreets", "public-transit-commercial", "logistics-civic-control"),
        default="all",
        help="Render one authoring proof while iterating; final evidence always uses all views.",
    )
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(argv)


def polygon_bounds(polygon: Sequence[dict[str, float]]) -> tuple[float, float, float, float]:
    xs = [float(point["x"]) for point in polygon]
    ys = [float(point["y"]) for point in polygon]
    return min(xs), min(ys), max(xs), max(ys)


def rect_polygon(left: float, top: float, right: float, bottom: float) -> list[dict[str, float]]:
    return [
        {"x": left, "y": top},
        {"x": right, "y": top},
        {"x": right, "y": bottom},
        {"x": left, "y": bottom},
    ]


def add_rect(
    name: str,
    polygon: Sequence[dict[str, float]],
    unit: float,
    bottom_z: float,
    height: float,
    target: bpy.types.Collection,
    surface: bpy.types.Material,
) -> bpy.types.Object:
    left, top, right, bottom = polygon_bounds(polygon)
    return cube(
        name,
        ((left + right) * unit / 2, (top + bottom) * unit / 2, bottom_z + height / 2),
        ((right - left) * unit, (bottom - top) * unit, height),
        target,
        surface,
    )


def procedural_surface_material(
    name: str,
    dark_color: tuple[float, float, float, float],
    light_color: tuple[float, float, float, float],
    roughness: float,
    noise_scale: float,
    bump_strength: float,
    coat_weight: float = 0.0,
) -> bpy.types.Material:
    result = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    result.use_nodes = True
    nodes = result.node_tree.nodes
    links = result.node_tree.links
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    noise = nodes.new("ShaderNodeTexNoise")
    ramp = nodes.new("ShaderNodeValToRGB")
    bump = nodes.new("ShaderNodeBump")
    output.location = (620, 0)
    shader.location = (340, 0)
    ramp.location = (20, 80)
    noise.location = (-220, 40)
    bump.location = (100, -180)

    noise.inputs["Scale"].default_value = noise_scale
    noise.inputs["Detail"].default_value = 5.0
    noise.inputs["Roughness"].default_value = 0.72
    ramp.color_ramp.elements[0].position = 0.26
    ramp.color_ramp.elements[0].color = dark_color
    ramp.color_ramp.elements[1].position = 0.8
    ramp.color_ramp.elements[1].color = light_color
    shader.inputs["Roughness"].default_value = roughness
    if "Coat Weight" in shader.inputs:
        shader.inputs["Coat Weight"].default_value = coat_weight
    if "Coat Roughness" in shader.inputs:
        shader.inputs["Coat Roughness"].default_value = max(0.08, roughness * 0.45)
    bump.inputs["Strength"].default_value = bump_strength
    bump.inputs["Distance"].default_value = 0.12
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], shader.inputs["Base Color"])
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], shader.inputs["Normal"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    return result


def repair_source_materials(
    materials: Iterable[bpy.types.Material],
    source_root: Path,
) -> None:
    texture_root = source_root / "Textures"

    def disconnect_input(
        links: bpy.types.NodeLinks,
        socket: bpy.types.NodeSocket,
    ) -> None:
        for link in list(links):
            if link.to_socket == socket:
                links.remove(link)

    def texture_node(
        nodes: bpy.types.Nodes,
        path: Path,
        label: str,
        color_space: str,
    ) -> bpy.types.Node | None:
        if not path.is_file():
            return None
        image = bpy.data.images.load(str(path), check_existing=True)
        image.colorspace_settings.name = color_space
        node = nodes.new("ShaderNodeTexImage")
        node.name = f"GET204 PBR {label}"
        node.label = label
        node.image = image
        node.interpolation = "Linear"
        return node

    for source in materials:
        if not source.use_nodes or source.node_tree is None:
            continue
        lowered = source.name.lower()
        if lowered.startswith("get204 "):
            continue
        material_key = source.name.split(".", 1)[0]
        texture_stem = f"KB3D_NTT_{material_key}"
        nodes = source.node_tree.nodes
        links = source.node_tree.links
        for node in source.node_tree.nodes:
            if node.bl_idname != "ShaderNodeBsdfPrincipled":
                continue
            base_path = texture_root / f"{texture_stem}_basecolor.jpg"
            if not base_path.is_file():
                base_path = texture_root / f"{texture_stem}_diffuse.jpg"
            base = texture_node(nodes, base_path, f"{material_key} base color", "sRGB")
            roughness = texture_node(
                nodes,
                texture_root / f"{texture_stem}_roughness.jpg",
                f"{material_key} roughness",
                "Non-Color",
            )
            metallic = texture_node(
                nodes,
                texture_root / f"{texture_stem}_metallic.jpg",
                f"{material_key} metallic",
                "Non-Color",
            )
            normal = texture_node(
                nodes,
                texture_root / f"{texture_stem}_normal.jpg",
                f"{material_key} normal",
                "Non-Color",
            )
            ao = texture_node(
                nodes,
                texture_root / f"{texture_stem}_ao.jpg",
                f"{material_key} ambient occlusion",
                "Non-Color",
            )

            if base is not None:
                disconnect_input(links, node.inputs["Base Color"])
                if ao is not None:
                    multiply = nodes.new("ShaderNodeMixRGB")
                    multiply.name = f"GET204 PBR {material_key} base x AO"
                    multiply.blend_type = "MULTIPLY"
                    multiply.inputs[0].default_value = 1.0
                    links.new(base.outputs["Color"], multiply.inputs[1])
                    links.new(ao.outputs["Color"], multiply.inputs[2])
                    links.new(multiply.outputs["Color"], node.inputs["Base Color"])
                else:
                    links.new(base.outputs["Color"], node.inputs["Base Color"])
            if roughness is not None:
                disconnect_input(links, node.inputs["Roughness"])
                links.new(roughness.outputs["Color"], node.inputs["Roughness"])
            else:
                disconnect_input(links, node.inputs["Roughness"])
                node.inputs["Roughness"].default_value = 0.32 if "glass" in lowered else 0.58
            disconnect_input(links, node.inputs["Metallic"])
            if metallic is not None:
                links.new(metallic.outputs["Color"], node.inputs["Metallic"])
            else:
                node.inputs["Metallic"].default_value = 0.0
            if "Specular IOR Level" in node.inputs:
                disconnect_input(links, node.inputs["Specular IOR Level"])
                node.inputs["Specular IOR Level"].default_value = 0.45
            if normal is not None:
                disconnect_input(links, node.inputs["Normal"])
                normal_map = nodes.new("ShaderNodeNormalMap")
                normal_map.name = f"GET204 PBR {material_key} normal map"
                normal_map.inputs["Strength"].default_value = 0.72
                links.new(normal.outputs["Color"], normal_map.inputs["Color"])
                links.new(normal_map.outputs["Normal"], node.inputs["Normal"])
            if "Coat Weight" in node.inputs:
                node.inputs["Coat Weight"].default_value = 0.035
            if any(token in lowered for token in ("light", "lamp", "emiss", "neon", "sign")):
                if "Emission Color" in node.inputs:
                    node.inputs["Emission Color"].default_value = (1.0, 0.36, 0.12, 1)
                if "Emission Strength" in node.inputs:
                    node.inputs["Emission Strength"].default_value = max(
                        4.0,
                        float(node.inputs["Emission Strength"].default_value),
                    )
            if "ads" in lowered and "Emission Color" in node.inputs:
                base_color = node.inputs.get("Base Color")
                source_link = next((link for link in links if link.to_socket == base_color), None)
                if source_link is not None:
                    links.new(source_link.from_socket, node.inputs["Emission Color"])
                if "Emission Strength" in node.inputs:
                    node.inputs["Emission Strength"].default_value = 0.85
            if "glass" in lowered and "Emission Color" in node.inputs:
                node.inputs["Emission Color"].default_value = (0.012, 0.03, 0.05, 1)
                if "Emission Strength" in node.inputs:
                    node.inputs["Emission Strength"].default_value = 0.08


def relink_source_images(
    source_root: Path,
    search_roots: Sequence[str],
) -> list[dict[str, Any]]:
    """Relink every FBX image to the first complete, readable pack texture.

    The legacy ``c4d/tex`` folder on the current archive contains several
    unreadable files. Blender leaves those images at 0x0 and renders saturated
    magenta. The pack also contains a complete ``Textures`` tree, so the recipe
    records and applies that deterministic priority without copying vendor
    textures into the repository.
    """

    evidence: list[dict[str, Any]] = []
    failures: list[str] = []
    for image in bpy.data.images:
        if image.source != "FILE":
            continue
        filename = Path(bpy.path.abspath(image.filepath)).name
        selected: Path | None = None
        for relative_root in search_roots:
            candidate = source_root / relative_root / filename
            try:
                if candidate.is_file():
                    selected = candidate
                    break
            except OSError:
                continue
        if selected is None:
            failures.append(f"{image.name}: no readable source for {filename}")
            continue
        image.filepath = str(selected)
        try:
            image.reload()
        except RuntimeError as error:
            failures.append(f"{image.name}: {error}")
            continue
        width, height = (int(image.size[0]), int(image.size[1]))
        if width <= 0 or height <= 0:
            failures.append(f"{image.name}: {selected} loaded as {width}x{height}")
            continue
        evidence.append({
            "image": image.name,
            "filename": filename,
            "selectedRoot": str(selected.parent.relative_to(source_root)),
            "width": width,
            "height": height,
        })
    if failures:
        raise RuntimeError("Source texture relink failed:\n" + "\n".join(failures))
    return evidence


def selected_building_members(
    objects: Sequence[bpy.types.Object],
    prefix: str,
    excluded_suffixes: Sequence[str] = (),
) -> list[bpy.types.Object]:
    return [
        obj
        for obj in objects
        if obj.name == prefix or obj.name.startswith(f"{prefix}_")
        if obj.name.split(".", 1)[0].removeprefix(f"{prefix}_") not in BUILDING_EXCLUSIONS
        if obj.name.split(".", 1)[0].removeprefix(f"{prefix}_") not in excluded_suffixes
    ]


def crop_mesh_above_world_z(
    obj: bpy.types.Object,
    cutoff_z: float,
) -> tuple[bool, list[Vector]]:
    """Remove source geometry above a registered world-space crop plane."""

    if obj.type != "MESH" or obj.data is None:
        return True
    mesh = obj.data
    editable = bmesh.new()
    editable.from_mesh(mesh)
    if not editable.verts:
        editable.free()
        return False, []
    world_normal = Vector((0.0, 0.0, 1.0))
    plane_co = obj.matrix_world.inverted() @ Vector((0.0, 0.0, cutoff_z))
    plane_no = obj.matrix_world.to_3x3().transposed() @ world_normal
    plane_no.normalize()
    bmesh.ops.bisect_plane(
        editable,
        geom=[*editable.verts, *editable.edges, *editable.faces],
        plane_co=plane_co,
        plane_no=plane_no,
        dist=0.0001,
        clear_outer=True,
        clear_inner=False,
    )
    editable.to_mesh(mesh)
    editable.free()
    mesh.update()
    boundary = []
    for vertex in mesh.vertices:
        world_point = obj.matrix_world @ vertex.co
        if abs(world_point.z - cutoff_z) <= 0.012:
            boundary.append(world_point)
    return len(mesh.vertices) > 0, boundary


def convex_hull_xy(points: Sequence[Vector]) -> list[tuple[float, float]]:
    unique = sorted({(round(point.x, 3), round(point.y, 3)) for point in points})
    if len(unique) <= 2:
        return unique

    def cross(
        origin: tuple[float, float],
        first: tuple[float, float],
        second: tuple[float, float],
    ) -> float:
        return (
            (first[0] - origin[0]) * (second[1] - origin[1])
            - (first[1] - origin[1]) * (second[0] - origin[0])
        )

    lower: list[tuple[float, float]] = []
    for point in unique:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], point) <= 0:
            lower.pop()
        lower.append(point)
    upper: list[tuple[float, float]] = []
    for point in reversed(unique):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], point) <= 0:
            upper.pop()
        upper.append(point)
    return lower[:-1] + upper[:-1]


def cluster_roof_boundary_points(
    points: Sequence[Vector],
    join_distance: float = 3.2,
) -> list[list[Vector]]:
    pending = list(points)
    clusters: list[list[Vector]] = []
    join_distance_squared = join_distance * join_distance
    while pending:
        cluster = [pending.pop()]
        cursor = 0
        while cursor < len(cluster):
            source = cluster[cursor]
            cursor += 1
            connected: list[Vector] = []
            remainder: list[Vector] = []
            for candidate in pending:
                delta_x = source.x - candidate.x
                delta_y = source.y - candidate.y
                if delta_x * delta_x + delta_y * delta_y <= join_distance_squared:
                    connected.append(candidate)
                else:
                    remainder.append(candidate)
            cluster.extend(connected)
            pending = remainder
        clusters.append(cluster)
    return clusters


def polygon_area_xy(points: Sequence[tuple[float, float]]) -> float:
    return abs(sum(
        points[index][0] * points[(index + 1) % len(points)][1]
        - points[(index + 1) % len(points)][0] * points[index][1]
        for index in range(len(points))
    )) / 2


def add_cropped_roof_caps(
    cluster_id: str,
    boundary_points: Sequence[Vector],
    cutoff_z: float,
    target: bpy.types.Collection,
    roof_material: bpy.types.Material,
) -> list[bpy.types.Object]:
    created: list[bpy.types.Object] = []
    for index, point_cluster in enumerate(cluster_roof_boundary_points(boundary_points)):
        hull = convex_hull_xy(point_cluster)
        if len(hull) < 3 or polygon_area_xy(hull) < 3.0:
            continue
        mesh = bpy.data.meshes.new(f"GET204.CITY.{cluster_id}.roof-cap.{index}.mesh")
        mesh.from_pydata(
            [(x, y, cutoff_z + 0.04) for x, y in hull],
            [],
            [list(range(len(hull)))],
        )
        mesh.materials.append(roof_material)
        roof = bpy.data.objects.new(f"GET204.CITY.{cluster_id}.roof-cap.{index}", mesh)
        target.objects.link(roof)
        solidify = roof.modifiers.new(name="GET204 registered roof thickness", type="SOLIDIFY")
        solidify.thickness = 0.24
        solidify.offset = -1
        bevel_object(roof, 0.06)
        roof["get204_cluster_id"] = cluster_id
        roof["get204_cluster_instance"] = 0
        created.append(roof)
        if polygon_area_xy(hull) >= 30:
            center_x = sum(point[0] for point in hull) / len(hull)
            center_y = sum(point[1] for point in hull) / len(hull)
            service = cube(
                f"GET204.CITY.{cluster_id}.roof-service.{index}",
                (center_x, center_y, cutoff_z + 0.48),
                (1.7, 1.2, 0.82),
                target,
                roof_material,
                15 * (index % 3),
            )
            bevel_object(service, 0.08)
            service["get204_cluster_id"] = cluster_id
            service["get204_cluster_instance"] = 0
            created.append(service)
    return created


def place_architectural_clusters(
    groups: dict[str, list[bpy.types.Object]],
    recipe: dict[str, Any],
    architecture: bpy.types.Collection,
) -> list[dict[str, Any]]:
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    evidence: list[dict[str, Any]] = []
    cropped_roof = procedural_surface_material(
        "GET204 cropped-kit roof",
        (0.018, 0.022, 0.026, 1),
        (0.075, 0.068, 0.058, 1),
        0.63,
        3.1,
        0.16,
    )
    for placement in recipe["architecturalClusters"]:
        if placement["artSource"] not in ("owned-kit", "owned-kit-cropped"):
            continue
        prefix = placement["sourcePrefix"]
        excluded_suffixes = recipe["source"].get("objectSuffixExclusions", {}).get(prefix, [])
        sources = selected_building_members(
            groups.get(prefix, []),
            prefix,
            excluded_suffixes,
        )
        if not sources:
            raise RuntimeError(f"Missing structural source collection {prefix}")
        source_bounds = bounds_for(sources)
        registered_plan_bounds = recipe["source"]["structuralPlanBoundsMeters"].get(prefix)
        if not registered_plan_bounds:
            raise RuntimeError(f"Missing registered source-plan bounds for {prefix}")
        if (
            abs(source_bounds.dimensions[0] - float(registered_plan_bounds["width"])) > 0.025
            or abs(source_bounds.dimensions[1] - float(registered_plan_bounds["depth"])) > 0.025
        ):
            raise RuntimeError(
                f"Source-plan bounds drifted for {prefix}: "
                f"{source_bounds.dimensions[0]:.3f}x{source_bounds.dimensions[1]:.3f}m != "
                f"{float(registered_plan_bounds['width']):.3f}x"
                f"{float(registered_plan_bounds['depth']):.3f}m"
            )
        source_center = Vector((source_bounds.center[0], source_bounds.center[1], source_bounds.minimum[2]))
        left, top, right, bottom = polygon_bounds(placement["footprint"])
        rotation = int(placement["rotationDegrees"]) % 180
        source_width = source_bounds.dimensions[1] if rotation == 90 else source_bounds.dimensions[0]
        source_depth = source_bounds.dimensions[0] if rotation == 90 else source_bounds.dimensions[1]
        scale = float(placement["uniformScale"])
        if scale <= 0:
            raise RuntimeError(f"Cluster {placement['id']} resolved a non-positive scale")
        footprint_width = (right - left) * unit
        footprint_depth = (bottom - top) * unit
        if source_width * scale > footprint_width + 1.25 or source_depth * scale > footprint_depth + 1.25:
            raise RuntimeError(
                f"Cluster {placement['id']} exceeds its registered footprint: "
                f"{source_width * scale:.2f}x{source_depth * scale:.2f}m > "
                f"{footprint_width:.2f}x{footprint_depth:.2f}m"
            )
        instance_count = 1
        repeat_axis = "none"
        cluster_collection = collection(f"GET204_CITY_{placement['id'].upper().replace('.', '_')}", architecture)
        created: list[bpy.types.Object] = []
        crop_boundary_points: list[Vector] = []
        for instance_index in range(instance_count):
            placed_width = source_width * scale
            placed_depth = source_depth * scale
            inset = float(placement["streetWallInsetMeters"])
            anchor = placement["placementAnchor"]
            x = (
                left * unit + inset + placed_width / 2
                if anchor.endswith("west")
                else right * unit - inset - placed_width / 2
            )
            y = (
                top * unit + inset + placed_depth / 2
                if anchor.startswith("north")
                else bottom * unit - inset - placed_depth / 2
            )
            transform = (
                Matrix.Translation(Vector((x, y, BUILDING_Z)))
                @ Matrix.Rotation(math.radians(float(placement["rotationDegrees"])), 4, "Z")
                @ Matrix.Scale(scale, 4)
                @ Matrix.Translation(-source_center)
            )
            for source in sources:
                duplicate = source.copy()
                duplicate.data = source.data.copy() if source.data else None
                duplicate.matrix_world = transform @ source.matrix_world
                duplicate.name = (
                    f"GET204.CITY.{placement['id']}.instance-{instance_index}.{source.name}"
                )
                duplicate["get204_cluster_id"] = placement["id"]
                duplicate["get204_cluster_instance"] = instance_index
                cluster_collection.objects.link(duplicate)
                if placement["artSource"] == "owned-kit-cropped":
                    retained, boundary = crop_mesh_above_world_z(
                        duplicate,
                        BUILDING_Z + float(placement["verticalCropMeters"]),
                    )
                    crop_boundary_points.extend(boundary)
                    if not retained:
                        bpy.data.objects.remove(duplicate, do_unlink=True)
                        continue
                created.append(duplicate)
        if placement["artSource"] == "owned-kit-cropped":
            crop_height = float(placement["verticalCropMeters"])
            created.extend(add_cropped_roof_caps(
                placement["id"],
                crop_boundary_points,
                BUILDING_Z + crop_height,
                cluster_collection,
                cropped_roof,
            ))
        placed_bounds = bounds_for(created)
        collision_footprint = rect_polygon(
            placed_bounds.minimum[0] / unit,
            placed_bounds.minimum[1] / unit,
            placed_bounds.maximum[0] / unit,
            placed_bounds.maximum[1] / unit,
        )
        evidence.append({
            "id": placement["id"],
            "sourcePrefix": prefix,
            "artSource": placement["artSource"],
            "sourceObjectCount": len(created),
            "resolvedScale": scale,
            "instanceCount": instance_count,
            "repeatAxis": repeat_axis,
            "requestedScaleCeiling": placement["uniformScale"],
            "placementAnchor": placement["placementAnchor"],
            "streetWallInsetMeters": placement["streetWallInsetMeters"],
            "footprint": placement["footprint"],
            "collisionFootprint": collision_footprint,
            "placedDimensionsMeters": list(placed_bounds.dimensions),
            "placedHeightMeters": placed_bounds.dimensions[2],
        })
    return evidence


def remove_imported_source(imported: Sequence[bpy.types.Object]) -> None:
    for source in list(imported):
        bpy.data.objects.remove(source, do_unlink=True)


def street_rectangle(segment: dict[str, Any]) -> list[dict[str, float]]:
    start, end = segment["centerline"][0], segment["centerline"][-1]
    half_width = float(segment["widthLayoutUnits"]) / 2
    if abs(float(start["x"]) - float(end["x"])) < 0.001:
        return rect_polygon(
            float(start["x"]) - half_width,
            min(float(start["y"]), float(end["y"])),
            float(start["x"]) + half_width,
            max(float(start["y"]), float(end["y"])),
        )
    return rect_polygon(
        min(float(start["x"]), float(end["x"])),
        float(start["y"]) - half_width,
        max(float(start["x"]), float(end["x"])),
        float(start["y"]) + half_width,
    )


def add_sidewalk_pair(
    segment: dict[str, Any],
    unit: float,
    target: bpy.types.Collection,
    sidewalk: bpy.types.Material,
    curb: bpy.types.Material,
    seam: bpy.types.Material,
) -> None:
    start, end = segment["centerline"][0], segment["centerline"][-1]
    half_road = float(segment["widthLayoutUnits"]) / 2
    sidewalk_width = 0.75 if segment["kind"] != "controlled-boulevard" else 1.0
    curb_width = 0.11
    vertical = abs(float(start["x"]) - float(end["x"])) < 0.001
    if vertical:
        center = float(start["x"])
        top = min(float(start["y"]), float(end["y"]))
        bottom = max(float(start["y"]), float(end["y"]))
        strips = [
            rect_polygon(center - half_road - sidewalk_width, top, center - half_road, bottom),
            rect_polygon(center + half_road, top, center + half_road + sidewalk_width, bottom),
        ]
        curbs = [
            rect_polygon(center - half_road - curb_width, top, center - half_road, bottom),
            rect_polygon(center + half_road, top, center + half_road + curb_width, bottom),
        ]
    else:
        left = min(float(start["x"]), float(end["x"]))
        right = max(float(start["x"]), float(end["x"]))
        center = float(start["y"])
        strips = [
            rect_polygon(left, center - half_road - sidewalk_width, right, center - half_road),
            rect_polygon(left, center + half_road, right, center + half_road + sidewalk_width),
        ]
        curbs = [
            rect_polygon(left, center - half_road - curb_width, right, center - half_road),
            rect_polygon(left, center + half_road, right, center + half_road + curb_width),
        ]
    for index, strip in enumerate(strips):
        add_rect(f"GET204.CITY.{segment['id']}.sidewalk.{index}", strip, unit, 0.08, 0.16, target, sidewalk)
        left, top, right, bottom = polygon_bounds(strip)
        seam_position = (top if vertical else left) + 2.0
        seam_limit = bottom if vertical else right
        seam_index = 0
        while seam_position < seam_limit - 0.4:
            seam_polygon = (
                rect_polygon(left, seam_position - 0.018, right, seam_position + 0.018)
                if vertical
                else rect_polygon(seam_position - 0.018, top, seam_position + 0.018, bottom)
            )
            add_rect(
                f"GET204.CITY.{segment['id']}.sidewalk-seam.{index}.{seam_index}",
                seam_polygon,
                unit,
                0.239,
                0.012,
                target,
                seam,
            )
            seam_position += 2.0
            seam_index += 1
    for index, strip in enumerate(curbs):
        add_rect(f"GET204.CITY.{segment['id']}.curb.{index}", strip, unit, 0.075, 0.25, target, curb)


def add_lane_markings(
    segment: dict[str, Any],
    unit: float,
    target: bpy.types.Collection,
    marking: bpy.types.Material,
) -> None:
    if segment["kind"] == "service-alley":
        return
    start, end = segment["centerline"][0], segment["centerline"][-1]
    vertical = abs(float(start["x"]) - float(end["x"])) < 0.001
    length = abs(float(end["y"] - start["y"])) if vertical else abs(float(end["x"] - start["x"]))
    segment_length = 1.5
    gap = 1.3
    cursor = 1.5
    index = 0
    while cursor + segment_length < length - 1.5:
        if vertical:
            x = float(start["x"])
            y = min(float(start["y"]), float(end["y"])) + cursor + segment_length / 2
            dimensions = (0.12 * unit, segment_length * unit, 0.025)
        else:
            x = min(float(start["x"]), float(end["x"])) + cursor + segment_length / 2
            y = float(start["y"])
            dimensions = (segment_length * unit, 0.12 * unit, 0.025)
        cube(
            f"GET204.CITY.{segment['id']}.marking.{index}",
            (x * unit, y * unit, 0.095),
            dimensions,
            target,
            marking,
        )
        cursor += segment_length + gap
        index += 1


def add_crosswalk(
    name: str,
    center: tuple[float, float],
    horizontal: bool,
    unit: float,
    target: bpy.types.Collection,
    marking: bpy.types.Material,
) -> None:
    for index in range(-2, 3):
        offset = index * 0.28
        if horizontal:
            dimensions = (0.12 * unit, 1.35 * unit, 0.026)
            location = ((center[0] + offset) * unit, center[1] * unit, 0.102)
        else:
            dimensions = (1.35 * unit, 0.12 * unit, 0.026)
            location = (center[0] * unit, (center[1] + offset) * unit, 0.102)
        cube(f"GET204.CITY.crosswalk.{name}.{index + 2}", location, dimensions, target, marking)


def build_public_realm(
    recipe: dict[str, Any],
    ground: bpy.types.Collection,
) -> dict[str, bpy.types.Material]:
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    asphalt = procedural_surface_material(
        "GET204 City restrained asphalt",
        (0.022, 0.03, 0.04, 1),
        (0.075, 0.085, 0.095, 1),
        0.58,
        2.4,
        0.14,
        0.03,
    )
    substrate = procedural_surface_material(
        "GET204 City district substrate",
        (0.012, 0.018, 0.026, 1),
        (0.035, 0.045, 0.058, 1),
        0.72,
        1.1,
        0.08,
    )
    block_paving = procedural_surface_material(
        "GET204 City inhabited block paving",
        (0.035, 0.043, 0.052, 1),
        (0.115, 0.105, 0.092, 1),
        0.68,
        4.2,
        0.13,
    )
    alley = procedural_surface_material(
        "GET204 City patched alley",
        (0.025, 0.027, 0.032, 1),
        (0.08, 0.073, 0.064, 1),
        0.42,
        3.4,
        0.2,
        0.12,
    )
    concrete = procedural_surface_material(
        "GET204 City damp concrete",
        (0.12, 0.125, 0.13, 1),
        (0.27, 0.25, 0.225, 1),
        0.58,
        4.8,
        0.16,
    )
    curb = procedural_surface_material(
        "GET204 City worn curb",
        (0.22, 0.205, 0.18, 1),
        (0.39, 0.35, 0.29, 1),
        0.62,
        7.0,
        0.13,
    )
    seam = material("GET204 City sidewalk seams", (0.035, 0.038, 0.042, 1), 0.72)
    marking = material("GET204 City road marking", (0.3, 0.275, 0.225, 1), 0.72)
    repair = material("GET204 City asphalt repair", (0.075, 0.065, 0.06, 1), 0.5)
    metal = material("GET204 City drain metal", (0.055, 0.065, 0.07, 1), 0.36, 0.62)
    puddle = material("GET204 City rain puddle", (0.012, 0.025, 0.035, 1), 0.48, 0.03)
    if puddle.node_tree:
        shader = puddle.node_tree.nodes.get("Principled BSDF")
        if shader and "Coat Weight" in shader.inputs:
            shader.inputs["Coat Weight"].default_value = 0.1

    bounds = recipe["coordinateSystem"]["bounds"]
    add_rect("GET204.CITY.ground.base", bounds, unit, -0.16, 0.16, ground, substrate)

    # Materially occupy each mission block before streets are layered over it.
    # The rejected pass exposed the near-black district substrate between source
    # groups, which read as empty lots instead of inhabited public realm.
    for block in recipe["composition"]["urbanBlocks"]:
        add_rect(
            f"GET204.CITY.{block['id']}.paving",
            block["polygon"],
            unit,
            0.0,
            0.07,
            ground,
            block_paving,
        )

    segments = [
        *recipe["streetHierarchy"]["controlledBoulevards"],
        *recipe["streetHierarchy"]["ordinaryStreets"],
        *recipe["streetHierarchy"]["serviceAlleys"],
    ]
    for segment in segments:
        road_surface = alley if segment["kind"] == "service-alley" else asphalt
        add_rect(
            f"GET204.CITY.{segment['id']}.road",
            street_rectangle(segment),
            unit,
            0.0,
            0.08,
            ground,
            road_surface,
        )
        if segment["kind"] != "service-alley":
            add_sidewalk_pair(segment, unit, ground, concrete, curb, seam)
        add_lane_markings(segment, unit, ground, marking)

    for space in recipe["composition"]["openSpaces"]:
        add_rect(f"GET204.CITY.{space['id']}", space["polygon"], unit, 0.075, 0.14, ground, concrete)

    for name, center, horizontal in (
        ("intersection-west", (26.55, 22), True),
        ("intersection-north", (29, 19.55), False),
    ):
        add_crosswalk(name, center, horizontal, unit, ground, marking)

    repair_patches = (
        (10, 22, 5.5, 0.75),
        (47, 22, 5.0, 0.7),
        (29, 8, 0.7, 4.2),
        (29, 37, 0.75, 3.8),
    )
    for index, (x, y, width, depth) in enumerate(repair_patches):
        cube(
            f"GET204.CITY.road-repair.{index}",
            (x * unit, y * unit, 0.092),
            (width * unit, depth * unit, 0.022),
            ground,
            repair,
        )

    for index, (x, y, radius_x, radius_y) in enumerate((
        (12, 22.6, 0.8, 0.22),
        (43, 21.4, 0.95, 0.24),
        (29.6, 11, 0.22, 0.8),
        (36, 34.7, 0.7, 0.18),
    )):
        puddle_object = cylinder(
            f"GET204.CITY.puddle.{index}",
            (x * unit, y * unit, 0.106),
            1.0,
            0.014,
            ground,
            puddle,
            40,
        )
        puddle_object.scale.x = radius_x * unit
        puddle_object.scale.y = radius_y * unit

    for index, (x, y) in enumerate(((12, 22), (46, 22), (29, 9), (29, 36))):
        cylinder(f"GET204.CITY.manhole.{index}", (x * unit, y * unit, 0.12), 0.48, 0.055, ground, metal, 32)

    for index, (x, y, horizontal) in enumerate((
        (26.9, 10, False),
        (31.1, 15, False),
        (26.9, 30, False),
        (31.1, 38, False),
        (10, 19.9, True),
        (45, 24.1, True),
    )):
        dimensions = (1.4, 0.42, 0.045) if horizontal else (0.42, 1.4, 0.045)
        cube(
            f"GET204.CITY.drain.{index}",
            (x * unit, y * unit, 0.125),
            dimensions,
            ground,
            metal,
        )

    return {
        "asphalt": asphalt,
        "concrete": concrete,
        "curb": curb,
        "marking": marking,
        "metal": metal,
    }


def bevel_object(obj: bpy.types.Object, width: float = 0.12) -> None:
    modifier = obj.modifiers.new(name="GET204 edge wear", type="BEVEL")
    modifier.width = width
    modifier.segments = 2


def add_facade_panel(
    name: str,
    face: str,
    along: float,
    plane: float,
    z: float,
    width: float,
    height: float,
    target: bpy.types.Collection,
    frame: bpy.types.Material,
    pane: bpy.types.Material,
) -> list[bpy.types.Object]:
    outward = 0.13
    if face in ("north", "south"):
        direction = -1 if face == "north" else 1
        frame_object = cube(
            f"{name}.frame",
            (along, plane + direction * outward, z),
            (width + 0.22, 0.18, height + 0.22),
            target,
            frame,
        )
        pane_object = cube(
            f"{name}.pane",
            (along, plane + direction * (outward + 0.1), z),
            (width, 0.08, height),
            target,
            pane,
        )
    else:
        direction = -1 if face == "west" else 1
        frame_object = cube(
            f"{name}.frame",
            (plane + direction * outward, along, z),
            (0.18, width + 0.22, height + 0.22),
            target,
            frame,
        )
        pane_object = cube(
            f"{name}.pane",
            (plane + direction * (outward + 0.1), along, z),
            (0.08, width, height),
            target,
            pane,
        )
    bevel_object(frame_object, 0.055)
    return [frame_object, pane_object]


def add_authored_frontage(
    placement: dict[str, Any],
    unit: float,
    target: bpy.types.Collection,
    lights: bpy.types.Collection,
    surfaces: dict[str, bpy.types.Material],
) -> dict[str, Any]:
    profile = placement["authoredProfile"]
    left, top, right, bottom = polygon_bounds(placement["footprint"])
    left_m = left * unit + 0.55
    right_m = right * unit - 0.55
    top_m = top * unit + 0.55
    bottom_m = bottom * unit - 0.55
    width = right_m - left_m
    depth = bottom_m - top_m
    center_x = (left_m + right_m) / 2
    center_y = (top_m + bottom_m) / 2
    stories = int(profile["stories"])
    ground_height = 4.2
    upper_floor_height = 3.15
    total_height = ground_height + (stories - 1) * upper_floor_height
    frontage = collection(
        f"GET204_CITY_{placement['id'].upper().replace('.', '_')}",
        target,
    )
    created: list[bpy.types.Object] = []

    palette = {
        "transit-cafe": ((0.045, 0.055, 0.062, 1), (0.19, 0.155, 0.12, 1)),
        "corner-shops": ((0.04, 0.048, 0.056, 1), (0.16, 0.18, 0.18, 1)),
        "neighborhood-arcade": ((0.055, 0.042, 0.035, 1), (0.20, 0.13, 0.09, 1)),
        "hidzu-services": ((0.025, 0.04, 0.052, 1), (0.10, 0.17, 0.18, 1)),
    }
    dark_color, light_color = palette[profile["groundUse"]]
    facade = procedural_surface_material(
        f"GET204 authored {profile['groundUse']} facade",
        dark_color,
        light_color,
        0.55,
        5.2,
        0.22,
        0.08,
    )
    plinth = procedural_surface_material(
        f"GET204 authored {profile['groundUse']} plinth",
        (0.025, 0.028, 0.032, 1),
        (0.105, 0.09, 0.075, 1),
        0.62,
        8.0,
        0.18,
    )
    trim = material("GET204 authored facade trim", (0.16, 0.145, 0.12, 1), 0.5, 0.28)
    roof = material("GET204 authored roof", (0.02, 0.025, 0.03, 1), 0.72, 0.08)
    glass = material("GET204 authored dark glass", (0.012, 0.035, 0.045, 1), 0.16, 0.12)
    glass_warm = material(
        "GET204 authored warm interior",
        (0.18, 0.055, 0.012, 1),
        0.22,
        0.04,
        (1.0, 0.22, 0.035, 1),
        0.95,
    )
    glass_cool = material(
        "GET204 authored civic interior",
        (0.012, 0.065, 0.075, 1),
        0.18,
        0.06,
        (0.025, 0.36, 0.46, 1),
        0.8,
    )
    sign_warm = material(
        "GET204 authored amber sign",
        (0.26, 0.075, 0.012, 1),
        0.2,
        0.03,
        (1.0, 0.19, 0.025, 1),
        1.65,
    )
    sign_cyan = material(
        "GET204 authored cyan sign",
        (0.008, 0.09, 0.11, 1),
        0.2,
        0.04,
        (0.018, 0.5, 0.62, 1),
        1.35,
    )

    ground = cube(
        f"GET204.CITY.{placement['id']}.ground-volume",
        (center_x, center_y, BUILDING_Z + ground_height / 2),
        (width, depth, ground_height),
        frontage,
        plinth,
    )
    bevel_object(ground, 0.18)
    created.append(ground)

    upper_height = max(upper_floor_height, total_height - ground_height)
    street_face = profile["streetFace"]
    back_shift = -0.35 if street_face == "south" else 0.35
    upper = cube(
        f"GET204.CITY.{placement['id']}.upper-volume",
        (center_x, center_y + back_shift, ground_height + upper_height / 2),
        (width * 0.94, depth * 0.88, upper_height),
        frontage,
        facade,
    )
    bevel_object(upper, 0.16)
    created.append(upper)

    if profile["silhouette"] in ("stepped", "corner", "civic"):
        cap_width = width * (0.48 if profile["silhouette"] == "stepped" else 0.36)
        cap_depth = depth * 0.46
        cap_x = center_x + (width * 0.19 if profile["secondaryFace"] == "east" else -width * 0.19)
        cap_y = center_y + (-depth * 0.16 if street_face == "south" else depth * 0.16)
        cap = cube(
            f"GET204.CITY.{placement['id']}.roof-house",
            (cap_x, cap_y, total_height + 1.1),
            (cap_width, cap_depth, 2.2),
            frontage,
            facade,
        )
        bevel_object(cap, 0.14)
        created.append(cap)

    ground_front_plane = bottom_m if street_face == "south" else top_m
    upper_front_plane = (
        center_y + back_shift + depth * 0.44
        if street_face == "south"
        else center_y + back_shift - depth * 0.44
    )
    rear_face = "north" if street_face == "south" else "south"
    upper_rear_plane = (
        center_y + back_shift - depth * 0.44
        if street_face == "south"
        else center_y + back_shift + depth * 0.44
    )
    side_face = profile["secondaryFace"]
    side_plane = right_m if side_face == "east" else left_m
    window_count = max(4, int(width / 3.3))
    window_spacing = width / (window_count + 1)
    for floor in range(1, stories):
        floor_z = ground_height + upper_floor_height * (floor - 0.5)
        trim_object = cube(
            f"GET204.CITY.{placement['id']}.floor-trim.{floor}",
            (center_x, upper_front_plane + (0.18 if street_face == "south" else -0.18), ground_height + upper_floor_height * (floor - 1)),
            (width * 0.96, 0.22, 0.18),
            frontage,
            trim,
        )
        created.append(trim_object)
        for index in range(window_count):
            x = left_m + window_spacing * (index + 1)
            selector = (floor * 7 + index * 3 + len(placement["id"])) % 9
            pane = glass_warm if selector in (0, 3) else glass_cool if selector == 6 else glass
            created.extend(add_facade_panel(
                f"GET204.CITY.{placement['id']}.front-window.{floor}.{index}",
                street_face,
                x,
                upper_front_plane,
                floor_z,
                min(1.65, window_spacing * 0.58),
                1.62,
                frontage,
                trim,
                pane,
            ))

    for index in range(window_count + 1):
        x = left_m + width * (index + 0.5) / (window_count + 1)
        pilaster = cube(
            f"GET204.CITY.{placement['id']}.pilaster.{index}",
            (x, upper_front_plane + (0.24 if street_face == "south" else -0.24), ground_height + upper_height / 2),
            (0.18, 0.26, upper_height),
            frontage,
            trim,
        )
        created.append(pilaster)

    for floor in range(1, stories):
        floor_z = ground_height + upper_floor_height * (floor - 0.5)
        for index in range(0, window_count, 2):
            x = left_m + window_spacing * (index + 1)
            pane = glass_warm if (floor * 3 + index) % 7 == 0 else glass
            created.extend(add_facade_panel(
                f"GET204.CITY.{placement['id']}.rear-window.{floor}.{index}",
                rear_face,
                x,
                upper_rear_plane,
                floor_z,
                min(1.45, window_spacing * 0.52),
                1.48,
                frontage,
                trim,
                pane,
            ))

    side_count = max(2, int(depth / 4.5))
    side_spacing = depth / (side_count + 1)
    for floor in range(1, stories):
        floor_z = ground_height + upper_floor_height * (floor - 0.5)
        for face, plane in (("west", left_m), ("east", right_m)):
            for index in range(side_count):
                y = top_m + side_spacing * (index + 1)
                pane = glass_warm if (floor + index + (1 if face == "east" else 0)) % 5 == 0 else glass
                created.extend(add_facade_panel(
                    f"GET204.CITY.{placement['id']}.{face}-window.{floor}.{index}",
                    face,
                    y,
                    plane,
                    floor_z,
                    min(1.45, side_spacing * 0.52),
                    1.52,
                    frontage,
                    trim,
                    pane,
                ))

    storefront_count = max(3, min(6, int(width / 4.8)))
    storefront_spacing = width / storefront_count
    for index in range(storefront_count):
        x = left_m + storefront_spacing * (index + 0.5)
        pane = glass_warm if index % 3 != 1 else glass
        created.extend(add_facade_panel(
            f"GET204.CITY.{placement['id']}.storefront.{index}",
            street_face,
            x,
            ground_front_plane,
            1.82,
            max(1.5, storefront_spacing * 0.66),
            2.42,
            frontage,
            trim,
            pane,
        ))

    face_direction = 1 if street_face == "south" else -1
    awning = cube(
        f"GET204.CITY.{placement['id']}.awning",
        (center_x, ground_front_plane + face_direction * 0.68, 3.55),
        (width * 0.78, 1.35, 0.2),
        frontage,
        trim,
    )
    bevel_object(awning, 0.08)
    created.append(awning)
    sign_surface = sign_cyan if profile["groundUse"] == "hidzu-services" else sign_warm
    sign = cube(
        f"GET204.CITY.{placement['id']}.sign-band",
        (center_x, ground_front_plane + face_direction * 0.22, 3.86),
        (width * 0.58, 0.12, 0.48),
        frontage,
        sign_surface,
    )
    created.append(sign)

    vertical_sign_y = ground_front_plane + face_direction * 0.45
    vertical_sign_x = right_m - 0.65 if side_face == "east" else left_m + 0.65
    vertical_sign = cube(
        f"GET204.CITY.{placement['id']}.vertical-sign",
        (vertical_sign_x, vertical_sign_y, min(total_height - 1.8, 7.2)),
        (0.62, 0.26, 3.1),
        frontage,
        sign_surface,
    )
    created.append(vertical_sign)

    for floor in range(1, min(stories, 4)):
        if (floor + len(placement["id"])) % 2 == 0:
            balcony_x = center_x + (-width * 0.2 if floor % 2 else width * 0.2)
            balcony_z = ground_height + upper_floor_height * floor - 0.18
            balcony = cube(
                f"GET204.CITY.{placement['id']}.balcony.{floor}",
                (balcony_x, upper_front_plane + face_direction * 0.48, balcony_z),
                (width * 0.28, 0.9, 0.16),
                frontage,
                trim,
            )
            rail = cube(
                f"GET204.CITY.{placement['id']}.balcony-rail.{floor}",
                (balcony_x, upper_front_plane + face_direction * 0.88, balcony_z + 0.52),
                (width * 0.28, 0.08, 0.95),
                frontage,
                surfaces["metal"],
            )
            created.extend((balcony, rail))

    roof_z = total_height + 0.32
    parapets = (
        (center_x, top_m + 0.18, width * 0.92, 0.22),
        (center_x, bottom_m - 0.18, width * 0.92, 0.22),
    )
    for index, (x, y, parapet_width, parapet_depth) in enumerate(parapets):
        created.append(cube(
            f"GET204.CITY.{placement['id']}.parapet-y.{index}",
            (x, y, roof_z),
            (parapet_width, parapet_depth, 0.64),
            frontage,
            roof,
        ))
    for index, x in enumerate((left_m + 0.18, right_m - 0.18)):
        created.append(cube(
            f"GET204.CITY.{placement['id']}.parapet-x.{index}",
            (x, center_y, roof_z),
            (0.22, depth * 0.88, 0.64),
            frontage,
            roof,
        ))

    for index, offset in enumerate((-0.18, 0.18)):
        hvac = cube(
            f"GET204.CITY.{placement['id']}.hvac.{index}",
            (center_x + width * offset, center_y, total_height + 0.72),
            (2.0, 1.45, 1.1),
            frontage,
            roof,
        )
        bevel_object(hvac, 0.1)
        created.append(hvac)
    tank = cylinder(
        f"GET204.CITY.{placement['id']}.water-tank",
        (center_x - width * 0.23, center_y - depth * 0.16, total_height + 1.08),
        0.72,
        1.8,
        frontage,
        roof,
        20,
    )
    created.append(tank)

    practical_data = bpy.data.lights.new(
        f"GET204.CITY.{placement['id']}.practical",
        "POINT",
    )
    practical_data.energy = 620
    practical_data.color = (1.0, 0.22, 0.045)
    practical_data.shadow_soft_size = 1.1
    practical = bpy.data.objects.new(practical_data.name, practical_data)
    practical.location = (
        center_x,
        ground_front_plane + face_direction * 1.1,
        3.15,
    )
    lights.objects.link(practical)

    for obj in created:
        obj["get204_cluster_id"] = placement["id"]
        obj["get204_cluster_instance"] = 0
    placed_bounds = bounds_for(created)
    return {
        "id": placement["id"],
        "sourcePrefix": placement["sourcePrefix"],
        "artSource": "project-authored",
        "sourceObjectCount": len(created),
        "resolvedScale": 1,
        "instanceCount": 1,
        "repeatAxis": "none",
        "requestedScaleCeiling": 1,
        "footprint": placement["footprint"],
        "placedDimensionsMeters": list(placed_bounds.dimensions),
        "placedHeightMeters": placed_bounds.dimensions[2],
    }


def build_authored_hero_frontages(
    recipe: dict[str, Any],
    architecture: bpy.types.Collection,
    lights: bpy.types.Collection,
    surfaces: dict[str, bpy.types.Material],
) -> list[dict[str, Any]]:
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    return [
        add_authored_frontage(placement, unit, architecture, lights, surfaces)
        for placement in recipe["architecturalClusters"]
        if placement["artSource"] == "project-authored"
    ]


def add_screen_pylon(
    name: str,
    x: float,
    y: float,
    unit: float,
    target: bpy.types.Collection,
    frame: bpy.types.Material,
    screen: bpy.types.Material,
    rotation: float = 0,
) -> None:
    cube(f"{name}.frame", (x * unit, y * unit, 1.45), (0.78, 0.24, 2.9), target, frame, rotation)
    cube(f"{name}.screen", (x * unit, y * unit - 0.14, 1.62), (0.58, 0.035, 1.72), target, screen, rotation)


def add_compact_transit_shelter(
    name: str,
    x: float,
    y: float,
    unit: float,
    target: bpy.types.Collection,
    frame: bpy.types.Material,
    glass: bpy.types.Material,
    trim: bpy.types.Material,
) -> None:
    center_x = x * unit
    center_y = y * unit
    cube(f"{name}.roof", (center_x, center_y, 2.55), (4.15, 1.55, 0.15), target, frame)
    for index, offset_x in enumerate((-1.82, 0.0, 1.82)):
        cube(
            f"{name}.post.{index}",
            (center_x + offset_x, center_y, 1.28),
            (0.09, 0.09, 2.56),
            target,
            trim,
        )
    cube(f"{name}.glass", (center_x, center_y - 0.66, 1.35), (3.72, 0.05, 2.15), target, glass)
    cube(f"{name}.bench", (center_x, center_y + 0.18, 0.53), (2.75, 0.46, 0.12), target, trim)


def add_hidzu_wall_mark(
    name: str,
    x: float,
    y: float,
    z: float,
    unit: float,
    target: bpy.types.Collection,
    frame: bpy.types.Material,
    lettering: bpy.types.Material,
) -> None:
    """Add restrained project-owned identity to a real KitBash frontage."""

    cube(
        f"{name}.panel",
        (x * unit, y * unit, z),
        (8.4, 0.2, 2.35),
        target,
        frame,
    )
    text_curve = bpy.data.curves.new(f"{name}.letters.curve", type="FONT")
    text_curve.body = "HIDZU"
    text_curve.align_x = "CENTER"
    text_curve.align_y = "CENTER"
    text_curve.size = 1.28
    text_curve.extrude = 0.035
    text_curve.bevel_depth = 0.012
    text_curve.materials.append(lettering)
    text = bpy.data.objects.new(f"{name}.letters", text_curve)
    text.location = (x * unit, y * unit - 0.13, z - 0.03)
    text.rotation_euler[0] = math.radians(90)
    target.objects.link(text)


def add_compact_car(
    name: str,
    x: float,
    y: float,
    rotation: float,
    unit: float,
    target: bpy.types.Collection,
    body: bpy.types.Material,
    dark: bpy.types.Material,
    glass: bpy.types.Material,
    lamp: bpy.types.Material,
) -> None:
    cube(f"{name}.body", (x * unit, y * unit, 0.62), (3.9, 1.75, 0.72), target, body, rotation)
    cube(f"{name}.cabin", (x * unit, y * unit, 1.15), (2.1, 1.48, 0.66), target, glass, rotation)
    cube(f"{name}.lower", (x * unit, y * unit, 0.31), (3.65, 1.6, 0.28), target, dark, rotation)
    radians = math.radians(rotation)
    for side in (-1, 1):
        light_x = x * unit + math.cos(radians) * 1.93 - math.sin(radians) * side * 0.52
        light_y = y * unit + math.sin(radians) * 1.93 + math.cos(radians) * side * 0.52
        cube(
            f"{name}.headlight.{side}",
            (light_x, light_y, 0.64),
            (0.1, 0.22, 0.16),
            target,
            lamp,
            rotation,
        )


def add_cafe_table(
    name: str,
    x: float,
    y: float,
    unit: float,
    target: bpy.types.Collection,
    dark: bpy.types.Material,
    top: bpy.types.Material,
) -> None:
    cylinder(f"{name}.top", (x * unit, y * unit, 1.45), 0.64, 0.12, target, top, 24)
    cylinder(f"{name}.stem", (x * unit, y * unit, 0.76), 0.09, 1.4, target, dark, 12)
    for index, (offset_x, offset_y) in enumerate(((-0.28, 0), (0.28, 0), (0, -0.28))):
        cube(
            f"{name}.chair.{index}",
            ((x + offset_x) * unit, (y + offset_y) * unit, 0.48),
            (0.52, 0.52, 0.82),
            target,
            dark,
        )


def add_contact_stall(
    name: str,
    x: float,
    y: float,
    unit: float,
    target: bpy.types.Collection,
    frame: bpy.types.Material,
    canopy: bpy.types.Material,
    counter: bpy.types.Material,
    practical: bpy.types.Material,
    lights: bpy.types.Collection,
) -> None:
    """Build one mission-owned social/blending frontage, not a building."""

    center_x = x * unit
    center_y = y * unit
    cube(f"{name}.canopy", (center_x, center_y, 2.48), (3.8, 1.72, 0.16), target, canopy)
    for index, (offset_x, offset_y) in enumerate(((-1.7, -0.72), (1.7, -0.72), (-1.7, 0.72), (1.7, 0.72))):
        cube(
            f"{name}.post.{index}",
            (center_x + offset_x, center_y + offset_y, 1.25),
            (0.08, 0.08, 2.5),
            target,
            frame,
        )
    cube(f"{name}.back", (center_x, center_y - 0.72, 1.28), (3.45, 0.1, 2.15), target, frame)
    cube(f"{name}.counter", (center_x, center_y + 0.54, 0.92), (2.9, 0.58, 1.12), target, counter)
    for index, offset_x in enumerate((-0.92, 0.0, 0.92)):
        cube(
            f"{name}.display.{index}",
            (center_x + offset_x, center_y + 0.22, 1.47),
            (0.68, 0.18, 0.42),
            target,
            practical if index == 1 else counter,
        )
    light_data = bpy.data.lights.new(f"{name}.light", "POINT")
    light_data.energy = 240
    light_data.color = (1.0, 0.35, 0.12)
    light_data.shadow_soft_size = 1.15
    light = bpy.data.objects.new(light_data.name, light_data)
    light.location = (center_x, center_y + 0.18, 2.22)
    lights.objects.link(light)


def add_verifier_drone(
    name: str,
    x: float,
    y: float,
    z: float,
    unit: float,
    target: bpy.types.Collection,
    dark: bpy.types.Material,
    tech: bpy.types.Material,
) -> None:
    cylinder(name, (x * unit, y * unit, z), 0.72, 0.22, target, dark, 32)
    cylinder(f"{name}.ring", (x * unit, y * unit, z - 0.13), 0.52, 0.055, target, tech, 32)
    for index, angle in enumerate((45, 135, 225, 315)):
        radians = math.radians(angle)
        cube(
            f"{name}.sensor.{index}",
            (x * unit + math.cos(radians) * 0.5, y * unit + math.sin(radians) * 0.5, z - 0.08),
            (0.11, 0.11, 0.09),
            target,
            tech,
        )


def add_lush_planter(
    name: str,
    x: float,
    y: float,
    unit: float,
    target: bpy.types.Collection,
    concrete: bpy.types.Material,
    stem: bpy.types.Material,
    foliage: bpy.types.Material,
) -> None:
    """Create one restrained organic public-realm cluster at human scale."""

    cube(f"{name}.box", (x * unit, y * unit, 0.32), (1.45, 0.78, 0.62), target, concrete)
    for index, (offset_x, offset_y, height, radius) in enumerate((
        (-0.32, -0.08, 0.95, 0.33),
        (0.02, 0.08, 1.18, 0.38),
        (0.34, -0.03, 0.88, 0.31),
    )):
        cylinder(
            f"{name}.stem.{index}",
            (x * unit + offset_x, y * unit + offset_y, 0.66 + height * 0.34),
            0.035,
            height * 0.68,
            target,
            stem,
            10,
        )
        bpy.ops.mesh.primitive_ico_sphere_add(
            subdivisions=2,
            radius=radius,
            location=(x * unit + offset_x, y * unit + offset_y, 0.86 + height * 0.72),
        )
        crown = bpy.context.object
        crown.name = f"{name}.crown.{index}"
        crown.scale = (1.0, 0.72, 1.18)
        crown.data.materials.append(foliage)
        move_to_collection(crown, target)


def add_actor_sprite_proof(
    name: str,
    sprite_set_id: str,
    x: float,
    y: float,
    unit: float,
    target: bpy.types.Collection,
    presentation_scale: float,
) -> None:
    """Place frame zero from a separate runtime sheet as scale proof only."""

    sprite_path = (
        SCRIPT_DIRECTORY.parents[3]
        / "the-getaway/public/characters"
        / sprite_set_id
        / "idle-south.png"
    )
    if not sprite_path.is_file():
        raise RuntimeError(f"Missing GET-204 actor proof sheet: {sprite_path}")

    frame_height = 1.72 * presentation_scale
    frame_width = frame_height * (64 / 96)
    screen_axis = Vector((1.0, -1.0, 0.0)).normalized()
    center = Vector((x * unit, y * unit, 0.0))
    left = center - screen_axis * (frame_width / 2)
    right = center + screen_axis * (frame_width / 2)
    mesh = bpy.data.meshes.new(f"{name}.mesh")
    mesh.from_pydata(
        [
            tuple(left),
            tuple(right),
            tuple(right + Vector((0.0, 0.0, frame_height))),
            tuple(left + Vector((0.0, 0.0, frame_height))),
        ],
        [],
        [(0, 1, 2, 3)],
    )
    uv_layer = mesh.uv_layers.new(name="GET204 first idle frame")
    for loop, uv in zip(uv_layer.data, ((0.0, 0.0), (0.25, 0.0), (0.25, 1.0), (0.0, 1.0))):
        loop.uv = uv

    actor_material = bpy.data.materials.new(f"{name}.material")
    actor_material.use_nodes = True
    nodes = actor_material.node_tree.nodes
    links = actor_material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = bpy.data.images.load(str(sprite_path), check_existing=True)
    texture.interpolation = "Linear"
    shader.inputs["Roughness"].default_value = 0.82
    links.new(texture.outputs["Color"], shader.inputs["Base Color"])
    links.new(texture.outputs["Alpha"], shader.inputs["Alpha"])
    if "Emission Color" in shader.inputs:
        links.new(texture.outputs["Color"], shader.inputs["Emission Color"])
    if "Emission Strength" in shader.inputs:
        shader.inputs["Emission Strength"].default_value = 0.35
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    if hasattr(actor_material, "surface_render_method"):
        actor_material.surface_render_method = "DITHERED"
    elif hasattr(actor_material, "blend_method"):
        actor_material.blend_method = "BLEND"

    mesh.materials.append(actor_material)
    actor = bpy.data.objects.new(name, mesh)
    actor["get204_proof_only"] = True
    actor["get204_sprite_set_id"] = sprite_set_id
    target.objects.link(actor)


def build_city_details(
    recipe: dict[str, Any],
    details: bpy.types.Collection,
    lights: bpy.types.Collection,
    proof: bpy.types.Collection,
    surfaces: dict[str, bpy.types.Material],
) -> None:
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    dark = material("GET204 City ink metal", (0.022, 0.03, 0.04, 1), 0.42, 0.45)
    bone = material("GET204 City bone metal", (0.34, 0.30, 0.24, 1), 0.56, 0.08)
    glass = material("GET204 City dark glass", (0.02, 0.065, 0.085, 1), 0.12, 0.08)
    tech = material("GET204 City device cyan", (0.01, 0.09, 0.115, 1), 0.34, 0.05, (0.025, 0.36, 0.46, 1), 1.45)
    warm = material("GET204 City sodium practical", (0.16, 0.055, 0.014, 1), 0.38, 0.03, (0.72, 0.16, 0.025, 1), 1.25)
    crimson = material("GET204 City threat crimson", (0.13, 0.01, 0.01, 1), 0.42, 0.03, (0.56, 0.012, 0.008, 1), 1.55)
    foliage = material("GET204 City muted foliage", (0.045, 0.09, 0.065, 1), 0.72)
    service = material("GET204 City service teal", (0.055, 0.15, 0.15, 1), 0.42, 0.08)
    commuter = material("GET204 City commuter graphite", (0.11, 0.12, 0.13, 1), 0.3, 0.14)
    taxi = material("GET204 City muted taxi amber", (0.34, 0.18, 0.035, 1), 0.34, 0.1)

    for index, (x, y) in enumerate((
        (9, 20.62), (18, 23.38), (25, 20.62),
        (33, 23.38), (43, 20.62), (51, 23.38),
        (27.62, 7), (30.38, 16), (27.62, 29), (30.38, 39),
    )):
        add_street_light(f"GET204.CITY.light.{index}", x * unit, y * unit, details, dark, warm, lights)

    for index, (x, y, rotation) in enumerate((
        (29.0, 10.0, 0),
        (44.0, 13.5, 180),
        (44.0, 34.5, 180),
    )):
        add_camera(f"GET204.CITY.camera.{index}", x * unit, y * unit, rotation, details, dark, tech)
    add_camera("GET204.CITY.camera.public-threshold", 30.55 * unit, 20.45 * unit, 225, details, dark, tech)

    add_compact_transit_shelter(
        "GET204.CITY.transit",
        23.7,
        20.62,
        unit,
        details,
        dark,
        glass,
        bone,
    )
    add_verifier_booth(32.2 * unit, 20.62 * unit, details, dark, glass, tech)
    add_service_van(49.0 * unit, 34.5 * unit, details, service, dark, glass)
    for index, (x, y, rotation, body) in enumerate((
        (11.0, 22.0, 0, commuter),
        (29.0, 8.0, 90, taxi),
    )):
        add_compact_car(
            f"GET204.CITY.car.{index}",
            x,
            y,
            rotation,
            unit,
            details,
            body,
            dark,
            glass,
            warm,
        )
    add_bollard_row("GET204.CITY.control.bollards", (33.0 * unit, 20.62 * unit), (36.0 * unit, 20.62 * unit), 5, details, dark, crimson)

    for index, (x, y) in enumerate((
        (14.5, 20.62), (19.8, 20.62), (26.5, 20.62),
        (26.7, 23.38), (31.3, 23.38), (38.5, 20.62),
    )):
        add_lush_planter(
            f"GET204.CITY.planter.{index}",
            x,
            y,
            unit,
            details,
            surfaces["concrete"],
            dark,
            foliage,
        )
    add_bench("GET204.CITY.transit.bench", 22.4 * unit, 20.62 * unit, details, dark, bone)
    add_bench("GET204.CITY.public.bench", 26.65 * unit, 23.38 * unit, details, dark, bone, 180)
    add_bike_rack("GET204.CITY.transit.bikes", 25.1 * unit, 20.62 * unit, details, dark)
    add_cafe_table("GET204.CITY.cafe.table.0", 16.6, 20.72, unit, details, dark, bone)
    add_contact_stall(
        "GET204.CITY.contact-stall.public",
        18.6,
        20.52,
        unit,
        details,
        dark,
        service,
        bone,
        warm,
        lights,
    )
    add_screen_pylon("GET204.CITY.screen.public", 26.5, 20.45, unit, details, dark, tech)
    add_screen_pylon("GET204.CITY.screen.control", 36.8, 20.62, unit, details, dark, warm)
    add_hidzu_wall_mark(
        "GET204.CITY.identity.logistics",
        36.8,
        20.07,
        8.4,
        unit,
        details,
        dark,
        tech,
    )
    add_verifier_drone("GET204.CITY.drone.verifier", 27.0, 18.0, 9.0, unit, proof, dark, tech)

    practicals = (
        (13.0, 36.5, 3.2, 430),
        (12.0, 20.05, 3.2, 420),
        (25.5, 20.05, 3.4, 460),
        (33.0, 20.05, 3.8, 500),
        (39.0, 20.05, 3.8, 470),
        (44.0, 34.5, 3.2, 440),
    )
    for index, (x, y, z, energy) in enumerate(practicals):
        add_practical_light(f"GET204.CITY.practical.{index}", x * unit, y * unit, z, energy, lights)
        cube(
            f"GET204.CITY.practical.fixture.{index}",
            (x * unit, y * unit, z + 0.18),
            (0.6, 0.25, 0.16),
            details,
            warm,
        )

    proof_figures = (
        ("protagonist", "player_civilian_01", 25.3, 22.35, 2.35),
        ("contact", "contact_naila", 19.4, 20.95, 1.45),
        ("civilian", "civilian_transit", 24.15, 20.95, 1.38),
        ("security", "security_hidzu_identity", 31.25, 21.7, 1.55),
    )
    for name, sprite_set_id, x, y, presentation_scale in proof_figures:
        add_actor_sprite_proof(
            f"GET204.CITY.proof.{name}",
            sprite_set_id,
            x,
            y,
            unit,
            proof,
            presentation_scale,
        )
        shadow = cylinder(
            f"GET204.CITY.proof.{name}.shadow",
            (x * unit, y * unit, 0.13),
            0.32 * presentation_scale,
            0.02,
            proof,
            dark,
            32,
        )
        shadow.scale.y = 0.48
    for light_object in lights.objects:
        if getattr(light_object.data, "type", None) == "POINT":
            light_object.data.energy *= 1.35


def configure_scene(
    scene: bpy.types.Scene,
    recipe: dict[str, Any],
    lights: bpy.types.Collection,
) -> bpy.types.Object:
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.image_settings.compression = 35
    scene.render.film_transparent = False
    scene.render.resolution_percentage = 100
    scene.render.use_file_extension = True
    if hasattr(scene.render, "use_freestyle"):
        scene.render.use_freestyle = False
    scene.view_settings.exposure = 1.25
    scene.view_settings.gamma = 1.0
    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass

    compositor = bpy.data.node_groups.new(
        "GET204 City practical-light glow",
        "CompositorNodeTree",
    )
    compositor.interface.new_socket(
        name="Image",
        in_out="OUTPUT",
        socket_type="NodeSocketColor",
    )
    render_layers = compositor.nodes.new("CompositorNodeRLayers")
    glow = compositor.nodes.new("CompositorNodeGlare")
    glow.inputs["Type"].default_value = "Fog Glow"
    glow.inputs["Quality"].default_value = "High"
    glow.inputs["Threshold"].default_value = 1.15
    glow.inputs["Strength"].default_value = 0.03
    glow.inputs["Size"].default_value = 0.2
    output = compositor.nodes.new("NodeGroupOutput")
    compositor.links.new(render_layers.outputs["Image"], glow.inputs["Image"])
    compositor.links.new(glow.outputs["Image"], output.inputs["Image"])
    scene.compositing_node_group = compositor

    if scene.world is None:
        scene.world = bpy.data.worlds.new("GET204 City blue-hour world")
    scene.world.use_nodes = True
    background = scene.world.node_tree.nodes.get("Background") if scene.world.node_tree else None
    if background:
        background.inputs["Color"].default_value = (0.028, 0.055, 0.09, 1)
        background.inputs["Strength"].default_value = 0.48

    camera_data = bpy.data.cameras.new("GET204 City registered camera")
    camera_data.type = "ORTHO"
    camera_data.sensor_fit = "VERTICAL"
    camera_data.lens = 50
    camera = bpy.data.objects.new("GET204 City registered camera", camera_data)
    scene.collection.objects.link(camera)
    scene.camera = camera

    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    minimum_x, minimum_y, maximum_x, maximum_y = polygon_bounds(
        recipe["coordinateSystem"]["bounds"]
    )
    target = Vector((
        (minimum_x + maximum_x) * unit / 2,
        (minimum_y + maximum_y) * unit / 2,
        4.0,
    ))
    sun_data = bpy.data.lights.new("GET204 City upper-left key", "SUN")
    sun_data.energy = 1.45
    sun_data.angle = math.radians(6)
    sun_data.color = (1.0, 0.84, 0.68)
    sun = bpy.data.objects.new("GET204 City upper-left key", sun_data)
    sun.location = target + Vector((-160, 120, 230))
    point_at(sun, target)
    lights.objects.link(sun)

    area_data = bpy.data.lights.new("GET204 City cool institutional fill", "AREA")
    area_data.energy = 4500
    area_data.shape = "DISK"
    area_data.size = 220
    area_data.color = (0.52, 0.65, 0.82)
    area = bpy.data.objects.new("GET204 City cool institutional fill", area_data)
    area.location = target + Vector((120, -150, 155))
    point_at(area, target)
    lights.objects.link(area)

    return camera


def aim_registered_camera(
    scene: bpy.types.Scene,
    camera: bpy.types.Object,
    recipe: dict[str, Any],
    target_layout: dict[str, float],
    width: int,
    height: int,
    zoom: float,
) -> None:
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    tile_width = float(recipe["coordinateSystem"]["projection"]["tileWidth"])
    pixels_per_meter = (tile_width / 2) * math.sqrt(2) / unit
    camera.data.ortho_scale = height / (pixels_per_meter * zoom)
    elevation = math.radians(float(recipe["coordinateSystem"]["projection"]["elevationDegrees"]))
    follow_offset_pixels = float(recipe["camera"]["followOffsetScenePixels"])
    layout_follow_offset = follow_offset_pixels / (
        pixels_per_meter * zoom * math.sin(elevation) * math.sqrt(2) * unit
    )
    target = Vector((
        (float(target_layout["x"]) - layout_follow_offset) * unit,
        (float(target_layout["y"]) - layout_follow_offset) * unit,
        4.0,
    ))
    direction = Vector((
        math.cos(elevation) / math.sqrt(2),
        math.cos(elevation) / math.sqrt(2),
        math.sin(elevation),
    ))
    camera.location = target + direction * 780
    point_at(camera, target)
    camera.scale.x = -abs(camera.scale.x)
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    bpy.context.view_layer.update()


def render_view(
    scene: bpy.types.Scene,
    camera: bpy.types.Object,
    recipe: dict[str, Any],
    output: Path,
    target_layout: dict[str, float],
    width: int,
    height: int,
    zoom: float,
    material_override: bpy.types.Material | None = None,
    hidden_cluster_ids: Sequence[str] = (),
    hide_scale_proof: bool = False,
) -> Path:
    aim_registered_camera(scene, camera, recipe, target_layout, width, height, zoom)
    original_exposure = scene.view_settings.exposure
    background = scene.world.node_tree.nodes.get("Background") if scene.world and scene.world.node_tree else None
    original_background_color = tuple(background.inputs["Color"].default_value) if background else None
    original_background_strength = float(background.inputs["Strength"].default_value) if background else None
    hidden_objects = [
        obj
        for obj in scene.objects
        if obj.get("get204_cluster_id") in hidden_cluster_ids
        or (
            hide_scale_proof
            and any(
                collection.name == "GET204_MISSION_DISTRICT_SCALE_PROOF"
                for collection in obj.users_collection
            )
        )
    ]
    original_hidden_states = {obj.name: bool(obj.hide_render) for obj in hidden_objects}
    for obj in hidden_objects:
        obj.hide_render = True
    if material_override is not None:
        scene.view_settings.exposure = 1.75
        if background:
            background.inputs["Color"].default_value = (0.16, 0.18, 0.21, 1)
            background.inputs["Strength"].default_value = 0.9
    scene.view_layers[0].material_override = material_override
    scene.render.filepath = str(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    try:
        bpy.ops.render.render(write_still=True)
    finally:
        scene.view_layers[0].material_override = None
        scene.view_settings.exposure = original_exposure
        if background and original_background_color is not None and original_background_strength is not None:
            background.inputs["Color"].default_value = original_background_color
            background.inputs["Strength"].default_value = original_background_strength
        for obj in hidden_objects:
            obj.hide_render = original_hidden_states[obj.name]
    return output


def render_requested_views(
    scene: bpy.types.Scene,
    camera: bpy.types.Object,
    recipe: dict[str, Any],
    output_root: Path,
    mode: str,
    requested_view: str,
) -> list[Path]:
    outputs: list[Path] = []
    clay = material("GET204 City massing clay", (0.38, 0.40, 0.43, 1), 0.78)
    minimum_x, minimum_y, maximum_x, maximum_y = polygon_bounds(
        recipe["coordinateSystem"]["bounds"]
    )
    center = {
        "x": (minimum_x + maximum_x) / 2,
        "y": (minimum_y + maximum_y) / 2,
    }
    if mode in ("massing", "all") and requested_view in ("all", "overview"):
        outputs.append(render_view(
            scene,
            camera,
            recipe,
            output_root / "massing-overview-1920x1080.png",
            center,
            1920,
            1080,
            float(recipe["camera"]["manualOverviewZoom"]),
            clay,
        ))
    if mode in ("preview", "all") and requested_view in ("all", "overview"):
        outputs.append(render_view(
            scene,
            camera,
            recipe,
            output_root / "quality-overview-1920x1080.png",
            center,
            1920,
            1080,
            float(recipe["camera"]["manualOverviewZoom"]),
        ))
    if mode in ("preview", "all"):
        for subdistrict_id, target in recipe["camera"]["proofStarts"].items():
            if requested_view not in ("all", subdistrict_id):
                continue
            outputs.append(render_view(
                scene,
                camera,
                recipe,
                output_root / f"quality-{subdistrict_id}-1440x900.png",
                target,
                1440,
                900,
                float(recipe["camera"]["runtimeDefaultZoom"]),
                hidden_cluster_ids=recipe["camera"]["proofOccluderClusterIds"][subdistrict_id],
            ))
    if mode == "exports":
        runtime_root = output_root.parent / "runtime"
        runtime_width = 4096
        runtime_height = 2304
        runtime_zoom = float(recipe["camera"]["manualOverviewZoom"]) * (
            runtime_width / 1920
        )
        outputs.append(render_view(
            scene,
            camera,
            recipe,
            runtime_root / "overview-people-free-4096x2304.png",
            center,
            runtime_width,
            runtime_height,
            runtime_zoom,
            hide_scale_proof=True,
        ))
    return outputs


def write_metadata(
    repo_root: Path,
    recipe_path: Path,
    recipe: dict[str, Any],
    building_evidence: Sequence[dict[str, Any]],
    source_prop_evidence: Sequence[dict[str, Any]],
    source_texture_evidence: Sequence[dict[str, Any]],
    outputs: Sequence[Path],
    scene_path: Path,
) -> None:
    payload = {
        "schemaVersion": 2,
        "id": recipe["id"],
        "ticket": "GET-204",
        "acceptanceState": recipe["acceptanceState"],
        "purpose": "Four-block named-KitBash authoring evidence plus requester-authorized people-free live candidate export.",
        "blender": {"version": bpy.app.version_string, "buildHash": bpy.app.build_hash.decode("utf-8")},
        "recipe": {"path": str(recipe_path.relative_to(repo_root)), "sha256": sha256_file(recipe_path)},
        "references": recipe["references"],
        "architecturalClusters": list(building_evidence),
        "sourcePropPlacements": list(source_prop_evidence),
        "sourceTextures": list(source_texture_evidence),
        "outputs": [
            {"path": str(path.relative_to(repo_root)), "sha256": sha256_file(path), "bytes": path.stat().st_size}
            for path in outputs
        ],
        "scene": str(scene_path.relative_to(repo_root)),
        "runtimePromotion": "blocked-until-live-requester-acceptance",
        "commitBoundary": recipe["commitBoundary"],
    }
    metadata_path = repo_root / GENERATED_RELATIVE_ROOT / "metadata.json"
    metadata_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    args = parse_args()
    bpy.context.preferences.system.gl_texture_limit = "CLAMP_2048"
    if tuple(bpy.app.version) != EXPECTED_BLENDER_VERSION:
        raise RuntimeError(f"Expected Blender 5.0.1; found {bpy.app.version_string}")
    repo_root, source_root, archive = validate_environment(args)
    recipe_path = repo_root / RECIPE_RELATIVE_PATH
    recipe = read_json(recipe_path)
    for reference in recipe["references"]:
        path = repo_root / reference["path"]
        if not path.is_file() or sha256_file(path) != reference["sha256"]:
            raise RuntimeError(f"GET-204 reference drifted: {reference['path']}")

    scene = reset_scene()
    fbx_path = stage_source(repo_root, source_root, archive)
    imported = import_fbx(fbx_path)
    texture_cache = os.environ.get("GETAWAY_NEO_TOKYO_TEXTURE_CACHE")
    texture_source_root = (
        Path(texture_cache).expanduser().resolve()
        if texture_cache
        else source_root
    )
    if texture_cache and not (texture_source_root / "Textures").is_dir():
        raise RuntimeError(
            "GETAWAY_NEO_TOKYO_TEXTURE_CACHE must contain the verified Textures directory"
        )
    source_texture_evidence = relink_source_images(
        texture_source_root,
        recipe["source"]["textureSearchRoots"],
    )
    repair_source_materials(bpy.data.materials, texture_source_root)
    groups = group_buildings(imported)

    master = collection("GET204_MISSION_DISTRICT", scene.collection)
    ground = collection("GET204_MISSION_DISTRICT_GROUND", master)
    architecture = collection("GET204_MISSION_DISTRICT_ARCHITECTURE", master)
    details = collection("GET204_MISSION_DISTRICT_DETAILS", master)
    proof = collection("GET204_MISSION_DISTRICT_SCALE_PROOF", master)
    lights = collection("GET204_MISSION_DISTRICT_LIGHTS", master)

    kit_building_evidence = place_architectural_clusters(groups, recipe, architecture)
    source_prop_evidence = place_source_props(imported, recipe, {"details": details})
    remove_imported_source(imported)
    surfaces = build_public_realm(recipe, ground)
    build_city_details(recipe, details, lights, proof, surfaces)
    building_evidence = kit_building_evidence
    density = recipe["composition"]["density"]
    if not (
        int(density["minimumVisibleBuildingInstances"])
        <= len(building_evidence)
        <= int(density["maximumVisibleBuildingInstances"])
    ):
        raise RuntimeError(
            f"Visible architecture resolved to {len(building_evidence)} clusters; "
            f"expected {density['minimumVisibleBuildingInstances']}-{density['maximumVisibleBuildingInstances']}"
        )
    camera = configure_scene(scene, recipe, lights)

    output_root = repo_root / GENERATED_RELATIVE_ROOT / "previews"
    outputs = render_requested_views(scene, camera, recipe, output_root, args.mode, args.view)
    scene_path = repo_root / GENERATED_RELATIVE_ROOT / "master" / "get204-mission-district.blend"
    scene_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(scene_path), compress=True)
    write_metadata(
        repo_root,
        recipe_path,
        recipe,
        building_evidence,
        source_prop_evidence,
        source_texture_evidence,
        outputs,
        scene_path,
    )
    print(
        f"GET-204 four-block mission district complete: {len(building_evidence)} clusters, "
        f"{len(outputs)} renders -> {output_root}"
    )


if __name__ == "__main__":
    main()
