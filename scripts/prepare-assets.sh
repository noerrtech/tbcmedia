#!/usr/bin/env bash
# Builds web working copies of the 3D office assets from the original downloads.
# Originals are never modified. Re-run any time. Working copies go to .assets-src/ (not deployed);
# the end of the script compresses them into public/assets (WebP textures in 2k/1k tiers, downsampled
# lighting, meshopt + WebP models) — see scripts/compress-assets.py.
#
#   SRC=~/Downloads bash scripts/prepare-assets.sh
#
# Needs: ffmpeg, sips (macOS), node, python3 with numpy + Pillow.
set -euo pipefail

SRC="${SRC:-$HOME/Downloads}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/assets"
WORK="$ROOT/.assets-src"
TEX="$WORK/textures"
HDRI="$WORK/hdri"
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
for name in smoked_walnut_veneer; do
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
for name in lythwood_lounge; do
  ffmpeg -v error -y -i "$SRC/${name}_4k.exr" -vf "scale=2048:1024:flags=lanczos" -frames:v 1 "$HDRI/${name}_2k.hdr"
done

# --- furniture & objects (Poly Haven .blend, CC0) -> .glb via Blender --------
BLENDER="${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}"
blend() { # <source folder name> <output name> [max texture size]
  "$BLENDER" -b "$SRC/$1.blend/$1.blend" --python "$ROOT/scripts/blend-to-glb.py" -- "$MODELS/$2.glb" "${3:-2048}" 2>&1 | grep -E "^(MESH|TOTAL|EXPORTED|IMAGE-SKIP)"
}
if [ -x "$BLENDER" ]; then
  blend ArmChair_01_4k armchair_classic
  blend modern_arm_chair_01_4k armchair_modern
  blend modern_ceiling_lamp_01_4k ceiling_lamp 1024
  blend brass_vase_02_4k brass_vase 1024
  blend potted_plant_01_4k potted_plant 2048
else
  echo "Blender not found at $BLENDER — skipping .blend models"
fi

# --- fonts (OFL) — latin subsets, self-hosted ------------------------------
# Manrope (headings, numbers) + DM Sans (text)
cp "$SRC"/manrope/variable/manrope-latin-wght-normal.woff2 "$FONTS/"
cp "$SRC"/manrope/static/manrope-latin-{500,700}-normal.woff "$FONTS/" # for 3D plaques/signs (troika can't read woff2)
cp node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-{normal,italic}.woff2 "$FONTS/"
cp "$SRC"/manrope/LICENSE "$FONTS/LICENSE-manrope.txt"
cp node_modules/@fontsource-variable/dm-sans/LICENSE "$FONTS/LICENSE-dm-sans.txt"
# extruded 3D lettering (419M+ and the lobby sign)
node scripts/make-typeface.mjs "$SRC"/manrope/static/manrope-latin-800-normal.woff "$FONTS/manrope-800.typeface.json"

# --- compress for the web --------------------------------------------------
python3 "$ROOT/scripts/compress-assets.py" "$WORK"
GT="npx -y @gltf-transform/cli@4.1.1"
for m in armchair_classic armchair_modern brass_vase ceiling_lamp potted_plant; do
  f="$MODELS/$m.glb"
  [ -f "$f" ] || continue
  if [ "$m" = potted_plant ]; then $GT weld "$f" "$f" && $GT simplify "$f" "$f" --ratio 0.35 --error 0.002; fi
  $GT resize "$f" "$f" --width 1024 --height 1024 && $GT webp "$f" "$f" --quality 85 && $GT meshopt "$f" "$f" --level medium
done

echo "Done."
du -sh "$OUT"/* "$FONTS"
