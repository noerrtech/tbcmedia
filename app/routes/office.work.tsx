import { Curtain } from "~/components/sections/Work";
import { CaseStudiesFlat, WorkIntro } from "~/components/sections/CaseStudies";
import { MuseumRoom } from "~/components/sections/MuseumRoom";
import { ImpactWall } from "~/components/sections/Impact";
import { RoomFooter } from "~/components/office/RoomFooter";
import { useOffice } from "~/components/office/OfficeContext";
import type { Route } from "./+types/office.work";

export const meta: Route.MetaFunction = () => [{ title: "The Work — The Brand Cappuccino" }];

export default function WorkRoom() {
  const { mode } = useOffice();

  // the 3D office: the curtain, then the Museum of Impact, in the world behind the page
  if (mode === "3d") return <MuseumRoom />;

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
