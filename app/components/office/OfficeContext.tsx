import { createContext, useContext } from "react";
import type { SceneMode } from "~/lib/use-3d";

/** Whether the office is the live 3D world or the CSS rooms, and whether the world has loaded. */
export const OfficeContext = createContext<{ mode: SceneMode; ready: boolean }>({ mode: "classic", ready: true });

export const useOffice = () => useContext(OfficeContext);
