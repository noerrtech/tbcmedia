import { useEffect, useMemo } from "react";
import * as THREE from "three";

/**
 * A texture drawn with the 2D canvas — screens, cards. Redrawn once the site fonts have
 * loaded, so the type is Manrope / DM Sans rather than a fallback.
 */
export function useCanvasTexture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w = 1024, h = 576, key = "") {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, key]);

  useEffect(() => {
    const c = texture.image as HTMLCanvasElement;
    const paint = () => {
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, w, h);
      draw(ctx, w, h);
      texture.needsUpdate = true;
    };
    paint();
    let alive = true;
    Promise.all([
      document.fonts.load('700 120px "Manrope"'),
      document.fonts.load('italic 400 60px "DM Sans"'),
      document.fonts.load('600 30px "Manrope"'),
    ])
      .then(() => alive && paint())
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture]);

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

/** Letter-spaced uppercase line (canvas letterSpacing support varies, so space by hand). */
export function trackedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, tracking: number, align: "left" | "center" = "left") {
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1);
  let cx = align === "center" ? x - total / 2 : x;
  const prev = ctx.textAlign;
  ctx.textAlign = "left";
  chars.forEach((ch, i) => {
    ctx.fillText(ch, cx, y);
    cx += widths[i] + tracking;
  });
  ctx.textAlign = prev;
}
