import { Curtain } from "~/components/sections/Work";
import { CaseStudiesFlat, WorkIntro } from "~/components/sections/CaseStudies";
import { WorkRoom3D } from "~/components/sections/WorkRoom3D";
import { ImpactWall } from "~/components/sections/Impact";
import { RoomFooter } from "~/components/office/RoomFooter";
import { ScrimZone } from "~/components/office/ScrimZone";
import { useOffice } from "~/components/office/OfficeContext";
import type { Route } from "./+types/office.work";

export const meta: Route.MetaFunction = () => [{ title: "The Work — The Brand Cappuccino" }];

export default function WorkRoom() {
  const { mode } = useOffice();

  // the 3D office: the curtain and the acts play on the stage behind the page
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
      <WorkIntro />
      <CaseStudiesFlat />
      <RoomFooter />
    </>
  );
}
