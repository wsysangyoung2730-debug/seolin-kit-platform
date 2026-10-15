import { describe, expect, it } from "vitest";
import { catalog, decodeLibrary, filterCatalog } from "./catalog";
import { miniAppDestination } from "./destinations";

describe("classroom tool discovery", () => {
  it("opens available native tools outside the bundled HTML game runner", () => {
    const tools = filterCatalog("", "classroom");
    expect(tools.some((app) => app.id === "timer")).toBe(true);
    expect(tools.some((app) => app.id === "tabata")).toBe(true);
    for (const app of tools) {
      expect(app.status).toBe("available");
      expect(app.runtime).toBe("native");
      expect(miniAppDestination(app)).toBe(`/tools/${app.id}`);
      expect(decodeLibrary(JSON.stringify([app.id]))).toEqual([app.id]);
    }
  });
  it("keeps the original game entry points", () => {
    for (const app of catalog.filter((item) => item.category !== "classroom")) {
      expect(miniAppDestination(app)).toEqual(
        app.id === "ox"
          ? "/ox"
          : { pathname: "/game/[id]", params: { id: app.id } },
      );
    }
  });
});
