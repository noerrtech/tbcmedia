import { Corridor, CorridorIntro, Curtain, useMediaQuery } from "~/components/sections/Work";
import { CaseStudiesFlat, WorkIntro } from "~/components/sections/CaseStudies";
import { CorridorRoom } from "~/components/sections/CorridorRoom";
import { ImpactWall } from "~/components/sections/Impact";
import { RoomFooter } from "~/components/office/RoomFooter";
import { useOffice } from "~/components/office/OfficeContext";
import type { Route } from "./+types/office.work";

export const meta: Route.MetaFunction = () => [{ title: "The Work — The Brand Cappuccino" }];

export default function WorkRoom() {
  const { mode } = useOffice();

  const desktop = useMediaQuery("(min-width: 768px)");

  // the 3D office: the curtain, then the corridor in the world behind the page
  if (mode === "3d") return <CorridorRoom />;

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
        <>
          <WorkIntro />
          <CaseStudiesFlat />
        </>
      )}
      <RoomFooter />
    </>
  );
}
