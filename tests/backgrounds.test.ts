/**
 * Background gradients: the rules they must follow to be allowed on the site.
 *  1. They live only in the marked block in app.css, as `.bg-*` classes — backgrounds, nothing else.
 *  2. Every colour in them is a Mughal Noir colour (alpha variants allowed).
 *  3. At their lightest point, Text and Muted text still read at 4.5 : 1 or better. (Small captions are
 *     checked where they actually sit, on the rendered page: tests/e2e/background-contrast.test.ts.)
 *  4. Nothing on the site uses a gradient on text or on a button.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { composite, contrast, parseColour, sameRGB, type RGB } from "./colour";

const css = readFileSync(join(__dirname, "../app/app.css"), "utf8");

/** --color-* tokens from the @theme block */
const theme = Object.fromEntries(
  [...css.matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]{3,6})\s*;/g)].map((m) => [m[1], m[2]]),
);
const PALETTE: Record<string, string> = {
  background: theme.ink,
  surface: theme.umber,
  line: theme.line,
  text: theme.ivory,
  muted: theme.mist,
  caption: theme.smoke,
  secondary: theme.champagne,
  accent: theme.gold,
  between: theme.coal, // the step between Background and Surface
};
const rgb = (hex: string) => parseColour(hex)!.slice(0, 3) as RGB;

const START = "/* @background-gradients:start */";
const END = "/* @background-gradients:end */";
const block = css.includes(START) && css.includes(END) ? css.slice(css.indexOf(START), css.indexOf(END)) : "";
const rules = [...block.matchAll(/(\.bg-[a-z-]+)\s*\{([^}]*)\}/g)].map((m) => ({ name: m[1], body: m[2] }));

/** Every colour mentioned in a rule, with var(--color-*) resolved. */
function coloursIn(body: string) {
  const resolved = body.replace(/var\(--color-([a-z-]+)\)/g, (_, n) => theme[n] ?? `UNKNOWN(${n})`);
  const found = resolved.match(/#[0-9a-fA-F]{3,6}\b|rgba?\([^)]*\)|UNKNOWN\([a-z-]+\)/g) ?? [];
  return found;
}

/** The solid colour the gradient layers sit on (the last solid in the rule), else Background. */
function baseOf(body: string): RGB {
  const solids = coloursIn(body)
    .map(parseColour)
    .filter((c): c is NonNullable<typeof c> => !!c && c[3] === 1);
  return solids.length ? (solids[solids.length - 1].slice(0, 3) as RGB) : rgb(PALETTE.background);
}

describe("background gradients", () => {
  it("are defined in the marked block in app.css", () => {
    expect(block, "add the /* @background-gradients:start */ … end block to app.css").not.toBe("");
    expect(rules.length).toBeGreaterThan(0);
  });

  it("use only Mughal Noir colours", () => {
    const palette = Object.values(PALETTE).map(rgb);
    for (const r of rules) {
      for (const c of coloursIn(r.body)) {
        const parsed = parseColour(c);
        expect(parsed, `${r.name}: unrecognised colour ${c}`).not.toBeNull();
        if (parsed![3] === 0) continue; // transparent
        expect(palette.some((p) => sameRGB(p, parsed!)), `${r.name}: ${c} is not a palette colour`).toBe(true);
      }
    }
  });

  it("keep text and muted text readable at their lightest point", () => {
    for (const r of rules) {
      const base = baseOf(r.body);
      const stops = coloursIn(r.body)
        .map(parseColour)
        .filter((c): c is NonNullable<typeof c> => !!c && c[3] > 0)
        .map((c) => composite(c, base));
      for (const stop of stops) {
        for (const [name, hex] of [["text", PALETTE.text], ["muted", PALETTE.muted]] as const) {
          const ratio = contrast(rgb(hex), stop);
          expect(ratio, `${r.name}: ${name} on ${stop} is ${ratio.toFixed(2)} : 1`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });
});

describe("gradients stay in backgrounds", () => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(tsx|ts|css)$/.test(f)) files.push(p);
    }
  };
  walk(join(__dirname, "../app"));

  it("no gradient text anywhere", () => {
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      expect(/background-clip:\s*text|bg-clip-text/.test(src), `${f} clips a background to text`).toBe(false);
    }
  });

  it("no gradient buttons", () => {
    const buttonRules = [...css.matchAll(/\.btn[a-z-]*[^{]*\{([^}]*)\}/g)].map((m) => m[1]);
    for (const body of buttonRules) expect(body).not.toMatch(/gradient\(/);
  });
});
