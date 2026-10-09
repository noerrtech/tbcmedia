import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Re-maps a flat geometry's UVs to world metres, so one texture set tiles at the same
 * physical scale on every wall. `vertical` runs the texture's horizontal grain up the wall.
 */
export function metricUVs<T extends THREE.BufferGeometry>(g: T, tile: number, vertical = true): T {
  const p = g.attributes.position;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / tile;
    const y = p.getY(i) / tile;
    uv[i * 2] = vertical ? y : x;
    uv[i * 2 + 1] = vertical ? x : y;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}

/**
 * Fluted (reeded) panelling: a row of half-round flutes, centred on the origin, facing +z.
 * Real geometry rather than a normal map, so grazing light catches every reed.
 */
export function flutedGeometry(
  width: number,
  height: number,
  { flute = 0.075, depth = 0.024, seg = 8, tile = 1.6 } = {},
) {
  const n = Math.max(1, Math.round(width / flute));
  const fw = width / n;
  const per = seg + 1;
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];

  for (let f = 0; f < n; f++) {
    const base = (pos.length / 3) | 0;
    for (let row = 0; row < 2; row++) {
      const y = row === 0 ? -height / 2 : height / 2;
      for (let j = 0; j < per; j++) {
        const s = (j / seg) * 2 - 1; // -1 … 1 across the flute
        const x = -width / 2 + f * fw + (j / seg) * fw;
        const z = depth * Math.sqrt(Math.max(0, 1 - s * s));
        // slope of the half-round, clamped so the edge normals don't go fully sideways
        const sc = Math.max(-0.97, Math.min(0.97, s));
        const dzdx = ((-depth * sc) / Math.sqrt(1 - sc * sc)) * (2 / fw);
        const len = Math.hypot(dzdx, 1);
        pos.push(x, y, z);
        nor.push(-dzdx / len, 0, 1 / len);
      }
    }
    for (let j = 0; j < seg; j++) {
      const a = base + j;
      const b = a + 1;
      const c = base + per + j;
      const d = c + 1;
      idx.push(a, b, d, a, d, c);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return metricUVs(g, tile);
}

/** An arched opening outline: straight sides, semicircular head. Base on y = 0. */
export function archShape(width: number, height: number) {
  const r = width / 2;
  const shoulder = height - r;
  const s = new THREE.Shape();
  s.moveTo(-r, 0);
  s.lineTo(-r, shoulder);
  s.absarc(0, shoulder, r, Math.PI, 0, true);
  s.lineTo(r, 0);
  s.lineTo(-r, 0);
  return s;
}

/** A brass frame around an arch: the outline minus the opening, extruded slightly. */
export function archFrameGeometry(width: number, height: number, band = 0.12, depth = 0.06) {
  const outer = archShape(width + band * 2, height + band);
  outer.holes.push(archShape(width, height));
  return new THREE.ExtrudeGeometry(outer, { depth, bevelEnabled: false, curveSegments: 48 });
}

let radial: THREE.CanvasTexture | null = null;
/** A soft white radial falloff, used for light pools and halos. */
export function radialTexture() {
  if (radial) return radial;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  radial = new THREE.CanvasTexture(c);
  radial.colorSpace = THREE.SRGBColorSpace;
  return radial;
}

/**
 * Extruded, bevelled lettering from a typeface JSON (see scripts/make-typeface.mjs),
 * with tracking — TextGeometry can't letter-space. Centred on x, baseline on y = 0.
 */
export function extrudedText(
  font: { data: { glyphs: Record<string, { ha: number }>; resolution: number }; generateShapes: (t: string, s: number) => THREE.Shape[] },
  text: string,
  { size = 1, depth = 0.08, tracking = 0, bevel = 0.012 } = {},
) {
  const parts: THREE.BufferGeometry[] = [];
  let x = 0;
  for (const ch of text) {
    const g = font.data.glyphs[ch];
    if (!g) continue;
    if (ch !== " ") {
      const geo = new THREE.ExtrudeGeometry(font.generateShapes(ch, size), {
        depth,
        curveSegments: 24,
        bevelEnabled: bevel > 0,
        bevelThickness: bevel,
        bevelSize: bevel * 0.7,
        bevelSegments: 4,
      });
      geo.translate(x, 0, 0);
      parts.push(geo);
    }
    x += (g.ha / font.data.resolution) * size + tracking * size;
  }
  const width = x - tracking * size;
  const merged = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  merged.translate(-width / 2, 0, 0);
  return merged;
}
