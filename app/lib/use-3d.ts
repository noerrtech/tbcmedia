import { useEffect, useState } from "react";

export type SceneMode = "pending" | "3d" | "classic";

/**
 * Whether this visitor gets the real-time 3D office or the lighter CSS one. Phones get the 3D too
 * (lighter files and renderer, see ~/lib/device); data-saver connections, machines without WebGL2
 * and very low-memory devices get the classic rooms — and anything too slow to build the world in
 * time falls back to them (office.tsx).
 */
export function use3D(): SceneMode {
  const [mode, setMode] = useState<SceneMode>("pending");
  useEffect(() => {
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    let webgl2 = false;
    try {
      webgl2 = Boolean(document.createElement("canvas").getContext("webgl2"));
    } catch {
      webgl2 = false;
    }
    setMode(webgl2 && !saveData && !(memory !== undefined && memory < 2) ? "3d" : "classic");
  }, []);
  return mode;
}
