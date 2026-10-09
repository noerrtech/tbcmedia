// Converts a TTF into three.js typeface JSON (for extruded TextGeometry), limited to the
// characters the 3D office needs. Usage: node scripts/make-typeface.mjs <in.ttf> <out.json>
import fs from "node:fs";
import opentype from "opentype.js";

const [input, output] = process.argv.slice(2);
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+.,%/—- ";
const font = opentype.parse(fs.readFileSync(input).buffer);
const scale = 1000 / font.unitsPerEm;
const r = (n) => Math.round(n * scale);

const glyphs = {};
for (const ch of chars) {
  const g = font.charToGlyph(ch);
  if (!g) continue;
  const o = [];
  for (const c of g.path.commands) {
    // three's FontLoader wants the end point first, then control points
    if (c.type === "M") o.push("m", r(c.x), r(c.y));
    else if (c.type === "L") o.push("l", r(c.x), r(c.y));
    else if (c.type === "Q") o.push("q", r(c.x), r(c.y), r(c.x1), r(c.y1));
    else if (c.type === "C") o.push("b", r(c.x), r(c.y), r(c.x1), r(c.y1), r(c.x2), r(c.y2));
  }
  const bb = g.getBoundingBox();
  glyphs[ch] = { ha: r(g.advanceWidth), x_min: r(bb.x1), x_max: r(bb.x2), o: o.join(" ") };
}

fs.writeFileSync(
  output,
  JSON.stringify({
    glyphs,
    familyName: font.names.fontFamily?.en ?? "font",
    ascender: r(font.ascender),
    descender: r(font.descender),
    underlinePosition: r(font.tables.post.underlinePosition),
    underlineThickness: r(font.tables.post.underlineThickness),
    boundingBox: { xMin: r(font.tables.head.xMin), yMin: r(font.tables.head.yMin), xMax: r(font.tables.head.xMax), yMax: r(font.tables.head.yMax) },
    resolution: 1000,
    original_font_information: { copyright: font.names.copyright?.en ?? "", license: font.names.license?.en ?? "SIL OFL 1.1" },
  }),
);
console.log(`${Object.keys(glyphs).length} glyphs → ${output}`);
