import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  ...prefix("tbc", [
    layout("routes/office.tsx", [
      index("routes/office.reception.tsx"),
      route("founder", "routes/office.founder.tsx"),
      route("story", "routes/office.story.tsx"),
      route("services", "routes/office.services.tsx"),
      route("work", "routes/office.work.tsx"),
      route("jbn", "routes/office.jbn.tsx"),
      route("next", "routes/office.next.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
