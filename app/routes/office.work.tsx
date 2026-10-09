import { Corridor, CorridorIntro, Curtain, WorkGallery, useMediaQuery } from "~/components/sections/Work";
import { WorkRoom3D } from "~/components/sections/WorkRoom3D";
import { ImpactWall } from "~/components/sections/Impact";
import { RoomFooter } from "~/components/office/RoomFooter";
import { ScrimZone } from "~/components/office/ScrimZone";
import { useOffice } from "~/components/office/OfficeContext";
import type { Route } from "./+types/office.work";

export const meta: Route.MetaFunction = () => [{ title: "The Work — The Brand Cappuccino" }];

export default function WorkRoom() {
  const desktop = useMediaQuery("(min-width: 768px)");
  const { mode } = useOffice();

  // the 3D office: the curtain and corridor are real, in the world behind the page
  if (mode === "3d") {
    return (
      <>
        <WorkRoom3D />
        <ScrimZone value={0.9}>
          <RoomFooter />
        </ScrimZone>
      </>
    );
  }

  return (
    <>
      <Curtain />
      <section className="py-32"><ImpactWall /></section>
      {desktop ? (
        <>
          <CorridorIntro />
          <Corridor />
        </>
      ) : (
        <WorkGallery />
      )}
      <RoomFooter />
    </>
  );
}
