#!/usr/bin/env python3
"""Apply the ignored GET-205 Hidzu treatment over the immutable GET-204 master.

This stage opens the hash-locked GET-204 scene, changes materials, and adds
collision-neutral procedural identity objects in dedicated collections. It
never changes gameplay topology, source building transforms, camera
registration, anchors, or semantic masks. Blender writes only to a run-scoped
``art/blender/get205/.staging`` directory; the Node runner validates and then
publishes one whole run through the ignored ``.generated/current`` pointer.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import importlib.util
import json
import math
import re
import shutil
import struct
import sys
import textwrap
import traceback
import zlib
from pathlib import Path
from typing import Any, Iterable, Sequence

import bpy
from mathutils import Matrix, Vector


EXPECTED_BLENDER_VERSION = (5, 0, 1)
RENDER_MODES = ("preview", "captures", "exports", "all")
ADDITIONS_COLLECTION = "GET205_HIDZU_ADDITIONS"
PRACTICAL_LIGHTS_COLLECTION = "GET205_PRACTICAL_LIGHTS"
LIGHTING_HELPERS_COLLECTION = "GET205_LIGHTING_FOUNDATION"
PIXEL_DENSITY_MARGIN = 1.0
SAFE_CAPTURE_ID = re.compile(r"^[a-z0-9]+(?:[.-][a-z0-9]+)*$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the GET-205 Hidzu treatment scene.")
    default_repo_root = Path(__file__).resolve().parents[4]
    parser.add_argument("--repo-root", type=Path, default=default_repo_root)
    parser.add_argument("--mode", choices=RENDER_MODES, default="preview")
    parser.add_argument("--capture-id")
    parser.add_argument("--generated-root", type=Path)
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(argv)


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def resolve_within(root: Path, relative_path: str, label: str) -> Path:
    relative = Path(relative_path)
    if (
        not relative_path
        or relative.is_absolute()
        or "\\" in relative_path
        or relative.as_posix() != relative_path
        or any(part in {"", ".", ".."} for part in relative.parts)
    ):
        raise RuntimeError(f"Unsafe {label}: {relative_path}")
    resolved_root = root.resolve()
    resolved = (resolved_root / relative).resolve()
    if resolved != resolved_root and resolved_root not in resolved.parents:
        raise RuntimeError(f"{label} escapes its root: {relative_path}")
    return resolved


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def paeth_predictor(left: int, above: int, upper_left: int) -> int:
    estimate = left + above - upper_left
    left_distance = abs(estimate - left)
    above_distance = abs(estimate - above)
    upper_left_distance = abs(estimate - upper_left)
    if left_distance <= above_distance and left_distance <= upper_left_distance:
        return left
    if above_distance <= upper_left_distance:
        return above
    return upper_left


def decode_png_rgba(path: Path) -> tuple[int, int, bytes]:
    payload = path.read_bytes()
    if payload[:8] != b"\x89PNG\r\n\x1a\n":
        raise RuntimeError(f"GET-205 palette source is not PNG: {path}")
    cursor = 8
    width = height = bit_depth = color_type = interlace = None
    compressed = bytearray()
    while cursor < len(payload):
        length = struct.unpack(">I", payload[cursor : cursor + 4])[0]
        chunk_type = payload[cursor + 4 : cursor + 8]
        chunk = payload[cursor + 8 : cursor + 8 + length]
        cursor += 12 + length
        if chunk_type == b"IHDR":
            width, height, bit_depth, color_type, _, _, interlace = struct.unpack(
                ">IIBBBBB", chunk
            )
        elif chunk_type == b"IDAT":
            compressed.extend(chunk)
        elif chunk_type == b"IEND":
            break
    if (
        width is None or height is None or bit_depth != 8 or
        color_type not in {2, 6} or interlace != 0
    ):
        raise RuntimeError(
            f"GET-205 palette measurement requires noninterlaced 8-bit RGB/RGBA PNG: {path}"
        )
    channels = 4 if color_type == 6 else 3
    row_size = width * channels
    inflated = zlib.decompress(bytes(compressed))
    expected_size = height * (row_size + 1)
    if len(inflated) != expected_size:
        raise RuntimeError(f"GET-205 PNG scanline size drifted: {path}")
    decoded = bytearray(width * height * 4)
    previous = bytearray(row_size)
    source_cursor = 0
    target_cursor = 0
    for _ in range(height):
        filter_type = inflated[source_cursor]
        source_cursor += 1
        raw = inflated[source_cursor : source_cursor + row_size]
        source_cursor += row_size
        current = bytearray(row_size)
        for index, value in enumerate(raw):
            left = current[index - channels] if index >= channels else 0
            above = previous[index]
            upper_left = previous[index - channels] if index >= channels else 0
            if filter_type == 0:
                reconstructed = value
            elif filter_type == 1:
                reconstructed = (value + left) & 0xFF
            elif filter_type == 2:
                reconstructed = (value + above) & 0xFF
            elif filter_type == 3:
                reconstructed = (value + ((left + above) // 2)) & 0xFF
            elif filter_type == 4:
                reconstructed = (value + paeth_predictor(left, above, upper_left)) & 0xFF
            else:
                raise RuntimeError(f"Unsupported GET-205 PNG filter {filter_type}: {path}")
            current[index] = reconstructed
        for pixel in range(width):
            source_index = pixel * channels
            decoded[target_cursor : target_cursor + 3] = current[source_index : source_index + 3]
            decoded[target_cursor + 3] = current[source_index + 3] if channels == 4 else 255
            target_cursor += 4
        previous = current
    return width, height, bytes(decoded)


def measure_palette_coverage(
    source: Path,
    generated_root: Path,
    grammar: dict[str, Any],
) -> dict[str, Any]:
    width, height, pixels = decode_png_rgba(source)
    sample_stride = 4
    maximum_distance = 24
    minimum_background_distance = 12
    palette = {
        token["id"]: tuple(int(token["hex"][offset : offset + 2], 16) for offset in (1, 3, 5))
        for token in grammar["palette"]
    }
    maximums = {
        token["id"]: float(token["maximumCoverageRatio"])
        for token in grammar["palette"]
    }
    counts = {token_id: 0 for token_id in palette}
    corner_indices = (
        0,
        (width - 1) * 4,
        ((height - 1) * width) * 4,
        ((height * width) - 1) * 4,
    )
    background_rgb = tuple(
        (sum(int(pixels[index + channel]) for index in corner_indices) + 2) // 4
        for channel in range(3)
    )
    sampled_pixels = 0
    for y in range(0, height, sample_stride):
        for x in range(0, width, sample_stride):
            index = (y * width + x) * 4
            if pixels[index + 3] < 128:
                continue
            rgb = pixels[index : index + 3]
            background_distance = sum(
                (int(rgb[channel]) - background_rgb[channel]) ** 2
                for channel in range(3)
            )
            if background_distance <= minimum_background_distance ** 2:
                continue
            sampled_pixels += 1
            nearest_id, nearest_distance = min(
                (
                    (
                        token_id,
                        sum(
                            (int(rgb[channel]) - color[channel]) ** 2
                            for channel in range(3)
                        ),
                    )
                    for token_id, color in palette.items()
                ),
                key=lambda entry: entry[1],
            )
            if nearest_distance <= maximum_distance ** 2:
                counts[nearest_id] += 1
    if sampled_pixels <= 0:
        raise RuntimeError(f"GET-205 palette source contains no sampled opaque pixels: {source}")
    tokens = [
        {
            "id": token_id,
            "matchedPixels": counts[token_id],
            "coverageRatio": round(counts[token_id] / sampled_pixels, 10),
            "maximumCoverageRatio": maximums[token_id],
        }
        for token_id in palette
    ]
    exceeded = [entry["id"] for entry in tokens if entry["coverageRatio"] > entry["maximumCoverageRatio"]]
    if exceeded:
        raise RuntimeError(f"GET-205 palette coverage exceeds registered maxima: {exceeded}")
    return {
        "sourcePath": str(source.relative_to(generated_root)),
        "sourceSha256": sha256_file(source),
        "width": width,
        "height": height,
        "sampleStride": sample_stride,
        "sampleScope": "foreground-difference",
        "backgroundRgb": list(background_rgb),
        "minimumBackgroundRgbDistance": minimum_background_distance,
        "sampledPixels": sampled_pixels,
        "maximumRgbDistance": maximum_distance,
        "colorSpace": "srgb-euclidean",
        "tokens": tokens,
    }


def canonical_digest(value: Any) -> str:
    payload = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def semantic_mask_registration_digest(art_manifest: dict[str, Any]) -> str:
    payload = []
    for layer in art_manifest["layers"]:
        if layer["kind"] != "semantic-mask":
            continue
        payload.append({
            "id": layer["id"],
            "kind": layer["kind"],
            "maskId": layer["maskId"],
            "fallbackLayerId": layer["fallbackLayerId"],
            "tiles": [
                {
                    "id": tile["id"],
                    "column": tile["column"],
                    "row": tile["row"],
                    "x": tile["x"],
                    "y": tile["y"],
                    "width": tile["width"],
                    "height": tile["height"],
                    "imagePath": tile["imagePath"],
                    "sha256": tile["sha256"],
                    "byteSize": tile["byteSize"],
                }
                for tile in layer["tiles"]
            ],
        })
    return canonical_digest(payload)


def load_get204_module(repo_root: Path) -> Any:
    script_path = repo_root / "art/blender/get204/scripts/build_level0_master_scene.py"
    module_name = "get204_master_for_get205"
    script_directory = str(script_path.parent)
    if script_directory not in sys.path:
        sys.path.insert(0, script_directory)
    spec = importlib.util.spec_from_file_location(module_name, script_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load GET-204 master helpers: {script_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def matrix_payload(objects: Iterable[bpy.types.Object]) -> list[dict[str, Any]]:
    payload: list[dict[str, Any]] = []
    for obj in sorted(objects, key=lambda item: item.name):
        matrix = [round(float(value), 8) for row in obj.matrix_world for value in row]
        dimensions = [round(float(value), 8) for value in obj.dimensions]
        payload.append({"name": obj.name, "type": obj.type, "matrix": matrix, "dimensions": dimensions})
    return payload


def matrix_digest(objects: Iterable[bpy.types.Object]) -> str:
    return canonical_digest(matrix_payload(objects))


def camera_digest(camera: bpy.types.Object) -> str:
    return canonical_digest({
        "matrix": [round(float(value), 8) for row in camera.matrix_world for value in row],
        "type": camera.data.type,
        "sensorFit": camera.data.sensor_fit,
        "orthoScale": round(float(camera.data.ortho_scale), 8),
    })


def hex_color(value: str, alpha: float = 1.0) -> tuple[float, float, float, float]:
    normalized = value.removeprefix("#")
    srgb = [int(normalized[offset : offset + 2], 16) / 255 for offset in (0, 2, 4)]
    linear = [
        channel / 12.92
        if channel <= 0.04045
        else ((channel + 0.055) / 1.055) ** 2.4
        for channel in srgb
    ]
    return (
        linear[0],
        linear[1],
        linear[2],
        alpha,
    )


def blend_colors(
    colors: Sequence[tuple[float, float, float, float]],
    weights: Sequence[float] | None = None,
    alpha: float = 1.0,
) -> tuple[float, float, float, float]:
    if not colors:
        raise RuntimeError("Cannot blend an empty GET-205 color-token set")
    actual_weights = list(weights) if weights is not None else [1.0] * len(colors)
    if len(actual_weights) != len(colors) or sum(actual_weights) <= 0:
        raise RuntimeError("Invalid GET-205 color-token blend weights")
    total = sum(actual_weights)
    return (
        sum(color[0] * weight for color, weight in zip(colors, actual_weights)) / total,
        sum(color[1] * weight for color, weight in zip(colors, actual_weights)) / total,
        sum(color[2] * weight for color, weight in zip(colors, actual_weights)) / total,
        alpha,
    )


def scale_color(
    color: tuple[float, float, float, float],
    minimum: float,
    alpha: float = 1.0,
) -> tuple[float, float, float, float]:
    peak = max(color[:3])
    scale = 1.0 if peak >= minimum else minimum / max(peak, 0.000_001)
    return (
        min(1.0, color[0] * scale),
        min(1.0, color[1] * scale),
        min(1.0, color[2] * scale),
        alpha,
    )


def create_principled_material(
    name: str,
    color: tuple[float, float, float, float],
    roughness: float = 0.72,
    metallic: float = 0.0,
    emission_strength: float = 0.0,
) -> bpy.types.Material:
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF") if material.node_tree else None
    if shader is not None:
        shader.inputs["Base Color"].default_value = color
        shader.inputs["Roughness"].default_value = roughness
        shader.inputs["Metallic"].default_value = metallic
        emission_color = shader.inputs.get("Emission Color") or shader.inputs.get("Emission")
        emission = shader.inputs.get("Emission Strength")
        if emission_color is not None:
            emission_color.default_value = color
        if emission is not None:
            emission.default_value = emission_strength
    material.diffuse_color = color
    return material


def assign_material(obj: bpy.types.Object, material: bpy.types.Material) -> None:
    if not isinstance(obj.data, bpy.types.Mesh):
        return
    obj.data.materials.clear()
    obj.data.materials.append(material)


def move_to_collection(obj: bpy.types.Object, target: bpy.types.Collection) -> None:
    if target not in obj.users_collection:
        target.objects.link(obj)
    for current in list(obj.users_collection):
        if current != target:
            current.objects.unlink(obj)


def tag_addition(
    obj: bpy.types.Object,
    addition: dict[str, Any],
    state_sensitive: str | None = None,
) -> None:
    obj["get205_addition_id"] = addition["id"]
    obj["get205_purpose"] = addition["purpose"]
    obj["get205_collision_effect"] = addition["collisionEffect"]
    obj["get205_grammar_id"] = addition["grammarId"]
    grammar_entry = addition.get("_resolvedGrammar")
    if grammar_entry is not None:
        obj["get205_grammar_kind"] = grammar_entry["kind"]
        obj["get205_color_token_id"] = grammar_entry["colorTokenId"]
        obj["get205_silhouette"] = grammar_entry["silhouette"]
        obj["get205_glyph"] = grammar_entry["glyph"]
    if state_sensitive:
        obj["get205_state_sensitive"] = state_sensitive


def create_cube(
    name: str,
    location: Vector,
    dimensions: tuple[float, float, float],
    rotation_z: float,
    material: bpy.types.Material,
    target: bpy.types.Collection,
    addition: dict[str, Any],
    state_sensitive: str | None = None,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=(0, 0, rotation_z))
    obj = bpy.context.object
    if obj is None:
        raise RuntimeError(f"Failed to create GET-205 cube: {name}")
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign_material(obj, material)
    move_to_collection(obj, target)
    tag_addition(obj, addition, state_sensitive)
    return obj


def create_cylinder(
    name: str,
    location: Vector,
    radius: float,
    depth: float,
    material: bpy.types.Material,
    target: bpy.types.Collection,
    addition: dict[str, Any],
    vertices: int = 16,
    state_sensitive: str | None = None,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    if obj is None:
        raise RuntimeError(f"Failed to create GET-205 cylinder: {name}")
    obj.name = name
    assign_material(obj, material)
    move_to_collection(obj, target)
    tag_addition(obj, addition, state_sensitive)
    return obj


def create_torus(
    name: str,
    location: Vector,
    rotation: tuple[float, float, float],
    major_radius: float,
    minor_radius: float,
    material: bpy.types.Material,
    target: bpy.types.Collection,
    addition: dict[str, Any],
    state_sensitive: str | None = None,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=20,
        minor_segments=8,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    if obj is None:
        raise RuntimeError(f"Failed to create GET-205 torus: {name}")
    obj.name = name
    assign_material(obj, material)
    move_to_collection(obj, target)
    tag_addition(obj, addition, state_sensitive)
    return obj


def create_text(
    name: str,
    body: str,
    location: Vector,
    rotation: tuple[float, float, float],
    size: float,
    material: bpy.types.Material,
    target: bpy.types.Collection,
    addition: dict[str, Any],
    message: dict[str, Any],
) -> bpy.types.Object:
    curve = bpy.data.curves.new(f"{name}.font", type="FONT")
    curve.body = body
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    curve.size = size
    curve.space_line = 0.86
    curve.extrude = 0.006
    curve.bevel_depth = 0.002
    curve.materials.append(material)
    obj = bpy.data.objects.new(name, curve)
    obj.location = location
    obj.rotation_euler = rotation
    target.objects.link(obj)
    tag_addition(obj, addition)
    obj["get205_message_id"] = message["id"]
    obj["get205_message_copy_sha256"] = hashlib.sha256(
        message["copy"].encode("utf-8")
    ).hexdigest()
    return obj


def tag_state_cue(
    obj: bpy.types.Object,
    definition: dict[str, Any],
) -> None:
    obj["get205_state_cue"] = definition["id"]
    obj["get205_state_color_token_id"] = definition["colorTokenId"]
    obj["get205_state_glyph"] = definition["glyph"]
    obj["get205_state_silhouette"] = definition["silhouette"]
    obj["get205_state_motion_cue"] = definition["motionCue"]
    obj.hide_render = definition["id"] != "clear"


def create_surveillance_state_cues(
    prefix: str,
    center: Vector,
    addition: dict[str, Any],
    grammar: dict[str, Any],
    token_materials: dict[str, bpy.types.Material],
    target: bpy.types.Collection,
) -> list[bpy.types.Object]:
    """Create visibly different clear/suspicious/pursuit silhouettes.

    These are static proof poses for T5. T8 owns runtime motion, but its future
    state machine can select the same registered glyph groups without relying
    on color alone.
    """
    created: list[bpy.types.Object] = []
    ink = token_materials["ink"]
    for state in grammar["surveillanceStates"]:
        material = token_materials[state["colorTokenId"]]
        state_prefix = f"{prefix}.state.{state['id']}"
        state_objects: list[bpy.types.Object] = []
        if state["silhouette"] == "open-ring" and state["glyph"] == "ring-connection":
            state_objects.append(create_torus(
                f"{state_prefix}.ring",
                center,
                (math.radians(90), 0, math.radians(-45)),
                0.31,
                0.055,
                material,
                target,
                addition,
            ))
            state_objects.append(create_cube(
                f"{state_prefix}.notch",
                center + Vector((0.0, 0.0, 0.24)),
                (0.18, 0.22, 0.18),
                math.radians(-45),
                ink,
                target,
                addition,
            ))
        elif (
            state["silhouette"] == "bracketed-focus" and
            state["glyph"] == "single-chevron"
        ):
            for index, offset in enumerate((-0.38, 0.38)):
                state_objects.append(create_cube(
                    f"{state_prefix}.bracket.{index}",
                    center + Vector((offset, 0, 0)),
                    (0.09, 0.18, 0.62),
                    0,
                    material,
                    target,
                    addition,
                ))
            for index, angle in enumerate((-35, 35)):
                state_objects.append(create_cube(
                    f"{state_prefix}.chevron.{index}",
                    center + Vector((0, 0, 0.06)),
                    (0.34, 0.09, 0.12),
                    math.radians(angle),
                    material,
                    target,
                    addition,
                ))
        elif (
            state["silhouette"] == "solid-alarm-block" and
            state["glyph"] == "double-chevron"
        ):
            state_objects.append(create_cube(
                f"{state_prefix}.alarm-block",
                center,
                (0.78, 0.42, 0.26),
                math.radians(-45),
                material,
                target,
                addition,
            ))
            for row, z_offset in enumerate((-0.17, 0.17)):
                for side, angle in enumerate((-35, 35)):
                    state_objects.append(create_cube(
                        f"{state_prefix}.chevron.{row}.{side}",
                        center + Vector((0, 0, z_offset + 0.2)),
                        (0.32, 0.08, 0.08),
                        math.radians(angle),
                        token_materials["bone"],
                        target,
                        addition,
                    ))
        else:
            raise RuntimeError(
                "Unsupported GET-205 surveillance cue: "
                f"{state['id']}:{state['silhouette']}:{state['glyph']}"
            )
        for obj in state_objects:
            tag_state_cue(obj, state)
        created.extend(state_objects)
    return created


def target_position(
    addition: dict[str, Any],
    anchors: dict[str, dict[str, Any]],
    placements: dict[str, dict[str, Any]],
    unit: float,
) -> Vector:
    target = addition["target"]
    if target["kind"] == "anchor":
        point = anchors[target["id"]]["position"]
    else:
        point = placements[target["id"]]["layoutPosition"]
    return Vector((float(point["x"]) * unit, float(point["y"]) * unit, 0))


def placement_world_bounds(
    objects: Sequence[bpy.types.Object],
) -> dict[str, tuple[Vector, Vector]]:
    """Measure visible placement bounds without changing source transforms."""
    corners_by_placement: dict[str, list[Vector]] = {}
    for obj in objects:
        placement_id = obj.get("get204_placement_id")
        if not placement_id or obj.type != "MESH":
            continue
        corners_by_placement.setdefault(placement_id, []).extend(
            obj.matrix_world @ Vector(corner) for corner in obj.bound_box
        )
    return {
        placement_id: (
            Vector((
                min(point.x for point in corners),
                min(point.y for point in corners),
                min(point.z for point in corners),
            )),
            Vector((
                max(point.x for point in corners),
                max(point.y for point in corners),
                max(point.z for point in corners),
            )),
        )
        for placement_id, corners in corners_by_placement.items()
    }


def measured_addition_bounds(
    objects: Sequence[bpy.types.Object],
    treatment: dict[str, Any],
) -> list[dict[str, Any]]:
    objects_by_id: dict[str, list[bpy.types.Object]] = {}
    registered_ids = {entry["id"] for entry in treatment["additions"]}
    for obj in objects:
        addition_id = obj.get("get205_addition_id")
        if addition_id in registered_ids and obj.type == "MESH":
            objects_by_id.setdefault(str(addition_id), []).append(obj)

    records: list[dict[str, Any]] = []
    for addition in treatment["additions"]:
        addition_objects = objects_by_id.get(addition["id"], [])
        if not addition_objects:
            raise RuntimeError(f"GET-205 addition produced no measured mesh: {addition['id']}")
        collision_effects = {
            str(obj.get("get205_collision_effect")) for obj in addition_objects
        }
        if collision_effects != {"none"}:
            raise RuntimeError(
                f"GET-205 addition has an unexpected collision tag: {addition['id']}"
            )
        corners = [
            obj.matrix_world @ Vector(corner)
            for obj in addition_objects
            for corner in obj.bound_box
        ]
        records.append({
            "id": addition["id"],
            "targetKind": addition["target"]["kind"],
            "targetId": addition["target"]["id"],
            "objectCount": len(addition_objects),
            "collisionEffect": "none",
            "minimum": {
                "x": min(point.x for point in corners),
                "y": min(point.y for point in corners),
                "z": min(point.z for point in corners),
            },
            "maximum": {
                "x": max(point.x for point in corners),
                "y": max(point.y for point in corners),
                "z": max(point.z for point in corners),
            },
        })
    return records


def measured_grammar_bindings(
    objects: Sequence[bpy.types.Object],
    treatment: dict[str, Any],
    grammar: dict[str, Any],
) -> list[dict[str, Any]]:
    grammar_by_id = {entry["id"]: entry for entry in grammar["entries"]}
    records: list[dict[str, Any]] = []
    for addition in treatment["additions"]:
        definition = grammar_by_id[addition["grammarId"]]
        addition_objects = [
            obj for obj in objects
            if obj.get("get205_addition_id") == addition["id"]
        ]
        if not addition_objects:
            raise RuntimeError(f"GET-205 grammar binding produced no objects: {addition['id']}")
        for obj in addition_objects:
            measured = {
                "grammarId": obj.get("get205_grammar_id"),
                "kind": obj.get("get205_grammar_kind"),
                "colorTokenId": obj.get("get205_color_token_id"),
                "silhouette": obj.get("get205_silhouette"),
                "glyph": obj.get("get205_glyph"),
            }
            expected = {
                "grammarId": addition["grammarId"],
                "kind": definition["kind"],
                "colorTokenId": definition["colorTokenId"],
                "silhouette": definition["silhouette"],
                "glyph": definition["glyph"],
            }
            if measured != expected:
                raise RuntimeError(
                    f"GET-205 object grammar binding drifted: {addition['id']}:{obj.name}"
                )
        records.append({
            "additionId": addition["id"],
            "grammarId": addition["grammarId"],
            "kind": definition["kind"],
            "colorTokenId": definition["colorTokenId"],
            "silhouette": definition["silhouette"],
            "glyph": definition["glyph"],
            "objectCount": len(addition_objects),
        })
    return records


def measured_public_messages(
    objects: Sequence[bpy.types.Object],
    treatment: dict[str, Any],
) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for message in treatment["publicMessageTemplates"]:
        matches = [
            obj for obj in objects
            if obj.get("get205_message_id") == message["id"]
        ]
        if len(matches) != 1:
            raise RuntimeError(
                f"GET-205 public message must produce one visible text object: {message['id']}"
            )
        obj = matches[0]
        copy_hash = hashlib.sha256(message["copy"].encode("utf-8")).hexdigest()
        expected_body = "\n".join(textwrap.wrap(message["copy"], width=28))
        rendered_body = str(obj.data.body) if obj.type == "FONT" else ""
        rendered_body_hash = hashlib.sha256(rendered_body.encode("utf-8")).hexdigest()
        material = obj.data.materials[0] if obj.data.materials else None
        shader = next(
            (
                node for node in material.node_tree.nodes
                if node.type == "BSDF_PRINCIPLED"
            ),
            None,
        ) if material and material.node_tree else None
        emission = shader.inputs.get("Emission Strength") if shader else None
        emission_strength = float(emission.default_value) if emission is not None else 0.0
        if (
            obj.type != "FONT" or obj.hide_render or rendered_body != expected_body or
            float(obj.data.size) < 0.3 or emission_strength < 1.25 or
            obj.get("get205_message_copy_sha256") != copy_hash
        ):
            raise RuntimeError(f"GET-205 public message copy drifted: {message['id']}")
        records.append({
            "id": message["id"],
            "additionId": str(obj.get("get205_addition_id")),
            "copySha256": copy_hash,
            "renderedBodySha256": rendered_body_hash,
            "objectName": obj.name,
            "objectCount": 1,
            "renderVisible": True,
            "fontSize": float(obj.data.size),
            "emissionStrength": emission_strength,
        })
    return records


def measured_surveillance_state_cues(
    objects: Sequence[bpy.types.Object],
    grammar: dict[str, Any],
) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for state in grammar["surveillanceStates"]:
        matches = [obj for obj in objects if obj.get("get205_state_cue") == state["id"]]
        if not matches:
            raise RuntimeError(f"GET-205 surveillance state has no visible cue: {state['id']}")
        for obj in matches:
            if (
                obj.get("get205_state_color_token_id") != state["colorTokenId"] or
                obj.get("get205_state_glyph") != state["glyph"] or
                obj.get("get205_state_silhouette") != state["silhouette"] or
                obj.get("get205_state_motion_cue") != state["motionCue"]
            ):
                raise RuntimeError(
                    f"GET-205 surveillance cue metadata drifted: {state['id']}:{obj.name}"
                )
        records.append({
            **state,
            "objectCount": len(matches),
        })
    return records


def clone_tinted_material(
    original: bpy.types.Material,
    name: str,
    tint: tuple[float, float, float, float],
    mix_factor: float,
    roughness_floor: float,
    metallic_ceiling: float,
) -> bpy.types.Material:
    material = original.copy()
    material.name = name
    material.diffuse_color = (
        original.diffuse_color[0] * (1 - mix_factor) + tint[0] * mix_factor,
        original.diffuse_color[1] * (1 - mix_factor) + tint[1] * mix_factor,
        original.diffuse_color[2] * (1 - mix_factor) + tint[2] * mix_factor,
        original.diffuse_color[3],
    )
    if not material.use_nodes or material.node_tree is None:
        return material
    shader = next(
        (node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"),
        None,
    )
    if shader is None:
        return material
    base_color = shader.inputs.get("Base Color")
    if base_color is not None:
        previous_link = base_color.links[0] if base_color.is_linked else None
        previous_default = tuple(base_color.default_value)
        mix = material.node_tree.nodes.new("ShaderNodeMixRGB")
        mix.name = "GET205 institutional tint"
        mix.label = "GET205 institutional tint"
        mix.blend_type = "MIX"
        mix.inputs[0].default_value = mix_factor
        mix.inputs[1].default_value = previous_default
        mix.inputs[2].default_value = tint
        if previous_link is not None:
            source_socket = previous_link.from_socket
            material.node_tree.links.remove(previous_link)
            material.node_tree.links.new(source_socket, mix.inputs[1])
        material.node_tree.links.new(mix.outputs[0], base_color)
    roughness = shader.inputs.get("Roughness")
    if roughness is not None and not roughness.is_linked:
        roughness.default_value = max(float(roughness.default_value), roughness_floor)
    metallic = shader.inputs.get("Metallic")
    if metallic is not None and not metallic.is_linked:
        metallic.default_value = min(float(metallic.default_value), metallic_ceiling)
    return material


def apply_surface_treatment(
    treatment: dict[str, Any],
    grammar: dict[str, Any],
    ground_collection: bpy.types.Collection,
    base_objects: Sequence[bpy.types.Object],
) -> list[str]:
    palette = {entry["id"]: hex_color(entry["hex"]) for entry in grammar["palette"]}
    surface = treatment["surfaceTreatment"]
    window = surface["window"]
    sodium_windows = create_principled_material(
        "GET205 sodium windows",
        palette[window["colorTokenId"]],
        roughness=float(window["roughness"]),
        metallic=float(window["metallic"]),
        emission_strength=float(window["emissionStrength"]),
    )
    ground_materials = {
        entry["sourceMaterial"]: create_principled_material(
            f"GET205 {entry['sourceMaterial'].removeprefix('GET204 ').lower()}",
            hex_color(entry["color"]),
            float(entry["roughness"]),
        )
        for entry in surface["ground"]
    }
    for obj in ground_collection.objects:
        if not isinstance(obj.data, bpy.types.Mesh):
            continue
        for slot in obj.material_slots:
            if slot.material and slot.material.name in ground_materials:
                slot.material = ground_materials[slot.material.name]

    family_treatments = {
        entry["materialFamily"]: entry
        for entry in surface["families"]
    }
    override_by_placement = {entry["placementId"]: entry for entry in treatment["materialOverrides"]}
    material_cache: dict[tuple[str, str], bpy.types.Material] = {}
    applied_placement_ids: set[str] = set()
    for obj in base_objects:
        placement_id = obj.get("get204_placement_id")
        if not placement_id or placement_id not in override_by_placement or not isinstance(obj.data, bpy.types.Mesh):
            continue
        if obj.name.lower().endswith("_light"):
            assign_material(obj, sodium_windows)
            applied_placement_ids.add(str(placement_id))
            continue
        override = override_by_placement[placement_id]
        token_colors = [palette[token_id] for token_id in override["surfaceColorTokenIds"]]
        tint = blend_colors(
            token_colors,
            [0.35, 0.5, 0.15] if len(token_colors) == 3 else None,
        )
        family = family_treatments[override["materialFamily"]]
        for slot in obj.material_slots:
            if slot.material is None:
                continue
            key = (placement_id, slot.material.name)
            if key not in material_cache:
                safe_placement = placement_id.replace(".", "_")
                material_cache[key] = clone_tinted_material(
                    slot.material,
                    f"GET205.{safe_placement}.{slot.material.name}",
                    tint,
                    float(family["mixFactor"]),
                    float(family["roughnessFloor"]),
                    float(family["metallicCeiling"]),
                )
            slot.material = material_cache[key]
            applied_placement_ids.add(str(placement_id))
    return sorted(applied_placement_ids)


def build_additions(
    treatment: dict[str, Any],
    grammar: dict[str, Any],
    layout: dict[str, Any],
    recipe: dict[str, Any],
    additions_collection: bpy.types.Collection,
    lights_collection: bpy.types.Collection,
    base_objects: Sequence[bpy.types.Object],
) -> tuple[list[bpy.types.Object], list[bpy.types.Object]]:
    palette = {entry["id"]: hex_color(entry["hex"]) for entry in grammar["palette"]}
    material_profiles = {
        "ink": (0.88, 0.12, 0.0),
        "bone": (0.72, 0.08, 0.0),
        "bruised-umber": (0.82, 0.08, 0.0),
        "muted-teal": (0.78, 0.12, 0.0),
        "sodium-amber": (0.42, 0.16, 1.8),
        "technology-cyan": (0.34, 0.28, 2.2),
        "threat-crimson": (0.38, 0.2, 2.4),
    }
    token_materials = {
        token_id: create_principled_material(
            f"GET205 semantic {token_id}",
            palette[token_id],
            material_profiles[token_id][0],
            material_profiles[token_id][1],
            material_profiles[token_id][2],
        )
        for token_id in palette
    }
    public_message_material = create_principled_material(
        "GET205 public message lettering",
        palette["bone"],
        0.58,
        0.04,
        1.35,
    )
    anchors = {entry["id"]: entry for entry in layout["anchors"]}
    placements = {entry["id"]: entry for entry in recipe["buildingPlacements"]}
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    created: list[bpy.types.Object] = []
    practical_lights: list[bpy.types.Object] = []
    addition_by_id = {entry["id"]: entry for entry in treatment["additions"]}
    grammar_by_id = {entry["id"]: entry for entry in grammar["entries"]}
    message_by_id = {entry["id"]: entry for entry in treatment["publicMessageTemplates"]}
    placement_bounds = placement_world_bounds(base_objects)

    for raw_addition in treatment["additions"]:
        addition = dict(raw_addition)
        grammar_entry = grammar_by_id[addition["grammarId"]]
        addition["_resolvedGrammar"] = grammar_entry
        position = target_position(addition, anchors, placements, unit)
        prefix = f"GET205.{addition['id']}"
        kind = (
            "practical-light-source"
            if addition["kind"] == "practical-light-source"
            else grammar_entry["kind"]
        )
        accent = token_materials[grammar_entry["colorTokenId"]]
        if kind == "camera":
            created.append(create_cylinder(
                f"{prefix}.pole", position + Vector((0, 0, 2.05)), 0.11, 4.1,
                token_materials["ink"], additions_collection, addition,
            ))
            created.append(create_cube(
                f"{prefix}.hood", position + Vector((0, 0, 4.22)), (1.08, 0.72, 0.56),
                math.radians(-45), token_materials["ink"], additions_collection, addition,
            ))
            created.extend(create_surveillance_state_cues(
                prefix,
                position + Vector((0.43, 0.43, 4.22)),
                addition,
                grammar,
                token_materials,
                additions_collection,
            ))
        elif kind == "terminal":
            created.append(create_cube(
                f"{prefix}.frame", position + Vector((0, 0, 1.2)), (1.35, 0.4, 1.85),
                math.radians(-45), token_materials["ink"], additions_collection, addition,
            ))
            created.append(create_cube(
                f"{prefix}.screen", position + Vector((0.19, 0.19, 1.43)), (0.96, 0.1, 0.68),
                math.radians(-45), accent, additions_collection, addition,
            ))
            created.append(create_torus(
                f"{prefix}.connection", position + Vector((0.24, 0.24, 0.82)),
                (math.radians(90), 0, math.radians(-45)), 0.26, 0.04,
                accent, additions_collection, addition,
            ))
            created.extend(create_surveillance_state_cues(
                prefix,
                position + Vector((0.34, 0.34, 1.45)),
                addition,
                grammar,
                token_materials,
                additions_collection,
            ))
        elif kind == "identity-checkpoint":
            for offset in (-1.55, 1.55):
                created.append(create_cube(
                    f"{prefix}.post.{offset:+.2f}", position + Vector((offset, 0, 2.1)),
                    (0.28, 0.42, 4.2), 0, token_materials["ink"], additions_collection, addition,
                ))
            created.append(create_cube(
                f"{prefix}.header", position + Vector((0, 0, 4.08)), (3.4, 0.42, 0.34),
                0, accent, additions_collection, addition, "caution",
            ))
        elif kind == "public-screen":
            target_id = addition["target"]["id"]
            if target_id not in placement_bounds:
                raise RuntimeError(f"Missing measured bounds for GET-205 public screen: {target_id}")
            minimum, maximum = placement_bounds[target_id]
            height = max(2.8, (maximum.z - minimum.z) * 0.56)
            span_x = maximum.x - minimum.x
            span_y = maximum.y - minimum.y
            mount_on_x = span_y >= span_x
            if mount_on_x:
                position = Vector((maximum.x + 0.08, (minimum.y + maximum.y) / 2, minimum.z + height))
                frame_dimensions = (0.26, 5.8, 3.15)
                panel_dimensions = (0.08, 5.14, 2.48)
                face_offset = Vector((0.17, 0, 0))
                seal_rotation = (0, math.radians(90), 0)
                text_rotation = (math.radians(90), 0, math.radians(90))
            else:
                position = Vector(((minimum.x + maximum.x) / 2, maximum.y + 0.08, minimum.z + height))
                frame_dimensions = (5.8, 0.26, 3.15)
                panel_dimensions = (5.14, 0.08, 2.48)
                face_offset = Vector((0, 0.17, 0))
                seal_rotation = (math.radians(90), 0, 0)
                text_rotation = (math.radians(90), 0, math.radians(180))
            created.append(create_cube(
                f"{prefix}.frame", position, frame_dimensions, 0,
                token_materials["ink"], additions_collection, addition,
            ))
            created.append(create_cube(
                f"{prefix}.panel", position + face_offset, panel_dimensions,
                0, accent, additions_collection, addition,
            ))
            created.append(create_torus(
                f"{prefix}.seal", position + face_offset * 1.7,
                seal_rotation, 0.68, 0.1,
                token_materials["bone"], additions_collection, addition,
            ))
            for offset in (-1.75, 1.75):
                rule_position = position + face_offset * 1.5
                rule_dimensions = (0.04, 0.16, 1.74) if mount_on_x else (0.16, 0.04, 1.74)
                if mount_on_x:
                    rule_position.y += offset
                else:
                    rule_position.x += offset
                created.append(create_cube(
                    f"{prefix}.rule.{offset:+.1f}", rule_position,
                    rule_dimensions, 0, token_materials["bone"],
                    additions_collection, addition,
                ))
            message_ids = addition["messageTemplateIds"]
            for index, message_id in enumerate(message_ids):
                message = message_by_id[message_id]
                wrapped = "\n".join(textwrap.wrap(message["copy"], width=28))
                message_position = position + face_offset * 2.0
                if len(message_ids) > 1:
                    message_position.z += 0.5 if index == 0 else -0.5
                created.append(create_text(
                    f"{prefix}.message.{message_id}",
                    wrapped,
                    message_position,
                    text_rotation,
                    0.32 if len(message_ids) > 1 else 0.38,
                    public_message_material,
                    additions_collection,
                    addition,
                    message,
                ))
        elif kind == "controlled-entrance":
            for offset in (-1.35, 1.35):
                created.append(create_cube(
                    f"{prefix}.bracket.{offset:+.2f}", position + Vector((offset, 0, 1.75)),
                    (0.24, 0.34, 3.5), 0, token_materials["ink"], additions_collection, addition,
                ))
            created.append(create_cube(
                f"{prefix}.threshold", position + Vector((0, 0, 3.38)), (2.94, 0.34, 0.26),
                0, accent, additions_collection, addition, "caution",
            ))
        elif kind in {"transit-wayfinding", "service-wayfinding"}:
            is_transit = kind == "transit-wayfinding"
            created.append(create_cube(
                f"{prefix}.plinth", position + Vector((0, 0, 0.8)),
                (2.1 if is_transit else 1.0, 0.36, 2.1), math.radians(-45),
                token_materials["ink"], additions_collection, addition,
            ))
            created.append(create_cube(
                f"{prefix}.glyph", position + Vector((0.17, 0.17, 0.92)),
                (1.4 if is_transit else 0.5, 0.08, 0.24), math.radians(-45),
                accent, additions_collection, addition,
            ))
        elif kind == "hiding-context":
            created.append(create_cube(
                f"{prefix}.shadow-back", position + Vector((0, 0, 1.6)), (3.4, 0.42, 3.2),
                math.radians(-45), accent, additions_collection, addition,
            ))
            created.append(create_cube(
                f"{prefix}.canopy", position + Vector((0, 0, 3.2)), (3.4, 1.9, 0.22),
                math.radians(-45), accent, additions_collection, addition,
            ))
        elif kind == "blending-context":
            for offset in (-0.9, 0, 0.9):
                created.append(create_cube(
                    f"{prefix}.queue.{offset:+.1f}", position + Vector((offset, 0, 0.08)),
                    (0.18, 4.2, 0.1), math.radians(-45), accent,
                    additions_collection, addition,
                ))
        elif kind == "threat-hook":
            for index, offset in enumerate((-0.48, 0.48)):
                obj = create_cube(
                    f"{prefix}.chevron.{index}", position + Vector((offset, 0, 1.3)),
                    (0.62, 0.12, 0.22), math.radians(-45), accent,
                    additions_collection, addition, "threat-hook",
                )
                obj.hide_render = True
                created.append(obj)
        elif kind == "practical-light-source":
            created.append(create_cylinder(
                f"{prefix}.pole", position + Vector((0, 0, 2.45)), 0.09, 4.9,
                token_materials["ink"], additions_collection, addition,
            ))
            created.append(create_cube(
                f"{prefix}.fixture", position + Vector((0, 0, 4.96)), (1.02, 0.56, 0.26),
                math.radians(-45), accent, additions_collection, addition,
            ))
        else:
            raise RuntimeError(f"Unsupported GET-205 addition kind: {kind}")

    for index, light in enumerate(treatment["practicalLights"]):
        addition = addition_by_id[light["sourceAdditionId"]]
        position = target_position(addition, anchors, placements, unit)
        light_data = bpy.data.lights.new(f"GET205 practical {light['id']}", "AREA")
        light_data.energy = 1200
        light_data.shape = "DISK"
        light_data.size = 5.5
        light_data.color = palette["sodium-amber"][:3]
        light_object = bpy.data.objects.new(f"GET205 practical {light['id']}", light_data)
        light_object.location = position + Vector((0, 0, 4.72))
        light_object.rotation_euler = (0, 0, 0)
        light_object["get205_light_id"] = light["id"]
        light_object["get205_light_index"] = index
        lights_collection.objects.link(light_object)
        practical_lights.append(light_object)
    return created, practical_lights


def add_actor_placeholders(
    layout: dict[str, Any],
    recipe: dict[str, Any],
    proof_collection: bpy.types.Collection,
    material: bpy.types.Material,
) -> list[bpy.types.Object]:
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    anchors = {entry["id"]: entry for entry in layout["anchors"]}
    created: list[bpy.types.Object] = []
    proof_addition = {
        "id": "proof.actor-placeholders",
        "purpose": "contact",
        "collisionEffect": "none",
        "grammarId": "proof-only",
    }
    for anchor_id in ("contact.naila", "contact.brant"):
        point = anchors[anchor_id]["position"]
        position = Vector((point["x"] * unit, point["y"] * unit, 0))
        body = create_cylinder(
            f"GET205.proof.{anchor_id}.body", position + Vector((0, 0, 0.9)),
            0.24, 1.45, material, proof_collection, proof_addition, vertices=12,
        )
        head = create_cylinder(
            f"GET205.proof.{anchor_id}.head", position + Vector((0, 0, 1.72)),
            0.19, 0.32, material, proof_collection, proof_addition, vertices=12,
        )
        body["get205_role"] = "actor-placeholder"
        head["get205_role"] = "actor-placeholder"
        created.extend((body, head))
    return created


def configure_schedule(
    scene: bpy.types.Scene,
    state: str,
    surveillance: str,
    treatment: dict[str, Any],
    grammar: dict[str, Any],
    practical_lights: Sequence[bpy.types.Object],
    additions: Sequence[bpy.types.Object],
) -> None:
    palette = {entry["id"]: hex_color(entry["hex"]) for entry in grammar["palette"]}
    schedule = next(entry for entry in treatment["scheduleStates"] if entry["id"] == state)
    ambient = palette[schedule["ambientColorTokenId"]]
    midtone = float(schedule["architectureMidtoneFloor"])
    practical_multiplier = float(schedule["practicalLightMultiplier"])
    background_color = scale_color(ambient, max(0.04, midtone * 0.34))
    fill_color = blend_colors((ambient, palette["muted-teal"], palette["bone"]), (0.5, 0.35, 0.15))
    sun_color = blend_colors((ambient, palette["sodium-amber"], palette["bone"]), (0.25, practical_multiplier, 0.35))
    if scene.world and scene.world.node_tree:
        background = scene.world.node_tree.nodes.get("Background")
        if background:
            background.inputs["Color"].default_value = background_color
            background.inputs["Strength"].default_value = 0.52 + midtone * 1.25
    scene.view_settings.exposure = 0.74 + midtone * 1.85
    sodium_windows = bpy.data.materials.get("GET205 sodium windows")
    if sodium_windows and sodium_windows.node_tree:
        shader = next(
            (node for node in sodium_windows.node_tree.nodes if node.type == "BSDF_PRINCIPLED"),
            None,
        )
        emission = shader.inputs.get("Emission Strength") if shader else None
        if emission is not None:
            emission.default_value = 0.45 + practical_multiplier * 1.3
    sun = bpy.data.objects.get("GET204 neutral upper-left sun")
    fill = bpy.data.objects.get("GET204 neutral sky fill")
    if sun and isinstance(sun.data, bpy.types.Light):
        sun.data.energy = 0.48 + midtone * 5.25
        sun.data.color = sun_color[:3]
    if fill and isinstance(fill.data, bpy.types.Light):
        fill.data.energy = 2400 + midtone * 11_000
        fill.data.color = fill_color[:3]

    for obj in additions:
        cue_state = obj.get("get205_state_cue")
        semantic = obj.get("get205_state_sensitive")
        if cue_state:
            obj.hide_render = cue_state != surveillance
        elif semantic == "threat-hook":
            obj.hide_render = surveillance != "pursuit"

    light_by_id = {entry["id"]: entry for entry in treatment["practicalLights"]}
    for light in practical_lights:
        definition = light_by_id[light["get205_light_id"]]
        light.data.energy = (
            3600 * practical_multiplier * float(definition["stateIntensity"][state])
        )
        light.data.color = palette[definition["colorTokenId"]][:3]
        light.hide_render = False


def target_for_capture(
    target_id: str,
    layout: dict[str, Any],
    recipe: dict[str, Any],
) -> Vector:
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    anchors = {entry["id"]: entry for entry in layout["anchors"]}
    placements = {entry["id"]: entry for entry in recipe["buildingPlacements"]}
    if target_id in anchors:
        point = anchors[target_id]["position"]
    elif target_id in placements:
        point = placements[target_id]["layoutPosition"]
    else:
        raise RuntimeError(f"Unknown GET-205 capture target: {target_id}")
    return Vector((point["x"] * unit, point["y"] * unit, 0))


def render_preview(
    scene: bpy.types.Scene,
    camera: bpy.types.Object,
    generated_root: Path,
    get204: Any,
) -> Path:
    scene.render.resolution_x = 2048
    scene.render.resolution_y = 1152
    mesh_objects = [obj for obj in scene.objects if obj.type == "MESH" and not obj.hide_render]
    target = Vector((126, 90, 5.5))
    get204.set_camera_target(camera, target)
    camera.data.ortho_scale = get204.fit_camera_to_objects(camera, mesh_objects, 2048 / 1152, margin=1.08)
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
    treatment: dict[str, Any],
    grammar: dict[str, Any],
    practical_lights: Sequence[bpy.types.Object],
    additions: Sequence[bpy.types.Object],
    get204: Any,
    capture_id: str | None = None,
) -> list[Path]:
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    pixels_per_meter = recipe["camera"]["tileWidth"] / 2 / (unit / math.sqrt(2))
    target_lift = get204.runtime_follow_target_lift_meters(recipe)
    outputs: list[Path] = []
    capture_root = generated_root / "captures"
    if capture_root.exists() and capture_id is None:
        shutil.rmtree(capture_root)
    capture_root.mkdir(parents=True, exist_ok=True)
    for capture in treatment["captures"]:
        if capture_id is not None and capture["id"] != capture_id:
            continue
        if not SAFE_CAPTURE_ID.fullmatch(capture["id"]):
            raise RuntimeError(f"Unsafe GET-205 capture ID: {capture['id']}")
        surveillance = "clear"
        if capture["id"] == "proof.suspicious-hook":
            surveillance = "suspicious"
        elif capture["id"] == "proof.pursuit-hook":
            surveillance = "pursuit"
        configure_schedule(
            scene,
            capture["schedule"],
            surveillance,
            treatment,
            grammar,
            practical_lights,
            additions,
        )
        target = target_for_capture(capture["targetId"], layout, recipe)
        target.z = target_lift
        get204.set_camera_target(camera, target)
        scene.render.resolution_x = int(capture["width"])
        scene.render.resolution_y = int(capture["height"])
        camera.data.ortho_scale = capture["height"] / (
            pixels_per_meter * float(capture["zoom"]) * PIXEL_DENSITY_MARGIN
        )
        output = resolve_within(capture_root, f"{capture['id']}.png", "GET-205 capture output")
        scene.render.filepath = str(output)
        bpy.ops.render.render(write_still=True)
        outputs.append(output)
    if capture_id is not None and not outputs:
        raise RuntimeError(f"Unknown GET-205 capture ID: {capture_id}")
    return outputs


def create_lighting_foundation(
    state: str,
    layout: dict[str, Any],
    recipe: dict[str, Any],
    treatment: dict[str, Any],
    grammar: dict[str, Any],
    target_collection: bpy.types.Collection,
    get204: Any,
) -> list[bpy.types.Material]:
    palette = {entry["id"]: hex_color(entry["hex"]) for entry in grammar["palette"]}
    state_definition = next(entry for entry in treatment["scheduleStates"] if entry["id"] == state)
    atmosphere_color = palette[state_definition["ambientColorTokenId"]]
    atmosphere = get204.create_flat_export_material(
        f"GET205 {state} atmosphere",
        (*atmosphere_color[:3], float(state_definition["atmosphereOpacity"])),
    )
    practical = get204.create_flat_export_material(
        f"GET205 {state} practical pools",
        (*palette["sodium-amber"][:3], 0.16 * float(state_definition["practicalLightMultiplier"])),
    )
    unit = float(recipe["coordinateSystem"]["layoutUnitMeters"])
    get204.create_prism(
        f"GET205.export.{state}.atmosphere",
        layout["bounds"],
        unit,
        0.025,
        0.0,
        atmosphere,
        target_collection,
    )
    anchors = {entry["id"]: entry for entry in layout["anchors"]}
    for light in treatment["practicalLights"]:
        anchor = anchors[light["anchorId"]]
        get204.create_prism(
            f"GET205.export.{state}.{light['id']}",
            get204.circle_polygon(anchor["position"], 2.7, 32),
            unit,
            0.03,
            0.0,
            practical,
            target_collection,
        )
    return [atmosphere, practical]


def t5_recipe(recipe: dict[str, Any], treatment: dict[str, Any]) -> dict[str, Any]:
    del treatment
    result = copy.deepcopy(recipe)
    return result


def render_aligned_exports(
    scene: bpy.types.Scene,
    camera: bpy.types.Object,
    generated_root: Path,
    layout: dict[str, Any],
    recipe: dict[str, Any],
    treatment: dict[str, Any],
    grammar: dict[str, Any],
    ground_collection: bpy.types.Collection,
    architecture_back: bpy.types.Collection,
    architecture_front: bpy.types.Collection,
    gameplay_structures: bpy.types.Collection,
    additions_collection: bpy.types.Collection,
    practical_lights_collection: bpy.types.Collection,
    proof_collection: bpy.types.Collection,
    base_export_root: Path,
    get204: Any,
) -> list[Path]:
    export_root = generated_root / "aligned-export"
    base_art_manifest_path = base_export_root / "art-manifest.json"
    if not base_art_manifest_path.is_file():
        raise RuntimeError(f"Missing verified GET-204 aligned export: {base_art_manifest_path}")
    if sha256_file(base_art_manifest_path) != treatment["base"]["alignedExport"]["manifestSha256"]:
        raise RuntimeError("GET-204 aligned art manifest drifted before GET-205 export")
    base_art_manifest = read_json(base_art_manifest_path)
    if (
        semantic_mask_registration_digest(base_art_manifest)
        != treatment["base"]["alignedExport"]["semanticMaskRegistrationDigest"]
    ):
        raise RuntimeError("GET-204 semantic-mask registration drifted before GET-205 export")
    if export_root.exists():
        if export_root.name != "aligned-export" or export_root.parent != generated_root:
            raise RuntimeError(f"Refusing to replace unexpected GET-205 export root: {export_root}")
        shutil.rmtree(export_root)
    export_root.mkdir(parents=True, exist_ok=True)
    base_layers_by_id = {entry["id"]: entry for entry in base_art_manifest["layers"]}
    lighting_helpers = get204.collection(LIGHTING_HELPERS_COLLECTION, scene.collection)
    managed = [
        ground_collection,
        architecture_back,
        architecture_front,
        gameplay_structures,
        additions_collection,
        practical_lights_collection,
        proof_collection,
        lighting_helpers,
    ]
    visibility = {item.name: item.hide_render for item in managed}
    camera_matrix = camera.matrix_world.copy()
    camera_scale = float(camera.data.ortho_scale)
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
    temporary_materials: list[bpy.types.Material] = []
    recipe_t5 = t5_recipe(recipe, treatment)

    def show_only(names: set[str]) -> None:
        for item in managed:
            item.hide_render = item.name not in names
        bpy.context.view_layer.update()

    def clear_helpers() -> None:
        get204.clear_export_helpers(lighting_helpers)
        for material in list(temporary_materials):
            if material.users == 0:
                bpy.data.materials.remove(material)
            temporary_materials.remove(material)

    try:
        scene.render.film_transparent = True
        scene.view_settings.exposure = 1.05
        projection_evidence = get204.verify_aligned_projection(scene, camera, recipe_t5)
        projection_evidence["renderableScene"] = get204.verify_renderable_scene_extents(
            scene,
            camera,
            recipe_t5,
            [ground_collection, architecture_back, architecture_front, gameplay_structures, additions_collection],
        )
        anchor_registration = copy.deepcopy(base_art_manifest["anchorMetadata"])
        base_anchor_path = resolve_within(
            base_export_root,
            anchor_registration["path"],
            "GET-204 anchor metadata path",
        )
        anchor_path = resolve_within(
            export_root,
            anchor_registration["path"],
            "GET-205 anchor metadata path",
        )
        if not base_anchor_path.is_file():
            raise RuntimeError(f"Missing immutable GET-204 anchor metadata: {base_anchor_path}")
        anchor_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(base_anchor_path, anchor_path)
        if sha256_file(anchor_path) != anchor_registration["sha256"]:
            raise RuntimeError("Copied GET-204 anchor metadata drifted during GET-205 export")
        outputs.append(anchor_path)
        for layer in recipe_t5["layers"]:
            clear_helpers()
            if layer["kind"] == "semantic-mask":
                base_layer = base_layers_by_id.get(layer["id"])
                if (
                    base_layer is None or
                    base_layer.get("kind") != "semantic-mask" or
                    base_layer.get("maskId") != layer["maskId"]
                ):
                    raise RuntimeError(f"Missing immutable GET-204 semantic layer: {layer['id']}")
                tiles = copy.deepcopy(base_layer["tiles"])
                layer_outputs: list[Path] = []
                for tile in tiles:
                    if not tile["imagePath"].startswith("environment/level0/t4/"):
                        raise RuntimeError(f"Unsafe GET-204 semantic tile path: {tile['imagePath']}")
                    source_tile = resolve_within(
                        base_export_root,
                        tile["imagePath"],
                        "GET-204 semantic tile path",
                    )
                    target_tile = resolve_within(
                        export_root,
                        tile["imagePath"],
                        "GET-205 semantic tile path",
                    )
                    if not source_tile.is_file() or sha256_file(source_tile) != tile["sha256"]:
                        raise RuntimeError(f"Immutable GET-204 semantic tile drifted: {source_tile}")
                    target_tile.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(source_tile, target_tile)
                    layer_outputs.append(target_tile)
                art_layers.append({
                    "id": layer["id"],
                    "kind": layer["kind"],
                    "tiles": tiles,
                    "fallbackLayerId": layer["fallbackLayerId"],
                    "maskId": layer["maskId"],
                })
                outputs.extend(layer_outputs)
                continue
            if layer["kind"] == "ground":
                show_only({ground_collection.name})
            elif layer["kind"] == "architecture-back":
                show_only({architecture_back.name})
            elif layer["kind"] == "architecture-front":
                show_only({architecture_front.name, gameplay_structures.name, additions_collection.name})
            elif layer["kind"] == "lighting-foundation":
                show_only({lighting_helpers.name})
                temporary_materials.extend(create_lighting_foundation(
                    layer["state"], layout, recipe_t5, treatment, grammar, lighting_helpers, get204
                ))
                scene.view_settings.view_transform = "Standard"
                scene.view_settings.exposure = 0
                scene.view_settings.gamma = 1
            else:
                raise RuntimeError(f"Unsupported GET-205 export layer: {layer['id']}")

            tiles, layer_outputs = get204.render_aligned_layer_tiles(
                scene, camera, export_root, recipe_t5, layer
            )
            entry = {
                "id": layer["id"],
                "kind": layer["kind"],
                "tiles": tiles,
                "fallbackLayerId": layer["fallbackLayerId"],
            }
            if "state" in layer:
                entry["state"] = layer["state"]
            if "maskId" in layer:
                entry["maskId"] = layer["maskId"]
            art_layers.append(entry)
            outputs.extend(layer_outputs)
            scene.view_settings.view_transform = render_state["view_transform"]
            try:
                scene.view_settings.look = render_state["look"]
            except TypeError:
                pass
            scene.view_settings.exposure = render_state["exposure"]
            scene.view_settings.gamma = render_state["gamma"]

        temporary_t4_root = resolve_within(
            export_root,
            "environment/level0/t4",
            "GET-205 temporary export root",
        )
        final_t5_root = resolve_within(
            export_root,
            treatment["output"]["pathPrefix"],
            "GET-205 final export root",
        )
        if final_t5_root.exists():
            shutil.rmtree(final_t5_root)
        final_t5_root.parent.mkdir(parents=True, exist_ok=True)
        temporary_t4_root.rename(final_t5_root)
        for layer in art_layers:
            for tile in layer["tiles"]:
                tile["imagePath"] = tile["imagePath"].replace("environment/level0/t4", treatment["output"]["pathPrefix"])
        anchor_registration["path"] = anchor_registration["path"].replace(
            "environment/level0/t4", treatment["output"]["pathPrefix"]
        )
        outputs = [
            Path(str(path).replace("environment/level0/t4", treatment["output"]["pathPrefix"]))
            for path in outputs
        ]
        measured_total = sum(tile["byteSize"] for layer in art_layers for tile in layer["tiles"])
        if measured_total > int(treatment["output"]["budget"]["maxTotalBytes"]):
            raise RuntimeError(f"GET-205 aligned export exceeds byte budget: {measured_total}")
        canvas = recipe_t5["alignedExport"]["canvas"]
        manifest = {
            "schemaVersion": 1,
            "id": "level0-tokyo-t5-hidzu-aligned-export-v1",
            "usage": treatment["usage"],
            "treatmentId": treatment["id"],
            "baseRecipeId": recipe["id"],
            "recipeId": recipe_t5["id"],
            "layoutContractId": layout["id"],
            "geometrySignature": treatment["base"]["immutable"]["geometrySignature"],
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
                **treatment["output"]["budget"],
                "measuredTotalBytes": measured_total,
            },
            "layers": art_layers,
            "anchorMetadata": anchor_registration,
            "fallbackProfile": treatment["output"]["fallbackProfile"],
            "projectionVerification": projection_evidence,
            "licenseBoundary": "ignored-local-evidence; no runtime promotion without entitlement",
        }
        manifest_path = export_root / "art-manifest.json"
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        outputs.append(manifest_path)
    finally:
        clear_helpers()
        if lighting_helpers.users == 0:
            bpy.data.collections.remove(lighting_helpers)
        for item in managed:
            if item.name in visibility:
                item.hide_render = visibility[item.name]
        camera.matrix_world = camera_matrix
        camera.data.ortho_scale = camera_scale
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


def write_evidence(
    generated_root: Path,
    treatment: dict[str, Any],
    grammar: dict[str, Any],
    reference_hash: str,
    before_matrix_digest: str,
    after_matrix_digest: str,
    camera_before_digest: str,
    camera_after_digest: str,
    additions: Sequence[bpy.types.Object],
    practical_lights: Sequence[bpy.types.Object],
    material_override_ids: Sequence[str],
    outputs: Sequence[Path],
    generation_mode: str,
    requested_capture_id: str | None,
) -> None:
    capture_by_id = {entry["id"]: entry for entry in treatment["captures"]}
    output_records = [
        {
            "path": str(path.relative_to(generated_root)),
            "sha256": sha256_file(path),
            "byteSize": path.stat().st_size,
        }
        for path in outputs
        if path.exists() and path.is_file()
    ]
    generated_captures = []
    for record in output_records:
        path = Path(record["path"])
        if len(path.parts) != 2 or path.parts[0] != "captures" or path.suffix != ".png":
            continue
        capture_id = path.stem
        definition = capture_by_id.get(capture_id)
        if definition is None:
            raise RuntimeError(f"Generated unregistered GET-205 capture: {capture_id}")
        generated_captures.append({
            "id": capture_id,
            "path": record["path"],
            "sha256": record["sha256"],
            "byteSize": record["byteSize"],
            "width": definition["width"],
            "height": definition["height"],
            "schedule": definition["schedule"],
            "evidence": definition["evidence"],
        })
    registered_addition_ids = sorted({
        str(obj.get("get205_addition_id"))
        for obj in additions
        if obj.get("get205_addition_id") in {entry["id"] for entry in treatment["additions"]}
    })
    addition_bounds = measured_addition_bounds(additions, treatment)
    grammar_bindings = measured_grammar_bindings(additions, treatment, grammar)
    public_messages = measured_public_messages(additions, treatment)
    surveillance_state_cues = measured_surveillance_state_cues(additions, grammar)
    overview = next(
        (path for path in outputs if path.relative_to(generated_root).as_posix() == "master/overview.png"),
        None,
    )
    palette_coverage = (
        measure_palette_coverage(overview, generated_root, grammar)
        if overview is not None
        else None
    )
    payload = {
        "schemaVersion": 1,
        "ticket": "GET-205",
        "generationMode": generation_mode,
        "requestedCaptureId": requested_capture_id,
        "treatmentId": treatment["id"],
        "usage": treatment["usage"],
        "baseGeometrySignature": treatment["base"]["immutable"]["geometrySignature"],
        "referenceSha256": reference_hash,
        "visualGrammarId": grammar["id"],
        "visualGrammarSha256": treatment["grammar"]["sha256"],
        "surfaceTreatmentDigest": canonical_digest(treatment["surfaceTreatment"]),
        "grammarBindings": grammar_bindings,
        "publicMessages": public_messages,
        "surveillanceStateCues": surveillance_state_cues,
        "paletteCoverage": palette_coverage,
        "beforeMatrixDigest": before_matrix_digest,
        "afterMatrixDigest": after_matrix_digest,
        "cameraBeforeDigest": camera_before_digest,
        "cameraAfterDigest": camera_after_digest,
        "addedObjectCount": len(treatment["additions"]),
        "registeredAdditionIds": registered_addition_ids,
        "additionBounds": addition_bounds,
        "generatedObjectCount": len(additions),
        "practicalLightCount": len(treatment["practicalLights"]),
        "practicalLightIds": sorted(str(light["get205_light_id"]) for light in practical_lights),
        "materialOverrideCount": len(material_override_ids),
        "materialOverrideIds": sorted(material_override_ids),
        "scheduleStates": [entry["id"] for entry in treatment["scheduleStates"]],
        "requiredCaptures": [
            {"id": entry["id"], "evidence": entry["evidence"]}
            for entry in treatment["captures"]
        ],
        "generatedCaptures": generated_captures,
        "outputs": output_records,
        "generatedOutputsIgnored": True,
        "runtimeReady": False,
        "entitlementBoundary": "acquisition-specific-evidence-unavailable",
    }
    (generated_root / "treatment-evidence.json").write_text(
        json.dumps(payload, indent=2) + "\n", encoding="utf-8"
    )


def main() -> None:
    args = parse_args()
    if tuple(bpy.app.version) != EXPECTED_BLENDER_VERSION:
        raise RuntimeError(
            f"GET-205 requires Blender {'.'.join(map(str, EXPECTED_BLENDER_VERSION))}; "
            f"found {bpy.app.version_string}"
        )
    repo_root = args.repo_root.resolve()
    treatment_path = repo_root / "art/blender/get205/manifests/hidzu-treatment.json"
    grammar_path = repo_root / "art/blender/get205/manifests/hidzu-visual-grammar.json"
    treatment = read_json(treatment_path)
    grammar = read_json(grammar_path)
    recipe = read_json(repo_root / treatment["base"]["sceneRecipe"]["path"])
    layout_export = read_json(repo_root / treatment["base"]["layoutContract"]["path"])
    layout = layout_export["contract"]
    base_scene_path = repo_root / treatment["base"]["masterScene"]["path"]
    reference_path = repo_root / treatment["reference"]["path"]
    if sha256_file(base_scene_path) != treatment["base"]["masterScene"]["sha256"]:
        raise RuntimeError("GET-204 base scene hash drifted before GET-205 treatment")
    if sha256_file(reference_path) != treatment["reference"]["sha256"]:
        raise RuntimeError("GET-205 reference image hash drifted")

    get204 = load_get204_module(repo_root)
    bpy.ops.wm.open_mainfile(filepath=str(base_scene_path))
    scene = bpy.context.scene
    camera = scene.camera
    if camera is None:
        raise RuntimeError("GET-204 base scene has no camera")
    camera_matrix = camera.matrix_world.copy()
    camera_scale = float(camera.data.ortho_scale)
    base_objects = [obj for obj in scene.objects if obj.type == "MESH"]
    before_matrix_digest = matrix_digest(base_objects)
    camera_before_digest = camera_digest(camera)

    ground = bpy.data.collections.get("GET204_GROUND")
    architecture_back = bpy.data.collections.get("GET204_ARCHITECTURE_BACK")
    architecture_front = bpy.data.collections.get("GET204_ARCHITECTURE_FRONT")
    gameplay_structures = bpy.data.collections.get("GET204_GAMEPLAY_STRUCTURES")
    proof = bpy.data.collections.get("GET204_SCALE_AND_ENTRANCE_PROOF")
    required_collections = [ground, architecture_back, architecture_front, gameplay_structures, proof]
    if any(item is None for item in required_collections):
        raise RuntimeError("GET-204 base scene is missing a required authored collection")
    additions_collection = get204.collection(ADDITIONS_COLLECTION, scene.collection)
    practical_lights_collection = get204.collection(PRACTICAL_LIGHTS_COLLECTION, scene.collection)

    material_override_ids = apply_surface_treatment(treatment, grammar, ground, base_objects)
    expected_material_override_ids = sorted(
        entry["placementId"] for entry in treatment["materialOverrides"]
    )
    if material_override_ids != expected_material_override_ids:
        raise RuntimeError(
            "GET-205 failed to apply its exact material override set: "
            f"expected {expected_material_override_ids}, measured {material_override_ids}"
        )
    additions, practical_lights = build_additions(
        treatment,
        grammar,
        layout,
        recipe,
        additions_collection,
        practical_lights_collection,
        base_objects,
    )
    bone = create_principled_material("GET205 actor proof bone", hex_color("#d5c8b5"), 0.78)
    additions.extend(add_actor_placeholders(layout, recipe, proof, bone))
    after_matrix_digest = matrix_digest(base_objects)
    if before_matrix_digest != after_matrix_digest:
        raise RuntimeError("GET-205 changed an immutable GET-204 mesh transform")
    camera_after_treatment_digest = camera_digest(camera)
    if camera_before_digest != camera_after_treatment_digest:
        raise RuntimeError("GET-205 changed the immutable GET-204 camera before rendering")

    staging_root = (repo_root / "art/blender/get205/.staging").resolve()
    if args.generated_root is None:
        raise RuntimeError(
            "GET-205 Blender generation requires a run-scoped --generated-root under .staging"
        )
    generated_root = args.generated_root.resolve()
    if generated_root == staging_root or staging_root not in generated_root.parents:
        raise RuntimeError(
            f"GET-205 generated root must be a run-scoped staging path: "
            f"{generated_root}"
        )
    generated_root.mkdir(parents=True, exist_ok=True)
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.film_transparent = False
    scene.render.resolution_percentage = 100
    try:
        scene.view_settings.look = "AgX - Medium Low Contrast"
    except TypeError:
        pass
    outputs: list[Path] = []
    configure_schedule(scene, "dusk", "clear", treatment, grammar, practical_lights, additions)
    if args.mode in {"preview", "all"}:
        outputs.append(render_preview(scene, camera, generated_root, get204))
    if args.mode in {"captures", "all"}:
        outputs.extend(render_captures(
            scene,
            camera,
            generated_root,
            layout,
            recipe,
            treatment,
            grammar,
            practical_lights,
            additions,
            get204,
            args.capture_id,
        ))
    if args.mode in {"exports", "all"}:
        configure_schedule(scene, "dusk", "clear", treatment, grammar, practical_lights, additions)
        outputs.extend(render_aligned_exports(
            scene,
            camera,
            generated_root,
            layout,
            recipe,
            treatment,
            grammar,
            ground,
            architecture_back,
            architecture_front,
            gameplay_structures,
            additions_collection,
            practical_lights_collection,
            proof,
            repo_root / "art/blender/get204/.generated/aligned-export",
            get204,
        ))

    camera.matrix_world = camera_matrix
    camera.data.ortho_scale = camera_scale
    bpy.context.view_layer.update()
    camera_after_digest = camera_digest(camera)
    if camera_before_digest != camera_after_digest:
        raise RuntimeError("GET-205 failed to restore the immutable GET-204 camera")
    scene_path = generated_root / "get205-level0-hidzu.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(scene_path), compress=True)
    outputs.append(scene_path)
    write_evidence(
        generated_root,
        treatment,
        grammar,
        treatment["reference"]["sha256"],
        before_matrix_digest,
        after_matrix_digest,
        camera_before_digest,
        camera_after_digest,
        additions,
        practical_lights,
        material_override_ids,
        outputs,
        args.mode,
        args.capture_id,
    )
    print(
        f"GET-205 Hidzu treatment complete: {len(treatment['additions'])} registered additions, "
        f"{len(additions)} generated objects, {len(outputs)} evidence files -> {generated_root}"
    )


if __name__ == "__main__":
    try:
        main()
    except Exception:
        traceback.print_exc()
        sys.exit(1)
