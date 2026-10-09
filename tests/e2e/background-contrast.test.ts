/**
 * Rendered check for the background gradients: on the real page, every piece of text inside a
 * gradient section must read at 4.5 : 1 against the lightest background pixel behind it.
 *
 * Runs against a served build:  npm run build, serve build/client, then
 *   E2E_URL=http://localhost:4173 npx vitest run tests/e2e
 * (skipped when E2E_URL isn't set).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { composite, contrast, parseColour, type RGB } from "../colour";

const URL = process.env.E2E_URL;
const css = readFileSync(join(__dirname, "../../app/app.css"), "utf8");
const block = css.slice(css.indexOf("/* @background-gradients:start */"), css.indexOf("/* @background-gradients:end */"));
const gradientClasses = [...block.matchAll(/\.(bg-[a-z-]+)\s*\{/g)].map((m) => m[1]);

type Box = { x: number; y: number; w: number; h: number };

/** For each box (in screenshot pixels), the lightest pixel of the PNG inside it — computed in the browser. */
async function lightestIn(browser: Browser, png: Buffer, boxes: Box[]): Promise<[number, number, number][]> {
  const page = await browser.newPage();
  const out = await page.evaluate(
    async ({ b64, boxes }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      return boxes.map((b) => {
        const x = Math.max(0, Math.floor(b.x)), y = Math.max(0, Math.floor(b.y));
        const w = Math.max(1, Math.min(img.width - x, Math.ceil(b.w))), h = Math.max(1, Math.min(img.height - y, Math.ceil(b.h)));
        const d = ctx.getImageData(x, y, w, h).data;
        let best: [number, number, number] = [0, 0, 0];
        let bestL = -1;
        for (let i = 0; i < d.length; i += 4) {
          const l = d[i] * 0.2126 + d[i + 1] * 0.7152 + d[i + 2] * 0.0722;
          if (l > bestL) (bestL = l), (best = [d[i], d[i + 1], d[i + 2]]);
        }
        return best;
      });
    },
    { b64: png.toString("base64"), boxes },
  );
  await page.close();
  return out;
}

describe.skipIf(!URL)("background gradients on the rendered page", () => {
  let browser: Browser;
  beforeAll(async () => {
    browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  });
  afterAll(async () => browser?.close());

  for (const route of ["/"]) {
    it(`text over gradients on ${route} reads at 4.5 : 1 or better`, async () => {
      expect(gradientClasses.length, "no .bg-* gradient classes in app.css yet").toBeGreaterThan(0);
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(URL + route, { waitUntil: "load" });
      // scroll the whole page so every section has animated in, then come back to the top
      const height = await page.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < height; y += 400) {
        await page.evaluate((v) => window.scrollTo(0, v), y);
        await page.waitForTimeout(60);
      }
      await page.waitForTimeout(2500);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);

      // the text inside gradient sections, with its colour as drawn, grouped by section
      const sections = await page.evaluate((classes) => {
        // any CSS colour (oklab, color(srgb …), rgb) → "rgb(r g b / a)", by painting one pixel
        const cv = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
        const toRGB = (css: string) => {
          cv.clearRect(0, 0, 1, 1);
          cv.fillStyle = css;
          cv.fillRect(0, 0, 1, 1);
          const [r, g, b, a] = cv.getImageData(0, 0, 1, 1).data;
          return `rgb(${r} ${g} ${b} / ${a / 255})`;
        };
        const sel = classes.map((c) => `.${c}`).join(",");
        return [...document.querySelectorAll<HTMLElement>(sel)].map((s) => {
          const sr = s.getBoundingClientRect();
          const box = { x: sr.x + scrollX, y: sr.y + scrollY, w: sr.width, h: sr.height };
          const items: { text: string; color: string; opacity: number; box: { x: number; y: number; w: number; h: number } }[] = [];
          const walker = document.createTreeWalker(s, NodeFilter.SHOW_TEXT);
          for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            const el = n.parentElement!;
            const t = n.textContent!.trim();
            if (!t || el.closest("[aria-hidden='true'], .sr-only, button, .btn, .btn-cta")) continue;
            const range = document.createRange();
            range.selectNodeContents(n);
            const r = range.getBoundingClientRect();
            if (r.width < 4 || r.height < 4) continue;
            let opacity = 1;
            for (let e: HTMLElement | null = el; e; e = e.parentElement) opacity *= Number(getComputedStyle(e).opacity);
            items.push({ text: t.slice(0, 40), color: toRGB(getComputedStyle(el).color), opacity, box: { x: r.x + scrollX - box.x, y: r.y + scrollY - box.y, w: r.width, h: r.height } });
          }
          return { box, items };
        });
      }, gradientClasses);

      expect(sections.length, "no section on this page uses a background gradient").toBeGreaterThan(0);

      // photograph the backgrounds alone: hide all text, then shoot one section at a time
      await page.addStyleTag({ content: "* { color: transparent !important; text-shadow: none !important; -webkit-text-stroke: 0 !important; } svg, img, video, canvas { visibility: hidden !important; }" });
      await page.waitForTimeout(200);

      const failures: string[] = [];
      for (const sec of sections) {
        if (!sec.items.length) continue;
        const png = await page.screenshot({ fullPage: true, clip: { x: sec.box.x, y: sec.box.y, width: sec.box.w, height: Math.min(sec.box.h, 4000) } });
        const bgs = await lightestIn(browser, png, sec.items.map((i) => i.box));
        sec.items.forEach((it, k) => {
          const worst = bgs[k] as RGB;
          const c = parseColour(it.color)!;
          const text = composite([c[0], c[1], c[2], c[3] * it.opacity], worst);
          const ratio = contrast(text, worst);
          if (ratio < 4.5) failures.push(`"${it.text}" ${ratio.toFixed(2)} : 1 on rgb(${worst.join(" ")})`);
        });
      }
      await page.close();
      expect(failures, failures.join("\n")).toEqual([]);
    }, 120_000);
  }
});
