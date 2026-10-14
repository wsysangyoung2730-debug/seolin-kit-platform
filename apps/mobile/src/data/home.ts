import type { MiniApp, MiniAppId } from "@seolin/contracts";
export const homeContent = {
  eyebrow: "수업에 필요한 도구, 한곳에",
  heading: "오늘은 어떤 수업을 할까요?",
  featuredId: "ox" as MiniAppId,
  featuredDescription: "문제를 듣고 움직이는\n즐거운 퀴즈 수업",
};
/** A hidden/unavailable promotion must never lead to a disabled game. */
export function getFeaturedApp(
  items: MiniApp[],
  preferredId: string = homeContent.featuredId,
) {
  return (
    items.find((app) => app.id === preferredId && app.status === "available") ??
    items.find((app) => app.status === "available")
  );
}
