import { useEffect, useState } from "react";

export type SceneMode = "pending" | "3d" | "classic";

/**
 * Whether this visitor gets the real-time 3D office or the lighter CSS one.
 * Phones, data-saver connections and machines without WebGL2 get the classic rooms.
 */
export function use3D(): SceneMode {
  const [mode, setMode] = useState<SceneMode>("pending");
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 768px)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    let webgl2 = false;
    try {
      webgl2 = Boolean(document.createElement("canvas").getContext("webgl2"));
    } catch {
      webgl2 = false;
    }
    setMode(wide && webgl2 && !saveData ? "3d" : "classic");
  }, []);
  return mode;
}
