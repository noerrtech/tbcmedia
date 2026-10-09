import { describe, expect, it } from "vitest";
import { work } from "~/content/site";
import { actAt, actProgress, ACTS, fly } from "~/lib/acts";

describe("the Work room's acts", () => {
  it("has one act per case study", () => expect(ACTS).toBe(work.length));

  it("shows act i while its scroll span plays, and jumps land inside it", () => {
    for (let i = 0; i < ACTS; i++) {
      expect(actAt(actProgress(i))).toBe(i);
      const f = fly(i, actProgress(i) * ACTS);
      expect(f.up).toBe(0); // its screen hangs in place
    }
    expect(actAt(0)).toBe(0);
    expect(actAt(1)).toBe(ACTS - 1);
  });

  it("starts with the first screen already in, and never flies the last one out", () => {
    expect(fly(0, 0).up).toBe(0);
    expect(fly(ACTS - 1, ACTS).up).toBe(0);
  });

  it("has the next screen in place behind before the current one lifts away: the stage is never bare", () => {
    for (let i = 0; i < ACTS - 1; i++) {
      for (let p = i + 0.5; p <= i + 1.5; p += 0.01) {
        const shown = Math.min(fly(i, p).up, fly(i + 1, p).up);
        expect(shown).toBeLessThan(0.02);
      }
    }
  });

  it("moves smoothly: no jumps between neighbouring scroll positions", () => {
    for (let i = 0; i < ACTS; i++) {
      let last = fly(i, 0).up;
      for (let p = 0.005; p <= ACTS; p += 0.005) {
        const now = fly(i, p).up;
        expect(Math.abs(now - last)).toBeLessThan(0.05);
        last = now;
      }
    }
  });
});
