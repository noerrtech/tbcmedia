#!/usr/bin/env python3
"""
Makes the 3D office's textures and lighting light enough for phones, without changing how they look.

  python3 scripts/compress-assets.py <source-dir>

<source-dir> holds the Poly Haven downloads (as scripts/prepare-assets.sh fetches them):
smoked_walnut_veneer_{diff.jpg,nor.png,rough.png,ao.png}, marble_01_{diff.jpg,nor.png,rough.png},
brass_{nor,rough}.png, lythwood_lounge_2k.hdr.

Writes to public/assets:
  textures/{2k,1k}/walnut_diff.webp      colour
  textures/{2k,1k}/walnut_nor.webp       normal
  textures/{2k,1k}/walnut_orm.webp       packed: R = ambient occlusion, G = roughness (how three.js reads them)
  textures/{2k,1k}/marble_{diff,nor,rough}.webp   the lobby floor
  textures/{2k,1k}/brass_{nor,rough}.webp
  hdri/lounge-{1k,512}.hdr               the environment light, downsampled
2k is for desktops, 1k for phones (app/components/three/assets.ts picks).
"""
import os
import sys

import numpy as np
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else "public/assets/textures"
OUT = "public/assets"


def save(img: Image.Image, path: str, size: int, quality: int):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.resize((size, size), Image.LANCZOS).save(path, "WEBP", quality=quality, method=6)
    print(f"{path}: {os.path.getsize(path) // 1024} KB")


def src(name: str):
    for d in (SRC, os.path.join(SRC, "textures"), os.path.join(SRC, "hdri")):
        p = os.path.join(d, name)
        if os.path.exists(p):
            return p
    raise SystemExit(f"missing {name} in {SRC}")


# ---- textures
diff = Image.open(src("smoked_walnut_veneer_diff.jpg")).convert("RGB")
nor = Image.open(src("smoked_walnut_veneer_nor.png")).convert("RGB")
rough = Image.open(src("smoked_walnut_veneer_rough.png")).convert("L")
ao = Image.open(src("smoked_walnut_veneer_ao.png")).convert("L")
orm = Image.merge("RGB", (ao, rough, Image.new("L", ao.size, 0)))
marble_diff = Image.open(src("marble_01_diff.jpg")).convert("RGB")
marble_nor = Image.open(src("marble_01_nor.png")).convert("RGB")
marble_rough = Image.open(src("marble_01_rough.png")).convert("L").convert("RGB")
brass_nor = Image.open(src("brass_nor.png")).convert("RGB")
brass_rough = Image.open(src("brass_rough.png")).convert("L").convert("RGB")

for tier, big, small in (("2k", 2048, 1024), ("1k", 1024, 512)):
    t = f"{OUT}/textures/{tier}"
    save(diff, f"{t}/walnut_diff.webp", big, 82)
    save(nor, f"{t}/walnut_nor.webp", big, 90)
    save(orm, f"{t}/walnut_orm.webp", big, 88)
    save(marble_diff, f"{t}/marble_diff.webp", big, 82)
    save(marble_nor, f"{t}/marble_nor.webp", big, 90)
    save(marble_rough, f"{t}/marble_rough.webp", big, 88)
    save(brass_nor, f"{t}/brass_nor.webp", small, 90)
    save(brass_rough, f"{t}/brass_rough.webp", small, 88)


# ---- the environment light (Radiance .hdr, RGBE)
def read_hdr(path: str) -> np.ndarray:
    data = open(path, "rb").read()
    end = data.index(b"\n\n") + 2
    line_end = data.index(b"\n", end)
    _, h, _, w = data[end:line_end].split()
    h, w = int(h), int(w)
    buf = data[line_end + 1 :]
    out = np.zeros((h, w, 4), np.uint8)
    pos = 0
    for y in range(h):
        if buf[pos] == 2 and buf[pos + 1] == 2:  # new-style run-length encoded scanline
            pos += 4
            for c in range(4):
                x = 0
                while x < w:
                    n = buf[pos]
                    pos += 1
                    if n > 128:
                        n -= 128
                        out[y, x : x + n, c] = buf[pos]
                        pos += 1
                    else:
                        out[y, x : x + n, c] = np.frombuffer(buf[pos : pos + n], np.uint8)
                        pos += n
                    x += n
        else:  # flat
            out[y] = np.frombuffer(buf[pos : pos + w * 4], np.uint8).reshape(w, 4)
            pos += w * 4
    e = out[..., 3].astype(np.float32)
    scale = np.where(e > 0, np.ldexp(1.0, (e - 136).astype(np.int32)), 0)
    return out[..., :3].astype(np.float32) * scale[..., None]


def write_hdr(path: str, rgb: np.ndarray):
    h, w, _ = rgb.shape
    m = rgb.max(axis=2)
    mant, exp = np.frexp(m)
    scale = np.where(m > 1e-32, mant * 256.0 / np.maximum(m, 1e-32), 0)
    rgbe = np.zeros((h, w, 4), np.uint8)
    rgbe[..., :3] = np.clip(rgb * scale[..., None], 0, 255).astype(np.uint8)
    rgbe[..., 3] = np.where(m > 1e-32, exp + 128, 0).astype(np.uint8)
    with open(path, "wb") as f:
        f.write(b"#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n" + f"-Y {h} +X {w}\n".encode())
        f.write(rgbe.tobytes())
    print(f"{path}: {os.path.getsize(path) // 1024} KB")


hdr = read_hdr(src("lythwood_lounge_2k.hdr"))
os.makedirs(f"{OUT}/hdri", exist_ok=True)
for name, factor in (("lounge-1k.hdr", 2), ("lounge-512.hdr", 4)):
    h, w, _ = hdr.shape
    small = hdr[: h - h % factor, : w - w % factor].reshape(h // factor, factor, w // factor, factor, 3).mean(axis=(1, 3))
    write_hdr(f"{OUT}/hdri/{name}", small)
