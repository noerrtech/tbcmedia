import { Corridor, CorridorIntro, Curtain, WorkGallery, useMediaQuery } from "~/components/sections/Work";
import { ImpactWall } from "~/components/sections/Impact";
import { RoomFooter } from "~/components/office/RoomFooter";
import type { Route } from "./+types/office.work";

export const meta: Route.MetaFunction = () => [{ title: "The Work — The Brand Cappuccino" }];

export default function WorkRoom() {
  const desktop = useMediaQuery("(min-width: 768px)");
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
