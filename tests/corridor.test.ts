import { describe, expect, it } from "vitest";
import { work } from "~/content/site";
import { END_WALL, H, HW, SCREEN, SCREENS, START, X0, caseAt, caseProgress, focusPose, walkAt } from "~/lib/corridor";

describe("the work corridor", () => {
  it("has each case study on both walls: title card left, story right", () => {
    expect(SCREENS.length).toBe(work.length * 2);
    for (const s of SCREENS) {
      expect(s.at[2]).toBeLessThan(START);
      expect(s.at[2]).toBeGreaterThan(END_WALL);
      expect(s.side === "left" ? s.at[0] < X0 : s.at[0] > X0).toBe(true);
    }
  });

  it("walks straight down the middle, only ever forward, and never turns", () => {
    let last = Infinity;
    for (let p = 0; p <= 1; p += 0.01) {
      const { pos, look } = walkAt(p);
      expect(pos[0]).toBe(X0);
      expect(look[0]).toBe(X0);
      expect(pos[2]).toBeLessThanOrEqual(last);
      last = pos[2];
    }
    expect(walkAt(1).pos[2]).toBeGreaterThan(END_WALL + 3); // stops short of the end wall
  });

  it("hangs every screen clear of its wall, edge to edge, angled or not", () => {
    for (const s of SCREENS) {
      const half = SCREEN.w / 2;
      // the screen's width runs along its local x: (cos rotY, -sin rotY) in world x, z
      const ends = [-half, half].map((t) => s.at[0] + Math.cos(s.rotY) * t);
      for (const x of ends) expect(Math.abs(x - X0)).toBeLessThan(HW - 0.05);
    }
  });

  it("stands every display upright, off the floor, with room above for its spotlight", () => {
    expect(SCREEN.h).toBeGreaterThan(SCREEN.w);
    expect(SCREEN.y - SCREEN.h / 2).toBeGreaterThan(0.5);
    expect(H - (SCREEN.y + SCREEN.h / 2)).toBeGreaterThan(0.6);
  });

  it("knows which case study you're passing", () => {
    for (let i = 0; i < work.length; i++) expect(caseAt(caseProgress(i))).toBe(i);
  });

  it("reads each screen from across the corridor, inside the walls, at a comfortable distance", () => {
    for (const s of SCREENS) {
      const { pos } = focusPose(s);
      expect(Math.abs(pos[0] - X0)).toBeLessThan(HW - 0.4);
      const d = Math.hypot(pos[0] - s.at[0], pos[2] - s.at[2]);
      expect(d).toBeGreaterThan(4);
      expect(d).toBeLessThan(6);
    }
  });
});
