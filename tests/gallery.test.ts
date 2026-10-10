import { describe, expect, it } from "vitest";
import { work } from "~/content/site";
import { FRAMES, galleryAt, stopProgress } from "~/lib/gallery";

describe("the hall of work", () => {
  it("has a stop at every case study, then the end wall", () => {
    expect(FRAMES).toBe(work.length);
    for (let i = 0; i <= FRAMES; i++) {
      const g = galleryAt(stopProgress(i));
      expect(g.at).toBe(i);
      expect(g.facing).toBeCloseTo(1, 5); // standing at it, facing it
    }
  });

  it("only ever walks forward", () => {
    let last = Infinity;
    for (let p = 0; p <= 1; p += 0.001) {
      const { walk } = galleryAt(p);
      expect(walk).toBeLessThanOrEqual(last + 1e-9); // walk = metres in, as a negative z offset
      last = walk;
    }
  });

  it("faces down the hall while walking between pieces, and shows no case study then", () => {
    for (let i = 0; i < FRAMES; i++) {
      const mid = (stopProgress(i) + stopProgress(i + 1)) / 2;
      const g = galleryAt(mid);
      expect(g.facing).toBeLessThan(0.05);
      expect(g.at).toBe(-1);
    }
  });

  it("turns smoothly: no jumps in where you're looking (a turn spans ~3% of the scroll)", () => {
    let last = galleryAt(0).facing;
    for (let p = 0.001; p <= 1; p += 0.001) {
      const f = galleryAt(p).facing;
      expect(Math.abs(f - last)).toBeLessThan(0.045);
      last = f;
    }
  });

  it("starts at the door, facing down the hall", () => {
    const g = galleryAt(0);
    expect(g.walk).toBe(0);
    expect(g.facing).toBe(0);
  });
});
