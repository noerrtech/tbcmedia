#!/usr/bin/env node
/**
 * Builds public/assets/models/stage_curtain.glb from "Curtain Cortina 3.0 NEW" by RomanSn
 * (https://sketchfab.com/3d-models/curtain-cortina-30-new-23a77fa61ca0499cbf940aa0f33b06b4, CC BY 4.0).
 *
 * The source holds the same curtain twice, vertex for vertex: hanging closed, and gathered to one
 * side. This keeps one mesh with both shapes — the closed shape as POSITION/NORMAL and the gathered
 * shape as _OPEN_POSITION/_OPEN_NORMAL — so the office can slide between them in a shader with the
 * real folds. Skin, idle animations and the flat red texture are dropped (the colour is ours).
 *
 * Output space: x 0 (outer edge, where it gathers) … 1 (the centre edge), y 0 (hem) … 1 (top),
 * z the fold depth, all in units of the closed width.
 *
 *   node scripts/make-curtain.mjs path/to/curtain_cortina_3.0_new.glb
 */
import { readFileSync, writeFileSync } from "node:fs";

const src = process.argv[2];
const out = process.argv[3] ?? new URL("../public/assets/models/stage_curtain.glb", import.meta.url).pathname;
if (!src) throw new Error("usage: node scripts/make-curtain.mjs <source.glb> [out.glb]");

const glb = readFileSync(src);
const jsonLen = glb.readUInt32LE(12);
const gltf = JSON.parse(glb.subarray(20, 20 + jsonLen).toString());
const bin = glb.subarray(20 + jsonLen + 8);

const SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
function read(index) {
  const a = gltf.accessors[index];
  const v = gltf.bufferViews[a.bufferView];
  const n = SIZE[a.type];
  const base = (v.byteOffset ?? 0) + (a.byteOffset ?? 0);
  if (a.componentType === 5126) {
    const stride = v.byteStride ?? n * 4;
    const o = new Float32Array(a.count * n);
    for (let i = 0; i < a.count; i++) for (let k = 0; k < n; k++) o[i * n + k] = bin.readFloatLE(base + i * stride + k * 4);
    return o;
  }
  const o = new Uint32Array(a.count);
  for (let i = 0; i < a.count; i++) o[i] = a.componentType === 5125 ? bin.readUInt32LE(base + i * 4) : bin.readUInt16LE(base + i * 2);
  return o;
}

// the wide mesh hangs closed, the narrow one is gathered
const prims = gltf.meshes.map((m) => m.primitives[0]);
const width = (p) => gltf.accessors[p.attributes.POSITION].max[0] - gltf.accessors[p.attributes.POSITION].min[0];
const [closedP, openP] = width(prims[0]) > width(prims[1]) ? [prims[0], prims[1]] : [prims[1], prims[0]];

const cPos = read(closedP.attributes.POSITION), cNor = read(closedP.attributes.NORMAL), uv = read(closedP.attributes.TEXCOORD_0);
const oPos = read(openP.attributes.POSITION), oNor = read(openP.attributes.NORMAL);
const uvOpen = read(openP.attributes.TEXCOORD_0);
const count = cPos.length / 3;
if (oPos.length !== cPos.length || uvOpen.some((v, i) => Math.abs(v - uv[i]) > 1e-6)) throw new Error("the two curtains don't share topology");
const index = read(closedP.indices);

const range = (a, k) => {
  let lo = Infinity, hi = -Infinity;
  for (let i = k; i < a.length; i += 3) (lo = Math.min(lo, a[i])), (hi = Math.max(hi, a[i]));
  return [lo, hi];
};
const [cx0, cx1] = range(cPos, 0), [cy0, cy1] = range(cPos, 1), [ox0, ox1] = range(oPos, 0);
const W = cx1 - cx0, H = cy1 - cy0;

// keep the vertex order across the gather: if x runs the other way in the gathered copy, mirror it
let corr = 0;
for (let i = 0; i < count; i++) corr += (cPos[i * 3] - (cx0 + cx1) / 2) * (oPos[i * 3] - (ox0 + ox1) / 2);
const flip = corr < 0;

const P = new Float32Array(count * 3), N = new Float32Array(count * 3), OP = new Float32Array(count * 3), ON = new Float32Array(count * 3);
for (let i = 0; i < count; i++) {
  const j = i * 3;
  P[j] = (cPos[j] - cx0) / W;
  P[j + 1] = (cPos[j + 1] - cy0) / H;
  P[j + 2] = cPos[j + 2] / W;
  N.set([cNor[j], cNor[j + 1], cNor[j + 2]], j);
  OP[j] = (flip ? ox1 - oPos[j] : oPos[j] - ox0) / W;
  OP[j + 1] = (oPos[j + 1] - cy0) / H;
  OP[j + 2] = oPos[j + 2] / W;
  ON.set([flip ? -oNor[j] : oNor[j], oNor[j + 1], oNor[j + 2]], j);
}
const I = Uint16Array.from(index);

// quantize (KHR_mesh_quantization): every value here already sits in -1…1, so normalized integers
// carry it exactly enough (0.1 mm on the stage) at a fraction of the size — and need no node transform
const q16 = (src, n) => {
  const out = new Int16Array((src.length / n) * 4); // padded to 4 components: attribute strides are 4-byte aligned
  for (let i = 0; i < src.length / n; i++) for (let k = 0; k < n; k++) out[i * 4 + k] = Math.round(Math.max(-1, Math.min(1, src[i * n + k])) * 32767);
  return out;
};
const q8 = (src) => {
  const out = new Int8Array((src.length / 3) * 4);
  for (let i = 0; i < src.length / 3; i++) for (let k = 0; k < 3; k++) out[i * 4 + k] = Math.round(Math.max(-1, Math.min(1, src[i * 3 + k])) * 127);
  return out;
};
const u16 = (src) => Uint16Array.from(src, (v) => Math.round(Math.max(0, Math.min(1, v)) * 65535));

// ---- write the glb
const chunks = [];
const views = [];
const accessors = [];
let offset = 0;
const COMPONENT = (a) => (a instanceof Int8Array ? 5120 : a instanceof Int16Array ? 5122 : a instanceof Uint16Array ? 5123 : 5126);
function add(array, type, target, { stride, count, normalized, minmax } = {}) {
  const buf = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
  const pad = (4 - (buf.length % 4)) % 4;
  views.push({ buffer: 0, byteOffset: offset, byteLength: buf.length, target, ...(stride ? { byteStride: stride } : {}) });
  chunks.push(buf, Buffer.alloc(pad));
  offset += buf.length + pad;
  const acc = { bufferView: views.length - 1, componentType: COMPONENT(array), count: count ?? array.length / SIZE[type], type, ...(normalized ? { normalized: true } : {}) };
  if (minmax) Object.assign(acc, minmax);
  accessors.push(acc);
  return accessors.length - 1;
}
const qP = q16(P, 3);
const box = (a) => ({ min: [0, 1, 2].map((k) => Math.min(...a.filter((_, i) => i % 4 === k))), max: [0, 1, 2].map((k) => Math.max(...a.filter((_, i) => i % 4 === k))) });
const attributes = {
  POSITION: add(qP, "VEC3", 34962, { stride: 8, count, normalized: true, minmax: box(Array.from(qP)) }),
  NORMAL: add(q8(N), "VEC3", 34962, { stride: 4, count, normalized: true }),
  TEXCOORD_0: add(u16(uv), "VEC2", 34962, { normalized: true }),
  _OPEN_POSITION: add(q16(OP, 3), "VEC3", 34962, { stride: 8, count, normalized: true }),
  _OPEN_NORMAL: add(q8(ON), "VEC3", 34962, { stride: 4, count, normalized: true }),
};
const indices = add(I, "SCALAR", 34963);

const json = {
  asset: {
    version: "2.0",
    generator: "tbc scripts/make-curtain.mjs",
    extras: { ...gltf.asset.extras, note: "Closed and gathered shapes of one curtain; see scripts/make-curtain.mjs" },
  },
  extensionsUsed: ["KHR_mesh_quantization"],
  extensionsRequired: ["KHR_mesh_quantization"],
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ name: "curtain", mesh: 0 }],
  meshes: [{ name: "curtain", primitives: [{ attributes, indices }] }],
  buffers: [{ byteLength: offset }],
  bufferViews: views,
  accessors,
};
let js = Buffer.from(JSON.stringify(json));
js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)]);
const body = Buffer.concat(chunks);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + js.length + 8 + body.length, 8);
const chunk = (len, type) => {
  const b = Buffer.alloc(8);
  b.writeUInt32LE(len, 0);
  b.writeUInt32LE(type, 4);
  return b;
};
writeFileSync(out, Buffer.concat([header, chunk(js.length, 0x4e4f534a), js, chunk(body.length, 0x004e4942), body]));
console.log(`${out}: ${count} vertices, ${I.length / 3} triangles, ${(offset / 1e6).toFixed(2)} MB (gathered copy ${flip ? "mirrored" : "as is"}; closed ${W.toFixed(2)} × ${H.toFixed(2)})`);
