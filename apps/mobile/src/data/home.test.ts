import { expect, it } from "vitest";
import { catalog } from "./catalog";
import { getFeaturedApp } from "./home";
it("features the actual available miniapp and falls back when a promotion is unavailable", () => {
  expect(getFeaturedApp(catalog)?.id).toBe("ox");
  const hidden = catalog.map((app) =>
    app.id === "ox" ? { ...app, status: "coming-soon" as const } : app,
  );
  expect(getFeaturedApp(hidden)?.id).toBe("breaking");
  expect(getFeaturedApp([])).toBeUndefined();
  expect(getFeaturedApp(catalog, "removed")?.status).toBe("available");
});
