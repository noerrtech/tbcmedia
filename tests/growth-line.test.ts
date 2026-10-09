import { describe, expect, it } from "vitest";
import { services } from "~/content/site";
import { line, rideAt, stopProgress } from "~/lib/growth-line";

describe("the TBC Growth Line", () => {
  it("has a departure stop, then one station per service, in order", () => {
    expect(line.stops.length).toBe(services.length + 1);
    expect(line.stops.slice(1).map((s) => s.no)).toEqual(services.map((s) => s.no));
  });

  it("starts at the departure stop and ends at the last station", () => {
    expect(rideAt(0).at).toBe(0);
    expect(rideAt(0).x).toBe(line.positions[0]);
    expect(rideAt(1).at).toBe(line.stops.length - 1);
    expect(rideAt(1).x).toBeCloseTo(line.positions[line.positions.length - 1]);
  });

  it("stands still while dwelling at a station", () => {
    for (let i = 0; i < line.stops.length; i++) {
      const p = stopProgress(i);
      const a = rideAt(Math.max(0, p - 0.005));
      const b = rideAt(Math.min(1, p + 0.005));
      expect(a.x).toBeCloseTo(line.positions[i], 6);
      expect(b.x).toBeCloseTo(line.positions[i], 6);
      expect(rideAt(p).at).toBe(i);
      expect(rideAt(p).stopped).toBe(true);
    }
  });

  it("only ever moves forward as you scroll down", () => {
    let last = -Infinity;
    for (let p = 0; p <= 1; p += 0.001) {
      const { x } = rideAt(p);
      expect(x).toBeGreaterThanOrEqual(last - 1e-9);
      last = x;
    }
  });

  it("picks up speed down the line: later gaps are longer", () => {
    const gaps = line.positions.slice(1).map((x, i) => x - line.positions[i]);
    for (let i = 1; i < gaps.length; i++) expect(gaps[i]).toBeGreaterThanOrEqual(gaps[i - 1]);
  });

  it("names the next station while travelling", () => {
    const mid = (stopProgress(1) + stopProgress(2)) / 2;
    const r = rideAt(mid);
    expect(r.stopped).toBe(false);
    expect(r.next).toBe(2);
  });
});
