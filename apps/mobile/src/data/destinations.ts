import type { MiniApp } from "@seolin/contracts";

/** Keep list, detail, library and featured shortcuts on the same entry route. */
export function miniAppDestination(app: MiniApp) {
  if (app.id === "ox") return "/ox" as const;
  if (app.id === "timer") return "/tools/timer" as const;
  if (app.id === "teams") return "/tools/teams" as const;
  if (app.id === "tabata") return "/tools/tabata" as const;
  if (app.id === "lucky-draw") return "/tools/lucky-draw" as const;
  return { pathname: "/game/[id]" as const, params: { id: app.id } };
}
