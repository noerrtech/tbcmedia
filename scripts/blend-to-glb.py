"""
Exports a Poly Haven .blend model to a web-ready .glb (textures embedded as WebP, capped in size).

  /Applications/Blender.app/Contents/MacOS/Blender -b model.blend --python scripts/blend-to-glb.py -- out.glb 2048

Prints each mesh's name, face count and size (metres) so placement can be planned.
"""
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1 :]
out = argv[0]
max_size = int(argv[1]) if len(argv) > 1 else 2048

# Shrink oversized textures in memory (the source files are never written to).
for img in bpy.data.images:
    if img.source != "FILE":
        continue
    try:
        img.reload()
        w, h = img.size
        if w and h and max(w, h) > max_size:
            k = max_size / max(w, h)
            img.scale(int(w * k), int(h * k))
    except Exception as e:  # a missing texture shouldn't stop the export
        print(f"IMAGE-SKIP {img.name}: {e}")

total = 0
for o in bpy.context.scene.objects:
    if o.type == "MESH" and o.visible_get():
        faces = len(o.evaluated_get(bpy.context.evaluated_depsgraph_get()).data.polygons)
        total += faces
        d = o.dimensions
        print(f"MESH {o.name} faces={faces} size=({d.x:.3f}, {d.y:.3f}, {d.z:.3f})")
print(f"TOTAL faces={total}")

bpy.ops.export_scene.gltf(
    filepath=out,
    export_format="GLB",
    export_image_format="WEBP",
    export_image_quality=88,
    export_apply=True,
    export_yup=True,
    export_cameras=False,
    export_lights=False,
    use_visible=True,
)
print(f"EXPORTED {out}")
