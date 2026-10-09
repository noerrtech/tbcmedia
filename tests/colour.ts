/** Small colour helpers for the design tests: parse, composite, WCAG contrast. */
export type RGB = [number, number, number];
export type RGBA = [number, number, number, number];

export function parseColour(input: string): RGBA | null {
  const s = input.trim();
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).concat(1) as RGBA;
  }
  // rgb(1 2 3 / 0.5), rgb(1, 2, 3), rgba(1, 2, 3, 0.5)
  const fn = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[/,]\s*([\d.]+%?))?\s*\)$/i);
  if (fn) {
    const a = fn[4] === undefined ? 1 : fn[4].endsWith("%") ? parseFloat(fn[4]) / 100 : parseFloat(fn[4]);
    return [Number(fn[1]), Number(fn[2]), Number(fn[3]), a];
  }
  if (s === "transparent") return [0, 0, 0, 0];
  return null;
}

/** `top` drawn over an opaque `base`. */
export function composite(top: RGBA, base: RGB): RGB {
  const a = top[3];
  return [0, 1, 2].map((i) => Math.round(top[i] * a + base[i] * (1 - a))) as RGB;
}

function luminance([r, g, b]: RGB) {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrast(a: RGB, b: RGB) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

export const sameRGB = (a: RGBA | RGB, b: RGBA | RGB) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
