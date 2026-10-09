#!/usr/bin/env bash
# Builds web working copies of the 3D office assets from the original downloads.
# Originals are never modified. Re-run any time; final compression/resizing is a later pass.
#
#   SRC=~/Downloads bash scripts/prepare-assets.sh
#
# Needs: ffmpeg, sips (macOS), npx (for gltfpack).
set -euo pipefail

SRC="${SRC:-$HOME/Downloads}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/assets"
TEX="$OUT/textures"
HDRI="$OUT/hdri"
MODELS="$OUT/models"
FONTS="$ROOT/public/fonts"
SIZE="${SIZE:-2048}"

mkdir -p "$TEX" "$HDRI" "$MODELS" "$FONTS"

# --- helpers ---------------------------------------------------------------
# colour map (sRGB) -> jpg
color() { sips -s format jpeg -s formatOptions 88 -Z "$SIZE" "$1" --out "$2" >/dev/null; }
# data map (linear: normal / roughness / ao / metal) -> png, values untouched
data() {
  # ffmpeg can't decode every EXR compression; fall back to macOS ImageIO.
  if ! ffmpeg -v error -xerror -y -i "$1" -vf "scale=${SIZE}:${SIZE}:flags=lanczos,format=rgb24" -frames:v 1 "$2" 2>/dev/null; then
    sips -s format png -Z "$SIZE" "$1" --out "$2" >/dev/null 2>&1
  fi
}
# Roughness derived from the colour map: darker grain reads slightly rougher.
# Used when the source roughness EXR is DWA-compressed (nothing local decodes it).
rough_from_diff() {
  ffmpeg -v error -y -i "$1" -vf "scale=${SIZE}:${SIZE}:flags=lanczos,format=gray,negate,curves=all='0/0.42 1/0.78',format=rgb24" -frames:v 1 "$2"
}

# --- surfaces (Poly Haven, CC0) --------------------------------------------
for name in smoked_walnut_veneer american_walnut_veneer; do
  d="$SRC/${name}_4k.blend/textures"
  color "$d/${name}_diff_4k.jpg" "$TEX/${name}_diff.jpg"
  data  "$d/${name}_nor_gl_4k.exr" "$TEX/${name}_nor.png"
  data  "$d/${name}_rough_4k.exr" "$TEX/${name}_rough.png" || true
  if [ ! -s "$TEX/${name}_rough.png" ] || [ "$(stat -f%z "$TEX/${name}_rough.png")" -lt 100000 ]; then
    rough_from_diff "$d/${name}_diff_4k.jpg" "$TEX/${name}_rough.png"
  fi
  data  "$d/${name}_ao_4k.jpg" "$TEX/${name}_ao.png"
done

d="$SRC/marble_01_4k.blend/textures"
color "$d/marble_01_diff_4k.jpg" "$TEX/marble_01_diff.jpg"
data  "$d/marble_01_nor_gl_4k.exr" "$TEX/marble_01_nor.png"
data  "$d/marble_01_rough_4k.jpg" "$TEX/marble_01_rough.png"

# Worn brass (TextureCan) — only its roughness/normal break-up is used; colour is set in code.
d="$SRC/metal_0065_1k_znD6Ra"
SIZE=1024 data "$d/metal_0065_roughness_1k.jpg" "$TEX/brass_rough.png"
SIZE=1024 data "$d/metal_0065_normal_opengl_1k.png" "$TEX/brass_nor.png"

# --- lighting (Poly Haven HDRIs, CC0) ---------------------------------------
for name in lythwood_lounge entrance_hall hotel_room; do
  ffmpeg -v error -y -i "$SRC/${name}_4k.exr" -vf "scale=2048:1024:flags=lanczos" -frames:v 1 "$HDRI/${name}_2k.hdr"
done

# --- museum objects (Smithsonian Open Access, CC0) --------------------------
# gltfpack: OBJ -> geometry-only GLB, simplified. -si is the fraction of triangles kept.
# Textures ship as separate files (loaded like every other surface), not embedded.
pack() {
  local dir="$1" obj="$2" out="$3" keep="$4"
  local tmp; tmp="$(mktemp -d)"
  cp "$dir"/*.obj "$tmp/"
  for m in "$dir"/*.mtl; do grep -v "map_" "$m" > "$tmp/$(basename "$m")"; done
  npx --yes gltfpack@1.3.0 -i "$tmp/$obj" -o "$out" -si "$keep" -sa -noq >/dev/null
  rm -rf "$tmp"
}
pack "$SRC/f1980_194-full_resolution-obj" "f1980_194-full_resolution-obj.obj" "$MODELS/porcelain_vase.glb" 0.06
color "$SRC/f1980_194-full_resolution-obj/f1980_194-full_resolution-obj.png" "$TEX/porcelain_vase_diff.jpg"
pack "$SRC/saam_1983_95_181-waterson-polish-2026-150k-4096-obj_std" "saam_1983_95_181-waterson-polish-2026-150k.obj" "$MODELS/marble_sculpture.glb" 0.4
d="$SRC/saam_1983_95_181-waterson-polish-2026-150k-4096-obj_std"
color "$d/saam_1983_95_181-waterson-polish-2026-150k-4096-diffuse.jpg" "$TEX/marble_sculpture_diff.jpg"
# the scan's baked detail maps aren't referenced by its .mtl — ship them alongside
data "$d/saam_1983_95_181-waterson-polish-2026-150k-4096-normals.jpg" "$TEX/marble_sculpture_nor.png"
data "$d/saam_1983_95_181-waterson-polish-2026-150k-4096-occlusion.jpg" "$TEX/marble_sculpture_ao.png"

# --- furniture & objects (Poly Haven .blend, CC0) -> .glb via Blender --------
BLENDER="${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}"
blend() { # <source folder name> <output name> [max texture size]
  "$BLENDER" -b "$SRC/$1.blend/$1.blend" --python "$ROOT/scripts/blend-to-glb.py" -- "$MODELS/$2.glb" "${3:-2048}" 2>&1 | grep -E "^(MESH|TOTAL|EXPORTED|IMAGE-SKIP)"
}
if [ -x "$BLENDER" ]; then
  blend ArmChair_01_4k armchair_classic
  blend modern_arm_chair_01_4k armchair_modern
  blend modern_ceiling_lamp_01_4k ceiling_lamp 1024
  blend book_encyclopedia_set_01_4k books 1024
  blend brass_candleholders_4k candleholders 1024
  blend brass_vase_02_4k brass_vase 1024
  blend ceramic_vase_01_4k ceramic_vase 1024
  blend potted_plant_01_4k potted_plant 2048
else
  echo "Blender not found at $BLENDER — skipping .blend models"
fi

# --- fonts (OFL) — latin subsets, self-hosted ------------------------------
cp "$SRC"/cormorant-garamond/static/cormorant-garamond-latin-{300,400,500,600}-normal.woff2 "$FONTS/"
cp "$SRC"/cormorant-garamond/static/cormorant-garamond-latin-{300,400}-italic.woff2 "$FONTS/"
cp "$SRC"/cormorant-garamond/static/cormorant-garamond-latin-300-normal.woff "$FONTS/" # for 3D signage (troika can't read woff2)
cp "$SRC"/manrope/variable/manrope-latin-wght-normal.woff2 "$FONTS/"
cp "$SRC"/manrope/static/manrope-latin-500-normal.woff "$FONTS/" # for 3D plaques
cp "$SRC"/pinyon-script/static/pinyon-script-latin-400-normal.woff2 "$FONTS/"
cp "$SRC"/cormorant-garamond/LICENSE "$FONTS/LICENSE-cormorant-garamond.txt"
cp "$SRC"/manrope/LICENSE "$FONTS/LICENSE-manrope.txt"
cp "$SRC"/pinyon-script/LICENSE "$FONTS/LICENSE-pinyon-script.txt"

echo "Done."
du -sh "$TEX" "$HDRI" "$MODELS" "$FONTS"
